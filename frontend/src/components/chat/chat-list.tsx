import { useState, useEffect, useRef } from 'react'
import { Search, Pin, Check, CheckCheck, MoreVertical, BellOff, Trash2, Archive, Shield, X, MessageSquarePlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatAvatar } from '@/components/chat/chat-avatar'
import { useChats } from '@/contexts/AppContext'
import { muteChat, clearChat, toggleChatPin, deleteChat, blockUser } from '@/lib/api'
import { toast } from 'sonner'

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

export function ChatList({
  activeId,
  onSelect,
  currentUserId,
}: {
  activeId: string | null
  onSelect: (id: string, chat: any) => void
  currentUserId?: string
}) {
  const { chats, loadingChats, refreshChats, updateChatInList, removeChatFromList } = useChats()
  const [search, setSearch] = useState('')
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set())

  const filtered = chats.filter(c => {
    if (archivedIds.has(c._id || c.id)) return false
    const name = getChatName(c, currentUserId)
    return name.toLowerCase().includes(search.toLowerCase())
  })

  function getChatName(chat: any, myId?: string): string {
    if (chat.isGroupChat) return chat.chatName || 'Group Chat'
    const other = chat.users?.find((u: any) => (u._id || u.id) !== myId)
    return other?.full_name || other?.username || chat.chatName || 'Unknown'
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
        case 'archive':
          setArchivedIds(prev => new Set([...prev, chatId]))
          toast.success('Chat archived')
          break
        case 'delete':
          await deleteChat(chatId)
          removeChatFromList(chatId)
          toast.success('Chat deleted')
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
    <aside className="flex h-full flex-col bg-white">
      {/* Search */}
      <div className="px-4 pt-5 pb-2">
        <div className="flex items-center gap-3 rounded-[24px] bg-purple/10 border border-purple/5 backdrop-blur-xl px-4 py-3 shadow-inner">
          <Search className="size-5 text-purple shrink-0" />
          <input
            type="text"
            placeholder="Search messages..."
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
        {loadingChats ? (
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
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquarePlus className="size-10 text-black/10 mb-3" />
            <p className="text-sm font-medium text-black/30">No conversations yet</p>
            <p className="text-xs text-black/20 mt-1">Message a colleague to get started</p>
          </div>
        ) : (
          <div className="mt-1 space-y-0.5">
            {filtered
              .sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1
                if (!a.isPinned && b.isPinned) return 1
                return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
              })
              .map(chat => {
                const chatId = chat._id || chat.id
                const name = getChatName(chat, currentUserId)
                const avatar = getChatAvatar(chat, currentUserId)
                const unread = getUnread(chat)
                const preview = chat.latestMessage?.content || 'Start a conversation…'
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
                      <ChatAvatar src={avatar} name={name} className="size-[52px] rounded-2xl" />
                      {chat.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-green-500" />
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
                        <p className={cn("truncate text-[13px]", unread > 0 ? "font-medium text-ink" : "text-ink-soft")}>
                          {chat.isMuted && <BellOff className="inline size-3 mr-1 text-black/30" />}
                          {preview}
                        </p>
                        <span className="flex shrink-0 items-center gap-1.5">
                          {unread > 0 && (
                            <span className="flex size-5 items-center justify-center rounded-full bg-accent-orange text-[11px] font-semibold leading-[18px] text-white">
                              {unread > 9 ? '9+' : unread}
                            </span>
                          )}
                          {chat.isPinned && <Pin className="size-4 rotate-45 fill-purple text-purple" />}
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
    </aside>
  )
}
