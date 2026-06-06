import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Coins,
  Refrigerator,
  ShoppingBasket,
  Sparkles,
  MessageCircle,
  ChefHat,
  Globe,
  Wand2,
  Apple,
  Camera,
  Mic,
  Receipt,
  Timer,
  Flame,
  CalendarDays,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { IconTile } from "@/components/ui/IconTile";
import { BentoGrid, BentoItem } from "@/components/ui/BentoGrid";
import { StatCard } from "@/components/ui/StatCard";
import { ThreeDLink } from "@/components/ui/ThreeDButton";
import { RECIPES } from "@/data/recipes";
import { INGREDIENTS } from "@/data/ingredients";

export const metadata: Metadata = {
  title: "About Waivy — AI Cooking for Students",
  description:
    "How Waivy helps students cook real food on a tight budget — pantry-aware recipes, real cost per serving, and AI that works with what you have.",
  openGraph: {
    title: "About Waivy — AI Cooking for Students",
    description:
      "Pantry-aware recipes, real costs, AI Chef. Built for students.",
    type: "website",
  },
};

type FeatureTone = "basil" | "carrot" | "butter" | "grape" | "teal" | "sky" | "pink" | "indigo";

type Feature = {
  key: string;
  icon: ReactNode;
  label: string;
  meta: string;
  href: string;
  tone: FeatureTone;
  span?: 1 | 2;
  rowSpan?: 1 | 2;
};

const F_ICON = 20;
const FEATURES: Feature[] = [
  { key: "ai-chef",  icon: <ChefHat        size={26} strokeWidth={2.4} />, label: "AI Chef",       meta: "4 options",            href: "/ai-chef",       tone: "grape",  span: 2, rowSpan: 2 },
  { key: "pantry",   icon: <Refrigerator   size={F_ICON} strokeWidth={2.4} />, label: "Pantry",        meta: "Type · paste · voice", href: "/pantry",        tone: "basil",  span: 1 },
  { key: "cheap",    icon: <Coins          size={F_ICON} strokeWidth={2.4} />, label: "Cheap recipes", meta: "By $/serving",         href: "/cheap-recipes", tone: "butter", span: 1 },
  { key: "nourish",  icon: <Apple          size={F_ICON} strokeWidth={2.4} />, label: "Nourish",       meta: "Macros + coach",       href: "/nourish",       tone: "carrot", span: 2 },
  { key: "grocery",  icon: <ShoppingBasket size={F_ICON} strokeWidth={2.4} />, label: "Grocery list",  meta: "Region-priced",        href: "/grocery-list",  tone: "teal",   span: 1 },
  { key: "saved",    icon: <Sparkles       size={F_ICON} strokeWidth={2.4} />, label: "Recipe box",    meta: "Save · cook later",    href: "/saved",         tone: "pink",   span: 1 },
  { key: "explore",  icon: <Globe          size={F_ICON} strokeWidth={2.4} />, label: "World recipes", meta: "60+ cuisines",         href: "/explore",       tone: "indigo", span: 1 },
  { key: "studio",   icon: <Wand2          size={F_ICON} strokeWidth={2.4} />, label: "Recipe Studio", meta: "Build + remix",        href: "/recipe-studio", tone: "grape",  span: 1 },
];

const CAPABILITY_TILES: { icon: ReactNode; label: string; tone: "basil" | "carrot" | "butter" | "grape" | "teal" | "sky" | "pink" }[] = [
  { icon: <Camera       size={16} strokeWidth={2.4} />, label: "Fridge photo", tone: "grape"  },
  { icon: <Mic          size={16} strokeWidth={2.4} />, label: "Voice add",    tone: "sky"    },
  { icon: <Receipt      size={16} strokeWidth={2.4} />, label: "Receipt scan", tone: "carrot" },
  { icon: <Timer        size={16} strokeWidth={2.4} />, label: "Smart timers", tone: "teal"   },
  { icon: <Flame        size={16} strokeWidth={2.4} />, label: "Use-soon",     tone: "butter" },
  { icon: <CalendarDays size={16} strokeWidth={2.4} />, label: "7-day plan",   tone: "pink"   },
];

