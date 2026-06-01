"use client";

import {
  Flame,
  Eye,
  HandHelping,
  Lightbulb,
  Timer,
  ShieldAlert,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { RecipeInstructionStep } from "@/lib/types";

const HEAT_LABEL: Record<string, string> = {
  none: "no heat",
  low: "low",
  "medium-low": "medium-low",
  medium: "medium",
  "medium-high": "medium-high",
  high: "high",
};

/**
 * Renders the beginner-friendly long-form step explanations under the
 * simple numbered Steps card. Only shows when the recipe has
 * `detailedSteps` populated (currently AI-generated recipes only).
 */
export function DetailedSteps({ steps }: { steps: RecipeInstructionStep[] }) {
  if (!steps || steps.length === 0) return null;
  return (
    <Card>
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-700">
        <HandHelping size={16} /> Detailed guide (for beginners)
      </h2>
      <p className="mt-1 text-xs text-stone-500">
        The why, the heat, the look, and the taste — for each step.
      </p>
      <ol className="mt-3 space-y-4">
        {steps.map((s, i) => (
          <li key={i} className="border-l-2 border-emerald-200 pl-3">
            <p className="text-sm font-semibold text-stone-900">
              <span className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                {i + 1}
              </span>
              {s.shortStep}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-stone-700">
              {s.detailedExplanation}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              {s.heatLevel && s.heatLevel !== "none" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-orange-800">
                  <Flame size={10} /> heat: {HEAT_LABEL[s.heatLevel] ?? s.heatLevel}
                </span>
              )}
              {s.timerMinutes ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                  <Timer size={10} /> {s.timerMinutes} min
                </span>
              ) : null}
              {s.textureCue && (
                <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-stone-700">
                  <Eye size={10} /> {s.textureCue}
                </span>
              )}
              {s.tasteCue && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-rose-800">
                  👅 {s.tasteCue}
                </span>
              )}
              {s.beginnerTip && (
                <span className="inline-flex items-start gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-sky-800">
                  <Lightbulb size={10} className="mt-0.5" /> {s.beginnerTip}
                </span>
              )}
              {s.safetyNote && (
                <span className="inline-flex items-start gap-1 rounded-full bg-red-100 px-2 py-0.5 text-red-800">
                  <ShieldAlert size={10} className="mt-0.5" /> {s.safetyNote}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
