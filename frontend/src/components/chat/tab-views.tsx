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
import { useQuery } from '@tanstack/react-query'
import { useDashboard } from '@/contexts/DashboardContext'
import { useNavigate } from '@tanstack/react-router'
import { useChats } from '@/contexts/AppContext'
import { useTheme } from 'next-themes'
import { CreateGroupModal } from './create-group-modal'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { ChatAvatar } from '@/components/chat/chat-avatar'
import { updateProfile, uploadAvatar, uploadBackground, searchUsers, getMyContacts, addContact, getSuggestions, removeContact as removeContactApi, blockUser, fetchTasks, createTaskFull, updateTaskFull, deleteTaskFull, fetchAiDescription } from '@/lib/api'
import { toast } from 'sonner'
import {
  profile,
  type Friend,
} from '@/lib/chat-data'
import { fetchAllUserChats, fetchCallLogs, accessOrCreateChat, joinOrganizationByInvite } from '@/lib/api'
import { ChatWindow } from '@/components/chat/chat-window'
import { GroupInfo } from '@/components/chat/group-info'
import { useSocket } from '@/contexts/AppContext'
import { MessageOverlay } from '@/components/chat/message-overlay'
import { ZegoMeetingModal } from '@/components/chat/ZegoMeetingModal'
import { countries } from '@/lib/countries'

