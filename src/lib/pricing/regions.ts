import type { PriceRegion } from "./locationTypes";

/**
 * Regional cost-of-living multipliers applied to the catalog base price.
 *
 * Multipliers are anchored to a national-average baseline of 1.00 and are
 * informed by BLS Consumer Expenditure Survey "Food at home" regional data
 * (urban high-cost areas trend ~+20%, low-cost rural ~-15%). We intentionally
 * use coarse buckets to avoid implying false precision.
 */
export const REGIONS: PriceRegion[] = [
  {
    id: "national",
    label: "US national average",
    shortLabel: "US avg",
    multiplier: 1.0,
    notes: "Default. Best when location is unknown.",
  },
  {
    id: "ny-metro",
    label: "NYC / Northeast metro",
    shortLabel: "NYC metro",
    multiplier: 1.22,
  },
  {
    id: "bay-area",
    label: "SF Bay Area",
    shortLabel: "Bay Area",
    multiplier: 1.25,
  },
  {
    id: "la-metro",
    label: "Los Angeles / Southern California",
    shortLabel: "LA metro",
    multiplier: 1.18,
  },
  {
    id: "seattle",
    label: "Seattle / Pacific Northwest urban",
    shortLabel: "Seattle",
    multiplier: 1.16,
  },
  {
    id: "boston",
    label: "Boston / New England urban",
    shortLabel: "Boston",
    multiplier: 1.17,
  },
  {
    id: "dc-metro",
    label: "DC / Mid-Atlantic urban",
    shortLabel: "DC metro",
    multiplier: 1.12,
  },
  {
    id: "chicago",
    label: "Chicago / Midwest urban",
    shortLabel: "Chicago",
    multiplier: 1.04,
  },
  {
    id: "texas-metro",
    label: "Texas urban (Austin / Dallas / Houston)",
    shortLabel: "Texas urban",
    multiplier: 1.0,
  },
  {
    id: "south-urban",
    label: "Southeast urban (Atlanta / Charlotte / Miami)",
    shortLabel: "SE urban",
    multiplier: 0.98,
  },
  {
    id: "midwest-suburban",
    label: "Midwest suburban / small-city",
    shortLabel: "Midwest",
    multiplier: 0.92,
  },
  {
    id: "rural",
    label: "Rural / low cost-of-living",
    shortLabel: "Rural",
    multiplier: 0.85,
  },
  {
    id: "hawaii",
    label: "Hawaii",
    multiplier: 1.42,
    notes: "Imported-good premium.",
  },
  {
    id: "alaska",
    label: "Alaska",
    multiplier: 1.32,
  },
];

export function getRegion(id: string): PriceRegion {
  return REGIONS.find((r) => r.id === id) ?? REGIONS[0];
}

/**
 * Light-touch ZIP → region mapping. We only check the first 3 digits and only
 * for areas where the multiplier is meaningfully off-baseline. Anything else
 * falls through to "national".
 */
export function zipToRegion(zip: string): string {
  const prefix = zip.trim().slice(0, 3);
  if (!/^\d{3}$/.test(prefix)) return "national";
  const n = parseInt(prefix, 10);

  // NYC / NJ / CT — 100–119
  if (n >= 100 && n <= 119) return "ny-metro";
  // Boston / RI / NH — 020–028
  if (n >= 20 && n <= 28) return "boston";
  // DC / MD / VA inner — 200–229
  if (n >= 200 && n <= 229) return "dc-metro";
  // South Florida & Atlanta — 300–349
  if (n >= 300 && n <= 349) return "south-urban";
  // Chicago — 600–608
  if (n >= 600 && n <= 608) return "chicago";
  // Texas urban — 750–778
  if (n >= 750 && n <= 778) return "texas-metro";
  // Seattle / Portland — 980–982, 970–972
  if (n >= 980 && n <= 982) return "seattle";
  if (n >= 970 && n <= 972) return "seattle";
  // LA / Orange / San Diego — 900–929
  if (n >= 900 && n <= 929) return "la-metro";
  // SF Bay Area — 940–951
  if (n >= 940 && n <= 951) return "bay-area";
  // Hawaii — 967–968
  if (n >= 967 && n <= 968) return "hawaii";
  // Alaska — 995–999
  if (n >= 995 && n <= 999) return "alaska";

  // Midwest / Plains catch-all — generally cheaper
  if (
    (n >= 500 && n <= 599) ||
    (n >= 610 && n <= 699) ||
    (n >= 800 && n <= 838)
  ) {
    return "midwest-suburban";
  }
  // Rural Appalachia / South / Plains
  if (
    (n >= 240 && n <= 268) ||
    (n >= 370 && n <= 397) ||
    (n >= 400 && n <= 427) ||
    (n >= 700 && n <= 749)
  ) {
    return "rural";
  }
  return "national";
}
