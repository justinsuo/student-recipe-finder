import { useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Txt, Row, Press, IconButton, Field } from "~/components/ui";
import { colors, space, radius, accent } from "~/theme";
import { usePantry, useSaved } from "~/lib/stores/app";
import { ingredientLabel, getAnyView, getSeedRecipe, getCustom } from "~/lib/recipes";
import { isAiEnabled, pantryChat, type PantryChatTurn } from "@/lib/anthropic";
import { chatRespond } from "@/lib/chatbot";

interface Msg { role: "user" | "assistant"; content: string; recipeIds?: string[] }

function recipeContext(recipeId?: string, step?: string): string {
  if (!recipeId) return "";
  const seed = getSeedRecipe(recipeId);
  const custom = seed ? null : getCustom(recipeId);
  const name = seed?.name ?? custom?.name;
  if (!name) return "";
  const steps = seed?.steps ?? custom?.steps ?? [];
  const ings = seed ? seed.ingredients.map((ri) => ingredientLabel(ri.ingredientId)) : custom?.ingredients.map((i) => i.name) ?? [];
  let ctx = `\n\nThe user is cooking "${name}". Ingredients: ${ings.join(", ")}. `;
  if (step && steps[Number(step) - 1]) ctx += `They are on step ${step}: "${steps[Number(step) - 1]}". Answer their question about this recipe/step specifically.`;
  return ctx;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { recipe: recipeId, step } = useLocalSearchParams<{ recipe?: string; step?: string }>();
  const { pantry } = usePantry();
  const { saved } = useSaved();
  const scrollRef = useRef<ScrollView>(null);

  const view = recipeId ? getAnyView(decodeURIComponent(String(recipeId))) : undefined;
  const title = view ? `About ${view.name}` : "Ask AI Chef";

  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: view ? `Hi! Ask me anything about cooking **${view.name}** — substitutions, timing, "how do I know it's done?", whatever you need. 🧑‍🍳` : "Hey, I'm Pesto 🌿 — your cooking sidekick. Ask me what to cook with your pantry, for cheap high-protein ideas, or how to make a meal last." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const quickPrompts = view
    ? ["How do I know it's done?", "What can I substitute?", "Make it tastier", "Is this enough for 2?"]
    : ["What can I cook tonight?", "Cheap high-protein ideas", "Use my pantry", "Help me meal prep"];

  const pantryDesc = useMemo(() => pantry.map((p) => ingredientLabel(p.ingredientId)).join(", "), [pantry]);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || busy) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: msg }];
    setMessages(next);
    setBusy(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      if (isAiEnabled()) {
        const history: PantryChatTurn[] = next.map((m) => ({ role: m.role, content: m.content }));
        const reply = await pantryChat(pantryDesc + recipeContext(recipeId ? String(recipeId) : undefined, step ? String(step) : undefined), history);
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
      } else {
        const reply = chatRespond(msg, { pantry, savedRecipeIds: saved });
        setMessages((m) => [...m, { role: "assistant", content: reply.message, recipeIds: reply.recipeIds }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I had trouble answering just now. Try again in a moment." }]);
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Row justify="space-between" style={{ paddingHorizontal: space.lg, paddingVertical: space.sm }}>
        <Row gap={10}>
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: accent["ai-chef"].tint, alignItems: "center", justifyContent: "center" }}>
            <Txt style={{ fontSize: 20 }}>🌿</Txt>
          </View>
          <View><Txt variant="subheading">{title}</Txt><Txt variant="caption" muted>{isAiEnabled() ? "AI Chef" : "Pesto · offline helper"}</Txt></View>
        </Row>
        <IconButton icon="x" onPress={() => router.back()} bg={colors.surface} />
      </Row>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={insets.top + 50}>
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: space.lg, gap: space.md }} keyboardShouldPersistTaps="handled">
          {messages.map((m, idx) => (
            <View key={idx} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "86%" }}>
              <View style={{ backgroundColor: m.role === "user" ? colors.basil : colors.surface, borderWidth: m.role === "user" ? 0 : 1, borderColor: colors.border, borderRadius: radius.lg, padding: 12 }}>
                <Txt variant="body" color={m.role === "user" ? "#fff" : colors.text}>{m.content}</Txt>
              </View>
              {m.recipeIds?.length ? (
                <Row gap={6} wrap style={{ marginTop: 6 }}>
                  {m.recipeIds.slice(0, 3).map((rid) => {
                    const v = getAnyView(rid);
                    return v ? (
                      <Press key={rid} onPress={() => router.push(`/recipe/${encodeURIComponent(rid)}`)} style={{ backgroundColor: colors.surfaceSoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: colors.border }}>
                        <Txt variant="caption" weight="700">{v.emoji} {v.name}</Txt>
                      </Press>
                    ) : null;
                  })}
                </Row>
              ) : null}
            </View>
          ))}
          {busy ? <Txt variant="caption" muted>Pesto is thinking…</Txt> : null}
        </ScrollView>

        {/* Quick prompts */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: space.lg, paddingBottom: 8 }} style={{ maxHeight: 48 }} keyboardShouldPersistTaps="handled">
          {quickPrompts.map((q) => (
            <Press key={q} onPress={() => send(q)} haptic="selection" style={{ backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9 }}>
              <Txt variant="caption" weight="600">{q}</Txt>
            </Press>
          ))}
        </ScrollView>

        {/* Input */}
        <Row gap={8} style={{ paddingHorizontal: space.lg, paddingBottom: insets.bottom + space.sm, paddingTop: space.sm }}>
          <View style={{ flex: 1 }}>
            <Field placeholder="Ask anything…" value={input} onChangeText={setInput} onSubmitEditing={() => send(input)} returnKeyType="send" />
          </View>
          <Press onPress={() => send(input)} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.basil, alignItems: "center", justifyContent: "center" }}>
            <Feather name="arrow-up" size={22} color="#fff" />
          </Press>
        </Row>
      </KeyboardAvoidingView>
    </View>
  );
}
