/** Saved — bookmarked recipes across the seed catalog, AI Chef, and your studio. */
import React, { useMemo, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { Screen, ScreenHeader } from "~/components/Screen";
import { Txt, Row, Spacer, EmptyState, Button, Badge, SegmentedControl } from "~/components/ui";
import { RecipeCard } from "~/components/RecipeCard";
import { useSaved } from "~/lib/stores/app";
import { getAnyView, type RecipeView, type RecipeSource } from "~/lib/recipes";
import { space } from "~/theme";
import { tap } from "~/lib/haptics";

type TabValue = "all" | "seed" | "custom-ai" | "custom-user";

const TABS: { label: string; value: TabValue }[] = [
  { label: "All", value: "all" },
  { label: "Database", value: "seed" },
  { label: "AI", value: "custom-ai" },
  { label: "Created", value: "custom-user" },
];

function matchesTab(source: RecipeSource, tab: TabValue): boolean {
  return tab === "all" || source === tab;
}

export default function SavedScreen() {
  const { saved } = useSaved();
  const [tab, setTab] = useState<TabValue>("all");
  const { width } = useWindowDimensions();

  // Two-column grid: subtract the Screen's horizontal padding (space.lg each
  // side) and the inter-card gap, then split in half.
  const gap = space.md;
  const cardWidth = Math.floor((width - space.lg * 2 - gap) / 2);

  // Resolve every saved id to a view, dropping any that no longer exist
  // (deleted custom recipes, stale ids). Keep newest-first.
  const views: RecipeView[] = useMemo(() => {
    const out: RecipeView[] = [];
    for (let i = saved.length - 1; i >= 0; i--) {
      const v = getAnyView(saved[i]);
      if (v) out.push(v);
    }
    return out;
  }, [saved]);

  const counts = useMemo(() => {
    const c = { all: views.length, seed: 0, "custom-ai": 0, "custom-user": 0 } as Record<TabValue, number>;
    for (const v of views) c[v.source]++;
    return c;
  }, [views]);

  const filtered = useMemo(
    () => views.filter((v) => matchesTab(v.source, tab)),
    [views, tab],
  );

  return (
    <Screen>
      <ScreenHeader
        title="Saved"
        subtitle={views.length === 1 ? "1 recipe bookmarked" : `${views.length} recipes bookmarked`}
        back
        right={
          views.length > 0 ? (
            <Badge label={String(views.length)} tone="saved" icon="bookmark" />
          ) : undefined
        }
      />

      {views.length === 0 ? (
        <EmptyState
          emoji="🔖"
          title="Nothing saved yet"
          subtitle="Tap the bookmark on any recipe to keep it here for later — across the catalog, AI Chef, and your own creations."
          action={
            <Button
              title="Browse cheap recipes"
              icon="dollar-sign"
              accentKey="cheap"
              variant="accent"
              onPress={() => {
                tap();
                router.push("/cheap");
              }}
            />
          }
        />
      ) : (
        <>
          <SegmentedControl<TabValue>
            options={TABS.map((t) => ({
              label: counts[t.value] > 0 ? `${t.label} ${counts[t.value]}` : t.label,
              value: t.value,
            }))}
            value={tab}
            onChange={(v) => {
              tap();
              setTab(v);
            }}
          />
          <Spacer h={space.lg} />

          {filtered.length === 0 ? (
            <EmptyState
              emoji="🍽️"
              title="None in this tab"
              subtitle="You haven't saved any recipes from this source yet. Try another tab."
            />
          ) : (
            <Row wrap gap={gap} align="flex-start" justify="space-between">
              {filtered.map((v) => (
                <View key={v.id} style={{ width: cardWidth, marginBottom: gap }}>
                  <RecipeCard view={v} width={cardWidth} />
                </View>
              ))}
              {/* Keep a trailing spacer so an odd last card stays left-aligned. */}
              {filtered.length % 2 === 1 ? <View style={{ width: cardWidth }} /> : null}
            </Row>
          )}
          <Spacer h={space.md} />
          <Txt variant="caption" muted center>
            {filtered.length === 1 ? "1 recipe" : `${filtered.length} recipes`} shown
          </Txt>
        </>
      )}
    </Screen>
  );
}
