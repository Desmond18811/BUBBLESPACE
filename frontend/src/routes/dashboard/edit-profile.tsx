import { createFileRoute } from '@tanstack/react-router'
import { useDashboard } from '@/contexts/DashboardContext'
import { EditView } from '@/components/chat/tab-views'
import React from 'react'

export const Route = createFileRoute('/dashboard/edit-profile')({
    component: DashboardEditProfile,
})

function DashboardEditProfile() {
    const { user, setUser, bgType, setBgType } = useDashboard()
    return (
        <EditView
            user={user}
            setUser={setUser}
            bgType={bgType}
            setBgType={setBgType}
        />
    )
}
