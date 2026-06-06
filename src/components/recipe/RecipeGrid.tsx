"use client";

import type { Recipe, RecipeScoreResult } from "@/lib/types";
import { RecipeCard } from "./RecipeCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface Props {
  results?: RecipeScoreResult[];
  recipes?: Recipe[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  /** Forwarded to RecipeCard so the detail page back-link returns here. */
  from?: string;
}

export function RecipeGrid({
  results,
  recipes,
  emptyTitle = "No recipes match",
  emptyDescription = "Try loosening a filter — a longer time limit or a slightly higher budget usually helps.",
  emptyAction,
  from,
}: Props) {
  if (results) {
    if (results.length === 0) {
      return (
        <EmptyState
          emoji="🍳"
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      );
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((r) => (
          <RecipeCard key={r.recipe.id} result={r} from={from} />
        ))}
      </div>
    );
  }
  if (!recipes || recipes.length === 0) {
    return (
      <EmptyState
        emoji="🍳"
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((r) => (
        <RecipeCard key={r.id} recipe={r} from={from} />
      ))}
    </div>
  );
}
