'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { config } from '@/constants/config'
import InfoModal from '@/components/game/RulesModal'

export default function LandingPage() {
  const router = useRouter()
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative">
      <div className="flex flex-col items-center gap-4 w-full max-w-xs md:max-w-sm text-center">
        {/* Logo Image */}
        <Image
          src="/images/logo.png"
          alt="Am I? logo"
          width={72}
          height={72}
          className="rounded-2xl w-20 h-20 md:w-25 md:h-25 object-contain"
        />

        {/* Text Header Section matching Mockup */}
        <div>
          {/* <p className="text-accent text-xs uppercase tracking-widest font-medium mb-1">
            {config.app.name}
          </p> */}
          <h1 className="text-xl md:text-2xl font-semibold text-text-primary leading-snug">
            {config.app.tagline}
          </h1>
          <p className="text-text-secondary text-xs md:text-sm mt-2 leading-relaxed">
            Ask questions over video and race to figure out who you are. An AI reveals one strange thing you have in common.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full mt-4">
          <button
            onClick={() => router.push('/lobby/create')}
            className="w-full py-4 rounded-button bg-accent text-white font-medium text-base transition-opacity duration-200 hover:opacity-95 active:opacity-75 cursor-pointer"
          >
            Create room
          </button>
          
          <button
            onClick={() => router.push('/lobby/join')}
            className="w-full py-4 rounded-button font-medium text-base text-accent border border-accent bg-transparent transition-all duration-200 hover:bg-accent hover:text-white active:opacity-75 cursor-pointer"
          >
            Join room
          </button>

          {/* How to play trigger button */}
          <button
            onClick={() => setIsInfoOpen(true)}
            className="flex items-center justify-center gap-1.5 text-accent text-xs md:text-sm font-medium mt-3 transition-opacity duration-200 hover:opacity-75 cursor-pointer"
          >
            <span className="text-sm">ⓘ</span> How to play
          </button>
        </div>
      </div>

      {/* Info Modal Component */}
      <InfoModal open={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
    </main>
  )
}