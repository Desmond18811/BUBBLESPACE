import { useState, useEffect, useRef } from 'react'
import { Search, Pin, Check, CheckCheck, MoreVertical, BellOff, Trash2, Archive, Shield, X, MessageSquarePlus, Menu, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatAvatar } from '@/components/chat/chat-avatar'
import { useChats, useSocket } from '@/contexts/AppContext'
import { muteChat, clearChat, toggleChatPin, deleteChat, blockUser } from '@/lib/api'
import { toast } from 'sonner'
import { useDashboard } from '@/contexts/DashboardContext'
import { CreateGroupModal } from './create-group-modal'

interface ContextMenuState {
  chatId: string
  x: number
  y: number
}

function formatTime(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function ChatContextMenu({
  chatId,
  position,
  onClose,
  onAction,
}: {
  chatId: string
  position: { x: number; y: number }
  onClose: () => void
  onAction: (action: string, chatId: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const actions = [
    { id: 'pin', label: 'Pin Chat', icon: Pin },
    { id: 'mute', label: 'Mute Notifications', icon: BellOff },
    { id: 'clear', label: 'Clear Chat', icon: X },
    { id: 'archive', label: 'Archive Chat', icon: Archive },
    { id: 'block', label: 'Block User', icon: Shield, danger: true },
    { id: 'delete', label: 'Delete Chat', icon: Trash2, danger: true },
  ]

  return (
    <div
      ref={ref}
      className="fixed z-100 w-52 rounded-2xl bg-white shadow-2xl shadow-black/10 border border-black/5 py-1 overflow-hidden"
      style={{ left: Math.min(position.x, window.innerWidth - 220), top: Math.min(position.y, window.innerHeight - 320) }}
    >
      {actions.map(({ id, label, icon: Icon, danger }) => (
        <button
          key={id}
          onClick={() => { onAction(id, chatId); onClose() }}
          className={cn(
            "flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors",
            danger ? "text-red-500 hover:bg-red-50" : "text-black hover:bg-black/5"
          )}
        >
          <Icon className={cn("size-4", danger ? "text-red-400" : "text-black/40")} />
          {label}
        </button>
      ))}
    </div>
  )
}

import { useNavigate } from '@tanstack/react-router'
import { getMyContacts, accessOrCreateChat } from '@/lib/api'

export function ChatList({
  activeId,
  onSelect,
  currentUserId,
}: {
  activeId: string | null
  onSelect: (id: string, chat: any) => void
  currentUserId?: string
}) {
  const { setIsMobileMenuOpen, setActiveChat, setActiveChatId, activeChatId, bgType } = useDashboard()
  const { chats, loadingChats, refreshChats, updateChatInList, removeChatFromList } = useChats()
  const { socket } = useSocket()
  const [typingChats, setTypingChats] = useState<Record<string, { fromUserId: string; fromUsername?: string; fromName?: string }>>({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!socket) return

    const handleTypingStart = ({ fromUserId, chatId, fromUsername, fromName }: { fromUserId: string; chatId: string; fromUsername?: string; fromName?: string }) => {
      if (chatId) {
        setTypingChats(prev => ({
          ...prev,
          [chatId]: { fromUserId, fromUsername, fromName }
        }))
      }
    }

    const handleTypingStop = ({ fromUserId, chatId }: { fromUserId: string; chatId: string }) => {
      if (chatId) {
        setTypingChats(prev => {
          const next = { ...prev }
          delete next[chatId]
          return next
        })
      }
    }

    socket.on('typing_start', handleTypingStart)
    socket.on('typing_stop', handleTypingStop)

    return () => {
      socket.off('typing_start', handleTypingStart)
      socket.off('typing_stop', handleTypingStop)
    }
  }, [socket])
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set())
  const [contacts, setContacts] = useState<any[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoadingContacts(true)
        const res = await getMyContacts()
        setContacts(res.data || [])
      } catch (err) {
        console.error('Failed to load contacts for chat list:', err)
      } finally {
        setLoadingContacts(false)
      }
    }
    loadContacts()
  }, [])
  useEffect(() => {
    if (activeId && chats && chats.length > 0) {
      const currentActive = chats.find((c: any) => (c._id || c.id) === activeId)
      if (currentActive) {
        setActiveChat(currentActive)
      }
    }
  }, [activeId, chats, setActiveChat])

  // Merge chats and contacts
  // Users who have a chat already are in `chats`
  // Users who are contacts but NO chat yet should be appended
  const chatUserIds = new Set()
  chats.forEach(c => {
    if (!c.isGroupChat) {
      const other = c.users?.find((u: any) => (u._id || u.id) !== currentUserId)
      if (other) chatUserIds.add(other._id || other.id)
    }
  })

  const contactsWithoutChats = contacts.filter(con => {
    const conId = con._id || con.id
    // Don't show yourself in contacts
    if (conId === currentUserId) return false
    return !chatUserIds.has(conId)
  })

  const filteredChats = chats.filter(c => {
    const isArchived = (c.archivedBy && currentUserId && c.archivedBy.includes(currentUserId)) || archivedIds.has(c._id || c.id)
    if (isArchived) return false
    // Filter out self-chats (1:1 chats where both participants are you)
    if (!c.isGroupChat && c.users?.length === 2) {
      const other = c.users.find((u: any) => (u._id || u.id) !== currentUserId)
      if (!other) return false // both users are you — hide this chat
    }
    const name = getChatName(c, currentUserId)
    return name.toLowerCase().includes(search.toLowerCase())
  })

  const filteredContacts = contactsWithoutChats.filter(con => {
    const name = con.full_name || con.username || ''
    return name.toLowerCase().includes(search.toLowerCase())
  })

  const handleContactClick = async (contact: any) => {
    try {
      const res = await accessOrCreateChat(contact._id || contact.id)
      const chat = res?.conversation || res?.data?.conversation || res?.data || res
      onSelect(chat.id || chat._id, chat)
      refreshChats()
    } catch (err) {
      toast.error('Failed to start chat')
    }
  }

  function getChatName(chat: any, myId?: string): string {
    if (chat.isGroupChat) return chat.chatName || 'Group Chat'
    const other = chat.users?.find((u: any) => (u._id || u.id) !== myId)
    if (other) return other.full_name || other.username || 'User'
    return (chat.chatName && chat.chatName !== 'direct') ? chat.chatName : 'Chat'
  }

  function getChatAvatar(chat: any, myId?: string): string | undefined {
    if (chat.isGroupChat) return chat.groupIcon || undefined
    const other = chat.users?.find((u: any) => (u._id || u.id) !== myId)
    return other?.avatar || undefined
  }

  function getUnread(chat: any): number {
    return chat.unreadCount || 0
  }

  const handleAction = async (action: string, chatId: string) => {
    try {
      switch (action) {
        case 'pin':
          await toggleChatPin(chatId)
          updateChatInList(chatId, { isPinned: true })
          toast.success('Chat pinned')
          break
        case 'mute':
          await muteChat(chatId)
          updateChatInList(chatId, { isMuted: true })
          toast.success('Notifications muted')
          break
        case 'clear':
          await clearChat(chatId)
          updateChatInList(chatId, { latestMessage: null })
          toast.success('Chat cleared')
          break
        case 'archive': {
          const { toggleArchiveChat } = await import('@/lib/api')
          const myId = currentUserId || ''
          const chat = chats.find(c => (c._id || c.id) === chatId)
          const updatedArchivedBy = [...(chat?.archivedBy || [])]
          if (myId && !updatedArchivedBy.includes(myId)) {
            updatedArchivedBy.push(myId)
          }

          // Optimistically update lists immediately in real-time
          setArchivedIds(prev => new Set([...prev, chatId]))
          updateChatInList(chatId, { archivedBy: updatedArchivedBy })

          try {
            await toggleArchiveChat(chatId)
            toast.success('Chat archived')
          } catch {
            // Revert changes on error
            setArchivedIds(prev => {
              const next = new Set(prev)
              next.delete(chatId)
              return next
            })
            if (chat) {
              updateChatInList(chatId, { archivedBy: chat.archivedBy || [] })
            }
            toast.error('Failed to archive chat')
          }
          break
        }
        case 'delete':
          removeChatFromList(chatId)
          if (activeChatId === chatId) {
            setActiveChat?.(null)
            setActiveChatId?.(null)
          }
          toast.success('Chat deleted')
          deleteChat(chatId).catch(err => {
            console.error('Failed to delete chat:', err)
            refreshChats()
          })
          break
        case 'block': {
          const chat = chats.find(c => (c._id || c.id) === chatId)
          const other = chat?.users?.find((u: any) => (u._id || u.id) !== currentUserId)
          if (other) {
            await blockUser(other._id || other.id)
            removeChatFromList(chatId)
            toast.success('User blocked')
          }
          break
        }
      }
    } catch {
      toast.error('Action failed')
    }
  }

  return (
    <aside className={cn("flex h-full flex-col", bgType === 'glass' ? "bg-transparent" : bgType === 'dark' ? "bg-[#12122a]" : "bg-white")}>
      {/* Header with Archive Charts */}
      <div className="flex items-center justify-between px-4 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen?.(true)}
            className="md:hidden flex size-9 items-center justify-center rounded-xl bg-purple/10 text-purple hover:bg-purple/20 transition-all"
          >
            <Menu className="size-5" />
          </button>
          <h2 className="text-xl font-bold bg-linear-to-r from-purple to-purple/60 bg-clip-text text-transparent">Messages</h2>
        </div>
        <button
          onClick={() => setShowCreateGroupModal(true)}
          className="flex items-center gap-1.5 rounded-full bg-purple/10 px-3 py-1.5 text-[11px] font-bold text-purple hover:bg-purple/20 transition-all cursor-pointer"
        >
          <Plus className="size-3.5" />
          Create Group
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-3 rounded-[24px] bg-purple/10 border border-purple/5 backdrop-blur-xl px-4 py-3 shadow-inner">
          <Search className="size-5 text-purple shrink-0" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink/40 focus:outline-none"
          />
          <kbd className="hidden rounded-[8px] border border-purple/10 bg-white/40 px-2 py-1 font-sans text-[10px] font-bold text-purple shadow-sm sm:block">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {loadingChats || loadingContacts ? (
          <div className="flex flex-col gap-2 p-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 rounded-2xl px-3 py-3 animate-pulse">
                <div className="size-[52px] rounded-2xl bg-black/5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-black/5 rounded-full w-3/4" />
                  <div className="h-2.5 bg-black/5 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (filteredChats.length === 0 && filteredContacts.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquarePlus className="size-10 text-black/10 mb-3" />
            <p className="text-sm font-medium text-black/30">No conversations yet</p>
            <p className="text-xs text-black/20 mt-1">Message a contact to get started</p>
          </div>
        ) : (
          <div className="mt-1 space-y-4">
            {/* Active Chats Section */}
            {filteredChats.length > 0 && (
              <div className="space-y-0.5">
                <div className="px-3 mb-2 flex items-center justify-between text-[10px] font-bold text-black/30 uppercase tracking-widest italic">
                  RECENT MESSAGES
                  <span className="h-px flex-1 ml-3 bg-black/5" />
                </div>
                {filteredChats
                  .sort((a: any, b: any) => {
                    if (a.isPinned && !b.isPinned) return -1
                    if (!a.isPinned && b.isPinned) return 1
                    return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
                  })
                  .map((chat: any) => {
                    const chatId = chat._id || chat.id
                    const name = getChatName(chat, currentUserId)
                    const avatar = getChatAvatar(chat, currentUserId)
                    const unread = getUnread(chat)
                    let preview = chat.latestMessage?.content;
                    if (!preview && chat.latestMessage) {
                      if (chat.latestMessage.message_type === 'image') preview = '📷 Image';
                      else if (chat.latestMessage.message_type === 'voice') preview = '🎤 Voice message';
                      else if (chat.latestMessage.message_type === 'video') preview = '🎥 Video';
                      else if (chat.latestMessage.message_type === 'file') preview = '📎 Attachment';
                      else preview = 'Say hello! 👋';
                    } else if (!preview) {
                      preview = 'Say hello! 👋';
                    }
                    const time = formatTime(chat.updatedAt || chat.latestMessage?.createdAt)
                    const selected = chatId === activeId

                    return (
                      <div
                        key={chatId}
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelect(chatId, chat)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onSelect(chatId, chat)
                          }
                        }}
                        onContextMenu={e => {
                          e.preventDefault()
                          setContextMenu({ chatId, x: e.clientX, y: e.clientY })
                        }}
                        className={cn(
                          'group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors cursor-pointer outline-none',
                          selected ? 'bg-purple-light no-underline shadow-[inset_0_0_0_1px_rgba(139,92,246,0.1)]' : 'hover:bg-purple-light/50',
                        )}
                      >
                        <div className="relative shrink-0">
                          <ChatAvatar src={avatar} name={name} className="size-[52px] rounded-2xl shadow-sm" />
                          {chat.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-green-500 shadow-sm" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-[15px] font-semibold text-ink flex items-center gap-1.5">
                              {chat.isPinned && <Pin className="size-3 fill-purple text-purple" />}
                              {name}
                            </span>
                            <span className="shrink-0 text-xs text-ink-soft">{time}</span>
                          </div>

                          <div className="mt-0.5 flex items-center justify-between gap-2">
                            {typingChats[chatId] ? (
                              <p className="truncate text-[13px] text-purple font-medium animate-pulse">
                                {typingChats[chatId].fromUsername 
                                  ? `@${typingChats[chatId].fromUsername} is typing…`
                                  : typingChats[chatId].fromName 
                                    ? `${typingChats[chatId].fromName} is typing…`
                                    : "typing…"}
                              </p>
                            ) : (
                              <p className={cn("truncate text-[13px]", unread > 0 ? "font-medium text-ink" : "text-ink-soft")}>
                                {chat.isMuted && <BellOff className="inline size-3 mr-1 text-black/30" />}
                                {preview}
                              </p>
                            )}
                            <span className="flex shrink-0 items-center gap-1.5">
                              {unread > 0 && (
                                <span className="flex size-5 items-center justify-center rounded-full bg-accent-orange text-[11px] font-semibold leading-[18px] text-white animate-pulse">
                                  {unread > 9 ? '9+' : unread}
                                </span>
                              )}
                              {chat.isPinned && <Pin className="size-4 rotate-45 fill-purple text-purple opacity-50" />}
                            </span>
                          </div>
                        </div>

                        {/* Hover 3-dot menu */}
                        <button
                          className="hidden group-hover:flex size-7 shrink-0 items-center justify-center rounded-xl hover:bg-black/5"
                          onClick={e => {
                            e.stopPropagation()
                            setContextMenu({ chatId, x: e.clientX, y: e.clientY })
                          }}
                        >
                          <MoreVertical className="size-4 text-black/40" />
                        </button>
                      </div>
                    )
                  })}
              </div>
            )}

            {/* Contacts Section (Users you can message) */}
            {filteredContacts.length > 0 && (
              <div className="space-y-0.5">
                <div className="px-3 mb-2 flex items-center justify-between text-[10px] font-bold text-black/30 uppercase tracking-widest italic">
                  CONTACTS
                  <span className="h-px flex-1 ml-3 bg-black/5" />
                </div>
                {filteredContacts.map((contact: any) => {
                  const name = contact.full_name || contact.username || 'User'
                  return (
                    <div
                      key={contact._id || contact.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleContactClick(contact)}
                      className="group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors cursor-pointer outline-none hover:bg-purple/5"
                    >
                      <div className="relative shrink-0">
                        <ChatAvatar src={contact.avatar} name={name} className="size-[52px] rounded-2xl opacity-80" />
                        {contact.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-green-500 shadow-sm" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-[15px] font-semibold text-ink-soft group-hover:text-ink">{name}</h4>
                        <p className="truncate text-[12px] text-black/30 italic">Not messaged yet • Click to chat</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MessageSquarePlus className="size-4 text-purple" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ChatContextMenu
          chatId={contextMenu.chatId}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onAction={handleAction}
        />
      )}

      {showCreateGroupModal && (
        <CreateGroupModal
          onClose={() => setShowCreateGroupModal(false)}
          onSuccess={async (newChat) => {
            await refreshChats()
            const id = newChat.id || newChat._id
            setActiveChatId(id)
            setActiveChat(newChat)
            navigate({ to: `/dashboard/chat/${id}` })
          }}
        />
      )}
    </aside>
  )
}
