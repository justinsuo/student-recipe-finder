"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NourishShell } from "@/components/nourish/NourishShell";
import { TrendsView } from "@/components/nourish/TrendsView";
import { WeeklyReview } from "@/components/nourish/WeeklyReview";
import {
  getDiaryEntries,
  getTargets,
  getWeightLog,
} from "@/lib/nourish/storage";
import type {
  DiaryEntry,
  TargetSnapshot,
  WeightEntry,
} from "@/lib/nourish/types";

export default function NourishProgressPage() {
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [targets, setTargets] = useState<TargetSnapshot | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDiary(getDiaryEntries());
    setWeights(getWeightLog());
    setTargets(getTargets());
    setHydrated(true);
  }, []);

  return (
    <NourishShell
      title="Progress."
      description="Weight trend, calories and macros over time, weekly review, and goal adherence."
    >
      {hydrated && targets ? (
        <WeeklyReview diary={diary} weights={weights} targets={targets} />
      ) : hydrated ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-6 text-sm text-stone-700 shadow-sm">
          Set up goals on the{" "}
          <Link
            href="/nourish/goals"
            className="font-semibold text-emerald-700 hover:underline"
          >
            Goals page
          </Link>{" "}
          to see weekly review.
        </div>
      ) : (
        <div className="h-32 animate-pulse rounded-3xl bg-stone-100" />
      )}
      <TrendsView />
    </NourishShell>
  );
}
