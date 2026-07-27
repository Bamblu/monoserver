/**
 * components/compare/CompareShell.tsx
 *
 * Premium Compare page shell with live GitHub user search.
 *
 * Features:
 *  - Live GitHub search via debounced API calls
 *  - Keyboard navigation (↑↓ Enter Esc)
 *  - Loading skeletons during profile resolution
 *  - Recently searched users
 *  - Full side-by-side comparison with GitHub + CF stats
 *  - Skill radar overlay (user1 vs user2)
 *  - CF link status indicators
 *  - Rate limit and error state handling
 *  - Request cancellation on fast typing
 *  - Mobile responsive
 *  - Accessible (ARIA)
 */

'use client';

import * as React from 'react';
import { Search, Loader2, Users, ArrowRight, X, RefreshCw } from 'lucide-react';
import { SkillRadar } from '@/components/dashboard/SkillRadar';
import { SearchDropdown } from './SearchDropdown';
import { UserCompareCard, UserCompareCardSkeleton } from './UserCompareCard';
import { useGitHubSearch, getRecentSearches, addRecentSearch, type RecentSearch } from '@/hooks/useGitHubSearch';
import { useCompareProfile } from '@/hooks/useCompareProfile';
import type { CompareProfile } from '@/lib/types/compare';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserStats {
  name: string;
  username: string;
  github: { totalCommits: number; contributionStreak: number } | null;
  codeforces: { rating: number; rank: string; solvedCount: number } | null;
  skills: { name: string; level: number; category: string }[];
}

interface CompareShellProps {
  user1: UserStats;
}

// ─── User1 as CompareProfile ──────────────────────────────────────────────────

function adaptUser1(user1: UserStats): CompareProfile {
  return {
    login: user1.username,
    displayName: user1.name,
    avatarUrl: `https://avatars.githubusercontent.com/${user1.username}`,
    htmlUrl: `https://github.com/${user1.username}`,
    bio: null,
    location: null,
    website: null,
    isBambluUser: true,
    github: {
      totalRepos: 0,
      totalStars: 0,
      followers: 0,
      following: 0,
      totalCommits: user1.github?.totalCommits ?? 0,
      contributionStreak: user1.github?.contributionStreak ?? 0,
      topLanguages: [],
    },
    codeforces: user1.codeforces
      ? {
          handle: '',
          rating: user1.codeforces.rating,
          maxRating: user1.codeforces.rating,
          rank: user1.codeforces.rank,
          maxRank: user1.codeforces.rank,
          solvedCount: user1.codeforces.solvedCount,
          contestCount: 0,
          ratingHistory: [],
          tagFrequency: {},
          difficultyDistribution: [],
        }
      : null,
    cfLinkStatus: user1.codeforces ? 'linked' : 'not_linked',
    cfLinkConfidence: user1.codeforces ? 100 : 0,
    skills: user1.skills,
  };
}

// ─── Stat Comparison Row ──────────────────────────────────────────────────────

