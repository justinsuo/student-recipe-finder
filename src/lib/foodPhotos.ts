/**
 * Resolves broken `source.unsplash.com` recipe images to stable food photos.
 *
 * All photos are sourced from Wikimedia Commons and are already used (and
 * visually verified) in RECIPE_IMAGES. This guarantees every URL returns an
 * actual food photo — no oceans, cityscapes, or file-type icons.
 *
 * resolveRecipeImage() fallback priority:
 *   1. RECIPE_PHOTO_MAP — dish-specific Wikimedia photo (highest quality)
 *   2. Cuisine pool → keyword pool → general pool (cuisine-relevant food photo)
 */

import type { ExternalRecipe } from "@/lib/externalTypes";
import { RECIPE_PHOTO_MAP } from "@/data/recipePhotoMap";

// Verified Wikimedia Commons food photo URLs.
// Every URL in these pools has been visually confirmed in RECIPE_IMAGES.
const W = {
  chinese: [
    "https://upload.wikimedia.org/wikipedia/commons/3/3c/Yangzhou_fried_rice_and_drinks_25-09-2019.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Chinese_rice_congee.jpg/960px-Chinese_rice_congee.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Chen_Mapo_Tofu.jpg/960px-Chen_Mapo_Tofu.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Fried_rice_with_chicken_and_egg.jpg/960px-Fried_rice_with_chicken_and_egg.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Hot_Dry_Noodles.jpg/960px-Hot_Dry_Noodles.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Dan-dan_noodles%2C_Shanghai.jpg/960px-Dan-dan_noodles%2C_Shanghai.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Napa_Cabbage_%26_Tofu_soup_%28%E7%99%BD%E8%8F%9C%E8%B1%86%E8%85%90%E6%B9%AF%29.jpg/960px-Napa_Cabbage_%26_Tofu_soup_%28%E7%99%BD%E8%8F%9C%E8%B1%86%E8%85%90%E6%B9%AF%29.jpg",
  ],
  japanese: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Miso_Soup_001.jpg/960px-Miso_Soup_001.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/09/Tamago_kake_gohan.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Instant_chazuke_by_shibainu.jpg/960px-Instant_chazuke_by_shibainu.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Shoyu_ramen_-_Goemon_Ramen_Bar_2024-01-26.jpg/960px-Shoyu_ramen_-_Goemon_Ramen_Bar_2024-01-26.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Nagata_Honjoken_Bokkake_Yakisoba.jpg/960px-Nagata_Honjoken_Bokkake_Yakisoba.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/9/97/Kakeudon.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Pholiota_microspora_miso_soup_001.jpg/960px-Pholiota_microspora_miso_soup_001.jpg",
  ],
  korean: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Kimchi-bokkeum-bap_%28Kimchi_fried_rice%29_-_Kogi_2023-09-11.jpg/960px-Kimchi-bokkeum-bap_%28Kimchi_fried_rice%29_-_Kogi_2023-09-11.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/3c/Yangzhou_fried_rice_and_drinks_25-09-2019.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Shoyu_ramen_-_Goemon_Ramen_Bar_2024-01-26.jpg/960px-Shoyu_ramen_-_Goemon_Ramen_Bar_2024-01-26.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Chen_Mapo_Tofu.jpg/960px-Chen_Mapo_Tofu.jpg",
  ],
  thai: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Sweet_Potato_Curry.jpg/960px-Sweet_Potato_Curry.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Beef_curry_rice_003.jpg/960px-Beef_curry_rice_003.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Noodles_with_Peanut_Butter_Sauce.jpg/960px-Noodles_with_Peanut_Butter_Sauce.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Fried_rice_with_chicken_and_egg.jpg/960px-Fried_rice_with_chicken_and_egg.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Napa_Cabbage_%26_Tofu_soup_%28%E7%99%BD%E8%8F%9C%E8%B1%86%E8%85%90%E6%B9%AF%29.jpg/960px-Napa_Cabbage_%26_Tofu_soup_%28%E7%99%BD%E8%8F%9C%E8%B1%86%E8%85%90%E6%B9%AF%29.jpg",
  ],
  vietnamese: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Noodles_with_Peanut_Butter_Sauce.jpg/960px-Noodles_with_Peanut_Butter_Sauce.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Shoyu_ramen_-_Goemon_Ramen_Bar_2024-01-26.jpg/960px-Shoyu_ramen_-_Goemon_Ramen_Bar_2024-01-26.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Homemade_Lentil_Soup_-_Lavash_2025-02-10.jpg/960px-Homemade_Lentil_Soup_-_Lavash_2025-02-10.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Chinese_rice_congee.jpg/960px-Chinese_rice_congee.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/19/Chicken_congee_at_Psar_Chaa_Market_in_Siem_Reap%2C_Cambodia.jpg",
  ],
  indian: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Chana_Masala_in_Paul%C3%ADnia%2C_2023-10-16.jpg/960px-Chana_Masala_in_Paul%C3%ADnia%2C_2023-10-16.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Mixed_vegetable_curry_2.jpg/960px-Mixed_vegetable_curry_2.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Masala_Khichadi.jpg/960px-Masala_Khichadi.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Chole_Bhature%2C_a_popular_North_Indian_dish.jpg/960px-Chole_Bhature%2C_a_popular_North_Indian_dish.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/8c/Kadai_chicken_%28karahi%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Makka_Poha.jpg/960px-Makka_Poha.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/VEGETABLE_PULAO_~_An_Indian_cuisine_made_from_fried_rice_mixed_with_fried_vegetables.jpg/960px-VEGETABLE_PULAO_~_An_Indian_cuisine_made_from_fried_rice_mixed_with_fried_vegetables.jpg",
  ],
  curry: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Sweet_Potato_Curry.jpg/960px-Sweet_Potato_Curry.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Beef_curry_rice_003.jpg/960px-Beef_curry_rice_003.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Chana_masala.jpg/960px-Chana_masala.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Chana_Masala_in_Paul%C3%ADnia%2C_2023-10-16.jpg/960px-Chana_Masala_in_Paul%C3%ADnia%2C_2023-10-16.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Mixed_vegetable_curry_2.jpg/960px-Mixed_vegetable_curry_2.jpg",
  ],
  middleEastern: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Shakshuka_by_Calliopejen1.jpg/960px-Shakshuka_by_Calliopejen1.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Lebanese_style_hummus.jpg/960px-Lebanese_style_hummus.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Falafel_%26_Hummus_Wrap_-_Lavash_2024-08-19.jpg/960px-Falafel_%26_Hummus_Wrap_-_Lavash_2024-08-19.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Tabouleh_1.JPG/960px-Tabouleh_1.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Hummus_salad.jpg/960px-Hummus_salad.jpg",
  ],
  moroccan: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Tabouleh_1.JPG/960px-Tabouleh_1.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Shakshuka_by_Calliopejen1.jpg/960px-Shakshuka_by_Calliopejen1.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Lebanese_style_hummus.jpg/960px-Lebanese_style_hummus.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Homemade_Lentil_Soup_-_Lavash_2025-02-10.jpg/960px-Homemade_Lentil_Soup_-_Lavash_2025-02-10.jpg",
  ],
  african: [
    "https://upload.wikimedia.org/wikipedia/commons/1/1d/Nsima_Relishes.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Homemade_Lentil_Soup_-_Lavash_2025-02-10.jpg/960px-Homemade_Lentil_Soup_-_Lavash_2025-02-10.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Black_Bean_Soup_%28140491813%29.jpeg/960px-Black_Bean_Soup_%28140491813%29.jpeg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Mixed_vegetable_curry_2.jpg/960px-Mixed_vegetable_curry_2.jpg",
  ],
  mexican: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg/960px-001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Burrito.JPG/960px-Burrito.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Enchiladas_rice_beans.jpg/960px-Enchiladas_rice_beans.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Steak_burrito_bowl_at_La_Casa_Restaurant_in_Sonoma%2C_California_-_Sarah_Stierch_03.jpg/960px-Steak_burrito_bowl_at_La_Casa_Restaurant_in_Sonoma%2C_California_-_Sarah_Stierch_03.jpg",
  ],
  latam: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg/960px-001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Black_Bean_Soup_%28140491813%29.jpeg/960px-Black_Bean_Soup_%28140491813%29.jpeg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Burrito.JPG/960px-Burrito.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Steak_burrito_bowl_at_La_Casa_Restaurant_in_Sonoma%2C_California_-_Sarah_Stierch_03.jpg/960px-Steak_burrito_bowl_at_La_Casa_Restaurant_in_Sonoma%2C_California_-_Sarah_Stierch_03.jpg",
  ],
  european: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Spaghetti_pomodoro%2C_Venice.jpg/960px-Spaghetti_pomodoro%2C_Venice.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Tagliatelle_al_rag%C3%B9_%28image_modified%29.jpg/960px-Tagliatelle_al_rag%C3%B9_%28image_modified%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Caldo_verde.jpg/960px-Caldo_verde.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Ribollita_Siena.jpg/960px-Ribollita_Siena.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Pasta_al_Forno_01.jpg/960px-Pasta_al_Forno_01.jpg",
  ],
  pasta: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Spaghetti_pomodoro%2C_Venice.jpg/960px-Spaghetti_pomodoro%2C_Venice.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Tagliatelle_al_rag%C3%B9_%28image_modified%29.jpg/960px-Tagliatelle_al_rag%C3%B9_%28image_modified%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/5e/Shrimp_and_basil_pesto_pasta_2.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Pasta_con_le_sarde_%28Palermo%29.jpg/960px-Pasta_con_le_sarde_%28Palermo%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Tortiglioni_con_ceci.jpg/960px-Tortiglioni_con_ceci.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Original_Mac_n_Cheese_.jpg/960px-Original_Mac_n_Cheese_.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Tuna_pasta_salad.jpg/960px-Tuna_pasta_salad.jpg",
  ],
  noodles: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Noodles_with_Peanut_Butter_Sauce.jpg/960px-Noodles_with_Peanut_Butter_Sauce.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Hot_Dry_Noodles.jpg/960px-Hot_Dry_Noodles.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Dan-dan_noodles%2C_Shanghai.jpg/960px-Dan-dan_noodles%2C_Shanghai.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/9/97/Kakeudon.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Nagata_Honjoken_Bokkake_Yakisoba.jpg/960px-Nagata_Honjoken_Bokkake_Yakisoba.jpg",
    "https://upload.wikimedia.org/wikipedia/en/8/8b/Real_lo_mein.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Shoyu_ramen_-_Goemon_Ramen_Bar_2024-01-26.jpg/960px-Shoyu_ramen_-_Goemon_Ramen_Bar_2024-01-26.jpg",
  ],
  soup: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Chicken_Noodle_Soup.jpg/960px-Chicken_Noodle_Soup.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Homemade_Lentil_Soup_-_Lavash_2025-02-10.jpg/960px-Homemade_Lentil_Soup_-_Lavash_2025-02-10.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Black_Bean_Soup_%28140491813%29.jpeg/960px-Black_Bean_Soup_%28140491813%29.jpeg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Spring_pea_soup_with_cr%C3%A8me_fra%C3%AEche_and_bread.jpg/960px-Spring_pea_soup_with_cr%C3%A8me_fra%C3%AEche_and_bread.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Vegan_Garden_Corn_Chowder_with_Chives_%28cropped%29.jpg/960px-Vegan_Garden_Corn_Chowder_with_Chives_%28cropped%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Miso_Soup_001.jpg/960px-Miso_Soup_001.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Ribollita_Siena.jpg/960px-Ribollita_Siena.jpg",
  ],
  rice: [
    "https://upload.wikimedia.org/wikipedia/commons/3/3c/Yangzhou_fried_rice_and_drinks_25-09-2019.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Fried_rice_with_chicken_and_egg.jpg/960px-Fried_rice_with_chicken_and_egg.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Kimchi-bokkeum-bap_%28Kimchi_fried_rice%29_-_Kogi_2023-09-11.jpg/960px-Kimchi-bokkeum-bap_%28Kimchi_fried_rice%29_-_Kogi_2023-09-11.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/19/Chicken_congee_at_Psar_Chaa_Market_in_Siem_Reap%2C_Cambodia.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Bowl_of_Teriyaki_chicken_and_beef_YakinikuCNE.jpg/960px-Bowl_of_Teriyaki_chicken_and_beef_YakinikuCNE.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/VEGETABLE_PULAO_~_An_Indian_cuisine_made_from_fried_rice_mixed_with_fried_vegetables.jpg/960px-VEGETABLE_PULAO_~_An_Indian_cuisine_made_from_fried_rice_mixed_with_fried_vegetables.jpg",
  ],
  grilled: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Bowl_of_Teriyaki_chicken_and_beef_YakinikuCNE.jpg/960px-Bowl_of_Teriyaki_chicken_and_beef_YakinikuCNE.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/8c/Kadai_chicken_%28karahi%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg/960px-001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Nagata_Honjoken_Bokkake_Yakisoba.jpg/960px-Nagata_Honjoken_Bokkake_Yakisoba.jpg",
  ],
  seafood: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Rice_bowl_topped_with_salmon_and_salmon_egg_%2814904439935%29.jpg/960px-Rice_bowl_topped_with_salmon_and_salmon_egg_%2814904439935%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Tuna_pasta_salad.jpg/960px-Tuna_pasta_salad.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Pasta_con_le_sarde_%28Palermo%29.jpg/960px-Pasta_con_le_sarde_%28Palermo%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Nizza-Salat_an_der_F_Mittelmeerk%C3%BCste.JPG/960px-Nizza-Salat_an_der_F_Mittelmeerk%C3%BCste.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Chinese_rice_congee.jpg/960px-Chinese_rice_congee.jpg",
  ],
  bread: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Breakfast_quesadilla_at_Found_Off_Chapel_in_South_Yarra.jpg/960px-Breakfast_quesadilla_at_Found_Off_Chapel_in_South_Yarra.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Burrito.JPG/960px-Burrito.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Falafel_%26_Hummus_Wrap_-_Lavash_2024-08-19.jpg/960px-Falafel_%26_Hummus_Wrap_-_Lavash_2024-08-19.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Smoked_chicken_and_avocado_wrap.jpg/960px-Smoked_chicken_and_avocado_wrap.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/89/Grilled_cheese_sandwich.jpg",
  ],
  dessert: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Yogurt%2C_fruit%2C_granola_bowl_%2834999358091%29.jpg/960px-Yogurt%2C_fruit%2C_granola_bowl_%2834999358091%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Apple_cinnamon_oatmeal.jpg/960px-Apple_cinnamon_oatmeal.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Chinese_rice_congee.jpg/960px-Chinese_rice_congee.jpg",
  ],
  streetFood: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg/960px-001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Pancit_Ilonggo_Style_-_12110089845.jpg/960px-Pancit_Ilonggo_Style_-_12110089845.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Bowl_of_Teriyaki_chicken_and_beef_YakinikuCNE.jpg/960px-Bowl_of_Teriyaki_chicken_and_beef_YakinikuCNE.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Breakfast_quesadilla_at_Found_Off_Chapel_in_South_Yarra.jpg/960px-Breakfast_quesadilla_at_Found_Off_Chapel_in_South_Yarra.jpg",
  ],
  general: [
    "https://upload.wikimedia.org/wikipedia/commons/3/3c/Yangzhou_fried_rice_and_drinks_25-09-2019.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Chana_Masala_in_Paul%C3%ADnia%2C_2023-10-16.jpg/960px-Chana_Masala_in_Paul%C3%ADnia%2C_2023-10-16.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Chicken_Noodle_Soup.jpg/960px-Chicken_Noodle_Soup.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Bowl_of_Teriyaki_chicken_and_beef_YakinikuCNE.jpg/960px-Bowl_of_Teriyaki_chicken_and_beef_YakinikuCNE.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Spaghetti_pomodoro%2C_Venice.jpg/960px-Spaghetti_pomodoro%2C_Venice.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg/960px-001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Shakshuka_by_Calliopejen1.jpg/960px-Shakshuka_by_Calliopejen1.jpg",
  ],
} as const;

