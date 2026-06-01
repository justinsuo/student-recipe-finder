"use client";

import { Microwave, Wind, Soup, Flame, Home, Timer } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Recipe } from "@/lib/types";
import {
  isAirFryerRecipe,
  isMicrowaveRecipe,
  isNoStoveRecipe,
} from "@/lib/equipmentFilters";

/**
 * Renders short equipment + cooking-method badges (Air fryer / Microwave /
 * No stove / Crispy / 5-min / Meal prep). Used on cards and detail pages.
 */
export function EquipmentBadges({ recipe }: { recipe: Recipe }) {
  const af = isAirFryerRecipe(recipe);
  const mw = isMicrowaveRecipe(recipe);
  const noStove = isNoStoveRecipe(recipe);
  const fast = recipe.totalTimeMinutes <= 10;

  return (
    <div className="flex flex-wrap gap-1.5">
      {af && (
        <Badge tone="violet" icon={<Wind size={11} />}>
          Air fryer
        </Badge>
      )}
      {mw && !af && (
        <Badge tone="sky" icon={<Microwave size={11} />}>
          Microwave
        </Badge>
      )}
      {af && mw && (
        <Badge tone="sky" icon={<Microwave size={11} />}>
          Microwave
        </Badge>
      )}
      {noStove && !af && !mw && (
        <Badge tone="emerald" icon={<Home size={11} />}>
          No stove
        </Badge>
      )}
      {noStove && (af || mw) && (
        <Badge tone="emerald" icon={<Home size={11} />}>
          No stove
        </Badge>
      )}
      {recipe.crispinessLevel === "crispy" || recipe.crispinessLevel === "extra crispy" ? (
        <Badge tone="orange" icon={<Flame size={11} />}>
          Crispy
        </Badge>
      ) : null}
      {fast && (
        <Badge tone="amber" icon={<Timer size={11} />}>
          {recipe.totalTimeMinutes} min
        </Badge>
      )}
      {recipe.mealPrepFriendly && (
        <Badge tone="green" icon={<Soup size={11} />}>
          Meal prep
        </Badge>
      )}
    </div>
  );
}
