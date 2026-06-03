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
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useDashboard } from '@/contexts/DashboardContext'
import { useNavigate } from '@tanstack/react-router'
import { useChats } from '@/contexts/AppContext'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { ChatAvatar } from '@/components/chat/chat-avatar'
import { updateProfile, uploadAvatar, uploadBackground, searchUsers, getMyContacts, addContact, getSuggestions, removeContact as removeContactApi, blockUser } from '@/lib/api'
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

// Next.js Image polyfill for Vite
const Image = ({ src, alt, className, ...rest }: React.ImgHTMLAttributes<HTMLImageElement> & { src?: string; alt?: string; width?: number; height?: number }) => <img src={src} alt={alt} className={className} {...rest} />


function ViewHeader({ title, subtitle, action, isNarrow = false }: { title: string, subtitle?: string, action?: React.ReactNode, isNarrow?: boolean }) {
  const isMobile = useIsMobile()
  const { setIsMobileMenuOpen } = useDashboard()
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-black/5 bg-white/50 px-6 backdrop-blur-xl">
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
          <h1 className="truncate text-lg font-bold text-ink">{title}</h1>
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
  const { user: currentUser } = useDashboard()
  const isMobile = useIsMobile()
  const myId = currentUser?._id || currentUser?.id
  const [contacts, setContacts] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
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
    <div className="flex h-full flex-col bg-white">
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
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 rounded-xl bg-purple px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
              >
                <UserPlus className="size-4" />
                <span className="hidden sm:inline">Add Friend</span>
              </button>
            </div>
          )
        }
      />

      {isMobile && (
        <div className="px-4 py-3 border-b border-black/5 flex items-center gap-2 bg-white shrink-0">
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
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-purple px-4 text-xs font-bold text-white transition-opacity hover:opacity-90 shrink-0"
          >
            <UserPlus className="size-4" />
            <span>Add Friend</span>
          </button>
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
                      {effectiveNarrow ? (contact.isOnline ? "Online" : "Away") : (contact.org_role || contact.status_message || '@' + (contact.username || ''))}
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
    </div>
  )
}

/* ---------------- Calls ---------------- */

