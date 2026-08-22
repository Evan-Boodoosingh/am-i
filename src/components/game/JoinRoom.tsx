'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export default function JoinRoom() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJoin = async () => {
    if (roomCode.trim().length !== 6 || !user) return

    setLoading(true)
    setError(null)

    const { data: room } = await supabase
      .from('rooms')
      .select('room_code, status, host_player_id')
      .eq('room_code', roomCode.trim().toUpperCase())
      .single()

    if (!room) {
      setError('Room not found. Check the code and try again.')
      setLoading(false)
      return
    }

    if (room.status !== 'waiting') {
      setError('This room is no longer available.')
      setLoading(false)
      return
    }

    if (room.host_player_id === user.id) {
      setError('You cannot join your own room.')
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from('rooms')
      .update({
        guest_player_id: user.id,
        status: 'active'
      })
      .eq('room_code', roomCode.trim().toUpperCase())

    if (updateError) {
      setError('Failed to join room. Please try again.')
      setLoading(false)
      return
    }

    router.push(`/room/${roomCode.trim().toUpperCase()}`)
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
          <h1 className="text-2xl font-medium text-text-primary">Join a room</h1>
          <p className="text-text-secondary text-sm mt-1">Enter the code your opponent shared with you</p>
        </div>

        {/* Input box styled identically to Create Room code box */}
        <div className="bg-surface border border-accent rounded-card p-4 text-center">
          <input
            type="text"
            maxLength={6}
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className={`w-full bg-transparent text-4xl font-medium tracking-widest text-center focus:outline-none uppercase ${
              roomCode ? 'text-accent' : 'text-text-secondary text-lg font-normal tracking-normal'
            }`}
            style={!roomCode ? { letterSpacing: 'normal' } : undefined}
            {...(!roomCode ? { placeholder: 'ENTER CODE' } : {})}
          />
        </div>

        {error && (
          <p className="text-sm text-center" style={{ color: '#ef4444' }}>{error}</p>
        )}

        <button
          onClick={handleJoin}
          disabled={roomCode.trim().length !== 6 || loading || authLoading}
          className="w-full py-4 rounded-button bg-accent text-white font-medium text-base transition-opacity duration-200 hover:opacity-90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Joining...' : 'Join room'}
        </button>

        {/* Invisible spacer matching the height of the waiting indicator on Create Room */}
        <div className="h-[68px] mt-4 invisible" aria-hidden="true" />
      </div>
    </main>
  )
}