"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import {
  ArrowRight,
  Sparkles,
  Coins,
  Clock,
  Flame,
  Beef,
  Refrigerator,
  ShoppingBasket,
} from "lucide-react";
import { ThreeDLink } from "@/components/ui/ThreeDButton";
import { calculateCostPerServing } from "@/lib/recipeScoring";
import { bestEffortNutrition } from "@/lib/nutritionEngine";
import { RECIPE_MAP } from "@/data/recipes";

/**
 * Scroll-driven "exploded view" hero — a single recipe card visually
 * separates into its ingredients, then its cost/macros/time/pantry/
 * grocery badges, then reassembles into an "Start AI Chef" CTA.
 *
 * Architecture: a tall outer wrapper (3× viewport height) drives the
 * scroll runway; an inner `position: sticky` panel stays pinned to the
 * viewport while the user scrolls through it. `useScroll` reports
 * progress 0→1 across the whole wrapper; each animated part calls
 * `useTransform` on that progress to map a specific scroll window to
 * its own travel/opacity.
 *
 * Reduced motion: switches to a static stacked layout (no pinning,
 * no scroll-driven transforms) so users with prefers-reduced-motion
 * see the same content without the trip.
 *
 * Concept inspired by the user's own BraveBot landing page (pinned
 * scroll-apart hero), implemented here from scratch on motion/react
 * without any 3D dependency.
 */

const TARGET_RECIPE_ID = "egg-fried-rice";

// Each part has:
//   range: [enterStart, settled] — scroll progress window for the part to fly out
//   x, y:  final translation in viewport units (matches mobile/desktop reasonably)
//   tone:  tailwind palette anchor for the chip
//   icon:  rendered icon (or undefined for emoji-only)
type Part = {
  key: string;
  label: string;
  emoji?: string;
  icon?: ReactNode;
  range: [number, number];
  x: number; // px at md+; we scale on mobile via CSS clamp
  y: number;
  tone: { bg: string; text: string; ring: string };
};

const BASIL = { bg: "bg-[#E8FAF0]", text: "text-[#0F5E33]", ring: "ring-[#B6E8CD]" };
const BUTTER = { bg: "bg-[#FFF3CC]", text: "text-[#7A4A00]", ring: "ring-[#FFE08A]" };
const CARROT = { bg: "bg-[#FFE8D6]", text: "text-[#9B3F0A]", ring: "ring-[#FFC79A]" };
const GRAPE = { bg: "bg-[#EFE8FF]", text: "text-[#3F2BB8]", ring: "ring-[#CDBEFF]" };
const PINK = { bg: "bg-[#FFE3EC]", text: "text-[#A23163]", ring: "ring-[#F9B6CD]" };
const TEAL = { bg: "bg-[#DCFAF1]", text: "text-[#0B6E55]", ring: "ring-[#A4ECD8]" };

// Phase 1 (~0.15–0.45): ingredients fly outward in a sun pattern.
const INGREDIENTS: Part[] = [
  { key: "rice",    label: "Rice",      emoji: "🍚", range: [0.12, 0.42], x:  -210, y:  -120, tone: BUTTER },
  { key: "eggs",    label: "Eggs",      emoji: "🥚", range: [0.14, 0.44], x:   210, y:  -120, tone: CARROT },
  { key: "soy",     label: "Soy sauce", emoji: "🥢", range: [0.16, 0.46], x:  -260, y:    20, tone: TEAL },
  { key: "veg",     label: "Frozen veg",emoji: "🥦", range: [0.18, 0.48], x:   260, y:    20, tone: BASIL },
  { key: "seaweed", label: "Seaweed",   emoji: "🌿", range: [0.20, 0.50], x:  -160, y:   160, tone: BASIL },
  { key: "chili",   label: "Chili crisp", emoji: "🌶️", range: [0.22, 0.52], x:   160, y:   160, tone: PINK },
];

