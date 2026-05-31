// removed 'use client' for Vite

import { Search, Pin, Check, CheckCheck } from 'lucide-react'
const Image = (props: any) => <img {...props} />

import { cn } from '@/lib/utils'
import { chats, type ChatListItem } from '@/lib/chat-data'

function Receipt({ type }: { type: 'sent' | 'read' }) {
  if (type === 'read') {
    return <CheckCheck className="size-4 text-purple" />
  }
  return <Check className="size-4 text-purple" />
}

function ChatRow({
  chat,
  selected,
  onSelect,
}: {
  chat: ChatListItem
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors',
        selected ? 'bg-purple-light' : 'hover:bg-purple-light/50',
      )}
    >
      {chat.avatar ? (
        <Image
          src={chat.avatar || "/placeholder.svg"}
          alt={chat.name}
          width={52}
          height={52}
          className="size-[52px] shrink-0 rounded-2xl object-cover"
        />
      ) : (
        <span
          className="flex size-[52px] shrink-0 items-center justify-center rounded-2xl text-sm font-semibold text-white"
          style={{ backgroundColor: chat.initialsBg }}
        >
          {chat.initials}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[15px] font-semibold text-ink">
            {chat.name}
          </span>
          <span className="shrink-0 text-xs text-ink-soft">{chat.time}</span>
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="truncate text-[13px] text-ink-soft">
            {chat.previewPrefix && (
              <span className="text-ink-soft">{chat.previewPrefix} </span>
            )}
            <span
              className={cn(
                chat.previewMuted ? 'text-purple' : 'text-ink-soft',
              )}
            >
              {chat.preview}
            </span>
          </p>

          <span className="flex shrink-0 items-center gap-1.5">
            {chat.unread ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-accent-orange text-[11px] font-semibold text-white">
                {chat.unread}
              </span>
            ) : null}
            {chat.receipt ? <Receipt type={chat.receipt} /> : null}
            {chat.pinned ? (
              <Pin className="size-4 rotate-45 fill-purple text-purple" />
            ) : null}
          </span>
        </div>
      </div>
    </button>
  )
}

export function ChatList({
  activeId,
  onSelect,
}: {
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <aside className="flex w-[360px] shrink-0 flex-col bg-white">
      <div className="px-4 pt-5">
        <div className="flex items-center gap-3 rounded-2xl bg-purple-soft px-4 py-3">
          <Search className="size-5 text-purple" />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink/50 focus:outline-none"
          />
          <kbd className="hidden rounded-[8px] border border-purple/20 bg-white/60 px-2 py-1 font-sans text-[11px] font-bold text-purple shadow-sm sm:block">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="mt-3 flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {chats.map((chat) => (
          <ChatRow
            key={chat.id}
            chat={chat}
            selected={chat.id === activeId}
            onSelect={() => onSelect(chat.id)}
          />
        ))}
      </div>
    </aside>
  )
}
