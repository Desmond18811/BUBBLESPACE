import { useState, useEffect } from 'react'
import { X, Sparkles, Calendar, Clock, Activity, Loader2 } from 'lucide-react'
import { getMeetingStatsWithUser } from '@/lib/api'
import { ChatAvatar } from '@/components/chat/chat-avatar'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MeetingStatsModalProps {
    targetUser: any
    onClose: () => void
}

export function MeetingStatsModal({ targetUser, onClose }: MeetingStatsModalProps) {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<{ count: number; meetings: any[] } | null>(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getMeetingStatsWithUser(targetUser._id || targetUser.id)
                setStats(res)
            } catch (err) {
                console.error('Failed to fetch meeting stats:', err)
                toast.error('Failed to load meeting statistics')
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [targetUser])

    const formatDuration = (sec?: number) => {
        if (!sec) return 'unknown'
        const mins = Math.floor(sec / 60)
        return mins > 0 ? `${mins} min${mins > 1 ? 's' : ''}` : `${sec}s`
    }

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div 
                className="w-full max-w-2xl bg-white rounded-[2rem] p-6 shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-purple/10 flex items-center justify-center">
                            <Sparkles className="size-5 text-purple" />
                        </div>
                        <div>
                            <h3 className="font-bold text-ink text-base">Meeting History & Stats</h3>
                            <p className="text-xs text-ink-soft">Track collaboration history with team members</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-xl flex items-center justify-center hover:bg-slate-100 text-ink-soft transition-colors cursor-pointer"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
                    {/* User Profile Card */}
                    <div className="flex items-center gap-4 p-5 rounded-2xl bg-purple-soft/5 border border-purple/10">
                        <ChatAvatar 
                            src={targetUser.avatar} 
                            name={targetUser.full_name || targetUser.username || '?'} 
                            className="size-14 rounded-2xl" 
                        />
                        <div>
                            <h4 className="font-extrabold text-ink text-base">{targetUser.full_name || targetUser.username}</h4>
                            <p className="text-xs text-purple font-semibold mt-0.5">
                                {targetUser.username ? `@${targetUser.username}` : ''}
                            </p>
                            <p className="text-xs text-ink-soft mt-1">
                                {targetUser.org_role || targetUser.role || 'Member'} • {targetUser.organization || 'Workspace'}
                            </p>
                        </div>
                        <div className="ml-auto text-right">
                            <span className="text-[28px] font-black text-purple leading-none block">
                                {loading ? '...' : stats?.count || 0}
                            </span>
                            <span className="text-[10px] font-bold text-ink-soft uppercase tracking-wider block mt-0.5">
                                Total Meetings
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="size-8 animate-spin text-purple mb-2" />
                            <p className="text-sm text-ink-soft">Loading historical statistics…</p>
                        </div>
                    ) : !stats?.meetings || stats.meetings.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                            <Activity className="size-10 text-slate-350 mx-auto mb-3" />
                            <h5 className="font-bold text-ink text-sm">No Meetings Found</h5>
                            <p className="text-xs text-ink-soft max-w-xs mx-auto mt-1">
                                You haven't had any recorded calls or meetings with this user yet.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h5 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">Past Meetings Log</h5>
                            <div className="space-y-3">
                                {stats.meetings.map((meeting: any) => {
                                    const meetDate = new Date(meeting.startedAt).toLocaleDateString(undefined, {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })
                                    const meetTime = new Date(meeting.startedAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })
                                    return (
                                        <div 
                                            key={meeting._id}
                                            className="p-4 rounded-2xl border border-slate-100 hover:border-purple/20 transition-all flex flex-col gap-2 bg-slate-50/30"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h6 className="font-bold text-ink text-[14px] leading-tight">
                                                        {meeting.title || 'Untitled Meeting'}
                                                    </h6>
                                                    <div className="flex items-center gap-3 text-[11px] text-ink-soft mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="size-3 text-purple" />
                                                            {meetDate} at {meetTime}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="size-3 text-purple" />
                                                            {formatDuration(meeting.duration)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold bg-slate-100 text-ink-soft px-2 py-0.5 rounded-md capitalize">
                                                    {meeting.type}
                                                </span>
                                            </div>
                                            {meeting.summary && (
                                                <div className="mt-1 p-3 rounded-xl bg-white border border-slate-100 text-xs">
                                                    <p className="font-bold text-[10px] uppercase tracking-wider text-purple mb-1">
                                                        ✦ AI Summary
                                                    </p>
                                                    <p className="text-ink-soft leading-relaxed">
                                                        {meeting.summary}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
