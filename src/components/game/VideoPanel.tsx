'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import DailyIframe, { DailyCall } from '@daily-co/daily-js'

interface Props {
  roomCode: string
}

/* Small inline icons so the control pill has no external icon dependency. */
function IconMic({ off = false }: { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
      {off && <line x1="3" y1="3" x2="21" y2="21" />}
    </svg>
  )
}
function IconCam({ off = false }: { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      {off && <line x1="2" y1="2" x2="22" y2="22" />}
    </svg>
  )
}
function IconFlip() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
      <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}

export default function VideoPanel({ roomCode }: Props) {
  const callRef = useRef<DailyCall | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const [joined, setJoined] = useState(false)
  const [camOn, setCamOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [remotePresent, setRemotePresent] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const attachStream = useCallback(
    (
      el: HTMLVideoElement | null,
      videoTrack: MediaStreamTrack | undefined | null,
      audioTrack: MediaStreamTrack | undefined | null,
    ) => {
      if (!el) return
      const tracks: MediaStreamTrack[] = []
      if (videoTrack) tracks.push(videoTrack)
      if (audioTrack) tracks.push(audioTrack)
      if (tracks.length > 0) {
        el.srcObject = new MediaStream(tracks)
        el.play().catch(() => {})
      } else {
        el.srcObject = null
      }
    },
    [],
  )

  useEffect(() => {
    let cancelled = false
    const fetchRoomUrl = async (): Promise<string | null> => {
      const MAX_ATTEMPTS = 4
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        if (cancelled) return null
        try {
          const res = await fetch('/api/daily-room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomCode }),
          })
          const data = await res.json()
          if (data?.url) return data.url
        } catch (e) {
          console.error('daily-room fetch attempt failed', e)
        }
        if (attempt < MAX_ATTEMPTS - 1) {
          await new Promise((r) => setTimeout(r, 1500))
        }
      }
      return null
    }

    const start = async () => {
      try {
        const url = await fetchRoomUrl()
        if (!url) {
          setPermissionDenied(true)
          return
        }
        if (cancelled) return
        const call = DailyIframe.createCallObject()
        callRef.current = call
        const updateTiles = () => {
          const participants = call.participants()
          const local = participants.local
          attachStream(
            localVideoRef.current,
            local?.tracks?.video?.persistentTrack ?? null,
            null,
          )
          const remote = Object.values(participants).find((p) => !p.local)
          setRemotePresent(!!remote)
          attachStream(
            remoteVideoRef.current,
            remote?.tracks?.video?.persistentTrack ?? null,
            remote?.tracks?.audio?.persistentTrack ?? null,
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
        await call.join({ url })
        setCamOn(call.localVideo())
        setMicOn(call.localAudio())
      } catch (err) {
        console.error('Video join failed:', err)
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
  }, [roomCode, attachStream])

  const toggleCamera = () => {
    const call = callRef.current
    if (!call) return
    const next = !camOn
    call.setLocalVideo(next)
    setCamOn(next)
  }

  const toggleMic = () => {
    const call = callRef.current
    if (!call) return
    const next = !micOn
    call.setLocalAudio(next)
    setMicOn(next)
  }

  const flipCamera = async () => {
    const call = callRef.current
    if (!call) return
    try {
      await call.cycleCamera()
    } catch (e) {
      console.error('cycleCamera failed', e)
    }
  }

  if (permissionDenied) {
    return (
      <div className="w-full mb-3">
        <div className="w-full aspect-[4/3] rounded-card bg-surface border border-border flex items-center justify-center px-6 text-center">
          <p className="text-text-secondary text-xs leading-relaxed">
            Camera/mic unavailable — you can still play. Enable permissions and
            refresh to use video.
          </p>
        </div>
      </div>
    )
  }

  const controlBtnBase =
    'w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer'
  const controlOn = 'bg-white/15 text-white hover:bg-white/25'
  const controlOff = 'bg-white text-black hover:bg-white/90'

  return (
    <div className="w-full mb-3">
      {/* Changed aspect ratio or removed max-w-sm so it spans the 7-column grid slot completely */}
      <div className="relative w-full aspect-[4/3] lg:aspect-square rounded-card overflow-hidden bg-black select-none">
        {/* Large opponent feed */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        {joined && !remotePresent && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface">
            <span className="text-text-secondary text-sm">
              Waiting for opponent...
            </span>
          </div>
        )}
        {!joined && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface">
            <span className="text-text-secondary text-sm">
              Connecting video...
            </span>
          </div>
        )}
        {remotePresent && (
          <span className="absolute bottom-3 left-3 text-[11px] text-white bg-black/50 px-2 py-0.5 rounded-md">
            Opponent
          </span>
        )}

        {/* Floating self-view */}
        <div className="absolute top-3 left-3 w-1/4 max-w-[120px] aspect-[3/4] rounded-xl overflow-hidden border border-white/20 bg-black shadow-lg">
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
              <span className="text-text-secondary text-[10px] text-center px-1">
                Camera off
              </span>
            </div>
          )}
          <span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/50 px-1.5 py-0.5 rounded">
            You
          </span>
        </div>

        {/* Floating control pill */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-full px-3 py-2">
          <button
            onClick={toggleMic}
            aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
            className={`${controlBtnBase} ${micOn ? controlOn : controlOff}`}
          >
            <IconMic off={!micOn} />
          </button>
          <button
            onClick={toggleCamera}
            aria-label={camOn ? 'Turn camera off' : 'Turn camera on'}
            className={`${controlBtnBase} ${camOn ? controlOn : controlOff}`}
          >
            <IconCam off={!camOn} />
          </button>
          <button
            onClick={flipCamera}
            aria-label="Flip camera"
            className={`${controlBtnBase} ${controlOn}`}
          >
            <IconFlip />
          </button>
        </div>
      </div>
    </div>
  )
}