"""Align the romanized Telugu script (PDF) to Whisper word timestamps of the actual narration.
Whisper output (Telugu script) is transliterated to Latin, both sides are phonetically normalised,
and a banded word-level DP alignment (rapidfuzz similarity) maps every script word to a time.
Outputs: work/script_words.json, work/sentences.json"""
import json, re, sys, unicodedata, pathlib
from rapidfuzz import fuzz
from indic_transliteration import sanscript
from indic_transliteration.sanscript import transliterate

ROOT = pathlib.Path(sys.argv[1])
wj = json.load(open(ROOT / "work/whisper_large_v3.json"))
DUR = wj["duration"]

# ---------- script ----------
raw = open(ROOT / "work/script.txt").read()
lines = [l.strip() for l in raw.splitlines()]
lines = [l for l in lines if l and not re.fullmatch(r"(Vizag(\s+\d+)?|Status\s+Writing|\d+)", l)]
text = " ".join(lines)
text = text.replace("“", '"').replace("”", '"').replace("’", "'")
# chapter headings become separate "sentences" (narrator may or may not read them)
text = re.sub(r"(Chapter \d: [^.?!]*?)(?= [A-Z][a-z])", r"\n\1\n", text)
text = re.sub(r"(Ending: Ravi's Choice)", r"\n\1\n", text)
parts = []
for chunk in text.split("\n"):
    chunk = chunk.strip()
    if not chunk: continue
    if re.match(r"(Chapter \d|Ending:)", chunk): parts.append(chunk); continue
    # sentence split on . ? ! — keeping numbers like 1.3 and abbreviations
    for s in re.split(r"(?<=[.?!])\s+(?=[\"A-Z0-9“(])", chunk):
        if s.strip(): parts.append(s.strip())

def norm(w):
    w = unicodedata.normalize("NFKD", w).encode("ascii", "ignore").decode().lower()
    w = re.sub(r"[^a-z0-9]", "", w)
    for a, b in [("aa", "a"), ("ee", "i"), ("ii", "i"), ("oo", "u"), ("uu", "u"), ("th", "t"), ("dh", "d"), ("bh", "b"), ("gh", "g"), ("kh", "k"),
                 ("ph", "p"), ("sh", "s"), ("ch", "c"), ("jh", "j"), ("w", "v"), ("z", "j"), ("y", "i"), ("q", "k"), ("x", "ks"), ("f", "p"), ("e", "i"), ("o", "u")]:
        w = w.replace(a, b)
    w = re.sub(r"(.)\1+", r"\1", w)
    return w

script_words = []
for si, s in enumerate(parts):
    for tok in re.findall(r"[A-Za-z0-9][A-Za-z0-9'\-.,]*", s):
        t = tok.strip(".,")
        if t: script_words.append({"sent": si, "w": t, "n": norm(t)})

# ---------- whisper ----------
ww = []
for seg in wj["segments"]:
    for w in seg["words"]:
        tx = w["word"].strip()
        if not tx: continue
        if re.search(r"[ఀ-౿]", tx):
            lat = transliterate(tx, sanscript.TELUGU, sanscript.ITRANS)
        else:
            lat = tx
        n = norm(lat)
        if n: ww.append({"start": w["start"], "end": w["end"], "n": n, "raw": tx, "p": w["p"]})

# ---------- banded DP alignment ----------
S, W = len(script_words), len(ww)
band = 260
INF = 1e9
GAP_S, GAP_W = 0.55, 0.55
def sim(a, b):
    if a == b: return 1.0
    return fuzz.ratio(a, b) / 100.0
cost = {}
prev = {}
D = [dict() for _ in range(S + 1)]
D[0][0] = 0.0
for j in range(1, min(W, band) + 1): D[0][j] = j * GAP_W
for i in range(1, S + 1):
    c = int(i * W / S)
    lo, hi = max(0, c - band), min(W, c + band)
    Di, Dp = D[i], D[i - 1]
    for j in range(lo, hi + 1):
        best = Dp.get(j, INF) + GAP_S; arg = 1
        if j > 0:
            m = Dp.get(j - 1, INF)
            if m < INF:
                v = m + (1.0 - sim(script_words[i - 1]["n"], ww[j - 1]["n"])) * 1.15
                if v < best: best, arg = v, 0
            g = Di.get(j - 1, INF) + GAP_W
            if g < best: best, arg = g, 2
        Di[j] = best; prev[(i, j)] = arg
    if i > 1: D[i - 2] = {k: v for k, v in D[i - 2].items() if k in (0,)}  # free memory
# end: allow trailing whisper words
j = min(D[S], key=lambda k: D[S][k] + (W - k) * 0.0)
i = S
pairs = []
while i > 0 and j >= 0:
    a = prev.get((i, j), 1 if j == 0 else 2 if i == 0 else 1)
    if a == 0: pairs.append((i - 1, j - 1)); i -= 1; j -= 1
    elif a == 1: i -= 1
    else: j -= 1
pairs.reverse()
for si, wi in pairs:
    if sim(script_words[si]["n"], ww[wi]["n"]) >= 0.45:
        script_words[si]["start"] = ww[wi]["start"]; script_words[si]["end"] = ww[wi]["end"]; script_words[si]["match"] = round(sim(script_words[si]["n"], ww[wi]["n"]), 2)
# interpolate unmatched words between anchors (monotonic)
anchors = [(k, w["start"]) for k, w in enumerate(script_words) if "start" in w]
# enforce monotonic anchors
mono = []
for k, t in anchors:
    if not mono or t >= mono[-1][1]: mono.append((k, t))
anch = dict(mono)
for k, w in enumerate(script_words):
    if k in anch: w["t"] = anch[k]; continue
    left = max([a for a in anch if a < k], default=None); right = min([a for a in anch if a > k], default=None)
    tl = anch[left] if left is not None else 0.0; tr = anch[right] if right is not None else DUR
    kl = left if left is not None else -1; kr = right if right is not None else len(script_words)
    w["t"] = tl + (tr - tl) * (k - kl) / (kr - kl)
    w["interp"] = True
sents = []
for si, s in enumerate(parts):
    ws = [w for w in script_words if w["sent"] == si]
    if not ws: continue
    sents.append({"i": si, "start": round(ws[0]["t"], 2), "text": s, "matched": sum(1 for w in ws if not w.get("interp")), "words": len(ws)})
for k in range(len(sents)):
    sents[k]["end"] = round(sents[k + 1]["start"] if k + 1 < len(sents) else DUR, 2)
json.dump(script_words, open(ROOT / "work/script_words.json", "w"), indent=0)
json.dump(sents, open(ROOT / "work/sentences.json", "w"), indent=1, ensure_ascii=False)
print("script words", S, "whisper words", W, "matched", sum(1 for w in script_words if not w.get("interp")))
for s in sents: print(f"{s['start']:7.2f}-{s['end']:7.2f} [{s['matched']:2d}/{s['words']:2d}] {s['text'][:90]}")
