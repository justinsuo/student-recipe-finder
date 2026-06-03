/**
 * fetchRecipePhotos.ts
 *
 * Builds/updates src/data/recipePhotoMap.ts — a recipe-ID → stable-image-URL map.
 *
 * Sources tried in order for each missing recipe:
 *   1. Brave Image Search   — most accurate, 2,000 free/month
 *   2. Google Custom Search — 100 free/day (= 100 new recipes/day at scale)
 *   3. Wikimedia Commons    — free, no key, good for well-documented dishes
 *   4. TheMealDB            — free, no key, food-specific database
 *
 * Setup — add keys to .env.local (auto-loaded by this script):
 *   BRAVE_API_KEY=BSA...          # api.search.brave.com → free account → New Key
 *   GOOGLE_CSE_KEY=AIza...        # console.cloud.google.com → Custom Search API
 *   GOOGLE_CSE_ID=...             # cse.google.com → New Search Engine (search whole web)
 *
 * Run:
 *   npx tsx scripts/fetchRecipePhotos.ts          # fills missing only (default)
 *   npx tsx scripts/fetchRecipePhotos.ts --all    # rebuilds everything from scratch
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { GLOBAL_RECIPES } from "../src/data/globalRecipes/index";

// ── Load .env.local (same as Next.js does for local dev) ─────────────────────

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq === -1 || line.trimStart().startsWith("#")) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = val;
  }
}

const BRAVE_KEY   = process.env.BRAVE_API_KEY    ?? "";
const GOOGLE_KEY  = process.env.GOOGLE_CSE_KEY   ?? "";
const GOOGLE_CX   = process.env.GOOGLE_CSE_ID    ?? "";

const USER_AGENT  = "StudentRecipeFinder/1.0 (educational; https://github.com/justinsuo/student-recipe-finder)";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const MEALDB_API  = "https://www.themealdb.com/api/json/v1/1";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Load existing map ─────────────────────────────────────────────────────────

function loadExistingMap(): Record<string, string> {
  const path = "src/data/recipePhotoMap.ts";
  if (!existsSync(path)) return {};
  const src = readFileSync(path, "utf-8");
  const start = src.indexOf("{");
  const end   = src.lastIndexOf("}");
  if (start === -1 || end === -1) return {};
  try { return JSON.parse(src.slice(start, end + 1)); } catch { return {}; }
}

// ── URL quality check ─────────────────────────────────────────────────────────

const REJECT_URL = [
  ".svg", ".pdf", ".gif",
  "flag_of", "flag-of", "coat_of_arms", "locator_map", "location_map",
  "logo", "_logo", "emblem", "wikidata", "fileicon", "blank_map", "portrait",
  ".pdf/page", ".pdf.jpg",
];

// Domains that block hotlinking or use expiring auth tokens
const REJECT_DOMAINS = [
  "redditmedia.com",   // Reddit thumbnails — block cross-domain
  "redd.it",           // Reddit CDN — block cross-domain
  "preview.redd.it",
  "blogger.googleusercontent.com", // Blogger — auth tokens expire
  "fbcdn.net",         // Facebook CDN — block cross-domain
  "cdninstagram.com",  // Instagram — block cross-domain
  "pinimg.com",        // Pinterest — block cross-domain
  "twimg.com",         // Twitter/X media — block cross-domain
  "pbs.twimg.com",
];

const isGoodUrl = (url: string) => {
  if (!url.startsWith("http")) return false;
  if (REJECT_URL.some((p) => url.toLowerCase().includes(p))) return false;
  if (REJECT_DOMAINS.some((d) => url.includes(d))) return false;
  if (url.includes("authuser=")) return false; // Blogger auth tokens
  return true;
};

// ── Search query helpers ──────────────────────────────────────────────────────

/** Clean a dish title for web image search (Brave / Google). */
function webQuery(title: string): string {
  return title
    .replace(/\s*\([^)]*\)\s*/g, " ")   // drop parentheticals
    .replace(/\s+/g, " ")
    .trim();
}

