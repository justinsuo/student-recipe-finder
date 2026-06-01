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
  Sparkles,
  Globe,
  ChefHat,
  Wand2,
  Menu,
  X,
} from "lucide-react";
import { clsx } from "clsx";

// Short labels are used in the desktop bar so the header never wraps.
// Mobile drawer uses the same `label` (short) plus the icon — no need for
// long labels there either.
const links = [
  { href: "/", label: "Home", icon: Home, desktop: true },
  { href: "/ai-chef", label: "AI Chef", icon: ChefHat, desktop: true, emphasis: true },
  { href: "/recipe-studio", label: "Studio", icon: Wand2, desktop: true },
  { href: "/pantry", label: "Pantry", icon: Refrigerator, desktop: true },
  { href: "/cheap-recipes", label: "Cheap", icon: Coins, desktop: true },
  { href: "/explore", label: "Explore", icon: Globe, desktop: true },
  { href: "/grocery-list", label: "Grocery", icon: ShoppingBasket, desktop: true },
  { href: "/saved", label: "Saved", icon: Bookmark, desktop: true },
  { href: "/about", label: "About", icon: Info, desktop: false },
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
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-stone-50/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Sparkles size={18} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-stone-900">
              Student Recipe Finder
            </span>
            {/* Tagline only on larger screens so it never crowds the nav. */}
            <span className="hidden text-xs text-stone-500 md:inline">
              Eat well, spend less
            </span>
          </div>
        </Link>

        {/* Desktop nav — collapses to the hamburger below xl (1280px) so
            8 pills + brand never feel cramped. About lives in the mobile
            drawer only. */}
        <nav className="hidden items-center gap-1 xl:flex" aria-label="Main navigation">
          {links.filter((l) => l.desktop).map((link) => {
            const Icon = link.icon;
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                  active
                    ? "bg-stone-900 text-white shadow-sm"
                    : link.emphasis
                      ? "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      : "text-stone-700 hover:bg-stone-100",
                )}
              >
                <Icon size={15} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Hamburger (mobile + tablet) */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav-drawer"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-stone-700 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 xl:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
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
            className="fixed inset-0 top-16 z-30 bg-black/30 backdrop-blur-sm xl:hidden"
          />
          <nav
            id="mobile-nav-drawer"
            aria-label="Main navigation"
            className="absolute inset-x-0 top-full z-40 border-b border-stone-200 bg-white shadow-lg xl:hidden"
          >
            <ul className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
              {links.map((link) => {
                const Icon = link.icon;
                const active = isActive(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={clsx(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                        active
                          ? "bg-stone-900 text-white"
                          : link.emphasis
                            ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "text-stone-700 hover:bg-stone-100",
                      )}
                    >
                      <Icon size={18} />
                      {link.label}
                      {link.emphasis && !active && (
                        <span className="ml-auto rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                          AI
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}
