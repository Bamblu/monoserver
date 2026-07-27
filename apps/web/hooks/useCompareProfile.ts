/**
 * hooks/useCompareProfile.ts
 *
 * Hook for fetching and caching full CompareProfile data.
 * Handles loading, error, and optimistic UI states.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import type { CompareProfile } from '@/lib/types/compare';

interface ProfileState {
  profile: CompareProfile | null;
  isLoading: boolean;
  error: string | null;
  isRateLimited: boolean;
}

// In-memory profile cache (session-scoped)
const profileCache = new Map<string, { data: CompareProfile; fetchedAt: number }>();
const PROFILE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCachedProfile(username: string): CompareProfile | null {
  const entry = profileCache.get(username.toLowerCase());
  if (!entry || Date.now() - entry.fetchedAt > PROFILE_TTL_MS) {
    profileCache.delete(username.toLowerCase());
    return null;
  }
  return entry.data;
}

export function useCompareProfile(username: string | null) {
  const abortRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<ProfileState>({
    profile: null,
    isLoading: false,
    error: null,
    isRateLimited: false,
  });

  useEffect(() => {
    if (!username) {
      setState({ profile: null, isLoading: false, error: null, isRateLimited: false });
      return;
    }

    // Check session cache first
    const cached = getCachedProfile(username);
    if (cached) {
      setState({ profile: cached, isLoading: false, error: null, isRateLimited: false });
      return;
    }

    // Cancel previous
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ profile: null, isLoading: true, error: null, isRateLimited: false });

    (async () => {
      try {
        const res = await fetch(
          `/api/compare/resolve?username=${encodeURIComponent(username)}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          if (res.status === 429) {
            setState({ profile: null, isLoading: false, error: null, isRateLimited: true });
            return;
          }
          const body = await res.json().catch(() => ({})) as { error?: string };
          setState({
            profile: null,
            isLoading: false,
            error: body.error ?? 'Failed to load profile.',
            isRateLimited: false,
          });
          return;
        }

        const data = await res.json() as { success: boolean; data: CompareProfile };
        const profile = data.data;

        profileCache.set(username.toLowerCase(), { data: profile, fetchedAt: Date.now() });
        setState({ profile, isLoading: false, error: null, isRateLimited: false });
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') return;
        setState({
          profile: null,
          isLoading: false,
          error: 'Network error. Please check your connection.',
          isRateLimited: false,
        });
      }
    })();

    return () => controller.abort();
  }, [username]);

  return state;
}
