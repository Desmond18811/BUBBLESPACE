import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import React from 'react'
import { Dashboard } from '@/components/chat/dashboard'
import { BubbleBackground } from '@/components/chat/bubble-background'
import { cn } from '@/lib/utils'

export const Route = createFileRoute("/dashboard")({
    component: DashboardPage,
});

function DashboardPage() {
    const [bgType, setBgType] = React.useState<string>('bubbles')
    const location = useLocation()

    // Determine active tab from path (e.g. /dashboard/work -> work)
    const activeTab = location.pathname.split('/').pop() || 'all'

    return (
        <main
            className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas p-5 lg:p-8"
        >
            <div
                className={cn(
                    "fixed inset-0 pointer-events-none transition-opacity duration-1000",
                    bgType === 'topographic' && "topographic-bg-refined"
                )}
                style={{
                    backgroundImage:
                        bgType === 'bubbles' ? 'none' :
                            bgType === 'light' ? "url('/themes/light.png')" :
                                bgType === 'dark' ? "url('/themes/dark.png')" :
                                    "url('/topographic_bg_v2_1780147871964.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            {bgType === 'bubbles' && <BubbleBackground />}
            <Dashboard bgType={bgType} setBgType={setBgType} activeTab={activeTab}>
                <Outlet />
            </Dashboard>
        </main>
    );
}
