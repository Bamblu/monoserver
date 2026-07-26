'use client';

/**
 * DashboardSkeleton
 *
 * Matches the Figma "empty syncing state":
 *  - "Crunching your data..." label top left
 *  - 4 skeleton stat card blocks in a row (matching larger height)
 *  - 2 larger skeleton blocks below (radar + heatmap matching larger height)
 */
export function DashboardSkeleton({ isSyncing }: { isSyncing: boolean }) {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Status label */}
      <p className="text-slate-400 text-sm font-medium h-5">
        {isSyncing ? 'Crunching your data…' : 'Loading…'}
      </p>

      {/* Stat card skeletons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[96px] rounded-xl bg-[#111E35]"
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Main chart skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          className="h-[460px] rounded-xl bg-[#111E35]"
          aria-hidden="true"
        />
        <div
          className="h-[460px] rounded-xl bg-[#111E35]"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
