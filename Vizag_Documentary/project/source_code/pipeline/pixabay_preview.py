"""Pass 2: fetch candidate previews for refined queries; build labelled preview sheets for manual selection."""
import os, sys, json, io, time, requests, pathlib
from PIL import Image, ImageDraw, ImageFont
KEY = os.environ["PIXABAY_API_KEY"]; ROOT = pathlib.Path(sys.argv[1]); qfile = sys.argv[2]
exclude = set(int(x) for x in open(ROOT/"work/stock_keep_pass1.txt").read().split())
exclude |= {s["id"] for s in json.load(open(ROOT/"work/pixabay_selected.json"))}
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
qs = [l.strip() for l in open(qfile) if l.strip() and not l.startswith("#")]
db = {}; tiles = []
for q in qs:
    r = requests.get("https://pixabay.com/api/videos/", params={"key": KEY, "q": q, "per_page": 30, "safesearch": "true"}, timeout=30)
    hits = [h for h in r.json().get("hits", []) if h["id"] not in exclude and h["videos"]["medium"]["height"] <= h["videos"]["medium"]["width"]] if r.status_code == 200 else []
    for h in hits[:8]:
        db[h["id"]] = h
        try: im = Image.open(io.BytesIO(requests.get(h["videos"]["tiny"]["thumbnail"], timeout=20).content)).convert("RGB")
        except Exception: im = Image.new("RGB", (320, 180))
        tiles.append((q, h, im))
    time.sleep(0.5)
json.dump(db, open(ROOT/f"work/preview_db_{pathlib.Path(qfile).stem}.json", "w"))
per = 32
for p in range(0, len(tiles), per):
    sheet = Image.new("RGB", (8*240, 4*160), "black"); d = ImageDraw.Draw(sheet)
    for i, (q, h, im) in enumerate(tiles[p:p+per]):
        x, y = (i % 8)*240, (i // 8)*160
        sheet.paste(im.resize((240, 135)), (x, y))
        d.text((x+3, y+137), f"{h['id']} {h['duration']}s", fill="yellow", font=font)
        if i % 8 == 0: d.text((x+3, y+2), q[:28], fill="cyan", font=font)
    sheet.save(ROOT/f"work/contact/prev_{pathlib.Path(qfile).stem}_{p//per}.jpg", quality=78)
print("tiles", len(tiles))
