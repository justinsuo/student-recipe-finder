/**
 * fetchRecipePhotos.ts
 *
 * Builds/updates src/data/recipePhotoMap.ts — a recipe-ID → stable-image-URL map.
 *
 * Sources tried in order for each recipe:
 *   1. Wikimedia Commons (food photo search, strict URL + title filtering)
 *   2. TheMealDB (free, no API key, food-specific database)
 *
 * By default only processes recipes NOT already in the current map (--missing-only
 * is the default). Pass --all to re-fetch every recipe from scratch.
 *
 * Run:  npx tsx scripts/fetchRecipePhotos.ts           # fills in missing only
 *       npx tsx scripts/fetchRecipePhotos.ts --all      # rebuilds everything
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { GLOBAL_RECIPES } from "../src/data/globalRecipes/index";

const USER_AGENT =
  "StudentRecipeFinder/1.0 (educational project; https://github.com/justinsuo/student-recipe-finder)";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const MEALDB_API  = "https://www.themealdb.com/api/json/v1/1";
const DELAY_MS = 600;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Load existing map ─────────────────────────────────────────────────────────

function loadExistingMap(): Record<string, string> {
  const path = "src/data/recipePhotoMap.ts";
  if (!existsSync(path)) return {};
  const src = readFileSync(path, "utf-8");
  // Extract the JSON object between the first { and last }
  const start = src.indexOf("{");
  const end   = src.lastIndexOf("}");
  if (start === -1 || end === -1) return {};
  try {
    return JSON.parse(src.slice(start, end + 1));
  } catch {
    return {};
  }
}

// ── Reject filters ────────────────────────────────────────────────────────────

const REJECT = [
  "flag_of", "flag-of", "emblem", "coat_of_arms", "coat-of-arms",
  "logo", "_logo", "icon", "map_of", "locator_map", "location_map",
  "portrait", "blank_map", "wikidata", "wikimedia-logo",
  ".pdf/page", ".pdf.jpg",
];

const isClean = (s: string) => !REJECT.some((p) => s.includes(p));

// ── Query variants ────────────────────────────────────────────────────────────

function queryVariants(title: string, cuisine: string): string[] {
  const noParens = title.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  const short = noParens
    .replace(/\s+(with|and|in|on|over|from|topped|stuffed|served)\b.*$/i, "")
    .trim();
  const words = noParens.split(" ");

  const seen = new Set<string>();
  const v: string[] = [];
  const add = (s: string) => { if (s && !seen.has(s)) { seen.add(s); v.push(s); } };

  add(noParens);
  if (short !== noParens) add(short);
  if (words.length >= 4) add(words.slice(1).join(" "));
  if (words.length >= 3) add(words.slice(0, 2).join(" "));
  if (cuisine) add(`${short || noParens} ${cuisine}`);

  return v.slice(0, 3);
}

// ── Source 1: Wikimedia Commons ───────────────────────────────────────────────

async function wikimediaPhoto(query: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query", generator: "search",
    gsrsearch: query, gsrnamespace: "6", gsrlimit: "8",
    prop: "imageinfo", iiprop: "url", iiurlwidth: "640",
    format: "json",
  });
  try {
    const res = await fetch(`${COMMONS_API}?${params}`, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (res.status === 429) { await sleep(5000); return wikimediaPhoto(query); }
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as any;
    const pages: Record<string, unknown> = data.query?.pages ?? {};
    for (const page of Object.values(pages)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = page as any;
      if (!isClean(p.title ?? "")) continue;
      const thumb: string | undefined = p.imageinfo?.[0]?.thumburl;
      if (thumb && isClean(thumb)) return thumb;
    }
    return null;
  } catch { return null; }
}

// ── Source 2: TheMealDB ───────────────────────────────────────────────────────

/**
 * Generates TheMealDB search queries from a dish title.
 * Handles patterns like "Pho-Inspired Noodle Bowl" → ["Pho", "Pho Soup"]
 * and "Quick Rendang-Spiced Chicken" → ["Rendang", "Rendang Chicken"].
 */
