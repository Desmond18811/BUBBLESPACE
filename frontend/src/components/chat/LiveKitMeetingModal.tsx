import { useRef, useState, useEffect } from 'react'
import { Video, Phone, X, Mic, FileText, ChevronRight } from 'lucide-react'
import { createMeeting, addMeetingTranscriptChunk, endMeeting, getLiveKitToken } from '@/lib/api'
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react'
import '@livekit/components-styles'

interface TranscriptEntry {
  speaker: string
  text: string
  time: string
}

export function LiveKitMeetingModal({ roomId, type, userId, userName, onClose }: {
  roomId: string
  type: 'voice' | 'video'
  userId: string
  userName: string
  userAvatar?: string
  onClose: () => void
}) {
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [showTranscript, setShowTranscript] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const serverUrl = import.meta.env.VITE_LIVEKIT_URL || 'wss://bubble-livekit.livekit.cloud'

  useEffect(() => {
    let active = true
    let recognition: any = null
    let meetingDbId: string | null = null

    // Start call duration timer
    durationRef.current = setInterval(() => {
      setCallDuration(d => d + 1)
    }, 1000)

    const initMeeting = async () => {
      // 1. Fetch LiveKit Token from Backend
      try {
        const res = await getLiveKitToken(roomId)
        if (res.token) {
          setToken(res.token)
        } else {
          setError('Could not generate LiveKit access token.')
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch LiveKit token.')
        return
      }

      // 2. Create meeting record in DB
      try {
        const res = await createMeeting({
          roomId,
          title: `${type === 'video' ? 'Video' : 'Voice'} Call`,
          type: type === 'video' ? 'video' : 'voice',
        })
        meetingDbId = res?.meeting?._id || res?._id || null
      } catch (err) {
        console.warn('[LiveKit] Failed to create meeting record:', err)
      }

      // 3. Initialize Speech Recognition for live transcript
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
          console.warn('[LiveKit] Speech recognition failed to start:', e)
        }
      }
    }

    initMeeting()

    return () => {
      active = false
      if (durationRef.current) clearInterval(durationRef.current)
      if (recognition) {
        try { recognition.stop() } catch (_) { }
      }
      if (meetingDbId) {
        endMeeting(meetingDbId).catch(console.error)
      }
    }
  }, [roomId, type, userId, userName])

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleDisconnected = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-slate-50">
      {/* Header (White themed) */}
      <div
        className="flex h-14 shrink-0 items-center justify-between px-6 bg-white border-b border-slate-200 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div
            className="size-8 rounded-xl flex items-center justify-center bg-purple/10"
          >
            {type === 'video' ? <Video className="size-4 text-purple" /> : <Phone className="size-4 text-purple" />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{type === 'video' ? 'Video' : 'Voice'} Call</p>
            <p className="text-[11px] text-slate-400 font-mono tabular-nums">{formatDuration(callDuration)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle transcript panel */}
          <button
            onClick={() => setShowTranscript(v => !v)}
            title="Live Transcript"
            className="flex items-center gap-1.5 rounded-xl px-3 h-9 text-[12px] font-semibold transition-all bg-purple/5 text-purple border border-purple/15 hover:bg-purple/10"
          >
            <FileText className="size-3.5" />
            Transcript
            {transcript.length > 0 && (
              <span className="ml-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold bg-purple text-white">
                {transcript.length > 9 ? '9+' : transcript.length}
              </span>
            )}
          </button>

          <button
            onClick={onClose}
            title="End call"
            className="flex size-9 items-center justify-center rounded-xl bg-red-500 hover:bg-red-600 transition-all hover:scale-105"
          >
            <X className="size-4 text-white" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* LiveKit Room Container */}
        <div className="flex-1 relative overflow-hidden bg-white lk-theme-light bubble-livekit-container">
          {token ? (
            <LiveKitRoom
              video={type === 'video'}
              audio={true}
              token={token}
              serverUrl={serverUrl}
              connect={true}
              onDisconnected={handleDisconnected}
              className="h-full"
            >
              <VideoConference />
              <RoomAudioRenderer />
            </LiveKitRoom>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-slate-50">
              <div className="size-16 rounded-3xl bg-red-50 flex items-center justify-center mb-4">
                <X className="size-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Cannot connect</h3>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">{error}</p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-2xl text-sm font-semibold text-white bg-purple hover:bg-purple/90"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
              <div className="size-12 rounded-full border-4 border-purple border-t-transparent animate-spin mb-4" />
              <p className="text-slate-500 text-sm">Connecting to LiveKit Cloud…</p>
              <p className="text-slate-400 text-xs mt-1 font-mono">{roomId}</p>
            </div>
          )}
        </div>

        {/* Transcript panel (slide in from right) */}
        {showTranscript && (
          <div
            className="w-72 shrink-0 flex flex-col animate-in slide-in-from-right duration-300 bg-white border-l border-slate-200"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-purple" />
                <span className="text-sm font-bold text-slate-700">Live Transcript</span>
              </div>
              <button onClick={() => setShowTranscript(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Transcript entries */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
              {transcript.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Mic className="size-8 mb-3 text-slate-300" />
                  <p className="text-slate-400 text-sm">Transcript will appear here</p>
                  <p className="text-slate-300 text-xs mt-1">Start speaking…</p>
                </div>
              ) : (
                transcript.map((entry, i) => (
                  <div key={i} className="rounded-2xl p-3 bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-purple">
                        {entry.speaker}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {entry.time}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {entry.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Recording indicator */}
            <div className="px-4 py-3 flex items-center gap-2 border-t border-slate-100 bg-slate-50">
              <span className="size-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] text-slate-400">
                Recording voice for live transcript
              </span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* Overrides to make LiveKit VideoConference fully white themed */
        .bubble-livekit-container .lk-video-conference {
          background-color: #f8fafc !important;
        }
        .bubble-livekit-container .lk-control-bar {
          background-color: #ffffff !important;
          border-top: 1px solid #e2e8f0 !important;
        }
        .bubble-livekit-container .lk-button {
          background-color: #f1f5f9 !important;
          color: #334155 !important;
          border: 1px solid #e2e8f0 !important;
        }
        .bubble-livekit-container .lk-button:hover {
          background-color: #e2e8f0 !important;
        }
        .bubble-livekit-container .lk-button-focus {
          background-color: #6c5ce7 !important;
          color: #ffffff !important;
        }
        .bubble-livekit-container .lk-focus-layout {
          background-color: #f8fafc !important;
        }
        .bubble-livekit-container .lk-grid-layout {
          background-color: #f8fafc !important;
        }
        .bubble-livekit-container .lk-participant-tile {
          background-color: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 16px !important;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
        }
        .bubble-livekit-container .lk-participant-name {
          color: #0f172a !important;
          background-color: rgba(255, 255, 255, 0.85) !important;
          font-weight: 600 !important;
        }
      `}</style>
    </div>
  )
}
