import { useRef, useState, useEffect } from 'react'
import { Video, Phone, X } from 'lucide-react'
import { createMeeting, addMeetingTranscriptChunk, endMeeting } from '@/lib/api'

export function ZegoMeetingModal({ roomId, type, userId, userName, onClose }: {
  roomId: string
  type: 'voice' | 'video'
  userId: string
  userName: string
  userAvatar?: string
  onClose: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zegoReady, setZegoReady] = useState(false)
  const [zegoError, setZegoError] = useState<string | null>(null)

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

    const initZegoAndTranscript = async () => {
      // 1. Create meeting record to get a database ID for transcript compilation
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

      // 2. Initialize Speech Recognition
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

              const chunk = {
                speaker: userName || 'Guest',
                text,
                timestamp: Date.now(),
              }

              if (meetingDbId) {
                addMeetingTranscriptChunk(meetingDbId, chunk).catch(console.error)
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

      // 3. Load Zego Prebuilt
      import('@zegocloud/zego-uikit-prebuilt')
        .then(({ ZegoUIKitPrebuilt }) => {
          if (!active) return

          const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            appId,
            serverSecret,
            roomId,
            userId || `guest-${Date.now()}`,
            userName || 'Guest'
          )
          zp = ZegoUIKitPrebuilt.create(kitToken)
          if (!containerRef.current) return
          zp.joinRoom({
            container: containerRef.current,
            scenario: {
              mode:
                type === 'video'
                  ? ZegoUIKitPrebuilt.VideoConference
                  : ZegoUIKitPrebuilt.GroupCall,
            },
            showPreJoinView: false,
            turnOnCameraWhenJoining: type === 'video',
            turnOnMicrophoneWhenJoining: true,
            showLeavingView: false,
            onLeaveRoom: () => {
              if (recognition) {
                try { recognition.stop() } catch (_) { }
              }
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
          setZegoError('Failed to load ZegoCloud SDK. Check your network connection.')
        })
    }

    initZegoAndTranscript()

    return () => {
      active = false
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

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between px-6"
        style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#6c5ce7,#8b7cf8)' }}>
            {type === 'video' ? <Video className="size-4 text-white" /> : <Phone className="size-4 text-white" />}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{type === 'video' ? 'Video' : 'Voice'} Call</p>
            <p className="text-[11px] text-white/40 font-mono">{roomId}</p>
          </div>
        </div>
        <button onClick={onClose}
          className="flex size-9 items-center justify-center rounded-xl transition-all hover:scale-105"
          style={{ background: 'rgba(239,68,68,0.9)' }}>
          <X className="size-4 text-white" />
        </button>
      </div>

      {/* Zego container */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={containerRef} className="w-full h-full" />

        {/* Error overlay */}
        {zegoError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
            style={{ background: '#0a0a0f' }}>
            <div className="size-16 rounded-3xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(239,68,68,0.12)' }}>
              <X className="size-8 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Cannot connect</h3>
            <p className="text-sm text-white/50 max-w-sm leading-relaxed">{zegoError}</p>
          </div>
        )}

        {/* Loading overlay */}
        {!zegoReady && !zegoError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: '#0a0a0f' }}>
            <div className="size-12 rounded-full border-4 border-purple border-t-transparent animate-spin mb-4" />
            <p className="text-white/40 text-sm">Joining room…</p>
          </div>
        )}
      </div>
    </div>
  )
}
