/**
 * Resolves broken `source.unsplash.com` recipe images to stable Unsplash photo IDs.
 *
 * All global recipe files use the deprecated source.unsplash.com dynamic-search
 * endpoint. This module replaces those URLs at render time with curated, stable
 * Unsplash photo IDs selected per cuisine and deterministically varied per recipe
 * so different dishes in the same cuisine don't all look identical.
 */

import type { ExternalRecipe } from "@/lib/externalTypes";

const PARAMS = "?w=640&h=427&fit=crop&q=80";
const u = (id: string) => `https://images.unsplash.com/photo-${id}${PARAMS}`;
const pick = (ids: readonly string[], seed: string): string => {
  const n = seed.split("").reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0);
  return u(ids[Math.abs(n) % ids.length]);
};

// ── Photo pools by food category ──────────────────────────────────────────────
// Multiple IDs per category → deterministic variety across recipes

const P = {
  chinese:       ["Q8mC8_tX6Jc","wEBg_pYtynw","rAyCBQTH7ws","LO7rNP0LRro","WeebpKNxjcs","D-vDQMTfAAU","H5Hj8QV2Tx4"],
  japanese:      ["8maP_icS3Qs","6uTQmtqcAzs","G675o-lxbnQ","jfZfdQtcH6k","kcPjFxsT6Xw","NVX55qVyEkE","iOHJKJqO6E0"],
  korean:        ["Zl-MT0iloZk","4f4YZfDMLeU","0u5jeQDvdoY","oXULSch338E","diDja86YL_M","M1M9PVArnlE","8hCcjf2BxTk"],
  thai:          ["QxYYXYFIZsA","VW0bzb90oMA","svIfPm6hrlc","_wBJ0cvKhIE","Ec3-1H0k3qY","NT5oqzp-050","7os_HJQ24ls"],
  vietnamese:    ["p-IipY8bxPg","nOG5RGMmEKk","rcHHKG01IPY","smv9xho-dnE","ZAmSDa3y4jw","JB_czvFkn4w","e8mxfGwDuHg"],
  indian:        ["T_vb0zXgZEU","UC0HZdUitWY","ZN-TT10kf4o","0j4bisyPo3M","Q9lxsv6bwK8","yCIcDyKm440","ND3edEmzcdQ"],
  curry:         ["JXUkZmmGxHg","Nihdo084Yos","uaHShoIDGeo","w-kqKbjUEyw","NPrWYa69Mz0","vA1L1jRTM70","dqVPEGkuR_U"],
  middleEastern: ["DkcuZwa1O50","1SPu0KT-Ejg","JB0Px6l3T3s","wLKiG0FGkkw","LU2U_p3JMdY","WVEBCZ2agBg","8xJ23hChGKE"],
  moroccan:      ["bpra6EoNr7Y","5t2SP3vQz28","q11NM0cFFzY","k2ZCm7LCj8E","w_lYK8iR2KI","4Tgjeh1fWCc","_V4v7BbG338"],
  african:       ["W1m0ddTe1VE","tSujMB65cXQ","r_UUezIShIw","kn_ANxnwCQ0","l-V5J8ZTwhs","QBdl-rG1_oU","BXTuoN37dHE"],
  mexican:       ["C74LxnNDL5w","lP5MCM6nZ5A","2M9-LTrpxJw","JCAPLVzdPw8","b2gdRynjL9Q","crw7JNiGEmY","zOlZgELBMRg"],
  latam:         ["l506hPvrOHU","TH6YmxEsv24","Y0zbn9lPCEU","vzX2rgUbQXM","B1tCyKT_Kmg","WJ5mej6mWi4","dzn37nOmki4"],
  european:      ["Eb3rm3C3ijc","PLyJqEJVre0","tEVisOXz26Y","Gi4njnD6isM","d9jcPTRD9fo","o1EDsUFmuXQ","AcIvcDe8JGA"],
  pasta:         ["PM-rtH089Rk","SJ7uORconic","L7POzOAoaQY","m5Ft3bsalhQ","Mzh95zPmOIM","FNrmJM-EVKU","nk_TmYfS24I"],
  noodles:       ["PM-rtH089Rk","T6vI65xwoNA","tF69PocWQoM","SJ7uORconic","v2z6Yhp_6Gc","aiikUGDouCY","Ny-JeYEmMpY"],
  soup:          ["3DHpZ5ITqos","xwZoArWs3Y0","lAibP0GwAmU","bogW-F3Vw24","kyw2jK0-cYA","V2lENObJZj4","--ZnV294AaQ"],
  rice:          ["HwdegDjntpk","xmuIgjuQG0M","zXNC_lBBVGE","FXdpfV9TBRs","38wMRaOFn4M","ysxmxPaeiIc","wGDGlVxEE20"],
  grilled:       ["t60fMkU_HBI","jeiqzOgwwKU","9Qs_9n2oSJo","Aqot8S_Keb8","cpkPJ-U9eUM","tAFWFWrWGyE","8GNkoWJTchc"],
  seafood:       ["nk2xos4sFRc","KRbF_wsztBE","wpvCV52ikW4","vvIrdGQI8xs","iIjZLcqB1s8","wCoPF7jviGg","_x6bBDr_PvM"],
  bread:         ["9pxEmvxBCiw","tOYiQxF9-Ys","qZ5lPCPvdXE","Ns2aJ5OXKds","hQgfgkazKjE","Zqh5l1JWs5M","I5G_suhoqBQ"],
  dessert:       ["oJieytWEUbU","QX814A1w3j4","surQ2mkZNxw","k7VgPnWFcx8","Ad3xgzSFKhQ","UAtbg1lfos8","Jh1el4l4_8g"],
  streetFood:    ["JCAPLVzdPw8","b2gdRynjL9Q","crw7JNiGEmY","a-kcJrx0ZN8","THWYaxfbX3Q","8DrHBSsC-A4","e3ozPgnBvJ4"],
  general:       ["rAyCBQTH7ws","T_vb0zXgZEU","3DHpZ5ITqos","t60fMkU_HBI","HwdegDjntpk","Q8mC8_tX6Jc","JXUkZmmGxHg"],
} as const;

