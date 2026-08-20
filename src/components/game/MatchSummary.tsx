'use client'
import { motion } from 'framer-motion'
interface Character {
  id: string
  name: string
  description: string
  image_url: string | null
  deck: string
}
interface Round {
  id: string
  status: string
  winner: string | null
  total_turns: number
  started_at: string
  ended_at: string | null
}
interface Props {
  round: Round
  myRole: 'player_one' | 'player_two'
  myName: string
  opponentName: string
  myCharacter?: Character | null
  onPlayAgain: () => void
  onExit: () => void
}
function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return '—'
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime()
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}
export default function MatchSummary({
  round,
  myRole,
  myName,
  opponentName,
  myCharacter,
  onPlayAgain,
  onExit,
}: Props) {
  const isDraw = round.winner === 'draw'
  const iWon = round.winner === myRole
  const headline = isDraw ? 'Draw!' : iWon ? 'You Won!' : 'You Lost'
  const subline = isDraw
    ? 'Both of you guessed correctly'
    : iWon
      ? `You beat ${opponentName}`
      : `${opponentName} guessed first`
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm flex flex-col gap-6"
      >
        {/* Result headline */}
        <div className="text-center">
          <p className="text-text-secondary text-xs uppercase tracking-widest mb-2">
            Match Complete
          </p>
          <h1 className="text-text-primary text-4xl font-semibold mb-1">
            {headline}
          </h1>
          <p className="text-text-secondary text-sm">{subline}</p>
        </div>
        {/* Character reveal — the character you were secretly assigned */}
        {myCharacter && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-text-secondary text-xs uppercase tracking-widest">
              You were
            </p>
            {myCharacter.image_url && (
              <div className="w-full max-w-[200px] aspect-[4/3] flex items-center justify-center">
                <img
                  src={myCharacter.image_url}
                  alt={myCharacter.name}
                  className="max-w-full max-h-full object-contain rounded-card"
                />
              </div>
            )}
            <div>
              <h2 className="text-text-primary text-2xl font-semibold">
                {myCharacter.name}
              </h2>
              <p className="text-text-secondary text-xs capitalize mt-0.5">
                {myCharacter.deck}
              </p>
            </div>
          </div>
        )}
        {/* Stats */}
        <div className="bg-surface border border-border rounded-card divide-y divide-border">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-text-secondary text-sm">Turns taken</span>
            <span className="text-text-primary text-sm font-medium">
              {round.total_turns}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-text-secondary text-sm">Time</span>
            <span className="text-text-primary text-sm font-medium">
              {formatDuration(round.started_at, round.ended_at)}
            </span>
          </div>
        </div>
        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onPlayAgain}
            className="w-full py-4 rounded-button bg-accent text-white font-medium text-base transition-opacity hover:opacity-90 cursor-pointer"
          >
            Exit
          </button>
          {/* <button
            onClick={onExit}
            className="w-full py-3 rounded-button bg-surface border border-border text-text-secondary text-sm font-medium transition-colors hover:border-accent cursor-pointer"
          >
            Exit
          </button> */}
        </div>
      </motion.div>
    </main>
  )
}