"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * Horizontal snap carousel with a visible scroll affordance — a soft
 * gradient fade on the right edge so users know there's more.
 * Children pass through; wrap each item with the right snap class.
 */
export function HorizontalCarousel({
  children,
  className,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div className={clsx("relative", className)}>
      <div
        role="list"
        aria-label={ariaLabel}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-1 pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#FFF8ED] to-transparent"
      />
    </div>
  );
}

export function CarouselItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="listitem" className={clsx("snap-start shrink-0", className)}>
      {children}
    </div>
  );
}
