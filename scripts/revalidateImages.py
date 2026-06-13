#!/usr/bin/env python3
"""Re-validate every recipe image URL the way expo-image / SDWebImage loads it:
a plain GET with a browser UA but NO Referer, following redirects. URLs that
fail this are the ones that show an emoji in the app (hotlink protection, 403,
dead links). Writes the failing recipe ids to /tmp/image-failures.json."""
import json, urllib.request, threading
from concurrent.futures import ThreadPoolExecutor

rows = json.load(open("/tmp/all-recipe-urls.json"))
# unique URLs (variants share a photo)
url_to_ids = {}
for r in rows:
    if r["url"]:
        url_to_ids.setdefault(r["url"], []).append(r["id"])
urls = list(url_to_ids.keys())
print(f"recipes: {len(rows)} | unique image URLs: {len(urls)}", flush=True)

# Browser UA, NO Referer — mimics expo-image's request.
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17 Safari/605.1.15"}

def loads_ok(u):
    for _ in range(2):
        try:
            req = urllib.request.Request(u, headers=UA)  # deliberately no Referer
            r = urllib.request.urlopen(req, timeout=14)
            ct = r.headers.get("Content-Type", "")
            cl = int(r.headers.get("Content-Length") or 0)
            # read a chunk to confirm body is actually served
            chunk = r.read(2048)
            if r.status == 200 and ct.startswith("image") and (cl == 0 or cl > 6000) and len(chunk) > 500:
                return True
        except Exception:
            continue
    return False

lock = threading.Lock()
bad_urls = []
done = [0]

def work(u):
    ok = loads_ok(u)
    with lock:
        done[0] += 1
        if not ok:
            bad_urls.append(u)
        if done[0] % 200 == 0 or done[0] == len(urls):
            print(f"  {done[0]}/{len(urls)}  bad so far: {len(bad_urls)}", flush=True)

with ThreadPoolExecutor(max_workers=12) as ex:
    list(ex.map(work, urls))

bad_ids = []
for u in bad_urls:
    bad_ids.extend(url_to_ids[u])
out = {"bad_urls": bad_urls, "bad_ids": bad_ids,
       "rows": [r for r in rows if r["id"] in set(bad_ids)]}
json.dump(out, open("/tmp/image-failures.json", "w"))
print(f"DONE: {len(bad_urls)} failing URLs → {len(bad_ids)} recipes show an emoji", flush=True)
