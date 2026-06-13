/**
 * Cheap Recipes — ranks the shared catalog by cost-per-serving with budget,
 * equipment, diet, and cook-time filters. Cheapest matches first.
 */
import React, { useMemo, useState } from "react";
import { View, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Screen, ScreenHeader } from "~/components/Screen";
import { Txt, Row, Card, Pill, Button, EmptyState, Divider } from "~/components/ui";
import { RecipeRow } from "~/components/RecipeCard";
import { seedToView } from "~/lib/recipes";
import { tap } from "~/lib/haptics";
import { colors, space, radius, accent } from "~/theme";

import { rankCheapRecipes } from "@/lib/recipeScoring";
import type {
  CheapFilters,
  Equipment,
  DietTag,
  TimeBucket,
} from "@/lib/types";

// ── Filter option tables ─────────────────────────────────────────────────────

const ANY_BUDGET = 999;

const BUDGET_OPTIONS: { label: string; value: number }[] = [
  { label: "$3", value: 3 },
  { label: "$5", value: 5 },
  { label: "$8", value: 8 },
  { label: "$12", value: 12 },
  { label: "Any", value: ANY_BUDGET },
];

const EQUIPMENT_OPTIONS: { label: string; value: Equipment; icon: React.ComponentProps<typeof Feather>["name"] }[] = [
  { label: "No kitchen", value: "no-kitchen", icon: "x-circle" },
  { label: "Microwave", value: "microwave", icon: "square" },
  { label: "Stovetop", value: "stovetop", icon: "thermometer" },
  { label: "Oven", value: "oven", icon: "grid" },
  { label: "Rice cooker", value: "rice-cooker", icon: "circle" },
  { label: "Air fryer", value: "air-fryer", icon: "wind" },
];

const DIET_OPTIONS: { label: string; value: DietTag }[] = [
  { label: "Vegetarian", value: "vegetarian" },
  { label: "Vegan", value: "vegan" },
  { label: "High protein", value: "high-protein" },
  { label: "Gluten-free", value: "gluten-free" },
  { label: "Dairy-free", value: "dairy-free" },
];

const TIME_OPTIONS: { label: string; value: TimeBucket | "any" }[] = [
  { label: "Under 10m", value: "under-10" },
  { label: "Under 20m", value: "under-20" },
  { label: "Under 30m", value: "under-30" },
  { label: "Any time", value: "any" },
];

function money(n: number) {
  return `$${(n || 0).toFixed(2)}`;
}

// ── Filter group ─────────────────────────────────────────────────────────────

function FilterGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: space.sm }}>
      <Row gap={6}>
        <Feather name={icon} size={14} color={colors.textMuted} />
        <Txt variant="label">{title}</Txt>
      </Row>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: space.sm, paddingRight: space.sm }}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export default function CheapScreen() {
  const [budget, setBudget] = useState<number>(5);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [diet, setDiet] = useState<DietTag[]>([]);
  const [time, setTime] = useState<TimeBucket | "any">("any");

  const toggleEquipment = (v: Equipment) => {
    tap();
    setEquipment((prev) => (prev.includes(v) ? prev.filter((e) => e !== v) : [...prev, v]));
  };
  const toggleDiet = (v: DietTag) => {
    tap();
    setDiet((prev) => (prev.includes(v) ? prev.filter((d) => d !== v) : [...prev, v]));
  };

  const filtersActive =
    budget !== 5 || equipment.length > 0 || diet.length > 0 || time !== "any";

  const resetFilters = () => {
    tap();
    setBudget(5);
    setEquipment([]);
    setDiet([]);
    setTime("any");
  };

  const { results, error } = useMemo(() => {
    const filters: CheapFilters = {
      budgetPerServing: budget,
      servings: 1,
      equipment,
      diet,
      time,
    };
    try {
      return { results: rankCheapRecipes(filters), error: null as string | null };
    } catch (e) {
      return { results: [], error: "We couldn't rank recipes right now." };
    }
  }, [budget, equipment, diet, time]);

  const views = useMemo(() => results.map((r) => seedToView(r.recipe)), [results]);
  const cheapest = views.length > 0 ? views[0].costPerServing : 0;

  return (
    <Screen>
      <ScreenHeader
        title="Cheap Recipes"
        subtitle="Sorted cheapest first"
        back
        right={
          filtersActive ? (
            <Button title="Reset" variant="ghost" size="sm" icon="rotate-ccw" onPress={resetFilters} />
          ) : undefined
        }
      />

      {/* Filters */}
      <Card style={{ gap: space.lg, marginBottom: space.lg }}>
        <FilterGroup title="Budget / serving" icon="dollar-sign">
          {BUDGET_OPTIONS.map((o) => (
            <Pill
              key={o.label}
              label={o.label}
              tone="cheap"
              selected={budget === o.value}
              onPress={() => {
                tap();
                setBudget(o.value);
              }}
            />
          ))}
        </FilterGroup>

        <Divider />

        <FilterGroup title="Equipment" icon="tool">
          {EQUIPMENT_OPTIONS.map((o) => (
            <Pill
              key={o.value}
              label={o.label}
              icon={o.icon}
              tone="grocery"
              selected={equipment.includes(o.value)}
              onPress={() => toggleEquipment(o.value)}
            />
          ))}
        </FilterGroup>

        <Divider />

        <FilterGroup title="Diet" icon="heart">
          {DIET_OPTIONS.map((o) => (
            <Pill
              key={o.value}
              label={o.label}
              tone="pantry"
              selected={diet.includes(o.value)}
              onPress={() => toggleDiet(o.value)}
            />
          ))}
        </FilterGroup>

        <Divider />

        <FilterGroup title="Cook time" icon="clock">
          {TIME_OPTIONS.map((o) => (
            <Pill
              key={o.value}
              label={o.label}
              tone="nourish"
              selected={time === o.value}
              onPress={() => {
                tap();
                setTime(o.value);
              }}
            />
          ))}
        </FilterGroup>
      </Card>

      {/* Results summary */}
      {!error && views.length > 0 ? (
        <Row justify="space-between" style={{ marginBottom: space.md }}>
          <Txt variant="label">
            {views.length} {views.length === 1 ? "recipe" : "recipes"}
          </Txt>
          <Row gap={6}>
            <Feather name="trending-down" size={14} color={accent.cheap.shadow} />
            <Txt variant="caption" color={accent.cheap.shadow} weight="700">
              from {money(cheapest)}/serving
            </Txt>
          </Row>
        </Row>
      ) : null}

      {/* States */}
      {error ? (
        <EmptyState
          emoji="😖"
          title="Something went sideways"
          subtitle={error}
          action={<Button title="Try again" variant="secondary" icon="refresh-cw" onPress={resetFilters} />}
        />
      ) : views.length === 0 ? (
        <EmptyState
          emoji="🪙"
          title="No recipes this cheap yet"
          subtitle="Try nudging the budget up or clearing a filter — there's a tasty match in here somewhere."
          action={
            filtersActive ? (
              <Button title="Reset filters" variant="secondary" icon="rotate-ccw" onPress={resetFilters} />
            ) : undefined
          }
        />
      ) : (
        <View style={{ gap: space.sm }}>
          {views.map((view, i) => (
            <RecipeRow key={view.id ?? i} view={view} />
          ))}
        </View>
      )}
    </Screen>
  );
}
