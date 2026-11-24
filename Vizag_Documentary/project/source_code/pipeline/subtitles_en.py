"""English subtitles (translation of the Telugu narration), timed to the forced alignment.
Output: output/english_subtitles.srt"""
import json, sys, pathlib
ROOT = pathlib.Path(sys.argv[1])
S = {s["i"]: s for s in json.load(open(ROOT / "work/fa_sentences.json"))}
EN = {
0: "Just imagine for a moment.", 1: "Ravi.", 2: "A boy from Srikakulam.", 3: "Age 27.", 4: "A software engineer at an IT company in Gachibowli.",
5: "Every Sankranti, every Dasara, he travels home from Hyderabad — about 14 hours by bus.",
6: "His mother asks: \"Ravi, can't you find a job somewhere here?\" Ravi laughs.", 7: "\"What is there here, Amma?",
8: "Everyone is going to Hyderabad, Bangalore, America.\" But this Sankranti, he hears different talk near home.",
9: "Google is coming, they say.", 10: "A steel plant is coming, they say.", 11: "A new airport has opened, they say.", 12: "Vizag will become the next Hyderabad, they say.",
13: "At the same time, people are protesting with placards on Vizag's Beach Road.", 14: "\"They are cutting our hills.",
15: "Our water is going to disappear.\" So Ravi has a doubt.", 16: "Is this my future?", 17: "Or a sacrifice my town is making for someone else's future?",
18: "Why is the Chandrababu Naidu government placing such a big bet on Vizag?", 19: "Why lakhs of crores in investment, here?",
20: "How much will the people of Andhra really gain?", 21: "How much will they lose?", 22: "Let's see the complete story in this video.", 23: "With facts.",
24: "With arguments from both sides.", 25: "The verdict is yours.", 26: "Let's begin.", 27: "Chapter 1: The Hyderabad Wound.",
28: "To understand the story, we have to go back to 2014.", 29: "June 2, 2014.", 30: "Andhra Pradesh was split in two.", 31: "Telangana became a new state.",
32: "Hyderabad went to Telangana.", 33: "What was left for Andhra?", 34: "A long coastline.", 35: "The Krishna and the Godavari.", 36: "Lakhs of talented young people.",
37: "But no capital.", 38: "No IT hub.", 39: "No Hyderabad.", 40: "Now think about Chandrababu Naidu.", 41: "From 1995 to 2004, he was CM of united Andhra Pradesh.",
42: "HITEC City came up in his time.", 43: "The name \"Cyberabad\" was born.", 44: "Microsoft and IT companies came to Hyderabad.", 45: "He earned the brand \"IT CM\".",
46: "And the city behind that brand — is now in another state.", 47: "In 2014, CBN became CM again.", 48: "He chose Amaravati as the capital.",
49: "The foundation stone was laid on October 22, 2015.", 51: "CBN became CM again.",
52: "While continuing with Amaravati as the capital, he has now given Vizag a new role — Andhra's economic engine.",
53: "You can see this directly on the ground in Vizag.", 54: "Naidu has called Vizag the centre of his 'Swarna Andhra' vision — the state's financial nucleus and knowledge hub.",
55: "Put simply: Amaravati will run the administration, and Vizag will earn money for the state.",
56: "But the real question is — with so many cities in Andhra, why Vizag?", 57: "Chapter 2: Why", 58: "Vizag?", 59: "They call Vizag the \"City of Destiny\".",
60: "That name didn't come by accident — there are solid reasons behind it.", 61: "First: the sea.", 62: "Vizag has a natural deep harbour — a safe bay surrounded by hills.",
63: "For ships, cargo and heavy industry, that is literally like gold.", 64: "Second: the Navy.",
65: "The Indian Navy's Eastern Naval Command is headquartered in Vizag — making it a strategic city for India in the Bay of Bengal.",
66: "Third: an industrial base that already exists.", 67: "The Vizag Steel Plant, the refinery, the port, pharma — industrial culture is nothing new to this city.",
68: "With around 25 lakh people, it is a ready-made city.", 69: "Fourth: resilience.",
70: "On October 12, 2014, Cyclone Hudhud hit Vizag hard; the whole city was devastated, yet it stood back up within a few months.",
71: "For big investors, this comeback story matters a lot.", 72: "But do you know the real game changer, bigger than all of these?", 73: "Wires under the sea.",
74: "Yes — subsea cables.", 75: "YouTube, WhatsApp, Gemini on our phones — all that data travels around the world through cables on the sea floor.",
76: "The point where those cables come ashore is called a landing station.",
77: "According to Google Cloud CEO Thomas Kurian, the Vizag data centre will be connected by subsea cable to Singapore, Malaysia, Australia — linking it to 12 countries.",
78: "Here's another shocking number: nearly one in five pieces of the world's digital data comes from India — but India's share of global data-centre capacity is only 3 percent.",
79: "Demand is enormous; supply isn't there.", 80: "To fill that gap you need a coast, cables, land and power.",
81: "Andhra has the coastline; cables are coming to Vizag.", 82: "Long story short… the world's big tech companies have started looking towards Vizag.",
83: "Chapter 3: The", 84: "Big Bets. Now let's look at the big bets placed on Vizag, one by one.", 85: "These numbers will make your head spin.",
86: "Bet number 1 — the Google AI Hub.", 87: "On October 14, 2025, in New Delhi, an MoU was signed between the AP IT department and Google.",
88: "An investment of 15 billion dollars over 5 years, from 2026 to 2030 — about 1.3 lakh crore rupees.", 89: "This is the biggest data centre Google is building outside the United States.",
90: "On April 28, 2026, CM Chandrababu Naidu and Union IT Minister Ashwini Vaishnaw laid the foundation stone together.",
91: "That day Vaishnaw said: \"Visakhapatnam will be born as AI-Patnam.\" With 1 gigawatt capacity, it is being built across three campuses — Tarluvada, Adavivaram and Rambilli — on about 600 acres.",
92: "The project is being built with AdaniConneX, a joint venture of the Adani Group and EdgeConneX; Airtel is also a partner.",
93: "Bet number 2 — Data-centre city.", 94: "It's not just Google — a Reliance, Brookfield and Digital Realty joint venture is also putting 11 billion dollars into another AI data centre in Vizag.",
95: "The state government says agreements have been signed for about 9 gigawatts of data-centre capacity around Vizag in total.",
96: "Bet number 3 — Steel city.", 97: "On March 23, 2026, at Rajayyapeta in Nakkapalli mandal, Anakapalli district, CBN laid the foundation for the ArcelorMittal Nippon Steel plant.",
98: "With an investment of 1.36 lakh crore, on 5,465 acres, in two phases, it will have a total capacity of 17.8 million tonnes.",
99: "CBN said then: \"We are not building a steel plant — we are building a steel city.\" Bet number 4 — a new airport.",
100: "PM Modi inaugurated the Alluri Sitarama Raju International Airport at Bhogapuram in August 2026, and from August 17 all flights moved here from the old Vizag airport.",
101: "The original deadline was December 2026, but it was ready six months early.",
102: "The old airport was just a civilian enclave inside the Navy's INS Dega — now Vizag has its own international airport.",
103: "Bet number 5 — The master plan.", 104: "The Visakhapatnam Economic Region — VER.",
105: "From Srikakulam to Konaseema, with a target of 9.3 lakh crore in investments by 2032, and a \"Bay City\" project planned at its centre.",
106: "Ports, airports, AI, fintech, tourism — the plan is to turn North Andhra into one economic corridor.",
107: "And at the 31st CII Partnership Summit held in Vizag on November 12 and 13, representatives from 58 countries came and signed MoUs worth lakhs of crores again.",
108: "Hold on for a minute here.", 109: "MoUs are only promises — not real investment.",
110: "Not every rupee signed reaches the ground — that's common to any government, in Andhra or anywhere in India.",
111: "So the real question is — out of these lakhs of crores, what does the ordinary Andhra person get?", 112: "Chapter 4: What's", 113: "In It For Andhra?",
114: "There are lakhs of people like our Ravi in North Andhra.",
115: "Educated young people, construction workers, IT engineers, nurses from Srikakulam, Vizianagaram, Vizag and Anakapalli — all going to Hyderabad, Bangalore, Chennai or the Gulf.",
116: "The government's pitch is simple: \"Your children no longer need to leave — the jobs will come here.\" Looking at the numbers, the company says the ArcelorMittal steel plant will create about 1 lakh direct and indirect jobs during construction and development.",
117: "According to Google, the Vizag data centre will generate 688 million dollars in local economic activity every year, and about 4,200 jobs during construction.",
118: "With a 25,000-metric-tonne cargo terminal at Bhogapuram airport, North Andhra's seafood, pharma and horticulture can be exported directly to the world.",
119: "Another emotional angle — the Vizag Steel Plant.",
120: "We all know the slogan \"Visakha Steel is Andhra's right\"; on the new steel plant's foundation day, central ministers promised financial support to RINL and to raise its capacity.",
121: "Now the political angle: this bet is crucial for Chandrababu Naidu because his whole political brand rests on development.",
122: "HITEC City in Hyderabad gave him his first legacy; if an AI city truly stands up in Vizag, that will be his second legacy.",
123: "Otherwise, these lakhs of crores in MoUs will remain only headlines.", 124: "But here is the big twist.",
125: "In the same statement, Google wrote another line — once operations start in 2028, the permanent specialist jobs will only be in the \"hundreds\".",
126: "Hundreds of jobs for a 15-billion-dollar investment?", 127: "That's the critics' first question.",
128: "As one activist put it: \"We need mass employment and labour-intensive industries — not high-capital industries.\" Because data centres need a lot of land, a lot of power, a lot of water — but very few people.",
129: "That's where the real fight begins.", 130: "Chapter 5: The", 131: "Backlash. Now let's look at the other side of the coin.",
132: "In September 2026, aerial photos of Tarluvada village came out — hills cleared by excavators; once-green land now looks the colour of red earth.",
133: "Many people in Vizag fear three things: water, electricity, jobs.",
134: "Their complaint: data centres will draw water and power, the environment will take a hit — but very few jobs will come in return.",
135: "First concern — water.", 136: "There's been a big objection to the project near Adavivaram and Mudasarlova, because Mudasarlova is the reservoir that supplies drinking water to Vizag.",
137: "Human Rights Forum member V.S.",
138: "Krishna asked a direct question: \"Can anyone imagine a data centre 120 metres from a drinking-water reservoir?\" In May a video went viral, in which a woman holding two jars — one with clean water, one with brown, muddy water — alleged the data-centre construction caused it.",
139: "Second concern — land.", 140: "Professor Khairagi Reddy, honorary president of Green Visakhapatnam, alleged that 160 acres belonging to the Simhachalam Devasthanam were given to the Google–Adani data centre without an environmental impact assessment or public hearing.",
141: "These sites are also very close to the Kambalakonda wildlife sanctuary.", 142: "Third concern — clearances.",
143: "In June 2026, the AP State Environment Impact Assessment Authority granted Environmental Clearance to the Adavivaram–Mudasarlova project.",
144: "The HRF called it a \"brazen injustice\", alleging that site works happened before the clearance came.", 145: "On top of that, Vizag is a cyclone-prone coast — we haven't forgotten Hudhud.",
146: "Fourth concern — silencing voices.", 147: "On July 27, 2026, police detained Left party leaders who were going to meet people who had lost land in Tarluvada; the HRF alleged it was an attempt to stop public discussion.",
148: "Groups like Green Visakha held awareness protests on Vizag's Beach Road.", 149: "So what does the government say?",
150: "IT Minister Nara Lokesh strongly defended the project — his argument: \"A 1 GW thermal power plant uses 7 times more water than a 1 GW data centre.\"",
151: "The clearances given to the two data-centre parks name the Rural Water Supply department as the water source.",
152: "The government's message: this is for the future of Andhra's youth, and every big project faces opposition.",
153: "But this isn't just Vizag's problem — the same fight is happening over AI data centres around the world.",
154: "In Finland too, an authority ordered work to stop at two Google data-centre sites until a mandatory environmental assessment is done.",
155: "So the question here isn't \"data centre — yes or no\" — it's \"Where, how, and at whose cost?\"", 156: "Now another twist enters the story: politics.",
157: "Chapter 6: The", 158: "Credit War. For those who know Andhra politics, this is no big surprise — when a big project comes, the first fight is over credit.",
159: "First, let's look at YSRCP's argument.",
160: "Jagan Mohan Reddy called Chandrababu a \"credit chor\" and made some claims: that in November 2020, during Covid, the YSRCP government allotted land in Vizag to the Adani Group for a 300 MW data centre; the foundation stone was laid on May 3, 2023; and the 3,900 km Singapore–Vizag subsea cable project also started in their time.",
161: "Jagan argued: \"What's now being shown as the Google data centre is just an expansion of the original Adani project; Adani is investing 87,000 crore, and Google will take over once it's built.\"",
162: "YSRCP leader Gudivada Amarnath went a step further, alleging that CBN is hiding the Adani deal behind Google's name.",
163: "Now TDP's argument: the TDP says the Adani data-centre MoU was signed in January 2019 itself — that is, by the then TDP government, before YSRCP came to power.",
164: "Their counter: CBN also attended the ground-breaking, and the project was delayed under YSRCP.",
165: "And the TDP argues that the 15-billion-dollar Google deal came in October 2025, under the coalition government.",
166: "The twist in the story: YSRCP MP Maddila Gurumoorthy filed a PIL in the AP High Court against this Google AI Hub.",
167: "Nara Lokesh seized on it to attack YSRCP as \"anti-development\"; Jagan countered again with the state budget, debts and corruption allegations.",
168: "So the scene is: one party says \"this is our project\" while its own MP challenges the project in court; the other party says \"this is entirely our vision\".",
169: "The reality: from 2019 to 2026, both governments have been involved with this project.",
170: "But whoever gets the credit, it doesn't matter much to the farmer in Tarluvada who lost his land.", 171: "Nor to the family that drinks Mudasarlova's water.",
172: "Nor to our Ravi sitting in Hyderabad.", 173: "What they need is just one thing — will this project actually happen on the ground?",
174: "And if it does, what will it give them, and what will it take?", 175: "Ending: Ravi's Choice.", 176: "Sankranti is over.", 177: "Ravi boards the bus to Hyderabad again.",
178: "As the bus passes near Bhogapuram, he looks out of the window — the new airport, new roads, hills cut in the distance.",
179: "His mother's question comes back to him — \"Can't you find a job here?\" For the first time, the answer in Ravi's mind wasn't \"no\"; it was \"I don't know yet\".",
180: "That's the real story.", 181: "Chandrababu Naidu has placed a big bet on Vizag — not just CBN; every government that has ruled Andhra since 2014 has looked towards Vizag, because after losing Hyderabad, it is the biggest ready-made city Andhra has.",
182: "If this bet wins, Vizag becomes Andhra's Hyderabad 2.0, and lakhs of people like Ravi can work close to home.",
183: "If the bet fails — the hills will be gone, the water will have dropped, and the MoUs will remain only in headlines.",
184: "Now I leave you with three questions: 1.", 185: "Can Vizag become Hyderabad 2.0 while protecting its hills and water?", 186: "2.",
187: "Are data centres that create few jobs the right bet for Andhra, or should it focus on labour-intensive industries?", 188: "3.",
189: "Is the credit for this project CBN's, or Jagan's — or does it even matter to ordinary people?", 190: "Tell us your answers in the comments.",
191: "Share this video with your Vizag friends and in North Andhra family WhatsApp groups — this conversation should happen in every Andhra home.", 192: "Thanks for watching. Jai Hind!",
}
cues = []
for i in sorted(S):
    s = S[i]
    if i == 50:
        cues += [(s["start"], 135.57, "The foundation stone was laid."),
                 (135.57, 141.3, "Then in 2019, YSRCP won, and Jagan Mohan Reddy brought in a \"three capitals\" plan —"),
                 (141.3, 146.0, "Amaravati as the legislative capital, Kurnool the judicial capital, and Vizag the executive capital."),
                 (146.0, 152.0, "Did you notice something? For CBN it was Amaravati; for Jagan, Vizag."),
                 (152.0, 156.6, "Their plans were different — but neither of them ignored Vizag."),
                 (156.6, s["end"], "Next, in 2024, the TDP–Janasena–BJP alliance came to power.")]
        continue
    if i in EN: cues.append((s["start"], max(s["end"], s["start"] + 0.8), EN[i]))
def ts(t):
    return f"{int(t//3600):02d}:{int(t%3600//60):02d}:{int(t%60):02d},{int(round((t-int(t))*1000))%1000:03d}"
def wrap(txt, n=46):
    words, lines, cur = txt.split(), [], ""
    for w in words:
        if len(cur) + len(w) + 1 > n: lines.append(cur); cur = w
        else: cur = (cur + " " + w).strip()
    lines.append(cur)
    return lines
out = []; k = 1
for a, b, txt in cues:
    lines = wrap(txt)
    # split long cues into chunks of two lines, proportional timing
    chunks = [lines[j:j + 2] for j in range(0, len(lines), 2)]
    tot = sum(len(" ".join(c)) for c in chunks); t = a
    for c in chunks:
        d = (b - a) * len(" ".join(c)) / tot
        out.append(f"{k}\n{ts(t)} --> {ts(min(t + d, b))}\n" + "\n".join(c) + "\n"); k += 1; t += d
open(ROOT / "output/english_subtitles.srt", "w").write("\n".join(out))
print("cues", k - 1)
