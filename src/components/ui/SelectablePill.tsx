"use client";

import { Check } from "lucide-react";
import { clsx } from "clsx";
import type { ReactNode } from "react";

type Size = "sm" | "md";

interface Props {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  size?: Size;
  icon?: ReactNode;
  /**
   * If true, render a check mark when active. Defaults to true for multi-select
   * pills. Pass false for single-select choices where the check would be
   * redundant (e.g. radio-style groups).
   */
  showCheck?: boolean;
  /**
   * Sets aria-pressed (multi-select toggle) or aria-checked (single-select).
   * Default: "pressed".
   */
  ariaSemantics?: "pressed" | "checked";
}

const SIZES: Record<Size, string> = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-8 px-3 text-xs",
};

export function SelectablePill({
  active,
  onClick,
  disabled,
  children,
  size = "sm",
  icon,
  showCheck = true,
  ariaSemantics = "pressed",
}: Props) {
  const ariaProps =
    ariaSemantics === "pressed"
      ? { "aria-pressed": active }
      : { role: "radio", "aria-checked": active };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      {...ariaProps}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1",
        SIZES[size],
        disabled
          ? "cursor-not-allowed border border-stone-200 bg-stone-100 text-stone-400"
          : active
            ? "border border-emerald-600 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
            : "border border-stone-200 bg-white text-stone-700 hover:border-emerald-300 hover:bg-emerald-50",
      )}
    >
      {showCheck && active && <Check size={11} className="-ml-0.5" />}
      {icon}
      {children}
    </button>
  );
}
