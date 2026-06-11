"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Sparkles,
  ChefHat,
  ArrowRight,
  Briefcase,
  DollarSign,
  BarChart3,
  ListChecks,
} from "lucide-react";

/**
 * AI Chef hero — left/right split that establishes "ingredients → AI →
 * recipe" before the form. Matches the user-provided mockup:
 *
 *   Left (3/5):
 *     - Small "AI Chef" pill with chef-hat icon
 *     - Large headline (with gradient accent on the last word)
 *     - Short description
 *     - Row of 4 icon-led benefit cards
 *
 *   Right (2/5):
 *     - "You have / You're craving / Budget" input card
 *     - Pulsing purple AI orb in the middle
 *     - Recipe preview card with image, title, $/serving, macros,
 *       missing items, ready-in, View Recipe button
 *
 * Animations are time-driven (no scroll), respect prefers-reduced-motion,
 * and use the motion/react package that's already installed. No new deps.
 */

export function AIChefDemoHero() {
  const reduce = useReducedMotion();

  // Soft phase ticker just for chip / orb / card emphasis. The visual
  // doesn't depend on it for correctness — both states look fine — but
  // it adds gentle life.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setTick((t) => (t + 1) % 100), 1800);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#CDBEFF]/70 bg-gradient-to-br from-[#EFE8FF] via-[#FFF8ED] to-[#E8FAF0] px-5 py-6 shadow-sm sm:px-8 sm:py-8">
      <div
        aria-hidden
        className="dot-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(circle_at_30%_30%,black,transparent_60%)]"
      />

      <div className="relative grid items-center gap-8 lg:grid-cols-[3fr_2fr] lg:gap-10">
        {/* ─── Left: copy + benefits ──────────────────────────────────────── */}
        <div className="space-y-5">
          <Eyebrow />
          <Headline />
          <p className="max-w-md text-sm leading-relaxed text-[#6B5A4A] sm:max-w-lg sm:text-base">
            AI Chef turns your pantry, cravings, and budget into a personalized
            recipe complete with macros, missing items, and a step-by-step
            guide.
          </p>
          <BenefitsRow />
        </div>

        {/* ─── Right: input → AI → output flow ────────────────────────────── */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3 lg:min-w-[420px]">
          <InputPreviewCard reduce={!!reduce} tick={tick} />
          <AIOrb reduce={!!reduce} />
          <RecipePreviewCard reduce={!!reduce} tick={tick} />
        </div>
      </div>
    </section>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

function Eyebrow() {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="relative grid h-12 w-12 place-items-center rounded-2xl border-b-[3px] border-[#3F2BB8] bg-gradient-to-b from-[#A18FFF] to-[#7C5CFF] text-white shadow-sm"
      >
        <ChefHat size={20} strokeWidth={2.4} />
        <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-[#FFD166] text-[8px] text-[#5C3700] shadow">
          <Sparkles size={8} strokeWidth={3} />
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#CDBEFF] bg-white/85 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#3F2BB8] backdrop-blur">
        AI Chef
      </span>
    </div>
  );
}

function Headline() {
  return (
    <h1 className="text-4xl font-extrabold leading-[1.02] tracking-tight text-[#241A12] sm:text-5xl lg:text-[3.25rem]">
      From what you have,
      <br />
      to what you&apos;ll{" "}
      <span
        className="bg-clip-text text-transparent"
        style={{
          backgroundImage:
            "linear-gradient(110deg, #7C5CFF 0%, #FF8A3D 70%, #FFB347 100%)",
        }}
      >
        love.
      </span>
    </h1>
  );
}

function BenefitsRow() {
  return (
    <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4 sm:gap-3">
      <BenefitCard
        icon={<Briefcase size={16} strokeWidth={2.4} />}
        label="Use what you have"
        toneIcon="bg-[#E8FAF0] text-[#0F5E33]"
      />
      <BenefitCard
        icon={<DollarSign size={16} strokeWidth={2.6} />}
        label="Respects your budget"
        toneIcon="bg-[#FFF3CC] text-[#7A4A00]"
      />
      <BenefitCard
        icon={<BarChart3 size={16} strokeWidth={2.4} />}
        label="Macro & nutrition breakdown"
        toneIcon="bg-[#EFE8FF] text-[#3F2BB8]"
      />
      <BenefitCard
        icon={<ListChecks size={16} strokeWidth={2.4} />}
        label="Auto grocery list"
        toneIcon="bg-[#DCFAF1] text-[#0B6E55]"
      />
    </div>
  );
}

function BenefitCard({
  icon,
  label,
  toneIcon,
}: {
  icon: React.ReactNode;
  label: string;
  toneIcon: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/70 px-2.5 py-2 shadow-sm backdrop-blur transition-all motion-safe:hover:-translate-y-px hover:bg-white">
      <span
        aria-hidden
        className={`grid h-8 w-8 flex-none place-items-center rounded-lg ${toneIcon}`}
      >
        {icon}
      </span>
      <span className="text-[11px] font-semibold leading-tight text-[#241A12] sm:text-xs">
        {label}
      </span>
    </div>
  );
}

function InputPreviewCard({ reduce, tick }: { reduce: boolean; tick: number }) {
  const pulseOn = reduce ? false : tick % 2 === 0;
  return (
    <motion.div
      initial={false}
      animate={{ y: reduce ? 0 : pulseOn ? -1 : 1 }}
      transition={{ duration: 0.9, ease: "easeInOut" }}
      className="rounded-2xl border border-[#E8D8C4] bg-white p-3 shadow-sm sm:p-4"
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#241A12]">
        You have
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <Chip emoji="🍗" label="Chicken" tone="carrot" />
        <Chip emoji="🍚" label="Rice" tone="butter" />
        <Chip emoji="🥦" label="Broccoli" tone="basil" />
      </div>

      <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-[#241A12]">
        You&apos;re craving
      </p>
      <div className="mt-1.5">
        <Chip emoji="🌶️" label="Something spicy" tone="tomato" />
      </div>

      <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-[#241A12]">
        Budget
      </p>
      <p className="mt-1 text-xs font-extrabold text-[#16834A]">
        $3 per serving
      </p>
    </motion.div>
  );
}

function Chip({
  emoji,
  label,
  tone,
}: {
  emoji?: string;
  label: string;
  tone: "carrot" | "butter" | "basil" | "tomato" | "grape" | "teal";
}) {
  const cls =
    tone === "carrot"
      ? "bg-[#FFE8D6] text-[#9B3F0A] ring-[#FFC79A]"
      : tone === "butter"
        ? "bg-[#FFF3CC] text-[#7A4A00] ring-[#FFE08A]"
        : tone === "basil"
          ? "bg-[#E8FAF0] text-[#0F5E33] ring-[#B6E8CD]"
          : tone === "tomato"
            ? "bg-[#FDE4E4] text-[#9B1C1C] ring-[#F8B4B4]"
            : tone === "grape"
              ? "bg-[#EFE8FF] text-[#3F2BB8] ring-[#CDBEFF]"
              : "bg-[#DCFAF1] text-[#0B6E55] ring-[#A4ECD8]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border bg-white px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${cls}`}
    >
      {emoji && (
        <span aria-hidden className="text-sm leading-none">
          {emoji}
        </span>
      )}
      {label}
    </span>
  );
}

function AIOrb({ reduce }: { reduce: boolean }) {
  return (
    <div className="relative flex h-14 items-center justify-center sm:h-16">
      {/* Connection dotted line behind the orb */}
      <span
        aria-hidden
        className="absolute inset-x-[-12px] top-1/2 h-px -translate-y-1/2"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, #CDBEFF 0 4px, transparent 4px 8px)",
        }}
      />
      <div className="relative grid h-12 w-12 place-items-center sm:h-14 sm:w-14">
        <motion.span
          aria-hidden
          initial={false}
          animate={
            reduce
              ? { opacity: 0.4, scale: 1.1 }
              : { scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }
          }
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
          }
          className="absolute inset-0 rounded-full bg-[#7C5CFF]/45"
        />
        <motion.span
          initial={false}
          animate={reduce ? { scale: 1 } : { scale: [1, 1.06, 1] }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
          }
          className="relative grid h-10 w-10 place-items-center rounded-full border-b-[3px] border-[#3F2BB8] bg-gradient-to-b from-[#A18FFF] to-[#7C5CFF] text-white shadow-sm sm:h-11 sm:w-11"
        >
          <Sparkles size={16} strokeWidth={2.6} />
        </motion.span>
      </div>
    </div>
  );
}

