#!/usr/bin/env python3
"""Resumable recipe image fetcher. Free sources (DuckDuckGo food-domain → Bing →
Openverse → Wikimedia), with optional Google CSE first if GOOGLE_CSE_KEY/ID set.
Validates each chosen image. Checkpoints to /tmp/recipe-image-map.json."""
import urllib.request, urllib.parse, json, re, os, time, random, threading
from concurrent.futures import ThreadPoolExecutor

IN = "/tmp/recipes-need-images.json"
OUT = "/tmp/recipe-image-map.json"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"}
GKEY = os.environ.get("GOOGLE_CSE_KEY", "")
GCX = os.environ.get("GOOGLE_CSE_ID", "")

FOOD = ("allrecipes","seriouseats","foodnetwork","bonappetit","budgetbytes","simplyrecipes",
"cookieandkate","minimalistbaker","loveandlemons","tasteofhome","delish","eatingwell",
"recipetineats","themediterraneandish","skinnytaste","gimmesomeoven","wikimedia","epicurious",
"food.com","bbcgoodfood","kingarthur","sallysbaking","wellplated","feelgoodfoodie","fitmamarealfood",
"thekitchn","nytimes","ambitiouskitchen","pinchofyum","damndelicious","halfbakedharvest","jocooks",
"nonnafood","eatwell101","spendwithpennies","themodernproper","cafedelites","thespruceeats")
BAD = ("lookaside.","fbcdn","blogger.googleusercontent","instagram","pinimg.com/originals/x")

def get(u, ref=None, timeout=15):
    h = dict(UA)
    if ref: h["Referer"] = ref
    return urllib.request.urlopen(urllib.request.Request(u, headers=h), timeout=timeout)

def valid(u):
    if not u or not u.startswith("http"): return False
    if any(b in u for b in BAD): return False
    try:
        r = get(u, timeout=12); ct = r.headers.get("Content-Type",""); cl = int(r.headers.get("Content-Length") or 0)
        return r.status == 200 and ct.startswith("image") and cl > 12000
    except Exception:
        return False

def google(q):
    if not (GKEY and GCX): return None
    try:
        p = urllib.parse.urlencode({"key":GKEY,"cx":GCX,"q":q,"searchType":"image","num":5,"safe":"active","imgType":"photo"})
        d = json.load(get("https://www.googleapis.com/customsearch/v1?"+p))
        for it in d.get("items",[]):
            if valid(it.get("link","")): return it["link"]
    except Exception:
        return None
    return None

def ddg(q):
    try:
        html = get(f"https://duckduckgo.com/?q={urllib.parse.quote(q)}&iax=images&ia=images").read().decode("utf-8","ignore")
        m = re.search(r"vqd=([\d-]+)", html)
        if not m: return None
        d = json.load(get(f"https://duckduckgo.com/i.js?l=us-en&o=json&q={urllib.parse.quote(q)}&vqd={m.group(1)}&f=,,,,,&p=1", ref="https://duckduckgo.com/"))
        res = d.get("results", [])
        def sc(r):
            dom = (r.get("source","")+" "+r.get("url","")).lower()
            return (any(f in dom for f in FOOD), min(r.get("width",0), r.get("height",0)))
        for r in sorted(res, key=sc, reverse=True):
            if r.get("width",0) >= 400 and r.get("height",0) >= 300 and valid(r.get("image","")):
                return r["image"]
    except Exception:
        return None
    return None

def bing(q):
    try:
        html = get(f"https://www.bing.com/images/search?q={urllib.parse.quote(q)}&first=1").read().decode("utf-8","ignore")
        urls = [m.replace("\\/","/") for m in (re.findall(r'murl&quot;:&quot;(.*?)&quot;', html) or re.findall(r'"murl":"(.*?)"', html))]
        urls.sort(key=lambda u: any(f in u.lower() for f in FOOD), reverse=True)
        for u in urls[:8]:
            if valid(u): return u
    except Exception:
        return None
    return None

def openverse(q):
    try:
        d = json.load(get(f"https://api.openverse.org/v1/images/?q={urllib.parse.quote(q)}&license_type=commercial&size=medium&page_size=6"))
        for r in d.get("results", []):
            if valid(r.get("url","")): return r["url"]
    except Exception:
        return None
    return None

def fetch(rec):
    name = rec["name"]; cuisine = rec.get("cuisine","")
    queries = [f"{name} recipe", f"{name} {cuisine} dish", name]
    for src in (google, ddg, bing, openverse):
        for q in queries[:2 if src is not ddg else 3]:
            u = src(q)
            if u: return u, src.__name__
            time.sleep(0.2)
    return None, None

lock = threading.Lock()
def load(path, default):
    try: return json.load(open(path))
    except Exception: return default
results = load(OUT, {})
failed = load("/tmp/recipe-image-failed.json", {})
recipes = load(IN, [])
todo = [r for r in recipes if r["id"] not in results]
print(f"total {len(recipes)} | already done {len(results)} | todo {len(todo)}", flush=True)
done = [0]
def work(r):
    time.sleep(random.uniform(0, 0.6))
    try:
        u, s = fetch(r)
    except Exception:
        u, s = None, None
    with lock:
        if u:
            results[r["id"]] = u
        else:
            failed[r["id"]] = r["name"]
        done[0] += 1
        if done[0] % 10 == 0 or done[0] == len(todo):
            json.dump(results, open(OUT,"w"))
            json.dump(failed, open("/tmp/recipe-image-failed.json","w"))
            print(f"  {done[0]}/{len(todo)}  ok={len(results)} fail={len(failed)}", flush=True)

with ThreadPoolExecutor(max_workers=6) as ex:
    list(ex.map(work, todo))
json.dump(results, open(OUT,"w")); json.dump(failed, open("/tmp/recipe-image-failed.json","w"))
print(f"DONE: {len(results)} images, {len(failed)} failed", flush=True)
