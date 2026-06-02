import Link from "next/link";
import { ArrowRight, ChefHat, Refrigerator, Coins } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative -mt-2 overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-br from-emerald-50/60 via-white to-amber-50/40 px-6 py-16 text-center sm:px-10 sm:py-24">
      <div
        aria-hidden
        className="dot-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(circle_at_50%_20%,black,transparent_60%)]"
      />
      <div className="relative mx-auto max-w-xl space-y-5">
        <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 backdrop-blur motion-safe:animate-[fadeUp_500ms_ease-out_both]">
          404 — burnt the page
        </p>
        <div
          className="text-7xl motion-safe:animate-[emojiFloat_3s_ease-in-out_infinite] sm:text-8xl"
          aria-hidden
        >
          🍳
        </div>
        <h1 className="text-3xl font-bold text-stone-900 sm:text-4xl">
          Recipe not found.
        </h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-stone-600 sm:text-base">
          That page or recipe doesn&apos;t exist anymore. Head back and try a
          different way in.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-200 transition-all motion-safe:hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            Back home
            <ArrowRight
              size={14}
              className="transition-transform motion-safe:group-hover:translate-x-0.5"
            />
          </Link>
          <Link
            href="/ai-chef"
            className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50"
          >
            <ChefHat size={14} /> AI Chef
          </Link>
          <Link
            href="/pantry"
            className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50"
          >
            <Refrigerator size={14} /> Pantry
          </Link>
          <Link
            href="/cheap-recipes"
            className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50"
          >
            <Coins size={14} /> Cheap recipes
          </Link>
        </div>
      </div>
    </div>
  );
}