type Category = keyof typeof P;

// ── Cuisine name → photo category ─────────────────────────────────────────────

const CUISINE_MAP: Record<string, Category> = {
  // East Asian
  chinese: "chinese", cantonese: "chinese", shanghainese: "chinese",
  sichuan: "chinese", taiwanese: "chinese",
  japanese: "japanese",
  korean: "korean",
  // Southeast Asian
  thai: "thai",
  vietnamese: "vietnamese",
  filipino: "vietnamese",
  indonesian: "thai",
  malaysian: "thai",
  singaporean: "chinese",
  burmese: "thai",
  cambodian: "vietnamese",
  laotian: "vietnamese",
  // South Asian
  indian: "indian", "north indian": "indian", "south indian": "curry",
  "sri lankan": "curry",
  nepali: "indian",
  bangladeshi: "indian",
  pakistani: "curry",
  // Middle East & Central Asia
  persian: "middleEastern",
  iranian: "middleEastern",
  iraqi: "middleEastern",
  emirati: "middleEastern",
  saudi: "middleEastern",
  yemeni: "middleEastern",
  omani: "middleEastern",
  kuwaiti: "middleEastern",
  egyptian: "moroccan",
  lebanese: "middleEastern",
  syrian: "middleEastern",
  turkish: "middleEastern",
  afghan: "middleEastern",
  uzbek: "middleEastern",
  azerbaijani: "middleEastern",
  israeli: "middleEastern",
  mongolian: "grilled",
  // African
  moroccan: "moroccan",
  ethiopian: "african",
  kenyan: "african",
  ghanaian: "african",
  senegalese: "african",
  tanzanian: "african",
  "south african": "grilled",
  nigerian: "african",
  algerian: "moroccan",
  // European
  italian: "european",
  french: "european",
  spanish: "european",
  greek: "european",
  portuguese: "european",
  hungarian: "european",
  austrian: "european",
  ukrainian: "european",
  british: "bread",
  irish: "bread",
  scandinavian: "european",
  polish: "soup",
  czech: "european",
  romanian: "european",
  bulgarian: "european",
  maltese: "european",
  // Americas
  mexican: "mexican",
  peruvian: "latam",
  colombian: "latam",
  argentine: "grilled",
  chilean: "latam",
  venezuelan: "latam",
  ecuadorian: "latam",
  bolivian: "latam",
  brazilian: "latam",
  trinidadian: "streetFood",
  jamaican: "latam",
  dominican: "latam",
  "puerto rican": "latam",
  cuban: "latam",
  american: "grilled",
  cajun: "soup",
  creole: "soup",
  southern: "grilled",
  hawaiian: "rice",
  canadian: "european",
  // Oceania
  australian: "grilled",
  "new zealand": "grilled",
  samoan: "seafood",
  fijian: "seafood",
  tongan: "seafood",
  "papua new guinean": "seafood",
  "cook islander": "seafood",
  palauan: "seafood",
};

