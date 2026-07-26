import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import TrustedBySection from '@/components/shared/TrustedBySection';
import DeveloperFeaturesSection from '@/components/shared/DeveloperFeaturesSection';

// ─── Hero mock data (static preview panels) ───────────────────────────────────

const STATS = [
  { label: 'Problems Solved', value: '487' },
  { label: 'Active Days',     value: '6'   },
  { label: 'Contest Rating',  value: '1603' },
  { label: 'GitHub Contrib.', value: '42'  },
];

const RADAR_AXES = [
  { label: 'DP',            angle: -90,  value: 0.9  },
  { label: 'Graphs',        angle: -30,  value: 0.75 },
  { label: 'Greedy',        angle:  30,  value: 0.85 },
  { label: 'Binary Search', angle:  90,  value: 0.90 },
  { label: 'Maths',         angle: 150,  value: 0.80 },
  { label: 'Strings',       angle: 210,  value: 0.70 },
];

const C = 100;
const R = 72;

function toXY(angle: number, r: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad) };
}

const radarPoints = RADAR_AXES
  .map((a) => toXY(a.angle, R * a.value))
  .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
  .join(' ');

const radarRings = [0.33, 0.66, 1].map((s) =>
  RADAR_AXES.map((a) => toXY(a.angle, R * s))
    .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' '),
);

const HEAT_COLORS = ['bg-slate-800', 'bg-cyan-900', 'bg-cyan-700', 'bg-cyan-500', 'bg-teal-400'];
const HEAT_GRID   = [4,2,3,0,1,2,4, 2,4,1,0,3,1,3, 3,0,4,1,3,4,0, 1,3,0,3,0,2,1, 2,4,2,0,1,2,1, 0,2,0,3,4,1,0];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07111F] flex flex-col">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="flex-1 w-full px-6 lg:px-20 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: copy */}
          <div className="flex flex-col items-start">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.08] tracking-tight">
              Track your coding.
              <br />
              Know your skill.
              <br />
              Grow your career.
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-md leading-relaxed">
              Connect GitHub and Codeforces to get AI-powered insights and
              personalized roadmaps that help you grow faster.
            </p>

            <div className="mt-10 flex items-center gap-5">
              <Link
                href="/login"
                className="rounded-lg bg-cyan-400 px-7 py-3 text-sm font-semibold text-black hover:bg-cyan-300 transition-colors"
              >
                Get Started Free
              </Link>

              {/* Social proof avatars */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  <div className="h-9 w-9 rounded-full ring-2 ring-[#07111F] bg-gradient-to-br from-violet-500 to-purple-700" />
                  <div className="h-9 w-9 rounded-full ring-2 ring-[#07111F] bg-gradient-to-br from-cyan-400 to-blue-600" />
                  <div className="h-9 w-9 rounded-full ring-2 ring-[#07111F] bg-gradient-to-br from-emerald-400 to-teal-600" />
                  <div className="h-9 w-9 rounded-full ring-2 ring-[#07111F] bg-gradient-to-br from-orange-400 to-rose-600" />
                </div>
                <p className="text-sm text-slate-400">Join 1,000+ developers</p>
              </div>
            </div>
          </div>

          {/* Right: dashboard preview */}
          <div className="bg-[#0f1626] border border-white/5 rounded-2xl p-5 space-y-4 shadow-2xl shadow-black/40">
            {/* Stat bar */}
            <div className="grid grid-cols-4 gap-3">
              {STATS.map((s) => (
                <div key={s.label} className="bg-[#1a2233] rounded-lg p-3">
                  <p className="text-slate-500 text-[10px] leading-tight">{s.label}</p>
                  <p className="text-white text-lg font-semibold mt-1">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Skill Radar */}
              <div className="bg-[#131b2e] rounded-xl p-4">
                <p className="text-slate-400 text-xs font-medium mb-2">Skill Radar</p>
                <svg viewBox="0 0 200 200" className="w-full h-48">
                  {radarRings.map((pts, i) => (
                    <polygon key={i} points={pts} fill="none" stroke="#2a3548" strokeWidth="1" />
                  ))}
                  {RADAR_AXES.map((a, i) => {
                    const p = toXY(a.angle, R);
                    return <line key={i} x1={C} y1={C} x2={p.x} y2={p.y} stroke="#2a3548" strokeWidth="1" />;
                  })}
                  <polygon points={radarPoints} fill="#22d3ee" fillOpacity="0.18" stroke="#22d3ee" strokeWidth="2" />
                  {RADAR_AXES.map((a, i) => {
                    const p = toXY(a.angle, R + 14);
                    return (
                      <text key={i} x={p.x} y={p.y} fill="#64748b" fontSize="8" textAnchor="middle" dominantBaseline="middle">
                        {a.label}
                      </text>
                    );
                  })}
                </svg>
              </div>

              {/* Activity Heatmap */}
              <div className="bg-[#131b2e] rounded-xl p-4">
                <p className="text-slate-400 text-xs font-medium mb-3">Activity Heatmap</p>
                <div className="grid grid-cols-7 gap-1">
                  {HEAT_GRID.map((v, i) => (
                    <div key={i} className={`aspect-square rounded-sm ${HEAT_COLORS[v]}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Trusted by ────────────────────────────────────────────────────────── */}
      <TrustedBySection />

      {/* ── Features ──────────────────────────────────────────────────────────── */}
      <DeveloperFeaturesSection />

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
