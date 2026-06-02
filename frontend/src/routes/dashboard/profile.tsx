import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useDashboard } from '@/contexts/DashboardContext'
import { ProfileView } from '@/components/chat/tab-views'
import React from 'react'

export const Route = createFileRoute('/dashboard/profile')({
    component: DashboardProfile,
})

function DashboardProfile() {
    const { user } = useDashboard()
    const navigate = useNavigate()
    return <ProfileView user={user} onEdit={() => navigate({ to: '/dashboard/edit-profile' })} />
}
