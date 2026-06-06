"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { hapticLight } from "@/lib/haptics";

type Variant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "ghost"
  | "soft";
type Size = "sm" | "md" | "lg";

const FACE: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white border-emerald-700",
  secondary:
    "bg-gradient-to-b from-stone-50 to-white text-stone-900 border-stone-300",
  success:
    "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white border-emerald-700",
  warning:
    "bg-gradient-to-b from-amber-400 to-amber-500 text-amber-950 border-amber-600",
  danger:
    "bg-gradient-to-b from-rose-500 to-rose-600 text-white border-rose-700",
  ghost:
    "bg-transparent text-stone-700 border-transparent shadow-none",
  soft:
    "bg-gradient-to-b from-violet-100 to-violet-200 text-violet-900 border-violet-300",
};

const RING: Record<Variant, string> = {
  primary: "focus-visible:ring-emerald-500",
  secondary: "focus-visible:ring-stone-400",
  success: "focus-visible:ring-emerald-500",
  warning: "focus-visible:ring-amber-500",
  danger: "focus-visible:ring-rose-500",
  ghost: "focus-visible:ring-stone-400",
  soft: "focus-visible:ring-violet-500",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3.5 text-xs gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

/**
 * The actual face. We pull the 3D depth from a CSS variable on the wrapper
 * so the active-state translate + border-bottom shrink can stay in sync
 * without prop-drilling pixel values.
 *
 * Technique: bottom border simulates depth. On :active the bottom border
 * shrinks to 0 AND the face translates down by the depth amount. Net
 * effect: the button looks like it's being physically pressed into the
 * page. This is a well-known CSS pattern; the implementation here is
 * original.
 */
const FACE_BASE = clsx(
  // Layout
  "relative inline-flex items-center justify-center rounded-2xl font-bold",
  // 3D depth: a thicker bottom border that shrinks on press.
  "border-0 border-b-[var(--3d-depth,4px)]",
  // Press translate: paired with border shrink for the "press in" effect.
  "transition-[transform,border-bottom-width,box-shadow,filter]",
  "duration-100 ease-out",
  "active:translate-y-[var(--3d-depth,4px)]",
  "active:border-b-0",
  "active:brightness-[0.96]",
  // Subtle hover lift / brightness on devices that hover.
  "motion-safe:hover:-translate-y-px",
  "hover:brightness-[1.03]",
  // Focus
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  // Disabled / loading
  "disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50",
);

interface BaseProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** Full-width on mobile by default; toggle off if needed. */
  block?: boolean;
  className?: string;
  children: ReactNode;
  /** Override default light haptic on press. */
  haptic?: boolean;
}

export interface ThreeDButtonProps
  extends BaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> {
  href?: never;
}

export interface ThreeDLinkProps extends BaseProps {
  href: string;
  type?: never;
  onClick?: never;
  disabled?: never;
  loading?: never;
}

function content({
  loading,
  leftIcon,
  rightIcon,
  children,
}: BaseProps) {
  return (
    <>
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        leftIcon
      )}
      <span className="truncate">{children}</span>
      {rightIcon}
    </>
  );
}

/**
 * 3D button — raised face + colored bottom border + press translation.
 * Use for important CTAs (Generate, Save, Log, Add). For small text
 * links or dense actions, use the existing flat <Button>.
 */
export const ThreeDButton = forwardRef<HTMLButtonElement, ThreeDButtonProps>(
  function ThreeDButton(
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      block = false,
      haptic = true,
      className,
      children,
      onClick,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          if (haptic) hapticLight();
          onClick?.(e);
        }}
        disabled={loading || rest.disabled}
        className={clsx(
          FACE_BASE,
          FACE[variant],
          SIZE[size],
          RING[variant],
          block ? "w-full" : "w-auto",
          className,
        )}
        {...rest}
      >
        {content({ loading, leftIcon, rightIcon, children })}
      </button>
    );
  },
);

/**
 * Same look + 3D press, rendered as a Next Link. For navigation actions
 * (Start with AI Chef, Build my pantry, Open Nourish, etc).
 */
export function ThreeDLink({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  block = false,
  haptic = true,
  className,
  children,
  href,
}: ThreeDLinkProps) {
  return (
    <Link
      href={href}
      onClick={haptic ? hapticLight : undefined}
      className={clsx(
        FACE_BASE,
        FACE[variant],
        SIZE[size],
        RING[variant],
        block ? "w-full" : "w-auto",
        className,
      )}
    >
      {content({ leftIcon, rightIcon, children })}
    </Link>
  );
}
