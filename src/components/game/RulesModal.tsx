'use client'

import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

// The full game rules, shown in a pop-up. This is the single source of truth
// for the rules text. It renders on top of whatever screen is showing and does
// not touch any game state, data, or the database.
export default function RulesModal({ open, onClose }: Props) {
  // Close on Escape key for convenience.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border rounded-card w-full max-w-md max-h-[85vh] overflow-y-auto p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-text-primary">How to play</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary text-2xl leading-none cursor-pointer"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4 text-sm text-text-secondary leading-relaxed">
          <p>
            You and your opponent are each secretly given a character. You can
            see their character, but you cannot see your own. Your goal is to
            figure out who you are.
          </p>
          <p>
            Each round, the Oracle reveals one clue: a real, surprising
            connection shared between your two characters. That clue is your
            starting hint.
          </p>
          <p>
            Take turns asking each other questions out loud to narrow down who
            you might be. When you think you know, make your guess. Your opponent
            confirms whether you are right.
          </p>
          <p>
            The first player to correctly guess their own character wins. When
            you guess right, your opponent gets one last question. If they
            answer it correctly, the game ends in a draw. If they miss it, you
            win.
          </p>
          <p className="text-text-primary">
            Tip: use the video to talk it out. Asking good questions is the whole
            game.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-button bg-accent text-white font-medium text-sm hover:opacity-90 cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  )
}