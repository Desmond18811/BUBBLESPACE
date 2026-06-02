import React, { createContext, useContext } from 'react'

interface DashboardContextType {
    user: any
    onMessage: (targetUser: any) => void
    isNarrow: boolean
    setUser: (u: any) => void
    bgType: string
    setBgType: (t: string) => void
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
