"use client";

import { useEffect, useMemo, useState } from "react";
import { Timer, Check, Square } from "lucide-react";
import { NourishShell } from "@/components/nourish/NourishShell";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FastingTracker } from "@/components/nourish/FastingTracker";
import { getFastingLog, type FastEntry } from "@/lib/nourish/fasting";

function fmtHours(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

/**
 * Dedicated fasting route. The FastingTracker widget (also on the Today
 * dashboard) is the active interface. Below it, summary stats over the
 * last 14 days and the full fasting log.
 */
export default function NourishFastingPage() {
  const [log, setLog] = useState<FastEntry[]>([]);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setLog(getFastingLog());
    setNowMs(Date.now());
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const summary = useMemo(() => {
    if (log.length === 0 || nowMs === null) {
      return {
        last14Count: 0,
        completedCount: 0,
        avgHours: 0,
        longestMs: 0,
      };
    }
    const cutoff = nowMs - 14 * 86_400_000;
    const recent = log.filter((e) => Date.parse(e.endedAt) > cutoff);
    const completed = recent.filter((e) => e.completed).length;
    const longestMs = recent.reduce((m, e) => Math.max(m, e.durationMs), 0);
    const totalHours =
      recent.reduce((s, e) => s + e.durationMs / 3_600_000, 0) /
      Math.max(1, recent.length);
    return {
      last14Count: recent.length,
      completedCount: completed,
      avgHours: totalHours,
      longestMs,
    };
  }, [log, nowMs]);

  return (
    <NourishShell
      title="Fasting."
      description="Track an eating window when it fits. Optional — skip it any day, no shame."
    >
      <FastingTracker />

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <Timer size={11} /> Last 14 days
            </span>
          }
          title="How it's been going."
          tone="indigo"
        />
        {!hydrated ? (
          <div className="mt-5 h-20 animate-pulse rounded-2xl bg-stone-100" />
        ) : summary.last14Count === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center text-sm text-stone-600">
            Start a fast above and we&apos;ll roll up your stats here.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <SummaryStat
              label="Fasts"
              value={`${summary.last14Count}`}
              hint={`${summary.completedCount} completed`}
              tone="indigo"
            />
            <SummaryStat
              label="Average length"
              value={`${summary.avgHours.toFixed(1)}h`}
              hint="per fast"
              tone="emerald"
            />
            <SummaryStat
              label="Longest"
              value={fmtHours(summary.longestMs)}
              hint="in the window"
              tone="violet"
            />
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          eyebrow="Log"
          title={`${log.length} session${log.length === 1 ? "" : "s"}`}
          tone="violet"
        />
        {log.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center text-sm text-stone-600">
            Once you finish your first fast, it&apos;ll show up here with the
            duration and whether you hit the target window.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-stone-100 rounded-2xl border border-stone-200">
            {log.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs"
              >
                <span className="flex items-center gap-2">
                  {e.completed ? (
                    <Check size={12} className="text-emerald-600" />
                  ) : (
                    <Square size={10} className="text-stone-400" />
                  )}
                  <span className="font-medium text-stone-800">
                    {new Date(e.startedAt).toLocaleDateString()}
                  </span>
                  <span className="text-stone-500">
                    → {new Date(e.endedAt).toLocaleDateString()}
                  </span>
                </span>
                <span className="font-semibold tabular-nums text-stone-900">
                  {fmtHours(e.durationMs)}{" "}
                  <span className="font-normal text-stone-500">
                    / {fmtHours(e.targetMs)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-[11px] text-stone-500">
        Intermittent fasting is one approach among many — not medical advice.
        Skip it any day if it doesn&apos;t suit you.
      </p>
    </NourishShell>
  );
}

function SummaryStat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "indigo" | "emerald" | "violet";
}) {
  const TONE: Record<string, string> = {
    indigo: "from-indigo-50 to-white border-indigo-200/70 text-indigo-900",
    emerald: "from-emerald-50 to-white border-emerald-200/70 text-emerald-900",
    violet: "from-violet-50 to-white border-violet-200/70 text-violet-900",
  };
  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-4 ${TONE[tone]}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] opacity-80">{hint}</p>
    </div>
  );
}
