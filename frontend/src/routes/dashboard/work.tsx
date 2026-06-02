import { createFileRoute } from '@tanstack/react-router'
import { useDashboard } from '@/contexts/DashboardContext'
import { WorkView } from '@/components/chat/tab-views'
import React from 'react'

export const Route = createFileRoute('/dashboard/work')({
    component: DashboardWork,
})

function DashboardWork() {
    const { onMessage, isNarrow } = useDashboard()
    return <WorkView onMessage={onMessage} isNarrow={isNarrow} />
}
