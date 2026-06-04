"use client";

import { useState } from "react";
import { clsx } from "clsx";
import {
  X,
  Search,
  Loader2,
  Plus,
  Zap,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ScanBarcode,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SelectablePill } from "@/components/ui/SelectablePill";
import { useFoodSearch, usingDemoKey } from "@/lib/nourish/usdaClient";
import { saveCustomFood, addDiaryEntry, newId, todayString } from "@/lib/nourish/storage";
import { BarcodeScanner } from "./BarcodeScanner";
import type { FoodItem, MealSlot } from "@/lib/nourish/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type Mode = "search" | "barcode" | "custom" | "quick";

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

// ─── Food result card ─────────────────────────────────────────────────────────

function FoodResultCard({
  food,
  onLog,
}: {
  food: FoodItem;
  onLog: (food: FoodItem, servings: number, meal: MealSlot) => void;
}) {
  const [open, setOpen] = useState(false);
  const [servings, setServings] = useState(1);
  const [meal, setMeal] = useState<MealSlot>("lunch");

  return (
    <div className="rounded-xl border border-stone-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 rounded-xl"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-stone-900">{food.name}</p>
          {food.brand && (
            <p className="truncate text-[11px] text-stone-400">{food.brand}</p>
          )}
          <p className="text-[11px] text-stone-500">per {food.servingDescription}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-stone-900">{food.kcal} kcal</p>
            <p className="text-[10px] text-stone-400">
              P {food.proteinG}g · C {food.carbG}g · F {food.fatG}g
            </p>
          </div>
          {open ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-stone-100 px-4 py-3 space-y-3">
          {/* Serving count */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-stone-600 w-16 shrink-0">Servings</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setServings((s) => Math.max(0.5, parseFloat((s - 0.5).toFixed(1))))}
                className="grid h-7 w-7 place-items-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >−</button>
              <span className="w-8 text-center text-sm font-semibold tabular-nums">{servings}</span>
              <button
                type="button"
                onClick={() => setServings((s) => parseFloat((s + 0.5).toFixed(1)))}
                className="grid h-7 w-7 place-items-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >+</button>
            </div>
            <span className="text-xs text-stone-400">
              = {Math.round(food.kcal * servings)} kcal
            </span>
          </div>

          {/* Meal picker */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-stone-600 w-16 shrink-0">Meal</span>
            {(Object.entries(MEAL_LABELS) as [MealSlot, string][]).map(([id, label]) => (
              <SelectablePill
                key={id}
                active={meal === id}
                onClick={() => setMeal(id)}
                ariaSemantics="checked"
                showCheck={false}
                size="sm"
              >
                {label}
              </SelectablePill>
            ))}
          </div>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={13} />}
            onClick={() => onLog(food, servings, meal)}
            className="w-full"
          >
            Add to {MEAL_LABELS[meal]}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Search tab ───────────────────────────────────────────────────────────────

function SearchTab({ onLog }: { onLog: (food: FoodItem, servings: number, meal: MealSlot) => void }) {
  const [query, setQuery] = useState("");
  const { results, loading, error } = useFoodSearch(query);

  return (
    <div className="space-y-3">
      {usingDemoKey() && (
        <p className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-700">
          ⚡ Using demo search key — limited to 30 requests/hour. Add{" "}
          <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_USDA_API_KEY</code> for unlimited.
        </p>
      )}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search foods, e.g. chicken breast, oats…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="w-full rounded-xl border border-stone-300 pl-9 pr-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {loading && (
          <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-500" />
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
      )}

      {query.trim().length >= 2 && !loading && results.length === 0 && !error && (
        <p className="text-center text-sm text-stone-400 py-4">No results for &ldquo;{query}&rdquo;</p>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {results.map((food) => (
          <FoodResultCard key={food.id} food={food} onLog={onLog} />
        ))}
      </div>
    </div>
  );
}

// ─── Custom food tab ──────────────────────────────────────────────────────────

function CustomFoodTab({ onLog }: { onLog: (food: FoodItem, servings: number, meal: MealSlot) => void }) {
  const [name, setName] = useState("");
  const [serving, setServing] = useState("1 serving");
  const [kcal, setKcal] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbG, setCarbG] = useState("");
  const [fatG, setFatG] = useState("");
  const [meal, setMeal] = useState<MealSlot>("lunch");
  const [saved, setSaved] = useState(false);

  const valid =
    name.trim().length > 0 &&
    Number(kcal) >= 0 &&
    Number(proteinG) >= 0 &&
    Number(carbG) >= 0 &&
    Number(fatG) >= 0;

  function handleLog() {
    if (!valid) return;
    const food: FoodItem = {
      id: `custom-${newId()}`,
      source: "custom",
      name: name.trim(),
      servingDescription: serving || "1 serving",
      kcal: Number(kcal),
      proteinG: Number(proteinG),
      carbG: Number(carbG),
      fatG: Number(fatG),
    };
    saveCustomFood(food);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
    onLog(food, 1, meal);
  }

  const inputCls =
    "w-full rounded-xl border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <div className="space-y-3">
      <label className="block space-y-1">
        <span className="text-xs font-medium text-stone-700">Food name *</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Homemade granola" className={inputCls} />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-stone-700">Serving size</span>
        <input type="text" value={serving} onChange={(e) => setServing(e.target.value)} placeholder="e.g. 100g, 1 cup" className={inputCls} />
      </label>

      <div className="grid grid-cols-2 gap-2">
        {([
          ["Calories (kcal) *", kcal, setKcal],
          ["Protein (g) *", proteinG, setProteinG],
          ["Carbs (g) *", carbG, setCarbG],
          ["Fat (g) *", fatG, setFatG],
        ] as [string, string, (v: string) => void][]).map(([label, val, setter]) => (
          <label key={label} className="block space-y-1">
            <span className="text-xs font-medium text-stone-700">{label}</span>
            <input
              type="number"
              min={0}
              value={val}
              onChange={(e) => setter(e.target.value)}
              className={inputCls}
            />
          </label>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-stone-600">Meal:</span>
        {(Object.entries(MEAL_LABELS) as [MealSlot, string][]).map(([id, label]) => (
          <SelectablePill key={id} active={meal === id} onClick={() => setMeal(id)} ariaSemantics="checked" showCheck={false} size="sm">
            {label}
          </SelectablePill>
        ))}
      </div>

      <Button
        variant="primary"
        size="sm"
        leftIcon={saved ? <CheckCircle2 size={13} /> : <Plus size={13} />}
        onClick={handleLog}
        disabled={!valid}
        className="w-full"
      >
        {saved ? "Added!" : `Save & add to ${MEAL_LABELS[meal]}`}
      </Button>
    </div>
  );
}

// ─── Quick-add tab ────────────────────────────────────────────────────────────

function QuickAddTab({ onLog }: { onLog: (food: FoodItem, servings: number, meal: MealSlot) => void }) {
  const [kcal, setKcal] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbG, setCarbG] = useState("");
  const [fatG, setFatG] = useState("");
  const [meal, setMeal] = useState<MealSlot>("lunch");

  const valid = Number(kcal) > 0;

  function handleLog() {
    if (!valid) return;
    const food: FoodItem = {
      id: `quick-${newId()}`,
      source: "custom",
      name: "Quick-add",
      servingDescription: "1 entry",
      kcal: Number(kcal),
      proteinG: Number(proteinG) || 0,
      carbG: Number(carbG) || 0,
      fatG: Number(fatG) || 0,
    };
    onLog(food, 1, meal);
  }

  const inputCls =
    "w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <div className="space-y-3">
      <p className="text-xs text-stone-500">
        Just enter calories (required) and optional macros — no food name needed.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {([
          ["Calories *", kcal, setKcal],
          ["Protein (g)", proteinG, setProteinG],
          ["Carbs (g)", carbG, setCarbG],
          ["Fat (g)", fatG, setFatG],
        ] as [string, string, (v: string) => void][]).map(([label, val, setter]) => (
          <label key={label} className="block space-y-1">
            <span className="text-xs font-medium text-stone-700">{label}</span>
            <input type="number" min={0} value={val} onChange={(e) => setter(e.target.value)} className={inputCls} />
          </label>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-stone-600">Meal:</span>
        {(Object.entries(MEAL_LABELS) as [MealSlot, string][]).map(([id, label]) => (
          <SelectablePill key={id} active={meal === id} onClick={() => setMeal(id)} ariaSemantics="checked" showCheck={false} size="sm">
            {label}
          </SelectablePill>
        ))}
      </div>

      <Button
        variant="primary"
        size="sm"
        leftIcon={<Zap size={13} />}
        onClick={handleLog}
        disabled={!valid}
        className="w-full"
      >
        Quick add to {MEAL_LABELS[meal]}
      </Button>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  onLogged: () => void;
  defaultMeal?: MealSlot;
}

export function AddFoodModal({ onClose, onLogged, defaultMeal = "lunch" }: Props) {
  const [mode, setMode] = useState<Mode>("search");
  const [flash, setFlash] = useState(false);

  function handleLog(food: FoodItem, servings: number, meal: MealSlot) {
    const today = todayString();
    addDiaryEntry({
      id: newId(),
      date: today,
      meal,
      food,
      quantityServings: servings,
      snapshotKcal: food.kcal,
      snapshotProteinG: food.proteinG,
      snapshotCarbG: food.carbG,
      snapshotFatG: food.fatG,
      loggedAt: new Date().toISOString(),
    });
    setFlash(true);
    setTimeout(() => {
      setFlash(false);
      onLogged();
      onClose();
    }, 600);
  }

  void defaultMeal; // available to tabs via defaultMeal prop if needed

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add food"
        className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-lg rounded-2xl border border-stone-200 bg-white shadow-xl motion-safe:animate-[fadeUp_220ms_ease-out]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <h2 className="text-base font-bold text-stone-900">Add food</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full text-stone-500 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 border-b border-stone-100 px-4 pt-3 pb-0">
          {(
            [
              ["search", "Search", Search],
              ["barcode", "Barcode", ScanBarcode],
              ["custom", "Custom", Plus],
              ["quick", "Quick", Zap],
            ] as [Mode, string, React.ElementType][]
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={clsx(
                "flex items-center gap-1.5 rounded-t-xl border-b-2 px-3 py-2 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                mode === id
                  ? "border-emerald-500 text-emerald-700"
                  : "border-transparent text-stone-500 hover:text-stone-700",
              )}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {flash ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <CheckCircle2 size={36} className="text-emerald-500 motion-safe:animate-[popIn_220ms_ease-out]" />
              <p className="text-sm font-semibold text-stone-800">Logged!</p>
            </div>
          ) : (
            <>
              {mode === "search" && <SearchTab onLog={handleLog} />}
              {mode === "barcode" && <BarcodeScanner onLogged={() => { onLogged(); onClose(); }} />}
              {mode === "custom" && <CustomFoodTab onLog={handleLog} />}
              {mode === "quick" && <QuickAddTab onLog={handleLog} />}
            </>
          )}
        </div>
      </div>
    </>
  );
}
