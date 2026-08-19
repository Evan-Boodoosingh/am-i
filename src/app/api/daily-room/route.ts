import { NextResponse } from 'next/server'

// POST /api/daily-room
// Body: { roomCode: string }
// Creates (or returns) a Daily video room named after the game's room code, so
// both players — who already share the room code — land in the same video room.
// The DAILY_API_KEY stays server-side and is never exposed to the browser.
export async function POST(request: Request) {
  try {
    const { roomCode } = await request.json()

    if (!roomCode || typeof roomCode !== 'string') {
      return NextResponse.json({ error: 'Missing roomCode' }, { status: 400 })
    }

    const apiKey = process.env.DAILY_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Video is not configured' },
        { status: 500 },
      )
    }

    // Daily room names must be URL-safe. Room codes are already A–Z/2–9, but we
    // lowercase-safe them and prefix so they never collide with anything else.
    const roomName = `ami-${roomCode}`.toLowerCase()

    // Helper: fetch the existing room, return its URL or null if not there.
    const fetchExisting = async (): Promise<{ url: string; name: string } | null> => {
      const res = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      if (res.ok) {
        const room = await res.json()
        return { url: room.url, name: room.name }
      }
      return null
    }

    // 1) Room already there? Return it (the common case once one player made it).
    const existing = await fetchExisting()
    if (existing) {
      return NextResponse.json(existing)
    }

    // 2) Not there yet -> try to create it.
    const expSeconds = Math.floor(Date.now() / 1000) + 60 * 60 * 4 // 4 hours
    const created = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'public',
        properties: {
          exp: expSeconds,
          enable_chat: false,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    })

    if (created.ok) {
      const room = await created.json()
      return NextResponse.json({ url: room.url, name: room.name })
    }

    // 3) Create failed. The usual reason is a RACE: both players called at the
    // same instant, both saw "not found", and the other player's create won —
    // so this one collided on the duplicate name. Re-fetch; the room now exists.
    const afterRace = await fetchExisting()
    if (afterRace) {
      return NextResponse.json(afterRace)
    }

    // Genuinely couldn't create or find it — now it's a real error.
    const detail = await created.text()
    console.error('Daily room creation failed:', detail)
    return NextResponse.json(
      { error: 'Failed to create video room' },
      { status: 502 },
    )
  } catch (err) {
    console.error('daily-room route error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}