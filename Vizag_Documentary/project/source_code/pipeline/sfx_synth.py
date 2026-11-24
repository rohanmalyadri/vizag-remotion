"""Original procedural sound-effect library (no third-party samples => no licensing issues).
Families: A) whooshes (movement)  B) textures (interactions)  C) risers & hits (anticipation)  D) diegetic ambience beds.
Usage: python sfx_synth.py OUT_DIR"""
import sys, pathlib, wave
import numpy as np

SR = 48000
OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)


def save(name, x):
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1: x = np.stack([x, x], 1)
    peak = np.max(np.abs(x)) + 1e-9
    x = x / peak * 0.89  # normalise to -1 dBFS; levels are set in the mixer
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def noise(n, color="white"):
    w = rng.standard_normal(n)
    if color == "white": return w
    f = np.fft.rfft(w); k = np.arange(len(f)); k[0] = 1
    f = f / (np.sqrt(k) if color == "pink" else k)
    y = np.fft.irfft(f, n); return y / (np.std(y) + 1e-9)


def onepole_lp(x, fc):
    """time-varying one-pole lowpass; fc scalar or array (Hz)"""
    fc = np.broadcast_to(fc, x.shape)
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)):
        s = (1 - a[i]) * x[i] + a[i] * s; y[i] = s
    return y


def svf_bp(x, fc, q=1.2):
    """time-varying state-variable bandpass"""
    fc = np.broadcast_to(fc, x.shape)
    y = np.empty_like(x); lp = bp = 0.0
    for i in range(len(x)):
        f = 2 * np.sin(np.pi * min(fc[i], SR / 6) / SR)
        hp = x[i] - lp - bp / q; bp += f * hp; lp += f * bp; y[i] = bp
    return y


def env_adsr(n, a, peak_at=None, curve=2.0):
    t = np.linspace(0, 1, n)
    p = peak_at if peak_at is not None else a
    e = np.where(t < p, (t / p) ** curve, ((1 - t) / (1 - p)) ** (curve * 0.8))
    return e


def reverb(x, decay=1.2, mix=0.25):
    n = int(SR * decay)
    ir = noise(n) * np.exp(-np.linspace(0, 6, n)); ir /= np.sqrt(np.sum(ir ** 2))
    L = len(x) + n; N = 1 << int(np.ceil(np.log2(L)))
    wet = np.fft.irfft(np.fft.rfft(x, N) * np.fft.rfft(ir, N), N)[:L]
    out = np.concatenate([x, np.zeros(n)]) * (1 - mix) + wet * mix
    return out


def pan(x, p):  # p in [-1,1] scalar or array
    p = np.broadcast_to(p, x.shape)
    l = np.cos((p + 1) * np.pi / 4); r = np.sin((p + 1) * np.pi / 4)
    return np.stack([x * l, x * r], 1)


# ── A. WHOOSHES ─────────────────────────────────────────────
def whoosh(dur, peak=0.55, lo=300, hi=3200, q=0.9, pan_from=-0.6, pan_to=0.6, air=0.25):
    n = int(SR * dur); t = np.linspace(0, 1, n)
    sweep = lo + (hi - lo) * np.exp(-((t - peak) ** 2) / 0.045)
    x = svf_bp(noise(n, "pink"), sweep, q) + air * onepole_lp(noise(n), 6000) * 0.3
    x *= env_adsr(n, peak, peak, 2.2)
    return pan(reverb(x, 0.6, 0.18)[: n + int(SR * 0.3)], np.linspace(pan_from, pan_to, n + int(SR * 0.3)))


for i, (d, pk, lo, hi) in enumerate([(0.9, 0.6, 250, 2400), (1.3, 0.55, 180, 1800), (0.6, 0.6, 400, 4200), (1.8, 0.62, 120, 1400), (1.1, 0.5, 300, 3000)]):
    save(f"whoosh_{i+1}", whoosh(d, pk, lo, hi, pan_from=-0.7 if i % 2 else 0.7, pan_to=0.7 if i % 2 else -0.7))
# deep camera push (map fly-through)
save("whoosh_deep", whoosh(2.6, 0.7, 60, 700, q=0.7, pan_from=0, pan_to=0, air=0.05))
# fast swish for type / graphic slides
save("swish", whoosh(0.35, 0.45, 900, 6500, q=1.4, pan_from=-0.3, pan_to=0.3))

# ── B. TEXTURES ─────────────────────────────────────────────
def click(freq=2600, dur=0.06, body=0.4):
    n = int(SR * dur); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) * np.exp(-t * 90) + body * noise(n) * np.exp(-t * 400)
    return reverb(x, 0.25, 0.12)
