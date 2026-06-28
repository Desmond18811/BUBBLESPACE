import { useRef, useState, useEffect, useCallback } from 'react'
import {
  Video,
  VideoOff,
  Phone,
  X,
  Mic,
  MicOff,
  FileText,
  ChevronLeft,
  ChevronRight,
  Monitor,
  MonitorUp,
  Volume2,
  Smile,
  Maximize2,
  LogOut,
  SlidersHorizontal,
  User,
  Archive,
  Users,
  FolderClosed,
  MessageSquare,
  Paperclip,
  Send,
  MoreVertical,
  Info,
  Sparkles,
  ClipboardList,
  Zap,
  UserPlus,
  Copy,
} from 'lucide-react'
import { createMeeting, addMeetingTranscriptChunk, endMeeting, getLiveKitToken, uploadWorkspaceFile, createCallInviteLink, getMyContacts } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  VideoTrack,
  useLocalParticipant,
  useRemoteParticipants,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import '@livekit/components-styles'
import { useSocket } from '@/contexts/AppContext'
import { ChatAvatar } from '@/components/chat/chat-avatar'
import { toast } from 'sonner'

interface TranscriptEntry {
  speaker: string
  speakerId?: string
  text: string
  time: string
}

interface ChatMessageEntry {
  speaker: string
  text: string
  time: string
  imageUrl?: string
}

