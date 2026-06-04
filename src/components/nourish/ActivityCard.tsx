"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { Activity, Footprints, Flame, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { isFitbitConnected, getFitbitActivity } from "@/lib/nourish/fitbitClient";
import { isStravaConnected, getStravaActivity } from "@/lib/nourish/stravaClient";
import { getActivitySettings } from "@/lib/nourish/activityStorage";
import type { DailyActivitySummary } from "@/lib/nourish/activityTypes";

interface Props {
  date: string; // YYYY-MM-DD
  /** Current calorie target — used to compute adjusted target when opt-in is on. */
  calorieTarget: number;
  /** Called with the adjusted target when the user has opted in. */
  onAdjustedTarget?: (adjusted: number) => void;
}

export function ActivityCard({ date, calorieTarget, onAdjustedTarget }: Props) {
  const [fitbitData, setFitbitData] = useState<DailyActivitySummary | null>(null);
  const [stravaData, setStravaData] = useState<DailyActivitySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const hasAny = isFitbitConnected() || isStravaConnected();

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setHydrated(true);
    if (!isFitbitConnected() && !isStravaConnected()) return;

    setLoading(true);
    const promises: Promise<void>[] = [];
    if (isFitbitConnected()) {
      promises.push(getFitbitActivity(date).then((d) => { setFitbitData(d); }));
    }
    if (isStravaConnected()) {
      promises.push(getStravaActivity(date).then((d) => { setStravaData(d); }));
    }
    Promise.all(promises).finally(() => setLoading(false));
  }, [date]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Compute adjusted target if opt-in setting is on
  useEffect(() => {
    if (!onAdjustedTarget) return;
    const settings = getActivitySettings();
    if (!settings.adjustTargetWithActivity) return;

    // Prefer Fitbit total expenditure; fall back to Strava active calories
    const activeKcal =
      (fitbitData?.activeCalories ?? 0) ||
      (stravaData?.activeCalories ?? 0);

    if (activeKcal > 0) {
      const bonus = Math.round(activeKcal * settings.activityAdjustmentFraction);
      onAdjustedTarget(calorieTarget + bonus);
    }
  }, [fitbitData, stravaData, calorieTarget, onAdjustedTarget]);

  if (!hydrated || !hasAny) return null;

  const fitbitKcal = fitbitData?.totalCaloriesBurned;
  const stravaActive = stravaData?.activeCalories;
  const steps = fitbitData?.steps;
  const activeMinutes =
    (fitbitData?.activeMinutes ?? 0) + (stravaData?.activeMinutes ?? 0);
  const allWorkouts = [
    ...(fitbitData?.workouts ?? []),
    ...(stravaData?.workouts ?? []),
  ];

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
      >
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-stone-400" />
          <span className="text-sm font-semibold text-stone-800">Activity</span>
          {loading && (
            <span className="text-[10px] text-stone-400 animate-pulse">syncing…</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {fitbitKcal !== undefined && (
            <span className="text-xs font-bold text-stone-700 tabular-nums">
              {fitbitKcal.toLocaleString()} kcal burned
            </span>
          )}
          {stravaActive !== undefined && fitbitKcal === undefined && (
            <span className="text-xs font-bold text-stone-700 tabular-nums">
              {stravaActive} active kcal
            </span>
          )}
          {expanded ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-stone-100 px-4 py-3 space-y-3">
          {/* Stats row */}
          <div className="flex gap-4 flex-wrap">
            {fitbitKcal !== undefined && (
              <div className="flex items-center gap-1.5">
                <Flame size={13} className="text-orange-400" />
                <div>
                  <p className="text-sm font-bold tabular-nums text-stone-900">{fitbitKcal.toLocaleString()}</p>
                  <p className="text-[10px] text-stone-400">kcal burned (Fitbit)</p>
                </div>
              </div>
            )}
            {stravaActive !== undefined && (
              <div className="flex items-center gap-1.5">
                <Flame size={13} className="text-orange-300" />
                <div>
                  <p className="text-sm font-bold tabular-nums text-stone-900">{stravaActive}</p>
                  <p className="text-[10px] text-stone-400">active kcal (Strava)</p>
                </div>
              </div>
            )}
            {steps !== undefined && (
              <div className="flex items-center gap-1.5">
                <Footprints size={13} className="text-sky-400" />
                <div>
                  <p className="text-sm font-bold tabular-nums text-stone-900">{steps.toLocaleString()}</p>
                  <p className="text-[10px] text-stone-400">steps</p>
                </div>
              </div>
            )}
            {activeMinutes > 0 && (
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-emerald-400" />
                <div>
                  <p className="text-sm font-bold tabular-nums text-stone-900">{activeMinutes}</p>
                  <p className="text-[10px] text-stone-400">active min</p>
                </div>
              </div>
            )}
          </div>

          {/* Workouts */}
          {allWorkouts.length > 0 && (
            <div className="space-y-1">
              {allWorkouts.map((w, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-stone-700">{w.name}</span>
                  <span className="text-stone-400 tabular-nums">
                    {w.durationMinutes}min{w.caloriesBurned ? ` · ${w.caloriesBurned} kcal` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!loading && !fitbitData && !stravaData && (
            <p className="text-xs text-stone-400">No activity data found for {date}.</p>
          )}

          {/* Disclaimer */}
          <p className={clsx(
            "text-[10px] leading-relaxed",
            getActivitySettings().adjustTargetWithActivity ? "text-amber-600" : "text-stone-400",
          )}>
            {getActivitySettings().adjustTargetWithActivity
              ? `⚠️ Calorie target is being adjusted based on activity data (estimated). Toggle off in Profile → Activity connections.`
              : "Calorie figures are device estimates and may vary. Not used to adjust your target (opt-in in Profile)."}
          </p>
        </div>
      )}
    </div>
  );
}
