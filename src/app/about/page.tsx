import Link from "next/link";
import {
  Coins,
  Refrigerator,
  ShoppingBasket,
  Sparkles,
  Bookmark,
  MessageCircle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm font-medium text-emerald-700">About</p>
        <h1 className="mt-1 text-3xl font-bold text-stone-900 sm:text-4xl">
          How it works
        </h1>
        <p className="mt-2 max-w-2xl text-stone-600">
          Student Recipe Finder is a privacy-respecting MVP that helps you find
          cheap, practical meals. All data stays on your device — no accounts,
          no tracking, no servers.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Step
          icon={<Coins size={20} />}
          title="Cheap Recipe Coach"
          description="Set your budget per serving, pick what equipment you have (microwave, stove, rice cooker…), and we rank the most affordable recipes that match."
          href="/cheap-recipes"
        />
        <Step
          icon={<Refrigerator size={20} />}
          title="Pantry-to-Plate"
          description="Tell us what's in your kitchen. We show what you can make now, what you can make with 1–2 cheap items, and meals to use up expiring ingredients."
          href="/pantry"
        />
        <Step
          icon={<ShoppingBasket size={20} />}
          title="Smart grocery list"
          description="Missing ingredients get grouped by category with cost estimates. Smart-buy suggestions tell you which one cheap staple unlocks the most extra recipes."
          href="/grocery-list"
        />
        <Step
          icon={<Bookmark size={20} />}
          title="Save what you like"
          description="Bookmark recipes and they'll be on your Saved page across visits — stored locally in your browser."
          href="/saved"
        />
      </section>

      <Card>
        <div className="flex items-start gap-4">
          <div className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-emerald-100 text-emerald-700">
            <MessageCircle size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-stone-900">
              Meet Pesto, the in-app AI assistant
            </h2>
            <p className="mt-2 text-sm text-stone-700">
              Tap the green chat bubble in the corner to ask Pesto anything —
              like &ldquo;what can I make with eggs and tofu?&rdquo; or
              &ldquo;cheap high-protein dinner under $2&rdquo;. Pesto knows
              every recipe in this app, the costs of every ingredient, and the
              cheap swaps for each one. It uses your current pantry and saved
              recipes to give personalized answers.
            </p>
            <p className="mt-3 text-xs text-stone-500">
              Pesto runs entirely in your browser — no API calls, no data
              leaves your device.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-700">
          <Sparkles size={16} /> What&apos;s in the box
        </h2>
        <ul className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
          <li>• 20+ student-friendly recipes with real cost estimates</li>
          <li>• 50+ ingredients with per-unit prices</li>
          <li>• Cost-per-serving on every recipe card</li>
          <li>• Cheap swaps and &ldquo;make it healthier&rdquo; tips</li>
          <li>• Cooking mode with step-by-step + smart timer detection</li>
          <li>• Pantry &amp; grocery list that survive page reloads</li>
          <li>• Smart-buy suggestions (one cheap staple → many new recipes)</li>
          <li>• Mobile-first responsive UI with bottom nav</li>
        </ul>
      </Card>

      <section className="rounded-3xl bg-stone-900 px-6 py-8 text-white sm:px-10 sm:py-12">
        <h2 className="text-2xl font-semibold">Ready to cook?</h2>
        <p className="mt-2 max-w-xl text-stone-300">
          Pick how you want to start — by budget or by what&apos;s already in your
          kitchen.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/cheap-recipes"
            className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400"
          >
            Find cheap meals
          </Link>
          <Link
            href="/pantry"
            className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Pantry-to-Plate
          </Link>
        </div>
      </section>
    </div>
  );
}

function Step({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-stone-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-stone-900 group-hover:text-emerald-700">
        {title}
      </h3>
      <p className="mt-1 text-sm text-stone-600">{description}</p>
    </Link>
  );
}
