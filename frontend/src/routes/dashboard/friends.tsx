import { createFileRoute } from '@tanstack/react-router'
import { useDashboard } from '@/contexts/DashboardContext'
import { FriendsView } from '@/components/chat/tab-views'
import React from 'react'

export const Route = createFileRoute('/dashboard/friends')({
    component: DashboardFriends,
})

function DashboardFriends() {
    const { onMessage, isNarrow } = useDashboard()
    return <FriendsView onMessage={onMessage} isNarrow={isNarrow} />
}
