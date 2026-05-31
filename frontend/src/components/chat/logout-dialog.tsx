'use client'

import { LogOut } from 'lucide-react'

export function LogoutDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onCancel}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-purple-light">
          <LogOut className="size-6 text-purple" />
        </div>
        <h2 className="mt-4 text-[20px] font-bold text-ink">Log out?</h2>
        <p className="mt-1 text-[14px] text-ink-soft">
          You will need to sign in again to access your chats.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-purple-soft px-4 py-2.5 text-[14px] font-medium text-ink transition-colors hover:bg-purple-light"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-purple px-4 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}

export function LoggedOutScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="flex size-20 items-center justify-center rounded-3xl bg-purple-light">
        <LogOut className="size-9 text-purple" />
      </div>
      <h2 className="mt-6 text-[24px] font-bold text-ink">
        You&apos;ve been logged out
      </h2>
      <p className="mt-2 max-w-sm text-[14px] text-ink-soft">
        Thanks for stopping by. Sign back in to pick up right where you left
        off.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-6 rounded-xl bg-purple px-6 py-3 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
      >
        Sign back in
      </button>
    </div>
  )
}
