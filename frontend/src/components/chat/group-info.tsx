import { useState, useEffect } from 'react'
import {
  X,
  ChevronDown,
  ChevronUp,
  Images,
  Video,
  Files,
  Music2,
  Link2,
  Mic,
  AtSign,
  Briefcase,
  User,
  ChevronLeft,
  ChevronRight,
  Info,
  Copy,
  Share2,
  Sparkles,
  Edit,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSecureMediaUrl } from '@/lib/utils'
import { ChatAvatar } from '@/components/chat/chat-avatar'
import { useDashboard } from '@/contexts/DashboardContext'
import type { Conversation, FileCategory } from '@/lib/chat-data'
import { getOrgInviteCode } from '@/lib/api'
import { toast } from 'sonner'

/* ── Glassmorphic styling constants ───────────────────────────────────────── */

const glass = {
  card: {
    background: 'rgba(255, 255, 255, 0.45)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 8px 32px 0 rgba(108, 92, 231, 0.04)',
    borderRadius: '24px',
  } as React.CSSProperties,
}

/* ── Image Lightbox Gallery ──────────────────────────────────────────────── */

function ImageGallery({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex)
  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length)
  const next = () => setCurrent(i => (i + 1) % images.length)

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)' }}
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full text-white"
        style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
        <X className="size-5" />
      </button>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-semibold text-white"
        style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
        {current + 1} / {images.length}
      </div>
      {images.length > 1 && (
        <button onClick={e => { e.stopPropagation(); prev() }}
          className="absolute left-4 flex size-11 items-center justify-center rounded-full text-white transition-all hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <ChevronLeft className="size-6" />
        </button>
      )}
      <img src={images[current]} onClick={e => e.stopPropagation()}
        className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl" alt={`Image ${current + 1}`} />
      {images.length > 1 && (
        <button onClick={e => { e.stopPropagation(); next() }}
          className="absolute right-4 flex size-11 items-center justify-center rounded-full text-white transition-all hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <ChevronRight className="size-6" />
        </button>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto px-2 pb-1">
          {images.map((img, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); setCurrent(i) }}
              className={cn('shrink-0 size-12 rounded-xl overflow-hidden border-2 transition-all',
                i === current ? 'border-white scale-110' : 'border-white/20 opacity-60 hover:opacity-90')}>
              <img src={img} className="size-full object-cover" alt={`thumb-${i}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Media counting ──────────────────────────────────────────────────────── */

function countMedia(messages: any[]) {
  let images = 0, videos = 0, audio = 0, files = 0, voice = 0
  const imageUrls: string[] = []
  const videoItems: any[] = []
  const audioItems: any[] = []
  const fileItems: any[] = []
  const voiceItems: any[] = []
  const linkItems: any[] = []

  for (const m of messages) {
    const url = m.mediaUrl || m.media_url
    const t = m.mediaType || m.message_type || m.type || ''

    if (m.content) {
      // Find URLs
      const match = m.content.match(/(https?:\/\/[^\s]+)/gi)
      if (match) {
        match.forEach((link: string) => {
          linkItems.push({
            label: link.replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
            icon: 'link',
            url: link,
          })
        })
      }
    }

    if (!url) continue

    if (t === 'image' || m.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url)) {
      images++
      const r = getSecureMediaUrl(url)
      if (r) imageUrls.push(r)
    } else if (t === 'video' || m.mimeType?.startsWith('video/') || /\.(mp4|webm|mov|mkv)(\?|$)/i.test(url)) {
      videos++
      videoItems.push({
        label: m.fileName || url.split('/').pop() || 'Video file',
        icon: 'video',
        url: url,
      })
    } else if (t === 'voice' || t === 'audio' || m.mimeType?.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|weba)(\?|$)/i.test(url)) {
      if (t === 'voice') {
        voice++
        voiceItems.push({
          label: `Voice note (${m.duration || '0:00'})`,
          icon: 'voice',
          url: url,
        })
      } else {
        audio++
        audioItems.push({
          label: m.fileName || url.split('/').pop() || 'Audio file',
          icon: 'audio',
          url: url,
        })
      }
    } else {
      files++
      fileItems.push({
        label: m.fileName || url.split('/').pop() || 'Attachment file',
        icon: 'files',
        url: url,
      })
    }
  }

  return {
    images,
    videos,
    audio,
    files,
    voice,
    imageUrls,
    videoItems,
    audioItems,
    fileItems,
    voiceItems,
    linkItems,
  }
}

/* ── File Row ────────────────────────────────────────────────────────────── */

const iconMap: Record<string, React.ElementType> = {
  video: Video,
  files: Files,
  audio: Music2,
  link: Link2,
  voice: Mic,
}

function FileRow({
  file,
  items = [],
}: {
  file: { label: string; icon: string }
  items?: any[]
}) {
  const [open, setOpen] = useState(false)
  const Icon = iconMap[file.icon] || Files
  return (
    <div className="border-b border-black/2 last:border-b-0 py-1">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between rounded-xl py-1.5 text-left transition-colors hover:text-purple"
      >
        <span className="flex items-center gap-3">
          <Icon className="size-[20px] text-ink shrink-0" />
          <span className="text-[14px] text-ink truncate">{file.label}</span>
        </span>
        <ChevronDown className={cn('size-4 text-ink-soft shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-1.5 pl-8 pr-2 pb-2 space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar">
          {items.length === 0 ? (
            <p className="text-[11px] text-ink-soft italic">No items to preview yet.</p>
          ) : (
            items.map((item, idx) => {
              const url = item.url?.startsWith('http') ? item.url : getSecureMediaUrl(item.url)
              if (!url) return null
              return (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[12px] text-purple hover:underline truncate"
                >
                  <span className="size-1 bg-purple rounded-full shrink-0" />
                  <span className="truncate">{item.label}</span>
                </a>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

/* ── Shared Files Card ───────────────────────────────────────────────────── */

function FilesCard({
  conversation,
  title,
  messages = [],
  onLightbox,
  onClose,
}: {
  conversation: Conversation
  title: string
  messages?: any[]
  onLightbox?: (images: string[], index: number) => void
  onClose?: () => void
}) {
  const conv = conversation as any
  const [inviteCode, setInviteCode] = useState<string>('')
  const [showInviteLink, setShowInviteLink] = useState(false)
  const [showGroupInviteLink, setShowGroupInviteLink] = useState(false)
  const [allowOrgShare, setAllowOrgShare] = useState(true)
  useEffect(() => {
    if (title === 'Group Info' || title === 'Shared Resources') {
      getOrgInviteCode()
        .then(res => {
          if (res?.inviteCode) {
            setInviteCode(res.inviteCode)
            setAllowOrgShare(res.allowMembersToShareInvite ?? true)
          }
        })
        .catch(err => console.error('Error fetching org invite code inside FilesCard:', err))
    }
  }, [title])

  const {
    videos,
    audio,
    files: fileCount,
    voice,
    imageUrls,
    videoItems,
    audioItems,
    fileItems,
    voiceItems,
    linkItems,
  } = countMedia(messages)
  const extraPhotos: string[] = (conv.mediaMessages || [])
    .filter((m: any) => m.message_type === 'image')
    .map((m: any) => getSecureMediaUrl(m.mediaUrl))
    .filter(Boolean)
  const allImageUrls = [...new Set([...imageUrls, ...extraPhotos])]
  const [photosOpen, setPhotosOpen] = useState(allImageUrls.length > 0)
  const staticFiles: FileCategory[] = conversation.files || []
  const dynamicRows: { label: string; icon: string; items: any[] }[] = []
  if (videos > 0) dynamicRows.push({ label: `${videos} video${videos !== 1 ? 's' : ''}`, icon: 'video', items: videoItems })
  if (fileCount > 0) dynamicRows.push({ label: `${fileCount} file${fileCount !== 1 ? 's' : ''}`, icon: 'files', items: fileItems })
  if (audio > 0) dynamicRows.push({ label: `${audio} audio file${audio !== 1 ? 's' : ''}`, icon: 'audio', items: audioItems })
  if (voice > 0) dynamicRows.push({ label: `${voice} voice message${voice !== 1 ? 's' : ''}`, icon: 'voice', items: voiceItems })
  if (linkItems.length > 0) dynamicRows.push({ label: `${linkItems.length} link${linkItems.length !== 1 ? 's' : ''}`, icon: 'link', items: linkItems })
  const fileRows = dynamicRows.length > 0 ? dynamicRows : staticFiles.map(f => ({ label: f.label, icon: f.icon, items: [] }))
  const hasContent = allImageUrls.length > 0 || fileRows.length > 0

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  })()
  const isOrgAdmin = currentUser.role === 'admin'
  const isGroupAdmin = conv.groupAdmin && (
    String(conv.groupAdmin._id || conv.groupAdmin.id || conv.groupAdmin) === String(currentUser.id || currentUser._id || '')
  )

  const showOrgInvite = inviteCode && (isOrgAdmin || allowOrgShare)
  const showGroupInvite = conv.isGroupChat && conv.inviteCode && (
    isGroupAdmin || (conv.allowMembersToShareInvite ?? true)
  )

  return (
    <div className="rounded-3xl p-5 relative" style={glass.card}>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-lg transition-all hover:bg-black/5 active:scale-95 text-black/40 hover:text-purple"
          type="button"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      )}
      <h2 className="text-[17px] font-bold text-ink mb-3">{title}</h2>
      
      {showOrgInvite && (
        <div className="mb-2">
          {!showInviteLink ? (
            <button
              onClick={() => setShowInviteLink(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-4 border border-purple/20 bg-purple/5 hover:bg-purple/10 text-purple text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              <Share2 className="size-3.5 text-purple" />
              Share Workspace Link
            </button>
          ) : (
            <div className="p-3.5 rounded-2xl bg-purple-soft/5 border border-purple/10 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-1.5">
                <p className="font-bold text-ink uppercase tracking-wider text-[9px]">Workspace Invite Link</p>
                <button
                  onClick={() => setShowInviteLink(false)}
                  className="text-purple hover:text-purple/80 text-[10px] font-semibold cursor-pointer"
                >
                  Hide
                </button>
              </div>
              <div className="flex gap-1.5 mt-1">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/signup?inviteCode=${inviteCode}`}
                  className="flex-1 bg-white border border-border h-8 px-2 rounded-xl text-[10px] text-ink font-mono focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/signup?inviteCode=${inviteCode}`)
                    toast.success('Workspace link copied!')
                  }}
                  className="h-8 px-2.5 bg-purple text-white text-[10px] font-semibold rounded-xl active:scale-95 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Copy className="size-3" />
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showGroupInvite && (
        <div className="mb-4">
          {!showGroupInviteLink ? (
            <button
              onClick={() => setShowGroupInviteLink(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-4 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              <Share2 className="size-3.5 text-emerald-600" />
              Share Group Link
            </button>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-1.5">
                <p className="font-bold text-ink uppercase tracking-wider text-[9px]">Group Invite Link</p>
                <button
                  onClick={() => setShowGroupInviteLink(false)}
                  className="text-emerald-600 hover:text-emerald-500 text-[10px] font-semibold cursor-pointer"
                >
                  Hide
                </button>
              </div>
              <div className="flex gap-1.5 mt-1">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/dashboard/all?joinGroupCode=${conv.inviteCode}`}
                  className="flex-1 bg-white border border-border h-8 px-2 rounded-xl text-[10px] text-ink font-mono focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/dashboard/all?joinGroupCode=${conv.inviteCode}`)
                    toast.success('Group link copied!')
                  }}
                  className="h-8 px-2.5 bg-emerald-500 text-white text-[10px] font-semibold rounded-xl active:scale-95 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Copy className="size-3" />
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {!hasContent ? (
        <p className="py-4 text-center text-xs text-ink-soft italic">No shared files yet</p>
      ) : (
        <>
          {allImageUrls.length > 0 && (
            <>
              <button type="button" onClick={() => setPhotosOpen(v => !v)}
                className="flex w-full items-center justify-between py-1 mb-2">
                <span className="flex items-center gap-2">
                  <Images className="size-[20px] text-ink" />
                  <span className="text-[14px] font-semibold text-ink">{allImageUrls.length} photo{allImageUrls.length !== 1 ? 's' : ''}</span>
                </span>
                {photosOpen ? <ChevronUp className="size-4 text-ink-soft" /> : <ChevronDown className="size-4 text-ink-soft" />}
              </button>
              {photosOpen && (
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {allImageUrls.slice(0, 9).map((url, i) => (
                    <div key={i} className="relative group cursor-pointer overflow-hidden rounded-xl aspect-square"
                      onClick={() => onLightbox?.(allImageUrls, i)}>
                      <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      {i === 8 && allImageUrls.length > 9 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs font-bold">
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
              <p className="mt-4 text-[14px] font-semibold text-ink mb-1.5">Files</p>
              <div className="space-y-1">
                {fileRows.map((file: any) => (
                  <FileRow key={file.label} file={file} items={file.items} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

/* ── Group Members Card ──────────────────────────────────────────────────── */

function MembersCard({ conversation, onClose }: { conversation: Conversation; onClose?: () => void }) {
  const conv = conversation as any
  const members = conv.members || (conv.isGroupChat ? conv.users : []) || []
  const { setViewStatsUser, onOpenProfile } = useDashboard()

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  })()
  const currentUserId = currentUser.id || currentUser._id || ''
  const adminId = conv.groupAdmin?._id || conv.groupAdmin?.id || conv.groupAdmin

  return (
    <div className="flex flex-col rounded-3xl p-5 relative animate-in fade-in" style={glass.card}>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-lg transition-all hover:bg-black/5 active:scale-95 text-black/40 hover:text-purple"
          type="button"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      )}
      <h2 className="text-[17px] font-bold text-ink mb-3">Members ({members.length})</h2>
      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
        {members.map((m: any) => {
          const isMemberAdmin = adminId && String(m._id || m.id) === String(adminId)
          const isMe = String(m._id || m.id) === String(currentUserId)
          return (
            <div key={m._id || m.id || m.name}
              onClick={() => onOpenProfile?.(m, true)}
              className="flex items-start gap-3 rounded-xl px-1.5 py-1.5 hover:bg-purple/5 cursor-pointer">
              <ChatAvatar src={m.avatar || m.profile_image} name={m.full_name || m.username || '?'}
                className="size-9 rounded-xl shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-bold text-ink truncate flex items-center gap-1">
                    {m.full_name || m.name || m.username}
                    {isMemberAdmin && (
                      <span className="px-1 py-0.5 text-[8px] font-bold uppercase bg-purple/10 text-purple rounded leading-none shrink-0">
                        {isMe ? 'You (Admin)' : 'Admin'}
                      </span>
                    )}
                  </p>
                  {m.username && <span className="text-[10px] font-semibold text-purple shrink-0">@{m.username}</span>}
                </div>
                <p className="text-[10px] text-ink-soft truncate flex items-center gap-1 mt-0.5 leading-tight">
                  <span className="font-medium">{m.org_role || m.role || 'Member'}</span>
                  {(m.organization || m.company) && (
                    <>
                      <span className="opacity-60">•</span>
                      <span className="truncate">{m.organization || m.company}</span>
                    </>
                  )}
                </p>
                {m.uniqueTag && (
                  <p className="text-[9px] text-ink-soft/60 font-mono mt-0.5 truncate">{m.uniqueTag}</p>
                )}
              </div>
              {m.isOnline && <span className="size-2 rounded-full bg-emerald-400 shrink-0 mt-2" />}
              {(m._id || m.id) && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setViewStatsUser?.(m) }}
                  className="size-7 rounded-lg hover:bg-purple/10 flex items-center justify-center text-purple/60 hover:text-purple cursor-pointer shrink-0 mt-1 transition-colors"
                  title="View Meeting History"
                >
                  <Sparkles className="size-3.5" />
                </button>
              )}
            </div>
          )
        })}
        {members.length === 0 && (
          <p className="py-4 text-center text-xs text-ink-soft italic">No members found</p>
        )}
      </div>
    </div>
  )
}

/* ── Contact Info Card ───────────────────────────────────────────────────── */

function ContactCard({ conversation, onClose }: { conversation: any; onClose?: () => void }) {
  if (!conversation) return null

  const other = conversation.otherUser || conversation.contact || {}
  const users: any[] = conversation.users || []
  const myId = (() => { try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u.id || u._id || '' } catch { return '' } })()
  const apiOther = users.find(u => (u.id || u._id) !== myId)
  const resolved = apiOther || other

  const displayName = conversation.chatName || conversation.name || conversation.title
    || resolved.full_name || resolved.name || resolved.username || 'User'
  const avatarSrc = conversation.avatar || conversation.groupIcon || resolved.avatar || resolved.profile_image || null
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
    <div className="rounded-3xl p-5 text-center flex flex-col items-center relative w-full" style={glass.card}>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-lg transition-all hover:bg-black/5 active:scale-95 text-black/40 hover:text-purple"
          type="button"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      )}
      <div className="relative size-20 mb-3">
        <ChatAvatar src={avatarSrc} name={displayName} className="size-20 rounded-2xl" />
        <span className={cn(
          'absolute -bottom-1 -right-1 size-3.5 rounded-full border-2 border-white',
          resolved.isOnline ? 'bg-emerald-400' : 'bg-gray-300'
        )} />
      </div>

      <h2 className="text-[17px] font-bold text-ink">{displayName}</h2>
      <p className="text-[12px] text-purple font-semibold mt-0.5">{status}</p>
      {email && <p className="text-[11px] text-ink-soft mt-0.5">{email}</p>}
      {resolved.uniqueTag && (
        <div className="mt-1 px-2.5 py-0.5 bg-purple/5 border border-purple/10 rounded-full">
          <p className="text-[10px] font-mono text-purple/70">{resolved.uniqueTag}</p>
        </div>
      )}

      <div className="w-full text-left mt-5 space-y-3.5">
        {infoRows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="size-8 rounded-lg bg-purple/5 text-purple flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink leading-tight">{value}</p>
              <p className="text-[10px] text-ink-soft uppercase tracking-wider font-bold mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Group Profile Card ─────────────────────────────────────────────────── */

function GroupProfileCard({
  conversation,
  onUpdate,
  onClose,
}: {
  conversation: any
  onUpdate: (updatedConvo: any) => void
  onClose?: () => void
}) {
  const conv = conversation
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(conv.chatName || conv.name || '')
  const [bio, setBio] = useState(conv.groupDescription || conv.bio || '')
  const [avatar, setAvatar] = useState(conv.groupIcon || conv.avatar || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  })()
  const currentUserId = currentUser.id || currentUser._id || ''
  const isGroupAdmin = conv.groupAdmin && (
    String(conv.groupAdmin._id || conv.groupAdmin.id || conv.groupAdmin) === String(currentUserId)
  )

  const [allowShare, setAllowShare] = useState(conv.allowMembersToShareInvite ?? true)

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Group name cannot be empty.')
      return
    }
    setIsSaving(true)
    try {
      const { updateGroupChat } = await import('@/lib/api')
      const res = await updateGroupChat(conv.id || conv._id, {
        chatName: name.trim(),
        groupDescription: bio.trim(),
        groupIcon: avatar,
      })
      toast.success('Group settings updated!')
      setIsEditing(false)
      if (onUpdate) onUpdate(res.conversation || res.data || res)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update group settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const { uploadGroupOrOrgImage } = await import('@/lib/api')
      const url = await uploadGroupOrOrgImage(file)
      setAvatar(url)
      
      const { updateGroupChat } = await import('@/lib/api')
      const res = await updateGroupChat(conv.id || conv._id, { groupIcon: url })
      toast.success('Group avatar updated!')
      if (onUpdate) onUpdate(res.conversation || res.data || res)
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!confirm('Are you sure you want to remove the group avatar?')) return
    setAvatar('')
    try {
      const { updateGroupChat } = await import('@/lib/api')
      const res = await updateGroupChat(conv.id || conv._id, { groupIcon: '' })
      toast.success('Group avatar removed')
      if (onUpdate) onUpdate(res.conversation || res.data || res)
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove group avatar')
    }
  }

  const displayName = conv.chatName || conv.name || 'Group Chat'
  const displayBio = conv.groupDescription || conv.bio || 'No description'

  return (
    <div className="rounded-3xl p-5 text-center flex flex-col items-center relative w-full" style={glass.card}>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-lg transition-all hover:bg-black/5 active:scale-95 text-black/40 hover:text-purple"
          type="button"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      )}

      {isEditing ? (
        <div className="w-full text-left space-y-4 mt-2">
          <h3 className="text-sm font-bold text-ink mb-1">Edit Group Details</h3>
          
          <div>
            <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-purple mt-1"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">Description / Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-purple min-h-[70px] mt-1 resize-none"
            />
          </div>

          <div className="flex items-center justify-between border-t border-black/5 pt-3 mt-1">
            <div className="flex-1 pr-2">
              <p className="text-xs font-bold text-ink">Allow members to share code</p>
              <p className="text-[10px] text-ink-soft leading-tight mt-0.5">If disabled, only admins can view/share invites</p>
            </div>
            <input
              type="checkbox"
              checked={allowShare}
              onChange={async (e) => {
                const val = e.target.checked
                setAllowShare(val)
                try {
                  const { updateGroupChat } = await import('@/lib/api')
                  const res = await updateGroupChat(conv.id || conv._id, { allowMembersToShareInvite: val })
                  if (onUpdate) onUpdate(res.conversation || res.data || res)
                } catch (err: any) {
                  toast.error(err.message || 'Failed to update invite setting')
                }
              }}
              className="accent-purple size-4 cursor-pointer"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-2 bg-purple text-white text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer text-center"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setName(conv.chatName || conv.name || '')
                setBio(conv.groupDescription || conv.bio || '')
                setIsEditing(false)
              }}
              className="flex-1 py-2 border border-black/10 text-ink text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative size-20 mb-3 group">
            <ChatAvatar src={avatar || null} name={displayName} isGroup={true} className="size-20 rounded-2xl" />
            
            {isGroupAdmin && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200">
                <label className="text-[9px] font-bold text-white uppercase cursor-pointer hover:underline">
                  {isUploading ? '...' : 'Upload'}
                  <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" disabled={isUploading} />
                </label>
                {avatar && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="text-[9px] font-bold text-red-400 uppercase hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>

          <h2 className="text-[17px] font-bold text-ink flex items-center justify-center gap-1.5">
            {displayName}
            {isGroupAdmin && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-purple/15 text-purple rounded">
                Admin
              </span>
            )}
          </h2>
          <p className="text-[11px] text-ink-soft mt-1 leading-relaxed max-w-sm px-2 italic">
            "{displayBio}"
          </p>

          {isGroupAdmin && (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-3.5 px-3 py-1.5 border border-purple/20 bg-purple/5 hover:bg-purple/10 text-purple text-[11px] font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              Edit Group Info
            </button>
          )}
        </>
      )}
    </div>
  )
}

/* ── Main GroupInfo Panel ────────────────────────────────────────────────── */

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

  const [convoState, setConvoState] = useState(conversation)
  useEffect(() => {
    setConvoState(conversation)
  }, [conversation])

  return (
    <aside className="flex w-full flex-col gap-4 pointer-events-auto select-none">
      {lightboxState && (
        <ImageGallery images={lightboxState.images} startIndex={lightboxState.index}
          onClose={() => setLightboxState(null)} />
      )}

      {/* Stacked Cards Container */}
      <div className="flex flex-col gap-4 p-4">
        {isGroup ? (
          <>
            <GroupProfileCard
              conversation={convoState}
              onUpdate={(updated) => setConvoState(updated)}
              onClose={onClose}
            />
            <MembersCard conversation={convoState} />
            <FilesCard
              conversation={convoState}
              title="Shared Resources"
              messages={messages}
              onLightbox={(imgs, idx) => setLightboxState({ images: imgs, index: idx })}
            />
          </>
        ) : (
          <>
            <ContactCard conversation={conversation} onClose={onClose} />
            <FilesCard
              conversation={conversation}
              title="Shared Files"
              messages={messages}
              onLightbox={(imgs, idx) => setLightboxState({ images: imgs, index: idx })}
            />
          </>
        )}
      </div>
    </aside>
  )
}
