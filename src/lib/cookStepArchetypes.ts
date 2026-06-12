// Local heuristics that classify a cooking-step string into one of ~12
// visual archetypes — used by the step-by-step cooking page to render a
// big, free, instant icon per step instead of paying for an AI image.
//
// These are intentionally tiny patterns: hit the first verb that matches.
// The buckets are ordered specific → generic so "boil" beats "cook".

export type StepArchetype =
  | "prep"
  | "chop"
  | "mix"
  | "season"
  | "sear"
  | "boil"
  | "simmer"
  | "bake"
  | "microwave"
  | "rest"
  | "plate"
  | "assemble"
  | "garnish";

interface ArchetypeMeta {
  label: string;
  // Tailwind classes for the icon's color + background tint.
  bg: string;
  fg: string;
  // Hex accent used by the cooking page card border.
  accent: string;
}

export const ARCHETYPE_META: Record<StepArchetype, ArchetypeMeta> = {
  prep: { label: "Prep", bg: "bg-[#EEF7F1]", fg: "text-[#0F5E33]", accent: "#2FBF71" },
  chop: { label: "Chop", bg: "bg-[#FFF1E6]", fg: "text-[#9A4A0B]", accent: "#F0883E" },
  mix: { label: "Mix", bg: "bg-[#F3EBFF]", fg: "text-[#3F2BB8]", accent: "#7C5CFF" },
  season: { label: "Season", bg: "bg-[#FFF7CC]", fg: "text-[#7A4A00]", accent: "#F2B600" },
  sear: { label: "Sear", bg: "bg-[#FFE9E0]", fg: "text-[#A03205]", accent: "#E85A2C" },
  boil: { label: "Boil", bg: "bg-[#E0F2FF]", fg: "text-[#0A4E8A]", accent: "#2C8FE5" },
  simmer: { label: "Simmer", bg: "bg-[#E6F0FF]", fg: "text-[#1B47A5]", accent: "#4C7EE5" },
  bake: { label: "Bake", bg: "bg-[#FFEDD5]", fg: "text-[#9A4A0B]", accent: "#D97706" },
  microwave: { label: "Microwave", bg: "bg-[#EEF2FF]", fg: "text-[#3F2BB8]", accent: "#6366F1" },
  rest: { label: "Rest", bg: "bg-[#F4F4F1]", fg: "text-[#4B5563]", accent: "#9CA3AF" },
  plate: { label: "Plate", bg: "bg-[#FCE7F3]", fg: "text-[#9D174D]", accent: "#EC4899" },
  assemble: { label: "Assemble", bg: "bg-[#EFE8FF]", fg: "text-[#3F2BB8]", accent: "#7C5CFF" },
  garnish: { label: "Garnish", bg: "bg-[#DCFAF1]", fg: "text-[#0B6E55]", accent: "#20C7A5" },
};

// First-match wins. Patterns are word-boundary regex so "stir-fry" matches
// "stir", and "marinate" matches "rest" (since you wait for it).
const PATTERNS: Array<[RegExp, StepArchetype]> = [
  // Microwave is specific and easy to fingerprint
  [/\b(microwave|nuke|reheat in the microwave)\b/i, "microwave"],
  // Oven family
  [/\b(bake|roast|broil|preheat|oven|sheet[- ]pan|air[- ]fry|air-fryer)\b/i, "bake"],
  // High heat
  [/\b(sear|fry|saut[ée]|brown|stir[- ]fry|stir fry|crisp|caramelize|toast)\b/i, "sear"],
  // Wet heat — boil first because boil > simmer
  [/\b(boil|blanch|bring to a boil|rolling boil)\b/i, "boil"],
  [/\b(simmer|poach|braise|reduce|cook gently)\b/i, "simmer"],
  // Prep verbs
  [/\b(chop|dice|mince|slice|cut|julienne|chiffonade|cube|grate|shred|peel)\b/i, "chop"],
  // Resting/marinating/cooling
  [/\b(rest|marinate|chill|cool|let sit|let rest|set aside|refrigerate|freeze)\b/i, "rest"],
  // Plating + serving
  [/\b(plate|serve|spoon onto|drizzle on top|finish with a|enjoy|present)\b/i, "plate"],
  // Garnish
  [/\b(garnish|top with|sprinkle.*on|finish with|squeeze of lemon)\b/i, "garnish"],
  // Assembly (sandwiches, wraps, layering)
  [/\b(assemble|layer|stack|wrap|roll|build|construct|fold)\b/i, "assemble"],
  // Mixing / whisking
  [/\b(mix|stir|whisk|combine|fold in|blend|toss|beat)\b/i, "mix"],
  // Seasoning
  [/\b(season|salt and pepper|add salt|spice|sprinkle|rub)\b/i, "season"],
  // Default fall-through is prep ("wash", "rinse", "drain", "set up")
  [/\b(wash|rinse|drain|set up|gather|measure|prep|prepare|defrost|thaw)\b/i, "prep"],
];

export function classifyStep(text: string): StepArchetype {
  for (const [re, kind] of PATTERNS) {
    if (re.test(text)) return kind;
  }
  return "prep";
}

// First-sentence title extractor — pulls a short verb-led summary from the
// full step text so the card has a headline that's not 200 chars long.
export function extractStepTitle(text: string, maxLen = 60): string {
  const trimmed = text.trim();
  // First sentence ends at . ! ? or first newline
  const match = trimmed.match(/^[^.!?\n]{6,}/);
  const first = match ? match[0].trim() : trimmed.slice(0, maxLen);
  if (first.length <= maxLen) return first;
  return first.slice(0, maxLen - 1).trimEnd() + "…";
}
