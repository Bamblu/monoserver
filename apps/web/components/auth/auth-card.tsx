import * as React from 'react';
import { cn } from '@bamblu/utils';
import { SocialAuthButton } from './social-auth-button';

interface AuthCardProps {
  error?: string | null;
  callbackUrl?: string;
  className?: string;
}

export function AuthCard({ error, callbackUrl, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        'flex w-full max-w-[420px] flex-col items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-900/80 p-8 sm:p-10',
        className,
      )}
    >
      {/* Header */}
      <div className="mb-7 w-full space-y-1.5 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white">Welcome</h2>
        <p className="text-lg text-slate-400">Log in to your account</p>
      </div>

      {/* Error banner */}
      {error && (
        <div
          id="login-error-banner"
          className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          Authentication failed. Please try again.
        </div>
      )}

      {/* Social auth */}
      <div className="w-full max-w-[320px] space-y-3">
        <SocialAuthButton provider="google" callbackUrl={callbackUrl} />
        <SocialAuthButton provider="github" callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}