export function CallsView({ onStartMeeting }: { onStartMeeting: () => void }) {
  const { startCall } = useSocket()
  const [selectionStep, setSelectionStep] = useState<'none' | 'source' | 'type'>('none')
  const [activeMeeting, setActiveMeeting] = useState<{ roomId: string; type: 'voice' | 'video' } | null>(null)
  const { user: currentUser } = useDashboard()

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
  // Filter out self from coworkers so you can't call yourself
  const coworkers = (coworkerData || []).filter((w: any) => {
    const wId = w._id || w.id
    const myId = currentUser?._id || currentUser?.id
    return wId !== myId
  })

  return (
    <div className="flex h-full w-full overflow-hidden bg-white rounded-[26px]">
      <div className="flex flex-1 flex-col overflow-hidden border-r border-black/5 bg-white">
        <ViewHeader
          title="Calls & Meet"
          subtitle="Experience seamless communication"
          action={
            <button
              onClick={() => setSelectionStep('source')}
              className="rounded-xl bg-purple px-5 py-2 text-sm font-bold text-white shadow-lg shadow-purple/20 transition-all hover:opacity-90 active:scale-95"
            >
              Start New Meeting
            </button>
          }
        />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
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
  } = useDashboard()
  const { updateChatInList } = useChats()
  const myId = user?._id || user?.id
  const [chatLoading, setChatLoading] = useState(false)

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
    <div className="flex h-full w-full overflow-hidden bg-white rounded-[26px]">
      {/* Left panel — archived chat list */}
      <div className={cn(
        "flex flex-col border-r border-black/5 transition-all duration-500 ease-in-out",
        activeChat ? "w-[320px] shrink-0" : "w-full",
        activeChat ? "" : "flex"
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
                    <ChatAvatar src={avatar} name={name} className="size-12 rounded-xl shadow-sm" />
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
        <div className={cn("flex-1 items-center justify-center hidden md:flex")}>
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

export function ProfileView({ user, onEdit }: { user: any, onEdit: () => void }) {
  const isMobile = useIsMobile()
  const stats = [
    { label: 'Chats', value: user?.postsCount || 0 },
    { label: 'Following', value: user?.followingCount || 0 },
    { label: 'Files', value: user?.sharedResources?.length || 0 },
  ]

  return (
    <div className="flex h-full flex-col">
      <ViewHeader title="Profile" subtitle="Manage your account" />
      <div className={cn("flex-1 overflow-y-auto", isMobile ? "p-4" : "p-6 sm:p-10")}>
        <div className={cn("mx-auto", isMobile ? "max-w-md" : "max-w-4xl")}>
          <div className={cn("flex flex-col items-center rounded-3xl bg-purple-soft/50 text-center shadow-sm", isMobile ? "p-5" : "p-8 sm:p-10")}>
            <Image
              src={user?.avatar || '/placeholder.svg'}
              alt={user?.full_name || 'User'}
              width={isMobile ? 80 : 128}
              height={isMobile ? 80 : 128}
              className={cn("rounded-3xl object-cover shadow-md", isMobile ? "size-20" : "size-32")}
            />
            <h2 className={cn("font-bold text-ink", isMobile ? "mt-5 text-[20px] leading-tight" : "mt-5 text-[26px]")}>
              {user?.full_name}
            </h2>
            <p className={cn("text-purple font-semibold", isMobile ? "text-[13px] mt-1" : "text-[15px] mt-1")}>@{user?.username}</p>
            <p className={cn("text-ink-soft", isMobile ? "mt-1.5 text-[13px]" : "mt-1 text-[15px]")}>{user?.org_role || user?.role}</p>
            <p className={cn("leading-relaxed text-ink-soft", isMobile ? "mt-4 max-w-lg text-[13px]" : "mt-4 max-w-lg text-[15px]")}>
              {user?.bio || 'No bio yet.'}
            </p>

            <div className={cn("flex w-full items-center justify-around rounded-2xl bg-white", isMobile ? "mt-6 max-w-sm py-4 shadow-xs" : "mt-6 max-w-md py-5")}>
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className={cn("font-bold text-ink", isMobile ? "text-[18px]" : "text-[22px]")}>{s.value}</p>
                  <p className={cn("text-ink-soft", isMobile ? "text-[11px] font-medium mt-0.5" : "text-[13px] font-medium mt-1")}>{s.label}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onEdit}
              className={cn("flex items-center gap-2 rounded-xl bg-purple text-white transition-opacity hover:opacity-90", isMobile ? "mt-6 px-6 py-3 text-[13px] font-bold shadow-md shadow-purple/20" : "mt-6 px-6 py-3 text-[15px] font-semibold")}
            >
              <Pencil className="size-4" />
              Edit profile
            </button>
          </div>

          <div className={cn("rounded-3xl bg-purple-soft/50", isMobile ? "mt-6 space-y-4 p-5 shadow-sm" : "mt-6 space-y-4 p-8")}>
            <p className={cn("text-ink font-semibold border-b border-black/5 pb-3", isMobile ? "text-[14px]" : "text-[16px]")}>
              Contact details
            </p>
            <div className="flex items-center gap-3">
              <Mail className={cn("text-purple shrink-0", isMobile ? "size-[18px]" : "size-[22px]")} />
              <span className={cn("text-ink", isMobile ? "text-[13px] truncate" : "text-[15px]")}>{user?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className={cn("text-purple shrink-0", isMobile ? "size-[18px]" : "size-[22px]")} />
              <span className={cn("text-ink", isMobile ? "text-[13px] truncate" : "text-[15px]")}>{user?.phone_number || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className={cn("text-purple shrink-0", isMobile ? "size-[18px]" : "size-[22px]")} />
              <span className={cn("text-ink", isMobile ? "text-[13px] truncate" : "text-[15px]")}>{user?.location?.city ? `${user.location.city}, ${user.location.country}` : 'N/A'}</span>
            </div>
            {user?.organization && (
              <div className="flex items-center gap-3">
                <Briefcase className={cn("text-purple shrink-0", isMobile ? "size-[18px]" : "size-[22px]")} />
                <span className={cn("text-ink", isMobile ? "text-[13px] truncate" : "text-[15px]")}>{user.organization} ({user.org_role})</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Edit ---------------- */

function Field({
  label,
  defaultValue,
  textarea,
}: {
  label: string
  defaultValue: string
  textarea?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">
        {label}
      </span>
      {textarea ? (
        <textarea
          defaultValue={defaultValue}
          rows={3}
          className="w-full resize-none rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
        />
      ) : (
        <input
          type="text"
          defaultValue={defaultValue}
          className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
        />
      )}
    </label>
  )
}

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
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    org_role: user?.org_role || '',
    org_industry: user?.org_industry || '',
    org_size: user?.org_size || '',
    bio: user?.bio || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    organization: user?.organization || '',
    blog: user?.blog || '',
    status_message: user?.status_message || '',
    city: user?.location?.city || '',
    country: user?.location?.country || '',
    inviteCode: '',
  })

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...formData,
        location: {
          city: formData.city,
          country: formData.country
        }
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
      setUser(res.data.user)
      setBgType('custom')
      toast.success('Custom background set!')
    } catch (err: any) {
      toast.error('Background upload failed')
    }
  }

  const handleBgSelect = async (type: string) => {
    setBgType(type)
    try {
      const res = await updateProfile({ app_background: type })
      setUser(res.data)
    } catch (err) {
      toast.error('Failed to update background preference')
    }
  }

  return (
    <div className="flex h-full flex-col">
      <ViewHeader title="Edit profile" subtitle="Update your information" />
      <div className={cn("flex-1 overflow-y-auto", isMobile ? "p-4" : "p-6 sm:p-10")}>
        <form
          onSubmit={handleUpdate}
          className={cn(
            "mx-auto",
            isMobile
              ? "max-w-md space-y-6 bg-purple-soft/30 p-5 rounded-3xl border border-black/5 shadow-sm"
              : "max-w-3xl space-y-6"
          )}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <Image
                src={user?.avatar || '/placeholder.svg'}
                alt={user?.full_name || 'User'}
                width={80}
                height={80}
                className="size-20 rounded-3xl object-cover"
              />
              <label className="absolute -bottom-1 -right-1 flex size-8 cursor-pointer items-center justify-center rounded-full bg-purple text-white">
                <Camera className="size-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-ink">
                Profile photo
              </p>
              <p className="text-[13px] text-ink-soft">
                PNG or JPG, up to 5MB
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Full name</span>
              <input
                type="text"
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Username</span>
              <input
                type="text"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Organization</span>
              <input
                type="text"
                value={formData.organization}
                onChange={e => setFormData({ ...formData, organization: e.target.value })}
                className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Role</span>
              <input
                type="text"
                value={formData.org_role}
                onChange={e => setFormData({ ...formData, org_role: e.target.value })}
                className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Email</span>
              <input
                disabled
                type="email"
                value={formData.email}
                className="w-full rounded-2xl bg-purple-soft/50 px-4 py-3 text-[14px] text-ink-soft cursor-not-allowed outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Phone</span>
              <input
                type="text"
                value={formData.phone_number}
                onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Bio</span>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              className="w-full resize-none rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
              placeholder="Tell us about yourself..."
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Industry</span>
              <input
                type="text"
                value={formData.org_industry}
                onChange={e => setFormData({ ...formData, org_industry: e.target.value })}
                className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
                placeholder="e.g. Technology"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Company Size</span>
              <select
                value={formData.org_size}
                onChange={e => setFormData({ ...formData, org_size: e.target.value })}
                className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40 appearance-none"
              >
                <option value="">Select size</option>
                {['solo', '2-10', '11-50', '51-200', '201-500', '500+'].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Organization Invite Code</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.inviteCode || ''}
                onChange={e => setFormData({ ...formData, inviteCode: e.target.value })}
                className="flex-1 rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
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
                className="px-6 rounded-2xl bg-purple text-white text-sm font-bold shadow-lg shadow-purple/10 hover:opacity-90 active:scale-95 transition-all"
              >
                Join
              </button>
            </div>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">City</span>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Country</span>
              <input
                type="text"
                value={formData.country}
                onChange={e => setFormData({ ...formData, country: e.target.value })}
                className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Website/Blog</span>
              <input
                type="url"
                value={formData.blog}
                onChange={e => setFormData({ ...formData, blog: e.target.value })}
                className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
                placeholder="https://..."
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Status Message</span>
              <input
                type="text"
                value={formData.status_message}
                onChange={e => setFormData({ ...formData, status_message: e.target.value })}
                className="w-full rounded-2xl bg-purple-soft px-4 py-3 text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-purple/40"
                placeholder="What's on your mind?"
              />
            </label>
          </div>

          <div className="pt-2">
            <span className="mb-3 block text-[13px] font-medium text-ink-soft">
              App Background
            </span>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => handleBgSelect('bubbles')}
                className={cn(
                  'flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all',
                  bgType === 'bubbles'
                    ? 'border-purple bg-purple-soft/50 ring-4 ring-purple/10'
                    : 'border-transparent bg-purple-soft/30 hover:bg-purple-soft/50',
                )}
              >
                <div className="size-10 rounded-full bg-purple/10 flex items-center justify-center">
                  <Sparkles className="size-5 text-purple" />
                </div>
                <span className="text-[12px] font-bold text-ink">Bubbles</span>
              </button>

              <button
                type="button"
                onClick={() => handleBgSelect('light')}
                className={cn(
                  'flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all',
                  bgType === 'light'
                    ? 'border-purple bg-purple-soft/50 ring-4 ring-purple/10'
                    : 'border-transparent bg-purple-soft/30 hover:bg-purple-soft/50',
                )}
              >
                <div className="size-12 overflow-hidden rounded-lg shadow-sm border border-black/5">
                  <Image src="/themes/light.png" alt="Light" className="w-full h-full object-cover" />
                </div>
                <span className="text-[12px] font-bold text-ink">Light</span>
              </button>

              <button
                type="button"
                onClick={() => handleBgSelect('dark')}
                className={cn(
                  'flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all',
                  bgType === 'dark'
                    ? 'border-purple bg-purple-soft/50 ring-4 ring-purple/10'
                    : 'border-transparent bg-purple-soft/30 hover:bg-purple-soft/50',
                )}
              >
                <div className="size-12 overflow-hidden rounded-lg shadow-sm border border-black/5">
                  <Image src="/themes/dark.png" alt="Dark" className="w-full h-full object-cover" />
                </div>
                <span className="text-[12px] font-bold text-ink">Dark</span>
              </button>

              <div className="relative group/custom">
                <button
                  type="button"
                  className={cn(
                    'w-full flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all',
                    bgType === 'custom'
                      ? 'border-purple bg-purple-soft/50 ring-4 ring-purple/10'
                      : 'border-transparent bg-purple-soft/30 hover:bg-purple-soft/50',
                  )}
                >
                  <label className="cursor-pointer flex flex-col items-center gap-3 w-full">
                    <div className="size-10 rounded-full bg-purple flex items-center justify-center text-white">
                      <Camera className="size-5" />
                    </div>
                    <span className="text-[12px] font-bold text-ink">Custom</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleBackgroundUpload} />
                  </label>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-purple text-white font-bold rounded-2xl shadow-lg shadow-purple/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

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
  } = useDashboard()
  const isNarrow = narrowProp ?? contextNarrow
  const [coworkers, setCoworkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [collapsingFor, setCollapsingFor] = useState<string | null>(null)
  const isMobile = useIsMobile()
  const [searchActive, setSearchActive] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCoworkers = async () => {
      try {
        setLoading(true)
        const res = await searchUsers(search)
        // Filter out self so you can't message yourself
        const myId = currentUser?._id || currentUser?.id
        setCoworkers((res.users || []).filter((w: any) => (w._id || w.id) !== myId))
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
    <div className="flex h-full w-full overflow-hidden bg-white rounded-[26px]">
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
                onClick={() => navigate({ to: '/dashboard/archive' })}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-black/5 bg-white px-3 text-xs font-semibold text-black/50 hover:bg-black/5 hover:text-black/70 transition-all shrink-0"
                title="Archive Charts"
              >
                <Archive className="size-3.5" />
                {!activeChat && <span>Archive Charts</span>}
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
                  onClick={() => navigate({ to: '/dashboard/archive' })}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-black/5 bg-white px-3 text-xs font-semibold text-black/50 hover:bg-black/5 hover:text-black/70 transition-all shrink-0"
                  title="Archive Charts"
                >
                  <Archive className="size-3.5" />
                  {!activeChat && <span>Archive Charts</span>}
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
                      @{worker.username}{worker.status_message ? ` · "${worker.status_message}"` : ''}
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
    </div>
  )
}
