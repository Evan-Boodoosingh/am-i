'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MatchSummary from './MatchSummary'

interface Character {
  id: string
  name: string
  description: string
  image_url: string | null
  deck: string
}

interface Round {
  id: string
  oracle_prompt: string
  current_turn: string
  status: string
  winner: string | null
  total_turns: number
  started_at: string
  ended_at: string | null
}

interface Props {
  round: Round
  myCharacter: Character
  opponentCharacter: Character
  isHost: boolean
  playerOneName: string
  playerTwoName: string
  onEndTurn: () => void
  onMarkCorrect: () => void
  onMarkIncorrect: () => void
  onResolveDrawStage: (finalWasCorrect: boolean) => void
  onPlayAgain: () => void
  onExit: () => void
}

export default function PlayingScreen({
  round,
  myCharacter,
  opponentCharacter,
  isHost,
  playerOneName,
  playerTwoName,
  onEndTurn,
  onMarkCorrect,
  onMarkIncorrect,
  onResolveDrawStage,
  onPlayAgain,
  onExit,
}: Props) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)

  const myRole = isHost ? 'player_one' : 'player_two'
  const opponentRole = isHost ? 'player_two' : 'player_one'
  const isMyTurn = round.current_turn === myRole
  const isOpponentTurn = round.current_turn === opponentRole
  const myName = isHost ? playerOneName : playerTwoName
  const opponentName = isHost ? playerTwoName : playerOneName

  const isDrawStage = round.status === 'draw_stage'
  const isFinished = round.status === 'finished'
  // In the draw stage, current_turn is the player who has the ONE final turn.
  // The other player (the one who guessed correctly first, held in `winner`)
  // waits, then confirms whether that final guess was right.
  const iGetFinalTurn = isDrawStage && isMyTurn
  const iConfirmFinalTurn = isDrawStage && isOpponentTurn

  // Game over -> show the match summary instead of the play UI.
  if (isFinished) {
    return (
      <MatchSummary
        round={round}
        myRole={myRole}
        myName={myName}
        opponentName={opponentName}
        onPlayAgain={onPlayAgain}
        onExit={onExit}
      />
    )
  }

  return (
    <main className="min-h-screen bg-background flex flex-col px-4 py-6 overflow-y-auto">
      <div className="flex flex-col gap-5 w-full max-w-sm mx-auto">

        {/* Oracle prompt */}
        <div className="bg-surface border border-border rounded-card px-4 py-3">
          <p className="text-text-secondary text-xs uppercase tracking-widest mb-1">Oracle</p>
          <p className="text-text-primary text-sm leading-relaxed">
            {round.oracle_prompt}
          </p>
        </div>

        {/* Turn indicator */}
        <div className="flex items-center justify-between gap-3">
          <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-pill text-xs font-medium transition-all ${
            isMyTurn && !isDrawStage
              ? 'bg-accent text-white'
              : 'bg-surface text-text-secondary border border-border'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              isMyTurn && !isDrawStage ? 'bg-white' : 'bg-text-secondary'
            }`} />
            <span className="truncate">{myName}</span>
          </div>
          <span className="text-text-secondary text-xs flex-shrink-0">vs</span>
          <div className={`flex-1 flex items-center justify-end gap-2 px-3 py-2 rounded-pill text-xs font-medium transition-all ${
            isOpponentTurn && !isDrawStage
              ? 'bg-accent text-white'
              : 'bg-surface text-text-secondary border border-border'
          }`}>
            <span className="truncate text-right">{opponentName}</span>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              isOpponentTurn && !isDrawStage ? 'bg-white' : 'bg-text-secondary'
            }`} />
          </div>
        </div>

        {/* Draw stage banner */}
        {isDrawStage && (
          <div className="bg-surface border border-accent rounded-card px-4 py-3 text-center">
            <p className="text-accent text-sm font-medium">
              {iGetFinalTurn
                ? `${opponentName} guessed correctly — you get one final turn`
                : `You guessed correctly — ${opponentName} gets one final turn`}
            </p>
          </div>
        )}

        {/* Opponent's card */}
        <div className="bg-surface border border-border rounded-card overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-text-secondary text-xs uppercase tracking-widest mb-1">Their character</p>
            <p className="text-text-primary text-xl font-medium">{opponentCharacter.name}</p>
            <p className="text-text-secondary text-xs capitalize mt-0.5">{opponentCharacter.deck}</p>
          </div>

          {opponentCharacter.image_url && (
            <div className="w-full aspect-[4/3] flex items-center justify-center overflow-hidden rounded-lg p-2">
              <img
                src={opponentCharacter.image_url}
                alt={opponentCharacter.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}
          <div className="px-4 pb-4 pt-3">
            <button
              onClick={() => setDescriptionExpanded(!descriptionExpanded)}
              className="text-accent text-xs font-medium cursor-pointer hover:opacity-75 transition-opacity"
            >
              {descriptionExpanded ? 'Hide description' : 'Show description'}
            </button>
            <AnimatePresence>
              {descriptionExpanded && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-text-secondary text-sm leading-relaxed mt-2 overflow-hidden"
                >
                  {opponentCharacter.description}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* My character — hidden */}
        <div className="bg-surface border border-border rounded-card px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-xs uppercase tracking-widest mb-0.5">Your character</p>
            <p className="text-text-secondary text-sm italic">Hidden until round ends</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center">
            <span className="text-text-secondary text-lg">?</span>
          </div>
        </div>

        {/* Action area */}
        <div className="flex flex-col gap-3">

          {/* My turn — normal play */}
          {isMyTurn && !isDrawStage && (
            <>
              <p className="text-text-secondary text-xs text-center">
                Ask your question out loud, then end your turn
              </p>
              <button
                onClick={onEndTurn}
                className="w-full py-4 rounded-button bg-accent text-white font-medium text-base transition-opacity hover:opacity-90 cursor-pointer"
              >
                End Turn
              </button>
            </>
          )}

          {/* Opponent's turn — I confirm their guess */}
          {isOpponentTurn && !isDrawStage && (
            <>
              <p className="text-text-secondary text-xs text-center">
                Did {opponentName} guess correctly?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onMarkIncorrect}
                  className="flex-1 py-3 rounded-button bg-surface border border-accent text-accent text-sm font-medium transition-opacity hover:opacity-75 cursor-pointer"
                >
                  Incorrect ✗
                </button>
                <button
                  onClick={onMarkCorrect}
                  className="flex-1 py-3 rounded-button bg-accent border border-accent text-white text-sm font-medium transition-opacity hover:opacity-90 cursor-pointer"
                >
                  Correct ✓
                </button>
              </div>
            </>
          )}

          {/* Draw stage — I get the final turn. If I know it, I guess OUT LOUD
              and the other player confirms. If I DON'T know it, I hit "End Final
              Turn" to give up — that ends the game and the other player wins.
              This resolves the game; it does NOT flip the turn. */}
          {isDrawStage && iGetFinalTurn && (
            <>
              <p className="text-text-secondary text-xs text-center">
                Make your final guess out loud — {opponentName} confirms it. If you
                dont know, end your final turn.
              </p>
              <button
                onClick={() => onResolveDrawStage(false)}
                className="w-full py-4 rounded-button bg-accent text-white font-medium text-base transition-opacity hover:opacity-90 cursor-pointer"
              >
                End Final Turn
              </button>
            </>
          )}

          {/* Draw stage — I guessed first, so I confirm the opponent's final
              turn. This RESOLVES and ends the game. */}
          {isDrawStage && iConfirmFinalTurn && (
            <>
              <p className="text-text-secondary text-xs text-center">
                Did {opponentName} guess correctly on their final turn?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onResolveDrawStage(false)}
                  className="flex-1 py-3 rounded-button bg-surface border border-accent text-accent text-sm font-medium transition-opacity hover:opacity-75 cursor-pointer"
                >
                  Incorrect ✗
                </button>
                <button
                  onClick={() => onResolveDrawStage(true)}
                  className="flex-1 py-3 rounded-button bg-accent border border-accent text-white text-sm font-medium transition-opacity hover:opacity-90 cursor-pointer"
                >
                  Correct ✓
                </button>
              </div>
            </>
          )}

          {/* Waiting for opponent (normal play, their turn) */}
          {isOpponentTurn && !isDrawStage && (
            <div className="w-full py-3 rounded-button bg-surface border border-border text-text-secondary text-sm text-center">
              Waiting for {opponentName}...
            </div>
          )}



        </div>
      </div>
    </main>
  )
}