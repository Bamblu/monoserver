import { cn } from '@bamblu/utils';

interface StatCardProps {
  id: string;
  label: string;
  value: number | string;
  className?: string;
}

/**
 * StatCard — matches Figma design exactly.
 *
 * Layout (per Figma):
 *   ┌────────────────────────────┐
 *   │  Problems Solved           │
 *   │  487                       │
 *   └────────────────────────────┘
 *
 * Dark card (`#0F1929`) with muted label, large bold value.
 */
export function StatCard({ id, label, value, className }: StatCardProps) {
  const display = typeof value === 'number'
    ? value.toLocaleString()
    : value;

  return (
    <div
      id={id}
      className={cn(
        'rounded-xl bg-[#0F1929] border border-white/[0.06] px-6 py-5 flex flex-col gap-2 min-h-[96px] justify-center',
        className
      )}
    >
      <p className="text-[12px] font-medium text-slate-400 uppercase tracking-wider leading-none">
        {label}
      </p>
      <p className="text-[34px] font-bold text-white leading-none tracking-tight tabular-nums">
        {display}
      </p>
    </div>
  );
}
