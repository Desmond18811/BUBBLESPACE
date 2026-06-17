import {
  MessageSquare,
  FolderClosed,
  Users,
  Archive,
  User,
  LogOut,
  Phone,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatAvatar } from '@/components/chat/chat-avatar'
import { useQuery } from '@tanstack/react-query'
import { getUnreadChatCount, fetchMeetings } from '@/lib/api'

type NavItem = {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  active?: boolean
}

export const navItems: NavItem[] = [
  { id: 'all', label: 'All chats', icon: MessageSquare },
  { id: 'work', label: 'Work', icon: FolderClosed },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'calls', label: 'Events & Meets', icon: Phone },
  { id: 'archive', label: 'Archived', icon: Archive },
]

export const bottomItems: NavItem[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'edit', label: 'Edit settings', icon: SlidersHorizontal },
]

function NavButton({
  item,
  onClick,
}: {
  item: NavItem
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex w-full flex-col items-center gap-1.5 rounded-2xl px-2 py-3 transition-all duration-300',
        item.active ? 'bg-white/10' : 'hover:bg-white/5',
      )}
    >
      {/* Side indicator animation */}
      <span
        className={cn(
          'absolute left-0 top-1/4 h-1/2 w-1 rounded-r-full bg-white transition-all duration-300',
          item.active ? 'opacity-100' : 'scale-y-0 opacity-0 group-hover:scale-y-100 group-hover:opacity-50',
        )}
      />
      <span className="relative">
        <Icon
          className={cn(
            'size-6',
            item.active ? 'text-white' : 'text-white/70',
          )}
        />
        {item.badge ? (
          <span className="absolute -right-2.5 -top-2 flex min-w-[18px] items-center justify-center rounded-full bg-accent-orange px-1 text-[10px] font-semibold leading-[18px] text-white">
            {item.badge}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          'text-[11px] font-medium',
          item.active ? 'text-white' : 'text-white/60',
        )}
      >
        {item.label}
      </span>
    </button>
  )
}

import { Link } from '@tanstack/react-router'
import { BubblespaceLogo } from '@/components/logo'

export function NavSidebar({
  activeTab,
  onLogout,
  user,
}: {
  activeTab: string
  onLogout: () => void
  user: any
}) {
  const { data: unreadData } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: getUnreadChatCount,
    refetchInterval: 10000, // Refresh every 10s
  })

  const { data: meetingsData } = useQuery({
    queryKey: ['activeMeetings'],
    queryFn: () => fetchMeetings(1, 5),
    refetchInterval: 10000, // Refresh every 10s
  })

  const totalUnread = unreadData?.count || 0
  const hasActiveCall = meetingsData?.meetings?.some((m: any) => m.status === 'live') || false

  return (
    <nav className="hidden md:flex w-[88px] shrink-0 flex-col items-center py-6 bg-app-dark rounded-[26px] overflow-y-auto scrollbar-hide max-h-full">
      {/* Logo */}
      <div className="mb-8 flex size-10 items-center justify-center">
        <BubblespaceLogo className="size-9 text-white" />
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.id === activeTab
          // For now, show total unread on 'all' or 'work' if we don't have per-category data
          const badge = (item.id === 'all' || item.id === 'work') ? totalUnread : 0

          return (
            <Link
              key={item.id}
              to={`/dashboard/${item.id === 'all' ? 'all' : item.id}`}
              className={cn(
                'group relative flex w-full flex-col items-center gap-1.5 rounded-2xl px-2 py-3 transition-all duration-300',
                isActive ? 'bg-white/15 backdrop-blur-md shadow-lg shadow-black/10 border border-white/10' : 'hover:bg-white/5',
              )}
            >
              {/* Side indicator animation */}
              <span
                className={cn(
                  'absolute left-0 top-1/4 h-1/2 w-1 rounded-r-full bg-white transition-all duration-300',
                  isActive ? 'opacity-100' : 'scale-y-0 opacity-0 group-hover:scale-y-100 group-hover:opacity-50',
                )}
              />
              <span className="relative">
                <Icon
                  className={cn(
                    'size-6 transition-all duration-300',
                    item.id === 'calls' && hasActiveCall
                      ? 'text-emerald-400 animate-pulse drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] font-bold'
                      : isActive ? 'text-white' : 'text-white/70',
                  )}
                />
                {badge > 0 ? (
                  <span className="absolute -right-2.5 -top-2 flex min-w-[18px] items-center justify-center rounded-full bg-accent-orange px-1 text-[10px] font-semibold leading-[18px] text-white animate-in zoom-in duration-300 shadow-sm">
                    {badge}
                  </span>
                ) : null}
                {item.id === 'calls' && hasActiveCall && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm animate-in zoom-in duration-200"></span>
                  </span>
                )}
              </span>
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors text-center leading-tight max-w-[76px]',
                  item.id === 'calls' && hasActiveCall
                    ? 'text-emerald-400 font-extrabold animate-pulse drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                    : isActive ? 'text-white' : 'text-white/60 group-hover:text-white/80',
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}

        <div className="mx-auto my-2 h-px w-8 bg-white/10" />

        {bottomItems.map((item) => {
          const Icon = item.icon
          const isActive = item.id === activeTab
          return (
            <Link
              key={item.id}
              to={`/dashboard/${item.id === 'edit' ? 'edit-profile' : item.id}`}
              className={cn(
                'group relative flex w-full flex-col items-center gap-1.5 rounded-2xl px-2 py-3 transition-all duration-300',
                isActive ? 'bg-white/15 backdrop-blur-md shadow-lg shadow-black/10 border border-white/10' : 'hover:bg-white/5',
              )}
            >
              {item.id === 'profile' ? (
                <ChatAvatar
                  src={user?.avatar}
                  name={user?.full_name || 'User'}
                  className="size-6 rounded-lg ring-2 ring-white/10 group-hover:ring-white/30"
                />
              ) : (
                <Icon
                  className={cn(
                    'size-6',
                    isActive ? 'text-white' : 'text-white/70',
                  )}
                />
              )}
              <span className={cn('text-[10px] font-medium text-center leading-tight max-w-[76px]', isActive ? 'text-white' : 'text-white/60')}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="mt-4 flex w-full flex-col items-center gap-1.5 rounded-2xl px-2 py-3 hover:bg-white/5 group"
      >
        <LogOut className="size-6 text-white/70 group-hover:text-white transition-colors" />
        <span className="text-[11px] font-medium text-white/60 group-hover:text-white transition-colors">Log out</span>
      </button>
    </nav>
  )
}
