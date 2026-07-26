'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

interface SettingsShellProps {
  githubUsername: string | null;
  codeforcesHandle: string | null;
}

export function SettingsShell({ githubUsername, codeforcesHandle }: SettingsShellProps) {
  const router = useRouter();

  // Sync state management
  const [ghSyncing, setGhSyncing] = React.useState(false);
  const [cfSyncing, setCfSyncing] = React.useState(false);
  const [ghMessage, setGhMessage] = React.useState<string | null>(null);
  const [cfMessage, setCfMessage] = React.useState<string | null>(null);

  // Notification state management (local storage persistence)
  const [digestEnabled, setDigestEnabled] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('bamblu:weekly_digest');
    if (saved !== null) {
      setDigestEnabled(saved === 'true');
    }
  }, []);

  const handleDigestToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.checked;
    setDigestEnabled(newVal);
    localStorage.setItem('bamblu:weekly_digest', String(newVal));
  };

  // Re-sync handlers
  const handleSync = async (source: 'github' | 'codeforces') => {
    if (source === 'github') {
      setGhSyncing(true);
      setGhMessage(null);
    } else {
      setCfSyncing(true);
      setCfMessage(null);
    }

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: [source], force: true }),
      });
      const data = await res.json();
      if (data?.success && data?.data?.[source] === 'ok') {
        if (source === 'github') setGhMessage('Success');
        else setCfMessage('Success');
      } else {
        if (source === 'github') setGhMessage('Failed');
        else setCfMessage('Failed');
      }
    } catch (err) {
      if (source === 'github') setGhMessage('Failed');
      else setCfMessage('Failed');
    } finally {
      if (source === 'github') setGhSyncing(false);
      else setCfSyncing(false);
    }
  };

  // Account deletion handler
  const [deleting, setDeleting] = React.useState(false);
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you absolutely sure you want to delete your Bamblu account? This will permanently delete all your dashboard statistics, connection links, and settings.'
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch('/api/users/delete', { method: 'POST' });
      const data = await res.json();
      if (data?.success) {
        // Redirect to login page
        router.replace('/login');
        router.refresh();
      } else {
        alert(data?.error || 'Failed to delete account. Please try again.');
        setDeleting(false);
      }
    } catch (err) {
      alert('A network error occurred. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-[720px] mx-auto space-y-6 animate-fade-in w-full py-2">
      <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>

      <div className="space-y-4">
        {/* Panel 1: Connected Accounts */}
        <section className="rounded-xl bg-[#0F1929] border border-white/[0.06] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Connected Accounts
          </h2>

          <div className="space-y-4 divide-y divide-white/[0.04]">
            {/* GitHub Account */}
            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-slate-300">
                  GitHub — connected as{' '}
                  <span className="text-white font-semibold">
                    {githubUsername ? `@${githubUsername}` : 'Not connected'}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                {ghMessage && (
                  <span
                    className={`text-xs font-semibold ${
                      ghMessage === 'Success' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {ghMessage}
                  </span>
                )}
                <button
                  id="resync-github-btn"
                  onClick={() => handleSync('github')}
                  disabled={ghSyncing || !githubUsername}
                  className="rounded-lg bg-[#1E293B] hover:bg-[#273549] border border-white/10 text-white text-xs font-medium px-4 py-2 transition-colors disabled:opacity-40"
                >
                  {ghSyncing ? 'Syncing…' : 'Re-sync'}
                </button>
              </div>
            </div>

            {/* Codeforces Account */}
            <div className="flex items-center justify-between pt-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-slate-300">
                  Codeforces — connected as{' '}
                  <span className="text-white font-semibold">
                    {codeforcesHandle ? codeforcesHandle : 'Not connected'}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                {cfMessage && (
                  <span
                    className={`text-xs font-semibold ${
                      cfMessage === 'Success' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {cfMessage}
                  </span>
                )}
                <button
                  id="resync-codeforces-btn"
                  onClick={() => handleSync('codeforces')}
                  disabled={cfSyncing || !codeforcesHandle}
                  className="rounded-lg bg-[#1E293B] hover:bg-[#273549] border border-white/10 text-white text-xs font-medium px-4 py-2 transition-colors disabled:opacity-40"
                >
                  {cfSyncing ? 'Syncing…' : 'Re-sync'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Panel 2: Notifications */}
        <section className="rounded-xl bg-[#0F1929] border border-white/[0.06] p-6 flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Notifications
            </h2>
            <p className="text-slate-400 text-sm">Weekly digest email</p>
          </div>

          {mounted && (
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                id="weekly-digest-toggle"
                type="checkbox"
                checked={digestEnabled}
                onChange={handleDigestToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06B6D4]"></div>
            </label>
          )}
        </section>

        {/* Panel 3: Delete Account */}
        <section className="rounded-xl bg-[#0F1929] border border-red-500/20 p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Delete Account
            </h2>
            <p className="text-slate-400 text-sm">
              This will permanently delete your account and all associated data. This action
              cannot be undone.
            </p>
          </div>

          <button
            id="delete-account-btn"
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 transition-colors disabled:opacity-40"
          >
            {deleting ? 'Deleting…' : 'Delete My Account'}
          </button>
        </section>
      </div>
    </div>
  );
}