// Phase 2 (~0.45–0.7): cost / macros / time / pantry / grocery badges emerge.
const BADGES: Part[] = [
  { key: "cost",    label: "$/serving", icon: <Coins size={14} strokeWidth={2.4} />, range: [0.46, 0.66], x: -310, y: -240, tone: BASIL },
  { key: "cal",     label: "calories",  icon: <Flame size={14} strokeWidth={2.4} />, range: [0.48, 0.68], x:  310, y: -240, tone: CARROT },
  { key: "protein", label: "protein",   icon: <Beef size={14} strokeWidth={2.4} />,  range: [0.50, 0.70], x: -310, y:  240, tone: GRAPE },
  { key: "time",    label: "min",       icon: <Clock size={14} strokeWidth={2.4} />, range: [0.52, 0.72], x:  310, y:  240, tone: BUTTER },
];

const PANTRY_GROUP: Part[] = [
  { key: "p-rice",  label: "in pantry", icon: <Refrigerator size={12} strokeWidth={2.4} />, range: [0.68, 0.84], x: -340, y:  20, tone: BASIL },
];
const GROCERY_GROUP: Part[] = [
  { key: "g-soy",   label: "to buy",    icon: <ShoppingBasket size={12} strokeWidth={2.4} />, range: [0.70, 0.86], x:  340, y:  20, tone: TEAL },
];

// Stages shown in the progress indicator at the bottom.
const STAGES = ["Recipe", "Ingredients", "Costs + macros", "Pantry vs grocery", "Start AI Chef"];

