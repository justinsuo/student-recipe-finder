"use client";

import Link from "next/link";
import {
  Plus,
  Mic,
  Camera,
  Zap,
  GlassWater,
  Dumbbell,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import { clsx } from "clsx";

type Action = {
  key: string;
  label: string;
  icon: LucideIcon;
  tone: "emerald" | "violet" | "amber" | "sky" | "cyan" | "rose";
  href?: string;
  onClick?: () => void;
};

const TONE: Record<Action["tone"], { bg: string; iconBg: string; text: string; ring: string }> = {
  emerald: {
    bg: "border-emerald-200 bg-emerald-50/60 hover:border-emerald-300 hover:bg-emerald-100/60",
    iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    text: "text-emerald-800",
    ring: "focus-visible:ring-emerald-500",
  },
  violet: {
    bg: "border-violet-200 bg-violet-50/60 hover:border-violet-300 hover:bg-violet-100/60",
    iconBg: "bg-gradient-to-br from-violet-500 to-violet-700",
    text: "text-violet-800",
    ring: "focus-visible:ring-violet-500",
  },
  amber: {
    bg: "border-amber-200 bg-amber-50/60 hover:border-amber-300 hover:bg-amber-100/60",
    iconBg: "bg-gradient-to-br from-amber-400 to-amber-600",
    text: "text-amber-800",
    ring: "focus-visible:ring-amber-500",
  },
  sky: {
    bg: "border-sky-200 bg-sky-50/60 hover:border-sky-300 hover:bg-sky-100/60",
    iconBg: "bg-gradient-to-br from-sky-500 to-sky-700",
    text: "text-sky-800",
    ring: "focus-visible:ring-sky-500",
  },
  cyan: {
    bg: "border-cyan-200 bg-cyan-50/60 hover:border-cyan-300 hover:bg-cyan-100/60",
    iconBg: "bg-gradient-to-br from-cyan-500 to-cyan-700",
    text: "text-cyan-800",
    ring: "focus-visible:ring-cyan-500",
  },
  rose: {
    bg: "border-rose-200 bg-rose-50/60 hover:border-rose-300 hover:bg-rose-100/60",
    iconBg: "bg-gradient-to-br from-rose-500 to-rose-700",
    text: "text-rose-800",
    ring: "focus-visible:ring-rose-500",
  },
};

/**
 * Quick-log actions on the Today dashboard.
 *
 * Layout: responsive wrapping grid (2 cols on mobile, 4 on sm, 7 on lg)
 * so every action is always tappable without horizontal scroll. Each
 * button is a tone-tinted card with a gradient icon badge, label, and
 * subtle hover-lift.
 *
 * Voice / Scan meal / Scan receipt deep-link to the unified
 * /nourish/log-food?tab=… hub — the hub points users at the existing
 * pantry tools, so we don't duplicate components.
 */
export function QuickLogActions({
  onLogFood,
  onQuickAdd,
  onAddWater,
  onLogExercise,
}: {
  onLogFood: () => void;
  onQuickAdd: () => void;
  onAddWater: () => void;
  onLogExercise: () => void;
}) {
  const actions: Action[] = [
    { key: "log", label: "Log food", icon: Plus, tone: "emerald", onClick: onLogFood },
    { key: "voice", label: "Voice log", icon: Mic, tone: "violet", href: "/nourish/log-food?tab=voice" },
    { key: "scan", label: "Scan meal", icon: Camera, tone: "amber", href: "/nourish/log-food?tab=scan" },
    { key: "receipt", label: "Scan receipt", icon: Receipt, tone: "rose", href: "/nourish/log-food?tab=receipt" },
    { key: "quick", label: "Quick add", icon: Zap, tone: "sky", onClick: onQuickAdd },
    { key: "water", label: "Add water", icon: GlassWater, tone: "cyan", onClick: onAddWater },
    { key: "exercise", label: "Exercise", icon: Dumbbell, tone: "emerald", onClick: onLogExercise },
  ];

  return (
    <div
      role="list"
      aria-label="Quick log actions"
      className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"
    >
      {actions.map((a) => {
        const t = TONE[a.tone];
        const Icon = a.icon;
        const inner = (
          <span
            className={clsx(
              "group flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border bg-gradient-to-br p-3 text-center text-xs font-semibold transition-all motion-safe:hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2",
              t.bg,
              t.text,
              t.ring,
            )}
          >
            <span
              className={clsx(
                "grid h-9 w-9 flex-none place-items-center rounded-xl text-white shadow-sm transition-transform motion-safe:group-hover:scale-110",
                t.iconBg,
              )}
              aria-hidden
            >
              <Icon size={16} />
            </span>
            <span className="text-[11px] leading-tight">{a.label}</span>
          </span>
        );
        return (
          <div key={a.key} role="listitem">
            {a.href ? (
              <Link href={a.href} aria-label={a.label} className="block h-full">
                {inner}
              </Link>
            ) : (
              <button
                type="button"
                onClick={a.onClick}
                aria-label={a.label}
                className="block h-full w-full text-left"
              >
                {inner}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
