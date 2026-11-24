"""Download hand-picked Pixabay IDs (from preview review) and append to selection with beat tag."""
import os, sys, json, subprocess, pathlib, requests, time
KEY = os.environ["PIXABAY_API_KEY"]; ROOT = pathlib.Path(sys.argv[1]); picks = json.load(open(sys.argv[2]))
SEL = ROOT/"work/pixabay_selected.json"; sel = json.load(open(SEL)); have = {s["id"] for s in sel}
OUT = ROOT/"assets/stock_videos"
for vid, beat in picks.items():
    vid = int(vid)
    if vid in have: continue
    r = requests.get("https://pixabay.com/api/videos/", params={"key": KEY, "id": vid}, timeout=30)
    hits = r.json().get("hits", []) if r.status_code == 200 else []
    if not hits: print("not found", vid); continue
    h = hits[0]; v = h["videos"]
    k = "medium" if v["medium"]["width"] >= 1920 else "large"
    fn = OUT/f"px_{vid}.mp4"
    with requests.get(v[k]["url"], stream=True, timeout=180) as rr:
        rr.raise_for_status()
        with open(fn, "wb") as f:
            for c in rr.iter_content(1 << 20): f.write(c)
    info = json.loads(subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height,r_frame_rate,codec_name:format=duration","-of","json",str(fn)],capture_output=True,text=True).stdout)
    st = info["streams"][0]
    sel.append({"id": vid, "beat": beat, "query": "manual-preview-pick", "file": str(fn.relative_to(ROOT)), "page": h["pageURL"], "user": h["user"], "user_id": h["user_id"],
                "tags": h["tags"], "duration": float(info["format"]["duration"]), "width": st["width"], "height": st["height"], "fps": st["r_frame_rate"],
                "codec": st["codec_name"], "rendition": k, "thumb": v["medium"]["thumbnail"], "license": "Pixabay Content License"})
    have.add(vid); print(vid, beat, st["width"], st["height"], flush=True)
    json.dump(sel, open(SEL, "w"), indent=1); time.sleep(0.4)
