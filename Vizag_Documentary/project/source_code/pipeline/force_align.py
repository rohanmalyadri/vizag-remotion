"""Forced alignment of the romanized Telugu script to the original narration with Meta's MMS aligner
(torchaudio MMS_FA, multilingual wav2vec2 CTC on romanized text) + a banded CTC Viterbi of our own.
The band centre follows high-confidence Whisper matches (work/script_words.json from align.py).
Outputs work/fa_words.json (word-level), work/fa_sentences.json (phrase/sentence-level)."""
import json, re, sys, wave, pathlib, math
import numpy as np, torch, torchaudio

ROOT = pathlib.Path(sys.argv[1])
w = wave.open(str(ROOT / "work/narration16k.wav"))
pcm = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
DUR = len(pcm) / 16000
bundle = torchaudio.pipelines.MMS_FA
labels = bundle.get_labels(star="*")
model = bundle.get_model(with_star=True)
model.eval()
torch.set_num_threads(4)

# ---- emissions in 30 s windows with 1 s context each side ----
em_path = ROOT / "work/mms_emissions.npy"
if em_path.exists():
    E = np.load(em_path)
else:
    sr = 16000; win = 30 * sr; ctx = sr
    parts = []
    with torch.inference_mode():
        for s in range(0, len(pcm), win):
            a, b = max(0, s - ctx), min(len(pcm), s + win + ctx)
            x = torch.from_numpy(pcm[a:b]).unsqueeze(0)
            e, _ = model(x)
            e = torch.log_softmax(e, dim=-1)[0].numpy()
            fps = e.shape[0] / ((b - a) / sr)
            k0 = int(round((s - a) / sr * fps)); k1 = k0 + int(round(min(win, len(pcm) - s) / sr * fps))
            parts.append(e[k0:k1])
            print(f"emission {s/sr:7.1f}s", flush=True)
    E = np.concatenate(parts).astype(np.float32)
    np.save(em_path, E)
T = E.shape[0]; FPS = T / DUR
print("frames", T, "fps", FPS)

# ---- script tokens ----
sw = json.load(open(ROOT / "work/script_words.json"))
dic = {c: i for i, c in enumerate(labels)}
tok, tok_word = [], []
for wi, wd in enumerate(sw):
    t = wd["w"].lower()
    t = re.sub(r"[^a-z0-9']", "", t)
    if not t: continue
    if re.search(r"\d", t): chars = ["*"]
    else: chars = [c for c in t if c in dic]
    for c in chars: tok.append(dic[c]); tok_word.append(wi)
L = len(tok); S = 2 * L + 1
print("tokens", L)

# ---- band centre from confident whisper anchors ----
anch = [(0, 0.0)]
ci = 0; word_first_tok = {}
for k, wi in enumerate(tok_word):
    word_first_tok.setdefault(wi, k)
for wi, wd in enumerate(sw):
    if wd.get("match", 0) >= 0.8 and not wd.get("interp") and len(wd["n"]) >= 4 and wi in word_first_tok:
        t = wd["start"]
        if t > anch[-1][1] + 0.5 and word_first_tok[wi] > anch[-1][0]:
            anch.append((word_first_tok[wi], t))
anch.append((L, DUR))
ax = np.array([a[1] for a in anch]); ay = np.array([a[0] for a in anch])
centre_tok = np.interp(np.arange(T) / FPS, ax, ay)
BAND = 2600  # states (~ +/- 1300 chars)
ext = np.zeros(S, dtype=np.int64); ext[1::2] = tok  # blank = 0
blank = 0
NEG = -1e30
same = np.zeros(S, dtype=bool)
same[3::2] = np.array(tok[1:]) == np.array(tok[:-1])
alpha = np.full(S, NEG, dtype=np.float64)
bp = []
lo_arr = np.zeros(T, dtype=np.int64)
for t in range(T):
    c = int(2 * centre_tok[t] + 1)
    lo, hi = max(0, c - BAND), min(S, c + BAND)
    lo_arr[t] = lo
    em = E[t, ext[lo:hi]]
    if t == 0:
        new = np.full(hi - lo, NEG);
        if lo == 0: new[0] = em[0]; new[1] = em[1] if hi > 1 else NEG
        alpha_w = new; b = np.zeros(hi - lo, dtype=np.int8)
    else:
        a0 = alpha[lo:hi]
        a1 = np.concatenate([[alpha[lo - 1] if lo > 0 else NEG], alpha[lo:hi - 1]])
        a2 = np.concatenate([[alpha[lo - 2] if lo > 1 else NEG, alpha[lo - 1] if lo > 0 else NEG], alpha[lo:hi - 2]])[: hi - lo]
        allow2 = (np.arange(lo, hi) % 2 == 1) & ~same[lo:hi]
        a2 = np.where(allow2, a2, NEG)
        stack = np.stack([a0, a1, a2])
        b = np.argmax(stack, 0).astype(np.int8)
        alpha_w = stack[b, np.arange(hi - lo)] + em
    alpha = np.full(S, NEG); alpha[lo:hi] = alpha_w
    bp.append(b)
# backtrack from best of last two states
s = S - 1 if alpha[S - 1] >= alpha[S - 2] else S - 2
path = np.zeros(T, dtype=np.int64)
for t in range(T - 1, -1, -1):
    path[t] = s
    off = s - lo_arr[t]
    if t > 0:
        if off < 0 or off >= len(bp[t]): print("band escape at", t / FPS); break
        s = s - int(bp[t][off])
# token start/end frames
tok_start = np.full(L, -1); tok_end = np.full(L, -1)
for t in range(T):
    st = path[t]
    if st % 2 == 1:
        k = (st - 1) // 2
        if tok_start[k] < 0: tok_start[k] = t
        tok_end[k] = t
words = []
for wi, wd in enumerate(sw):
    ks = [k for k in range(L) if tok_word[k] == wi] if wi in word_first_tok else []
    if not ks: continue
    st = [tok_start[k] for k in ks if tok_start[k] >= 0]; en = [tok_end[k] for k in ks if tok_end[k] >= 0]
    if not st: continue
    words.append({"i": wi, "sent": wd["sent"], "w": wd["w"], "start": round(min(st) / FPS, 3), "end": round((max(en) + 1) / FPS, 3),
                  "score": round(float(np.mean([E[tok_start[k]:tok_end[k] + 1, tok[k]].max() for k in ks if tok_start[k] >= 0])), 3)})
json.dump(words, open(ROOT / "work/fa_words.json", "w"), indent=0)
sents = json.load(open(ROOT / "work/sentences.json"))
out = []
for s_ in sents:
    ws = [x for x in words if x["sent"] == s_["i"]]
    if not ws: continue
    out.append({"i": s_["i"], "start": ws[0]["start"], "end": ws[-1]["end"], "text": s_["text"], "conf": round(float(np.mean([x["score"] for x in ws])), 2)})
json.dump(out, open(ROOT / "work/fa_sentences.json", "w"), indent=1, ensure_ascii=False)
for o in out: print(f"{o['start']:7.2f}-{o['end']:7.2f} c={o['conf']:5.2f} {o['text'][:95]}")