// ── Keyword → category (matched against URL query + tags + title) ──────────

const KEYWORD_MAP: Array<[string, Category]> = [
  ["sushi", "japanese"], ["ramen", "japanese"], ["tempura", "japanese"], ["teriyaki", "japanese"],
  ["kimchi", "korean"], ["bibimbap", "korean"],
  ["pad thai", "thai"], ["tom yum", "thai"],
  ["pho", "vietnamese"], ["banh mi", "vietnamese"],
  ["biryani", "indian"], ["dosa", "indian"], ["naan", "indian"], ["tikka", "indian"],
  ["curry", "curry"], ["masala", "curry"], ["dal", "curry"], ["lentil", "curry"],
  ["tagine", "moroccan"], ["couscous", "moroccan"], ["harira", "moroccan"],
  ["hummus", "middleEastern"], ["falafel", "middleEastern"], ["kebab", "grilled"],
  ["shawarma", "middleEastern"], ["meze", "middleEastern"], ["tahini", "middleEastern"],
  ["injera", "african"], ["wot", "african"],
  ["mole", "mexican"], ["taco", "mexican"], ["enchilada", "mexican"], ["salsa", "mexican"],
  ["empanada", "latam"], ["arepa", "latam"], ["ceviche", "seafood"],
  ["pizza", "european"], ["risotto", "european"], ["bruschetta", "european"],
  ["pasta", "pasta"], ["spaghetti", "pasta"], ["gnocchi", "pasta"],
  ["noodle", "noodles"], ["ramen", "noodles"], ["pho", "noodles"], ["udon", "noodles"],
  ["soup", "soup"], ["stew", "soup"], ["broth", "soup"], ["chowder", "soup"],
  ["rice", "rice"], ["pilaf", "rice"], ["fried rice", "rice"],
  ["grilled", "grilled"], ["bbq", "grilled"], ["barbecue", "grilled"], ["roast", "grilled"],
  ["smoked", "grilled"], ["charcoal", "grilled"], ["spit", "grilled"],
  ["fish", "seafood"], ["seafood", "seafood"], ["shrimp", "seafood"], ["prawn", "seafood"],
  ["crab", "seafood"], ["lobster", "seafood"], ["mussel", "seafood"], ["oyster", "seafood"],
  ["bread", "bread"], ["flatbread", "bread"], ["naan", "bread"], ["roti", "bread"],
  ["bun", "bread"], ["pita", "bread"], ["tortilla", "bread"], ["dumpling", "chinese"],
  ["cake", "dessert"], ["dessert", "dessert"], ["sweet", "dessert"],
  ["chocolate", "dessert"], ["ice cream", "dessert"], ["pudding", "dessert"],
  ["cookie", "dessert"], ["donut", "dessert"], ["pastry", "bread"],
  ["street food", "streetFood"], ["snack", "streetFood"],
  ["egg", "general"], ["breakfast", "general"],
];

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns a stable, relevant Unsplash image URL for an ExternalRecipe.
 * If the recipe already has a non-source.unsplash.com URL, it is returned as-is.
 */
export function resolveRecipeImage(recipe: ExternalRecipe): string {
  const { image, id, cuisine } = recipe;

  // Already a stable URL — keep it
  if (!image.includes("source.unsplash.com")) return image;

  const seed = id;
  const cuisineLower = (cuisine ?? "").toLowerCase();

  // 1. Exact cuisine match
  const direct = CUISINE_MAP[cuisineLower];
  if (direct) return pick(P[direct], seed);

  // 2. Partial cuisine match (e.g. "North Indian", "West African")
  for (const [key, cat] of Object.entries(CUISINE_MAP)) {
    if (cuisineLower.includes(key) || key.includes(cuisineLower)) {
      return pick(P[cat], seed);
    }
  }

  // 3. Keyword match against URL query string + tags + title
  const queryStr = decodeURIComponent(image.split("?").pop() ?? "").toLowerCase();
  const tagStr   = (recipe.tags ?? []).join(" ").toLowerCase();
  const titleStr = (recipe.title ?? "").toLowerCase();
  const combined = `${cuisineLower} ${queryStr} ${tagStr} ${titleStr}`;

  for (const [kw, cat] of KEYWORD_MAP) {
    if (combined.includes(kw)) return pick(P[cat], seed);
  }

  // 4. Fallback
  return pick(P.general, seed);
}
