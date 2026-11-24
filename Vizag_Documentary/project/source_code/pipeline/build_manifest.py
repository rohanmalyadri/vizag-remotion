"""asset_manifest.csv + source_references.csv from the actual plan and downloaded assets."""
import json, csv, sys, pathlib, collections, re
from PIL import Image
ROOT = pathlib.Path(sys.argv[1])
plan = json.load(open(ROOT / "project/source_code/remotion/src/plan.json"))
shots = json.load(open(ROOT / "work/shots.json"))
SEL = {s["id"]: s for s in json.load(open(ROOT / "work/pixabay_selected.json"))}
PH = {}
for f in ["work/commons_selected.json", "work/commons_selected2.json"]:
    p = ROOT / f
    if p.exists():
        for r in json.load(open(p)): PH[pathlib.Path(r["file"]).stem] = r
scene_of = {}
for s in plan["segments"]:
    blob = json.dumps(s)
    for m in re.findall(r'stock/(\d+_\d)\.mp4', blob): scene_of.setdefault(m, []).append(s["id"])
    for m in re.findall(r'photos/([\w\-]+)\.jpg', blob): scene_of.setdefault("photo:" + m, []).append(s["id"])
rows = []
uses = collections.Counter(x["id"] for x in shots)
for sh in shots:
    v = SEL[sh["id"]]
    rows.append([f"px_{sh['id']}", "stock video", v["file"], v["page"], "Pixabay", v["user"], "Pixabay Content License", f"{v['duration']:.1f}s", f"{v['width']}x{v['height']}",
                 f"{sh['in']:.2f}s", f"{sh['in'] + sh['dur']:.2f}s", uses[sh["id"]], ";".join(scene_of.get(sh["key"], [])), f"use #{sh['key'][-1]} placed at {sh['t']:.2f}s"])
unused = [i for i in SEL if i not in uses]
for i in unused:
    v = SEL[i]
    rows.append([f"px_{i}", "stock video (downloaded, not used)", v["file"], v["page"], "Pixabay", v["user"], "Pixabay Content License", f"{v['duration']:.1f}s", f"{v['width']}x{v['height']}", "", "", 0, "", "rejected in review / not needed"])
pib = {"pib_mou_group": ("pib_image001FHBK.jpg", 2179035), "pib_mou_panel": ("pib_image003VUNY.jpg", 2178852), "pib_vaishnaw_talk": ("pib_image0037G4D.jpg", 2179035),
       "pib_ground_shovels": ("pib_WhatsAppImage2026-04-28at13.51.14VWPO.jpeg", 2256187), "pib_ground_stage": ("pib_WhatsAppImage2026-04-28at12.38.21(1)PFFK.jpeg", 2256187),
       "pib_mou_group_kurian": ("pib_image001FHBK.jpg (crop)", 2179035)}
for key in sorted({k.split(":")[1] for k in scene_of if k.startswith("photo:")}):
    f = ROOT / "project/source_code/remotion/public/photos" / f"{key}.jpg"
    res = "x".join(map(str, Image.open(f).size)) if f.exists() else "MISSING"
    if key in pib:
        rows.append([key, "official photograph", f"assets/government_documents/pib/{pib[key][0]}", f"https://www.pib.gov.in/PressReleasePage.aspx?PRID={pib[key][1]}", "Press Information Bureau, Govt. of India", "PIB", "Government Open Data License – India", "still", res, "", "", len(scene_of["photo:" + key]), ";".join(scene_of["photo:" + key]), ""])
    else:
        src = key.replace("_crop", "_1") if key == "p_jagan_crop" else key
        r = PH.get(src, {})
        rows.append([key, "photograph", f"assets/web_photographs/{key}.jpg", r.get("source_page", ""), "Wikimedia Commons", (r.get("artist") or "")[:80], r.get("license", ""), "still", res, "", "", len(scene_of["photo:" + key]), ";".join(scene_of["photo:" + key]), (r.get("title") or "") + (" (cropped)" if "crop" in key else "")])
