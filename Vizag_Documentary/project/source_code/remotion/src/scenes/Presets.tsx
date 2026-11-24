import React from "react";
import { useCurrentFrame } from "remotion";
import { TerrainStage, PinSpec, StatusTag } from "../three/TerrainStage";
import { PathTube, arcPts, SiteBlock } from "../three/Terrain";
import { Dem, elevAt, lonLatToXZ, metresPerUnit, PLACES, RegionName, REGIONS } from "../lib/geo";
import { C, EZ, F } from "../lib/theme";
import { kf, prog } from "../lib/anim";
import { MaskLine } from "../mg/Type";
import { TitleCard } from "../mg/Cards";
import osmPolys from "../lib/osm_polys.json";

/** Orbit camera around a geographic target */
const orbit = (region: RegionName, place: string | [number, number], dist: number, pitch: number, yaw: number, fov = 34, lift = 0) => {
  const m = REGIONS[region];
  const ll = typeof place === "string" ? [PLACES[place].lon, PLACES[place].lat] : place;
  const [x, z] = lonLatToXZ(m, ll[0], ll[1]);
  const pr = (pitch * Math.PI) / 180, yr = (yaw * Math.PI) / 180;
  return {
    pos: [x + Math.sin(yr) * Math.cos(pr) * dist, Math.sin(pr) * dist + lift, z + Math.cos(yr) * Math.cos(pr) * dist],
    target: [x, lift, z],
    fov,
  };
};
type Orb = { place: string | [number, number]; dist: number; pitch: number; yaw: number; fov?: number };
const lerpOrb = (region: RegionName, f: number, keys: [number, Orb][], ease = EZ.inOut) => {
  const k = (sel: (o: Orb) => number) => kf(f, keys.map(([t, o]) => [t, sel(o)] as [number, number]), ease);
  const ll = (o: Orb) => (typeof o.place === "string" ? [PLACES[o.place].lon, PLACES[o.place].lat] : o.place);
  return orbit(region, [k((o) => ll(o)[0]), k((o) => ll(o)[1])], k((o) => o.dist), k((o) => o.pitch), k((o) => o.yaw), k((o) => o.fov ?? 34));
};
const surfAt = (dem: Dem, lon: number, lat: number, exag: number, lift = 0.01) => {
  const [x, z] = lonLatToXZ(dem.meta, lon, lat);
  return [x, (Math.max(elevAt(dem, x, z), 0) * exag) / metresPerUnit(dem.meta) + lift, z];
};
const Q: React.FC<{ text: string; at: number; x: number; y: number; color?: string; size?: number; serif?: boolean; out?: number }> = ({ text, at, x, y, color = C.white, size = 64, serif, out }) => {
  const f = useCurrentFrame();
  const o = out !== undefined ? 1 - prog(f, out, out + 10, EZ.in) : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: o }}>
      <MaskLine start={at}>
        <div style={{ fontFamily: serif ? F.serif : F.display, fontStyle: serif ? "italic" : "normal", fontWeight: serif ? 400 : 800, fontSize: size, color, letterSpacing: serif ? 0 : -1.5, textShadow: "0 3px 22px rgba(0,0,0,.6)", whiteSpace: "nowrap" }}>{text}</div>
      </MaskLine>
    </div>
  );
};