function RecipePreviewCard({ reduce, tick }: { reduce: boolean; tick: number }) {
  // Subtle fade-in on first mount + gentle vertical hover-like idle.
  const idleY = reduce ? 0 : (tick % 2 === 0 ? -1 : 1);
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: idleY }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-2xl border border-[#E8D8C4] bg-white shadow-md"
    >
      {/* Image placeholder using a warm gradient + emoji — no external
          asset required, no broken image possible. */}
      <div className="relative h-20 w-full bg-gradient-to-br from-[#FFE8D6] via-[#FFF3CC] to-[#FFD9B3] sm:h-24">
        <div
          aria-hidden
          className="absolute inset-0 grid place-items-center text-4xl sm:text-5xl"
        >
          🍛
        </div>
      </div>
      <div className="space-y-1.5 p-2.5 sm:p-3">
        <p className="text-[11px] font-extrabold leading-tight text-[#241A12] sm:text-xs">
          Spicy Garlic Chicken Rice Bowl
        </p>
        <p className="inline-flex rounded-full bg-[#E8FAF0] px-1.5 py-0.5 text-[10px] font-extrabold text-[#0F5E33]">
          $2.40 / serving
        </p>
        <div className="flex flex-wrap gap-1">
          <MicroBadge text="520 kcal" tone="carrot" />
          <MicroBadge text="38g P" tone="grape" />
          <MicroBadge text="62g C" tone="sky" />
          <MicroBadge text="14g F" tone="butter" />
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1 text-[9px]">
          <div>
            <p className="font-bold uppercase tracking-wide text-[#9B3F0A]">
              Missing
            </p>
            <p className="truncate font-semibold text-[#9B3F0A]">
              Soy sauce, Garlic
            </p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-wide text-[#16834A]">
              Ready in
            </p>
            <p className="font-semibold text-[#16834A]">25 mins</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 rounded-lg border-b-[2px] border-[#3F2BB8] bg-gradient-to-b from-[#A18FFF] to-[#7C5CFF] px-2 py-1.5 text-[10px] font-extrabold text-white">
          View Recipe
          <ArrowRight size={10} strokeWidth={2.8} />
        </div>
      </div>
    </motion.div>
  );
}

function MicroBadge({
  text,
  tone,
}: {
  text: string;
  tone: "carrot" | "grape" | "sky" | "butter";
}) {
  const cls =
    tone === "carrot"
      ? "bg-[#FFE8D6] text-[#9B3F0A]"
      : tone === "grape"
        ? "bg-[#EFE8FF] text-[#3F2BB8]"
        : tone === "sky"
          ? "bg-[#E0F2FE] text-[#1F6FA8]"
          : "bg-[#FFF3CC] text-[#7A4A00]";
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-extrabold tabular-nums ${cls}`}
    >
      {text}
    </span>
  );
}
