"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * Icon-led action tile. Replaces "title + paragraph + bullet" feature
 * cards. The icon is the hero — short label sits underneath, optional
 * meta (count, badge) reads at a glance, and the whole tile is a real
 * Link so keyboard / a11y stays clean.
 *
 * Use this anywhere you'd otherwise build a square card with a
 * paragraph that no one reads.
 */

type Tone =
  | "basil"
  | "carrot"
  | "butter"
  | "grape"
  | "teal"
  | "sky"
  | "pink"
  | "indigo";

const FACE: Record<Tone, { tile: string; icon: string; label: string; ring: string }> = {
  basil: {
    tile: "from-[#E8FAF0] to-[#FFFFFF] border-[#B6E8CD]",
    icon: "bg-gradient-to-b from-[#3AD081] to-[#2FBF71] text-white border-[#16834A]",
    label: "text-[#0F5E33]",
    ring: "focus-visible:ring-[#2FBF71]",
  },
  carrot: {
    tile: "from-[#FFE8D6] to-[#FFFFFF] border-[#FFC79A]",
    icon: "bg-gradient-to-b from-[#FFB07A] to-[#FF8A3D] text-white border-[#B85A1A]",
    label: "text-[#7C3309]",
    ring: "focus-visible:ring-[#FF8A3D]",
  },
  butter: {
    tile: "from-[#FFF3CC] to-[#FFFFFF] border-[#FFE08A]",
    icon: "bg-gradient-to-b from-[#FFE08A] to-[#FFC93D] text-[#3A2A0F] border-[#B97A12]",
    label: "text-[#7A4A00]",
    ring: "focus-visible:ring-[#FFC93D]",
  },
  grape: {
    tile: "from-[#EFE8FF] to-[#FFFFFF] border-[#CDBEFF]",
    icon: "bg-gradient-to-b from-[#A18FFF] to-[#7C5CFF] text-white border-[#3F2BB8]",
    label: "text-[#3F2BB8]",
    ring: "focus-visible:ring-[#7C5CFF]",
  },
  teal: {
    tile: "from-[#DCFAF1] to-[#FFFFFF] border-[#A4ECD8]",
    icon: "bg-gradient-to-b from-[#4DDEC0] to-[#20C7A5] text-white border-[#0B6E55]",
    label: "text-[#0B6E55]",
    ring: "focus-visible:ring-[#20C7A5]",
  },
  sky: {
    tile: "from-[#E0F2FE] to-[#FFFFFF] border-[#BAE6FD]",
    icon: "bg-gradient-to-b from-[#7CC8FF] to-[#3BA7FF] text-white border-[#1F6FA8]",
    label: "text-[#1F6FA8]",
    ring: "focus-visible:ring-[#3BA7FF]",
  },
  pink: {
    tile: "from-[#FFE3EC] to-[#FFFFFF] border-[#F9B6CD]",
    icon: "bg-gradient-to-b from-[#FF9CBC] to-[#FF6B9E] text-white border-[#A23163]",
    label: "text-[#A23163]",
    ring: "focus-visible:ring-[#FF6B9E]",
  },
  indigo: {
    tile: "from-[#E0E7FF] to-[#FFFFFF] border-[#C7D2FE]",
    icon: "bg-gradient-to-b from-[#8AA0FF] to-[#6366F1] text-white border-[#3730A3]",
    label: "text-[#3730A3]",
    ring: "focus-visible:ring-[#6366F1]",
  },
};

export type IconTileProps = {
  href?: string;
  onClick?: () => void;
  /** Rendered icon (e.g. `<ChefHat size={18} />`). Passing a rendered
   * ReactNode rather than a component reference lets server components
   * use this tile without crossing the function-prop boundary. */
  icon: ReactNode;
  label: string;
  meta?: ReactNode;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Render in a horizontal layout (icon left, label right) instead of stacked. */
  row?: boolean;
};

const SIZE: Record<NonNullable<IconTileProps["size"]>, { tile: string; icon: string; label: string }> = {
  sm: { tile: "p-3 gap-2", icon: "h-9 w-9 rounded-xl border-b-[3px]", label: "text-[12px]" },
  md: { tile: "p-4 gap-3", icon: "h-11 w-11 rounded-2xl border-b-[3px]", label: "text-sm" },
  lg: { tile: "p-5 gap-4", icon: "h-14 w-14 rounded-2xl border-b-[4px]", label: "text-base" },
};

export function IconTile({
  href,
  onClick,
  icon,
  label,
  meta,
  tone = "basil",
  size = "md",
  className,
  row = false,
}: IconTileProps) {
  const face = FACE[tone];
  const s = SIZE[size];

  const inner = (
    <span
      className={clsx(
        "group flex h-full w-full bg-gradient-to-b transition-all motion-safe:hover:-translate-y-0.5",
        "rounded-2xl border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        face.tile,
        face.ring,
        s.tile,
        row ? "flex-row items-center" : "flex-col items-start",
      )}
    >
      <span
        aria-hidden
        className={clsx(
          "grid flex-none place-items-center transition-transform motion-safe:group-hover:-translate-y-px",
          s.icon,
          face.icon,
        )}
      >
        {icon}
      </span>
      <span className={clsx("min-w-0 flex-1", row ? "ml-1" : "mt-1")}>
        <span className={clsx("block font-extrabold leading-tight", s.label, face.label)}>
          {label}
        </span>
        {meta && (
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#6B5A4A]">
            {meta}
          </span>
        )}
      </span>
      {href && (
        <ArrowRight
          aria-hidden
          size={14}
          className={clsx(
            "flex-none text-[#6B5A4A] transition-transform motion-safe:group-hover:translate-x-0.5",
            row ? "ml-2" : "mt-2 self-end",
          )}
        />
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={clsx("block h-full", className)}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={clsx("block h-full w-full text-left", className)}>
      {inner}
    </button>
  );
}