/** Variants for Wikimedia file-namespace search. */
function wikimediaVariants(title: string, cuisine: string): string[] {
  const noParens = title.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  const short = noParens.replace(/\s+(with|and|in|on|over|from|topped|stuffed|served)\b.*$/i, "").trim();
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

/** Queries for TheMealDB — extract core dish name, handle hyphens. */
function mealdbQueries(title: string): string[] {
  const noParens = title.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  const out = new Set<string>();

  if (noParens.includes("-")) {
    const beforeHyphen = noParens.split("-")[0].trim()
      .replace(/^\w+\s(?=\S)/, "").trim();
    if (beforeHyphen.length > 2) out.add(beforeHyphen);
    const lastWord = beforeHyphen.split(" ").pop() ?? "";
    if (lastWord.length > 3) out.add(lastWord);
  }

  const stripped = noParens
    .replace(/\b(inspired|style|quick|budget|easy|simple|deconstructed|homemade|spiced|glazed|braised)\b/gi, " ")
    .replace(/-/g, " ")
    .replace(/\s+(bowl|rice|noodles?|soup)\s*$/i, "")
    .replace(/\s+/g, " ").trim();

  if (stripped.length > 2) out.add(stripped);
  const words = stripped.split(" ");
  if (words.length > 2) out.add(words.slice(0, 2).join(" "));
  if (words[0] && words[0].length > 3) out.add(words[0]);

  return [...out].filter((q) => q.length > 2).slice(0, 5);
}

// ── Source 1: Brave Image Search ──────────────────────────────────────────────

async function bravePhoto(title: string): Promise<string | null> {
  if (!BRAVE_KEY) return null;
  const q = `${webQuery(title)} food`;
  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(q)}&count=5&safesearch=strict`,
      { headers: { Accept: "application/json", "Accept-Encoding": "gzip", "X-Subscription-Token": BRAVE_KEY } },
    );
    if (res.status === 429) { await sleep(10_000); return bravePhoto(title); }
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as any;
    for (const r of (data.results ?? [])) {
      const url: string = r.properties?.url ?? r.thumbnail?.original ?? "";
      if (url && isGoodUrl(url)) return url;
    }
    return null;
  } catch { return null; }
}

// ── Source 2: Google Custom Search ────────────────────────────────────────────

async function googlePhoto(title: string): Promise<string | null> {
  if (!GOOGLE_KEY || !GOOGLE_CX) return null;
  const q = `${webQuery(title)} food`;
  try {
    const params = new URLSearchParams({
      key: GOOGLE_KEY, cx: GOOGLE_CX, q,
      searchType: "image", num: "3", safe: "active", imgType: "photo",
    });
    const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`,
      { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as any;
    for (const item of (data.items ?? [])) {
      const url: string = item.link ?? "";
      if (url && isGoodUrl(url)) return url;
    }
    return null;
  } catch { return null; }
}

// ── Source 3: Wikimedia Commons ───────────────────────────────────────────────

async function wikimediaPhoto(query: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query", generator: "search",
    gsrsearch: query, gsrnamespace: "6", gsrlimit: "8",
    prop: "imageinfo", iiprop: "url", iiurlwidth: "640", format: "json",
  });
  try {
    const res = await fetch(`${COMMONS_API}?${params}`, { headers: { "User-Agent": USER_AGENT } });
    if (res.status === 429) { await sleep(5_000); return wikimediaPhoto(query); }
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as any;
    for (const page of Object.values(data.query?.pages ?? {})) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = page as any;
      if (!isGoodUrl(p.title ?? "")) continue;
      const thumb: string = p.imageinfo?.[0]?.thumburl ?? "";
      if (thumb && isGoodUrl(thumb)) return thumb;
    }
    return null;
  } catch { return null; }
}

// ── Source 4: TheMealDB ───────────────────────────────────────────────────────

