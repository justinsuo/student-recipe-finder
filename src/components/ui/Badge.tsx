import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * Tone keys.
 *
 * Existing tailwind-named tones are kept for backwards compatibility with
 * dozens of consumer sites (BadgeRow, recipe cards, etc.). The Pantry Pop
 * additions are semantic names that map to the warm-app palette and are
 * preferred for new code:
 *
 *   basil   → primary action / pantry surface
 *   carrot  → Nourish + warmth
 *   butter  → Cheap / budget
 *   tomato  → spicy / destructive
 *   grape   → AI Chef / protein
 *   teal    → Grocery / meal prep
 *   pink    → Saved
 */
type Tone =
  | "default"
  | "amber"
  | "green"
  | "emerald"
  | "rose"
  | "orange"
  | "violet"
  | "sky"
  | "yellow"
  | "stone"
  | "red"
  // Pantry Pop semantic tones
  | "basil"
  | "carrot"
  | "butter"
  | "tomato"
  | "grape"
  | "teal"
  | "pink";

const TONES: Record<Tone, string> = {
  default: "bg-[#FFF1D9] text-[#3A2A12] ring-1 ring-inset ring-[#E8D8C4]",
  amber: "bg-amber-100 text-amber-800",
  green: "bg-green-100 text-green-800",
  emerald: "bg-emerald-100 text-emerald-800",
  rose: "bg-rose-100 text-rose-800",
  orange: "bg-orange-100 text-orange-800",
  violet: "bg-violet-100 text-violet-800",
  sky: "bg-sky-100 text-sky-800",
  yellow: "bg-yellow-100 text-yellow-800",
  stone: "bg-stone-200 text-stone-800",
  red: "bg-red-100 text-red-800",

  // Pantry Pop semantic tones — explicit hex so they read consistently
  // across light/dark cream surfaces and aren't accidentally restyled
  // by upstream Tailwind class merges.
  basil:  "bg-[#E8FAF0] text-[#16834A] ring-1 ring-inset ring-[#B6E8CD]",
  carrot: "bg-[#FFE8D6] text-[#9B3F0A] ring-1 ring-inset ring-[#FFC79A]",
  butter: "bg-[#FFF3CC] text-[#7A4A00] ring-1 ring-inset ring-[#FFE08A]",
  tomato: "bg-[#FDE4E4] text-[#9B1C1C] ring-1 ring-inset ring-[#F8B4B4]",
  grape:  "bg-[#EFE8FF] text-[#3F2BB8] ring-1 ring-inset ring-[#CDBEFF]",
  teal:   "bg-[#DCFAF1] text-[#0B6E55] ring-1 ring-inset ring-[#A4ECD8]",
  pink:   "bg-[#FFE3EC] text-[#A23163] ring-1 ring-inset ring-[#F9B6CD]",
};

export function Badge({
  children,
  tone = "default",
  icon,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
