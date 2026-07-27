'use client';

import React from 'react';

const STEPS = [
  {
    number: '01',
    title: 'Connect your accounts',
    description: 'Link your GitHub and Codeforces profiles with a single click. No manual data entry—Bamblu securely pulls everything automatically.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    connector: 'from-cyan-500/40 to-violet-500/40',
  },
  {
    number: '02',
    title: 'Import your coding data',
    description: 'Bamblu instantly imports thousands of submissions, commits, contest history, and repository stats—creating a complete picture of your journey.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    connector: 'from-violet-500/40 to-emerald-500/40',
  },
  {
    number: '03',
    title: 'AI analyzes your profile',
    description: 'Our AI engine processes your data across 20+ skill dimensions—identifying patterns, gaps, strengths, and hidden opportunities in your coding behavior.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z"/>
        <path d="M9 12l2 2 4-4"/>
        <path d="M12 6v2M12 16v2M6 12h2M16 12h2"/>
      </svg>
    ),
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    connector: 'from-emerald-500/40 to-orange-500/40',
  },
  {
    number: '04',
    title: 'Receive your roadmap',
    description: 'Get a fully personalized roadmap with curated problems, learning resources, and milestones. Track your progress as you climb toward your goals.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l4-8 4 4 4-6 4 10"/>
        <path d="M3 21h18"/>
      </svg>
    ),
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    connector: null,
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="w-full py-24 px-6 lg:px-20 bg-[#07111F] relative overflow-hidden"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/4 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <span className="inline-block text-xs font-bold tracking-[0.2em] text-cyan-400 uppercase mb-4 px-4 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5">
            How It Works
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mt-4">
            Up and running in{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-orange-400 bg-clip-text text-transparent">
              minutes
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-400 max-w-2xl mx-auto">
            Four simple steps from signup to your personalized developer roadmap.
            No complex setup, no manual data entry.
          </p>
        </div>

        {/* Desktop timeline */}
        <div className="hidden lg:flex items-start justify-between gap-0 relative">
          {/* Horizontal connector line */}
          <div className="absolute top-14 left-[12%] right-[12%] h-px bg-gradient-to-r from-cyan-500/20 via-violet-500/20 via-emerald-500/20 to-orange-500/20" />

          {STEPS.map((step, idx) => (
            <div key={step.number} className="flex-1 flex flex-col items-center text-center px-4 relative group">
              {/* Icon circle */}
              <div className={`relative z-10 w-28 h-28 rounded-2xl ${step.bg} border-2 ${step.border} flex items-center justify-center mb-6 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl`}>
                <div className={step.color}>{step.icon}</div>
                <span className={`absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#07111F] border-2 ${step.border} flex items-center justify-center text-[10px] font-bold ${step.color}`}>
                  {step.number}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-3 group-hover:text-white transition-colors">
                {step.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-[200px] group-hover:text-slate-300 transition-colors">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Mobile stacked timeline */}
        <div className="lg:hidden space-y-0">
          {STEPS.map((step, idx) => (
            <div key={step.number} className="relative flex gap-5 pb-10 last:pb-0">
              {/* Vertical connector */}
              {idx < STEPS.length - 1 && (
                <div className="absolute left-7 top-16 bottom-0 w-px bg-gradient-to-b from-cyan-500/30 to-transparent" />
              )}

              {/* Icon */}
              <div className={`flex-shrink-0 w-14 h-14 rounded-xl ${step.bg} border ${step.border} flex items-center justify-center relative z-10`}>
                <div className={`${step.color} scale-75`}>{step.icon}</div>
              </div>

              {/* Content */}
              <div className="flex-1 pt-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold ${step.color} opacity-70`}>{step.number}</span>
                  <h3 className="text-base font-bold text-white">{step.title}</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <a
            href="/login"
            className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-bold rounded-xl hover:from-cyan-400 hover:to-cyan-300 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5"
          >
            Start your journey
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
          <p className="mt-3 text-sm text-slate-500">Free forever • No credit card required</p>
        </div>
      </div>
    </section>
  );
}