/* 1 ─ Opening: the coastline seen from the sea, questions, then the title over a blueprint */
export const OpenVizag: React.FC<{ dur: number; titleAt: number; qs: { t: string; at: number }[]; words: { t: string; at: number }[] }> = ({ dur, titleAt, qs, words }) => {
  const f = useCurrentFrame();
  return (
    <>
      <TerrainStage
        region="vizag_metro"
        look={(fr) => ({ exag: 2.6, satMix: kf(fr, [[titleAt - 20, 1], [titleAt + 40, 0]]), contour: kf(fr, [[titleAt - 10, 0], [titleAt + 40, 1]]), grid: kf(fr, [[titleAt, 0], [titleAt + 40, 0.8]]), night: kf(fr, [[titleAt, 0], [titleAt + 30, 0.25]]) })}
        cam={(fr) => lerpOrb("vizag_metro", fr, [[0, { place: "RK Beach", dist: 9.5, pitch: 22, yaw: 140, fov: 30 }], [titleAt, { place: "Kailasagiri", dist: 4.2, pitch: 30, yaw: 160, fov: 32 }], [dur, { place: "Kailasagiri", dist: 5.2, pitch: 52, yaw: 190, fov: 32 }]])}
        overlay={() => (
          <>
            {qs.map((q, i) => (
              <Q key={i} text={q.t} at={q.at} x={130} y={160 + i * 110} size={i === 0 ? 76 : 60} out={titleAt - 12} color={i === qs.length - 1 ? C.coral : C.white} />
            ))}
          </>
        )}
      />
      {f >= titleAt ? (
        <div style={{ position: "absolute", inset: 0 }}>
          <TitleShift at={titleAt} dur={dur - titleAt} words={words} />
        </div>
      ) : null}
    </>
  );
};
const TitleShift: React.FC<{ at: number; dur: number; words: { t: string; at: number }[] }> = ({ at, dur, words }) => {
  // TitleCard expects local frames; we offset via a wrapper
  const f = useCurrentFrame();
  return <Offset by={at}><TitleCard dur={dur} words={words.map((w) => ({ ...w, at: w.at - at }))} /></Offset>;
  void f;
};
import { Sequence } from "remotion";
const Offset: React.FC<{ by: number; children: React.ReactNode }> = ({ by, children }) => (
  <Sequence from={by} layout="none">
    {children}
  </Sequence>
);

/* 2 ─ Natural harbour → navy → industrial base (Chapter 2) */
export const WhyVizagMap: React.FC<{ dur: number; mode: "harbour" | "navy" | "industry" | "ingredients" }> = ({ dur, mode }) => {
  const f = useCurrentFrame();
  const pins: Record<string, PinSpec[]> = {
    harbour: [
      { place: "Vizag Port", at: 30, label: "Natural deep harbour", sub: "SHELTERED BY HILLS", color: C.white, side: "r" },
      { place: "Dolphin's Nose", at: 60, label: "Dolphin's Nose", sub: "HEADLAND · YARADA HILLS", color: C.silver, side: "l", height: 0.5 },
    ],
    navy: [{ place: "Eastern Naval Command", at: 10, label: "Eastern Naval Command", sub: "HEADQUARTERS · INDIAN NAVY", color: C.yellow, side: "r", height: 0.55 }],
    industry: [
      { place: "Vizag Steel Plant", at: 6, label: "Steel plant", sub: "RINL · OPERATIONAL", color: C.white, side: "l" },
      { place: "HPCL Refinery", at: 22, label: "Refinery", sub: "HPCL · OPERATIONAL", color: C.white, side: "l", height: 0.55 },
      { place: "Vizag Port", at: 38, label: "Port", sub: "OPERATIONAL", color: C.white, side: "r" },
      { place: "Pharma City (Parawada)", at: 54, label: "Pharma city", sub: "PARAWADA · APPROX. LOCATION", color: C.white, side: "l", height: 0.45 },
    ],
    ingredients: [],
  };
  const cams: Record<string, [number, Orb][]> = {
    harbour: [[0, { place: "Vizag Port", dist: 6.5, pitch: 40, yaw: 150 }], [dur, { place: "Vizag Port", dist: 3.2, pitch: 34, yaw: 120 }]],
    navy: [[0, { place: "Eastern Naval Command", dist: 2.6, pitch: 30, yaw: 120 }], [dur, { place: "Eastern Naval Command", dist: 8, pitch: 48, yaw: 160 }]],
    industry: [[0, { place: "HPCL Refinery", dist: 6, pitch: 46, yaw: 200 }], [dur, { place: "Vizag Steel Plant", dist: 4.6, pitch: 38, yaw: 230 }]],
    ingredients: [[0, { place: "Visakhapatnam", dist: 8.5, pitch: 55, yaw: 170 }], [dur, { place: "Visakhapatnam", dist: 7, pitch: 42, yaw: 140 }]],
  };
  const chips = [
    { t: "COAST", ok: "✓ 1,000 km+ of AP coastline", at: 6 },
    { t: "CABLES", ok: "✓ proposed landing at Vizag", at: 28 },
    { t: "LAND", ok: "? hills, farms, temple land", at: 56 },
    { t: "POWER", ok: "? gigawatts of new demand", at: 80 },
  ];
  return (
    <TerrainStage
      region="vizag_metro"
      look={(fr) => ({
        exag: 2.6,
        satMix: mode === "harbour" ? kf(fr, [[0, 1], [dur * 0.5, 0.15]]) : mode === "navy" ? 0.35 : 0,
        contour: 0.9,
        grid: 0.7,
        reveal: mode === "industry" ? kf(fr, [[0, 0], [24, 1]]) : 1,
      })}
      cam={(fr) => lerpOrb("vizag_metro", fr, cams[mode].map(([t, o]) => [t, { ...o, yaw: o.yaw - 180 }] as [number, Orb]))}
      pins={pins[mode]}
      overlay={() =>
        mode === "ingredients" ? (
          <div style={{ position: "absolute", right: 120, top: 180, width: 620 }}>
            {chips.map((c, i) => (
              <div key={i} style={{ marginBottom: 26, opacity: prog(f, c.at, c.at + 12), transform: `translateX(${(1 - prog(f, c.at, c.at + 16, EZ.out)) * 40}px)` }}>
                <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 66, color: c.ok.startsWith("✓") ? C.white : C.yellow, letterSpacing: -1 }}>{c.t}</div>
                <div style={{ fontFamily: F.mono, fontSize: 22, color: C.silver }}>{c.ok}</div>
              </div>
            ))}
          </div>
        ) : null
      }
    />
  );
};

