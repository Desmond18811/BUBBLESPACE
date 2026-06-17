import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/brain')({
    beforeLoad: () => {
        throw redirect({ to: '/dashboard/calls' })
    },
    component: () => null,
})
