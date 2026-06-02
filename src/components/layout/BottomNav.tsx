"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Coins,
  Globe,
  ShoppingBasket,
  Bookmark,
} from "lucide-react";
import { clsx } from "clsx";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/cheap-recipes", label: "Cheap", icon: Coins },
  { href: "/explore", label: "Explore", icon: Globe },
  { href: "/grocery-list", label: "Grocery", icon: ShoppingBasket },
  { href: "/saved", label: "Saved", icon: Bookmark },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {links.map((link) => {
          const Icon = link.icon;
          const active =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <li key={link.href} className="flex-1">
              <Link
                href={link.href}
                className={clsx(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-emerald-700" : "text-stone-500",
                )}
              >
                <Icon size={20} />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
