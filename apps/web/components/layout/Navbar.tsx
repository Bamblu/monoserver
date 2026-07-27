'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@bamblu/utils';

interface NavbarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface NavbarProps {
  user?: NavbarUser;
}

const NAV_LINKS = [
  { label: 'Features',     href: '#features'     },
  { label: 'Analytics',   href: '#analytics'    },
  { label: 'Integrations',href: '#integrations' },
  { label: 'How It Works',href: '#how-it-works' },
  { label: 'About',       href: '#about'        },
];

const SECTION_IDS = ['hero', 'features', 'analytics', 'integrations', 'how-it-works', 'about'];

// ─── Smooth-scroll helper ─────────────────────────────────────────────────────

function scrollToSection(href: string) {
  const id = href.replace('#', '');
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ─── Public Navbar (landing page) ─────────────────────────────────────────────

function PublicNav() {
  const [activeSection, setActiveSection] = useState<string>('');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Active section detection via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id === 'hero' ? '' : id);
          }
        },
        { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Navbar background on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change / resize
  useEffect(() => {
    const close = () => setMobileOpen(false);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, []);

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden lg:flex items-center gap-8">
        {NAV_LINKS.map(({ label, href }) => {
          const id = href.replace('#', '');
          const isActive = activeSection === id;
          return (
            <button
              key={href}
              onClick={() => scrollToSection(href)}
              className={cn(
                'text-xs font-medium tracking-wider transition-all duration-200 relative',
                isActive ? 'text-white' : 'text-gray-400 hover:text-white',
              )}
            >
              {label.toUpperCase()}
              {isActive && (
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-cyan-400 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Social proof avatars */}
      <div className="hidden lg:flex -space-x-2.5">
        <div className="h-8 w-8 rounded-full ring-2 ring-[#0a0e1a] bg-gradient-to-br from-violet-500 to-purple-700" />
        <div className="h-8 w-8 rounded-full ring-2 ring-[#0a0e1a] bg-gradient-to-br from-cyan-400 to-blue-600" />
        <div className="h-8 w-8 rounded-full ring-2 ring-[#0a0e1a] bg-gradient-to-br from-emerald-400 to-teal-600" />
      </div>

      {/* Desktop CTA buttons */}
      <div className="hidden lg:flex items-center gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-white/5 border border-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
        >
          Login
        </Link>
        <Link
          href="/login"
          className="rounded-lg bg-cyan-400 px-5 py-2 text-sm font-semibold text-black hover:bg-cyan-300 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/20"
        >
          Get Started Free
        </Link>
      </div>

      {/* Mobile hamburger */}
      <button
        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Toggle navigation"
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        )}
      </button>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 z-50 bg-[#0a0e1a]/95 backdrop-blur-xl border-b border-white/5 py-4 px-6 space-y-1 lg:hidden">
          {NAV_LINKS.map(({ label, href }) => {
            const id = href.replace('#', '');
            const isActive = activeSection === id;
            return (
              <button
                key={href}
                onClick={() => { scrollToSection(href); setMobileOpen(false); }}
                className={cn(
                  'block w-full text-left py-3 px-4 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'text-white bg-white/5 text-cyan-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5',
                )}
              >
                {label}
              </button>
            );
          })}
          <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block text-center py-3 px-4 rounded-lg border border-white/10 text-sm font-semibold text-white hover:bg-white/5 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block text-center py-3 px-4 rounded-lg bg-cyan-400 text-sm font-semibold text-black hover:bg-cyan-300 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </>
  );
}


// ─── Authenticated Navbar (dashboard shell) ────────────────────────────────────

function AuthNav({ user }: { user: NavbarUser }) {
  return (
    <div className="flex items-center gap-4 ml-auto">
      <div className="flex items-center gap-3">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name ?? 'User'}
            className="h-8 w-8 rounded-full ring-2 ring-white/10"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">
            {user.name?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-white leading-none">{user.name ?? 'Developer'}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{user.email}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Navbar ────────────────────────────────────────────────────────────────────

export function Navbar({ user }: NavbarProps) {
  return (
    <header
      id="navbar"
      className="sticky top-0 z-30 flex items-center justify-between px-8 py-5 h-[78px] bg-[#0a0e1a]/95 backdrop-blur-xl border-b border-white/5 relative"
    >
      <Link href={user ? '/dashboard' : '/'} className="text-xl font-bold tracking-wide text-white z-10">
        BAMBLU
      </Link>

      {user ? <AuthNav user={user} /> : <PublicNav />}
    </header>
  );
}
