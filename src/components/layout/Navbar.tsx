"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Coins,
  Refrigerator,
  ShoppingBasket,
  Bookmark,
  Info,
  Globe,
  ChefHat,
  Wand2,
  Menu,
  X,
  Apple,
} from "lucide-react";
import { clsx } from "clsx";

// Primary nav items shown in the desktop bar (core actions).
// Secondary items are reachable via the "More" menu (hamburger) at all sizes.
const links = [
  { href: "/", label: "Home", icon: Home, primary: true },
  { href: "/ai-chef", label: "AI Chef", icon: ChefHat, primary: true, emphasis: true },
  { href: "/pantry", label: "Pantry", icon: Refrigerator, primary: true },
  { href: "/cheap-recipes", label: "Cheap Recipes", icon: Coins, primary: true },
  { href: "/nourish", label: "Nourish", icon: Apple, primary: true },
  // Secondary — always in "More" drawer
  { href: "/recipe-studio", label: "Recipe Studio", icon: Wand2, primary: false },
  { href: "/explore", label: "Explore", icon: Globe, primary: false },
  { href: "/grocery-list", label: "Grocery List", icon: ShoppingBasket, primary: false },
  { href: "/saved", label: "Saved", icon: Bookmark, primary: false },
  { href: "/about", label: "About", icon: Info, primary: false },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  // Escape closes drawer
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-[#E8D8C4] bg-[#FFF8ED]/90 backdrop-blur-md supports-[backdrop-filter]:bg-[#FFF8ED]/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Waivy — home"
          className="group flex items-center gap-2.5 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2FBF71]"
        >
          {/* Pantry Pop brand mark — basil squircle, raised face, deep
              basil shadow band, carrot "AI" pip. The bottom-border trick
              is the same 3D depth used by ThreeDButton so the mark feels
              like a small button you could press. */}
          <span
            aria-hidden
            className="relative grid h-9 w-9 place-items-center rounded-[14px] border-b-[3px] border-[#16834A] bg-gradient-to-b from-[#3AD081] to-[#2FBF71] text-white shadow-[0_2px_8px_-2px_rgba(22,131,74,0.35)] transition-transform motion-safe:group-hover:-translate-y-px"
          >
            <ChefHat size={18} strokeWidth={2.4} />
            <span className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full border-b-2 border-[#B85A1A] bg-gradient-to-b from-[#FFB07A] to-[#FF8A3D] px-1 text-[8px] font-extrabold uppercase tracking-wide text-white shadow-sm">
              AI
            </span>
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-extrabold tracking-tight text-[#241A12] transition-colors group-hover:text-[#16834A]">
              Waivy
            </span>
            {/* Tagline only on larger screens so it never crowds the nav. */}
            <span className="hidden text-[11px] text-[#6B5A4A] lg:inline">
              Cook smart on a student budget.
            </span>
          </div>
        </Link>

        {/* Desktop primary nav — 5 core items */}
        <nav
          className="hidden items-center gap-0.5 md:flex"
          aria-label="Main navigation"
        >
          {links
            .filter((l) => l.primary)
            .map((link) => {
              const Icon = link.icon;
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "group relative inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                    active
                      ? "text-stone-900"
                      : link.emphasis
                        ? "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        : "text-stone-700 hover:bg-stone-100",
                  )}
                >
                  <Icon
                    size={15}
                    className={clsx(
                      "transition-colors",
                      active && "text-emerald-600",
                    )}
                  />
                  {link.label}
                  {/* Active indicator — thin emerald underline that slides
                      in. Replaces the old dark-pill active state which felt
                      heavy. */}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-3 -bottom-[14px] h-[3px] rounded-full bg-emerald-600 motion-safe:animate-[navUnderlineSlide_280ms_ease-out]"
                    />
                  )}
                </Link>
              );
            })}
        </nav>

        {/* "More" / hamburger — visible at all sizes; opens the full drawer */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav-drawer"
          aria-label={open ? "Close menu" : "More navigation"}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
          <span className="hidden text-sm md:inline">{open ? "" : "More"}</span>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-16 z-30 bg-black/30 backdrop-blur-sm"
          />
          <nav
            id="mobile-nav-drawer"
            aria-label="Main navigation"
            className="absolute inset-x-0 top-full z-40 border-b border-stone-200 bg-white shadow-lg motion-safe:animate-[fadeUp_220ms_ease-out]"
          >
            <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
              {/* Primary group */}
              <ul>
                {links.filter((l) => l.primary).map((link) => {
                  const Icon = link.icon;
                  const active = isActive(pathname, link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        className={clsx(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                          active ? "bg-emerald-50 text-emerald-800"
                          : link.emphasis ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
                          : "text-stone-700 hover:bg-stone-100",
                        )}
                      >
                        <Icon size={18} className={active ? "text-emerald-600" : undefined} />
                        {link.label}
                        {link.emphasis && !active && (
                          <span className="ml-auto rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">AI</span>
                        )}
                        {active && <span aria-hidden className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {/* Secondary group */}
              <div className="my-2 border-t border-stone-100" />
              <ul>
                {links.filter((l) => !l.primary).map((link) => {
                  const Icon = link.icon;
                  const active = isActive(pathname, link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        className={clsx(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                          active ? "bg-emerald-50 text-emerald-800" : "text-stone-500 hover:bg-stone-100 hover:text-stone-700",
                        )}
                      >
                        <Icon size={16} className={active ? "text-emerald-600" : undefined} />
                        {link.label}
                        {active && <span aria-hidden className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
