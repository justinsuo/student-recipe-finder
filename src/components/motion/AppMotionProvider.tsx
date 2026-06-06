"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";
import { MotionConfig, useReducedMotion } from "motion/react";
import type { Transition } from "motion/react";

/**
 * Site-wide motion contract.
 *
 * `MotionConfig reducedMotion="user"` is the official global policy
 * switch: it disables transform + layout animation when the user has
 * set `prefers-reduced-motion: reduce`, while leaving cheap transitions
 * like opacity/background-color available. Local components that
 * still need to branch (parallax, autoplay carousels, hero ornaments)
 * can read the same preference via `useAppMotion().reduced` rather
 * than re-querying matchMedia.
 *
 * Three shared transitions live in the context so the app feels like
 * one designer made it:
 *   - `instant` — zero-duration, used as a kill-switch.
 *   - `gentle` — soft spring for state changes that should feel
 *     deliberate (drawer open, card lift, value count-up).
 *   - `snappy` — tighter spring for tap responses and button presses.
 */
type MotionPreset = {
  reduced: boolean;
  instant: Transition;
  gentle: Transition;
  snappy: Transition;
};

const MotionPresetContext = createContext<MotionPreset | null>(null);

function MotionPresetProvider({ children }: { children: ReactNode }) {
  // motion/react's hook returns `boolean | null` (null = before the
  // matchMedia query has resolved); coerce to a concrete boolean so
  // consumers can use it without an extra null check.
  const reducedResult = useReducedMotion();
  const reduced = reducedResult ?? false;

  const value = useMemo<MotionPreset>(
    () => ({
      reduced,
      instant: { duration: 0 },
      gentle: reduced
        ? { duration: 0 }
        : { type: "spring", stiffness: 240, damping: 28, mass: 1 },
      snappy: reduced
        ? { duration: 0 }
        : { type: "spring", stiffness: 460, damping: 32, mass: 0.8 },
    }),
    [reduced],
  );

  return (
    <MotionPresetContext.Provider value={value}>
      {children}
    </MotionPresetContext.Provider>
  );
}

export function AppMotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <MotionPresetProvider>{children}</MotionPresetProvider>
    </MotionConfig>
  );
}

/**
 * Hook for inside-component motion branching. Returns the three shared
 * presets plus a resolved `reduced` boolean. Throws when used outside
 * the provider — that's intentional so missing wiring fails loudly
 * instead of silently rendering unanimated UI.
 */
export function useAppMotion(): MotionPreset {
  const value = useContext(MotionPresetContext);
  if (!value) {
    throw new Error("useAppMotion must be used inside <AppMotionProvider>");
  }
  return value;
}
