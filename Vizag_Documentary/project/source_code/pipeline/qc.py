"""Automated quality control of the final render + plan. Writes work/qc.json (consumed by the quality report)."""
import json, re, sys, subprocess, pathlib, collections
ROOT = pathlib.Path(sys.argv[1]); video = pathlib.Path(sys.argv[2])
PUB = ROOT / "project/source_code/remotion/public"
plan = json.load(open(ROOT / "project/source_code/remotion/src/plan.json"))
shots = json.load(open(ROOT / "work/shots.json"))
res = {}
def probe(p, entries):
    return json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries", entries, "-of", "json", str(p)], capture_output=True, text=True).stdout)
if video.exists():
    pr = probe(video, "format=duration,bit_rate:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels,bit_rate,nb_frames")
    res["format"] = pr["format"]; res["streams"] = pr["streams"]
    v = [s for s in pr["streams"] if s["codec_type"] == "video"][0]; a = [s for s in pr["streams"] if s["codec_type"] == "audio"]
    vd = float(probe(video, "stream=duration")["streams"][0].get("duration", 0))
    ad = float(probe(video, "stream=duration")["streams"][1].get("duration", 0)) if a else 0
    res["video_duration"] = vd; res["audio_duration"] = ad
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(video), "-vf", "blackdetect=d=0.25:pix_th=0.06,freezedetect=n=0.0008:d=4", "-af", "astats=metadata=0,volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
    res["black_segments"] = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", out)
    res["freeze_segments"] = list(zip(re.findall(r"freeze_start: ([\d.]+)", out), re.findall(r"freeze_end: ([\d.]+)", out)))
    res["max_volume_db"] = re.findall(r"max_volume: ([-\d.]+) dB", out)
    res["mean_volume_db"] = re.findall(r"mean_volume: ([-\d.]+) dB", out)
    pk = re.findall(r"Peak level dB: ([-\d.inf]+)", out); res["peak_levels_db"] = pk[:3]
# on-screen text checks (Telugu script / romanized Telugu)
texts = []
def walk(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if k in ("clip", "img", "src", "video", "bg", "bgClip", "photo", "id", "name", "kind", "inT", "move", "grade", "pos", "k", "color", "statusColor", "tagColor", "side"): continue
            walk(v)
    elif isinstance(o, list):
        for x in o: walk(x)
    elif isinstance(o, str): texts.append(o)
walk(plan["segments"])
telugu = [t for t in texts if re.search(r"[ఀ-౿]", t)]
roman = re.compile(r"\b(anta|vasthundhi|undhi|ledhu|amma|bro|ukku|hakku|ga\b|lo\b|ki\b|kaadhu|cheyandi|ra\b|enti|ikkada|chala|neellu|kondalu|gaaru|garu|swarnandhra)\b", re.I)
roman_hits = [t for t in texts if roman.search(t)]
res["telugu_script_strings"] = telugu
res["romanized_telugu_candidates"] = roman_hits
# missing assets
miss = []
for blob in [json.dumps(plan)]:
    for m in set(re.findall(r'"((?:stock|photos|geo|fonts)/[^"]+)"', blob)):
        if not (PUB / m).exists(): miss.append(m)
res["missing_assets"] = sorted(miss)
# stock rules
c = collections.Counter(s["id"] for s in shots)
res["stock_unique_sources"] = len(c); res["stock_shots"] = len(shots)
res["stock_max_uses"] = max(c.values()); res["stock_reuse_hist"] = dict(collections.Counter(c.values()))
res["stock_max_continuous_s"] = max(s["dur"] for s in shots)
onscreen = [s["dur"] / 30 for s in plan["segments"] if s["kind"] == "stock"]
res["stock_segment_max_onscreen_s"] = max(onscreen)
# screen-time composition
tot = collections.Counter()
FOOT = {"Triptych", "SplitCompare", "WindowScene", "SteelText"}
PLATE = {"QuoteCard", "DocScene", "BetCard", "ChapterCard", "StatusFunnel", "DataGap", "CapacityBars", "Questions", "EndCard", "BetIndex"}
THREE = {"SubseaScene", "DataCentreCampus", "GigawattCubes", "Bifurcation", "CableMap", "SteelCity", "Runway3D", "OpenVizag", "WhyVizagMap", "RouteHome", "ThreeCapitals", "TwoRoles", "CityChoice", "Migration", "GoogleSites", "SteelSite", "VERMap", "NorthAndhra", "Finale", "EnvMap"}
for s in plan["segments"]:
    k = s["kind"]; d = s["dur"]
    if k == "mg":
        n = s["name"]; bg = (s.get("props") or {}).get("bg") or (s.get("props") or {}).get("bgClip")
        k = "footage composite (split/triptych/window)" if n in FOOT else ("motion graphics over footage plate" if (n in PLATE and bg) else ("3D scene" if n in THREE else "2D motion graphics"))
    elif k == "stock": k = "stock video"
    else: k = "real photograph"
    tot[k] += d
T = sum(tot.values()); res["screen_time_pct"] = {k: round(v / T * 100, 1) for k, v in tot.items()}
res["three_d_sequences"] = sorted({s["name"] for s in plan["segments"] if s.get("name") in THREE})
res["mg_components_used"] = sorted({s["name"] for s in plan["segments"] if s["kind"] == "mg"})
json.dump(res, open(ROOT / "work/qc.json", "w"), indent=1, ensure_ascii=False)
print(json.dumps({k: v for k, v in res.items() if k not in ("streams",)}, indent=1, ensure_ascii=False)[:4000])
