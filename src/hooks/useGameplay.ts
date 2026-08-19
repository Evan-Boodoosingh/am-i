import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
interface Character {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  deck: string;
  traits?: Record<string, boolean> | null;
}
interface Round {
  id: string;
  session_id: string;
  player_one_card_id: string;
  player_two_card_id: string;
  oracle_prompt: string;
  current_turn: string;
  status: string;
  winner: string | null;
  total_turns: number;
  started_at: string;
  ended_at: string | null;
}
interface GameplayState {
  round: Round | null;
  myCharacter: Character | null;
  opponentCharacter: Character | null;
  sessionId: string | null;
  loading: boolean;
  error: string | null;
}
export function useGameplay(
  roomCode: string,
  roomId: string,
  isHost: boolean,
  hostPlayerId: string,
  guestPlayerId: string,
  selectedDecks: string[],
  userId: string,
) {
  const [state, setState] = useState<GameplayState>({
    round: null,
    myCharacter: null,
    opponentCharacter: null,
    sessionId: null,
    loading: true,
    error: null,
  });
  const initialized = useRef(false);
  useEffect(() => {
    if (!userId || !roomId || initialized.current) return;
    initialized.current = true;
    const init = async () => {
      try {
        // Grab the most recent session for this room (if any). We keep old
        // sessions/rounds for history, so on a replay there may be a previous,
        // finished session here.
        const { data: latestSession } = await supabase
          .from("game_sessions")
          .select("*")
          .eq("room_id", roomId)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // If a session exists, check whether its latest round is already
        // finished. A finished latest round means the previous game is over and
        // this is a replay -> we must start a NEW session rather than reuse it.
        let reusableSessionId: string | null = null;
        if (latestSession) {
          const { data: latestRound } = await supabase
            .from("rounds")
            .select("status")
            .eq("session_id", latestSession.id)
            .order("started_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const previousGameOver = latestRound?.status === "finished";
          if (!previousGameOver) {
            reusableSessionId = latestSession.id;
          }
        }

        let sessionId = reusableSessionId;

        if (!reusableSessionId) {
          // Only the host creates the fresh session + round; the guest waits and
          // picks it up via the polling effect below.
          if (!isHost) {
            setState((prev) => ({ ...prev, loading: true }));
            return;
          }

          const nextRoundNumber = (latestSession?.current_round ?? 0) + 1;

          const { data: newSession, error: sessionError } = await supabase
            .from("game_sessions")
            .insert({
              room_id: roomId,
              player_one_id: hostPlayerId,
              player_two_id: guestPlayerId,
              current_round: nextRoundNumber,
              total_rounds_played: 0,
            })
            .select()
            .single();
          if (sessionError || !newSession) {
            setState((prev) => ({
              ...prev,
              error: "Failed to create session",
              loading: false,
            }));
            return;
          }
          sessionId = newSession.id;
          const { data: characters, error: charError } = await supabase
            .from("characters")
            .select("id, name, description, image_url, deck, traits")
            .in("deck", selectedDecks);
          if (charError || !characters || characters.length < 2) {
            setState((prev) => ({
              ...prev,
              error: "Not enough characters in selected decks",
              loading: false,
            }));
            return;
          }
          // Find a pair with at least one shared trait so the Oracle always has
          // something real to announce. Traits are pre-verified data in the DB,
          // so this loop costs zero AI calls.
          const hasSharedTrait = (
            a: { traits?: Record<string, boolean> | null },
            b: { traits?: Record<string, boolean> | null },
          ): boolean => {
            const ta = a.traits ?? {};
            const tb = b.traits ?? {};
            return Object.keys(ta).some(
              (key) => ta[key] === true && tb[key] === true,
            );
          };
          const MAX_ATTEMPTS = 25;
          let charOne = characters[0];
          let charTwo = characters[1];
          for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const shuffled = [...characters].sort(() => Math.random() - 0.5);
            // Never pair a character with itself (duplicates across decks share names)
            if (shuffled[0].name === shuffled[1].name) continue;
            charOne = shuffled[0];
            charTwo = shuffled[1];
            if (hasSharedTrait(charOne, charTwo)) break;
          }
          const firstTurn = Math.random() < 0.5 ? "player_one" : "player_two";
          // STEP 1: create the round row immediately with the characters but no
          // Oracle prompt yet, status 'generating'. This lets BOTH players' loading
          // screens show the character while the Oracle works in the background.
          const { data: newRound, error: roundError } = await supabase
            .from("rounds")
            .insert({
              session_id: sessionId,
              player_one_card_id: charOne.id,
              player_two_card_id: charTwo.id,
              oracle_prompt: null,
              current_turn: firstTurn,
              status: "generating",
              total_turns: 0,
            })
            .select()
            .single();
          if (roundError || !newRound) {
            setState((prev) => ({
              ...prev,
              error: "Failed to create round",
              loading: false,
            }));
            return;
          }
          // Set sessionId NOW (before the Oracle call) so the host's fetch effect
          // runs and shows the character loading screen during the wait, matching
          // the guest. Without this the host sits on the generic spinner.
          setState((prev) => ({ ...prev, sessionId }));
          // STEP 2: call the Oracle (the slow part) while players see the character.
          const oracleRes = await fetch("/api/oracle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              characterOne: charOne.name,
              characterTwo: charTwo.name,
              descriptionOne: charOne.description,
              descriptionTwo: charTwo.description,
              deckOne: charOne.deck,
              deckTwo: charTwo.deck,
            }),
          });
          const { prompt } = await oracleRes.json();
          // STEP 3: fill in the prompt and flip to 'active'. The realtime
          // subscription catches this and moves both players into the round.
          const { error: updateError } = await supabase
            .from("rounds")
            .update({ oracle_prompt: prompt, status: "active" })
            .eq("id", newRound.id);
          if (updateError) {
            setState((prev) => ({
              ...prev,
              error: "Failed to start round",
              loading: false,
            }));
            return;
          }
        }
        setState((prev) => ({ ...prev, sessionId }));
      } catch (err) {
        console.error("Gameplay init error:", err);
        setState((prev) => ({
          ...prev,
          error: "Something went wrong",
          loading: false,
        }));
      }
    };
    init();
  }, [userId, roomId, isHost, hostPlayerId, guestPlayerId, selectedDecks]);
  useEffect(() => {
    if (!state.sessionId) return;
    const fetchRoundAndCharacters = async (sessionId: string) => {
      const { data: round } = await supabase
        .from("rounds")
        .select("*")
        .eq("session_id", sessionId)
        .order("started_at", { ascending: false })
        .limit(1)
        .single();
      if (!round) return;
      const [{ data: charOne }, { data: charTwo }] = await Promise.all([
        supabase
          .from("characters")
          .select("*")
          .eq("id", round.player_one_card_id)
          .single(),
        supabase
          .from("characters")
          .select("*")
          .eq("id", round.player_two_card_id)
          .single(),
      ]);
      const myCharacter = isHost ? charTwo : charOne;
      const opponentCharacter = isHost ? charOne : charTwo;
      setState((prev) => ({
        ...prev,
        round,
        myCharacter,
        opponentCharacter,
        loading: false,
      }));
    };
    fetchRoundAndCharacters(state.sessionId);
    // The channel is keyed on the specific session id. A replay produces a NEW
    // session id, so this effect tears down the old channel and subscribes a
    // fresh one — that avoids the known "cancel + re-init the same channel"
    // stuck-stream bug.
    const channel = supabase
      .channel(`rounds:${state.sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rounds",
          filter: `session_id=eq.${state.sessionId}`,
        },
        () => {
          fetchRoundAndCharacters(state.sessionId!);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.sessionId, isHost]);
  useEffect(() => {
    if (isHost || state.sessionId) return;
    // Guest waits for the host to create the (new) session, then adopts it.
    // Because this only runs while sessionId is null, a fresh mount on replay
    // (the component unmounts when the room leaves 'playing') re-enables it.
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("room_id", roomId)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setState((prev) => ({ ...prev, sessionId: data.id }));
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isHost, state.sessionId, roomId]);
  // Pass the turn to the other player and count the turn just taken.
  const endTurn = async () => {
    if (!state.round) return;
    const nextTurn =
      state.round.current_turn === "player_one" ? "player_two" : "player_one";
    await supabase
      .from("rounds")
      .update({
        current_turn: nextTurn,
        total_turns: (state.round.total_turns ?? 0) + 1,
      })
      .eq("id", state.round.id);
  };
  // First correct guess: enter the draw stage. `winner` records who guessed
  // correctly first; the OTHER player gets one final turn, so we also hand the
  // turn to that other player. This keeps current_turn consistent with the UI.
  const markCorrect = async () => {
    if (!state.round) return;
    const firstGuesser = state.round.current_turn;
    const finalTurnPlayer =
      firstGuesser === "player_one" ? "player_two" : "player_one";
    await supabase
      .from("rounds")
      .update({
        status: "draw_stage",
        winner: firstGuesser,
        current_turn: finalTurnPlayer,
      })
      .eq("id", state.round.id);
  };
  // Guess was wrong during normal play: just hand the turn to the other player.
  const markIncorrect = async () => {
    if (!state.round) return;
    const nextTurn =
      state.round.current_turn === "player_one" ? "player_two" : "player_one";
    await supabase
      .from("rounds")
      .update({
        current_turn: nextTurn,
        total_turns: (state.round.total_turns ?? 0) + 1,
      })
      .eq("id", state.round.id);
  };
  // Update the running per-session tally. Upsert so it works whether or not a
  // tally row already exists for this session.
  const bumpTally = async (
    result: "player_one" | "player_two" | "draw",
  ) => {
    if (!state.sessionId) return;
    const { data: existing } = await supabase
      .from("tally")
      .select("*")
      .eq("session_id", state.sessionId)
      .maybeSingle();
    const base = existing ?? {
      session_id: state.sessionId,
      player_one_wins: 0,
      player_two_wins: 0,
      draws: 0,
    };
    const next = {
      session_id: state.sessionId,
      player_one_wins: base.player_one_wins + (result === "player_one" ? 1 : 0),
      player_two_wins: base.player_two_wins + (result === "player_two" ? 1 : 0),
      draws: base.draws + (result === "draw" ? 1 : 0),
    };
    if (existing) {
      await supabase.from("tally").update(next).eq("id", existing.id);
    } else {
      await supabase.from("tally").insert(next);
    }
  };
  // Resolve the draw stage's final turn and END the game.
  // finalWasCorrect === true  -> both players guessed right -> draw
  // finalWasCorrect === false -> only the first guesser got it -> first guesser wins
  const resolveDrawStage = async (finalWasCorrect: boolean) => {
    if (!state.round) return;
    // `winner` currently holds who guessed correctly FIRST (set by markCorrect).
    const firstGuesser = state.round.winner as
      | "player_one"
      | "player_two"
      | null;
    let finalResult: "player_one" | "player_two" | "draw";
    if (finalWasCorrect) {
      finalResult = "draw";
    } else {
      // First guesser wins; fall back safely if winner was somehow unset.
      finalResult = firstGuesser ?? "player_one";
    }
    await supabase
      .from("rounds")
      .update({
        status: "finished",
        winner: finalResult,
        ended_at: new Date().toISOString(),
        total_turns: (state.round.total_turns ?? 0) + 1,
      })
      .eq("id", state.round.id);
    await bumpTally(finalResult);
  };
  // Play Again: send BOTH players back to the deck-picking lobby by resetting
  // the room. Clearing the confirmed flags + taking game_state out of 'playing'
  // makes GameRoom render the setup screen again for both players (the room
  // channel broadcasts this). Old session/round rows are left intact (history).
  // When both re-confirm, PlayingWrapper remounts and useGameplay starts a
  // brand-new session because the previous session's latest round is finished.
  const playAgain = async () => {
    await supabase
      .from("rooms")
      .update({
        game_state: "setup",
        player_one_confirmed: false,
        player_two_confirmed: false,
      })
      .eq("id", roomId);
  };
  return {
    ...state,
    endTurn,
    markCorrect,
    markIncorrect,
    resolveDrawStage,
    playAgain,
  };
}