# Waivy mobile — UI API reference (for screen authors)

Build screens ONLY from these primitives so everything stays consistent. Pantry Pop theme: cream bg `#FFF8ED`, basil green primary, warm accents, rounded cards, 3D buttons, haptics, big touch targets, safe areas. Use Feather icons. Never hardcode hex except via the theme.

## Imports
```ts
import { Screen, ScreenHeader } from "~/components/Screen";
import { Txt, Row, Spacer, Divider, Card, Press, Button, IconButton, Badge, Pill, SegmentedControl, Field, EmptyState, SectionHeading } from "~/components/ui";
import { Sheet } from "~/components/Sheet";
import { ProgressRing, MacroBar, WeeklyBars } from "~/components/Charts";
import { RecipeCard, RecipeRow } from "~/components/RecipeCard";
import { toast } from "~/components/Toast";
import { tap, selection, success } from "~/lib/haptics";
import { colors, space, radius, accent, font, shadow, AccentKey } from "~/theme";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
```

## Theme
- `colors`: bg, surface, surfaceSoft, oat, border, borderSoft, text, textMuted, textFaint, basil, basilShadow, basilSoft, basilTint, carrot, carrotShadow, carrotTint, butter, tomato, tomatoTint, grape, grapeTint, grapeShadow, teal, tealTint, sky, skyTint, skyShadow, pink, pinkTint, scrim.
- `accent[key]` → `{ main, tint, shadow, on }`. keys: `ai-chef, pantry, nourish, grocery, cheap, saved, explore, protein, carbs, fat, fiber, water`.
- `space` {xs:4,sm:8,md:12,lg:16,xl:20,xxl:28,xxxl:40}; `radius` {sm:12,md:16,lg:20,xl:26,xxl:32,pill:999}.

## Components (props)
- `<Screen scroll padded onRefresh refreshing contentStyle>` — safe-area scroll view, cream bg, clears tab bar. Wrap every screen.
- `<ScreenHeader title subtitle back right />` — `back` shows a back chevron.
- `<Txt variant color muted center weight numberOfLines>` variant: display|title|heading|subheading|body|label|caption.
- `<Card padded soft elevation style>`; `<Press onPress haptic="light"|"selection"|"none" scaleTo style>`.
- `<Button title onPress variant="primary"|"secondary"|"ghost"|"danger"|"accent" size="sm"|"md"|"lg" icon accentKey loading full />` (icon is a Feather name).
- `<IconButton icon onPress color bg size iconSize />`.
- `<Badge label tone={AccentKey} icon solid />`; `<Pill label selected onPress tone icon />`.
- `<SegmentedControl options={[{label,value}]} value onChange />`.
- `<Field label placeholder value onChangeText multiline keyboardType ... />` (wraps TextInput).
- `<EmptyState emoji title subtitle action={<Button .../>} />`; `<SectionHeading title action onAction />`.
- `<Sheet visible onClose title scroll maxHeightPct>` — bottom sheet modal.
- `<ProgressRing size stroke progress color>{children}</ProgressRing>` (progress 0..1).
- `<MacroBar label value target color unit />`; `<WeeklyBars data={[{label,value}]} target color height />`.
- `<RecipeCard view={RecipeView} width? />`, `<RecipeRow view={RecipeView} />` — these already navigate to `/recipe/[id]` and handle save.
- `toast(message, "success"|"info"|"error"|"reward")`.

## Data + stores (mobile)
```ts
import { allSeedViews, seedToView, customToView, getSeedRecipe, getCustom, getAnyView, ingredientLabel, categoryLabel, accentForId, type RecipeView } from "~/lib/recipes";
import { usePantry, useSaved, useGrocery, groceryItemName } from "~/lib/stores/app";
import { useToday, useDiary, useTargets, useProfile, useRecentFoods, useWater, logFood, deleteEntry, saveTargets, nourish } from "~/lib/stores/nourish";
import { logRecipeAsMeal, mealSlotNow } from "~/lib/actions";
import { aiAvailable, aiMode, generateOptions, persistGenerated, generateAndStoreImage } from "~/lib/ai";
```
- `RecipeView` = { id, source, name, description, imageUri?, emoji, accent, costPerServing, totalTimeMinutes, nutrition:{calories,protein,carbs,fat,fiber?}, equipment, dietTags, servings, cuisine? }.
- `usePantry()` → { pantry, add, addMany, remove, toggleUseSoon, clear, has }.
- `useSaved()` → { saved (string[] ids), isSaved, toggleSaved }.
- `useGrocery()` → { grocery, addStaple, addRecipeMissing, addNames, toggleChecked, remove, clearChecked, clear }.
- `useToday()` → { today, entries, totals:{kcal,proteinG,carbG,fatG}, target:TargetSnapshot, water, remaining }.
- `nourish` is the shared `@/lib/nourish/storage` module: getDiaryForDate(date), addDiaryEntry, deleteDiaryEntry, getWeightLog, addWeightEntry(entry), getProteinStreak(targetProteinG), todayString(), dateToLocalString(Date), newId(), getCustomFoods, saveCustomFood, getProfile, setProfile, getTargets, setTargets, getRecentFoods, pushRecentFood.

## Shared web logic (import via `@/`)
- `@/lib/recipeScoring`: `rankCheapRecipes(filters: CheapFilters): RecipeScoreResult[]`, `rankPantryRecipes(pantry)`, `groupPantryResults(results, pantry)`, `calculateCostPerServing(recipe)`.
- `@/lib/types`: Recipe, CheapFilters {budgetPerServing, servings, equipment:Equipment[], diet:DietTag[], time:TimeBucket|"any", cuisine?, mealType?}, Equipment, DietTag.
- `@/data/recipes`: RECIPES (Recipe[]).
- `@/data/globalRecipes`: GLOBAL_RECIPES (ExternalRecipe[]); `@/data/exploreRecipes`: EXPLORE_RECIPES (ExternalRecipe[]).
- `@/lib/externalTypes`: ExternalRecipe {id, source, title, cuisine, image, totalTimeMinutes, servings, difficulty, diets, ingredients:[{name,amount,unit}], instructions:[], calories, protein, carbs, fat, estimatedCost?, ...}.
- `@/lib/foodPhotos`: `resolveRecipeImage(extRecipe): string|null`, `getCuisineGradient(cuisine): string`.
- `@/lib/nutritionEngine`: `calculateNutritionForFreeForm(items, servings)`, `matchIngredientByName(name)`.
- `@/lib/nourish/usdaClient`: USDA food search (read the file for the exact exported function name + shape; it falls back to DEMO_KEY and may be empty offline — always degrade gracefully to custom foods + a manual macro entry).
- `@/lib/nourish/types`: UserProfile, TargetSnapshot, FoodItem, DiaryEntry, WeightEntry, MealSlot, entryTotals(entry), sumTotals(entries).

## Rules
- One file per screen. Do NOT modify shared components, stores, theme, or other screens.
- Every screen is wrapped in `<Screen>`; secondary screens use `<ScreenHeader title back />`.
- Friendly empty states (never blank). Loading + error states. Haptics on key taps. 44px+ touch targets.
- Recipe cards navigate via `router.push('/recipe/' + encodeURIComponent(id))` (RecipeCard does this for you).
- If a web function's signature is uncertain, READ the source file under `/Users/justinsuo/waivy/src/...` before using it. Never invent APIs.
- Keep it offline-friendly: if AI/USDA isn't configured, show a graceful local fallback.
