/**
 * Explore World — browse the local global recipe catalog (ExternalRecipe[]).
 * Search + cuisine filter pills, a 2-col grid (capped, "Load more"), and a
 * Sheet for full details with "Add to grocery" + "Log to Nourish". External
 * recipes are not in /recipe/[id], so details live entirely in the Sheet.
 */
import React, { useMemo, useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { Screen, ScreenHeader } from "~/components/Screen";
import {
  Txt,
  Row,
  Card,
  Press,
  Button,
  Badge,
  Pill,
  Field,
  Divider,
  EmptyState,
  SectionHeading,
} from "~/components/ui";
import { Sheet } from "~/components/Sheet";
import { toast } from "~/components/Toast";
import { tap, selection, success } from "~/lib/haptics";
import { colors, space, radius, shadow } from "~/theme";
import { useGrocery } from "~/lib/stores/app";
import { logRecipeAsMeal } from "~/lib/actions";

import { GLOBAL_RECIPES } from "@/data/globalRecipes";
import { EXPLORE_RECIPES } from "@/data/exploreRecipes";
import { resolveRecipeImage, getCuisineGradient } from "@/lib/foodPhotos";
import type { ExternalRecipe } from "@/lib/externalTypes";

const PAGE = 30;

// A small set of friendly emoji per region so the gradient fallback never
// looks blank. Falls back to a globe.
const CUISINE_EMOJI: Record<string, string> = {
  Chinese: "🥡", Cantonese: "🥡", Sichuan: "🌶️", Taiwanese: "🧋",
  Japanese: "🍱", Korean: "🍲", Thai: "🍜", Vietnamese: "🍜",
  Filipino: "🍢", Indonesian: "🍛", Malaysian: "🍛", Indian: "🍛",
  "North Indian": "🍛", "South Indian": "🥥", Pakistani: "🍛",
  Persian: "🍚", Turkish: "🥙", Lebanese: "🧆", Moroccan: "🍲",
  Egyptian: "🫓", Ethiopian: "🫓", Nigerian: "🍲", "South African": "🍖",
  Italian: "🍝", French: "🥐", Spanish: "🥘", Greek: "🫒",
  Portuguese: "🐟", German: "🥨", British: "🫖", Mexican: "🌮",
  Peruvian: "🐟", Brazilian: "🍢", Argentine: "🥩", Cuban: "🍚",
  American: "🍔", Cajun: "🦐", Southern: "🍗", Hawaiian: "🍍",
  Australian: "🍤",
};

// getCuisineGradient() returns a CSS "linear-gradient(135deg, #aaa, #bbb)"
// string (built for the web). Pull the two hex stops out for expo-linear-gradient.
function gradientStops(cuisine: string): [string, string] {
  const css = getCuisineGradient(cuisine);
  const hexes = css.match(/#[0-9a-fA-F]{3,8}/g);
  if (hexes && hexes.length >= 2) return [hexes[0], hexes[1]];
  if (hexes && hexes.length === 1) return [hexes[0], hexes[0]];
  return [colors.basilSoft, colors.basil];
}

function emojiFor(cuisine: string): string {
  if (CUISINE_EMOJI[cuisine]) return CUISINE_EMOJI[cuisine];
  for (const key of Object.keys(CUISINE_EMOJI)) {
    if (cuisine.toLowerCase().includes(key.toLowerCase())) return CUISINE_EMOJI[key];
  }
  return "🌍";
}

function ingredientLine(i: ExternalRecipe["ingredients"][number]): string {
  const qty = [i.amount, i.unit].filter(Boolean).join(" ").trim();
  return qty ? `${qty} ${i.name}` : i.name;
}

function CardImage({ recipe, height }: { recipe: ExternalRecipe; height: number }) {
  const uri = resolveRecipeImage(recipe);
  const stops = gradientStops(recipe.cuisine);
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: "100%", height, backgroundColor: stops[0] }}
        contentFit="cover"
        transition={200}
      />
    );
  }
  return (
    <LinearGradient
      colors={stops}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: "100%", height, alignItems: "center", justifyContent: "center" }}
    >
      <Txt style={{ fontSize: height * 0.34 }}>{emojiFor(recipe.cuisine)}</Txt>
    </LinearGradient>
  );
}

function GridCard({ recipe, onOpen, width }: { recipe: ExternalRecipe; onOpen: () => void; width: number }) {
  return (
    <Press onPress={onOpen} scaleTo={0.97} style={[styles.card, { width }]}>
      <View style={styles.imageWrap}>
        <CardImage recipe={recipe} height={108} />
        <View style={styles.cuisineBadge}>
          <Txt variant="caption" color="#fff" weight="700" numberOfLines={1}>
            {recipe.cuisine}
          </Txt>
        </View>
      </View>
      <View style={{ padding: space.sm, gap: 6 }}>
        <Txt variant="subheading" numberOfLines={2} style={{ minHeight: 38 }}>
          {recipe.title}
        </Txt>
        <Row gap={6} wrap>
          {recipe.totalTimeMinutes ? (
            <Badge label={`${recipe.totalTimeMinutes}m`} tone="nourish" icon="clock" />
          ) : null}
          {recipe.calories ? (
            <Badge label={`${Math.round(recipe.calories)} cal`} tone="cheap" icon="zap" />
          ) : null}
        </Row>
      </View>
    </Press>
  );
}