save("tick", click(3100, 0.05, 0.3))
save("click_soft", click(1800, 0.08, 0.5))
save("blip", np.concatenate([click(1320, 0.07, 0.05), np.zeros(1200)]) + np.concatenate([np.zeros(1200), click(1980, 0.07, 0.05)]))

def paper(dur=0.7, grains=26):
    n = int(SR * dur); x = np.zeros(n)
    for _ in range(grains):
        s = rng.integers(0, n - 2400); L = rng.integers(400, 2400)
        g = svf_bp(noise(L), rng.uniform(1500, 5500), 2.0) * np.hanning(L) * rng.uniform(0.3, 1)
        x[s:s + L] += g
    x += onepole_lp(noise(n), 900) * 0.25 * env_adsr(n, 0.2)
    return reverb(x * env_adsr(n, 0.15, 0.15, 1.2), 0.3, 0.1)
save("paper_slide", paper(0.8)); save("paper_place", paper(0.45, 14))

def thump(f0=90, dur=0.35):
    n = int(SR * dur); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (f0 * t - 30 * t * t)) * np.exp(-t * 14) + 0.2 * onepole_lp(noise(n), 1200) * np.exp(-t * 40)
save("pin_drop", reverb(np.concatenate([thump(140, 0.25) * 0.6, np.zeros(100)]) + 0.5 * np.concatenate([click(2400, 0.25, 0.0)[: int(SR*0.25)+100]]) , 0.5, 0.2))
save("type_tick", np.concatenate([click(4200 + 300 * k, 0.03, 0.6) for k in range(6)]))
save("data_pulse", reverb(np.concatenate([np.sin(2*np.pi*f*np.arange(int(SR*0.09))/SR)*np.exp(-np.arange(int(SR*0.09))/SR*35) for f in (880,1175,1568)]), 0.6, 0.3))

# ── C. RISERS & HITS ────────────────────────────────────────
def riser(dur=2.5, f0=110, f1=880):
    n = int(SR * dur); t = np.linspace(0, 1, n)
    fr = f0 * (f1 / f0) ** (t ** 1.6)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    tone = (np.sin(ph) + 0.4 * np.sin(2.01 * ph) + 0.2 * np.sin(3.02 * ph)) * 0.35
    nz = svf_bp(noise(n, "pink"), 400 + 5000 * t ** 2, 0.8)
    e = t ** 2.2
    x = (tone + nz) * e
    x[-int(SR * 0.02):] *= np.linspace(1, 0, int(SR * 0.02))
    return pan(x, np.sin(t * 9) * 0.3 * t)
save("riser_short", riser(1.4)); save("riser_long", riser(3.2, 70, 700))

def hit(dur=2.4, f0=55):
    n = int(SR * dur); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * (f0 * t - 8 * t * t)) * np.exp(-t * 2.6)
    body = onepole_lp(noise(n), 1600) * np.exp(-t * 18) * 0.7
    metal = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in ((412, 6), (667, 7), (1219, 9))) * 0.08
    return reverb(sub + body + metal, 2.2, 0.35)
save("hit_main", hit()); save("hit_soft", hit(1.6, 70))
save("boom_low", reverb(np.sin(2*np.pi*(38*np.arange(int(SR*2.8))/SR))*np.exp(-np.arange(int(SR*2.8))/SR*1.8), 1.5, 0.3))
# metallic steel hit (for Steel City typography)
t = np.arange(int(SR * 3)) / SR
steel = sum(np.sin(2*np.pi*f*t + rng.uniform(0, 6)) * np.exp(-t*d) * a for f, d, a in ((196, 1.2, 1), (311, 1.6, .7), (523, 2.2, .5), (1188, 3.5, .3), (2390, 5, .15)))
save("steel_hit", reverb(steel + hit(3, 48)[: len(t)] * 0.8, 2.5, 0.3))
# reverse swell into chapter titles
r = hit(2.0, 60)[: int(SR * 2.0)][::-1] * np.linspace(0, 1, int(SR * 2.0)) ** 2
save("swell_reverse", r)

