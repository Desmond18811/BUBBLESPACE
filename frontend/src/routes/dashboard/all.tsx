import { createFileRoute } from '@tanstack/react-router'
import { useDashboard } from '@/contexts/DashboardContext'
import React from 'react'

export const Route = createFileRoute('/dashboard/all')({
    component: DashboardAll,
})

function DashboardAll() {
    // We don't actually need to render anything here because 
    // the 'all' view (ChatList + ChatWindow) is managed by the parent Dashboard
    // as a persistent side panel. 
    // This route just establishes the /dashboard/all path.
    return null
}
