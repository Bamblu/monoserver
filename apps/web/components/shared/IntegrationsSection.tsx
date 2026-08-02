'use client';

import React from 'react';

const INTEGRATIONS = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Import your repositories, commit history, language stats, contribution graph, and pull request activity.',
    status: 'live' as const,
    color: 'from-slate-800/80 to-slate-900/80',
    border: 'border-slate-600/40 hover:border-slate-400/60',
    iconBg: 'bg-slate-700',
    features: ['Commits & PRs', 'Language breakdown', 'Contribution heatmap', 'Repository insights'],
    icon: (
      <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
  {
    id: 'codeforces',
    name: 'Codeforces',
    description: 'Sync your competitive programming data: contest results, problem submissions, rating history, and skill analysis.',
    status: 'live' as const,
    color: 'from-blue-900/60 to-slate-900/80',
    border: 'border-blue-600/40 hover:border-blue-400/60',
    iconBg: 'bg-blue-700',
    features: ['Contest history', 'Problem verdicts', 'Rating tracking', 'Skill analysis'],
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="11" width="4.5" height="10" rx="1.5" fill="#FFB800" />
        <rect x="9.5" y="3" width="4.5" height="18" rx="1.5" fill="#2196F3" />
        <rect x="16" y="15" width="4.5" height="6" rx="1.5" fill="#FF4B4B" />
      </svg>
    ),
  },
];

const COMING_SOON = [
  { name: 'LeetCode', icon: '⚡', color: 'text-yellow-400', desc: 'Problem solutions & contest history' },
  { name: 'HackerRank', icon: '✦', color: 'text-green-400', desc: 'Certifications & challenge results' },
  { name: 'AtCoder', icon: '◈', color: 'text-orange-400', desc: 'Japanese competitive programming' },
  { name: 'CodeChef', icon: '◆', color: 'text-amber-400', desc: 'Long & short challenge tracking' },
  { name: 'LinkedIn', icon: '◉', color: 'text-blue-400', desc: 'Professional profile sync' },
  { name: 'Portfolio', icon: '◇', color: 'text-purple-400', desc: 'Custom portfolio integration' },
];

function StatusBadge({ status }: { status: 'live' | 'soon' }) {
  return status === 'live' ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
      Live
    </span>
  ) : (
    <span className="text-xs font-semibold text-slate-500 bg-slate-800/80 border border-slate-700/50 px-2.5 py-1 rounded-full">
      Coming Soon
    </span>
  );
}

export default function IntegrationsSection() {
  return (
    <section
      id="integrations"
      className="w-full py-24 px-6 lg:px-20 bg-[#070f1c] relative overflow-hidden"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/3 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold tracking-[0.2em] text-cyan-400 uppercase mb-4 px-4 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5">
            Integrations
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mt-4">
            Connect your{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              entire coding world
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-400 max-w-2xl mx-auto">
            Bamblu aggregates data from where you actually code—so you get a
            unified, complete picture of your developer journey.
          </p>
        </div>

        {/* Live integration cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {INTEGRATIONS.map((integration) => (
            <div
              key={integration.id}
              className={`group relative rounded-2xl border bg-gradient-to-br ${integration.color} ${integration.border} p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
            >
              <div className="flex items-start gap-5">
                <div className={`${integration.iconBg} p-3.5 rounded-xl flex-shrink-0 shadow-lg`}>
                  {integration.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-xl font-bold text-white">{integration.name}</h3>
                    <StatusBadge status={integration.status} />
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed mb-5">
                    {integration.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {integration.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-slate-400">
                        <svg className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coming soon */}
        <div className="rounded-2xl border border-white/5 bg-[#0f1929]/80 p-8">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-white mb-2">More platforms coming soon</h3>
            <p className="text-sm text-slate-500">We're constantly expanding. Vote for the integration you want next.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {COMING_SOON.map((p) => (
              <div
                key={p.name}
                className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer"
              >
                <span className={`text-2xl ${p.color} group-hover:scale-110 transition-transform`}>{p.icon}</span>
                <span className="text-sm font-semibold text-slate-300 text-center">{p.name}</span>
                <span className="text-[10px] text-slate-600 text-center leading-tight">{p.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