export function ExplodedRecipeHero() {
  // SSR + first-paint safety: always start with the static fallback so the
  // server-rendered HTML matches the first client paint exactly. After
  // mount we know whether the user has prefers-reduced-motion and whether
  // window APIs are available; then we promote to the animated/pinned
  // version only when it's safe to do so. This prevents a hydration
  // mismatch that previously crashed the page with "This page couldn't
  // load" for any visitor with reduced motion enabled.
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const recipe = RECIPE_MAP.get(TARGET_RECIPE_ID);
  const cps = recipe ? calculateCostPerServing(recipe) : 1.84;
  const macros = recipe ? bestEffortNutrition(recipe).estimate : { calories: 480, protein: 22 } as { calories: number; protein: number };

  // Map scroll progress to which "step" indicator is highlighted.
  const stepIndex = useTransform(scrollYProgress, [0, 0.2, 0.45, 0.7, 0.9], [0, 1, 2, 3, 4]);

  // Center bowl card — scales slightly down + fades a little so it
  // recedes as ingredients fly out, then re-centers for the CTA reveal.
  const bowlScale = useTransform(scrollYProgress, [0, 0.4, 0.85, 1], [1, 0.84, 0.7, 0]);
  const bowlOpacity = useTransform(scrollYProgress, [0, 0.4, 0.85, 0.92], [1, 0.88, 0.6, 0]);

  // Final CTA: appears at the end.
  const ctaOpacity = useTransform(scrollYProgress, [0.85, 0.97], [0, 1]);
  const ctaScale = useTransform(scrollYProgress, [0.85, 1], [0.9, 1]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Show the static stacked layout when we haven't mounted yet (SSR /
  // first paint) OR when the user has prefers-reduced-motion. Either way,
  // they get the same content; only the trip differs.
  if (!mounted || reduce) {
    return <StaticFallback recipe={recipe} cps={cps} macros={macros} />;
  }

  return (
    <section
      ref={ref}
      className="relative -mx-4 sm:-mx-6"
      style={{ height: "320vh" }}
      aria-label="Scroll-driven hero — pantry to AI Chef"
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* Soft warm backdrop so the parts read against a Pantry Pop wash */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-[#FFF1D9] via-[#FFF8ED] to-[#FFE8D6]"
        />
        <div
          aria-hidden
          className="dot-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(circle_at_50%_50%,black,transparent_70%)]"
        />

        {/* Centered stage where parts fly out from */}
        <div className="relative grid place-items-center" style={{ width: "min(640px, 92vw)", height: "min(560px, 70vh)" }}>
          {/* Center recipe card (the "bowl") */}
          <motion.div
            style={{ scale: bowlScale, opacity: bowlOpacity }}
            className="absolute inset-0 m-auto grid h-44 w-72 place-items-center rounded-[28px] border border-[#E8D8C4] bg-white p-4 text-center shadow-[0_24px_60px_-24px_rgba(36,26,18,0.25)] sm:h-52 sm:w-80"
          >
            <div>
              <div aria-hidden className="text-5xl sm:text-6xl">🍚</div>
              <p className="mt-2 text-sm font-bold text-[#241A12] sm:text-base">
                {recipe?.name ?? "Egg Fried Rice"}
              </p>
              <p className="mt-0.5 text-xs text-[#6B5A4A]">
                ${cps.toFixed(2)}/serving · {Math.round(macros.protein)}g protein
              </p>
            </div>
          </motion.div>

          {/* Phase 1: ingredient chips fly outward */}
          {INGREDIENTS.map((p) => (
            <FloatingPart key={p.key} progress={scrollYProgress} part={p} />
          ))}

          {/* Phase 2: cost / macros / time badges */}
          {BADGES.map((p) => (
            <FloatingBadge
              key={p.key}
              progress={scrollYProgress}
              part={p}
              value={
                p.key === "cost" ? `$${cps.toFixed(2)}` :
                p.key === "cal"  ? `${Math.round(macros.calories)}` :
                p.key === "protein" ? `${Math.round(macros.protein)}g` :
                `${recipe?.totalTimeMinutes ?? 15}`
              }
            />
          ))}

          {/* Phase 3: pantry vs grocery split */}
          {[...PANTRY_GROUP, ...GROCERY_GROUP].map((p) => (
            <FloatingPart key={p.key} progress={scrollYProgress} part={p} />
          ))}

          {/* Phase 4: AI Chef CTA reassembles */}
          <motion.div
            style={{ opacity: ctaOpacity, scale: ctaScale }}
            className="absolute inset-0 m-auto grid place-items-center"
          >
            <div className="flex flex-col items-center gap-3 rounded-[28px] border border-[#B6E8CD] bg-white px-6 py-5 text-center shadow-[0_24px_60px_-20px_rgba(22,131,74,0.35)] sm:px-8 sm:py-6">
              <span
                aria-hidden
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border-b-[3px] border-[#16834A] bg-gradient-to-b from-[#3AD081] to-[#2FBF71] text-white shadow-sm"
              >
                <Sparkles size={20} strokeWidth={2.4} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#16834A]">
                  Pantry → recipe in seconds
                </p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-[#241A12] sm:text-3xl">
                  Start with AI Chef.
                </p>
              </div>
              <ThreeDLink
                href="/ai-chef"
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight size={14} />}
              >
                Cook from your pantry
              </ThreeDLink>
            </div>
          </motion.div>
        </div>

        {/* Stage progress indicator (bottom) */}
        <StageIndicator stepIndex={stepIndex} />
      </div>
    </section>
  );
}

// ─── Inner components ───────────────────────────────────────────────────────

function FloatingPart({
  progress,
  part,
}: {
  progress: MotionValue<number>;
  part: Part;
}) {
  // Mobile-safe translate: clamp x/y to ~40% viewport so chips don't
  // shoot off the edge on a narrow phone.
  const x = useTransform(progress, part.range, [0, part.x]);
  const y = useTransform(progress, part.range, [0, part.y]);
  const opacity = useTransform(
    progress,
    [part.range[0], part.range[0] + 0.04, part.range[1], part.range[1] + 0.18],
    [0, 1, 1, 0],
  );
  const scale = useTransform(progress, part.range, [0.6, 1]);

  return (
    <motion.div
      style={{ x, y, opacity, scale }}
      className={`pointer-events-none absolute inset-0 m-auto h-9 w-fit max-w-[40vw] place-self-center self-center justify-self-center`}
    >
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset shadow-sm ${part.tone.bg} ${part.tone.text} ${part.tone.ring}`}
      >
        {part.emoji && <span aria-hidden className="text-base leading-none">{part.emoji}</span>}
        {part.icon}
        {part.label}
      </span>
    </motion.div>
  );
}

function FloatingBadge({
  progress,
  part,
  value,
}: {
  progress: MotionValue<number>;
  part: Part;
  value: string;
}) {
  const x = useTransform(progress, part.range, [0, part.x]);
  const y = useTransform(progress, part.range, [0, part.y]);
  const opacity = useTransform(
    progress,
    [part.range[0], part.range[0] + 0.04, 0.85, 0.92],
    [0, 1, 1, 0],
  );
  const scale = useTransform(progress, part.range, [0.6, 1]);

  return (
    <motion.div
      style={{ x, y, opacity, scale }}
      className="pointer-events-none absolute inset-0 m-auto h-fit w-fit place-self-center"
    >
      <div
        className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-2 ring-1 ring-inset shadow-sm ${part.tone.bg} ${part.tone.ring}`}
      >
        <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${part.tone.text}`}>
          {part.icon}
          {part.label}
        </span>
        <span className={`text-lg font-extrabold tabular-nums ${part.tone.text}`}>
          {value}
        </span>
      </div>
    </motion.div>
  );
}

function StageIndicator({ stepIndex }: { stepIndex: MotionValue<number> }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4 sm:bottom-10">
      <div className="flex items-center gap-1.5 rounded-full border border-[#E8D8C4] bg-white/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B5A4A] shadow-sm backdrop-blur sm:gap-2 sm:text-[11px]">
        {STAGES.map((label, i) => (
          <StageDot key={label} index={i} label={label} stepIndex={stepIndex} />
        ))}
      </div>
    </div>
  );
}

function StageDot({
  index,
  label,
  stepIndex,
}: {
  index: number;
  label: string;
  stepIndex: MotionValue<number>;
}) {
  const opacity = useTransform(stepIndex, (v) => (Math.round(v) >= index ? 1 : 0.35));
  const dotOpacity = useTransform(stepIndex, (v) => (Math.round(v) === index ? 1 : 0.5));

  return (
    <motion.span
      style={{ opacity }}
      className="hidden items-center gap-1.5 sm:inline-flex"
    >
      <motion.span
        aria-hidden
        style={{ opacity: dotOpacity }}
        className="h-1.5 w-1.5 rounded-full bg-[#2FBF71]"
      />
      <span className="text-[#241A12]">{label}</span>
      {index < STAGES.length - 1 && (
        <span aria-hidden className="text-[#E8D8C4]">/</span>
      )}
    </motion.span>
  );
}

// ─── Reduced-motion fallback ─────────────────────────────────────────────────

function StaticFallback({
  recipe,
  cps,
  macros,
}: {
  recipe: ReturnType<typeof RECIPE_MAP.get>;
  cps: number;
  macros: { calories: number; protein: number };
}) {
  return (
    <section className="relative -mx-4 overflow-hidden rounded-[2rem] border border-[#E8D8C4] bg-gradient-to-br from-[#FFF1D9] via-white to-[#FFE8D6] px-5 py-10 sm:-mx-6 sm:px-10 sm:py-12">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9B3F0A]">
            Pantry → recipe → cost
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#241A12] sm:text-4xl">
            Turn your pantry into cheap meals.
          </h2>
          <div className="mt-5">
            <ThreeDLink href="/ai-chef" variant="primary" size="lg" rightIcon={<ArrowRight size={14} />}>
              Start with AI Chef
            </ThreeDLink>
          </div>
        </div>
        <div className="rounded-3xl border border-[#B6E8CD] bg-white p-5 shadow-sm">
          <div aria-hidden className="text-5xl text-center">🍚</div>
          <p className="mt-2 text-center text-base font-bold text-[#241A12]">
            {recipe?.name ?? "Egg Fried Rice"}
          </p>
          <p className="mt-1 text-center text-sm text-[#6B5A4A]">
            ${cps.toFixed(2)}/serving · {Math.round(macros.calories)} cal · {Math.round(macros.protein)}g protein
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {INGREDIENTS.map((p) => (
              <span
                key={p.key}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${p.tone.bg} ${p.tone.text} ${p.tone.ring}`}
              >
                {p.emoji && <span aria-hidden>{p.emoji}</span>}
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
