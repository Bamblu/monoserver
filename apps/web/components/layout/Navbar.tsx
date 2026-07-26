import Link from 'next/link';

interface NavbarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface NavbarProps {
  user?: NavbarUser;
}

// ─── Public Navbar (landing page) ─────────────────────────────────────────────

function PublicNav() {
  return (
    <>
      <nav className="flex items-center gap-10">
        <Link href="#features"     className="text-xs font-medium tracking-wider text-gray-400 hover:text-white transition-colors">FEATURES</Link>
        <Link href="#analytics"    className="text-xs font-medium tracking-wider text-gray-400 hover:text-white transition-colors">ANALYTICS</Link>
        <Link href="#integrations" className="text-xs font-medium tracking-wider text-gray-400 hover:text-white transition-colors">INTEGRATIONS</Link>
        <Link href="#how-it-works" className="text-xs font-medium tracking-wider text-gray-400 hover:text-white transition-colors">HOW IT WORKS</Link>
        <Link href="#about"        className="text-xs font-medium tracking-wider text-gray-400 hover:text-white transition-colors">ABOUT</Link>
      </nav>

      {/* Social proof avatars — matches the design reference */}
      <div className="flex -space-x-2.5">
        <div className="h-8 w-8 rounded-full ring-2 ring-[#0a0e1a] bg-gradient-to-br from-violet-500 to-purple-700" />
        <div className="h-8 w-8 rounded-full ring-2 ring-[#0a0e1a] bg-gradient-to-br from-cyan-400 to-blue-600" />
        <div className="h-8 w-8 rounded-full ring-2 ring-[#0a0e1a] bg-gradient-to-br from-emerald-400 to-teal-600" />
      </div>

      <div className="flex items-center gap-3">
        <Link href="/login" className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-gray-100 transition-colors">
          Login
        </Link>
        <Link href="/login" className="rounded-lg bg-cyan-400 px-6 py-2.5 text-sm font-semibold text-black hover:bg-cyan-300 transition-colors">
          Get Started Free
        </Link>
      </div>
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
      className="sticky top-0 z-30 flex items-center justify-between px-8 py-5 h-[78px] bg-[#0a0e1a] border-b border-white/5"
    >
      <Link href={user ? '/dashboard' : '/'} className="text-xl font-bold tracking-wide text-white">
        BAMBLU
      </Link>

      {user ? <AuthNav user={user} /> : <PublicNav />}
    </header>
  );
}