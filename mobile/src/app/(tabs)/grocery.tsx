import { useMemo, useState } from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen } from "~/components/Screen";
import { Sheet } from "~/components/Sheet";
import { Txt, Row, Card, Button, Field, Press, Badge, IconButton, EmptyState, SectionHeading } from "~/components/ui";
import { toast } from "~/components/Toast";
import { celebrate } from "~/components/Celebration";
import { colors, space, radius, accent } from "~/theme";
import { useGrocery, usePantry, groceryItemName } from "~/lib/stores/app";
import { categoryLabel } from "~/lib/recipes";
import { tap, medium as hapticMedium } from "~/lib/haptics";
import { INGREDIENTS, INGREDIENT_MAP } from "@/data/ingredients";
import { quoteIngredient } from "@/lib/pricing/pricingEngine";

const CATEGORY_ORDER = ["protein", "vegetable", "fruit", "dairy", "grain", "canned", "frozen", "condiment", "spice", "snack", "other"];

function itemCost(id: string, qty: number): number {
  const q = quoteIngredient(id, qty || 1);
  return q?.totalCost ?? 0;
}

export default function GroceryScreen() {
  const { grocery, addStaple, toggleChecked, remove, clearChecked, clear } = useGrocery();
  const { pantry } = usePantry();
  const pantrySet = useMemo(() => new Set(pantry.map((p) => p.ingredientId)), [pantry]);
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const g: Record<string, typeof grocery> = {};
    for (const item of grocery) {
      const cat = INGREDIENT_MAP.get(item.ingredientId)?.category ?? "other";
      (g[cat] ||= []).push(item);
    }
    return g;
  }, [grocery]);

  const total = useMemo(() => grocery.filter((g) => !g.checked).reduce((s, g) => s + itemCost(g.ingredientId, g.quantity), 0), [grocery]);
  const checkedCount = grocery.filter((g) => g.checked).length;

  const searchMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const have = new Set(grocery.map((g) => g.ingredientId));
    return INGREDIENTS.filter((i) => i.name.toLowerCase().includes(q) && !have.has(i.id)).slice(0, 8);
  }, [query, grocery]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen contentStyle={{ paddingBottom: 150 }}>
        <Row justify="space-between" style={{ marginBottom: space.lg }}>
          <View><Txt variant="label">GROCERY LIST</Txt><Txt variant="title">{grocery.length - checkedCount} to buy</Txt></View>
          {grocery.length > 0 ? <IconButton icon="trash-2" onPress={() => { clear(); tap(); toast("List cleared", "info"); }} bg={colors.tomatoTint} color={colors.tomato} /> : null}
        </Row>

        {grocery.length === 0 ? (
          <EmptyState emoji="🛒" title="Your list is empty" subtitle="Add items, or tap “+ Grocery” on any recipe to add its missing ingredients."
            action={<Button title="Add an item" icon="plus" accentKey="grocery" variant="accent" onPress={() => setAddOpen(true)} />} />
        ) : (
          CATEGORY_ORDER.filter((c) => grouped[c]?.length).map((cat) => (
            <View key={cat} style={{ marginBottom: space.lg }}>
              <Txt variant="label" style={{ marginBottom: 8 }}>{categoryLabel(cat).toUpperCase()}</Txt>
              <Card padded={false} style={{ overflow: "hidden" }}>
                {grouped[cat].map((item, idx) => {
                  const cost = itemCost(item.ingredientId, item.quantity);
                  const inPantry = pantrySet.has(item.ingredientId);
                  return (
                    <Press key={item.ingredientId} haptic="none" onPress={() => {
                        const nowChecked = !item.checked;
                        toggleChecked(item.ingredientId);
                        if (nowChecked) {
                          hapticMedium();
                          // last item left → the whole list is done.
                          if (grocery.filter((g) => !g.checked).length === 1) celebrate("Grocery list done! 🛒");
                        } else { tap(); }
                      }}
                      style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: colors.border }}>
                      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: item.checked ? colors.basil : colors.borderSoft, backgroundColor: item.checked ? colors.basil : "transparent", alignItems: "center", justifyContent: "center" }}>
                        {item.checked ? <Feather name="check" size={15} color="#fff" /> : null}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Txt variant="body" style={item.checked ? { textDecorationLine: "line-through", color: colors.textFaint } : undefined}>{groceryItemName(item.ingredientId)}</Txt>
                        <Row gap={6}>
                          {item.recipeIds.length ? <Txt variant="caption" muted>for {item.recipeIds.length} recipe{item.recipeIds.length === 1 ? "" : "s"}</Txt> : null}
                          {inPantry ? <Badge label="in pantry" tone="pantry" /> : null}
                        </Row>
                      </View>
                      {cost > 0 ? <Txt variant="caption" weight="700" color={colors.basilShadow}>${cost.toFixed(2)}</Txt> : null}
                      <Press onPress={() => { remove(item.ingredientId); tap(); }}><Feather name="x" size={16} color={colors.textFaint} /></Press>
                    </Press>
                  );
                })}
              </Card>
            </View>
          ))
        )}

        {checkedCount > 0 ? (
          <Button title={`Clear ${checkedCount} completed`} icon="check-circle" variant="secondary" full onPress={() => { clearChecked(); toast("Cleared completed"); }} />
        ) : null}
      </Screen>

      {/* Sticky total + add */}
      {grocery.length > 0 ? (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: space.lg, paddingBottom: space.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Row justify="space-between">
            <View><Txt variant="caption" muted>Estimated total</Txt><Txt variant="title">${total.toFixed(2)}</Txt></View>
            <Button title="Add item" icon="plus" accentKey="grocery" variant="accent" onPress={() => setAddOpen(true)} />
          </Row>
        </View>
      ) : null}

      <Sheet visible={addOpen} onClose={() => { setAddOpen(false); setQuery(""); }} title="Add to grocery">
        <Field placeholder="Search ingredients…" value={query} onChangeText={setQuery} autoFocus />
        {searchMatches.map((i) => (
          <Press key={i.id} onPress={() => { addStaple(i.id); tap(); toast(`Added ${i.name}`); setQuery(""); }}
            style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Txt variant="body">{i.name}</Txt>
            <Feather name="plus-circle" size={20} color={accent.grocery.main} />
          </Press>
        ))}
      </Sheet>
    </View>
  );
}
