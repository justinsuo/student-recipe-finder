# Student Recipe Finder Worker

Cloudflare Worker that proxies OpenAI requests for the static-site frontend.

## Deploy

```bash
# from this directory:
npm install
npx wrangler login

# Store your OpenAI key as a Worker secret (not in code):
npx wrangler secret put OPENAI_API_KEY
# paste your key when prompted

# Restrict CORS to your site (recommended):
npx wrangler secret put ALLOWED_ORIGIN
# enter: https://justinsuo.github.io

# Deploy:
npm run deploy
```

After deployment Wrangler prints a URL like:

```
https://student-recipe-finder-api.<your-cf-subdomain>.workers.dev
```

Add that URL as a GitHub repo secret called `WORKER_URL` on the main repo so the frontend build can wire it in:

```bash
gh secret set WORKER_URL --body "https://student-recipe-finder-api.<your-cf-subdomain>.workers.dev" --repo justinsuo/student-recipe-finder
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET  | `/health` | Health check |
| POST | `/ingredients/resolve` | Parse a phrase into structured ingredients |
| POST | `/ingredients/enrich` | Classify a single custom ingredient |
| POST | `/ingredients/match` | Semantic match: pantry item ↔ recipe requirement |
| POST | `/generate-recipe` | AI Chef recipe generation |
| POST | `/generate-recipe-image` | OpenAI image generation for a recipe |

## Local dev

```bash
npx wrangler dev
# Worker listens on http://localhost:8787
```

Then run the frontend with `NEXT_PUBLIC_WORKER_URL=http://localhost:8787 npm run dev`.

## Model configuration

All model selection runs through `modelFor()` in `src/index.ts`. Defaults are real, currently-available OpenAI models (June 2026 lineup); overrides come from `wrangler.toml` `[vars]` or worker secrets:

```toml
[vars]
DEFAULT_TEXT_MODEL = "gpt-4o-mini"             # blanket fallback for every text task
RECIPE_MODEL = "gpt-4o-mini"                   # single-recipe generation
RECIPE_HIGH_QUALITY_MODEL = "gpt-4o"           # multi-option generation / remix
LIGHTWEIGHT_MODEL = "gpt-4o-mini"              # cheap reasoning tasks
PRICING_MODEL = "gpt-4o-mini"                  # AI grocery price estimator
INGREDIENT_MODEL = "gpt-4o-mini"               # ingredient resolver/enrich/match
WEB_RECIPE_MODEL = "gpt-4o-mini"               # web-search-grounded discovery
DEFAULT_IMAGE_MODEL = "dall-e-3"               # primary image model
IMAGE_MODEL_FALLBACK = "gpt-image-1"           # used if primary 403/401's
```

Switch to a higher-quality model without touching code:

```bash
npx wrangler secret put RECIPE_HIGH_QUALITY_MODEL
# enter: gpt-5
npm run deploy
```

### Why the OpenAI dashboard shows `gpt-4o-mini-2024-07-18`

That dated form is OpenAI's *snapshot resolution* for billing. The worker only ever sends the alias `gpt-4o-mini`; OpenAI's API silently routes that to whatever snapshot is current and reports the dated form on the usage page. There is no hardcoded snapshot in this repo. Searching for `gpt-4o-mini-2024-07-18` returns zero hits.

### Verifying which models are live

```
GET https://<your-worker>.workers.dev/diagnostics
```

Returns:

```json
{
  "hasApiKey": true,
  "models": {
    "recipe": "gpt-4o-mini",
    "recipeHighQuality": "gpt-4o",
    "image": "dall-e-3",
    "imageFallback": "gpt-image-1",
    ...
  },
  "envOverrides": { "RECIPE_MODEL": true, ... },
  "note": "..."
}
```

No API key is ever exposed.

### Per-request logging

Every chat / image call logs `[ai] chat task=recipe model=gpt-4o-mini …` (and the image equivalent) to the worker's stdout. Tail with:

```bash
npx wrangler tail
```

### API-key rotation

A new key is only needed if the current one is invalid, scoped to the wrong project, or has been leaked. Switching models does NOT require a new key — just change the model env var and redeploy.

## Cost notes

- Text routes use `gpt-4o-mini` by default (~$0.15 per 1M input tokens).
- `gpt-4o` (the high-quality default for multi-option generation) is ~10× the price but produces noticeably better creative recipes.
- Image route uses `dall-e-3` by default — works on every org without verification. ~$0.04 per image.
- `gpt-image-1` (fallback) requires org verification; better photorealism when available.
- Set a monthly spend cap at https://platform.openai.com/account/limits.
