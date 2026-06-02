// removed 'use client' for Vite

import { useState } from 'react'
import {
  X,
  ChevronUp,
  ChevronDown,
  Images,
  Video,
  Files,
  Music2,
  Link2,
  Mic,
  AtSign,
  Info,
  Briefcase,
  User,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSecureMediaUrl } from '@/lib/utils'
import { ChatAvatar } from '@/components/chat/chat-avatar'
import type { Conversation, FileCategory } from '@/lib/chat-data'

/* ── Image Lightbox Gallery (scrollable) ─────────────────────────────────── */

function ImageGallery({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex)

  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length)
  const next = () => setCurrent(i => (i + 1) % images.length)

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)' }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full text-white"
        style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
      >
        <X className="size-5" />
      </button>

      {/* Counter */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-semibold text-white"
        style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
      >
        {current + 1} / {images.length}
      </div>

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); prev() }}
          className="absolute left-4 flex size-11 items-center justify-center rounded-full text-white transition-all hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <ChevronLeft className="size-6" />
        </button>
      )}

      {/* Image */}
      <img
        src={images[current]}
        onClick={e => e.stopPropagation()}
        className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl"
        alt={`Image ${current + 1}`}
      />

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); next() }}
          className="absolute right-4 flex size-11 items-center justify-center rounded-full text-white transition-all hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <ChevronRight className="size-6" />
        </button>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto px-2 pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setCurrent(i) }}
              className={cn('shrink-0 size-12 rounded-xl overflow-hidden border-2 transition-all', i === current ? 'border-white scale-110' : 'border-white/20 opacity-60 hover:opacity-90')}
            >
              <img src={img} className="size-full object-cover" alt={`thumb-${i}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Media counts from messages ─────────────────────────────────────────── */

function countMedia(messages: any[]) {
  let images = 0, videos = 0, audio = 0, files = 0, voice = 0
  const imageUrls: string[] = []
  for (const m of messages) {
    const url = m.mediaUrl || m.media_url
    const t = m.mediaType || m.message_type || m.type || ''
    if (!url) continue
    if (t === 'image' || m.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url)) {
      images++
      const resolved = getSecureMediaUrl(url)
      if (resolved) imageUrls.push(resolved)
    } else if (t === 'video' || m.mimeType?.startsWith('video/') || /\.(mp4|webm|mov|mkv)(\?|$)/i.test(url)) {
      videos++
    } else if (t === 'voice' || t === 'audio' || m.mimeType?.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|weba)(\?|$)/i.test(url)) {
      if (t === 'voice') voice++; else audio++
    } else {
      files++
    }
  }
  return { images, videos, audio, files, voice, imageUrls }
}

/* ── FilesCard ───────────────────────────────────────────────────────────── */

const iconMap: Record<string, React.ElementType> = {
  video: Video,
  files: Files,
  audio: Music2,
  link: Link2,
  voice: Mic,
}

function FileRow({ file }: { file: FileCategory }) {
  const [open, setOpen] = useState(false)
  const Icon = iconMap[file.icon] || Files
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between rounded-xl py-1 text-left transition-colors hover:text-purple"
      >
        <span className="flex items-center gap-3">
          <Icon className="size-[22px] text-ink" />
          <span className="text-[15px] text-ink">{file.label}</span>
        </span>
        <ChevronDown className={cn('size-5 text-ink-soft transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-1 pl-9 text-[13px] text-ink-soft">
          <p>No items to preview yet.</p>
        </div>
      )}
    </div>
  )
}

function FilesCard({
  conversation,
  title,
  messages = [],
  onClose,
  onLightbox,
}: {
  conversation: Conversation
  title: string
  messages?: any[]
  onClose?: () => void
  onLightbox?: (images: string[], index: number) => void
}) {
  const conv = conversation as any
  const { images: imgCount, videos, audio, files: fileCount, voice, imageUrls } = countMedia(messages)

  // Also include extra mediaMessages if present on the conversation
  const extraPhotos: string[] = (conv.mediaMessages || [])
    .filter((m: any) => m.message_type === 'image')
    .map((m: any) => getSecureMediaUrl(m.mediaUrl))
    .filter(Boolean)

  const allImageUrls = [...new Set([...imageUrls, ...extraPhotos])]
  const [photosOpen, setPhotosOpen] = useState(allImageUrls.length > 0)

  const staticFiles: FileCategory[] = conversation.files || []

  // Build dynamic file rows from message stats
  const dynamicRows: { label: string; icon: string }[] = []
  if (videos > 0) dynamicRows.push({ label: `${videos} video${videos !== 1 ? 's' : ''}`, icon: 'video' })
  if (fileCount > 0) dynamicRows.push({ label: `${fileCount} file${fileCount !== 1 ? 's' : ''}`, icon: 'files' })
  if (audio > 0) dynamicRows.push({ label: `${audio} audio file${audio !== 1 ? 's' : ''}`, icon: 'audio' })
  if (voice > 0) dynamicRows.push({ label: `${voice} voice message${voice !== 1 ? 's' : ''}`, icon: 'voice' })

  const fileRows = dynamicRows.length > 0 ? dynamicRows : staticFiles

  const hasContent = allImageUrls.length > 0 || fileRows.length > 0

  return (
    <div
      className="rounded-3xl p-6 shadow-sm"
      style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)' }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[18px] font-bold text-ink italic">{title}</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full bg-purple/10 text-purple transition-colors hover:bg-purple hover:text-white"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {!hasContent ? (
        <p className="py-8 text-center text-xs text-ink-soft italic">No shared files yet</p>
      ) : (
        <>
          {allImageUrls.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setPhotosOpen(v => !v)}
                className="mt-3 flex w-full items-center justify-between"
              >
                <span className="flex items-center gap-3">
                  <Images className="size-[22px] text-ink" />
                  <span className="text-[15px] text-ink">{allImageUrls.length} photo{allImageUrls.length !== 1 ? 's' : ''}</span>
                </span>
                {photosOpen ? <ChevronUp className="size-5 text-ink-soft" /> : <ChevronDown className="size-5 text-ink-soft" />}
              </button>
              {photosOpen && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {allImageUrls.slice(0, 9).map((url, i) => (
                    <div
                      key={i}
                      className="relative group cursor-pointer overflow-hidden rounded-2xl"
                      onClick={() => onLightbox?.(allImageUrls, i)}
                    >
                      <img
                        src={url}
                        alt={`Shared photo ${i + 1}`}
                        className="h-20 w-full object-cover transition-transform group-hover:scale-110"
                      />
                      {i === 8 && allImageUrls.length > 9 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm font-bold">
                          +{allImageUrls.length - 9}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {fileRows.length > 0 && (
            <>
              <p className="mt-5 text-[15px] font-semibold text-ink">Files</p>
              <div className="mt-4 space-y-3">
                {fileRows.map((file: any) => (
                  <FileRow key={file.label} file={file} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

/* ── MembersCard ─────────────────────────────────────────────────────────── */

function MembersCard({
  conversation,
  onClose,
}: {
  conversation: Conversation
  onClose?: () => void
}) {
  const conv = conversation as any
  // Support both static mock members and real API users
  const members = conv.members || (conv.isGroupChat ? conv.users : []) || []
  if (!conv.isGroupChat && conversation.type !== 'group') return null

  return (
    <div
      className="flex min-h-0 flex-1 flex-col rounded-3xl p-6 shadow-sm"
      style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)' }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[18px] font-bold text-ink italic">Members</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full bg-purple/10 text-purple transition-colors hover:bg-purple hover:text-white"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="mt-4 flex-1 space-y-1 overflow-y-auto">
        {members.map((m: any) => (
          <div
            key={m.name || m._id || m.id}
            className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-purple-light/60"
          >
            <ChatAvatar
              src={m.avatar || m.profile_image}
              name={m.name || m.full_name || m.username || '?'}
              className="size-11 rounded-2xl"
            />
            <span className="flex-1 text-[15px] font-medium text-ink">
              {m.name || m.full_name || m.username}
            </span>
            {(m.role || m.org_role) && (
              <span className="text-[13px] text-ink-soft">{m.role || m.org_role}</span>
            )}
          </div>
        ))}
        {members.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-soft italic">No members found</p>
        )}
      </div>
    </div>
  )
}

/* ── ContactCard ─────────────────────────────────────────────────────────── */

function ContactCard({
  conversation,
  onClose,
}: {
  conversation: any
  onClose?: () => void
}) {
  if (!conversation) return null

  // Support both the mock Conversation type and real API chat objects
  const other = conversation.otherUser || conversation.contact || {}
  const users: any[] = conversation.users || []
  // For real API chats, try to find other user from users array
  const myId = (() => { try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u.id || u._id || '' } catch { return '' } })()
  const apiOther = users.find(u => (u.id || u._id) !== myId)
  const resolved = apiOther || other

  const displayName = conversation.chatName || conversation.name || conversation.title
    || resolved.full_name || resolved.name || resolved.username || 'User'
  const avatarSrc = conversation.avatar || conversation.groupIcon
    || resolved.avatar || resolved.profile_image || null
  const status = resolved.status || (resolved.isOnline ? 'Online' : 'Offline')
  const organization = resolved.organization || resolved.company || other.organization || null
  const username = resolved.username || resolved.user_name || other.username || null
  const bio = resolved.bio || resolved.about || other.bio || null
  const role = resolved.org_role || resolved.role || resolved.position || other.role || other.org_role || null
  const email = resolved.email || null

  const infoRows = [
    { icon: Briefcase, label: 'Organization', value: organization || 'No organization' },
    { icon: AtSign, label: 'Username', value: username ? `@${username}` : '@unknown' },
    { icon: Info, label: 'Bio', value: bio ? `"${bio}"` : 'No bio information.' },
    { icon: User, label: 'Role', value: role || 'Member' },
  ]

  return (
    <div
      className="rounded-3xl p-6 text-center shadow-sm"
      style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)' }}
    >
      <div className="mb-4 flex justify-end">
        {onClose && (
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full bg-purple/10 text-purple transition-colors hover:bg-purple hover:text-white"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="relative mx-auto size-24">
        <ChatAvatar
          src={avatarSrc}
          name={displayName}
          className="size-24 rounded-3xl"
        />
        {/* Online indicator */}
        <span
          className={cn(
            'absolute -bottom-1 -right-1 size-4 rounded-full border-[2.5px] border-white',
            resolved.isOnline ? 'bg-green-500' : 'bg-gray-300'
          )}
        />
      </div>

      <h2 className="mt-4 text-[20px] font-bold text-ink">{displayName}</h2>
      <p className="mt-0.5 text-[13px] text-purple font-medium">{status}</p>
      {email && <p className="mt-0.5 text-[11px] text-ink-soft">{email}</p>}

      <div className="mt-6 space-y-4 text-left">
        {infoRows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-4">
            <div className="size-10 rounded-xl bg-purple/5 text-purple flex items-center justify-center shrink-0">
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-ink">{value}</p>
              <p className="text-[11px] text-ink-soft uppercase tracking-wider font-bold">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── GroupInfo export ────────────────────────────────────────────────────── */

export function GroupInfo({
  conversation,
  messages = [],
  onClose,
}: {
  conversation: Conversation
  messages?: any[]
  onClose: () => void
}) {
  const conv = conversation as any
  const isGroup = conv.isGroupChat || conversation.type === 'group'
  const [lightboxState, setLightboxState] = useState<{ images: string[]; index: number } | null>(null)

  return (
    <aside className="flex h-full w-full flex-col gap-4 overflow-y-auto bg-white/80 backdrop-blur-xl border-l border-black/5 p-4 rounded-l-3xl shadow-2xl pointer-events-auto">
      {lightboxState && (
        <ImageGallery
          images={lightboxState.images}
          startIndex={lightboxState.index}
          onClose={() => setLightboxState(null)}
        />
      )}

      {isGroup ? (
        <>
          <FilesCard
            conversation={conversation}
            title="Group Info"
            messages={messages}
            onClose={onClose}
            onLightbox={(imgs, idx) => setLightboxState({ images: imgs, index: idx })}
          />
          <MembersCard conversation={conversation} onClose={onClose} />
        </>
      ) : (
        <>
          <ContactCard conversation={conversation} onClose={onClose} />
          <FilesCard
            conversation={conversation}
            title="Shared Files"
            messages={messages}
            onClose={onClose}
            onLightbox={(imgs, idx) => setLightboxState({ images: imgs, index: idx })}
          />
        </>
      )}
    </aside>
  )
}