export function LiveKitMeetingModal({ roomId, type, userId, userName, userAvatar, onClose, joinToken }: {
  roomId: string
  type: 'voice' | 'video'
  userId: string
  userName: string
  userAvatar?: string
  onClose: () => void
  // Signed token from a /call/join invite link; verified server-side when present.
  joinToken?: string
}) {
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [videoResolution, setVideoResolution] = useState<{ width: number; height: number }>({ width: 1920, height: 1080 })

  const [permissionsGranted, setPermissionsGranted] = useState(false)
  const [permissionsError, setPermissionsError] = useState<string | null>(null)
  const [meetingDbId, setMeetingDbId] = useState<string | null>(null)
  const meetingDbIdRef = useRef<string | null>(null)
  const hasEndedRef = useRef(false)
  const [showEndPrompt, setShowEndPrompt] = useState(false)

  // Live transcript recognizer handle + a "stopping" guard. Web Speech auto-restarts
  // itself via onend; without an explicit guard, stop() is instantly undone and the
  // mic keeps transcribing into the next call. We null onend AND set this flag.
  const recognitionRef = useRef<any>(null)
  const stoppingRef = useRef(false)

  const serverUrl = import.meta.env.VITE_LIVEKIT_URL || 'wss://bubble-livekit.livekit.cloud'
  const { socket } = useSocket()

  // Stable refs so the unmount-only effect can end the meeting without stale closures.
  const socketRef = useRef(socket)
  socketRef.current = socket
  const roomIdRef = useRef(roomId)
  roomIdRef.current = roomId
  // onClose comes from AppContext; keep a ref so the join effect never lists it as a
  // dependency (an inline parent onClose used to re-run the effect on every render).
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  // Becomes true once we've actually joined the room. Guards against emitting
  // 'call_end' to the peer if the modal mounts/unmounts during setup.
  const joinedRef = useRef(false)

  // Hard-stop the live transcript recognizer. Idempotent.
  const stopRecognition = useCallback(() => {
    stoppingRef.current = true
    const rec = recognitionRef.current
    if (rec) {
      try { rec.onend = null; rec.onresult = null; rec.stop() } catch { /* already stopped */ }
      recognitionRef.current = null
    }
  }, [])

  // Request browser microphone & camera permissions before joining LiveKit room
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // This is only a permission probe — immediately release the tracks so the
        // mic/camera aren't held open. LiveKitRoom acquires its own media. Leaking
        // this stream kept devices "busy" and could break subsequent calls.
        const probe = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' })
        probe.getTracks().forEach(t => t.stop())
        setPermissionsGranted(true)
      } catch (err: any) {
        console.error('[Permissions] Media access denied:', err)
        setPermissionsError('Camera and Microphone access are required to join the call. Please check browser settings and retry.')
      }
    }
    requestPermissions()
  }, [type])

  // Socket Listener for incoming live transcripts
  useEffect(() => {
    const handleTranscriptChunk = (data: { roomId: string, speaker: string, speakerId?: string, text: string }) => {
      if (data.roomId !== roomId) return
      // Ignore the echo of our own chunk — we already appended it locally in onresult.
      if (data.speakerId && data.speakerId === userId) return
      const now = new Date()
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setTranscript(prev => {
        // Guard against duplicates (e.g. server re-broadcast) keyed by speaker+text.
        if (prev.some(e => e.speakerId === data.speakerId && e.text === data.text && e.time === timeStr)) return prev
        return [...prev, { speaker: data.speaker, speakerId: data.speakerId, text: data.text, time: timeStr }]
      })
    }
    socket?.on('meeting_transcript_chunk', handleTranscriptChunk)
    return () => {
      socket?.off('meeting_transcript_chunk', handleTranscriptChunk)
    }
  }, [socket, roomId, userId])

  // Join meeting room and listen for meeting_ended.
  //
  // Deps are intentionally ONLY [roomId]. `socket` and `onClose` are read through refs
  // so a socket reconnect (which churns AppContext renders) can NOT re-run this effect.
  // Re-running used to fire the cleanup's `call_end`, which the backend fans out as
  // `call_ended` — killing the call on every reconnect blip. Now the cleanup runs only
  // on a genuine unmount, and only emits `call_end` if we actually joined.
  useEffect(() => {
    if (!roomId) return
    const sock = socketRef.current
    if (!sock) return

    const joinRoom = () => {
      sock.emit('join_room', roomId)
      joinedRef.current = true
      console.log(`[Meeting Room] Joined room: ${roomId}`)
    }
    joinRoom()
    // Re-join automatically after a socket reconnect — server-side room membership is
    // lost on disconnect. This must NOT emit call_end; it just restores the live call.
    sock.on('connect', joinRoom)

    const handleMeetingEnded = (data: { roomId: string }) => {
      if (data.roomId === roomId) {
        console.log('[Meeting Room] Call ended by other participant')
        toast.info('Meeting has been ended')
        onCloseRef.current()
      }
    }
    sock.on('meeting_ended', handleMeetingEnded)

    return () => {
      sock.off('connect', joinRoom)
      sock.off('meeting_ended', handleMeetingEnded)
      // Only tell the peer the call is over if we actually joined. The backend fans
      // `call_end` out to the room as `call_ended`, resetting the peer's call state to
      // idle so they can be called again.
      if (joinedRef.current) {
        sock.emit('call_end', { roomId })
        sock.emit('leave_room', roomId)
      }
      console.log(`[Meeting Room] Left room: ${roomId}`)
    }
  }, [roomId])

  useEffect(() => {
    let active = true
    let recognition: any = null

    const initMeeting = async () => {
      if (!permissionsGranted) return

      // 1. Fetch LiveKit Token from Backend
      try {
        const res = await getLiveKitToken(roomId, joinToken)
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
        const dbId = res?.meeting?._id || res?._id || null
        if (dbId) {
          setMeetingDbId(dbId)
          meetingDbIdRef.current = dbId
          socketRef.current?.emit('meeting_started', { roomId, meetingId: dbId })
        }
      } catch (err) {
        console.warn('[LiveKit] Failed to create meeting record:', err)
      }

      // 3. Initialize Speech Recognition for live transcript
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognition = new SpeechRecognition()
        recognitionRef.current = recognition
        stoppingRef.current = false
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
              // Web Speech only transcribes THIS browser's mic, so the local user is always
              // the true speaker — stamp the chunk with their full user id for attribution.
              const entry: TranscriptEntry = { speaker: userName || 'You', speakerId: userId, text, time: timeStr }

              if (active) {
                setTranscript(prev => [...prev, entry])
              }

              // Real-time socket transcript relay (speakerId lets peers attribute + dedupe)
              socketRef.current?.emit('meeting_transcript_chunk', { roomId, speaker: userName || 'You', speakerId: userId, text })

              if (meetingDbIdRef.current) {
                addMeetingTranscriptChunk(meetingDbIdRef.current, {
                  speaker: userName || 'You',
                  speakerId: userId,
                  text,
                  timestamp: Date.now(),
                }).catch(console.error)
              }
            }
          }
        }

        recognition.onend = () => {
          if (active && !stoppingRef.current) {
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

    // Real unmount only: `socket` was dropped from the dep list below (we read it via
    // socketRef instead) specifically so a socket reconnect can't re-run this effect
    // and tear down a still-live call. That means this cleanup now only fires when the
    // modal itself unmounts, so it's safe to close out the DB record here — but it must
    // NOT emit 'meeting_ended' over the socket; that's reserved for the user-initiated
    // path (handleConfirmEndMeeting) so peers aren't told the call ended just because
    // this client navigated away mid-call (e.g. LiveKit-initiated disconnect).
    return () => {
      active = false
      stopRecognition()
      if (meetingDbIdRef.current && !hasEndedRef.current) {
        endMeeting(meetingDbIdRef.current).catch(console.error)
      }
    }
  }, [roomId, type, userId, userName, permissionsGranted, stopRecognition])

  const handleConfirmEndMeeting = async (saveToStorage: boolean, sendEmail: boolean) => {
    try {
      hasEndedRef.current = true
      stopRecognition()
      if (meetingDbId) {
        const rawTranscript = transcript
          .map((c) => `${c.speaker ? c.speaker + ': ' : ''}${c.text}`)
          .join('\n');
        await endMeeting(meetingDbId, { transcriptRaw: rawTranscript, saveToStorage, sendEmail })
      }
    } catch (err) {
      console.error('Failed to end meeting with options:', err)
    } finally {
      if (socketRef.current && roomIdRef.current) {
        socketRef.current.emit('meeting_ended', { roomId: roomIdRef.current })
      }
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none p-0 md:p-5 lg:p-8">
      <div className="w-full h-full md:h-[min(960px,92vh)] 2xl:h-[min(1080px,88vh)] max-w-[1760px] flex bg-transparent pointer-events-auto overflow-hidden md:pl-[88px]">
        <div className="w-full h-full relative flex bg-white rounded-none md:rounded-[26px] overflow-hidden border border-slate-200/60 shadow-2xl">
          {permissionsError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-[#f8fafc] text-slate-800">
              <div className="size-16 rounded-3xl bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
                <X className="size-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-850 mb-2">Permissions Needed</h3>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">{permissionsError}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 rounded-2xl text-sm font-semibold text-white bg-purple hover:bg-purple/90 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : !permissionsGranted ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f8fafc] text-slate-800">
              <div className="size-12 rounded-full border-4 border-purple border-t-transparent animate-spin mb-4" />
              <p className="text-slate-500 text-sm">Requesting media permissions…</p>
            </div>
          ) : token ? (
            <LiveKitRoom
              video={type === 'video'}
              audio={true}
              token={token}
              serverUrl={serverUrl}
              connect={true}
              options={{
                videoCaptureDefaults: {
                  resolution: videoResolution,
                  frameRate: 30,
                },
                publishDefaults: {
                  simulcast: true,
                  videoCodec: 'vp8',
                  dtx: true,
                }
              }}
              onDisconnected={onClose}
              className="h-full w-full"
            >
              <MeetingRoomLayout
                type={type}
                userName={userName}
                userAvatar={userAvatar}
                onClose={() => {
                  if (meetingDbIdRef.current) {
                    setShowEndPrompt(true)
                  } else {
                    onClose()
                  }
                }}
                transcript={transcript}
                setTranscript={setTranscript}
                roomId={roomId}
                videoResolution={videoResolution}
                setVideoResolution={setVideoResolution}
              />
              <RoomAudioRenderer />
            </LiveKitRoom>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-[#f8fafc] text-slate-800">
              <div className="size-16 rounded-3xl bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
                <X className="size-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-850 mb-2">Cannot connect</h3>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">{error}</p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-2xl text-sm font-semibold text-white bg-purple hover:bg-purple/90 cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f8fafc] text-slate-800">
              <div className="size-12 rounded-full border-4 border-purple border-t-transparent animate-spin mb-4" />
              <p className="text-slate-500 text-sm">Connecting to LiveKit Cloud…</p>
              <p className="text-slate-400 text-xs mt-1 font-mono">{roomId}</p>
            </div>
          )}
          
          {showEndPrompt && (
            <div className="absolute inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto">
              <div className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-200/60 animate-in zoom-in-95 duration-200 text-center flex flex-col items-center">
                <div className="size-16 rounded-2xl bg-purple/10 text-purple flex items-center justify-center mb-5">
                  <Sparkles className="size-8 text-purple animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-ink mb-3 font-display">Save Meeting Transcripts?</h3>
                <p className="text-sm text-ink-soft mb-6 leading-relaxed">
                  Would you like us to save transcripts here, or would you rather have other people use their emails to get those things sent to them and notified?
                </p>
                <div className="w-full flex flex-col gap-2.5">
                  <button
                    onClick={() => handleConfirmEndMeeting(true, false)}
                    className="w-full py-3 bg-purple text-white font-bold rounded-xl hover:bg-purple/90 active:scale-95 transition-all cursor-pointer text-sm"
                  >
                    Save in Storage Center
                  </button>
                  <button
                    onClick={() => handleConfirmEndMeeting(false, true)}
                    className="w-full py-3 bg-purple/10 text-purple font-bold rounded-xl hover:bg-purple/20 active:scale-95 transition-all cursor-pointer text-sm"
                  >
                    Send via Email Only
                  </button>
                  <button
                    onClick={() => handleConfirmEndMeeting(true, true)}
                    className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 active:scale-95 transition-all cursor-pointer text-sm"
                  >
                    Both: Save & Email Attendees
                  </button>
                  <button
                    onClick={() => handleConfirmEndMeeting(false, false)}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-ink-soft font-bold rounded-xl active:scale-95 transition-all cursor-pointer text-sm"
                  >
                    Neither (Discard transcripts)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MeetingRoomLayout({
  type,
  userName,
  userAvatar,
  onClose,
  transcript,
  setTranscript,
  roomId,
  videoResolution,
  setVideoResolution,
}: {
  type: 'voice' | 'video'
  userName: string
  userAvatar?: string
  onClose: () => void
  transcript: TranscriptEntry[]
  setTranscript: React.Dispatch<React.SetStateAction<TranscriptEntry[]>>
  roomId: string
  videoResolution: { width: number; height: number }
  setVideoResolution: React.Dispatch<React.SetStateAction<{ width: number; height: number }>>
}) {
  const { localParticipant } = useLocalParticipant()
  const remoteParticipants = useRemoteParticipants()
  // Open the People/Chat/Transcript panel on demand (popup), matching mobile —
  // it opens when the chat button is clicked and closes consistently.
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'transcript'>('chat')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { socket } = useSocket()

  const [volume, setVolume] = useState(1.0)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [activeReactions, setActiveReactions] = useState<{ id: string; emoji: string; x: number; y: number }[]>([])

  // ── Add-people / invite picker ──────────────────────────────────────────────
  const [showInvitePicker, setShowInvitePicker] = useState(false)
  const [inviteContacts, setInviteContacts] = useState<any[]>([])
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set())

  // Lazily load contacts the first time the invite picker opens.
  useEffect(() => {
    if (!showInvitePicker || inviteContacts.length) return
    getMyContacts()
      .then((res: any) => setInviteContacts(res?.contacts || res?.data || res || []))
      .catch(() => {/* non-fatal: picker still offers the copy-link path */})
  }, [showInvitePicker, inviteContacts.length])

  const handleCopyInviteLink = useCallback(async () => {
    try {
      const { url } = await createCallInviteLink(roomId)
      await navigator.clipboard.writeText(url)
      toast.success('Invite link copied')
    } catch {
      toast.error('Could not create invite link')
    }
  }, [roomId])

  const handleInviteContact = useCallback((c: any) => {
    const toUserId = c._id || c.id || c.userId
    if (!toUserId) return
    socketRef.current?.emit('call_invite', {
      toUserId,
      roomId: roomIdRef.current,
      callerName: userName,
      callerAvatar: userAvatar,
      type,
    })
    setInvitedIds(prev => new Set(prev).add(toUserId))
    toast.success(`Invited ${c.full_name || c.username || 'contact'}`)
  }, [userName, userAvatar, type])

  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessageEntry[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [callDuration, setCallDuration] = useState(0)

  // Start duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration(d => d + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Send a regular text message via sockets in the meeting
  const handleSendMessage = () => {
    if (!chatInput.trim()) return
    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const entry: ChatMessageEntry = { speaker: userName || 'You', text: chatInput.trim(), time: timeStr }
    setChatMessages(prev => [...prev, entry])
    socket?.emit('meeting_chat_message', { roomId, speaker: userName || 'You', text: chatInput.trim() })
    setChatInput('')
  }

  // Handle uploading and sharing images in the meeting chat
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await uploadWorkspaceFile(file, { source: 'meeting', sourceReference: roomId })
      const imageUrl = res?.file?.fileUrl || res?.fileUrl || res?.data?.fileUrl || URL.createObjectURL(file)
      
      const now = new Date()
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const entry: ChatMessageEntry = { speaker: userName || 'You', text: `Shared an image: ${file.name}`, imageUrl, time: timeStr }
      setChatMessages(prev => [...prev, entry])
      socket?.emit('meeting_chat_message', { roomId, speaker: userName || 'You', text: `Shared an image: ${file.name}`, imageUrl })
    } catch (err) {
      console.error('File upload failed:', err)
      const localUrl = URL.createObjectURL(file)
      const now = new Date()
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const entry: ChatMessageEntry = { speaker: userName || 'You', text: `Shared an image (local): ${file.name}`, imageUrl: localUrl, time: timeStr }
      setChatMessages(prev => [...prev, entry])
      socket?.emit('meeting_chat_message', { roomId, speaker: userName || 'You', text: `Shared an image: ${file.name}`, imageUrl: localUrl })
    }
  }

  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false }
  ])

  // Split tracks: screen share vs camera
  const screenShareTrack = tracks.find(t => t.source === Track.Source.ScreenShare)
  const cameraTracks = tracks.filter(t => t.source === Track.Source.Camera)

  // Determine main video track
  const mainTrack = screenShareTrack || cameraTracks.find(t => !t.participant.isLocal) || cameraTracks[0]

  // The other tracks go to the bottom row
  const bottomTracks = cameraTracks.filter(t => t !== mainTrack)

  // Local controls states
  const [isCameraEnabled, setIsCameraEnabled] = useState(localParticipant.isCameraEnabled)
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(localParticipant.isMicrophoneEnabled)
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(localParticipant.isScreenShareEnabled)

  useEffect(() => {
    setIsCameraEnabled(localParticipant.isCameraEnabled)
    setIsMicrophoneEnabled(localParticipant.isMicrophoneEnabled)
    setIsScreenShareEnabled(localParticipant.isScreenShareEnabled)
  }, [localParticipant.isCameraEnabled, localParticipant.isMicrophoneEnabled, localParticipant.isScreenShareEnabled])

  // Adjust volume of all remote audio streams in the DOM dynamically
  useEffect(() => {
    const adjustVolume = () => {
      const audioElements = document.querySelectorAll('audio')
      audioElements.forEach((audio) => {
        audio.volume = volume
      })
    }
    adjustVolume()

    const observer = new MutationObserver(adjustVolume)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [volume])

  // Listen for socket reactions from other users
  useEffect(() => {
    const handleReaction = (data: { roomId: string; emoji: string }) => {
      if (data.roomId === roomId) {
        triggerFloatingEmoji(data.emoji)
      }
    }
    socket?.on('meeting_reaction', handleReaction)
    return () => {
      socket?.off('meeting_reaction', handleReaction)
    }
  }, [socket, roomId])

  // Listen for text/image chat messages from other participants
  useEffect(() => {
    const handleMeetingChatMessage = (data: { roomId: string, speaker: string, text: string, imageUrl?: string }) => {
      if (data.roomId === roomId) {
        const now = new Date()
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        setChatMessages(prev => [...prev, { speaker: data.speaker, text: data.text, imageUrl: data.imageUrl, time: timeStr }])
      }
    }
    socket?.on('meeting_chat_message', handleMeetingChatMessage)
    return () => {
      socket?.off('meeting_chat_message', handleMeetingChatMessage)
    }
  }, [socket, roomId])

  const toggleCamera = async () => {
    await localParticipant.setCameraEnabled(!isCameraEnabled)
  }

  const toggleMicrophone = async () => {
    await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
  }

  const toggleScreenShare = async () => {
    await localParticipant.setScreenShareEnabled(!isScreenShareEnabled)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleEsc = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleEsc)
    return () => document.removeEventListener('fullscreenchange', handleEsc)
  }, [])

  const triggerFloatingEmoji = (emoji: string) => {
    const id = Math.random().toString(36).substring(7)
    const x = 10 + Math.random() * 80
    const y = 80
    setActiveReactions(prev => [...prev, { id, emoji, x, y }])
    setTimeout(() => {
      setActiveReactions(prev => prev.filter(r => r.id !== id))
    }, 2000)
  }

  // Helper function to extract participant avatar
  const getParticipantAvatar = (participant: any) => {
    if (participant.isLocal && userAvatar) {
      return userAvatar
    }
    if (participant.metadata) {
      try {
        const meta = JSON.parse(participant.metadata)
        if (meta.avatar) return meta.avatar
      } catch (e) {
        if (typeof participant.metadata === 'string' && participant.metadata.trim().length > 0) {
          return participant.metadata
        }
      }
    }
    return undefined
  }

  const totalParticipantsCount = remoteParticipants.length + 1
  const firstParticipants = [localParticipant, ...remoteParticipants].slice(0, 3)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col h-full w-full bg-white text-ink overflow-hidden font-sans relative">
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translateY(-20px) scale(1.2);
          }
          100% {
            transform: translateY(-180px) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex h-16 items-center justify-between px-3 md:px-6 border-b border-black/5 shrink-0 select-none bg-white">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl transition-colors cursor-pointer">
            <ChevronLeft className="size-5 text-ink" />
          </button>
          <div>
            <h2 className="font-bold text-sm text-ink leading-none">
              {type === 'video' ? 'Design Retrospective' : 'Audio Conference'}
            </h2>
            <p className="text-[11px] text-ink-soft mt-1">
              Live • {formatDuration(callDuration)} • {totalParticipantsCount} participant(s)
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 mr-4">
            {firstParticipants.map((p, i) => {
              const avatar = getParticipantAvatar(p)
              const name = p.name || p.identity || 'Participant'
              return (
                <ChatAvatar
                  key={p.sid || p.identity || i}
                  src={avatar}
                  name={name}
                  className="size-8 rounded-full border-2 border-white shadow-sm shrink-0 object-cover"
                />
              )
            })}
            {totalParticipantsCount > 3 && (
              <div className="size-8 rounded-full border-2 border-white bg-purple-soft flex items-center justify-center text-[10px] font-bold text-ink shadow-sm shrink-0">
                +{totalParticipantsCount - 3}
              </div>
            )}
          </div>

          {type === 'video' && (
            <div className="hidden md:flex items-center gap-1 bg-purple-soft/50 rounded-xl p-0.5 border border-purple/10">
              <button
                onClick={() => setVideoResolution({ width: 1280, height: 720 })}
                className={cn(
                  "px-2.5 h-7 text-[10px] font-bold rounded-lg transition-all cursor-pointer",
                  videoResolution.width === 1280 ? "bg-white text-purple shadow-sm" : "text-ink-soft hover:text-ink"
                )}
              >
                HD (720p)
              </button>
              <button
                onClick={() => setVideoResolution({ width: 1920, height: 1080 })}
                className={cn(
                  "px-2.5 h-7 text-[10px] font-bold rounded-lg transition-all cursor-pointer",
                  videoResolution.width === 1920 ? "bg-white text-purple shadow-sm" : "text-ink-soft hover:text-ink"
                )}
              >
                FHD (1080p)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Video/Call Area */}
        <div className="flex flex-1 flex-col p-2 sm:p-4 md:p-6 min-w-0 bg-slate-50/30">
          <div 
            className={cn(
              "flex-1 relative rounded-[32px] overflow-hidden bg-purple-soft/50 border-4 transition-all duration-300 shadow-xl shadow-purple/10 flex items-center justify-center",
              mainTrack?.participant.isSpeaking 
                ? "border-purple ring-4 ring-purple/20 shadow-purple/20" 
                : "border-purple/30"
            )}
          >
            {/* Floating Emojis */}
            {activeReactions.map(r => (
              <div
                key={r.id}
                className="absolute text-4xl pointer-events-none select-none z-40"
                style={{
                  left: `${r.x}%`,
                  bottom: '10%',
                  animation: 'floatUp 2s forwards'
                }}
              >
                {r.emoji}
              </div>
            ))}

            {mainTrack ? (
              mainTrack.source === Track.Source.Camera && !mainTrack.participant.isCameraEnabled ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center select-none bg-purple-soft/30">
                  <div className="relative size-32 rounded-3xl overflow-hidden border-2 border-white ring-4 ring-purple/10 shadow-lg">
                    <ChatAvatar
                      src={getParticipantAvatar(mainTrack.participant)}
                      name={mainTrack.participant.name || mainTrack.participant.identity || 'Participant'}
                      className="size-full rounded-3xl object-cover"
                    />
                  </div>
                  <p className="text-[15px] font-bold text-ink mt-4">
                    {mainTrack.participant.isLocal ? `${userName} (You)` : mainTrack.participant.name || mainTrack.participant.identity}
                  </p>
                  <p className="text-[11px] text-ink-soft mt-1 flex items-center gap-1 font-medium">
                    {!mainTrack.participant.isMicrophoneEnabled ? (
                      <MicOff className="size-3.5 text-red-500" />
                    ) : (
                      <Mic className="size-3.5 text-emerald-500" />
                    )}
                    Camera Muted
                  </p>
                </div>
              ) : (
                <div className="w-full h-full relative">
                  <VideoTrack trackRef={mainTrack as any} className="w-full h-full object-cover animate-in fade-in duration-300" />
                  
                  {/* Participant Name Overlay */}
                  <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-black/30 backdrop-blur-md p-2.5 rounded-2xl border border-white/20 select-none">
                    <div className="size-8 rounded-lg bg-purple flex items-center justify-center text-white shrink-0 font-bold text-xs">
                      {mainTrack.participant.name?.substring(0, 2).toUpperCase() || 'P'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {mainTrack.participant.isLocal ? `${userName} (You)` : mainTrack.participant.name || mainTrack.participant.identity}
                      </p>
                      <p className="text-[9px] text-white/70 font-semibold tracking-wider uppercase">
                        {mainTrack.participant.isLocal ? 'Host' : 'Participant'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Audio State Indicator */}
                  <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 select-none flex items-center gap-1.5">
                    {mainTrack.participant.isMicrophoneEnabled ? (
                      <>
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <Mic className="size-3 text-white" />
                      </>
                    ) : (
                      <>
                        <span className="size-2 rounded-full bg-red-500" />
                        <MicOff className="size-3 text-white" />
                      </>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
                <div className="size-12 rounded-full border-4 border-purple border-t-transparent animate-spin mb-4" />
                <p className="text-ink-soft text-sm">Connecting video feeds…</p>
              </div>
            )}
          </div>

          {/* Thumbnail Row */}
          <div className="h-32 mt-6 flex gap-4 overflow-x-auto py-1 scrollbar-hide shrink-0">
            {bottomTracks.map((t, idx) => {
              const isMuted = !t.participant.isMicrophoneEnabled
              const name = t.participant.isLocal ? `${userName} (You)` : t.participant.name || t.participant.identity
              const isCamEnabled = t.participant.isCameraEnabled

              return (
                <div 
                  key={`${t.participant.sid}-${idx}`} 
                  className={cn(
                    "w-48 rounded-[24px] overflow-hidden bg-white border relative group shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02] flex-none",
                    t.participant.isSpeaking 
                      ? "border-purple ring-2 ring-purple/50" 
                      : "border-black/5"
                  )}
                >
                  {!isCamEnabled ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-purple-soft/20 text-ink select-none p-3 text-center">
                      <ChatAvatar
                        src={getParticipantAvatar(t.participant)}
                        name={name}
                        className="size-12 rounded-xl object-cover shadow-sm mb-1.5"
                      />
                      
                      <span className="text-[11px] font-bold text-ink block truncate max-w-full">{name}</span>
                      
                      <div className="absolute bottom-2.5 right-3 bg-black/5 hover:bg-black/10 p-1.5 rounded-lg transition-colors">
                        {isMuted ? <MicOff className="size-3.5 text-red-500" /> : <Mic className="size-3.5 text-emerald-500" />}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full relative">
                      <VideoTrack trackRef={t as any} className="w-full h-full object-cover" />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white shadow-sm truncate max-w-[70%]">{name}</span>
                        {isMuted ? <MicOff className="size-3 text-white/70" /> : <Mic className="size-3 text-white/90" />}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Sidebar (Meeting Panel) */}
        {isChatOpen && (
          <div className="absolute md:static inset-y-0 right-0 z-30 w-full max-w-[20rem] md:w-80 border-l border-black/5 flex flex-col bg-white animate-in slide-in-from-right duration-300 shrink-0 shadow-2xl md:shadow-none">
            <div className="p-4 border-b border-purple/20 flex items-center justify-between select-none">
              <h3 className="font-bold text-sm text-ink">Meeting Panel</h3>
              <button onClick={() => setIsChatOpen(false)} className="p-1.5 hover:bg-black/5 rounded-lg text-ink-soft cursor-pointer transition-colors">
                <X className="size-4" />
              </button>
            </div>

            <div className="p-3 border-b border-purple/20 select-none">
              <div className="flex bg-purple-soft/50 rounded-xl p-1 gap-0.5">
                {(['chat', 'participants', 'transcript'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer",
                      activeTab === tab ? "bg-white text-purple shadow-sm" : "text-ink-soft hover:text-ink"
                    )}
                  >
                    {tab === 'transcript' ? '✦ AI' : tab === 'chat' ? 'Chat' : 'People'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {activeTab === 'chat' ? (
                <div className="space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12 select-none">
                      <MessageSquare className="size-10 text-purple opacity-30 mb-2" />
                      <p className="text-ink-soft text-xs font-semibold">No messages yet</p>
                      <p className="text-[10px] text-ink-soft/60 mt-0.5">Start typing or share an image below...</p>
                    </div>
                  ) : (
                    chatMessages.map((entry, i) => {
                      const isMe = entry.speaker === userName || entry.speaker === 'You'
                      const entryAvatar = isMe ? userAvatar : undefined 
                      
                      return (
                        <div key={i} className={cn("flex items-end gap-2.5", isMe ? "justify-end" : "justify-start animate-in slide-in-from-bottom-2 duration-200")}>
                          {!isMe && (
                            <ChatAvatar name={entry.speaker} className="size-7 rounded-lg shrink-0 mb-1" />
                          )}

                          <div className="max-w-[80%]">
                            <div className={cn("px-3.5 py-2 rounded-2xl text-[12px] leading-relaxed shadow-sm", 
                              isMe 
                                ? "bg-purple text-white rounded-br-none" 
                                : "bg-purple-soft/40 text-ink rounded-bl-none border border-black/5"
                            )}>
                              {!isMe && (
                                <p className="text-[9px] font-bold text-purple mb-0.5">{entry.speaker}</p>
                              )}
                              <p className="select-text">{entry.text}</p>
                              
                              {entry.imageUrl && (
                                <div className="mt-2 rounded-lg overflow-hidden border border-black/5 max-w-full">
                                  <img
                                    src={entry.imageUrl}
                                    alt="Shared attachment"
                                    className="max-h-40 w-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(entry.imageUrl, '_blank')}
                                  />
                                </div>
                              )}
                              
                              <p className={cn("text-[8px] text-right mt-1 font-medium select-none", isMe ? "text-white/60" : "text-ink-soft/60")}>
                                {entry.time}
                              </p>
                            </div>
                          </div>

                          {isMe && (
                            <ChatAvatar src={entryAvatar} name={userName} className="size-7 rounded-lg shrink-0 mb-1" />
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              ) : activeTab === 'participants' ? (
                <div className="space-y-2">
                  {[localParticipant, ...remoteParticipants].map((p, i) => {
                    const avatar = getParticipantAvatar(p)
                    const name = p.isLocal ? `${userName} (You)` : (p.name || p.identity)
                    const isMuted = !p.isMicrophoneEnabled
                    return (
                      <div key={p.sid || p.identity || i} className="flex items-center justify-between p-2 rounded-xl hover:bg-purple-soft/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <ChatAvatar src={avatar} name={name} className="size-8 rounded-full ring-1 ring-slate-100 object-cover shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-ink block truncate max-w-[120px]">{name}</span>
                            <span className="text-[10px] text-ink-soft block">{p.isLocal ? 'Host' : 'Participant'}</span>
                          </div>
                        </div>
                        {isMuted ? (
                          <MicOff className="size-3.5 text-red-500 shrink-0" />
                        ) : (
                          <Mic className="size-3.5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* AI Transcript Tab */
                <div className="space-y-4">
                  <div 
                    className="rounded-2xl p-4 space-y-3 shrink-0"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(108,92,231,0.06) 0%, rgba(108,92,231,0.02) 100%)', 
                      border: '1px solid rgba(108,92,231,0.12)' 
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1 select-none">
                      <div className="size-5 rounded-md bg-purple flex items-center justify-center">
                        <Sparkles className="size-3 text-white" />
                      </div>
                      <p className="text-[11px] font-bold text-purple uppercase tracking-wider">AI Summary</p>
                    </div>
                    {transcript.length === 0 ? (
                      <p className="text-[11px] text-ink-soft leading-relaxed italic select-none">
                        Waiting for transcript to generate summary...
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-start gap-2.5">
                          <FileText className="size-3.5 text-purple/70 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] font-bold text-purple/70 uppercase tracking-wider select-none">Key Discussion</p>
                            <p className="text-[11px] text-ink mt-0.5 leading-relaxed">
                              Discussion in room "{roomId}" with {totalParticipantsCount} participant(s). Focus is on real-time collaboration.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <ClipboardList className="size-3.5 text-purple/70 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] font-bold text-purple/70 uppercase tracking-wider select-none">Latest Action Items</p>
                            <p className="text-[11px] text-ink mt-0.5 leading-relaxed">
                              Keep collaboration session active and sync on-screen content.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-ink-soft uppercase tracking-wider mb-3 flex items-center gap-1.5 select-none">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      Live Transcript (Speech-to-text)
                    </p>
                    <div className="space-y-4">
                      {transcript.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center select-none">
                          <Mic className="size-8 text-purple/40 animate-pulse mb-2" />
                          <p className="text-xs text-ink-soft font-semibold">Whisper transcript running</p>
                          <p className="text-[10px] text-ink-soft/60 mt-0.5">Start speaking to transcribe...</p>
                        </div>
                      ) : (
                        transcript.map((entry, i) => (
                          <div key={i} className="flex gap-2.5">
                            <ChatAvatar name={entry.speaker} className="size-6 rounded-full object-cover shrink-0 mt-0.5" />
                            <div>
                              <div className="flex items-baseline gap-2 select-none">
                                <p className="text-[11px] font-bold text-ink">{entry.speaker}</p>
                                <p className="text-[9px] text-ink-soft">{entry.time}</p>
                              </div>
                              <p className="text-[11px] text-ink-soft mt-0.5 leading-relaxed select-text">{entry.text}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 mt-auto border-t border-purple/20">
              {activeTab === 'chat' && (
                <div className="relative">
                  <Paperclip 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-soft cursor-pointer hover:text-purple transition-colors" 
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage()
                    }}
                    placeholder="Your message"
                    className="w-full bg-purple-soft/50 border border-transparent rounded-2xl pl-10 pr-12 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple/40 text-ink placeholder:text-ink-soft/60"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-purple hover:scale-110 transition-all cursor-pointer"
                  >
                    <Send className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Control Bar Dock */}
      <div className="min-h-24 md:h-24 flex items-center justify-center shrink-0 border-t border-black/5 bg-white select-none relative z-20 py-3 md:pb-4 px-2 md:px-6">
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 max-w-full bg-white/80 backdrop-blur-3xl border border-black/5 p-2 md:p-3 rounded-[2rem] md:rounded-[2.5rem] shadow-glow">
          
          {/* Mute/Unmute microphone */}
          <button
            onClick={toggleMicrophone}
            className={cn(
              "size-12 rounded-full flex items-center justify-center transition-all cursor-pointer",
              isMicrophoneEnabled ? "bg-purple/10 text-purple hover:bg-purple/20" : "bg-red-500 text-white"
            )}
            title={isMicrophoneEnabled ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isMicrophoneEnabled ? <Mic className="size-5" /> : <MicOff className="size-5" />}
          </button>

          {/* Toggle camera */}
          <button
            onClick={toggleCamera}
            className={cn(
              "size-12 rounded-full flex items-center justify-center transition-all cursor-pointer",
              isCameraEnabled ? "bg-purple/10 text-purple hover:bg-purple/20" : "bg-red-500 text-white"
            )}
            title={isCameraEnabled ? "Mute Camera" : "Unmute Camera"}
          >
            {isCameraEnabled ? <Video className="size-5" /> : <VideoOff className="size-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={cn(
              "size-12 rounded-full flex items-center justify-center transition-all cursor-pointer",
              isScreenShareEnabled ? "bg-purple text-white shadow-sm" : "bg-purple/10 text-purple hover:bg-purple/20"
            )}
            title={isScreenShareEnabled ? "Stop Sharing" : "Share Screen"}
          >
            <MonitorUp className="size-5" />
          </button>

          {/* End Call / Red circular button */}
          <div 
            onClick={onClose}
            className="size-14 flex items-center justify-center bg-red-500 rounded-full shadow-lg shadow-red-500/40 cursor-pointer hover:scale-110 active:scale-95 transition-all mx-2"
            title="End Call"
          >
            <Phone className="size-6 text-white rotate-[135deg]" />
          </div>

          {/* Volume adjustment */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowVolumeSlider(!showVolumeSlider)
                setShowEmojiPicker(false)
              }}
              className={cn(
                "size-12 rounded-full flex items-center justify-center transition-all cursor-pointer",
                showVolumeSlider ? "bg-purple text-white shadow-sm" : "bg-purple/10 text-purple hover:bg-purple/20"
              )}
              title="Speaker Volume"
            >
              <Volume2 className="size-5" />
            </button>
            {showVolumeSlider && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white border border-black/5 shadow-xl rounded-2xl p-3.5 flex flex-col items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none font-sans">
                <span className="text-[10px] font-bold text-purple">{Math.round(volume * 100)}%</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24 h-1 bg-purple-soft rounded-lg appearance-none cursor-pointer accent-purple animate-none"
                />
              </div>
            )}
          </div>

          {/* Emoji Reaction Selector */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker)
                setShowVolumeSlider(false)
              }}
              className={cn(
                "size-12 rounded-full flex items-center justify-center transition-all cursor-pointer",
                showEmojiPicker ? "bg-purple text-white shadow-sm" : "bg-purple/10 text-purple hover:bg-purple/20"
              )}
              title="Emoji Reactions"
            >
              <Smile className="size-5" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white border border-black/5 shadow-xl rounded-2xl p-2 flex items-center gap-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
                {['👍', '❤️', '😂', '😮', '🎉', '👏'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      socket?.emit('meeting_reaction', { roomId, emoji })
                      triggerFloatingEmoji(emoji)
                      setShowEmojiPicker(false)
                    }}
                    className="size-8 flex items-center justify-center text-xl hover:bg-purple-soft/40 rounded-xl transition-all hover:scale-115 cursor-pointer active:scale-90"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add people / Invite */}
          <div className="relative">
            <button
              onClick={() => {
                setShowInvitePicker(!showInvitePicker)
                setShowVolumeSlider(false)
                setShowEmojiPicker(false)
              }}
              className={cn(
                "size-12 rounded-full flex items-center justify-center transition-all cursor-pointer",
                showInvitePicker ? "bg-purple text-white shadow-sm" : "bg-purple/10 text-purple hover:bg-purple/20"
              )}
              title="Add people"
            >
              <UserPlus className="size-5" />
            </button>
            {showInvitePicker && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-72 max-h-80 bg-white border border-black/5 shadow-xl rounded-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 flex flex-col overflow-hidden font-sans">
                <div className="p-3 border-b border-black/5 shrink-0">
                  <button
                    onClick={handleCopyInviteLink}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple/10 hover:bg-purple/20 text-purple font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    <Copy className="size-4" /> Copy invite link
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                  <p className="text-[10px] font-bold text-ink-soft px-2 py-1 uppercase tracking-wider">Ring a contact</p>
                  {inviteContacts.length === 0 ? (
                    <p className="text-xs text-ink-soft/60 text-center py-6">No contacts to ring</p>
                  ) : (
                    inviteContacts.map((c: any) => {
                      const cid = c._id || c.id || c.userId
                      const invited = invitedIds.has(cid)
                      const name = c.full_name || c.username || 'Contact'
                      return (
                        <button
                          key={cid}
                          disabled={invited}
                          onClick={() => handleInviteContact(c)}
                          className={cn(
                            "w-full flex items-center gap-2.5 p-2 rounded-xl transition-colors text-left",
                            invited ? "opacity-50" : "hover:bg-purple-soft/40 cursor-pointer"
                          )}
                        >
                          <ChatAvatar src={c.avatar} name={name} className="size-8 rounded-full object-cover shrink-0" />
                          <span className="text-xs font-semibold text-ink truncate flex-1">{name}</span>
                          <span className="text-[10px] font-bold text-purple shrink-0">{invited ? 'Ringing…' : 'Invite'}</span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Toggle Panel Sidebar */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={cn(
              "size-12 rounded-full flex items-center justify-center transition-all cursor-pointer",
              isChatOpen ? "bg-purple text-white shadow-sm" : "bg-purple/10 text-purple hover:bg-purple/20"
            )}
            title="Toggle Meeting Panel"
          >
            <MessageSquare className="size-5" />
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className={cn(
              "size-12 rounded-full flex items-center justify-center transition-all cursor-pointer",
              isFullscreen ? "bg-purple text-white shadow-sm" : "bg-purple/10 text-purple hover:bg-purple/20"
            )}
            title="Fullscreen Toggle"
          >
            <Maximize2 className="size-5" />
          </button>
          
        </div>
      </div>
    </div>
  )
}
