import { useState } from 'react'
import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { NavSidebar } from '@/components/chat/nav-sidebar'
import { ChatList } from '@/components/chat/chat-list'
import { ChatWindow } from '@/components/chat/chat-window'
import { GroupInfo } from '@/components/chat/group-info'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { conversations } from '@/lib/chat-data'
import {
  FriendsView,
  ArchiveView,
  ProfileView,
  EditView,
  CallsView,
  MeetingView,
} from '@/components/chat/tab-views'

export function Dashboard({
  bgType,
  setBgType,
}: {
  bgType: string
  setBgType: (t: string) => void
}) {
  const [isInMeeting, setIsInMeeting] = useState(false)
  const [activeTab, setActiveTab] = useState('all') // 'all', 'friends', 'calls', 'archive', 'profile', 'edit'
  const [activeChatId, setActiveChatId] = useState('design')
  const navigate = useNavigate();
  const [showInfo, setShowInfo] = useState(true)
  const conversation = conversations[activeChatId]

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

  return (
    <div className="relative z-10 flex h-[min(960px,92vh)] w-full max-w-[1760px] items-stretch gap-5 2xl:h-[min(1080px,88vh)] font-poppins">
      {/* App container */}
      <div className="flex flex-1 gap-1 rounded-[36px] bg-app-dark p-3 shadow-2xl transition-all duration-500 overflow-hidden">
        <NavSidebar activeTab={activeTab} onSelect={setActiveTab} onLogout={handleLogout} />

        <div className="flex flex-1 overflow-hidden rounded-[26px] bg-white relative">
          {(activeTab === 'all' || activeTab === 'work') ? (
            <>
              <div className={cn("hidden md:block w-[360px] shrink-0 border-r border-black/5", activeChatId && "block w-full md:w-[360px]")}>
                <ChatList activeId={activeChatId} onSelect={setActiveChatId} />
              </div>
              <div className={cn("flex-1 overflow-hidden relative", !activeChatId && "hidden md:block")}>
                <ChatWindow
                  conversation={conversation}
                  onShowInfo={() => setShowInfo(!showInfo)}
                  onStartMeeting={() => setIsInMeeting(true)}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-hidden">
              <div className="h-full">
                {activeTab === 'friends' && <FriendsView />}
                {activeTab === 'archive' && <ArchiveView />}
                {activeTab === 'profile' && <ProfileView onEdit={() => setActiveTab('edit')} />}
                {activeTab === 'edit' && <EditView bgType={bgType} setBgType={setBgType} />}
                {activeTab === 'calls' && (
                  isInMeeting ? (
                    <MeetingView onBack={() => setIsInMeeting(false)} />
                  ) : (
                    <CallsView onStartMeeting={() => setIsInMeeting(true)} />
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right info panel */}
      {showInfo && !isInMeeting && (
        <GroupInfo
          key={conversation.id}
          conversation={conversation}
          onClose={() => setShowInfo(false)}
        />
      )}
    </div>
  )
}
