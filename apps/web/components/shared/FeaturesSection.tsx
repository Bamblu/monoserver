'use client';

import React, { useRef } from 'react';

const FEATURES = [
  {
    id: 'ai-skill',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
        <path d="M12 8v4l3 3"/>
        <circle cx="12" cy="12" r="1" fill="currentColor"/>
      </svg>
    ),
    title: 'AI Skill Analysis',
    description: 'Our AI engine maps your coding history into a comprehensive skill profile—identifying strengths, blindspots, and hidden potential across 20+ algorithmic domains.',
    color: 'from-violet-500/20 to-purple-600/10',
    border: 'border-violet-500/20 hover:border-violet-400/50',
    accent: 'text-violet-400',
    glow: 'hover:shadow-violet-500/10',
    badge: 'AI-Powered',
  },
  {
    id: 'github',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
      </svg>
    ),
    title: 'GitHub Integration',
    description: 'Deep sync with your GitHub profile—commits, PRs, repos, and language breakdown. Turn your commit history into a living portfolio that tells the real story.',
    color: 'from-slate-500/20 to-gray-600/10',
    border: 'border-slate-500/20 hover:border-slate-400/50',
    accent: 'text-slate-300',
    glow: 'hover:shadow-slate-500/10',
    badge: 'Live Sync',
  },
  {
    id: 'codeforces',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="6" height="20" rx="1"/>
        <rect x="9" y="8" width="6" height="14" rx="1"/>
        <rect x="16" y="5" width="6" height="17" rx="1"/>
      </svg>
    ),
    title: 'Codeforces Integration',
    description: 'Full access to your Codeforces competitive record. Track problem-solving patterns, rating evolution, and contest performance with granular analytics.',
    color: 'from-blue-500/20 to-cyan-600/10',
    border: 'border-blue-500/20 hover:border-blue-400/50',
    accent: 'text-blue-400',
    glow: 'hover:shadow-blue-500/10',
    badge: 'Competitive',
  },
  {
    id: 'roadmap',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h18M3 6h12M3 18h8"/>
        <circle cx="19" cy="6" r="2" fill="currentColor" strokeWidth="0"/>
        <circle cx="13" cy="18" r="2" fill="currentColor" strokeWidth="0"/>
      </svg>
    ),
    title: 'Personalized Roadmap',
    description: 'Get a custom learning path generated from your actual skill gaps. Curated problems, topics, and milestones tailored to your career goals.',
    color: 'from-emerald-500/20 to-teal-600/10',
    border: 'border-emerald-500/20 hover:border-emerald-400/50',
    accent: 'text-emerald-400',
    glow: 'hover:shadow-emerald-500/10',
    badge: 'Personalized',
  },
  {
    id: 'progress',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Progress Tracking',
    description: 'Daily heatmaps, streak counters, and trend analysis give you a real-time pulse on your consistency. See exactly how your skills evolve over time.',
    color: 'from-orange-500/20 to-amber-600/10',
    border: 'border-orange-500/20 hover:border-orange-400/50',
    accent: 'text-orange-400',
    glow: 'hover:shadow-orange-500/10',
    badge: 'Real-time',
  },
  {
    id: 'analytics',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 21H4.6A1.6 1.6 0 0 1 3 19.4V3"/>
        <path d="m7 14 4-5 4 4 4-6"/>
      </svg>
    ),
    title: 'Analytics Dashboard',
    description: 'A stunning command center for your developer journey. Radar charts, verdict distributions, rating curves, and activity insights—all in one beautiful view.',
    color: 'from-cyan-500/20 to-sky-600/10',
    border: 'border-cyan-500/20 hover:border-cyan-400/50',
    accent: 'text-cyan-400',
    glow: 'hover:shadow-cyan-500/10',
    badge: 'Insights',
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="w-full py-24 px-6 lg:px-20 bg-[#070f1c] relative overflow-hidden"
    >
      {/* Background glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-40 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold tracking-[0.2em] text-cyan-400 uppercase mb-4 px-4 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5">
            Platform Features
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mt-4">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              level up
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Bamblu connects your entire coding footprint and turns raw data into
            actionable intelligence. No more guessing—know exactly where to grow.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.id}
              className={`group relative rounded-2xl border bg-gradient-to-br ${f.color} ${f.border} p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${f.glow} cursor-default`}
            >
              {/* Badge */}
              <span className={`absolute top-4 right-4 text-[10px] font-bold tracking-widest uppercase ${f.accent} opacity-70 group-hover:opacity-100 transition-opacity`}>
                {f.badge}
              </span>

              {/* Icon */}
              <div className={`${f.accent} mb-5 transition-transform duration-300 group-hover:scale-110`}>
                {f.icon}
              </div>

              {/* Text */}
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                {f.description}
              </p>

              {/* Hover arrow */}
              <div className={`mt-5 flex items-center gap-1.5 text-xs font-semibold ${f.accent} opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1`}>
                Learn more
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
