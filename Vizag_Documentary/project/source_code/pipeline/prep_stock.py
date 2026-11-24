"""Cut every stock shot used in the timeline into a normalised clip (1920x1080, 30 fps, H.264, no audio).
Input: work/shots.json  [{key, id, in, dur}]  (written by the timeline exporter)
Output: project/source_code/remotion/public/stock/<key>.mp4"""
import json, sys, subprocess, pathlib, os
from concurrent.futures import ThreadPoolExecutor
ROOT = pathlib.Path(sys.argv[1])
shots = json.load(open(ROOT / "work/shots.json"))
OUT = ROOT / "project/source_code/remotion/public/stock"; OUT.mkdir(parents=True, exist_ok=True)
sel = {s["id"]: s for s in json.load(open(ROOT / "work/pixabay_selected.json"))}

def job(s):
    out = OUT / f"{s['key']}.mp4"
    if out.exists() and out.stat().st_size > 10000: return s["key"], "cached"
    src = ROOT / sel[s["id"]]["file"]
    st = s.get("stretch", 1.0)
    vf = "scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,"
    vf += (f"setpts={st:.4f}*PTS,framerate=fps=30," if st > 1.001 else "fps=30,") + "format=yuv420p"
    cmd = ["ffmpeg", "-v", "error", "-y", "-ss", f"{s['in']:.3f}", "-t", f"{(s['dur'] + 0.6) / st + 0.1:.3f}", "-i", str(src),
           "-t", f"{s['dur'] + 0.6:.3f}", "-vf", vf,
           "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-g", "15", "-movflags", "+faststart", str(out)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    return s["key"], ("ok" if r.returncode == 0 else r.stderr[-300:])

with ThreadPoolExecutor(3) as ex:
    for k, st in ex.map(job, shots):
        if st != "cached": print(k, st, flush=True)
print("prepared", len(shots))
