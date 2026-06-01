import Link from "next/link";
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
    <div className="space-y-16">
      {/* ─── 1. Hero ────────────────────────────────────────────────────── */}
      <section className="grid gap-8 md:grid-cols-[1.05fr_1fr] md:items-center md:gap-12">
        <div className="space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <Sparkles size={14} />
            {RECIPES.length}+ student-friendly recipes
          </span>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-stone-900 sm:text-5xl md:text-6xl">
            Eat well without{" "}
            <span className="text-emerald-600">overspending.</span>
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-stone-600 sm:text-lg">
            Use your pantry, budget, and cooking tools to find cheap recipes —
            or let AI Chef create something new from what you already have.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <Link
              href="/ai-chef"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all motion-safe:hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              <Sparkles size={16} /> Try AI Chef
            </Link>
            <Link
              href="/pantry"
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
            >
              <Refrigerator size={16} /> Build my pantry
            </Link>
            <Link
              href="/cheap-recipes"
              className="inline-flex items-center gap-1.5 self-center text-sm font-semibold text-emerald-700 hover:underline"
            >
              Browse cheap recipes <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-2 grid-rows-[1fr_1fr] gap-3 sm:gap-4">
            {heroFeatured && (
              <Link
                href={`/recipes/${heroFeatured.id}`}
                className="group relative col-span-2 overflow-hidden rounded-3xl shadow-sm"
                style={{ aspectRatio: "16 / 10" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={RECIPE_IMAGES[heroFeatured.id].src}
                  alt={RECIPE_IMAGES[heroFeatured.id].alt || heroFeatured.name}
                  loading="eager"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow">
                  <Coins size={11} /> ${cheapestCps?.toFixed(2)}/serving
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
            {heroSecondaries.map((r) => (
              <Link
                key={r.id}
                href={`/recipes/${r.id}`}
                className="group relative aspect-square overflow-hidden rounded-3xl shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={RECIPE_IMAGES[r.id].src}
                  alt={RECIPE_IMAGES[r.id].alt || r.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <p className="text-sm font-semibold leading-tight">{r.name}</p>
                  <p className="mt-0.5 text-[11px] opacity-90">
                    ${calculateCostPerServing(r).toFixed(2)}/serving
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 2. Feature cards (4-up) ────────────────────────────────────── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold text-stone-900">
            Four ways to cook smarter
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Pick the one that fits your moment.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            href="/ai-chef"
            tone="violet"
            icon={<ChefHat size={22} />}
            title="AI Chef"
            description="Generate custom recipes from your pantry, budget, equipment, cravings, and notes."
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
            description="Browse student-friendly meals ranked by cost, time, equipment, and nutrition."
            cta="Find cheap meals"
          />
          <FeatureCard
            href="/recipe-studio"
            tone="sky"
            icon={<Wand2 size={22} />}
            title="Recipe Studio"
            description="Create your own recipe cards, edit AI recipes, and generate food images."
            cta="Create a recipe"
          />
        </div>
      </section>

      {/* ─── 3. How it works ────────────────────────────────────────────── */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-stone-900">How it works</h2>
          <p className="mt-1 text-sm text-stone-600">
            Three steps from empty pantry to dinner.
          </p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3">
          <StepCard
            n={1}
            title="Add what you have"
            description="Type, paste, or speak ingredients into your pantry."
          />
          <StepCard
            n={2}
            title="Set your constraints"
            description="Choose your budget, equipment, time, diet, and cravings."
          />
          <StepCard
            n={3}
            title="Cook smarter"
            description="Get recipes, pricing, macros, grocery lists, and step-by-step cooking help."
          />
        </ol>
      </section>

      {/* ─── 4. Student use cases ───────────────────────────────────────── */}
      <section>
        <div className="mb-5">
          <h2 className="text-2xl font-semibold text-stone-900">
            Built for dorms, apartments, and broke student schedules.
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Filter by what you actually have access to.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <ToolCard
            href="/cheap-recipes"
            tone="sky"
            icon={<Microwave size={20} />}
            title="Microwave meals"
            description="No stove? No problem. Rice bowls, oats, mug omelets, baked potatoes."
            count={microwaveCount}
            bgImage="https://images.unsplash.com/photo-1642522685167-cf414ea225be?w=600&auto=format&fit=crop&q=70"
          />
          <ToolCard
            href="/cheap-recipes"
            tone="violet"
            icon={<Wind size={20} />}
            title="Air fryer meals"
            description="Crispy quesadillas, tofu nuggets, potato wedges, chickpeas."
            count={airFryerCount}
            bgImage="https://images.unsplash.com/photo-1623238913973-21e45cced554?w=600&auto=format&fit=crop&q=70"
          />
          <ToolCard
            href="/cheap-recipes"
            tone="emerald"
            icon={<HomeIcon size={20} />}
            title="No-stove recipes"
            description="Microwave, air fryer, or no-cook. Built for dorms and shared kitchens."
            count={noStoveCount}
            bgImage="https://images.unsplash.com/photo-1636401870585-a8852371e84a?w=600&auto=format&fit=crop&q=70"
          />
        </div>
      </section>

      {/* ─── 5. Benefits grid ───────────────────────────────────────────── */}
      <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-stone-900">
          Why students love it
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={<Wallet size={20} />}
            title="Cost per serving"
            description="Every recipe is priced from real ingredient data."
            tone="amber"
          />
          <Stat
            icon={<Leaf size={20} />}
            title="Reduce food waste"
            description="Mark items 'use soon' — recipes that use them up float to the top."
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
      </section>

      {/* ─── 6. Popular recipes ─────────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-stone-900">
              Today&apos;s cheapest picks
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              The most affordable recipes per serving in the database.
            </p>
          </div>
          <Link
            href="/cheap-recipes"
            className="hidden text-sm font-semibold text-emerald-700 hover:underline sm:inline-flex"
          >
            Browse all recipes →
          </Link>
        </div>
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
      </section>

      {/* ─── 7. AI Chef demo ────────────────────────────────────────────── */}
      <section className="rounded-3xl bg-gradient-to-br from-emerald-50 via-stone-50 to-amber-50 p-6 ring-1 ring-stone-200 sm:p-10">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-violet-600/10 px-3 py-1 text-xs font-semibold text-violet-700">
              <Sparkles size={12} /> AI Chef demo
            </p>
            <h2 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
              Tell AI Chef what you have.
            </h2>
            <p className="text-sm text-stone-600">
              Drop in pantry items, equipment, and a craving. AI Chef returns a
              full recipe with cost per serving, macros, and a step-by-step
              guide.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="/ai-chef"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Sparkles size={14} /> Try this with my pantry
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
                  (x) => (
                    <span
                      key={x}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
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
                <span className="text-stone-500">Uses 5 pantry items</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8. Final CTA ───────────────────────────────────────────────── */}
      <section className="rounded-3xl bg-emerald-600 px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Ready to cook with what you already have?
            </h2>
            <p className="text-emerald-50">
              Tap a button and start. AI Chef and your pantry are seconds away.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                href="/ai-chef"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 motion-safe:hover:-translate-y-0.5"
              >
                <Sparkles size={16} /> Start with AI Chef
              </Link>
              <Link
                href="/pantry"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-emerald-700/40 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700/60"
              >
                <Refrigerator size={16} /> Build my pantry
              </Link>
            </div>
          </div>
          <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm">
            &ldquo;What can I make tonight with rice, eggs, and frozen veg?&rdquo;
            <p className="mt-2 text-xs text-emerald-50">
              — Pesto answers in seconds. Tap the floating chat icon any time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────

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
    violet: "bg-violet-100 text-violet-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    sky: "bg-sky-100 text-sky-700",
  };
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-3xl border border-stone-200 bg-white p-6 transition-all motion-safe:hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <div
        className={`grid h-12 w-12 place-items-center rounded-2xl ${tones[tone]}`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-stone-900">{title}</h3>
      <p className="text-sm text-stone-600">{description}</p>
      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 group-hover:underline">
        {cta} <ArrowRight size={14} />
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
    <li className="relative rounded-3xl border border-stone-200 bg-white p-6">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-base font-bold text-white shadow-sm">
        {n}
      </span>
      <h3 className="mt-3 text-lg font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm text-stone-600">{description}</p>
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
      className="group relative flex aspect-[4/3] flex-col overflow-hidden rounded-3xl shadow-sm transition-all motion-safe:hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      {bgImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bgImage}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />
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
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-white/90">
            {count} recipes →
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
      <p className="mt-1 text-sm text-stone-600">{description}</p>
    </div>
  );
}
