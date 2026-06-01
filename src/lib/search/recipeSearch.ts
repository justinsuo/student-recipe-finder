import type { Recipe } from "@/lib/types";
import { INGREDIENT_MAP } from "@/data/ingredients";
import {
  expandAlias,
  normalize,
  tokenize,
} from "./searchNormalization";
import { isFuzzyMatch } from "./fuzzyMatch";

export type SearchScope = "all" | "names" | "ingredients" | "tags";

export interface RecipeSearchIndexItem {
  recipeId: string;
  title: string;
  normalizedTitle: string;
  description: string;
  normalizedDescription: string;
  ingredients: string[];
  normalizedIngredients: string[];
  tags: string[];
  equipment: string[];
  cuisineStyle?: string;
  mealType: string;
  searchableText: string;
  recipe: Recipe;
}

export interface MatchReason {
  field: "title" | "ingredient" | "tag" | "equipment" | "cuisine" | "description" | "mealType";
  value: string;
}

export interface SearchHit {
  item: RecipeSearchIndexItem;
  score: number;
  reasons: MatchReason[];
}

export function buildRecipeIndex(recipes: Recipe[]): RecipeSearchIndexItem[] {
  return recipes.map((r) => {
    const ingredients = r.ingredients
      .map((ri) => INGREDIENT_MAP.get(ri.ingredientId)?.name)
      .filter((n): n is string => !!n);
    const tags = r.tags ?? [];
    const equipment = r.equipment;
    const searchable = [
      r.name,
      r.description,
      r.cuisine ?? "",
      r.mealType,
      ...ingredients,
      ...tags,
      ...equipment,
    ]
      .filter(Boolean)
      .join(" ");
    return {
      recipeId: r.id,
      title: r.name,
      normalizedTitle: normalize(r.name),
      description: r.description,
      normalizedDescription: normalize(r.description),
      ingredients,
      normalizedIngredients: ingredients.map((i) => normalize(i)),
      tags,
      equipment,
      cuisineStyle: r.cuisine,
      mealType: r.mealType,
      searchableText: normalize(searchable),
      recipe: r,
    };
  });
}

interface SearchOptions {
  scope?: SearchScope;
  pantryBoostIds?: Set<string>;
}


