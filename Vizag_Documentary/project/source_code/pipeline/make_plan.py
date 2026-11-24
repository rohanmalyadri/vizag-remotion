"""Scene plan for VIZAG — THE COASTLINE BLUEPRINT.
Every segment is anchored to the forced-aligned narration (work/fa_sentences.json, work/fa_words.json).
Emits: remotion/src/plan.json, metadata/scene_plan.csv, work/shots.json (stock cuts), photo copies.
Rules enforced here: continuous stock shot <= 9.5 s; each stock source used at most twice; no overlapping reuse."""
import json, csv, sys, pathlib, shutil, re
from PIL import Image

ROOT = pathlib.Path(sys.argv[1])
FPS = 30
DUR = 1075.39
S = {s["i"]: s["start"] for s in json.load(open(ROOT / "work/fa_sentences.json"))}
WORDS = json.load(open(ROOT / "work/fa_words.json"))
SEL = {s["id"]: s for s in json.load(open(ROOT / "work/pixabay_selected.json"))}
PHOTOS = {}
for f in ["work/commons_selected.json", "work/commons_selected2.json"]:
    p = ROOT / f
    if p.exists():
        for r in json.load(open(p)):
            PHOTOS[pathlib.Path(r["file"]).stem] = r
PIB = {
    "pib_mou_group": ("assets/government_documents/pib/pib_image001FHBK.jpg", "PIB, Govt. of India · Bharat AI Shakti, New Delhi, 14 Oct 2025", "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2179035"),
    "pib_mou_panel": ("assets/government_documents/pib/pib_image003VUNY.jpg", "PIB, Govt. of India · 14 Oct 2025", "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2178852"),
    "pib_vaishnaw_talk": ("assets/government_documents/pib/pib_image0037G4D.jpg", "PIB, Govt. of India · 14 Oct 2025", "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2179035"),
    "pib_ground_shovels": ("assets/government_documents/pib/pib_WhatsAppImage2026-04-28at13.51.14VWPO.jpeg", "PIB, Govt. of India · Visakhapatnam, 28 Apr 2026", "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2256187"),
    "pib_ground_stage": ("assets/government_documents/pib/pib_WhatsAppImage2026-04-28at12.38.21(1)PFFK.jpeg", "PIB, Govt. of India · Visakhapatnam, 28 Apr 2026", "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2256187"),
}

def Wd(word, after=0.0):
    for w in WORDS:
        if w["start"] >= after and w["w"].lower().strip(".,—-\"'") == word.lower():
            return w["start"]
    raise KeyError(word)

segments, uses, shots, rows = [], {}, [], []
F = lambda s: int(round(s * FPS))

def _ov(ov):
    out = []
    for o in ov or []:
        o = dict(o)
        if "at" in o and isinstance(o["at"], (int, float)): o["at"] = F(o["at"])
        if o.get("k") == "strike" and "ats" in o: o["at"] = [F(x) for x in o.pop("ats")]
        if o.get("k") == "lower" and "dur" in o: o["dur"] = F(o["dur"])
        out.append(o)
    return out

def add(t, kind, note, **kw):
    segments.append({"t": t, "kind": kind, "note": note, **kw})

def st(t, vid, note, move="push", grade="natural", inT="cut", ov=None, inDur=0.45):
    add(t, "stock", note, vid=vid, move=move, grade=grade, inT=inT, ov=ov, inDur=inDur)

def ph(t, key, note, move="push", grade="natural", inT="cut", ov=None, pos="50% 50%", inDur=0.45):
    add(t, "photo", note, key=key, move=move, grade=grade, inT=inT, ov=ov, pos=pos, inDur=inDur)

def mg(t, name, note, props=None, inT="cut", ov=None, inDur=0.5, frames_keys=()):
    add(t, "mg", note, name=name, props=props or {}, inT=inT, ov=ov, inDur=inDur, fk=frames_keys)

C = dict(white="#F7F7F3", cobalt="#315FEA", teal="#248B91", yellow="#F1E5A7", coral="#D97769", silver="#E1E6EA", navy="#142B46")
ILL = {"k": "tag", "text": "ILLUSTRATIVE FOOTAGE", "color": C["silver"], "pos": "tr"}
def place(name, sub=None, at=0.3): return {"k": "place", "name": name, "sub": sub, "at": at}

# ════════════════════════════ INTRO · RAVI ════════════════════════════
st(0.0, 1021, "Imagine… Ravi, 27, from Srikakulam (illustrative character)", move="pull", grade="night", ov=[
    {"k": "headline", "lines": ["Ravi.", "27. From Srikakulam."], "serifLine": 1, "at": S[1] - 0.0 + 0.1, "size": 110},
    {"k": "tag", "text": "AN ILLUSTRATIVE CHARACTER", "color": C["silver"], "pos": "tl", "at": 1.2}])
st(S[4], 200435, "Gachibowli: IT software engineer — Hyderabad IT corridor (real Hyderabad footage)", move="driftR", inT="wipe", ov=[place("Hyderabad", "THE IT CORRIDOR · DURGAM CHERUVU", 0.2)])
st(S[5], 264270, "Every Sankranti (kites)", move="rise", inT="slit")
st(S[5] + 2.3, 44740, "… every Dasara (festival lamps)", move="push")
st(Wd("hyderabad", S[5]) , 24544, "Hyderabad → home by bus at night", move="driftL", grade="night")
mg(Wd("hyderabad", S[5]) + 3.4, "RouteHome", "~14 hours by bus (3D map Hyderabad→Srikakulam)", inT="wipe")
st(S[5] + 11.4, 106980, "Rain on a bus window", move="push", grade="night", inT="fade")
st(S[6], 137059, "Amma asks: can't you find a job here?", move="push", grade="warm", ov=[{"k": "caption", "text": "Ravi, can't you find a job somewhere close to home?", "who": "HIS MOTHER", "at": 0.2}])
st(S[7], 53958, "Ravi laughs: what is here, amma?", move="driftR", grade="warm", ov=[{"k": "caption", "text": "What is there here, Mom?", "who": "RAVI", "at": 0.1}])
mg(Wd("hyderabad", S[8]) - 0.2, "Triptych", "Everyone goes to Hyderabad, Bangalore, America", props={"panels": [
    {"video": "@200431", "label": "Hyderabad", "at": 0}, {"video": "@33800", "label": "Bengaluru", "at": 0.6}, {"video": "@176930", "label": "America", "at": 1.3}]}, frames_keys=("panels",))
st(Wd("kaani", S[8]), 43630, "But this Sankranti, different talk at home", move="push", grade="warm")
st(S[9], 242599, "Rumour 1: Google is coming", move="push", grade="cool", inT="flash", ov=[{"k": "headline", "lines": ["“Google is coming.”"], "at": 0.05, "size": 100, "pos": "center"}])
st(S[10], 282244, "Rumour 2: a steel plant is coming", move="pull", grade="natural", inT="flash", ov=[{"k": "headline", "lines": ["“A steel plant is coming.”"], "at": 0.05, "size": 100, "pos": "center"}])
ph(S[11], "v_bhogapuram_6", "Rumour 3: a new airport has opened (real Bhogapuram runway aerial)", inT="flash", ov=[{"k": "headline", "lines": ["“A new airport has opened.”"], "at": 0.05, "size": 100, "pos": "center"}])
st(S[12], 200434, "Rumour 4: Vizag will be the next Hyderabad (real Vizag Beach Road)", move="driftL", grade="warm", inT="flash", ov=[{"k": "headline", "lines": ["“Vizag will be", "the next Hyderabad.”"], "at": 0.1, "size": 100}])
ph(S[13], "v_beachroad_10", "Same time: protests on Vizag Beach Road (real Beach Road from Kailasagiri)", move="driftR", inT="wipe", ov=[place("Beach Road, Visakhapatnam", "PROTESTERS WITH PLACARDS", 0.6)])
st(S[14], 149810, "'They are cutting our hills'", move="push", grade="warn", ov=[ILL, {"k": "caption", "text": "They are cutting down our hills.", "who": "PROTESTERS' SLOGAN", "at": 0.1}])
st(S[15], 143788, "'Our water may disappear'", move="driftL", grade="warn", ov=[ILL, {"k": "caption", "text": "Our water could be gone.", "who": "PROTESTERS' SLOGAN", "at": 0.1}])
st(S[15] + 3.0, 12333, "So Ravi has a doubt", move="push", grade="desat")
mg(S[16], "SplitCompare", "My future? Or a sacrifice for someone else's?", props={
    "left": {"kicker": "IS THIS", "title": "My future?", "video": "@316854"}, "right": {"kicker": "OR A SACRIFICE", "title": "for someone else's?", "video": "@34608"}, "rightAt": F(S[17] - S[16])}, inT="iris")