function CompareStatRow({
  label,
  value1,
  value2,
  accent1 = '#06B6D4',
  accent2 = '#F59E0B',
  formatValue,
  higherIsBetter = true,
}: {
  label: string;
  value1: number;
  value2: number;
  accent1?: string;
  accent2?: string;
  formatValue?: (v: number) => string;
  higherIsBetter?: boolean;
}) {
  const fmt = formatValue ?? ((v: number) => v.toLocaleString());
  const v1Wins = higherIsBetter ? value1 >= value2 : value1 <= value2;
  const v2Wins = higherIsBetter ? value2 >= value1 : value2 <= value1;
  const isTie = value1 === value2;
  const maxVal = Math.max(value1, value2, 1);
  const pct1 = Math.round((value1 / maxVal) * 100);
  const pct2 = Math.round((value2 / maxVal) * 100);

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-3 border-b border-white/[0.05] last:border-0">
      {/* User 1 */}
      <div className="text-right space-y-1">
        <div className="flex items-center justify-end gap-2">
          {!isTie && v1Wins && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 rounded-full px-1.5 py-0.5">▲</span>
          )}
          <span className="text-base font-bold" style={{ color: v1Wins && !isTie ? accent1 : undefined }}>
            {fmt(value1)}
          </span>
        </div>
        <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
          <div
            className="h-full rounded-full ml-auto transition-all duration-700"
            style={{ width: `${pct1}%`, backgroundColor: accent1, opacity: 0.6 }}
          />
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <span className="text-xs font-medium text-slate-500 whitespace-nowrap">{label}</span>
      </div>

      {/* User 2 */}
      <div className="text-left space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold" style={{ color: v2Wins && !isTie ? accent2 : undefined }}>
            {fmt(value2)}
          </span>
          {!isTie && v2Wins && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 rounded-full px-1.5 py-0.5">▲</span>
          )}
        </div>
        <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct2}%`, backgroundColor: accent2, opacity: 0.6 }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Shell ───────────────────────────────────────────────────────────────

export function CompareShell({ user1 }: CompareShellProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [selectedUsername, setSelectedUsername] = React.useState<string | null>(null);
  const [recentSearches, setRecentSearches] = React.useState<RecentSearch[]>([]);
  const [showRadarOverlay, setShowRadarOverlay] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const { suggestions, isLoading: searchLoading, error: searchError, isRateLimited } =
    useGitHubSearch(inputValue);

  const { profile: user2Profile, isLoading: profileLoading, error: profileError } =
    useCompareProfile(selectedUsername);

  const user1Profile = React.useMemo(() => adaptUser1(user1), [user1]);

  // Load recent searches on mount
  React.useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Open dropdown when typing
  React.useEffect(() => {
    if (inputValue.trim()) {
      setIsDropdownOpen(true);
      setActiveIndex(-1);
    }
  }, [inputValue]);

  // Show recent searches when focused with empty input
  const handleFocus = () => {
    if (!inputValue.trim() && recentSearches.length > 0) {
      setIsDropdownOpen(true);
    } else if (inputValue.trim()) {
      setIsDropdownOpen(true);
    }
  };

  // Select a user from suggestions
  const handleSelect = React.useCallback((login: string) => {
    setInputValue(login);
    setIsDropdownOpen(false);
    setActiveIndex(-1);
    setSelectedUsername(login);

    // Save to recent searches
    const ghSuggestion = suggestions.find((s) => s.login === login);
    if (ghSuggestion) {
      addRecentSearch(ghSuggestion);
    } else {
      // User selected from recent searches — reconstruct minimal GitHubSuggestion
      addRecentSearch({
        login,
        avatar_url: `https://avatars.githubusercontent.com/${login}`,
        html_url: `https://github.com/${login}`,
        isBambluUser: false,
      });
    }
    setRecentSearches(getRecentSearches());
  }, [suggestions]);

  // Keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const allItems = inputValue.trim()
        ? suggestions
        : recentSearches.map((r) => ({ login: r.login }));
      const count = allItems.length;

      if (!isDropdownOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          setIsDropdownOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev + 1) % count);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev <= 0 ? count - 1 : prev - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < count) {
            handleSelect(allItems[activeIndex].login);
          } else if (inputValue.trim()) {
            handleSelect(inputValue.trim());
          }
          break;
        case 'Escape':
          setIsDropdownOpen(false);
          setActiveIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [isDropdownOpen, inputValue, suggestions, recentSearches, activeIndex, handleSelect]
  );

  // Close dropdown on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const clearUser2 = () => {
    setSelectedUsername(null);
    setInputValue('');
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const isComparing = !!user2Profile;
  const isLoading = profileLoading;

  return (
    <div className="w-full space-y-6 animate-fade-in flex flex-col flex-1">
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Compare Developers</h1>
          <p className="text-slate-400 text-sm mt-1">
            Search any GitHub user to compare skills, stats, and competitive programming history.
          </p>
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-80" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <input
              ref={inputRef}
              id="compare-search-input"
              type="text"
              role="combobox"
              aria-expanded={isDropdownOpen}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-label="Search GitHub users to compare"
              placeholder="Search any GitHub username…"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (!e.target.value.trim()) setSelectedUsername(null);
              }}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              className="w-full rounded-xl bg-[#0F1929] border border-white/10 px-4 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
            {/* Right icon: loading or clear */}
            {searchLoading ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 animate-spin" />
            ) : inputValue ? (
              <button
                onClick={clearUser2}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 hover:text-slate-300 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {/* Dropdown */}
          <SearchDropdown
            query={inputValue}
            suggestions={suggestions}
            recentSearches={recentSearches}
            isLoading={searchLoading}
            isOpen={isDropdownOpen}
            error={searchError}
            isRateLimited={isRateLimited}
            activeIndex={activeIndex}
            onSelect={handleSelect}
            onClose={() => setIsDropdownOpen(false)}
          />
        </div>
      </div>

      {/* ─── Profile Resolve Error ────────────────────────────────────────────── */}
      {profileError && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400 flex items-center gap-3 shrink-0">
          <span className="flex-1">{profileError}</span>
          <button
            onClick={() => selectedUsername && setSelectedUsername(selectedUsername)}
            className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition-colors flex-shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* ─── Empty State ──────────────────────────────────────────────────────── */}
      {!isComparing && !isLoading && !selectedUsername && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0F1929] flex-1 flex flex-col items-center justify-center text-center p-8 gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
            <Users className="h-8 w-8 text-slate-600" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h2 className="text-white font-semibold text-lg">Search any GitHub user</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Compare with any public GitHub account. We'll automatically find their Codeforces profile too.
            </p>
          </div>
          <div className="flex items-center gap-3 text-slate-600 text-xs">
            <span>Try</span>
            {['torvalds', 'sindresorhus', 'gaearon'].map((name) => (
              <button
                key={name}
                onClick={() => {
                  setInputValue(name);
                  setSelectedUsername(name);
                  inputRef.current?.focus();
                }}
                className="text-cyan-500/70 hover:text-cyan-400 transition-colors font-mono"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Loading State (resolving profile) ───────────────────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1">
          <UserCompareCard profile={user1Profile} accentColor="#06B6D4" label="You" />
          <UserCompareCardSkeleton accentColor="#F59E0B" />
        </div>
      )}

      {/* ─── Comparison View ──────────────────────────────────────────────────── */}
      {isComparing && user2Profile && !isLoading && (
        <div className="space-y-6 flex-1 flex flex-col">
          {/* VS Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">
                <span className="text-cyan-400">{user1Profile.displayName ?? user1Profile.login}</span>
                <span className="text-slate-500 font-normal mx-3 text-base">vs</span>
                <span className="text-amber-400">{user2Profile.displayName ?? user2Profile.login}</span>
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span>You</span>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-600" />
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span>{user2Profile.login}</span>
                </div>
              </div>
              <button
                onClick={() => setShowRadarOverlay((v) => !v)}
                className="text-xs text-slate-500 hover:text-slate-300 border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 transition-all"
              >
                {showRadarOverlay ? 'Show Stats' : 'Skill Radar'}
              </button>
            </div>
          </div>

          {showRadarOverlay ? (
            /* ─ Skill Radar Side-by-Side ─ */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
              <div>
                <p className="text-xs font-semibold text-cyan-400 mb-2 text-center">
                  {user1Profile.displayName ?? user1Profile.login}
                </p>
                <SkillRadar skills={user1.skills} color="#06B6D4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-400 mb-2 text-center">
                  {user2Profile.displayName ?? user2Profile.login}
                </p>
                <SkillRadar skills={user2Profile.skills} color="#F59E0B" />
              </div>
            </div>
          ) : (
            /* ─ Stats Comparison ─ */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
              {/* User 1 Card */}
              <UserCompareCard
                profile={user1Profile}
                accentColor="#06B6D4"
                label="You"
              />

              {/* Head-to-Head Stats */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#0a1628]/80 p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 text-center">
                  Head-to-Head
                </h3>
                <div className="space-y-0">
                  {/* GitHub Stats */}
                  {(user1Profile.github || user2Profile.github) && (
                    <>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-2 mt-1">
                        GitHub
                      </p>
                      <CompareStatRow
                        label="Repos"
                        value1={user1Profile.github.totalRepos}
                        value2={user2Profile.github.totalRepos}
                      />
                      <CompareStatRow
                        label="Stars"
                        value1={user1Profile.github.totalStars}
                        value2={user2Profile.github.totalStars}
                      />
                      <CompareStatRow
                        label="Followers"
                        value1={user1Profile.github.followers}
                        value2={user2Profile.github.followers}
                      />
                      <CompareStatRow
                        label="Est. Commits"
                        value1={user1Profile.github.totalCommits}
                        value2={user2Profile.github.totalCommits}
                      />
                    </>
                  )}

                  {/* Codeforces Stats */}
                  {(user1Profile.codeforces || user2Profile.codeforces) && (
                    <>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-2 mt-4">
                        Codeforces
                      </p>
                      <CompareStatRow
                        label="Rating"
                        value1={user1Profile.codeforces?.rating ?? 0}
                        value2={user2Profile.codeforces?.rating ?? 0}
                        accent1="#06B6D4"
                        accent2="#F59E0B"
                      />
                      <CompareStatRow
                        label="Max Rating"
                        value1={user1Profile.codeforces?.maxRating ?? 0}
                        value2={user2Profile.codeforces?.maxRating ?? 0}
                      />
                      <CompareStatRow
                        label="Solved"
                        value1={user1Profile.codeforces?.solvedCount ?? 0}
                        value2={user2Profile.codeforces?.solvedCount ?? 0}
                      />
                      <CompareStatRow
                        label="Contests"
                        value1={user1Profile.codeforces?.contestCount ?? 0}
                        value2={user2Profile.codeforces?.contestCount ?? 0}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* User 2 Card */}
              <UserCompareCard
                profile={user2Profile}
                accentColor="#F59E0B"
                label={user2Profile.isBambluUser ? 'Bamblu User' : 'GitHub User'}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
