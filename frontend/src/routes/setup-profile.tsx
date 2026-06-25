import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SetupProfileView } from '@/components/chat/setup-profile-view'
import { getMyProfile } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { setStoredStage, stageFromUser } from '@/lib/onboarding'

export const Route = createFileRoute('/setup-profile')({
    component: SetupProfileRoutePage,
})

function SetupProfileRoutePage() {
    const navigate = useNavigate()
    const { data: userData, refetch: refetchProfile, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const res = await getMyProfile()
            return res.data
        },
        staleTime: 1000 * 60 * 5,
    })

    // Authoritative stage gate: the backend profile decides. If onboarding is already
    // complete, skip setup entirely (→ dashboard) so a returning user never re-submits
    // a finished stage (the source of duplicate/409 errors). Otherwise mirror the
    // current stage into sessionStorage for instant resume.
    React.useEffect(() => {
        if (!userData) return
        if (userData.onboardingComplete) {
            setStoredStage('complete')
            navigate({ to: '/dashboard/all' })
        } else {
            setStoredStage(stageFromUser(userData))
        }
    }, [userData, navigate])

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-canvas">
                <span className="text-sm font-semibold text-ink-soft">Loading profile...</span>
            </div>
        )
    }

    if (!userData) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-canvas">
                <span className="text-sm font-semibold text-ink-soft">No profile found.</span>
            </div>
        )
    }

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas p-0 md:p-5 lg:p-8">
            <SetupProfileView 
                user={userData} 
                onComplete={async () => {
                    await refetchProfile()
                    navigate({ to: '/dashboard/all' })
                }} 
            />
        </main>
    )
}
