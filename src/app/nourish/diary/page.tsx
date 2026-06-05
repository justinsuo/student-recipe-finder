"use client";

import { NourishShell } from "@/components/nourish/NourishShell";
import { DiaryView } from "@/components/nourish/DiaryView";

export default function NourishDiaryPage() {
  return (
    <NourishShell
      title="Food diary."
      description="Every meal you've logged, grouped by day and meal slot. Pick a date, edit servings, or copy a meal to today."
    >
      <DiaryView />
    </NourishShell>
  );
}
