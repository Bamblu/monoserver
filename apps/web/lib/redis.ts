import { Redis } from '@upstash/redis';

const isPlaceholder =
  !process.env.UPSTASH_REDIS_REST_URL ||
  process.env.UPSTASH_REDIS_REST_URL.includes('placeholder') ||
  !process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN === 'placeholder';

export let redis: Redis | null = null;
if (!isPlaceholder) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  } catch (err) {
    console.warn('Failed to initialize Upstash Redis client:', err);
  }
} else {
  console.warn('Upstash Redis environment variables are placeholders. Cache/locking is mocked.');
}

// ─── Cache Key Factories ──────────────────────────────────────────────────────

export const cacheKeys = {
  userStats: (userId: string) => `bamblu:stats:${userId}` as const,
  userSkills: (userId: string) => `bamblu:skills:${userId}` as const,
  userRoadmap: (userId: string) => `bamblu:roadmap:${userId}` as const,
  cfStats: (handle: string) => `bamblu:cf:${handle}` as const,
  ghStats: (handle: string) => `bamblu:gh:${handle}` as const,
  card: (handle: string, theme: string) => `bamblu:card:${handle}:${theme}` as const,
  rateLimit: (ip: string) => `bamblu:rl:${ip}` as const,
  syncLock: (userId: string, source: string) => `bamblu:lock:sync:${userId}:${source}` as const,
  // ─── Compare / External Profile Search ──────────────────────────────────────
  ghSearchSuggestions: (q: string) => `bamblu:gh:search:${q.toLowerCase()}` as const,
  ghUserProfile: (username: string) => `bamblu:gh:profile:${username.toLowerCase()}` as const,
  ghUserRepos: (username: string) => `bamblu:gh:repos:${username.toLowerCase()}` as const,
  cfUserProfile: (handle: string) => `bamblu:cf:profile:${handle.toLowerCase()}` as const,
  cfUserSubmissions: (handle: string) => `bamblu:cf:subs:${handle.toLowerCase()}` as const,
  compareResult: (username: string) => `bamblu:compare:${username.toLowerCase()}` as const,
  compareRateLimit: (ip: string) => `bamblu:rl:compare:${ip}` as const,
} as const;

// ─── TTL Constants (seconds) ──────────────────────────────────────────────────

export const TTL = {
  SHORT: 60,           // 1 minute — live data
  MEDIUM: 5 * 60,     // 5 minutes — stats
  LONG: 60 * 60,      // 1 hour — card SVG, profile
  DAY: 24 * 60 * 60,  // 24 hours — expensive computations
} as const;

// ─── Typed Cache Helpers ──────────────────────────────────────────────────────

export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
  } catch (err) {
    console.warn(`[redis getCache] failed for ${key}:`, err);
    return null;
  }
}

export async function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    console.warn(`[redis setCache] failed for ${key}:`, err);
  }
}

export async function deleteCache(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.warn(`[redis deleteCache] failed for ${key}:`, err);
  }
}

/**
 * Acquires a distributed lock. Returns true if lock acquired.
 * Uses SET NX EX (atomic) to prevent race conditions on sync jobs.
 * Gracefully falls back to true if Redis is unavailable or unconfigured.
 */
export async function acquireLock(key: string, ttlSeconds = 120): Promise<boolean> {
  if (!redis) {
    // Return true to allow execution in local dev/mock mode
    return true;
  }
  try {
    const result = await redis.set(key, '1', { nx: true, ex: ttlSeconds });
    return result === 'OK';
  } catch (err) {
    console.warn(`[redis acquireLock] failed for ${key}, bypassing lock:`, err);
    return true;
  }
}

export async function releaseLock(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.warn(`[redis releaseLock] failed for ${key}:`, err);
  }
}
