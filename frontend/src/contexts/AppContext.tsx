import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { initSocket, getSocket, disconnectSocket } from '@/lib/socket'
import { fetchAllUserChats, fetchTasks, getContactNicknames, setContactNickname } from '@/lib/api'
import { readCache, writeCache, CACHE_KEYS } from '@/lib/webCache'
import { Phone } from 'lucide-react'
import { LiveKitMeetingModal } from '@/components/chat/LiveKitMeetingModal'
import { RingtonePlayer } from '@/lib/ringtone'
import { toast } from 'sonner'

// ─── Socket Context ───────────────────────────────────────────────────────────

export type CallState = 
  | { status: 'idle' }
  | { status: 'calling_out'; toUserId: string; targetName: string; targetAvatar?: string; roomId: string; type: 'voice' | 'video' }
  | { status: 'calling_in'; fromUserId: string; callerName: string; callerAvatar?: string; roomId: string; type: 'voice' | 'video' }
  | { status: 'in_call'; roomId: string; type: 'voice' | 'video' };

interface SocketContextValue {
    socket: ReturnType<typeof getSocket>
    connected: boolean
    startCall: (toUserId: string, targetName: string, targetAvatar?: string, type?: 'voice' | 'video') => void
    callState: CallState
    endCall: () => void
    /** Single source of truth for presence — set of userIds currently online. */
    onlineUsers: Set<string>
    /** Convenience: is this userId currently online? */
    isUserOnline: (userId?: string | null) => boolean
}

const SocketContext = createContext<SocketContextValue>({
    socket: null,
    connected: false,
    startCall: () => {},
    callState: { status: 'idle' },
    endCall: () => {},
    onlineUsers: new Set(),
    isUserOnline: () => false,
})

export const useSocket = () => useContext(SocketContext)

// ─── Chat Context ─────────────────────────────────────────────────────────────

interface ChatContextValue {
    chats: any[]
    loadingChats: boolean
    refreshChats: () => Promise<void>
    updateChatInList: (chatId: string, updates: Partial<any>) => void
    removeChatFromList: (chatId: string) => void
}

const ChatContext = createContext<ChatContextValue>({
    chats: [],
    loadingChats: false,
    refreshChats: async () => { },
    updateChatInList: () => { },
    removeChatFromList: () => { },
})

export const useChats = () => useContext(ChatContext)

// ─── Nickname Context ─────────────────────────────────────────────────────────
// Private per-viewer aliases for other users (e.g. "saved as" names in groups).
// Resolution order is always: my saved nickname for them > their full_name.

interface NicknameContextValue {
    nicknames: Record<string, string>
    /** Resolve the name I should see for a user: my nickname for them, else their full_name/username. */
    getDisplayName: (u: any) => string
    saveNickname: (contactId: string, nickname: string) => Promise<void>
}

const NicknameContext = createContext<NicknameContextValue>({
    nicknames: {},
    getDisplayName: (u: any) => u?.full_name || u?.name || u?.username || 'Unknown',
    saveNickname: async () => {},
})

export const useNicknames = () => useContext(NicknameContext)

// ─── App Context Provider ─────────────────────────────────────────────────────

interface AppProviderProps {
    children: React.ReactNode
    user: any
}

