"""Slow, polite downloader for chosen Commons candidates (1280px thumbs). Writes work/commons_selected2.json."""
import json, sys, time, re, pathlib, requests
ROOT = pathlib.Path(sys.argv[1]); picks = json.load(open(sys.argv[2]))
UA = {"User-Agent": "DocumentaryResearchBot/1.0 (educational documentary asset research)"}
cands = json.load(open(ROOT / "work/commons_candidates.json"))
outp = ROOT / "work/commons_selected2.json"
sel = json.load(open(outp)) if outp.exists() else []
done = {s["title"] for s in sel}
for key, idxs in picks.items():
    for n, i in enumerate(idxs):
        if i >= len(cands.get(key, [])): continue
        c = cands[key][i]
        if c["title"] in done: continue
        fn = ROOT / "assets/web_photographs" / f"{key}_{i}.jpg"
        for a in range(8):
            r = requests.get(c["thumb"], headers=UA, timeout=60)
            if r.status_code == 200: fn.write_bytes(r.content); break
            time.sleep(25 * (a + 1))
        else:
            print("FAILED", key, c["title"], flush=True); continue
        sel.append({**c, "key": key, "file": str(fn.relative_to(ROOT))}); done.add(c["title"])
        json.dump(sel, open(outp, "w"), indent=1)
        print("ok", key, i, c["title"][:70], c["license"], flush=True)
        time.sleep(14)
