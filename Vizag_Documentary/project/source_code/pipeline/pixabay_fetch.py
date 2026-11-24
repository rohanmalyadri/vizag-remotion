"""Search Pixabay video API per beat, rank candidates, download chosen MP4s, validate.
Reads PIXABAY_API_KEY from the environment. Never logs the key."""
import os, sys, json, math, time, subprocess, pathlib, re, requests
sys.path.insert(0, os.path.dirname(__file__))
from stock_queries import QUERIES
KEY = os.environ["PIXABAY_API_KEY"]
ROOT = pathlib.Path(sys.argv[1]); OUT = ROOT / "assets/stock_videos"; OUT.mkdir(parents=True, exist_ok=True)
CAND = ROOT / "work/pixabay_candidates.json"; SEL = ROOT / "work/pixabay_selected.json"
selected = json.load(open(SEL)) if SEL.exists() else []
used_ids = {s["id"] for s in selected}
cands_all = json.load(open(CAND)) if CAND.exists() else {}
done_queries = {(s["beat"], s["query"]) for s in selected}

def search(q, page=1):
    for attempt in range(4):
        r = requests.get("https://pixabay.com/api/videos/", params={"key": KEY, "q": q, "per_page": 50, "page": page, "safesearch": "true"}, timeout=30)
        if r.status_code == 200: return r.json().get("hits", [])
        if r.status_code == 429: time.sleep(20); continue
        print("HTTP", r.status_code, "for", q); return []
    return []

def score(h, q, req):
    tags = [t.strip().lower() for t in h["tags"].split(",")]
    tagtext = " ".join(tags)
    qw = [w for w in q.lower().split() if len(w) > 2]
    s = sum(2.0 for w in qw if w in tagtext)
    if not any(r in tagtext for r in req): s -= 6
    v = h["videos"]; W = v["large"]["width"] or v["medium"]["width"]; H = v["large"]["height"] or v["medium"]["height"]
    if H > W: s -= 20                       # vertical
    if W >= 3840: s += 1.5
    elif W >= 1920: s += 1.0
    else: s -= 3
    d = h["duration"]
    s += 1.0 if 7 <= d <= 40 else (0 if d >= 5 else -4)
    s += 0.35 * math.log10(1 + h.get("downloads", 0))
    if any(bad in tagtext for bad in ["animation", "3d render", "cartoon", "green screen", "chroma", "text", "logo", "intro", "loop background", "abstract background", "ai generated", "generated"]): s -= 4
    return s

def pick_rendition(h):
    v = h["videos"]
    for k in ("medium", "large"):
        if v[k]["url"] and v[k]["width"] >= 1920: return k, v[k]
    for k in ("large", "medium"):
        if v[k]["url"]: return k, v[k]

for beat, q, n, req in QUERIES:
    if (beat, q) in done_queries: continue
    hits = search(q)
    ranked = sorted(hits, key=lambda h: -score(h, q, req))
    cands_all[f"{beat}|{q}"] = [{"id": h["id"], "score": round(score(h, q, req), 2), "tags": h["tags"], "dur": h["duration"],
                                 "thumb": h["videos"]["tiny"]["thumbnail"], "page": h["pageURL"]} for h in ranked[:12]]
    got = 0
    for h in ranked:
        if got >= n: break
        if h["id"] in used_ids or score(h, q, req) < 0: continue
        k, rend = pick_rendition(h)
        fn = OUT / f"px_{h['id']}.mp4"
        if not fn.exists():
            try:
                with requests.get(rend["url"], stream=True, timeout=120) as r:
                    r.raise_for_status()
                    with open(fn, "wb") as f:
                        for chunk in r.iter_content(1 << 20): f.write(chunk)
            except Exception as e:
                print("download failed", h["id"], e); fn.unlink(missing_ok=True); continue
        pr = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate,codec_name:format=duration",
                             "-of", "json", str(fn)], capture_output=True, text=True)
        try:
            info = json.loads(pr.stdout); st = info["streams"][0]; dur = float(info["format"]["duration"])
        except Exception:
            print("invalid file", fn); fn.unlink(missing_ok=True); continue
        used_ids.add(h["id"]); got += 1
        selected.append({"id": h["id"], "beat": beat, "query": q, "file": str(fn.relative_to(ROOT)), "page": h["pageURL"], "user": h["user"],
                         "user_id": h["user_id"], "tags": h["tags"], "duration": dur, "width": st["width"], "height": st["height"],
                         "fps": st["r_frame_rate"], "codec": st["codec_name"], "rendition": k, "thumb": h["videos"]["medium"]["thumbnail"],
                         "license": "Pixabay Content License"})
        print(f"{beat:22s} {q[:34]:34s} -> {h['id']} {st['width']}x{st['height']} {dur:.1f}s  [{h['tags'][:60]}]", flush=True)
    json.dump(selected, open(SEL, "w"), indent=1); json.dump(cands_all, open(CAND, "w"), indent=1)
    time.sleep(0.7)
print("TOTAL selected", len(selected))
