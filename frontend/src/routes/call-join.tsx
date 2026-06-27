import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { LiveKitMeetingModal } from '@/components/chat/LiveKitMeetingModal'
import { BubblespaceLogo } from '@/components/logo'

export const Route = createFileRoute('/call/join')({
  component: CallJoinPage,
})

/**
 * Landing page for a signed call invite link: `/call/join?room=<id>&t=<jwt>&type=video`.
 * Authenticated users join the room directly (the JWT is verified server-side when the
 * modal fetches its LiveKit token). Unauthenticated users are sent to login, then back
 * here. Guest (account-less) join is intentionally out of scope for v1.
 */
function CallJoinPage() {
  const navigate = useNavigate()
  const [closed, setClosed] = useState(false)

  const { roomId, joinToken, type } = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return {
      roomId: params.get('room') || '',
      joinToken: params.get('t') || undefined,
      type: (params.get('type') === 'voice' ? 'voice' : 'video') as 'voice' | 'video',
    }
  }, [])

  const stored = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  }, [])

  const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('access_token')

  useEffect(() => {
    if (!isAuthed) {
      // Send to login, preserving this invite link to resume after sign-in.
      const next = encodeURIComponent(window.location.pathname + window.location.search)
      navigate({ to: '/login', search: { next } as any, replace: true })
    }
  }, [isAuthed, navigate])

  if (closed) {
    navigate({ to: '/dashboard/all', replace: true })
    return null
  }

  if (!isAuthed) {
    return <JoinSplash label="Taking you to sign in…" />
  }

  if (!roomId) {
    return <JoinSplash label="This invite link is invalid or has expired." />
  }

  return (
    <div className="fixed inset-0 z-[200]">
      <LiveKitMeetingModal
        roomId={roomId}
        type={type}
        joinToken={joinToken}
        userId={stored?._id || stored?.id || 'guest'}
        userName={stored?.full_name || stored?.username || 'Guest'}
        userAvatar={stored?.avatar}
        onClose={() => setClosed(true)}
      />
    </div>
  )
}

function JoinSplash({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <BubblespaceLogo className="size-14 text-primary mb-4" />
      <p className="text-muted-foreground">{label}</p>
    </div>
  )
}
