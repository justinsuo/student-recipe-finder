"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Apple,
  BookOpen,
  TrendingUp,
  UtensilsCrossed,
  Target,
  Layers,
  FileBarChart,
  Settings,
  Soup,
} from "lucide-react";
import { clsx } from "clsx";

const ITEMS = [
  { href: "/nourish", label: "Today", icon: Apple, exact: true },
  { href: "/nourish/diary", label: "Diary", icon: BookOpen },
  { href: "/nourish/progress", label: "Progress", icon: TrendingUp },
  { href: "/nourish/goals", label: "Goals", icon: Target },
  { href: "/nourish/foods", label: "Foods", icon: UtensilsCrossed },
  { href: "/nourish/meals", label: "Meals", icon: Layers },
  { href: "/nourish/recipes", label: "Recipes", icon: Soup },
  { href: "/nourish/reports", label: "Reports", icon: FileBarChart },
  { href: "/nourish/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Sub-navigation rendered under the PageHeader on every /nourish/* route.
 * Horizontally scrollable on mobile so the 9 sections never wrap.
 */
export function NourishSubNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Nourish sections"
      className="sticky top-16 z-20 -mx-2 px-2 py-1"
    >
      <div className="rounded-2xl border border-stone-200 bg-white/85 p-1.5 shadow-sm backdrop-blur-md">
        <ul className="flex items-center gap-1 overflow-x-auto">
          {ITEMS.map(({ href, label, icon: Icon, exact }) => {
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
      </div>
    </nav>
  );
}
