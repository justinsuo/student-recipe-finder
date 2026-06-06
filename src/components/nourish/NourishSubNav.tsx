"use client";

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
  type LucideIcon,
} from "lucide-react";
import { clsx } from "clsx";

type Group = "track" | "plan" | "review" | "manage";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  group: Group;
}

const ITEMS: NavItem[] = [
  { href: "/nourish",              label: "Today",    icon: Apple,           exact: true, group: "track"  },
  { href: "/nourish/diary",        label: "Diary",    icon: BookOpen,                     group: "track"  },
  { href: "/nourish/log-food",     label: "Log food", icon: Plus,                         group: "track"  },
  { href: "/nourish/foods",        label: "Foods",    icon: UtensilsCrossed,              group: "plan"   },
  { href: "/nourish/meals",        label: "Meals",    icon: Layers,                       group: "plan"   },
  { href: "/nourish/recipes",      label: "Recipes",  icon: Soup,                         group: "plan"   },
  { href: "/nourish/meal-planner", label: "Planner",  icon: CalendarDays,                 group: "plan"   },
  { href: "/nourish/progress",     label: "Progress", icon: TrendingUp,                   group: "review" },
  { href: "/nourish/goals",        label: "Goals",    icon: Target,                       group: "review" },
  { href: "/nourish/fasting",      label: "Fasting",  icon: Timer,                        group: "review" },
  { href: "/nourish/reports",      label: "Reports",  icon: FileBarChart,                 group: "review" },
  { href: "/nourish/settings",     label: "Settings", icon: Settings,                     group: "manage" },
];

const GROUP_META: Record<Group, { label: string; tone: string; barTone: string }> = {
  track: {
    label: "Track",
    tone: "text-emerald-700",
    barTone: "bg-emerald-500",
  },
  plan: {
    label: "Plan",
    tone: "text-violet-700",
    barTone: "bg-violet-500",
  },
  review: {
    label: "Review",
    tone: "text-sky-700",
    barTone: "bg-sky-500",
  },
  manage: {
    label: "Manage",
    tone: "text-stone-700",
    barTone: "bg-stone-500",
  },
};

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Nourish sub-navigation.
 *
 * Layout choice: every tab is visible at every breakpoint — no horizontal
 * scroll, no "More" overflow, no hunting. The 12 sections wrap into 4
 * tone-tinted group blocks (Track / Plan / Review / Manage). On mobile
 * each group fills its own row of small pills; on desktop the groups sit
 * side-by-side and only wrap when needed.
 *
 * The active tab gets a strong gradient + shadow so "where am I" stays
 * obvious. The active group's eyebrow label gets a bigger accent dot so
 * you can spot the right section even when glancing.
 */
export function NourishSubNav() {
  const pathname = usePathname();
  const activeGroup = ITEMS.find((it) => isActive(pathname, it.href, it.exact))
    ?.group;

  const groups: Group[] = ["track", "plan", "review", "manage"];

  return (
    <nav
      aria-label="Nourish sections"
      className="sticky top-16 z-20 -mx-2 px-2 py-1"
    >
      <div className="rounded-2xl border border-stone-200 bg-white/85 p-2 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap gap-x-3 gap-y-2.5">
          {groups.map((group) => {
            const items = ITEMS.filter((it) => it.group === group);
            const meta = GROUP_META[group];
            const isActiveGroup = activeGroup === group;
            return (
              <div
                key={group}
                className="flex min-w-0 flex-1 basis-full items-center gap-2 sm:basis-auto sm:flex-none"
              >
                <span
                  aria-hidden
                  className={clsx(
                    "inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em]",
                    isActiveGroup ? meta.tone : "text-stone-400",
                  )}
                >
                  <span
                    className={clsx(
                      "h-1.5 w-1.5 rounded-full transition-all",
                      isActiveGroup
                        ? `${meta.barTone} motion-safe:animate-[popIn_280ms_ease-out]`
                        : "bg-stone-300",
                    )}
                  />
                  {meta.label}
                </span>
                <ul className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                  {items.map(({ href, label, icon: Icon, exact }) => {
                    const active = isActive(pathname, href, exact);
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          aria-current={active ? "page" : undefined}
                          className={clsx(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                            active
                              ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-sm shadow-emerald-200 motion-safe:scale-[1.02]"
                              : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                          )}
                        >
                          <Icon
                            size={12}
                            className={
                              active
                                ? "text-white"
                                : isActiveGroup
                                  ? meta.tone
                                  : "text-stone-400"
                            }
                            aria-hidden
                          />
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
