#!/usr/bin/env python3
"""Generate full, realistic recipes (Haiku) for famous dishes that have a real
image. Image-gated: only dishes present in /tmp/recipe-image-map.json are sent.
Resumable: appends to /tmp/gen-recipes-full.json keyed by id."""
import os, json, urllib.request, time, re, threading
from concurrent.futures import ThreadPoolExecutor

KEY = os.environ["ANTHROPIC_API_KEY"]
META = json.load(open("/tmp/gen-recipes-meta.json"))
CAP = int(os.environ.get("GEN_CAP", "560"))

# Generate in candidate order (cuisines first = most iconic). Image-gating is
# applied later at wiring time (drop any recipe whose image fetch failed), so
# generation can run fully in parallel with the image fetcher.
gated = META[:CAP]
print(f"candidates: {len(META)} | generating up to {len(gated)}", flush=True)

try:
    out = json.load(open("/tmp/gen-recipes-full.json"))
except Exception:
    out = {}
todo = [m for m in gated if m["id"] not in out]
print(f"already generated {len(out)} | todo {len(todo)}", flush=True)

SCHEMA = (
    'Return ONLY a JSON array. For EACH dish return an object with EXACTLY these keys:\n'
    '"id" (copy the given id), "name" (copy given), "cuisine" (str), '
    '"mealType" (breakfast|lunch|dinner|snack), "servings" (int 2-4), '
    '"difficulty" (easy|medium|hard), "totalTimeMinutes" (int), '
    '"ingredients" (array of {"name": common US grocery item, "amount": str like "2 cups"}; 5-12 real items), '
    '"steps" (array of 4-9 concise imperative cooking steps, each a full sentence), '
    '"estimatedNutrition" {"calories":int,"protein":g,"carbs":g,"fat":g,"fiber":g} REALISTIC PER SERVING, '
    '"costPerServing" (number, realistic US grocery ingredient cost per serving, usually 1.0-5.5), '
    '"dietTags" (array; include only TRUE ones from vegetarian,vegan,high-protein,gluten-free,dairy-free), '
    '"cheapTips" (array of 1-2 short money-saving tips), "emoji" (single food emoji).\n'
    'Make recipes authentic and genuinely cookable by a student. No commentary outside the JSON.'
)

def gen(batch):
    listing = "\n".join(f'{m["id"]} | {m["name"]} | {m.get("cuisine","")} | {m.get("mealType","dinner")}' for m in batch)
    prompt = f"Write a real, authentic home recipe for each dish below.\n{SCHEMA}\n\nDishes (id | name | cuisine | suggested mealType):\n{listing}"
    body = json.dumps({"model": "claude-haiku-4-5-20251001", "max_tokens": 8000,
                       "messages": [{"role": "user", "content": prompt}]}).encode()
    req = urllib.request.Request("https://api.anthropic.com/v1/messages", data=body,
                                 headers={"x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"})
    d = json.load(urllib.request.urlopen(req, timeout=180))
    txt = "".join(b.get("text", "") for b in d.get("content", []))
    s = txt.find("["); e = txt.rfind("]")
    return json.loads(txt[s:e + 1])

B = 10
batches = [todo[i:i + B] for i in range(0, len(todo), B)]
lock = threading.Lock()
done = [0]

def work(batch):
    try:
        recs = gen(batch)
    except Exception:
        time.sleep(2)
        try:
            recs = gen(batch)
        except Exception as ex2:
            with lock:
                done[0] += 1
                print(f"  batch failed: {ex2}", flush=True)
            return
    valid_ids = {m["id"] for m in batch}
    with lock:
        for r in recs:
            if isinstance(r, dict) and r.get("id") in valid_ids and r.get("ingredients") and r.get("steps"):
                out[r["id"]] = r
        done[0] += 1
        json.dump(out, open("/tmp/gen-recipes-full.json", "w"))
        print(f"  batch {done[0]}/{len(batches)}: total {len(out)}", flush=True)

with ThreadPoolExecutor(max_workers=8) as ex:
    list(ex.map(work, batches))
json.dump(out, open("/tmp/gen-recipes-full.json", "w"))
print(f"DONE generated {len(out)} full recipes", flush=True)
