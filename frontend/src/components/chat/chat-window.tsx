// removed 'use client' for Vite

const Image = (props: any) => <img {...props} />
import {
  Search,
  Phone,
  MoreVertical,
  Eye,
  Paperclip,
  Mic,
  Send,
  Play,
  Video,
  Info,
  Sparkles,
  Archive,
  ArrowLeft,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Conversation, Message, Reaction } from '@/lib/chat-data'

function MetaRow({
  views,
  time,
  light,
}: {
  views: number
  time: string
  light?: boolean
}) {
  return (
    <span
      className={cn(
        'flex items-center gap-1 text-xs',
        light ? 'text-white/80' : 'text-ink-soft',
      )}
    >
      <Eye className="size-4" />
      {views}
      <span className="ml-2">{time}</span>
    </span>
  )
}

function ReactionPill({ emoji, count }: Reaction) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-medium text-ink shadow-sm">
      <span className="text-sm leading-none">{emoji}</span>
      <span className="text-ink-soft">{count}</span>
    </span>
  )
}

function renderText(text: string) {
  return text.split(/(\s+)/).map((token, i) => {
    if (token.startsWith('@')) {
      return (
        <span key={i} className="text-purple">
          {token}
        </span>
      )
    }
    return <span key={i}>{token}</span>
  })
}

const waveform = [
  6, 10, 16, 22, 14, 9, 18, 26, 20, 12, 8, 14, 22, 28, 18, 10, 6, 12, 20, 26,
  16, 10, 14, 22, 18, 9, 7, 13, 19, 24, 15, 9, 6, 11, 17, 21,
]

function Avatar({ src, alt }: { src?: string; alt: string }) {
  if (!src) return <div className="w-11 shrink-0" />
  return (
    <Image
      src={src || '/placeholder.svg'}
      alt={alt}
      width={44}
      height={44}
      className="size-11 shrink-0 rounded-2xl object-cover"
    />
  )
}