/* 3 ─ AP-wide maps: route home, three capitals, two roles, city choice, migration */
const APMap: React.FC<{
  dur: number;
  cam: [number, Orb][];
  pins: PinSpec[];
  arcs?: { from: string; to: string; at: number; color?: string; lift?: number }[];
  overlay?: React.ReactNode;
  paper?: number;
}> = ({ dur, cam, pins, arcs = [], overlay, paper = 0 }) => (
  <TerrainStage
    region="ap_telangana"
    look={() => ({ exag: 14, satMix: paper ? 0 : 0.55, contour: 0.4, grid: 0.6, contourEvery: 250, paper })}
    cam={(fr) => lerpOrb("ap_telangana", fr, cam.map(([t, o]) => [t, { ...o, yaw: o.yaw - 180 }] as [number, Orb]))}
    pins={pins}
    extra3d={(fr, dem, exag) => (
      <group>
        {arcs.map((a, i) => {
          const A = surfAt(dem, PLACES[a.from].lon, PLACES[a.from].lat, exag);
          const B = surfAt(dem, PLACES[a.to].lon, PLACES[a.to].lat, exag);
          return <PathTube key={i} pts={arcPts(A, B, a.lift ?? 0.8, 64)} progress={prog(fr, a.at, a.at + 40, EZ.inOut)} radius={0.03} color={a.color ?? C.yellow} />;
        })}
      </group>
    )}
    overlay={() => <>{overlay}</>}
  />
);
void APMap;

export const RouteHome: React.FC<{ dur: number }> = ({ dur }) => (
  <APMap
    dur={dur}
    cam={[[0, { place: "Vijayawada", dist: 14, pitch: 50, yaw: 170 }], [dur, { place: "Vijayawada", dist: 12, pitch: 44, yaw: 150 }]]}
    pins={[
      { place: "Hyderabad", at: 4, label: "Hyderabad", sub: "WHERE RAVI WORKS", side: "l", color: C.white },
      { place: "Srikakulam", at: 20, label: "Srikakulam", sub: "HOME", side: "r", color: C.yellow },
    ]}
    arcs={[{ from: "Hyderabad", to: "Srikakulam", at: 10, lift: 1.2 }]}
    overlay={<RouteLabel />}
  />
);
const RouteLabel: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 130, top: 110, opacity: prog(f, 40, 56) }}>
      <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 96, color: C.white, letterSpacing: -3 }}>~14 hours</div>
      <div style={{ fontFamily: F.mono, fontSize: 24, color: C.silver, letterSpacing: 3 }}>BY BUS · EVERY FESTIVAL</div>
    </div>
  );
};

