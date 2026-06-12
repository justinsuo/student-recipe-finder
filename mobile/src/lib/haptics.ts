/**
 * Haptics — thin wrapper over expo-haptics that respects the user's
 * `srf:haptics-enabled` preference (shared with the web app) and never throws
 * on devices/simulators without a Taptic Engine.
 */
import * as Haptics from "expo-haptics";
import { kv } from "@shared/platform/kv";

const HAPTICS_KEY = "srf:haptics-enabled";

export function hapticsEnabled(): boolean {
  try {
    const raw = kv().getItem(HAPTICS_KEY);
    if (raw == null) return true; // default on
    return JSON.parse(raw) !== false;
  } catch {
    return true;
  }
}

export function setHapticsEnabled(on: boolean): void {
  kv().setItem(HAPTICS_KEY, JSON.stringify(on));
}

export function tap(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light,
): void {
  if (!hapticsEnabled()) return;
  Haptics.impactAsync(style).catch(() => {});
}

export function selection(): void {
  if (!hapticsEnabled()) return;
  Haptics.selectionAsync().catch(() => {});
}

export function success(): void {
  if (!hapticsEnabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function warning(): void {
  if (!hapticsEnabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}

export const haptics = { tap, selection, success, warning, hapticsEnabled, setHapticsEnabled };
export default haptics;
