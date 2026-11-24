"""Search Wikimedia Commons for freely licensed photos; download a 2400px rendition + license metadata."""
import sys, json, time, re, pathlib, requests, html
ROOT = pathlib.Path(sys.argv[1]); spec = json.load(open(sys.argv[2]))
UA = {"User-Agent": "DocumentaryResearchBot/1.0 (educational documentary asset research)"}
API = "https://commons.wikimedia.org/w/api.php"
OK_LIC = re.compile(r"(CC BY|CC-BY|CC0|Public domain|PD|GODL|Attribution)", re.I)
BAD_LIC = re.compile(r"(NC|ND|fair use|non-free)", re.I)
outmeta = ROOT / "work/commons_selected.json"
sel = json.load(open(outmeta)) if outmeta.exists() else []
have = {s["title"] for s in sel}
def get(params):
    for a in range(6):
        r = requests.get(API, params={**params, "format": "json"}, headers=UA, timeout=40)
        if r.status_code == 200: return r.json()
        time.sleep(5 * (a + 1))
    return {}
strip = lambda s: html.unescape(re.sub("<[^>]+>", "", s or "")).strip()
for item in spec:
    folder = ROOT / "assets" / item["folder"]; folder.mkdir(parents=True, exist_ok=True)
    d = get({"action": "query", "generator": "search", "gsrsearch": item["q"] + " filetype:bitmap", "gsrnamespace": 6, "gsrlimit": 25,
             "prop": "imageinfo", "iiprop": "url|size|extmetadata|mime", "iiurlwidth": 1920})
    pages = sorted(d.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
    got = 0
    for p in pages:
        if got >= item.get("n", 2): break
        if p["title"] in have: continue
        ii = (p.get("imageinfo") or [{}])[0]; md = ii.get("extmetadata", {})
        lic = strip(md.get("LicenseShortName", {}).get("value", ""))
        if not OK_LIC.search(lic) or BAD_LIC.search(lic): continue
        if ii.get("mime") not in ("image/jpeg", "image/png"): continue
        if ii.get("width", 0) < item.get("minw", 1000): continue
        must = item.get("must")
        if must and not re.search(must, p["title"] + " " + strip(md.get("ImageDescription", {}).get("value", "")), re.I): continue
        url = ii.get("thumburl") or ii["url"]
        ext = ".png" if ii["mime"] == "image/png" else ".jpg"
        fn = folder / (item["key"] + f"_{got+1}" + ext)
        ok = False
        for a in range(6):
            try:
                r = requests.get(url, headers=UA, timeout=90)
                if r.status_code == 429: time.sleep(20 * (a + 1)); continue
                r.raise_for_status(); fn.write_bytes(r.content); ok = True; break
            except Exception as e:
                print("fail", p["title"], e); time.sleep(10)
        if not ok: continue
        rec = {"key": item["key"], "title": p["title"], "file": str(fn.relative_to(ROOT)), "source_page": ii.get("descriptionurl"),
               "orig_url": ii["url"], "license": lic, "license_url": strip(md.get("LicenseUrl", {}).get("value", "")),
               "artist": strip(md.get("Artist", {}).get("value", ""))[:200], "credit": strip(md.get("Credit", {}).get("value", ""))[:200],
               "description": strip(md.get("ImageDescription", {}).get("value", ""))[:300], "date": strip(md.get("DateTimeOriginal", {}).get("value", ""))[:40],
               "width": ii.get("width"), "height": ii.get("height")}
        sel.append(rec); have.add(p["title"]); got += 1
        print(f"{item['key']:24s} {lic:18s} {p['title'][:80]}", flush=True)
        time.sleep(5.0)
    if got == 0: print(f"{item['key']:24s} -- nothing suitable for: {item['q']}")
    json.dump(sel, open(outmeta, "w"), indent=1); time.sleep(1.5)
