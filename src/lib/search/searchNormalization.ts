/**
 * Query/text normalization for the smart recipe search.
 *
 * Goals:
 *  - Make "Apple Cider Vinegar" and "apple cider vinegar" match
 *  - Make "garbanzos" match "chickpeas"
 *  - Make "tomatoes" match "tomato"
 *  - Drop filler words ("the", "with", "and", "recipe")
 *  - Keep this purely string-based — no heavy NLP.
 */

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "with",
  "and",
  "or",
  "recipe",
  "recipes",
  "meal",
  "meals",
  "easy",
  "quick",
  "best",
  "some",
  "for",
  "of",
  "in",
  "on",
  "my",
  "your",
]);

// Single-direction map. Each key normalizes to the value.
const ALIAS_MAP: Record<string, string> = {
  acv: "apple cider vinegar",
  garbanzos: "chickpeas",
  "garbanzo beans": "chickpeas",
  scallions: "green onions",
  "green onion": "green onions",
  "spring onions": "green onions",
  cilantro: "coriander",
  aubergine: "eggplant",
  capsicum: "bell pepper",
  "bell peppers": "bell pepper",
  "confectioners sugar": "powdered sugar",
  "ramen noodles": "ramen",
  pb: "peanut butter",
  veg: "vegetables",
  veggies: "vegetables",
};

// Very small pluralization handling (the index also stores both forms so
// we don't need to be exhaustive here).
export function singularize(token: string): string {
  if (token.length <= 3) return token;
  if (token.endsWith("ies") && token.length > 4) return token.slice(0, -3) + "y";
  if (token.endsWith("oes")) return token.slice(0, -2); // tomatoes -> tomato
  if (token.endsWith("ses")) return token.slice(0, -2); // glasses -> glass
  if (token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

export function normalize(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFKD")
    // strip combining marks
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function expandAlias(text: string): string {
  const lower = text.toLowerCase().trim();
  if (ALIAS_MAP[lower]) return ALIAS_MAP[lower];
  // try without trailing s
  if (ALIAS_MAP[singularize(lower)]) return ALIAS_MAP[singularize(lower)];
  return text;
}

/**
 * Split a query into meaningful tokens. Drops stop words, applies alias
 * expansion across the full query first (so "ACV" → "apple cider vinegar"),
 * and singularizes each token.
 */
export function tokenize(query: string): string[] {
  if (!query) return [];
  // Alias-expand the entire query (handles multi-word aliases)
  let expanded = query;
  for (const [alias, canonical] of Object.entries(ALIAS_MAP)) {
    const re = new RegExp(`\\b${alias.replace(/\s+/g, "\\s+")}\\b`, "gi");
    expanded = expanded.replace(re, canonical);
  }
  const norm = normalize(expanded);
  const raw = norm.split(/\s+/).filter(Boolean);
  return raw
    .filter((t) => !STOP_WORDS.has(t))
    .map(singularize)
    .filter((t) => t.length >= 2);
}

/** Returns true if `target` contains `term` either as substring or as alias. */
export function termInText(term: string, normalizedText: string): boolean {
  if (!term) return false;
  if (normalizedText.includes(term)) return true;
  const expanded = expandAlias(term);
  if (expanded !== term && normalizedText.includes(normalize(expanded))) {
    return true;
  }
  return false;
}
