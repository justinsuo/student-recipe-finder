/**
 * fetchRecipePhotos.ts
 *
 * Builds src/data/recipePhotoMap.ts — a recipe-ID → stable-image-URL map.
 *
 * Uses Wikimedia Commons generator API (search + imageinfo in ONE request per
 * recipe) so the total number of HTTP calls is minimal.  A proper User-Agent
 * header and 600 ms inter-request delay keep us inside Commons rate limits.
 *
 * Run:  npx tsx scripts/fetchRecipePhotos.ts
 * Time: ~9 minutes for ~860 recipes (1 API call × 600 ms per recipe)
 */

import { writeFileSync } from "fs";
import { GLOBAL_RECIPES } from "../src/data/globalRecipes/index";

// Wikimedia asks for a descriptive User-Agent — required to avoid 429 errors.
const USER_AGENT =
  "StudentRecipeFinder/1.0 (educational project; https://github.com/justinsuo/student-recipe-finder)";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const DELAY_MS = 600; // be well inside Wikimedia's anonymous rate limit
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Title variants ────────────────────────────────────────────────────────────

function queryVariants(title: string, cuisine: string): string[] {
  // Remove parenthetical sub-titles, e.g. "Ghormeh Sabzi (Persian Herb Stew)"
  const noParens = title.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  // Remove "with X", "and Y" tails
  const short = noParens
    .replace(/\s+(with|and|in|on|over|from|topped|stuffed|served)\b.*$/i, "")
    .trim();
  const words = noParens.split(" ");

  const seen = new Set<string>();
  const v: string[] = [];
  const add = (s: string) => { if (s && !seen.has(s)) { seen.add(s); v.push(s); } };

  add(noParens);                                          // "Crispy Scallion Pancakes"
  if (short !== noParens) add(short);                    // "Miso Soup" (before "with ...")
  if (words.length >= 4) add(words.slice(1).join(" ")); // drop first adjective
  if (words.length >= 3) add(words.slice(0, 2).join(" ")); // first 2 words
  if (cuisine) add(`${(short || noParens)} ${cuisine}`); // add cuisine name for ambiguous titles

  return v.slice(0, 3); // max 3 variants to limit total API calls
}

// ── Wikimedia Commons single-call search ─────────────────────────────────────

const REJECT = [
  "flag_of", "flag-of", "emblem", "coat_of_arms", "coat-of-arms",
  "logo", "_logo", "icon", "map_of", "locator_map", "location_map",
  "portrait", "blank_map", "wikidata", "wikimedia-logo",
  // PDF page thumbnails (.pdf/page or .pdf.jpg in the URL)
  ".pdf/page", ".pdf.jpg",
];

function looksLikeFood(title: string): boolean {
  const t = title.toLowerCase();
  return !REJECT.some((p) => t.includes(p));
}

function looksLikeFoodUrl(url: string): boolean {
  return !REJECT.some((p) => url.includes(p));
}

/**
 * One API call: search Commons File namespace for `query`, fetch imageinfo for
 * the top matches, return the first thumburl that looks like a real food photo.
 */
async function commonsPhoto(query: string): Promise<string | null> {
  const params = new URLSearchParams({
    action:       "query",
    generator:    "search",
    gsrsearch:    query,
    gsrnamespace: "6",        // File namespace
    gsrlimit:     "6",        // check up to 6 results
    prop:         "imageinfo",
    iiprop:       "url",
    iiurlwidth:   "640",
    format:       "json",
  });
  try {
    const res = await fetch(`${COMMONS_API}?${params}`, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (res.status === 429) {
      // Back off and retry once
      await sleep(5000);
      return commonsPhoto(query);
    }
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as any;
    const pages: Record<string, unknown> = data.query?.pages ?? {};
    for (const page of Object.values(pages)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = page as any;
      if (!looksLikeFood(p.title ?? "")) continue;
      const thumb: string | undefined = p.imageinfo?.[0]?.thumburl;
      if (thumb && looksLikeFoodUrl(thumb)) return thumb;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const targets = GLOBAL_RECIPES.filter((r) => r.image.includes("source.unsplash.com"));
  console.log(`\nFetching Wikimedia Commons photos for ${targets.length} recipes…\n`);

  const map: Record<string, string> = {};
  let found = 0;

  for (let i = 0; i < targets.length; i++) {
    const { id, title, cuisine } = targets[i];
    const pct = `[${String(i + 1).padStart(3)}/${targets.length}]`;
    process.stdout.write(`${pct} ${title.slice(0, 55).padEnd(55)} `);

    let photo: string | null = null;
    for (const variant of queryVariants(title, cuisine ?? "")) {
      photo = await commonsPhoto(variant);
      if (photo) break;
      await sleep(DELAY_MS);
    }

    if (photo) {
      map[id] = photo;
      found++;
      process.stdout.write("✓\n");
    } else {
      process.stdout.write("✗\n");
    }

    await sleep(DELAY_MS);
  }

  const pct = Math.round((100 * found) / targets.length);
  console.log(`\n────────────────────────────────────────────────────`);
  console.log(`Commons photos found  : ${found}/${targets.length} (${pct}%)`);
  console.log(`Falling back to pools : ${targets.length - found}/${targets.length}`);
  console.log(`────────────────────────────────────────────────────\n`);

  const ts = `// Auto-generated by scripts/fetchRecipePhotos.ts — do not edit manually.
// Regenerate:  npx tsx scripts/fetchRecipePhotos.ts
// Generated:   ${new Date().toISOString().slice(0, 10)}
// Coverage:    ${found}/${targets.length} dish-specific Wikimedia Commons photos (${pct}%)
export const RECIPE_PHOTO_MAP: Record<string, string> = ${JSON.stringify(map, null, 2)};
`;
  const outPath = "src/data/recipePhotoMap.ts";
  writeFileSync(outPath, ts, "utf-8");
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