mg(S[18], "OpenVizag", "Why such a big bet on Vizag? → TITLE (3D terrain, satellite → blueprint)", props={
    "titleAt": F(S[22] - S[18]),
    "qs": [{"t": "Why bet so big on Vizag?", "at": F(0.3)}, {"t": "Why lakhs of crores — here?", "at": F(S[19] - S[18])}, {"t": "What will Andhra gain?", "at": F(S[20] - S[18])}, {"t": "What will it lose?", "at": F(S[21] - S[18])}],
    "words": [{"t": "FACTS", "at": F(S[23] - S[18])}, {"t": "BOTH SIDES", "at": F(S[24] - S[18])}, {"t": "YOUR VERDICT", "at": F(S[25] - S[18])}]}, inT="fade")

# ════════════════════════════ CH 1 · THE HYDERABAD WOUND ════════════════════════════
mg(S[27], "ChapterCard", "Chapter 1 title", props={"index": "01", "title": ["The Hyderabad", "Wound"], "dek": "To understand Vizag, go back to 2014.", "bgClip": "@200431"}, inT="scan")
st(S[28], 74157, "To understand the story, go back to 2014", move="push", ov=[{"k": "headline", "lines": ["Back to 2014."], "at": 0.3, "size": 120, "pos": "center"}])
mg(S[29], "Bifurcation", "June 2, 2014 — AP splits; Hyderabad goes to Telangana; AP keeps coast, Krishna & Godavari (3D)", props={"marks": {"split": F(S[30] - S[29]), "hyd": F(S[32] - S[29]), "coast": F(S[34] - S[29]), "amaravati": 10**6, "vizag": 10**6}}, inT="fade")
st(S[36], 3178, "Lakhs of talented youth", move="driftR", ov=[{"k": "headline", "lines": ["Lakhs of talented", "young people."], "serifLine": 1, "at": 0.1, "size": 86}])
st(S[37], 177973, "But no capital. No IT hub. No Hyderabad.", move="push", grade="night", ov=[{"k": "strike", "items": ["A capital", "An IT hub", "A Hyderabad"], "ats": [0.0, S[38] - S[37], S[39] - S[37]]}])
ph(S[40], "p_naidu_1", "Think about Chandrababu Naidu — CM of united AP 1995–2004", move="pushR", pos="50% 30%", ov=[{"k": "lower", "photo": "@p_naidu_1", "name": "N. Chandrababu Naidu", "role": "CHIEF MINISTER OF UNITED AP · 1995–2004", "credit": "WIKIMEDIA COMMONS · CC BY-SA 4.0", "at": 0.3, "tag": "TDP"}])
ph(S[42], "h_hitec_6", "HITEC City came in his time (Cyber Towers 2002 photo)", move="push", inT="wipe", ov=[place("HITEC City, Hyderabad", "CYBER TOWERS · OPENED 1998", 0.2)])
st(S[43], 200435, "'Cyberabad' — the name was born", move="driftL", ov=[{"k": "headline", "lines": ["“Cyberabad”"], "at": 0.1, "size": 130, "pos": "center"}])
st(S[44], 220941, "Microsoft, IT companies came to Hyderabad", move="rise", grade="cool", ov=[{"k": "headline", "lines": ["Microsoft and global", "IT firms arrive."], "serifLine": 1, "at": 0.1, "size": 80}])
ph(S[45], "p_naidu_1", "He got the 'IT CM' brand", move="pull", grade="desat", pos="50% 30%", inT="flash", ov=[{"k": "headline", "lines": ["“IT CM”"], "at": 0.1, "size": 150, "pos": "center"}])
ph(S[46], "h_hitec_2", "The base city of that brand is now in another state", move="pull", grade="desat", inT="wipe", ov=[{"k": "headline", "lines": ["The city behind the brand", "now belongs to another state."], "serifLine": 1, "at": 0.2, "size": 88}, {"k": "tag", "text": "HYDERABAD · TELANGANA SINCE 2 JUNE 2014", "pos": "tl", "at": 0.3}])
ph(S[47], "a_amaravati_1", "2014: CBN CM again; Amaravati chosen as capital (Velagapudi aerial)", move="driftR", inT="wipe", ov=[place("Amaravati", "CHOSEN AS CAPITAL · FOUNDATION STONE 22 OCT 2015", 0.2), {"k": "tag", "text": "2014 · TDP GOVERNMENT", "pos": "tl", "at": 0.1}])
ph(S[49], "a_amaravati_3", "Oct 22, 2015 foundation stone (under-construction quarters)", move="push", ov=[{"k": "number", "value": 2015, "label": "Foundation stone for Amaravati", "sub": "22 October 2015", "status": "HISTORICAL RECORD", "pos": "left", "at": 0.1}])
# narrator's ad-lib (135.6–158.5): 2019 YSRCP, three capitals, two plans, neither ignored Vizag
ph(135.6, "v_kailasagiri_3", "Ad-lib: 2019 YSRCP wins; Jagan brings three-capitals plan", move="pushL", inT="wipe", ov=[{"k": "lower", "name": "Y. S. Jagan Mohan Reddy", "role": "CHIEF MINISTER · 2019–2024", "photo": "@p_jagan_crop", "credit": "WIKIMEDIA COMMONS · CC BY-SA 2.0", "tag": "YSRCP", "at": 0.3}, {"k": "tag", "text": "2019 · YSRCP GOVERNMENT", "pos": "tl", "at": 0.1}])
mg(141.3, "ThreeCapitals", "Amaravati legislative, Kurnool judicial, Vizag executive (proposed)", inT="fade")
mg(146.0, "SplitCompare", "CBN → Amaravati; Jagan → Vizag", props={"left": {"kicker": "TDP · 2014–2019", "title": "Amaravati", "img": "@a_amaravati_1"}, "right": {"kicker": "YSRCP · 2019–2024", "title": "Visakhapatnam", "img": "@v_beachroad_6"}, "mid": "TWO PLANS", "rightAt": F(1.6)}, inT="iris")
ph(152.0, "v_beachroad_9", "Different plans; neither ignored Vizag", move="driftL", inT="fade", ov=[{"k": "headline", "lines": ["Different plans.", "Neither ignored Vizag."], "serifLine": 1, "at": 0.2, "size": 92}])
st(156.6, 56730, "2024: TDP–Janasena–BJP alliance; CBN CM again", move="push", inT="wipe", ov=[{"k": "headline", "lines": ["June 2024", "TDP–Janasena–BJP alliance wins"], "serifLine": 1, "at": 0.2, "size": 96}, {"k": "tag", "text": "ELECTION RESULT", "pos": "tl", "at": 0.3}])
mg(S[52], "TwoRoles", "Amaravati keeps capital; Vizag gets new role: economic engine (3D map)", inT="fade")
st(S[53], 200434, "Visible on the ground in Vizag", move="driftR", grade="warm", inT="wipe", ov=[place("Visakhapatnam", "BEACH ROAD", 0.2)])
ph(S[54], "v_kailasagiri_0", "'Swarna Andhra' — Vizag financial nucleus, knowledge hub", move="driftL", ov=[{"k": "headline", "lines": ["“Swarna Andhra”", "a financial nucleus and knowledge hub"], "serifLine": 1, "at": 0.2, "size": 96}, {"k": "tag", "text": "STATE GOVERNMENT VISION", "pos": "tl", "at": 0.4}])
mg(S[55], "SplitCompare", "Amaravati runs the state, Vizag earns for it", props={"left": {"kicker": "AMARAVATI", "title": "Runs the state", "img": "@a_secretariat_2"}, "right": {"kicker": "VISAKHAPATNAM", "title": "Earns for the state", "img": "@v_dolphin_9"}, "rightAt": F(2.4)}, inT="wipe")
mg(S[56], "CityChoice", "Among so many cities, why Vizag? (3D AP map)", inT="fade")

