/**
 * hooks/useGitHubSearch.ts
 *
 * Custom hook for live GitHub user search with:
 *  - Debouncing (300ms)
 *  - AbortController (request cancellation on fast typing)
 *  - In-memory suggestion cache (Map with TTL)
 *  - Recently searched users (localStorage)
 *  - Loading and error states
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from './useDebounce';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GitHubSuggestion {
  login: string;
  avatar_url: string;
  html_url: string;
  isBambluUser: boolean;
}

export interface RecentSearch {
  login: string;
  avatar_url: string;
  searchedAt: number;
}

interface SearchState {
  suggestions: GitHubSuggestion[];
  isLoading: boolean;
  error: string | null;
  isRateLimited: boolean;
}

// ─── In-Memory Cache ──────────────────────────────────────────────────────────

interface CacheEntry {
  data: GitHubSuggestion[];
  expiresAt: number;
}

const memCache = new Map<string, CacheEntry>();
const MEM_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

function getCached(query: string): GitHubSuggestion[] | null {
  const entry = memCache.get(query.toLowerCase());
  if (!entry || Date.now() > entry.expiresAt) {
    memCache.delete(query.toLowerCase());
    return null;
  }
  return entry.data;
}

function setMemCache(query: string, data: GitHubSuggestion[]): void {
  memCache.set(query.toLowerCase(), { data, expiresAt: Date.now() + MEM_CACHE_TTL_MS });
}

// ─── Recent Searches ──────────────────────────────────────────────────────────

const RECENT_KEY = 'bamblu:compare:recent';
const MAX_RECENT = 5;

export function getRecentSearches(): RecentSearch[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function addRecentSearch(suggestion: GitHubSuggestion): void {
  if (typeof window === 'undefined') return;
  try {
    const recent = getRecentSearches().filter((r) => r.login !== suggestion.login);
    const updated: RecentSearch[] = [
      { login: suggestion.login, avatar_url: suggestion.avatar_url, searchedAt: Date.now() },
      ...recent,
    ].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGitHubSearch(query: string) {
  const debouncedQuery = useDebounce(query, 300);
  const abortRef = useRef<AbortController | null>(null);

  const [state, setState] = useState<SearchState>({
    suggestions: [],
    isLoading: false,
    error: null,
    isRateLimited: false,
  });

  useEffect(() => {
    const trimmed = debouncedQuery.trim();

    // Reset on empty query
    if (!trimmed) {
      setState({ suggestions: [], isLoading: false, error: null, isRateLimited: false });
      return;
    }

    // Check in-memory cache
    const cached = getCached(trimmed);
    if (cached) {
      setState({ suggestions: cached, isLoading: false, error: null, isRateLimited: false });
      return;
    }

    // Cancel previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    (async () => {
      try {
        const res = await fetch(
          `/api/compare/search?q=${encodeURIComponent(trimmed)}&limit=8`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          if (res.status === 429) {
            setState({ suggestions: [], isLoading: false, error: null, isRateLimited: true });
            return;
          }
          const body = await res.json().catch(() => ({})) as { error?: string };
          setState({
            suggestions: [],
            isLoading: false,
            error: body.error ?? 'Search failed. Please try again.',
            isRateLimited: false,
          });
          return;
        }

        const data = await res.json() as { success: boolean; suggestions: GitHubSuggestion[] };
        const suggestions = data.suggestions ?? [];

        setMemCache(trimmed, suggestions);
        setState({ suggestions, isLoading: false, error: null, isRateLimited: false });
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') return; // Cancelled — ignore
        setState({
          suggestions: [],
          isLoading: false,
          error: 'Network error. Please check your connection.',
          isRateLimited: false,
        });
      }
    })();

    return () => controller.abort();
  }, [debouncedQuery]);

  return state;
}
