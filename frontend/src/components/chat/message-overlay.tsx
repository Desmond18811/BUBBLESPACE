import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Send, Paperclip, Smile, Phone, Video, Check, CheckCheck, Edit2, Trash2, Copy, MoreHorizontal, Briefcase, AtSign, Info, User, MapPin, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatAvatar } from '@/components/chat/chat-avatar'
import {
    accessOrCreateChat,
    fetchMessages,
    sendTextMessage,
    updateMessage,
    deleteMessageForMe,
    deleteMessageForEveryone,
    reactToMessage,
    markMessagesRead,
} from '@/lib/api'
import { getSocket } from '@/lib/socket'
import { toast } from 'sonner'

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥']

interface MessageOverlayProps {
    user: any            // the logged-in user
    targetUser: any      // the user we are messaging
    onClose: () => void
    workCardInfo?: boolean  // show work profile card as floating glass card
}

interface Msg {
    _id: string
    content: string
    sender: any
    createdAt: string
    message_type: string
    isDeleted?: boolean
    isEdited?: boolean
    reactions?: { emoji: string; users: string[] }[]
    readBy?: string[]
}

// ── Liquid Glass Contact Card (floats outside the chat container) ──────────
function LiquidGlassContactCard({ user, onClose, onExpand }: { user: any; onClose: () => void; onExpand?: () => void }) {
    const infoRows = [
        { icon: Briefcase, label: 'Organization', value: user.organization || user.company || 'No organization' },
        { icon: AtSign, label: 'Username', value: user.username ? `@${user.username}` : '@unknown' },
        { icon: User, label: 'Role', value: user.org_role || user.role || 'Member' },
        ...(user.location?.city ? [{ icon: MapPin, label: 'Location', value: `${user.location.city}, ${user.location.country || ''}` }] : []),
        ...(user.bio ? [{ icon: Info, label: 'Bio', value: user.bio }] : []),
    ]

    return (
        <div
            className="animate-in slide-in-from-right duration-300"
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.45) 100%)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.75)',
                boxShadow: '0 8px 40px -8px rgba(108,92,231,0.18), 0 2px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
                borderRadius: '28px',
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-purple/70">Contact Info</span>
                <button
                    onClick={onClose}
                    className="flex size-7 items-center justify-center rounded-xl transition-all hover:bg-black/8"
                    style={{ background: 'rgba(0,0,0,0.05)' }}
                >
                    <X className="size-3.5 text-black/50" />
                </button>
            </div>

            {/* Avatar + Name */}
            <div className="px-5 pb-4 flex flex-col items-center text-center">
                <div className="relative mb-3">
                    <ChatAvatar
                        src={user.avatar}
                        name={user.full_name || user.username}
                        className="size-16 rounded-2xl shadow-lg"
                    />
                    {user.isOnline !== undefined && (
                        <span className={cn(
                            'absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2',
                            user.isOnline ? 'bg-green-500' : 'bg-gray-300',
                        )} style={{ borderColor: 'rgba(255,255,255,0.8)' }} />
                    )}
                </div>
                <h3 className="font-bold text-[15px] text-ink leading-tight">{user.full_name || user.username}</h3>
                <p className="text-[12px] font-medium text-purple mt-0.5">{user.org_role || user.role || 'Team Member'}</p>
                {user.status_message && (
                    <p className="text-[11px] text-ink-soft mt-1 italic px-2">"{user.status_message}"</p>
                )}
            </div>

            {/* Divider */}
            <div className="mx-5 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(108,92,231,0.15), transparent)' }} />

            {/* Info rows */}
            <div className="px-5 py-4 space-y-3">
                {infoRows.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                        <div className="size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: 'rgba(108,92,231,0.08)' }}>
                            <Icon className="size-3.5 text-purple" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-ink truncate">{value}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft/70">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Action buttons */}
            <div className="px-5 pb-5 flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-bold text-purple transition-all hover:bg-purple hover:text-white"
                    style={{ background: 'rgba(108,92,231,0.1)' }}>
                    <Phone className="size-3.5" /> Call
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-bold text-purple transition-all hover:bg-purple hover:text-white"
                    style={{ background: 'rgba(108,92,231,0.1)' }}>
                    <Video className="size-3.5" /> Video
                </button>
                {onExpand && (
                    <button onClick={onExpand} className="flex size-10 items-center justify-center rounded-xl transition-all hover:bg-purple hover:text-white text-purple"
                        style={{ background: 'rgba(108,92,231,0.1)' }}>
                        <ExternalLink className="size-3.5" />
                    </button>
                )}
            </div>
        </div>
    )
}

