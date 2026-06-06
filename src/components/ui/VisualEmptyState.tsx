"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * Illustration-style empty state. Instead of a single emoji + paragraph,
 * stacks three soft icon chips against a tinted "scene" backdrop so the
 * surface feels staged, not blank.
 *
 * Lean copy: ≤8 word title, ≤14 word body, real CTAs from `actions`.
 */

type Tone = "basil" | "carrot" | "butter" | "grape" | "teal" | "sky" | "pink";

const TONE: Record<Tone, { wash: string; ring: string; chipA: string; chipB: string; chipC: string; title: string; body: string }> = {
  basil:  { wash: "from-[#E8FAF0] via-white to-[#FFF8ED]", ring: "ring-[#B6E8CD]", chipA: "bg-[#2FBF71]", chipB: "bg-[#FFD166]", chipC: "bg-[#FF8A3D]", title: "text-[#0F5E33]", body: "text-[#16834A]" },
  carrot: { wash: "from-[#FFE8D6] via-white to-[#FFF8ED]", ring: "ring-[#FFC79A]", chipA: "bg-[#FF8A3D]", chipB: "bg-[#FFD166]", chipC: "bg-[#7C5CFF]", title: "text-[#7C3309]", body: "text-[#9B3F0A]" },
  butter: { wash: "from-[#FFF3CC] via-white to-[#FFF8ED]", ring: "ring-[#FFE08A]", chipA: "bg-[#FFC93D]", chipB: "bg-[#2FBF71]", chipC: "bg-[#FF8A3D]", title: "text-[#5C3700]", body: "text-[#7A4A00]" },
  grape:  { wash: "from-[#EFE8FF] via-white to-[#FFF8ED]", ring: "ring-[#CDBEFF]", chipA: "bg-[#7C5CFF]", chipB: "bg-[#20C7A5]", chipC: "bg-[#FFD166]", title: "text-[#2A1B8A]", body: "text-[#3F2BB8]" },
  teal:   { wash: "from-[#DCFAF1] via-white to-[#FFF8ED]", ring: "ring-[#A4ECD8]", chipA: "bg-[#20C7A5]", chipB: "bg-[#3BA7FF]", chipC: "bg-[#FF8A3D]", title: "text-[#08503D]", body: "text-[#0B6E55]" },
  sky:    { wash: "from-[#E0F2FE] via-white to-[#FFF8ED]", ring: "ring-[#BAE6FD]", chipA: "bg-[#3BA7FF]", chipB: "bg-[#2FBF71]", chipC: "bg-[#FFD166]", title: "text-[#0B4F7B]", body: "text-[#1F6FA8]" },
  pink:   { wash: "from-[#FFE3EC] via-white to-[#FFF8ED]", ring: "ring-[#F9B6CD]", chipA: "bg-[#FF6B9E]", chipB: "bg-[#FFD166]", chipC: "bg-[#2FBF71]", title: "text-[#73214A]", body: "text-[#A23163]" },
};

export function VisualEmptyState({
  icon,
  title,
  body,
  actions,
  tone = "basil",
  className,
}: {
  /** Rendered icon (e.g. `<Bookmark size={28} />`). */
  icon: ReactNode;
  title: string;
  body?: string;
  actions?: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br p-8 text-center shadow-sm ring-1",
        t.wash,
        t.ring,
        className,
      )}
    >
      {/* Decorative chip "scene" — three offset rounded chips behind
          the icon so the surface feels like a staged illustration. */}
      <div className="relative mx-auto mb-5 h-20 w-20">
        <span aria-hidden className={clsx("absolute left-0 top-2 h-14 w-14 rounded-2xl opacity-30 motion-safe:animate-[fadeIn_500ms_ease-out_both]", t.chipB)} />
        <span aria-hidden className={clsx("absolute right-0 bottom-0 h-12 w-12 rounded-2xl opacity-25 motion-safe:animate-[fadeIn_700ms_ease-out_both]", t.chipC)} />
        <span
          aria-hidden
          className={clsx(
            "absolute inset-0 m-auto grid h-16 w-16 place-items-center rounded-2xl border-b-[4px] border-black/15 text-white shadow-md",
            t.chipA,
          )}
        >
          {icon}
        </span>
      </div>
      <h3 className={clsx("text-xl font-extrabold tracking-tight", t.title)}>{title}</h3>
      {body && <p className={clsx("mx-auto mt-2 max-w-md text-sm leading-relaxed", t.body)}>{body}</p>}
      {actions && <div className="mt-5 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  );
}
