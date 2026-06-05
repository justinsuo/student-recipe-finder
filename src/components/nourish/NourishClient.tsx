"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { NourishShell } from "@/components/nourish/NourishShell";
import { TodayDashboard } from "@/components/nourish/TodayDashboard";
import { NourishInsights } from "@/components/nourish/NourishInsights";
import { FastingTracker } from "@/components/nourish/FastingTracker";
import { maybeUpdateAdaptiveTdee } from "@/lib/nourish/adaptiveTdee";

export default function NourishClient() {
  const router = useRouter();

  useEffect(() => {
    // Weekly adaptive-TDEE check — background, no UI.
    maybeUpdateAdaptiveTdee();
  }, []);

  return (
    <NourishShell showHeader={false}>
      <TodayDashboard onSwitchToDiary={() => router.push("/nourish/diary")} />
      <NourishInsights />
      <FastingTracker />
    </NourishShell>
  );
}
