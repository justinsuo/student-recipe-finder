"use client";

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
} from "lucide-react";
import { clsx } from "clsx";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/cheap-recipes", label: "Cheap Coach", icon: Coins },
  { href: "/explore", label: "Explore World", icon: Globe },
  { href: "/pantry", label: "Pantry", icon: Refrigerator },
  { href: "/grocery-list", label: "Grocery", icon: ShoppingBasket },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/about", label: "About", icon: Info },
];

export function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-stone-50/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Sparkles size={18} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-stone-900">
              Student Recipe Finder
            </span>
            <span className="text-xs text-stone-500">Eat well, spend less</span>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const Icon = link.icon;
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-stone-900 text-white"
                    : "text-stone-700 hover:bg-stone-100",
                )}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
