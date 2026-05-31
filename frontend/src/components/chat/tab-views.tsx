// removed 'use client' for Vite

const Image = (props: any) => <img {...props} />
import {
  MessageSquare,
  Phone,
  MoreVertical,
  UserPlus,
  Heart,
  MessageCircle,
  Video,
  Monitor,
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
  Calendar,
  History,
  Play,
  Maximize2,
  ScreenShare,
  Smile,
  Volume2,
  ChevronLeft,
  ArrowLeft,
  Paperclip,
  Send,
  Users,
  User,
  Info,
  MicOff,
  MonitorUp,
  ChevronRight,
  Settings,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  friends,
  archivedChats,
  profile,
  type Friend,
} from '@/lib/chat-data'

function ViewHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle: string
  action?: React.ReactNode
}) {
  return (
    <header className="flex items-center justify-between border-b border-black/5 px-4 py-4 sm:px-6">
      <div>
        <h1 className="text-[20px] font-bold leading-tight text-ink sm:text-[22px]">
          {title}
        </h1>
        <p className="mt-0.5 text-[12px] text-ink-soft">{subtitle}</p>
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

export function FriendsView() {
  const [activeCall, setActiveCall] = useState<{
    friend: Friend
    type: 'voice' | 'video'
  } | null>(null)

  return (
    <div className="flex h-full flex-col bg-white">
      <ViewHeader
        title="Friends"
        subtitle={`${friends.length} active connections`}
        action={
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-purple px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
          >
            <UserPlus className="size-4" />
            <span className="hidden sm:inline">Add Friend</span>
          </button>
        }
      />
      <div className="grid auto-rows-min grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
        {friends.map((f) => (
          <FriendCard
            key={f.name}
            friend={f}
            onCall={(type) => setActiveCall({ friend: f, type })}
          />
        ))}
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
  const [selectionStep, setSelectionStep] = useState<'none' | 'source' | 'type'>('none')
  const [meetingConfig, setMeetingConfig] = useState<{ source: 'group' | 'contacts', type: 'voice' | 'video' | null }>({
    source: 'contacts',
    type: null
  })

  const activeRooms = [
    { id: 1, title: 'Product Designers', members: 12, callers: ['A', 'B', 'C'], active: true },
    { id: 2, title: 'Engineering Sync', members: 8, callers: ['X', 'Y'], active: true },
    { id: 3, title: 'Marketing Weekly', members: 15, callers: ['M', 'N', 'O'], active: false },
    { id: 4, title: 'General Hangout', members: 32, callers: ['P', 'Q'], active: false },
  ]

  const handleSourceSelect = (src: 'group' | 'contacts') => {
    setMeetingConfig({ source: src, type: null })
    setSelectionStep('type')
  }

  const handleTypeSelect = (type: 'voice' | 'video') => {
    setSelectionStep('none')
    onStartMeeting()
  }

  return (
    <div className="flex h-full flex-col bg-white">
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

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 sm:grid-cols-2 lg:grid-cols-3">
        {activeRooms.map(room => (
          <div key={room.id} className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] bg-purple-soft/40 p-5 transition-all hover:bg-purple-soft/70 hover:shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-ink">{room.title}</h3>
                <p className="text-[11px] text-ink-soft">{room.members} members</p>
              </div>
              {room.active && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-600 ring-1 ring-emerald-500/20 animate-pulse">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  LIVE
                </span>
              )}
            </div>

            <div className="mt-6 flex items-end justify-between">
              <div className="flex -space-x-3">
                {room.callers.map((c, i) => (
                  <div key={i} className="flex size-9 items-center justify-center rounded-full border-2 border-white bg-purple text-[11px] font-bold text-white shadow-sm">
                    {c}
                  </div>
                ))}
                {room.members > room.callers.length && (
                  <div className="flex size-9 items-center justify-center rounded-full border-2 border-white bg-white text-[11px] font-bold text-purple shadow-sm">
                    +{room.members - room.callers.length}
                  </div>
                )}
              </div>
              <button
                onClick={() => room.active ? onStartMeeting() : alert('Room is currently inactive')}
                className="flex size-11 items-center justify-center rounded-2xl bg-purple text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
              >
                {room.active ? <Video className="size-4" /> : <Phone className="size-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Meeting Selection Dialog */}
      {selectionStep !== 'none' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
  )
}

/* ---------------- Archive ---------------- */

export function ArchiveView() {
  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title="Archive"
        subtitle={`${archivedChats.length} saved chats`}
      />
      <div className="grid auto-rows-min grid-cols-3 gap-2 overflow-y-auto p-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
        {archivedChats.map((chat) => (
          <div
            key={chat.id}
            className="group flex flex-col items-center gap-1 rounded-[16px] bg-purple-soft/40 p-2.5 text-center transition-all hover:bg-purple-soft/70 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="relative">
              <Image
                src={chat.avatar || '/placeholder.svg'}
                alt={chat.name}
                width={44}
                height={44}
                className="size-11 rounded-[13px] object-cover shadow-sm"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11.5px] font-bold text-ink leading-tight">
                {chat.name}
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 transition-all duration-300 group-hover:opacity-100">
              <button
                type="button"
                aria-label="Restore chat"
                className="flex size-5 shrink-0 items-center justify-center rounded-md bg-white text-purple shadow-sm hover:scale-110 active:scale-95"
              >
                <ArchiveRestore className="size-2.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------- Profile ---------------- */

export function ProfileView({ onEdit }: { onEdit: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <ViewHeader title="Profile" subtitle="Manage your account" />
      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col items-center rounded-3xl bg-purple-soft/50 p-6 text-center sm:p-8">
            <Image
              src={profile.avatar || '/placeholder.svg'}
              alt={profile.name}
              width={112}
              height={112}
              className="size-28 rounded-3xl object-cover"
            />
            <h2 className="mt-4 text-[22px] font-bold text-ink">
              {profile.name}
            </h2>
            <p className="text-[14px] text-purple">{profile.handle}</p>
            <p className="mt-1 text-[14px] text-ink-soft">{profile.role}</p>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed text-ink-soft">
              {profile.bio}
            </p>

            <div className="mt-5 flex w-full max-w-sm items-center justify-around rounded-2xl bg-white py-4">
              {profile.stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-[20px] font-bold text-ink">{s.value}</p>
                  <p className="text-[12px] text-ink-soft">{s.label}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onEdit}
              className="mt-5 flex items-center gap-2 rounded-xl bg-purple px-5 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
            >
              <Pencil className="size-4" />
              Edit profile
            </button>
          </div>

          <div className="mt-5 space-y-3 rounded-3xl bg-purple-soft/50 p-6">
            <p className="text-[15px] font-semibold text-ink">
              Contact details
            </p>
            <div className="flex items-center gap-3">
              <Mail className="size-[20px] text-purple" />
              <span className="text-[14px] text-ink">{profile.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="size-[20px] text-purple" />
              <span className="text-[14px] text-ink">{profile.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="size-[20px] text-purple" />
              <span className="text-[14px] text-ink">{profile.location}</span>
            </div>
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
  bgType,
  setBgType,
}: {
  bgType: string
  setBgType: (t: string) => void
}) {
  return (
    <div className="flex h-full flex-col">
      <ViewHeader title="Edit profile" subtitle="Update your information" />
      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <form className="mx-auto max-w-xl space-y-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Image
                src={profile.avatar || '/placeholder.svg'}
                alt={profile.name}
                width={80}
                height={80}
                className="size-20 rounded-3xl object-cover"
              />
              <button
                type="button"
                aria-label="Change photo"
                className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-purple text-white"
              >
                <Camera className="size-4" />
              </button>
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

          <Field label="Full name" defaultValue={profile.name} />
          <Field label="Username" defaultValue={profile.handle} />
          <Field label="Role" defaultValue={profile.role} />
          <Field label="Bio" defaultValue={profile.bio} textarea />
          <Field label="Email" defaultValue={profile.email} />
          <Field label="Phone" defaultValue={profile.phone} />

          <div className="pt-2">
            <span className="mb-3 block text-[13px] font-medium text-ink-soft">
              App Background
            </span>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setBgType('bubbles')}
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
                <div className="text-center">
                  <p className="text-[14px] font-bold text-ink">Modern</p>
                  <p className="text-[11px] text-ink-soft italic">Liquid Bubbles</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBgType('light')}
                className={cn(
                  'flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all',
                  bgType === 'light'
                    ? 'border-purple bg-purple-soft/50 ring-4 ring-purple/10'
                    : 'border-transparent bg-purple-soft/30 hover:bg-purple-soft/50',
                )}
              >
                <div className="relative size-12 overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
                  <img src="/themes/light.png" alt="Light" className="size-full object-cover" />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-bold text-ink">Light</p>
                  <p className="text-[11px] text-ink-soft">Day Mode</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBgType('dark')}
                className={cn(
                  'flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all',
                  bgType === 'dark'
                    ? 'border-purple bg-purple-soft/50 ring-4 ring-purple/10'
                    : 'border-transparent bg-purple-soft/30 hover:bg-purple-soft/50',
                )}
              >
                <div className="relative size-12 overflow-hidden rounded-xl bg-app-dark ring-1 ring-white/10">
                  <img src="/themes/dark.png" alt="Dark" className="size-full object-cover" />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-bold text-ink">Dark</p>
                  <p className="text-[11px] text-ink-soft text-purple-light">Night Mode</p>
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-5">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-purple px-5 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
            >
              <Check className="size-4" />
              Save changes
            </button>
            <button
              type="button"
              className="rounded-xl bg-purple-soft px-5 py-2.5 text-[14px] font-medium text-ink transition-colors hover:bg-purple-light"
            >
              Cancel
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
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className={cn(
      "relative flex flex-col bg-white text-ink transition-all duration-500",
      isFullscreen ? "fixed inset-0 z-[100] h-screen w-screen" : "h-full w-full"
    )}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-black/5 relative z-20 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-black/5 rounded-xl transition-colors"
          >
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
            <div className="size-8 rounded-full border-2 border-white bg-purple-soft flex items-center justify-center text-[10px] font-bold text-ink shadow-sm">
              +9
            </div>
          </div>
          <button className="flex items-center gap-2 bg-purple/10 hover:bg-purple/20 px-4 py-2 rounded-xl text-xs font-bold text-purple transition-all">
            <Info className="size-4" />
            Meeting details
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex flex-1 flex-col p-6 min-w-0 bg-slate-50/30">
          {/* Main Participant Grid */}
          <div className="flex-1 relative rounded-[32px] overflow-hidden bg-purple-soft/50 border-4 border-purple shadow-xl shadow-purple/10">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200"
              className="w-full h-full object-cover"
              alt="Main Speaker"
            />
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
          </div>

          {/* Bottom Strip */}
          <div className="h-32 mt-6 flex gap-4 overflow-x-auto scrollbar-hide py-1">
            {[
              { name: 'Samila Moon', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300' },
              { name: 'Jane Collins', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300' },
              { name: 'Me', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300' },
              { name: '13 other members', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300' }
            ].map((p, i) => (
              <div key={i} className="flex-none w-48 rounded-[24px] overflow-hidden bg-white border border-black/5 relative group shadow-sm transition-all hover:shadow-md hover:scale-[1.02]">
                <img
                  src={p.img}
                  className="w-full h-full object-cover"
                  alt={p.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white shadow-sm">{p.name}</span>
                  <MicOff className="size-3 text-white/70" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar - Chat */}
        {isChatOpen && (
          <div className="w-80 border-l border-black/5 flex flex-col bg-white animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-purple/20 flex items-center justify-between">
              <h3 className="font-bold text-sm text-ink">Chat</h3>
              <button onClick={() => setIsChatOpen(false)} className="p-1.5 hover:bg-black/5 rounded-lg text-ink-soft">
                <X className="size-4" />
              </button>
            </div>

            <div className="p-4 border-b border-purple/20">
              <div className="flex bg-purple-soft/50 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                    activeTab === 'chat' ? "bg-white text-purple shadow-sm" : "text-ink-soft hover:text-ink"
                  )}
                >
                  Messages
                </button>
                <button
                  onClick={() => setActiveTab('participants')}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                    activeTab === 'participants' ? "bg-white text-purple shadow-sm" : "text-ink-soft hover:text-ink"
                  )}
                >
                  People
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === 'chat' ? (
                <div className="space-y-6">
                  {/* Image message */}
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

                  {/* Bubble message */}
                  <div className="flex gap-3 flex-row-reverse">
                    <img src={profile.avatar} className="size-8 rounded-full object-cover" alt="Me" />
                    <div className="flex flex-col items-end max-w-[80%]">
                      <div className="bg-purple text-white p-3 rounded-2xl rounded-tr-none shadow-sm shadow-purple/20">
                        <p className="text-xs">Jessica did a great job this month 💜 The project was difficult</p>
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
              ) : (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-purple-soft/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <img src={`https://i.pravatar.cc/150?u=${i + 10}`} className="size-8 rounded-full object-cover" alt="Avatar" />
                        <span className="text-xs font-bold text-ink">Participant {i}</span>
                      </div>
                      <Mic className="size-3 text-ink-soft" />
                    </div>
                  ))}
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
