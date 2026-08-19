# Am I?

A two-player, real-time pop-culture deduction game. Each player is secretly
assigned a character. You can see your opponent's character, but not your own.
An AI "Oracle" reveals one true, surprising connection the two characters share,
and you ask each other yes/no questions out loud over video until someone
correctly guesses who they are.

**Live:** https://am-i-1.vercel.app/

The classic example of an Oracle clue: if one player is **Goku** and the other
is **Jesus**, the Oracle might say *"You both died and came back to life."* True
for both, surprising, and just enough of a thread to start pulling on.

---

## Table of contents

- [How the game works](#how-the-game-works)
- [Tech stack](#tech-stack)
- [Setup](#setup)
- [Environment variables](#environment-variables)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Database schema](#database-schema)
- [Regenerating character data](#regenerating-character-data)
- [Key technical decisions](#key-technical-decisions)
- [Things that got patched along the way](#things-that-got-patched-along-the-way)
- [Roadmap](#roadmap)
- [Known limitations](#known-limitations)

---

## How the game works

1. One player creates a room and gets a room code. The other joins with it.
2. In setup, players pick which deck(s) characters are drawn from, and
   optionally remove characters they don't want assigned.
3. Each player is secretly given a character. You see your opponent's, never
   your own.
4. The Oracle announces one real connection the two characters share.
5. Players take turns asking each other yes/no questions out loud over video,
   using the Oracle's clue and the answers to narrow down who they are.
6. First to correctly guess their own character wins. When you guess right,
   your opponent gets one final question. If they answer it correctly, the game
   ends in a draw. If they miss it, you win.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Database + realtime | Supabase (PostgreSQL + Realtime) |
| Auth | Supabase anonymous auth (guest play, no login screen) |
| Video | Daily.co (`@daily-co/daily-js`, `@daily-co/daily-react`) |
| AI (the Oracle) | Google Gemini |
| Hosting | Vercel |

---

## Setup

Requires Node.js and npm. This project uses **npm** (there's a
`package-lock.json`).

```bash
# 1. Clone and install
git clone <your-repo-url>
cd am-i
npm install

# 2. Create your env file (see the next section for the values)
cp .env.example .env.local   # if you have an example file, otherwise create it

# 3. Run the dev server
npm run dev
```

Then open http://localhost:3000.

Scripts:

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```

To actually play a full two-player round locally, open the app in two separate
browsers (or one normal + one incognito window) so you have two independent
sessions, create a room in one, and join with the code in the other.

---

## Environment variables

Only **five** variables are required to run the app. Put them in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# The Oracle
GEMINI_API_KEY=your-gemini-key

# Video
DAILY_API_KEY=your-daily-key
```

`NEXT_PUBLIC_*` values are exposed to the browser (safe to be public). The
service-role key, Gemini key, and Daily key are **server-side only** and must
never be prefixed with `NEXT_PUBLIC_` or used in client code.

### Optional / historical variables

These may still be in an older `.env.local` but are **not needed to run the
game**:

- `TMDB_API_TOKEN`, `SUPERHERO_API_KEY` — used only by the data-seeding scripts
  that originally built the character dataset (see
  [Regenerating character data](#regenerating-character-data)). The characters
  are already in the database, so a normal clone doesn't need these.
- `GROQ_API_KEY`, `DEEPSEEK_API_KEY` — leftovers from earlier versions of the
  Oracle that ran on different LLM providers before the migration to Gemini.
  Safe to delete.

---

## Architecture

### Realtime multiplayer

The game state lives in Supabase Postgres and is synchronized between the two
players using Supabase Realtime. Rather than one client being authoritative,
both clients subscribe to the relevant rows (`rooms`, `game_sessions`,
`rounds`) and react to changes. A player's action (confirming setup, ending a
turn, marking a guess correct) writes to Postgres, and the write propagates to
the other client via a Realtime subscription.

### The Oracle pipeline

The Oracle is the heart of the game: given two characters, it has to produce a
connection that is **actually true of both of them**, not a hallucination. A
plausible-sounding but false clue would break the game, so the pipeline is built
around verification rather than trusting a single generation.

At a high level, when a round starts:

1. The two character IDs are sent to the Oracle API route.
2. The model proposes a shared connection.
3. Each factual claim in the proposal is checked against the character's stored
   source data (traits, dossier, notable facts) rather than taken on faith.
4. If a proposal can't be verified, the pipeline falls back so the round always
   gets a safe, valid clue rather than a shaky one.

The character data that makes this verification possible (traits, dossiers,
notable facts) is built ahead of time by the seeding scripts and stored in
Postgres as ground truth.

### Round lifecycle and the loading screen

Round creation is a two-step write so the UI never sits on a dead spinner while
the Oracle thinks (that call takes on the order of ~15-20s):

1. Insert the round row immediately with both character IDs and
   `status: 'generating'` (the `oracle_prompt` is null at this point).
2. Both clients pick this up via Realtime and show a loading screen that reveals
   the opponent's character (image, name, deck, description) plus a condensed
   rules recap, so the wait is spent letting players study the character they'll
   be quizzing.
3. The Oracle is called in the background. When it returns, the row is updated
   with the `oracle_prompt` and `status: 'active'`, and both clients move into
   the live round.

### Video

Video is handled by Daily.co. Each game room maps to one Daily room, named
deterministically from the game's room code (`ami-<roomcode>`), so both players
who share a room code land in the same video room. The `DAILY_API_KEY` stays
server-side; the client only ever receives a room URL from the
`/api/daily-room` route.

---

## Project structure

```
src/
  app/
    (game)/            # game route group
    api/               # server routes (Oracle, Daily room)
    layout.tsx
    page.tsx
    globals.css
    favicon.ico
  components/
    auth/              # auth-related UI
    game/              # all gameplay UI (see below)
    layout/            # shared layout pieces
    ui/                # generic reusable UI primitives
    video/             # video-related UI
  hooks/
    useAuth.ts         # Supabase anonymous sign-in
    useGameplay.ts     # core game state machine
  lib/
    supabase.ts        # Supabase client
  constants/
    config.ts          # shared config values
scripts/               # one-off data-seeding scripts (not part of the app)
  ingest-characters.ts
  generate-traits.ts
  save-dossiers.ts
```

### `src/components/game/` file by file

| File | Responsibility |
|------|----------------|
| `LandingPage.tsx` | Entry screen: create or join a game. |
| `CreateRoom.tsx` | Host flow for creating a room and getting a code. |
| `JoinRoom.tsx` | Guest flow for joining with a room code. |
| `GameRoom.tsx` | The main container once both players are in. Handles setup, hosts the persistent video panel and the info button, and renders the round loading screen during Oracle generation. |
| `RemoveCardsPanel.tsx` | UI for removing specific characters from the pool before a round. |
| `PlayingScreen.tsx` | The live round: turn indicator, the opponent's character, and the Correct/Incorrect confirm controls (including the final draw-stage question). Renders the match summary when the round ends. |
| `MatchSummary.tsx` | End-of-round / end-of-match results. |
| `VideoPanel.tsx` | Daily video: fetches the room URL (with retry), joins the call, and attaches both audio and video tracks. |
| `RulesModal.tsx` | Full how-to-play pop-up. Single source of truth for the rules text. |
| `InfoButton.tsx` | Small "i" button fixed top-right that opens `RulesModal`. Owns its own open/close state, so dropping `<InfoButton />` on any screen is all that's needed. |

### `src/hooks/`

- **`useAuth.ts`** — signs the player in anonymously via Supabase
  (`signInAnonymously`) so there's no login wall for guests.
- **`useGameplay.ts`** — the core game state machine: room/session/round state,
  turn handling (`endTurn`), guess resolution (`markCorrect`, `markIncorrect`),
  the final-question draw stage (`resolveDrawStage`), the score tally
  (`bumpTally`), replay (`playAgain`), and the two-step round creation described
  in the architecture section.

### `src/app/api/`

- **`oracle/route.ts`** — runs the Oracle pipeline against Gemini. Uses low
  reasoning effort, a concurrency pool, and retry/backoff.
- **`daily-room/route.ts`** — creates or returns the Daily video room for a
  given room code. Race-safe (see the patch notes below).

---

## Database schema

The main tables in Supabase Postgres:

- **`rooms`** — one row per game room. Room code, host/guest player IDs, status
  (`waiting` -> `active`), game state (`setup` / `playing`), the players' chosen
  names, selected decks, per-player confirmation flags, and max removals.
- **`game_sessions`** — a play session within a room. Tracks the two player IDs,
  current round number, and total rounds played.
- **`rounds`** — one row per round. Both players' character IDs, the
  `oracle_prompt` (nullable, filled once the Oracle returns), `current_turn`,
  `status` (`generating` -> `active` -> `draw_stage` -> `finished`), the winner,
  total turns, and an optional Oracle rating.
- **`tally`** — running score for a session (player one wins, player two wins,
  draws).
- **`characters`** — the character dataset: name, image URL, description, deck,
  tags, traits (JSON), notable facts, and a wiki dossier. This is the ground
  truth the Oracle verifies against.
- **`decks`** — the decks characters are grouped into, including an `is_free`
  flag for future paid decks.
- **`users`**, **`user_decks`** — reserved for future real accounts and deck
  ownership (not used by guest play).

---

## Regenerating character data

The character dataset is already stored in Supabase, so you don't need this to
run the game. It's here for when you want to add or rebuild characters.

The scripts in `scripts/` form the data pipeline that built the `characters`
table. They pull from external sources (TMDB for film/TV data, the Superhero API
for comic characters), clean and structure the results, and write them into
Postgres:

- `ingest-characters.ts` — pull and insert base character records.
- `generate-traits.ts` — derive the structured traits used for Oracle
  verification.
- `save-dossiers.ts` — store the longer-form dossiers / notable facts.

These require the optional `TMDB_API_TOKEN` and `SUPERHERO_API_KEY` plus the
Supabase keys. They're run directly (they aren't wired into `package.json`), for
example with `npx tsx scripts/ingest-characters.ts`.

---

## Key technical decisions

**Verify the Oracle instead of trusting it.** The whole game falls apart if the
Oracle states a connection that isn't true. Rather than accept a single
generation, the pipeline checks each claim against stored character data and
falls back to a safe answer if it can't verify. This is the single most
important design choice in the project.

**Pre-computed ground truth.** Character traits and dossiers are built once by
the seeding scripts and stored in Postgres, so at game time the Oracle has
reliable structured facts to check against instead of inventing them live.

**Postgres as the source of truth for multiplayer.** Both clients read and write
the same rows and sync through Supabase Realtime, which keeps the two players
consistent without a custom websocket server.

**Guest-first auth.** Anonymous Supabase auth means players can start a game
instantly with no signup. Real accounts are deferred until they're actually
needed (paid decks, persistent stats).

**Deterministic video rooms.** Naming the Daily room from the game's room code
means there's no extra coordination needed to get both players into the same
call, they already share the code.

---

## Things that got patched along the way

Real bugs that came up and how they were fixed, kept here so the reasoning
isn't lost:

**Video worked in only one browser, and which one flipped between tests.** The
symptom (regular browser works, incognito fails, then the reverse) proved it
wasn't stale browser state, it was a race. When both players hit
`/api/daily-room` at the same instant, both saw "room doesn't exist" and both
tried to create it. Daily rejects the duplicate create with a 502, so whichever
player lost the race got no video. Fixed in the route: if the create fails,
re-fetch the room and return it, because by then the other player's create has
succeeded. A client-side retry in `VideoPanel` was added on top as extra
resilience.

**Only audio or only video came through.** The stream attach logic was attaching
the video track but not the audio track. Fixed so it attaches both.

**Host sat on a dead spinner while the guest saw the loading screen.** The host
was only setting its session ID at the very end of round creation, after the
Oracle finished, so its loading-screen effect never ran during the wait. Fixed
by setting the session ID immediately after creating the `generating` row, so
both players show the character-reveal loading screen during Oracle generation.

**The Oracle provider was discontinued mid-build.** The model the Oracle
originally depended on was retired by its provider, which broke generation. The
Oracle was migrated to a different API (Gemini), and the two earlier providers'
keys (`GROQ_API_KEY`, `DEEPSEEK_API_KEY`) are now dead leftovers.

**Vague setup captions.** The deck and card-removal captions were reworded to
describe what each control actually does, and the in-round Correct/Incorrect
confirm buttons were recolored to the accent color so they read as clickable
instead of looking disabled.

---

## Roadmap

- Real accounts (email login) for persistent profiles and stats.
- Paid decks (the `decks.is_free` flag and `user_decks` table are already in
  place for this).
- Score tally display in the UI.
- Oracle clue rating (thumbs up/down; the `oracle_rating` column exists).
- Re-enable "Play Again" back to the lobby (the replay logic is written in
  `useGameplay.ts`, currently exit-only in the UI).
- Anonymous-user cleanup once the game is at scale.

---

## Known limitations

- **Guest data isn't cleaned up.** Anonymous users accumulate. Cleanup is
  deferred because deleting them naively would break foreign-key references to
  preserved game history; it needs a considered job (likely `pg_cron`) rather
  than a blunt delete.
- **Two devices needed for real play.** The game is designed around each player
  seeing only the other's character, so it needs two separate sessions and,
  ideally, two people on video.
- **Oracle latency.** Clue generation takes on the order of 15-20 seconds; the
  loading screen is designed to make that wait useful rather than to hide it.
- **No automated tests yet.** Verification happens inside the Oracle pipeline at
  runtime, but there isn't a test suite around the app itself.