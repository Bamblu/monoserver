'use client';

import * as React from 'react';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { StatCard } from './StatCard';
import { SkillRadar } from './SkillRadar';
import { ActivityHeatmap } from './ActivityHeatmap';
import { DashboardSkeleton } from './DashboardSkeleton';

// ─── Types (mirrored from Drizzle schema) ─────────────────────────────────────

interface GitHubStats {
  totalCommits: number;
  contributionStreak: number;
  contributionHeatmap?: Record<string, number> | null;
}

interface CodeforcesStats {
  rating: number;
  solvedCount: number;
  ratingHistory?: object[] | null;
}

interface Skill {
  name: string;
  level: number;
  category: string;
}

interface DashboardShellProps {
  userId: string;
  ghStats: GitHubStats | null;
  cfStats: CodeforcesStats | null;
  skills: Skill[];
  syncStatus: string;
  lastSyncedAt: string | null;
  hasData: boolean;
}

/**
 * DashboardShell
 *
 * Client component that:
 *  1. Auto-triggers synchronization on mount if no cached data exists.
 *  2. Shows a "Crunching your data..." skeleton when syncing or no data.
 *  3. Renders the Figma-matching dashboard layout with live stat cards.
 *  4. Handles manual sync via useSyncStatus hook.
 *  5. Bypasses React date hydration mismatches via mounted state checks.
 *  6. Stretches vertically using flexbox to fill the entire screen height.
 */
export function DashboardShell({
  userId,
  ghStats,
  cfStats,
  skills,
  syncStatus: initialSyncStatus,
  lastSyncedAt,
  hasData,
}: DashboardShellProps) {
  const [mounted, setMounted] = React.useState(false);
  
  const { isSyncing, triggerSync, syncStatus } = useSyncStatus({
    userId,
    initialStatus: initialSyncStatus,
  });

  // Track hydration mount state
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-trigger sync on mount if no stats data exists
  React.useEffect(() => {
    if (!hasData) {
      triggerSync(['github', 'codeforces']);
    }
  }, [hasData, triggerSync]);

  const showSkeleton = isSyncing || syncStatus === 'syncing' || !hasData;

  if (showSkeleton) {
    // Pass isSyncing = true if we are syncing OR if we have no data, so it displays "Crunching your data..."
    return <DashboardSkeleton isSyncing={isSyncing || syncStatus === 'syncing' || !hasData} />;
  }

  return (
    <div className="flex flex-col flex-1 gap-4 animate-fade-in h-full">
      {/* ── Stat Cards Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <StatCard
          id="stat-problems-solved"
          label="Problems Solved"
          value={cfStats?.solvedCount ?? 0}
        />
        <StatCard
          id="stat-active-days"
          label="Active Days"
          value={ghStats?.contributionStreak ?? 0}
        />
        <StatCard
          id="stat-contest-rating"
          label="Contest Rating"
          value={cfStats?.rating ?? 0}
        />
        <StatCard
          id="stat-github-contrib"
          label="GitHub Contrib."
          value={ghStats?.totalCommits ?? 0}
        />
      </div>

      {/* ── Main Content Row: Skill Radar + Activity Heatmap ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        <SkillRadar skills={skills} />
        <ActivityHeatmap heatmapData={ghStats?.contributionHeatmap ?? undefined} />
      </div>

      {/* ── Sync status footer ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-1 shrink-0">
        {lastSyncedAt && mounted && (
          <p className="text-xs text-slate-500">
            Last synced:{' '}
            {new Date(lastSyncedAt).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
        <button
          id="manual-sync-btn"
          onClick={() => triggerSync(['github', 'codeforces'])}
          disabled={isSyncing}
          className="text-xs text-slate-400 hover:text-[#06B6D4] transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          {isSyncing ? 'Syncing…' : 'Sync now'}
        </button>
      </div>
    </div>
  );
}
