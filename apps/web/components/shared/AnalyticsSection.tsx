'use client';

import React, { useState } from 'react';

// ── Demo Data ─────────────────────────────────────────────────────────────────

const RADAR_AXES = [
  { label: 'DP',            angle: -90,  value: 0.88 },
  { label: 'Graphs',        angle: -30,  value: 0.72 },
  { label: 'Greedy',        angle:  30,  value: 0.91 },
  { label: 'Binary Search', angle:  90,  value: 0.85 },
  { label: 'Maths',         angle: 150,  value: 0.79 },
  { label: 'Strings',       angle: 210,  value: 0.65 },
];
const C = 100; const R = 75;
function toXY(angle: number, r: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad) };
}
const radarPts = RADAR_AXES.map((a) => toXY(a.angle, R * a.value))
  .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
const rings = [0.33, 0.66, 1].map((s) =>
  RADAR_AXES.map((a) => toXY(a.angle, R * s))
    .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
);

const HEATMAP_COLORS = [
  'bg-slate-800/80', 'bg-cyan-900/70', 'bg-cyan-700/80',
  'bg-cyan-500', 'bg-teal-400',
];
const HEATMAP_GRID = [
  4,2,3,0,1,2,4, 2,4,1,0,3,1,3, 3,0,4,2,3,4,1,
  1,3,0,3,0,2,4, 2,4,2,1,1,2,1, 0,2,0,3,4,1,0,
  3,1,4,0,2,3,1, 4,0,2,4,1,0,3,
];

const RATING_MONTHS = ['Aug','Sep','Oct','Nov','Dec','Jan','Feb'];
const RATING_VALS   = [1450, 1520, 1490, 1580, 1620, 1590, 1680];
const R_MIN = 1400; const R_MAX = 1750; const CHART_W = 300; const CHART_H = 120;

function ratingY(v: number) {
  return CHART_H - ((v - R_MIN) / (R_MAX - R_MIN)) * CHART_H;
}
const ratingPolyline = RATING_VALS
  .map((v, i) => `${(i / (RATING_VALS.length - 1)) * CHART_W},${ratingY(v)}`)
  .join(' ');

const VERDICTS = [
  { label: 'Accepted',  value: 72, color: '#22d3ee' },
  { label: 'WA',        value: 16, color: '#f97316' },
  { label: 'TLE',       value:  8, color: '#a855f7' },
  { label: 'Other',     value:  4, color: '#475569' },
];

const STATS_TOP = [
  { label: 'Problems Solved', value: '487', delta: '+23 this month', up: true },
  { label: 'Contest Rating',  value: '1,680', delta: '+90 pts', up: true },
  { label: 'Active Streak',   value: '14 days', delta: 'Personal best 🔥', up: true },
  { label: 'GitHub Commits',  value: '342', delta: '+58 this month', up: true },
];