# ════════════════════════════ CH 2 · WHY VIZAG? ════════════════════════════
mg(S[57], "ChapterCard", "Chapter 2 title", props={"index": "02", "title": ["Why Vizag?"], "dek": "They call it the “City of Destiny.”", "bgClip": "@v_dolphin_9", "bgKind": "image"}, inT="scan")
ph(S[60], "v_dolphin_5", "The name isn't accidental — solid reasons", move="push", ov=[{"k": "credit", "text": "PHOTO · WIKIMEDIA COMMONS · CC BY-SA 4.0"}])
mg(S[61], "WhyVizagMap", "First: the sea — natural deep harbour ringed by hills (3D, satellite→blueprint)", props={"mode": "harbour"}, inT="fade", ov=[{"k": "tag", "text": "01 · THE SEA", "pos": "tl", "at": 0.1, "color": C["teal"]}])
st(S[63], 216315, "Ships, cargo, heavy industry — gold", move="driftL", ov=[ILL])
st(S[63] + 2.4, 24255, "Port at night", move="push", grade="night")
ph(S[64], "v_submarine_0", "Second: the Navy (INS Kursura museum, Vizag)", move="driftR", ov=[{"k": "tag", "text": "02 · THE NAVY", "pos": "tl", "at": 0.1, "color": C["teal"]}, place("INS Kursura, Visakhapatnam", "SUBMARINE MUSEUM ON RK BEACH", 0.4)])
mg(S[65], "WhyVizagMap", "Eastern Naval Command HQ (3D pin)", props={"mode": "navy"}, inT="fade")
st(S[65] + 4.2, 183881, "Bay of Bengal — strategic", move="pull", ov=[place("Bay of Bengal", "INDIA'S EASTERN SEABOARD", 0.2)])
mg(S[66], "WhyVizagMap", "Third: industrial base — steel, refinery, port, pharma", props={"mode": "industry"}, inT="scan", ov=[{"k": "tag", "text": "03 · AN INDUSTRIAL BASE", "pos": "tl", "at": 0.1, "color": C["teal"]}])
ph(S[67], "v_steel_1", "Vizag Steel Plant skyline panorama (real)", move="driftL", ov=[place("Visakhapatnam Steel Plant", "RINL · PUBLIC SECTOR", 0.2)])
st(S[67] + 2.0, 330501, "Refinery", move="push", grade="night")
st(S[67] + 3.6, 81241, "Pharma", move="driftR")
ph(S[68], "v_kailasagiri_3", "~25 lakh people, a ready-made city", move="driftR", ov=[{"k": "number", "value": 25, "suffix": " lakh", "label": "people, roughly — a ready-made city", "status": "APPROXIMATE · AS STATED", "pos": "left", "at": 0.2}])
ph(S[69], "v_beachroad_6", "Fourth: resilience — Cyclone Hudhud, 12 Oct 2014", move="driftR", inT="wipe", ov=[{"k": "tag", "text": "04 · RESILIENCE", "pos": "tl", "at": 0.1, "color": C["teal"]}, {"k": "headline", "lines": ["Cyclone Hudhud", "12 October 2014"], "serifLine": 1, "at": S[70] - S[69], "size": 100}])
ph(S[70], "v_hudhud_sat_6", "Hudhud satellite image on landfall day (NASA, PD)", move="push", pos="50% 45%", ov=[{"k": "tag", "text": "NASA SATELLITE IMAGE · 12 OCT 2014", "pos": "tl", "at": 0.2}, {"k": "credit", "text": "IMAGE · NASA (PUBLIC DOMAIN)"}])
ph(S[70] + 4.5, "v_hudhud_sat_8", "Hudhud track (PD)", move="driftL", ov=[{"k": "credit", "text": "TRACK MAP · PUBLIC DOMAIN (WIKIMEDIA COMMONS)"}])
ph(S[71], "v_beachroad_5", "Comeback story matters to investors (rebuilt Beach Road 2019)", move="driftR", inT="wipe", ov=[{"k": "headline", "lines": ["A comeback story", "investors remember."], "serifLine": 1, "at": 0.2, "size": 88}])
st(S[72], 22183, "But the real game changer?", move="push", grade="cool", ov=[{"k": "headline", "lines": ["The real game changer?"], "at": 0.3, "size": 100, "pos": "center"}])
mg(S[73], "SubseaScene", "HERO part 1: 'wires under the sea' — dive into the Bay, seabed cable with light pulses (3D)", props={"a": 0, "b": 300}, inT="fade",
   ov=[{"k": "headline", "lines": ["Subsea cables."], "at": S[74] - S[73], "size": 120, "pos": "bottom"}])
st(S[75], 134872, "Your phone: video, messages, AI", move="push", grade="warm")
mg(S[75] + 2.0, "PhoneZoom", "Zoom through the phone into the network")
mg(S[75] + 4.6, "SubseaScene", "HERO part 2: cable cross-section → landing station → data centre (3D)", props={"a": 300, "b": 900}, inT="flash")
mg(S[77], "QuoteCard", "Kurian: Vizag hub linked by subsea cables to Google's global network", props={"quote": "The Visakhapatnam hub will be a landing point for multiple international subsea cables, connected to Google's global network.", "who": "Thomas Kurian (paraphrased)", "role": "CEO, GOOGLE CLOUD · 14 OCT 2025", "status": "COMPANY STATEMENT", "photo": "@p_kurian_0", "size": 50, "bg": "@pib_mou_panel"}, inT="wipe")
mg(S[77] + 3.8, "CableMap", "HERO: real cable routes on Bay of Bengal seafloor; proposed Vizag gateway", props={"propAt": 30}, inT="fade")
mg(S[78], "DataGap", "~20% of world's data vs ~3% of capacity", props={"bg": "@255761"}, inT="wipe")
st(S[79], 2860, "Demand huge, supply missing", move="push", grade="night", ov=[{"k": "headline", "lines": ["Huge demand.", "Little supply."], "serifLine": 1, "at": 0.2, "size": 100}])
mg(S[80], "WhyVizagMap", "Coast, cables, land, power (Vizag blueprint)", props={"mode": "ingredients"}, inT="scan")
st(S[82], 377885, "Big tech turns toward Vizag", move="push", grade="cool")
st(S[82] + 3.0, 242599, "Server hall", move="pull", grade="cool", ov=[{"k": "headline", "lines": ["Big Tech turns", "towards Vizag."], "serifLine": 1, "at": 0.2, "size": 100}])

# ════════════════════════════ CH 3 · THE BIG BETS ════════════════════════════
mg(S[83], "ChapterCard", "Chapter 3 title", props={"index": "03", "title": ["The Big Bets"], "dek": "Five bets on one coastline.", "bgClip": "@v_dolphin_10", "bgKind": "image"}, inT="scan")
mg(S[85], "BetIndex", "Five bets index", props={"items": ["Google AI Hub", "Data-Centre City", "Steel City", "Bhogapuram Airport", "Economic Region"], "bg": "@23008"}, inT="wipe")
mg(S[86], "BetCard", "Bet 1 — Google AI Hub", props={"n": "01", "title": "Google AI Hub", "dek": "A $15 billion bet on AI infrastructure.", "bg": "@377880"}, inT="wipe")
st(S[87], 206065, "Oct 14, 2025 in New Delhi", move="push", ov=[place("New Delhi", "14 OCTOBER 2025", 0.2)])
ph(S[87] + 2.0, "pib_mou_group", "MoU between AP IT dept and Google (PIB photo: Koley, Vaishnaw, Sitharaman, Naidu, Lokesh, Kurian)", move="push", inT="wipe", ov=[{"k": "tag", "text": "MoU SIGNED · 14 OCT 2025", "pos": "tl", "at": 0.2}, {"k": "credit", "text": "PHOTO · PRESS INFORMATION BUREAU, GOVT. OF INDIA (GODL-INDIA)"}])
mg(S[88], "DocScene", "Google blog headline; $15B over 2026–2030", props={"kicker": "GOOGLE · THE KEYWORD (INDIA)", "headline": "Our first AI hub in India, powered by a $15 billion investment", "body": ["Approximately US$15 billion over five years, 2026–2030.", "Data-centre capacity, clean energy, subsea and fibre connectivity."], "highlight": 0, "date": "14 OCT 2025", "source": "blog.google · Google India announcement (headline quoted; body summarised)", "bg": "@336239"}, inT="wipe")
st(S[88] + 4.0, 316736, "$15B = ~₹1.3 lakh crore", move="push", grade="cool", ov=[{"k": "number", "value": 15, "prefix": "$", "suffix": " bn", "label": "≈ ₹1.3 lakh crore over 2026–2030", "status": "ANNOUNCED INVESTMENT", "source": "Google, 14 Oct 2025", "pos": "left", "at": 0.1}])
st(S[89], 14906, "Largest Google AI investment outside the US", move="driftL", grade="cool", ov=[{"k": "headline", "lines": ["Google's largest AI hub", "investment outside the US"], "serifLine": 1, "at": 0.1, "size": 84}, {"k": "tag", "text": "COMPANY STATEMENT", "pos": "tl", "at": 0.3}])
ph(S[90], "pib_ground_shovels", "Apr 28, 2026 ground-breaking with Naidu & Vaishnaw (PIB)", move="push", inT="wipe", ov=[{"k": "tag", "text": "GROUND-BREAKING · 28 APR 2026", "pos": "tl", "at": 0.2}, {"k": "credit", "text": "PHOTO · PRESS INFORMATION BUREAU, GOVT. OF INDIA (GODL-INDIA)"}])
ph(S[90] + 4.2, "pib_ground_stage", "Vaishnaw at the ceremony (PIB)", move="driftR", ov=[{"k": "lower", "name": "Ashwini Vaishnaw", "role": "UNION MINISTER, ELECTRONICS & IT", "credit": "PIB (GODL-INDIA)", "at": 0.2, "side": "r"}])
mg(S[91], "QuoteCard", "'Visakhapatnam will be born as AI-Patnam'", props={"quote": "Visakhapatnam will be born as AI-Patnam.", "who": "Ashwini Vaishnaw", "role": "UNION IT MINISTER · 28 APR 2026", "status": "STATEMENT", "photo": "@pib_vaishnaw_talk", "size": 74, "bg": "@14900"}, inT="wipe")
mg(Wd("1", S[91]) - 0.3, "GigawattCubes", "1 GW capacity (3D lattice)", props={"label": "Planned capacity of the Google AI hub", "status": "ANNOUNCED"}, inT="fade")
mg(Wd("tarluvada", S[91]) - 0.2, "GoogleSites", "Tarluvada, Adavivaram, Rambilli — ~600 acres (3D map)", inT="fade")
mg(S[92], "DataCentreCampus", "HERO part 1: anatomy of an AI data centre (3D exterior) — AdaniConneX, Airtel partners", props={"status": "PROPOSED · EXPLAINER, NOT THE ACTUAL DESIGN", "a": 0, "b": 440}, inT="fade", ov=[
    {"k": "tag", "text": "BUILT WITH ADANICONNEX (ADANI × EDGECONNEX) · AIRTEL (NXTRA)", "pos": "br", "at": 2.0, "color": C["silver"]}])
