import Link from "next/link";
import {
  Coins,
  Refrigerator,
  ShoppingBasket,
  Sparkles,
  MessageCircle,
  ChefHat,
  Globe,
  Wand2,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

export default function AboutPage() {
  return (
    <div className="space-y-16">
      <PageHeader
        eyebrow="About"
        title="A student cooking assistant, not a recipe database."
        description="Privacy-respecting and runs in your browser. No accounts, no tracking, no servers. Your pantry and saved recipes live on your device."
        tone="emerald"
      />

      <ScrollReveal as="section">
        <SectionHeading
          eyebrow="Core features"
          title="Everything you get."
          description="Free to use. No login. Works offline once loaded."
          tone="amber"
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Step
            icon={<ChefHat size={20} />}
            tone="violet"
            title="AI Chef"
            description="Generate custom recipes from your pantry, budget, equipment, and cravings. Returns 4 options at once with real costs and macros."
            href="/ai-chef"
          />
          <Step
            icon={<Refrigerator size={20} />}
            tone="emerald"
            title="Pantry-to-Plate"
            description="Add what's in your kitchen — by typing, paste, voice, or a fridge photo. See what you can make now or with 1–2 items."
            href="/pantry"
          />
          <Step
            icon={<Coins size={20} />}
            tone="amber"
            title="Cheap Recipe Coach"
            description="Set a budget per serving and filter by equipment, diet, time, and cuisine. Ranks by cost, time, and protein."
            href="/cheap-recipes"
          />
          <Step
            icon={<Globe size={20} />}
            tone="sky"
            title="Explore world recipes"
            description="Browse 60+ global cuisines via TheMealDB, Spoonacular, or Edamam — with a fallback so it always works."
            href="/explore"
          />
          <Step
            icon={<ShoppingBasket size={20} />}
            tone="sky"
            title="Smart grocery list"
            description="Missing ingredients grouped by category with regional cost estimates. Smart-buy hints unlock more recipes."
            href="/grocery-list"
          />
          <Step
            icon={<Wand2 size={20} />}
            tone="indigo"
            title="Recipe Studio"
            description="Build your own recipe cards or remix AI ones. Optional auto-generated food images."
            href="/recipe-studio"
          />
        </div>
      </ScrollReveal>

      <ScrollReveal
        as="section"
        className="rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 via-white to-stone-50 p-6 sm:p-10"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-emerald-600 text-white shadow-sm shadow-emerald-200">
            <MessageCircle size={22} />
          </div>
          <div className="flex-1">
            <SectionHeading
              eyebrow="Floating chat"
              title="Meet Pesto."
              description="Tap the green chat bubble bottom-right to ask Pesto anything — &lsquo;what can I make with eggs and tofu?&rsquo; or &lsquo;cheap high-protein dinner under $2&rsquo;. Knows every recipe, every ingredient cost, and the cheap swaps."
              tone="emerald"
            />
            <p className="mt-3 text-xs text-stone-500">
              Pesto&apos;s recipe picks run entirely in your browser. The
              optional LLM mode only kicks in when an API key is set.
            </p>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
        <SectionHeading
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={11} /> What&apos;s in the box
            </span>
          }
          title="The whole catalog."
          tone="violet"
        />
        <ul className="mt-5 grid gap-3 text-sm text-stone-700 sm:grid-cols-2">
          {[
            "235 seed recipes with real food photos",
            "255 ingredients with per-unit prices",
            "Cost-per-serving on every recipe card",
            "14 US regional pricing multipliers",
            "Per-ingredient nutrition from USDA data",
            "AI Chef (4 parallel options per request)",
            "Voice / paste / fridge-photo pantry input",
            "Smart-buy suggestions",
            "Use-soon flag to reduce food waste",
            "Air fryer / microwave / no-stove filters",
            "Guided cooking mode with smart timers",
            "Manual recipe builder + AI image gen",
          ].map((line) => (
            <li
              key={line}
              className="flex items-start gap-2 rounded-xl bg-stone-50 px-3 py-2"
            >
              <span
                aria-hidden
                className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-emerald-500"
              />
              {line}
            </li>
          ))}
        </ul>
      </ScrollReveal>

      <ScrollReveal
        as="section"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 to-stone-800 px-6 py-10 text-white sm:px-10 sm:py-14"
      >
        <div
          aria-hidden
          className="dot-grid pointer-events-none absolute inset-0 opacity-15 [mask-image:radial-gradient(circle_at_70%_30%,black,transparent_70%)]"
        />
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
            <Sparkles size={12} /> Cook tonight
          </p>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
            Ready to cook?
          </h2>
          <p className="mt-2 max-w-xl text-stone-300">
            Pick how you want to start — by budget, by what&apos;s already in
            your kitchen, or by what you&apos;re craving.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/ai-chef"
              className="group inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/40 hover:bg-emerald-400"
            >
              <ChefHat size={14} /> Start with AI Chef
              <ArrowRight
                size={14}
                className="transition-transform motion-safe:group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/pantry"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              <Refrigerator size={14} /> Build my pantry
            </Link>
            <Link
              href="/cheap-recipes"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              <Coins size={14} /> Find cheap meals
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}

function Step({
  icon,
  tone,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  tone: "emerald" | "violet" | "amber" | "sky" | "indigo" | "rose";
  title: string;
  description: string;
  href: string;
}) {
  const TONES: Record<string, string> = {
    emerald:
      "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white",
    violet:
      "bg-violet-100 text-violet-700 group-hover:bg-violet-600 group-hover:text-white",
    amber:
      "bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white",
    sky: "bg-sky-100 text-sky-700 group-hover:bg-sky-600 group-hover:text-white",
    indigo:
      "bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white",
    rose: "bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white",
  };
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-3xl border border-stone-200 bg-white p-5 transition-all motion-safe:hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
    >
      <div
        className={`grid h-11 w-11 place-items-center rounded-2xl transition-colors ${TONES[tone]}`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-stone-900 group-hover:text-emerald-700">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-stone-600">{description}</p>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
        Open
        <ArrowRight
          size={14}
          className="transition-transform motion-safe:group-hover:translate-x-1"
        />
      </span>
    </Link>
  );
}
