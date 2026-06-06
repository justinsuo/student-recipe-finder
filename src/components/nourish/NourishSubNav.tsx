"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Apple,
  BookOpen,
  Plus,
  TrendingUp,
  UtensilsCrossed,
  Target,
  Layers,
  CalendarDays,
  Timer,
  FileBarChart,
  Settings,
  Soup,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";

type Group = "track" | "plan" | "review" | "manage";

const ITEMS: {
  href: string;
  label: string;
  icon: typeof Apple;
  exact?: boolean;
  group: Group;
}[] = [
  { href: "/nourish",               label: "Today",    icon: Apple,           exact: true,  group: "track" },
  { href: "/nourish/diary",         label: "Diary",    icon: BookOpen,                      group: "track" },
  { href: "/nourish/log-food",      label: "Log food", icon: Plus,                          group: "track" },
  { href: "/nourish/foods",         label: "Foods",    icon: UtensilsCrossed,               group: "plan"  },
  { href: "/nourish/meals",         label: "Meals",    icon: Layers,                        group: "plan"  },
  { href: "/nourish/recipes",       label: "Recipes",  icon: Soup,                          group: "plan"  },
  { href: "/nourish/meal-planner",  label: "Planner",  icon: CalendarDays,                  group: "plan"  },
  { href: "/nourish/progress",      label: "Progress", icon: TrendingUp,                    group: "review"},
  { href: "/nourish/goals",         label: "Goals",    icon: Target,                        group: "review"},
  { href: "/nourish/fasting",       label: "Fasting",  icon: Timer,                         group: "review"},
  { href: "/nourish/reports",       label: "Reports",  icon: FileBarChart,                  group: "review"},
  { href: "/nourish/settings",      label: "Settings", icon: Settings,                      group: "manage"},
];

const GROUP_LABEL: Record<Group, string> = {
  track: "Track",
  plan: "Plan",
  review: "Review",
  manage: "Manage",
};

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Sub-navigation for every /nourish/* route.
 *
 * Two layout adjustments over the original strip:
 *   1. Tabs are reordered into 4 mental groups (Track / Plan / Review /
 *      Manage). On md+ we show small group dividers + labels. On mobile
 *      it's still a single horizontal-scroll strip so taps stay quick.
 *   2. The scroll container has fade-edge overlays + chevron buttons
 *      that only render when there's actually scrollable content in
 *      that direction. Active group label gets a different tint so the
 *      user always knows "where am I".
 */
export function NourishSubNav() {
  const pathname = usePathname();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  function recalcFades() {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setShowLeftFade(el.scrollLeft > 4);
    setShowRightFade(el.scrollLeft < max - 4);
  }

  useEffect(() => {
    recalcFades();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", recalcFades, { passive: true });
    const ro = new ResizeObserver(recalcFades);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", recalcFades);
      ro.disconnect();
    };
  }, [pathname]);

  // After a route change, scroll the active link into view so users
  // never have to hunt for it on mobile.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>('[aria-current="page"]');
    if (active) {
      const rect = active.getBoundingClientRect();
      const parent = el.getBoundingClientRect();
      if (rect.left < parent.left || rect.right > parent.right) {
        active.scrollIntoView({
          inline: "center",
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [pathname]);

  function scrollBy(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.6, behavior: "smooth" });
  }

  const activeGroup = ITEMS.find((it) => isActive(pathname, it.href, it.exact))
    ?.group;

  return (
    <nav
      aria-label="Nourish sections"
      className="sticky top-16 z-20 -mx-2 px-2 py-1"
    >
      <div className="relative rounded-2xl border border-stone-200 bg-white/85 p-1.5 shadow-sm backdrop-blur-md">
        {/* Left fade + arrow */}
        {showLeftFade && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 rounded-l-2xl bg-gradient-to-r from-white/95 to-transparent"
            />
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Scroll tabs left"
              className="absolute left-1 top-1/2 z-20 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-white text-stone-600 shadow ring-1 ring-stone-200 transition-all hover:text-emerald-700 motion-safe:hover:scale-105"
            >
              <ChevronLeft size={14} />
            </button>
          </>
        )}

        {/* Right fade + arrow */}
        {showRightFade && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 rounded-r-2xl bg-gradient-to-l from-white/95 to-transparent"
            />
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Scroll tabs right"
              className="absolute right-1 top-1/2 z-20 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-white text-stone-600 shadow ring-1 ring-stone-200 transition-all hover:text-emerald-700 motion-safe:hover:scale-105"
            >
              <ChevronRight size={14} />
            </button>
          </>
        )}

        <div
          ref={scrollerRef}
          className="overflow-x-auto"
          role="presentation"
        >
          <ul className="flex items-stretch gap-1 px-1">
            {(["track", "plan", "review", "manage"] as Group[]).map(
              (group, idx) => {
                const groupItems = ITEMS.filter((it) => it.group === group);
                const isActiveGroup = activeGroup === group;
                return (
                  <li
                    key={group}
                    className="flex shrink-0 items-center gap-1"
                  >
                    {idx > 0 && (
                      <span
                        aria-hidden
                        className="mx-0.5 hidden h-6 w-px bg-stone-200 md:inline-block"
                      />
                    )}
                    <span
                      aria-hidden
                      className={clsx(
                        "hidden shrink-0 select-none px-1 text-[9px] font-semibold uppercase tracking-[0.14em] md:inline",
                        isActiveGroup ? "text-emerald-700" : "text-stone-400",
                      )}
                    >
                      {GROUP_LABEL[group]}
                    </span>
                    <ul className="flex items-center gap-1">
                      {groupItems.map(({ href, label, icon: Icon, exact }) => {
                        const active = isActive(pathname, href, exact);
                        return (
                          <li key={href} className="shrink-0">
                            <Link
                              href={href}
                              aria-current={active ? "page" : undefined}
                              className={clsx(
                                "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                                active
                                  ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-sm shadow-emerald-200"
                                  : "text-stone-600 hover:bg-stone-100",
                              )}
                            >
                              <Icon size={13} aria-hidden />
                              {label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              },
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