export function MessageOverlay({ user, targetUser, onClose, workCardInfo = false }: MessageOverlayProps) {
    const [chatId, setChatId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Msg[]>([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [input, setInput] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editText, setEditText] = useState('')
    const [contextMenu, setContextMenu] = useState<{ msgId: string; x: number; y: number } | null>(null)
    const [reactionPicker, setReactionPicker] = useState<string | null>(null)
    const [typing, setTyping] = useState(false)
    const [showContactCard, setShowContactCard] = useState(workCardInfo)
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const socket = getSocket()
    const myId = user?._id || user?.id

    // Open or create the DM chat
    useEffect(() => {
        const init = async () => {
            try {
                const res = await accessOrCreateChat(targetUser._id || targetUser.id)
                const cid = res?.conversation?._id || res?.conversation?.id || res?._id
                setChatId(cid)
                const msgs = await fetchMessages(cid)
                setMessages(msgs?.messages || msgs?.data || [])
                await markMessagesRead(cid)
                socket?.emit('join_room', cid)
            } catch (err: any) {
                toast.error('Could not open chat')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        init()
        return () => {
            if (chatId) socket?.emit('leave_room', chatId)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetUser])

    // Scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Listen for socket events
    useEffect(() => {
        if (!socket || !chatId) return
        const onNewMsg = (msg: any) => {
            const m = msg?.data || msg
            if ((m?.chatId || m?.chat) === chatId || m?.chatId?._id === chatId) {
                setMessages(prev => {
                    if (prev.find(p => p._id === m._id)) return prev
                    return [...prev, m]
                })
                markMessagesRead(chatId)
            }
        }
        const onMsgUpdated = (msg: any) => {
            const m = msg?.data || msg
            setMessages(prev => prev.map(p => p._id === m._id ? { ...p, ...m } : p))
        }
        const onMsgDeleted = ({ messageId }: any) => {
            setMessages(prev => prev.map(p => p._id === messageId ? { ...p, isDeleted: true, content: 'This message was deleted' } : p))
        }
        const onTypingStart = ({ fromUserId }: any) => {
            if (fromUserId !== myId) setTyping(true)
        }
        const onTypingStop = ({ fromUserId }: any) => {
            if (fromUserId !== myId) setTyping(false)
        }

        socket.on('new_message', onNewMsg)
        socket.on('message_updated', onMsgUpdated)
        socket.on('message_deleted', onMsgDeleted)
        socket.on('typing_start', onTypingStart)
        socket.on('typing_stop', onTypingStop)

        return () => {
            socket.off('new_message', onNewMsg)
            socket.off('message_updated', onMsgUpdated)
            socket.off('message_deleted', onMsgDeleted)
            socket.off('typing_start', onTypingStart)
            socket.off('typing_stop', onTypingStop)
        }
    }, [socket, chatId, myId])

    const handleInputChange = (val: string) => {
        setInput(val)
        if (!chatId) return
        socket?.emit('typing_start', { toUserId: targetUser._id || targetUser.id, chatId })
        if (typingTimer.current) clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => {
            socket?.emit('typing_stop', { toUserId: targetUser._id || targetUser.id, chatId })
        }, 2000)
    }

    const handleSend = useCallback(async () => {
        if (!input.trim() || !chatId || sending) return
        setSending(true)
        const tempId = `temp-${Date.now()}`
        const optimistic: Msg = {
            _id: tempId,
            content: input,
            sender: { _id: myId, full_name: user?.full_name, avatar: user?.avatar },
            createdAt: new Date().toISOString(),
            message_type: 'text',
        }
        setMessages(prev => [...prev, optimistic])
        setInput('')
        socket?.emit('typing_stop', { toUserId: targetUser._id || targetUser.id, chatId })
        try {
            const res = await sendTextMessage(chatId, input)
            const sent = res?.data || res
            setMessages(prev => prev.map(m => m._id === tempId ? { ...m, ...sent, _id: sent._id || tempId } : m))
        } catch (err) {
            toast.error('Failed to send message')
            setMessages(prev => prev.filter(m => m._id !== tempId))
        } finally {
            setSending(false)
        }
    }, [input, chatId, sending, socket, targetUser, myId, user])

    const handleEdit = async (msgId: string) => {
        if (!editText.trim()) return
        try {
            const res = await updateMessage(msgId, editText)
            const updated = res?.data || res
            setMessages(prev => prev.map(m => m._id === msgId ? { ...m, ...updated } : m))
            setEditingId(null)
        } catch {
            toast.error('Could not edit message')
        }
    }

    const handleDelete = async (msgId: string, forEveryone: boolean) => {
        setContextMenu(null)
        try {
            if (forEveryone) {
                await deleteMessageForEveryone(msgId)
                setMessages(prev => prev.map(m => m._id === msgId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m))
            } else {
                await deleteMessageForMe(msgId)
                setMessages(prev => prev.filter(m => m._id !== msgId))
            }
        } catch {
            toast.error('Could not delete message')
        }
    }

    const handleReact = async (msgId: string, emoji: string) => {
        setReactionPicker(null)
        try {
            await reactToMessage(msgId, emoji)
        } catch {
            toast.error('Could not react')
        }
    }

    const isOwn = (msg: Msg) => {
        const senderId = msg.sender?._id || msg.sender?.id || msg.sender
        return String(senderId) === String(myId)
    }

    const canDeleteForAll = (msg: Msg) => {
        const ms = Date.now() - new Date(msg.createdAt).getTime()
        return isOwn(msg) && ms < 2 * 60 * 1000
    }

    return (
        /* Full viewport overlay — backdrop closes on click */
        <div className="fixed inset-0 z-50 pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto"
                onClick={onClose}
            />

            {/* Layout: chat panel + glass info card, anchored to bottom-right */}
            <div className="absolute bottom-6 right-6 flex items-end gap-4 pointer-events-auto"
                onClick={e => { setContextMenu(null); setReactionPicker(null); e.stopPropagation() }}
            >
                {/* Floating contact card — liquid glass, slides in from right */}
                {showContactCard && (
                    <div className="w-64 mb-2 animate-in slide-in-from-right duration-300">
                        <LiquidGlassContactCard
                            user={targetUser}
                            onClose={() => setShowContactCard(false)}
                        />
                    </div>
                )}

                {/* Chat Panel */}
                <div
                    className="flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
                    style={{
                        width: 380,
                        height: 560,
                        background: 'linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.88) 100%)',
                        backdropFilter: 'blur(40px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                        border: '1px solid rgba(255,255,255,0.8)',
                        boxShadow: '0 24px 80px -16px rgba(108,92,231,0.22), 0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.95)',
                        borderRadius: '28px',
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 px-5 py-4"
                        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                        <div className="relative">
                            <ChatAvatar
                                src={targetUser.avatar}
                                name={targetUser.full_name || targetUser.username}
                                className="size-10 rounded-xl"
                            />
                            {targetUser.isOnline && (
                                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-green-500" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-black truncate text-[14px]">{targetUser.full_name || targetUser.username}</p>
                            <p className="text-[11px] text-black/40">
                                {typing ? <span className="text-purple animate-pulse">typing…</span> : targetUser.isOnline ? 'Online' : 'Offline'}
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setShowContactCard(v => !v)}
                                title="View contact info"
                                className={cn(
                                    "flex size-8 items-center justify-center rounded-xl transition-all",
                                    showContactCard ? "bg-purple text-white" : "text-purple hover:bg-purple/10"
                                )}
                                style={{ background: showContactCard ? undefined : 'rgba(108,92,231,0.08)' }}
                            >
                                <User className="size-3.5" />
                            </button>
                            <button className="flex size-8 items-center justify-center rounded-xl text-purple transition-all hover:bg-purple/10"
                                style={{ background: 'rgba(108,92,231,0.08)' }}>
                                <Phone className="size-3.5" />
                            </button>
                            <button className="flex size-8 items-center justify-center rounded-xl text-purple transition-all hover:bg-purple/10"
                                style={{ background: 'rgba(108,92,231,0.08)' }}>
                                <Video className="size-3.5" />
                            </button>
                            <button onClick={onClose}
                                className="flex size-8 items-center justify-center rounded-xl transition-all hover:bg-black/8"
                                style={{ background: 'rgba(0,0,0,0.05)' }}>
                                <X className="size-3.5 text-black/50" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                        {loading ? (
                            <div className="flex h-full items-center justify-center">
                                <div className="size-6 animate-spin rounded-full border-2 border-purple border-t-transparent" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center">
                                <ChatAvatar src={targetUser.avatar} name={targetUser.full_name || targetUser.username} className="size-14 mb-3 rounded-2xl" />
                                <p className="font-semibold text-black text-[13px]">{targetUser.full_name || targetUser.username}</p>
                                <p className="text-xs text-black/40 mt-1">Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map(msg => {
                                const own = isOwn(msg)
                                return (
                                    <div key={msg._id} className={cn("flex gap-2 group", own ? "justify-end" : "justify-start")}>
                                        {!own && (
                                            <ChatAvatar src={msg.sender?.avatar} name={msg.sender?.full_name || msg.sender?.username || 'User'} className="size-7 rounded-lg mt-1 shrink-0" />
                                        )}
                                        <div className={cn("relative max-w-[75%]")}>
                                            {editingId === msg._id ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        value={editText}
                                                        onChange={e => setEditText(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && handleEdit(msg._id)}
                                                        className="rounded-xl border border-purple/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple/50"
                                                        autoFocus
                                                    />
                                                    <button onClick={() => handleEdit(msg._id)} className="rounded-xl bg-purple px-3 py-2 text-xs text-white">Save</button>
                                                    <button onClick={() => setEditingId(null)} className="rounded-xl bg-black/5 px-3 py-2 text-xs">Cancel</button>
                                                </div>
                                            ) : (
                                                <div
                                                    className={cn(
                                                        "relative px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed cursor-default select-text",
                                                        own
                                                            ? "text-white rounded-tr-sm"
                                                            : "text-black rounded-tl-sm",
                                                        msg.isDeleted && "opacity-50 italic"
                                                    )}
                                                    style={own ? {
                                                        background: 'linear-gradient(135deg, #6c5ce7 0%, #8b7cf8 100%)',
                                                        boxShadow: '0 4px 12px rgba(108,92,231,0.25)',
                                                    } : {
                                                        background: 'rgba(0,0,0,0.06)',
                                                    }}
                                                    onContextMenu={e => {
                                                        e.preventDefault()
                                                        if (!msg.isDeleted) setContextMenu({ msgId: msg._id, x: e.clientX, y: e.clientY })
                                                    }}
                                                >
                                                    {msg.content}
                                                    {msg.isEdited && <span className="ml-1 text-xs opacity-50">(edited)</span>}

                                                    {/* Reactions */}
                                                    {(msg.reactions?.length ?? 0) > 0 && (
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            {msg.reactions!.map(r => (
                                                                <span key={r.emoji} className="flex items-center gap-0.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                                                                    {r.emoji} {r.users.length}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Quick actions on hover */}
                                                    {!msg.isDeleted && (
                                                        <div className={cn(
                                                            "absolute -top-7 hidden group-hover:flex items-center gap-1 rounded-xl bg-white shadow-lg shadow-black/10 border border-black/5 px-2 py-1",
                                                            own ? "right-0" : "left-0"
                                                        )}>
                                                            {EMOJIS.slice(0, 4).map(e => (
                                                                <button key={e} onClick={() => handleReact(msg._id, e)} className="hover:scale-125 transition-transform text-base">
                                                                    {e}
                                                                </button>
                                                            ))}
                                                            <button
                                                                className="ml-1 flex size-6 items-center justify-center rounded-lg hover:bg-black/5"
                                                                onClick={ev => { ev.stopPropagation(); setContextMenu({ msgId: msg._id, x: ev.clientX, y: ev.clientY }) }}
                                                            >
                                                                <MoreHorizontal className="size-3.5 text-black/50" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Timestamp + read */}
                                            <p className={cn("mt-0.5 text-[10px] text-black/30 flex items-center gap-1", own && "justify-end")}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {own && (msg.readBy && msg.readBy.length > 1 ? <CheckCheck className="size-3 text-purple" /> : <Check className="size-3" />)}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                        {typing && (
                            <div className="flex gap-2">
                                <ChatAvatar src={targetUser.avatar} name={targetUser.full_name} className="size-7 rounded-lg" />
                                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-black/5 px-4 py-3">
                                    <span className="size-1.5 animate-bounce rounded-full bg-black/40" style={{ animationDelay: '0ms' }} />
                                    <span className="size-1.5 animate-bounce rounded-full bg-black/40" style={{ animationDelay: '150ms' }} />
                                    <span className="size-1.5 animate-bounce rounded-full bg-black/40" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                        <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
                            style={{ background: 'rgba(0,0,0,0.04)' }}>
                            <button className="text-black/40 hover:text-purple transition-colors shrink-0">
                                <Paperclip className="size-4" />
                            </button>
                            <input
                                className="flex-1 bg-transparent text-[13px] text-black placeholder:text-black/30 focus:outline-none"
                                placeholder={`Message ${targetUser.full_name || targetUser.username}…`}
                                value={input}
                                onChange={e => handleInputChange(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            />
                            <button className="text-black/40 hover:text-purple transition-colors shrink-0">
                                <Smile className="size-4" />
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || sending}
                                className="flex size-8 shrink-0 items-center justify-center rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-40"
                                style={{ background: 'linear-gradient(135deg, #6c5ce7, #8b7cf8)' }}
                            >
                                <Send className="size-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right-click context menu */}
            {contextMenu && (
                <div
                    className="fixed z-60 w-48 rounded-2xl bg-white shadow-2xl shadow-black/10 border border-black/5 py-1 pointer-events-auto"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    {(() => {
                        const msg = messages.find(m => m._id === contextMenu.msgId)!
                        const own = msg && isOwn(msg)
                        return (
                            <>
                                <button onClick={() => { navigator.clipboard.writeText(msg?.content || ''); setContextMenu(null) }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-black hover:bg-black/5 transition-colors">
                                    <Copy className="size-4 text-black/40" /> Copy
                                </button>
                                {own && !msg?.isDeleted && (
                                    <>
                                        <button
                                            onClick={() => { setEditingId(contextMenu.msgId); setEditText(msg?.content || ''); setContextMenu(null) }}
                                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-black hover:bg-black/5 transition-colors"
                                        >
                                            <Edit2 className="size-4 text-black/40" /> Edit
                                        </button>
                                        {canDeleteForAll(msg!) && (
                                            <button onClick={() => handleDelete(contextMenu.msgId, true)} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                                                <Trash2 className="size-4" /> Delete for Everyone
                                            </button>
                                        )}
                                    </>
                                )}
                                <button onClick={() => handleDelete(contextMenu.msgId, false)} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-black/60 hover:bg-black/5 transition-colors">
                                    <Trash2 className="size-4 text-black/40" /> Delete for Me
                                </button>
                                <div className="border-t border-black/5 mt-1 pt-1 px-4 pb-2">
                                    <p className="text-[10px] text-black/30 mb-1.5">React</p>
                                    <div className="flex gap-1">
                                        {EMOJIS.map(e => (
                                            <button key={e} onClick={() => handleReact(contextMenu.msgId, e)} className="text-base hover:scale-125 transition-transform">{e}</button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )
                    })()}
                </div>
            )}
        </div>
    )
}
