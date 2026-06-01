import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-stone-200 bg-white px-6 py-20 text-center">
      <div className="mb-3 text-6xl" aria-hidden>
        🍳
      </div>
      <h1 className="text-2xl font-bold text-stone-900">Recipe not found</h1>
      <p className="mt-2 max-w-md text-sm text-stone-600">
        That page or recipe doesn&apos;t exist. Head back to find your next meal.
      </p>
      <Link
        href="/"
        className="mt-5 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Back home
      </Link>
    </div>
  );
}
