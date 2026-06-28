import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const API_BASE = ((import.meta as any).env?.VITE_API_URL?.replace(/\/api\/v1\/?$/, '')?.replace(/ i$/, '')?.trim()) || 'https://bubble-backend-production-96a0.up.railway.app'

/**
 * Normalizes a media URL from the backend so it always resolves correctly:
 * - Full http/https URLs are returned as-is
 * - Relative paths like /uploads/... get the API base prepended
 * - blob:, empty, or null values return null
 */
export function getSecureMediaUrl(url?: string | null): string | null {
  if (!url) return null
  if (url.startsWith('blob:')) return url
  
  if (url.includes('s3.filebase.com') || url.includes('filebase.com')) {
    const encoded = encodeURIComponent(url)
    return `${API_BASE}/api/v1/message/media/proxy?url=${encoded}`
  }

  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/')) return `${API_BASE}${url}`
  return url
}


/**
 * Guards live conversation merges against a partial member list. A `chat_updated`
 * payload, a `new_chat` insert, or a stale cache entry can carry a trimmed or
 * id-only `users` array; accepting it would shrink a known-good list and make
 * GroupInfo show the wrong count / only your contacts. Returns true only when
 * `incoming` is a populated array of member objects at least as large as the
 * list we already trust.
 */
export function isFullMemberList(incoming: any, existing: any): boolean {
  if (!Array.isArray(incoming) || incoming.length === 0) return false
  const hasObjects = incoming.every((u: any) => u && typeof u === 'object' && (u._id || u.id))
  if (!hasObjects) return false
  const existingLen = Array.isArray(existing) ? existing.length : 0
  return incoming.length >= existingLen
}