mg(S[93], "BetCard", "Bet 2 — Data-centre city", props={"n": "02", "title": "Data-Centre City", "dek": "Google is not alone.", "bg": "@377880"}, inT="wipe")
st(S[94], 316854, "Reliance–Brookfield–Digital Realty JV: $11B AI data centre", move="push", grade="cool", ov=[{"k": "number", "value": 11, "prefix": "$", "suffix": " bn", "label": "Digital Connexion — Reliance · Brookfield · Digital Realty", "sub": "1 GW AI data-centre campus in Visakhapatnam", "status": "MoU · ANNOUNCED NOV 2025", "source": "Company announcement, Nov 2025", "pos": "left", "at": 0.2}])
st(S[94] + 5.2, 14907, "Network racks", move="driftR", grade="cool")
mg(S[95], "CapacityBars", "~9 GW claim vs published ~6–6.5 GW", props={"bg": "@g_google_dc_2"}, inT="wipe")
mg(S[96], "SteelText", "Bet 3 — Steel City (molten steel inside type)", props={"clip": "@282244", "word": "STEEL", "sub": "BET 03 · STEEL CITY"}, inT="flash")
mg(S[97], "SteelSite", "Mar 23, 2026 — Rajayyapeta, Nakkapalli, Anakapalli (3D map)", inT="fade")
st(S[97] + 4.0, 120734, "Blast furnace (illustrative)", move="push", ov=[ILL])
mg(S[98], "SteelCity", "₹1.36 lakh crore · 17.8 MTPA · 5,465 acres (3D beams)", props={"facts": [{"n": "₹1.36 L cr", "l": "INVESTMENT", "tag": "COMPANY / STATE FIGURE", "at": F(0.6)}, {"n": "17.8 MTPA", "l": "TWO PHASES (PHASE 1: 8.2 MTPA)", "tag": "PLANNED CAPACITY", "at": F(3.8)}, {"n": "5,465 acres", "l": "LAND", "tag": "AS STATED", "at": F(6.2)}]}, inT="fade")
ph(S[99], "p_naidu_1", "CBN: 'Not a steel plant — a steel city'", move="push", grade="warm", pos="50% 30%", ov=[{"k": "quote", "quote": "We are not building a steel plant. We are building a steel city.", "who": "N. Chandrababu Naidu", "role": "CHIEF MINISTER · 23 MAR 2026 (TRANSLATED)", "status": "STATEMENT", "at": 0.1, "size": 58}])
mg(Wd("bet", S[99]), "BetCard", "Bet 4 — New airport", props={"n": "04", "title": "Bhogapuram Airport", "dek": "Vizag's own international airport.", "bg": "@v_bhogapuram_9", "bgKind": "image"}, inT="wipe")
ph(S[100], "v_bhogapuram_0", "Bhogapuram ASR International Airport — aerial (construction phase photo)", move="driftR", inT="wipe", ov=[place("Alluri Sitarama Raju International Airport", "BHOGAPURAM · AERIAL DURING CONSTRUCTION", 0.2), {"k": "credit", "text": "PHOTO · WIKIMEDIA COMMONS · CC BY-SA 4.0"}])
mg(S[100] + 4.4, "Runway3D", "Inaugurated Aug 2026 by PM Modi; flights from Aug 17 (3D runway)", props={"chips": [{"t": "Inaugurated by PM Modi · 1 Aug 2026", "at": F(0.5), "tag": "OPERATIONAL", "color": C["teal"]}, {"t": "All Vizag flights moved · 17 Aug 2026", "at": F(3.2), "tag": "OPERATIONAL", "color": C["teal"]}]}, inT="fade")
ph(S[101], "v_bhogapuram_10", "Original deadline Dec 2026 — opened months early (terminal under construction May 2026)", move="push", ov=[{"k": "doc", "kicker": "PROJECT TIMELINE", "headline": "Target: December 2026. Opened: August 2026.", "body": ["Commercial flights began on 17 August 2026."], "date": "2026", "source": "PIB · airport operator announcements", "at": 0.2}])
ph(S[102], "v_vizag_airport_4", "Old airport: civil enclave at INS Dega naval air station", move="driftL", ov=[place("Old Visakhapatnam Airport", "CIVIL ENCLAVE AT NAVAL AIR STATION INS DEGA", 0.2), {"k": "credit", "text": "PHOTO · WIKIMEDIA COMMONS · CC BY-SA 4.0"}])
st(S[102] + 4.5, 143853, "Now Vizag has its own international airport", move="push", ov=[ILL])
mg(S[103], "BetCard", "Bet 5 — Master plan", props={"n": "05", "title": "The Master Plan", "dek": "Visakhapatnam Economic Region (VER).", "bg": "@v_kailasagiri_0", "bgKind": "image"}, inT="wipe")
mg(S[104], "VERMap", "VER Srikakulam→Konaseema, 2032 target, sectors, corridor (3D paper map)", props={"marks": {"corridor": F(S[105] - S[104]), "sectors": F(S[106] - S[104]), "target": F(S[105] - S[104] + 3)}}, inT="fade")
st(S[107], 1191, "31st CII Partnership Summit, Nov 12–13, 58 countries, MoUs", move="push", ov=[ILL, {"k": "doc", "kicker": "31ST CII PARTNERSHIP SUMMIT · VISAKHAPATNAM", "headline": "Delegates from about 58 countries. MoUs worth lakhs of crores.", "body": ["Day 1: 73 MoUs and 15 government orders, ₹5.84 lakh crore proposed."], "highlight": 0, "date": "12–13 NOV 2026", "source": "CII · state announcements as reported (proposed, not invested)", "at": 0.3}])
ph(S[107] + 6.0, "p_lokesh_0", "Lokesh at an earlier CII summit (2025)", move="push", pos="50% 30%", ov=[{"k": "lower", "name": "Nara Lokesh", "role": "AP IT MINISTER · AT THE 2025 CII SUMMIT", "credit": "WIKIMEDIA COMMONS · CC BY-SA 4.0", "at": 0.1}])
mg(S[108], "StatusFunnel", "Wait — MoUs are only promises; not every rupee reaches the ground", props={"bg": "@318026"}, inT="scan")
st(S[111], 1643, "What does the ordinary Andhra person get?", move="driftR", ov=[{"k": "headline", "lines": ["What does an ordinary", "Andhra family get?"], "serifLine": 1, "at": 0.2, "size": 96}])

