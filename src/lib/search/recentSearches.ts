const KEY = "srf:recent-searches";
const MAX_RECENTS = 8;

function safeRead<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export function getRecentSearches(): string[] {
  return safeRead<string[]>([]);
}

export function addRecentSearch(q: string) {
  const trimmed = q.trim();
  if (!trimmed) return;
  const list = getRecentSearches().filter(
    (r) => r.toLowerCase() !== trimmed.toLowerCase(),
  );
  list.unshift(trimmed);
  safeWrite(list.slice(0, MAX_RECENTS));
}

export function removeRecentSearch(q: string) {
  safeWrite(getRecentSearches().filter((r) => r !== q));
}

export function clearRecentSearches() {
  safeWrite([]);
}

export const TRENDING_SUGGESTIONS = [
  "Air fryer meals",
  "Microwave dinners",
  "Under $2",
  "High protein",
  "Rice bowls",
  "Meal prep",
  "Vegetarian",
  "Dorm-friendly",
];
