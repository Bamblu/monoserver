/**
 * components/compare/SearchDropdown.tsx
 *
 * Premium search dropdown for GitHub user discovery.
 * Features: keyboard navigation, loading skeletons, Bamblu badge, empty state.
 */

'use client';

import * as React from 'react';
import Image from 'next/image';
import { Loader2, Search, Clock, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import type { GitHubSuggestion, RecentSearch } from '@/hooks/useGitHubSearch';

interface SearchDropdownProps {
  query: string;
  suggestions: GitHubSuggestion[];
  recentSearches: RecentSearch[];
  isLoading: boolean;
  isOpen: boolean;
  error: string | null;
  isRateLimited: boolean;
  activeIndex: number;
  onSelect: (login: string) => void;
  onClose: () => void;
}

function AvatarImage({ src, login, size = 32 }: { src: string; login: string; size?: number }) {
  const [error, setError] = React.useState(false);
  if (error) {
    return (
      <div
        className="rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/30 flex items-center justify-center text-xs font-bold text-white border border-white/10"
        style={{ width: size, height: size }}
      >
        {login[0]?.toUpperCase()}
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={login}
      width={size}
      height={size}
      className="rounded-full border border-white/10"
      onError={() => setError(true)}
    />
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-white/10 rounded w-24" />
        <div className="h-2.5 bg-white/[0.06] rounded w-16" />
      </div>
    </div>
  );
}

export function SearchDropdown({
  query,
  suggestions,
  recentSearches,
  isLoading,
  isOpen,
  error,
  isRateLimited,
  activeIndex,
  onSelect,
  onClose,
}: SearchDropdownProps) {
  if (!isOpen) return null;

  const showRecent = !query.trim() && recentSearches.length > 0;
  const showSuggestions = query.trim().length > 0;
  const hasResults = suggestions.length > 0;
  const isEmpty = showSuggestions && !isLoading && !hasResults && !error && !isRateLimited;

  return (
    <div
      role="listbox"
      aria-label="GitHub user suggestions"
      className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-white/10 bg-[#0a1628]/95 backdrop-blur-xl shadow-2xl shadow-black/40 z-50 overflow-hidden"
    >
      {/* Rate Limit State */}
      {isRateLimited && (
        <div className="px-4 py-4 flex items-center gap-3 text-amber-400/80 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Search is temporarily rate-limited. Please wait a moment and try again.</span>
        </div>
      )}

      {/* Error State */}
      {error && !isRateLimited && (
        <div className="px-4 py-4 flex items-center gap-3 text-rose-400/80 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )}

      {/* Recent Searches */}
      {showRecent && !isLoading && (
        <>
          <div className="px-4 pt-3 pb-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Recent
            </p>
          </div>
          {recentSearches.map((recent, idx) => (
            <button
              key={recent.login}
              role="option"
              aria-selected={idx === activeIndex}
              onClick={() => onSelect(recent.login)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                idx === activeIndex
                  ? 'bg-cyan-500/10 text-white'
                  : 'text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              <div className="relative flex-shrink-0">
                <AvatarImage src={recent.avatar_url} login={recent.login} size={32} />
                <Clock className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 text-slate-400 bg-[#0a1628] rounded-full p-0.5" />
              </div>
              <span className="font-medium text-sm">{recent.login}</span>
            </button>
          ))}
          <div className="border-t border-white/[0.06] my-1" />
        </>
      )}

      {/* GitHub Suggestions */}
      {showSuggestions && !isLoading && hasResults && (
        <>
          <div className="px-4 pt-3 pb-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Search className="h-3 w-3" />
              GitHub Users
            </p>
          </div>
          {suggestions.map((suggestion, idx) => (
            <button
              key={suggestion.login}
              role="option"
              aria-selected={idx === activeIndex}
              onClick={() => onSelect(suggestion.login)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                idx === activeIndex
                  ? 'bg-cyan-500/10 text-white'
                  : 'text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              <AvatarImage src={suggestion.avatar_url} login={suggestion.login} size={32} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{suggestion.login}</span>
                  {suggestion.isBambluUser && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded-full px-1.5 py-0.5 flex-shrink-0">
                      <Zap className="h-2.5 w-2.5" />
                      Bamblu
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">github.com/{suggestion.login}</p>
              </div>
              <CheckCircle2
                className={`h-4 w-4 flex-shrink-0 transition-opacity ${
                  idx === activeIndex ? 'opacity-100 text-cyan-400' : 'opacity-0'
                }`}
              />
            </button>
          ))}
        </>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="px-4 py-6 text-center">
          <Search className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No GitHub users found for "{query}"</p>
          <p className="text-slate-600 text-xs mt-1">Try a different username or handle</p>
        </div>
      )}

      {/* Footer hint */}
      {(hasResults || showRecent) && !isLoading && (
        <div className="border-t border-white/[0.06] px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-600">↑↓ navigate · Enter select · Esc close</span>
          <span className="text-[10px] text-slate-600">Powered by GitHub</span>
        </div>
      )}
    </div>
  );
}