// Next.js Image polyfill for Vite
const Image = ({ src, alt, className, ...rest }: React.ImgHTMLAttributes<HTMLImageElement> & { src?: string; alt?: string; width?: number; height?: number }) => <img src={src} alt={alt} className={className} {...rest} />

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
  const { startCall } = useSocket()
  const { user: currentUser, setActiveChat, setActiveChatId, bgType } = useDashboard()
  const { refreshChats } = useChats()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const myId = currentUser?._id || currentUser?.id
  const [contacts, setContacts] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingContacts, setLoadingContacts] = useState(true)
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

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingContacts(true)
        const [contactsRes, suggestRes] = await Promise.all([
          getMyContacts().catch(() => ({ data: [] })),
          getSuggestions().catch(() => ({ data: [], users: [] })),
        ])
        // Filter out self from contacts and suggestions
        const allContacts = (contactsRes?.data || []).filter((c: any) => (c._id || c.id) !== myId)
        const allSuggestions = (suggestRes?.data || suggestRes?.users || []).filter((s: any) => (s._id || s.id) !== myId)
        setContacts(allContacts)
        setSuggestions(allSuggestions)
      } finally {
        setLoadingContacts(false)
      }
    }
    load()
  }, [myId])

  const handleAddFriend = async () => {
    if (!addIdentifier.trim()) return
    setAddLoading(true)
    try {
      const res = await addContact(addIdentifier.trim())
      const newContact = res?.data || res
      setContacts(prev => [...prev, newContact])
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
      setContacts(prev => prev.filter(c => (c._id || c.id) !== userId))
      toast.success('Contact removed')
    } catch {
      toast.error('Could not remove contact')
    }
  }

  const handleBlock = async (userId: string) => {
    try {
      await blockUser(userId)
      setContacts(prev => prev.filter(c => (c._id || c.id) !== userId))
      toast.success('User blocked')
    } catch {
      toast.error('Could not block user')
    }
  }

  const filtered = contacts.filter(c =>
    (c.full_name || c.username || '').toLowerCase().includes(search.toLowerCase())
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
                  {suggestions.slice(0, 4).map(s => (
                    <div key={s._id || s.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-black/3 transition-colors">
                      <ChatAvatar src={s.avatar} name={s.full_name || s.username} className="size-9 rounded-xl" />
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
              <h3 className="text-base font-bold text-ink">No Contacts Yet</h3>
              <p className="text-xs text-ink-soft max-w-[280px] mt-1 mb-6 leading-relaxed">
                Connect with colleagues by adding them to your contacts list to start messaging.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="rounded-2xl bg-purple px-6 py-3 text-xs font-bold text-white hover:bg-purple/90 transition-all shadow-md shadow-purple/20"
              >
                Add your first contact
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Users className="size-12 text-black/10 mb-3" />
              <p className="text-sm text-black/40">No contacts yet</p>
              <button onClick={() => setShowAddModal(true)} className="mt-3 text-sm font-semibold text-purple hover:underline">
                Add your first contact →
              </button>
            </div>
          )
        ) : (
          <div className={cn("grid gap-3", effectiveNarrow ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5")}>
            {filtered.map(contact => {
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
                    <ChatAvatar src={contact.avatar} name={contact.full_name || contact.username} className="size-14 rounded-2xl shadow-md" />
                    {contact.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-green-500" />
                    )}
                  </div>
                  <div className={cn("min-w-0 flex-1", effectiveNarrow ? "text-left" : "text-center")}>
                    <p className={cn("truncate font-bold text-ink", effectiveNarrow ? "text-sm" : "text-[13px]")}>
                      {contact.full_name || contact.username}
                    </p>
                    <p className="truncate text-[10px] text-black/40">
                      {effectiveNarrow 
                        ? (contact.isOnline ? "Online" : "Away") 
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
                        onClick={() => startCall && startCall(contact._id || contact.id, contact.full_name || contact.username, contact.avatar, 'voice')}
                      >
                        <Phone className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onMessage?.(contact)}
                      className="absolute inset-0 z-10"
                    />
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
                                handleRemove(cid)
                                setActiveDropdownId(null)
                              }}
                              className="w-full text-left rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-black/60 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              Remove
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleBlock(cid)
                                setActiveDropdownId(null)
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
              {suggestions.slice(0, 6).map(s => (
                <div key={s._id || s.id} className="flex items-center gap-3 rounded-2xl border border-black/5 p-3 hover:border-purple/20 hover:shadow-sm transition-all">
                  <ChatAvatar src={s.avatar} name={s.full_name || s.username} className="size-11 rounded-xl shrink-0" />
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
  const { startCall } = useSocket()
  const [selectionStep, setSelectionStep] = useState<'none' | 'source' | 'type'>('none')
  const [activeMeeting, setActiveMeeting] = useState<{ roomId: string; type: 'voice' | 'video' } | null>(null)
  const { user: currentUser, bgType } = useDashboard()
  const [callsTab, setCallsTab] = useState<'meet' | 'calendar'>('meet')

  const generateRoomId = () => `bubble-${Math.random().toString(36).slice(2, 11)}`

  const handleStartCall = (type: 'voice' | 'video', coworker?: any) => {
    if (coworker) {
      if (startCall) {
        startCall(coworker._id || coworker.id, coworker.full_name || coworker.username, coworker.avatar, type)
      }
      return
    }
    const roomId = generateRoomId()
    setActiveMeeting({ roomId, type })
    setSelectionStep('none')
  }

  const handleSourceSelect = (source: 'group' | 'contacts') => {
    setSelectionStep('type')
  }

  const handleTypeSelect = (type: 'voice' | 'video') => {
    handleStartCall(type)
  }

  // Fetch real data
  const { data: callLogsData, isLoading } = useQuery({
    queryKey: ['callLogs'],
    queryFn: async () => {
      const res = await fetchCallLogs()
      return res.data || { rooms: [], coworkers: [] }
    }
  })

  const { data: coworkerData } = useQuery({
    queryKey: ['coworkers-calls'],
    queryFn: async () => {
      const res = await searchUsers('')
      return res.users || []
    }
  })

  const activeRooms = callLogsData?.rooms || []
  // Filter out self and bots from coworkers so you can't call yourself or the AI bot
  const coworkers = (coworkerData || []).filter((w: any) => {
    const wId = w._id || w.id
    const myId = currentUser?._id || currentUser?.id
    const isBot = w.is_bot || w.username === 'aida' || w.username?.toLowerCase() === 'aida'
    return wId !== myId && !isBot
  })

  return (
    <div className={cn("flex h-full w-full overflow-hidden rounded-[26px]", bgType === 'glass' ? "bg-transparent" : "bg-white")}>
      <div className={cn("flex flex-1 flex-col overflow-hidden border-r border-black/5", bgType === 'glass' ? "bg-transparent" : "bg-white")}>
        <ViewHeader
          title={callsTab === 'meet' ? "Events & Meets" : "Business Calendar"}
          subtitle={callsTab === 'meet' ? "Experience seamless communication" : "Organize organization events and team meetings"}
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
                        onClick={() => handleStartCall('video')}
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
                ) : coworkers.map((worker: any) => (
                  <div key={worker._id || worker.id} className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-[32px] border border-black/5 bg-white p-5 text-center transition-all hover:border-purple/30 hover:shadow-2xl">
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10">
                      <div className="relative mx-auto inline-block">
                        <ChatAvatar
                          src={worker.avatar}
                          name={worker.full_name || worker.username}
                          className="size-20 rounded-[24px] shadow-lg ring-4 ring-white"
                        />
                        {worker.isOnline && (
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
        ) : (
          <CalendarSection coworkers={coworkers} />
        )}

        {/* Meeting Modal - ZegoCloud */}
        {activeMeeting && (
          <ZegoMeetingModal
            roomId={activeMeeting.roomId}
            type={activeMeeting.type}
            userId={currentUser?._id || currentUser?.id || 'user'}
            userName={currentUser?.full_name || currentUser?.username || 'Guest'}
            userAvatar={currentUser?.avatar}
            onClose={() => setActiveMeeting(null)}
          />
        )}

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
    return other?.full_name || other?.username || chat.chatName || 'Unknown'
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


/* ---------------- Profile ---------------- */


/* ---------------- Profile ---------------- */

function OrgSettingsModal({
  onClose,
  currentUser,
}: {
  onClose: () => void
  currentUser: any
}) {
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
                      <img src={logo} alt="Logo" className="size-full object-cover" />
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
                        <ChatAvatar src={member.avatar} name={member.full_name || member.username} className="size-10 rounded-xl" />
                        {member.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-green-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-sm text-ink truncate">{member.full_name || member.username}</h5>
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
                              <span>👤 Host: {meeting.host?.full_name || meeting.host?.username || 'Unknown'}</span>
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
  })

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
      toast.error('Background upload failed')
    }
  }

  const handleBgSelect = async (type: string) => {
    setBgType(type)
    if (type === 'dark') {
      setTheme('dark')
    } else {
      setTheme('light')
    }
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

            <label className="block">
              <span className={labelCls}>Organization Invite Code</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.inviteCode || ''}
                  onChange={e => setFormData({ ...formData, inviteCode: e.target.value })}
                  className={cn(inputCls, "flex-1")}
                  placeholder="Enter 8-digit code"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await joinOrganizationByInvite(formData.inviteCode);
                      toast.success('Successfully joined organization!');
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
                  <button
                    type="button"
                    className={cn(
                      'w-full flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all',
                      bgType === 'custom' ? 'border-purple bg-purple-soft/50 ring-4 ring-purple/10' : 'border-transparent bg-purple-soft/30 hover:bg-purple-soft/50',
                    )}
                  >
                    <label className="cursor-pointer flex flex-col items-center gap-3 w-full">
                      <div className="size-12 rounded-full bg-purple flex items-center justify-center text-white">
                        <Camera className="size-6" />
                      </div>
                      <span className="text-[13px] font-bold text-ink">Custom</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleBackgroundUpload} />
                    </label>
                  </button>
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
  const { refreshChats } = useChats()
  const isNarrow = narrowProp ?? contextNarrow
  const [coworkers, setCoworkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [collapsingFor, setCollapsingFor] = useState<string | null>(null)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const isMobile = useIsMobile()
  const [searchActive, setSearchActive] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCoworkers = async () => {
      try {
        setLoading(true)
        const res = await searchUsers(search)
        // Filter out self and bots so you can't message yourself or the AI bot
        const myId = currentUser?._id || currentUser?.id
        setCoworkers((res.users || []).filter((w: any) => {
          const wId = w._id || w.id
          const isMe = wId === myId
          const isBot = w.is_bot || w.username === 'aida' || w.username?.toLowerCase() === 'aida'
          return !isMe && !isBot
        }))
      } catch (err) {
        console.error('Failed to fetch coworkers:', err)
        toast.error('Failed to load coworkers')
      } finally {
        setLoading(false)
      }
    }
    fetchCoworkers()
  }, [search])

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
      setActiveChatId(chat.id || chat._id)
      setShowInfo(false)
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
            coworkers.map((worker) => {
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
                      name={worker.full_name || worker.username}
                      className="size-12 rounded-xl shadow-sm"
                    />
                    {worker.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white bg-emerald-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-bold text-ink text-[13px]">{worker.full_name || worker.username}</p>
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

/* ---------------- CalendarSection Component ---------------- */

interface CalendarSectionProps {
  coworkers: any[]
}

function CalendarSection({ coworkers }: CalendarSectionProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any | null>(null)
  
  // Query to fetch tasks
  const { data: tasks = [], refetch: refetchTasksList, isLoading: isTasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetchTasks()
      return res.tasks || []
    }
  })

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

  // Filter coworkers by search query
  const filteredCoworkers = coworkers.filter((c: any) => {
    const name = (c.full_name || c.username || '').toLowerCase()
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

            const hasMeeting = dayTasks.some((t: any) => t.type === 'meeting')
            const hasEvent = dayTasks.some((t: any) => t.type === 'event' && !t.isUpdated)
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
                  {hasMeeting && (
                    <span className={cn("size-1.5 rounded-full", selected ? "bg-white" : "bg-emerald-500")} title="Meeting" />
                  )}
                  {hasEvent && (
                    <span className={cn("size-1.5 rounded-full", selected ? "bg-white" : "bg-blue-500")} title="Event" />
                  )}
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

        <div className="flex-1 space-y-4 mb-6">
          {selectedDayTasks.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-black/5 rounded-3xl bg-white/50">
              <Calendar className="size-8 text-black/20 mx-auto mb-2" />
              <p className="text-sm text-ink-soft font-medium">No events scheduled.</p>
            </div>
          ) : (
            selectedDayTasks.map((task: any) => {
              const start = new Date(task.start_time)
              const end = new Date(task.end_time)
              const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

              return (
                <div key={task._id} className="p-4 rounded-2xl bg-white border border-black/5 shadow-sm space-y-3 relative group">
                  {/* Event Type & Actions Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {task.isUpdated ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-600 uppercase tracking-tight">
                          Updated
                        </span>
                      ) : task.type === 'meeting' ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-600 uppercase tracking-tight">
                          Meeting
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-600 uppercase tracking-tight">
                          Event
                        </span>
                      )}
                      
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                        task.priority === 'urgent' && "bg-red-50 text-red-500",
                        task.priority === 'high' && "bg-orange-50 text-orange-500",
                        task.priority === 'medium' && "bg-yellow-50 text-yellow-600",
                        task.priority === 'low' && "bg-slate-100 text-slate-500"
                      )}>
                        {task.priority}
                      </span>
                    </div>

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
                          const name = typeof r === 'object' ? (r.full_name || r.username) : 'User'
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
                                  name={worker.full_name || worker.username}
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

