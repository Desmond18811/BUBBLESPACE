import React, { useState } from 'react'
import { useNavigate, Outlet, Link, useLocation } from '@tanstack/react-router'
import { DashboardProvider } from '@/contexts/DashboardContext'
import { NavSidebar, navItems, bottomItems } from '@/components/chat/nav-sidebar'
import { ChatList } from '@/components/chat/chat-list'
import { ChatWindow } from '@/components/chat/chat-window'
import { GroupInfo } from '@/components/chat/group-info'
import { cn } from '@/lib/utils'
import { Loader2, X, LogOut } from 'lucide-react'
import {
  FriendsView,
  ArchiveView,
  ProfileView,
  EditView,
  CallsView,
  MeetingView,
  WorkView,
} from '@/components/chat/tab-views'
import { SetupProfileView } from '@/components/chat/setup-profile-view'
import { getMyProfile, accessOrCreateChat, getUnreadChatCount } from '@/lib/api'
import { AppProvider } from '@/contexts/AppContext'
import { MessageOverlay } from '@/components/chat/message-overlay'
import { MeetingStatsModal } from '@/components/chat/MeetingStatsModal'
import { toast } from 'sonner'
import { BubblespaceLogo } from '@/components/logo'
import { ChatAvatar } from '@/components/chat/chat-avatar'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'next-themes'