export default function ExploreScreen() {
  const { width } = useWindowDimensions();
  const grocery = useGrocery();

  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [active, setActive] = useState<ExternalRecipe | null>(null);

  // Merge both catalogs, de-duplicating by id (defensive — keeps the grid clean).
  const allRecipes = useMemo<ExternalRecipe[]>(() => {
    const seen = new Set<string>();
    const out: ExternalRecipe[] = [];
    for (const r of [...EXPLORE_RECIPES, ...GLOBAL_RECIPES]) {
      if (!r || seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(r);
    }
    return out;
  }, []);

  const cuisines = useMemo(() => {
    const set = new Set<string>();
    for (const r of allRecipes) if (r.cuisine) set.add(r.cuisine);
    return Array.from(set).sort();
  }, [allRecipes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRecipes.filter((r) => {
      if (cuisine && r.cuisine !== cuisine) return false;
      if (!q) return true;
      if (r.title.toLowerCase().includes(q)) return true;
      if (r.cuisine.toLowerCase().includes(q)) return true;
      if (r.tags?.some((t) => t.toLowerCase().includes(q))) return true;
      if (r.ingredients?.some((i) => i.name.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [allRecipes, query, cuisine]);

  const visible = filtered.slice(0, limit);
  const hasMore = filtered.length > visible.length;

  // 2-col grid math (Screen is padded with space.lg on each side).
  const gutter = space.md;
  const colW = (width - space.lg * 2 - gutter) / 2;

  function openRecipe(r: ExternalRecipe) {
    tap();
    setActive(r);
  }

  function pickCuisine(c: string | null) {
    selection();
    setCuisine(c);
    setLimit(PAGE);
  }

  function addToGrocery(r: ExternalRecipe) {
    const names = r.ingredients.map((i) => i.name).filter(Boolean);
    if (!names.length) {
      toast("No ingredients to add", "info");
      return;
    }
    grocery.addNames(names, r.id);
    success();
    toast(`Added ${names.length} items to grocery`, "success");
  }

  function logToNourish(r: ExternalRecipe) {
    const kcal = logRecipeAsMeal(r.title, {
      calories: r.calories || 0,
      protein: r.protein || 0,
      carbs: r.carbs || 0,
      fat: r.fat || 0,
    });
    success();
    toast(kcal ? `Logged ${kcal} cal to Nourish` : "Logged to Nourish", "reward");
  }

  return (
    <Screen>
      <ScreenHeader
        title="Explore World"
        subtitle={`${allRecipes.length} recipes from around the globe`}
        back
      />

      <Field
        label="Search dishes, cuisines, ingredients"
        placeholder="Try “noodles”, “Thai”, or “chickpea”…"
        value={query}
        onChangeText={(t) => {
          setQuery(t);
          setLimit(PAGE);
        }}
        autoCorrect={false}
        returnKeyType="search"
      />

      <View style={{ marginTop: space.md, marginHorizontal: -space.lg }}>
        <Row
          gap={space.sm}
          style={{ paddingHorizontal: space.lg, flexWrap: "wrap" }}
        >
          <Pill label="All" selected={cuisine === null} onPress={() => pickCuisine(null)} tone="explore" icon="globe" />
          {cuisines.map((c) => (
            <Pill
              key={c}
              label={c}
              selected={cuisine === c}
              onPress={() => pickCuisine(cuisine === c ? null : c)}
              tone="explore"
            />
          ))}
        </Row>
      </View>

      <View style={{ marginTop: space.lg }}>
        <SectionHeading
          title={cuisine ?? "All cuisines"}
          action={query.trim() || cuisine ? "Clear" : undefined}
          onAction={
            query.trim() || cuisine
              ? () => {
                  tap();
                  setQuery("");
                  setCuisine(null);
                  setLimit(PAGE);
                }
              : undefined
          }
        />
      </View>

      {visible.length === 0 ? (
        <EmptyState
          emoji="🌎"
          title="No dishes match"
          subtitle="Try a different cuisine or search term — there's a whole world to explore."
          action={
            query.trim() || cuisine ? (
              <Button
                title="Reset filters"
                variant="secondary"
                icon="refresh-ccw"
                onPress={() => {
                  tap();
                  setQuery("");
                  setCuisine(null);
                  setLimit(PAGE);
                }}
              />
            ) : undefined
          }
        />
      ) : (
        <>
          <View style={[styles.grid, { gap: gutter }]}>
            {visible.map((r) => (
              <GridCard key={r.id} recipe={r} width={colW} onOpen={() => openRecipe(r)} />
            ))}
          </View>

          {hasMore ? (
            <View style={{ marginTop: space.lg, alignItems: "center" }}>
              <Button
                title={`Load more (${filtered.length - visible.length} left)`}
                variant="secondary"
                icon="chevron-down"
                onPress={() => {
                  tap();
                  setLimit((l) => l + PAGE);
                }}
              />
            </View>
          ) : (
            <Txt variant="caption" muted center style={{ marginTop: space.lg }}>
              That's all {filtered.length} — happy cooking 👩‍🍳
            </Txt>
          )}
        </>
      )}

      <RecipeSheet
        recipe={active}
        onClose={() => setActive(null)}
        onAddGrocery={addToGrocery}
        onLog={logToNourish}
      />
    </Screen>
  );
}

function RecipeSheet({
  recipe,
  onClose,
  onAddGrocery,
  onLog,
}: {
  recipe: ExternalRecipe | null;
  onClose: () => void;
  onAddGrocery: (r: ExternalRecipe) => void;
  onLog: (r: ExternalRecipe) => void;
}) {
  // Keep the rendered recipe stable through the close animation.
  const [snapshot, setSnapshot] = useState<ExternalRecipe | null>(recipe);
  React.useEffect(() => {
    if (recipe) setSnapshot(recipe);
  }, [recipe]);

  const r = snapshot;

  return (
    <Sheet visible={!!recipe} onClose={onClose} title={r?.title} maxHeightPct={0.92}>
      {r ? (
        <View style={{ gap: space.md }}>
          <View style={styles.sheetHero}>
            <CardImage recipe={r} height={170} />
          </View>

          <Row gap={6} wrap>
            <Badge label={r.cuisine} tone="explore" icon="globe" solid />
            {r.totalTimeMinutes ? <Badge label={`${r.totalTimeMinutes} min`} tone="nourish" icon="clock" /> : null}
            {r.difficulty ? <Badge label={r.difficulty} tone="cheap" /> : null}
            {r.servings ? <Badge label={`${r.servings} servings`} tone="pantry" icon="users" /> : null}
          </Row>

          {(r.calories || r.protein || r.carbs || r.fat) ? (
            <Card soft padded>
              <Row justify="space-between">
                <Macro label="Calories" value={`${Math.round(r.calories || 0)}`} />
                <Macro label="Protein" value={`${Math.round(r.protein || 0)}g`} />
                <Macro label="Carbs" value={`${Math.round(r.carbs || 0)}g`} />
                <Macro label="Fat" value={`${Math.round(r.fat || 0)}g`} />
              </Row>
            </Card>
          ) : null}

          {r.culturalNote ? (
            <Txt variant="body" muted style={{ fontStyle: "italic" }}>
              {r.culturalNote}
            </Txt>
          ) : null}

          <Divider />

          <Txt variant="subheading">Ingredients</Txt>
          {r.ingredients.length ? (
            <View style={{ gap: 8 }}>
              {r.ingredients.map((ing, idx) => (
                <Row key={`${ing.name}-${idx}`} gap={10} align="flex-start">
                  <Feather name="circle" size={7} color={colors.basil} style={{ marginTop: 7 }} />
                  <Txt variant="body" style={{ flex: 1 }}>{ingredientLine(ing)}</Txt>
                </Row>
              ))}
            </View>
          ) : (
            <Txt variant="body" muted>Ingredients not listed for this dish.</Txt>
          )}

          <Divider />

          <Txt variant="subheading">Instructions</Txt>
          {r.instructions.length ? (
            <View style={{ gap: space.md }}>
              {r.instructions.map((step, idx) => (
                <Row key={idx} gap={10} align="flex-start">
                  <View style={styles.stepNum}>
                    <Txt variant="caption" color="#fff" weight="800">{idx + 1}</Txt>
                  </View>
                  <Txt variant="body" style={{ flex: 1 }}>{step}</Txt>
                </Row>
              ))}
            </View>
          ) : (
            <Txt variant="body" muted>No steps provided — improvise with the ingredients above.</Txt>
          )}

          <View style={{ gap: space.sm, marginTop: space.sm }}>
            <Button
              title="Add to grocery"
              icon="shopping-cart"
              variant="accent"
              accentKey="grocery"
              full
              onPress={() => onAddGrocery(r)}
            />
            <Button
              title="Log to Nourish"
              icon="book-open"
              variant="accent"
              accentKey="nourish"
              full
              onPress={() => onLog(r)}
            />
          </View>
        </View>
      ) : null}
    </Sheet>
  );
}

function Macro({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: "center", gap: 2 }}>
      <Txt variant="subheading">{value}</Txt>
      <Txt variant="caption" muted>{label}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    marginTop: space.md,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadow.sm,
  },
  imageWrap: { position: "relative" },
  cuisineBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    maxWidth: "85%",
    backgroundColor: "rgba(36,26,18,0.78)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  sheetHero: {
    width: "100%",
    height: 170,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.basil,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
});
