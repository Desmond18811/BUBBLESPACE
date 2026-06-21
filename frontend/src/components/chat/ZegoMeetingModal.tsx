import { useRef, useState, useEffect } from 'react'
import { Video, Phone, X, Mic, MicOff, VideoOff, FileText, ChevronRight } from 'lucide-react'
import { createMeeting, addMeetingTranscriptChunk, endMeeting } from '@/lib/api'
import { useSocket } from '@/contexts/AppContext'

interface TranscriptEntry {
  speaker: string
  text: string
  time: string
}

export function ZegoMeetingModal({ roomId, type, userId, userName, onClose }: {
  roomId: string
  type: 'voice' | 'video'
  userId: string
  userName: string
  userAvatar?: string
  onClose: () => void
}) {
  const { socket } = useSocket()
  const containerRef = useRef<HTMLDivElement>(null)
  const [zegoReady, setZegoReady] = useState(false)
  const [zegoError, setZegoError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [showTranscript, setShowTranscript] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let active = true
    let zp: any = null
    let recognition: any = null
    let meetingDbId: string | null = null

    const appId = Number(import.meta.env.VITE_ZEGO_APP_ID)
    const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET ?? ''

    if (!appId || !serverSecret) {
      setZegoError(
        'ZegoCloud credentials not configured. Add VITE_ZEGO_APP_ID and VITE_ZEGO_SERVER_SECRET to your .env.local file.'
      )
      return
    }

    // Start call duration timer
    durationRef.current = setInterval(() => {
      setCallDuration(d => d + 1)
    }, 1000)

    const initZegoAndTranscript = async () => {
      // 1. Create meeting record
      try {
        const res = await createMeeting({
          roomId,
          title: `${type === 'video' ? 'Video' : 'Voice'} Call`,
          type: type === 'video' ? 'video' : 'voice',
        })
        meetingDbId = res?.meeting?._id || res?._id || null
      } catch (err) {
        console.warn('[Zego] Failed to create meeting record:', err)
      }

      // 2. Initialize Speech Recognition for live transcript
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = false
        recognition.lang = 'en-US'

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const text = event.results[i][0].transcript.trim()
              if (!text) continue

              const now = new Date()
              const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              const entry: TranscriptEntry = { speaker: userName || 'You', text, time: timeStr }

              if (active) {
                setTranscript(prev => [...prev, entry])
              }

              // Real-time Socket.io relay so other participants see live captions
              // and the server saves the chunk immediately (parity with LiveKit).
              socket?.emit('meeting_transcript_chunk', { roomId, speaker: userName || 'You', text })

              if (meetingDbId) {
                addMeetingTranscriptChunk(meetingDbId, {
                  speaker: userName || 'Guest',
                  text,
                  timestamp: Date.now(),
                }).catch(console.error)
              }
            }
          }
        }

        recognition.onend = () => {
          if (active) {
            try { recognition.start() } catch (_) { }
          }
        }

        try {
          recognition.start()
        } catch (e) {
          console.warn('[Zego] Speech recognition failed to start:', e)
        }
      }

      // 3. Load Zego Prebuilt + ZIM plugin (required for room management)
      Promise.all([
        import('@zegocloud/zego-uikit-prebuilt'),
        import('zego-zim-web').catch(() => null), // ZIM plugin for room signaling
      ])
        .then(([{ ZegoUIKitPrebuilt }, zimModule]) => {
          if (!active || !containerRef.current) return

          const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            appId,
            serverSecret,
            roomId,
            userId || `guest-${Date.now()}`,
            userName || 'Guest'
          )

          zp = ZegoUIKitPrebuilt.create(kitToken)

          // Inject ZIM plugin — this is REQUIRED to fix error 20021
          // ZIM can be exported as default, named, or set on window
          const ZIM = zimModule?.ZIM || zimModule?.default?.ZIM || zimModule?.default || (typeof window !== 'undefined' && (window as any).ZIM)
          if (ZIM) {
            zp.addPlugins({ ZIM })
          }

          zp.joinRoom({
            container: containerRef.current,
            // Use OneONoneCall — this is the correct mode for test tokens (no server token needed)
            scenario: {
              mode: ZegoUIKitPrebuilt.OneONoneCall,
            },
            showPreJoinView: false,
            turnOnCameraWhenJoining: type === 'video',
            turnOnMicrophoneWhenJoining: true,
            showLeavingView: false,
            // Prevent the SDK from closing the whole page on leave
            onLeaveRoom: () => {
              if (!active) return
              active = false
              if (recognition) {
                try { recognition.stop() } catch (_) { }
              }
              if (durationRef.current) clearInterval(durationRef.current)
              if (meetingDbId) {
                endMeeting(meetingDbId).catch(console.error)
              }
              onClose()
            },
          })
          setZegoReady(true)
        })
        .catch((err) => {
          console.error('[Zego] load error', err)
          if (active) {
            setZegoError('Failed to load ZegoCloud SDK. Check your network connection and credentials.')
          }
        })
    }

    initZegoAndTranscript()

    return () => {
      active = false
      if (durationRef.current) clearInterval(durationRef.current)
      if (zp) {
        try { zp.destroy() } catch { /* ignore */ }
      }
      if (recognition) {
        try { recognition.stop() } catch (_) { }
      }
      if (meetingDbId) {
        endMeeting(meetingDbId).catch(console.error)
      }
    }
  }, [roomId, type, userId, userName, onClose])

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div
        className="flex h-14 shrink-0 items-center justify-between px-6"
        style={{
          background: 'rgba(10,10,15,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="size-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#6c5ce7,#8b7cf8)' }}
          >
            {type === 'video' ? <Video className="size-4 text-white" /> : <Phone className="size-4 text-white" />}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{type === 'video' ? 'Video' : 'Voice'} Call</p>
            <p className="text-[11px] text-white/40 font-mono tabular-nums">{formatDuration(callDuration)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle transcript panel */}
          <button
            onClick={() => setShowTranscript(v => !v)}
            title="Live Transcript"
            className="flex items-center gap-1.5 rounded-xl px-3 h-9 text-[12px] font-semibold transition-all"
            style={{
              background: showTranscript ? 'rgba(108,92,231,0.3)' : 'rgba(255,255,255,0.08)',
              color: showTranscript ? '#8b7cf8' : 'rgba(255,255,255,0.6)',
              border: showTranscript ? '1px solid rgba(108,92,231,0.4)' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <FileText className="size-3.5" />
            Transcript
            {transcript.length > 0 && (
              <span className="ml-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: 'rgba(108,92,231,0.6)', color: '#fff' }}>
                {transcript.length > 9 ? '9+' : transcript.length}
              </span>
            )}
          </button>

          <button
            onClick={onClose}
            title="End call"
            className="flex size-9 items-center justify-center rounded-xl transition-all hover:scale-105"
            style={{ background: 'rgba(239,68,68,0.9)' }}
          >
            <X className="size-4 text-white" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Zego container */}
        <div className="flex-1 relative overflow-hidden">
          <div ref={containerRef} className="w-full h-full" />

          {/* Error overlay */}
          {zegoError && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
              style={{ background: '#0a0a0f' }}
            >
              <div
                className="size-16 rounded-3xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(239,68,68,0.12)' }}
              >
                <X className="size-8 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Cannot connect</h3>
              <p className="text-sm text-white/50 max-w-sm leading-relaxed mb-6">{zegoError}</p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-2xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#6c5ce7,#8b7cf8)' }}
              >
                Close
              </button>
            </div>
          )}

          {/* Loading overlay */}
          {!zegoReady && !zegoError && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ background: '#0a0a0f' }}
            >
              <div className="size-12 rounded-full border-4 border-purple border-t-transparent animate-spin mb-4" />
              <p className="text-white/40 text-sm">Connecting…</p>
              <p className="text-white/20 text-xs mt-1 font-mono">{roomId}</p>
            </div>
          )}
        </div>

        {/* Transcript panel (slide in from right) */}
        {showTranscript && (
          <div
            className="w-72 shrink-0 flex flex-col animate-in slide-in-from-right duration-300"
            style={{
              background: 'rgba(14,14,20,0.96)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-purple" style={{ color: '#8b7cf8' }} />
                <span className="text-sm font-bold text-white">Live Transcript</span>
              </div>
              <button onClick={() => setShowTranscript(false)} className="text-white/30 hover:text-white/60 transition-colors">
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Transcript entries */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
              {transcript.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Mic className="size-8 mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
                  <p className="text-white/30 text-sm">Transcript will appear here</p>
                  <p className="text-white/20 text-xs mt-1">Start speaking…</p>
                </div>
              ) : (
                transcript.map((entry, i) => (
                  <div key={i} className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold" style={{ color: '#8b7cf8' }}>
                        {entry.speaker}
                      </span>
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {entry.time}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {entry.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Recording indicator */}
            <div className="px-4 py-3 flex items-center gap-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="size-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Recording your voice for transcript
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
