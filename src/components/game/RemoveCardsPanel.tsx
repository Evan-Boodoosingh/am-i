'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Character {
  id: string
  name: string
  image_url: string | null
  deck: string
}

interface Props {
  selectedDecks: string[]
  maxRemovals: number
  roomCode: string
  playerId: string
}

export default function RemoveCardsPanel({ selectedDecks, maxRemovals, roomCode, playerId }: Props) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [removed, setRemoved] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>(selectedDecks[0] ?? '')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCharacters = async () => {
      if (selectedDecks.length === 0) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('characters')
        .select('id, name, image_url, deck')
        .in('deck', selectedDecks)
        .order('name')

      setCharacters(data ?? [])
      setLoading(false)
    }

    fetchCharacters()
  }, [selectedDecks])

  const handleRemove = (id: string) => {
    if (removed.includes(id)) {
      setRemoved(removed.filter((r) => r !== id))
    } else if (removed.length < maxRemovals) {
      setRemoved([...removed, id])
    }
  }

  const filteredCharacters = characters.filter((c) => c.deck === activeTab)
  const removalsLeft = maxRemovals - removed.length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-text-primary text-sm font-medium">Remove cards</p>
        <span className="text-text-secondary text-xs">{removalsLeft} removals left</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {selectedDecks.map((deck) => (
          <button
            key={deck}
            onClick={() => setActiveTab(deck)}
            className={`px-3 py-1 rounded-pill text-xs font-medium transition-all duration-200 cursor-pointer capitalize ${
              activeTab === deck
                ? 'bg-accent text-white'
                : 'bg-surface text-text-secondary border border-border'
            }`}
          >
            {deck}
          </button>
        ))}
      </div>

      {filteredCharacters.length === 0 ? (
        <p className="text-text-secondary text-xs text-center py-4">
          No characters in this deck yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
          {filteredCharacters.map((character) => {
            const isRemoved = removed.includes(character.id)
            const canRemove = removalsLeft > 0 || isRemoved

            return (
              <div
                key={character.id}
                className="flex items-center justify-between bg-surface rounded-button px-3 py-2"
              >
                <span className={`text-sm ${isRemoved ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                  {character.name}
                </span>
                <button
                  onClick={() => handleRemove(character.id)}
                  disabled={!canRemove && !isRemoved}
                  className={`text-xs px-3 py-1 rounded-pill transition-all duration-200 cursor-pointer disabled:cursor-not-allowed ${
                    isRemoved
                      ? 'bg-surface border border-accent text-accent'
                      : 'bg-accent text-white hover:opacity-90 disabled:opacity-40'
                  }`}
                >
                  {isRemoved ? 'Undo' : 'Remove'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}