# ════════════════════════════ CH 4 · WHAT'S IN IT FOR ANDHRA? ════════════════════════════
mg(S[112], "ChapterCard", "Chapter 4 title", props={"index": "04", "title": ["What's in it", "for Andhra?"], "dek": "Jobs, promises — and the fine print.", "bgClip": "@3178"}, inT="scan")
mg(S[115] - 0.6, "NorthAndhra", "People like Ravi — lakhs across North Andhra (3D)", inT="fade")
st(Wd("construction", S[115]) - 0.4, 116763, "Construction workers", move="push", ov=[{"k": "headline", "lines": ["Construction workers"], "at": 0.1, "size": 76, "pos": "bottom"}])
st(Wd("nurses", S[115]) - 1.6, 39892, "IT engineers", move="driftL", ov=[{"k": "headline", "lines": ["IT engineers"], "at": 0.1, "size": 76, "pos": "bottom"}])
st(Wd("nurses", S[115]) - 0.2, 143376, "Nurses", move="push", ov=[{"k": "headline", "lines": ["Nurses"], "at": 0.1, "size": 76, "pos": "bottom"}])
mg(Wd("nurses", S[115]) + 1.4, "Migration", "All go to Hyderabad, Bangalore, Chennai, Gulf (3D arcs)", inT="fade")
st(S[117 - 1] + 0.0 if False else 538.5, 3175, "Govt pitch: your children needn't leave", move="driftR", inT="wipe", ov=[{"k": "quote", "quote": "Your children no longer need to leave. The jobs will come here.", "who": "The government's pitch", "role": "AS SUMMARISED IN NARRATION", "status": "GOVERNMENT CLAIM", "at": 0.2, "size": 56}])
st(Wd("arcelormittal", 540) - 0.4, 135849, "AM/NS: ~1 lakh direct+indirect jobs (company)", move="push", ov=[{"k": "number", "value": 100000, "label": "direct & indirect jobs during construction & development", "sub": "ArcelorMittal Nippon Steel India", "status": "COMPANY ESTIMATE", "source": "AM/NS India, Mar 2026", "pos": "left", "at": 0.2}])
st(S[117], 14900, "Google: $688M local economic activity / year", move="push", grade="cool", ov=[{"k": "number", "value": 688, "prefix": "$", "suffix": " mn / yr", "label": "local economic activity, every year", "status": "COMPANY ESTIMATE", "source": "Google, as reported (Business Standard, AFP)", "pos": "left", "at": 0.2}])
mg(Wd("4,200", S[117]) - 0.5 if False else S[117] + 7.0, "JobsIsotype", "~4,200 construction jobs (dots) — permanent comes later", props={"showPermanentAt": 10**6}, inT="wipe")
st(S[118], 7517, "Cargo terminal → seafood exports", move="driftR", ov=[ILL, {"k": "number", "value": 25000, "suffix": " t", "label": "annual cargo-terminal capacity, Bhogapuram", "status": "PLANNED", "source": "Airport operator / reports, 2026", "pos": "left", "at": 0.2}])
st(S[118] + 5.0, 57049, "Pharma exports", move="push")
st(S[118] + 7.6, 182082, "Horticulture & seafood to the world", move="pull")
ph(S[119], "v_steel_3", "Emotional angle: Vizag Steel Plant (pylon at the plant)", move="driftR", inT="wipe", ov=[place("Vizag Steel Plant", "RASHTRIYA ISPAT NIGAM LTD (RINL)", 0.2)])
st(S[120], 10447, "'Visakha Ukku, Andhrula Hakku' — the slogan", move="driftL", ov=[{"k": "headline", "lines": ["“Visakha Steel is", "Andhra's right.”"], "serifLine": 1, "at": 0.1, "size": 104}, {"k": "tag", "text": "TRANSLATED · A DECADES-OLD PUBLIC SLOGAN", "pos": "tl", "at": 0.3}, ILL])
ph(S[120] + 5.5, "v_steel_1", "Centre promised RINL support (Mar 2026)", move="push", ov=[{"k": "doc", "kicker": "FOUNDATION DAY · AM/NS PLANT · 23 MAR 2026", "headline": "Union ministers promise financial support for RINL and higher capacity.", "body": ["A promise — not yet delivered."], "highlight": 0, "source": "Statements at the event, as reported", "at": 0.2}])
ph(S[121], "p_naidu_1", "Political angle: CBN's brand rests on development", move="pull", grade="desat", pos="50% 30%", inT="wipe", ov=[{"k": "headline", "lines": ["A political brand", "built on development."], "serifLine": 1, "at": 0.2, "size": 92}])
mg(S[122], "SplitCompare", "Legacy 1: HITEC City; Legacy 2: AI city?", props={"left": {"kicker": "LEGACY 1 · 1998", "title": "HITEC City", "img": "@h_hitec_2", "tag": "BUILT", "tagColor": C["teal"]}, "right": {"kicker": "LEGACY 2 · 2026 →", "title": "An AI city?", "video": "@182597", "tag": "PROPOSED"}, "rightAt": F(3.0)}, inT="iris")
st(S[123], 152728, "Or the MoUs stay headlines", move="push", grade="desat", ov=[{"k": "headline", "lines": ["…or just headlines?"], "at": 0.3, "size": 110, "pos": "center"}])
st(S[124], 14907, "The twist", move="push", grade="cool", inT="flash", ov=[{"k": "headline", "lines": ["The twist."], "at": 0.1, "size": 130, "pos": "center"}])
mg(S[125], "DocScene", "Google statement: permanent specialist jobs only 'hundreds' after 2028", props={"kicker": "GOOGLE · PROJECT ESTIMATES (AS REPORTED)", "headline": "Once operational in 2028, the hub would support hundreds of specialist jobs.", "body": ["About 4,200 construction jobs during a typical build.", "About $688 million of local economic activity a year."], "highlight": -1, "date": "OCT 2026", "source": "Google, as reported by AFP and Business Standard · paraphrased", "bg": "@14906"}, inT="wipe")
mg(S[125] + 6.0, "JobsIsotype", "Construction ~4,200 vs permanent 'hundreds' (isotype)", props={"showPermanentAt": F(0.6)}, inT="wipe")
mg(S[126], "SplitCompare", "$15 billion … for hundreds of jobs?", props={"left": {"kicker": "INVESTMENT", "title": "$15 billion", "video": "@377885"}, "right": {"kicker": "PERMANENT JOBS", "title": "“Hundreds”", "video": "@139521", "tag": "COMPANY ESTIMATE"}, "rightAt": F(1.6)}, inT="iris")
st(S[127], 8698, "Critics' first question", move="driftL", ov=[{"k": "headline", "lines": ["The critics'", "first question."], "serifLine": 1, "at": 0.1, "size": 96}])
st(S[128], 116693, "Activist: we need mass employment, labour-intensive industries", move="push", ov=[{"k": "quote", "quote": "We need mass employment and labour-intensive industries — not high-capital ones.", "who": "An activist", "role": "AS QUOTED IN NARRATION", "status": "CRITIC", "statusColor": C["coral"], "at": 0.2, "size": 54}])
mg(S[128] + 6.5, "DataCentreCampus", "HERO part 2: inside the hall — racks, cooling; lots of land/power/water, few people (3D)", props={"status": "EXPLAINER", "a": 420, "b": 900, "caption": "Land, power, water — but few people."}, inT="fade")
mg(S[129], "EnvMap", "This is where the fight begins (blueprint turns green)", props={"mode": "question", "words": []}, inT="fade")

