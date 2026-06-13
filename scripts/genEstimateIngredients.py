#!/usr/bin/env python3
"""Estimate catalog data (unit, cost, per-unit nutrition, category) for the
ingredient names that GEN_RECIPES used but the catalog didn't have. Reads
/tmp/gen-unmapped.json, writes /tmp/gen-new-ingredients.json keyed by gening- id."""
import os, json, urllib.request, time, threading
from concurrent.futures import ThreadPoolExecutor

KEY = os.environ["ANTHROPIC_API_KEY"]
items = json.load(open("/tmp/gen-unmapped.json"))  # [{id, name, sample}]
print(f"unmapped ingredients to estimate: {len(items)}", flush=True)

try:
    out = json.load(open("/tmp/gen-new-ingredients.json"))
except Exception:
    out = {}
todo = [it for it in items if it["id"] not in out]

UNITS = "cup,tbsp,tsp,oz,clove,slice,piece,each"
CATS = "grain,protein,vegetable,fruit,dairy,canned,condiment,spice,frozen,snack"

def ask(batch):
    listing = "\n".join(f'{it["id"]} | {it["name"]}' for it in batch)
    prompt = (f"For each grocery ingredient, pick the most natural measuring UNIT (one of: {UNITS}) and give "
              f"realistic values PER ONE of that unit. Return ONLY a JSON object mapping the given id to "
              f'{{"unit":str,"estimatedUnitCost":USD per unit,"calories":int,"protein":g,"carbs":g,"fat":g,'
              f'"fiber":g,"category":one of {CATS}}}. Ingredients:\n{listing}')
    body = json.dumps({"model": "claude-haiku-4-5-20251001", "max_tokens": 4000,
                       "messages": [{"role": "user", "content": prompt}]}).encode()
    req = urllib.request.Request("https://api.anthropic.com/v1/messages", data=body,
                                 headers={"x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"})
    d = json.load(urllib.request.urlopen(req, timeout=150))
    txt = "".join(b.get("text", "") for b in d.get("content", []))
    s = txt.find("{"); e = txt.rfind("}")
    return json.loads(txt[s:e + 1])

B = 30
batches = [todo[i:i + B] for i in range(0, len(todo), B)]
lock = threading.Lock()
done = [0]

def work(batch):
    try:
        g = ask(batch)
    except Exception:
        time.sleep(2)
        try:
            g = ask(batch)
        except Exception as ex:
            with lock:
                done[0] += 1; print(f"  batch failed: {ex}", flush=True)
            return
    valid = {it["id"] for it in batch}
    with lock:
        for k, v in g.items():
            if k in valid and isinstance(v, dict):
                out[k] = v
        done[0] += 1
        json.dump(out, open("/tmp/gen-new-ingredients.json", "w"))
        print(f"  batch {done[0]}/{len(batches)}: total {len(out)}", flush=True)

with ThreadPoolExecutor(max_workers=6) as ex:
    list(ex.map(work, batches))
json.dump(out, open("/tmp/gen-new-ingredients.json", "w"))
print(f"DONE estimated {len(out)} ingredients", flush=True)
