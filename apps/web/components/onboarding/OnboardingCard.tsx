'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';

interface OnboardingCardProps {
  /** e.g. 1 */
  step: number;
  /** e.g. 2 */
  totalSteps: number;
  heading: string;
  description: string;
  /** Label for the primary CTA button */
  actionLabel: string;
  /** If provided, clicking the button navigates to this URL (full page navigation) */
  actionHref?: string;
  /** If provided, clicking the button calls this handler (for programmatic actions) */
  onAction?: () => void;
  /** Controls loading spinner state on the button */
  isLoading?: boolean;
}

/**
 * OnboardingCard
 *
 * Full-screen card used during the onboarding flow.
 * Matches the Figma design: step indicator in cyan, bold heading,
 * muted description, and a full-width CTA button.
 */
export function OnboardingCard({
  step,
  totalSteps,
  heading,
  description,
  actionLabel,
  actionHref,
  onAction,
  isLoading = false,
}: OnboardingCardProps) {
  const handleClick = React.useCallback(() => {
    if (isLoading) return;
    if (actionHref) {
      window.location.href = actionHref;
    } else if (onAction) {
      onAction();
    }
  }, [actionHref, onAction, isLoading]);

  return (
    <div className="w-full max-w-[480px] bg-[#0F172A] rounded-2xl border border-white/5 px-8 py-10 sm:px-12 flex flex-col items-center text-center gap-4 shadow-2xl">
      {/* Step indicator */}
      <p className="text-[#06B6D4] text-sm font-semibold tracking-wide">
        Step {step} of {totalSteps}
      </p>

      {/* Heading */}
      <h1 className="text-white text-2xl font-bold leading-tight">{heading}</h1>

      {/* Description */}
      <p className="text-[#94A3B8] text-sm leading-relaxed max-w-sm">{description}</p>

      {/* CTA Button */}
      <button
        id={`onboarding-step-${step}-btn`}
        type="button"
        disabled={isLoading}
        onClick={handleClick}
        className="mt-2 w-full max-w-[360px] h-12 rounded-lg bg-[#0EA5E9] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150 hover:bg-[#38BDF8] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Connecting…
          </>
        ) : (
          actionLabel
        )}
      </button>
    </div>
  );
}
