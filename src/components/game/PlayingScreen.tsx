'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
}: Props) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)

  const myRole = isHost ? 'player_one' : 'player_two'
  const opponentRole = isHost ? 'player_two' : 'player_one'
  const isMyTurn = round.current_turn === myRole
  const isOpponentTurn = round.current_turn === opponentRole
  const myName = isHost ? playerOneName : playerTwoName
  const opponentName = isHost ? playerTwoName : playerOneName

  const isDrawStage = round.status === 'draw_stage'
  const iGotItRight = isDrawStage && round.winner === myRole
  const opponentGotItRight = isDrawStage && round.winner === opponentRole

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
              {iGotItRight
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
            <div className="w-full aspect-[4/3] overflow-hidden">
              <img
                src={opponentCharacter.image_url}
                alt={opponentCharacter.name}
                className="w-full h-full object-cover object-top"
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
                  className="flex-1 py-3 rounded-button bg-surface border border-border text-text-secondary text-sm font-medium transition-colors hover:border-accent cursor-pointer"
                >
                  Incorrect ✗
                </button>
                <button
                  onClick={onMarkCorrect}
                  className="flex-1 py-3 rounded-button bg-surface border border-border text-text-secondary text-sm font-medium transition-colors hover:border-accent cursor-pointer"
                >
                  Correct ✓
                </button>
              </div>
            </>
          )}

          {/* Draw stage — I get the final turn */}
          {isDrawStage && iGotItRight && (
            <>
              <p className="text-text-secondary text-xs text-center">
                Make your final guess out loud, then end your turn
              </p>
              <button
                onClick={onEndTurn}
                className="w-full py-4 rounded-button bg-accent text-white font-medium text-base transition-opacity hover:opacity-90 cursor-pointer"
              >
                End Final Turn
              </button>
            </>
          )}

          {/* Draw stage — opponent gets the final turn, I confirm */}
          {isDrawStage && opponentGotItRight && (
            <>
              <p className="text-text-secondary text-xs text-center">
                Did {opponentName} guess correctly?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onMarkIncorrect}
                  className="flex-1 py-3 rounded-button bg-surface border border-border text-text-secondary text-sm font-medium transition-colors hover:border-accent cursor-pointer"
                >
                  Incorrect ✗
                </button>
                <button
                  onClick={onMarkCorrect}
                  className="flex-1 py-3 rounded-button bg-surface border border-border text-text-secondary text-sm font-medium transition-colors hover:border-accent cursor-pointer"
                >
                  Correct ✓
                </button>
              </div>
            </>
          )}

          {/* Waiting for opponent */}
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