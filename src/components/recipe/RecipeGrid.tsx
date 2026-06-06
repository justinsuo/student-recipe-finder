"use client";

import { motion, type Variants } from "framer-motion";
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

// Staggered entrance — first row of cards reads almost instantly, then
// each subsequent card rolls in. The container drives the timing so a
// 6-card grid still fully appears in ~600 ms total.
const CONTAINER: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const ITEM: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

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
      <motion.div
        variants={CONTAINER}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {results.map((r) => (
          <motion.div key={r.recipe.id} variants={ITEM} className="h-full">
            <RecipeCard result={r} from={from} />
          </motion.div>
        ))}
      </motion.div>
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
    <motion.div
      variants={CONTAINER}
      initial="hidden"
      animate="show"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {recipes.map((r) => (
        <motion.div key={r.id} variants={ITEM} className="h-full">
          <RecipeCard recipe={r} from={from} />
        </motion.div>
      ))}
    </motion.div>
  );
}
