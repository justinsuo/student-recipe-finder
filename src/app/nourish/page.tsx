"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { NourishShell } from "@/components/nourish/NourishShell";
import { TodayDashboard } from "@/components/nourish/TodayDashboard";
import { NourishInsights } from "@/components/nourish/NourishInsights";
import { FastingTracker } from "@/components/nourish/FastingTracker";
import { maybeUpdateAdaptiveTdee } from "@/lib/nourish/adaptiveTdee";

/**
 * Nourish "Today" dashboard. Sits inside NourishShell (handles onboarding +
 * shared header + sub-nav). Body is the existing TodayDashboard plus two
 * new sidecar panels: insights (what to cook to hit your remaining macros)
 * and the optional intermittent-fasting tracker.
 */
export default function NourishTodayPage() {
  const router = useRouter();

  useEffect(() => {
    // Weekly adaptive-TDEE check — background, no UI.
    maybeUpdateAdaptiveTdee();
  }, []);

  return (
    <NourishShell
      title="Today's nourish."
      description="Calories left, macros to hit, and what to cook to get there. Log meals from search, recipes, voice, or photo."
    >
      <TodayDashboard onSwitchToDiary={() => router.push("/nourish/diary")} />
      <NourishInsights />
      <FastingTracker />
    </NourishShell>
  );
}
