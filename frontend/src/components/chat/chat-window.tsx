import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, Phone, MoreVertical, Paperclip, Mic, Send, Video, Info,
  Sparkles, Archive, ArrowLeft, X, Check, CheckCheck, Edit2, Trash2,
  Copy, Pin, Play, Smile, BellOff, EyeOff, Forward, MoreHorizontal,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSecureMediaUrl } from '@/lib/utils'
import { ChatAvatar } from '@/components/chat/chat-avatar'
import { useSocket, useChats } from '@/contexts/AppContext'
import { useDashboard } from '@/contexts/DashboardContext'
import {
  fetchMessages,
  sendTextMessage,
  sendMediaMessage,
  updateMessage,
  deleteMessageForMe,
  reactToMessage,
  toggleMessagePin,
  deleteMessageForEveryone,
  markMessagesRead,
  muteChat,
  clearChat,
  deleteChat,
  getAidaWritingSuggestions,
} from '@/lib/api'
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👎', '🎉']

const waveform = [6, 10, 16, 22, 14, 9, 18, 26, 20, 12, 8, 14, 22, 28, 18, 10, 6, 12, 20, 26, 16, 10, 14, 22, 18, 9, 7, 13]

interface ContextMenuPos { msgId: string; x: number; y: number }

function formatTime(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today'
  const yest = new Date(now); yest.setDate(now.getDate() - 1)
  if (d.toDateString() === yest.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

// Normalize a message from the API: backend returns `id` but we use `_id` everywhere
const normalizeMsg = (m: any): any => {
  if (!m) return m
  return { ...m, _id: m._id || m.id }
}

// The server stores reactions as a flat list — one { user, emoji } entry per
// person. Group them by emoji so the UI shows a single chip per emoji with a
// correct count, and flags whether the current user is among the reactors.
// Tolerates a pre-grouped { emoji, users[] } shape too, for safety.
type ReactionGroup = { emoji: string; count: number; mine: boolean; userIds: string[] }
function groupReactions(reactions: any[] | undefined, myId: string): ReactionGroup[] {
  const map = new Map<string, ReactionGroup>()
  for (const r of reactions || []) {
    const emoji = r?.emoji
    if (!emoji) continue
    const group = map.get(emoji) || { emoji, count: 0, mine: false, userIds: [] as string[] }
    if (Array.isArray(r.users)) {
      for (const u of r.users) {
        const uid = String(u?._id || u?.id || u)
        group.userIds.push(uid)
        if (uid === String(myId)) group.mine = true
      }
      group.count += r.users.length
    } else {
      const uid = String(r.user?._id || r.user?.id || r.user)
      group.userIds.push(uid)
      if (uid === String(myId)) group.mine = true
      group.count += 1
    }
    map.set(emoji, group)
  }
  return Array.from(map.values())
}

function VoiceBubble({ msg, own }: { msg: any; own: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const togglePlay = () => {
    const url = getSecureMediaUrl(msg.mediaUrl || msg.media_url)
    if (!url) return

    if (!audioRef.current) {
      audioRef.current = new Audio(url)
      audioRef.current.onended = () => setIsPlaying(false)
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(err => {
        console.error("Audio playback failed:", err)
      })
      setIsPlaying(true)
    }
  }

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <button
        onClick={togglePlay}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 hover:scale-105 active:scale-95 transition-all"
        type="button"
      >
        {isPlaying ? (
          <span className="flex items-center gap-[2px] justify-center size-full text-white">
            <span className="w-1 h-3.5 bg-current animate-pulse" />
            <span className="w-1 h-3.5 bg-current animate-pulse" style={{ animationDelay: '150ms' }} />
          </span>
        ) : (
          <Play className={cn("size-4 fill-current", own ? "text-white" : "text-purple")} />
        )}
      </button>
      <div className="flex flex-1 items-center gap-[2px]">
        {waveform.map((h, i) => (
          <span
            key={`${msg._id}-wave-${i}`}
            className={cn(
              "w-[2px] rounded-full transition-all",
              own ? "bg-white/70" : "bg-purple/40",
              isPlaying && (i % 3 === 0) && "animate-bounce"
            )}
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
      <span className="text-xs opacity-70">{msg.duration || '0:00'}</span>
    </div>
  )
}

export function ChatWindow({
  chatId,
  chat,
  currentUser,
  onShowInfo,
  isInfoOpen,
  onStartMeeting,
  onClose,
  messages,
  setMessages,
}: {
  chatId: string
  chat: any
  currentUser: any
  onShowInfo?: () => void
  isInfoOpen?: boolean
  onStartMeeting?: () => void
  onClose?: () => void
  messages: any[]
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
}) {
  const { socket, startCall, isUserOnline } = useSocket()
  const { chats, updateChatInList } = useChats()
  const { bgType, onOpenProfile } = useDashboard()
  const myId = currentUser?._id || currentUser?.id

  const handleVoiceCall = () => {
    if (chat?.isGroupChat) {
      onStartMeeting?.()
    } else {
      const other = chat?.users?.find((u: any) => (u._id || u.id) !== myId)
      if (other && startCall) {
        startCall(other._id || other.id, other.full_name || other.username, other.avatar, 'voice')
      }
    }
  }

  const handleVideoCall = () => {
    if (chat?.isGroupChat) {
      onStartMeeting?.()
    } else {
      const other = chat?.users?.find((u: any) => (u._id || u.id) !== myId)
      if (other && startCall) {
        startCall(other._id || other.id, other.full_name || other.username, other.avatar, 'video')
      }
    }
  }

  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)
  const [typingUserId, setTypingUserId] = useState<string | null>(null)
  const [typingUsername, setTypingUsername] = useState<string | null>(null)
  const [typingName, setTypingName] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuPos | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showChatMenu, setShowChatMenu] = useState(false)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [isAiSuggesting, setIsAiSuggesting] = useState(false)
  const [aidaUnavailable, setAidaUnavailable] = useState(false)
  const suggestDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const shouldDiscardRef = useRef(false)

  // Audio Recording Review State
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const [recordedAudioFile, setRecordedAudioFile] = useState<File | null>(null)
  const [recordedAudioDuration, setRecordedAudioDuration] = useState<number>(0)
  const [isAudioPreviewPlaying, setIsAudioPreviewPlaying] = useState(false)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const startTimeRef = useRef<number>(0)

  // Attachment State
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedAttachment, setSelectedAttachment] = useState<{
    file: File
    url: string
    type: 'image' | 'video' | 'audio' | 'file'
  } | null>(null)

  // Lightbox State
  const [lightboxImageIndex, setLightboxImageIndex] = useState<number | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevChatId = useRef<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // @mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionResults, setMentionResults] = useState<any[]>([])
  const [mentionIndex, setMentionIndex] = useState(0)

  // Fetch messages and reset state when chat changes (only chatId triggers this)
  useEffect(() => {
    if (!chatId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setMessages([])
    setInput('')
    setEditingId(null)
    setContextMenu(null)
    discardRecordedAudio()
    setSelectedAttachment(null)
    setLightboxImageIndex(null)
    if (isInfoOpen) onShowInfo?.()

    fetchMessages(chatId)
      .then(res => {
        // Backend returns a plain array; some endpoints wrap in { messages } or { data }
        const raw = Array.isArray(res) ? res : (res?.messages || res?.data || [])
        setMessages(raw.map(normalizeMsg))
      })
      .catch(() => toast.error('Could not load messages'))
      .finally(() => setLoading(false))

    markMessagesRead(chatId).catch(() => { })

    // Trigger initial AI suggestions
    handleInputChange('')
  }, [chatId]) // ← only chatId: socket reconnects must NOT trigger a full reload

  // Manage socket room membership separately so reconnects don't wipe messages
  useEffect(() => {
    if (!chatId || !socket) return
    if (prevChatId.current && prevChatId.current !== chatId) {
      socket.emit('leave_room', prevChatId.current)
    }
    socket.emit('join_room', chatId)
    prevChatId.current = chatId

    return () => {
      socket.emit('leave_room', chatId)
    }
  }, [chatId, socket])

  // Escape key support
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isInfoOpen) {
          onShowInfo?.()
        } else if (onClose) {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose, isInfoOpen, onShowInfo])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Socket listeners
  useEffect(() => {
    if (!socket || !chatId) return

    const onNewMsg = (msg: any) => {
      const m = msg?.data || msg
      // Normalize chatId: could be string id, or object with _id/id
      const mChatId = typeof m?.chatId === 'object'
        ? (m.chatId?._id || m.chatId?.id)
        : (typeof m?.chat === 'object' ? (m.chat?._id || m.chat?.id) : (m?.chatId || m?.chat))

      if (String(mChatId) !== String(chatId)) return

      setMessages(prev => {
        const normalized = normalizeMsg(m)

        // 0. Reconcile our own optimistic bubble by the clientId the server echoes
        // back. This is content-independent, so identical messages and duplicate
        // deliveries can't slip past it — the core double-render fix.
        if (m.clientId) {
          const byClient = prev.find(p => String(p._id) === String(m.clientId))
          if (byClient) return prev.map(p => String(p._id) === String(m.clientId) ? normalized : p)
        }

        // 1. Exact ID match check — drops any duplicate delivery of the same message.
        if (prev.find(p => p._id === normalized._id)) return prev

        // 2. Legacy fallback: optimistic match by content from the same sender
        // (covers messages sent before clientId existed / from other clients).
        const senderId = m.sender?._id || m.sender?.id || m.sender
        const isOwn = String(senderId) === String(myId)

        if (isOwn) {
          const tempMatch = prev.find(p =>
            String(p._id).startsWith('temp-') &&
            p.content === m.content &&
            String(p.sender?._id || p.sender?.id || p.sender) === String(senderId)
          )
          if (tempMatch) {
            // Replace the temp message with the real one
            return prev.map(p => p._id === tempMatch._id ? normalized : p)
          }
        }

        return [...prev, normalized]
      })
      markMessagesRead(chatId).catch(() => { })
    }

    const onMsgUpdated = (msg: any) => {
      const m = msg?.data || msg
      setMessages(prev => prev.map(p => p._id === m._id ? { ...p, ...m } : p))
    }

    // Backend emits `message_edited` after a successful edit (see editMessage in
    // Backend/controllers/messageController.ts). Patch the message text + mark as edited.
    const onMsgEdited = (msg: any) => {
      const m = msg?.data || msg
      if (!m?._id && !m?.id) return
      const id = m._id || m.id
      setMessages(prev => prev.map(p =>
        (p._id === id || p.id === id)
          ? { ...p, content: m.content ?? p.content, text: m.content ?? m.text ?? p.text, isEdited: true, editedAt: m.editedAt || new Date().toISOString() }
          : p
      ))
    }

    const onMsgDeleted = ({ messageId }: any) => {
      setMessages(prev => prev.map(p =>
        p._id === messageId ? { ...p, isDeleted: true, content: 'This message was deleted' } : p
      ))
    }

    const onMsgReaction = (data: any) => {
      setMessages(prev => prev.map(p => p._id === data?.messageId ? { ...p, reactions: data.reactions } : p))
    }

    const onMessagesRead = ({ chatId: cid, userId }: any) => {
      if (cid === chatId && userId !== myId) {
        setMessages(prev => prev.map(msg => {
          if (msg.sender?._id !== userId && msg.sender !== userId) {
            const readBy = Array.isArray(msg.readBy) ? [...msg.readBy] : [];
            const exists = readBy.some((r: any) => String(r.id || r._id || r) === String(userId));
            if (!exists) {
              readBy.push(userId);
            }
            return { ...msg, readBy };
          }
          return msg;
        }))
      }
    }

    const onTypingStart = ({ fromUserId, chatId: cid, fromUsername, fromName }: any) => {
      if (cid === chatId && fromUserId !== myId) {
        setTyping(true)
        setTypingUserId(fromUserId)
        setTypingUsername(fromUsername || null)
        setTypingName(fromName || null)
      }
    }

    const onTypingStop = ({ chatId: cid }: any) => {
      if (cid === chatId) {
        setTyping(false)
        setTypingUserId(null)
        setTypingUsername(null)
        setTypingName(null)
      }
    }

    socket.on('new_message', onNewMsg)
    socket.on('message_updated', onMsgUpdated)
    socket.on('message_edited', onMsgEdited)
    socket.on('message_deleted', onMsgDeleted)
    socket.on('message_reaction', onMsgReaction)
    socket.on('messages_read', onMessagesRead)
    socket.on('typing_start', onTypingStart)
    socket.on('typing_stop', onTypingStop)

    return () => {
      socket.off('new_message', onNewMsg)
      socket.off('message_updated', onMsgUpdated)
      socket.off('message_edited', onMsgEdited)
      socket.off('message_deleted', onMsgDeleted)
      socket.off('message_reaction', onMsgReaction)
      socket.off('messages_read', onMessagesRead)
      socket.off('typing_start', onTypingStart)
      socket.off('typing_stop', onTypingStop)
    }
  }, [socket, chatId, myId])

  const emitTyping = useCallback((isTyping: boolean) => {
    // For GROUP chats, only emit to the room (chatId) — never to an individual's
    // personal room, otherwise a member with an open DM would see "typing" leak in.
    // For DMs, target the single other participant's personal room as a fallback.
    if (chat?.isGroupChat) {
      if (!chatId) return
      socket?.emit(isTyping ? 'typing_start' : 'typing_stop', { chatId })
      return
    }
    const otherUser = chat?.users?.find((u: any) => (u._id || u.id) !== myId)
    const toUserId = otherUser?._id || otherUser?.id
    if (!toUserId) return
    socket?.emit(isTyping ? 'typing_start' : 'typing_stop', { toUserId, chatId })
  }, [socket, chatId, chat, myId])

  const handleInputChange = (val: string) => {
    setInput(val)
    if (!socket || !chatId) return

    // Detect @mention trigger
    const atIdx = val.lastIndexOf('@')
    if (chat?.isGroupChat && atIdx !== -1) {
      const afterAt = val.slice(atIdx + 1)
      // Only trigger if no space after @
      if (!afterAt.includes(' ')) {
        setMentionQuery(afterAt)
        const members = chat?.users || chat?.members || []
        const filtered = members.filter((m: any) => {
          const name = (m.full_name || m.username || '').toLowerCase()
          const uname = (m.username || '').toLowerCase()
          return name.includes(afterAt.toLowerCase()) || uname.includes(afterAt.toLowerCase())
        }).filter((m: any) => (m._id || m.id) !== myId)
        setMentionResults(filtered.slice(0, 6))
        setMentionIndex(0)
      } else {
        setMentionQuery(null)
        setMentionResults([])
      }
    } else {
      setMentionQuery(null)
      setMentionResults([])
    }

    // Emit socket typing
    emitTyping(true)
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      emitTyping(false)
    }, 2000)

    // AI Writing Suggestions
    if (suggestDebounce.current) clearTimeout(suggestDebounce.current)

    // If empty, fetch "start" suggestions
    const query = val.trim() || "Hi"

    // Aida isn't configured on this deployment — stop trying so we don't spam 503s.
    if (aidaUnavailable) return

    suggestDebounce.current = setTimeout(async () => {
      if (!chatId) return
      setIsAiSuggesting(true)
      try {
        const res = await getAidaWritingSuggestions(query, chatId)
        setAiSuggestions(res.suggestions || [])
      } catch (err: any) {
        if (err?.status === 503 || err?.code === 'AIDA_UNCONFIGURED') {
          setAidaUnavailable(true)
          setAiSuggestions([])
        } else {
          console.error('Failed to get AI suggestions:', err)
        }
      } finally {
        setIsAiSuggesting(false)
      }
    }, val.trim().length > 0 ? 600 : 250)
  }

  const handleMentionSelect = (member: any) => {
    const atIdx = input.lastIndexOf('@')
    const before = input.slice(0, atIdx)
    const username = member.username || member.full_name?.split(' ')[0] || 'user'
    const newInput = `${before}@${username} `
    setInput(newInput)
    setMentionQuery(null)
    setMentionResults([])
    inputRef.current?.focus()
  }

  const handleSuggestionClick = (s: string) => {
    // If the suggestion looks like a completion (starts with the input), append/replace
    // For now, just set the input or append it smartly
    const loweredInput = input.toLowerCase()
    const loweredS = s.toLowerCase()

    if (loweredS.startsWith(loweredInput)) {
      setInput(s)
    } else {
      setInput(prev => prev.trim() + ' ' + s)
    }
    setAiSuggestions([])
  }

  // --- Audio Recording Handlers ---
  const startRecording = async () => {
    try {
      shouldDiscardRef.current = false
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        if (shouldDiscardRef.current) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000)

        setRecordedAudioUrl(url)
        setRecordedAudioFile(file)
        setRecordedAudioDuration(durationSec || 1)

        stream.getTracks().forEach(t => t.stop())
      }

      startTimeRef.current = Date.now()
      recorder.start()
      setIsRecording(true)
      setRecordingDuration(0)
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } catch (err) {
      toast.error('Microphone access denied')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
    }
  }

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const s = sec % 60
    return `${mins}:${s.toString().padStart(2, '0')}`
  }

  const discardRecordedAudio = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl)
    }
    setRecordedAudioUrl(null)
    setRecordedAudioFile(null)
    setRecordedAudioDuration(0)
    setIsAudioPreviewPlaying(false)
  }

  const sendRecordedAudio = async () => {
    if (!recordedAudioFile || sending) return
    setSending(true)

    const tempId = `temp-${Date.now()}`
    const localUrl = recordedAudioUrl
    const optimistic = {
      _id: tempId,
      content: '',
      sender: { _id: myId, full_name: currentUser?.full_name, avatar: currentUser?.avatar },
      createdAt: new Date().toISOString(),
      message_type: 'voice',
      mediaUrl: localUrl || undefined,
      media_url: localUrl || undefined,
      duration: formatDuration(recordedAudioDuration),
    }

    setMessages(prev => [...prev, optimistic])
    const audioFile = recordedAudioFile
    const audioDuration = recordedAudioDuration

    // Clear voice recorder UI state immediately, but DO NOT revoke the local URL yet
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }
    setRecordedAudioUrl(null)
    setRecordedAudioFile(null)
    setRecordedAudioDuration(0)
    setIsAudioPreviewPlaying(false)

    try {
      const res = await sendMediaMessage(chatId, audioFile, {
        message_type: 'voice',
        media_duration: audioDuration,
        clientId: tempId,
      })
      const data = res?.data || res
      setMessages(prev => prev.map(m => m._id === tempId ? { ...m, ...data, _id: data._id || tempId } : m))
      toast.success('Voice message sent')
      if (localUrl) {
        URL.revokeObjectURL(localUrl)
      }
    } catch {
      toast.error('Failed to send voice message')
      setMessages(prev => prev.filter(m => m._id !== tempId))
      if (localUrl) {
        URL.revokeObjectURL(localUrl)
      }
    } finally {
      setSending(false)
    }
  }

  const togglePlayPreview = () => {
    if (!recordedAudioUrl) return
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(recordedAudioUrl)
      previewAudioRef.current.onended = () => setIsAudioPreviewPlaying(false)
    }

    if (isAudioPreviewPlaying) {
      previewAudioRef.current.pause()
      setIsAudioPreviewPlaying(false)
    } else {
      previewAudioRef.current.play().catch(err => {
        console.error("Preview play failed:", err)
      })
      setIsAudioPreviewPlaying(true)
    }
  }

  // --- Attachment Handlers ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const type = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
      ? 'video'
      : file.type.startsWith('audio/')
      ? 'audio'
      : 'file'

    const url = URL.createObjectURL(file)
    setSelectedAttachment({ file, url, type })
  }

  const removeSelectedAttachment = () => {
    if (selectedAttachment) {
      URL.revokeObjectURL(selectedAttachment.url)
    }
    setSelectedAttachment(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSend = async () => {
    if ((!input.trim() && !selectedAttachment) || sending) return
    setSending(true)

    const tempId = `temp-${Date.now()}`
    const localUrl = selectedAttachment ? selectedAttachment.url : undefined
    const optimistic = {
      _id: tempId,
      content: input,
      sender: { _id: myId, full_name: currentUser?.full_name, avatar: currentUser?.avatar },
      createdAt: new Date().toISOString(),
      message_type: selectedAttachment ? selectedAttachment.type : 'text',
      mediaUrl: localUrl,
      media_url: localUrl,
    }

    setMessages(prev => [...prev, optimistic])
    const sentText = input
    const attachment = selectedAttachment
    setInput('')
    
    // Clear selection state without revoking the URL
    setSelectedAttachment(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    emitTyping(false)

    try {
      let res
      if (attachment) {
        res = await sendMediaMessage(chatId, attachment.file, {
          content: sentText,
          message_type: attachment.type === 'audio' ? 'voice' : attachment.type,
          clientId: tempId,
        })
      } else {
        res = await sendTextMessage(chatId, sentText, { clientId: tempId })
      }
      const data = res?.data || res
      setMessages(prev => prev.map(m => m._id === tempId ? { ...m, ...data, _id: data._id || tempId } : m))
      if (localUrl) {
        URL.revokeObjectURL(localUrl)
      }
    } catch {
      toast.error('Message failed to send')
      setMessages(prev => prev.filter(m => m._id !== tempId))
      if (localUrl) {
        URL.revokeObjectURL(localUrl)
      }
    } finally {
      setSending(false)
    }
  }

  const handleEdit = async (msgId: string) => {
    if (!editText.trim()) return
    try {
      const res = await updateMessage(msgId, editText)
      const updated = res?.data || res
      setMessages(prev => prev.map(m => m._id === msgId ? { ...m, ...updated } : m))
      setEditingId(null)
      toast.success('Message edited')
    } catch { toast.error('Could not edit message') }
  }

  const handleDelete = async (msgId: string, everyone: boolean) => {
    setContextMenu(null)
    try {
      if (everyone) {
        await deleteMessageForEveryone(msgId)
        setMessages(prev => prev.map(m => m._id === msgId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m))
      } else {
        await deleteMessageForMe(msgId)
        setMessages(prev => prev.filter(m => m._id !== msgId))
      }
    } catch { toast.error('Could not delete message') }
  }

  const handleReact = async (msgId: string, emoji: string) => {
    setContextMenu(null)
    try { await reactToMessage(msgId, emoji) }
    catch { toast.error('Could not react') }
  }

  const handlePin = async (msgId: string) => {
    setContextMenu(null)
    try { await toggleMessagePin(msgId); toast.success('Message pinned!') }
    catch { toast.error('Could not pin') }
  }

  const handleAiSummary = async () => {
    setShowChatMenu(false)
    if (messages.length === 0) {
      toast.error('No messages to summarize')
      return
    }
    setIsAiThinking(true)
    setAiSummary(null)

    // Mock AI logic: generate a summary based on last few messages
    setTimeout(() => {
      const lastMsgs = messages.slice(-10).map(m => m.content).filter(Boolean)
      const summary = lastMsgs.length > 0
        ? `This conversation focuses on ${lastMsgs[0].split(' ').slice(0, 5).join(' ')}... and covers key points about the latest project updates and collaboration steps discussed between ${getChatTitle()} and the team.`
        : "The conversation is primarily introductory or lacks substantial text for a detailed summary."

      setAiSummary(summary)
      setIsAiThinking(false)
    }, 2000)
  }

  const isOwn = (msg: any) => String(msg.sender?._id || msg.sender?.id || msg.sender) === String(myId)
  const canDeleteAll = (msg: any) => isOwn(msg) && !msg.isDeleted && (Date.now() - new Date(msg.createdAt).getTime()) < 120000

  const getChatTitle = () => {
    if (chat?.isGroupChat) return chat.chatName || 'Group Chat'
    const other = chat?.users?.find((u: any) => (u._id || u.id) !== myId)
    if (other) return other.full_name || other.username || 'User'
    return (chat.chatName && chat.chatName !== 'direct') ? chat.chatName : 'Chat'
  }

  const getChatAvatar = () => {
    if (chat?.isGroupChat) return chat.groupIcon
    const other = chat?.users?.find((u: any) => (u._id || u.id) !== myId)
    return other?.avatar
  }

  const getOtherUser = () => chat?.users?.find((u: any) => (u._id || u.id) !== myId)

  // Filter out system and announcement messages, but keep onboarding text messages visible
  const visibleMessages = messages.filter(m => {
    const isSystem = m.message_type === 'system' || m.is_announcement === true;
    if (isSystem) return false;

    // ── NEW: strip Aida bot notification messages from group chat threads ──
    if (
      chat?.isGroupChat &&
      (m.senderIsBot || m.sender?.is_bot || m.sender?.username?.toLowerCase() === 'aida')
    ) return false;

    return true;
  });

  // Group messages by date
  const groupedMessages: { date: string; messages: any[] }[] = []
  visibleMessages.forEach(msg => {
    const date = formatDate(msg.createdAt)
    const last = groupedMessages[groupedMessages.length - 1]
    if (last && last.date === date) last.messages.push(msg)
    else groupedMessages.push({ date, messages: [msg] })
  })

  const filteredMessages = searchQuery
    ? visibleMessages.filter(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : null

  // Render message content with clickable @mentions
  const renderMentionText = (text: string) => {
    if (!text || !text.includes('@')) return text
    const parts = text.split(/(@\w[\w.-]*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('@') && part.length > 1) {
        const uname = part.slice(1)
        const mentionedMember = (chat?.users || chat?.members || []).find((m: any) =>
          (m.username || '').toLowerCase() === uname.toLowerCase() ||
          (m.full_name || '').toLowerCase().startsWith(uname.toLowerCase())
        )
        return (
          <span
            key={i}
            className="text-purple font-semibold cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              if (mentionedMember) onOpenProfile?.(mentionedMember, true)
            }}
          >
            {part}
          </span>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className="flex h-full w-full overflow-hidden" onClick={() => { setContextMenu(null); setShowChatMenu(false) }}>
      <div
        className={cn(
          "flex h-full w-full flex-col transition-all duration-300",
          bgType === 'glass' ? "bg-transparent" : "bg-white text-ink"
        )}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-black/5">
          {!isSearchExpanded ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                {onClose && (
                  <button
                    onClick={onClose}
                    className="mr-1 flex size-8 items-center justify-center rounded-xl bg-purple/10 text-purple transition-all hover:bg-purple hover:text-white"
                  >
                    <ArrowLeft className="size-5" />
                  </button>
                )}
                <div className="flex items-center gap-3 cursor-pointer min-w-0" onClick={() => onShowInfo?.()}>
                  <div className="relative shrink-0">
                    <ChatAvatar src={getChatAvatar()} name={getChatTitle()} className="size-10 rounded-xl" isGroup={chat?.isGroupChat} />
                    {!chat?.isGroupChat && isUserOnline(getOtherUser()?._id || getOtherUser()?.id) && (
                      <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-green-500" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-[18px] font-bold leading-tight flex items-center gap-2 text-ink">
                      {getChatTitle()}
                      {!chat?.isGroupChat && getOtherUser()?.username && (
                        <span className="text-[11px] font-bold text-purple bg-purple/10 px-2 py-0.5 rounded-md hidden md:inline-flex">
                          @{getOtherUser().username}
                        </span>
                      )}
                    </h1>
                    <p className="text-[12px] text-ink-soft">
                      {typing ? (
                        <span className="text-purple animate-pulse">
                          {typingUsername 
                            ? `@${typingUsername} is typing…` 
                            : typingName 
                              ? `${typingName} is typing…` 
                              : 'typing…'}
                        </span>
                      ) : (!chat?.isGroupChat && isUserOnline(getOtherUser()?._id || getOtherUser()?.id)) ? 'Online' : chat?.isGroupChat ? `${chat.users?.length || 0} members` : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4 text-ink-soft shrink-0 flex-nowrap">
                <button onClick={() => setIsSearchExpanded(true)} className="hover:text-purple transition-colors p-1 shrink-0">
                  <Search className="size-5" />
                </button>
                <button onClick={handleVoiceCall} className="hover:text-purple transition-colors shrink-0">
                  <Phone className="size-5" />
                </button>
                <button onClick={handleVideoCall} className="hover:text-purple transition-colors shrink-0">
                  <Video className="size-5" />
                </button>
                <button
                  onClick={() => {
                    setAiSummary(null)
                    onShowInfo?.()
                  }}
                  className={cn("hover:text-purple transition-colors p-1", isInfoOpen && "text-purple")}
                >
                  {isInfoOpen ? <X className="size-5 text-purple" /> : <Info className="size-5" />}
                </button>

                {/* Chat context menu */}
                <div className="relative">
                  <button
                    className="hover:text-purple transition-colors"
                    onClick={e => { e.stopPropagation(); setShowChatMenu(!showChatMenu) }}
                  >
                    <MoreVertical className="size-5" />
                  </button>
                  {showChatMenu && (
                    <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-2xl bg-white shadow-xl border border-black/5 py-1 animate-in fade-in zoom-in-95 duration-150">
                      <button onClick={() => { setAiSummary(null); onShowInfo?.(); setShowChatMenu(false) }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 transition-colors">
                        <Info className="size-4 text-black/40" /> Information
                      </button>
                      <button onClick={handleAiSummary} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 transition-colors">
                        <Sparkles className="size-4 text-black/40" /> AI Summary
                      </button>
                      <button onClick={() => { setIsSearchExpanded(true); setShowChatMenu(false) }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 transition-colors">
                        <Search className="size-4 text-black/40" /> Search in Chat
                      </button>
                      <hr className="my-1 border-black/5" />
                      <button onClick={async () => { await muteChat(chatId); toast.success('Muted'); setShowChatMenu(false) }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 transition-colors">
                        <BellOff className="size-4 text-black/40" /> Mute
                      </button>
                      <button onClick={async () => { await clearChat(chatId); setMessages([]); toast.success('Chat cleared'); setShowChatMenu(false) }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 transition-colors">
                        <EyeOff className="size-4 text-black/40" /> Clear Chat
                      </button>
                      <button
                        onClick={async () => {
                          setShowChatMenu(false)
                          try {
                            const { toggleArchiveChat } = await import('@/lib/api')
                            const myId = currentUser?._id || currentUser?.id || ''
                            const chatObj = chats.find((c: any) => (c._id || c.id) === chatId)
                            const updatedArchivedBy = [...(chatObj?.archivedBy || [])]
                            if (myId && !updatedArchivedBy.includes(myId)) {
                              updatedArchivedBy.push(myId)
                            }
                            updateChatInList(chatId, { archivedBy: updatedArchivedBy })
                            toast.success('Chat archived')
                            if (onClose) onClose()
                            await toggleArchiveChat(chatId)
                          } catch {
                            toast.error('Failed to archive chat')
                          }
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 transition-colors"
                      >
                        <Archive className="size-4 text-black/40" /> Archive Chat
                      </button>
                      <hr className="my-1 border-black/5" />
                      <button onClick={async () => { await deleteChat(chatId); toast.success('Chat deleted'); setShowChatMenu(false) }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="size-4" /> Delete Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <button onClick={() => { setIsSearchExpanded(false); setSearchQuery('') }} className="hover:text-purple transition-colors">
                <ArrowLeft className="size-6" />
              </button>
              <div className="flex-1 relative">
                <input
                  autoFocus
                  type="text"
                  placeholder="Search in this chat…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-purple-soft/40 rounded-2xl px-5 py-3 text-[15px] outline-none focus:ring-2 focus:ring-purple/20"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink">
                    <X className="size-5" />
                  </button>
                )}
              </div>
              {searchQuery && filteredMessages && (
                <span className="text-sm text-black/40 shrink-0">{filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="size-6 animate-spin rounded-full border-2 border-purple border-t-transparent" />
            </div>
          ) : (searchQuery && filteredMessages ? filteredMessages : visibleMessages).length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-20 text-center">
              <div className="size-16 rounded-3xl bg-purple/10 flex items-center justify-center mb-4">
                <Send className="size-8 text-purple/50" />
              </div>
              <p className="text-base font-semibold text-black/30">No messages yet</p>
              <p className="text-sm mt-1 text-black/20">Be the first to say something!</p>
            </div>
          ) : (
            groupedMessages
              .filter(g => !searchQuery || g.messages.some(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase())))
              .map(group => (
                <div key={group.date}>
                  {/* Date separator */}
                  <div className="flex items-center gap-4 my-4">
                    <div className="h-px flex-1 bg-black/5" />
                    <span className="text-xs font-medium px-2 text-black/30">{group.date}</span>
                    <div className="h-px flex-1 bg-black/5" />
                  </div>

                  <div className="space-y-2">
                    {group.messages.map(msg => {
                      const own = isOwn(msg)
                      const senderName = msg.sender?.full_name || msg.sender?.username || 'User'
                      const highlighted = searchQuery && msg.content?.toLowerCase().includes(searchQuery.toLowerCase())

                      return (
                        <div
                          key={msg._id}
                          className={cn("flex items-end gap-2.5 group", own ? "justify-end" : "justify-start")}
                        >
                          {!own && (
                            <div className="cursor-pointer" onClick={() => onOpenProfile?.(msg.sender, true)}>
                              <ChatAvatar src={msg.sender?.avatar} name={senderName} className="size-8 rounded-xl shrink-0 mb-1" />
                            </div>
                          )}

                          <div className="max-w-[65%] relative">
                            {/* Hover actions row */}
                            {!msg.isDeleted && (
                              <div className={cn(
                                "absolute -top-8 hidden group-hover:flex items-center gap-1 rounded-2xl bg-white shadow-lg border border-black/5 px-2 py-1 z-10",
                                own ? "right-0" : "left-0"
                              )}>
                                {EMOJIS.slice(0, 5).map(e => (
                                  <button key={e} onClick={() => handleReact(msg._id, e)} className="hover:scale-125 transition-transform text-sm leading-none">
                                    {e}
                                  </button>
                                ))}
                                <div className="h-4 w-px bg-black/10 mx-0.5" />
                                <button
                                  onClick={ev => { ev.stopPropagation(); setContextMenu({ msgId: msg._id, x: ev.clientX, y: ev.clientY }) }}
                                  className="flex size-6 items-center justify-center rounded-lg hover:bg-black/5"
                                >
                                  <MoreHorizontal className="size-3.5 text-black/50" />
                                </button>
                              </div>
                            )}

                            {editingId === msg._id ? (
                              <div className="flex gap-2">
                                <input
                                  value={editText}
                                  onChange={e => setEditText(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') handleEdit(msg._id); if (e.key === 'Escape') setEditingId(null) }}
                                  className="flex-1 rounded-2xl border border-purple/30 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30"
                                  autoFocus
                                />
                                <button onClick={() => handleEdit(msg._id)} className="rounded-xl bg-purple px-3 text-xs font-semibold text-white">Save</button>
                                <button onClick={() => setEditingId(null)} className="rounded-xl bg-black/5 px-3 text-xs">Cancel</button>
                              </div>
                            ) : (
                              <div
                                className={cn(
                                  "px-4 py-2.5 rounded-2xl text-sm leading-relaxed select-text",
                                  own ? "bg-purple text-white rounded-tr-sm" : "bg-black/5 text-black rounded-tl-sm",
                                  msg.isDeleted && "opacity-50 italic text-black/50 bg-black/3",
                                  highlighted && "ring-2 ring-yellow-400"
                                )}
                                onContextMenu={e => {
                                  e.preventDefault()
                                  if (!msg.isDeleted) setContextMenu({ msgId: msg._id, x: e.clientX, y: e.clientY })
                                }}
                              >
                                {!own && chat?.isGroupChat && !msg.isDeleted && (
                                  <p 
                                    className="text-[12px] font-semibold text-purple mb-1 cursor-pointer hover:underline"
                                    onClick={() => onOpenProfile?.(msg.sender, true)}
                                  >
                                    {senderName}
                                    {msg.sender?.username && (
                                      <span className="text-[10px] text-purple/80 ml-1.5 font-bold">
                                        @{msg.sender.username}
                                      </span>
                                    )}
                                  </p>
                                )}
                                 {msg.message_type === 'voice' ? (
                                   <VoiceBubble msg={msg} own={own} />
                                 ) : msg.message_type === 'image' && (msg.mediaUrl || msg.media_url) ? (
                                   <div
                                     className="p-1.5 rounded-xl border flex flex-col gap-1.5"
                                     style={{
                                       background: own 
                                         ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.08) 100%)' 
                                         : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.4) 100%)',
                                       backdropFilter: 'blur(20px) saturate(180%)',
                                       WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                                       borderColor: own ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.06)',
                                       boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.06)',
                                     }}
                                   >
                                     <img
                                       src={getSecureMediaUrl(msg.mediaUrl || msg.media_url) || undefined}
                                       alt="media"
                                       className="max-w-[280px] max-h-[220px] rounded-lg object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                       onClick={() => {
                                         const allImages = messages
                                           .filter(m => m.message_type === 'image' && (m.mediaUrl || m.media_url))
                                           .map(m => getSecureMediaUrl(m.mediaUrl || m.media_url))
                                           .filter(Boolean) as string[]
                                         const currentUrl = getSecureMediaUrl(msg.mediaUrl || msg.media_url)
                                         const idx = allImages.indexOf(currentUrl || '')
                                         if (idx !== -1) {
                                           setLightboxImageIndex(idx)
                                         }
                                       }}
                                     />
                                     {msg.content && (
                                       <p className="px-1.5 py-1 text-sm leading-normal text-current">
                                         {msg.content}
                                       </p>
                                     )}
                                   </div>
                                 ) : msg.message_type === 'video' && (msg.mediaUrl || msg.media_url) ? (
                                   <div
                                     className="p-1.5 rounded-xl border flex flex-col gap-1.5"
                                     style={{
                                       background: own 
                                         ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.08) 100%)' 
                                         : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.4) 100%)',
                                       backdropFilter: 'blur(20px) saturate(180%)',
                                       WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                                       borderColor: own ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.06)',
                                       boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.06)',
                                     }}
                                   >
                                     <video
                                       src={getSecureMediaUrl(msg.mediaUrl || msg.media_url) || undefined}
                                       controls
                                       className="max-w-[280px] max-h-[220px] rounded-lg object-cover"
                                     />
                                     {msg.content && (
                                       <p className="px-1.5 py-1 text-sm leading-normal text-current">
                                         {msg.content}
                                       </p>
                                     )}
                                   </div>
                                 ) : (msg.message_type === 'file' || msg.message_type === 'document' || (msg.mediaUrl && !msg.message_type)) && (msg.mediaUrl || msg.media_url) ? (
                                   <a
                                     href={getSecureMediaUrl(msg.mediaUrl || msg.media_url) || ''}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className="flex flex-col gap-2 p-3 rounded-xl border bg-white/10 hover:bg-white/20 transition-all text-current select-none"
                                     style={{
                                       borderColor: own ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.06)',
                                     }}
                                   >
                                     <div className="flex items-center gap-3">
                                       <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                                         <Paperclip className="size-5 text-current" />
                                       </div>
                                       <div className="flex-1 min-w-0">
                                         <p className="text-sm font-semibold truncate">
                                           {(msg.mediaUrl || msg.media_url)?.split('/').pop() || 'Attachment'}
                                         </p>
                                         {msg.fileSize && (
                                           <p className="text-xs opacity-75 mt-0.5">
                                             {(msg.fileSize / 1024 / 1024).toFixed(2)} MB
                                           </p>
                                         )}
                                       </div>
                                     </div>
                                     {msg.content && (
                                       <p className="px-1 text-sm leading-normal text-current">
                                         {msg.content}
                                       </p>
                                     )}
                                   </a>
                                 ) : (
                                  <span>
                                    {renderMentionText(msg.content || '')}
                                    {msg.isEdited && <span className="ml-1 text-[10px] opacity-50">(edited)</span>}
                                  </span>
                                )}

                                {/* Reactions — grouped by emoji with live counts. Tap a
                                    chip to toggle your own reaction; the one you added is
                                    highlighted. Title shows the exact count on hover/long-press. */}
                                {(msg.reactions?.length ?? 0) > 0 && (
                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                    {groupReactions(msg.reactions, myId).map((g) => (
                                      <button
                                        key={`${msg._id}-react-${g.emoji}`}
                                        onClick={() => handleReact(msg._id, g.emoji)}
                                        title={`${g.count} ${g.count === 1 ? 'reaction' : 'reactions'}`}
                                        className={cn(
                                          "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs transition-colors cursor-pointer",
                                          g.mine
                                            ? "bg-purple/20 ring-1 ring-purple/40 text-ink"
                                            : "bg-black/5 hover:bg-black/10 text-ink"
                                        )}
                                      >
                                        <span>{g.emoji}</span>
                                        <span className="font-semibold tabular-nums">{g.count}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Meta row */}
                            <div className={cn("flex items-center gap-1 mt-0.5", own ? "justify-end" : "justify-start")}>
                              <span className="text-[10px] text-black/25">{formatTime(msg.createdAt)}</span>
                              {own && !msg.isDeleted && (
                                <div className="flex items-center">
                                  {msg.readBy && msg.readBy.length > 1 ? (
                                    <CheckCheck className="size-3 text-[#34B7F1]" /> // Seen (Blue)
                                  ) : msg.deliveredTo && msg.deliveredTo.length > 0 ? (
                                    <CheckCheck className="size-3 text-black/25" /> // Delivered (Grey)
                                  ) : (
                                    <Check className="size-3 text-black/25" /> // Sent (Single Grey)
                                  )}
                                </div>
                              )}
                              {msg.isPinned && <Pin className="size-2.5 fill-purple text-purple" />}
                            </div>
                          </div>

                          {own && (
                            <ChatAvatar src={currentUser?.avatar} name={currentUser?.full_name || 'Me'} className="size-8 rounded-xl shrink-0 mb-1" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
          )}

          {/* Typing indicator */}
          {typing && (() => {
            const typingUser = chat?.users?.find((u: any) => String(u._id || u.id) === String(typingUserId));
            const avatarSrc = typingUser?.avatar || undefined;
            const displayName = typingUser?.full_name || typingName || 'Someone';
            return (
              <div className="flex items-end gap-2.5">
                <ChatAvatar src={avatarSrc} name={displayName} className="size-8 rounded-xl shrink-0" />
                <div className="rounded-2xl rounded-tl-sm bg-black/5 px-4 py-3 flex flex-col gap-0.5">
                  {chat?.isGroupChat && (
                    <span className="text-[10px] text-ink-soft font-medium">
                      {displayName}
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="size-2 animate-bounce rounded-full bg-black/40" style={{ animationDelay: '0ms' }} />
                    <span className="size-2 animate-bounce rounded-full bg-black/40" style={{ animationDelay: '150ms' }} />
                    <span className="size-2 animate-bounce rounded-full bg-black/40" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            );
          })()}
          <div ref={bottomRef} />
        </div>

        {/* AI Summary Overlay */}
        {(isAiThinking || aiSummary) && (
          <div className="absolute inset-x-6 bottom-24 z-30 animate-in slide-in-from-bottom-4 duration-300">
            <div className="rounded-3xl bg-white p-6 shadow-2xl border border-purple/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-xl bg-purple/10 flex items-center justify-center">
                    <Sparkles className="size-4 text-purple" />
                  </div>
                  <h3 className="font-bold text-ink">AI Conversation Summary</h3>
                </div>
                <button onClick={() => { setIsAiThinking(false); setAiSummary(null) }} className="text-black/20 hover:text-ink">
                  <X className="size-5" />
                </button>
              </div>
              {isAiThinking ? (
                <div className="flex items-center gap-3 py-4">
                  <div className="size-5 animate-spin rounded-full border-2 border-purple border-t-transparent" />
                  <p className="text-sm text-ink-soft animate-pulse">Analyzing conversation context...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-ink/80">{aiSummary}</p>
                  <div className="flex gap-2">
                    <button onClick={() => { setAiSummary(null) }} className="rounded-xl bg-purple px-4 py-2 text-xs font-bold text-white hover:bg-purple/90">Got it</button>
                    <button className="rounded-xl bg-black/5 px-4 py-2 text-xs font-bold text-ink hover:bg-black/10">Copy Summary</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aida unavailable notice */}
        {aidaUnavailable && (
          <div className="absolute inset-x-6 bottom-24 z-20 flex justify-center pb-2">
            <span className="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-ink-soft shadow-lg border border-black/5 backdrop-blur-xl">
              Aida suggestions are unavailable on this workspace
            </span>
          </div>
        )}

        {/* Suggestions Bar */}
        {!aidaUnavailable && aiSuggestions.length > 0 && (
          <div className="absolute inset-x-6 bottom-24 z-20 flex gap-2 overflow-x-auto pb-2 scrollbar-hide animate-in slide-in-from-bottom-2 duration-300">
            {aiSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s)}
                className="shrink-0 rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-purple shadow-lg border border-purple/10 hover:bg-purple hover:text-white transition-all backdrop-blur-xl"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        {recordedAudioUrl ? (
          <div className="mt-auto border-t border-black/5 px-4 pb-4 pt-3">
            <div className="flex items-center justify-between gap-3 rounded-[20px] bg-purple-soft/40 px-4 py-2.5 border border-purple/10">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={togglePlayPreview}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple text-white shadow-bubble shadow-purple/20 transition-all hover:scale-105 active:scale-95"
                  type="button"
                >
                  {isAudioPreviewPlaying ? (
                    <span className="flex items-center gap-[2px] justify-center size-full text-white">
                      <span className="w-1 h-3.5 bg-current animate-pulse" />
                      <span className="w-1 h-3.5 bg-current animate-pulse" style={{ animationDelay: '150ms' }} />
                    </span>
                  ) : (
                    <Play className="size-4 fill-current text-white" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-purple">Voice Note Recorded</p>
                  <p className="text-[11px] text-ink-soft font-mono mt-0.5">{formatDuration(recordedAudioDuration)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={discardRecordedAudio}
                  className="flex size-9 items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 transition-all active:scale-95"
                  title="Discard recording"
                >
                  <Trash2 className="size-5" />
                </button>
                <button
                  disabled={sending}
                  onClick={sendRecordedAudio}
                  className="flex size-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-bubble shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  title="Send voice note"
                >
                  <Send className="size-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-auto px-4 pb-4 pt-3 relative border-t border-black/5">
            {selectedAttachment && (
              <div className="mb-2.5 p-2.5 rounded-[18px] bg-white/80 backdrop-blur-md border border-black/5 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedAttachment.type === 'image' ? (
                    <div className="relative size-12 rounded-xl overflow-hidden border border-black/5 shrink-0">
                      <img src={selectedAttachment.url} alt="preview" className="size-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-purple/10 text-purple border border-purple/5">
                      <Paperclip className="size-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-ink">
                      {selectedAttachment.file.name}
                    </p>
                    <p className="text-xs text-ink-soft font-medium mt-0.5">
                      {(selectedAttachment.file.size / 1024).toFixed(1)} KB • {selectedAttachment.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeSelectedAttachment}
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg hover:bg-black/5 text-ink-soft hover:text-ink transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
            {/* @mention autocomplete dropdown */}
            {mentionQuery !== null && mentionResults.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-2 mx-2 z-40">
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-black/5 bg-white backdrop-blur-xl">
                  <div className="px-3 pt-2 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple/60">Mention a member</span>
                  </div>
                  {mentionResults.map((member: any, idx: number) => (
                    <button
                      key={member._id || member.id}
                      type="button"
                      onClick={() => handleMentionSelect(member)}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-purple/5',
                        idx === mentionIndex && 'bg-purple/5'
                      )}
                    >
                      <ChatAvatar src={member.avatar} name={member.full_name || member.username} className="size-8 rounded-xl shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-ink truncate">{member.full_name || member.username}</p>
                        {member.username && <p className="text-[11px] text-purple font-semibold">@{member.username}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 rounded-[20px] px-4 py-2.5 bg-black/3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-black/40 hover:text-purple transition-colors"
              >
                <Paperclip className="size-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*,audio/*,application/*,text/*"
              />
              <div className="flex-1 min-w-0">
                {isRecording ? (
                  <div className="flex items-center justify-between px-2 py-1 w-full">
                    <div className="flex items-center gap-2">
                      <div className="size-2.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-sm font-bold text-red-500 font-mono">
                        Recording ({formatDuration(recordingDuration)})
                      </span>
                    </div>
                    {/* Cancel Recording */}
                    <button
                      onClick={() => {
                        shouldDiscardRef.current = true
                        stopRecording()
                      }}
                      type="button"
                      className="mr-3 text-black/40 hover:text-red-500 transition-colors flex items-center gap-1 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    ref={inputRef}
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (mentionResults.length > 0 && e.key === 'Tab') {
                        e.preventDefault()
                        handleMentionSelect(mentionResults[mentionIndex])
                      } else if (mentionResults.length > 0 && e.key === 'Escape') {
                        setMentionQuery(null)
                        setMentionResults([])
                      } else if (e.key === 'Enter') {
                        handleSend()
                      }
                    }}
                    placeholder={selectedAttachment ? "Add a caption..." : chat?.isGroupChat ? "Type a message or @ to mention..." : "Type a message..."}
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-[15px] placeholder:text-black/30 text-ink placeholder:text-ink/40"
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-black/40 hover:text-purple transition-colors">
                      <Smile className="size-5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-xl" side="top" align="end">
                    <EmojiPicker
                      onEmojiClick={(emojiData) => setInput(prev => prev + emojiData.emoji)}
                      lazyLoadEmojis={true}
                      theme={EmojiTheme.LIGHT}
                    />
                  </PopoverContent>
                </Popover>

                {(input.trim() || selectedAttachment) ? (
                  <button
                    disabled={sending}
                    onClick={handleSend}
                    className="flex size-9 items-center justify-center rounded-xl bg-purple text-white shadow-bubble shadow-purple/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <Send className="size-5" />
                  </button>
                ) : isRecording ? (
                  <button
                    disabled={sending}
                    onClick={() => {
                      shouldDiscardRef.current = false
                      stopRecording()
                    }}
                    className="flex size-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-bubble shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    title="Stop and preview recording"
                  >
                    <Check className="size-5" />
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="text-black/40 hover:text-purple transition-colors active:scale-95 p-1"
                    title="Record voice message"
                  >
                    <Mic className="size-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Redundant Sidebar block removed. Relying on GroupInfo from Dashboard. */}

      {/* Message Context Menu */}
      {contextMenu && messages.find(m => m._id === contextMenu.msgId) && (
        <div
          className="fixed z-50 w-52 rounded-2xl bg-white shadow-2xl border border-black/5 py-1 overflow-hidden"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 220),
            top: Math.min(contextMenu.y, window.innerHeight - 340),
          }}
          onClick={e => e.stopPropagation()}
        >
          {(() => {
            const msg = messages.find(m => m._id === contextMenu.msgId)
            const own = isOwn(msg)
            return (
              <>
                <div className="px-4 py-2.5 border-b border-black/5">
                  <p className="text-[10px] text-black/30 font-semibold uppercase tracking-wider mb-1.5">React</p>
                  <div className="flex gap-1 flex-wrap">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => handleReact(msg._id, e)} className="hover:scale-125 transition-transform text-lg">{e}</button>
                    ))}
                  </div>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(msg.content || ''); setContextMenu(null); toast.success('Copied!') }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-black/5 transition-colors">
                  <Copy className="size-4 text-slate-600" /> Copy
                </button>
                <button onClick={() => handlePin(msg._id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-black/5 transition-colors">
                  <Pin className="size-4 text-slate-600" /> {msg.isPinned ? 'Unpin' : 'Pin'} Message
                </button>
                {own && !msg.isDeleted && (
                  <button
                    onClick={() => { setEditingId(contextMenu.msgId); setEditText(msg.content || ''); setContextMenu(null) }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-black/5 transition-colors"
                  >
                    <Edit2 className="size-4 text-slate-600" /> Edit
                  </button>
                )}
                <hr className="my-1 border-black/5" />
                <button onClick={() => handleDelete(contextMenu.msgId, false)} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-black/5 transition-colors">
                  <Trash2 className="size-4 text-slate-600" /> Delete for Me
                </button>
                {canDeleteAll(msg) && (
                  <button onClick={() => handleDelete(contextMenu.msgId, true)} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="size-4" /> Delete for Everyone
                  </button>
                )}
              </>
            )
          })()}
        </div>
      )}
      {/* Lightbox Gallery */}
      {lightboxImageIndex !== null && (() => {
        const chatImages = messages
          .filter(m => m.message_type === 'image' && (m.mediaUrl || m.media_url))
          .map(m => getSecureMediaUrl(m.mediaUrl || m.media_url))
          .filter(Boolean) as string[]

        if (chatImages.length === 0 || lightboxImageIndex >= chatImages.length) return null

        return (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)' }}
            onClick={() => setLightboxImageIndex(null)}
          >
            <button
              onClick={() => setLightboxImageIndex(null)}
              className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full text-white"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <X className="size-5" />
            </button>
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-semibold text-white"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              {lightboxImageIndex + 1} / {chatImages.length}
            </div>
            {chatImages.length > 1 && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  setLightboxImageIndex(i => (i! - 1 + chatImages.length) % chatImages.length)
                }}
                className="absolute left-4 flex size-11 items-center justify-center rounded-full text-white transition-all hover:scale-110"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <ChevronLeft className="size-6" />
              </button>
            )}
            <img
              src={chatImages[lightboxImageIndex]}
              onClick={e => e.stopPropagation()}
              className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl animate-in zoom-in-95 duration-200"
              alt={`Chat Image ${lightboxImageIndex + 1}`}
            />
            {chatImages.length > 1 && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  setLightboxImageIndex(i => (i! + 1) % chatImages.length)
                }}
                className="absolute right-4 flex size-11 items-center justify-center rounded-full text-white transition-all hover:scale-110"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <ChevronRight className="size-6" />
              </button>
            )}
            {chatImages.length > 1 && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto px-2 pb-1 scrollbar-hide">
                {chatImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={e => {
                      e.stopPropagation()
                      setLightboxImageIndex(i)
                    }}
                    className={cn(
                      'shrink-0 size-12 rounded-xl overflow-hidden border-2 transition-all',
                      i === lightboxImageIndex
                        ? 'border-white scale-110'
                        : 'border-white/20 opacity-60 hover:opacity-90'
                    )}
                  >
                    <img src={img} className="size-full object-cover" alt={`thumb-${i}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
