"use client";

import { useEffect, useMemo, useState } from "react";
import { FileBarChart, Printer, Copy as CopyIcon } from "lucide-react";
import { NourishShell } from "@/components/nourish/NourishShell";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { DataExport } from "@/components/nourish/DataExport";
import { useToast } from "@/components/ui/Toast";
import {
  getDiaryEntries,
  getTargets,
  getWaterLog,
  todayString,
} from "@/lib/nourish/storage";
import { sumTotals, type DiaryEntry, type TargetSnapshot } from "@/lib/nourish/types";

type Range = "today" | "week" | "month";

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function rangeBounds(r: Range): { from: string; to: string; days: number } {
  const to = todayString();
  if (r === "today") return { from: to, to, days: 1 };
  if (r === "week") return { from: dateOffset(6), to, days: 7 };
  return { from: dateOffset(29), to, days: 30 };
}

export default function NourishReportsPage() {
  const toast = useToast();
  const [range, setRange] = useState<Range>("week");
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [targets, setTargets] = useState<TargetSnapshot | null>(null);
  const [waterMl, setWaterMl] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(getDiaryEntries());
    setTargets(getTargets());
    setWaterMl(
      getWaterLog().reduce((acc, w) => {
        const { from, to } = rangeBounds("week");
        if (w.date >= from && w.date <= to) return acc + w.mlConsumed;
        return acc;
      }, 0),
    );
    setHydrated(true);
  }, []);

  const filtered = useMemo(() => {
    const { from, to } = rangeBounds(range);
    return entries.filter((e) => e.date >= from && e.date <= to);
  }, [entries, range]);

  const totals = useMemo(() => sumTotals(filtered), [filtered]);
  const { days } = rangeBounds(range);
  const avgPerDay = useMemo(
    () => ({
      kcal: Math.round(totals.kcal / Math.max(1, days)),
      proteinG: Math.round(totals.proteinG / Math.max(1, days)),
      carbG: Math.round(totals.carbG / Math.max(1, days)),
      fatG: Math.round(totals.fatG / Math.max(1, days)),
    }),
    [totals, days],
  );

  // Goal-adherence days: % of days in range whose total kcal is within
  // ±15% of the calorie target. Soft definition that's friendly to outliers.
  const adherence = useMemo(() => {
    if (!targets || days === 0) return null;
    const byDate = new Map<string, number>();
    for (const e of filtered) {
      byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.snapshotKcal * e.quantityServings);
    }
    if (byDate.size === 0) return 0;
    const tol = targets.calorieTarget * 0.15;
    let hits = 0;
    for (const total of byDate.values()) {
      if (Math.abs(total - targets.calorieTarget) <= tol) hits += 1;
    }
    return Math.round((hits / byDate.size) * 100);
  }, [filtered, targets, days]);

  function copySummary() {
    const lines = [
      `Waivy / Nourish — ${range === "today" ? "Today" : range === "week" ? "Past 7 days" : "Past 30 days"}`,
      ``,
      `Calories: ${Math.round(totals.kcal)} total · ${avgPerDay.kcal}/day avg`,
      `Protein:  ${Math.round(totals.proteinG)} g total · ${avgPerDay.proteinG}/day avg`,
      `Carbs:    ${Math.round(totals.carbG)} g total · ${avgPerDay.carbG}/day avg`,
      `Fat:      ${Math.round(totals.fatG)} g total · ${avgPerDay.fatG}/day avg`,
      targets
        ? `Target:   ${targets.calorieTarget} kcal/day · ${targets.proteinG}g P / ${targets.carbG}g C / ${targets.fatG}g F`
        : `Target:   not set`,
      adherence !== null ? `Adherence: ${adherence}% of logged days within ±15% of calorie target` : ``,
      `Entries:  ${filtered.length}`,
    ]
      .filter(Boolean)
      .join("\n");
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(lines);
      toast.success("Summary copied to clipboard.");
    }
  }

  function printPage() {
    if (typeof window !== "undefined") window.print();
  }

  return (
    <NourishShell
      title="Reports."
      description="Daily, weekly, and monthly summaries with calorie + macro adherence. Copy a summary, print, or export raw data."
    >
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <FileBarChart size={11} /> Summary
            </span>
          }
          title="Pick a range."
          tone="violet"
        />
        <div className="mt-5 flex flex-wrap gap-2">
          {(
            [
              { value: "today", label: "Today" },
              { value: "week", label: "Past 7 days" },
              { value: "month", label: "Past 30 days" },
            ] as { value: Range; label: string }[]
          ).map(({ value, label }) => {
            const active = range === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setRange(value)}
                className={
                  active
                    ? "rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-200 motion-safe:scale-[1.02]"
                    : "rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-all hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50"
                }
              >
                {label}
              </button>
            );
          })}
        </div>

        {hydrated && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryStat label="Avg calories" value={`${avgPerDay.kcal}`} unit="kcal/day" tone="rose" />
            <SummaryStat label="Avg protein" value={`${avgPerDay.proteinG}`} unit="g/day" tone="violet" />
            <SummaryStat label="Avg carbs" value={`${avgPerDay.carbG}`} unit="g/day" tone="sky" />
            <SummaryStat label="Avg fat" value={`${avgPerDay.fatG}`} unit="g/day" tone="amber" />
          </div>
        )}

        {targets && adherence !== null && (
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
              Goal adherence
            </p>
            <p className="mt-1 text-lg font-bold text-emerald-900">
              {adherence}%{" "}
              <span className="text-xs font-normal text-emerald-800">
                of logged days within ±15% of {targets.calorieTarget} kcal/day
              </span>
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" leftIcon={<CopyIcon size={14} />} onClick={copySummary}>
            Copy summary
          </Button>
          <Button size="sm" variant="ghost" leftIcon={<Printer size={14} />} onClick={printPage}>
            Print
          </Button>
        </div>

        {hydrated && range === "week" && (
          <p className="mt-4 text-[11px] text-stone-500">
            Includes {filtered.length} food entries and {Math.round(waterMl / 240)} cups of water across the range.
          </p>
        )}
      </section>

      <section>
        <SectionHeading
          eyebrow="Export"
          title="Take your data with you."
          description="Diary entries, weight log, and custom foods as CSV or JSON. All offline — nothing leaves your browser."
          tone="sky"
        />
        <div className="mt-5">
          <DataExport />
        </div>
      </section>

      <p className="text-[11px] text-stone-500">
        Nutrition estimates are for general tracking only and may vary by brand,
        portion, and preparation. Not medical advice.
      </p>
    </NourishShell>
  );
}

function SummaryStat({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  tone: "rose" | "violet" | "sky" | "amber";
}) {
  const TONE: Record<string, string> = {
    rose: "bg-rose-100 text-rose-700",
    violet: "bg-violet-100 text-violet-700",
    sky: "bg-sky-100 text-sky-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums text-stone-900">
        {value}{" "}
        <span className={`ml-1 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${TONE[tone]}`}>
          {unit}
        </span>
      </p>
    </div>
  );
}
