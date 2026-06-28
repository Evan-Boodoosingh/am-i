'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { config } from '@/constants/config'
import RemoveCardsPanel from '@/components/game/RemoveCardsPanel'

interface Props {
  roomCode: string
}

interface Room {
  room_code: string
  status: string
  game_state: string
  host_player_id: string | null
  guest_player_id: string | null
  player_one_name: string | null
  player_two_name: string | null
  selected_decks: string[]
  player_one_confirmed: boolean
  player_two_confirmed: boolean
  max_removals: number
}

export default function GameRoom({ roomCode }: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    const fetchRoom = async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('room_code, status, game_state, host_player_id, guest_player_id, player_one_name, player_two_name, selected_decks, player_one_confirmed, player_two_confirmed, max_removals')
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

    const channel = supabase
      .channel(`room:${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          setRoom(payload.new as Room)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomCode])

  const isHost = user?.id === room?.host_player_id
  const bothConnected = !!(room?.host_player_id && room?.guest_player_id)
  const bothConfirmed = room?.player_one_confirmed && room?.player_two_confirmed

  const handleDeckToggle = async (slug: string) => {
    if (!room || confirmed) return
    const current = room.selected_decks ?? []
    const updated = current.includes(slug)
      ? current.filter((d) => d !== slug)
      : [...current, slug]

    await supabase
      .from('rooms')
      .update({ selected_decks: updated })
      .eq('room_code', roomCode)
  }

  const handleRemovalChange = async (value: number) => {
    if (!room || confirmed) return
    const clamped = Math.min(10, Math.max(0, value))
    await supabase
      .from('rooms')
      .update({ max_removals: clamped })
      .eq('room_code', roomCode)
  }

  const handleConfirm = async () => {
    if (!room || (room.selected_decks ?? []).length === 0) return

    const nameField = isHost ? 'player_one_name' : 'player_two_name'
    const confirmedField = isHost ? 'player_one_confirmed' : 'player_two_confirmed'

    await supabase
      .from('rooms')
      .update({
        [nameField]: playerName || (isHost ? 'Player 1' : 'Player 2'),
        [confirmedField]: true,
      })
      .eq('room_code', roomCode)

    setConfirmed(true)
  }

useEffect(() => {
  if (!room) return
  if (room.player_one_confirmed && room.player_two_confirmed && room.game_state !== 'playing') {
    supabase
      .from('rooms')
      .update({ game_state: 'playing' })
      .eq('room_code', roomCode)
      .then(({ error }) => {
        if (error) console.error('Error updating game state:', error)
      })
  }
}, [room, roomCode])

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

  if (room?.game_state === 'playing') {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="flex flex-col gap-4 w-full max-w-xs md:max-w-md mx-auto text-center">
          <p className="text-text-primary text-lg font-medium">Game starting...</p>
          <p className="text-text-secondary text-sm">Get ready!</p>
        </div>
      </main>
    )
  }

  if (bothConnected) {
    const selectedDecks = room?.selected_decks ?? []
    const myConfirmed = isHost ? room?.player_one_confirmed : room?.player_two_confirmed
    const opponentConfirmed = isHost ? room?.player_two_confirmed : room?.player_one_confirmed
    const maxRemovals = room?.max_removals ?? 0

    return (
      <main className="min-h-screen bg-background flex flex-col px-6 py-12 overflow-y-auto">
        <div className="flex flex-col gap-6 w-full max-w-xs md:max-w-md mx-auto">

          <div>
            <p className="text-text-secondary text-xs uppercase tracking-widest mb-1">Room {room?.room_code}</p>
            <h1 className="text-2xl font-medium text-text-primary">Game setup</h1>
            <p className="text-text-secondary text-sm mt-1">
              {isHost ? 'You are Player 1' : 'You are Player 2'}
            </p>
          </div>

          <div>
            <p className="text-text-primary text-sm font-medium mb-1">Select decks</p>
            <p className="text-text-secondary text-xs mb-3">Both players see the same selection</p>
            <div className="flex flex-wrap gap-2">
              {config.decks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => handleDeckToggle(deck.slug)}
                  disabled={confirmed}
                  className={`px-4 py-2 rounded-pill text-sm font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed ${
                    selectedDecks.includes(deck.slug)
                      ? 'bg-accent text-white'
                      : 'bg-surface text-text-secondary border border-border hover:border-accent'
                  }`}
                >
                  {deck.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-text-primary text-sm font-medium mb-1">Card removals per player</p>
            <p className="text-text-secondary text-xs mb-3">How many cards each player can remove before the round starts. Default is 0.</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleRemovalChange(maxRemovals - 1)}
                disabled={confirmed || maxRemovals === 0}
                className="w-10 h-10 rounded-button bg-surface text-text-primary text-lg font-medium border border-border hover:border-accent transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                −
              </button>
              <span className="text-text-primary text-xl font-medium w-6 text-center">{maxRemovals}</span>
              <button
                onClick={() => handleRemovalChange(maxRemovals + 1)}
                disabled={confirmed || maxRemovals === 10}
                className="w-10 h-10 rounded-button bg-surface text-text-primary text-lg font-medium border border-border hover:border-accent transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>

          {maxRemovals > 0 && selectedDecks.length > 0 && user && (
  <RemoveCardsPanel
    selectedDecks={selectedDecks}
    maxRemovals={maxRemovals}
    roomCode={roomCode}
    playerId={user.id}
  />
)}

          <div>
            <p className="text-text-primary text-sm font-medium mb-2">Your name <span className="text-text-secondary font-normal">(optional)</span></p>
            <input
              type="text"
              placeholder={isHost ? 'Player 1' : 'Player 2'}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              disabled={confirmed}
              className="w-full bg-surface border border-border rounded-button px-4 py-3 text-text-primary text-sm placeholder:text-text-secondary focus:outline-none focus:border-accent transition-colors duration-200 disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">You</span>
              <span className={myConfirmed ? 'text-accent' : 'text-text-secondary'}>
                {myConfirmed ? 'Ready ✓' : 'Not ready'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">Opponent</span>
              <span className={opponentConfirmed ? 'text-accent' : 'text-text-secondary'}>
                {opponentConfirmed ? 'Ready ✓' : 'Waiting...'}
              </span>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={confirmed || selectedDecks.length === 0}
            className="w-full py-4 rounded-button bg-accent text-white font-medium text-base transition-opacity duration-200 hover:opacity-90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {confirmed ? 'Waiting for opponent...' : 'Confirm setup'}
          </button>

        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="flex flex-col gap-4 w-full max-w-xs md:max-w-md mx-auto text-center">
        <p className="text-text-secondary text-sm">Room</p>
        <p className="text-accent text-4xl font-medium tracking-widest">{room?.room_code}</p>
        <div className="flex flex-col items-center gap-3 mt-6">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="text-text-secondary text-sm">Waiting for your opponent...</p>
        </div>
      </div>
    </main>
  )
}