export const ThreeCapitals: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  return (
    <APMap
      dur={dur}
      paper={1}
      cam={[[0, { place: "Vijayawada", dist: 15, pitch: 58, yaw: 175 }], [dur, { place: "Vijayawada", dist: 13, pitch: 50, yaw: 160 }]]}
      pins={[
        { place: "Amaravati", at: 6, label: "Amaravati", sub: "LEGISLATIVE CAPITAL", side: "l", color: C.navy },
        { place: "Kurnool", at: 26, label: "Kurnool", sub: "JUDICIAL CAPITAL", side: "l", color: C.navy },
        { place: "Visakhapatnam", at: 46, label: "Visakhapatnam", sub: "EXECUTIVE CAPITAL", side: "l", color: C.cobalt, height: 0.6 },
      ]}
      overlay={
        <div style={{ position: "absolute", left: 120, top: 100, opacity: prog(f, 0, 14) }}>
          <div style={{ fontFamily: F.mono, fontSize: 22, letterSpacing: 4, color: C.white, fontWeight: 700 }}>2019–2024 · YSRCP GOVERNMENT'S “THREE CAPITALS” PLAN</div>
          <div style={{ marginTop: 12 }}><StatusTag text="PROPOSED · NOT IMPLEMENTED" color={C.coral} /></div>
        </div>
      }
    />
  );
};

export const TwoRoles: React.FC<{ dur: number }> = ({ dur }) => (
  <APMap
    dur={dur}
    cam={[[0, { place: "Rajahmundry" in PLACES ? "Rajahmundry" : "Vijayawada", dist: 13, pitch: 48, yaw: 165 }], [dur, { place: "Vijayawada", dist: 11, pitch: 40, yaw: 150 }]]}
    pins={[
      { place: "Amaravati", at: 4, label: "Amaravati", sub: "ADMINISTRATION", side: "l", color: C.white },
      { place: "Visakhapatnam", at: 20, label: "Visakhapatnam", sub: "ECONOMIC ENGINE", side: "r", color: C.yellow, height: 0.6, status: "2024 → STATE PLAN" },
    ]}
  />
);

export const CityChoice: React.FC<{ dur: number }> = ({ dur }) => (
  <APMap
    dur={dur}
    cam={[[0, { place: "Vijayawada", dist: 16, pitch: 60, yaw: 180 }], [dur * 0.55, { place: "Vijayawada", dist: 14, pitch: 52, yaw: 170 }], [dur, { place: "Visakhapatnam", dist: 5, pitch: 40, yaw: 150 }]]}
    pins={[
      { place: "Tirupati", at: 2, label: "Tirupati", side: "l", color: C.silver, height: 0.25 },
      { place: "Vijayawada", at: 6, label: "Vijayawada", side: "l", color: C.silver, height: 0.25 },
      { place: "Kakinada", at: 10, label: "Kakinada", side: "r", color: C.silver, height: 0.25 },
      { place: "Kurnool", at: 14, label: "Kurnool", side: "l", color: C.silver, height: 0.25 },
      { place: "Visakhapatnam", at: 40, label: "Why Vizag?", side: "r", color: C.yellow, height: 0.6 },
    ]}
  />
);

