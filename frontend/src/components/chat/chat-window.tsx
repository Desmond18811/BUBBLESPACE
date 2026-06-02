import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, Phone, MoreVertical, Paperclip, Mic, Send, Video, Info,
  Sparkles, Archive, ArrowLeft, X, Check, CheckCheck, Edit2, Trash2,
  Copy, Pin, Play, Smile, BellOff, EyeOff, Forward, MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSecureMediaUrl } from '@/lib/utils'
import { ChatAvatar } from '@/components/chat/chat-avatar'
import { useSocket } from '@/contexts/AppContext'
import {
  fetchMessages,
  sendTextMessage,
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
  const { socket, startCall } = useSocket()
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
  const suggestDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const shouldDiscardRef = useRef(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevChatId = useRef<string | null>(null)

  // Fetch messages when chat changes
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
    // onShowInfo sidebar reset handled by Dashboard/Prop update if desired, 
    // but here we just ensure we call it if we want it closed on chat change.
    if (isInfoOpen) onShowInfo?.()

    fetchMessages(chatId)
      .then(res => setMessages(res?.messages || res?.data || []))
      .catch(err => toast.error('Could not load messages'))
      .finally(() => setLoading(false))

    markMessagesRead(chatId).catch(() => { })

    if (prevChatId.current) socket?.emit('leave_room', prevChatId.current)
    socket?.emit('join_room', chatId)
    prevChatId.current = chatId

    // Trigger initial AI suggestions if input is empty
    handleInputChange('')

    return () => {
      socket?.emit('leave_room', chatId)
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
        // 1. Exact ID match check
        if (prev.find(p => p._id === m._id)) return prev

        // 2. Optimistic match check: find temp message with same content from same sender
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
            return prev.map(p => p._id === tempMatch._id ? m : p)
          }
        }

        return [...prev, m]
      })
      markMessagesRead(chatId).catch(() => { })
    }

    const onMsgUpdated = (msg: any) => {
      const m = msg?.data || msg
      setMessages(prev => prev.map(p => p._id === m._id ? { ...p, ...m } : p))
    }

    const onMsgDeleted = ({ messageId }: any) => {
      setMessages(prev => prev.map(p =>
        p._id === messageId ? { ...p, isDeleted: true, content: 'This message was deleted' } : p
      ))
    }

    const onMsgReaction = (data: any) => {
      setMessages(prev => prev.map(p => p._id === data?.messageId ? { ...p, reactions: data.reactions } : p))
    }

    const onTypingStart = ({ fromUserId, chatId: cid }: any) => {
      if (cid === chatId && fromUserId !== myId) {
        setTyping(true)
        setTypingUserId(fromUserId)
      }
    }

    const onTypingStop = ({ chatId: cid }: any) => {
      if (cid === chatId) { setTyping(false); setTypingUserId(null) }
    }

    socket.on('new_message', onNewMsg)
    socket.on('message_updated', onMsgUpdated)
    socket.on('message_deleted', onMsgDeleted)
    socket.on('message_reaction', onMsgReaction)
    socket.on('typing_start', onTypingStart)
    socket.on('typing_stop', onTypingStop)

    return () => {
      socket.off('new_message', onNewMsg)
      socket.off('message_updated', onMsgUpdated)
      socket.off('message_deleted', onMsgDeleted)
      socket.off('message_reaction', onMsgReaction)
      socket.off('typing_start', onTypingStart)
      socket.off('typing_stop', onTypingStop)
    }
  }, [socket, chatId, myId])

  const emitTyping = useCallback((isTyping: boolean) => {
    const otherUser = chat?.users?.find((u: any) => (u._id || u.id) !== myId)
    const toUserId = otherUser?._id || otherUser?.id
    if (!toUserId) return
    socket?.emit(isTyping ? 'typing_start' : 'typing_stop', { toUserId, chatId })
  }, [socket, chatId, chat, myId])

  const handleInputChange = (val: string) => {
    setInput(val)
    if (!socket || !chatId) return

    // Emit socket typing
    socket.emit('typing', { chatId, userId: myId })
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      socket.emit('stop_typing', { chatId, userId: myId })
    }, 2000)

    // AI Writing Suggestions
    if (suggestDebounce.current) clearTimeout(suggestDebounce.current)

    // If empty, fetch "start" suggestions
    const query = val.trim() || "Hi"

    suggestDebounce.current = setTimeout(async () => {
      if (!chatId) return
      setIsAiSuggesting(true)
      try {
        const res = await getAidaWritingSuggestions(query, chatId)
        setAiSuggestions(res.suggestions || [])
      } catch (err) {
        console.error('Failed to get AI suggestions:', err)
      } finally {
        setIsAiSuggesting(false)
      }
    }, val.trim().length > 0 ? 800 : 200)
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

        // Use sendTextMessage but it actually handles files too if renamed or similar
        // Better: create a specialized sendMediaMessage or use existing sendMessage API
        try {
          setSending(true)
          const formData = new FormData()
          formData.append('chatId', chatId)
          formData.append('file', file)
          formData.append('message_type', 'voice')

          const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1'
          await fetch(`${API_URL}/message`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: formData
          })
          toast.success('Voice message sent')
        } catch (err) {
          toast.error('Failed to send voice message')
        } finally {
          setSending(false)
        }

        stream.getTracks().forEach(t => t.stop())
      }

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

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    const tempId = `temp-${Date.now()}`
    const optimistic = {
      _id: tempId,
      content: input,
      sender: { _id: myId, full_name: currentUser?.full_name, avatar: currentUser?.avatar },
      createdAt: new Date().toISOString(),
      message_type: 'text',
    }
    setMessages(prev => [...prev, optimistic])
    const sent = input
    setInput('')
    emitTyping(false)

    try {
      const res = await sendTextMessage(chatId, sent)
      const data = res?.data || res
      setMessages(prev => prev.map(m => m._id === tempId ? { ...m, ...data, _id: data._id || tempId } : m))
    } catch {
      toast.error('Message failed to send')
      setMessages(prev => prev.filter(m => m._id !== tempId))
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

  // Group messages by date
  const groupedMessages: { date: string; messages: any[] }[] = []
  messages.forEach(msg => {
    const date = formatDate(msg.createdAt)
    const last = groupedMessages[groupedMessages.length - 1]
    if (last && last.date === date) last.messages.push(msg)
    else groupedMessages.push({ date, messages: [msg] })
  })

  const filteredMessages = searchQuery
    ? messages.filter(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : null

  return (
    <div className="flex h-full w-full overflow-hidden" onClick={() => { setContextMenu(null); setShowChatMenu(false) }}>
      <div
        className="flex h-full w-full flex-col bg-white transition-all duration-300"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-black/5 px-6 py-4">
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
                <div className="relative shrink-0">
                  <ChatAvatar src={getChatAvatar()} name={getChatTitle()} className="size-10 rounded-xl" />
                  {getOtherUser()?.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-green-500" />
                  )}
                </div>
                <div>
                  <h1 className="text-[18px] font-bold leading-tight text-ink">{getChatTitle()}</h1>
                  <p className="text-[12px] text-ink-soft">
                    {typing ? <span className="text-purple animate-pulse">typing…</span>
                      : getOtherUser()?.isOnline ? 'Online' : chat?.isGroupChat ? `${chat.users?.length || 0} members` : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-ink-soft">
                <button onClick={() => setIsSearchExpanded(true)} className="hover:text-purple transition-colors p-1">
                  <Search className="size-5" />
                </button>
                <button onClick={handleVoiceCall} className="hover:text-purple transition-colors">
                  <Phone className="size-5" />
                </button>
                <button onClick={handleVideoCall} className="hover:text-purple transition-colors">
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
                      <button className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 transition-colors">
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
          ) : (searchQuery && filteredMessages ? filteredMessages : messages).length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-20 text-center">
              <div className="size-16 rounded-3xl bg-purple/10 flex items-center justify-center mb-4">
                <Send className="size-8 text-purple/50" />
              </div>
              <p className="text-base font-semibold text-black/30">No messages yet</p>
              <p className="text-sm text-black/20 mt-1">Be the first to say something!</p>
            </div>
          ) : (
            groupedMessages
              .filter(g => !searchQuery || g.messages.some(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase())))
              .map(group => (
                <div key={group.date}>
                  {/* Date separator */}
                  <div className="flex items-center gap-4 my-4">
                    <div className="h-px flex-1 bg-black/5" />
                    <span className="text-xs text-black/30 font-medium px-2">{group.date}</span>
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
                            <ChatAvatar src={msg.sender?.avatar} name={senderName} className="size-8 rounded-xl shrink-0 mb-1" />
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
                                  <p className="text-[12px] font-semibold text-purple mb-1">{senderName}</p>
                                )}
                                {msg.message_type === 'voice' ? (
                                  <div className="flex items-center gap-3 min-w-[200px]">
                                    <button className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20">
                                      <Play className={cn("size-4 fill-current", own ? "text-white" : "text-purple")} />
                                    </button>
                                    <div className="flex flex-1 items-center gap-[2px]">
                                      {waveform.map((h, i) => (
                                        <span key={`${msg._id}-wave-${i}`} className={cn("w-[2px] rounded-full", own ? "bg-white/70" : "bg-purple/40")} style={{ height: `${h}px` }} />
                                      ))}
                                    </div>
                                    <span className="text-xs opacity-70">{msg.duration || '0:00'}</span>
                                  </div>
                                ) : msg.message_type === 'image' && (msg.mediaUrl || msg.media_url) ? (
                                  <img
                                    src={getSecureMediaUrl(msg.mediaUrl || msg.media_url) || ''}
                                    alt="media"
                                    className="max-w-[280px] rounded-xl object-cover cursor-pointer hover:opacity-90"
                                    onClick={() => onShowInfo?.()} // Or a dedicated lightbox trigger
                                  />
                                ) : (
                                  <span>
                                    {msg.content}
                                    {msg.isEdited && <span className="ml-1 text-[10px] opacity-50">(edited)</span>}
                                  </span>
                                )}

                                {/* Reactions */}
                                {(msg.reactions?.length ?? 0) > 0 && (
                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                    {msg.reactions!.map((r: any, idx: number) => (
                                      <button
                                        key={`${msg._id}-react-${r.emoji}-${idx}`}
                                        onClick={() => handleReact(msg._id, r.emoji)}
                                        className="flex items-center gap-0.5 rounded-full bg-white/15 px-2 py-0.5 text-xs hover:bg-white/25 transition-colors"
                                      >
                                        {r.emoji} {r.users?.length || 0}
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
          {typing && (
            <div className="flex items-end gap-2.5">
              <ChatAvatar src={getOtherUser()?.avatar} name={getOtherUser()?.full_name || 'User'} className="size-8 rounded-xl shrink-0" />
              <div className="rounded-2xl rounded-tl-sm bg-black/5 px-4 py-3 flex items-center gap-1">
                <span className="size-2 animate-bounce rounded-full bg-black/40" style={{ animationDelay: '0ms' }} />
                <span className="size-2 animate-bounce rounded-full bg-black/40" style={{ animationDelay: '150ms' }} />
                <span className="size-2 animate-bounce rounded-full bg-black/40" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
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

        {/* Suggestions Bar */}
        {aiSuggestions.length > 0 && (
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
        <div className="mt-auto border-t border-black/5 px-4 pb-4 pt-3">
          <div className="flex items-center gap-3 rounded-[20px] bg-black/3 px-4 py-2.5">
            <button className="text-black/40 hover:text-purple transition-colors">
              <Paperclip className="size-5" />
            </button>
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
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-[15px] placeholder:text-black/30"
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

              {input.trim() ? (
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
                  title="Send recording"
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
                <button onClick={() => { navigator.clipboard.writeText(msg.content || ''); setContextMenu(null); toast.success('Copied!') }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 transition-colors">
                  <Copy className="size-4 text-black/40" /> Copy
                </button>
                <button onClick={() => handlePin(msg._id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 transition-colors">
                  <Pin className="size-4 text-black/40" /> {msg.isPinned ? 'Unpin' : 'Pin'} Message
                </button>
                {own && !msg.isDeleted && (
                  <button
                    onClick={() => { setEditingId(contextMenu.msgId); setEditText(msg.content || ''); setContextMenu(null) }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 transition-colors"
                  >
                    <Edit2 className="size-4 text-black/40" /> Edit
                  </button>
                )}
                <hr className="my-1 border-black/5" />
                <button onClick={() => handleDelete(contextMenu.msgId, false)} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-black/60 hover:bg-black/5 transition-colors">
                  <Trash2 className="size-4 text-black/40" /> Delete for Me
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
    </div>
  )
}
