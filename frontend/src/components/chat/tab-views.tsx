import {
  MessageSquare,
  Phone,
  MoreVertical,
  UserPlus,
  MessageCircle,
  Video,
  Sparkles,
  Archive,
  ArchiveRestore,
  Pencil,
  Mail,
  MapPin,
  Camera,
  Check,
  X,
  Mic,
  VideoOff,
  Maximize2,
  Smile,
  Volume2,
  Briefcase,
  ChevronLeft,
  Paperclip,
  Send,
  Users,
  User,
  Info,
  MicOff,
  MonitorUp,
  ChevronRight,
  Search,
  Loader2,
  FileText,
  Zap,
  ClipboardList,
  Menu,
  Calendar,
  Plus,
  Trash2,
  Clock,
  Settings,
  Copy,
  Upload,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDashboard } from '@/contexts/DashboardContext'
import { useNavigate } from '@tanstack/react-router'
import { useChats, useNicknames } from '@/contexts/AppContext'
import { useTheme } from 'next-themes'
import { CreateGroupModal } from './create-group-modal'
import { useState, useEffect, useRef, useMemo } from 'react'
import { cn, getSecureMediaUrl } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { ChatAvatar } from '@/components/chat/chat-avatar'
import { updateProfile, uploadAvatar, uploadBackground, getMyContacts, addContact, getSuggestions, removeContact as removeContactApi, blockUser, fetchTasks, createTaskFull, updateTaskFull, deleteTaskFull, fetchAiDescription } from '@/lib/api'
import { readCache, writeCache, CACHE_KEYS } from '@/lib/webCache'
import { toast } from 'sonner'
import {
  profile,
  type Friend,
} from '@/lib/chat-data'
import { fetchAllUserChats, fetchCallLogs, fetchMeetings, accessOrCreateChat, joinOrganizationByInvite, joinGroupChat, getOrgMembers } from '@/lib/api'
import { ChatWindow } from '@/components/chat/chat-window'
import { GroupInfo } from '@/components/chat/group-info'
import { useSocket } from '@/contexts/AppContext'
import { MessageOverlay } from '@/components/chat/message-overlay'
import { countries } from '@/lib/countries'

// Next.js Image polyfill for Vite.
// Resolves backend media (Filebase, http(s), blob, and backend-relative /uploads paths)
// via getSecureMediaUrl so avatars/backgrounds load correctly, while leaving bundled
// public assets (/placeholder.svg, /themes/*.png, …) untouched.
const resolveImageSrc = (src?: string): string => {
  if (!src) return '/placeholder.svg'
  // Bundled public assets are root-relative but NOT backend uploads — serve as-is.
  if (src.startsWith('/') && !src.startsWith('/uploads') && !src.startsWith('/api')) return src
  return getSecureMediaUrl(src) || '/placeholder.svg'
}
const Image = ({ src, alt, className, ...rest }: React.ImgHTMLAttributes<HTMLImageElement> & { src?: string; alt?: string; width?: number; height?: number }) => {
  return <img src={resolveImageSrc(src)} alt={alt} className={className} {...rest} />
}

const INDUSTRIES = [
  "Technology & Software",
  "Healthcare & Life Sciences",
  "Finance & Banking",
  "Education & E-Learning",
  "Retail & E-commerce",
  "Real Estate & Construction",
  "Manufacturing & Logistics",
  "Media & Entertainment",
  "Marketing & Advertising",
  "Professional Services & Consulting",
  "Hospitality & Tourism",
  "Energy & Utilities",
  "Non-Profit & Government",
  "Other"
];

const OFFICE_ROLES = [
  "Intern",
  "Associate",
  "Specialist",
  "Analyst",
  "Coordinator",
  "Developer",
  "Engineer",
  "Designer",
  "Manager",
  "Team Lead",
  "Project Manager",
  "Director",
  "Vice President (VP)",
  "Chief Technology Officer (CTO)",
  "Chief Product Officer (CPO)",
  "Chief Operating Officer (COO)",
  "Chief Marketing Officer (CMO)",
  "Chief Financial Officer (CFO)",
  "Chief Executive Officer (CEO)",
  "Founder"
];



function ViewHeader({ title, subtitle, action, isNarrow = false }: { title: string, subtitle?: string, action?: React.ReactNode, isNarrow?: boolean }) {
  const isMobile = useIsMobile()
  const { setIsMobileMenuOpen } = useDashboard()
  return (
    <header className="w-full flex h-16 shrink-0 items-center justify-between border-b border-black/10 bg-white/50 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3 min-w-0">
        {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen?.(true)}
            className="md:hidden flex size-9 items-center justify-center rounded-xl bg-purple/10 text-purple hover:bg-purple/20 transition-all shrink-0"
          >
            <Menu className="size-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold bg-linear-to-r from-purple to-purple/60 bg-clip-text text-transparent">{title}</h1>
          {subtitle && !isNarrow && <p className="truncate text-[11px] font-medium text-ink-soft">{subtitle}</p>}
        </div>
      </div>
      {action}
    </header>
  )
}

/* ---------------- Friends ---------------- */

function FriendCard({
  friend,
  onCall,
}: {
  friend: Friend
  onCall: (type: 'voice' | 'video') => void
}) {
  return (
    <div className="group flex flex-col items-center gap-1 rounded-[20px] bg-purple-soft/40 p-2 text-center transition-all hover:bg-purple-soft/70 hover:shadow-lg hover:-translate-y-0.5">
      <div className="relative">
        <Image
          src={friend.avatar || '/placeholder.svg'}
          alt={friend.name}
          width={48}
          height={48}
          className="size-12 rounded-[16px] object-cover shadow-sm"
        />
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white',
            friend.status === 'online' ? 'bg-emerald-500' : 'bg-ink-soft',
          )}
        />
      </div>

      <div className="min-w-0">
        <p className="truncate text-[12px] font-bold text-ink leading-tight">
          {friend.name}
        </p>
        <p className="truncate text-[9px] text-ink-soft uppercase tracking-wider">{friend.role}</p>
      </div>

      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 transition-all duration-300 group-hover:opacity-100">
        <button
          type="button"
          aria-label="Message"
          className="flex size-6 items-center justify-center rounded-md bg-white text-purple shadow-sm transition-all hover:scale-110 active:scale-95"
        >
          <MessageSquare className="size-3" />
        </button>
        <button
          type="button"
          onClick={() => onCall('voice')}
          aria-label="Voice Call"
          className="flex size-6 items-center justify-center rounded-md bg-white text-purple shadow-sm transition-all hover:scale-110 active:scale-95"
        >
          <Phone className="size-3" />
        </button>
        <button
          type="button"
          onClick={() => onCall('video')}
          aria-label="Video Call"
          className="flex size-6 items-center justify-center rounded-md bg-white text-purple shadow-sm transition-all hover:scale-110 active:scale-95"
        >
          <Video className="size-3" />
        </button>
      </div>
    </div>
  )
}

