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
} from "lucide-react";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { RECIPES } from "@/data/recipes";
import { RECIPE_IMAGES } from "@/data/recipeImages";
import { calculateCostPerServing } from "@/lib/recipeScoring";

export default function HomePage() {
  // Prefer recipes that have curated photos for the hero collage
  const recipesWithPhotos = RECIPES.filter((r) => RECIPE_IMAGES[r.id]);
  const collage = [...recipesWithPhotos]
    .sort((a, b) => calculateCostPerServing(a) - calculateCostPerServing(b))
    .slice(0, 4);
  const featured = [...RECIPES]
    .sort((a, b) => calculateCostPerServing(a) - calculateCostPerServing(b))
    .slice(0, 6);

  return (
    <div className="space-y-16">
      <section className="grid gap-10 md:grid-cols-2 md:items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <Sparkles size={14} />
            Built for students on a budget
          </span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-stone-900 sm:text-5xl md:text-6xl">
            Eat well without
            <br />
            <span className="text-emerald-600">overspending.</span>
          </h1>
          <p className="max-w-lg text-base text-stone-600 sm:text-lg">
            Find cheap, practical recipes built around the money you have, the
            equipment you own, and the food already in your kitchen. Cost
            estimates included.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/cheap-recipes"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Find cheap meals
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/pantry"
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50"
            >
              Cook with what you have
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            {collage.map((r, i) => {
              const photo = RECIPE_IMAGES[r.id];
              return (
                <Link
                  key={r.id}
                  href={`/recipes/${r.id}`}
                  className={`group relative flex aspect-square flex-col justify-between overflow-hidden rounded-3xl shadow-sm ${
                    i === 1 || i === 2 ? "translate-y-6" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.src}
                    alt={photo.alt || r.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
                  <div className="relative mt-auto p-4 text-white">
                    <p className="text-sm font-semibold">{r.name}</p>
                    <p className="mt-1 text-xs">
                      ${calculateCostPerServing(r).toFixed(2)}/serving
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/cheap-recipes"
          className="group flex flex-col gap-3 rounded-3xl border border-stone-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
            <Coins size={22} />
          </div>
          <h2 className="text-xl font-semibold text-stone-900">
            Find cheap meals
          </h2>
          <p className="text-sm text-stone-600">
            Set a budget per serving, your gear, and your diet — we&apos;ll rank
            the most affordable, practical recipes.
          </p>
          <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 group-hover:underline">
            Start the coach <ArrowRight size={14} />
          </span>
        </Link>
        <Link
          href="/pantry"
          className="group flex flex-col gap-3 rounded-3xl border border-stone-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Refrigerator size={22} />
          </div>
          <h2 className="text-xl font-semibold text-stone-900">
            Cook with what you have
          </h2>
          <p className="text-sm text-stone-600">
            Add what&apos;s in your pantry and we&apos;ll show what you can make
            now, what you&apos;re close to making, and what to buy next.
          </p>
          <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 group-hover:underline">
            Build your pantry <ArrowRight size={14} />
          </span>
        </Link>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-stone-900">Why students love it</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={<Wallet size={20} />}
            title="Cost per serving"
            description="Estimate what every recipe costs before you cook."
            tone="amber"
          />
          <Stat
            icon={<Leaf size={20} />}
            title="Reduce food waste"
            description="Mark items as 'use soon' and we'll prioritize recipes that use them up."
            tone="green"
          />
          <Stat
            icon={<Timer size={20} />}
            title="Dorm-friendly"
            description="Filter to microwave-only or no-kitchen recipes when you're without a stove."
            tone="violet"
          />
          <Stat
            icon={<ShoppingBasket size={20} />}
            title="Smart grocery buys"
            description="See which one cheap staple would unlock the most extra recipes."
            tone="sky"
          />
        </div>
      </section>

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
            See all →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-emerald-600 px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="grid gap-6 md:grid-cols-3 md:items-center">
          <div className="md:col-span-2 space-y-3">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Got a question? Ask Pesto.
            </h2>
            <p className="text-emerald-50">
              Our in-app AI assistant knows every recipe, every ingredient cost,
              and every cheap swap. Tap the chat icon to start.
            </p>
          </div>
          <div className="flex justify-start md:justify-end">
            <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm">
              &ldquo;What can I make tonight with rice, eggs, and frozen veg?&rdquo;
            </div>
          </div>
        </div>
      </section>
    </div>
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
      <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}>
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm text-stone-600">{description}</p>
    </div>
  );
}
