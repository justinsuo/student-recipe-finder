/**
 * Recipe Studio hub — create a recipe with AI Chef or by hand, and manage the
 * user's own custom recipes (AI-generated + hand-built). Custom recipes live in
 * the shared `srf:custom-recipes` store; we read them reactively via useKVRaw so
 * the list re-renders the instant one is deleted.
 */
import React from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { Screen, ScreenHeader } from "~/components/Screen";
import {
  Txt,
  Row,
  Spacer,
  Card,
  Press,
  Button,
  Badge,
  EmptyState,
  SectionHeading,
} from "~/components/ui";
import { RecipeRow } from "~/components/RecipeCard";
import { toast } from "~/components/Toast";
import { tap } from "~/lib/haptics";
import { useKVRaw } from "~/lib/store";
import { allCustomViews, type RecipeView } from "~/lib/recipes";
import { deleteCustomRecipe } from "@/lib/customRecipeStorage";
import { colors, space, radius, accent, shadow, type AccentKey } from "~/theme";

function ActionCard({
  tone,
  icon,
  title,
  subtitle,
  onPress,
}: {
  tone: AccentKey;
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const a = accent[tone];
  return (
    <Press
      onPress={() => {
        tap();
        onPress();
      }}
      scaleTo={0.97}
      style={[
        {
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: space.lg,
          gap: 12,
        },
        shadow.sm,
      ]}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: a.tint,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={icon} size={24} color={a.shadow} />
      </View>
      <View style={{ gap: 4 }}>
        <Txt variant="subheading">{title}</Txt>
        <Txt variant="caption" muted numberOfLines={2}>
          {subtitle}
        </Txt>
      </View>
    </Press>
  );
}

function CustomRecipeRow({
  view,
  onDelete,
}: {
  view: RecipeView;
  onDelete: () => void;
}) {
  return (
    <Row gap={8} align="center">
      <View style={{ flex: 1 }}>
        <RecipeRow view={view} />
      </View>
      <Press
        haptic="none"
        onPress={onDelete}
        scaleTo={0.9}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.tomatoTint,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name="trash-2" size={18} color={colors.tomato} />
      </Press>
    </Row>
  );
}

export default function StudioHub() {
  // Re-read the custom-recipes store whenever it changes (e.g. after a delete).
  const raw = useKVRaw("srf:custom-recipes");
  const customs = React.useMemo<RecipeView[]>(
    () => allCustomViews(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [raw],
  );

  const aiCount = customs.filter((v) => v.source === "custom-ai").length;
  const userCount = customs.length - aiCount;

  function handleDelete(view: RecipeView) {
    tap();
    deleteCustomRecipe(view.id);
    toast(`Deleted "${view.name}"`, "info");
  }

  return (
    <Screen>
      <ScreenHeader
        title="Recipe Studio"
        subtitle="Cook up something of your own"
        back
      />

      <Row gap={space.md} align="stretch">
        <ActionCard
          tone="ai-chef"
          icon="zap"
          title="Create with AI Chef"
          subtitle="Generate a recipe from your pantry"
          onPress={() => router.push("/ai-chef")}
        />
        <ActionCard
          tone="saved"
          icon="edit"
          title="Build manually"
          subtitle="Write your own from scratch"
          onPress={() => router.push("/studio/new")}
        />
      </Row>

      <Spacer h={space.xxl} />

      <SectionHeading
        title="Your recipes"
        action={customs.length ? "New" : undefined}
        onAction={
          customs.length
            ? () => {
                tap();
                router.push("/studio/new");
              }
            : undefined
        }
      />

      {customs.length > 0 ? (
        <Row gap={6} wrap style={{ marginBottom: space.md }}>
          <Badge label={`${customs.length} total`} tone="pantry" icon="book-open" />
          {aiCount ? <Badge label={`${aiCount} AI`} tone="ai-chef" icon="zap" /> : null}
          {userCount ? (
            <Badge label={`${userCount} hand-built`} tone="saved" icon="edit-2" />
          ) : null}
        </Row>
      ) : null}

      {customs.length === 0 ? (
        <Card padded style={{ marginTop: space.sm }}>
          <EmptyState
            emoji="🍳"
            title="No recipes yet"
            subtitle="Generate one with AI Chef or build your own — they'll show up here, ready to cook and save."
            action={
              <Button
                title="Create with AI Chef"
                icon="zap"
                variant="accent"
                accentKey="ai-chef"
                onPress={() => router.push("/ai-chef")}
              />
            }
          />
        </Card>
      ) : (
        <View style={{ gap: space.sm }}>
          {customs.map((view) => (
            <CustomRecipeRow
              key={view.id}
              view={view}
              onDelete={() => handleDelete(view)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
