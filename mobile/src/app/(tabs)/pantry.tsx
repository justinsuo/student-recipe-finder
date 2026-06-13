import { useMemo, useState } from "react";
import { View, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Screen } from "~/components/Screen";
import { Sheet } from "~/components/Sheet";
import { Txt, Row, Card, Button, Field, Press, Badge, IconButton, EmptyState, SectionHeading } from "~/components/ui";
import { toast } from "~/components/Toast";
import { colors, space, radius, accent } from "~/theme";
import { usePantry } from "~/lib/stores/app";
import { ingredientLabel, categoryLabel } from "~/lib/recipes";
import { parsePantryText, aiAvailable } from "~/lib/ai";
import { tap } from "~/lib/haptics";
import { INGREDIENTS, INGREDIENT_MAP, QUICK_ADD_STAPLES } from "@/data/ingredients";
import { PANTRY_PRESETS } from "@/data/pantryPresets";
import { matchIngredientByName } from "@/lib/nutritionEngine";
import { rankPantryCatalog } from "~/lib/catalog";
import { recognizeIngredientsFromImage } from "@/lib/anthropic";

const CATEGORY_ORDER = ["protein", "vegetable", "fruit", "dairy", "grain", "canned", "frozen", "condiment", "spice", "snack"];

export default function PantryScreen() {
  const { pantry, add, addMany, remove, toggleUseSoon, clear, has } = usePantry();
  const [addOpen, setAddOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [presetConfirm, setPresetConfirm] = useState<(typeof PANTRY_PRESETS)[number] | null>(null);
  const [query, setQuery] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [busy, setBusy] = useState(false);

  const grouped = useMemo(() => {
    const g: Record<string, typeof pantry> = {};
    for (const p of pantry) {
      const cat = INGREDIENT_MAP.get(p.ingredientId)?.category ?? "snack";
      (g[cat] ||= []).push(p);
    }
    return g;
  }, [pantry]);

  const readyCount = useMemo(() => {
    if (pantry.length === 0) return 0;
    return rankPantryCatalog(pantry).filter((r) => r.missingIngredients.length === 0).length;
  }, [pantry]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return INGREDIENTS.filter((i) => i.name.toLowerCase().includes(q) && !has(i.id)).slice(0, 8);
  }, [query, pantry]);

  async function handlePaste() {
    const text = pasteText.trim();
    if (!text) return;
    setBusy(true);
    let added = 0;
    const parsed = await parsePantryText(text);
    const ids: string[] = [];
    if (parsed && parsed.ingredients?.length) {
      for (const ing of parsed.ingredients) {
        const id = matchIngredientByName(ing.canonicalName || ing.displayName);
        if (id) ids.push(id);
      }
    } else {
      for (const raw of text.split(/[,\n]/)) {
        const id = matchIngredientByName(raw);
        if (id) ids.push(id);
      }
    }
    addMany(ids);
    added = ids.length;
    setBusy(false);
    setPasteText("");
    setPasteOpen(false);
    toast(added ? `Added ${added} item${added === 1 ? "" : "s"}` : "Couldn't match those — try typing them", added ? "success" : "info");
  }

  async function handlePhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { toast("Photo permission needed", "error"); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.6, mediaTypes: ["images"] });
    if (res.canceled || !res.assets?.[0]?.base64) return;
    if (!aiAvailable()) { toast("Add an AI key in Settings to scan photos", "error"); return; }
    setBusy(true);
    try {
      const out = await recognizeIngredientsFromImage(res.assets[0].base64, res.assets[0].mimeType ?? "image/jpeg");
      const ids: string[] = [];
      for (const d of out.recognized ?? []) {
        const id = INGREDIENT_MAP.has(d.id) ? d.id : matchIngredientByName(d.name);
        if (id) ids.push(id);
      }
      addMany(ids);
      toast(ids.length ? `Found ${ids.length} ingredient${ids.length === 1 ? "" : "s"}` : "No ingredients recognized", ids.length ? "success" : "info");
    } catch {
      toast("Couldn't read that photo", "error");
    } finally {
      setBusy(false);
      setAddOpen(false);
    }
  }

  return (
    <Screen>
      <Row justify="space-between" style={{ marginBottom: space.lg }}>
        <View>
          <Txt variant="label">YOUR PANTRY</Txt>
          <Txt variant="title">{pantry.length} ingredient{pantry.length === 1 ? "" : "s"}</Txt>
        </View>
        {pantry.length > 0 ? <IconButton icon="trash-2" onPress={() => { clear(); tap(); toast("Pantry cleared", "info"); }} bg={colors.tomatoTint} color={colors.tomato} /> : null}
      </Row>

      {readyCount > 0 ? (
        <Press onPress={() => router.push("/recipes")}>
          <Card soft style={{ marginBottom: space.lg }}>
            <Row justify="space-between">
              <Row gap={10}>
                <Feather name="check-circle" size={20} color={colors.basilShadow} />
                <Txt variant="body"><Txt weight="700">{readyCount} recipes</Txt> you can cook right now</Txt>
              </Row>
              <Feather name="chevron-right" size={18} color={colors.textFaint} />
            </Row>
          </Card>
        </Press>
      ) : null}

      <SectionHeading title="Quick add" />
      <Row gap={8} wrap style={{ marginBottom: space.lg }}>
        {QUICK_ADD_STAPLES.filter((id) => !has(id)).slice(0, 10).map((id) => (
          <Press key={id} haptic="selection" onPress={() => { add({ ingredientId: id }); toast(`Added ${ingredientLabel(id)}`); }}
            style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Feather name="plus" size={13} color={colors.basil} />
            <Txt variant="caption" weight="600">{ingredientLabel(id)}</Txt>
          </Press>
        ))}
      </Row>

      <SectionHeading title="Starter packs" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }} style={{ marginBottom: space.lg, marginHorizontal: -space.lg, paddingHorizontal: space.lg }}>
        {PANTRY_PRESETS.map((preset) => (
          <Press key={preset.id} onPress={() => setPresetConfirm(preset)} scaleTo={0.97}
            style={{ width: 150, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.md, gap: 6 }}>
            <Txt style={{ fontSize: 28 }}>{preset.emoji}</Txt>
            <Txt variant="subheading" numberOfLines={1}>{preset.name}</Txt>
            <Txt variant="caption" muted numberOfLines={2}>{preset.description}</Txt>
            <Badge label={`${preset.ingredientIds.length} items`} tone="pantry" />
          </Press>
        ))}
      </ScrollView>

      {pantry.length === 0 ? (
        <EmptyState emoji="🥫" title="Your pantry is empty" subtitle="Add what you already have, and Waivy will match recipes to it."
          action={<Button title="Add ingredients" icon="plus" accentKey="pantry" variant="accent" onPress={() => setAddOpen(true)} />} />
      ) : (
        CATEGORY_ORDER.filter((c) => grouped[c]?.length).map((cat) => (
          <View key={cat} style={{ marginBottom: space.lg }}>
            <Txt variant="label" style={{ marginBottom: 8 }}>{categoryLabel(cat).toUpperCase()}</Txt>
            <Row gap={8} wrap>
              {grouped[cat].map((p) => (
                <Press key={p.ingredientId} haptic="selection" onPress={() => toggleUseSoon(p.ingredientId)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: p.useSoon ? accent.cheap.tint : colors.surface, borderWidth: 1.5, borderColor: p.useSoon ? accent.cheap.main : colors.border, borderRadius: radius.pill, paddingLeft: 12, paddingRight: 6, paddingVertical: 7 }}>
                  {p.useSoon ? <Feather name="clock" size={12} color={accent.cheap.shadow} /> : null}
                  <Txt variant="caption" weight="600">{ingredientLabel(p.ingredientId)}</Txt>
                  <Press onPress={() => { remove(p.ingredientId); tap(); }} style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.oat, alignItems: "center", justifyContent: "center" }}>
                    <Feather name="x" size={12} color={colors.textMuted} />
                  </Press>
                </Press>
              ))}
            </Row>
          </View>
        ))
      )}
      {pantry.length > 0 ? <Txt variant="caption" muted>Tap an item to flag it "use soon" ⏱ · tap ✕ to remove.</Txt> : null}

      <Press onPress={() => setAddOpen(true)} haptic="light"
        style={{ position: "absolute", right: space.lg, bottom: 30, width: 58, height: 58, borderRadius: 29, backgroundColor: colors.basil, alignItems: "center", justifyContent: "center", shadowColor: colors.basilShadow, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}>
        <Feather name="plus" size={26} color="#fff" />
      </Press>

      <Sheet visible={addOpen} onClose={() => { setAddOpen(false); setQuery(""); }} title="Add to pantry">
        <Field placeholder="Search ingredients…" value={query} onChangeText={setQuery} autoFocus />
        {matches.map((i) => (
          <Press key={i.id} onPress={() => { add({ ingredientId: i.id }); tap(); toast(`Added ${i.name}`); setQuery(""); }}
            style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Txt variant="body">{i.name}</Txt>
            <Feather name="plus-circle" size={20} color={colors.basil} />
          </Press>
        ))}
        {query.length === 0 ? (
          <Row gap={10}>
            <Button title="Paste a list" icon="clipboard" variant="secondary" style={{ flex: 1 }} onPress={() => { setAddOpen(false); setPasteOpen(true); }} />
            <Button title="Scan a photo" icon="camera" variant="secondary" style={{ flex: 1 }} loading={busy} onPress={handlePhoto} />
          </Row>
        ) : null}
      </Sheet>

      <Sheet visible={pasteOpen} onClose={() => setPasteOpen(false)} title="Paste your ingredients">
        <Txt variant="caption" muted>e.g. "eggs, half a bag of frozen broccoli, old tortillas, soy sauce"</Txt>
        <Field placeholder="Type or paste a messy list…" value={pasteText} onChangeText={setPasteText} multiline style={{ minHeight: 110, textAlignVertical: "top" }} />
        <Button title={aiAvailable() ? "Smart add with AI" : "Add (offline matching)"} icon="zap" accentKey="pantry" variant="accent" full loading={busy} onPress={handlePaste} />
      </Sheet>

      <Sheet visible={!!presetConfirm} onClose={() => setPresetConfirm(null)} title={presetConfirm?.name} scroll={false}>
        {presetConfirm ? (
          <View style={{ gap: space.md }}>
            <Txt variant="body" muted>{presetConfirm.description}</Txt>
            <Txt variant="caption" muted>Adds {presetConfirm.ingredientIds.length} items: {presetConfirm.ingredientIds.slice(0, 8).map(ingredientLabel).join(", ")}…</Txt>
            <Button title={`Add ${presetConfirm.ingredientIds.length} items`} icon="check" accentKey="pantry" variant="accent" full
              onPress={() => { addMany(presetConfirm.ingredientIds); toast(`Loaded ${presetConfirm.name}`, "reward"); setPresetConfirm(null); }} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
