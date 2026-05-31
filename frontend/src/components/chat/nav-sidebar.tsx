'use client'

import {
  MessageSquare,
  FolderClosed,
  Users,
  Archive,
  User,
  LogOut,
  Phone,
  Video,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  active?: boolean
}

const items: NavItem[] = [
  { id: 'all', label: 'All chats', icon: MessageSquare, badge: 43 },
  { id: 'work', label: 'Work', icon: FolderClosed, badge: 4, active: true },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'calls', label: 'Calls', icon: Phone },
  { id: 'archive', label: 'Archive chats', icon: Archive },
]

const bottomItems: NavItem[] = [
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

import { BubblespaceLogo } from '@/components/logo'

export function NavSidebar({
  activeTab,
  onSelect,
  onLogout,
}: {
  activeTab: string
  onSelect: (id: string) => void
  onLogout: () => void
}) {
  return (
    <nav className="flex w-[88px] shrink-0 flex-col items-center py-6">
      {/* Logo */}
      <div className="mb-8 flex size-10 items-center justify-center">
        <BubblespaceLogo className="size-9 text-white" />
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {items.map((item) => (
          <NavButton
            key={item.id}
            item={{ ...item, active: item.id === activeTab }}
            onClick={() => onSelect(item.id)}
          />
        ))}

        <div className="mx-auto my-2 h-px w-8 bg-white/10" />

        {bottomItems.map((item) => (
          <NavButton
            key={item.id}
            item={{ ...item, active: item.id === activeTab }}
            onClick={() => onSelect(item.id)}
          />
        ))}
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
