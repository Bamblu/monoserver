'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { cn } from '@bamblu/utils';

interface NavUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface DashboardNavbarProps {
  user?: NavUser;
  githubUsername?: string | null;
}

const NAV_LINKS = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Activity', href: '/dashboard/activity' },
  { label: 'Skills', href: '/dashboard/skills' },
  { label: 'Compare', href: '/compare' },
  { label: 'Roadmap', href: '/roadmap' },
] as const;

/**
 * DashboardNavbar
 *
 * Matches the Figma design layout exactly:
 *   [Bamblu]           [Overview] [Activity] [Skills] [Compare] [Roadmap]           [👤]
 *
 * - "Bamblu" brand on the far left
 * - Nav links group centered in the middle (using mx-auto)
 * - User avatar button on the far right
 */
export function DashboardNavbar({ user, githubUsername }: DashboardNavbarProps) {
  const pathname = usePathname();
  const profileHref = '/settings';

  return (
    <header
      id="dashboard-navbar"
      className="sticky top-0 z-30 w-full bg-[#0B1527] border-b border-white/[0.06]"
    >
      <div className="max-w-[1360px] mx-auto flex items-center h-[60px] px-6">
        {/* Brand - left */}
        <div className="shrink-0">
          <Link
            href="/dashboard"
            className="text-white font-bold text-lg tracking-tight"
          >
            Bamblu
          </Link>
        </div>

        {/* Nav links — centered group */}
        <nav className="flex items-center gap-6 mx-auto" aria-label="Dashboard navigation">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User icon — right */}
        <div className="shrink-0">
          <Link href={profileHref}>
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name ?? 'User avatar'}
                className="h-8 w-8 rounded-full ring-1 ring-white/10 object-cover hover:ring-white/30 transition-all"
              />
            ) : (
              <button
                id="user-menu-btn"
                aria-label="User menu"
                className="h-8 w-8 rounded-full bg-[#1E293B] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-colors"
              >
                <User className="h-4 w-4" />
              </button>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
