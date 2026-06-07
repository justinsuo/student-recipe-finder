import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Waivy — Eat well on a student budget",
  description: "Turn your pantry into real recipes with cost per serving, macros, and a grocery list. Waivy is the AI cooking assistant built for students.",
  openGraph: {
    title: "Waivy — Eat well on a student budget",
    description: "Pantry-aware recipes, real cost per serving, macros, and a grocery list — AI cooking for students.",
    type: "website",
  },
};
import {
  ArrowRight,
  Coins,
  Refrigerator,
  ShoppingBasket,
  Sparkles,
  Timer,
  Leaf,
  Wallet,
  ChefHat,
  Wand2,
  Wind,
  Microwave,
  Globe,
  Home as HomeIcon,
  Bookmark,
} from "lucide-react";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { RECIPES } from "@/data/recipes";
import { RECIPE_IMAGES } from "@/data/recipeImages";
import { calculateCostPerServing } from "@/lib/recipeScoring";
import {
  isAirFryerRecipe,
  isMicrowaveRecipe,
  isNoStoveRecipe,
} from "@/lib/equipmentFilters";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stagger } from "@/components/motion/Stagger";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { ThreeDLink } from "@/components/ui/ThreeDButton";
import { ShaderGradientBackground } from "@/components/visual-effects/ShaderGradientBackground";
import { LiquidGlassPanel } from "@/components/visual-effects/LiquidGlassPanel";
import { PantryToRecipePreview } from "@/components/home/PantryToRecipePreview";