export function searchRecipes(
  query: string,
  index: RecipeSearchIndexItem[],
  options: SearchOptions = {},
): SearchHit[] {
  const scope = options.scope ?? "all";
  const rawQuery = query.trim();
  if (!rawQuery) return [];

  const normalizedQuery = normalize(rawQuery);
  const tokens = tokenize(rawQuery);
  if (tokens.length === 0) return [];

  const hits: SearchHit[] = [];

  for (const item of index) {
    let score = 0;
    const reasons: MatchReason[] = [];
    let allTokensFound = true;

    // ---- per-token contributions ----
    for (const token of tokens) {
      const exp = normalize(expandAlias(token));
      const searchTerms = [token, exp].filter((v, i, arr) => arr.indexOf(v) === i);

      let tokenScore = 0;
      let tokenReason: MatchReason | null = null;

      for (const t of searchTerms) {
        if (scope === "names" || scope === "all") {
          if (item.normalizedTitle === t) {
            tokenScore = Math.max(tokenScore, 100);
            tokenReason = { field: "title", value: item.title };
          } else if (item.normalizedTitle.startsWith(t)) {
            tokenScore = Math.max(tokenScore, 80);
            tokenReason = { field: "title", value: item.title };
          } else if (item.normalizedTitle.includes(t)) {
            tokenScore = Math.max(tokenScore, 60);
            tokenReason = { field: "title", value: item.title };
          }
        }
        if (scope === "ingredients" || scope === "all") {
          for (const ing of item.normalizedIngredients) {
            if (ing === t) {
              tokenScore = Math.max(tokenScore, 55);
              tokenReason = {
                field: "ingredient",
                value: item.ingredients[item.normalizedIngredients.indexOf(ing)],
              };
            } else if (ing.startsWith(t)) {
              tokenScore = Math.max(tokenScore, 45);
              tokenReason = {
                field: "ingredient",
                value: item.ingredients[item.normalizedIngredients.indexOf(ing)],
              };
            } else if (ing.includes(t)) {
              tokenScore = Math.max(tokenScore, 35);
              tokenReason = {
                field: "ingredient",
                value: item.ingredients[item.normalizedIngredients.indexOf(ing)],
              };
            }
          }
        }
        if (scope === "tags" || scope === "all") {
          for (const tag of item.tags) {
            const ntag = normalize(tag);
            if (ntag === t || ntag.startsWith(t)) {
              tokenScore = Math.max(tokenScore, 38);
              tokenReason = { field: "tag", value: tag };
            }
          }
          for (const eq of item.equipment) {
            if (normalize(eq).includes(t)) {
              tokenScore = Math.max(tokenScore, 28);
              tokenReason = { field: "equipment", value: eq };
            }
          }
        }
        if (scope === "all") {
          if (item.cuisineStyle && normalize(item.cuisineStyle).includes(t)) {
            tokenScore = Math.max(tokenScore, 22);
            tokenReason = { field: "cuisine", value: item.cuisineStyle };
          }
          if (item.mealType && normalize(item.mealType).includes(t)) {
            tokenScore = Math.max(tokenScore, 18);
            tokenReason = { field: "mealType", value: item.mealType };
          }
          if (item.normalizedDescription.includes(t)) {
            tokenScore = Math.max(tokenScore, 12);
            tokenReason = { field: "description", value: item.description };
          }
        }
      }

      // Fuzzy fallback if no exact hits and the token is long enough
      if (tokenScore === 0 && token.length >= 3) {
        if (isFuzzyMatch(token, item.normalizedTitle)) {
          tokenScore = 28;
          tokenReason = { field: "title", value: item.title };
        } else if (
          item.normalizedIngredients.some((i) => isFuzzyMatch(token, i))
        ) {
          tokenScore = 22;
          const i = item.normalizedIngredients.findIndex((x) =>
            isFuzzyMatch(token, x),
          );
          tokenReason = { field: "ingredient", value: item.ingredients[i] };
        }
      }

      if (tokenScore === 0) {
        allTokensFound = false;
        continue;
      }

      score += tokenScore;
      if (tokenReason) reasons.push(tokenReason);
    }

    // ---- bonuses ----
    // Exact full-phrase title match
    if (item.normalizedTitle === normalizedQuery) score += 40;
    // Phrase contained in title
    else if (item.normalizedTitle.includes(normalizedQuery)) score += 25;

    if (allTokensFound && tokens.length > 1) score += 15;

    // Pantry boost: if the recipe uses ingredients in the user's pantry
    if (options.pantryBoostIds && options.pantryBoostIds.size > 0) {
      let matches = 0;
      for (const ri of item.recipe.ingredients) {
        if (options.pantryBoostIds.has(ri.ingredientId)) matches++;
      }
      score += matches * 4;
    }

    if (score > 0) {
      // Deduplicate reasons by field+value
      const seen = new Set<string>();
      const uniqueReasons = reasons.filter((r) => {
        const key = r.field + "|" + r.value;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      hits.push({ item, score, reasons: uniqueReasons });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return hits;
}

/**
 * Used by autocomplete + "did you mean" — returns short string suggestions
 * (recipe names, ingredient names, tag names) ranked by closeness to query.
 */
export function suggestForQuery(
  query: string,
  index: RecipeSearchIndexItem[],
  maxPerKind = 5,
): {
  recipes: { value: string; recipeId: string }[];
  ingredients: string[];
  tags: string[];
} {
  const q = normalize(query);
  const qTokens = tokenize(query);
  if (!q || qTokens.length === 0) {
    return { recipes: [], ingredients: [], tags: [] };
  }

  const recipeMatches: { value: string; recipeId: string; score: number }[] = [];
  const ingredientSet = new Map<string, number>();
  const tagSet = new Map<string, number>();

  for (const item of index) {
    const title = item.normalizedTitle;
    if (title.includes(q)) {
      const score = title.startsWith(q) ? 100 : title === q ? 200 : 70;
      recipeMatches.push({ value: item.title, recipeId: item.recipeId, score });
    } else if (qTokens.every((t) => title.includes(t))) {
      recipeMatches.push({ value: item.title, recipeId: item.recipeId, score: 50 });
    }
    for (let i = 0; i < item.normalizedIngredients.length; i++) {
      const ing = item.normalizedIngredients[i];
      const display = item.ingredients[i];
      if (ing.includes(q)) {
        ingredientSet.set(
          display,
          Math.max(ingredientSet.get(display) ?? 0, ing.startsWith(q) ? 80 : 50),
        );
      } else if (qTokens.some((t) => ing.includes(t))) {
        ingredientSet.set(display, Math.max(ingredientSet.get(display) ?? 0, 30));
      }
    }
    for (const tag of item.tags) {
      const ntag = normalize(tag);
      if (ntag.includes(q)) {
        tagSet.set(tag, Math.max(tagSet.get(tag) ?? 0, ntag.startsWith(q) ? 80 : 40));
      }
    }
  }

  recipeMatches.sort((a, b) => b.score - a.score);
  const seenRecipe = new Set<string>();
  const recipes = recipeMatches
    .filter((r) => {
      const key = r.value;
      if (seenRecipe.has(key)) return false;
      seenRecipe.add(key);
      return true;
    })
    .slice(0, maxPerKind)
    .map((r) => ({ value: r.value, recipeId: r.recipeId }));

  const ingredients = Array.from(ingredientSet.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxPerKind)
    .map(([v]) => v);

  const tags = Array.from(tagSet.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxPerKind)
    .map(([v]) => v);

  return { recipes, ingredients, tags };
}
