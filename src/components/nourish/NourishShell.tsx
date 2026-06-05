"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { OnboardingWizard } from "@/components/nourish/OnboardingWizard";
import { NourishSubNav } from "@/components/nourish/NourishSubNav";
import { isOnboarded } from "@/lib/nourish/storage";

/**
 * Shared shell for every /nourish/* route. Handles:
 *   - hydration skeleton while we wait for localStorage
 *   - onboarding gate (renders the wizard the first time a user lands)
 *   - the PageHeader + sticky sub-nav so each route's body stays short
 */
export function NourishShell({
  title = "Today's nourish.",
  description,
  eyebrow = "Nourish",
  showHeader = true,
  children,
}: {
  title?: string;
  description?: string;
  eyebrow?: string;
  /** Set false when the parent server component already renders the PageHeader. */
  showHeader?: boolean;
  children: ReactNode;
}) {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnboarded(isOnboarded());
  }, []);

  if (onboarded === null) {
    return (
      <div className="space-y-6">
        <div className="h-36 animate-pulse rounded-3xl bg-stone-100" />
        <div className="h-12 animate-pulse rounded-2xl bg-stone-100" />
        <div className="h-48 animate-pulse rounded-2xl bg-stone-100" />
      </div>
    );
  }

  if (!onboarded) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Nourish"
          title="Track what fuels you."
          description="Set your starting numbers once. We'll personalize calorie + macro targets, and they'll tune themselves as your weight trend updates."
          tone="emerald"
        />
        <OnboardingWizard onComplete={() => setOnboarded(true)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <PageHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          tone="emerald"
        />
      )}
      <NourishSubNav />
      <div className="space-y-6">{children}</div>
    </div>
  );
}
