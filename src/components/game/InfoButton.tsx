'use client'

import { useState } from 'react'
import RulesModal from '@/components/game/RulesModal'

// A small, subtle info button that sits in the top-right corner of a screen and
// opens the rules pop-up. Self-contained: it owns its own open/close state and
// renders the modal itself, so dropping <InfoButton /> onto any screen is all
// that's needed. Touches no game state or data.
export default function InfoButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="How to play"
        className="fixed top-4 right-4 z-50 w-9 h-9 rounded-full border border-border bg-surface/80 backdrop-blur text-text-secondary hover:text-text-primary hover:border-accent transition-colors flex items-center justify-center cursor-pointer"
      >
        <span className="text-base font-serif italic leading-none">i</span>
      </button>
      <RulesModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}