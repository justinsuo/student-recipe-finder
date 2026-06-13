#!/usr/bin/env python3
"""Re-source images for recipes whose current photo fails to load without a
Referer (shows an emoji in the app). Every replacement is validated the SAME
strict way the app loads it (browser UA, NO Referer) so it actually renders.
Prefers reliably-hotlink-friendly sources. Writes /tmp/image-fixes.json."""
import json, urllib.request, urllib.parse, re, time, random, threading
from concurrent.futures import ThreadPoolExecutor

fails = json.load(open("/tmp/image-failures.json"))["rows"]
print(f"recipes to re-image: {len(fails)}", flush=True)
try:
    fixes = json.load(open("/tmp/image-fixes.json"))
except Exception:
    fixes = {}
try:
    unfixed = json.load(open("/tmp/image-unfixed.json"))
except Exception:
    unfixed = {}
todo = [r for r in fails if r["id"] not in fixes]

UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17 Safari/605.1.15"}
# Browser UA for SEARCH (sites need it), but VALIDATION omits Referer to mimic the app.
SEARCH_UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"}
# Domains that reliably serve images without a Referer (no hotlink protection).
RELIABLE = ("wikimedia.org", "wikipedia.org", "staticflickr.com", "flickr.com",
            "upload.wikimedia", "media.istockphoto", "images.unsplash.com",
            "images.pexels.com", "cdn.pixabay.com", "live.staticflickr.com",
            "i.imgur.com", "raw.githubusercontent")

def get(u, headers, timeout=14, ref=None):
    h = dict(headers)
    if ref:
        h["Referer"] = ref
    return urllib.request.urlopen(urllib.request.Request(u, headers=h), timeout=timeout)

def loads_in_app(u):
    """Strict: 200 + image + body, NO Referer (exactly what expo-image gets)."""
    if not u or not u.startswith("http"):
        return False
    for _ in range(2):
        try:
            r = get(u, UA)
            ct = r.headers.get("Content-Type", "")
            cl = int(r.headers.get("Content-Length") or 0)
            chunk = r.read(2048)
            if r.status == 200 and ct.startswith("image") and (cl == 0 or cl > 6000) and len(chunk) > 500:
                return True
        except Exception:
            continue
    return False

def ddg(q):
    try:
        html = get(f"https://duckduckgo.com/?q={urllib.parse.quote(q)}&iax=images&ia=images", SEARCH_UA).read().decode("utf-8", "ignore")
        m = re.search(r"vqd=([\d-]+)", html)
        if not m:
            return []
        d = json.load(get(f"https://duckduckgo.com/i.js?l=us-en&o=json&q={urllib.parse.quote(q)}&vqd={m.group(1)}&f=,,,,,&p=1", SEARCH_UA, ref="https://duckduckgo.com/"))
        return [r.get("image", "") for r in d.get("results", []) if r.get("width", 0) >= 400]
    except Exception:
        return []

def wikimedia(q):
    try:
        api = ("https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search"
               f"&gsrsearch={urllib.parse.quote(q)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url&iiurlwidth=900")
        d = json.load(get(api, SEARCH_UA))
        pages = (d.get("query", {}) or {}).get("pages", {})
        out = []
        for p in pages.values():
            for ii in p.get("imageinfo", []):
                u = ii.get("thumburl") or ii.get("url")
                if u and re.search(r"\.(jpg|jpeg|png)$", u, re.I):
                    out.append(u)
        return out
    except Exception:
        return []

def openverse(q):
    try:
        d = json.load(get(f"https://api.openverse.org/v1/images/?q={urllib.parse.quote(q)}&size=medium&page_size=8", SEARCH_UA))
        return [r.get("url", "") for r in d.get("results", [])]
    except Exception:
        return []

def bing(q):
    try:
        html = get(f"https://www.bing.com/images/search?q={urllib.parse.quote(q)}&first=1", SEARCH_UA).read().decode("utf-8", "ignore")
        return [m.replace("\\/", "/") for m in (re.findall(r'murl&quot;:&quot;(.*?)&quot;', html) or re.findall(r'"murl":"(.*?)"', html))]
    except Exception:
        return []

def best_for(name, cuisine):
    queries = [f"{name} recipe dish", f"{name} food", f"{name} {cuisine}".strip()]
    # 1) gather candidates from search engines, rank reliable-domain ones first
    pool = []
    for q in queries[:2]:
        pool += ddg(q)
    pool += [u for q in queries[:1] for u in bing(q)]
    pool.sort(key=lambda u: any(d in u.lower() for d in RELIABLE), reverse=True)
    for u in pool[:14]:
        if loads_in_app(u):
            return u
    # 2) reliable hotlink-friendly sources (always load without referer)
    for src in (wikimedia, openverse):
        for q in queries:
            for u in src(q):
                if loads_in_app(u):
                    return u
            time.sleep(0.1)
    return None

lock = threading.Lock()
done = [0]

def work(r):
    time.sleep(random.uniform(0, 0.5))
    try:
        u = best_for(r["name"], r.get("cuisine", ""))
    except Exception:
        u = None
    with lock:
        done[0] += 1
        if u:
            fixes[r["id"]] = u
        else:
            unfixed[r["id"]] = r["name"]
        if done[0] % 20 == 0 or done[0] == len(todo):
            json.dump(fixes, open("/tmp/image-fixes.json", "w"))
            json.dump(unfixed, open("/tmp/image-unfixed.json", "w"))
            print(f"  {done[0]}/{len(todo)}  fixed={len(fixes)} unfixed={len(unfixed)}", flush=True)

with ThreadPoolExecutor(max_workers=8) as ex:
    list(ex.map(work, todo))
json.dump(fixes, open("/tmp/image-fixes.json", "w"))
json.dump(unfixed, open("/tmp/image-unfixed.json", "w"))
print(f"DONE: fixed {len(fixes)}, unfixed {len(unfixed)}", flush=True)