type Category = keyof typeof W;

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
  malawian: "african",
  zimbabwean: "african",
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

// ── Keyword → category (matched against tags + title + cuisine) ──────────────

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
  ["noodle", "noodles"], ["udon", "noodles"], ["yakisoba", "noodles"],
  ["soup", "soup"], ["stew", "soup"], ["broth", "soup"], ["chowder", "soup"],
  ["rice", "rice"], ["pilaf", "rice"], ["fried rice", "rice"],
  ["grilled", "grilled"], ["bbq", "grilled"], ["barbecue", "grilled"], ["roast", "grilled"],
  ["fish", "seafood"], ["seafood", "seafood"], ["shrimp", "seafood"], ["prawn", "seafood"],
  ["crab", "seafood"], ["salmon", "seafood"], ["tuna", "seafood"],
  ["bread", "bread"], ["flatbread", "bread"], ["roti", "bread"],
  ["wrap", "bread"], ["pita", "bread"], ["tortilla", "bread"], ["dumpling", "chinese"],
  ["cake", "dessert"], ["dessert", "dessert"], ["sweet", "dessert"],
  ["chocolate", "dessert"], ["pudding", "dessert"],
  ["street food", "streetFood"], ["snack", "streetFood"],
];

// ── Deterministic pick from a pool using recipe ID as seed ──────────────────

