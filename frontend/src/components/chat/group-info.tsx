// removed 'use client' for Vite

import { useState } from 'react'
const Image = (props: any) => <img {...props} />
import {
  X,
  ChevronUp,
  ChevronDown,
  Images,
  Video,
  Files,
  Music2,
  Link2,
  Mic,
  Phone,
  AtSign,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Conversation, FileCategory } from '@/lib/chat-data'

const iconMap = {
  video: Video,
  files: Files,
  audio: Music2,
  link: Link2,
  voice: Mic,
} as const

function FileRow({ file }: { file: FileCategory }) {
  const [open, setOpen] = useState(false)
  const Icon = iconMap[file.icon]
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl py-1 text-left transition-colors hover:text-purple"
      >
        <span className="flex items-center gap-3">
          <Icon className="size-[22px] text-ink" />
          <span className="text-[15px] text-ink">{file.label}</span>
        </span>
        <ChevronDown
          className={cn(
            'size-5 text-ink-soft transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div className="mt-1 pl-9 text-[13px] text-ink-soft">
          <p>No items to preview yet.</p>
        </div>
      )}
    </div>
  )
}

function FilesCard({
  conversation,
  title,
  onClose,
}: {
  conversation: Conversation
  title: string
  onClose?: () => void
}) {
  const [photosOpen, setPhotosOpen] = useState(true)
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[18px] font-bold text-ink italic">{title}</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full bg-purple/10 text-purple transition-colors hover:bg-purple hover:text-white"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <p className="mt-5 text-[15px] font-semibold text-ink">Files</p>

      <button
        type="button"
        onClick={() => setPhotosOpen((v) => !v)}
        className="mt-3 flex w-full items-center justify-between"
      >
        <span className="flex items-center gap-3">
          <Images className="size-[22px] text-ink" />
          <span className="text-[15px] text-ink">265 photos</span>
        </span>
        {photosOpen ? (
          <ChevronUp className="size-5 text-ink-soft" />
        ) : (
          <ChevronDown className="size-5 text-ink-soft" />
        )}
      </button>

      {photosOpen && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Image
            src="/file-building.png"
            alt="Building photo"
            width={150}
            height={96}
            className="h-24 w-full rounded-2xl object-cover"
          />
          <Image
            src="/file-desk.png"
            alt="Desk photo"
            width={150}
            height={96}
            className="h-24 w-full rounded-2xl object-cover"
          />
        </div>
      )}

      <div className="mt-4 space-y-3">
        {conversation.files?.map((file) => (
          <FileRow key={file.label} file={file} />
        ))}
      </div>
    </div>
  )
}

function MembersCard({
  conversation,
  onClose,
}: {
  conversation: Conversation
  onClose?: () => void
}) {
  if (conversation.type !== 'group') return null

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[18px] font-bold text-ink italic">Members</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full bg-purple/10 text-purple transition-colors hover:bg-purple hover:text-white"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="mt-4 flex-1 space-y-1 overflow-y-auto">
        {conversation.members?.map((m) => (
          <div
            key={m.name}
            className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-purple-light/60"
          >
            <Image
              src={m.avatar || '/placeholder.svg'}
              alt={m.name}
              width={44}
              height={44}
              className="size-11 rounded-2xl object-cover"
            />
            <span className="flex-1 text-[15px] font-medium text-ink">
              {m.name}
            </span>
            {m.role ? (
              <span className="text-[13px] text-ink-soft">{m.role}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function ContactCard({
  conversation,
  onClose,
}: {
  conversation: Conversation
  onClose?: () => void
}) {
  const c = conversation.contact!
  return (
    <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
      <div className="mb-4 flex justify-end">
        {onClose && (
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full bg-purple/10 text-purple transition-colors hover:bg-purple hover:text-white"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <div className="relative mx-auto size-24">
        <Image
          src={conversation.avatar || '/placeholder.svg'}
          alt={conversation.title}
          width={96}
          height={96}
          className="size-24 rounded-3xl object-cover"
        />
      </div>
      <h2 className="mt-4 text-[20px] font-bold text-ink">
        {conversation.title}
      </h2>
      <p className="mt-0.5 text-[13px] text-purple">{c.status}</p>

      <div className="mt-6 space-y-4">
        <div className="flex items-start gap-3">
          <Phone className="mt-0.5 size-[20px] text-ink" />
          <div>
            <p className="text-[15px] text-ink">{c.phone}</p>
            <p className="text-[12px] text-ink-soft">Mobile</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <AtSign className="mt-0.5 size-[20px] text-ink" />
          <div>
            <p className="text-[15px] text-ink">{c.username}</p>
            <p className="text-[12px] text-ink-soft">Username</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 size-[20px] text-ink" />
          <div>
            <p className="text-[15px] leading-relaxed text-ink">{c.bio}</p>
            <p className="text-[12px] text-ink-soft">Bio</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function GroupInfo({
  conversation,
  onClose,
}: {
  conversation: Conversation
  onClose: () => void
}) {
  const isGroup = conversation.type === 'group'

  return (
    <aside className="hidden w-[360px] shrink-0 flex-col gap-4 xl:flex">
      {isGroup ? (
        <>
          <FilesCard
            conversation={conversation}
            title="Group Info"
            onClose={onClose}
          />
        </>
      ) : (
        <>
          <ContactCard conversation={conversation} onClose={onClose} />
          <FilesCard
            conversation={conversation}
            title="Shared Files"
            onClose={onClose}
          />
        </>
      )}

      {isGroup && <MembersCard conversation={conversation} />}
    </aside>
  )
}