export const Migration: React.FC<{ dur: number }> = ({ dur }) => (
  <APMap
    dur={dur}
    cam={[[0, { place: "Vijayawada", dist: 17, pitch: 62, yaw: 175 }], [dur, { place: "Vijayawada", dist: 15, pitch: 55, yaw: 160 }]]}
    pins={[
      { place: "Srikakulam", at: 0, label: "North Andhra", side: "r", color: C.yellow },
      { place: "Hyderabad", at: 14, label: "Hyderabad", side: "l", color: C.white, height: 0.25 },
      { place: "Bengaluru", at: 24, label: "Bengaluru", side: "l", color: C.white, height: 0.25 },
      { place: "Chennai", at: 34, label: "Chennai", side: "r", color: C.white, height: 0.25 },
      { place: "Gulf", at: 44, label: "→ The Gulf", side: "l", color: C.coral, height: 0.25 },
    ]}
    arcs={[
      { from: "Visakhapatnam", to: "Hyderabad", at: 8, color: C.white },
      { from: "Visakhapatnam", to: "Bengaluru", at: 18, color: C.white },
      { from: "Visakhapatnam", to: "Chennai", at: 28, color: C.white },
      { from: "Visakhapatnam", to: "Gulf", at: 38, color: C.coral },
    ]}
  />
);

/* 4 ─ North Andhra maps: Google sites, steel site, VER master plan, finale */
const NAMap: React.FC<{ dur: number; cam: [number, Orb][]; pins: PinSpec[]; look?: (f: number) => object; extra?: (f: number, dem: Dem, exag: number) => React.ReactNode; overlay?: React.ReactNode }> = ({ dur, cam, pins, look, extra, overlay }) => (
  <TerrainStage
    region="north_andhra"
    look={(fr) => ({ exag: 4.5, satMix: 0.75, contour: 0.5, grid: 0.5, contourEvery: 100, ...(look ? look(fr) : {}) })}
    cam={(fr) => lerpOrb("north_andhra", fr, cam.map(([t, o]) => [t, { ...o, yaw: o.yaw - 180 }] as [number, Orb]))}
    pins={pins}
    extra3d={extra}
    overlay={() => <>{overlay}</>}
  />
);
void NAMap;

export const GoogleSites: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  return (
    <NAMap
      dur={dur}
      cam={[[0, { place: "Visakhapatnam", dist: 6.5, pitch: 50, yaw: 200 }], [dur, { place: "Visakhapatnam", dist: 5.2, pitch: 42, yaw: 175 }]]}
      pins={[
        { place: "Tarluvada", at: 4, label: "Tarluvada", sub: "CAMPUS 1", side: "r", color: C.yellow, status: "UNDER CONSTRUCTION" },
        { place: "Adavivaram", at: 18, label: "Adavivaram", sub: "CAMPUS 2 · NEAR MUDASARLOVA", side: "l", color: C.yellow },
        { place: "Rambilli", at: 32, label: "Rambilli", sub: "CAMPUS 3", side: "l", color: C.yellow },
      ]}
      overlay={
        <div style={{ position: "absolute", left: 120, bottom: 110, opacity: prog(f, 44, 60) }}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 78, color: C.white, letterSpacing: -2 }}>≈ 600 acres</div>
          <div style={{ fontFamily: F.mono, fontSize: 20, color: C.silver, letterSpacing: 2 }}>ALLOTTED ACROSS THREE SITES · STATE GOVERNMENT</div>
        </div>
      }
    />
  );
};

export const SteelSite: React.FC<{ dur: number }> = ({ dur }) => (
  <NAMap
    dur={dur}
    look={() => ({ satMix: 0.5 })}
    cam={[[0, { place: "Nakkapalli", dist: 5.5, pitch: 48, yaw: 170 }], [dur, { place: "Rajayyapeta", dist: 3.2, pitch: 38, yaw: 150 }]]}
    pins={[
      { place: "Visakhapatnam", at: 0, label: "Visakhapatnam", side: "r", color: C.silver, height: 0.3 },
      { place: "Rajayyapeta", at: 10, label: "Rajayyapeta", sub: "NAKKAPALLI MANDAL · ANAKAPALLI DIST.", side: "l", color: C.coral, height: 0.6, status: "FOUNDATION LAID · 23 MAR 2026" },
    ]}
  />
);

