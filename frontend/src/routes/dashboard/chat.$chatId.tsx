import { createFileRoute } from '@tanstack/react-router'
import React from 'react'

export const Route = createFileRoute('/dashboard/chat/$chatId')({
    component: DashboardChat,
})

function DashboardChat() {
    // TanStack Router needs a component to render. We return null because 
    // the parent Dashboard component handles visual display when this path is active.
    return null
}
