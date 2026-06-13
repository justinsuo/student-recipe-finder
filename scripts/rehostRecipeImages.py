#!/usr/bin/env python3
"""For every recipe still hosted on rate-limiting upload.wikimedia.org, find a
good real food image from the open web, download it, normalize to JPEG, and
self-host it in public/recipe-photos/<id>.jpg. We then serve these via the
jsDelivr CDN (no rate-limit, permanent) so they ALWAYS render in web + app.
Resumable: a saved file = done. Records failures to /tmp/rehost-unfixed.json."""
import json, urllib.request, urllib.parse, re, time, random, threading, io, os
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

recs = json.load(open("/tmp/wiki-recipes.json"))
OUT = "public/recipe-photos"
os.makedirs(OUT, exist_ok=True)
todo = [r for r in recs if not os.path.exists(f"{OUT}/{r['id']}.jpg")]
print(f"recipes to re-host: {len(recs)} | remaining: {len(todo)}", flush=True)

UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"}
FOOD = ("allrecipes", "seriouseats", "foodnetwork", "bonappetit", "budgetbytes", "simplyrecipes",
        "cookieandkate", "minimalistbaker", "loveandlemons", "tasteofhome", "delish", "eatingwell",
        "recipetineats", "themediterraneandish", "skinnytaste", "gimmesomeoven", "epicurious",
        "food.com", "bbcgoodfood", "sallysbaking", "wellplated", "feelgoodfoodie", "thekitchn",
        "ambitiouskitchen", "pinchofyum", "damndelicious", "halfbakedharvest", "jocooks",
        "spendwithpennies", "cafedelites", "thespruceeats", "unsplash", "pexels", "staticflickr")
# Avoid wikimedia (rate-limits) + junk/unstable hosts.
BAD = ("wikimedia", "wikipedia", "lookaside.", "fbcdn", "instagram", "blogger.googleusercontent",
       "pinimg.com/originals/x", "gettyimages", "shutterstock", "alamy", "dreamstime", "123rf")

def get(u, timeout=15, ref=None):
    h = dict(UA)
    if ref:
        h["Referer"] = ref
    return urllib.request.urlopen(urllib.request.Request(u, headers=h), timeout=timeout)

def candidates(q):
    out = []
    # DuckDuckGo
    try:
        html = get(f"https://duckduckgo.com/?q={urllib.parse.quote(q)}&iax=images&ia=images").read().decode("utf-8", "ignore")
        m = re.search(r"vqd=([\d-]+)", html)
        if m:
            d = json.load(get(f"https://duckduckgo.com/i.js?l=us-en&o=json&q={urllib.parse.quote(q)}&vqd={m.group(1)}&f=,,,,,&p=1", ref="https://duckduckgo.com/"))
            for r in d.get("results", []):
                if r.get("width", 0) >= 500 and r.get("height", 0) >= 350:
                    out.append(r.get("image", ""))
    except Exception:
        pass
    # Bing
    try:
        html = get(f"https://www.bing.com/images/search?q={urllib.parse.quote(q)}&first=1").read().decode("utf-8", "ignore")
        out += [m.replace("\\/", "/") for m in (re.findall(r'murl&quot;:&quot;(.*?)&quot;', html) or re.findall(r'"murl":"(.*?)"', html))]
    except Exception:
        pass
    # filter + rank food domains first
    out = [u for u in out if u and u.startswith("http") and not any(b in u.lower() for b in BAD)]
    out.sort(key=lambda u: any(f in u.lower() for f in FOOD), reverse=True)
    # de-dup preserving order
    seen = set(); uniq = []
    for u in out:
        if u not in seen:
            seen.add(u); uniq.append(u)
    return uniq

def try_download(u, path):
    try:
        r = get(u, timeout=18)
        if r.status != 200 or not r.headers.get("Content-Type", "").startswith("image"):
            return False
        data = r.read(8_000_000)
        if len(data) < 12000:
            return False
        img = Image.open(io.BytesIO(data))
        img.verify()
        img = Image.open(io.BytesIO(data))
        w, h = img.size
        if w < 380 or h < 260:
            return False
        img = img.convert("RGB")
        # cap dimension for size; keep good quality
        maxd = 1200
        if max(w, h) > maxd:
            s = maxd / max(w, h)
            img = img.resize((int(w * s), int(h * s)))
        img.save(path, "JPEG", quality=84, optimize=True)
        return os.path.getsize(path) > 9000
    except Exception:
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception:
            pass
        return False

lock = threading.Lock()
done = [0]
unfixed = {}

def work(r):
    time.sleep(random.uniform(0, 0.6))
    path = f"{OUT}/{r['id']}.jpg"
    cuisine = r.get("cuisine", "") or ""
    queries = [f"{r['name']} recipe", f"{r['name']} dish food", f"{r['name']} {cuisine}".strip(), r["name"]]
    got = False
    seen = set()
    for q in queries:
        for u in candidates(q):
            if u in seen:
                continue
            seen.add(u)
            if try_download(u, path):
                got = True
                break
        if got:
            break
    with lock:
        done[0] += 1
        if not got:
            unfixed[r["id"]] = r["name"]
        if done[0] % 10 == 0 or done[0] == len(todo):
            json.dump(unfixed, open("/tmp/rehost-unfixed.json", "w"))
            saved = len([f for f in os.listdir(OUT) if f.endswith('.jpg')])
            print(f"  {done[0]}/{len(todo)}  saved-total={saved} unfixed={len(unfixed)}", flush=True)

with ThreadPoolExecutor(max_workers=6) as ex:
    list(ex.map(work, todo))
json.dump(unfixed, open("/tmp/rehost-unfixed.json", "w"))
saved = len([f for f in os.listdir(OUT) if f.endswith('.jpg')])
print(f"DONE: {saved} images self-hosted, {len(unfixed)} unfixed", flush=True)
