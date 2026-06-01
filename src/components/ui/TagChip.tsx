import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * Passive (not clickable) tag chip. Used to label recipe attributes like
 * "Dorm-friendly", "One pot", "High protein". Title-cased.
 */
export function TagChip({
  children,
  tone = "stone",
  size = "sm",
}: {
  children: ReactNode;
  tone?: "stone" | "emerald" | "amber" | "violet" | "sky";
  size?: "xs" | "sm";
}) {
  const tones = {
    stone: "bg-stone-100 text-stone-700",
    emerald: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    violet: "bg-violet-100 text-violet-800",
    sky: "bg-sky-100 text-sky-800",
  };
  const sizes = {
    xs: "text-[10px] px-1.5 py-0.5",
    sm: "text-[11px] px-2 py-0.5",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full font-medium",
        tones[tone],
        sizes[size],
      )}
    >
      {formatTagLabel(children)}
    </span>
  );
}

function formatTagLabel(c: ReactNode): ReactNode {
  if (typeof c !== "string") return c;
  // Replace dashes/underscores with spaces and title-case
  const parts = c.replace(/[-_]+/g, " ").split(" ");
  return parts
    .map((p) =>
      p.length === 0 ? p : p[0].toUpperCase() + p.slice(1).toLowerCase(),
    )
    .join(" ");
}