export function Dashboard({
  bgType,
  setBgType,
  activeTab = 'all',
}: {
  bgType: string
  setBgType: (t: string) => void
  activeTab?: string
}) {
  // ─── ALL HOOKS MUST BE DECLARED HERE, BEFORE ANY EARLY RETURNS ───────────
  // This is required to avoid React Error #310 ("Rendered more hooks than during
  // the previous render") which crashes the page on reload.

  const [isInMeeting, setIsInMeeting] = useState(false)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [activeChat, setActiveChat] = useState<any>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const isChatRoute = location.pathname.includes('/dashboard/chat/')
  const routeChatId = isChatRoute ? location.pathname.split('/').pop() : null
  const [showInfo, setShowInfo] = useState(true)
  const [overlayUser, setOverlayUser] = useState<any>(null)
  const [overlayWorkCard, setOverlayWorkCard] = useState(false)
  const [messages, setMessages] = useState<any[]>([])

  // Moved above early returns to satisfy Rules of Hooks
  const [viewStatsUser, setViewStatsUser] = useState<any | null>(null)
  const queryClient = useQueryClient()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const { data: unreadData } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: getUnreadChatCount,
    refetchInterval: 10000,
  })
  const totalUnread = unreadData?.count || 0

  // Use React Query for profile fetching with caching
  const { data: userData, isLoading: loadingProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await getMyProfile()
      return res.data
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })

  const { setTheme } = useTheme()

  // ─── ALL EFFECTS MUST ALSO BE BEFORE EARLY RETURNS ───────────────────────

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('joinGroupCode');
    if (joinCode) {
      const handleJoin = async () => {
        try {
          const { joinGroupChat } = await import('@/lib/api');
          const res = await joinGroupChat(joinCode);
          toast.success('Successfully joined the group!');
          const chat = res?.conversation || res?.data?.conversation || res?.data || res;
          if (chat?.id) {
            navigate({ to: `/dashboard/chat/${chat.id}` });
          }
        } catch (err: any) {
          toast.error(err?.message || 'Could not join group. Invite link may be invalid.');
        } finally {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      };
      handleJoin();
    }
  }, [navigate]);

  React.useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    setIsMobile(media.matches)
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  React.useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [activeTab])

  const SIDE_PANEL_TABS = ['all']
  const showSidePanel = SIDE_PANEL_TABS.includes(activeTab) || isChatRoute

  React.useEffect(() => {
    if (routeChatId) {
      if (routeChatId !== activeChatId) {
        setActiveChatId(routeChatId)
      }
    } else if (activeTab === 'all' && activeChatId) {
      setActiveChatId(null)
      setActiveChat(null)
    }
  }, [routeChatId, activeTab])

  const user = userData

  React.useEffect(() => {
    if (user) {
      if (user.app_background) {
        if (user.app_background === 'custom' && user.custom_background) {
          setBgType(user.custom_background)
        } else {
          setBgType(user.app_background)
        }
        if (user.app_background === 'dark') {
          setTheme('dark')
        } else {
          setTheme('light')
        }
      }
    }
  }, [user, setBgType, setTheme])

  // Security: Prevent unauthorized chat access
  React.useEffect(() => {
    if (activeChatId && activeChat) {
      const isMember = activeChat.members?.some((m: any) =>
        (m._id || m.id || m) === user?._id || (m._id || m.id || m) === user?.id
      );

      if (activeChat.members && !isMember) {
        console.warn('Unauthorized chat access prevented:', activeChatId);
        setActiveChatId(null);
        setActiveChat(null);
        toast.error('You do not have access to this conversation');
      }
    }
  }, [activeChatId, activeChat, user]);

  // Handle tab switching: close info sidebar
  React.useEffect(() => {
    setShowInfo(false);
  }, [activeTab]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
        searchInput?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Redirect to setup-profile if onboarding is incomplete
  React.useEffect(() => {
    if (user) {
      if (!user.onboardingComplete && location.pathname !== '/setup-profile') {
        navigate({ to: '/setup-profile' })
      } else if (user.onboardingComplete && location.pathname === '/setup-profile') {
        navigate({ to: '/dashboard/all' })
      }
    }
  }, [user, location.pathname])

  // ─── END OF HOOKS ─────────────────────────────────────────────────────────

  const isInfoVisible = !!(showInfo && !isInMeeting && activeChat && (activeTab === 'all' || activeTab === 'friends' || activeTab === 'work' || activeTab === 'archive' || isChatRoute))

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("bubblespace_private_key");
    navigate({ to: "/login" });
  };

  const handleOpenMessage = (targetUser: any, showWorkCard = false) => {
    setOverlayUser(targetUser)
    setOverlayWorkCard(showWorkCard)
  }

  const handleOpenFullChat = async (targetUser: any) => {
    try {
      const res = await accessOrCreateChat(targetUser._id || targetUser.id)
      const chat = res?.conversation || res?.data?.conversation || res?.data || res
      const id = chat.id || chat._id
      setActiveChatId(id)
      setActiveChat(chat)
      navigate({ to: `/dashboard/chat/${id}` })
    } catch (err) {
      console.error('Failed to open chat:', err)
      toast.error('Failed to start conversation')
    }
  }

  // ─── Early returns AFTER all hooks ────────────────────────────────────────

  if (loadingProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-canvas">
        <Loader2 className="h-10 w-10 animate-spin text-purple" />
      </div>
    )
  }

  if (user && !user.onboardingComplete) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-canvas">
        <Loader2 className="h-10 w-10 animate-spin text-purple" />
      </div>
    )
  }

  const dashboardContextValue = {
    user,
    onMessage: handleOpenFullChat,
    onOpenProfile: handleOpenMessage,
    isNarrow: !!activeChatId,
    setUser: (updatedUser?: any) => {
      if (updatedUser) {
        queryClient.setQueryData(['profile'], updatedUser)
      } else {
        refetchProfile()
      }
    },
    bgType,
    setBgType,
    showInfo,
    setShowInfo,
    activeChatId,
    setActiveChatId,
    activeChat,
    setActiveChat,
    messages,
    setMessages,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    viewStatsUser,
    setViewStatsUser,
  }

  return (
    <AppProvider user={user}>
      <DashboardProvider value={dashboardContextValue}>
        <div className="relative z-10 flex h-screen md:h-[min(960px,92vh)] w-full max-w-[1760px] items-stretch gap-0 md:gap-5 2xl:h-[min(1080px,88vh)] font-poppins">
          {/* App container */}
          <div
            className={cn(
              "flex flex-1 gap-1 rounded-none md:rounded-[36px] p-0 md:p-3 shadow-none md:shadow-2xl transition-all duration-500 overflow-hidden",
              bgType === 'glass'
                ? "bg-transparent md:bg-black/10 md:backdrop-blur-md md:border md:border-white/10"
                : (bgType === 'custom' || bgType.startsWith('/') || bgType.startsWith('http') || bgType.startsWith('data:'))
                  ? "bg-transparent md:bg-black/20"
                  : "bg-transparent md:bg-app-dark"
            )}
            style={{
              backgroundImage: (!isMobile && (bgType === 'custom' || bgType.startsWith('/') || bgType.startsWith('http') || bgType.startsWith('data:')) && (user?.custom_background || bgType))
                ? `url(${user?.custom_background || bgType})`
                : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <NavSidebar activeTab={isChatRoute ? 'all' : activeTab} user={user} onLogout={handleLogout} />

            <div className={cn(
              "flex flex-1 overflow-hidden rounded-none md:rounded-[26px] relative transition-all duration-300",
              bgType === 'glass' ? "bg-white/40 backdrop-blur-xl border border-white/20 shadow-2xl" : "bg-white"
            )}>
              {/* Always mount the chat list + window but only show when on 'all' tab */}
              <div className={cn("flex flex-1 overflow-hidden", !showSidePanel && "hidden")}>
                <div className={cn("border-r border-black/5 shrink-0 transition-all duration-300", activeChatId ? "hidden md:block w-[360px]" : "w-full md:w-[360px]")}>
                  <ChatList
                    activeId={activeChatId}
                    onSelect={(id, chat) => {
                      setActiveChatId(id)
                      setActiveChat(chat)
                      navigate({ to: `/dashboard/chat/${id}` })
                    }}
                    currentUserId={user?._id || user?.id}
                  />
                </div>
                <div className={cn("overflow-hidden relative", activeChatId ? "flex flex-1 w-full" : "hidden md:block md:flex-1")}>
                  {activeChatId && activeChat ? (
                    <ChatWindow
                      chatId={activeChatId}
                      chat={activeChat}
                      currentUser={user}
                      messages={messages}
                      setMessages={setMessages}
                      isInfoOpen={showInfo}
                      onShowInfo={() => setShowInfo(!showInfo)}
                      onStartMeeting={() => setIsInMeeting(true)}
                      onClose={() => {
                        setActiveChatId(null)
                        setActiveChat(null)
                        navigate({ to: '/dashboard/all' })
                      }}
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center p-8">
                      <div className="size-20 rounded-3xl bg-purple/10 flex items-center justify-center mb-4">
                        <svg className="size-10 text-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold text-black mb-2">Select a conversation</h2>
                      <p className="text-sm text-black/40 max-w-xs">Choose a chat from the left panel or start a new one with a colleague</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Non-chat tab views — rendered via Outlet */}
              <div className={cn("flex flex-col flex-1 overflow-hidden", showSidePanel && "hidden")}>
                <Outlet />
              </div>
            </div>
          </div>

          {/* Right info panel */}
          {isInfoVisible && (
            <aside className="w-[360px] shrink-0 flex flex-col gap-4 overflow-y-auto max-h-full animate-in slide-in-from-right duration-300 custom-scrollbar pr-1">
              <GroupInfo
                key={activeChatId}
                conversation={activeChat}
                messages={messages}
                onClose={() => setShowInfo(false)}
              />
            </aside>
          )}

          {/* Message Overlay for Work/Friends messaging */}
          {overlayUser && (
            <MessageOverlay
              user={user}
              targetUser={overlayUser}
              workCardInfo={overlayWorkCard}
              onClose={() => setOverlayUser(null)}
            />
          )}

          {/* Meeting Stats Modal */}
          {viewStatsUser && (
            <MeetingStatsModal
              targetUser={viewStatsUser}
              onClose={() => setViewStatsUser(null)}
            />
          )}

          {/* Mobile Navigation Drawer */}
          {isMobile && isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              {/* Drawer Content */}
              <div
                className="relative flex w-72 max-w-xs flex-col bg-app-dark p-6 text-white shadow-2xl transition-transform duration-300 animate-in slide-in-from-left"
              >
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <BubblespaceLogo className="size-8 text-white" />
                    <span className="text-lg font-bold tracking-tight">Bubblespace</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-xl p-1.5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto py-6 space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = item.id === (isChatRoute ? 'all' : activeTab)
                    const badge = (item.id === 'all' || item.id === 'work') ? totalUnread : 0

                    return (
                      <Link
                        key={item.id}
                        to={`/dashboard/${item.id === 'all' ? 'all' : item.id}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200',
                          isActive
                            ? 'bg-white/15 border border-white/10 shadow-lg'
                            : 'hover:bg-white/5 text-white/70 hover:text-white'
                        )}
                      >
                        <Icon className="size-5" />
                        <span className="text-sm font-semibold flex-1">{item.label}</span>
                        {badge > 0 && (
                          <span className="flex min-w-[20px] h-5 items-center justify-center rounded-full bg-accent-orange px-1.5 text-[10px] font-bold text-white shadow-sm">
                            {badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}

                  <div className="my-4 h-px bg-white/10" />

                  {bottomItems.map((item) => {
                    const Icon = item.icon
                    const isActive = item.id === activeTab
                    return (
                      <Link
                        key={item.id}
                        to={`/dashboard/${item.id === 'edit' ? 'edit-profile' : item.id}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200',
                          isActive
                            ? 'bg-white/15 border border-white/10 shadow-lg'
                            : 'hover:bg-white/5 text-white/70 hover:text-white'
                        )}
                      >
                        {item.id === 'profile' ? (
                          <ChatAvatar
                            src={user?.avatar}
                            name={user?.full_name || 'User'}
                            className="size-5 rounded-md"
                          />
                        ) : (
                          <Icon className="size-5" />
                        )}
                        <span className="text-sm font-semibold">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>

                {/* Drawer Footer */}
                <div className="pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      handleLogout()
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 hover:bg-white/5 text-white/70 hover:text-white transition-colors"
                  >
                    <LogOut className="size-5 text-white/70" />
                    <span className="text-sm font-semibold">Log out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardProvider>
    </AppProvider>
  )
}



///Working code 
// import React, { useState } from 'react'
// import { useNavigate, Outlet, Link, useLocation } from '@tanstack/react-router'
// import { DashboardProvider } from '@/contexts/DashboardContext'
// import { NavSidebar, navItems, bottomItems } from '@/components/chat/nav-sidebar'
// import { ChatList } from '@/components/chat/chat-list'
// import { ChatWindow } from '@/components/chat/chat-window'
// import { GroupInfo } from '@/components/chat/group-info'
// import { cn } from '@/lib/utils'
// import { Loader2, X, LogOut } from 'lucide-react'
// import {
//   FriendsView,
//   ArchiveView,
//   ProfileView,
//   EditView,
//   CallsView,
//   MeetingView,
//   WorkView,
// } from '@/components/chat/tab-views'
// import { SetupProfileView } from '@/components/chat/setup-profile-view'
// import { getMyProfile, accessOrCreateChat, getUnreadChatCount } from '@/lib/api'
// import { AppProvider } from '@/contexts/AppContext'
// import { MessageOverlay } from '@/components/chat/message-overlay'
// import { MeetingStatsModal } from '@/components/chat/MeetingStatsModal'
// import { toast } from 'sonner'
// import { BubblespaceLogo } from '@/components/logo'
// import { ChatAvatar } from '@/components/chat/chat-avatar'

// import { useQuery, useQueryClient } from '@tanstack/react-query'
// import { useTheme } from 'next-themes'

// export function Dashboard({
//   bgType,
//   setBgType,
//   activeTab = 'all',
// }: {
//   bgType: string
//   setBgType: (t: string) => void
//   activeTab?: string
// }) {
//   const [isInMeeting, setIsInMeeting] = useState(false)
//   const [activeChatId, setActiveChatId] = useState<string | null>(null)
//   const [activeChat, setActiveChat] = useState<any>(null)
//   const navigate = useNavigate()
//   const location = useLocation()
//   const isChatRoute = location.pathname.includes('/dashboard/chat/')
//   const routeChatId = isChatRoute ? location.pathname.split('/').pop() : null
//   const [showInfo, setShowInfo] = useState(true)
//   const [overlayUser, setOverlayUser] = useState<any>(null)
//   const [overlayWorkCard, setOverlayWorkCard] = useState(false)
//   const [messages, setMessages] = useState<any[]>([])

//   React.useEffect(() => {
//     const params = new URLSearchParams(window.location.search);
//     const joinCode = params.get('joinGroupCode');
//     if (joinCode) {
//       const handleJoin = async () => {
//         try {
//           const { joinGroupChat } = await import('@/lib/api');
//           const res = await joinGroupChat(joinCode);
//           toast.success('Successfully joined the group!');
//           const chat = res?.conversation || res?.data?.conversation || res?.data || res;
//           if (chat?.id) {
//             navigate({ to: `/dashboard/chat/${chat.id}` });
//           }
//         } catch (err: any) {
//           toast.error(err?.message || 'Could not join group. Invite link may be invalid.');
//         } finally {
//           const newUrl = window.location.pathname;
//           window.history.replaceState({}, document.title, newUrl);
//         }
//       };
//       handleJoin();
//     }
//   }, [navigate]);

//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
//   const [isMobile, setIsMobile] = useState(false)

//   React.useEffect(() => {
//     const media = window.matchMedia('(max-width: 767px)')
//     setIsMobile(media.matches)
//     const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches)
//     media.addEventListener('change', listener)
//     return () => media.removeEventListener('change', listener)
//   }, [])

//   React.useEffect(() => {
//     setIsMobileMenuOpen(false)
//   }, [activeTab])

//   const { data: unreadData } = useQuery({
//     queryKey: ['unreadCount'],
//     queryFn: getUnreadChatCount,
//     refetchInterval: 10000,
//   })
//   const totalUnread = unreadData?.count || 0


//   const SIDE_PANEL_TABS = ['all']
//   const showSidePanel = SIDE_PANEL_TABS.includes(activeTab) || isChatRoute

//   React.useEffect(() => {
//     if (routeChatId) {
//       if (routeChatId !== activeChatId) {
//         setActiveChatId(routeChatId)
//       }
//     } else if (activeTab === 'all' && activeChatId) {
//       setActiveChatId(null)
//       setActiveChat(null)
//     }
//   }, [routeChatId, activeTab])

//   const isInfoVisible = !!(showInfo && !isInMeeting && activeChat && (activeTab === 'all' || activeTab === 'friends' || activeTab === 'work' || activeTab === 'archive' || isChatRoute))

//   // Use React Query for profile fetching with caching
//   const { data: userData, isLoading: loadingProfile, refetch: refetchProfile } = useQuery({
//     queryKey: ['profile'],
//     queryFn: async () => {
//       const res = await getMyProfile()
//       return res.data
//     },
//     staleTime: 1000 * 60 * 5, // Cache for 5 minutes
//   })

//   const user = userData

//   const { setTheme } = useTheme()

//   React.useEffect(() => {
//     if (user) {
//       if (user.app_background) {
//         if (user.app_background === 'custom' && user.custom_background) {
//           setBgType(user.custom_background)
//         } else {
//           setBgType(user.app_background)
//         }
//         if (user.app_background === 'dark') {
//           setTheme('dark')
//         } else {
//           setTheme('light')
//         }
//       }
//     }
//   }, [user, setBgType, setTheme])

//   // Security: Prevent unauthorized chat access
//   React.useEffect(() => {
//     if (activeChatId && activeChat) {
//       // Basic check: if activeChat doesn't involve the current user, clear it
//       // In a real app, this would be verified against the conversation members list
//       const isMember = activeChat.members?.some((m: any) =>
//         (m._id || m.id || m) === user?._id || (m._id || m.id || m) === user?.id
//       );

//       if (activeChat.members && !isMember) {
//         console.warn('Unauthorized chat access prevented:', activeChatId);
//         setActiveChatId(null);
//         setActiveChat(null);
//         toast.error('You do not have access to this conversation');
//       }
//     }
//   }, [activeChatId, activeChat, user]);

//   // Handle tab switching: close info sidebar and optionally clear chat
//   React.useEffect(() => {
//     setShowInfo(false);
//   }, [activeTab]);

//   React.useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
//         e.preventDefault()
//         const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
//         searchInput?.focus()
//       }
//     }
//     window.addEventListener('keydown', handleKeyDown)
//     return () => window.removeEventListener('keydown', handleKeyDown)
//   }, [])

//   const handleLogout = () => {
//     localStorage.removeItem("access_token");
//     localStorage.removeItem("refresh_token");
//     localStorage.removeItem("user");
//     localStorage.removeItem("bubblespace_private_key");
//     navigate({ to: "/login" });
//   };

//   const handleOpenMessage = (targetUser: any, showWorkCard = false) => {
//     setOverlayUser(targetUser)
//     setOverlayWorkCard(showWorkCard)
//   }

//   const handleOpenFullChat = async (targetUser: any) => {
//     try {
//       const res = await accessOrCreateChat(targetUser._id || targetUser.id)
//       const chat = res?.conversation || res?.data?.conversation || res?.data || res
//       const id = chat.id || chat._id
//       setActiveChatId(id)
//       setActiveChat(chat)
//       navigate({ to: `/dashboard/chat/${id}` })
//     } catch (err) {
//       console.error('Failed to open chat:', err)
//       toast.error('Failed to start conversation')
//     }
//   }

//   // Redirect to setup-profile if onboarding is incomplete
//   React.useEffect(() => {
//     if (user) {
//       if (!user.onboardingComplete && location.pathname !== '/setup-profile') {
//         navigate({ to: '/setup-profile' })
//       } else if (user.onboardingComplete && location.pathname === '/setup-profile') {
//         navigate({ to: '/dashboard/all' })
//       }
//     }
//   }, [user, location.pathname])

//   if (loadingProfile) {
//     return (
//       <div className="flex h-screen w-full items-center justify-center bg-canvas">
//         <Loader2 className="h-10 w-10 animate-spin text-purple" />
//       </div>
//     )
//   }

//   if (user && !user.onboardingComplete) {
//     return (
//       <div className="flex h-screen w-full items-center justify-center bg-canvas">
//         <Loader2 className="h-10 w-10 animate-spin text-purple" />
//       </div>
//     )
//   }

//   const [viewStatsUser, setViewStatsUser] = useState<any | null>(null)
//   const queryClient = useQueryClient()

//   const dashboardContextValue = {
//     user,
//     onMessage: handleOpenFullChat,
//     isNarrow: !!activeChatId,
//     setUser: (updatedUser?: any) => {
//       if (updatedUser) {
//         queryClient.setQueryData(['profile'], updatedUser)
//       } else {
//         refetchProfile()
//       }
//     },
//     bgType,
//     setBgType,
//     showInfo,
//     setShowInfo,
//     activeChatId,
//     setActiveChatId,
//     activeChat,
//     setActiveChat,
//     messages,
//     setMessages,
//     isMobileMenuOpen,
//     setIsMobileMenuOpen,
//     viewStatsUser,
//     setViewStatsUser,
//   }

//   return (
//     <AppProvider user={user}>
//       <DashboardProvider value={dashboardContextValue}>
//         <div className="relative z-10 flex h-screen md:h-[min(960px,92vh)] w-full max-w-[1760px] items-stretch gap-0 md:gap-5 2xl:h-[min(1080px,88vh)] font-poppins">
//           {/* App container */}
//           <div
//             className={cn(
//               "flex flex-1 gap-1 rounded-none md:rounded-[36px] p-0 md:p-3 shadow-none md:shadow-2xl transition-all duration-500 overflow-hidden",
//               bgType === 'glass'
//                 ? "bg-transparent md:bg-black/10 md:backdrop-blur-md md:border md:border-white/10"
//                 : (bgType === 'custom' || bgType.startsWith('/') || bgType.startsWith('http') || bgType.startsWith('data:'))
//                   ? "bg-transparent md:bg-black/20"
//                   : "bg-transparent md:bg-app-dark"
//             )}
//             style={{
//               backgroundImage: (!isMobile && (bgType === 'custom' || bgType.startsWith('/') || bgType.startsWith('http') || bgType.startsWith('data:')) && (user?.custom_background || bgType))
//                 ? `url(${user?.custom_background || bgType})`
//                 : 'none',
//               backgroundSize: 'cover',
//               backgroundPosition: 'center',
//             }}
//           >
//             <NavSidebar activeTab={isChatRoute ? 'all' : activeTab} user={user} onLogout={handleLogout} />

//             <div className={cn(
//               "flex flex-1 overflow-hidden rounded-none md:rounded-[26px] relative transition-all duration-300",
//               bgType === 'glass' ? "bg-white/40 backdrop-blur-xl border border-white/20 shadow-2xl" : "bg-white"
//             )}>
//               {/* Always mount the chat list + window but only show when on 'all' tab */}
//               <div className={cn("flex flex-1 overflow-hidden", !showSidePanel && "hidden")}>
//                 <div className={cn("border-r border-black/5 shrink-0 transition-all duration-300", activeChatId ? "hidden md:block w-[360px]" : "w-full md:w-[360px]")}>
//                   <ChatList
//                     activeId={activeChatId}
//                     onSelect={(id, chat) => {
//                       setActiveChatId(id)
//                       setActiveChat(chat)
//                       navigate({ to: `/dashboard/chat/${id}` })
//                     }}
//                     currentUserId={user?._id || user?.id}
//                   />
//                 </div>
//                 <div className={cn("overflow-hidden relative", activeChatId ? "flex flex-1 w-full" : "hidden md:block md:flex-1")}>
//                   {activeChatId && activeChat ? (
//                     <ChatWindow
//                       chatId={activeChatId}
//                       chat={activeChat}
//                       currentUser={user}
//                       messages={messages}
//                       setMessages={setMessages}
//                       isInfoOpen={showInfo}
//                       onShowInfo={() => setShowInfo(!showInfo)}
//                       onStartMeeting={() => setIsInMeeting(true)}
//                       onClose={() => {
//                         setActiveChatId(null)
//                         setActiveChat(null)
//                         navigate({ to: '/dashboard/all' })
//                       }}
//                     />
//                   ) : (
//                     <div className="flex h-full flex-col items-center justify-center text-center p-8">
//                       <div className="size-20 rounded-3xl bg-purple/10 flex items-center justify-center mb-4">
//                         <svg className="size-10 text-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
//                         </svg>
//                       </div>
//                       <h2 className="text-xl font-bold text-black mb-2">Select a conversation</h2>
//                       <p className="text-sm text-black/40 max-w-xs">Choose a chat from the left panel or start a new one with a colleague</p>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Non-chat tab views — rendered via Outlet */}
//               <div className={cn("flex flex-col flex-1 overflow-hidden", showSidePanel && "hidden")}>
//                 <Outlet />
//               </div>
//             </div>
//           </div>

//           {/* Right info panel */}
//           {isInfoVisible && (
//             <aside className="w-[360px] shrink-0 flex flex-col gap-4 overflow-y-auto max-h-full animate-in slide-in-from-right duration-300 custom-scrollbar pr-1">
//               <GroupInfo
//                 key={activeChatId}
//                 conversation={activeChat}
//                 messages={messages}
//                 onClose={() => setShowInfo(false)}
//               />
//             </aside>
//           )}

//           {/* Message Overlay for Work/Friends messaging */}
//           {overlayUser && (
//             <MessageOverlay
//               user={user}
//               targetUser={overlayUser}
//               workCardInfo={overlayWorkCard}
//               onClose={() => setOverlayUser(null)}
//             />
//           )}

//           {/* Meeting Stats Modal */}
//           {viewStatsUser && (
//             <MeetingStatsModal
//               targetUser={viewStatsUser}
//               onClose={() => setViewStatsUser(null)}
//             />
//           )}

//           {/* Mobile Navigation Drawer */}
//           {isMobile && isMobileMenuOpen && (
//             <div className="fixed inset-0 z-50 flex md:hidden">
//               {/* Backdrop */}
//               <div
//                 className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
//                 onClick={() => setIsMobileMenuOpen(false)}
//               />
//               {/* Drawer Content */}
//               <div
//                 className="relative flex w-72 max-w-xs flex-col bg-app-dark p-6 text-white shadow-2xl transition-transform duration-300 animate-in slide-in-from-left"
//               >
//                 {/* Drawer Header */}
//                 <div className="flex items-center justify-between pb-6 border-b border-white/10">
//                   <div className="flex items-center gap-2">
//                     <BubblespaceLogo className="size-8 text-white" />
//                     <span className="text-lg font-bold tracking-tight">Bubblespace</span>
//                   </div>
//                   <button
//                     onClick={() => setIsMobileMenuOpen(false)}
//                     className="rounded-xl p-1.5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
//                   >
//                     <X className="size-5" />
//                   </button>
//                 </div>

//                 {/* Navigation Items */}
//                 <div className="flex-1 overflow-y-auto py-6 space-y-2">
//                   {navItems.map((item) => {
//                     const Icon = item.icon
//                     const isActive = item.id === (isChatRoute ? 'all' : activeTab)
//                     const badge = (item.id === 'all' || item.id === 'work') ? totalUnread : 0

//                     return (
//                       <Link
//                         key={item.id}
//                         to={`/dashboard/${item.id === 'all' ? 'all' : item.id}`}
//                         onClick={() => setIsMobileMenuOpen(false)}
//                         className={cn(
//                           'flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200',
//                           isActive
//                             ? 'bg-white/15 border border-white/10 shadow-lg'
//                             : 'hover:bg-white/5 text-white/70 hover:text-white'
//                         )}
//                       >
//                         <Icon className="size-5" />
//                         <span className="text-sm font-semibold flex-1">{item.label}</span>
//                         {badge > 0 && (
//                           <span className="flex min-w-[20px] h-5 items-center justify-center rounded-full bg-accent-orange px-1.5 text-[10px] font-bold text-white shadow-sm">
//                             {badge}
//                           </span>
//                         )}
//                       </Link>
//                     )
//                   })}

//                   <div className="my-4 h-px bg-white/10" />

//                   {bottomItems.map((item) => {
//                     const Icon = item.icon
//                     const isActive = item.id === activeTab
//                     return (
//                       <Link
//                         key={item.id}
//                         to={`/dashboard/${item.id === 'edit' ? 'edit-profile' : item.id}`}
//                         onClick={() => setIsMobileMenuOpen(false)}
//                         className={cn(
//                           'flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200',
//                           isActive
//                             ? 'bg-white/15 border border-white/10 shadow-lg'
//                             : 'hover:bg-white/5 text-white/70 hover:text-white'
//                         )}
//                       >
//                         {item.id === 'profile' ? (
//                           <ChatAvatar
//                             src={user?.avatar}
//                             name={user?.full_name || 'User'}
//                             className="size-5 rounded-md"
//                           />
//                         ) : (
//                           <Icon className="size-5" />
//                         )}
//                         <span className="text-sm font-semibold">{item.label}</span>
//                       </Link>
//                     )
//                   })}
//                 </div>

//                 {/* Drawer Footer */}
//                 <div className="pt-4 border-t border-white/10">
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setIsMobileMenuOpen(false)
//                       handleLogout()
//                     }}
//                     className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 hover:bg-white/5 text-white/70 hover:text-white transition-colors"
//                   >
//                     <LogOut className="size-5 text-white/70" />
//                     <span className="text-sm font-semibold">Log out</span>
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </DashboardProvider>
//     </AppProvider>
//   )
// }
