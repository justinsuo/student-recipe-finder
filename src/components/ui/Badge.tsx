import { clsx } from "clsx";
import type { ReactNode } from "react";

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
  | "red";

const TONES: Record<Tone, string> = {
  default: "bg-stone-100 text-stone-700",
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
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
