"use client";

import { clsx } from "clsx";

/**
 * Chrome / metallic text via background-clip.
 *
 * Reserved for the Waivy wordmark on the home hero and the AI Chef
 * "generated" badge. NEVER use for body copy, buttons, dense forms, or
 * recipe steps — the contrast is unpredictable across viewports.
 *
 * Accessibility: the visible glyph is decorative. The component renders
 * the same string in a visually-hidden span with `aria-label` so screen
 * readers announce the plain text, not the styled element. The
 * fallback (no animation, no background-clip support) shows espresso
 * text on Pantry-Pop cream — readable.
 */
export function ChromeText({
  text,
  className,
  animated = true,
  size = "lg",
}: {
  text: string;
  className?: string;
  animated?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const SIZE: Record<typeof size, string> = {
    sm: "text-base",
    md: "text-2xl",
    lg: "text-4xl sm:text-5xl",
    xl: "text-5xl sm:text-6xl md:text-7xl",
  };
  return (
    <span
      aria-label={text}
      className={clsx(
        "relative inline-block font-extrabold tracking-tight",
        SIZE[size],
        className,
      )}
    >
      <span
        aria-hidden
        className={clsx(
          // Chrome gradient: a 5-stop metallic ramp that pans across
          // the text. Background-clip keeps the gradient inside the
          // glyph silhouette.
          "bg-clip-text text-transparent",
          animated && "motion-safe:animate-[chromeShimmer_6s_ease-in-out_infinite_alternate]",
        )}
        style={{
          backgroundImage:
            "linear-gradient(110deg, #16834A 0%, #2FBF71 18%, #E8D8C4 38%, #FFFFFF 50%, #E8D8C4 62%, #FF8A3D 82%, #B85A1A 100%)",
          backgroundSize: animated ? "200% 100%" : "100% 100%",
        }}
      >
        {text}
      </span>
    </span>
  );
}
