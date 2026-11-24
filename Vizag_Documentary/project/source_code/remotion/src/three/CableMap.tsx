import React, { useMemo } from "react";
import { TerrainStage, MapLabel, StatusTag } from "./TerrainStage";
import { PathTube, arcPts } from "./Terrain";
import { Dem, elevAt, lonLatToXZ, metresPerUnit, PLACES, REGIONS } from "../lib/geo";
import cables from "../lib/cables.json";
import { C, EZ, F } from "../lib/theme";
import { kf, kfv, prog } from "../lib/anim";

const M = REGIONS.bay_bengal;
const inside = (lon: number, lat: number) => lon > M.bbox[1] + 0.2 && lon < M.bbox[3] - 0.2 && lat > M.bbox[0] + 0.2 && lat < M.bbox[2] - 0.2;

/** Real cable routes (TeleGeography Submarine Cable Map, CC BY-SA 4.0), draped on the sea floor */
const useCableLines = (dem: Dem, exag: number) =>
  useMemo(() => {
    const out: number[][][] = [];
    for (const f of (cables as any).features) {
      for (const line of f.geometry.coordinates as number[][][]) {
        const seg: number[][] = [];
        for (const [lon, lat] of line) {
          if (!inside(lon, lat)) { if (seg.length > 3) out.push(seg.slice()); seg.length = 0; continue; }
          const [x, z] = lonLatToXZ(M, lon, lat);
          const e = elevAt(dem, x, z);
          seg.push([x, (Math.min(e, 0) * exag) / metresPerUnit(M) + 0.015, z]);
        }
        if (seg.length > 3) out.push(seg);
      }
    }
    return out;
  }, [dem, exag]);

const Cables: React.FC<{ dem: Dem; exag: number; p: number }> = ({ dem, exag, p }) => {
  const lines = useCableLines(dem, exag);
  return (
    <group>
      {lines.map((l, i) => (
        <PathTube key={i} pts={l} progress={p} radius={0.012} color="#AEB8C3" opacity={0.85} segs={Math.min(300, l.length * 3)} />
      ))}
    </group>
  );
};

export const CableMap: React.FC<{ dur: number; propAt: number; statAt?: number }> = ({ dur, propAt }) => {
  const exag = 28;
  const surfP = (dem: Dem, name: string, lift = 0.02) => {
    const pl = PLACES[name];
    const [x, z] = lonLatToXZ(M, pl.lon, pl.lat);
    return [x, Math.max(elevAt(dem, x, z), 0) * exag / metresPerUnit(M) + lift, z];
  };
  return (
    <TerrainStage
      region="bay_bengal"
      sat={false}
      stride={1}
      look={(f) => ({ exag, satMix: 0, contour: 0.6, grid: 0.5, contourEvery: 1000, reveal: kf(f, [[0, 0.2], [40, 1]], EZ.inOut) })}
      cam={(f) => ({
        pos: kfv(f, [[0, [-0.5, 7.5, 6.5]], [dur, [0.6, 5.2, 4.6]]], EZ.inOut),
        target: kfv(f, [[0, [-0.6, 0, -0.4]], [dur, [0.2, 0, -0.6]]], EZ.inOut),
        fov: 36,
      })}
      pins={[
        { place: "Chennai", at: 40, label: "Chennai", sub: "EXISTING CABLE LANDINGS", color: C.silver, side: "l", height: 0.25 },
        { place: "Mumbai", at: 50, label: "Mumbai", sub: "EXISTING CABLE LANDINGS", color: C.silver, side: "l", height: 0.25 },
        { place: "Visakhapatnam", at: propAt, label: "Visakhapatnam", sub: "PROPOSED NEW GATEWAY", color: C.yellow, side: "r", height: 0.4, status: "PROPOSED" },
        { place: "Singapore", at: propAt + 40, label: "Singapore", sub: "AS STATED IN NARRATION", color: C.white, side: "r", height: 0.25 },
      ]}
      extra3d={(f, dem) => {
        const vz = surfP(dem, "Visakhapatnam");
        const sg = surfP(dem, "Singapore");
        const p = prog(f, 20, 120, EZ.inOut);
        const ap = prog(f, propAt + 10, propAt + 70, EZ.inOut);
        return (
          <group>
            <Cables dem={dem} exag={exag} p={p} />
            {ap > 0 ? <PathTube pts={arcPts(vz, sg, 0.6, 64)} progress={ap} radius={0.02} color={C.cobalt} /> : null}
            {ap > 0.98
              ? Array.from({ length: 6 }).map((_, i) => {
                  const t = ((f * 0.01 + i / 6) % 1);
                  const pts = arcPts(vz, sg, 0.6, 64);
                  const q = pts[Math.floor(t * 64)];
                  return (
                    <mesh key={i} position={q as [number, number, number]}>
                      <sphereGeometry args={[0.035, 10, 8]} />
                      <meshBasicMaterial color={C.yellow} />
                    </mesh>
                  );
                })
              : null}
          </group>
        );
      }}
      overlay={(f) => (
        <>
          <div style={{ position: "absolute", left: 110, top: 92, opacity: prog(f, 10, 30) }}>
            <div style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: 4, color: C.cobalt, fontWeight: 700 }}>SUBSEA CABLE ROUTES · BAY OF BENGAL & INDIAN OCEAN</div>
            <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 32, color: C.white, marginTop: 8 }}>Existing systems in grey · Vizag's proposed gateway in blue</div>
          </div>
          <div style={{ position: "absolute", left: 110, bottom: 60, fontFamily: F.mono, fontSize: 14, color: C.grey, letterSpacing: 1, opacity: prog(f, 30, 50) }}>
            CABLE ROUTES · TELEGEOGRAPHY SUBMARINE CABLE MAP (CC BY-SA 4.0) · SEA-FLOOR RELIEF · MAPZEN TERRAIN TILES / ETOPO
          </div>
          <div style={{ position: "absolute", right: 90, top: 170, width: 620, textAlign: "left", padding: "26px 30px", background: "rgba(13,18,25,.88)", borderLeft: `4px solid ${C.cobalt}`, opacity: prog(f, propAt + 70, propAt + 100) }}>
            <div style={{ fontFamily: F.serif, fontSize: 31, color: C.white, lineHeight: 1.3 }}>
              Google says Vizag will become a landing point for multiple international cables, joining its global network of AI centres across <span style={{ color: C.yellow }}>12 countries</span>.
            </div>
            <div style={{ marginTop: 16 }}>
              <StatusTag text="ANNOUNCED · ROUTE SHOWN IS ILLUSTRATIVE" color={C.silver} />
            </div>
          </div>
        </>
      )}
    />
  );
};

export { MapLabel };
