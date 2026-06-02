import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { initSocket, getSocket, disconnectSocket } from '@/lib/socket'
import { fetchAllUserChats } from '@/lib/api'

// ─── Socket Context ───────────────────────────────────────────────────────────

interface SocketContextValue {
    socket: ReturnType<typeof getSocket>
    connected: boolean
}

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false })

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
                const preview = m?.content || 'New message'
                updated[idx] = { ...updated[idx], latestMessage: { content: preview }, updatedAt: new Date().toISOString() }
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

        return () => {
            disconnectSocket()
            setConnected(false)
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
        <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
            <ChatContext.Provider value={{ chats, loadingChats, refreshChats, updateChatInList, removeChatFromList }}>
                {children}
            </ChatContext.Provider>
        </SocketContext.Provider>
    )
}