function mealdbQueries(title: string): string[] {
  const noParens = title.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  const out = new Set<string>();

  // If the title contains a hyphen, the word(s) BEFORE the hyphen are the core
  // dish name (e.g. "Pho-Inspired", "Rendang-Spiced", "Gua Bao-Inspired")
  if (noParens.includes("-")) {
    const beforeHyphen = noParens.split("-")[0].trim();
    // Strip a leading single-word modifier (Quick, Simple, Easy, …)
    const coreBeforeHyphen = beforeHyphen.replace(/^\w+\s(?=\S)/, "").trim();
    if (coreBeforeHyphen.length > 2) out.add(coreBeforeHyphen);
    // Also try the last word only (for "Quick Rendang" → "Rendang")
    const lastWord = coreBeforeHyphen.split(" ").pop() ?? "";
    if (lastWord.length > 3) out.add(lastWord);
  }

  // Strip modifier words and hyphens, then try the base form
  const stripped = noParens
    .replace(/\b(inspired|style|quick|budget|easy|simple|deconstructed|homemade|spiced|glazed|braised)\b/gi, " ")
    .replace(/-/g, " ")
    .replace(/\s+(bowl|rice|noodles?|soup)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (stripped.length > 2) out.add(stripped);
  const words = stripped.split(" ");
  if (words.length > 2) out.add(words.slice(0, 2).join(" "));
  if (words[0] && words[0].length > 3) out.add(words[0]);

  return [...out].filter((q) => q.length > 2).slice(0, 5);
}

async function mealdbPhoto(title: string): Promise<string | null> {
  for (const q of mealdbQueries(title)) {
    try {
      const res = await fetch(
        `${MEALDB_API}/search.php?s=${encodeURIComponent(q)}`,
        { headers: { "User-Agent": USER_AGENT } },
      );
      if (!res.ok) { await sleep(200); continue; }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (await res.json()) as any;
      const thumb = data.meals?.[0]?.strMealThumb as string | undefined;
      if (thumb) return thumb;
      await sleep(200);
    } catch { continue; }
  }
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const rebuildAll = process.argv.includes("--all");
  const existing   = rebuildAll ? {} : loadExistingMap();

  const all     = GLOBAL_RECIPES.filter((r) => r.image.includes("source.unsplash.com"));
  const targets = rebuildAll ? all : all.filter((r) => !existing[r.id]);

  console.log(`\n${rebuildAll ? "Rebuilding all" : "Filling missing"} — ${targets.length} recipes to process…\n`);

  const newEntries: Record<string, string> = {};
  let wikimediaHits = 0, mealdbHits = 0;

  for (let i = 0; i < targets.length; i++) {
    const { id, title, cuisine } = targets[i];
    const pct = `[${String(i + 1).padStart(3)}/${targets.length}]`;
    process.stdout.write(`${pct} ${title.slice(0, 52).padEnd(52)} `);

    // 1. Wikimedia Commons
    let photo: string | null = null;
    for (const variant of queryVariants(title, cuisine ?? "")) {
      photo = await wikimediaPhoto(variant);
      if (photo) break;
      await sleep(DELAY_MS);
    }
    if (photo) { wikimediaHits++; process.stdout.write("WM ✓\n"); }

    // 2. TheMealDB fallback
    if (!photo) {
      await sleep(DELAY_MS);
      photo = await mealdbPhoto(title);
      if (photo) { mealdbHits++; process.stdout.write("DB ✓\n"); }
    }

    if (photo) {
      newEntries[id] = photo;
    } else {
      process.stdout.write("   ✗\n");
    }

    await sleep(DELAY_MS);
  }

  // Merge: existing entries first, then new ones (new overwrite old if --all)
  const merged = { ...existing, ...newEntries };
  const total  = Object.keys(merged).length;
  const grand  = all.length;
  const pct    = Math.round((100 * total) / grand);

  console.log(`\n────────────────────────────────────────────────────`);
  console.log(`Wikimedia hits : ${wikimediaHits}`);
  console.log(`TheMealDB hits : ${mealdbHits}`);
  console.log(`Total coverage : ${total}/${grand} (${pct}%)`);
  console.log(`────────────────────────────────────────────────────\n`);

  const ts = `// Auto-generated by scripts/fetchRecipePhotos.ts — do not edit manually.
// Regenerate:  npx tsx scripts/fetchRecipePhotos.ts
// Generated:   ${new Date().toISOString().slice(0, 10)}
// Coverage:    ${total}/${grand} dish-specific photos (${pct}%)
export const RECIPE_PHOTO_MAP: Record<string, string> = ${JSON.stringify(merged, null, 2)};
`;
  writeFileSync("src/data/recipePhotoMap.ts", ts, "utf-8");
  console.log(`Wrote src/data/recipePhotoMap.ts`);
}

main().catch((err) => { console.error(err); process.exit(1); });
