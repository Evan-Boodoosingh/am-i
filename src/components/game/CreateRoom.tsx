'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { config } from '@/constants/config'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: config.game.roomCodeLength })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join('')
}

export default function CreateRoom() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [roomCode] = useState(() => generateRoomCode())
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !user) return

    const createRoom = async () => {
      await new Promise(resolve => setTimeout(resolve, 500))

      const { error } = await supabase
        .from('rooms')
        .upsert(
          {
            room_code: roomCode,
            status: 'waiting',
            host_player_id: user.id
          },
          { onConflict: 'room_code' }
        )

      if (error) {
        setError('Failed to create room. Please try again.')
        console.error(error)
      } else {
        setLoading(false)
      }
    }

    createRoom()
  }, [roomCode, user, authLoading])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Am I?',
        text: `Think you can figure out who you are? Join me on "Am I?" — the room code is: ${roomCode}`,
      })
    } else {
      handleCopy()
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-text-secondary text-sm">{error}</p>
        <button
          onClick={() => router.back()}
          className="text-accent text-sm cursor-pointer hover:opacity-75"
        >
          Go back
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col gap-6 w-full max-w-xs md:max-w-md mx-auto">
        <button
          onClick={() => router.back()}
          className="text-text-secondary text-sm text-left cursor-pointer hover:text-text-primary transition-colors duration-200 self-start"
        >
          ← Back
        </button>

        <div>
          <h1 className="text-2xl font-medium text-text-primary">Your room</h1>
          <p className="text-text-secondary text-sm mt-1">Share this code with your opponent</p>
        </div>

        <div className="bg-surface border border-accent rounded-card p-6 text-center">
          <p className="text-accent text-4xl font-medium tracking-widest">{roomCode}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 py-3 rounded-button border border-accent text-accent text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-white cursor-pointer"
          >
            {copied ? 'Copied!' : 'Copy code'}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-3 rounded-button bg-accent text-white text-sm font-medium transition-opacity duration-200 hover:opacity-90 cursor-pointer"
          >
            Share
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 mt-4">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="text-text-secondary text-sm">Waiting for your opponent...</p>
        </div>
      </div>
    </main>
  )
}