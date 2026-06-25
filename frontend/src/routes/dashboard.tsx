import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import React from 'react'
import { Dashboard } from '@/components/chat/dashboard'
import { BubbleBackground } from '@/components/chat/bubble-background'
import { cn, getSecureMediaUrl } from '@/lib/utils'

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
            className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas p-0 md:p-5 lg:p-8"
        >
            <div
                className={cn(
                    "hidden md:block fixed inset-0 pointer-events-none transition-opacity duration-1000",
                    bgType === 'topographic' && "topographic-bg-refined"
                )}
                style={{
                    backgroundImage:
                        bgType === 'bubbles' ? 'none' :
                            bgType === 'light' ? "url('/themes/light.png')" :
                                bgType === 'dark' ? "url('/themes/dark.png')" :
                                    bgType === 'glass' ? "radial-gradient(circle at top left, #c084fc 0%, #a78bfa 35%, #e879f9 75%, #f472b6 100%)" :
                                        (bgType && (bgType.startsWith('/') || bgType.startsWith('http') || bgType.startsWith('data:'))) ? `url('${getSecureMediaUrl(bgType)}')` :
                                            "url('/topographic_bg_v2_1780147871964.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            {bgType === 'bubbles' && (
                <div className="hidden md:block">
                    <BubbleBackground />
                </div>
            )}
            <Dashboard bgType={bgType} setBgType={setBgType} activeTab={activeTab} />
        </main>
    );
}