data = [
    ["geo_s2_vizag", "satellite imagery", "public/geo/*_s2.jpg", "https://s2maps.eu", "EOX IT Services GmbH", "EOX (modified Copernicus Sentinel data 2016)", "CC BY 4.0", "", "", "", "", "", "3D terrain scenes", "Sentinel-2 cloudless 2016"],
    ["geo_dem", "elevation/bathymetry", "public/geo/*_dem.bin", "https://registry.opendata.aws/terrain-tiles/", "Mapzen/Tilezen terrain tiles (AWS Open Data)", "SRTM, ETOPO1, GMTED etc.", "Open data (attribution)", "", "", "", "", "", "3D terrain scenes", ""],
    ["ne_admin", "boundaries/rivers", "assets/maps/ne_*.geojson", "https://www.naturalearthdata.com", "Natural Earth", "Natural Earth", "Public domain", "", "", "", "", "", "Bifurcation, maps", "India point-of-view admin-0 used"],
    ["osm", "place coordinates/polygons", "assets/maps/places_osm.json, osm_polygons.json", "https://www.openstreetmap.org", "OpenStreetMap (Nominatim)", "OSM contributors", "ODbL 1.0", "", "", "", "", "", "Mudasarlova, airport, steel plant", ""],
    ["cables", "submarine cable routes", "assets/maps/cable-geo.json", "https://www.submarinecablemap.com", "TeleGeography", "TeleGeography", "CC BY-SA 4.0", "", "", "", "", "", "CableMap", ""],
    ["fonts", "typefaces", "public/fonts", "https://fontsource.org", "Fontsource", "Rasmus Andersson (Inter); Adobe (Source Serif 4); JetBrains (Mono)", "SIL OFL 1.1", "", "", "", "", "", "all", ""],
    ["sfx", "sound effects", "assets/sound_effects/*.wav", "", "Original (procedurally synthesised for this film)", "This production", "Original work", "", "48 kHz", "", "", "", "all", "see metadata/sfx_cues.csv"],
    ["narration", "voice-over", "input/vizag.mp3.mpeg", "", "Client", "Client", "Client-owned", "1075.39s", "48 kHz stereo", "0", "1075.39", 1, "all", "unaltered"],
]
rows += data
hdr = ["asset_id", "type", "local_file", "original_url", "source", "creator_or_institution", "license", "source_duration", "resolution", "in_point", "out_point", "uses", "scene_assignment", "notes"]
with open(ROOT / "metadata/asset_manifest.csv", "w", newline="") as fh:
    w = csv.writer(fh); w.writerow(hdr); w.writerows(rows)
