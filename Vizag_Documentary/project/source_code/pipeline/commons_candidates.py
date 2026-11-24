"""Collect freely-licensed image candidates (metadata only) from Wikipedia infoboxes and Commons search."""
import sys, json, re, time, html, pathlib, requests
ROOT = pathlib.Path(sys.argv[1])
UA = {"User-Agent": "DocumentaryResearchBot/1.0 (educational documentary asset research)"}
strip = lambda s: html.unescape(re.sub("<[^>]+>", "", s or "")).strip()
OK = re.compile(r"(CC BY|CC-BY|CC0|Public domain|GODL|PD-)", re.I); BAD = re.compile(r"(NC|ND|fair use|non-free)", re.I)
def api(url, params):
    for a in range(5):
        r = requests.get(url, params={**params, "format": "json"}, headers=UA, timeout=40)
        if r.status_code == 200: return r.json()
        time.sleep(6 * (a + 1))
    return {}
def info(titles):
    d = api("https://commons.wikimedia.org/w/api.php", {"action": "query", "titles": "|".join(titles), "prop": "imageinfo", "iiprop": "url|size|extmetadata|mime", "iiurlwidth": 1280})
    out = []
    for p in d.get("query", {}).get("pages", {}).values():
        ii = (p.get("imageinfo") or [{}])[0]; md = ii.get("extmetadata", {})
        lic = strip(md.get("LicenseShortName", {}).get("value", ""))
        if not ii or not OK.search(lic) or BAD.search(lic) or ii.get("mime") not in ("image/jpeg", "image/png"): continue
        out.append({"title": p["title"], "thumb": ii.get("thumburl") or ii.get("url"), "orig_url": ii.get("url"), "page": ii.get("descriptionurl"), "license": lic,
                    "license_url": strip(md.get("LicenseUrl", {}).get("value", "")), "artist": strip(md.get("Artist", {}).get("value", ""))[:200],
                    "description": strip(md.get("ImageDescription", {}).get("value", ""))[:300], "date": strip(md.get("DateTimeOriginal", {}).get("value", ""))[:40],
                    "width": ii.get("width"), "height": ii.get("height")})
    return out
people = {"p_naidu": "N. Chandrababu Naidu", "p_jagan": "Y. S. Jagan Mohan Reddy", "p_lokesh": "Nara Lokesh", "p_vaishnaw": "Ashwini Vaishnaw", "p_modi": "Narendra Modi",
          "p_kurian": "Thomas Kurian", "p_amarnath": "Gudivada Amarnath", "p_gurumoorthy": "Maddila Gurumoorthy", "p_mittal": "Lakshmi Mittal", "p_pawan": "Pawan Kalyan",
          "p_rammohan": "Kinjarapu Ram Mohan Naidu", "p_kumaraswamy": "H. D. Kumaraswamy", "p_adani": "Gautam Adani", "p_pichai": "Sundar Pichai"}
cands = {}
for k, t in people.items():
    d = api("https://en.wikipedia.org/w/api.php", {"action": "query", "titles": t, "prop": "pageimages", "piprop": "name", "redirects": 1})
    names = [p.get("pageimage") for p in d.get("query", {}).get("pages", {}).values() if p.get("pageimage")]
    cands[k] = info(["File:" + n for n in names]) if names else []
    print(k, [(c["title"][:60], c["license"]) for c in cands[k]], flush=True); time.sleep(1)
places = {"v_rkbeach": "RK Beach Visakhapatnam", "v_beachroad": "Beach Road Visakhapatnam", "v_port": "Visakhapatnam port ships", "v_dolphin": "Dolphin's Nose Visakhapatnam",
          "v_skyline": "Visakhapatnam city skyline", "v_kailasagiri": "Kailasagiri view Visakhapatnam", "v_navy": "Eastern Naval Command", "v_ins": "INS Visakhapatnam harbour warship",
          "v_steel": "Visakhapatnam Steel Plant", "v_hudhud_sat": "Cyclone Hudhud 2014", "v_hudhud_dmg": "Hudhud Visakhapatnam damage", "v_simhachalam": "Simhachalam temple",
          "v_kambalakonda": "Kambalakonda", "v_mudasarlova": "Mudasarlova", "v_bhogapuram": "Bhogapuram airport", "v_vizag_airport": "Visakhapatnam Airport",
          "v_rushikonda": "Rushikonda", "v_submarine": "INS Kursura submarine museum", "v_srikakulam": "Srikakulam", "h_hitec": "Cyber Towers HITEC City",
          "h_cyberabad": "Hyderabad Financial District skyline", "h_charminar": "Charminar", "a_amaravati": "Amaravati Andhra Pradesh capital", "a_secretariat": "Andhra Pradesh Secretariat Velagapudi",
          "m_telangana": "Telangana formation day", "g_google_dc": "Google data center", "g_cable": "submarine communications cable cross section", "g_cable_ship": "cable laying ship",
          "r_hc": "Andhra Pradesh High Court Amaravati", "v_vuda": "Visakhapatnam Vuda Park", "v_ukku": "Visakha Ukku Andhrula Hakku"}
for k, q in places.items():
    d = api("https://commons.wikimedia.org/w/api.php", {"action": "query", "list": "search", "srsearch": q + " filetype:bitmap", "srnamespace": 6, "srlimit": 12})
    titles = [s["title"] for s in d.get("query", {}).get("search", [])]
    cands[k] = [c for c in info(titles) if (c["width"] or 0) >= 1000] if titles else []
    print(k, len(cands[k]), [c["title"][:50] for c in cands[k][:5]], flush=True); time.sleep(1)
json.dump(cands, open(ROOT / "work/commons_candidates.json", "w"), indent=1)
