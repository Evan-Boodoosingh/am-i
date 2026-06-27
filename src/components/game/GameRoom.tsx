'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Props {
  roomCode: string
}

interface Room {
  room_code: string
  status: string
  player_one_name: string | null
  player_two_name: string | null
}

export default function GameRoom({ roomCode }: Props) {
  const router = useRouter()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRoom = async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('room_code, status, player_one_name, player_two_name')
        .eq('room_code', roomCode)
        .single()

      if (error || !data) {
        setError('Room not found.')
        setLoading(false)
        return
      }

      setRoom(data)
      setLoading(false)
    }

    fetchRoom()
  }, [roomCode])

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
          onClick={() => router.push('/')}
          className="text-accent text-sm cursor-pointer hover:opacity-75"
        >
          Go home
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="flex flex-col gap-4 w-full max-w-xs md:max-w-md mx-auto text-center">
        <p className="text-text-secondary text-sm">Room</p>
        <p className="text-accent text-4xl font-medium tracking-widest">{room?.room_code}</p>
        <p className="text-text-secondary text-sm mt-4">Setting up your game...</p>
      </div>
    </main>
  )
}