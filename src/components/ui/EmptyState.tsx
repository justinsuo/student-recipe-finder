import type { ReactNode } from "react";
import { clsx } from "clsx";

type Tone = "default" | "emerald" | "amber" | "violet" | "sky" | "rose";

const TONES: Record<Tone, string> = {
  default: "border-stone-200 bg-white",
  emerald: "border-emerald-200 bg-emerald-50/60",
  amber: "border-amber-200 bg-amber-50/60",
  violet: "border-violet-200 bg-violet-50/60",
  sky: "border-sky-200 bg-sky-50/60",
  rose: "border-rose-200 bg-rose-50/60",
};

interface Props {
  emoji: string;
  title: string;
  description: string;
  /** Primary action — usually a <Button> or <Link>. */
  action?: ReactNode;
  /** Optional secondary action (text link, "skip", etc.). */
  secondaryAction?: ReactNode;
  /** Background/border tone. Default keeps the page-neutral look. */
  tone?: Tone;
  className?: string;
}

export function EmptyState({
  emoji,
  title,
  description,
  action,
  secondaryAction,
  tone = "default",
  className,
}: Props) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center",
        TONES[tone],
        className,
      )}
    >
      <div
        className="mb-3 text-5xl motion-safe:animate-[emojiFloat_3.2s_ease-in-out_infinite]"
        aria-hidden
      >
        {emoji}
      </div>
      <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-stone-600">{description}</p>
      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
