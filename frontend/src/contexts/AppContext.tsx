import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { initSocket, getSocket, disconnectSocket } from '@/lib/socket'
import { fetchAllUserChats } from '@/lib/api'
import { Phone } from 'lucide-react'
import { ZegoMeetingModal } from '@/components/chat/ZegoMeetingModal'
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
}

const SocketContext = createContext<SocketContextValue>({
    socket: null,
    connected: false,
    startCall: () => {},
    callState: { status: 'idle' },
    endCall: () => {},
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

// ─── App Context Provider ─────────────────────────────────────────────────────

interface AppProviderProps {
    children: React.ReactNode
    user: any
}

export function AppProvider({ children, user }: AppProviderProps) {
    const [connected, setConnected] = useState(false)
    const [chats, setChats] = useState<any[]>([])
    const [loadingChats, setLoadingChats] = useState(false)
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

            setChats(prev => {
                const idx = prev.findIndex(c => (c._id || c.id) === String(chatId))
                if (idx === -1) return prev
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
                    latestMessage: { content: preview, message_type: m?.message_type || 'text' },
                    updatedAt: new Date().toISOString()
                }
                // Move to top
                const chat = updated.splice(idx, 1)[0]
                return [chat, ...updated]
            })
        })

        sock?.on('user_status_change', ({ userId, isOnline }: { userId: string, isOnline: boolean }) => {
            setChats(prev => prev.map(c => {
                const isGroup = c.isGroupChat
                if (isGroup) return c
                const other = c.users?.find((u: any) => (u._id || u.id) === userId)
                if (other) return { ...c, isOnline }
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

        return () => {
            disconnectSocket()
            setConnected(false)
            sock?.off('incoming_call')
            sock?.off('call_accepted')
            sock?.off('call_rejected')
        }
    }, [user?.id, user?._id])

    const refreshChats = useCallback(async () => {
        setLoadingChats(true)
        try {
            const res = await fetchAllUserChats()
            setChats(res?.conversations || res?.data || [])
        } catch (err) {
            console.error('Failed to load chats:', err)
        } finally {
            setLoadingChats(false)
        }
    }, [])

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

    return (
        <SocketContext.Provider value={{ socket: socketRef.current, connected, startCall, callState, endCall }}>
            <ChatContext.Provider value={{ chats, loadingChats, refreshChats, updateChatInList, removeChatFromList }}>
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

                {/* Zego Call Modal */}
                {callState.status === 'in_call' && (
                  <ZegoMeetingModal
                    roomId={callState.roomId}
                    type={callState.type}
                    userId={user?._id || user?.id || 'guest'}
                    userName={user?.full_name || user?.username || 'Colleague'}
                    userAvatar={user?.avatar}
                    onClose={() => setCallState({ status: 'idle' })}
                  />
                )}
            </ChatContext.Provider>
        </SocketContext.Provider>
    )
}
