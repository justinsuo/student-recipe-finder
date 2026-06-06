"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Coins,
  ChefHat,
  Apple,
  Bookmark,
} from "lucide-react";
import { clsx } from "clsx";

// AI Chef sits in the middle of the bottom nav as the visual anchor — it's
// the flagship action and benefits from being one tap from anywhere.
// Grocery moved to hamburger menu to make room for Nourish.
const links = [
  { href: "/", label: "Home", icon: Home, hero: false },
  { href: "/cheap-recipes", label: "Cheap", icon: Coins, hero: false },
  { href: "/ai-chef", label: "AI Chef", icon: ChefHat, hero: true },
  { href: "/nourish", label: "Nourish", icon: Apple, hero: false },
  { href: "/saved", label: "Saved", icon: Bookmark, hero: false },
];

export function BottomNav() {
  const pathname = usePathname();
  const [hiddenByInput, setHiddenByInput] = useState(false);

  // Same input-aware behavior as the floating Pesto button — get out of the
  // way when the user is typing so the mobile keyboard doesn't push us up
  // onto the form.
  useEffect(() => {
    function isEditable(t: EventTarget | null): boolean {
      if (!(t instanceof HTMLElement)) return false;
      const tag = t.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || t.isContentEditable;
    }
    function onFocus(e: FocusEvent) {
      if (isEditable(e.target)) setHiddenByInput(true);
    }
    function onBlur(e: FocusEvent) {
      if (isEditable(e.target)) setHiddenByInput(false);
    }
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onBlur);
    return () => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
    };
  }, []);

  return (
    <nav
      aria-label="Quick navigation"
      className={clsx(
        "fixed inset-x-0 bottom-0 z-40 border-t border-[#E8D8C4] bg-[#FFF8ED]/95 backdrop-blur transition-transform duration-200 md:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        hiddenByInput && "translate-y-full",
      )}
    >
      <ul className="mx-auto flex max-w-md items-end justify-between px-2">
        {links.map((link) => {
          const Icon = link.icon;
          const active =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

          if (link.hero) {
            return (
              <li key={link.href} className="flex-1">
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className="-mt-5 mx-auto flex w-fit flex-col items-center"
                >
                  <span
                    className={clsx(
                      "grid h-12 w-12 place-items-center rounded-full text-white shadow-md shadow-emerald-300/50 transition-transform motion-safe:hover:scale-105",
                      active
                        ? "bg-emerald-700"
                        : "bg-gradient-to-br from-emerald-500 to-emerald-700",
                    )}
                  >
                    <Icon size={22} />
                  </span>
                  <span
                    className={clsx(
                      "mt-1 text-[10px] font-semibold uppercase tracking-wide",
                      active ? "text-emerald-700" : "text-stone-600",
                    )}
                  >
                    {link.label}
                  </span>
                </Link>
              </li>
            );
          }

          return (
            <li key={link.href} className="flex-1">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                  active ? "text-emerald-700" : "text-stone-500",
                )}
              >
                <span className="relative">
                  <Icon size={20} />
                  {active && (
                    <span
                      aria-hidden
                      className="absolute -inset-1 -z-10 rounded-full bg-emerald-100 motion-safe:animate-[popIn_220ms_ease-out]"
                    />
                  )}
                </span>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