export const VERMap: React.FC<{ dur: number; marks: { corridor: number; sectors: number; target: number } }> = ({ dur, marks }) => {
  const f = useCurrentFrame();
  const coast: [number, number][] = [[18.78, 84.52], [18.29, 83.97], [17.98, 83.6], [17.69, 83.3], [17.4, 82.85], [17.0, 82.3], [16.58, 82.05]];
  const sectors = ["PORTS", "AIRPORTS", "AI & DATA", "FINTECH", "TOURISM", "LOGISTICS"];
  return (
    <NAMap
      dur={dur}
      look={(fr) => ({ satMix: kf(fr, [[0, 0.6], [40, 0]]), paper: kf(fr, [[20, 0], [60, 1]]), contour: 0.8, grid: 0.5 })}
      cam={[[0, { place: "Anakapalli", dist: 9.5, pitch: 62, yaw: 200 }], [dur, { place: "Visakhapatnam", dist: 7.6, pitch: 52, yaw: 170 }]]}
      pins={[
        { place: "Srikakulam", at: 6, label: "Srikakulam", side: "r", color: C.navy, height: 0.3 },
        { place: "Vizianagaram", at: 12, label: "Vizianagaram", side: "l", color: C.navy, height: 0.3 },
        { place: "Visakhapatnam", at: 18, label: "Visakhapatnam", side: "r", color: C.cobalt, height: 0.5 },
        { place: "Kakinada", at: 24, label: "Kakinada", side: "l", color: C.navy, height: 0.3 },
        { place: "Amalapuram", at: 30, label: "Konaseema", side: "l", color: C.navy, height: 0.3 },
      ]}
      extra={(fr, dem, exag) => (
        <PathTube pts={coast.map(([lat, lon]) => surfAt(dem, lon, lat, exag, 0.05))} progress={prog(fr, marks.corridor, marks.corridor + 60, EZ.inOut)} radius={0.035} color={C.cobalt} />
      )}
      overlay={
        <>
          <div style={{ position: "absolute", left: 120, top: 100 }}>
            <div style={{ fontFamily: F.mono, fontSize: 22, letterSpacing: 4, color: C.white, fontWeight: 700, opacity: prog(f, 0, 14) }}>VISAKHAPATNAM ECONOMIC REGION · STATE PLAN</div>
          </div>
          <div style={{ position: "absolute", right: 110, top: 170, width: 420 }}>
            {sectors.map((s, i) => (
              <div key={s} style={{ fontFamily: F.mono, fontSize: 26, fontWeight: 700, color: C.white, background: "rgba(20,43,70,.92)", padding: "10px 18px", marginBottom: 10, opacity: prog(f, marks.sectors + i * 5, marks.sectors + i * 5 + 10), transform: `translateX(${(1 - prog(f, marks.sectors + i * 5, marks.sectors + i * 5 + 14, EZ.out)) * 40}px)` }}>
                {s}
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", left: 120, bottom: 100, opacity: prog(f, marks.target, marks.target + 16) }}>
            <StatusTag text="TARGET · NOT AN ACHIEVEMENT" />
            <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 92, color: C.navy, letterSpacing: -3, marginTop: 10 }}>2032</div>
            <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 32, color: C.charcoal, maxWidth: 820 }}>Regional economy target of US$120 bn across eight districts (plan presented to NITI Aayog, June 2025)</div>
          </div>
        </>
      }
    />
  );
};

export const NorthAndhra: React.FC<{ dur: number }> = ({ dur }) => (
  <NAMap
    dur={dur}
    cam={[[0, { place: "Vizianagaram", dist: 8.5, pitch: 55, yaw: 190 }], [dur, { place: "Vizianagaram", dist: 7.2, pitch: 46, yaw: 170 }]]}
    pins={[
      { place: "Srikakulam", at: 2, label: "Srikakulam", side: "r", color: C.white },
      { place: "Vizianagaram", at: 10, label: "Vizianagaram", side: "l", color: C.white },
      { place: "Visakhapatnam", at: 18, label: "Visakhapatnam", side: "r", color: C.white },
      { place: "Anakapalli", at: 26, label: "Anakapalli", side: "l", color: C.white },
    ]}
  />
);