# ════════════════════════════ CH 5 · THE BACKLASH ════════════════════════════
mg(S[130], "ChapterCard", "Chapter 5 title", props={"index": "05", "title": ["The Backlash"], "dek": "The other side of the coin.", "bgClip": "@364184"}, inT="scan")
mg(S[132], "EnvMap", "Tarluvada (2016 satellite = before)", props={"mode": "tarluvada"}, inT="fade")
st(S[132] + 4.5, 275593, "Hills cleared, green → red earth", move="driftR", ov=[ILL, {"k": "headline", "lines": ["Green hills,", "now red earth."], "serifLine": 1, "at": 0.2, "size": 92}])
st(S[132] + 7.6, 127958, "Excavators clearing land", move="push", ov=[ILL])
mg(S[133], "SplitCompare", "Three fears: water, power, jobs", props={"left": {"kicker": "FEAR 01 · 02", "title": "Water & power", "img": "@v_mudasarlova_3"}, "right": {"kicker": "FEAR 03", "title": "Jobs", "video": "@8698"}, "mid": "WHAT VIZAG FEARS", "rightAt": F(2.2)}, inT="wipe")
st(S[134], 2151, "DCs pull water and power", move="driftL", grade="warn", ov=[{"k": "headline", "lines": ["Water and power in.", "Few jobs out."], "serifLine": 1, "at": 0.2, "size": 90}, {"k": "tag", "text": "RESIDENTS' CONCERN", "pos": "tl", "at": 0.4, "color": C["coral"]}])
st(S[134] + 4.6, 37758, "Power demand", move="push", grade="warn")
ph(S[135], "v_mudasarlova_3", "First concern: water — Mudasarlova reservoir (real aerial)", move="push", inT="wipe", ov=[{"k": "tag", "text": "CONCERN 01 · WATER", "pos": "tl", "at": 0.1, "color": C["teal"]}, place("Mudasarlova Reservoir", "SUPPLIES DRINKING WATER TO VIZAG", 0.4), {"k": "credit", "text": "PHOTO · WIKIMEDIA COMMONS · CC BY-SA 4.0"}])
mg(S[136] + 2.5, "EnvMap", "Mudasarlova reservoir + Adavivaram site (3D, OSM polygon)", props={"mode": "mudasarlova"}, inT="fade")
mg(S[138], "QuoteCard", "V.S. Krishna (HRF): DC 120 m from drinking-water reservoir?", props={"quote": "Can anyone imagine a data centre just 120 metres from a drinking-water reservoir?", "who": "V. S. Krishna", "role": "HUMAN RIGHTS FORUM (TRANSLATED)", "status": "ALLEGATION", "statusColor": C["coral"], "size": 60, "bg": "@v_mudasarlova_11"}, inT="wipe")
mg(Wd("may", S[138]) - 0.2, "SplitCompare", "Viral video: clean jar vs brown jar (allegation)", props={"left": {"kicker": "JAR 1", "title": "Clean water", "video": "@109879"}, "right": {"kicker": "JAR 2", "title": "Brown, muddy water", "video": "@208788", "tag": "ALLEGATION · VIRAL VIDEO, MAY 2026", "tagColor": C["coral"]}, "mid": "WHAT THE VIRAL VIDEO SHOWED · RECONSTRUCTION", "rightAt": F(1.2)}, inT="iris")
ph(S[139], "v_simhachalam_10", "Second concern: land — Simhachalam Devasthanam", move="driftL", inT="wipe", ov=[{"k": "tag", "text": "CONCERN 02 · LAND", "pos": "tl", "at": 0.1, "color": C["yellow"]}])
mg(S[140] + 1.2, "QuoteCard", "Prof. Khairagi Reddy: 160 acres of temple land, no EIA/hearing", props={"quote": "160 acres of Simhachalam Devasthanam land was given to the Google–Adani data centre without an environmental impact assessment or a public hearing.", "who": "Prof. Khairagi Reddy", "role": "HONORARY PRESIDENT, GREEN VISAKHAPATNAM", "status": "ALLEGATION", "statusColor": C["coral"], "size": 46, "bg": "@v_simhachalam_6"}, inT="wipe")
mg(S[141], "EnvMap", "Kambalakonda sanctuary close to sites (3D)", props={"mode": "kambalakonda"}, inT="fade")
ph(S[142], "v_kambalakonda_10", "Third concern: clearances (Kambalakonda & Mudasarlova view)", move="push", ov=[{"k": "tag", "text": "CONCERN 03 · CLEARANCES", "pos": "tl", "at": 0.1, "color": C["yellow"]}, {"k": "credit", "text": "PHOTO · WIKIMEDIA COMMONS · CC BY-SA 4.0"}])
mg(S[143], "DocScene", "June 2026: SEIAA granted EC to Adavivaram–Mudasarlova project", props={"kicker": "STATE ENVIRONMENT IMPACT ASSESSMENT AUTHORITY, AP", "headline": "Environmental Clearance granted to the Adavivaram–Mudasarlova data-centre park.", "body": ["June 2026 · appraised as a Category B2 building project.", "Challenged before the National Green Tribunal."], "highlight": 0, "date": "JUNE 2026", "source": "As reported from HRF statement (13 Jun 2026) and NGT proceedings", "bg": "@v_kambalakonda_11"}, inT="wipe")
mg(S[144], "QuoteCard", "HRF: 'brazen injustice'; works before clearance", props={"quote": "Brazen injustice — site works began before the clearance was granted.", "who": "Human Rights Forum", "role": "STATEMENT, 13 JUNE 2026", "status": "ALLEGATION", "statusColor": C["coral"], "size": 60, "bg": "@3741"}, inT="wipe")
ph(S[145], "v_hudhud_sat_3", "Cyclone-prone coast — Hudhud not forgotten", move="pull", ov=[{"k": "tag", "text": "CYCLONE HUDHUD · NASA · 11 OCT 2014", "pos": "tl", "at": 0.1}, {"k": "credit", "text": "IMAGE · NASA (PUBLIC DOMAIN)"}])
st(S[146], 230083, "Fourth concern: silencing voices", move="push", grade="desat", inT="wipe", ov=[ILL, {"k": "tag", "text": "CONCERN 04 · VOICES", "pos": "tl", "at": 0.1, "color": C["coral"]}])
mg(S[147], "DocScene", "July 27, 2026: Left leaders detained en route to Tarluvada", props={"kicker": "TARLUVADA · ANANDAPURAM MANDAL", "headline": "Police detain Left party leaders on their way to meet farmers who lost land.", "body": ["HRF alleges an attempt to stop public discussion."], "highlight": 0, "date": "27 JUL 2026", "source": "As reported (The Hindu, Prajasakti) · HRF allegation", "bg": "@214619"}, inT="wipe")
ph(S[148], "v_beachroad_2", "Beach Road awareness protests (Green Visakha)", move="driftR", ov=[place("Beach Road, Visakhapatnam", "AWARENESS PROTESTS BY GREEN VISAKHA & OTHERS", 0.2), {"k": "credit", "text": "PHOTO · WIKIMEDIA COMMONS · CC BY 4.0"}])
mg(S[149], "BetCard", "What does the government say?", props={"n": "?", "title": "The government's answer", "dek": "", "bg": "@pib_mou_panel", "bgKind": "image"}, inT="wipe")
ph(S[150], "p_lokesh_0", "Lokesh defends: thermal plant uses far more water", move="push", pos="50% 30%", ov=[{"k": "quote", "quote": "A 1 GW thermal power plant uses many times more water than a 1 GW data centre.", "who": "Nara Lokesh", "role": "AP IT MINISTER (TRANSLATED · NARRATION SAYS 7×; ASSEMBLY REPORTS SAY ~10×)", "status": "GOVERNMENT RESPONSE", "statusColor": C["silver"], "at": 0.2, "size": 52}])
st(S[151], 208788, "Water source named: Rural Water Supply dept", move="pull", ov=[ILL, {"k": "doc", "kicker": "ENVIRONMENTAL CLEARANCES · TWO DATA-CENTRE PARKS", "headline": "Water source cited: Rural Water Supply department.", "body": ["Government says city drinking water will not be diverted."], "highlight": 0, "source": "As stated by the government", "at": 0.2}])
st(S[152], 39892, "'For Andhra's youth; every big project faces opposition'", move="driftL", ov=[{"k": "headline", "lines": ["“For Andhra's youth.”", "Every big project faces opposition."], "serifLine": 1, "at": 0.2, "size": 84}, {"k": "tag", "text": "GOVERNMENT MESSAGE", "pos": "tl", "at": 0.3}])
st(S[153], 37758, "Worldwide fight over AI data centres", move="push", ov=[{"k": "headline", "lines": ["Not just a Vizag fight."], "at": 0.1, "size": 100, "pos": "center"}])
st(S[154], 335040, "Finland: Google sites halted pending mandatory EIA", move="driftR", ov=[{"k": "place", "name": "Finland · Muhos & Kajaani", "sub": "OCT 2026 · WORK ORDERED TO PAUSE UNTIL ASSESSMENTS ARE DONE", "at": 0.2}, ILL])
st(S[154] + 4.6, 22378, "Finnish forest", move="push")
mg(S[155], "EnvMap", "Where? How? At whose cost?", props={"mode": "question", "words": [{"t": "Where?", "at": F(1.6)}, {"t": "How?", "at": F(2.6)}, {"t": "At whose cost?", "at": F(3.6)}]}, inT="fade")
st(S[156], 152728, "Twist: politics", move="push", grade="desat", ov=[{"k": "headline", "lines": ["Enter: politics."], "at": 0.1, "size": 120, "pos": "center"}])

# ════════════════════════════ CH 6 · THE CREDIT WAR ════════════════════════════
mg(S[157], "ChapterCard", "Chapter 6 title", props={"index": "06", "title": ["The Credit War"], "dek": "A big project — and a bigger fight over who gets credit.", "bgClip": "@87146"}, inT="scan")
st(S[157] + 5.6, 199297, "In Andhra politics, the first fight is over credit", move="driftL", ov=[{"k": "headline", "lines": ["The first fight", "is always over credit."], "serifLine": 1, "at": 0.2, "size": 92}])
YS = [
    {"date": "NOV 2020", "text": "Land allotted to Adani for a 300 MW data centre, says YSRCP", "tag": "YSRCP CLAIM", "x": 2020.85},
    {"date": "3 MAY 2023", "text": "Jagan lays foundation stone for Adani data centres", "tag": "VERIFIED", "x": 2023.33},
    {"date": "2020–24", "text": "Singapore–Vizag 3,900 km cable project begun, says YSRCP", "tag": "YSRCP CLAIM", "x": 2022.0},
]
TD = [
    {"date": "FEB 2019", "text": "Naidu lays foundation for Adani data centre (TDP govt)", "tag": "VERIFIED", "x": 2019.12},
    {"date": "2019–24", "text": "Project delayed under YSRCP, says TDP", "tag": "TDP CLAIM", "x": 2021.6},
    {"date": "14 OCT 2025", "text": "US$15 bn Google AI hub MoU under coalition govt", "tag": "VERIFIED", "x": 2025.78},
]
def evs(lst, starts): return [{**e, "at": F(s)} for e, s in zip(lst, starts)]
st(S[159], 154195, "First, YSRCP's argument", move="driftR", ov=[{"k": "tag", "text": "YSRCP'S ARGUMENT", "pos": "tl", "at": 0.1}])
mg(S[160], "CreditTimeline", "Jagan calls CBN 'credit chor'; YSRCP timeline claims (neutral two-track)", props={
    "top": {"name": "YSRCP", "photo": "@p_jagan_crop", "events": evs(YS, [1.0, 3.0, 5.0])},
    "bottom": {"name": "TDP", "photo": "@p_naidu_1", "events": evs(TD, [99, 99, 99])}}, inT="wipe")
