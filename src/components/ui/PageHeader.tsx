import type { ReactNode } from "react";
import { clsx } from "clsx";

type Tone = "emerald" | "amber" | "violet" | "sky" | "rose" | "indigo";

const TONE_BG: Record<Tone, string> = {
  emerald:
    "from-emerald-50/70 via-white to-stone-50 border-emerald-200/70 text-emerald-700",
  amber:
    "from-amber-50/70 via-white to-stone-50 border-amber-200/70 text-amber-800",
  violet:
    "from-violet-50/70 via-white to-stone-50 border-violet-200/70 text-violet-700",
  sky: "from-sky-50/70 via-white to-stone-50 border-sky-200/70 text-sky-700",
  rose: "from-rose-50/70 via-white to-stone-50 border-rose-200/70 text-rose-700",
  indigo:
    "from-indigo-50/70 via-white to-stone-50 border-indigo-200/70 text-indigo-700",
};

const TONE_BAR: Record<Tone, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  sky: "bg-sky-500",
  rose: "bg-rose-500",
  indigo: "bg-indigo-500",
};

/**
 * The big top-of-page banner used on every primary route. Carries the route
 * eyebrow, headline, subtitle, and an optional trailing action (filter
 * reset, save count, etc.). Subtle entry animation on mount.
 *
 * Sibling to `SectionHeading` — same rhythm, but at page scale and with the
 * gradient + dotted-grid shell.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  trailing,
  tone = "emerald",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const toneClasses = TONE_BG[tone];
  const barTone = TONE_BAR[tone];
  // Pull the eyebrow text-tone out of the bg block by re-reading the last
  // class — kept inline for simplicity.
  const textTone = toneClasses.split(" ").pop() ?? "text-stone-700";

  return (
    <header
      className={clsx(
        "relative -mt-2 overflow-hidden rounded-3xl border bg-gradient-to-br px-5 py-7 sm:px-9 sm:py-9",
        toneClasses,
        className,
      )}
    >
      <div
        aria-hidden
        className="dot-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(circle_at_70%_30%,black,transparent_60%)]"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-2">
          {eyebrow && (
            <p
              className={clsx(
                "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] motion-safe:animate-[fadeUp_460ms_ease-out_both]",
                textTone,
              )}
            >
              <span
                aria-hidden
                className={clsx("h-[2px] w-6 rounded-full", barTone)}
              />
              {eyebrow}
            </p>
          )}
          <h1
            className="text-3xl font-bold leading-[1.05] tracking-tight text-stone-900 motion-safe:animate-[fadeUp_540ms_ease-out_both] sm:text-[2.5rem]"
            style={{ animationDelay: "60ms" }}
          >
            {title}
          </h1>
          {description && (
            <p
              className="max-w-2xl text-sm leading-relaxed text-stone-600 motion-safe:animate-[fadeUp_620ms_ease-out_both] sm:text-base"
              style={{ animationDelay: "140ms" }}
            >
              {description}
            </p>
          )}
        </div>
        {trailing && (
          <div
            className="shrink-0 motion-safe:animate-[fadeUp_680ms_ease-out_both]"
            style={{ animationDelay: "220ms" }}
          >
            {trailing}
          </div>
        )}
      </div>
    </header>
  );
}
