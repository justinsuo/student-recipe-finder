// Skeleton recipe card with a shimmer pass. Used during initial search
// loads so the layout stays stable while results stream in.
export function SkeletonRecipeCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white motion-safe:animate-pulse">
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-200">
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent motion-safe:animate-[shimmer_1.8s_infinite]" />
      </div>
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 rounded bg-stone-200" />
        <div className="h-3 w-1/2 rounded bg-stone-200" />
        <div className="flex gap-1.5 pt-1">
          <div className="h-4 w-12 rounded-full bg-stone-200" />
          <div className="h-4 w-14 rounded-full bg-stone-200" />
        </div>
      </div>
    </div>
  );
}

/**
 * Match the production recipe grids (sm:2 lg:3) so skeletons don't reflow when
 * real results arrive.
 */
export function SkeletonRecipeGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRecipeCard key={i} />
      ))}
    </div>
  );
}
