import React, { useState } from 'react'
import { useNavigate, Outlet } from '@tanstack/react-router'
import { DashboardProvider } from '@/contexts/DashboardContext'
import { NavSidebar } from '@/components/chat/nav-sidebar'
import { ChatList } from '@/components/chat/chat-list'
import { ChatWindow } from '@/components/chat/chat-window'
import { GroupInfo } from '@/components/chat/group-info'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
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
import { getMyProfile, accessOrCreateChat } from '@/lib/api'
import { AppProvider } from '@/contexts/AppContext'
import { MessageOverlay } from '@/components/chat/message-overlay'
import { toast } from 'sonner'

import { useQuery } from '@tanstack/react-query'

export function Dashboard({
  bgType,
  setBgType,
  activeTab = 'all',
}: {
  bgType: string
  setBgType: (t: string) => void
  activeTab?: string
}) {
  const [isInMeeting, setIsInMeeting] = useState(false)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [activeChat, setActiveChat] = useState<any>(null)
  const navigate = useNavigate()
  const [showInfo, setShowInfo] = useState(true)
  const [overlayUser, setOverlayUser] = useState<any>(null)
  const [overlayWorkCard, setOverlayWorkCard] = useState(false)
  const [messages, setMessages] = useState<any[]>([])

  const SIDE_PANEL_TABS = ['all']
  const showSidePanel = SIDE_PANEL_TABS.includes(activeTab)
  const isInfoVisible = !!(showInfo && !isInMeeting && activeChat && (activeTab === 'all' || activeTab === 'friends' || activeTab === 'work' || activeTab === 'archive'))

  // Use React Query for profile fetching with caching
  const { data: userData, isLoading: loadingProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await getMyProfile()
      return res.data
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })

  const user = userData

  React.useEffect(() => {
    if (user) {
      if (user.app_background && user.app_background !== 'custom') {
        setBgType(user.app_background)
      }
    }
  }, [user, setBgType])

  // Security: Prevent unauthorized chat access
  React.useEffect(() => {
    if (activeChatId && activeChat) {
      // Basic check: if activeChat doesn't involve the current user, clear it
      // In a real app, this would be verified against the conversation members list
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

  // Handle tab switching: close info sidebar and optionally clear chat
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
      setActiveChatId(chat.id || chat._id)
      setActiveChat(chat)
      setMessages([])
      navigate({ to: '/dashboard/all' })
    } catch (err) {
      console.error('Failed to open chat:', err)
      toast.error('Failed to start conversation')
    }
  }

  if (loadingProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-canvas">
        <Loader2 className="h-10 w-10 animate-spin text-purple" />
      </div>
    )
  }

  if (user && !user.onboardingComplete) {
    return <SetupProfileView user={user} onComplete={() => { }} />
  }

  return (
    <AppProvider user={user}>
      <div className="relative z-10 flex h-[min(960px,92vh)] w-full max-w-[1760px] items-stretch gap-5 2xl:h-[min(1080px,88vh)] font-poppins">
        {/* App container */}
        <div
          className="flex flex-1 gap-1 rounded-[36px] bg-app-dark p-3 shadow-2xl transition-all duration-500 overflow-hidden"
          style={{
            backgroundImage: user?.app_background === 'custom' && user?.custom_background
              ? `url(${user.custom_background})`
              : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <NavSidebar activeTab={activeTab} user={user} onLogout={handleLogout} />

          <div className="flex flex-1 overflow-hidden rounded-[26px] bg-white relative transition-all duration-300">
            {/* Always mount the chat list + window but only show when on 'all' tab */}
            <div className={cn("flex flex-1 overflow-hidden", !showSidePanel && "hidden")}>
              <div className={cn("hidden md:block w-[360px] shrink-0 border-r border-black/5", activeChatId && "block w-full md:w-[360px]")}>
                <ChatList
                  activeId={activeChatId}
                  onSelect={(id, chat) => {
                    setActiveChatId(id)
                    setActiveChat(chat)
                  }}
                  currentUserId={user?._id || user?.id}
                />
              </div>
              <div className={cn("flex-1 overflow-hidden relative", !activeChatId && "hidden md:block")}>
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
            <div className={cn("flex-1 overflow-hidden", showSidePanel && "hidden")}>
              <DashboardProvider value={{
                user,
                onMessage: handleOpenFullChat,
                isNarrow: !!activeChatId,
                setUser: () => refetchProfile(),
                bgType,
                setBgType,
                showInfo,
                setShowInfo,
                activeChatId,
                setActiveChatId,
                activeChat,
                setActiveChat,
                messages,
                setMessages
              }}>
                <Outlet />
              </DashboardProvider>
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
      </div>
    </AppProvider>
  )
}
