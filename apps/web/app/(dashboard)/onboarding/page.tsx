'use client';

import * as React from 'react';
import { useUser } from '@/hooks/use-user';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { OnboardingCard } from '@/components/onboarding/OnboardingCard';
import { useDebounce } from '@/hooks/useDebounce';
import { useQueryClient } from '@tanstack/react-query';

// ─── Codeforces handle validation (via server-side route) ─────────────────────
// We call our own Next.js API route instead of calling codeforces.com directly
// from the browser. This avoids CORS blocks and keeps the API key/secret secure.

interface CfValidationResult {
  found: boolean;
  data?: {
    handle: string;
    rating: number;
    maxRating: number;
    rank: string;
  };
  error?: string;
}

async function validateCfHandle(handle: string): Promise<CfValidationResult | null> {
  try {
    const res = await fetch('/api/onboarding/validate-cf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle }),
    });
    const json = await res.json();
    if (!json.success && !json.found) return null;
    return json;
  } catch {
    return null;
  }
}

// ─── Codeforces step ──────────────────────────────────────────────────────────

interface CodeforcesStepProps {
  /** 1-indexed step number as displayed to the user */
  displayStep: number;
  totalSteps: number;
  onContinue: (handle: string) => void;
  submitting: boolean;
}

function CodeforcesStep({ displayStep, totalSteps, onContinue, submitting }: CodeforcesStepProps) {
  const [handle, setHandle] = React.useState('');
  const [validating, setValidating] = React.useState(false);
  // undefined = not yet checked, null = not found / error, object = valid
  const [result, setResult] = React.useState<CfValidationResult | null | undefined>(undefined);
  const debounced = useDebounce(handle.trim(), 700);

  React.useEffect(() => {
    if (!debounced) {
      setResult(undefined);
      return;
    }
    setValidating(true);
    setResult(undefined);
    validateCfHandle(debounced).then((r) => {
      setResult(r);
      setValidating(false);
    });
  }, [debounced]);

  const isValid = result !== null && result !== undefined && result.found === true;

  return (
    <div className="w-full max-w-[480px] bg-[#0F172A] rounded-2xl border border-white/5 px-8 py-10 sm:px-12 flex flex-col items-center text-center gap-3 shadow-2xl">
      {/* Step indicator */}
      <p className="text-[#06B6D4] text-sm font-semibold tracking-wide">
        Step {displayStep} of {totalSteps}
      </p>

      <h1 className="text-white text-2xl font-bold leading-tight">
        Add your Codeforces handle
      </h1>

      <p className="text-[#94A3B8] text-sm leading-relaxed max-w-sm">
        Enter your Codeforces username so we can track your ratings and
        problem-solving activity.
      </p>

      <div className="w-full mt-3 flex flex-col gap-2">
        <input
          id="cf-handle-input"
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="your_codeforces_handle"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="w-full rounded-lg bg-[#1E293B] border border-[#334155] text-white placeholder:text-slate-500 px-4 py-3 text-sm focus:outline-none focus:border-[#06B6D4] transition-colors"
        />

        {/* Validation status */}
        <div className="h-5 flex items-center gap-1.5 text-sm pl-1">
          {validating && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              <span className="text-slate-400">Checking…</span>
            </>
          )}
          {!validating && isValid && result?.data && (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-emerald-400">
                Valid handle — Current rating: {result.data.rating}
              </span>
            </>
          )}
          {!validating && result === null && debounced === handle.trim() && handle && (
            <>
              <XCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span className="text-red-400">Handle not found on Codeforces</span>
            </>
          )}
          {!validating && result?.found === false && debounced === handle.trim() && handle && (
            <>
              <XCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span className="text-red-400">Handle not found on Codeforces</span>
            </>
          )}
          {!validating && result?.error && (
            <>
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="text-amber-400">Could not verify — try again</span>
            </>
          )}
        </div>
      </div>

      <button
        id="cf-continue-btn"
        type="button"
        disabled={!isValid || submitting}
        onClick={() => isValid && onContinue(handle.trim())}
        className="mt-3 w-full max-w-[360px] h-12 rounded-lg bg-[#0EA5E9] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150 hover:bg-[#38BDF8] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
      >
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue'}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { user, isLoading, isAuthenticated } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = React.useState(false);

  // ── Guard: redirect unauthenticated users ──────────────────────────────────
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // ── Determine required onboarding steps dynamically ────────────────────────
  // hasGitHub: true if the user connected GitHub (via the GitHubConnection table)
  const hasGitHub = (user?.githubConnections?.length ?? 0) > 0;
  const hasCf = !!(user as any)?.codeforcesHandle;

  // If fully onboarded → skip to dashboard
  React.useEffect(() => {
    if (!isLoading && user && hasGitHub && hasCf) {
      router.replace('/dashboard');
    }
  }, [isLoading, user, hasGitHub, hasCf, router]);

  // Handle ?success=github_connected — the GitHub OAuth callback sets this
  // after the user returns from connecting GitHub.  Re-fetch user data.
  const successParam = searchParams.get('success');
  React.useEffect(() => {
    if (successParam === 'github_connected') {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    }
  }, [successParam, queryClient]);

  // ── Build step list ────────────────────────────────────────────────────────
  // Only show steps that still need to be completed.
  // Google login → needs GitHub + CF
  // GitHub login → needs CF only (GitHub is already connected via auth)
  const pendingSteps: Array<'github' | 'codeforces'> = [];
  if (!hasGitHub) pendingSteps.push('github');
  if (!hasCf) pendingSteps.push('codeforces');

  const totalSteps = pendingSteps.length;
  // currentStep is 0-indexed into pendingSteps
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);

  // Advance past GitHub step automatically if GitHub was just connected
  React.useEffect(() => {
    if (hasGitHub && pendingSteps[currentStepIndex] === 'github') {
      setCurrentStepIndex((i) => i + 1);
    }
  }, [hasGitHub, currentStepIndex, pendingSteps]);

  const currentStep = pendingSteps[currentStepIndex];

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleCfContinue(handle: string) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/users/cf-handle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle }),
      });
      if (!res.ok) {
        console.error('[onboarding] CF save failed', await res.text());
      }
      // Invalidate user cache so isOnboardingComplete re-evaluates
      await queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      router.push('/dashboard');
    } catch (err) {
      console.error('[onboarding] unexpected error', err);
      // Don't block the user — redirect anyway
      router.push('/dashboard');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#07111F] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // ── All steps done (edge-case safety net) ─────────────────────────────────
  if (!isLoading && pendingSteps.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[#07111F] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const errorParam = searchParams.get('error');
  let userFriendlyError = null;
  if (errorParam === 'duplicate_github') {
    userFriendlyError = 'This GitHub account is already connected to another Bamblu account. Please use a different GitHub account.';
  } else if (errorParam === 'github_failed') {
    userFriendlyError = 'GitHub connection failed. Please try again.';
  } else if (errorParam === 'session_expired') {
    userFriendlyError = 'Your session has expired. Please log in again.';
  }

  // ── Onboarding UI ──────────────────────────────────────────────────────────
  return (
    // Covers the dashboard shell entirely (onboarding is a modal-like experience)
    <div className="fixed inset-0 z-50 bg-[#07111F] overflow-y-auto">
      <div className="relative min-h-full w-full flex flex-col items-center justify-center px-4 py-16 gap-6">
        {userFriendlyError && (
          <div id="onboarding-error-banner" className="w-full max-w-[480px] bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{userFriendlyError}</span>
          </div>
        )}



        {/* ── Step: Connect GitHub ─────────────────────────────────────────── */}
        {currentStep === 'github' && (
          <OnboardingCard
            step={currentStepIndex + 1}
            totalSteps={totalSteps}
            heading="Connect your GitHub"
            description="We'll pull your commits, repos, and contribution activity automatically."
            actionLabel="Connect GitHub"
            actionHref={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/github?state=link`}
          />
        )}

        {/* ── Step: Codeforces handle ──────────────────────────────────────── */}
        {currentStep === 'codeforces' && (
          <CodeforcesStep
            displayStep={currentStepIndex + 1}
            totalSteps={totalSteps}
            onContinue={handleCfContinue}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}
