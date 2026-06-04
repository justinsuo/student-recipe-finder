"use client";

import { useState, useEffect } from "react";
import { Apple, BookOpen, TrendingUp, UtensilsCrossed, User, CheckCircle2, AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { PageHeader } from "@/components/ui/PageHeader";
import { OnboardingWizard } from "@/components/nourish/OnboardingWizard";
import { ProfileView } from "@/components/nourish/ProfileView";
import { DiaryView } from "@/components/nourish/DiaryView";
import { TodayDashboard } from "@/components/nourish/TodayDashboard";
import { TrendsView } from "@/components/nourish/TrendsView";
import { FoodsView } from "@/components/nourish/FoodsView";
import { isOnboarded } from "@/lib/nourish/storage";
import { maybeUpdateAdaptiveTdee } from "@/lib/nourish/adaptiveTdee";

type Tab = "today" | "diary" | "trends" | "foods" | "profile";
type OAuthStatus = { provider: "fitbit" | "strava"; ok: boolean; message: string } | null;

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
  const [oauthStatus, setOauthStatus] = useState<OAuthStatus>(null);

  // On mount: read localStorage state, run adaptive TDEE, and handle OAuth callbacks.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setOnboarded(isOnboarded());
    maybeUpdateAdaptiveTdee();

    // Handle OAuth redirect callbacks — Fitbit and Strava redirect back here
    // with ?code=... in the URL after the user approves the connection.
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state"); // "strava" marker or absent (Fitbit)

    if (code) {
      // Remove the query params from the URL without a page reload
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);

      const redirectUri = `${window.location.origin}${window.location.pathname}`;

      if (state === "strava") {
        // Strava callback
        import("@/lib/nourish/stravaClient")
          .then(({ exchangeStravaCode }) => exchangeStravaCode(code, redirectUri))
          .then((token) => {
            setOauthStatus({
              provider: "strava",
              ok: true,
              message: `Strava connected${token.displayName ? ` as ${token.displayName}` : ""}`,
            });
            setTab("profile");
          })
          .catch((e) => {
            setOauthStatus({
              provider: "strava",
              ok: false,
              message: e instanceof Error ? e.message : "Strava connection failed",
            });
          });
      } else {
        // Fitbit callback (no state parameter set)
        import("@/lib/nourish/fitbitClient")
          .then(({ exchangeFitbitCode }) => exchangeFitbitCode(code, redirectUri))
          .then((token) => {
            setOauthStatus({
              provider: "fitbit",
              ok: true,
              message: `Fitbit connected${token.displayName ? ` as ${token.displayName}` : ""}`,
            });
            setTab("profile");
          })
          .catch((e) => {
            setOauthStatus({
              provider: "fitbit",
              ok: false,
              message: e instanceof Error ? e.message : "Fitbit connection failed",
            });
          });
      }
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

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

      {/* OAuth connection status banner */}
      {oauthStatus && (
        <div
          className={clsx(
            "flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm",
            oauthStatus.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800",
          )}
        >
          {oauthStatus.ok
            ? <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
            : <AlertCircle size={16} className="shrink-0 text-rose-500" />}
          <span className="font-medium">{oauthStatus.message}</span>
          <button
            type="button"
            onClick={() => setOauthStatus(null)}
            className="ml-auto text-xs opacity-60 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

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
        {tab === "foods" && <FoodsView />}
        {tab === "profile" && (
          <ProfileView onResetProfile={() => setOnboarded(false)} />
        )}
      </div>
    </div>
  );
}