st(S[160] + 8.2, 206694, "3 May 2023: Jagan lays foundation for Adani DC (verified)", move="driftL", ov=[ILL, {"k": "doc", "kicker": "VISAKHAPATNAM · 3 MAY 2023", "headline": "Jagan lays the foundation for Adani data centres: 200 MW at Madhurawada, 100 MW at Kapuluppada.", "body": ["Reported investment: ₹21,844 crore."], "highlight": 0, "source": "Deccan Herald, Siasat, Yo Vizag (May 2023)", "at": 0.2}, {"k": "tag", "text": "VERIFIED", "pos": "tr", "at": 0.3, "color": C["teal"]}])
st(S[160] + 16.2, 336240, "Singapore–Vizag 3,900 km cable begun under YSRCP (claim)", move="push", grade="cool", ov=[{"k": "headline", "lines": ["Singapore → Vizag cable", "“started in our time”"], "serifLine": 1, "at": 0.2, "size": 84}, {"k": "tag", "text": "YSRCP CLAIM · NOT VERIFIED", "pos": "tl", "at": 0.3}])
st(S[161], 2860, "Jagan: 'Google DC is just expansion of original Adani project'", move="push", grade="desat", ov=[{"k": "quote", "photo": "@p_jagan_crop", "quote": "What is being shown as the Google data centre is only an expansion of the original Adani project. Adani invests ₹87,000 crore — Google takes over once it is built.", "who": "Y. S. Jagan Mohan Reddy", "role": "YSRCP PRESIDENT (TRANSLATED)", "status": "YSRCP CLAIM", "at": 0.2, "size": 44}])
ph(S[161] + 6.0, "g_google_dc_1", "Jagan claim continued: Google takes over once built", move="driftL", ov=[{"k": "headline", "lines": ["“Google takes over", "once it is built.”"], "serifLine": 1, "at": 0.2, "size": 92}, {"k": "tag", "text": "YSRCP CLAIM · PHOTO: A GOOGLE DATA CENTRE IN IOWA, USA", "pos": "tl", "at": 0.3}, {"k": "credit", "text": "PHOTO · WIKIMEDIA COMMONS · CC BY 2.0"}])
mg(S[162], "QuoteCard", "Amarnath: CBN hiding Adani deal behind Google's name", props={"quote": "Chandrababu Naidu is hiding the Adani deal behind Google's name.", "who": "Gudivada Amarnath", "role": "YSRCP LEADER (TRANSLATED)", "status": "YSRCP CLAIM", "size": 60, "bg": "@154195"}, inT="wipe")
mg(S[163], "CreditTimeline", "TDP's argument: Adani DC began under TDP in 2019", props={
    "top": {"name": "YSRCP", "photo": "@p_jagan_crop", "events": evs(YS, [0, 0, 0])},
    "bottom": {"name": "TDP", "photo": "@p_naidu_1", "events": evs(TD, [0.8, 99, 99])}}, inT="fade")
st(S[163] + 5.6, 87146, "14 Feb 2019: Naidu laid foundation for Adani DC (verified)", move="push", ov=[{"k": "doc", "kicker": "VISAKHAPATNAM · 14 FEB 2019", "headline": "Then-CM Naidu lays the foundation for the Adani data centre.", "body": ["TDP says an MoU came in January 2019; the foundation event is documented."], "highlight": 0, "source": "IANS / Business Standard (Feb 2019)", "at": 0.2}, {"k": "tag", "text": "VERIFIED (FOUNDATION)", "pos": "tr", "at": 0.3, "color": C["teal"]}])
st(S[164], 206692, "TDP: CBN attended ground-breaking; delayed under YSRCP (claim)", move="driftR", ov=[ILL, {"k": "headline", "lines": ["“Delayed under YSRCP.”"], "at": 0.2, "size": 96}, {"k": "tag", "text": "TDP CLAIM", "pos": "tl", "at": 0.3}])
ph(S[165] + 3.0, "pib_mou_group", "Google deal Oct 2025 under coalition government (PIB)", move="pull", ov=[{"k": "tag", "text": "TDP CLAIM: “OUR DEAL” · MoU 14 OCT 2025", "pos": "tl", "at": 0.2}, {"k": "credit", "text": "PHOTO · PIB, GOVT. OF INDIA (GODL-INDIA)"}])
st(S[166], 198901, "Twist: YSRCP MP Maddila Gurumoorthy files PIL in AP High Court", move="push", inT="wipe", ov=[ILL, {"k": "doc", "kicker": "ANDHRA PRADESH HIGH COURT · PUBLIC INTEREST LITIGATION", "headline": "YSRCP MP Maddila Gurumoorthy challenges land allotments for the Google AI hub.", "body": ["He says the PIL does not seek to cancel the project."], "highlight": 0, "date": "MAR 2026", "source": "As reported (The News Minute, The Hans India)", "at": 0.3}])
mg(S[167], "SplitCompare", "Lokesh: 'anti-development' vs Jagan: budget, debt, corruption", props={"left": {"kicker": "NARA LOKESH · TDP", "title": "“Anti-development”", "img": "@p_lokesh_0", "tag": "TDP CLAIM"}, "right": {"kicker": "JAGAN · YSRCP", "title": "Budget, debt, corruption", "img": "@p_jagan_half", "tag": "YSRCP CLAIM"}, "rightAt": F(4.0)}, inT="iris")
mg(S[168], "SplitCompare", "One party: 'our project' while its MP goes to court; other: 'all our vision'", props={"left": {"kicker": "ONE PARTY", "title": "“Our project.”", "body": "…while its MP challenges it in court.", "video": "@198901"}, "right": {"kicker": "THE OTHER PARTY", "title": "“Entirely our vision.”", "video": "@318026"}, "rightAt": F(5.0)}, inT="wipe")
mg(S[169], "CreditTimeline", "Reality: 2019–2026 both governments shaped the project (tracks merge)", props={
    "top": {"name": "YSRCP", "photo": "@p_jagan_crop", "events": evs(YS, [0, 0, 0])},
    "bottom": {"name": "TDP", "photo": "@p_naidu_1", "events": evs(TD, [0, 0, 0])}, "mergeAt": F(1.0)}, inT="fade")
st(S[170], 139178, "Credit doesn't matter to the Tarluvada farmer who lost land", move="driftR", ov=[ILL, {"k": "headline", "lines": ["To the farmer who lost his land,", "credit doesn't matter."], "serifLine": 1, "at": 0.2, "size": 78}])
ph(S[171], "v_mudasarlova_6", "Nor to the family drinking Mudasarlova water", move="push", ov=[{"k": "headline", "lines": ["Nor to the families", "who drink this water."], "serifLine": 1, "at": 0.1, "size": 80}, {"k": "credit", "text": "PHOTO · WIKIMEDIA COMMONS · CC BY-SA 3.0"}])
st(S[172], 1021, "Nor to Ravi in Hyderabad", move="push", grade="night", ov=[{"k": "headline", "lines": ["Nor to Ravi."], "at": 0.1, "size": 110}])
mg(S[173], "QuoteCard", "Will it really happen?", props={"quote": "Will this project actually happen?", "who": "The only question that matters", "role": "TARLUVADA · MUDASARLOVA · HYDERABAD", "size": 62, "bg": "@92373"}, inT="wipe")

st(S[174], 139232, "If it does — what will it give, what will it take?", move="driftR", ov=[{"k": "headline", "lines": ["What will it give?", "What will it take?"], "serifLine": 1, "at": 0.2, "size": 100}])

# ════════════════════════════ ENDING · RAVI'S CHOICE ════════════════════════════
mg(S[175], "ChapterCard", "Ending title", props={"index": "—", "title": ["Ravi's Choice"], "dek": "Sankranti is over.", "bgClip": "@106980"}, inT="scan")
st(S[177], 120678, "Ravi boards the Hyderabad bus", move="driftL", ov=[ILL])
mg(S[178], "WindowScene", "Bus window: new airport, new roads, cut hills", props={"shots": [{"src": "@v_bhogapuram_1", "kind": "image", "from": 0, "dur": F(3.0)}, {"src": "@57993", "from": F(2.6), "dur": F(3.2)}, {"src": "@205589", "from": F(5.4), "dur": F(3.4)}]}, inT="fade", frames_keys=("shots",))
st(S[179], 137059, "Amma's question again", move="pull", grade="warm", ov=[{"k": "caption", "text": "Can't you find a job here?", "who": "HIS MOTHER'S QUESTION", "at": 0.2}])
st(Wd("modatisaari", S[179]) - 0.3, 47831, "For the first time: not 'no' — 'not yet known'", move="push", grade="warm", ov=[{"k": "strike", "items": ["No."], "ats": [0.2]}, {"k": "headline", "lines": ["Not yet known."], "at": 2.2, "size": 110, "pos": "bottom"}])
st(S[180], 1917, "That's the real story", move="push", ov=[{"k": "headline", "lines": ["This is the real story."], "at": 0.1, "size": 96, "pos": "center"}])
mg(S[181], "Finale", "The blueprint has evolved — every bet on one coastline (3D)", inT="fade")
mg(S[182], "SplitCompare", "If the bet wins: Hyderabad 2.0, jobs near home", props={"left": {"kicker": "IF THE BET WINS", "title": "Hyderabad 2.0", "body": "Lakhs work close to home.", "img": "@v_kailasagiri_0"}, "right": {"kicker": "THE QUESTIONS", "title": "Hills · water · land", "img": "@v_kambalakonda_7"}, "rightAt": F(3.0)}, inT="iris")
mg(S[183], "Finale", "If it fails: hills gone, water down, MoUs headlines (warning 3D)", props={"warn": True}, inT="fade")
mg(S[184], "Questions", "Three questions", props={"qs": [
    {"q": "Can Vizag become Hyderabad 2.0 while protecting its hills and water?", "at": F(S[185] - S[184])},
    {"q": "Are data centres with few jobs the right bet — or should Andhra focus on labour-intensive industry?", "at": F(S[187] - S[184])},
    {"q": "Is it CBN's credit, Jagan's — or does it even matter to ordinary people?", "at": F(S[189] - S[184])}], "bg": "@214582"}, inT="wipe")
