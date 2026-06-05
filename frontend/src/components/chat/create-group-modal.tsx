import React, { useState, useEffect } from 'react'
import { X, Users, Search, Check, Sparkles, Loader2, Briefcase } from 'lucide-react'
import { getMyContacts, createGroupChat } from '@/lib/api'
import { ChatAvatar } from './chat-avatar'
import { toast } from 'sonner'

interface CreateGroupModalProps {
  onClose: () => void
  onSuccess: (newChat: any) => void
}

export function CreateGroupModal({ onClose, onSuccess }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('')
  const [contacts, setContacts] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [createdGroup, setCreatedGroup] = useState<any>(null)

  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true)
        const res = await getMyContacts()
        setContacts(res?.data || [])
      } catch (err) {
        console.error('Failed to load contacts for group creation:', err)
        toast.error('Could not load contacts list')
      } finally {
        setLoading(false)
      }
    }
    loadContacts()
  }, [])

  const handleToggleContact = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim()) {
      toast.error('Group name is required')
      return
    }
    if (selectedIds.size === 0) {
      toast.error('Please select at least one member')
      return
    }

    setSubmitting(true)
    try {
      const res = await createGroupChat(groupName.trim(), Array.from(selectedIds))
      toast.success('Group created successfully!')
      const chat = res?.conversation || res?.data?.conversation || res?.data || res
      setCreatedGroup(chat)
      onSuccess(chat)
    } catch (err: any) {
      toast.error(err?.message || 'Could not create group')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredContacts = contacts.filter(c =>
    (c.full_name || c.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (createdGroup) {
    const inviteLink = `${window.location.origin}/dashboard/all?joinGroupCode=${createdGroup.inviteCode || ''}`
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-slate-200/60 animate-in zoom-in-95 duration-200 text-center flex flex-col items-center">
          <div className="size-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-5">
            <Sparkles className="size-8 text-emerald-500 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-ink mb-2">Group Created! 🚀</h3>
          <p className="text-sm text-ink-soft mb-6 leading-relaxed">
            Your new group <strong className="text-purple">"{createdGroup.chatName || groupName}"</strong> has been successfully created. Invite others directly using this unique group link.
          </p>

          <div className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200/60 mb-6 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Unique Invite Code</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">Active</span>
            </div>
            <div className="text-center py-2 font-mono font-bold text-base text-ink tracking-wider bg-white rounded-xl border border-slate-100 mb-4 select-all">
              {createdGroup.inviteCode || 'No code available'}
            </div>

            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Share Link</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 bg-white border border-slate-200 h-10 px-3 rounded-xl text-xs text-ink font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink)
                  toast.success('Group invite link copied!')
                }}
                className="h-10 px-4 bg-purple text-white text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-95"
              >
                <Copy className="size-3.5" />
                Copy
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-purple text-white font-bold rounded-xl hover:bg-purple/90 active:scale-95 transition-all cursor-pointer text-sm"
          >
            Enter Chat Workspace
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl shadow-black/20 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-purple/10 flex items-center justify-center text-purple">
              <Users className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">Create New Group</h2>
              <p className="text-xs text-ink-soft">Build a shared space for your team</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl bg-black/5 hover:bg-black/10 transition-colors"
          >
            <X className="size-4 text-black/50" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="flex-1 overflow-y-auto pt-4 flex flex-col gap-4">
          <div className="space-y-1.5 shrink-0">
            <label className="text-[10px] font-bold uppercase tracking-wider text-ink ml-0.5">Group Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Design Sync"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="w-full bg-slate-50/50 border border-black/10 rounded-xl py-3 px-4 text-ink focus:outline-none focus:ring-2 focus:ring-purple/30 text-sm font-semibold"
            />
          </div>

          <div className="flex flex-col flex-1 min-h-[200px] overflow-hidden">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <label className="text-[10px] font-bold uppercase tracking-wider text-ink ml-0.5">
                Select Members ({selectedIds.size})
              </label>
              {contacts.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedIds.size === contacts.length) {
                      setSelectedIds(new Set())
                    } else {
                      setSelectedIds(new Set(contacts.map(c => c._id || c.id)))
                    }
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider text-purple hover:underline"
                >
                  {selectedIds.size === contacts.length ? 'Clear All' : 'Select All'}
                </button>
              )}
            </div>

            {/* Search contacts filter */}
            <div className="relative mb-3 shrink-0">
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/50 border border-black/10 rounded-xl py-2.5 pl-9 pr-4 text-ink focus:outline-none focus:ring-2 focus:ring-purple/30 text-xs"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-black/40" />
            </div>

            {/* Contacts list */}
            <div className="flex-1 overflow-y-auto space-y-2 border border-black/5 rounded-2xl p-2 bg-slate-50/20 max-h-[240px]">
              {loading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-purple/60" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <p className="text-xs font-semibold text-ink-soft">No contacts found</p>
                  <p className="text-[10px] text-ink-soft/70 mt-1">Add connections first to add them to groups</p>
                </div>
              ) : (
                filteredContacts.map(c => {
                  const id = c._id || c.id
                  const isSelected = selectedIds.has(id)
                  return (
                    <div
                      key={id}
                      onClick={() => handleToggleContact(id)}
                      className={`flex items-center gap-3 rounded-xl p-2.5 cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-purple/5 border-purple/20 shadow-sm'
                          : 'bg-white border-black/5 hover:bg-slate-50'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <ChatAvatar src={c.avatar} name={c.full_name || c.username} className="size-9 rounded-xl" />
                        {isSelected && (
                          <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-purple text-white flex items-center justify-center">
                            <Check className="size-2.5 stroke-[3px]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-ink truncate">{c.full_name}</p>
                          {c.username && (
                            <span className="text-[10px] font-medium text-purple">@{c.username}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-ink-soft truncate flex items-center gap-1 mt-0.5">
                          <span className="font-semibold">{c.org_role || c.role || 'Member'}</span>
                          {c.organization && <span className="opacity-60">· {c.organization}</span>}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-3 border-t border-black/5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 border border-black/10 rounded-xl font-bold text-xs text-ink-soft hover:bg-slate-50 active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !groupName.trim() || selectedIds.size === 0}
              className="flex-1 h-11 bg-purple text-white font-bold rounded-xl text-xs shadow-md shadow-purple/10 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Create Group
                  <Sparkles className="size-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
