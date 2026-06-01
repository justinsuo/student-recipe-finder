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

## Cost notes

- Text routes use `gpt-4o-mini` by default (cheap).
- Image route uses `gpt-image-1`. Each image costs roughly $0.04–$0.19 depending on size/quality. Set a usage cap in the OpenAI dashboard.

Override models in `wrangler.toml`:

```toml
[vars]
DEFAULT_TEXT_MODEL = "gpt-4o-mini"
DEFAULT_IMAGE_MODEL = "gpt-image-1"
```
