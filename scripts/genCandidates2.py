#!/usr/bin/env python3
"""Generate a fresh batch of famous-dish candidates from deep-cut regional
cuisines + dish categories not yet well covered, deduped against the (now large)
catalog. Writes new candidates to /tmp/gen-candidates2.json."""
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

REGIONS = ["Sichuan","Cantonese","Hunan","Taiwanese","Okinawan","Punjabi","South Indian","Kerala",
"Bengali","Gujarati","Hyderabadi","Sri Lankan","Nepali","Burmese","Laotian","Cambodian","Singaporean",
"Malaysian","Sumatran","Oaxacan","Yucatecan","Pueblan","Sicilian","Tuscan","Neapolitan","Roman",
"Basque","Catalan","Andalusian","Provencal","Alsatian","Bavarian","Hungarian","Georgian","Romanian",
"Ukrainian","Russian","Levantine","Yemeni","Egyptian","Tunisian","Algerian","Senegalese","Ghanaian",
"Kenyan","South African","Ethiopian","Argentine","Chilean","Colombian","Venezuelan","Cuban",
"Puerto Rican","Dominican","Salvadoran","Guatemalan","Bolivian","Ecuadorian","Uruguayan","Quebecois",
"Cajun","Creole","Soul food","Tex-Mex","New England","Pacific Northwest","Hawaiian","Portuguese",
"Scandinavian","Dutch","Belgian","Austrian","Swiss","Croatian","Greek island","Turkish Anatolian"]
CATS = ["smoothies and breakfast drinks","overnight oats and breakfast bowls","grain and Buddha bowls",
"flatbreads and savory pancakes worldwide","dumplings and potstickers worldwide","skewers and kebabs worldwide",
"stuffed vegetables worldwide","fritters and savory pancakes worldwide","savory pies and pastries worldwide",
"cold noodle dishes worldwide","one-pot pasta dinners","sheet-pan dinners","stir-fries worldwide",
"regional curries","tacos by filling","gourmet sandwiches and subs","wraps and rolls worldwide",
"hearty salads with protein","soups and broths worldwide","stews and braises worldwide",
"meal-prep lunch boxes","high-protein breakfasts","vegan comfort food","vegetarian protein mains",
"egg dishes worldwide","rice porridge and congee styles","stuffed breads and buns","quesadillas and melts",
"casseroles and bakes","cold summer dishes","spicy noodle soups","street snacks worldwide",
"healthy dessert bowls","no-bake desserts","fruit-based desserts worldwide"]

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
json.dump(new, open("/tmp/gen-candidates2.json","w"))
print("NEW candidates after dedupe vs catalog:", len(new))
from collections import Counter
print("by mealType:", dict(Counter(x["mealType"] for x in new)))