# ── D. DIEGETIC AMBIENCE BEDS (12 s loops, crossfaded in mixer) ───────
L = SR * 12; tt = np.arange(L) / SR
def loopify(x, fade=SR // 2):
    x = x.copy(); x[:fade] = x[:fade] * np.linspace(0, 1, fade) + x[-fade:] * np.linspace(1, 0, fade); return x[:-fade]
# ocean: swells of filtered brown noise
sw = 0.55 + 0.45 * np.sin(2 * np.pi * tt / 6.0) ** 2
ocean = onepole_lp(noise(L, "brown"), 500) * 0.8 + onepole_lp(noise(L, "pink"), 300 + 2500 * sw ** 3) * sw ** 2.5
save("amb_ocean", np.stack([loopify(ocean), loopify(np.roll(ocean, SR // 3))], 1))
# wind / hills
wind = svf_bp(noise(L, "pink"), 300 + 250 * np.sin(2 * np.pi * tt / 5.3) + 120 * np.sin(2 * np.pi * tt / 1.7), 0.6)
save("amb_wind", np.stack([loopify(wind), loopify(np.roll(wind, SR))], 1))
# industrial furnace: low roar + crackle + hum
roar = onepole_lp(noise(L, "brown"), 220) + 0.35 * np.sin(2 * np.pi * 50 * tt) + 0.2 * np.sin(2 * np.pi * 100 * tt)
crk = np.zeros(L); idx = rng.integers(0, L - 300, 900); crk[idx] = rng.uniform(-1, 1, 900); crk = svf_bp(crk, 3500, 1.5) * 2
clank = np.zeros(L)
for s in rng.integers(0, L - SR, 5): clank[s:s + SR] += (np.sin(2*np.pi*rng.uniform(300,700)*np.arange(SR)/SR) * np.exp(-np.arange(SR)/SR*9)) * 0.5
save("amb_industrial", np.stack([loopify(roar + crk + clank), loopify(np.roll(roar, SR // 2) + np.roll(crk, 777) + clank)], 1))
# server room: fans + electrical hum
fan = onepole_lp(noise(L, "pink"), 2200) * 0.6 + sum(0.12 * np.sin(2 * np.pi * f * tt) for f in (120, 240, 360)) + 0.05 * np.sin(2 * np.pi * 7400 * tt)
save("amb_server", np.stack([loopify(fan), loopify(np.roll(fan, 9000))], 1))
# aircraft pass (one-shot 9 s): rumble swelling then receding with pitch drift
n = SR * 9; t9 = np.linspace(0, 1, n)
prox = np.exp(-((t9 - 0.45) ** 2) / 0.03)
jet = onepole_lp(noise(n, "pink"), 400 + 3500 * prox) * (0.15 + prox) + 0.25 * svf_bp(noise(n), 2400 - 900 * t9, 3) * prox
save("aircraft_pass", pan(jet, np.linspace(-0.8, 0.8, n)))
# construction machinery: diesel idle + hydraulic whine + scraping
diesel = np.sign(np.sin(2 * np.pi * 26 * tt)) * 0.3 + onepole_lp(noise(L, "brown"), 160)
hyd = 0.15 * np.sin(2 * np.pi * (420 + 80 * np.sin(2 * np.pi * tt / 3.1)) * tt) * (0.5 + 0.5 * np.sin(2 * np.pi * tt / 4) ** 2)
scrape = svf_bp(noise(L), 900, 1.0) * (np.sin(2 * np.pi * tt / 2.7) > 0.6) * 0.6
save("amb_construction", np.stack([loopify(onepole_lp(diesel, 900) + hyd + scrape), loopify(np.roll(onepole_lp(diesel, 900), 3000) + hyd + scrape)], 1))
# rain / storm
rain = onepole_lp(noise(L), 5000) * 0.6 + onepole_lp(noise(L, "brown"), 250) * (0.6 + 0.4 * np.sin(2 * np.pi * tt / 4.5) ** 2)
save("amb_storm", np.stack([loopify(rain), loopify(np.roll(rain, 4000))], 1))
# city traffic murmur (distant)
city = onepole_lp(noise(L, "brown"), 350) + 0.4 * onepole_lp(noise(L, "pink"), 1200)
for s in rng.integers(0, L - SR, 3): city[s:s + SR // 3] += 0.25 * np.sin(2 * np.pi * rng.uniform(380, 520) * np.arange(SR // 3) / SR) * np.hanning(SR // 3)
save("amb_city", np.stack([loopify(city), loopify(np.roll(city, 7000))], 1))
# bus interior (road rumble + engine)
bus = onepole_lp(noise(L, "brown"), 180) * 1.2 + 0.2 * np.sin(2 * np.pi * 38 * tt) + 0.1 * onepole_lp(noise(L), 3000) * (np.sin(2*np.pi*tt/0.9) > 0.95)
save("amb_bus", np.stack([loopify(bus), loopify(np.roll(bus, 5000))], 1))
# water (stream / tap)
water = svf_bp(noise(L), 1800 + 900 * np.sin(2 * np.pi * tt / 0.37), 1.1) + 0.4 * onepole_lp(noise(L, "pink"), 800)
save("amb_water", np.stack([loopify(water), loopify(np.roll(water, 3333))], 1))
print("sfx written to", OUT)
