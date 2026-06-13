// Intermittent fasting log + active-fast state. Plain localStorage; the
// timer is computed on the client from startedAt + plan windowHours.

import { kv } from "@shared/platform/kv";

const ACTIVE_KEY = "srf:nourish-fasting-active";
const LOG_KEY = "srf:nourish-fasting-log";

export interface FastingPlan {
  id: string;
  label: string;
  fastingHours: number;
  eatingHours: number;
}

export const FASTING_PLANS: FastingPlan[] = [
  { id: "12-12", label: "12:12", fastingHours: 12, eatingHours: 12 },
  { id: "14-10", label: "14:10", fastingHours: 14, eatingHours: 10 },
  { id: "16-8", label: "16:8", fastingHours: 16, eatingHours: 8 },
  { id: "18-6", label: "18:6", fastingHours: 18, eatingHours: 6 },
];

export interface ActiveFast {
  planId: string;
  startedAt: string; // ISO
}

export interface FastEntry {
  id: string;
  planId: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  targetMs: number;
  completed: boolean;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = kv().getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    kv().setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function getActiveFast(): ActiveFast | null {
  return read<ActiveFast | null>(ACTIVE_KEY, null);
}

export function startFast(planId: string): ActiveFast {
  const active: ActiveFast = { planId, startedAt: new Date().toISOString() };
  write(ACTIVE_KEY, active);
  return active;
}

export function endFast(nowMs: number, newIdFn: () => string): FastEntry | null {
  const active = getActiveFast();
  if (!active) return null;
  const plan = FASTING_PLANS.find((p) => p.id === active.planId);
  const targetMs = (plan?.fastingHours ?? 16) * 3_600_000;
  const startedMs = Date.parse(active.startedAt);
  const durationMs = Math.max(0, nowMs - startedMs);
  const entry: FastEntry = {
    id: newIdFn(),
    planId: active.planId,
    startedAt: active.startedAt,
    endedAt: new Date(nowMs).toISOString(),
    durationMs,
    targetMs,
    completed: durationMs >= targetMs,
  };
  const log = getFastingLog();
  log.unshift(entry);
  write(LOG_KEY, log.slice(0, 60));
  write(ACTIVE_KEY, null);
  return entry;
}

export function getFastingLog(): FastEntry[] {
  return read<FastEntry[]>(LOG_KEY, []);
}
