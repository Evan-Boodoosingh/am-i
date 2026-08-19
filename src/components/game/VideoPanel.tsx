'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import DailyIframe, { DailyCall } from '@daily-co/daily-js'

interface Props {
  roomCode: string
}

/**
 * Persistent video panel. Mounted ONCE high in the tree (GameRoom) so it stays
 * connected across setup -> loading -> play -> recap without rejoining.
 *
 * Features:
 *  - Your tile + opponent's tile
 *  - Camera toggle (video off, audio continues)
 *  - Mic mute
 *  - Click any tile to enlarge it (fullscreen overlay; tap to close)
 */
export default function VideoPanel({ roomCode }: Props) {
  const callRef = useRef<DailyCall | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)

  const [joined, setJoined] = useState(false)
  const [camOn, setCamOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [remotePresent, setRemotePresent] = useState(false)
  const [enlarged, setEnlarged] = useState<'local' | 'remote' | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Attach a participant's video track to a <video> element.
  const attachTrack = useCallback(
    (el: HTMLVideoElement | null, track: MediaStreamTrack | undefined | null) => {
      if (!el) return
      if (track) {
        el.srcObject = new MediaStream([track])
      } else {
        el.srcObject = null
      }
    },
    [],
  )

  useEffect(() => {
    let cancelled = false

    const start = async () => {
      try {
        // 1) Ask our server for the Daily room URL (creates it if needed).
        const res = await fetch('/api/daily-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomCode }),
        })
        const data = await res.json()
        if (!data?.url) {
          console.error('No Daily room URL returned', data)
          return
        }
        if (cancelled) return

        // 2) Create the call object and join.
        const call = DailyIframe.createCallObject()
        callRef.current = call

        const updateTiles = () => {
          const participants = call.participants()
          // Local
          const local = participants.local
          attachTrack(localVideoRef.current, local?.tracks?.video?.persistentTrack ?? null)
          // First remote participant (2-player game)
          const remote = Object.values(participants).find((p) => !p.local)
          setRemotePresent(!!remote)
          attachTrack(
            remoteVideoRef.current,
            remote?.tracks?.video?.persistentTrack ?? null,
          )
        }

        call
          .on('joined-meeting', () => {
            if (cancelled) return
            setJoined(true)
            updateTiles()
          })
          .on('participant-joined', updateTiles)
          .on('participant-updated', updateTiles)
          .on('participant-left', updateTiles)
          .on('error', (e) => console.error('Daily error:', e))

        await call.join({ url: data.url })

        // Initial device state
        setCamOn(call.localVideo())
        setMicOn(call.localAudio())
      } catch (err) {
        console.error('Video join failed:', err)
        // Most commonly a camera/mic permission denial. Fail soft — the game
        // still works, video just won't show for this player.
        setPermissionDenied(true)
      }
    }

    start()

    return () => {
      cancelled = true
      const call = callRef.current
      if (call) {
        call.leave().catch(() => {})
        call.destroy().catch(() => {})
        callRef.current = null
      }
    }
  }, [roomCode, attachTrack])

  const toggleCamera = () => {
    const call = callRef.current
    if (!call) return
    const next = !camOn
    call.setLocalVideo(next) // audio is a separate track and is unaffected
    setCamOn(next)
  }

  const toggleMic = () => {
    const call = callRef.current
    if (!call) return
    const next = !micOn
    call.setLocalAudio(next)
    setMicOn(next)
  }

  if (permissionDenied) {
    return (
      <div className="w-full max-w-sm mx-auto mb-3">
        <div className="bg-surface border border-border rounded-card px-4 py-2 text-center">
          <p className="text-text-secondary text-xs">
            Camera/mic unavailable — you can still play. Enable permissions and
            refresh to use video.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Compact tile row — sits at the top, persists across all screens */}
      <div className="w-full max-w-sm mx-auto mb-3">
        <div className="flex gap-2 items-stretch">
          {/* Local tile */}
          <button
            onClick={() => setEnlarged('local')}
            className="relative flex-1 aspect-video rounded-lg overflow-hidden bg-black border border-border cursor-pointer"
          >
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {!camOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface">
                <span className="text-text-secondary text-xs">Camera off</span>
              </div>
            )}
            <span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/50 px-1.5 py-0.5 rounded">
              You
            </span>
          </button>

          {/* Remote tile */}
          <button
            onClick={() => remotePresent && setEnlarged('remote')}
            className="relative flex-1 aspect-video rounded-lg overflow-hidden bg-black border border-border cursor-pointer"
          >
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!remotePresent && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface">
                <span className="text-text-secondary text-xs">Waiting...</span>
              </div>
            )}
            <span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/50 px-1.5 py-0.5 rounded">
              Opponent
            </span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex gap-2 mt-2 justify-center">
          <button
            onClick={toggleMic}
            className={`px-3 py-1.5 rounded-pill text-xs font-medium border transition-colors cursor-pointer ${
              micOn
                ? 'bg-surface text-text-secondary border-border hover:border-accent'
                : 'bg-accent text-white border-accent'
            }`}
          >
            {micOn ? 'Mute' : 'Unmute'}
          </button>
          <button
            onClick={toggleCamera}
            className={`px-3 py-1.5 rounded-pill text-xs font-medium border transition-colors cursor-pointer ${
              camOn
                ? 'bg-surface text-text-secondary border-border hover:border-accent'
                : 'bg-accent text-white border-accent'
            }`}
          >
            {camOn ? 'Camera off' : 'Camera on'}
          </button>
        </div>

        {!joined && (
          <p className="text-text-secondary text-[10px] text-center mt-1">
            Connecting video...
          </p>
        )}
      </div>

      {/* Enlarged overlay — tap anywhere to close */}
      {enlarged && (
        <div
          onClick={() => setEnlarged(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden bg-black">
            {enlarged === 'local' ? (
              <video
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
                style={{ transform: 'scaleX(-1)' }}
                ref={(el) => {
                  if (el && localVideoRef.current?.srcObject) {
                    el.srcObject = localVideoRef.current.srcObject
                  }
                }}
              />
            ) : (
              <video
                autoPlay
                playsInline
                className="w-full h-full object-contain"
                ref={(el) => {
                  if (el && remoteVideoRef.current?.srcObject) {
                    el.srcObject = remoteVideoRef.current.srcObject
                  }
                }}
              />
            )}
          </div>
          <span className="absolute top-4 right-4 text-white text-sm">
            Tap to close
          </span>
        </div>
      )}
    </>
  )
}