async function mealdbPhoto(title: string): Promise<string | null> {
  for (const q of mealdbQueries(title)) {
    try {
      const res = await fetch(`${MEALDB_API}/search.php?s=${encodeURIComponent(q)}`,
        { headers: { "User-Agent": USER_AGENT } });
      if (!res.ok) { await sleep(200); continue; }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (await res.json()) as any;
      const thumb: string = data.meals?.[0]?.strMealThumb ?? "";
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

  const sources: Record<string, boolean> = {
    brave:     !!BRAVE_KEY,
    google:    !!(GOOGLE_KEY && GOOGLE_CX),
    wikimedia: true,
    mealdb:    true,
  };

  console.log(`\n${rebuildAll ? "Rebuilding all" : "Filling missing"} — ${targets.length} recipes`);
  console.log(`Sources: ${Object.entries(sources).filter(([,v]) => v).map(([k]) => k).join(" → ")}\n`);

  const newEntries: Record<string, string> = {};
  const hits = { brave: 0, google: 0, wikimedia: 0, mealdb: 0 };

  for (let i = 0; i < targets.length; i++) {
    const { id, title, cuisine } = targets[i];
    const pct = `[${String(i + 1).padStart(3)}/${targets.length}]`;
    process.stdout.write(`${pct} ${title.slice(0, 48).padEnd(48)} `);

    let photo: string | null = null;
    let src = "";

    // 1. Brave
    if (!photo && BRAVE_KEY) {
      photo = await bravePhoto(title);
      if (photo) { src = "Brave "; hits.brave++; }
      await sleep(600);
    }

    // 2. Google
    if (!photo && GOOGLE_KEY && GOOGLE_CX) {
      photo = await googlePhoto(title);
      if (photo) { src = "Google"; hits.google++; }
      await sleep(300);
    }

    // 3. Wikimedia
    if (!photo) {
      for (const variant of wikimediaVariants(title, cuisine ?? "")) {
        photo = await wikimediaPhoto(variant);
        if (photo) break;
        await sleep(600);
      }
      if (photo) { src = "WM    "; hits.wikimedia++; }
    }

    // 4. TheMealDB
    if (!photo) {
      await sleep(600);
      photo = await mealdbPhoto(title);
      if (photo) { src = "DB    "; hits.mealdb++; }
    }

    if (photo) {
      newEntries[id] = photo;
      process.stdout.write(`${src} ✓\n`);
    } else {
      process.stdout.write(`         ✗\n`);
    }

    await sleep(300);
  }

  const merged = { ...existing, ...newEntries };
  const total  = Object.keys(merged).length;
  const pct    = Math.round((100 * total) / all.length);

  console.log(`\n────────────────────────────────────────────────────`);
  if (hits.brave)     console.log(`Brave hits     : ${hits.brave}`);
  if (hits.google)    console.log(`Google hits    : ${hits.google}`);
  if (hits.wikimedia) console.log(`Wikimedia hits : ${hits.wikimedia}`);
  if (hits.mealdb)    console.log(`TheMealDB hits : ${hits.mealdb}`);
  console.log(`Total coverage : ${total}/${all.length} (${pct}%)`);
  console.log(`────────────────────────────────────────────────────\n`);

  const ts = `// Auto-generated by scripts/fetchRecipePhotos.ts — do not edit manually.
// Regenerate:  npx tsx scripts/fetchRecipePhotos.ts
// Generated:   ${new Date().toISOString().slice(0, 10)}
// Coverage:    ${total}/${all.length} dish-specific photos (${pct}%)
export const RECIPE_PHOTO_MAP: Record<string, string> = ${JSON.stringify(merged, null, 2)};
`;
  writeFileSync("src/data/recipePhotoMap.ts", ts, "utf-8");
  console.log(`Wrote src/data/recipePhotoMap.ts`);
}

main().catch((err) => { console.error(err); process.exit(1); });
