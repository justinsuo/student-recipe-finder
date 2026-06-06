"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { hasWebGL, prefersReducedMotion } from "@/lib/visual-effects/performance";

/**
 * Lazy island for the WebGL `AnimatedFoodOrb`.
 *
 * - The R3F + three.js bundle is split off and only loaded when this
 *   component actually mounts (i.e. when AI Chef hits its generating
 *   state). Visitors who never open /ai-chef or who hit the page in
 *   the success/cached path don't pay the ~200 KB three.js cost.
 * - Falls back to a CSS-only pulsing sparkle "orb" when:
 *     • the browser has no WebGL context,
 *     • the user prefers reduced motion,
 *     • or the dynamic import hasn't resolved yet (renders the fallback
 *       as Next's `loading` UI so first-paint stays instant).
 * - Server-side render is safe because `next/dynamic({ ssr: false })`.
 */

const RemoteOrb = dynamic(
  () =>
    import("./AnimatedFoodOrb").then((m) => ({ default: m.AnimatedFoodOrb })),
  { ssr: false, loading: () => <FallbackOrb /> },
);

function FallbackOrb({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx(
        "relative grid h-full w-full place-items-center",
        className,
      )}
    >
      {/* Soft basil glow ring */}
      <span className="absolute inset-2 rounded-full bg-gradient-to-br from-[#3AD081]/40 via-[#2FBF71]/30 to-[#16834A]/40 blur-2xl motion-safe:animate-[pulseGlow_2.6s_ease-in-out_infinite]" />
      {/* Inner basil sphere stand-in */}
      <span className="relative grid h-3/5 w-3/5 place-items-center rounded-full bg-gradient-to-br from-[#3AD081] via-[#2FBF71] to-[#16834A] text-white shadow-lg shadow-[#16834A]/30 motion-safe:animate-[brandBob_2.6s_ease-in-out_infinite]">
        <Sparkles size={22} strokeWidth={2.4} />
      </span>
    </div>
  );
}

export function LazyFoodOrb({ className }: { className?: string }) {
  // Decide on the client whether to render the 3D scene at all. SSR
  // always renders the fallback so first paint is the cream sphere;
  // after hydration we swap to the WebGL orb when allowed.
  const [decision, setDecision] = useState<"pending" | "webgl" | "fallback">(
    "pending",
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (prefersReducedMotion()) {
      setDecision("fallback");
      return;
    }
    if (!hasWebGL()) {
      setDecision("fallback");
      return;
    }
    setDecision("webgl");
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (decision !== "webgl") return <FallbackOrb className={className} />;
  return <RemoteOrb className={className} />;
}
