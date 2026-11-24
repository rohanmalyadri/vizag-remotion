"""Build the SFX/foley stem from the scene plan, then mix it under the untouched narration.
Sound hierarchy: narration (unchanged, dominant) > risers/hits > textures > whooshes > diegetic beds.
Outputs work/sfx_stem.wav, work/final_mix.wav, metadata/sfx_cues.csv"""
import json, sys, wave, pathlib, csv, subprocess
import numpy as np

ROOT = pathlib.Path(sys.argv[1]); SR = 48000; FPS = 30
plan = json.load(open(ROOT / "project/source_code/remotion/src/plan.json"))
SEL = {s["id"]: s for s in json.load(open(ROOT / "work/pixabay_selected.json"))}
DUR = plan["durationInFrames"] / FPS
LIB = ROOT / "assets/sound_effects"
cache = {}
def load(name):
    if name not in cache:
        w = wave.open(str(LIB / f"{name}.wav"))
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32).reshape(-1, 2) / 32768
        cache[name] = x
    return cache[name]
out = np.zeros((int(DUR * SR) + SR * 4, 2), dtype=np.float32)
cues = []
db = lambda d: 10 ** (d / 20)

def place(name, t, gain_db, peak_frac=None, note=""):
    x = load(name)
    if peak_frac is not None:  # align the loudest moment of the sound to t
        env = np.abs(x).mean(1); k = int(np.argmax(np.convolve(env, np.ones(480) / 480, "same")))
        t = t - k / SR
    i = int(max(0, t) * SR); j = min(len(out), i + len(x))
    out[i:j] += x[: j - i] * db(gain_db)
    cues.append([f"{max(t,0):.2f}", name, gain_db, note])

