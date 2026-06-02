import { createFileRoute } from '@tanstack/react-router'
import { CallsView } from '@/components/chat/tab-views'
import React from 'react'

export const Route = createFileRoute('/dashboard/calls')({
    component: DashboardCalls,
})

function DashboardCalls() {
    return <CallsView onStartMeeting={() => { }} />
}
