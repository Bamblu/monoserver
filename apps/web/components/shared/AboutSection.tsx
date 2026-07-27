'use client';

import React from 'react';

const VALUES = [
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    title: 'Transparency',
    desc: 'Every metric, every score explained—no black boxes.',
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    title: 'Actionability',
    desc: 'Insights you can act on—not just pretty dashboards.',
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Community',
    desc: 'Built by developers, for developers who care about growth.',
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: 'Privacy',
    desc: 'Your data is yours. We never sell or share it.',
  },
];

const WHY_ITEMS = [
  "Stop wasting time on problems you’ve already mastered",
  "Identify the exact skills that will unblock your next job offer",
  "Build consistent practice habits with smart streak tracking",
  "Get credit for ALL your coding—not just one platform",
  "Impress interviewers with a data-backed developer profile",
];

export default function AboutSection() {
  return (
    <section
      id="about"
      className="w-full py-24 px-6 lg:px-20 bg-[#070f1c] relative overflow-hidden"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Left: Mission & About */}
          <div>
            <span className="inline-block text-xs font-bold tracking-[0.2em] text-cyan-400 uppercase mb-6 px-4 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5">
              About Bamblu
            </span>

            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
              Built for developers who{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                refuse to plateau
              </span>
            </h2>

            <div className="space-y-5 text-slate-400 leading-relaxed">
              <p>
                Bamblu was born from a simple frustration: talented developers have no unified
                way to understand their own growth. Your GitHub tells one story. Codeforces
                tells another. Neither gives you the full picture.
              </p>
              <p>
                We built Bamblu to change that. By aggregating your coding activity across
                platforms and running it through our AI analysis engine, we give you a
                single source of truth for your developer journey—with the insights to
                grow faster than you ever thought possible.
              </p>
            </div>

            {/* Mission & Vision */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/5 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-6 bg-cyan-400 rounded-full" />
                  <p className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Mission</p>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Make every developer's growth visible, measurable, and acceleratable.
                </p>
              </div>
              <div className="rounded-xl border border-violet-500/15 bg-violet-500/5 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-6 bg-violet-400 rounded-full" />
                  <p className="text-sm font-bold text-violet-400 uppercase tracking-wider">Vision</p>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  A world where every developer reaches their full potential with the right guidance.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Why + Values */}
          <div className="space-y-8">
            {/* Why section */}
            <div className="rounded-2xl border border-white/5 bg-[#0f1929] p-7">
              <h3 className="text-xl font-bold text-white mb-5">
                Why developers choose Bamblu
              </h3>
              <ul className="space-y-3">
                {WHY_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-400">
                    <svg className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Values */}
            <div className="grid grid-cols-2 gap-4">
              {VALUES.map((v) => (
                <div key={v.title} className="rounded-xl border border-white/5 bg-white/2 hover:bg-white/4 hover:border-white/10 transition-all p-4 cursor-default">
                  <div className="text-cyan-400 mb-2">{v.icon}</div>
                  <p className="text-sm font-semibold text-white mb-1">{v.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="relative rounded-2xl overflow-hidden border border-cyan-500/20 bg-gradient-to-br from-cyan-600/10 via-[#0f1929] to-violet-600/10 p-10 text-center">
          {/* Decorative elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
          </div>

          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to know where you really stand?
          </h3>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
            Join thousands of developers who are growing smarter, not just harder.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-bold rounded-xl hover:from-cyan-400 hover:to-cyan-300 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5"
            >
              Get Started Free
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/5 hover:border-white/20 transition-all duration-200"
            >
              See how it works
            </a>
          </div>

          <p className="mt-5 text-xs text-slate-600">Free forever • No credit card • Connect in 60 seconds</p>
        </div>
      </div>
    </section>
  );
}