def bed(name, t0, t1, gain_db, note=""):
    x = load(name); n = int((t1 - t0) * SR)
    if n <= 0: return
    reps = int(np.ceil(n / len(x))) + 1
    y = np.tile(x, (reps, 1))[:n].copy()
    f = min(int(0.35 * SR), n // 3)
    ramp = np.linspace(0, 1, f)[:, None]
    y[:f] *= ramp; y[-f:] *= ramp[::-1]
    i = int(t0 * SR); out[i:i + n] += y * db(gain_db)
    cues.append([f"{t0:.2f}", name + " (bed)", gain_db, f"{note} until {t1:.2f}"])

WH = ["whoosh_1", "whoosh_2", "whoosh_3", "whoosh_4", "whoosh_5"]
BEDS = [
    (("ocean", "sea", "beach", "wave", "coast", "harbor", "harbour", "port", "ship", "boat", "fishing", "bay of bengal"), "amb_ocean", -33),
    (("steel", "molten", "furnace", "foundry", "weld", "spark", "grinder", "factory", "metal"), "amb_industrial", -31),
    (("server", "data", "datacenter", "network", "rack", "ethernet", "router"), "amb_server", -34),
    (("excavator", "construction", "digging", "dump truck", "crane", "mining", "soil", "earth"), "amb_construction", -32),
    (("storm", "rain", "cyclone", "thunder"), "amb_storm", -32),
    (("airplane", "aircraft", "plane", "airport", "runway", "jet"), "aircraft_pass", -30),
    (("water", "reservoir", "dam", "river", "tap", "treatment"), "amb_water", -35),
    (("traffic", "street", "city", "road", "highway", "market", "bus", "auto", "railway", "station"), "amb_city", -35),
    (("forest", "hill", "mountain", "green", "pine", "nature"), "amb_wind", -36),
]
wcount = 0
for s in plan["segments"]:
    t = s["from"] / FPS; d = s["dur"] / FPS; inT = s.get("inT", "cut"); name = s.get("name")
    # A) movement — transitions (peak on the fastest frame ≈ 40% into the transition)
    if inT in ("wipe", "wipeL", "iris", "slit", "scan", "push"):
        place("swish" if inT in ("scan", "slit") else WH[wcount % 5], t + s.get("inDur", 14) / FPS * 0.4, -27 if inT != "scan" else -29, peak_frac=True, note=f"{inT} into {s['id']}"); wcount += 1
    elif inT == "flash":
        place("hit_soft", t, -24, note=f"flash cut {s['id']}")
    # C) anticipation — chapter cards, bet cards, hero numbers
    if name == "ChapterCard":
        place("swell_reverse", t - 2.0, -26, note="into chapter")
        place("hit_main", t + 0.05, -19, note="chapter hit")
    elif name == "BetCard":
        place("riser_short", t - 1.4, -27, note="bet riser"); place("hit_soft", t, -22, note="bet card")
    elif name in ("SteelText",):
        place("steel_hit", t + 0.1, -19, note="steel typography")
    elif name in ("GigawattCubes",):
        place("riser_short", t - 0.6, -28); place("data_pulse", t + 1.6, -25, note="1 GW reveal")
    elif name in ("OpenVizag",):
        tt = t + s["props"]["titleAt"] / FPS
        place("riser_long", tt - 3.2, -27, note="title riser"); place("hit_main", tt + 0.2, -18, note="TITLE")
        place("whoosh_deep", t + 0.5, -28, peak_frac=True, note="fly over the sea")
    elif name in ("WhyVizagMap", "EnvMap", "Finale", "VERMap", "GoogleSites", "SteelSite", "NorthAndhra", "CityChoice", "TwoRoles", "ThreeCapitals", "RouteHome", "Migration", "CableMap", "Bifurcation"):
        place("whoosh_deep", t + 1.0, -31, peak_frac=True, note=f"map camera move {name}")
        if name == "Bifurcation":
            sp = s["props"]["marks"]["split"] / FPS
            place("riser_short", t + sp - 1.3, -27); place("hit_main", t + sp + 0.6, -20, note="2 June 2014 split")
        if name == "Finale" and s.get("props", {}).get("warn"):
            place("boom_low", t + 0.2, -22, note="warning")
    if name == "SubseaScene":
        place("whoosh_deep", t + 0.4, -27, peak_frac=True, note="dive"); bed("amb_ocean", t, t + d, -30, "under water")
    if name == "DataCentreCampus":
        bed("amb_server", t, t + d, -31, "data centre"); place("whoosh_deep", t + 1.0, -30, peak_frac=True)
    if name == "SteelCity":
        bed("amb_industrial", t, t + d, -30, "steel city")
    if name == "Runway3D":
        place("aircraft_pass", t + d * 0.35, -24, note="take-off")
    if name == "PhoneZoom":
        place("riser_short", t + d - 1.4, -26); place("hit_soft", t + d, -23, note="zoom through")
    if name == "WindowScene":
        bed("amb_bus", t, t + d, -30, "bus window")
    if name in ("SplitCompare", "Triptych"):
        place("swish", t + 0.25, -28, peak_frac=True, note="panel reveal")
    # D) diegetic beds for real footage
    if s["kind"] == "stock":
        vid = int(s["clip"].split("/")[1].split("_")[0]); tags = (SEL[vid]["tags"] + " " + SEL[vid]["query"] + " " + SEL[vid]["beat"]).lower()
        for keys, b, g in BEDS:
            if any(k in tags for k in keys):
                if b == "aircraft_pass": place(b, t + min(d * 0.5, 3), g, note=f"diegetic {vid}")
                else: bed(b, t, t + d, g, f"diegetic {vid}")
                break
    # B) textures — overlays
    for o in s.get("ov") or []:
        at = t + (o.get("at", 0) if isinstance(o.get("at", 0), (int, float)) else 0) / FPS
        k = o["k"]
        if k in ("tag",): place("tick", at + 0.15, -27, note="tag")
        elif k in ("place", "callout"): place("click_soft", at + 0.1, -26, note=k)
        elif k == "lower": place("swish", at + 0.2, -29, peak_frac=True, note="lower third")
        elif k == "doc": place("paper_slide", at, -24, note="document"); place("paper_place", at + 0.9, -27)
        elif k == "quote": place("paper_place", at, -28, note="quote")
        elif k == "number": place("riser_short", at - 1.2, -29); place("blip", at + 1.2, -24, note="number lands")
        elif k == "strike":
            for a in (o.get("at") or []): place("tick", t + a / FPS + 0.4, -25, note="strike")
        elif k == "caption": place("click_soft", at, -31, note="dialogue caption")

out = out[: int(DUR * SR)]
pk = np.max(np.abs(out)); print("sfx stem peak dBFS", round(20 * np.log10(pk + 1e-9), 1))
if pk > 0.7: out *= 0.7 / pk
w = wave.open(str(ROOT / "work/sfx_stem.wav"), "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
with open(ROOT / "metadata/sfx_cues.csv", "w", newline="") as fh:
    cw = csv.writer(fh); cw.writerow(["time_s", "sound", "gain_db", "note"]); cw.writerows(cues)
print("cues", len(cues))
# Mix: narration untouched; SFX ducked by narration via sidechain compression
narr = ROOT / "input/vizag.mp3.mpeg"
cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(narr), "-i", str(ROOT / "work/sfx_stem.wav"), "-filter_complex",
       "[0:a]aresample=48000,asplit=2[n][sc];[1:a]aresample=48000[s];[s][sc]sidechaincompress=threshold=0.02:ratio=4:attack=15:release=350:makeup=1[sd];"
       "[n][sd]amix=inputs=2:normalize=0:duration=first[m]", "-map", "[m]", "-c:a", "pcm_s16le", "-ar", "48000", str(ROOT / "work/final_mix.wav")]
subprocess.run(cmd, check=True)
print("mixed")