export function AppProvider({ children, user }: AppProviderProps) {
    const userId = user?.id || user?._id
    const queryClient = useQueryClient()
    const [connected, setConnected] = useState(false)
    // Seed from the persisted cache so a cold reload paints the chat list instantly,
    // then refreshChats revalidates from the network.
    const [chats, setChats] = useState<any[]>(() => readCache<any[]>(userId, CACHE_KEYS.chats) || [])
    const [loadingChats, setLoadingChats] = useState(false)
    // Central presence map — the one place online status lives. Seeded by the
    // server's presence_snapshot on connect, updated by user_status_change deltas.
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
    const socketRef = useRef<ReturnType<typeof getSocket>>(null)

    // Call state & ringtone refs
    const [callState, setCallState] = useState<CallState>({ status: 'idle' })
    const ringtoneRef = useRef<RingtonePlayer | null>(null)
    const timeoutRef = useRef<any>(null)

    useEffect(() => {
        ringtoneRef.current = new RingtonePlayer()
        return () => {
            ringtoneRef.current?.stop()
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [])

    // Priority Meeting Auto-Start Poller
    useEffect(() => {
        if (!user) return

        const checkUpcomingMeetings = async () => {
            try {
                // Fetch user's scheduled meetings
                const res = await fetchTasks({ type: 'meeting', status: 'todo' })
                const meetings = res.tasks || res.data?.tasks || res.data || []
                
                const now = new Date()
                
                for (const meet of meetings) {
                    if (!meet.start_time || !meet.end_time) continue
                    
                    const startTime = new Date(meet.start_time)
                    const endTime = new Date(meet.end_time)
                    
                    // If the current time has reached the scheduled meeting start time (within its active block),
                    // and we are currently idle, trigger the call automatically
                    if (now >= startTime && now < endTime && callState.status === 'idle') {
                        const dismissedKey = `dismissed-meet-${meet._id}`
                        if (localStorage.getItem(dismissedKey)) continue

                        const roomId = `meet-${meet._id}`
                        toast.info(`🔔 Meeting starting now: "${meet.title}"`)
                        
                        // Automatically transition to call mode
                        setCallState({
                            status: 'in_call',
                            roomId: roomId,
                            type: 'video'
                        })
                        
                        localStorage.setItem(dismissedKey, 'true')
                        break
                    }
                }
            } catch (err) {
                console.error('Error in background meeting poller:', err)
            }
        }

        const interval = setInterval(checkUpcomingMeetings, 20000)
        const timer = setTimeout(checkUpcomingMeetings, 3000)

        return () => {
            clearInterval(interval)
            clearTimeout(timer)
        }
    }, [user, callState.status])

    const endCall = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        ringtoneRef.current?.stop()

        setCallState(prev => {
            if (prev.status === 'calling_out') {
                socketRef.current?.emit('call_reject', { toUserId: prev.toUserId })
            } else if (prev.status === 'calling_in') {
                socketRef.current?.emit('call_reject', { toUserId: prev.fromUserId })
            }
            return { status: 'idle' }
        })
    }, [])

    // Stable identity is CRITICAL: this is passed to <LiveKitMeetingModal onClose>.
    // An inline arrow here changes every AppContext render (e.g. on socket connect/
    // disconnect → setConnected), which re-ran the modal's join_room effect, whose
    // cleanup emits 'call_end' — tearing the call down on every reconnect blip.
    const handleCallClose = useCallback(() => setCallState({ status: 'idle' }), [])

    const declineCall = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        ringtoneRef.current?.stop()
        setCallState(prev => {
            if (prev.status === 'calling_in') {
                socketRef.current?.emit('call_reject', { toUserId: prev.fromUserId })
            }
            return { status: 'idle' }
        })
    }, [])

    const acceptCall = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        ringtoneRef.current?.stop()
        setCallState(prev => {
            if (prev.status === 'calling_in') {
                socketRef.current?.emit('call_answer', { toUserId: prev.fromUserId, roomId: prev.roomId })
                return {
                    status: 'in_call',
                    roomId: prev.roomId,
                    type: prev.type
                }
            }
            return prev
        })
    }, [])

    const startCall = useCallback((toUserId: string, targetName: string, targetAvatar?: string, type: 'voice' | 'video' = 'voice') => {
        const roomId = `bubble-${Math.random().toString(36).slice(2, 11)}`
        setCallState({
            status: 'calling_out',
            toUserId,
            targetName,
            targetAvatar,
            roomId,
            type
        })
        ringtoneRef.current?.startRinging('outgoing')
        
        socketRef.current?.emit('call_offer', {
            toUserId,
            roomId,
            callerName: user?.full_name || user?.username || 'Colleague',
            callerAvatar: user?.avatar,
            type
        })

        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
            toast.error('No answer')
            socketRef.current?.emit('call_reject', { toUserId })
            ringtoneRef.current?.stop()
            setCallState({ status: 'idle' })
        }, 30000)
    }, [user])

    // Initialize socket when user is available
    useEffect(() => {
        const token = localStorage.getItem('access_token')
        if (!token || !user) return

        const sock = initSocket(token)
        socketRef.current = sock

        sock?.on('connect', () => setConnected(true))
        sock?.on('disconnect', () => setConnected(false))

        // Listen for real-time chat list updates
        sock?.on('new_message', (msg: any) => {
            const m = msg?.data || msg
            const chatId = typeof m?.chatId === 'object'
                ? (m.chatId?._id || m.chatId?.id)
                : (typeof m?.chat === 'object' ? (m.chat?._id || m.chat?.id) : (m?.chatId || m?.chat))

            if (!chatId) return

            const isSystem = m?.message_type === 'system' || m?.is_announcement === true;
            if (isSystem) return; // Ignore system/announcement messages for list update

            // ── NEW: ignore Aida bot messages (e.g. meeting transcripts) in group chats ──
            const isBotMsg = !!(m?.senderIsBot || m?.sender?.is_bot || m?.sender?.username?.toLowerCase() === 'aida');

            setChats(prev => {
                const idx = prev.findIndex(c => (c._id || c.id) === String(chatId))
                if (idx === -1) return prev

                // Don't surface bot messages as the latest message in group chats
                if (isBotMsg && prev[idx]?.isGroupChat) return prev
                const updated = [...prev]
                // Build a human-friendly preview even for media messages
                let preview = m?.content
                if (!preview) {
                    if (m?.message_type === 'image') preview = '📷 Image'
                    else if (m?.message_type === 'voice') preview = '🎤 Voice message'
                    else if (m?.message_type === 'video') preview = '🎥 Video'
                    else if (m?.message_type === 'file' || m?.message_type === 'document') preview = '📎 Attachment'
                    else preview = '💬 New message'
                }
                updated[idx] = {
                    ...updated[idx],
                    latestMessage: {
                        id: m._id || m.id,
                        content: preview,
                        message_type: m?.message_type || 'text',
                        sender: m.sender ? {
                            id: m.sender.id || m.sender._id || m.sender,
                            full_name: m.sender.full_name || null,
                            avatar: m.sender.avatar || null
                        } : null,
                        sentAt: m.createdAt || new Date().toISOString(),
                        readBy: m.readBy || [],
                        isRead: m.isRead ?? false
                    },
                    updatedAt: new Date().toISOString()
                }
                // Move to top
                const chat = updated.splice(idx, 1)[0]
                return [chat, ...updated]
            })
        })

        // Seed the full online set when the socket connects.
        sock?.on('presence_snapshot', ({ online }: { online: string[] }) => {
            setOnlineUsers(new Set((online || []).map(String)))
        })

        sock?.on('user_status_change', ({ userId, isOnline }: { userId: string, isOnline: boolean }) => {
            // Update the central presence set (source of truth for every surface).
            setOnlineUsers(prev => {
                const next = new Set(prev)
                if (isOnline) next.add(String(userId)); else next.delete(String(userId))
                return next
            })
            // Keep the chat-list mirror in sync for components still reading c.isOnline.
            setChats(prev => prev.map(c => {
                const isGroup = c.isGroupChat
                if (isGroup) return c
                const other = c.users?.find((u: any) => (u._id || u.id) === userId)
                if (other) return { ...c, isOnline }
                return c
            }))
        })

        sock?.on('new_chat', (chat: any) => {
            const c = chat?.data || chat
            setChats(prev => {
                const exists = prev.some(existing => (existing._id || existing.id) === (c._id || c.id))
                if (exists) return prev
                return [c, ...prev]
            })
        })

        sock?.on('chat_deleted', ({ chatId }: { chatId: string }) => {
            setChats(prev => prev.filter(c => (c._id !== chatId && c.id !== chatId)))
        })

        sock?.on('messages_read', ({ chatId, userId }: { chatId: string, userId: string }) => {
            setChats(prev => prev.map(c => {
                const cid = c._id || c.id
                if (String(cid) === String(chatId) && c.latestMessage) {
                    const senderId = c.latestMessage.sender?.id || c.latestMessage.sender?._id || c.latestMessage.sender
                    if (String(senderId) !== String(userId)) {
                        const readBy = Array.isArray(c.latestMessage.readBy) ? [...c.latestMessage.readBy] : []
                        const exists = readBy.some((r: any) => String(r.id || r._id || r) === String(userId))
                        if (!exists) {
                            readBy.push(userId)
                        }
                        return {
                            ...c,
                            latestMessage: {
                                ...c.latestMessage,
                                readBy,
                                isRead: true
                            }
                        }
                    }
                }
                return c
            }))
        })

        sock?.on('message_reaction', ({ messageId, chatId, reactions }: { messageId: string, chatId: string, reactions: any[] }) => {
            setChats(prev => prev.map(c => {
                const cid = c._id || c.id
                if (String(cid) === String(chatId) && c.latestMessage && (c.latestMessage._id === messageId || c.latestMessage.id === messageId)) {
                    return {
                        ...c,
                        latestMessage: {
                            ...c.latestMessage,
                            reactions
                        }
                    }
                }
                return c
            }))
        })

        sock?.on('message_deleted', ({ messageId, chatId }: { messageId: string, chatId: string }) => {
            if (!messageId) return
            setChats(prev => prev.map(c => {
                const cid = c._id || c.id
                if (String(cid) !== String(chatId)) return c
                const latestId = c.latestMessage?._id || c.latestMessage?.id
                if (c.latestMessage && String(latestId) === String(messageId)) {
                    return {
                        ...c,
                        latestMessage: {
                            ...c.latestMessage,
                            content: '🚫 This message was deleted',
                            message_type: 'text'
                        }
                    }
                }
                return c
            }))
        })

        sock?.on('incoming_call', (data: { fromUserId: string; roomId: string; callerName?: string; callerAvatar?: string; type?: 'voice' | 'video' }) => {
            setCallState(prev => {
                if (prev.status !== 'idle') {
                    sock?.emit('call_reject', { toUserId: data.fromUserId })
                    return prev
                }
                
                ringtoneRef.current?.startRinging('incoming')
                
                if (timeoutRef.current) clearTimeout(timeoutRef.current)
                timeoutRef.current = setTimeout(() => {
                    sock?.emit('call_reject', { toUserId: data.fromUserId })
                    ringtoneRef.current?.stop()
                    setCallState({ status: 'idle' })
                }, 30000)

                return {
                    status: 'calling_in',
                    fromUserId: data.fromUserId,
                    callerName: data.callerName || 'Colleague',
                    callerAvatar: data.callerAvatar,
                    roomId: data.roomId,
                    type: data.type || 'voice'
                }
            })
        })

        sock?.on('call_accepted', (data: { byUserId: string; roomId: string }) => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            ringtoneRef.current?.stop()
            setCallState(prev => {
                if (prev.status === 'calling_out') {
                    return {
                        status: 'in_call',
                        roomId: data.roomId,
                        type: prev.type
                    }
                }
                return prev
            })
        })

        sock?.on('call_rejected', () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            ringtoneRef.current?.stop()
            toast.error('Call declined or recipient is busy')
            setCallState({ status: 'idle' })
        })

        sock?.on('meeting_ended', (data: { roomId: string }) => {
            // Clear the sidebar "active call" pulse immediately instead of waiting for
            // the next 10s poll to notice the meeting flipped to 'ended'.
            queryClient.invalidateQueries({ queryKey: ['activeMeetings'] })
            setCallState(prev => {
                if (prev.status === 'in_call' && prev.roomId === data.roomId) {
                    toast.info('Meeting has been ended')
                    return { status: 'idle' }
                }
                return prev
            })
        })

        // Action item is still pending past its follow-up window — nudge the assignee
        // in realtime so the loop visibly closes (F3).
        sock?.on('task_followup', (data: { taskId: string; title: string; meetingTitle?: string; overdue?: boolean }) => {
            toast(data.overdue ? '⏰ Overdue action item' : '📌 Action item reminder', {
                description: `${data.meetingTitle ? `From "${data.meetingTitle}": ` : ''}${data.title}`,
            })
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
        })

        // A meeting action item's status/assignee changed elsewhere — refresh views.
        sock?.on('action_item_updated', () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
        })

        // The backend fans out `call_ended` on ANY hangup/reject (including the peer
        // disconnecting, navigating away, or closing the tab). Without handling it,
        // the surviving party stays stuck in 'in_call'/'calling_*' forever and can
        // never start or receive another call. Reset to idle on any matching end.
        sock?.on('call_ended', (data: { roomId?: string; byUserId?: string }) => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            ringtoneRef.current?.stop()
            queryClient.invalidateQueries({ queryKey: ['activeMeetings'] })
            setCallState(prev => {
                if (prev.status === 'idle') return prev
                // Only ignore if it's an unrelated room we can identify; otherwise reset.
                if (data.roomId && 'roomId' in prev && prev.roomId && prev.roomId !== data.roomId) return prev
                return { status: 'idle' }
            })
        })

        return () => {
            disconnectSocket()
            setConnected(false)
            sock?.off('incoming_call')
            sock?.off('call_accepted')
            sock?.off('call_rejected')
            sock?.off('new_message')
            sock?.off('user_status_change')
            sock?.off('presence_snapshot')
            sock?.off('new_chat')
            sock?.off('chat_deleted')
            sock?.off('messages_read')
            sock?.off('message_reaction')
            sock?.off('message_deleted')
            sock?.off('meeting_ended')
            sock?.off('call_ended')
            sock?.off('task_followup')
            sock?.off('action_item_updated')
        }
    }, [user?.id, user?._id])

    const refreshChats = useCallback(async () => {
        setLoadingChats(true)
        try {
            const res = await fetchAllUserChats()
            const next = res?.conversations || res?.data || []
            setChats(next)
            writeCache(userId, CACHE_KEYS.chats, next)
        } catch (err) {
            console.error('Failed to load chats:', err)
        } finally {
            setLoadingChats(false)
        }
    }, [userId])

    // Load chats on mount
    useEffect(() => {
        if (user) refreshChats()
    }, [user, refreshChats])

    const updateChatInList = useCallback((chatId: string, updates: Partial<any>) => {
        setChats(prev => prev.map(c => (c._id === chatId || c.id === chatId) ? { ...c, ...updates } : c))
    }, [])

    const removeChatFromList = useCallback((chatId: string) => {
        setChats(prev => prev.filter(c => c._id !== chatId && c.id !== chatId))
    }, [])

    const isUserOnline = useCallback((id?: string | null) => !!id && onlineUsers.has(String(id)), [onlineUsers])

    // ─── Nicknames ──────────────────────────────────────────────────────────
    const [nicknames, setNicknames] = useState<Record<string, string>>({})

    useEffect(() => {
        if (!user) return
        getContactNicknames()
            .then((res: any) => setNicknames(res?.data || {}))
            .catch(() => {})
    }, [userId])

    const getDisplayName = useCallback((u: any) => {
        const id = u?._id || u?.id
        return (id && nicknames[id]) || u?.full_name || u?.name || u?.username || 'Unknown'
    }, [nicknames])

    const saveNickname = useCallback(async (contactId: string, nickname: string) => {
        const res: any = await setContactNickname(contactId, nickname)
        setNicknames(res?.data || {})
    }, [])

    return (
        <SocketContext.Provider value={{ socket: socketRef.current, connected, startCall, callState, endCall, onlineUsers, isUserOnline }}>
            <ChatContext.Provider value={{ chats, loadingChats, refreshChats, updateChatInList, removeChatFromList }}>
            <NicknameContext.Provider value={{ nicknames, getDisplayName, saveNickname }}>
                {children}

                {/* Outgoing Call Overlay */}
                {callState.status === 'calling_out' && (
                  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="flex w-full max-w-sm flex-col items-center gap-6 p-8 text-center"
                         style={{
                           background: 'rgba(255, 255, 255, 0.1)',
                           border: '1px solid rgba(255, 255, 255, 0.2)',
                           boxShadow: '0 32px 80px rgba(108, 92, 231, 0.25)',
                           borderRadius: '32px'
                         }}>
                      <div className="relative">
                        <div className="absolute -inset-4 animate-ping rounded-full bg-purple/30" />
                        <img
                          src={callState.targetAvatar || '/placeholder.svg'}
                          alt={callState.targetName}
                          className="relative size-28 rounded-[36px] border-4 border-purple/40 object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{callState.targetName}</h3>
                        <p className="mt-2 text-purple-200 animate-pulse text-sm font-semibold tracking-wider uppercase">
                          Calling ({callState.type === 'voice' ? 'Voice' : 'Video'})...
                        </p>
                      </div>
                      <button
                        onClick={endCall}
                        className="flex size-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition-transform hover:scale-110 active:scale-95 mt-4"
                      >
                        <Phone className="size-6 rotate-135" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Incoming Call Overlay */}
                {callState.status === 'calling_in' && (
                  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="flex w-full max-w-sm flex-col items-center gap-6 p-8 text-center"
                         style={{
                           background: 'rgba(255, 255, 255, 0.1)',
                           border: '1px solid rgba(255, 255, 255, 0.2)',
                           boxShadow: '0 32px 80px rgba(108, 92, 231, 0.25)',
                           borderRadius: '32px'
                         }}>
                      <div className="relative">
                        <div className="absolute -inset-4 animate-ping rounded-full bg-purple/30" />
                        <img
                          src={callState.callerAvatar || '/placeholder.svg'}
                          alt={callState.callerName}
                          className="relative size-28 rounded-[36px] border-4 border-purple/40 object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{callState.callerName}</h3>
                        <p className="mt-2 text-purple-200 animate-pulse text-sm font-semibold tracking-wider uppercase">
                          Incoming {callState.type === 'voice' ? 'Voice' : 'Video'} Call...
                        </p>
                      </div>
                      <div className="flex items-center gap-6 mt-4">
                        <button
                          onClick={declineCall}
                          className="flex size-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition-transform hover:scale-110 active:scale-95"
                        >
                          <Phone className="size-6 rotate-135" />
                        </button>
                        <button
                          onClick={acceptCall}
                          className="flex size-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-transform hover:scale-110 active:scale-95"
                        >
                          <Phone className="size-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* LiveKit Call Modal */}
                {callState.status === 'in_call' && (
                  <LiveKitMeetingModal
                    key={callState.roomId}
                    roomId={callState.roomId}
                    type={callState.type}
                    userId={user?._id || user?.id || 'guest'}
                    userName={user?.full_name || user?.username || 'Colleague'}
                    userAvatar={user?.avatar}
                    onClose={handleCallClose}
                  />
                )}
            </NicknameContext.Provider>
            </ChatContext.Provider>
        </SocketContext.Provider>
    )
}
