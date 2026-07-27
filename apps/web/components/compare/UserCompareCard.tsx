/**
 * components/compare/UserCompareCard.tsx
 *
 * Rich profile card for the Compare page.
 * Displays GitHub stats, Codeforces stats, and top languages.
 */

'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  GitFork,
  Star,
  Users,
  UserCheck,
  Code2,
  BookOpen,
  Trophy,
  Zap,
  Activity,
  Link2,
  HelpCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import type { CompareProfile } from '@/lib/types/compare';

// ─── Codeforces Rank Color Map ────────────────────────────────────────────────

function getCFRankColor(rank: string): string {
  const r = rank.toLowerCase();
  if (r.includes('legendary')) return '#ff0000';
  if (r.includes('international') && r.includes('grandmaster')) return '#ff3300';
  if (r.includes('grandmaster')) return '#ff3300';
  if (r.includes('international') && r.includes('master')) return '#ff8c00';
  if (r.includes('master')) return '#ff8c00';
  if (r.includes('candidate')) return '#aa00aa';
  if (r.includes('expert')) return '#0000ff';
  if (r.includes('specialist')) return '#03a89e';
  if (r.includes('pupil')) return '#008000';
  if (r.includes('newbie')) return '#808080';
  return '#94a3b8';
}

// ─── Language Color Map ───────────────────────────────────────────────────────

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572a5',
  Go: '#00add8',
  Rust: '#dea584',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  Scala: '#c22d40',
  PHP: '#4f5d95',
  CSS: '#563d7c',
  HTML: '#e34c26',
  Shell: '#89e051',
  Dart: '#00b4ab',
};

function getLangColor(lang: string): string {
  return LANG_COLORS[lang] ?? '#64748b';
}

// ─── CF Link Status Badge ─────────────────────────────────────────────────────

function CFLinkBadge({ status, confidence }: { status: string; confidence: number }) {
  if (status === 'linked') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5">
        <Link2 className="h-2.5 w-2.5" />
        CF Linked {confidence < 100 ? `~${confidence}%` : ''}
      </span>
    );
  }
  if (status === 'unknown') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400/80 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5">
        <HelpCircle className="h-2.5 w-2.5" />
        CF Unknown
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-400/10 border border-slate-400/20 rounded-full px-2 py-0.5">
      <XCircle className="h-2.5 w-2.5" />
      No CF Link
    </span>
  );
}

// ─── Stat Row ─────────────────────────────────────────────────────────────────

function StatRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-2 text-slate-400 text-xs">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <span className="text-sm font-semibold" style={accent ? { color: accent } : {}}>
        {value}
      </span>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

export function UserCompareCardSkeleton({ accentColor }: { accentColor: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0a1628]/80 p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/10 rounded w-32" />
          <div className="h-3 bg-white/[0.06] rounded w-24" />
        </div>
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between items-center py-1.5">
            <div className="h-3 bg-white/[0.06] rounded w-24" />
            <div className="h-3 bg-white/10 rounded w-12" />
          </div>
        ))}
      </div>
      <div className="pt-2 flex items-center justify-center gap-2 text-slate-600 text-xs">
        <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: accentColor }} />
        <span>Loading profile…</span>
      </div>
    </div>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────

interface UserCompareCardProps {
  profile: CompareProfile;
  accentColor: string;
  label?: string;
}

export function UserCompareCard({ profile, accentColor, label }: UserCompareCardProps) {
  const [imgError, setImgError] = React.useState(false);
  const gh = profile.github;
  const cf = profile.codeforces;

  return (
    <div
      className="rounded-2xl border bg-[#0a1628]/80 p-5 space-y-5 flex flex-col"
      style={{ borderColor: `${accentColor}22` }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          {imgError ? (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2"
              style={{ backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40`, color: accentColor }}
            >
              {profile.login[0]?.toUpperCase()}
            </div>
          ) : (
            <Image
              src={profile.avatarUrl}
              alt={profile.login}
              width={48}
              height={48}
              className="rounded-full border-2"
              style={{ borderColor: `${accentColor}40` }}
              onError={() => setImgError(true)}
            />
          )}
          {profile.isBambluUser && (
            <div
              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: accentColor }}
              title="Bamblu User"
            >
              <Zap className="h-2.5 w-2.5 text-black" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {label && (
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: accentColor }}>
              {label}
            </p>
          )}
          <h3 className="font-bold text-white text-base truncate">
            {profile.displayName ?? profile.login}
          </h3>
          <p className="text-slate-500 text-xs truncate">@{profile.login}</p>
          {profile.bio && (
            <p className="text-slate-400 text-xs mt-1 line-clamp-2">{profile.bio}</p>
          )}
        </div>
        <CFLinkBadge status={profile.cfLinkStatus} confidence={profile.cfLinkConfidence} />
      </div>

      {/* GitHub Stats */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
          <Code2 className="h-3 w-3" />
          GitHub
        </h4>
        <div className="space-y-0">
          <StatRow icon={BookOpen} label="Public Repos" value={gh.totalRepos.toLocaleString()} />
          <StatRow icon={Star} label="Total Stars" value={gh.totalStars.toLocaleString()} />
          <StatRow icon={Users} label="Followers" value={gh.followers.toLocaleString()} />
          <StatRow icon={UserCheck} label="Following" value={gh.following.toLocaleString()} />
          <StatRow icon={GitFork} label="Est. Commits" value={gh.totalCommits.toLocaleString()} />
          {gh.contributionStreak > 0 && (
            <StatRow icon={Activity} label="Streak (days)" value={gh.contributionStreak} />
          )}
        </div>
      </div>

      {/* Top Languages */}
      {gh.topLanguages.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Top Languages
          </h4>
          <div className="space-y-1.5">
            {gh.topLanguages.slice(0, 5).map((lang) => (
              <div key={lang.language}>
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getLangColor(lang.language) }}
                    />
                    <span className="text-slate-300">{lang.language}</span>
                  </div>
                  <span className="text-slate-500">{lang.percentage}%</span>
                </div>
                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${lang.percentage}%`,
                      backgroundColor: getLangColor(lang.language),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Codeforces Stats */}
      {cf ? (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <Trophy className="h-3 w-3" />
            Codeforces — <span className="font-mono">{cf.handle}</span>
          </h4>
          <div>
            <StatRow
              icon={Trophy}
              label="Rating"
              value={cf.rating}
              accent={accentColor}
            />
            <StatRow
              icon={Trophy}
              label="Max Rating"
              value={cf.maxRating}
            />
            <StatRow
              icon={Trophy}
              label="Rank"
              value={cf.rank}
              accent={getCFRankColor(cf.rank)}
            />
            <StatRow
              icon={Trophy}
              label="Max Rank"
              value={cf.maxRank}
              accent={getCFRankColor(cf.maxRank)}
            />
            <StatRow
              icon={Activity}
              label="Problems Solved"
              value={cf.solvedCount.toLocaleString()}
            />
            <StatRow
              icon={BookOpen}
              label="Contests"
              value={cf.contestCount.toLocaleString()}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-3 text-center">
          <p className="text-slate-500 text-xs">
            {profile.cfLinkStatus === 'unknown'
              ? 'Codeforces account could not be confidently identified'
              : 'No Codeforces account linked'}
          </p>
        </div>
      )}
    </div>
  );
}