/* 5 ─ Finale: the blueprint has evolved — every bet on one coastline */
export const Finale: React.FC<{ dur: number; warn?: boolean }> = ({ dur, warn }) => {
  const f = useCurrentFrame();
  const pins: PinSpec[] = warn
    ? [
        { place: "Tarluvada", at: 4, label: "Hills cut?", side: "r", color: C.coral },
        { place: "Mudasarlova", at: 14, label: "Water lower?", side: "l", color: C.coral },
        { place: "Visakhapatnam", at: 24, label: "MoUs only headlines?", side: "r", color: C.coral, height: 0.5 },
      ]
    : [
        { place: "Bhogapuram Airport", at: 6, label: "Airport", sub: "OPERATIONAL", side: "r", color: C.white },
        { place: "Tarluvada", at: 14, label: "Google AI hub", sub: "UNDER CONSTRUCTION", side: "r", color: C.yellow },
        { place: "Vizag Port", at: 22, label: "Port & Navy", sub: "OPERATIONAL", side: "r", color: C.white },
        { place: "Rajayyapeta", at: 30, label: "AM/NS steel", sub: "PROPOSED", side: "l", color: C.yellow },
        { place: "Rambilli", at: 38, label: "Data-centre campus", sub: "PROPOSED", side: "l", color: C.yellow },
      ];
  return (
    <NAMap
      dur={dur}
      look={(fr) => ({ satMix: warn ? 0.4 : kf(fr, [[0, 0.2], [dur, 0.9]]), warn: warn ? kf(fr, [[0, 0], [20, 0.55]]) : 0, contour: 0.6 })}
      cam={warn ? [[0, { place: "Visakhapatnam", dist: 4.5, pitch: 36, yaw: 150 }], [dur, { place: "Visakhapatnam", dist: 5.5, pitch: 46, yaw: 120 }]] : [[0, { place: "Anakapalli", dist: 11, pitch: 64, yaw: 220 }], [dur, { place: "Visakhapatnam", dist: 6.5, pitch: 38, yaw: 150 }]]}
      pins={pins}
      overlay={
        warn ? (
          <div style={{ position: "absolute", left: 120, top: 100, opacity: prog(f, 0, 12) }}>
            <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 84, color: C.white, letterSpacing: -2 }}>If the bet fails…</div>
          </div>
        ) : null
      }
    />
  );
};

