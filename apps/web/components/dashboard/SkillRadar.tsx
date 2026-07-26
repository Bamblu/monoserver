'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';

interface SkillRow {
  name: string;
  level: number;
  category: string;
}

interface SkillRadarProps {
  skills: SkillRow[];
  color?: string;
}

const FIGMA_DEFAULT_AXES = [
  { subject: 'DP', level: 0 },
  { subject: 'Graphs', level: 0 },
  { subject: 'Greedy', level: 0 },
  { subject: 'Binary Search', level: 0 },
  { subject: 'Maths', level: 0 },
  { subject: 'Strings', level: 0 },
];

export function SkillRadar({ skills, color = '#06B6D4' }: SkillRadarProps) {
  const hasSkills = skills.length > 0;

  const data = hasSkills
    ? skills
        .slice()
        .sort((a, b) => b.level - a.level)
        .slice(0, 6)
        .map((s) => ({ subject: s.name, level: Math.round(s.level) }))
    : FIGMA_DEFAULT_AXES;

  return (
    <section
      id="skill-radar"
      aria-label="Skill radar chart"
      className="rounded-xl bg-[#0F1929] border border-white/[0.06] p-6 flex flex-col gap-4 flex-1 h-full min-h-[460px]"
    >
      <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider shrink-0">
        Skill Radar
      </h2>

      <div className="flex-1 flex items-center justify-center w-full min-h-[420px]">
        <ResponsiveContainer width="100%" height={420}>
          <RadarChart data={data} outerRadius="82%">
            <PolarGrid
              stroke="rgba(255,255,255,0.08)"
              gridType="polygon"
            />
            <PolarAngleAxis
              dataKey="subject"
              tick={{
                fontSize: 13,
                fill: 'rgba(148,163,184,0.9)',
                fontWeight: 500,
              }}
            />
            <Radar
              name="Level"
              dataKey="level"
              stroke={color}
              fill={color}
              fillOpacity={0.18}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
