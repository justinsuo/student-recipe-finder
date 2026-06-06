"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * Asymmetric bento grid. Children opt into row/col spans via the
 * `<BentoItem>` wrapper so a feature catalog reads as a mosaic — big
 * hero tile, two mid tiles, four small tiles — rather than a uniform
 * "presentation deck" 3-column grid.
 *
 * Drop tiles in any order; the grid auto-flows on smaller breakpoints
 * and respects spans on `sm:` and up.
 */
export function BentoGrid({
  children,
  className,
  cols = 4,
}: {
  children: ReactNode;
  className?: string;
  /** Column count on the largest breakpoint. */
  cols?: 3 | 4 | 6;
}) {
  return (
    <div
      className={clsx(
        "grid gap-3 sm:gap-4",
        cols === 3 && "grid-cols-2 sm:grid-cols-3",
        cols === 4 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
        cols === 6 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
        "auto-rows-[minmax(120px,auto)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BentoItem({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
}: {
  children: ReactNode;
  className?: string;
  /** Column span at sm: breakpoint and up. */
  colSpan?: 1 | 2 | 3 | 4;
  /** Row span at sm: breakpoint and up. */
  rowSpan?: 1 | 2;
}) {
  return (
    <div
      className={clsx(
        // Always span 1 on mobile; widen on sm+. Tailwind needs the
        // class names to be statically present at compile time, so we
        // enumerate.
        colSpan === 1 && "sm:col-span-1",
        colSpan === 2 && "sm:col-span-2",
        colSpan === 3 && "sm:col-span-3",
        colSpan === 4 && "sm:col-span-4",
        rowSpan === 2 && "sm:row-span-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