function Bubble({ message }: { message: Message }) {
  const out = message.side === 'out'

  if (message.kind === 'image') {
    return (
      <div
        className={cn(
          'flex items-end gap-3',
          out && 'flex-row-reverse justify-start',
        )}
      >
        <Avatar src={message.showAvatar ? message.avatar : undefined} alt={message.author ?? 'You'} />
        <div className="relative w-[380px] overflow-hidden rounded-2xl rounded-bl-md">
          <Image
            src={message.image || '/placeholder.svg'}
            alt="Shared image"
            width={380}
            height={240}
            className="h-[240px] w-full object-cover"
          />
          <div className="absolute bottom-2 right-3">
            <MetaRow views={message.views} time={message.time} light />
          </div>
        </div>
      </div>
    )
  }

  if (message.kind === 'voice') {
    return (
      <div className={cn('flex items-end gap-3', out && 'flex-row-reverse')}>
        <Avatar src={message.showAvatar ? message.avatar : undefined} alt={message.author ?? 'You'} />
        <div
          className={cn(
            'w-[380px] rounded-2xl px-4 py-3',
            out ? 'rounded-br-md bg-purple' : 'rounded-bl-md bg-purple-light',
          )}
        >
          {message.author && (
            <p className="text-[14px] font-semibold text-purple">
              {message.author}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              aria-label="Play voice message"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-purple text-white"
            >
              <Play className="size-4 fill-white" />
            </button>
            <div className="flex flex-1 items-center gap-[2px]">
              {waveform.map((h, i) => (
                <span
                  key={i}
                  className={cn(
                    'w-[2.5px] rounded-full',
                    i < 12 ? 'bg-purple' : 'bg-purple/30',
                  )}
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
            <span className="shrink-0 text-xs text-ink-soft">
              {message.duration}
            </span>
          </div>
          <div className="mt-1 flex justify-end">
            <MetaRow views={message.views} time={message.time} />
          </div>
        </div>
      </div>
    )
  }

  // text
  return (
    <div className={cn('flex items-end gap-3', out && 'flex-row-reverse gap-2')}>
      <Avatar src={message.showAvatar ? message.avatar : undefined} alt={message.author ?? 'You'} />
      <div
        className={cn(
          'max-w-[460px] rounded-2xl px-4 py-3',
          out ? 'rounded-br-md bg-purple' : 'rounded-bl-md bg-purple-light',
        )}
      >
        {!out && message.author && (
          <p className="text-[14px] font-semibold text-purple">
            {message.author}
          </p>
        )}
        <p
          className={cn(
            'text-[14px] leading-relaxed',
            !out && message.author && 'mt-1',
            out ? 'text-white' : 'text-ink',
          )}
        >
          {renderText(message.text)}
        </p>
        <div
          className={cn(
            'mt-2 flex items-center gap-4',
            message.reactions?.length ? 'justify-between' : 'justify-end',
          )}
        >
          {message.reactions?.length ? (
            <span className="flex items-center gap-2">
              {message.reactions.map((r) => (
                <ReactionPill key={r.emoji} {...r} />
              ))}
            </span>
          ) : null}
          <MetaRow views={message.views} time={message.time} light={out} />
        </div>
      </div>
    </div>
  )
}

export function ChatWindow({
  conversation,
  onShowInfo,
  onStartMeeting,
}: {
  conversation: Conversation
  onShowInfo?: () => void
  onStartMeeting?: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-7 pt-5 pb-4">
        {!isSearchExpanded ? (
          <>
            <div>
              <h1 className="text-[26px] font-bold leading-tight text-ink">
                {conversation.title}
              </h1>
              <p className="mt-0.5 text-[13px] text-ink-soft">
                {conversation.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-5 text-ink-soft">
              <button
                type="button"
                onClick={() => setIsSearchExpanded(true)}
                className="hover:text-purple transition-colors p-1"
              >
                <Search className="size-[22px]" />
              </button>
              <button type="button" aria-label="Voice Call" className="hover:text-purple transition-colors">
                <Phone className="size-[22px]" />
              </button>
              <button
                type="button"
                onClick={onStartMeeting}
                aria-label="Video Call"
                className="hover:text-purple transition-colors"
              >
                <Video className="size-[22px]" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMenu(!showMenu)}
                  className="hover:text-purple transition-colors"
                >
                  <MoreVertical className="size-[22px]" />
                </button>

                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full z-30 mt-2 w-48 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                      <button
                        onClick={() => { onShowInfo?.(); setShowMenu(false); }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[14px] text-ink hover:bg-purple-soft/50 transition-colors"
                      >
                        <Info className="size-4" />
                        Information
                      </button>
                      <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[14px] text-ink hover:bg-purple-soft/50 transition-colors">
                        <Sparkles className="size-4" />
                        AI Summary
                      </button>
                      <hr className="my-1 border-black/5" />
                      <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[14px] text-accent-red hover:bg-accent-red/10 transition-colors">
                        <Archive className="size-4" />
                        Archive Chat
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <button onClick={() => setIsSearchExpanded(false)} className="hover:text-purple transition-colors">
              <ArrowLeft className="size-6" />
            </button>
            <div className="flex-1 relative">
              <input
                autoFocus
                type="text"
                placeholder="Search in this chat..."
                className="w-full bg-purple-soft/40 rounded-2xl px-5 py-3 text-[15px] outline-none focus:ring-2 focus:ring-purple/20"
              />
              <button
                onClick={() => setIsSearchExpanded(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-7 py-2">
        {conversation.messages.map((m) => (
          <Bubble key={m.id} message={m} />
        ))}
      </div>

      {/* Input */}
      <div className="mt-auto px-4 pb-4 pt-2">
        <div className="flex items-center gap-3 rounded-[24px] bg-purple-soft/40 p-2.5">
          <Paperclip className="size-5 shrink-0 text-purple" />
          <input
            type="text"
            placeholder="Your message"
            className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink/50 focus:outline-none"
          />
          <button type="button" aria-label="Record voice">
            <Mic className="size-5 text-ink-soft" />
          </button>
          <button type="button" aria-label="Send">
            <Send className="size-5 text-purple" />
          </button>
        </div>
      </div>
    </div>
  )
}
