'use client';

import { useMemo } from 'react';
import { buildYearHeatmap } from '@bamblu/utils';

interface ActivityHeatmapProps {
  heatmapData?: Record<string, number>;
}

// Figma colors: from dark teal to bright cyan/teal squares
const CELL_COLORS = [
  '#0F1929',       // 0 contributions — matches card bg (empty cell)
  '#0F4C5C',       // 1-2 — dark teal
  '#0E7490',       // 3-5 — mid teal
  '#06B6D4',       // 6-10 — bright cyan
  '#22D3EE',       // 11+ — light cyan (brightest)
];

function getColorIndex(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

export function ActivityHeatmap({ heatmapData }: ActivityHeatmapProps) {
  const days = useMemo(() => {
    const contributions = heatmapData
      ? Object.entries(heatmapData).map(([date, count]) => ({ date, count }))
      : [];
    return buildYearHeatmap(contributions);
  }, [heatmapData]);

  // Group into weeks (columns of 7 rows)
  const weeks = useMemo(() => {
    const result: (typeof days[number])[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  // Show recent 38 weeks to fill horizontal container space
  const visibleWeeks = weeks.slice(-38);

  return (
    <section
      id="activity-heatmap"
      aria-label="GitHub contribution heatmap"
      className="rounded-xl bg-[#0F1929] border border-white/[0.06] p-6 flex flex-col gap-4 flex-1 h-full min-h-[460px]"
    >
      <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider shrink-0">
        Activity Heatmap
      </h2>

      {/* Grid */}
      <div className="flex-1 flex items-center justify-center overflow-x-auto w-full py-4 min-h-[380px]">
        <div className="flex gap-[6px] min-w-max">
          {visibleWeeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[6px]">
              {week.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count} contributions`}
                  aria-label={`${day.date}: ${day.count} contributions`}
                  style={{
                    backgroundColor: CELL_COLORS[getColorIndex(day.count)],
                  }}
                  className="h-[20px] w-[20px] rounded-[4px] transition-opacity hover:opacity-80"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
