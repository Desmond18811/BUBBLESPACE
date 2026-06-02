import React, { createContext, useContext } from 'react'

interface DashboardContextType {
    user: any
    onMessage: (targetUser: any, showWorkCard?: boolean) => void
    isNarrow: boolean
    setUser: (u: any) => void
    bgType: string
    setBgType: (t: string) => void
    showInfo: boolean
    setShowInfo: React.Dispatch<React.SetStateAction<boolean>> | ((val: boolean) => void)
    activeChatId: string | null
    setActiveChatId: (id: string | null) => void
    activeChat: any
    setActiveChat: (chat: any) => void
    messages: any[]
    setMessages: React.Dispatch<React.SetStateAction<any[]>>
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children, value }: { children: React.ReactNode, value: DashboardContextType }) {
    return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard() {
    const context = useContext(DashboardContext)
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider')
    }
    return context
}
