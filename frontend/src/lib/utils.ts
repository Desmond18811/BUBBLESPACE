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
  if (url.startsWith('blob:')) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/')) return `${API_BASE}${url}`
  return url
}

