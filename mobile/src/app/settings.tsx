import { useState } from "react";
import { Share, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen, ScreenHeader } from "~/components/Screen";
import { Txt, Row, Card, Button, Field, Press, Badge, Divider, Pill } from "~/components/ui";
import { toast } from "~/components/Toast";
import { colors, space, radius, accent } from "~/theme";
import { useSync } from "~/lib/stores/sync";
import { useKVRaw } from "~/lib/store";
import { kv } from "@shared/platform/kv";
import { SETTINGS_KEYS, applySavedConfig } from "~/lib/bootstrap";
import { config } from "@shared/platform/config";
import { aiMode } from "~/lib/ai";
import { hapticsEnabled, setHapticsEnabled, tap } from "~/lib/haptics";
import { listRegions, getLocation, setLocationManual } from "@/lib/pricing/locationStorage";

function saveSetting(key: string, value: string) {
  const v = value.trim();
  if (v) kv().setItem(key, v);
  else kv().removeItem(key);
  applySavedConfig();
}

export default function SettingsScreen() {
  const sync = useSync();
  useKVRaw(SETTINGS_KEYS.workerUrl);
  useKVRaw("srf:location");
  useKVRaw("srf:haptics-enabled");

  const [codeInput, setCodeInput] = useState("");
  const [workerUrl, setWorkerUrl] = useState(kv().getItem(SETTINGS_KEYS.workerUrl) ?? config().workerUrl);
  const [anthropic, setAnthropic] = useState(kv().getItem(SETTINGS_KEYS.anthropic) ?? "");
  const mode = aiMode();
  const region = getLocation();
  const haptics = hapticsEnabled();

  return (
    <Screen>
      <ScreenHeader title="Settings" back />

      <Txt variant="label" style={{ marginBottom: 8 }}>CROSS-DEVICE SYNC</Txt>
      <Card style={{ gap: 14 }}>
        <Row gap={10}>
          <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: accent.grocery.tint, alignItems: "center", justifyContent: "center" }}>
            <Feather name="refresh-cw" size={18} color={accent.grocery.shadow} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="subheading">Sync with the website</Txt>
            <Txt variant="caption" muted>Your pantry, recipes, grocery list & diary stay in sync everywhere.</Txt>
          </View>
        </Row>

        {sync.code ? (
          <>
            <View style={{ backgroundColor: colors.oat, borderRadius: radius.md, padding: space.md, alignItems: "center", gap: 4 }}>
              <Txt variant="caption" muted>YOUR SYNC CODE</Txt>
              <Txt variant="title" style={{ letterSpacing: 4 }}>{sync.code.toUpperCase()}</Txt>
            </View>
            <Txt variant="caption" muted center>
              Enter this code in Waivy on the website (Settings → Sync) or another device to link them.
            </Txt>
            <Row gap={10}>
              <Button title="Sync now" icon="refresh-cw" variant="secondary" size="sm" style={{ flex: 1 }}
                onPress={async () => { await sync.now(); toast("Synced"); }} />
              <Button title="Share code" icon="share" variant="secondary" size="sm" style={{ flex: 1 }}
                onPress={() => Share.share({ message: `My Waivy sync code: ${sync.code!.toUpperCase()}` })} />
            </Row>
            <Press onPress={() => { sync.unlink(); toast("Sync turned off", "info"); }} haptic="selection">
              <Txt variant="label" color={colors.tomato} center>Turn off sync</Txt>
            </Press>
            {sync.lastAt ? <Txt variant="caption" muted center>Last synced {new Date(sync.lastAt).toLocaleTimeString()}</Txt> : null}
          </>
        ) : (
          <>
            <Button title="Create a sync code" icon="plus" accentKey="grocery" variant="accent" full
              onPress={async () => {
                if (!config().workerUrl) { toast("Add your Worker URL below first", "error"); return; }
                await sync.create(); toast("Sync enabled 🎉", "reward");
              }} />
            <Row gap={8} align="center"><Divider style={{ flex: 1 }} /><Txt variant="caption" muted>or link an existing code</Txt><Divider style={{ flex: 1 }} /></Row>
            <Field placeholder="enter 8-character code" autoCapitalize="none" value={codeInput} onChangeText={setCodeInput} />
            <Button title="Link this device" variant="secondary" full
              onPress={async () => {
                const c = codeInput.trim().toLowerCase();
                if (c.length < 4) { toast("That code looks too short", "error"); return; }
                if (!config().workerUrl) { toast("Add your Worker URL below first", "error"); return; }
                await sync.link(c); toast("Linked & synced 🎉", "reward");
              }} />
          </>
        )}
      </Card>

      <Txt variant="label" style={{ marginTop: space.xl, marginBottom: 8 }}>AI & CONNECTION</Txt>
      <Card style={{ gap: 14 }}>
        <Row justify="space-between">
          <Txt variant="subheading">AI Chef status</Txt>
          {mode === "worker" ? <Badge label="Online (secure)" tone="pantry" icon="check-circle" />
            : mode === "haiku" ? <Badge label="Online (Haiku)" tone="ai-chef" icon="zap" />
            : <Badge label="Offline" tone="saved" icon="cloud-off" />}
        </Row>
        <Txt variant="caption" muted>
          Recipe generation runs through your Cloudflare Worker so the OpenAI key never touches the phone. Paste your Worker URL to enable AI Chef, pricing & image generation.
        </Txt>
        <Field label="Worker URL" placeholder="https://waivy-api.you.workers.dev" autoCapitalize="none" autoCorrect={false}
          value={workerUrl} onChangeText={setWorkerUrl} onEndEditing={() => { saveSetting(SETTINGS_KEYS.workerUrl, workerUrl); toast("Saved"); }} />
        <Field label="Anthropic key (optional, for fast on-device AI)" placeholder="sk-ant-…" autoCapitalize="none" autoCorrect={false} secureTextEntry
          value={anthropic} onChangeText={setAnthropic} onEndEditing={() => saveSetting(SETTINGS_KEYS.anthropic, anthropic)} />
      </Card>

      <Txt variant="label" style={{ marginTop: space.xl, marginBottom: 8 }}>REGION (PRICING)</Txt>
      <Card style={{ gap: 10 }}>
        <Txt variant="caption" muted>Adjusts cost-per-serving to your local grocery prices.</Txt>
        <Row gap={8} wrap>
          {listRegions().map((r) => (
            <Pill key={r.id} label={r.shortLabel ?? r.label} tone="cheap"
              selected={region.regionId === r.id}
              onPress={() => { setLocationManual(r.id); tap(); toast(`Prices set to ${r.shortLabel ?? r.label}`); }} />
          ))}
        </Row>
      </Card>

      <Txt variant="label" style={{ marginTop: space.xl, marginBottom: 8 }}>PREFERENCES</Txt>
      <Card>
        <Press onPress={() => { setHapticsEnabled(!haptics); tap(); }} style={{ paddingVertical: 4 }}>
          <Row justify="space-between">
            <Row gap={10}><Feather name="smartphone" size={18} color={colors.textMuted} /><Txt variant="body">Haptic feedback</Txt></Row>
            <View style={{ width: 46, height: 28, borderRadius: 14, backgroundColor: haptics ? colors.basil : colors.borderSoft, justifyContent: "center", padding: 3 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff", alignSelf: haptics ? "flex-end" : "flex-start" }} />
            </View>
          </Row>
        </Press>
      </Card>

      <Txt variant="caption" muted center style={{ marginTop: space.xxl }}>Waivy for iPhone · v1.0</Txt>
    </Screen>
  );
}