export default function AboutPage() {
  const recipeCount = RECIPES.length;
  const ingredientCount = INGREDIENTS.length;

  return (
    <div className="space-y-14">
      <PageHeader
        eyebrow="About"
        title="A cooking app, not a recipe database."
        description="Pantry-aware. Real costs. AI Chef. Runs in your browser — no account, no tracking."
        tone="emerald"
      />

      {/* ─── Stat strip — replaces the "16 bullets" text block ─── */}
      <ScrollReveal as="section">
        <BentoGrid cols={4}>
          <StatCard icon={<ChefHat        size={16} strokeWidth={2.4} />} tone="grape"  value={recipeCount}     label="Recipes" />
          <StatCard icon={<Refrigerator   size={16} strokeWidth={2.4} />} tone="basil"  value={ingredientCount} label="Ingredients" />
          <StatCard icon={<Coins          size={16} strokeWidth={2.4} />} tone="butter" value="14"              label="US regions" />
          <StatCard icon={<Sparkles       size={16} strokeWidth={2.4} />} tone="carrot" value="∞"               label="AI options" />
        </BentoGrid>
      </ScrollReveal>

      {/* ─── Feature bento — was a 3-col grid of paragraph cards ─── */}
      <ScrollReveal as="section">
        <SectionHeading
          eyebrow="The product"
          title="What you can do here."
          tone="amber"
        />
        <div className="mt-6">
          <BentoGrid cols={4}>
            {FEATURES.map((f) => (
              <BentoItem key={f.key} colSpan={f.span} rowSpan={f.rowSpan}>
                <IconTile
                  href={f.href}
                  icon={f.icon}
                  label={f.label}
                  meta={f.meta}
                  tone={f.tone}
                  size={f.rowSpan === 2 ? "lg" : "md"}
                  className="h-full"
                />
              </BentoItem>
            ))}
          </BentoGrid>
        </div>
      </ScrollReveal>

      {/* ─── Capability strip — was prose ("voice / paste / receipt OCR…") ─── */}
      <ScrollReveal as="section">
        <SectionHeading
          eyebrow="Power moves"
          title="Six ways to load your pantry."
          tone="violet"
        />
        <div className="mt-6">
          <BentoGrid cols={6}>
            {CAPABILITY_TILES.map((c) => (
              <BentoItem key={c.label}>
                <IconTile icon={c.icon} label={c.label} tone={c.tone} size="sm" className="h-full" />
              </BentoItem>
            ))}
          </BentoGrid>
        </div>
      </ScrollReveal>

      {/* ─── Pesto card — leaner copy, sticker-style avatar ─── */}
      <ScrollReveal
        as="section"
        className="overflow-hidden rounded-3xl border border-[#B6E8CD] bg-gradient-to-br from-[#E8FAF0] via-white to-[#FFF8ED] p-6 sm:p-8"
      >
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <span
            aria-hidden
            className="grid h-14 w-14 flex-none place-items-center rounded-2xl border-b-[4px] border-[#16834A] bg-gradient-to-b from-[#3AD081] to-[#2FBF71] text-white shadow-md"
          >
            <MessageCircle size={26} strokeWidth={2.4} />
          </span>
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#16834A]">
              Floating chat
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0F5E33] sm:text-3xl">
              Meet Pesto.
            </h2>
            <p className="mt-1 text-sm text-[#16834A] sm:text-base">
              Tap the green bubble bottom-right. Ask anything food.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* ─── CTA — replaces the dark slide-deck closer ─── */}
      <ScrollReveal
        as="section"
        className="relative overflow-hidden rounded-3xl border border-[#E8D8C4] bg-[#FFF1D9] p-8 sm:p-10"
      >
        <div
          aria-hidden
          className="dot-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(circle_at_75%_30%,black,transparent_65%)]"
        />
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#9B3F0A]">
            <Sparkles size={12} /> Cook tonight
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#241A12] sm:text-4xl">
            Ready to cook?
          </h2>
          <p className="mt-2 max-w-md text-[#6B5A4A]">
            Pick how you want to start.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ThreeDLink href="/ai-chef" variant="primary" size="lg" leftIcon={<ChefHat size={16} />}>
              Start AI Chef
            </ThreeDLink>
            <ThreeDLink href="/pantry" variant="secondary" size="lg" leftIcon={<Refrigerator size={16} />}>
              Use pantry
            </ThreeDLink>
            <ThreeDLink href="/cheap-recipes" variant="warning" size="lg" leftIcon={<Coins size={16} />}>
              Cheap meals
            </ThreeDLink>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