export default function HomePage() {
  // Hero collage prefers recipes with curated photos.
  const recipesWithPhotos = RECIPES.filter((r) => RECIPE_IMAGES[r.id]);
  const heroFeatured = [...recipesWithPhotos].sort(
    (a, b) => calculateCostPerServing(a) - calculateCostPerServing(b),
  )[0];
  const heroSecondaries = [...recipesWithPhotos]
    .sort((a, b) => calculateCostPerServing(a) - calculateCostPerServing(b))
    .slice(1, 3);

  const featured = [...RECIPES]
    .sort((a, b) => calculateCostPerServing(a) - calculateCostPerServing(b))
    .slice(0, 6);

  const airFryerCount = RECIPES.filter(isAirFryerRecipe).length;
  const microwaveCount = RECIPES.filter(isMicrowaveRecipe).length;
  const noStoveCount = RECIPES.filter(isNoStoveRecipe).length;
  const cheapestCps = heroFeatured
    ? calculateCostPerServing(heroFeatured)
    : null;

  return (
    <div className="space-y-20">
      {/* ─── 1. Hero ───────────────────────────────────────────────────── */}
      <section className="relative -mt-2 overflow-hidden rounded-[2rem] border border-[#E8D8C4] bg-gradient-to-br from-[#FFF1D9] via-white to-[#FFE8D6] px-5 pb-10 pt-10 sm:px-10 sm:pb-14 sm:pt-14">
        {/* Animated shader-gradient background — CSS only, soft tint,
            masked off the content area so text stays legible. Auto-
            disables under prefers-reduced-motion. */}
        <ShaderGradientBackground
          intensity="soft"
          className="[mask-image:radial-gradient(circle_at_70%_30%,black,transparent_75%)]"
        />
        <div
          aria-hidden
          className="dot-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(circle_at_30%_30%,black,transparent_60%)]"
        />
        <div className="relative grid items-center gap-10 md:grid-cols-[1.05fr_1fr]">
          <Stagger className="space-y-5" startDelay={40} step={80}>
            {/* Pantry Pop hero pill — cream surface, biscuit border, basil
                count, carrot sparkle. Bigger, friendlier hit than the old
                emerald outline bubble. */}
            <span className="inline-flex items-center gap-2.5 rounded-full border border-[#E8D8C4] bg-[#FFF8ED]/95 px-4 py-1.5 text-sm font-semibold text-[#16834A] shadow-[0_1px_0_#E8D8C4] backdrop-blur">
              <span
                aria-hidden
                className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-b from-[#FFB07A] to-[#FF8A3D] text-white shadow-sm"
              >
                <Sparkles size={12} strokeWidth={2.6} />
              </span>
              <span className="inline-flex items-baseline gap-1">
                <AnimatedNumber
                  value={RECIPES.length}
                  duration={1100}
                  className="text-[#241A12]"
                />
                <span className="text-[#241A12]">+</span>
                <span className="text-[#6B5A4A]">student-friendly recipes</span>
              </span>
            </span>
            <h1 className="text-4xl font-bold leading-[1.02] tracking-tight text-stone-900 sm:text-5xl md:text-[3.5rem]">
              Eat well on a{" "}
              <span className="relative inline-block text-emerald-600">
                student budget.
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 h-[6px] w-full rounded-full bg-emerald-200/60"
                />
              </span>
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-[#6B5A4A] sm:text-lg">
              Turn your pantry into cheap meals with AI.
            </p>

            {/* Visible "how it works" preview — three pantry chips → a
                real recipe card with live numbers. Stays compact so the
                hero CTAs don't get pushed below the fold. */}
            <PantryToRecipePreview />
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
              <ThreeDLink
                href="/ai-chef"
                variant="primary"
                size="lg"
                block
                className="sm:w-auto"
                leftIcon={<Sparkles size={16} />}
                rightIcon={<ArrowRight size={14} />}
              >
                Start with AI Chef
              </ThreeDLink>
              <ThreeDLink
                href="/pantry"
                variant="secondary"
                size="lg"
                block
                className="sm:w-auto"
                leftIcon={<Refrigerator size={16} />}
              >
                Build my pantry
              </ThreeDLink>
              <Link
                href="/cheap-recipes"
                className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline sm:self-center"
              >
                Browse cheap recipes <ArrowRight size={14} />
              </Link>
            </div>

            {/* Inline stats — wrapped in a liquid-glass panel for the
                hero "preview card" moment. Falls back to the cream
                surface where backdrop-filter isn't supported. */}
            <LiquidGlassPanel tone="cream" rounded="2xl" className="px-4 py-3 pt-4 sm:max-w-md">
              <dl className="grid grid-cols-3 gap-4">
                <HeroStat
                  value={<AnimatedNumber value={RECIPES.length} />}
                  label="recipes"
                />
                <HeroStat
                  value={
                    <AnimatedNumber
                      value={cheapestCps ?? 0}
                      duration={1300}
                      decimals={2}
                      prefix="$"
                    />
                  }
                  label="cheapest / serving"
                />
                <HeroStat
                  value={<AnimatedNumber value={noStoveCount} />}
                  label="no-stove"
                />
              </dl>
            </LiquidGlassPanel>
          </Stagger>

          {/* Hero collage */}
          <div>
            <div className="grid grid-cols-2 grid-rows-[1fr_1fr] gap-3 sm:gap-4">
              {heroFeatured && (
                <Link
                  href={`/recipes/${heroFeatured.id}`}
                  className="group relative col-span-2 overflow-hidden rounded-3xl shadow-md motion-safe:animate-[fadeUp_700ms_ease-out_both]"
                  style={{
                    aspectRatio: "16 / 10",
                    animationDelay: "120ms",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={RECIPE_IMAGES[heroFeatured.id].src}
                    alt={RECIPE_IMAGES[heroFeatured.id].alt || heroFeatured.name}
                    loading="eager"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                  <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow shadow-emerald-900/30">
                    <Coins size={11} /> ${cheapestCps?.toFixed(2)}/serving
                  </span>
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-800 backdrop-blur">
                    Today&apos;s cheapest
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white sm:p-5">
                    <p className="text-base font-semibold sm:text-lg">
                      {heroFeatured.name}
                    </p>
                    <p className="mt-1 text-xs sm:text-sm">
                      {heroFeatured.totalTimeMinutes} min ·{" "}
                      {heroFeatured.estimatedNutrition.protein}g protein ·{" "}
                      {heroFeatured.estimatedNutrition.calories} cal
                    </p>
                  </div>
                </Link>
              )}
              {heroSecondaries.map((r, i) => (
                <Link
                  key={r.id}
                  href={`/recipes/${r.id}`}
                  className="group relative aspect-square overflow-hidden rounded-3xl shadow-sm motion-safe:animate-[fadeUp_700ms_ease-out_both]"
                  style={{ animationDelay: `${260 + i * 110}ms` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={RECIPE_IMAGES[r.id].src}
                    alt={RECIPE_IMAGES[r.id].alt || r.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <p className="text-sm font-semibold leading-tight">
                      {r.name}
                    </p>
                    <p className="mt-0.5 text-[11px] opacity-90">
                      ${calculateCostPerServing(r).toFixed(2)}/serving
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. Feature hub ────────────────────────────────────────────── */}
      <ScrollReveal as="section" className="space-y-6">
        <SectionHeading
          eyebrow="Pick your tool"
          title="Four ways to cook smarter"
          description="Each one knows your pantry. Pick whichever fits the moment."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            href="/ai-chef"
            tone="violet"
            icon={<ChefHat size={22} />}
            title="AI Chef"
            description="Generate custom recipes from your pantry, budget, equipment, and cravings."
            cta="Generate a recipe"
          />
          <FeatureCard
            href="/pantry"
            tone="emerald"
            icon={<Refrigerator size={22} />}
            title="Pantry-to-Plate"
            description="Add what you already have and instantly see what you can cook."
            cta="Open pantry"
          />
          <FeatureCard
            href="/cheap-recipes"
            tone="amber"
            icon={<Coins size={22} />}
            title="Cheap Recipes"
            description="Browse student meals ranked by cost, time, equipment, and nutrition."
            cta="Find cheap meals"
          />
          <FeatureCard
            href="/recipe-studio"
            tone="sky"
            icon={<Wand2 size={22} />}
            title="Recipe Studio"
            description="Build your own recipe cards, edit AI recipes, and generate food images."
            cta="Create a recipe"
          />
        </div>
      </ScrollReveal>

      {/* ─── 3. How it works ────────────────────────────────────────────── */}
      <ScrollReveal as="section">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps from empty pantry to dinner"
          tone="amber"
        />
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          <StepCard
            n={1}
            title="Add what you have"
            description="Type, paste, or speak ingredients into your pantry. Snap a fridge photo if you'd rather."
          />
          <StepCard
            n={2}
            title="Set your constraints"
            description="Budget per serving, equipment, time, diet, and the craving you're chasing."
          />
          <StepCard
            n={3}
            title="Cook smarter"
            description="Get recipes, real prices, macros, a grocery list, and a guided cooking flow."
          />
        </ol>
      </ScrollReveal>

      {/* ─── 4. Use cases ───────────────────────────────────────────────── */}
      <ScrollReveal as="section">
        <SectionHeading
          eyebrow="Built for real kitchens"
          title="Dorms, apartments, broke schedules."
          description="Filter by what you actually have access to — and the rest of the catalog hides itself."
          tone="sky"
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <ToolCard
            href="/cheap-recipes?method=microwave"
            tone="sky"
            icon={<Microwave size={20} />}
            title="Microwave meals"
            description="No stove? No problem. Rice bowls, oats, mug omelets, baked potatoes."
            count={microwaveCount}
            bgImage="https://images.unsplash.com/photo-1642522685167-cf414ea225be?w=600&auto=format&fit=crop&q=70"
          />
          <ToolCard
            href="/cheap-recipes?method=air-fryer"
            tone="violet"
            icon={<Wind size={20} />}
            title="Air fryer meals"
            description="Crispy quesadillas, tofu nuggets, potato wedges, chickpeas."
            count={airFryerCount}
            bgImage="https://images.unsplash.com/photo-1623238913973-21e45cced554?w=600&auto=format&fit=crop&q=70"
          />
          <ToolCard
            href="/cheap-recipes?method=no-stove"
            tone="emerald"
            icon={<HomeIcon size={20} />}
            title="No-stove recipes"
            description="Microwave, air fryer, or no-cook. Built for dorms and shared kitchens."
            count={noStoveCount}
            bgImage="https://images.unsplash.com/photo-1636401870585-a8852371e84a?w=600&auto=format&fit=crop&q=70"
          />
        </div>
      </ScrollReveal>

      {/* ─── 5. Benefits ────────────────────────────────────────────────── */}
      <ScrollReveal as="section" className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-10">
        <SectionHeading
          eyebrow="Why students love it"
          title="The boring stuff, made fast."
          tone="rose"
        />
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={<Wallet size={20} />}
            title="Cost per serving"
            description="Every recipe priced from real ingredient data and regional multipliers."
            tone="amber"
          />
          <Stat
            icon={<Leaf size={20} />}
            title="Reduce food waste"
            description="Mark items use-soon — recipes that use them up float to the top."
            tone="green"
          />
          <Stat
            icon={<Timer size={20} />}
            title="Calories & macros"
            description="Per-serving protein, carbs, and fat calculated from the ingredients."
            tone="violet"
          />
          <Stat
            icon={<ShoppingBasket size={20} />}
            title="Grocery list builder"
            description="Add a recipe's missing items to your list in one tap."
            tone="sky"
          />
        </div>
      </ScrollReveal>

      {/* ─── 6. Cheapest picks ──────────────────────────────────────────── */}
      <ScrollReveal as="section" className="space-y-6">
        <SectionHeading
          eyebrow="Updated daily"
          title="Today's cheapest picks"
          description="The most affordable recipes per serving in the database."
          trailing={
            <Link
              href="/cheap-recipes"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline"
            >
              Browse all recipes <ArrowRight size={14} />
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
        <div className="sm:hidden">
          <Link
            href="/cheap-recipes"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline"
          >
            Browse all recipes <ArrowRight size={14} />
          </Link>
        </div>
      </ScrollReveal>

      {/* ─── 6.5. Nourish promo ────────────────────────────────────────── */}
      <ScrollReveal as="section" className="relative overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 via-white to-violet-50/40 p-6 sm:p-10">
        <div
          aria-hidden
          className="dot-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(circle_at_70%_30%,black,transparent_60%)]"
        />
        <div className="relative grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 backdrop-blur">
              <Sparkles size={12} /> Nourish
            </p>
            <h2 className="text-2xl font-semibold leading-tight text-stone-900 sm:text-3xl">
              Track what fuels you.
              <br className="hidden sm:block" />
              Cook to hit your goals.
            </h2>
            <p className="text-sm leading-relaxed text-stone-600">
              Log meals by search, voice, photo, or a grocery receipt. See
              calories and macros remaining. Plan the week, save your usual
              meals, and let the Coach surface the cheapest high-protein
              picks for what you have left.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="/nourish"
                className="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-200 transition-all motion-safe:hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                <Sparkles size={14} /> Open Nourish
                <ArrowRight
                  size={14}
                  className="transition-transform motion-safe:group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="/nourish/goals"
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50"
              >
                Set goals
              </Link>
              <Link
                href="/nourish/meal-planner"
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50"
              >
                Plan the week
              </Link>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Today
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tabular-nums text-stone-900">
                  1,420
                </span>
                <span className="text-sm text-stone-400">/ 2,200 kcal</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700" />
              </div>
              <p className="mt-2 text-xs text-stone-600">
                <span className="font-semibold text-emerald-700">780 kcal</span> and{" "}
                <span className="font-semibold text-violet-700">48 g protein</span>{" "}
                left.
              </p>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-3">
              <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-violet-700">
                  Protein
                </p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-violet-900">
                  92 g
                </p>
                <p className="text-[10px] text-violet-700">of 140</p>
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-sky-700">
                  Carbs
                </p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-sky-900">
                  165 g
                </p>
                <p className="text-[10px] text-sky-700">of 250</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-amber-700">
                  Fat
                </p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-amber-900">
                  48 g
                </p>
                <p className="text-[10px] text-amber-700">of 70</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ─── 7. AI Chef demo ────────────────────────────────────────────── */}
      <ScrollReveal as="section" className="overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-br from-violet-50/60 via-stone-50 to-amber-50/60 p-6 sm:p-10">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-violet-600/10 px-3 py-1 text-xs font-semibold text-violet-700">
              <Sparkles size={12} /> AI Chef demo
            </p>
            <h2 className="text-2xl font-semibold leading-tight text-stone-900 sm:text-3xl">
              Tell AI Chef what you have.
              <br className="hidden sm:block" />
              Get back a real recipe.
            </h2>
            <p className="text-sm text-stone-600">
              Drop in pantry items, equipment, and a craving. AI Chef returns
              four options — best-match, cheapest, fastest, wildcard — with
              cost per serving, macros, and a step-by-step guide.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="/ai-chef"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700"
              >
                <Sparkles size={14} /> Try with my pantry
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50"
              >
                <Globe size={14} /> Explore world recipes
              </Link>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                Pantry
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["Rice", "Eggs", "Seaweed", "Soy sauce", "Chili crisp"].map(
                  (x, i) => (
                    <span
                      key={x}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 motion-safe:animate-[fadeUp_500ms_ease-out_both]"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      {x}
                    </span>
                  ),
                )}
              </div>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                Notes
              </p>
              <p className="mt-1 text-xs text-stone-700">
                Make something like a sushi roll, but cheap and easy.
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                AI Chef idea
              </p>
              <p className="mt-1 text-base font-semibold text-stone-900">
                Sushi-Inspired Seaweed Rice Bowl
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
                  <Coins size={11} /> $1.84/serving
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
                  <Timer size={11} /> 15 min
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 font-semibold text-violet-800">
                  22g protein
                </span>
              </div>
              <p className="mt-2 text-[11px] text-stone-500">Uses 5 pantry items.</p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ─── 8. Final CTA ───────────────────────────────────────────────── */}
      <ScrollReveal as="section" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 px-6 py-12 text-white shadow-md shadow-emerald-200/60 sm:px-10 sm:py-16">
        <div
          aria-hidden
          className="dot-grid pointer-events-none absolute inset-0 opacity-25 [mask-image:radial-gradient(circle_at_70%_30%,black,transparent_70%)]"
        />
        <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide text-white">
              <Sparkles size={12} /> Cook tonight
            </p>
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Ready to cook with what you already have?
            </h2>
            <p className="text-emerald-50">
              Tap a button and start. AI Chef and your pantry are seconds away.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                href="/ai-chef"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 motion-safe:hover:-translate-y-0.5"
              >
                <Sparkles
                  size={16}
                  className="transition-transform motion-safe:group-hover:rotate-12"
                />
                Start with AI Chef
              </Link>
              <Link
                href="/pantry"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-emerald-700/40 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700/60"
              >
                <Refrigerator size={16} /> Build my pantry
              </Link>
              <Link
                href="/saved"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-emerald-700/40 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700/60"
              >
                <Bookmark size={16} /> My saved
              </Link>
            </div>
          </div>
          <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm backdrop-blur">
            &ldquo;What can I make tonight with rice, eggs, and frozen veg?&rdquo;
            <p className="mt-2 text-xs text-emerald-50">
              — Pesto answers in seconds. Tap the floating chat icon any time.
            </p>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────

function HeroStat({
  value,
  label,
}: {
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-xl font-semibold text-stone-900">{value}</dd>
    </div>
  );
}

function FeatureCard({
  href,
  tone,
  icon,
  title,
  description,
  cta,
}: {
  href: string;
  tone: "violet" | "emerald" | "amber" | "sky";
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
}) {
  const tones: Record<string, string> = {
    violet: "bg-violet-100 text-violet-700 group-hover:bg-violet-600 group-hover:text-white",
    emerald: "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white",
    amber: "bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white",
    sky: "bg-sky-100 text-sky-700 group-hover:bg-sky-600 group-hover:text-white",
  };
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 transition-all motion-safe:hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <div
        className={`grid h-12 w-12 place-items-center rounded-2xl transition-colors ${tones[tone]}`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-stone-900">{title}</h3>
      <p className="text-sm text-stone-600">{description}</p>
      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
        {cta}{" "}
        <ArrowRight
          size={14}
          className="transition-transform motion-safe:group-hover:translate-x-1"
        />
      </span>
    </Link>
  );
}

function StepCard({
  n,
  title,
  description,
}: {
  n: number;
  title: string;
  description: string;
}) {
  return (
    <li className="relative rounded-3xl border border-stone-200 bg-white p-6 transition-shadow hover:shadow-md">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-base font-bold text-white shadow-sm shadow-emerald-200">
        {n}
      </span>
      <h3 className="mt-3 text-lg font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-stone-600">{description}</p>
      <span
        aria-hidden
        className="absolute right-5 top-5 text-3xl font-bold text-stone-100"
      >
        0{n}
      </span>
    </li>
  );
}

function ToolCard({
  href,
  tone,
  icon,
  title,
  description,
  count,
  bgImage,
}: {
  href: string;
  tone: "sky" | "violet" | "emerald";
  icon: React.ReactNode;
  title: string;
  description: string;
  count: number;
  bgImage?: string;
}) {
  const tones: Record<string, string> = {
    sky: "bg-sky-100 text-sky-700",
    violet: "bg-violet-100 text-violet-700",
    emerald: "bg-emerald-100 text-emerald-700",
  };
  return (
    <Link
      href={href}
      className="group relative flex aspect-[4/3] flex-col overflow-hidden rounded-3xl shadow-sm transition-all motion-safe:hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      {bgImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bgImage}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/15" />
        </>
      )}
      <div className="relative flex h-full flex-col p-5 text-white">
        <div
          className={`mb-auto grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-semibold leading-tight">{title}</h3>
          <p className="mt-1 text-sm text-white/85">{description}</p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/90">
            {count} recipes{" "}
            <ArrowRight
              size={12}
              className="transition-transform motion-safe:group-hover:translate-x-1"
            />
          </p>
        </div>
      </div>
    </Link>
  );
}

function Stat({
  icon,
  title,
  description,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone: "amber" | "green" | "violet" | "sky";
}) {
  const tones: Record<string, string> = {
    amber: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
    violet: "bg-violet-100 text-violet-700",
    sky: "bg-sky-100 text-sky-700",
  };
  return (
    <div>
      <div
        className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}
      >
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-stone-600">{description}</p>
    </div>
  );
}