const pick = (urls: readonly string[], seed: string): string => {
  const n = seed.split("").reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0);
  return urls[Math.abs(n) % urls.length];
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns a stable, relevant Wikimedia Commons food photo URL for an ExternalRecipe.
 * If the recipe already has a non-source.unsplash.com URL, it is returned as-is.
 */
export function resolveRecipeImage(recipe: ExternalRecipe): string {
  const { image, id, cuisine } = recipe;

  // Already a stable URL — keep it
  if (!image.includes("source.unsplash.com")) return image;

  // Dish-specific Wikimedia photo (highest quality, verified match)
  if (RECIPE_PHOTO_MAP[id]) return RECIPE_PHOTO_MAP[id];

  const seed = id;
  const cuisineLower = (cuisine ?? "").toLowerCase();

  // 1. Exact cuisine match
  const direct = CUISINE_MAP[cuisineLower];
  if (direct) return pick(W[direct], seed);

  // 2. Partial cuisine match (e.g. "North Indian", "West African")
  for (const [key, cat] of Object.entries(CUISINE_MAP)) {
    if (cuisineLower.includes(key) || key.includes(cuisineLower)) {
      return pick(W[cat], seed);
    }
  }

  // 3. Keyword match against tags + title
  const tagStr   = (recipe.tags ?? []).join(" ").toLowerCase();
  const titleStr = (recipe.title ?? "").toLowerCase();
  const combined = `${cuisineLower} ${tagStr} ${titleStr}`;

  for (const [kw, cat] of KEYWORD_MAP) {
    if (combined.includes(kw)) return pick(W[cat], seed);
  }

  // 4. Fallback
  return pick(W.general, seed);
}
