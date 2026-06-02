import { createFileRoute } from '@tanstack/react-router'
import { useDashboard } from '@/contexts/DashboardContext'
import { ArchiveView } from '@/components/chat/tab-views'
import React from 'react'

export const Route = createFileRoute('/dashboard/archive')({
    component: DashboardArchive,
})

function DashboardArchive() {
    const { onMessage } = useDashboard()
    return <ArchiveView onMessage={onMessage} />
}