const DIFFICULTY_BARS = [
  { label: 'Easy',   solved: 182, total: 200, color: 'bg-emerald-400' },
  { label: 'Medium', solved: 215, total: 320, color: 'bg-yellow-400' },
  { label: 'Hard',   solved:  90, total: 200, color: 'bg-red-400' },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function AnalyticsSection() {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  return (
    <section
      id="analytics"
      className="w-full py-24 px-6 lg:px-20 bg-[#07111F] relative overflow-hidden"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/3 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold tracking-[0.2em] text-cyan-400 uppercase mb-4 px-4 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5">
            Analytics Dashboard
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mt-4">
            Data that drives{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              real growth
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-400 max-w-2xl mx-auto">
            Stop wondering how you're doing. Know exactly where you stand
            with beautiful, real-time analytics pulled from your coding activity.
          </p>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STATS_TOP.map((s) => (
            <div key={s.label} className="bg-[#0f1929] border border-white/5 rounded-2xl p-5 hover:border-cyan-500/20 transition-colors">
              <p className="text-slate-500 text-xs font-medium mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-white mb-1">{s.value}</p>
              <p className="text-xs text-emerald-400">{s.delta}</p>
            </div>
          ))}
        </div>

        {/* Main chart grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Skill Radar */}
          <div className="bg-[#0f1929] border border-white/5 rounded-2xl p-6 hover:border-cyan-500/20 transition-colors">
            <p className="text-sm font-semibold text-slate-300 mb-1">Skill Radar</p>
            <p className="text-xs text-slate-500 mb-4">Algorithmic strengths</p>
            <svg viewBox="0 0 200 200" className="w-full h-52">
              {rings.map((pts, i) => (
                <polygon key={i} points={pts} fill="none" stroke="#1e2d4a" strokeWidth="1" />
              ))}
              {RADAR_AXES.map((a, i) => {
                const p = toXY(a.angle, R);
                return <line key={i} x1={C} y1={C} x2={p.x} y2={p.y} stroke="#1e2d4a" strokeWidth="1" />;
              })}
              <polygon points={radarPts} fill="#22d3ee" fillOpacity="0.15" stroke="#22d3ee" strokeWidth="2" />
              {RADAR_AXES.map((a, i) => {
                const dot = toXY(a.angle, R * a.value);
                const lbl = toXY(a.angle, R + 17);
                return (
                  <g key={i}>
                    <circle cx={dot.x} cy={dot.y} r="3" fill="#22d3ee" />
                    <text x={lbl.x} y={lbl.y} fill="#64748b" fontSize="8.5" textAnchor="middle" dominantBaseline="middle">
                      {a.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Activity Heatmap + Difficulty */}
          <div className="space-y-5">
            {/* Heatmap */}
            <div className="bg-[#0f1929] border border-white/5 rounded-2xl p-6 hover:border-cyan-500/20 transition-colors">
              <p className="text-sm font-semibold text-slate-300 mb-1">Activity Heatmap</p>
              <p className="text-xs text-slate-500 mb-4">Coding consistency</p>
              <div className="grid grid-cols-7 gap-1.5">
                {HEATMAP_GRID.map((v, i) => (
                  <div
                    key={i}
                    title={`${v === 0 ? 'No activity' : `${v * 3} problems`}`}
                    className={`aspect-square rounded-sm ${HEATMAP_COLORS[v]} transition-transform hover:scale-110 cursor-pointer`}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 justify-end">
                <span className="text-[10px] text-slate-500">Less</span>
                {HEATMAP_COLORS.map((c, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
                ))}
                <span className="text-[10px] text-slate-500">More</span>
              </div>
            </div>

            {/* Problem Solving Progress */}
            <div className="bg-[#0f1929] border border-white/5 rounded-2xl p-6 hover:border-cyan-500/20 transition-colors">
              <p className="text-sm font-semibold text-slate-300 mb-1">Problem Solving</p>
              <p className="text-xs text-slate-500 mb-4">By difficulty</p>
              <div className="space-y-4">
                {DIFFICULTY_BARS.map((d, i) => (
                  <div key={d.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">{d.label}</span>
                      <span className="text-slate-500">{d.solved}/{d.total}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${d.color} rounded-full transition-all duration-1000`}
                        style={{ width: `${(d.solved / d.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rating Growth + Verdict */}
          <div className="space-y-5">
            {/* Rating Growth */}
            <div className="bg-[#0f1929] border border-white/5 rounded-2xl p-6 hover:border-cyan-500/20 transition-colors">
              <p className="text-sm font-semibold text-slate-300 mb-1">Rating Growth</p>
              <p className="text-xs text-slate-500 mb-4">Last 7 months</p>
              <svg viewBox={`0 0 ${CHART_W} ${CHART_H + 20}`} className="w-full h-36">
                {/* Grid lines */}
                {[0, 0.33, 0.66, 1].map((t, i) => (
                  <line key={i} x1="0" y1={ratingY(R_MIN + t * (R_MAX - R_MIN))} x2={CHART_W} y2={ratingY(R_MIN + t * (R_MAX - R_MIN))} stroke="#1e2d4a" strokeWidth="1" />
                ))}
                {/* Area fill */}
                <defs>
                  <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  points={`0,${CHART_H} ${ratingPolyline} ${CHART_W},${CHART_H}`}
                  fill="url(#rg)"
                />
                <polyline points={ratingPolyline} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {RATING_VALS.map((v, i) => (
                  <circle key={i} cx={(i / (RATING_VALS.length - 1)) * CHART_W} cy={ratingY(v)} r="3.5" fill="#22d3ee" />
                ))}
                {RATING_MONTHS.map((m, i) => (
                  <text key={i} x={(i / (RATING_VALS.length - 1)) * CHART_W} y={CHART_H + 15} fill="#475569" fontSize="9" textAnchor="middle">{m}</text>
                ))}
              </svg>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl font-bold text-white">1,680</span>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">+230 pts total</span>
              </div>
            </div>

            {/* Verdict Distribution */}
            <div className="bg-[#0f1929] border border-white/5 rounded-2xl p-6 hover:border-cyan-500/20 transition-colors">
              <p className="text-sm font-semibold text-slate-300 mb-1">Verdict Distribution</p>
              <p className="text-xs text-slate-500 mb-4">Submission outcomes</p>
              {/* Stacked bar */}
              <div className="h-4 rounded-full overflow-hidden flex mb-4">
                {VERDICTS.map((v) => (
                  <div
                    key={v.label}
                    style={{ width: `${v.value}%`, background: v.color }}
                    className="h-full transition-all"
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {VERDICTS.map((v) => (
                  <div key={v.label} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: v.color }} />
                    <span className="text-xs text-slate-400">{v.label}</span>
                    <span className="text-xs text-slate-500 ml-auto">{v.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
