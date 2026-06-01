import type { ReactNode } from "react";

export function EmptyState({
  emoji,
  title,
  description,
  action,
}: {
  emoji: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-white px-6 py-16 text-center">
      <div className="mb-3 text-5xl" aria-hidden>
        {emoji}
      </div>
      <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-stone-600">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