mg(S[190], "EndCard", "Comment & share", props={"bg": "@1917"}, inT="fade")
st(S[192], 200479, "Thanks for watching, Jai Hind", move="pull", inT="fade", ov=[{"k": "headline", "lines": ["Thank you for watching."], "at": 0.3, "size": 90, "pos": "center"}])
mg(1074.0, "SourcesRoll", "Sources & credits roll (silent tail)", props={"lines": []}, inT="fade")

# ════════════════════════════ build ════════════════════════════
segments.sort(key=lambda s: s["t"])
PUB = ROOT / "project/source_code/remotion/public"
(PUB / "stock").mkdir(exist_ok=True, parents=True); (PUB / "photos").mkdir(exist_ok=True, parents=True)

def photo_path(key):
    if key in PIB:
        src = ROOT / PIB[key][0]
    elif key == "p_jagan_crop":
        src = ROOT / "assets/web_photographs/p_jagan_crop.jpg"
    elif key == "pib_mou_group_kurian":
        src = ROOT / "assets/web_photographs/pib_kurian_crop.jpg"
    else:
        src = ROOT / f"assets/web_photographs/{key}.jpg"
    if not src.exists(): return None
    dst = PUB / "photos" / f"{key}.jpg"
    if not dst.exists():
        im = Image.open(src).convert("RGB")
        if im.width > 2600: im = im.resize((2600, int(im.height * 2600 / im.width)), Image.LANCZOS)
        im.save(dst, quality=92)
    return f"photos/{key}.jpg"

clip_count = {}
def stock_clip(vid, dur_s, t):
    """allocate an in-point; returns public path. Each source max 2 uses, non-overlapping segments."""
    n = uses.get(vid, 0) + 1
    if n > 2: raise RuntimeError(f"source {vid} used more than twice (at {t:.1f}s)")
    uses[vid] = n
    src_d = SEL[vid]["duration"]
    need = dur_s + 0.7
    stretch = 1.0
    if need > src_d - 0.15:  # source too short: slow it down (frame-blended), never let it run out
        stretch = need / (src_d - 0.15); inp = 0.0
        if stretch > 1.6: raise RuntimeError(f"source {vid} ({src_d:.1f}s) too short for {dur_s:.1f}s shot at {t:.1f}s")
    elif n == 1: inp = min(max(0.4, src_d * 0.18), max(0.0, src_d - need - 0.2))
    else: inp = max(0.0, min(src_d - need - 0.1, src_d * 0.62))
    key = f"{vid}_{n}"
    shots.append({"key": key, "id": vid, "in": round(inp, 2), "dur": round(dur_s, 2), "t": round(t, 2), "stretch": round(stretch, 3)})
    return f"stock/{key}.mp4", inp

def resolve(v, dur_s, t):
    """'@123' -> stock clip, '@key' -> photo"""
    if isinstance(v, str) and v.startswith("@"):
        k = v[1:]
        if k.isdigit():
            return stock_clip(int(k), dur_s, t)[0]
        p = photo_path(k)
        return p or "photos/missing.jpg"
    return v

out, missing = [], []
for i, s in enumerate(segments):
    t0 = s["t"]; t1 = segments[i + 1]["t"] if i + 1 < len(segments) else DUR
    nxt_in = segments[i + 1].get("inDur", 0.45) if i + 1 < len(segments) and segments[i + 1].get("inT", "cut") != "cut" else 0
    dur_s = t1 - t0 + nxt_in
    if dur_s <= 0.2: raise RuntimeError(f"bad duration at {t0}: {s['note']}")
    seg = {"id": f"s{i:03d}", "from": F(t0), "dur": F(t1 + nxt_in) - F(t0), "kind": s["kind"], "inT": s.get("inT", "cut"), "inDur": F(s.get("inDur", 0.45)), "ov": _ov(s.get("ov"))}
    for o in seg["ov"]:
        if isinstance(o.get("photo"), str) and o["photo"].startswith("@"):
            o["photo"] = photo_path(o["photo"][1:]) or "photos/missing.jpg"
    if s["kind"] == "stock":
        if dur_s > 9.5: raise RuntimeError(f"stock shot too long ({dur_s:.1f}s) at {t0:.1f}: {s['note']}")
        seg["clip"], _ = stock_clip(s["vid"], dur_s, t0); seg["move"] = s["move"]; seg["grade"] = s["grade"]
    elif s["kind"] == "photo":
        p = photo_path(s["key"]); seg["img"] = p or "photos/missing.jpg"; seg["move"] = s["move"]; seg["grade"] = s["grade"]; seg["pos"] = s["pos"]
        if not p: missing.append(s["key"])
    elif s.get("name") == "QuoteCard" and s["props"].get("bg"):
        q = dict(s["props"]); bg = q.pop("bg")
        ov_q = {"k": "quote", "at": F(0.15), "pos": "left", **{k: v for k, v in q.items() if k in ("quote", "who", "role", "status", "statusColor", "size")}}
        if q.get("photo"):
            ov_q["photo"] = resolve(q["photo"], 1, t0)
        if bg[1:].isdigit():
            seg["kind"] = "stock"; seg["clip"], _ = stock_clip(int(bg[1:]), dur_s, t0)
        else:
            seg["kind"] = "photo"; seg["img"] = photo_path(bg[1:]) or "photos/missing.jpg"
            if seg["img"] == "photos/missing.jpg": missing.append(bg)
        seg["move"] = "push"; seg["grade"] = "desat"; seg["pos"] = "50% 50%"; seg["ov"] = [ov_q] + seg["ov"]
        if seg["kind"] == "stock" and dur_s > 9.5: raise RuntimeError(f"quote-on-stock too long at {t0}")
    else:
        props = json.loads(json.dumps(s["props"]))
        def walk(o, dur_here):
            if isinstance(o, dict):
                for k, v in list(o.items()):
                    if k in ("video", "img", "bg", "bgClip", "photo", "clip", "src") and isinstance(v, str) and v.startswith("@"):
                        d = dur_here
                        if k == "src" and "dur" in o: d = o["dur"] / FPS
                        o[k] = resolve(v, min(d, 9.4), t0)
                        if o[k] == "photos/missing.jpg": missing.append(v)
                    else: walk(v, dur_here)
            elif isinstance(o, list):
                for x in o: walk(x, dur_here)
        walk(props, dur_s)
        seg["name"] = s["name"]; seg["props"] = props
    out.append(seg)
    kind_label = s["kind"] if s["kind"] != "mg" else "motion graphics"
    rows.append([seg["id"], f"{t0:.2f}", f"{t1:.2f}", f"{t1 - t0:.2f}", kind_label, s.get("name") or s.get("vid") or s.get("key"), seg["inT"], s["note"]])

# sources roll text
credits = ["Narration: original Telugu voice-over (unaltered)", "Stock video: Pixabay (Pixabay Content License) — contributors listed in asset_manifest.csv",
           "Photographs: Wikimedia Commons contributors (CC BY / CC BY-SA / CC0 / Public domain) — see source_references.csv",
           "Official photographs: Press Information Bureau, Government of India (GODL-India)", "Satellite imagery: Sentinel-2 cloudless 2016 by EOX IT Services GmbH (contains modified Copernicus Sentinel data 2016), CC BY 4.0",
           "Terrain & bathymetry: Mapzen/Tilezen terrain tiles on AWS (SRTM, ETOPO1, GMTED and others)", "Boundaries & rivers: Natural Earth (public domain) · OpenStreetMap contributors (ODbL)",
           "Submarine cable routes: TeleGeography Submarine Cable Map (CC BY-SA 4.0)", "3D scenes, motion graphics and sound design: original, created for this film",
           "Fact-check notes: see fact_check_report.txt"]
for s in out:
    if s.get("name") == "SourcesRoll": s["props"]["lines"] = credits

json.dump({"fps": FPS, "durationInFrames": F(DUR), "segments": out}, open(ROOT / "project/source_code/remotion/src/plan.json", "w"), indent=1, ensure_ascii=False)
json.dump(shots, open(ROOT / "work/shots.json", "w"), indent=1)
with open(ROOT / "metadata/scene_plan.csv", "w", newline="") as fh:
    w = csv.writer(fh); w.writerow(["segment", "start_s", "end_s", "duration_s", "type", "asset_or_component", "transition_in", "narration_beat_and_visual"]); w.writerows(rows)
print("segments", len(out), "stock shots", len(shots), "unique stock sources", len(uses), "missing photos", sorted(set(missing)))
