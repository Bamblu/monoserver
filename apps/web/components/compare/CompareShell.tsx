'use client';

import * as React from 'react';
import { Search, Loader2 } from 'lucide-react';
import { SkillRadar } from '@/components/dashboard/SkillRadar';

interface UserStats {
  name: string;
  username: string;
  github: {
    totalCommits: number;
    contributionStreak: number;
  } | null;
  codeforces: {
    rating: number;
    rank: string;
    solvedCount: number;
  } | null;
  skills: {
    name: string;
    level: number;
    category: string;
  }[];
}

interface CompareShellProps {
  user1: UserStats;
}

export function CompareShell({ user1 }: CompareShellProps) {
  const [searchVal, setSearchVal] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [user2, setUser2] = React.useState<UserStats | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/search?username=${encodeURIComponent(searchVal.trim())}`);
      const result = await res.json();
      if (result.success && result.data) {
        setUser2(result.data);
      } else {
        setError(result.error || 'User not found or has not connected their account yet.');
        setUser2(null);
      }
    } catch (err) {
      setError('An error occurred while fetching user data.');
      setUser2(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8 animate-fade-in flex flex-col flex-1">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Compare Developers</h1>
          <p className="text-slate-400 text-sm mt-1">
            Compare stats and skill radars between developers.
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:max-w-xs">
          <input
            id="compare-search-input"
            type="text"
            placeholder="GitHub handle…"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full rounded-lg bg-[#0F1929] border border-white/10 px-4 py-2 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#06B6D4] transition-colors"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          {loading && (
            <Loader2 className="absolute right-3 top-2.5 h-4 w-4 text-slate-500 animate-spin" />
          )}
        </form>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400 shrink-0">
          {error}
        </div>
      )}

      {/* Comparison Panel */}
      {user2 ? (
        <div className="space-y-6 flex-1 flex flex-col justify-between">
          {/* Header row: User1 Name vs User2 Name & Legend */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 shrink-0">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <span>{user1.name}</span>
              <span className="text-slate-500 text-sm font-medium">vs</span>
              <span className="text-[#F59E0B]">{user2.name}</span>
            </h2>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="h-2 w-2 rounded-full bg-[#06B6D4]" />
                <span>{user1.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                <span>{user2.name}</span>
              </div>
            </div>
          </div>

          {/* Stats columns */}
          <div className="grid grid-cols-2 gap-8 py-2 shrink-0">
            {/* User 1 stats */}
            <div className="space-y-2 text-slate-300 text-sm">
              <p>Rating: <span className="font-semibold text-white">{user1.codeforces?.rating ?? 0}</span></p>
              <p>Rank: <span className="font-semibold text-[#06B6D4]">{user1.codeforces?.rank ?? 'Unrated'}</span></p>
              <p>Problems Solved: <span className="font-semibold text-white">{user1.codeforces?.solvedCount ?? 0}</span></p>
              <p>Active Days: <span className="font-semibold text-white">{user1.github?.contributionStreak ?? 0}</span></p>
            </div>

            {/* User 2 stats */}
            <div className="space-y-2 text-slate-300 text-sm">
              <p>Rating: <span className="font-semibold text-white">{user2.codeforces?.rating ?? 0}</span></p>
              <p>Rank: <span className="font-semibold text-[#F59E0B]">{user2.codeforces?.rank ?? 'Unrated'}</span></p>
              <p>Problems Solved: <span className="font-semibold text-white">{user2.codeforces?.solvedCount ?? 0}</span></p>
              <p>Active Days: <span className="font-semibold text-white">{user2.github?.contributionStreak ?? 0}</span></p>
            </div>
          </div>

          {/* Radars side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
            <SkillRadar skills={user1.skills} color="#06B6D4" />
            <SkillRadar skills={user2.skills} color="#F59E0B" />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-[#0F1929] p-8 flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-slate-400 text-sm">
            Enter another developer's GitHub handle in the top-right search box to start comparing.
          </p>
        </div>
      )}
    </div>
  );
}
