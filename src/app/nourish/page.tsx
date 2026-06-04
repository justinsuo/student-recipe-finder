"use client";

import { useState, useEffect } from "react";
import { Apple, BookOpen, TrendingUp, UtensilsCrossed, User } from "lucide-react";
import { clsx } from "clsx";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { OnboardingWizard } from "@/components/nourish/OnboardingWizard";
import { ProfileView } from "@/components/nourish/ProfileView";
import { DiaryView } from "@/components/nourish/DiaryView";
import { TodayDashboard } from "@/components/nourish/TodayDashboard";
import { TrendsView } from "@/components/nourish/TrendsView";
import { isOnboarded } from "@/lib/nourish/storage";

type Tab = "today" | "diary" | "trends" | "foods" | "profile";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "today", label: "Today", icon: Apple },
  { id: "diary", label: "Diary", icon: BookOpen },
  { id: "trends", label: "Trends", icon: TrendingUp },
  { id: "foods", label: "Foods", icon: UtensilsCrossed },
  { id: "profile", label: "Profile", icon: User },
];

export default function NourishPage() {
  const [tab, setTab] = useState<Tab>("today");
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  // Defer localStorage read to client to avoid hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnboarded(isOnboarded());
  }, []);

  function handleOnboardingComplete() {
    setOnboarded(true);
    setTab("today");
  }

  // Still loading from localStorage
  if (onboarded === null) return null;

  // Show onboarding wizard for new users
  if (!onboarded) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <PageHeader
          eyebrow="Nourish"
          title="Track what fuels you"
          description="Log meals, hit your macro targets, and discover recipes that fit what you have left in your day."
          tone="emerald"
        />
        <div className="mt-6">
          <OnboardingWizard onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
      <PageHeader
        eyebrow="Nourish"
        title="Track what fuels you"
        description="Log meals, hit your macro targets, and discover recipes that fit what you have left in your day."
        tone="emerald"
      />

      {/* Sub-tab bar */}
      <nav
        aria-label="Nourish sections"
        className="flex overflow-x-auto rounded-2xl border border-stone-200 bg-white p-1 shadow-sm"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={clsx(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
              tab === id
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-50",
            )}
          >
            <Icon size={14} aria-hidden />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </nav>

      {/* Tab panels */}
      <div role="tabpanel">
        {tab === "today" && (
          <TodayDashboard onSwitchToDiary={() => setTab("diary")} />
        )}
        {tab === "diary" && <DiaryView />}
        {tab === "trends" && <TrendsView />}
        {tab === "foods" && (
          <EmptyState
            emoji="🥘"
            title="No custom foods yet"
            description="Create custom foods or save frequent items here for one-tap logging."
            tone="emerald"
          />
        )}
        {tab === "profile" && (
          <ProfileView onResetProfile={() => setOnboarded(false)} />
        )}
      </div>
    </div>
  );
}