/* 6 ─ Environment: Tarluvada, Mudasarlova, Kambalakonda (2016 Sentinel-2 imagery = before construction) */
const mudaRing = (): [number, number][] => {
  const g = (osmPolys as any).mudasarlova.geojson;
  const ring: number[][] = g.type === "Polygon" ? g.coordinates[0] : g.coordinates[0][0];
  return ring.map(([lon, lat]) => lonLatToXZ(REGIONS.vizag_metro, lon, lat));
};
export const EnvMap: React.FC<{ dur: number; mode: "tarluvada" | "mudasarlova" | "kambalakonda" | "question"; words?: { t: string; at: number }[] }> = ({ dur, mode, words = [] }) => {
  const f = useCurrentFrame();
  const cams: Record<string, [number, Orb][]> = {
    tarluvada: [[0, { place: "Tarluvada", dist: 4.5, pitch: 50, yaw: 200 }], [dur, { place: "Tarluvada", dist: 1.6, pitch: 38, yaw: 175 }]],
    mudasarlova: [[0, { place: "Mudasarlova", dist: 3.6, pitch: 55, yaw: 210 }], [dur, { place: "Mudasarlova", dist: 1.3, pitch: 42, yaw: 190 }]],
    kambalakonda: [[0, { place: "Kambalakonda", dist: 3.4, pitch: 46, yaw: 160 }], [dur, { place: "Kambalakonda", dist: 2.4, pitch: 40, yaw: 200 }]],
    question: [[0, { place: "Visakhapatnam", dist: 7.5, pitch: 40, yaw: 150 }], [dur, { place: "Kailasagiri", dist: 5, pitch: 32, yaw: 175 }]],
  };
  const pins: Record<string, PinSpec[]> = {
    tarluvada: [{ place: "Tarluvada", at: 8, label: "Tarluvada", sub: "GOOGLE CAMPUS SITE", side: "r", color: C.coral, status: "IMAGE: SENTINEL-2, 2016 (BEFORE)" }],
    mudasarlova: [
      { place: "Mudasarlova", at: 6, label: "Mudasarlova reservoir", sub: "DRINKING WATER FOR THE CITY", side: "r", color: C.teal },
      { place: "Adavivaram", at: 24, label: "Adavivaram", sub: "DATA-CENTRE PARK · APPROX.", side: "l", color: C.coral },
      { place: "Simhachalam", at: 40, label: "Simhachalam", sub: "TEMPLE HILLS", side: "l", color: C.white, height: 0.25 },
    ],
    kambalakonda: [
      { place: "Kambalakonda", at: 4, label: "Kambalakonda", sub: "WILDLIFE SANCTUARY · APPROX. CENTRE", side: "r", color: C.teal },
      { place: "Adavivaram", at: 18, label: "Adavivaram", sub: "PROPOSED SITE", side: "l", color: C.coral },
      { place: "Madhurawada", at: 30, label: "Madhurawada", sub: "EARLIER ADANI DC PARK", side: "r", color: C.silver, height: 0.25 },
    ],
    question: [],
  };
  return (
    <TerrainStage
      region="vizag_metro"
      look={(fr) => ({ exag: 3.2, satMix: mode === "question" ? kf(fr, [[0, 0.6], [dur, 0.2]]) : 0.95, green: mode === "question" ? 0.7 : 0.25, contour: mode === "question" ? 0.7 : 0.25, grid: 0.3, contourEvery: 40 })}
      cam={(fr) => lerpOrb("vizag_metro", fr, cams[mode].map(([t, o]) => [t, { ...o, yaw: o.yaw - 180 }] as [number, Orb]))}
      pins={pins[mode]}
      extra3d={(fr, dem, exag) =>
        mode === "mudasarlova" ? (
          <group>
            <PathTube pts={mudaRing().map(([x, z]) => [x, (Math.max(elevAt(dem, x, z), 0) * exag) / metresPerUnit(dem.meta) + 0.012, z])} progress={prog(fr, 4, 40, EZ.inOut)} radius={0.006} color={C.teal} closed />
            <SiteBlock ring={mudaRing()} y={0.001 + (Math.max(elevAt(dem, mudaRing()[0][0], mudaRing()[0][1]), 0) * exag) / metresPerUnit(dem.meta)} height={0.01} progress={prog(fr, 10, 40)} color={C.teal} opacity={0.55} />
          </group>
        ) : null
      }
      overlay={() => (
        <>
          {mode === "mudasarlova" ? (
            <div style={{ position: "absolute", right: 110, bottom: 110, width: 640, textAlign: "right", opacity: prog(f, 56, 72) }}>
              <div style={{ fontFamily: F.serif, fontSize: 36, color: C.white, lineHeight: 1.25 }}>Human Rights Forum says the site is about <span style={{ color: C.coral }}>120 m</span> from the reservoir.</div>
              <div style={{ marginTop: 12 }}><StatusTag text="ALLEGATION · DISTANCE NOT INDEPENDENTLY VERIFIED" color={C.coral} /></div>
            </div>
          ) : null}
          {mode === "question"
            ? words.map((w, i) => <Q key={i} text={w.t} at={w.at} x={130} y={300 + i * 150} size={120} color={i === 2 ? C.yellow : C.white} />)
            : null}
          <div style={{ position: "absolute", left: 28, bottom: 18, fontFamily: F.mono, fontSize: 12, color: C.silver, opacity: 0.7 }}>
            IMAGERY · SENTINEL-2 CLOUDLESS 2016 BY EOX (CONTAINS MODIFIED COPERNICUS SENTINEL DATA 2016) · CC BY 4.0 · RELIEF · MAPZEN TERRAIN TILES
          </div>
        </>
      )}
    />
  );
};
