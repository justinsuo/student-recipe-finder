"use client";

import { useEffect, useState } from "react";
import { X, Dumbbell, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  EXERCISE_DEFAULTS,
  type ExerciseKind,
  type ExerciseEntry,
  addExerciseEntry,
  deleteExerciseEntry,
  getExerciseForDate,
} from "@/lib/nourish/exercise";
import { newId, todayString } from "@/lib/nourish/storage";

/**
 * Modal sheet for logging an exercise session on the Today dashboard.
 * Auto-suggests calories from a MET table when the user picks a kind +
 * duration; user can override the number directly. Lists today's logged
 * sessions inline so the user can verify or delete in one place.
 */
export function ExerciseLogger({
  onClose,
  onLogged,
}: {
  onClose: () => void;
  onLogged: () => void;
}) {
  const toast = useToast();
  const today = todayString();
  const [kind, setKind] = useState<ExerciseKind>("walking");
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [calories, setCalories] = useState(EXERCISE_DEFAULTS.walking.kcalPerMin * 30);
  const [todayList, setTodayList] = useState<ExerciseEntry[]>([]);
  const [touched, setTouched] = useState(false);

  function refresh() {
    setTodayList(getExerciseForDate(today));
  }

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    refresh();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  // Auto-recalc calories when kind/minutes change, unless user manually edited.
  useEffect(() => {
    if (touched) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCalories(Math.round(EXERCISE_DEFAULTS[kind].kcalPerMin * minutes));
  }, [kind, minutes, touched]);

  function save() {
    const entry: ExerciseEntry = {
      id: newId(),
      date: today,
      kind,
      name: name.trim() || EXERCISE_DEFAULTS[kind].label,
      durationMinutes: Math.max(1, Math.round(minutes)),
      caloriesBurned: Math.max(0, Math.round(calories)),
      createdAt: new Date().toISOString(),
    };
    addExerciseEntry(entry);
    refresh();
    onLogged();
    toast.reward(
      `Logged ${entry.durationMinutes} min ${entry.name.toLowerCase()} (${entry.caloriesBurned} kcal).`,
    );
    setName("");
    setTouched(false);
  }

  function remove(id: string) {
    deleteExerciseEntry(id);
    refresh();
    onLogged();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl motion-safe:animate-[fadeUp_240ms_ease-out] sm:max-w-md sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm shadow-emerald-200">
              <Dumbbell size={18} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Nourish
              </p>
              <p className="text-sm font-semibold text-stone-900">
                Log exercise
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Type
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.keys(EXERCISE_DEFAULTS) as ExerciseKind[]).map((k) => {
                const active = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setKind(k);
                      setTouched(false);
                    }}
                    aria-pressed={active}
                    className={
                      active
                        ? "rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-200 motion-safe:scale-[1.02]"
                        : "rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-all hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50"
                    }
                  >
                    {EXERCISE_DEFAULTS[k].label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Name (optional)
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={EXERCISE_DEFAULTS[kind].label}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                Minutes
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={600}
                value={minutes}
                onChange={(e) => {
                  setMinutes(parseInt(e.target.value, 10) || 0);
                }}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-lg font-semibold tabular-nums text-stone-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                Calories burned
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={5000}
                value={calories}
                onChange={(e) => {
                  setCalories(parseInt(e.target.value, 10) || 0);
                  setTouched(true);
                }}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-lg font-semibold tabular-nums text-stone-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>
          {!touched && (
            <p className="text-[11px] text-stone-500">
              Auto-estimated from a conservative MET table. Tap to override.
            </p>
          )}

          <Button onClick={save}>Save to today</Button>

          {todayList.length > 0 && (
            <div className="border-t border-stone-100 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                Today
              </p>
              <ul className="mt-2 space-y-1.5">
                {todayList.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-2 text-xs"
                  >
                    <span className="text-stone-700">
                      {e.name} · {e.durationMinutes} min
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold tabular-nums text-emerald-700">
                        {e.caloriesBurned} kcal
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(e.id)}
                        aria-label={`Delete ${e.name}`}
                        className="text-stone-400 transition-colors hover:text-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[11px] text-stone-500">
            Calorie burn is an estimate based on duration and exercise type.
            Use a fitness tracker for higher accuracy.
          </p>
        </div>
      </div>
    </div>
  );
}
