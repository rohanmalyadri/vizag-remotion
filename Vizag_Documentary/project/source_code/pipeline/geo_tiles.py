"""Download Terrarium DEM (AWS Open Data, Mapzen terrain tiles) + EOX Sentinel-2 cloudless 2016 (CC BY 4.0)
and assemble per-region elevation grids (Int16 .bin) and texture JPGs in Web-Mercator space."""
import math, io, json, sys, os, pathlib, requests, numpy as np
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
OUT = pathlib.Path(sys.argv[1]); CACHE = pathlib.Path(sys.argv[2]); CACHE.mkdir(parents=True, exist_ok=True)
def lon2x(lon, z): return (lon + 180) / 360 * 2**z
def lat2y(lat, z): r = math.radians(lat); return (1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * 2**z
S = requests.Session(); S.headers["User-Agent"] = "DocumentaryMapResearch/1.0"
def fetch(url, path):
    if path.exists() and path.stat().st_size > 0: return path.read_bytes()
    for a in range(4):
        try:
            r = S.get(url, timeout=40)
            if r.status_code == 200: path.write_bytes(r.content); return r.content
        except Exception: pass
    return None
def mosaic(kind, z, bbox):
    s, w, n, e = bbox
    x0, x1 = int(lon2x(w, z)), int(lon2x(e, z)); y0, y1 = int(lat2y(n, z)), int(lat2y(s, z))
    tiles = [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
    def get(t):
        x, y = t
        if kind == "dem": url = f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
        else: url = f"https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg"
        b = fetch(url, CACHE / f"{kind}_{z}_{x}_{y}")
        return t, (Image.open(io.BytesIO(b)).convert("RGB") if b else Image.new("RGB", (256, 256)))
    with ThreadPoolExecutor(8) as ex: res = dict(ex.map(get, tiles))
    W, H = (x1 - x0 + 1) * 256, (y1 - y0 + 1) * 256
    img = Image.new("RGB", (W, H))
    for (x, y), im in res.items(): img.paste(im, ((x - x0) * 256, (y - y0) * 256))
    # crop to exact bbox
    px = lambda lon: (lon2x(lon, z) - x0) * 256; py = lambda lat: (lat2y(lat, z) - y0) * 256
    return img.crop((int(px(w)), int(py(n)), int(px(e)), int(py(s))))
regions = json.load(open(sys.argv[3]))
meta = {}
for name, R in regions.items():
    dem = mosaic("dem", R["demZ"], R["bbox"])
    a = np.asarray(dem).astype(np.float32)
    elev = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
    tw, th = R["grid"]
    elev_img = Image.fromarray(elev).resize((tw, th), Image.BILINEAR)
    e = np.clip(np.asarray(elev_img), -32000, 32000).astype(np.int16)
    e.tofile(OUT / f"{name}_dem.bin")
    if R.get("texZ"):
        tex = mosaic("tex", R["texZ"], R["bbox"])
        maxw = R.get("texMax", 4096)
        if tex.width > maxw: tex = tex.resize((maxw, int(tex.height * maxw / tex.width)), Image.LANCZOS)
        tex.save(OUT / f"{name}_s2.jpg", quality=90)
    s, w, n, ee = R["bbox"]
    meta[name] = {"bbox": R["bbox"], "grid": [tw, th], "min": float(e.min()), "max": float(e.max()),
                  "mercX": [lon2x(w, 0), lon2x(ee, 0)], "mercY": [lat2y(n, 0), lat2y(s, 0)], "tex": bool(R.get("texZ"))}
    print(name, meta[name], flush=True)
json.dump(meta, open(OUT / "regions.json", "w"), indent=1)
