#!/usr/bin/env python3
"""Generate a fresh batch of famous-dish candidates from deep-cut regional
cuisines + dish categories not yet well covered, deduped against the (now large)
catalog. Writes new candidates to /tmp/gen-candidates3.json."""
import os, json, urllib.request, re, threading
from concurrent.futures import ThreadPoolExecutor

KEY = os.environ["ANTHROPIC_API_KEY"]
existing = set(json.load(open("/tmp/existing-names2.json")))
def norm(s): return re.sub(r'[^a-z0-9]', '', s.lower())
existing_norm = set(norm(x) for x in existing)
# also dedupe against prior candidate pool
try:
    for c in json.load(open("/tmp/gen-recipes-meta.json")):
        existing_norm.add(norm(c["name"]))
except Exception:
    pass

REGIONS = ["viral TikTok","trendy cafe","restaurant copycat","modern fusion","Korean-Mexican fusion","Japanese-Italian fusion","Indian-Chinese","Thai-American","gourmet comfort","high-protein meal-prep","air-fryer","one-pan","sheet-pan","slow-cooker","Instant-Pot","30-minute","5-ingredient","budget college","viral Pinterest","copycat fast-food","healthy swap","keto","vegan soul-food","gluten-free","Mediterranean-diet","Whole30","protein-packed","post-workout","brunch cafe","gourmet toast"]
CATS = ["viral internet recipes","trendy restaurant dishes people recreate at home","famous fast-food copycats","protein smoothies and shakes","loaded fries and nachos","gourmet grilled cheese and melts","poke and grain bowls","ramen and noodle bar dishes","birria and stews","korean fried chicken styles","viral pasta dishes","stuffed and baked potatoes","breakfast sandwiches and burritos","acai and smoothie bowls","wings and tenders styles","sliders and mini burgers","loaded toast and tartines","dumpling and bao styles","rice bowl meal preps","viral dessert trends"]

def ask(topic, n):
    prompt = (f"List {n} well-known, real, specific {topic}. Each a concrete named dish "
              "(e.g. 'Mapo Tofu', not 'a stir-fry'). Return ONLY a JSON array of "
              '{"name": str, "cuisine": str, "mealType": breakfast|lunch|dinner|snack}. No commentary.')
    body = json.dumps({"model":"claude-haiku-4-5-20251001","max_tokens":3000,"messages":[{"role":"user","content":prompt}]}).encode()
    req = urllib.request.Request("https://api.anthropic.com/v1/messages", data=body,
        headers={"x-api-key":KEY,"anthropic-version":"2023-06-01","content-type":"application/json"})
    try:
        d=json.load(urllib.request.urlopen(req,timeout=120))
        txt="".join(b.get("text","") for b in d.get("content",[]))
        s=txt.find("["); e=txt.rfind("]")
        return json.loads(txt[s:e+1])
    except Exception:
        return []

topics = [f"iconic {r} dishes" for r in REGIONS] + CATS
cands = {}
lock = threading.Lock()
def work(t):
    n = 22 if t.startswith("iconic") else 26
    for r in ask(t, n):
        if isinstance(r, dict) and r.get("name"):
            k = norm(r["name"])
            if len(k) > 2 and k not in existing_norm:
                with lock:
                    cands.setdefault(k, {"name": r["name"], "cuisine": r.get("cuisine",""), "mealType": r.get("mealType","dinner")})

with ThreadPoolExecutor(max_workers=8) as ex:
    list(ex.map(work, topics))

new = list(cands.values())
json.dump(new, open("/tmp/gen-candidates3.json","w"))
print("NEW candidates after dedupe vs catalog:", len(new))
from collections import Counter
print("by mealType:", dict(Counter(x["mealType"] for x in new)))