function CallOverlay({
  friend,
  type,
  onEnd,
}: {
  friend: Friend
  type: 'voice' | 'video'
  onEnd: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 p-8 text-center text-white">
        <div className="relative">
          <div className="absolute -inset-4 animate-ping rounded-full bg-purple/20" />
          <Image
            src={friend.avatar || '/placeholder.svg'}
            alt={friend.name}
            width={128}
            height={128}
            className="relative size-32 rounded-[40px] border-4 border-purple/30 object-cover"
          />
        </div>
        <div>
          <h3 className="text-2xl font-bold">{friend.name}</h3>
          <p className="mt-1 text-purple-light italic">
            {type === 'voice' ? 'Calling...' : 'Video Call...'}
          </p>
        </div>

        {type === 'video' && (
          <div className="aspect-video w-full overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10">
            <div className="flex h-full items-center justify-center text-white/20">
              <Video className="size-12" />
            </div>
          </div>
        )}

        <div className="flex items-center gap-6 pt-4">
          <button className="flex size-14 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
            <Mic className="size-6" />
          </button>
          <button
            onClick={onEnd}
            className="flex size-16 items-center justify-center rounded-full bg-accent-red text-white shadow-lg transition-transform hover:scale-110"
          >
            <Phone className="size-7 rotate-135" />
          </button>
          <button className="flex size-14 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
            <VideoOff className="size-6" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function FriendsView({ onMessage, isNarrow = false }: { onMessage?: (user: any) => void, isNarrow?: boolean }) {
  const { startCall, isUserOnline } = useSocket()
  const { user: currentUser, setActiveChat, setActiveChatId, bgType } = useDashboard()
  const { refreshChats } = useChats()
  const { getDisplayName } = useNicknames()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const myId = currentUser?._id || currentUser?.id
  const queryClient = useQueryClient()
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['contacts', myId],
    queryFn: async () => {
      const contactsRes = await getMyContacts()
      const list = (contactsRes?.data || []).filter((c: any) => (c._id || c.id) !== myId)
      // De-dup by id (guards against any legacy duplicate contact entries).
      const seen = new Set<string>()
      return list.filter((c: any) => {
        const id = String(c._id || c.id || '')
        if (!id || seen.has(id)) return false
        seen.add(id)
        return true
      })
    },
    enabled: !!myId,
    staleTime: 1000 * 60 * 5, // 5 mins cache
    retry: 1,
  })

  const { data: suggestions = [] } = useQuery({
    queryKey: ['suggestions', myId],
    queryFn: async () => {
      const suggestRes = await getSuggestions().catch(() => ({ data: [], users: [] }))
      return (suggestRes?.data || suggestRes?.users || []).filter((s: any) => (s._id || s.id) !== myId)
    },
    enabled: !!myId,
    staleTime: 1000 * 60 * 5, // 5 mins cache
    retry: 1,
  })

  const [showAddModal, setShowAddModal] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [addIdentifier, setAddIdentifier] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)
  const [activeCall, setActiveCall] = useState<{
    friend: any
    type: 'voice' | 'video'
  } | null>(null)

  const effectiveNarrow = isNarrow || isMobile

  const handleAddFriend = async () => {
    if (!addIdentifier.trim()) return
    setAddLoading(true)
    try {
      const res = await addContact(addIdentifier.trim())
      const newContact = res?.data || res
      queryClient.setQueryData(['contacts', myId], (prev: any) => prev ? [...prev, newContact] : [newContact])
      queryClient.invalidateQueries({ queryKey: ['contacts', myId] })
      queryClient.invalidateQueries({ queryKey: ['suggestions', myId] })
      setAddIdentifier('')
      setShowAddModal(false)
      toast.success('Contact added!')
    } catch (err: any) {
      toast.error(err?.message || 'Could not add contact')
    } finally {
      setAddLoading(false)
    }
  }

  const handleRemove = async (userId: string) => {
    try {
      await removeContactApi(userId)
      queryClient.setQueryData(['contacts', myId], (prev: any) => prev ? prev.filter((c: any) => (c._id || c.id) !== userId) : [])
      queryClient.invalidateQueries({ queryKey: ['contacts', myId] })
      queryClient.invalidateQueries({ queryKey: ['suggestions', myId] })
      toast.success('Contact removed')
    } catch {
      toast.error('Could not remove contact')
    }
  }

  const handleBlock = async (userId: string) => {
    try {
      await blockUser(userId)
      queryClient.setQueryData(['contacts', myId], (prev: any) => prev ? prev.filter((c: any) => (c._id || c.id) !== userId) : [])
      queryClient.invalidateQueries({ queryKey: ['contacts', myId] })
      queryClient.invalidateQueries({ queryKey: ['suggestions', myId] })
      toast.success('User blocked')
    } catch {
      toast.error('Could not block user')
    }
  }

  const filtered = contacts.filter((c: any) =>
    getDisplayName(c).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={cn("flex h-full w-full flex-col", bgType === 'glass' ? "bg-transparent" : "bg-white")}>
      <ViewHeader
        title="Contacts"
        subtitle={`${contacts.length} connection${contacts.length !== 1 ? 's' : ''}`}
        action={
          !isMobile && (
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-9 w-48 rounded-xl border border-black/5 bg-black/2 pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple/30"
                />
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-black/30" />
              </div>
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(true)}
                className="flex items-center gap-2 rounded-xl bg-purple/10 border border-purple/20 px-4 py-2 text-[13px] font-bold text-purple transition-all hover:bg-purple/20 cursor-pointer"
              >
                <Plus className="size-4" />
                <span>Create Group</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 rounded-xl bg-purple px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
              >
                <UserPlus className="size-4" />
                <span className="hidden sm:inline">Add Friend</span>
              </button>
            </div>
          )
        }
      />

      {isMobile && (
        <div className="px-6 py-4 border-b border-black/5 flex items-center gap-2 bg-white shrink-0">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-10 w-full rounded-2xl border border-black/10 bg-black/2 pl-10 pr-10 text-sm focus:border-purple/30 focus:bg-white focus:outline-none transition-all"
            />
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-black/40" />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black/30 hover:text-black"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={() => setShowCreateGroupModal(true)}
              className="flex-1 flex h-10 items-center justify-center gap-2 rounded-2xl bg-purple/10 border border-purple/20 text-xs font-bold text-purple transition-all hover:bg-purple/20 cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Create Group</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex-1 flex h-10 items-center justify-center gap-2 rounded-2xl bg-purple px-4 text-xs font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
            >
              <UserPlus className="size-4" />
              <span>Add Friend</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Friend Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl shadow-black/20 mx-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-black">Add a Contact</h2>
                <p className="text-sm text-black/40 mt-0.5">Enter their unique ID or username</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="flex size-8 items-center justify-center rounded-xl bg-black/5 hover:bg-black/10 transition-colors">
                <X className="size-4 text-black/50" />
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. bubble-A3F9X7K2 or @username"
              value={addIdentifier}
              onChange={e => setAddIdentifier(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple/30 mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-xl border border-black/10 py-2.5 text-sm font-semibold text-black/60 hover:bg-black/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFriend}
                disabled={addLoading || !addIdentifier.trim()}
                className="flex-1 rounded-xl bg-purple py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {addLoading ? 'Adding…' : 'Add Contact'}
              </button>
            </div>

            {/* Quick suggestions */}
            {suggestions.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold text-black/40 uppercase tracking-wider mb-3">People you may know</p>
                <div className="space-y-2">
                  {suggestions.slice(0, 4).map((s: any) => (
                    <div key={s._id || s.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-black/3 transition-colors">
                      <ChatAvatar src={s.avatar} name={getDisplayName(s)} className="size-9 rounded-xl" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-black truncate">{s.full_name}</p>
                        <p className="text-xs text-black/40 truncate">@{s.username}</p>
                      </div>
                      <button
                        onClick={() => { setAddIdentifier(s.uniqueTag || s.username); }}
                        className="shrink-0 rounded-lg bg-purple/10 px-2.5 py-1 text-xs font-semibold text-purple hover:bg-purple/20 transition-colors"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contacts Grid */}
      <div className={cn("flex-1 overflow-y-auto", effectiveNarrow ? "p-3" : "p-4 sm:p-6")}>
        {loadingContacts ? (
          <div className={cn("grid gap-3", effectiveNarrow ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5")}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex flex-col items-center gap-2 rounded-2xl bg-black/3 p-4 animate-pulse">
                <div className="size-14 rounded-2xl bg-black/5" />
                <div className="h-3 w-16 rounded-full bg-black/5" />
                <div className="h-2.5 w-12 rounded-full bg-black/5" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          isMobile ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-center max-w-md mx-auto py-12 px-4">
              <div className="size-16 rounded-[24px] bg-purple-soft/50 flex items-center justify-center mb-4 shadow-sm animate-in zoom-in duration-300">
                <Users className="size-8 text-purple/60" />
              </div>
              <h3 className="text-base font-bold text-ink">
                {!currentUser?.organization ? 'Join your organisation' : 'No Contacts Yet'}
              </h3>
              <p className="text-xs text-ink-soft max-w-[280px] mt-1 mb-6 leading-relaxed">
                {!currentUser?.organization
                  ? 'Get an invite code from your company admin and enter it in Settings → Edit Profile to connect with your colleagues.'
                  : 'Connect with colleagues by adding them to your contacts list to start messaging.'}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="rounded-2xl bg-purple px-6 py-3 text-xs font-bold text-white hover:bg-purple/90 transition-all shadow-md shadow-purple/20"
              >
                {!currentUser?.organization ? 'Add a contact manually' : 'Add your first contact'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Users className="size-12 text-black/10 mb-3" />
              {!currentUser?.organization ? (
                <>
                  <p className="text-sm font-semibold text-black/50">You haven't joined an organisation yet</p>
                  <p className="text-xs text-black/30 mt-1 max-w-xs">Go to <strong>Settings → Edit Profile</strong> and enter your company invite code to see your colleagues here.</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-black/40">No contacts yet</p>
                  <button onClick={() => setShowAddModal(true)} className="mt-3 text-sm font-semibold text-purple hover:underline">
                    Add your first contact →
                  </button>
                </>
              )}
            </div>
          )

        ) : (
          <div className={cn("grid gap-3", effectiveNarrow ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5")}>
            {filtered.map((contact: any) => {
              const cid = contact._id || contact.id
              return (
                <div
                  key={cid}
                  className={cn(
                    "group relative flex border border-black/5 transition-all hover:border-purple/20 hover:shadow-lg hover:shadow-purple/5",
                    effectiveNarrow
                      ? "flex-row items-center gap-3 rounded-2xl p-3 text-left"
                      : "flex-col items-center gap-2 rounded-2xl p-4 text-center"
                  )}
                >
                  <div className="relative">
                    <ChatAvatar src={contact.avatar} name={getDisplayName(contact)} className="size-14 rounded-2xl shadow-md" />
                    {isUserOnline(contact._id || contact.id) && (
                      <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-green-500" />
                    )}
                  </div>
                  <div className={cn("min-w-0 flex-1", effectiveNarrow ? "text-left" : "text-center")}>
                    <p className={cn("truncate font-bold text-ink", effectiveNarrow ? "text-sm" : "text-[13px]")}>
                      {getDisplayName(contact)}
                    </p>
                    <p className="truncate text-[10px] text-black/40">
                      {effectiveNarrow
                        ? (isUserOnline(contact._id || contact.id) ? "Online" : "Away")
                        : (contact.org_role || (contact.role === 'admin' ? contact.status_message : null) || '@' + (contact.username || ''))}
                    </p>
                  </div>

                  {!effectiveNarrow ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <button
                        onClick={() => onMessage?.(contact)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-purple/10 py-1.5 text-[11px] font-semibold text-purple hover:bg-purple hover:text-white transition-all"
                      >
                        <MessageSquare className="size-3" /> Chat
                      </button>
                      <button
                        className="flex size-7 items-center justify-center rounded-lg border border-black/5 text-black/30 hover:text-purple hover:border-purple/20 transition-all"
                        onClick={() => startCall && startCall(contact._id || contact.id, getDisplayName(contact), contact.avatar, 'voice')}
                      >
                        <Phone className="size-3" />
                      </button>
                      <button
                        className="flex size-7 items-center justify-center rounded-lg border border-black/5 text-black/30 hover:text-purple hover:border-purple/20 transition-all"
                        onClick={() => startCall && startCall(contact._id || contact.id, getDisplayName(contact), contact.avatar, 'video')}
                      >
                        <Video className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-1 z-10 relative">
                      <button
                        onClick={() => onMessage?.(contact)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-purple/10 py-1.5 text-[11px] font-semibold text-purple hover:bg-purple hover:text-white transition-all"
                      >
                        <MessageSquare className="size-3" /> Chat
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); startCall && startCall(contact._id || contact.id, getDisplayName(contact), contact.avatar, 'voice') }}
                        className="flex size-8 items-center justify-center rounded-lg border border-black/5 text-black/40 hover:text-purple hover:border-purple/20 transition-all"
                      >
                        <Phone className="size-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); startCall && startCall(contact._id || contact.id, getDisplayName(contact), contact.avatar, 'video') }}
                        className="flex size-8 items-center justify-center rounded-lg border border-black/5 text-black/40 hover:text-purple hover:border-purple/20 transition-all"
                      >
                        <Video className="size-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Dropdown Menu */}
                  <div className={cn("absolute top-2 right-2 z-20", effectiveNarrow ? "block" : "hidden group-hover:block")}>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveDropdownId(activeDropdownId === cid ? null : cid)
                        }}
                        className="flex size-6 items-center justify-center rounded-lg bg-white shadow-sm border border-black/5 text-black/50 hover:text-purple transition-colors"
                      >
                        <MoreVertical className="size-3" />
                      </button>

                      {activeDropdownId === cid && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveDropdownId(null)
                            }}
                          />
                          <div className="absolute right-0 mt-1 w-24 rounded-xl border border-black/5 bg-white p-1 shadow-lg z-30 animate-in fade-in slide-in-from-top-1 duration-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveDropdownId(null)
                                if (confirm(`Remove ${getDisplayName(contact)} from your contacts?`)) handleRemove(cid)
                              }}
                              className="w-full text-left rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-black/60 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              Remove
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveDropdownId(null)
                                if (confirm(`Block ${getDisplayName(contact)}? They won't be able to message you.`)) handleBlock(cid)
                              }}
                              className="w-full text-left rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-black/60 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              Block
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Suggestions section */}
        {suggestions.length > 0 && filtered.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-black/40 uppercase tracking-wider mb-4">People You May Know</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.slice(0, 6).map((s: any) => (
                <div key={s._id || s.id} className="flex items-center gap-3 rounded-2xl border border-black/5 p-3 hover:border-purple/20 hover:shadow-sm transition-all">
                  <ChatAvatar src={s.avatar} name={getDisplayName(s)} className="size-11 rounded-xl shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black truncate">{s.full_name}</p>
                    <p className="text-xs text-black/40">@{s.username}</p>
                  </div>
                  <button
                    onClick={() => { setAddIdentifier(s.uniqueTag || s.username); setShowAddModal(true) }}
                    className="shrink-0 flex size-8 items-center justify-center rounded-xl bg-purple/10 text-purple hover:bg-purple hover:text-white transition-all"
                  >
                    <UserPlus className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {activeCall && (
        <CallOverlay
          friend={activeCall.friend}
          type={activeCall.type}
          onEnd={() => setActiveCall(null)}
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
    </div>
  )
}

/* ---------------- Calls ---------------- */

export function CallsView({ onStartMeeting }: { onStartMeeting: () => void }) {
  const { startCall, startMeeting, isUserOnline } = useSocket()
  const { getDisplayName } = useNicknames()
  const [selectionStep, setSelectionStep] = useState<'none' | 'source' | 'type'>('none')
  const { user: currentUser, bgType } = useDashboard()
  const [callsTab, setCallsTab] = useState<'meet' | 'calendar' | 'logs'>('meet')

  // 1:1 → ring the coworker; no coworker → open a standalone LiveKit meeting room
  // the host can invite people into (unified with mobile + the rest of web on LiveKit).
  const handleStartCall = (type: 'voice' | 'video', coworker?: any) => {
    if (coworker) {
      if (startCall) {
        startCall(coworker._id || coworker.id, getDisplayName(coworker), coworker.avatar, type)
      }
      return
    }
    startMeeting(type)
    setSelectionStep('none')
  }

  const handleSourceSelect = (source: 'group' | 'contacts') => {
    setSelectionStep('type')
  }

  const handleTypeSelect = (type: 'voice' | 'video') => {
    handleStartCall(type)
  }

  const myId = currentUser?._id || currentUser?.id

  // Fetch real data. `initialData` seeds instantly from the last-known localStorage
  // snapshot so revisiting this tab (or a slow/flaky backend) doesn't flash the
  // skeleton grid again — the query still revalidates in the background.
  const { data: callLogsData, isLoading } = useQuery({
    queryKey: ['callLogs'],
    queryFn: async () => {
      const res = await fetchCallLogs()
      const data = res.data || { rooms: [], coworkers: [] }
      writeCache(myId, CACHE_KEYS.callLogs, data)
      return data
    },
    initialData: () => readCache<any>(myId, CACHE_KEYS.callLogs) || undefined,
    staleTime: 1000 * 60,
  })

  // Full org roster (same endpoint as Work), not the capped search — "People in
  // the office" is meant to be everyone currently online, so it needs the whole
  // org to filter against, not a 30-row search slice.
  const { data: coworkerData } = useQuery({
    queryKey: ['coworkers-calls'],
    queryFn: async () => {
      const res = await getOrgMembers()
      const users = res.members || res.data || []
      writeCache(myId, CACHE_KEYS.coworkers, users)
      return users
    },
    initialData: () => readCache<any>(myId, CACHE_KEYS.coworkers) || undefined,
    staleTime: 1000 * 60,
  })

  const activeRooms = callLogsData?.rooms || []
  // Filter out self and bots, then to only those currently online — this section
  // is "people in the office right now," not the full roster (that's Work).
  const coworkers = (coworkerData || []).filter((w: any) => {
    const wId = w._id || w.id
    const isBot = w.is_bot || w.username === 'aida' || w.username?.toLowerCase() === 'aida'
    return wId !== myId && !isBot && isUserOnline(wId)
  })

  return (
    <div className={cn("flex h-full w-full overflow-hidden rounded-[26px]", bgType === 'glass' ? "bg-transparent" : "bg-white")}>
      <div className={cn("flex flex-1 flex-col overflow-hidden border-r border-black/5", bgType === 'glass' ? "bg-transparent" : "bg-white")}>
        <ViewHeader
          title={callsTab === 'meet' ? "Events & Meets" : callsTab === 'calendar' ? "Business Calendar" : "Call Logs"}
          subtitle={callsTab === 'meet' ? "Experience seamless communication" : callsTab === 'calendar' ? "Organize organization events and team meetings" : "History of meetings, summaries, and transcripts"}
          action={
            callsTab === 'meet' ? (
              <button
                onClick={() => setSelectionStep('source')}
                className="rounded-xl bg-purple px-5 py-2 text-sm font-bold text-white shadow-lg shadow-purple/20 transition-all hover:opacity-90 active:scale-95"
              >
                Start New Meeting
              </button>
            ) : null
          }
        />

        {/* Tab switcher navigation */}
        <div className="flex border-b border-black/5 px-6 bg-white gap-6">
          <button
            onClick={() => setCallsTab('meet')}
            className={cn(
              "pb-3 pt-2 text-sm font-bold border-b-2 transition-all relative",
              callsTab === 'meet' ? "border-purple text-purple font-extrabold" : "border-transparent text-ink-soft hover:text-ink"
            )}
          >
            Live Meetings
          </button>
          <button
            onClick={() => setCallsTab('calendar')}
            className={cn(
              "pb-3 pt-2 text-sm font-bold border-b-2 transition-all relative",
              callsTab === 'calendar' ? "border-purple text-purple font-extrabold" : "border-transparent text-ink-soft hover:text-ink"
            )}
          >
            Business Calendar
          </button>
          <button
            onClick={() => setCallsTab('logs')}
            className={cn(
              "pb-3 pt-2 text-sm font-bold border-b-2 transition-all relative",
              callsTab === 'logs' ? "border-purple text-purple font-extrabold" : "border-transparent text-ink-soft hover:text-ink"
            )}
          >
            Call Logs
          </button>
        </div>

        {callsTab === 'meet' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 animate-in fade-in duration-200">
            {/* Active Rooms */}
            <section>
              <div className="mb-4 flex items-center justify-between px-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-black/30 italic">Live Collaborative Spaces</h3>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-600">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  {activeRooms.length} ACTIVE ROOMS
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {activeRooms.length === 0 ? (
                  <div className="col-span-full py-8 text-center rounded-[28px] border-2 border-dashed border-black/5 bg-black/2">
                    <p className="text-sm text-black/30 font-medium">No active live meetings. Start one to collaborate!</p>
                  </div>
                ) : activeRooms.map((room: any) => (
                  <div key={room.id} className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] bg-purple-soft/40 p-5 transition-all hover:bg-purple-soft/70 hover:shadow-xl border border-purple/5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-[17px] font-bold text-ink">{room.title}</h3>
                        <p className="text-[11px] text-ink-soft font-medium uppercase tracking-tight">{room.members} members joined</p>
                      </div>
                    </div>

                    <div className="mt-8 flex items-end justify-between">
                      <div className="flex -space-x-3">
                        {room.callers?.slice(0, 3).map((c: string, i: number) => (
                          <div key={i} className="flex size-10 items-center justify-center rounded-full border-2 border-white bg-purple text-[12px] font-bold text-white shadow-sm shrink-0">
                            {c[0]}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => startMeeting('video', room.roomId || room.id)}
                        className="flex size-12 items-center justify-center rounded-2xl bg-purple text-white shadow-lg shadow-purple/30 transition-transform hover:scale-110 active:scale-95 group-hover:rotate-6"
                      >
                        <Video className="size-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* People in the Office (Cards View) */}
            <section>
              <div className="mb-4 flex items-center justify-between px-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-black/30 italic">People in the office</h3>
                <span className="text-[10px] font-bold text-purple bg-purple/10 px-2 py-0.5 rounded-full uppercase">All Active Staff</span>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {isLoading ? (
                  [1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-48 rounded-[32px] bg-black/3 animate-pulse" />
                  ))
                ) : coworkers.length === 0 ? (
                  <div className="col-span-full py-8 text-center rounded-[28px] border-2 border-dashed border-black/5 bg-black/2">
                    <p className="text-sm text-black/30 font-medium">No one from your organization is online right now.</p>
                  </div>
                ) : coworkers.map((worker: any) => (
                  <div key={worker._id || worker.id} className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-[32px] border border-black/5 bg-white p-5 text-center transition-all hover:border-purple/30 hover:shadow-2xl">
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10">
                      <div className="relative mx-auto inline-block">
                        <ChatAvatar
                          src={worker.avatar}
                          name={getDisplayName(worker)}
                          className="size-20 rounded-[24px] shadow-lg ring-4 ring-white"
                        />
                        {isUserOnline(worker._id || worker.id) && (
                          <span className="absolute -bottom-1 -right-1 size-5 rounded-full border-[3px] border-white bg-green-500 shadow-sm" />
                        )}
                      </div>

                      <div className="mt-4">
                        <h4 className="text-[15px] font-bold text-ink truncate max-w-[140px]">
                          {worker.full_name}
                        </h4>
                        <div className="mt-1 flex flex-col gap-0.5">
                          <p className="text-[11px] font-bold text-purple uppercase tracking-wider italic">
                            {worker.org_role || 'Staff Member'}
                          </p>
                          <p className="text-[10px] text-ink-soft font-medium truncate px-1">
                            {worker.organization || 'Bubble Workspace'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center gap-2">
                        <button
                          onClick={() => handleStartCall('voice', worker)}
                          className="flex size-10 items-center justify-center rounded-xl bg-purple-soft text-purple transition-all hover:bg-purple hover:text-white"
                        >
                          <Phone className="size-4" />
                        </button>
                        <button
                          onClick={() => handleStartCall('video', worker)}
                          className="flex size-10 items-center justify-center rounded-xl bg-purple-soft text-purple transition-all hover:bg-purple hover:text-white"
                        >
                          <Video className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : callsTab === 'calendar' ? (
          <CalendarSection coworkers={coworkers} />
        ) : (
          <CallLogsSection />
        )}

        {/* Meeting now runs on LiveKit via AppContext.startMeeting → LiveKitMeetingModal
            (mounted globally in AppContext), unifying meetings with calls + mobile. */}

        {/* Meeting Selection Dialog */}
        {selectionStep !== 'none' && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectionStep('none')} />
            <div className="relative w-full max-w-sm rounded-[32px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setSelectionStep('none')}
                className="absolute right-4 top-4 text-ink-soft hover:text-ink"
              >
                <X className="size-5" />
              </button>

              {selectionStep === 'source' ? (
                <>
                  <h3 className="text-xl font-bold text-ink mb-2">New Meeting</h3>
                  <p className="text-sm text-ink-soft mb-6">Choose where to invite members from</p>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => handleSourceSelect('group')}
                      className="flex items-center gap-4 rounded-2xl bg-purple-soft/50 p-4 text-left transition-colors hover:bg-purple-soft"
                    >
                      <div className="size-12 rounded-xl bg-purple text-white flex items-center justify-center">
                        <Users className="size-6" />
                      </div>
                      <div>
                        <p className="font-bold text-ink">Group Members</p>
                        <p className="text-xs text-ink-soft">Invite from your active groups</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleSourceSelect('contacts')}
                      className="flex items-center gap-4 rounded-2xl bg-purple-soft/50 p-4 text-left transition-colors hover:bg-purple-soft"
                    >
                      <div className="size-12 rounded-xl bg-purple text-white flex items-center justify-center">
                        <User className="size-6" />
                      </div>
                      <div>
                        <p className="font-bold text-ink">Normal Contacts</p>
                        <p className="text-xs text-ink-soft">Start a chat with your friends</p>
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-ink mb-2">Call Type</h3>
                  <p className="text-sm text-ink-soft mb-6">Select how you want to connect</p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleTypeSelect('voice')}
                      className="flex flex-col items-center gap-3 rounded-2xl bg-purple-soft/50 p-6 transition-colors hover:bg-purple-soft"
                    >
                      <div className="size-14 rounded-full bg-white text-purple flex items-center justify-center shadow-sm">
                        <Phone className="size-6" />
                      </div>
                      <p className="font-bold text-ink">Voice Call</p>
                    </button>
                    <button
                      onClick={() => handleTypeSelect('video')}
                      className="flex flex-col items-center gap-3 rounded-2xl bg-purple-soft/50 p-6 transition-colors hover:bg-purple-soft"
                    >
                      <div className="size-14 rounded-full bg-white text-purple flex items-center justify-center shadow-sm">
                        <Video className="size-6" />
                      </div>
                      <p className="font-bold text-ink">Video Call</p>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


/* ---------------- Archive ---------------- */

export function ArchiveView({ onMessage: propOnMessage }: { onMessage?: (user: any) => void }) {
  const {
    user,
    onMessage: contextOnMessage,
    activeChat,
    setActiveChat,
    activeChatId,
    setActiveChatId,
    messages,
    setMessages,
    showInfo,
    setShowInfo,
    bgType,
  } = useDashboard()
  const { updateChatInList } = useChats()
  const { getDisplayName } = useNicknames()
  const myId = user?._id || user?.id
  const [chatLoading, setChatLoading] = useState(false)
  const isMobile = useIsMobile()

  // Fetch all chats and filter for archived ones
  const { data: archivedChatsRaw, isLoading, refetch } = useQuery({
    queryKey: ['allChats', 'archived'],
    queryFn: async () => {
      const res = await fetchAllUserChats()
      const chats = res?.conversations || res?.data || []
      return (chats as any[]).filter(c => c.archivedBy?.includes(myId))
    }
  })

  const getChatName = (chat: any) => {
    if (chat.isGroupChat) return chat.chatName || 'Group Chat'
    const other = chat.users?.find((u: any) => (u._id || u.id) !== myId)
    return other ? getDisplayName(other) : (chat.chatName || 'Unknown')
  }

  const getChatAvatar = (chat: any) => {
    if (chat.isGroupChat) return chat.groupIcon
    const other = chat.users?.find((u: any) => (u._id || u.id) !== myId)
    return other?.avatar
  }

  const archivedChats = [...(archivedChatsRaw || [])].sort((a, b) =>
    getChatName(a).localeCompare(getChatName(b))
  )

  const handleOpenChat = async (chat: any) => {
    setChatLoading(true)
    try {
      setActiveChatId(chat._id || chat.id)
      setActiveChat(chat)
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className={cn("flex h-full w-full overflow-hidden rounded-[26px]", bgType === 'glass' ? "bg-transparent" : "bg-white")}>
      {/* Left panel — archived chat list */}
      <div className={cn(
        "flex flex-col border-r border-black/5 transition-all duration-500 ease-in-out",
        activeChat && !isMobile ? "w-[320px] shrink-0" : "w-full",
        activeChat && isMobile ? "hidden" : "flex"
      )}>
        <ViewHeader
          title="Archive"
          subtitle={archivedChats.length > 0 ? `${archivedChats.length} saved conversation${archivedChats.length !== 1 ? 's' : ''}` : 'Your message history'}
          isNarrow={!!activeChat}
        />

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {isLoading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-black/3 animate-pulse" />
            ))
          ) : archivedChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="size-16 rounded-[24px] bg-purple-soft/50 flex items-center justify-center mb-4">
                <Archive className="size-8 text-purple/40" />
              </div>
              <p className="text-sm font-bold text-ink">Archive is empty</p>
              <p className="text-xs text-ink-soft mt-1">Archived conversations appear here</p>
            </div>
          ) : (
            archivedChats.map((chat: any) => {
              const name = getChatName(chat)
              const avatar = getChatAvatar(chat)
              const isActive = (activeChatId === (chat._id || chat.id))
              return (
                <div
                  key={chat._id || chat.id}
                  onClick={() => handleOpenChat(chat)}
                  className={cn(
                    "group flex items-center gap-3 rounded-[22px] border p-3 transition-all duration-200 cursor-pointer",
                    isActive
                      ? "border-purple/30 bg-purple/5 shadow-sm"
                      : "border-black/5 bg-white hover:border-purple/20 hover:shadow-md"
                  )}
                >
                  <div className="relative shrink-0">
                    <ChatAvatar src={avatar} name={name} className="size-12 rounded-xl shadow-sm" isGroup={chat.isGroupChat} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-bold text-ink text-[13px]">{name}</p>
                      {chat.isGroupChat && (
                        <span className="shrink-0 text-[9px] font-bold text-purple bg-purple/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Group</span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-ink-soft mt-0.5">
                      {(() => {
                        const lm = chat.latestMessage
                        if (!lm) return 'No messages yet'
                        const isSystem = lm.message_type === 'system' || lm.is_announcement === true;
                        if (isSystem) return 'No messages yet'
                        if (lm.content) return lm.content
                        if (lm.message_type === 'image') return '📷 Image'
                        if (lm.message_type === 'voice') return '🎤 Voice message'
                        if (lm.message_type === 'video') return '🎥 Video'
                        if (lm.message_type === 'file' || lm.message_type === 'document') return '📎 Attachment'
                        return 'No messages yet'
                      })()}
                    </p>
                  </div>
                  {/* Restore button */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation()
                      const chatId = chat._id || chat.id
                      try {
                        const { toggleArchiveChat } = await import('@/lib/api')
                        const chatObj = (archivedChatsRaw || []).find((c: any) => (c._id || c.id) === chatId)
                        if (chatObj && myId) {
                          const updatedArchivedBy = (chatObj.archivedBy || []).filter((id: string) => String(id) !== String(myId))
                          updateChatInList(chatId, { archivedBy: updatedArchivedBy })
                        }
                        await toggleArchiveChat(chatId)
                        toast.success('Chat restored')
                        if (isActive) { setActiveChat(null); setActiveChatId(null) }
                        refetch()
                      } catch {
                        toast.error('Failed to restore')
                      }
                    }}
                    title="Restore chat"
                    className="opacity-0 group-hover:opacity-100 flex size-8 items-center justify-center rounded-xl border border-black/5 text-black/30 hover:text-purple hover:border-purple/30 transition-all shrink-0"
                  >
                    <ArchiveRestore className="size-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>



      {/* Right panel — ChatWindow */}
      {activeChat ? (
        <div className="relative flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col">
            <ChatWindow
              chatId={activeChatId!}
              chat={activeChat}
              currentUser={user}
              messages={messages}
              setMessages={setMessages}
              onClose={() => { setActiveChat(null); setActiveChatId(null); setShowInfo(false) }}
              onShowInfo={() => setShowInfo(!showInfo)}
            />
          </div>
        </div>
      ) : (
        <div className={cn("flex-1 items-center justify-center hidden md:flex", isMobile && "hidden")}>
          <div className="text-center p-8 max-w-sm">
            <div className="size-20 rounded-3xl bg-purple/10 flex items-center justify-center mb-4 mx-auto">
              <Archive className="size-10 text-purple/50" />
            </div>
            <h2 className="text-xl font-bold text-black mb-2">Archived Chats</h2>
            <p className="text-sm text-black/40">Select a conversation from the list to read or continue it.</p>
          </div>
        </div>
      )}
    </div>
  )
}


/* ─────────────────────────────────────────────────────────────────────────── */
/* BrainView                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

import {
  Brain as BrainIcon, Link2, BookOpen, RotateCcw, AlertCircle, ChevronDown as ChevronDownIcon,
} from 'lucide-react'
import {
  brainSearch, brainIngestText, brainIngestUrl, brainIngestYouTube, brainIngestFile,
  getDailyDigest as webGetDailyDigest, getExpertiseRadar as webGetExpertiseRadar,
  brainGetJobs, getBrainOnboardingBrief,
  createCalendarEvent as apiCreateCalendarEvent,
  getCalendarEvents,
  startCalendarMeeting as apiStartMeeting,
  deleteCalendarEvent as apiDeleteCalendarEvent,
  getEventSuggestions,
} from '@/lib/api'

type BrainTab = 'search' | 'seed' | 'onboard' | 'digest'

const BRAIN_SOURCE_TYPES = [
  { key: 'text', label: 'Text / Paste', icon: <FileText className="size-4" /> },
  { key: 'url', label: 'Web Page URL', icon: <Link2 className="size-4" /> },
  { key: 'youtube', label: 'YouTube', icon: <Search className="size-4" /> },
  { key: 'file', label: 'File Upload', icon: <Upload className="size-4" /> },
]

function BrainDigestPanel() {
  const { getDisplayName } = useNicknames()
  const [digest, setDigest] = useState<any>(null)
  const [radar, setRadar] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [headsUpOpen, setHeadsUpOpen] = useState(false)

  useEffect(() => {
    Promise.allSettled([webGetDailyDigest(), webGetExpertiseRadar()]).then(([d, r]) => {
      if (d.status === 'fulfilled') setDigest(d.value?.digest)
      if (r.status === 'fulfilled') setRadar(r.value?.byTopic || {})
    }).finally(() => setLoading(false))
  }, [])

  const today = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-ink mb-1">Morning Brief</h2>
        <p className="text-xs text-ink-soft mb-4">{today}</p>

        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl bg-purple/5 p-5">
            <Loader2 className="size-5 text-purple animate-spin" />
            <span className="text-sm text-ink-soft">Generating your brief…</span>
          </div>
        ) : digest ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-purple/10 bg-purple/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex size-8 items-center justify-center rounded-xl bg-purple/15"><Sparkles className="size-4 text-purple" /></div>
                <span className="text-sm font-semibold text-ink">AI Summary</span>
              </div>
              <p className="text-sm text-ink leading-relaxed">{digest.morningBrief}</p>
            </div>

            {digest.events?.length > 0 && (
              <div className="rounded-2xl border border-black/5 bg-white p-4">
                <p className="text-xs font-semibold text-black/40 uppercase tracking-wider mb-3">Today's Events ({digest.events.length})</p>
                {digest.events.map((e: any) => (
                  <div key={e._id} className="flex items-center gap-3 py-2 border-b border-black/3 last:border-0">
                    <div className="size-2 rounded-full bg-purple shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{e.title}</p>
                      <p className="text-xs text-ink-soft">{new Date(e.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {digest.highConfidenceItems?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-black/40 uppercase tracking-wider">Key Knowledge ({digest.highConfidenceItems.length})</p>
                {digest.highConfidenceItems.map((item: any, idx: number) => (
                  <div key={idx} className="rounded-xl border-l-4 border-purple/40 bg-purple/3 p-3">
                    <p className="text-[11px] font-semibold text-purple mb-1">{item.sourceTitle || 'Knowledge Base'}</p>
                    <p className="text-xs text-ink leading-relaxed line-clamp-3">{item.content}</p>
                    <span className="inline-block mt-1.5 rounded-lg bg-purple/10 px-2 py-0.5 text-[10px] font-semibold text-purple">
                      {Math.round((item.confidence || 0) * 100)}% confidence
                    </span>
                  </div>
                ))}
              </div>
            )}

            {digest.headsUpItems?.length > 0 && (
              <div>
                <button onClick={() => setHeadsUpOpen(o => !o)} className="flex items-center gap-2 w-full rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-left">
                  <AlertCircle className="size-4 text-amber-500 shrink-0" />
                  <span className="text-xs font-semibold text-amber-700 flex-1">{digest.headsUpItems.length} heads-up item(s)</span>
                  <ChevronDownIcon className={cn("size-4 text-amber-500 transition-transform", headsUpOpen && "rotate-180")} />
                </button>
                {headsUpOpen && digest.headsUpItems.map((item: any, idx: number) => (
                  <div key={idx} className="mt-2 rounded-xl border-l-4 border-amber-300 bg-amber-50 p-3">
                    <p className="text-xs text-ink leading-relaxed line-clamp-2">{item.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-black/5 p-10 text-center">
            <Sparkles className="size-10 text-black/10" />
            <p className="text-sm text-ink-soft">No digest yet. Check back tomorrow morning!</p>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-base font-bold text-ink mb-1">Expertise Radar</h2>
        <p className="text-xs text-ink-soft mb-4">Top contributors per topic</p>
        {Object.keys(radar).length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-black/5 p-8 text-center">
            <Users className="size-10 text-black/10" />
            <p className="text-sm text-ink-soft">No expertise data yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Object.entries(radar).slice(0, 8).map(([topic, experts]) => (
              <div key={topic} className="rounded-2xl border border-black/5 bg-white p-4">
                <p className="text-[11px] font-semibold text-purple mb-3">#{topic}</p>
                <div className="flex gap-3 flex-wrap">
                  {experts.slice(0, 4).map((expert: any, idx: number) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-purple/10 text-base font-bold text-purple">
                        {(getDisplayName(expert.user) || '?')[0].toUpperCase()}
                      </div>
                      <p className="text-[10px] text-ink-soft text-center max-w-[52px] truncate">
                        {expert.user?.full_name?.split(' ')[0] || expert.user?.username || 'Member'}
                      </p>
                      <span className="text-[9px] font-semibold text-black/30 bg-black/5 rounded-lg px-1.5 py-0.5">{expert.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function BrainView({ isNarrow = false }: { onMessage?: (user: any) => void, isNarrow?: boolean }) {
  const { bgType } = useDashboard()
  const [activeTab, setActiveTab] = useState<BrainTab>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [seedType, setSeedType] = useState('text')
  const [seedContent, setSeedContent] = useState('')
  const [seedUrl, setSeedUrl] = useState('')
  const [seedTitle, setSeedTitle] = useState('')
  const [seeding, setSeeding] = useState(false)
  const [seedMsg, setSeedMsg] = useState('')
  const [jobs, setJobs] = useState<any[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [onboardBrief, setOnboardBrief] = useState('')
  const [onboardLoading, setOnboardLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadJobs = async () => {
    setJobsLoading(true)
    try { const d = await brainGetJobs(); setJobs(d?.jobs || []) } catch { /* silent */ }
    finally { setJobsLoading(false) }
  }
  useEffect(() => { if (activeTab === 'seed') loadJobs() }, [activeTab])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try { const d = await brainSearch(searchQuery.trim()); setSearchResults(d?.results || []) }
    catch { /* silent */ } finally { setSearching(false) }
  }

  const handleSeed = async () => {
    setSeeding(true); setSeedMsg('')
    try {
      if (seedType === 'text') { if (!seedContent.trim()) throw new Error('Content required'); await brainIngestText(seedContent, seedTitle) }
      else if (seedType === 'url') { if (!seedUrl.trim()) throw new Error('URL required'); await brainIngestUrl(seedUrl, seedTitle) }
      else if (seedType === 'youtube') { if (!seedUrl.trim()) throw new Error('YouTube URL required'); await brainIngestYouTube(seedUrl, seedTitle) }
      setSeedMsg('✓ Ingestion queued!'); setSeedContent(''); setSeedUrl(''); setSeedTitle('')
      setTimeout(loadJobs, 800)
    } catch (e: any) { setSeedMsg(`Error: ${e.message}`) } finally { setSeeding(false) }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setSeeding(true); setSeedMsg('')
    try { await brainIngestFile(file); setSeedMsg(`✓ "${file.name}" queued.`); setTimeout(loadJobs, 800) }
    catch (err: any) { setSeedMsg(`Error: ${err.message}`) } finally { setSeeding(false) }
  }

  const TABS: { id: BrainTab; label: string }[] = [
    { id: 'search', label: 'Search' }, { id: 'seed', label: 'Seed' },
    { id: 'onboard', label: 'Onboard' }, { id: 'digest', label: 'Digest' },
  ]

  return (
    <div className={cn("flex h-full w-full flex-col", bgType === 'glass' ? "bg-transparent" : "bg-white")}>
      <ViewHeader title="Company Brain" subtitle="Semantic org knowledge — search, seed and grow intelligence" isNarrow={isNarrow} />

      <div className="flex border-b border-black/5 px-6 gap-5 bg-white">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn("pb-3 pt-2 text-sm font-semibold border-b-2 transition-all",
              activeTab === t.id ? "border-purple text-purple" : "border-transparent text-ink-soft hover:text-ink")}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'search' && (
          <div>
            <h2 className="text-base font-bold text-ink mb-1">Search the Brain</h2>
            <p className="text-xs text-ink-soft mb-4">Ask anything — results pulled semantically from your org's knowledge base.</p>
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black/30" />
                <input type="text" placeholder="e.g. What is our refund policy?" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-full rounded-xl border border-black/10 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple/20" />
              </div>
              <button onClick={handleSearch} disabled={searching || !searchQuery.trim()}
                className="rounded-xl bg-purple px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:opacity-90">
                {searching ? <Loader2 className="size-4 animate-spin" /> : 'Search'}
              </button>
            </div>
            {searchResults.length === 0 && !searching ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-black/5 p-10 text-center">
                <BrainIcon className="size-12 text-black/10" />
                <p className="text-sm text-ink-soft">Results will appear here after you search.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((r: any, idx: number) => (
                  <div key={idx} className="rounded-2xl border border-black/5 bg-white p-4 hover:border-purple/20 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-bold text-ink">{r.title || 'Knowledge Chunk'}</h3>
                      <span className="text-[10px] font-semibold text-purple bg-purple/10 rounded-lg px-2 py-0.5">{Math.round((r.score || 0) * 100)}%</span>
                    </div>
                    <p className="text-xs text-ink-soft leading-relaxed line-clamp-4">{r.chunk}</p>
                    {r.department && <span className="inline-block mt-2 text-[10px] font-medium text-black/40 bg-black/5 rounded-lg px-2 py-0.5">{r.department}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'seed' && (
          <div>
            <h2 className="text-base font-bold text-ink mb-1">Seed the Brain</h2>
            <p className="text-xs text-ink-soft mb-4">Add knowledge via text, URL, YouTube, or file upload.</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {BRAIN_SOURCE_TYPES.map(t => (
                <button key={t.key} onClick={() => setSeedType(t.key)}
                  className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold border transition-all",
                    seedType === t.key ? "border-purple bg-purple/10 text-purple" : "border-black/10 text-ink-soft hover:border-purple/30")}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Title (optional)" value={seedTitle} onChange={e => setSeedTitle(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-purple/20" />
            {seedType === 'text' && (
              <textarea placeholder="Paste your knowledge here…" value={seedContent} onChange={e => setSeedContent(e.target.value)} rows={6}
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-purple/20" />
            )}
            {(seedType === 'url' || seedType === 'youtube') && (
              <input type="text" placeholder={seedType === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://...'} value={seedUrl} onChange={e => setSeedUrl(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-purple/20" />
            )}
            {seedType === 'file' ? (
              <div>
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.mp3,.mp4,.wav,.json" className="hidden" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} disabled={seeding}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple/20 bg-purple/3 p-6 text-sm font-semibold text-purple hover:bg-purple/8 transition-all disabled:opacity-50">
                  <Upload className="size-5" />
                  {seeding ? 'Uploading…' : 'Click to upload PDF, DOCX, TXT, MP3, MP4…'}
                </button>
              </div>
            ) : (
              <button onClick={handleSeed} disabled={seeding}
                className="w-full rounded-xl bg-purple py-3 text-sm font-bold text-white disabled:opacity-50 hover:opacity-90 transition-opacity">
                {seeding ? <Loader2 className="size-4 animate-spin mx-auto" /> : 'Ingest into Brain →'}
              </button>
            )}
            {seedMsg && (
              <p className={cn("mt-3 text-xs font-semibold rounded-xl px-3 py-2",
                seedMsg.startsWith('✓') ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                {seedMsg}
              </p>
            )}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-black/40 uppercase tracking-wider">Recent Jobs</h3>
                <button onClick={loadJobs} className="text-purple hover:opacity-70"><RotateCcw className="size-3.5" /></button>
              </div>
              {jobsLoading ? <div className="flex items-center gap-2 text-ink-soft text-xs"><Loader2 className="size-4 animate-spin" /> Loading…</div>
                : jobs.length === 0 ? <p className="text-xs text-ink-soft">No ingestion jobs yet.</p>
                  : (
                    <div className="space-y-2">
                      {jobs.slice(0, 8).map((j: any) => (
                        <div key={j._id} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3">
                          <div className={cn("size-2 rounded-full shrink-0",
                            j.status === 'completed' ? 'bg-emerald-500' : j.status === 'failed' ? 'bg-red-500' : j.status === 'processing' ? 'bg-purple animate-pulse' : 'bg-amber-400')} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-ink truncate">{j.title || j.sourceType}</p>
                            <p className="text-[10px] text-ink-soft capitalize">{j.status}</p>
                          </div>
                          <span className="text-[10px] text-black/30">{new Date(j.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
            </div>
          </div>
        )}

        {activeTab === 'onboard' && (
          <div>
            <h2 className="text-base font-bold text-ink mb-1">Onboarding Brief</h2>
            <p className="text-xs text-ink-soft mb-4">Generate a personalised brief powered by your org's brain. New members get the same access to historical knowledge.</p>
            <button onClick={async () => { setOnboardLoading(true); try { const d = await getBrainOnboardingBrief(); setOnboardBrief(d?.brief || 'No brief available.') } catch (e: any) { setOnboardBrief(`Error: ${e.message}`) } finally { setOnboardLoading(false) } }}
              disabled={onboardLoading}
              className="flex items-center gap-2 rounded-xl bg-purple px-5 py-3 text-sm font-bold text-white disabled:opacity-50 hover:opacity-90 transition-opacity mb-5">
              {onboardLoading ? <Loader2 className="size-4 animate-spin" /> : <BookOpen className="size-4" />}
              Generate My Brief
            </button>
            {onboardBrief && (
              <div className="rounded-2xl border border-purple/10 bg-purple/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-purple/15"><BrainIcon className="size-4 text-purple" /></div>
                  <span className="text-sm font-semibold text-ink">Your Onboarding Brief</span>
                </div>
                <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{onboardBrief}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'digest' && <BrainDigestPanel />}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* CalendarView                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

const WEB_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEB_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEB_TODAY = new Date()
// Indicator spec (shared with mobile): green=meetings, yellow=recurring,
// blue=events, purple=tasks, orange=holidays.
const WEB_EVENT_COLORS: Record<string, string> = {
  meeting_video: '#22c55e', meeting_audio: '#22c55e',  // green
  company: '#3b82f6', all_day: '#3b82f6',              // blue (general events)
  holiday: '#f4663b',                                   // orange (matches mobile COLOR_HOLIDAY)
  task: '#6c5ce7',                                      // purple
}

// Resolve a calendar item's indicator colour. Recurrence wins over base type so
// a repeating event reads as yellow; tasks fall back to purple.
function webEventColor(ev: any): string {
  if (ev?.eventType === 'holiday') return '#f4663b'
  if (ev?.isRecurring || ev?.recurrenceRule || ev?.parentEventId || ev?.__recurring) return '#eab308' // yellow
  return WEB_EVENT_COLORS[ev?.eventType] || '#6c5ce7'
}

function isWebSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function CalendarView({ isNarrow = false }: { onMessage?: (user: any) => void, isNarrow?: boolean }) {
  const { bgType } = useDashboard()
  const [currentDate, setCurrentDate] = useState(new Date(WEB_TODAY))
  const [events, setEvents] = useState<any[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date>(WEB_TODAY)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [digest, setDigest] = useState<any>(null)
  const [digestLoading, setDigestLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState('meeting_video')
  const [newDesc, setNewDesc] = useState('')
  const [newAgenda, setNewAgenda] = useState('')
  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState('')
  const [suggestions, setSuggestions] = useState<any>(null)
  const titleDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadEvents = async () => {
    setEventsLoading(true)
    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      const d = await getCalendarEvents({ start: start.toISOString(), end: end.toISOString() })
      setEvents(d?.events || [])
    } catch { /* silent */ } finally { setEventsLoading(false) }
  }

  useEffect(() => { loadEvents() }, [currentDate])
  useEffect(() => { apiGetDailyDigest().then(d => setDigest(d?.digest)).catch(() => { }).finally(() => setDigestLoading(false)) }, [])

  useEffect(() => {
    if (!newTitle.trim()) { setSuggestions(null); return }
    if (titleDebounce.current) clearTimeout(titleDebounce.current)
    titleDebounce.current = setTimeout(async () => {
      try { const d = await getEventSuggestions(newTitle.trim()); setSuggestions(d); if (d?.agendaSuggestion && !newAgenda) setNewAgenda(d.agendaSuggestion) } catch { /* silent */ }
    }, 600)
  }, [newTitle])

  const handleCreate = async () => {
    if (!newTitle.trim()) return setCreateErr('Title required')
    setCreating(true); setCreateErr('')
    const startTime = new Date(selectedDay); startTime.setHours(10, 0, 0, 0)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
    try {
      await apiCreateCalendarEvent({ title: newTitle.trim(), eventType: newType, description: newDesc, agenda: newAgenda, startTime: startTime.toISOString(), endTime: endTime.toISOString() })
      setShowCreate(false); setNewTitle(''); setNewDesc(''); setNewAgenda('')
      loadEvents()
    } catch (e: any) { setCreateErr(e.message) } finally { setCreating(false) }
  }

  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const calCells: (Date | null)[] = [
    ...Array(firstDay.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1)),
  ]
  const eventsOnDay = (d: Date) => events.filter(e => isWebSameDay(new Date(e.startTime), d))
  const selectedDayEvents = eventsOnDay(selectedDay)
  const upcoming = events.filter(e => new Date(e.startTime) > new Date() && new Date(e.startTime) <= new Date(Date.now() + 7 * 86400000)).slice(0, 5)
  const fmtT = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const fmtD = (iso: string) => new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })

  // needed for digest import alias
  const apiGetDailyDigest = webGetDailyDigest

  return (
    <div className={cn("flex h-full w-full flex-col", bgType === 'glass' ? "bg-transparent" : "bg-white")}>
      <ViewHeader title="Calendar" subtitle="Schedule meetings, track events, and start calls powered by the Brain" isNarrow={isNarrow}
        action={<button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-xl bg-purple px-4 py-2 text-sm font-bold text-white hover:opacity-90"><Plus className="size-4" /> New Event</button>} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-y-auto p-5 border-r border-black/5">
          {!digestLoading && digest?.morningBrief && (
            <div className="mb-5 rounded-2xl border border-purple/10 bg-purple/5 p-4">
              <div className="flex items-center gap-2 mb-2"><Sparkles className="size-4 text-purple" /><span className="text-xs font-bold text-purple">Morning Brief</span></div>
              <p className="text-xs text-ink leading-relaxed line-clamp-3">{digest.morningBrief}</p>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() - 1); setCurrentDate(d) }}
              className="flex size-8 items-center justify-center rounded-xl border border-black/10 hover:bg-black/5"><ChevronLeft className="size-4" /></button>
            <h2 className="text-base font-bold text-ink">{WEB_MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
            <button onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() + 1); setCurrentDate(d) }}
              className="flex size-8 items-center justify-center rounded-xl border border-black/10 hover:bg-black/5"><ChevronRight className="size-4" /></button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {WEB_WEEKDAYS.map(d => <div key={d} className="text-center text-[10px] font-semibold text-black/30 uppercase tracking-wider py-1">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-5">
            {calCells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} />
              const isToday = isWebSameDay(day, WEB_TODAY)
              const isSelected = isWebSameDay(day, selectedDay)
              const dayEvs = eventsOnDay(day)
              return (
                <button key={day.toISOString()} onClick={() => setSelectedDay(new Date(day))}
                  className={cn("flex flex-col items-center py-1.5 rounded-xl transition-all", isSelected ? "bg-purple/10" : "hover:bg-black/3")}>
                  <span className={cn("flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                    isToday && !isSelected ? "bg-purple/15 text-purple" : "",
                    isSelected ? "bg-purple text-white" : "text-ink")}>
                    {day.getDate()}
                  </span>
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-[30px]">
                    {dayEvs.slice(0, 3).map((e, i) => <div key={i} className="size-1.5 rounded-full" style={{ backgroundColor: webEventColor(e) }} />)}
                  </div>
                </button>
              )
            })}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-black/40 uppercase tracking-wider mb-3">
              {isWebSameDay(selectedDay, WEB_TODAY) ? 'Today' : fmtD(selectedDay.toISOString())}
              <span className="ml-1 text-black/30">· {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''}</span>
            </h3>
            {eventsLoading && <div className="flex items-center gap-2 text-ink-soft text-xs py-3"><Loader2 className="size-4 animate-spin" /> Loading…</div>}
            {!eventsLoading && selectedDayEvents.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Calendar className="size-10 text-black/10" />
                <p className="text-xs text-ink-soft">No events. Click + New Event to create one.</p>
              </div>
            )}
            <div className="space-y-2">
              {selectedDayEvents.map(event => (
                <button key={event._id} onClick={() => setSelectedEvent(event)} className="w-full text-left rounded-2xl border border-black/5 p-3 hover:border-purple/20 hover:shadow-sm transition-all"
                  style={{ borderLeftWidth: 3, borderLeftColor: webEventColor(event) }}>
                  <p className="text-sm font-semibold text-ink">{event.title}</p>
                  {!event.isAllDay && <p className="text-xs text-ink-soft mt-0.5">{fmtT(event.startTime)} – {fmtT(event.endTime)}</p>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!isNarrow && (
          <div className="w-72 shrink-0 overflow-y-auto p-5 space-y-5">
            {selectedEvent ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-ink">Event Details</h3>
                  <button onClick={() => setSelectedEvent(null)} className="text-black/30 hover:text-black"><X className="size-4" /></button>
                </div>
                <div className="h-1.5 rounded-full mb-4" style={{ backgroundColor: webEventColor(selectedEvent) }} />
                <h2 className="text-base font-bold text-ink mb-2">{selectedEvent.title}</h2>
                <p className="text-xs text-ink-soft mb-1"><Clock className="inline size-3 mr-1" />{fmtD(selectedEvent.startTime)} · {fmtT(selectedEvent.startTime)} – {fmtT(selectedEvent.endTime)}</p>
                {selectedEvent.summary && (
                  <div className="mt-3 rounded-xl bg-purple/5 border border-purple/10 p-3">
                    <p className="text-[11px] font-semibold text-purple mb-1">AI Summary</p>
                    <p className="text-xs text-ink leading-relaxed">{selectedEvent.summary}</p>
                  </div>
                )}
                {(selectedEvent.eventType === 'meeting_video' || selectedEvent.eventType === 'meeting_audio') && selectedEvent.status === 'scheduled' && (
                  <button onClick={() => apiStartMeeting(selectedEvent._id).then(d => window.alert(`Room: ${d.roomId}`)).catch((e: any) => window.alert(e.message))}
                    className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-purple py-3 text-sm font-bold text-white hover:opacity-90">
                    <Video className="size-4" /> Start Meeting
                  </button>
                )}
                {selectedEvent.status === 'live' && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3">
                    <div className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-700">Meeting is live</span>
                  </div>
                )}
                <button onClick={() => apiDeleteCalendarEvent(selectedEvent._id).then(() => { setSelectedEvent(null); loadEvents() })}
                  className="mt-3 w-full rounded-xl border border-red-100 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors">
                  Cancel Event
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-xs font-semibold text-black/40 uppercase tracking-wider mb-3">Upcoming (7 days)</h3>
                {upcoming.length === 0 ? <p className="text-xs text-ink-soft">No upcoming events in the next 7 days.</p>
                  : upcoming.map(event => (
                    <button key={event._id} onClick={() => setSelectedEvent(event)} className="w-full text-left rounded-xl border border-black/5 p-3 mb-2 hover:border-purple/20 transition-all">
                      <p className="text-xs font-semibold text-ink">{event.title}</p>
                      <p className="text-[10px] text-ink-soft mt-0.5">{fmtD(event.startTime)}</p>
                      <div className="mt-1 h-0.5 rounded-full w-10" style={{ backgroundColor: webEventColor(event) }} />
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-ink">New Event</h2>
              <button onClick={() => setShowCreate(false)} className="flex size-8 items-center justify-center rounded-xl bg-black/5 hover:bg-black/10"><X className="size-4 text-black/50" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-black/40 mb-2">Event Type</p>
                <div className="flex gap-2 flex-wrap">
                  {[{ key: 'meeting_video', label: 'Video' }, { key: 'meeting_audio', label: 'Audio' }, { key: 'company', label: 'Company' }, { key: 'all_day', label: 'All Day' }].map(t => (
                    <button key={t.key} onClick={() => setNewType(t.key)}
                      className={cn("rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all",
                        newType === t.key ? "border-purple bg-purple/10 text-purple" : "border-black/10 text-ink-soft hover:border-purple/30")}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-black/40 block mb-1.5">Title</label>
                <input type="text" placeholder="e.g. Weekly Team Sync" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple/20" />
                {suggestions?.titleSuggestions?.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {suggestions.titleSuggestions.slice(0, 3).map((s: string) => (
                      <button key={s} onClick={() => setNewTitle(s)} className="rounded-xl bg-purple/10 px-2.5 py-1 text-[11px] font-semibold text-purple hover:bg-purple/20">
                        <Sparkles className="inline size-3 mr-1" />{s}
                      </button>
                    ))}
                  </div>
                )}
                {suggestions?.conflicts?.length > 0 && (
                  <p className="mt-2 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="size-3" /> {suggestions.conflicts.length} scheduling conflict(s)</p>
                )}
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-black/3 px-4 py-2.5">
                <Calendar className="size-4 text-purple" />
                <span className="text-xs font-semibold text-ink">{fmtD(selectedDay.toISOString())} · 10:00 AM – 11:00 AM</span>
              </div>
              <div>
                <label className="text-xs font-semibold text-black/40 block mb-1.5">Agenda (optional)</label>
                <textarea value={newAgenda} onChange={e => setNewAgenda(e.target.value)} rows={3} placeholder="Meeting agenda (auto-filled from brain)"
                  className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple/20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-black/40 block mb-1.5">Description (optional)</label>
                <input type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple/20" />
              </div>
              {createErr && <p className="text-xs text-red-500">{createErr}</p>}
              <button onClick={handleCreate} disabled={creating || !newTitle.trim()}
                className="w-full rounded-xl bg-purple py-3 text-sm font-bold text-white disabled:opacity-50 hover:opacity-90">
                {creating ? <Loader2 className="size-4 animate-spin mx-auto" /> : 'Create Event →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
/* ---------------- Profile ---------------- */


/* ---------------- Profile ---------------- */

function OrgSettingsModal({
  onClose,
  currentUser,
}: {
  onClose: () => void
  currentUser: any
}) {
  const { isUserOnline } = useSocket()
  const { getDisplayName } = useNicknames()
  const [activeTab, setActiveTab] = useState<'profile' | 'people' | 'transcripts'>('profile')
  const [isAdmin, setIsAdmin] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [allowShare, setAllowShare] = useState(true)

  // Profile fields
  const [orgName, setOrgName] = useState('')
  const [industry, setIndustry] = useState('')
  const [size, setSize] = useState('solo')
  const [description, setDescription] = useState('')
  const [logo, setLogo] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Data lists
  const [members, setMembers] = useState<any[]>([])
  const [transcripts, setTranscripts] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null)

  // Fetch invite code and role visibility
  useEffect(() => {
    const fetchInviteDetails = async () => {
      try {
        const { getOrgInviteCode } = await import('@/lib/api')
        const res = await getOrgInviteCode()
        if (res) {
          setIsAdmin(res.isAdmin ?? false)
          setInviteCode(res.inviteCode || '')
          setAllowShare(res.allowMembersToShareInvite ?? true)
          setOrgName(res.name || '')
          setLogo(res.logo || '')
          setDescription(res.description || '')
        }
      } catch (err) {
        console.error('Failed to get org invite details:', err)
      }
    }
    fetchInviteDetails()
  }, [])

  // Fetch People / Transcripts
  useEffect(() => {
    if (activeTab === 'people') {
      const fetchMembers = async () => {
        setLoadingData(true)
        try {
          const { getOrgMembers } = await import('@/lib/api')
          const res = await getOrgMembers()
          setMembers(res.members || [])
        } catch (err) {
          toast.error('Failed to load members')
        } finally {
          setLoadingData(false)
        }
      }
      fetchMembers()
    } else if (activeTab === 'transcripts') {
      const fetchTranscripts = async () => {
        setLoadingData(true)
        try {
          const { getOrgTranscripts } = await import('@/lib/api')
          const res = await getOrgTranscripts()
          setTranscripts(res.transcripts || [])
        } catch (err) {
          toast.error('Failed to load transcripts')
        } finally {
          setLoadingData(false)
        }
      }
      fetchTranscripts()
    }
  }, [activeTab])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return
    setIsSaving(true)
    try {
      const { updateOrgProfile } = await import('@/lib/api')
      await updateOrgProfile({
        name: orgName,
        industry,
        size,
        description,
        logo,
        allowMembersToShareInvite: allowShare,
      })
      toast.success('Organization profile updated!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const { uploadGroupOrOrgImage } = await import('@/lib/api')
      const url = await uploadGroupOrOrgImage(file)
      setLogo(url)
      toast.success('Logo uploaded!')
    } catch (err: any) {
      toast.error('Logo upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden rounded-[32px] animate-in zoom-in-95 duration-200 pointer-events-auto"
        style={{
          background: 'linear-gradient(160deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.9) 100%)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0 24px 80px -16px rgba(108,92,231,0.22), 0 8px 32px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-black/5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink flex items-center gap-2">
              <Settings className="size-5 text-purple" /> Organization Settings
            </h3>
            <p className="text-xs text-ink-soft">Configure organization settings and view metrics</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl transition-all cursor-pointer">
            <X className="size-5 text-ink-soft" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 py-3 border-b border-black/5 flex gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
              activeTab === 'profile' ? "bg-purple text-white shadow-md shadow-purple/15" : "text-ink-soft hover:bg-black/5"
            )}
          >
            Profile & Invites
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
              activeTab === 'people' ? "bg-purple text-white shadow-md shadow-purple/15" : "text-ink-soft hover:bg-black/5"
            )}
          >
            People Directory
          </button>
          <button
            onClick={() => setActiveTab('transcripts')}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
              activeTab === 'transcripts' ? "bg-purple text-white shadow-md shadow-purple/15" : "text-ink-soft hover:bg-black/5"
            )}
          >
            Transcripts & Brain
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-6 text-left">
              {!isAdmin && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-700 font-semibold leading-relaxed flex items-start gap-3">
                  <span className="text-lg mt-0.5">⚠️</span>
                  <span>
                    You are viewing these settings as an employee. Logo upload, metadata editing, and settings updates are locked for non-administrative roles.
                  </span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {/* Logo & Name */}
                <div className="flex items-center gap-6">
                  <div className="relative size-20 rounded-2xl bg-black/5 border border-black/5 flex items-center justify-center overflow-hidden shrink-0 group">
                    {logo ? (
                      // The org logo is stored as a raw Filebase URL, which 404s unless
                      // presigned/proxied — route it through getSecureMediaUrl (same as
                      // avatars) so the uploaded image actually displays on save + reload.
                      <img src={getSecureMediaUrl(logo) || ''} alt="Logo" className="size-full object-cover" />
                    ) : (
                      <Briefcase className="size-8 text-black/20" />
                    )}
                    {isAdmin && (
                      <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer transition-opacity">
                        {isUploading ? '...' : <Upload className="size-4" />}
                        <input type="file" onChange={handleLogoUpload} accept="image/*" className="hidden" disabled={isUploading} />
                      </label>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Organization Name</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={e => setOrgName(e.target.value)}
                      disabled={!isAdmin}
                      className="w-full bg-white border border-black/10 rounded-xl px-3.5 py-2 text-sm mt-1 focus:outline-none focus:border-purple disabled:opacity-60"
                      placeholder="Organization Name"
                      required
                    />
                  </div>
                </div>

                {/* Industry & Size */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Industry</label>
                    <select
                      value={industry}
                      onChange={e => setIndustry(e.target.value)}
                      disabled={!isAdmin}
                      className="w-full bg-white border border-black/10 rounded-xl px-3.5 py-2 text-sm mt-1 focus:outline-none focus:border-purple disabled:opacity-60"
                    >
                      <option value="">Select Industry</option>
                      {INDUSTRIES.map(ind => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Company Size</label>
                    <select
                      value={size}
                      onChange={e => setSize(e.target.value)}
                      disabled={!isAdmin}
                      className="w-full bg-white border border-black/10 rounded-xl px-3.5 py-2 text-sm mt-1 focus:outline-none focus:border-purple disabled:opacity-60"
                    >
                      <option value="solo">Solo (1 employee)</option>
                      <option value="2-10">2-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Description / Bio</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full bg-white border border-black/10 rounded-xl px-3.5 py-2 text-sm mt-1 focus:outline-none focus:border-purple min-h-[80px] resize-none disabled:opacity-60"
                    placeholder="Describe your organization's mission and purpose..."
                  />
                </div>

                {/* Invite Code Permissions (Admin only toggle) */}
                {isAdmin && (
                  <div className="flex items-center justify-between border-t border-black/5 pt-4">
                    <div>
                      <p className="text-xs font-bold text-ink">Allow members to share invite codes</p>
                      <p className="text-[10px] text-ink-soft">If disabled, employees won't see or be able to share invite details.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowShare}
                      onChange={e => setAllowShare(e.target.checked)}
                      className="accent-purple size-4 cursor-pointer"
                    />
                  </div>
                )}

                {isAdmin && (
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-3 bg-purple text-white font-bold rounded-xl text-xs active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-purple/10"
                  >
                    {isSaving ? 'Saving...' : 'Update Settings'}
                  </button>
                )}
              </form>

              {/* Invite Code display widget */}
              {inviteCode ? (
                <div className="border-t border-black/5 pt-4 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Organization Invite Code</label>
                  <div className="flex items-center justify-between bg-black/5 rounded-2xl px-4 py-3 border border-black/5 mt-1">
                    <span className="font-mono text-sm font-semibold text-ink select-all">{inviteCode}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(inviteCode)
                        toast.success('Invite code copied to clipboard!')
                      }}
                      className="p-1.5 hover:bg-black/5 rounded-lg text-purple flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                      title="Copy invite code"
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-black/5 pt-4 text-center py-4 bg-black/5 rounded-2xl">
                  <p className="text-xs font-bold text-ink-soft">Invite Sharing Disabled</p>
                  <p className="text-[10px] text-ink-soft mt-0.5">Only administrators have access to organization invitation protocols.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'people' && (
            <div className="space-y-4 text-left">
              <h4 className="text-xs font-bold text-ink-soft uppercase tracking-wider">Members Directory ({members.length})</h4>
              {loadingData ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-purple" />
                </div>
              ) : members.length === 0 ? (
                <p className="text-center text-xs text-ink-soft py-12">No organization members found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {members.map(member => (
                    <div key={member._id || member.username} className="bg-white/60 border border-black/5 rounded-2xl p-4 flex items-center gap-3">
                      <div className="relative">
                        <ChatAvatar src={member.avatar} name={getDisplayName(member)} className="size-10 rounded-xl" />
                        {isUserOnline(member._id || member.id) && (
                          <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-green-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-sm text-ink truncate">{getDisplayName(member)}</h5>
                        <p className="text-[10px] text-purple font-bold tracking-wide mt-0.5">{member.org_role || member.role || 'Member'}</p>
                        <p className="text-[10px] text-ink-soft truncate mt-0.5">{member.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transcripts' && (
            <div className="space-y-4 text-left">
              <h4 className="text-xs font-bold text-ink-soft uppercase tracking-wider">Brain & Meeting Transcripts ({transcripts.length})</h4>
              {loadingData ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-purple" />
                </div>
              ) : transcripts.length === 0 ? (
                <p className="text-center text-xs text-ink-soft py-12">No meeting minutes or transcripts recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {transcripts.map(meeting => {
                    const isExpanded = expandedMeeting === meeting._id
                    const durationStr = meeting.duration ? `${Math.round(meeting.duration / 60)} mins` : 'N/A'
                    const dateStr = new Date(meeting.startedAt || meeting.createdAt).toLocaleDateString([], {
                      dateStyle: 'medium'
                    })

                    return (
                      <div key={meeting._id} className="bg-white/60 border border-black/5 rounded-2xl overflow-hidden transition-all">
                        {/* Header Trigger */}
                        <div
                          onClick={() => setExpandedMeeting(isExpanded ? null : meeting._id)}
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-black/2 transition-colors select-none"
                        >
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-sm text-ink truncate">{meeting.title || 'Untitled Meeting'}</h5>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] text-ink-soft font-semibold">
                              <span>📅 {dateStr}</span>
                              <span>⏱️ {durationStr}</span>
                              <span>👤 Host: {meeting.host ? getDisplayName(meeting.host) : 'Unknown'}</span>
                            </div>
                          </div>
                          <ChevronRight className={cn("size-4 text-ink-soft transition-transform", isExpanded ? "rotate-90 text-purple" : "")} />
                        </div>

                        {/* Expandable Details */}
                        {isExpanded && (
                          <div className="border-t border-black/5 p-4 bg-purple-soft/5 space-y-4 animate-in slide-in-from-top-2 duration-150">
                            {/* Summary / AI Detailed Explanation */}
                            <div>
                              <h6 className="text-[10px] font-bold text-purple uppercase tracking-wider mb-1">Aida Meeting Brain Overview</h6>
                              <div className="bg-white/80 border border-black/5 rounded-xl p-3.5 text-xs text-ink leading-relaxed whitespace-pre-line">
                                {meeting.summary || 'AI Explanation is generating or unavailable.'}
                              </div>
                            </div>

                            {/* Action Items */}
                            {meeting.actionItems && meeting.actionItems.length > 0 && (
                              <div>
                                <h6 className="text-[10px] font-bold text-purple uppercase tracking-wider mb-1">Action Items Assigned</h6>
                                <div className="space-y-2">
                                  {meeting.actionItems.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2 bg-white/40 border border-black/5 rounded-xl p-2.5 text-xs text-ink leading-tight">
                                      <span className="text-purple">📌</span>
                                      <div className="flex-1">
                                        <p className="font-medium">{item.text}</p>
                                        {item.assignedToName && (
                                          <p className="text-[9px] text-purple font-bold tracking-wide mt-0.5">Assigned to: {item.assignedToName}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Raw Transcript (Collapsible block) */}
                            {meeting.transcriptRaw && (
                              <div>
                                <h6 className="text-[10px] font-bold text-ink-soft uppercase tracking-wider mb-1">Raw Audio Transcript</h6>
                                <div className="bg-black/5 rounded-xl p-3 font-mono text-[10px] leading-relaxed max-h-40 overflow-y-auto text-ink">
                                  {meeting.transcriptRaw}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProfileView({ user, onEdit }: { user: any, onEdit: () => void }) {
  const isMobile = useIsMobile()
  const { bgType } = useDashboard()
  const [showOrgModal, setShowOrgModal] = useState(false)
  const stats = [
    { label: 'Chats', value: user?.chatsCount || 0 },
    { label: 'Files', value: user?.filesCount || 0 },
  ]

  return (
    <div className={cn("flex h-full w-full flex-col", bgType === 'glass' ? "bg-transparent" : "bg-white")}>
      <ViewHeader title="Profile" subtitle="Manage your account" />
      <div className={cn("flex-1 overflow-y-auto", bgType === 'glass' ? "bg-transparent" : "bg-white")}>
        <div className={cn(
          "mx-auto flex flex-col gap-6",
          isMobile ? "p-0 max-w-full" : "p-8 max-w-4xl"
        )}>
          {/* Hero card */}
          <div className={cn(
            "flex flex-col items-center bg-purple-soft/30 text-center shadow-sm w-full",
            isMobile ? "p-6 rounded-none" : "p-12 rounded-3xl border border-black/5"
          )}>
            <Image
              src={user?.avatar || '/placeholder.svg'}
              alt={user?.full_name || 'User'}
              width={isMobile ? 96 : 160}
              height={isMobile ? 96 : 160}
              className={cn("rounded-3xl object-cover shadow-md", isMobile ? "size-24" : "size-40")}
            />
            <h2 className={cn("font-bold text-ink", isMobile ? "mt-5 text-[22px] leading-tight" : "mt-6 text-[32px]")}>
              {user?.full_name}
            </h2>
            <p className={cn("text-purple font-bold", isMobile ? "text-[14px] mt-1.5" : "text-[18px] mt-2")}>@{user?.username}</p>
            <p className={cn("text-ink-soft font-semibold", isMobile ? "mt-1.5 text-[14px]" : "mt-1.5 text-[16px]")}>{user?.org_role || user?.role}</p>
            <p className={cn("leading-relaxed text-ink-soft max-w-2xl mx-auto", isMobile ? "mt-4 text-[14px]" : "mt-4 text-[16px]")}>
              {user?.bio || 'No bio yet.'}
            </p>

            {/* Stats row */}
            <div className={cn(
              "flex w-full items-center justify-around rounded-2xl bg-white shadow-sm mx-auto",
              isMobile ? "mt-6 max-w-sm py-4" : "mt-8 max-w-2xl py-6"
            )}>
              {stats.map((s) => (
                <div key={s.label} className="text-center px-6">
                  <p className={cn("font-bold text-purple", isMobile ? "text-[20px]" : "text-[28px]")}>{s.value}</p>
                  <p className={cn("text-ink-soft font-semibold uppercase tracking-wider", isMobile ? "text-[10px] mt-0.5" : "text-[12px] mt-1")}>{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 items-center justify-center mt-6">
              <button
                type="button"
                onClick={onEdit}
                className={cn(
                  "flex items-center gap-2 rounded-2xl bg-purple text-white transition-opacity hover:opacity-90 font-bold shadow-lg shadow-purple/20 px-6 py-3 text-[14px]",
                  isMobile ? "w-full justify-center" : "px-8 py-3.5 text-[15px]"
                )}
              >
                <Pencil className="size-4" />
                Edit profile
              </button>

              {user?.organization && (
                <button
                  type="button"
                  onClick={() => setShowOrgModal(true)}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border border-purple/20 bg-purple/5 text-purple hover:bg-purple/10 transition-all font-bold shadow-lg shadow-purple/5 px-6 py-3 text-[14px]",
                    isMobile ? "w-full justify-center" : "px-8 py-3.5 text-[15px]"
                  )}
                >
                  <Settings className="size-4" />
                  Organization Settings
                </button>
              )}
            </div>
          </div>

          {/* Contact details card */}
          <div className={cn(
            "bg-purple-soft/30 w-full",
            isMobile ? "space-y-5 p-6 rounded-none shadow-sm" : "space-y-6 p-10 rounded-3xl border border-black/5"
          )}>
            <p className={cn("text-ink font-bold border-b border-black/10 pb-3", isMobile ? "text-[15px]" : "text-[18px]")}>
              Contact details
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl border border-black/5">
                <Mail className="text-purple size-5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-ink-soft font-bold uppercase tracking-wider">Email</p>
                  <p className="text-ink text-sm font-semibold truncate">{user?.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl border border-black/5">
                <Phone className="text-purple size-5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-ink-soft font-bold uppercase tracking-wider">Phone</p>
                  <p className="text-ink text-sm font-semibold truncate">{user?.phone_number || 'N/A'}</p>
                </div>
              </div>

              {user?.organization && (
                <div className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl border border-black/5">
                  <Briefcase className="text-purple size-5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-ink-soft font-bold uppercase tracking-wider">Organization</p>
                    <p className="text-ink text-sm font-semibold truncate">{user.organization} ({user.org_role})</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showOrgModal && (
        <OrgSettingsModal
          onClose={() => setShowOrgModal(false)}
          currentUser={user}
        />
      )}
    </div>
  )
}

/* ---------------- Edit ---------------- */

export function EditView({
  user,
  setUser,
  bgType,
  setBgType,
}: {
  user: any
  setUser: (u: any) => void
  bgType: string
  setBgType: (t: string) => void
}) {
  const isMobile = useIsMobile()
  const { setTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [selectedCountryCode, setSelectedCountryCode] = useState(() => {
    const phone = user?.phone_number || ''
    if (phone.startsWith('+')) {
      const matched = countries.find(c => phone.startsWith(c.dial_code))
      if (matched) return matched.code
    }
    return 'US'
  })
  const suggestUsername = (fullName: string) => {
    if (!fullName) return 'user_' + Math.floor(1000 + Math.random() * 9000);
    const cleanName = fullName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${cleanName}_${randomNum}`;
  }

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    username: user?.username || (user?.full_name ? suggestUsername(user.full_name) : 'user_' + Math.floor(1000 + Math.random() * 9000)),
    org_role: user?.org_role || '',
    org_industry: user?.org_industry || '',
    org_size: user?.org_size || '',
    bio: user?.bio || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    organization: user?.organization || '',
    inviteCode: '',
    actionItemEmailMode: (user?.actionItemEmailMode as 'each' | 'summary' | 'off') || 'each',
  })

  // Join-a-group-by-code (independent of the profile form).
  const [groupCode, setGroupCode] = useState('')
  const [joiningGroup, setJoiningGroup] = useState(false)
  const handleJoinGroup = async () => {
    const code = groupCode.trim()
    if (!code) { toast.error('Enter a group code to join'); return }
    setJoiningGroup(true)
    try {
      const res = await joinGroupChat(code)
      const chat = res?.conversation || res?.data?.conversation || res?.data || res
      toast.success(res?.message || 'Joined group!')
      setGroupCode('')
      // The backend also emits `new_chat` over the socket, which refreshes the
      // chat list; navigate straight into the group if we got its id.
      const id = chat?.id || chat?._id
      if (id) window.location.assign(`/dashboard/chat/${id}`)
    } catch (err: any) {
      toast.error(err?.message || 'Could not join group. Check the code and try again.')
    } finally {
      setJoiningGroup(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...formData,
        ...(user.role !== 'admin' ? {
          gender: null,
          status_message: null,
          mood_emoji: null,
          hobbies: [],
          location: null,
        } : {})
      }
      const res = await updateProfile(payload)
      setUser(res.data)
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await uploadAvatar(file)
      setUser(res.data.user)
      toast.success('Avatar updated!')
    } catch (err: any) {
      toast.error('Avatar upload failed')
    }
  }

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await uploadBackground(file)
      const u = res.data.user || res.data
      setUser(u)
      if (u.app_background === 'custom' && u.custom_background) {
        setBgType(u.custom_background)
      } else {
        setBgType(u.app_background || 'custom')
      }
      toast.success('Custom background set!')
    } catch (err: any) {
      console.error('[BackgroundUpload] failed:', err)
      toast.error(err.message || 'Background upload failed')
    }
  }

  const handleBgSelect = async (type: string) => {
    // Background image is cosmetic only — it does NOT change the light/dark text theme
    // (that's the separate Appearance toggle), so picking "Light" can't blank the dashboard.
    setBgType(type)
    try {
      const res = await updateProfile({ app_background: type })
      setUser(res.data)
    } catch (err) {
      toast.error('Failed to update background preference')
    }
  }

  // Shared input class
  const inputCls = "w-full rounded-2xl bg-purple-soft px-4 py-3.5 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
  const labelCls = "mb-1.5 block text-[13px] font-medium text-ink-soft"

  return (
    <div className={cn("flex h-full w-full flex-col", bgType === 'glass' ? "bg-transparent" : "bg-white")}>
      <ViewHeader title="Edit profile" subtitle="Update your information" />
      <div className={cn("flex-1 overflow-y-auto flex flex-col items-center", bgType === 'glass' ? "bg-transparent" : "bg-white")}>
        <form
          onSubmit={handleUpdate}
          className={cn(
            "bg-purple-soft/30 shadow-sm",
            isMobile
              ? "my-4 w-[calc(100%-2rem)] max-w-md rounded-2xl border border-black/5 p-6"
              : "my-8 w-full max-w-4xl rounded-3xl border border-black/5 p-12"
          )}
        >
          {/* Avatar section */}
          <div className="flex flex-col items-center justify-center text-center gap-2 mb-8">
            <div className="relative">
              <Image
                src={user?.avatar || '/placeholder.svg'}
                alt={user?.full_name || 'User'}
                width={isMobile ? 100 : 136}
                height={isMobile ? 100 : 136}
                className={cn("rounded-3xl object-cover shadow-md", isMobile ? "size-24" : "size-34")}
              />
              <label className="absolute -bottom-1 -right-1 flex size-10 cursor-pointer items-center justify-center rounded-full bg-purple text-white shadow-md">
                <Camera className="size-5" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>
            <div className="mt-3">
              <p className={cn("font-bold text-ink", isMobile ? "text-[16px]" : "text-[18px]")}>Profile photo</p>
              <p className="text-[13px] text-ink-soft">PNG or JPG, up to 5MB</p>
            </div>
          </div>

          <div className="w-full border-b border-black/10 mb-8" />

          {/* Form fields */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <label className="block">
                <span className={labelCls}>Full name</span>
                <input type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>Username</span>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    className={cn(inputCls, "pr-24")}
                    placeholder="username"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const generated = suggestUsername(formData.full_name || user?.full_name);
                      setFormData(prev => ({ ...prev, username: generated }));
                    }}
                    className="absolute right-2 px-3 py-1.5 bg-purple/10 hover:bg-purple/20 text-purple text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="size-3" />
                    Generate
                  </button>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <label className="block">
                <span className={labelCls}>Organization</span>
                <input type="text" value={formData.organization} onChange={e => setFormData({ ...formData, organization: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>Role</span>
                <select value={formData.org_role} onChange={e => setFormData({ ...formData, org_role: e.target.value })} className={cn(inputCls, "appearance-none")}>
                  <option value="">Select role</option>
                  {OFFICE_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <label className="block">
                <span className={labelCls}>Email</span>
                <input disabled type="email" value={formData.email} className="w-full rounded-2xl bg-purple-soft/50 px-4 py-3.5 text-[14px] text-ink-soft cursor-not-allowed outline-none" />
              </label>
              <label className="block">
                <span className={labelCls}>Phone</span>
                <div className="relative flex items-center">
                  {/* Country Selector Dropdown */}
                  <div className="absolute left-1.5 z-10 flex items-center h-full">
                    <select
                      value={selectedCountryCode}
                      onChange={(e) => {
                        const code = e.target.value
                        setSelectedCountryCode(code)
                        const matched = countries.find(c => c.code === code)
                        if (matched) {
                          setFormData(prev => {
                            const oldVal = prev.phone_number
                            if (oldVal.startsWith('+')) {
                              const prevMatch = countries.find(c => oldVal.startsWith(c.dial_code))
                              if (prevMatch) {
                                return {
                                  ...prev,
                                  phone_number: oldVal.replace(prevMatch.dial_code, matched.dial_code)
                                }
                              }
                            }
                            return {
                              ...prev,
                              phone_number: matched.dial_code + ' ' + oldVal.replace(/^\+\d+\s*/, '')
                            }
                          })
                        }
                      }}
                      className="opacity-0 absolute inset-0 cursor-pointer w-14 h-8"
                    >
                      {countries.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name} ({c.dial_code})
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-transparent text-sm pointer-events-none select-none">
                      <span className="text-lg">{(countries.find(c => c.code === selectedCountryCode) || countries[0]).flag}</span>
                      <span className="text-[11px] text-ink-soft font-bold">{(countries.find(c => c.code === selectedCountryCode) || countries[0]).dial_code}</span>
                    </div>
                    <div className="w-[1px] h-5 bg-black/10 mx-0.5" />
                  </div>
                  <input
                    type="tel"
                    className={cn(inputCls, "pl-20")}
                    placeholder="e.g. 812 345 6789"
                    value={formData.phone_number}
                    onChange={e => {
                      const val = e.target.value
                      setFormData({ ...formData, phone_number: val })
                      if (val.startsWith('+')) {
                        const matched = countries.find(c => val.startsWith(c.dial_code))
                        if (matched && matched.code !== selectedCountryCode) {
                          setSelectedCountryCode(matched.code)
                        }
                      }
                    }}
                  />
                </div>
              </label>
            </div>

            <label className="block">
              <span className={labelCls}>Bio</span>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                className="w-full resize-none rounded-2xl bg-purple-soft px-4 py-3.5 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
                placeholder="Tell us about yourself..."
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <label className="block">
                <span className={labelCls}>Industry</span>
                <select value={formData.org_industry} onChange={e => setFormData({ ...formData, org_industry: e.target.value })} className={cn(inputCls, "appearance-none")}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelCls}>Company Size</span>
                <select value={formData.org_size} onChange={e => setFormData({ ...formData, org_size: e.target.value })} className={cn(inputCls, "appearance-none")}>
                  <option value="">Select size</option>
                  {['solo', '2-10', '11-50', '51-200', '201-500', '500+'].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* ── Organisation Join Card ── */}
            {!user?.organization ? (
              /* Highlighted CTA for users who have no org yet */
              <div className="rounded-2xl border-2 border-purple/30 bg-purple/5 p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-purple flex items-center justify-center shrink-0">
                    <Users className="size-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-ink">Join your organisation</p>
                    <p className="text-[12px] text-ink-soft mt-0.5 leading-relaxed">
                      Enter an invite code from your company admin to connect with your colleagues.
                      You'll be able to see and message people in your organisation.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.inviteCode || ''}
                    onChange={e => setFormData({ ...formData, inviteCode: e.target.value })}
                    className={cn(inputCls, "flex-1")}
                    placeholder="Enter 8-digit invite code e.g. ABC12345"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!formData.inviteCode?.trim()) { toast.error('Please enter an invite code'); return; }
                      try {
                        await joinOrganizationByInvite(formData.inviteCode);
                        toast.success('Successfully joined organisation!');
                        window.location.reload();
                      } catch (err: any) {
                        toast.error(err.message || 'Invalid invite code');
                      }
                    }}
                    className="px-6 rounded-2xl bg-purple text-white text-sm font-bold shadow-lg shadow-purple/20 hover:opacity-90 active:scale-95 transition-all"
                  >
                    Join
                  </button>
                </div>
              </div>
            ) : (
              /* Subtle join section for users already in an org (e.g. switching) */
              <label className="block">
                <span className={labelCls}>Switch Organisation (Invite Code)</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.inviteCode || ''}
                    onChange={e => setFormData({ ...formData, inviteCode: e.target.value })}
                    className={cn(inputCls, "flex-1")}
                    placeholder="Enter new invite code"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!formData.inviteCode?.trim()) return;
                      try {
                        await joinOrganizationByInvite(formData.inviteCode);
                        toast.success('Successfully joined organisation!');
                        window.location.reload();
                      } catch (err: any) {
                        toast.error(err.message || 'Failed to join');
                      }
                    }}
                    className="px-7 rounded-2xl bg-purple text-white text-sm font-bold shadow-lg shadow-purple/10 hover:opacity-90 active:scale-95 transition-all"
                  >
                    Join
                  </button>
                </div>
              </label>
            )}

            {/* ── Join a Group by Code ── */}
            <label className="block">
              <span className={labelCls}>Join a group (paste invite code)</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={groupCode}
                  onChange={e => setGroupCode(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleJoinGroup(); } }}
                  className={cn(inputCls, "flex-1")}
                  placeholder="e.g. grp-1a2b3c4d5e6f or an invite link"
                />
                <button
                  type="button"
                  onClick={handleJoinGroup}
                  disabled={joiningGroup || !groupCode.trim()}
                  className="px-7 rounded-2xl bg-purple text-white text-sm font-bold shadow-lg shadow-purple/10 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {joiningGroup ? 'Joining…' : 'Join'}
                </button>
              </div>
              <span className="mt-1 block text-[11px] text-ink-soft">Ask a group member for the code, or paste the full invite link.</span>
            </label>


            {/* Action-Item Email Mode */}
            <div className="pt-2">
              <span className="mb-1.5 block text-[14px] font-semibold text-ink">Action-Item Emails</span>
              <p className="mb-4 text-[12px] text-ink-soft">Choose how BubbleSpace emails you about meeting action items assigned to you.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { value: 'each', label: 'Each item', desc: 'One email per due / overdue item' },
                  { value: 'summary', label: 'Daily summary', desc: 'All items in your morning brief' },
                  { value: 'off', label: 'Off', desc: 'No action-item emails' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, actionItemEmailMode: opt.value }))}
                    className={cn(
                      'flex flex-col items-start gap-0.5 rounded-2xl border-2 px-4 py-3.5 text-left transition-all',
                      formData.actionItemEmailMode === opt.value
                        ? 'border-purple bg-purple/5 ring-2 ring-purple/10'
                        : 'border-transparent bg-purple-soft/30 hover:bg-purple-soft/60',
                    )}
                  >
                    <span className="text-[13px] font-bold text-ink">{opt.label}</span>
                    <span className="text-[11px] text-ink-soft">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* App Background */}
            <div className="pt-2">
              <span className="mb-4 block text-[14px] font-semibold text-ink">App Background</span>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => handleBgSelect('bubbles')}
                  className={cn(
                    'flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all',
                    bgType === 'bubbles' ? 'border-purple bg-purple-soft/50 ring-4 ring-purple/10' : 'border-transparent bg-purple-soft/30 hover:bg-purple-soft/50',
                  )}
                >
                  <div className="size-12 rounded-full bg-purple/10 flex items-center justify-center">
                    <Sparkles className="size-6 text-purple" />
                  </div>
                  <span className="text-[13px] font-bold text-ink">Bubbles</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBgSelect('light')}
                  className={cn(
                    'flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all',
                    bgType === 'light' ? 'border-purple bg-purple-soft/50 ring-4 ring-purple/10' : 'border-transparent bg-purple-soft/30 hover:bg-purple-soft/50',
                  )}
                >
                  <div className="size-14 overflow-hidden rounded-xl shadow-sm border border-black/5">
                    <Image src="/themes/light.png" alt="Light" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[13px] font-bold text-ink">Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBgSelect('dark')}
                  className={cn(
                    'flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all',
                    bgType === 'dark' ? 'border-purple bg-purple-soft/50 ring-4 ring-purple/10' : 'border-transparent bg-purple-soft/30 hover:bg-purple-soft/50',
                  )}
                >
                  <div className="size-14 overflow-hidden rounded-xl shadow-sm border border-black/5">
                    <Image src="/themes/dark.png" alt="Dark" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[13px] font-bold text-ink">Dark</span>
                </button>


                <div className="relative text-left">
                  <label
                    className={cn(
                      'cursor-pointer w-full flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all',
                      (bgType === 'custom' || bgType.startsWith('/') || bgType.startsWith('http') || bgType.startsWith('data:'))
                        ? 'border-purple bg-purple-soft/50 ring-4 ring-purple/10'
                        : 'border-transparent bg-purple-soft/30 hover:bg-purple-soft/50',
                    )}
                  >
                    <div className="size-12 rounded-full bg-purple flex items-center justify-center text-white">
                      <Camera className="size-6" />
                    </div>
                    <span className="text-[13px] font-bold text-ink">Custom</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleBackgroundUpload} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="pt-8 flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "bg-purple text-white font-bold rounded-2xl shadow-lg shadow-purple/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50",
                isMobile ? "w-full h-14 text-[15px]" : "w-full max-w-lg h-14 text-[16px]"
              )}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
// export function ProfileView({ user, onEdit }: { user: any, onEdit: () => void }) {
//   const isMobile = useIsMobile()
//   const stats = [
//     { label: 'Chats', value: user?.postsCount || 0 },
//     { label: 'Following', value: user?.followingCount || 0 },
//     { label: 'Files', value: user?.sharedResources?.length || 0 },
//   ]

//   return (
//     <div className="flex h-full flex-col bg-white">
//       <ViewHeader title="Profile" subtitle="Manage your account" />
//       <div className={cn("flex-1 overflow-y-auto bg-white flex flex-col items-center", isMobile ? "p-0" : "p-6 sm:p-10")}>
//         <div className={cn("w-full flex flex-col gap-6", isMobile ? "max-w-full" : "max-w-3xl")}>
//           <div className={cn("flex flex-col items-center bg-purple-soft/30 text-center shadow-sm w-full", isMobile ? "p-6 rounded-none" : "p-10 rounded-3xl border border-black/5")}>
//             <Image
//               src={user?.avatar || '/placeholder.svg'}
//               alt={user?.full_name || 'User'}
//               width={isMobile ? 96 : 144}
//               height={isMobile ? 96 : 144}
//               className={cn("rounded-3xl object-cover shadow-md", isMobile ? "size-24" : "size-36")}
//             />
//             <h2 className={cn("font-bold text-ink", isMobile ? "mt-5 text-[22px] leading-tight" : "mt-5 text-[30px]")}>
//               {user?.full_name}
//             </h2>
//             <p className={cn("text-purple font-bold", isMobile ? "text-[14px] mt-1.5" : "text-[17px] mt-1.5")}>@{user?.username}</p>
//             <p className={cn("text-ink-soft font-semibold", isMobile ? "mt-1.5 text-[14px]" : "mt-1.5 text-[16px]")}>{user?.org_role || user?.role}</p>
//             <p className={cn("leading-relaxed text-ink-soft max-w-2xl mx-auto", isMobile ? "mt-4 text-[14px]" : "mt-4 text-[16px]")}>
//               {user?.bio || 'No bio yet.'}
//             </p>

//             <div className={cn("flex w-full items-center justify-around rounded-2xl bg-white shadow-xs mx-auto", isMobile ? "mt-6 max-w-sm py-4" : "mt-8 max-w-xl py-6")}>
//               {stats.map((s) => (
//                 <div key={s.label} className="text-center">
//                   <p className={cn("font-bold text-purple", isMobile ? "text-[20px]" : "text-[26px]")}>{s.value}</p>
//                   <p className={cn("text-ink-soft font-semibold uppercase tracking-wider", isMobile ? "text-[10px] mt-0.5" : "text-[12px] mt-1")}>{s.label}</p>
//                 </div>
//               ))}
//             </div>

//             <button
//               type="button"
//               onClick={onEdit}
//               className={cn("flex items-center gap-2 rounded-2xl bg-purple text-white transition-opacity hover:opacity-90 font-bold shadow-lg shadow-purple/20", isMobile ? "mt-6 px-6 py-3 text-[14px]" : "mt-8 px-8 py-3.5 text-[16px]")}
//             >
//               <Pencil className="size-4" />
//               Edit profile
//             </button>
//           </div>

//           <div className={cn("bg-purple-soft/30 w-full", isMobile ? "space-y-5 p-6 rounded-none shadow-sm" : "space-y-6 p-10 rounded-3xl border border-black/5")}>
//             <p className={cn("text-ink font-bold border-b border-black/10 pb-3", isMobile ? "text-[15px]" : "text-[18px]")}>
//               Contact details
//             </p>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
//               <div className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl border border-black/5">
//                 <Mail className="text-purple size-5 shrink-0" />
//                 <div className="min-w-0">
//                   <p className="text-[10px] text-ink-soft font-bold uppercase tracking-wider">Email</p>
//                   <p className="text-ink text-sm font-semibold truncate">{user?.email || 'N/A'}</p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl border border-black/5">
//                 <Phone className="text-purple size-5 shrink-0" />
//                 <div className="min-w-0">
//                   <p className="text-[10px] text-ink-soft font-bold uppercase tracking-wider">Phone</p>
//                   <p className="text-ink text-sm font-semibold truncate">{user?.phone_number || 'N/A'}</p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl border border-black/5">
//                 <MapPin className="text-purple size-5 shrink-0" />
//                 <div className="min-w-0">
//                   <p className="text-[10px] text-ink-soft font-bold uppercase tracking-wider">Location</p>
//                   <p className="text-ink text-sm font-semibold truncate">{user?.location?.city ? `${user.location.city}, ${user.location.country}` : 'N/A'}</p>
//                 </div>
//               </div>
//               {user?.organization && (
//                 <div className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl border border-black/5">
//                   <Briefcase className="text-purple size-5 shrink-0" />
//                   <div className="min-w-0">
//                     <p className="text-[10px] text-ink-soft font-bold uppercase tracking-wider">Organization</p>
//                     <p className="text-ink text-sm font-semibold truncate">{user.organization} ({user.org_role})</p>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// /* ---------------- Edit ---------------- */

// function Field({
//   label,
//   defaultValue,
//   textarea,
// }: {
//   label: string
//   defaultValue: string
//   textarea?: boolean
// }) {
//   return (
//     <label className="block">
//       <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">
//         {label}
//       </span>
//       {textarea ? (
//         <textarea
//           defaultValue={defaultValue}
//           rows={3}
//           className="w-full resize-none rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
//         />
//       ) : (
//         <input
//           type="text"
//           defaultValue={defaultValue}
//           className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
//         />
//       )}
//     </label>
//   )
// }

// export function EditView({
//   user,
//   setUser,
//   bgType,
//   setBgType,
// }: {
//   user: any
//   setUser: (u: any) => void
//   bgType: string
//   setBgType: (t: string) => void
// }) {
//   const isMobile = useIsMobile()
//   const [loading, setLoading] = useState(false)
//   const [formData, setFormData] = useState({
//     full_name: user?.full_name || '',
//     username: user?.username || '',
//     org_role: user?.org_role || '',
//     org_industry: user?.org_industry || '',
//     org_size: user?.org_size || '',
//     bio: user?.bio || '',
//     email: user?.email || '',
//     phone_number: user?.phone_number || '',
//     organization: user?.organization || '',
//     blog: user?.blog || '',
//     status_message: user?.status_message || '',
//     city: user?.location?.city || '',
//     country: user?.location?.country || '',
//     inviteCode: '',
//   })

//   const handleUpdate = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLoading(true)
//     try {
//       const payload = {
//         ...formData,
//         location: {
//           city: formData.city,
//           country: formData.country
//         }
//       }
//       const res = await updateProfile(payload)
//       setUser(res.data)
//       toast.success('Profile updated successfully!')
//     } catch (err: any) {
//       toast.error(err.message || 'Update failed')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (!file) return
//     try {
//       const res = await uploadAvatar(file)
//       setUser(res.data.user)
//       toast.success('Avatar updated!')
//     } catch (err: any) {
//       toast.error('Avatar upload failed')
//     }
//   }

//   const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (!file) return
//     try {
//       const res = await uploadBackground(file)
//       setUser(res.data.user)
//       setBgType('custom')
//       toast.success('Custom background set!')
//     } catch (err: any) {
//       toast.error('Background upload failed')
//     }
//   }

//   const handleBgSelect = async (type: string) => {
//     setBgType(type)
//     try {
//       const res = await updateProfile({ app_background: type })
//       setUser(res.data)
//     } catch (err) {
//       toast.error('Failed to update background preference')
//     }
//   }

//   return (
//     <div className="flex h-full flex-col bg-white">
//       <ViewHeader title="Edit profile" subtitle="Update your information" />
//       <div className={cn("flex-1 overflow-y-auto bg-white flex flex-col items-center", isMobile ? "p-4" : "p-6 sm:p-10")}>
//         <form
//           onSubmit={handleUpdate}
//           className={cn(
//             "w-full bg-purple-soft/30 shadow-sm space-y-6",
//             isMobile 
//               ? "p-6 rounded-2xl border border-black/5 max-w-full" 
//               : "max-w-3xl p-10 sm:p-12 rounded-3xl border border-black/5"
//           )}
//         >
//           <div className="flex flex-col items-center justify-center text-center gap-2 mb-6">
//             <div className="relative">
//               <Image
//                 src={user?.avatar || '/placeholder.svg'}
//                 alt={user?.full_name || 'User'}
//                 width={120}
//                 height={120}
//                 className="size-28 rounded-3xl object-cover shadow-md"
//               />
//               <label className="absolute -bottom-1 -right-1 flex size-9 cursor-pointer items-center justify-center rounded-full bg-purple text-white shadow-md">
//                 <Camera className="size-4.5" />
//                 <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
//               </label>
//             </div>
//             <div className="mt-2">
//               <p className="text-[16px] font-bold text-ink">
//                 Profile photo
//               </p>
//               <p className="text-[13px] text-ink-soft">
//                 PNG or JPG, up to 5MB
//               </p>
//             </div>
//           </div>

//           <div className="w-full border-b border-black/10 my-6" />

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <label className="block">
//               <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Full name</span>
//               <input
//                 type="text"
//                 value={formData.full_name}
//                 onChange={e => setFormData({ ...formData, full_name: e.target.value })}
//                 className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
//               />
//             </label>
//             <label className="block">
//               <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Username</span>
//               <input
//                 type="text"
//                 value={formData.username}
//                 onChange={e => setFormData({ ...formData, username: e.target.value })}
//                 className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
//               />
//             </label>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <label className="block">
//               <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Organization</span>
//               <input
//                 type="text"
//                 value={formData.organization}
//                 onChange={e => setFormData({ ...formData, organization: e.target.value })}
//                 className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
//               />
//             </label>
//             <label className="block">
//               <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Role</span>
//               <input
//                 type="text"
//                 value={formData.org_role}
//                 onChange={e => setFormData({ ...formData, org_role: e.target.value })}
//                 className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
//               />
//             </label>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <label className="block">
//               <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Email</span>
//               <input
//                 disabled
//                 type="email"
//                 value={formData.email}
//                 className="w-full rounded-2xl bg-purple-soft/50 px-4 py-3 text-[14px] text-ink-soft cursor-not-allowed outline-none"
//               />
//             </label>
//             <label className="block">
//               <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Phone</span>
//               <input
//                 type="text"
//                 value={formData.phone_number}
//                 onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
//                 className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
//               />
//             </label>
//           </div>

//           <label className="block">
//             <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Bio</span>
//             <textarea
//               rows={3}
//               value={formData.bio}
//               onChange={e => setFormData({ ...formData, bio: e.target.value })}
//               className="w-full resize-none rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
//               placeholder="Tell us about yourself..."
//             />
//           </label>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <label className="block">
//               <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Industry</span>
//               <input
//                 type="text"
//                 value={formData.org_industry}
//                 onChange={e => setFormData({ ...formData, org_industry: e.target.value })}
//                 className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
//                 placeholder="e.g. Technology"
//               />
//             </label>
//             <label className="block">
//               <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Company Size</span>
//               <select
//                 value={formData.org_size}
//                 onChange={e => setFormData({ ...formData, org_size: e.target.value })}
//                 className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40 appearance-none"
//               >
//                 <option value="">Select size</option>
//                 {['solo', '2-10', '11-50', '51-200', '201-500', '500+'].map(size => (
//                   <option key={size} value={size}>{size}</option>
//                 ))}
//               </select>
//             </label>
//           </div>

//           <label className="block">
//             <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Organization Invite Code</span>
//             <div className="flex gap-2">
//               <input
//                 type="text"
//                 value={formData.inviteCode || ''}
//                 onChange={e => setFormData({ ...formData, inviteCode: e.target.value })}
//                 className="flex-1 rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
//                 placeholder="Enter 8-digit code"
//               />
//               <button
//                 type="button"
//                 onClick={async () => {
//                   try {
//                     await joinOrganizationByInvite(formData.inviteCode);
//                     toast.success('Successfully joined organization!');
//                     window.location.reload();
//                   } catch (err: any) {
//                     toast.error(err.message || 'Failed to join');
//                   }
//                 }}
//                 className="px-6 rounded-2xl bg-purple text-white text-sm font-bold shadow-lg shadow-purple/10 hover:opacity-90 active:scale-95 transition-all"
//               >
//                 Join
//               </button>
//             </div>
//           </label>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <label className="block">
//               <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">City</span>
//               <input
//                 type="text"
//                 value={formData.city}
//                 onChange={e => setFormData({ ...formData, city: e.target.value })}
//                 className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
//               />
//             </label>
//             <label className="block">
//               <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Country</span>
//               <input
//                 type="text"
//                 value={formData.country}
//                 onChange={e => setFormData({ ...formData, country: e.target.value })}
//                 className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
//               />
//             </label>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <label className="block">
//               <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Website/Blog</span>
//               <input
//                 type="url"
//                 value={formData.blog}
//                 onChange={e => setFormData({ ...formData, blog: e.target.value })}
//                 className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
//                 placeholder="https://..."
//               />
//             </label>
//             <label className="block">
//               <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Status Message</span>
//               <input
//                 type="text"
//                 value={formData.status_message}
//                 onChange={e => setFormData({ ...formData, status_message: e.target.value })}
//                 className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
//                 placeholder="What's on your mind?"
//               />
//             </label>
//           </div>

//           <div className="pt-2">
//             <span className="mb-3 block text-[13px] font-medium text-ink-soft">
//               App Background
//             </span>
//             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//               <button
//                 type="button"
//                 onClick={() => handleBgSelect('bubbles')}
//                 className={cn(
//                   'flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all',
//                   bgType === 'bubbles'
//                     ? 'border-purple bg-purple-soft/50 ring-4 ring-purple/10'
//                     : 'border-transparent bg-purple-soft/30 hover:bg-purple-soft/50',
//                 )}
//               >
//                 <div className="size-10 rounded-full bg-purple/10 flex items-center justify-center">
//                   <Sparkles className="size-5 text-purple" />
//                 </div>
//                 <span className="text-[12px] font-bold text-ink">Bubbles</span>
//               </button>

//               <button
//                 type="button"
//                 onClick={() => handleBgSelect('light')}
//                 className={cn(
//                   'flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all',
//                   bgType === 'light'
//                     ? 'border-purple bg-purple-soft/50 ring-4 ring-purple/10'
//                     : 'border-transparent bg-purple-soft/30 hover:bg-purple-soft/50',
//                 )}
//               >
//                 <div className="size-12 overflow-hidden rounded-lg shadow-sm border border-black/5">
//                   <Image src="/themes/light.png" alt="Light" className="w-full h-full object-cover" />
//                 </div>
//                 <span className="text-[12px] font-bold text-ink">Light</span>
//               </button>

//               <button
//                 type="button"
//                 onClick={() => handleBgSelect('dark')}
//                 className={cn(
//                   'flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all',
//                   bgType === 'dark'
//                     ? 'border-purple bg-purple-soft/50 ring-4 ring-purple/10'
//                     : 'border-transparent bg-purple-soft/30 hover:bg-purple-soft/50',
//                 )}
//               >
//                 <div className="size-12 overflow-hidden rounded-lg shadow-sm border border-black/5">
//                   <Image src="/themes/dark.png" alt="Dark" className="w-full h-full object-cover" />
//                 </div>
//                 <span className="text-[12px] font-bold text-ink">Dark</span>
//               </button>

//               <div className="relative group/custom">
//                 <button
//                   type="button"
//                   className={cn(
//                     'w-full flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all',
//                     bgType === 'custom'
//                       ? 'border-purple bg-purple-soft/50 ring-4 ring-purple/10'
//                       : 'border-transparent bg-purple-soft/30 hover:bg-purple-soft/50',
//                   )}
//                 >
//                   <label className="cursor-pointer flex flex-col items-center gap-3 w-full">
//                     <div className="size-10 rounded-full bg-purple flex items-center justify-center text-white">
//                       <Camera className="size-5" />
//                     </div>
//                     <span className="text-[12px] font-bold text-ink">Custom</span>
//                     <input type="file" className="hidden" accept="image/*" onChange={handleBackgroundUpload} />
//                   </label>
//                 </button>
//               </div>
//             </div>
//           </div>

//           <div className="pt-4 flex justify-center">
//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full md:max-w-md h-14 bg-purple text-white font-bold rounded-2xl shadow-lg shadow-purple/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
//             >
//               {loading ? 'Saving...' : 'Save Changes'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   )
// }

/* ---------------- Meeting Room ---------------- */

export function MeetingView({ onBack }: { onBack: () => void }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'transcript'>('chat');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const transcriptEntries = [
    { speaker: 'Sarah Miller', time: '10:02 AM', text: "Alright everyone, let's get started. We're reviewing the Q3 design retrospective today.", avatar: 'https://i.pravatar.cc/150?u=sarah' },
    { speaker: 'Jacob McLeod', time: '10:03 AM', text: 'I think the main takeaway from Q3 is that we need better alignment between design and engineering earlier in the process.', avatar: 'https://i.pravatar.cc/150?u=jacob' },
    { speaker: 'Kaylee Kemp', time: '10:05 AM', text: 'Agreed. The CJM work we did helped a lot but it came in too late for sprint planning.', avatar: 'https://i.pravatar.cc/150?u=kaylee' },
    { speaker: 'Sarah Miller', time: '10:07 AM', text: 'Action item: Kaylee to present CJM to engineering before sprint 1 kickoff next cycle.', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    { speaker: 'Jacob McLeod', time: '10:09 AM', text: 'Also, we should set up a shared Figma workspace so the team can leave comments directly on designs.', avatar: 'https://i.pravatar.cc/150?u=jacob' },
  ]

  const aiSummaryItems = [
    { icon: FileText, label: 'Key Discussion', text: 'Design/engineering alignment gaps in Q3, CJM delivery timing issues.' },
    { icon: ClipboardList, label: 'Action Items', text: 'Kaylee: present CJM before sprint kickoff. Jacob: set up shared Figma workspace.' },
    { icon: Zap, label: 'Decisions Made', text: 'Adopt early design reviews starting Q4. Figma comments enabled for all engineers.' },
  ]

  return (
    <div className={cn(
      "relative flex flex-col bg-white text-ink transition-all duration-500",
      isFullscreen ? "fixed inset-0 z-[100] h-screen w-screen" : "h-full w-full"
    )}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-black/5 relative z-20 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
            <ChevronLeft className="size-5 text-ink" />
          </button>
          <div>
            <h2 className="font-bold text-sm text-ink leading-none">Design retrospective November 2023</h2>
            <p className="text-[11px] text-ink-soft mt-1">November 2023 • 12 participants</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 mr-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="size-8 rounded-full border-2 border-white bg-purple flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
            <div className="size-8 rounded-full border-2 border-white bg-purple-soft flex items-center justify-center text-[10px] font-bold text-ink shadow-sm">+9</div>
          </div>
          <button className="flex items-center gap-2 bg-purple/10 hover:bg-purple/20 px-4 py-2 rounded-xl text-xs font-bold text-purple transition-all">
            <Info className="size-4" />Meeting details
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main video area */}
        <div className="flex flex-1 flex-col p-6 min-w-0 bg-slate-50/30">
          <div className="flex-1 relative rounded-[32px] overflow-hidden bg-purple-soft/50 border-4 border-purple shadow-xl shadow-purple/10">
            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover" alt="Main Speaker" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 flex items-center gap-4 bg-black/30 backdrop-blur-md p-3 rounded-2xl border border-white/20">
              <div className="size-10 rounded-xl bg-purple flex items-center justify-center shadow-lg shadow-purple/40 text-white">
                <span className="font-bold text-sm">SM</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-white">Sarah Miller (You)</p>
                  <Mic className="size-3.5 text-white/70" />
                </div>
                <p className="text-[10px] text-white/60 uppercase tracking-wider font-medium">Principal Designer</p>
              </div>
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
              <span className="size-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live Transcript</span>
            </div>
          </div>
          <div className="h-32 mt-6 flex gap-4 overflow-x-auto scrollbar-hide py-1">
            {[
              { name: 'Samila Moon', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300' },
              { name: 'Jane Collins', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300' },
              { name: 'Me', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300' },
              { name: '13 others', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300' }
            ].map((p, i) => (
              <div key={i} className="flex-none w-48 rounded-[24px] overflow-hidden bg-white border border-black/5 relative group shadow-sm transition-all hover:shadow-md hover:scale-[1.02]">
                <img src={p.img} className="w-full h-full object-cover" alt={p.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white shadow-sm">{p.name}</span>
                  <MicOff className="size-3 text-white/70" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        {isChatOpen && (
          <div className="w-80 border-l border-black/5 flex flex-col bg-white animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-purple/20 flex items-center justify-between">
              <h3 className="font-bold text-sm text-ink">Meeting Panel</h3>
              <button onClick={() => setIsChatOpen(false)} className="p-1.5 hover:bg-black/5 rounded-lg text-ink-soft">
                <X className="size-4" />
              </button>
            </div>

            <div className="p-3 border-b border-purple/20">
              <div className="flex bg-purple-soft/50 rounded-xl p-1 gap-0.5">
                {(['chat', 'participants', 'transcript'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                      activeTab === tab ? "bg-white text-purple shadow-sm" : "text-ink-soft hover:text-ink"
                    )}
                  >
                    {tab === 'transcript' ? '✦ AI' : tab === 'chat' ? 'Chat' : 'People'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === 'chat' ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <img src="https://images.unsplash.com/photo-1542621334-1100f406f528?w=500" className="rounded-2xl w-full aspect-[4/3] object-cover shadow-sm" alt="Preview" />
                    <div className="flex gap-3">
                      <img src="https://i.pravatar.cc/150?u=kaylee" className="size-8 rounded-full object-cover" alt="Kaylee" />
                      <div>
                        <p className="text-[11px] font-bold text-purple">Kaylee Kemp</p>
                        <p className="text-xs text-ink-soft mt-0.5">We are working on the CJM</p>
                        <p className="text-[9px] text-ink-soft/60 mt-1">10:30 AM</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 flex-row-reverse">
                    <img src={profile.avatar} className="size-8 rounded-full object-cover" alt="Me" />
                    <div className="flex flex-col items-end max-w-[80%]">
                      <div className="bg-purple text-white p-3 rounded-2xl rounded-tr-none shadow-sm shadow-purple/20">
                        <p className="text-xs">Jessica did a great job this month 💜</p>
                      </div>
                      <p className="text-[9px] text-ink-soft/60 mt-1">09:27 AM</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <img src="https://i.pravatar.cc/150?u=jacob" className="size-8 rounded-full object-cover" alt="Jacob" />
                    <div>
                      <p className="text-[11px] font-bold text-ink">Jacob McLeod</p>
                      <div className="bg-purple-soft/50 p-3 rounded-2xl rounded-tl-none mt-1">
                        <p className="text-xs text-ink">Agree. Congrats, Jessica!</p>
                      </div>
                      <p className="text-[9px] text-ink-soft/60 mt-1">10:30 AM</p>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'participants' ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-purple-soft/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <img src={`https://i.pravatar.cc/150?u=${i + 10}`} className="size-8 rounded-full object-cover" alt="Avatar" />
                        <div>
                          <span className="text-xs font-bold text-ink block">Participant {i}</span>
                          <span className="text-[10px] text-ink-soft">{i % 2 === 0 ? 'Presenter' : 'Viewer'}</span>
                        </div>
                      </div>
                      {i % 3 !== 0 ? <Mic className="size-3 text-green-500" /> : <MicOff className="size-3 text-ink-soft" />}
                    </div>
                  ))}
                </div>
              ) : (
                /* AI Transcript Tab */
                <div className="space-y-4">
                  <div className="rounded-2xl p-4 space-y-3"
                    style={{ background: 'linear-gradient(135deg, rgba(108,92,231,0.06) 0%, rgba(108,92,231,0.02) 100%)', border: '1px solid rgba(108,92,231,0.12)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="size-5 rounded-md bg-purple flex items-center justify-center">
                        <Sparkles className="size-3 text-white" />
                      </div>
                      <p className="text-[11px] font-bold text-purple uppercase tracking-wider">AI Summary</p>
                    </div>
                    {aiSummaryItems.map(({ icon: Icon, label, text }) => (
                      <div key={label} className="flex items-start gap-2.5">
                        <Icon className="size-3.5 text-purple/70 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-purple/70 uppercase tracking-wider">{label}</p>
                          <p className="text-[11px] text-ink mt-0.5 leading-relaxed">{text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-ink-soft uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                      Live Transcript
                    </p>
                    <div className="space-y-4">
                      {transcriptEntries.map((entry, i) => (
                        <div key={i} className="flex gap-2.5">
                          <img src={entry.avatar} className="size-6 rounded-full object-cover shrink-0 mt-0.5" alt={entry.speaker} />
                          <div>
                            <div className="flex items-baseline gap-2">
                              <p className="text-[11px] font-bold text-ink">{entry.speaker}</p>
                              <p className="text-[9px] text-ink-soft">{entry.time}</p>
                            </div>
                            <p className="text-[11px] text-ink-soft mt-0.5 leading-relaxed">{entry.text}</p>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2.5">
                        <div className="size-6 rounded-full bg-purple/20 shrink-0 mt-0.5 animate-pulse" />
                        <div className="flex items-center gap-1 mt-1">
                          <span className="size-1.5 animate-bounce rounded-full bg-black/30" style={{ animationDelay: '0ms' }} />
                          <span className="size-1.5 animate-bounce rounded-full bg-black/30" style={{ animationDelay: '150ms' }} />
                          <span className="size-1.5 animate-bounce rounded-full bg-black/30" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 mt-auto border-t border-purple/20">
              {activeTab === 'chat' && (
                <div className="relative">
                  <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-soft cursor-pointer hover:text-purple" />
                  <input
                    type="text"
                    placeholder="Your message"
                    className="w-full bg-purple-soft/50 border border-transparent rounded-2xl pl-10 pr-12 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple/40 text-ink placeholder:text-ink-soft/60"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-purple hover:scale-110 transition-all">
                    <Send className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Control Bar Dock */}
      <div className="h-24 flex items-center justify-center relative z-20 pb-4 px-6">
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-3xl border border-black/5 p-3 rounded-[2.5rem] shadow-glow">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "size-12 rounded-full flex items-center justify-center transition-all",
              isMuted ? "bg-red-500 text-white" : "bg-purple/10 text-purple hover:bg-purple/20"
            )}
          >
            {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </button>
          <button
            onClick={() => setIsCameraOff(!isCameraOff)}
            className={cn(
              "size-12 rounded-full flex items-center justify-center transition-all",
              isCameraOff ? "bg-red-500 text-white" : "bg-purple/10 text-purple hover:bg-purple/20"
            )}
          >
            {isCameraOff ? <VideoOff className="size-5" /> : <Video className="size-5" />}
          </button>
          <button className="size-12 rounded-full bg-purple/10 text-purple flex items-center justify-center hover:bg-purple/20 transition-all">
            <MonitorUp className="size-5" />
          </button>

          <div className="size-14 flex items-center justify-center bg-red-500 rounded-full shadow-lg shadow-red-500/40 cursor-pointer hover:scale-110 active:scale-95 transition-all mx-2 group">
            <Phone className="size-6 text-white rotate-[135deg]" onClick={onBack} />
          </div>

          <button className="size-12 rounded-full bg-purple/10 text-purple flex items-center justify-center hover:bg-purple/20 transition-all">
            <Volume2 className="size-5" />
          </button>
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={cn(
              "size-12 rounded-full flex items-center justify-center transition-all",
              isChatOpen ? "bg-purple text-white shadow-bubble shadow-purple/20" : "bg-purple/10 text-purple hover:bg-purple/20"
            )}
          >
            <Smile className="size-5" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={cn(
              "size-12 rounded-full flex items-center justify-center transition-all",
              isFullscreen ? "bg-purple text-white shadow-bubble shadow-purple/20" : "bg-purple/10 text-purple hover:bg-purple/20"
            )}
          >
            <Maximize2 className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
/* ---------------- Work (Coworkers) ---------------- */

export function WorkView({ onMessage: propOnMessage, isNarrow: narrowProp }: { onMessage?: (user: any) => void, isNarrow?: boolean }) {
  const {
    user: currentUser,
    isNarrow: contextNarrow,
    activeChat,
    setActiveChat,
    activeChatId,
    setActiveChatId,
    messages,
    setMessages,
    showInfo,
    setShowInfo,
    bgType,
  } = useDashboard()
  const { refreshChats, chats } = useChats()
  const { isUserOnline, startCall } = useSocket()
  const { getDisplayName } = useNicknames()
  const isNarrow = narrowProp ?? contextNarrow
  const [search, setSearch] = useState('')
  const myId = currentUser?._id || currentUser?.id
  // Work roster = the full organization, from the same endpoint mobile uses.
  // (The previous searchUsers('') path was scoped + capped at 30, which is why
  // Work looked empty.) Search is applied client-side below.
  const { data: orgMembers = [], isLoading: loading } = useQuery({
    queryKey: ['orgMembers', myId],
    queryFn: async () => {
      const res = await getOrgMembers()
      return (res.members || res.data || []).filter((w: any) => {
        const wId = w._id || w.id
        const isMe = wId === myId
        const isBot = w.is_bot || w.username === 'aida' || w.username?.toLowerCase() === 'aida'
        return !isMe && !isBot
      })
    },
    enabled: !!myId,
    staleTime: 1000 * 60 * 5, // 5 mins cache
    retry: 1,
  })
  const q = search.trim().toLowerCase()
  const coworkers = q
    ? orgMembers.filter((w: any) => `${getDisplayName(w)} ${w.email || ''}`.toLowerCase().includes(q))
    : orgMembers
  // Group workspaces also belong in Work, alongside org members.
  const groupWorkspaces = (chats || []).filter((c: any) => {
    if (!c.isGroupChat) return false
    if (!q) return true
    return (c.chatName || '').toLowerCase().includes(q)
  })
  const [chatLoading, setChatLoading] = useState(false)
  const [collapsingFor, setCollapsingFor] = useState<string | null>(null)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const isMobile = useIsMobile()
  const [searchActive, setSearchActive] = useState(false)
  const navigate = useNavigate()

  const handleOpenChat = async (worker: any) => {
    const workerId = worker._id || worker.id
    setCollapsingFor(workerId)
    setChatLoading(true)
    try {
      await new Promise(r => setTimeout(r, 180))
      const res = await accessOrCreateChat(workerId)
      const chat = res?.conversation || res?.data?.conversation || res?.data || res
      if (!chat.users && worker) chat.users = [currentUser, worker]
      setActiveChat(chat)
      const id = chat.id || chat._id
      setActiveChatId(id)
      setShowInfo(false)
      navigate({ to: `/dashboard/chat/${id}` })
    } catch {
      toast.error('Failed to open chat')
    } finally {
      setChatLoading(false)
      setCollapsingFor(null)
    }
  }

  return (
    <div className={cn("flex h-full w-full overflow-hidden rounded-[26px]", bgType === 'glass' ? "bg-transparent" : "bg-white")}>
      {/* Side-by-side layout: List on left, Chat on right */}
      <div className={cn(
        "flex flex-col border-r border-black/5 transition-all duration-500 ease-in-out",
        activeChat && !isNarrow ? "w-[340px] shrink-0" : "w-full",
        activeChat && isNarrow ? "hidden" : "flex"
      )}>
        <ViewHeader
          title="Workroom"
          subtitle="Everyone in your organization"
          isNarrow={!!activeChat}
          action={
            isMobile ? (
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-purple/20 bg-purple/10 px-3 text-xs font-semibold text-purple hover:bg-purple/20 transition-all shrink-0 cursor-pointer"
                title="Create Group"
              >
                <Plus className="size-3.5" />
                {!activeChat && <span>Create Group</span>}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {!activeChat && (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search coworkers..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-9 w-52 rounded-xl border border-black/5 bg-black/2 pl-9 pr-4 text-sm focus:border-purple/20 focus:bg-white focus:outline-none focus:ring-0"
                    />
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/40" />
                  </div>
                )}
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-purple/20 bg-purple/10 px-3 text-xs font-semibold text-purple hover:bg-purple/20 transition-all shrink-0 cursor-pointer"
                  title="Create Group"
                >
                  <Plus className="size-3.5" />
                  {!activeChat && <span>Create Group</span>}
                </button>
              </div>
            )
          }
        />

        {isMobile && !activeChat && (
          <div className="p-4 border-b border-black/5 flex items-center gap-2 bg-white shrink-0">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search coworkers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-2xl border border-black/10 bg-black/2 pl-10 pr-10 text-sm focus:border-purple/30 focus:bg-white focus:outline-none transition-all"
              />
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-black/40" />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black/30 hover:text-black"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {groupWorkspaces.length > 0 && (
            <>
              <p className="px-1 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-black/30">Group Workspaces · {groupWorkspaces.length}</p>
              {groupWorkspaces.map((g: any) => {
                const gid = g._id || g.id
                const rawGroupMembers = g.users || g.members || []
                const uniqueGroupMemberIds = new Set(rawGroupMembers.map((m: any) => String(m._id || m.id || m.username || m.email || '')).filter(Boolean))
                const memberCount = uniqueGroupMemberIds.size
                return (
                  <div
                    key={gid}
                    onClick={() => { setActiveChat(g); setActiveChatId(gid); setShowInfo(false); navigate({ to: `/dashboard/chat/${gid}` }) }}
                    className="group flex items-center gap-3 rounded-[22px] border border-black/5 bg-white p-3 transition-all duration-200 cursor-pointer hover:border-purple/20 hover:shadow-md"
                  >
                    <ChatAvatar src={g.groupIcon} name={g.chatName || 'Group'} className="size-12 rounded-xl shadow-sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-ink text-[13px]">{g.chatName || 'Group Chat'}</p>
                      <p className="text-[11px] text-ink-soft mt-0.5 truncate">{memberCount} member{memberCount === 1 ? '' : 's'}</p>
                    </div>
                  </div>
                )
              })}
              <p className="px-1 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-black/30">Org Members · {coworkers.length}</p>
            </>
          )}
          {loading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-black/3 animate-pulse" />
            ))
          ) : coworkers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="mb-3 size-12 text-black/10" />
              <p className="text-sm font-medium text-black/40">No coworkers found</p>
              <p className="text-xs text-black/30 mt-1">
                {search ? "Try another name or search term" : "Members of your organization will appear here"}
              </p>
            </div>
          ) : (
            coworkers.map((worker: any) => {
              const workerId = worker._id || worker.id
              const isCollapsing = collapsingFor === workerId
              const isActive = activeChatId === workerId || (activeChat?.users?.some((u: any) => (u._id || u.id) === workerId))
              return (
                <div
                  key={workerId}
                  onClick={() => !chatLoading && handleOpenChat(worker)}
                  className={cn(
                    "group flex items-center gap-3 rounded-[22px] border p-3 transition-all duration-200 cursor-pointer",
                    isCollapsing
                      ? "scale-[0.97] opacity-60 border-purple/30 shadow-inner"
                      : isActive
                        ? "border-purple/30 bg-purple/5 shadow-sm"
                        : "border-black/5 bg-white hover:border-purple/20 hover:shadow-md"
                  )}
                >
                  <div className="relative shrink-0">
                    <ChatAvatar
                      src={worker.avatar}
                      name={getDisplayName(worker)}
                      className="size-12 rounded-xl shadow-sm"
                    />
                    {isUserOnline(worker._id || worker.id) && (
                      <div className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white bg-emerald-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-bold text-ink text-[13px]">{getDisplayName(worker)}</p>
                      {(worker.org_role || worker.organization) && (
                        <span className="shrink-0 text-[9px] font-bold text-purple bg-purple/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          {worker.org_role || worker.organization}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-soft mt-0.5 truncate">
                      @{worker.username}{(worker.role === 'admin' && worker.status_message) ? ` · "${worker.status_message}"` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); startCall && startCall(workerId, getDisplayName(worker), worker.avatar, 'voice') }}
                      aria-label="Voice Call"
                      className="flex size-8 items-center justify-center rounded-xl border border-black/10 text-black/50 transition-all hover:border-purple/30 hover:text-purple active:scale-95"
                    >
                      <Phone className="size-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); startCall && startCall(workerId, getDisplayName(worker), worker.avatar, 'video') }}
                      aria-label="Video Call"
                      className="flex size-8 items-center justify-center rounded-xl border border-black/10 text-black/50 transition-all hover:border-purple/30 hover:text-purple active:scale-95"
                    >
                      <Video className="size-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (!chatLoading) handleOpenChat(worker) }}
                      disabled={chatLoading}
                      className="flex h-8 items-center gap-1.5 rounded-xl bg-purple px-3 text-[11px] font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm disabled:opacity-60"
                    >
                      {isCollapsing ? <Loader2 className="size-3.5 animate-spin" /> : <MessageSquare className="size-3.5" />}
                      {isCollapsing ? '…' : 'Message'}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Window */}
      {activeChat ? (
        <div className="relative flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col">
            <ChatWindow
              chatId={activeChatId || activeChat.id || activeChat._id}
              chat={activeChat}
              currentUser={currentUser}
              messages={messages}
              setMessages={setMessages}
              onClose={() => { setActiveChat(null); setActiveChatId(null); setShowInfo(false) }}
              onShowInfo={() => setShowInfo(!showInfo)}
            />
          </div>
        </div>
      ) : (
        <div className={cn("flex-1 items-center justify-center hidden md:flex", isNarrow && "hidden")}>
          <div className="text-center p-8 max-w-sm">
            <div className="size-20 rounded-3xl bg-purple/10 flex items-center justify-center mb-4 mx-auto">
              <Briefcase className="size-10 text-purple/50" />
            </div>
            <h2 className="text-xl font-bold text-black mb-2">Collaboration Hub</h2>
            <p className="text-sm text-black/40">Select a colleague to start a conversation.</p>
          </div>
        </div>
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
    </div>
  )
}

/* ---------------- getCalendarCells Helper ---------------- */

function getCalendarCells(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth()

  const firstDayIndex = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const cells: { date: Date; isCurrentMonth: boolean }[] = []

  // Previous month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false,
    })
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    })
  }

  // Next month padding to fill 42 cells (6 rows * 7 columns)
  const nextPaddingCount = 42 - cells.length
  for (let i = 1; i <= nextPaddingCount; i++) {
    cells.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    })
  }

  return cells
}


/* ---------------- MeetingDetailModal Component ---------------- */

function MeetingDetailModal({ log, onClose }: { log: any; onClose: () => void }) {
  const durationStr = log.duration ? `${Math.round(log.duration / 60)} min${Math.round(log.duration / 60) !== 1 ? 's' : ''}` : 'N/A'
  const dateStr = log.timestamp.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
  const { getDisplayName } = useNicknames()
  const [activeTab, setActiveTab] = useState<'summary' | 'actions' | 'transcript'>('summary')

  const hasActionItems = log.actionItems && log.actionItems.length > 0
  const hasTranscript = !!log.transcriptRaw

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-purple/10 flex items-center justify-center">
              <Sparkles className="size-5 text-purple" />
            </div>
            <div>
              <h3 className="font-bold text-ink text-base truncate max-w-[280px]">{log.title}</h3>
              <p className="text-xs text-ink-soft">📅 {dateStr} · ⏱️ {durationStr}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-xl flex items-center justify-center hover:bg-slate-100 text-ink-soft transition-colors cursor-pointer shrink-0"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Participants row */}
        {((log.host) || (log.attendees && log.attendees.length > 0)) && (
          <div className="px-6 py-3 border-b border-slate-50 flex flex-wrap gap-2 shrink-0">
            {log.host && (
              <div className="flex items-center gap-1.5 bg-purple/5 border border-purple/10 rounded-lg px-2.5 py-1 text-xs text-ink">
                <ChatAvatar src={log.host.avatar} name={getDisplayName(log.host)} className="size-5 rounded-md" />
                <span className="font-medium">{getDisplayName(log.host)}</span>
                <span className="text-[9px] text-purple font-bold uppercase">Host</span>
              </div>
            )}
            {log.attendees?.map((att: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/50 rounded-lg px-2.5 py-1 text-xs text-ink">
                <ChatAvatar src={att.avatar} name={getDisplayName(att)} className="size-5 rounded-md" />
                <span>{getDisplayName(att)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex border-b border-slate-100 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('summary')}
            className={cn("pb-3 pt-2.5 text-xs font-bold border-b-2 mr-5 transition-all", activeTab === 'summary' ? "border-purple text-purple" : "border-transparent text-ink-soft hover:text-ink")}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={cn("pb-3 pt-2.5 text-xs font-bold border-b-2 mr-5 transition-all flex items-center gap-1.5", activeTab === 'actions' ? "border-purple text-purple" : "border-transparent text-ink-soft hover:text-ink")}
          >
            Action Items
            {hasActionItems && (
              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", activeTab === 'actions' ? "bg-purple text-white" : "bg-purple/10 text-purple")}>
                {log.actionItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={cn("pb-3 pt-2.5 text-xs font-bold border-b-2 transition-all", activeTab === 'transcript' ? "border-purple text-purple" : "border-transparent text-ink-soft hover:text-ink")}
          >
            Transcript
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'summary' && (
            <div className="bg-purple-soft/5 border border-purple/10 rounded-2xl p-4 text-xs text-ink leading-relaxed whitespace-pre-line shadow-inner min-h-[120px]">
              {log.summary || 'AI Summary is generating or unavailable for this meeting.'}
            </div>
          )}

          {activeTab === 'actions' && (
            hasActionItems ? (
              <div className="space-y-2">
                {log.actionItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 bg-white border border-slate-100 rounded-xl p-3.5 text-xs text-ink leading-tight shadow-sm">
                    <span className="text-purple mt-0.5">📌</span>
                    <div className="flex-1">
                      <p className="font-semibold text-ink">{item.text || item.task || item.title}</p>
                      {(item.assignedToName || item.assignedTo?.full_name) && (
                        <p className="text-[9px] text-purple font-bold tracking-wide mt-0.5 uppercase">
                          Assigned to: {item.assignedToName || item.assignedTo?.full_name}
                        </p>
                      )}
                      {item.status && (
                        <span className={cn("inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded mt-1", item.status === 'done' ? "bg-emerald-50 text-emerald-600" : "bg-yellow-50 text-yellow-600")}>
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-ink-soft">
                <ClipboardList className="size-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No action items were captured for this meeting.</p>
              </div>
            )
          )}

          {activeTab === 'transcript' && (
            hasTranscript ? (
              <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 font-mono text-[10px] leading-relaxed text-ink whitespace-pre-line">
                {log.transcriptRaw}
              </div>
            ) : (
              <div className="py-12 text-center text-ink-soft">
                <FileText className="size-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No transcript was captured for this meeting.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------- CallLogsSection Component ---------------- */

function CallLogsSection() {
  const { getDisplayName } = useNicknames()
  const { user: currentUser } = useDashboard()
  const myId = currentUser?._id || currentUser?.id
  const [selectedLog, setSelectedLog] = useState<any | null>(null)

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['unifiedCallLogs'],
    queryFn: async () => {
      const [logsRes, meetingsRes] = await Promise.all([
        fetchCallLogs().catch(() => ({ logs: [] })),
        fetchMeetings(1, 50).catch(() => ({ meetings: [] }))
      ])

      const rawLogs = (logsRes?.logs || []).map((l: any) => ({
        id: l._id || l.id,
        roomId: l.roomId,
        title: l.label || `${l.type === 'video' ? 'Video' : 'Voice'} Call`,
        type: l.type,
        timestamp: new Date(l.timestamp),
        duration: l.duration || 0,
        missed: l.missed || false,
        isMeeting: false
      }))

      const rawMeetings = (meetingsRes?.meetings || []).map((m: any) => ({
        id: m._id || m.id,
        roomId: m.roomId,
        title: m.title || 'Untitled Meeting',
        type: m.type || 'video',
        timestamp: new Date(m.startedAt || m.createdAt),
        duration: m.duration || 0,
        missed: false,
        isMeeting: true,
        host: m.host,
        attendees: m.attendees,
        summary: m.summary,
        transcriptRaw: m.transcriptRaw,
        actionItems: m.actionItems
      }))

      return [...rawLogs, ...rawMeetings].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    },
    staleTime: 1000 * 5
  })

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all call logs? This will delete all past call records and meeting transcript summaries.')) return
    try {
      const { clearCallLogs } = await import('@/lib/api')
      await clearCallLogs()
      toast.success('Call logs cleared successfully.')
      refetch()
    } catch {
      toast.error('Failed to clear call logs.')
    }
  }

  const formatDuration = (sec: number) => {
    if (!sec) return '0s'
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    const parts = []
    if (h > 0) parts.push(`${h}h`)
    if (m > 0) parts.push(`${m}m`)
    if (s > 0 || parts.length === 0) parts.push(`${s}s`)
    return parts.join(' ')
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-black/30 italic">Past Collaboration Sessions</h3>
        {logs.length > 0 && (
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-xl border border-red-200/50 transition-all cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            Clear Logs
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-3xl bg-black/3 animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-black/5 rounded-[28px] bg-black/2 max-w-lg mx-auto">
          <Phone className="size-10 text-black/20 mx-auto mb-3" />
          <h4 className="font-bold text-ink text-sm">No Call Logs Found</h4>
          <p className="text-xs text-ink-soft max-w-xs mx-auto mt-1 leading-relaxed">
            Your call history, meeting minutes, and voice transcripts will appear here once you participate in calls.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {logs.map((log: any) => {
            const dateStr = log.timestamp.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
            const timeStr = log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

            return (
              <div
                key={log.id}
                className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-black/5 bg-white px-4 py-3.5 transition-all hover:shadow-md hover:border-purple/25"
              >
                {/* Icon pill */}
                <div className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl",
                  log.missed ? "bg-red-50" : log.isMeeting ? "bg-emerald-50" : "bg-purple-soft/40"
                )}>
                  {log.type === 'video'
                    ? <Video className={cn("size-5", log.missed ? "text-red-400" : log.isMeeting ? "text-emerald-500" : "text-purple")} />
                    : <Phone className={cn("size-5", log.missed ? "text-red-400" : log.isMeeting ? "text-emerald-500" : "text-purple")} />
                  }
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-ink text-[13px] truncate" title={log.title}>
                      {log.title}
                    </h4>
                    <span className={cn(
                      "shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                      log.missed ? "bg-red-50 text-red-400" : log.isMeeting ? "bg-emerald-50 text-emerald-600" : "bg-purple/10 text-purple"
                    )}>
                      {log.missed ? 'Missed' : log.isMeeting ? 'Meeting' : log.type === 'video' ? 'Video' : 'Voice'}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-soft mt-0.5">
                    {dateStr} · {timeStr}
                    {!log.missed && log.duration > 0 && <span className="ml-1">· {formatDuration(log.duration)}</span>}
                  </p>
                </div>

                {/* Action */}
                {log.isMeeting ? (
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="shrink-0 text-[10px] font-bold text-purple bg-purple-soft/60 px-2.5 py-1.5 rounded-xl hover:bg-purple hover:text-white transition-all cursor-pointer"
                  >
                    Details
                  </button>
                ) : (
                  <div className="shrink-0 size-2.5 rounded-full" />
                )}
              </div>
            )
          })}
        </div>
      )}

      {selectedLog && (
        <MeetingDetailModal 
          log={selectedLog} 
          onClose={() => setSelectedLog(null)} 
        />
      )}
    </div>
  )
}

/* ---------------- CalendarSection Component ---------------- */

interface CalendarSectionProps {
  coworkers: any[]
}

function CalendarSection({ coworkers }: CalendarSectionProps) {
  const { getDisplayName } = useNicknames()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any | null>(null)
  const [actionItemsOpen, setActionItemsOpen] = useState(false)

  // Query to fetch tasks
  const { data: tasks = [], refetch: refetchTasksList, isLoading: isTasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetchTasks()
      return res.tasks || []
    }
  })

  // ── Brain: Daily Digest (morning brief from meeting transcripts + group chats) ──
  const { data: digestData, isLoading: isDigestLoading } = useQuery({
    queryKey: ['dailyDigest'],
    queryFn: async () => {
      const res = await webGetDailyDigest()
      return res?.digest || null
    },
    staleTime: 5 * 60 * 1000, // Refresh every 5 min
  })

  // ── Real calendar events from the org (from /api/v1/events) ──
  const { data: calendarEvents = [] } = useQuery({
    queryKey: ['calendarEvents', currentDate.getFullYear(), currentDate.getMonth()],
    queryFn: async () => {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      const res = await getCalendarEvents({ start: start.toISOString(), end: end.toISOString() })
      return res?.events || []
    },
  })

  // Holidays, fetched unbounded by date (mirrors mobile's `type: 'holiday'` query) so
  // the month-scoped `calendarEvents` query above never crowds them out and counts match.
  const { data: holidayEvents = [] } = useQuery({
    queryKey: ['calendarHolidays'],
    queryFn: async () => {
      const res = await getCalendarEvents({ type: 'holiday' })
      return (res?.events || []).filter((e: any) => e?.eventType === 'holiday')
    },
    staleTime: 60 * 60 * 1000,
  })

  // Merge: month-scoped events + the full holiday set, de-duped by _id.
  const allCalEvents = useMemo(() => {
    const ids = new Set(calendarEvents.map((e: any) => e._id))
    const extraHolidays = holidayEvents.filter((h: any) => !ids.has(h._id))
    return [...calendarEvents, ...extraHolidays]
  }, [calendarEvents, holidayEvents])

  // Modal Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'event' | 'meeting'>('meeting')
  const [meetingType, setMeetingType] = useState<'voice' | 'video'>('video')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [notifyAll, setNotifyAll] = useState(true) // Broadcast by default
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [formSubmitLoading, setFormSubmitLoading] = useState(false)

  // Reset form when modal opens for create or edit
  const openCreateModal = () => {
    setTitle('')
    setDescription('')
    setType('meeting')
    setMeetingType('video')

    // Default times: starting at selected date next hour
    const now = new Date(selectedDate)
    now.setHours(new Date().getHours() + 1, 0, 0, 0)
    const startStr = formatDateForInput(now)
    now.setHours(now.getHours() + 1)
    const endStr = formatDateForInput(now)

    setStartTime(startStr)
    setEndTime(endStr)
    setPriority('medium')
    setNotifyAll(true)
    setSelectedRecipients([])
    setSearchQuery('')
    setEditingTask(null)
    setIsModalOpen(true)
  }

  const openEditModal = (task: any) => {
    setTitle(task.title)
    setDescription(task.description || '')
    setType(task.type || 'meeting')
    setMeetingType(task.meetingType || 'video')
    setStartTime(formatDateForInput(new Date(task.start_time)))
    setEndTime(formatDateForInput(new Date(task.end_time)))
    setPriority(task.priority || 'medium')

    const hasRec = task.recipients && task.recipients.length > 0
    setNotifyAll(!hasRec)
    setSelectedRecipients(task.recipients ? task.recipients.map((r: any) => typeof r === 'string' ? r : (r._id || r.id || String(r))) : [])
    setSearchQuery('')
    setEditingTask(task)
    setIsModalOpen(true)
  }

  // Toggle a meeting-sourced action item between done / open. The backend mirrors the
  // change onto Meeting.actionItems and notifies other participants (F3).
  const handleToggleActionItem = async (task: any) => {
    try {
      const next = task.status === 'done' ? 'todo' : 'done'
      await updateTaskFull(task._id, { status: next })
      refetchTasksList()
    } catch {
      toast.error('Could not update action item')
    }
  }

  // Format Date helpers
  const formatDateForInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !startTime || !endTime) {
      toast.error('Title, start time, and end time are required.')
      return
    }

    setFormSubmitLoading(true)
    const data = {
      title,
      description,
      type,
      meetingType: type === 'meeting' ? meetingType : undefined,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      priority,
      recipients: notifyAll ? [] : selectedRecipients,
    }

    try {
      if (editingTask) {
        await updateTaskFull(editingTask._id, data)
        toast.success('Event updated successfully!')
      } else {
        await createTaskFull(data)
        toast.success('Event scheduled successfully!')
      }
      setIsModalOpen(false)
      refetchTasksList()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to save event.')
    } finally {
      setFormSubmitLoading(false)
    }
  }

  // Handle Delete
  const handleDelete = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return
    try {
      await deleteTaskFull(taskId)
      toast.success('Event deleted successfully!')
      refetchTasksList()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to delete event.')
    }
  }

  // Generate Calendar cells
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const cells = getCalendarCells(currentDate)

  // Filter tasks for selected day
  const selectedDayTasks = tasks.filter((task: any) => {
    const d = new Date(task.start_time)
    return (
      d.getDate() === selectedDate.getDate() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getFullYear() === selectedDate.getFullYear()
    )
  })

  // Org calendar events (holidays, company events, video/audio meetings) for the
  // selected day, normalized to the task shape so the agenda can render both in one
  // merged list. These aren't Task records, so they never get Edit/Delete.
  const selectedDayCalEvents = allCalEvents
    .filter((ev: any) => {
      const d = new Date(ev.startTime)
      return (
        d.getDate() === selectedDate.getDate() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getFullYear() === selectedDate.getFullYear()
      )
    })
    .map((ev: any) => ({
      _id: ev._id,
      title: ev.title,
      description: ev.summary || ev.description || '',
      start_time: ev.startTime,
      end_time: ev.endTime,
      eventType: ev.eventType,
      status: ev.status,
      recipients: ev.attendees,
      isOrgEvent: true,
    }))

  const selectedDayItems = [...selectedDayTasks, ...selectedDayCalEvents].sort(
    (a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )

  // Filter coworkers by search query
  const filteredCoworkers = coworkers.filter((c: any) => {
    const name = getDisplayName(c).toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  // Check if a cell is selected
  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  // Check if a cell is today
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const handleAiDescribe = async () => {
    if (!description.trim()) {
      toast.error('Please enter a brief outline or topic in the description field first.')
      return
    }
    setAiLoading(true)
    try {
      const res = await fetchAiDescription(description)
      if (res && res.description) {
        setDescription(res.description)
        toast.success('AI description generated successfully!')
      } else {
        toast.error('Failed to generate AI description.')
      }
    } catch (err: any) {
      console.error(err)
      toast.error('AI generation error. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white">
      {/* Left: Monthly Grid */}
      <div className="flex-1 flex flex-col p-6 border-r border-black/5 overflow-y-auto min-w-0">

        {/* ── Morning Brief (Brain Daily Digest) ── */}
        {(isDigestLoading || digestData) && (
          <div className="mb-6 rounded-[20px] border border-purple/15 bg-gradient-to-br from-purple/5 via-purple/3 to-transparent p-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-6 rounded-xl bg-purple/10 flex items-center justify-center">
                <Sparkles className="size-3.5 text-purple" />
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-purple">Your Morning Brief</span>
              <span className="ml-auto text-[10px] text-ink-soft">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
            {isDigestLoading ? (
              <div className="space-y-1.5">
                <div className="h-3 w-3/4 rounded-full bg-black/5 animate-pulse" />
                <div className="h-3 w-1/2 rounded-full bg-black/5 animate-pulse" />
              </div>
            ) : (
              <p className="text-[13px] text-ink leading-relaxed">
                {typeof digestData === 'string'
                  ? digestData
                  : digestData?.summary || digestData?.brief || 'No activity to brief on yet. Once your team starts meetings and group conversations, Aida will summarize key points here.'}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <h3 className="text-xl font-bold text-ink">
              {monthNames[month]} {year}
            </h3>
            <p className="text-xs text-ink-soft">Plan and sync team agendas</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 border border-black/5 rounded-xl hover:bg-slate-50 transition-all text-ink"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 border border-black/5 rounded-xl hover:bg-slate-50 text-xs font-bold text-ink"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-2 border border-black/5 rounded-xl hover:bg-slate-50 transition-all text-ink"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Weekday Labels */}
        <div className="grid grid-cols-7 text-center mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-xs font-bold uppercase tracking-wider text-black/30 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Day Grid */}
        <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-[300px]">
          {cells.map(({ date, isCurrentMonth }, idx) => {
            const dayNum = date.getDate()
            const cellDateMonth = date.getMonth()
            const cellDateYear = date.getFullYear()

            // Filter tasks for this day
            const dayTasks = tasks.filter((task: any) => {
              const td = new Date(task.start_time)
              return (
                td.getDate() === dayNum &&
                td.getMonth() === cellDateMonth &&
                td.getFullYear() === cellDateYear
              )
            })

            // Also merge in real org calendar events from /api/v1/events
            const dayCalEvents = allCalEvents.filter((ev: any) => {
              const ed = new Date(ev.startTime)
              return (
                ed.getDate() === dayNum &&
                ed.getMonth() === cellDateMonth &&
                ed.getFullYear() === cellDateYear
              )
            })
            const hasOrgEvent = dayCalEvents.length > 0

            const hasUrgent = dayTasks.some((t: any) => t.priority === 'urgent')
            const hasMeeting = dayTasks.some((t: any) => t.type === 'meeting' && t.priority !== 'urgent')
            const hasEvent = dayTasks.some((t: any) => t.type === 'event' && t.priority !== 'urgent')
            const hasTask = dayTasks.some((t: any) => (t.type === 'task' || t.type === 'synced' || !t.type) && t.priority !== 'urgent')
            const hasUpdated = dayTasks.some((t: any) => t.isUpdated)

            const selected = isSelected(date)
            const today = isToday(date)

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "aspect-square flex flex-col justify-between p-2 rounded-2xl border transition-all text-left relative group",
                  selected
                    ? "bg-purple border-purple text-white shadow-lg shadow-purple/20 scale-[1.02]"
                    : "border-black/5 hover:border-purple/30 hover:bg-purple-soft/10",
                  !isCurrentMonth && (selected ? "text-white/60" : "text-ink-soft/40 bg-slate-50/20"),
                  isCurrentMonth && !selected && "text-ink bg-white",
                  today && !selected && "ring-2 ring-purple ring-offset-2"
                )}
              >
                <span className={cn(
                  "text-xs font-bold sm:text-sm",
                  today && !selected && "text-purple"
                )}>
                  {dayNum}
                </span>

                {/* Dot Indicators */}
                <div className="flex gap-1 justify-start flex-wrap mt-auto">
                  {hasUpdated && (
                    <span className="size-1.5 rounded-full bg-amber-500" title="Updated" />
                  )}
                  {hasUrgent && (
                    <span className={cn("size-1.5 rounded-full", selected ? "bg-white" : "bg-[#ef4444]")} title="Urgent" />
                  )}
                  {hasMeeting && (
                    <span className={cn("size-1.5 rounded-full", selected ? "bg-white" : "bg-[#10b981]")} title="Meeting" />
                  )}
                  {hasEvent && (
                    <span className={cn("size-1.5 rounded-full", selected ? "bg-white" : "bg-[#3b82f6]")} title="Event" />
                  )}
                  {hasTask && (
                    <span className={cn("size-1.5 rounded-full", selected ? "bg-white" : "bg-[#6366f1]")} title="Task" />
                  )}
                  {hasOrgEvent && dayCalEvents.slice(0, 3).map((ev: any, i: number) => (
                    <span
                      key={`org-${i}`}
                      className="size-1.5 rounded-full ring-1 ring-purple/30"
                      style={{ backgroundColor: selected ? '#fff' : (webEventColor(ev)) }}
                      title={ev.eventType === 'holiday' ? `Holiday: ${ev.title}` : ev.title}
                    />
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right: Selected Day Agenda */}
      <div className="w-full md:w-80 p-6 flex flex-col overflow-y-auto bg-slate-50/30">
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-black/30 italic">Agenda for</h4>
          <h3 className="text-lg font-bold text-ink mt-0.5">
            {selectedDate.toLocaleDateString('en-US', { dateStyle: 'medium' })}
          </h3>
        </div>

        {/* Action Items captured from meeting transcripts (F3) — collapsible dropdown under the agenda */}
        {(() => {
          const actionItems = (tasks as any[]).filter((t: any) => t.source === 'meeting')
          if (actionItems.length === 0) return null
          const now = Date.now()
          const pendingCount = actionItems.filter((item: any) => item.status !== 'done').length
          return (
            <div className="mb-6 rounded-2xl border border-black/5 bg-white overflow-hidden">
              <button
                onClick={() => setActionItemsOpen(v => !v)}
                className="w-full flex items-center gap-1.5 px-3 py-3 cursor-pointer"
              >
                <ClipboardList className="size-3.5 text-purple" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple">Action Items</h4>
                {pendingCount > 0 && (
                  <span className="text-[10px] font-bold bg-purple/10 text-purple px-1.5 py-0.5 rounded-full">{pendingCount}</span>
                )}
                <span className="text-[10px] text-ink-soft normal-case">from meetings</span>
                <ChevronDownIcon className={cn("size-3.5 text-ink-soft ml-auto transition-transform", actionItemsOpen && "rotate-180")} />
              </button>
              {actionItemsOpen && (
                <div className="space-y-2 px-3 pb-3">
                  {actionItems.map((item: any) => {
                    const done = item.status === 'done'
                    const overdue = !done && item.end_time && new Date(item.end_time).getTime() < now
                    const meetingName = item.meetingRef?.title || (item.description || '').replace(/^From meeting:\s*/, '')
                    return (
                      <div key={item._id} className="p-3 rounded-2xl bg-slate-50/60 border border-black/5 shadow-sm flex items-start gap-2.5">
                        <button
                          onClick={() => handleToggleActionItem(item)}
                          className={cn(
                            'mt-0.5 size-4 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                            done ? 'bg-emerald-500 border-emerald-500' : 'border-black/20 hover:border-purple'
                          )}
                          title={done ? 'Reopen' : 'Mark done'}
                        >
                          {done && <Check className="size-3 text-white" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={cn('text-[13px] font-semibold leading-snug', done ? 'line-through text-ink-soft' : 'text-ink')}>
                            {item.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={cn(
                              'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase',
                              done ? 'bg-emerald-50 text-emerald-600' : overdue ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-600'
                            )}>
                              {done ? 'Done' : overdue ? 'Overdue' : 'Pending'}
                            </span>
                            {item.assignedToName && <span className="text-[10px] text-ink-soft">· {item.assignedToName}</span>}
                            {meetingName && <span className="text-[10px] text-ink-soft truncate max-w-[120px]">· {meetingName}</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })()}

        <div className="flex-1 space-y-4 mb-6">
          {selectedDayItems.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-black/5 rounded-3xl bg-white/50">
              <Calendar className="size-8 text-black/20 mx-auto mb-2" />
              <p className="text-sm text-ink-soft font-medium">No events scheduled.</p>
            </div>
          ) : (
            selectedDayItems.map((task: any) => {
              const start = new Date(task.start_time)
              const end = new Date(task.end_time)
              const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

              return (
                <div key={task._id} className="p-4 rounded-2xl bg-white border border-black/5 shadow-sm space-y-3 relative group">
                  {/* Event Type & Actions Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {task.isOrgEvent ? (
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight flex items-center gap-1"
                          style={{ backgroundColor: `${webEventColor(task)}1a`, color: webEventColor(task) }}
                        >
                          {(task.eventType === 'meeting_video' || task.eventType === 'meeting_audio') && (
                            task.eventType === 'meeting_audio' ? <Phone className="size-2.5" /> : <Video className="size-2.5" />
                          )}
                          {task.eventType === 'holiday' ? 'Holiday'
                            : task.eventType === 'company' ? 'Company'
                            : task.eventType === 'meeting_video' ? 'Meeting (Video)'
                            : task.eventType === 'meeting_audio' ? 'Meeting (Voice)'
                            : 'All Day'}
                        </span>
                      ) : task.isUpdated ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-600 uppercase tracking-tight">
                          Updated
                        </span>
                      ) : task.type === 'meeting' ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-600 uppercase tracking-tight flex items-center gap-1">
                          {task.meetingType === 'voice' ? <Phone className="size-2.5" /> : <Video className="size-2.5" />}
                          Meeting ({task.meetingType === 'voice' ? 'Voice Call' : 'Video Call'})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-600 uppercase tracking-tight">
                          Event
                        </span>
                      )}

                      {!task.isOrgEvent && (
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                          task.priority === 'urgent' && "bg-red-50 text-red-500",
                          task.priority === 'high' && "bg-orange-50 text-orange-500",
                          task.priority === 'medium' && "bg-yellow-50 text-yellow-600",
                          task.priority === 'low' && "bg-slate-100 text-slate-500"
                        )}>
                          {task.priority}
                        </span>
                      )}
                    </div>

                    {task.isOrgEvent ? (
                      (task.eventType === 'meeting_video' || task.eventType === 'meeting_audio') && task.status === 'scheduled' && (
                        <button
                          onClick={() => apiStartMeeting(task._id).then((d: any) => window.alert(`Room: ${d.roomId}`)).catch((e: any) => window.alert(e.message))}
                          className="px-2 py-1 rounded-lg bg-purple/10 text-purple text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Start Meeting
                        </button>
                      )
                    ) : (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(task)}
                          className="p-1 rounded hover:bg-slate-100 text-ink-soft hover:text-purple"
                          title="Edit event"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(task._id)}
                          className="p-1 rounded hover:bg-slate-100 text-ink-soft hover:text-red-500"
                          title="Delete event"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="font-bold text-ink text-[15px]">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-ink-soft mt-1 leading-relaxed whitespace-pre-line">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Time info */}
                  <div className="flex items-center gap-1.5 text-[11px] text-ink-soft font-medium">
                    <Clock className="size-3.5 text-purple" />
                    <span>
                      {formatTime(start)} - {formatTime(end)}
                    </span>
                  </div>

                  {/* Recipients if any */}
                  {task.recipients && task.recipients.length > 0 && (
                    <div className="pt-2 border-t border-black/5 flex items-center gap-1">
                      <span className="text-[10px] text-ink-soft font-semibold">Invited:</span>
                      <div className="flex -space-x-2 overflow-hidden">
                        {task.recipients.slice(0, 4).map((r: any, rIdx: number) => {
                          const avatar = typeof r === 'object' ? r.avatar : undefined
                          const name = typeof r === 'object' ? getDisplayName(r) : 'User'
                          return (
                            <ChatAvatar
                              key={rIdx}
                              src={avatar}
                              name={name}
                              className="size-5 rounded-full border border-white text-[8px]"
                            />
                          )
                        })}
                        {task.recipients.length > 4 && (
                          <div className="size-5 rounded-full border border-white bg-slate-100 text-[8px] font-bold text-slate-500 flex items-center justify-center">
                            +{task.recipients.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        <button
          onClick={openCreateModal}
          className="w-full h-12 bg-purple text-white font-bold rounded-2xl shadow-lg shadow-purple/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="size-4" />
          Schedule Event
        </button>
      </div>

      {/* Schedule Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-[32px] bg-white p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-6 top-6 text-ink-soft hover:text-ink"
            >
              <X className="size-5" />
            </button>

            <h3 className="text-xl font-bold text-ink mb-1">
              {editingTask ? 'Edit Event' : 'Schedule Event'}
            </h3>
            <p className="text-xs text-ink-soft mb-6">Create organization tasks, events, and collaborative meetings</p>

            <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">Title</label>
                <input
                  required
                  type="text"
                  className="w-full bg-purple-soft/30 border-none rounded-2xl py-3 px-4 text-ink focus:ring-2 focus:ring-purple/20 transition-all outline-none text-sm"
                  placeholder="e.g. Weekly Alignment Meeting"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Event Type & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider">Type</label>
                  <select
                    className="w-full bg-purple-soft/30 border-none rounded-2xl py-3 px-4 text-ink focus:ring-2 focus:ring-purple/20 transition-all outline-none text-sm"
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                  >
                    <option value="meeting">Meeting (Green dot)</option>
                    <option value="event">Event (Blue dot)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider">Priority</label>
                  <select
                    className="w-full bg-purple-soft/30 border-none rounded-2xl py-3 px-4 text-ink focus:ring-2 focus:ring-purple/20 transition-all outline-none text-sm"
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {type === 'meeting' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider">Meeting Type</label>
                  <select
                    className="w-full bg-purple-soft/30 border-none rounded-2xl py-3 px-4 text-ink focus:ring-2 focus:ring-purple/20 transition-all outline-none text-sm"
                    value={meetingType}
                    onChange={(e: any) => setMeetingType(e.target.value)}
                  >
                    <option value="video">Video Call 🎥</option>
                    <option value="voice">Voice Call 📞</option>
                  </select>
                </div>
              )}

              {/* Date & Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider">Start Time</label>
                  <input
                    required
                    type="datetime-local"
                    className="w-full bg-purple-soft/30 border-none rounded-2xl py-3 px-4 text-ink focus:ring-2 focus:ring-purple/20 transition-all outline-none text-sm"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider">End Time</label>
                  <input
                    required
                    type="datetime-local"
                    className="w-full bg-purple-soft/30 border-none rounded-2xl py-3 px-4 text-ink focus:ring-2 focus:ring-purple/20 transition-all outline-none text-sm"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Description & AI Describe */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider">Description</label>
                  <button
                    type="button"
                    disabled={aiLoading}
                    onClick={handleAiDescribe}
                    className="text-[11px] font-bold text-purple flex items-center gap-1 hover:underline disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Sparkles className="size-3" />
                    )}
                    ✦ AI Describe
                  </button>
                </div>
                <textarea
                  className="w-full bg-purple-soft/30 border-none rounded-2xl py-3 px-4 text-ink focus:ring-2 focus:ring-purple/20 transition-all outline-none min-h-[80px] resize-none text-sm"
                  placeholder="Outline the meeting agenda or write a brief prompt and click '✦ AI Describe' to professionalize it."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Notification & Recipients Selection */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider">Recipients / Notifications</label>
                </div>

                {/* Broadcast Checkbox */}
                <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-purple-soft/20 border border-purple/10 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded text-purple focus:ring-purple size-4 mt-0.5"
                    checked={notifyAll}
                    onChange={(e) => setNotifyAll(e.target.checked)}
                  />
                  <div className="text-left">
                    <p className="text-xs font-bold text-ink">Broadcast Alert to Default Group Chat</p>
                    <p className="text-[10px] text-ink-soft leading-normal">
                      Posts an automated alert message to the entire team in the organization's default group feed.
                    </p>
                  </div>
                </label>

                {/* Coworker checklist - shown only if NOT broadcasting */}
                {!notifyAll && (
                  <div className="space-y-2 p-3 rounded-2xl border border-black/5 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-black/30" />
                        <input
                          type="text"
                          placeholder="Search coworkers..."
                          className="w-full bg-white border border-black/5 rounded-xl py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-purple/20"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const allIds = coworkers.map((w: any) => w._id || w.id)
                          const allChecked = selectedRecipients.length === allIds.length
                          setSelectedRecipients(allChecked ? [] : allIds)
                        }}
                        className="text-[10px] font-bold text-purple whitespace-nowrap hover:underline px-1"
                      >
                        {selectedRecipients.length === coworkers.length ? 'Unselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {filteredCoworkers.length === 0 ? (
                        <p className="text-[10px] text-ink-soft text-center py-4">No coworkers found.</p>
                      ) : (
                        filteredCoworkers.map((worker: any) => {
                          const wId = worker._id || worker.id
                          const isChecked = selectedRecipients.includes(wId)
                          return (
                            <label
                              key={wId}
                              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-purple-soft/20 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <ChatAvatar
                                  src={worker.avatar}
                                  name={getDisplayName(worker)}
                                  className="size-6 rounded-lg text-[9px]"
                                />
                                <div className="text-left">
                                  <p className="text-xs font-semibold text-ink leading-none">{worker.full_name}</p>
                                  <p className="text-[9px] text-ink-soft leading-none mt-0.5">{worker.org_role || 'Staff'}</p>
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                className="rounded text-purple focus:ring-purple size-3.5"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedRecipients(selectedRecipients.filter(id => id !== wId))
                                  } else {
                                    setSelectedRecipients([...selectedRecipients, wId])
                                  }
                                }}
                              />
                            </label>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 h-11 border border-black/5 hover:bg-slate-50 font-bold rounded-xl text-xs text-ink-soft"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitLoading}
                  className="px-6 h-11 bg-purple text-white font-bold rounded-xl text-xs shadow-md shadow-purple/10 hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {formSubmitLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  {editingTask ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