refs = [
 ("Google India blog — Our first AI hub in India, powered by a $15 billion investment", "https://blog.google/intl/en-in/company-news/our-first-ai-hub-in-india-powered-by-a-15-billion-investment/", "company announcement"),
 ("PIB 2179035 — Vaishnaw on Google AI Hub (14 Oct 2025)", "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2179035", "government"),
 ("PIB 2178852 — Google 1-GW hyperscale data centre (14 Oct 2025)", "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2178852", "government"),
 ("PIB 2256187 — Ground-breaking of Google Cloud India AI Hub (28 Apr 2026)", "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2256187", "government"),
 ("PIB 2292165 — PM to inaugurate Bhogapuram airport (1 Aug 2026)", "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2292165", "government"),
 ("Business Today — 'Visakhapatnam will be born as AI Patnam'", "https://www.businesstoday.in/technology/story/visakhapatnam-will-be-born-as-ai-patnam-ashwini-vaishnaw-as-google-lays-data-centre-foundation-527736-2026-04-28", "news"),
 ("ANI — Kurian: Vizag AI hub connected to subsea cable", "https://www.aninews.in/news/business/visakhapatnam-ai-hub-will-be-connected-to-subsea-cable-and-serve-as-global-connectivity-center-kurian-ceo-google-cloud20251014125038/", "news"),
 ("Business Standard — Google defends $15bn Vizag AI hub amid water concerns", "https://www.business-standard.com/economy/news/google-defends-15-billion-vizag-ai-hub-amid-water-concerns-protests-126101200341_1.html", "news"),
 ("Malay Mail (AFP) — activists demand moratorium", "https://www.malaymail.com/news/world/2026/10/11/why-here-india-activists-demand-moratorium-as-googles-ai-hub-scars-land-and-sparks-water-fears/238662", "news"),
 ("Business Today — Reliance–Brookfield–Digital Realty JV $11bn", "https://www.businesstoday.in/latest/corporate/story/reliance-brookfield-digital-realty-jv-to-invest-11-billion-in-andhra-pradesh-to-build-1-gw-data-centre-503905-2025-11-27", "news"),
 ("ArcelorMittal — Foundation stone laid for AM/NS India greenfield plant", "https://corporate.arcelormittal.com/media/news/non-regulatory-news/foundation-stone-laid-for-amns-india-greenfield-steel-plant-in-andhra-pradesh-india", "company announcement"),
 ("Swarajya — ₹1.36 lakh crore AM/NS plant, 'Steel City'", "https://swarajyamag.com/news-brief/foundation-laid-for-rs-136-lakh-crore-amns-steel-plant-in-andhra-pradesh-naidu-says-it-will-create-a-steel-city", "news"),
 ("Business Standard — Bhogapuram begins commercial operations", "https://www.business-standard.com/amp/industry/aviation/visakhapatnam-airport-suspends-operations-as-flights-shift-to-new-airport-126081700173_1.html", "news"),
 ("Swarajya — Bhogapuram replaces Visakhapatnam airport from 17 Aug", "https://swarajyamag.com/news-brief/bhogapuram-airport-to-replace-visakhapatnam-airport-for-all-flights-from-17-august", "news"),
 ("The South First — Visakha Economic Region $120bn by 2032", "https://thesouthfirst.com/andhrapradesh/chandrababu-naidu-pitches-visakha-economic-region-to-niti-aayog-aims-for-120-billion-economy-by-2032/", "news"),
 ("Deccan Chronicle — CII Partnership Summit from Nov 12", "https://www.deccanchronicle.com/amp/southern-states/andhra-pradesh/cii-partnership-summit-to-kick-off-in-andhra-on-nov-12-2003436", "news"),
 ("Yo Vizag — CII Summit 2026: 73 MoUs on Day 1", "https://www.yovizag.com/cii-summit-73-mous-signed-on-first-day/", "news"),
 ("Human Rights Forum — EC for Vizag hyperscale DC is brazen injustice", "https://humanrightsforum.org/environmental-clearance-for-vizag-hyperscale-data-center-at-adavivaram-mudasarlova-is-brazen-injustice-suspend-it-immediately-hrf/", "activist statement"),
 ("Countercurrents — HRF EC statement (June 2026)", "https://countercurrents.org/2026/06/environmental-clearance-for-vizag-hyperscale-data-center-at-adavivaram-mudasarlova-is-brazen-injustice-suspend-it-immediately-hrf/", "activist statement"),
 ("Deccan Chronicle — Green Visakhapatnam flags risks", "https://www.deccanchronicle.com/southern-states/andhra-pradesh/green-visakhapatnam-flags-risks-from-data-centre-project-1977660", "news"),
 ("LiveLaw — PIL in AP High Court challenges Google–Adani project", "https://www.livelaw.in/high-court/andhra-pradesh-high-court/ap-high-court-issues-notice-pil-challenging-google-adani-data-centre-project-cites-environmental-concerns-549989", "legal news"),
 ("Newsmeter — Lokesh: 'misinformation', thermal plant ~10× water", "https://newsmeter.in/regional/andhra-pradesh/misinformation-nara-lokesh-dismisses-environmental-concerns-defends-vizag-data-centers-773852", "news"),
 ("Euronews — Finland orders pause on Google AI data centres", "https://www.euronews.com/2026/10/07/finland-orders-pause-on-google-ai-data-centre-over-environmental-concerns", "news"),
 ("CNBC — Google ordered to halt work on two data centers in Finland", "https://www.cnbc.com/2026/10/07/google-finland-data-center-halt.html", "news"),
 ("The Hans India — Jagan: Adani building data centre, Google is client", "https://www.thehansindia.com/andhra-pradesh/adani-building-data-centre-in-vizag-google-is-client-claims-jagan-1017213", "news"),
 ("Deccan Herald — Jagan lays foundation for ₹21,844 cr Adani data centre", "https://www.deccanherald.com/india/cm-jagan-mohan-reddy-lays-foundation-for-rs-21844-cr-adani-data-centre-in-vizag-1215411.html", "news"),
 ("Business Standard (IANS) — Work begins on Adani data centre in Vizag (Feb 2019)", "https://www.business-standard.com/article/news-ians/work-begins-on-adani-group-s-data-centre-in-vizag-119021401421_1.html", "news"),
 ("The News Minute — YSRCP MP files PIL on land allotments", "https://www.thenewsminute.com/andhra-pradesh/ysrcp-mp-files-pil-challenging-ap-govts-low-cost-land-allotments-to-tech-firms", "news"),
 ("The Hans India — Lokesh slams YSRCP MP's PIL", "https://www.thehansindia.com/andhra-pradesh/lokesh-slams-ysrcps-mp-pil-against-google-ai-hub-1055737", "news"),
 ("Deloitte — Accelerating AI infrastructure investments in India", "https://www.deloitte.com/content/dam/assets-zone1/in/en/docs/services/engineering-ai-data/in-eaid-accelerating-ai-infrastructure-investments-in-india.pdf", "industry research"),
 ("KPMG — India data centre opportunity (2026)", "https://assets.kpmg.com/content/dam/kpmgsites/in/pdf/2026/07/india-data-centre-opportunity-from-emerging-demand-hub-to-integrated-data-centre-powerhouse.pdf", "industry research"),
 ("Reddit", "—", "not used: no post was found that added verifiable value; none fabricated"),
]
with open(ROOT / "metadata/source_references.csv", "w", newline="") as fh:
    w = csv.writer(fh); w.writerow(["reference", "url", "type"]); w.writerows(refs)
    for r in rows:
        if r[3] and r[1] in ("photograph", "official photograph", "stock video"):
            w.writerow([f"{r[0]} — {r[13] or r[1]} ({r[6]}; {r[5]})", r[3], "visual asset"])
print("manifest rows", len(rows))
