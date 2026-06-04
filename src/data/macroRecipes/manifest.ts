/**
 * Progress manifest for the 2,000-dish macro-friendly recipe project.
 *
 * Each entry records a batch that has been fully generated, validated,
 * and committed. The `slugs` list is the source of truth for dedup —
 * never create a record whose id already appears here.
 *
 * To resume: read `completedCount`, find the first batch file ≥ that
 * number, and continue from there.
 */

export interface BatchRecord {
  batch: number;       // 1-based batch number
  range: string;       // e.g. "001–010"
  theme: string;       // short description of the batch content
  slugs: string[];     // all variant ids written (3 per dish)
  completedAt: string; // ISO date
}

export const MANIFEST: BatchRecord[] = [
  {
    batch: 1,
    range: "001–010",
    theme: "High-protein breakfasts",
    completedAt: "2026-06-04",
    slugs: [
      "mfr-protein-pancakes","mfr-protein-pancakes-cf","mfr-protein-pancakes-pf",
      "mfr-cottage-power-toast","mfr-cottage-power-toast-cf","mfr-cottage-power-toast-pf",
      "mfr-turkey-egg-cups","mfr-turkey-egg-cups-cf","mfr-turkey-egg-cups-pf",
      "mfr-protein-overnight-oats","mfr-protein-overnight-oats-cf","mfr-protein-overnight-oats-pf",
      "mfr-white-bean-avo-toast","mfr-white-bean-avo-toast-cf","mfr-white-bean-avo-toast-pf",
      "mfr-spinach-mushroom-scramble","mfr-spinach-mushroom-scramble-cf","mfr-spinach-mushroom-scramble-pf",
      "mfr-berry-smoothie-bowl","mfr-berry-smoothie-bowl-cf","mfr-berry-smoothie-bowl-pf",
      "mfr-black-bean-morning-burrito","mfr-black-bean-morning-burrito-cf","mfr-black-bean-morning-burrito-pf",
      "mfr-quinoa-breakfast-bowl","mfr-quinoa-breakfast-bowl-cf","mfr-quinoa-breakfast-bowl-pf",
      "mfr-salmon-cucumber-toast","mfr-salmon-cucumber-toast-cf","mfr-salmon-cucumber-toast-pf",
    ],
  },
  {
    batch: 2,
    range: "011–020",
    theme: "Asian-inspired lunches",
    completedAt: "2026-06-04",
    slugs: [
      "mfr-sesame-chicken-lettuce-wraps","mfr-sesame-chicken-lettuce-wraps-cf","mfr-sesame-chicken-lettuce-wraps-pf",
      "mfr-korean-beef-rice-bowl","mfr-korean-beef-rice-bowl-cf","mfr-korean-beef-rice-bowl-pf",
      "mfr-miso-tofu-grain-bowl","mfr-miso-tofu-grain-bowl-cf","mfr-miso-tofu-grain-bowl-pf",
      "mfr-viet-shrimp-noodle-salad","mfr-viet-shrimp-noodle-salad-cf","mfr-viet-shrimp-noodle-salad-pf",
      "mfr-thai-peanut-tempeh-bowl","mfr-thai-peanut-tempeh-bowl-cf","mfr-thai-peanut-tempeh-bowl-pf",
      "mfr-soy-ginger-salmon-rice","mfr-soy-ginger-salmon-rice-cf","mfr-soy-ginger-salmon-rice-pf",
      "mfr-edamame-sesame-noodles","mfr-edamame-sesame-noodles-cf","mfr-edamame-sesame-noodles-pf",
      "mfr-spicy-tofu-bibimbap","mfr-spicy-tofu-bibimbap-cf","mfr-spicy-tofu-bibimbap-pf",
      "mfr-teriyaki-mushroom-rice","mfr-teriyaki-mushroom-rice-cf","mfr-teriyaki-mushroom-rice-pf",
      "mfr-hoisin-chicken-noodles","mfr-hoisin-chicken-noodles-cf","mfr-hoisin-chicken-noodles-pf",
    ],
  },
  {
    batch: 3,
    range: "021–030",
    theme: "Mediterranean dinners",
    completedAt: "2026-06-04",
    slugs: [
      "mfr-greek-baked-chicken","mfr-greek-baked-chicken-cf","mfr-greek-baked-chicken-pf",
      "mfr-white-bean-shakshuka","mfr-white-bean-shakshuka-cf","mfr-white-bean-shakshuka-pf",
      "mfr-lemon-salmon-couscous","mfr-lemon-salmon-couscous-cf","mfr-lemon-salmon-couscous-pf",
      "mfr-lebanese-lentil-soup","mfr-lebanese-lentil-soup-cf","mfr-lebanese-lentil-soup-pf",
      "mfr-moroccan-chicken-chickpea","mfr-moroccan-chicken-chickpea-cf","mfr-moroccan-chicken-chickpea-pf",
      "mfr-quinoa-tabbouleh-bowl","mfr-quinoa-tabbouleh-bowl-cf","mfr-quinoa-tabbouleh-bowl-pf",
      "mfr-turkish-beef-rice","mfr-turkish-beef-rice-cf","mfr-turkish-beef-rice-pf",
      "mfr-roasted-chickpea-plate","mfr-roasted-chickpea-plate-cf","mfr-roasted-chickpea-plate-pf",
      "mfr-harissa-shrimp-couscous","mfr-harissa-shrimp-couscous-cf","mfr-harissa-shrimp-couscous-pf",
      "mfr-feta-spinach-chicken","mfr-feta-spinach-chicken-cf","mfr-feta-spinach-chicken-pf",
    ],
  },
  {
    batch: 4,
    range: "031–040",
    theme: "Mexican and Latin American",
    completedAt: "2026-06-04",
    slugs: [
      "mfr-chicken-pozole-verde","mfr-chicken-pozole-verde-cf","mfr-chicken-pozole-verde-pf",
      "mfr-beef-enchilada-casserole","mfr-beef-enchilada-casserole-cf","mfr-beef-enchilada-casserole-pf",
      "mfr-spicy-shrimp-tacos","mfr-spicy-shrimp-tacos-cf","mfr-spicy-shrimp-tacos-pf",
      "mfr-black-bean-sweet-potato-tamale-bowl","mfr-black-bean-sweet-potato-tamale-bowl-cf","mfr-black-bean-sweet-potato-tamale-bowl-pf",
      "mfr-peruvian-chicken-green-sauce","mfr-peruvian-chicken-green-sauce-cf","mfr-peruvian-chicken-green-sauce-pf",
      "mfr-chorizo-potato-hash","mfr-chorizo-potato-hash-cf","mfr-chorizo-potato-hash-pf",
      "mfr-colombian-red-beans-rice","mfr-colombian-red-beans-rice-cf","mfr-colombian-red-beans-rice-pf",
      "mfr-mexican-street-corn-salad","mfr-mexican-street-corn-salad-cf","mfr-mexican-street-corn-salad-pf",
      "mfr-lamb-quinoa-stuffed-peppers","mfr-lamb-quinoa-stuffed-peppers-cf","mfr-lamb-quinoa-stuffed-peppers-pf",
      "mfr-lentil-taco-bowls","mfr-lentil-taco-bowls-cf","mfr-lentil-taco-bowls-pf",
    ],
  },
  {
    batch: 5,
    range: "041–050",
    theme: "Soups and stews",
    completedAt: "2026-06-04",
    slugs: [
      "mfr-tuscan-white-bean-kale-soup","mfr-tuscan-white-bean-kale-soup-cf","mfr-tuscan-white-bean-kale-soup-pf",
      "mfr-red-pepper-tomato-soup","mfr-red-pepper-tomato-soup-cf","mfr-red-pepper-tomato-soup-pf",
      "mfr-thai-coconut-chicken-soup","mfr-thai-coconut-chicken-soup-cf","mfr-thai-coconut-chicken-soup-pf",
      "mfr-lentil-veggie-minestrone","mfr-lentil-veggie-minestrone-cf","mfr-lentil-veggie-minestrone-pf",
      "mfr-smoky-black-bean-soup","mfr-smoky-black-bean-soup-cf","mfr-smoky-black-bean-soup-pf",
      "mfr-broccoli-cheddar-soup","mfr-broccoli-cheddar-soup-cf","mfr-broccoli-cheddar-soup-pf",
      "mfr-chicken-tortilla-soup","mfr-chicken-tortilla-soup-cf","mfr-chicken-tortilla-soup-pf",
      "mfr-pork-miso-ramen","mfr-pork-miso-ramen-cf","mfr-pork-miso-ramen-pf",
      "mfr-ethiopian-red-lentil-stew","mfr-ethiopian-red-lentil-stew-cf","mfr-ethiopian-red-lentil-stew-pf",
      "mfr-chicken-barley-soup","mfr-chicken-barley-soup-cf","mfr-chicken-barley-soup-pf",
    ],
  },
];

export const completedCount: number = MANIFEST.reduce(
  (sum, b) => sum + Math.floor(b.slugs.length / 3),
  0,
);
