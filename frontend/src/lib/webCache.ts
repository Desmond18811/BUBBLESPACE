// Tiny localStorage-backed cache for instant cold-start paint, mirroring the
// Expo app's chatCache. We persist the last-known value of a few frequently
// visited reads (profile, chat list) so a full page reload can render immediately
// from cache while the network revalidates in the background.
//
// This is a UX accelerator, not a source of truth — every consumer still fetches
// fresh data and overwrites the cache. Entries are namespaced per user to avoid
// leaking one account's data into another on the same browser.

type Entry<T> = { ts: number; data: T };

const PREFIX = 'bubble_webcache_v1';

const keyFor = (userId: string | undefined, name: string) =>
  `${PREFIX}:${userId || 'anon'}:${name}`;

/**
 * Read a cached value. Returns null when absent, expired, or unreadable.
 * `maxAgeMs` lets each caller decide how stale is acceptable for seeding.
 */
export function readCache<T>(userId: string | undefined, name: string, maxAgeMs = 1000 * 60 * 60): T | null {
  try {
    const raw = localStorage.getItem(keyFor(userId, name));
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    if (!entry || typeof entry.ts !== 'number') return null;
    if (Date.now() - entry.ts > maxAgeMs) return null;
    return entry.data;
  } catch {
    return null;
  }
}

/** Persist a value for later cold-start seeding. Best-effort; never throws. */
export function writeCache<T>(userId: string | undefined, name: string, data: T): void {
  try {
    const entry: Entry<T> = { ts: Date.now(), data };
    localStorage.setItem(keyFor(userId, name), JSON.stringify(entry));
  } catch {
    // Quota or serialization failure — caching is optional, so swallow.
  }
}

/** Drop a single cached entry (e.g. on logout or known invalidation). */
export function clearCache(userId: string | undefined, name: string): void {
  try {
    localStorage.removeItem(keyFor(userId, name));
  } catch {
    /* ignore */
  }
}

export const CACHE_KEYS = {
  chats: 'chats',
  profile: 'profile',
  contacts: 'contacts',
  callLogs: 'callLogs',
  coworkers: 'coworkers',
} as const;
