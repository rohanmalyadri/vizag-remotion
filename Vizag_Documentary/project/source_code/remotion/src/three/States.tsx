import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { CamRig, makeProjector } from "./Terrain";
import { lonLatToXZ, PLACES, REGIONS } from "../lib/geo";
import statesJson from "../lib/states.json";
import riversJson from "../lib/rivers.json";
import { C, EZ, F } from "../lib/theme";
import { kfv, prog } from "../lib/anim";
import { MapLabel, StatusTag } from "./TerrainStage";

const M = REGIONS.ap_telangana;
type Geo = { type: string; coordinates: number[][][] | number[][][][] };
const polys = (g: Geo): number[][][][] => (g.type === "Polygon" ? [g.coordinates as number[][][]] : (g.coordinates as number[][][][]));

const shapeOf = (g: Geo) =>
  polys(g).map((poly) => {
    const outer = poly[0].map(([lon, lat]) => lonLatToXZ(M, lon, lat));
    const s = new THREE.Shape(outer.map(([x, z]) => new THREE.Vector2(x, -z)));
    poly.slice(1).forEach((h) => s.holes.push(new THREE.Path(h.map(([lon, lat]) => { const [x, z] = lonLatToXZ(M, lon, lat); return new THREE.Vector2(x, -z); }))));
    return s;
  });

const Slab: React.FC<{ name: string; depth: number; color: string; edge: string; y: number; offset: [number, number]; opacity?: number; emissive?: string }> = ({
  name, depth, color, edge, y, offset, opacity = 1, emissive = "#000000",
}) => {
  const feat = (statesJson as any).features.find((f: any) => f.properties.name === name);
  const { geo, edges } = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(shapeOf(feat.geometry), { depth, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1, curveSegments: 1 });
    g.rotateX(-Math.PI / 2);
    return { geo: g, edges: new THREE.EdgesGeometry(g, 30) };
  }, [feat, depth]);
  return (
    <group position={[offset[0], y, offset[1]]}>
      <mesh geometry={geo}>
        <meshStandardMaterial color={color} roughness={0.75} metalness={0.05} transparent={opacity < 1} opacity={opacity} emissive={emissive} emissiveIntensity={0.25} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={edge} transparent opacity={0.85 * opacity} />
      </lineSegments>
    </group>
  );
};

const Outline: React.FC<{ name: string; y: number; color: string; opacity: number }> = ({ name, y, color, opacity }) => {
  const feat = (statesJson as any).features.find((f: any) => f.properties.name === name);
  const geos = useMemo(
    () =>
      polys(feat.geometry).map((p) => {
        const pts = p[0].map(([lon, lat]) => { const [x, z] = lonLatToXZ(M, lon, lat); return new THREE.Vector3(x, y, z); });
        return new THREE.BufferGeometry().setFromPoints(pts);
      }),
    [feat, y],
  );
  return (
    <group>
      {geos.map((g, i) => (
        <lineLoop key={i} geometry={g}>
          <lineBasicMaterial color={color} transparent opacity={opacity} />
        </lineLoop>
      ))}
    </group>
  );
};

const Rivers: React.FC<{ y: number; p: number; offset: [number, number] }> = ({ y, p, offset }) => {
  const tubes = useMemo(() => {
    const out: THREE.TubeGeometry[] = [];
    for (const f of (riversJson as any).features) {
      const lines: number[][][] = f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const l of lines) {
        const pts = l.filter((c) => c[0] > 76.4 && c[0] < 85.4 && c[1] > 12.4 && c[1] < 20.2).map(([lon, lat]) => { const [x, z] = lonLatToXZ(M, lon, lat); return new THREE.Vector3(x, y, z); });
        if (pts.length > 2) out.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 0.018, 5, false));
      }
    }
    return out;
  }, [y]);
  return (
    <group position={[offset[0], 0, offset[1]]}>
      {tubes.map((g, i) => {
        g.setDrawRange(0, Math.floor((g.index!.count * p) / 6) * 6);
        return (
          <mesh key={i} geometry={g}>
            <meshBasicMaterial color={C.teal} />
          </mesh>
        );
      })}
    </group>
  );
};

/** SEQUENCE A — 2014 bifurcation. Phases scale with dur (design 900 frames). */
export const Bifurcation: React.FC<{ dur: number; marks: { split: number; hyd: number; coast: number; amaravati: number; vizag: number } }> = ({ dur, marks }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const split = prog(f, marks.split, marks.split + 50, EZ.inOut);
  const tgOff: [number, number] = [-0.9 * split, -0.55 * split];
  const tgLift = 0.25 * split;
  const coast = prog(f, marks.coast, marks.coast + 60, EZ.inOut);
  const pos = kfv(f, [
    [0, [1.5, 12, 9.5]],
    [marks.split, [0.8, 9.5, 8.2]],
    [marks.coast, [3.0, 8.4, 8.4]],
    [dur, [3.8, 7.6, 7.6]],
  ], EZ.inOut);
  const tgt = kfv(f, [
    [0, [0, 0, 0]],
    [marks.split, [-0.5, 0, -0.2]],
    [marks.coast, [1.0, 0, 0.2]],
    [dur, [1.8, 0, -0.2]],
  ], EZ.inOut);
  const cam = { pos, target: tgt, fov: 34 };
  const project = makeProjector(cam, width, height);
  const united = 1 - split;
  const P = (n: string, dy = 0.3, off: [number, number] = [0, 0]) => {
    const pl = PLACES[n];
    const [x, z] = lonLatToXZ(M, pl.lon, pl.lat);
    return [x + off[0], dy, z + off[1]];
  };
  const hyd3 = P("Hyderabad", 0.32 + tgLift, tgOff);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #1B2533 0%, #10151C 80%)" }}>
      <ThreeCanvas width={width} height={height} gl={{ antialias: true, preserveDrawingBuffer: true }} dpr={(globalThis as any).__GL_DPR ?? 0.8}>
        <CamRig cam={cam} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[-4, 10, 6]} intensity={1.4} />
        <directionalLight position={[6, 4, -6]} intensity={0.3} color="#9FB7FF" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#141B25" roughness={1} />
        </mesh>
        <gridHelper args={[30, 60, "#22385E", "#1A2638"]} position={[0, -0.01, 0]} />
        {["Odisha", "Karnataka", "Tamil Nadu", "Maharashtra", "Chhattisgarh"].map((n) => (
          <Outline key={n} name={n} y={0.005} color="#4A5A70" opacity={0.6} />
        ))}
        <Slab name="Andhra Pradesh" depth={0.22} color={C.white} edge={C.cobalt} y={0} offset={[0, 0]} />
        <Slab
          name="Telangana"
          depth={0.22}
          color={united > 0.5 ? C.white : "#C9D4E8"}
          edge={split > 0.05 ? C.coral : C.cobalt}
          y={tgLift}
          offset={tgOff}
          emissive={split > 0.05 && split < 0.95 ? C.coral : "#000000"}
        />
        <Rivers y={0.235} p={coast} offset={[0, 0]} />
        {/* glowing coastline marker band */}
        {coast > 0 ? (
          <mesh position={[3.6, 0.24, 1.2]} rotation={[-Math.PI / 2, 0, 0.62]}>
            <planeGeometry args={[0.04, 6.2 * coast]} />
            <meshBasicMaterial color={C.teal} transparent opacity={0} />
          </mesh>
        ) : null}
      </ThreeCanvas>
      {/* labels */}
      {(() => {
        const s = project(hyd3);
        return <MapLabel x={s.x} y={s.y} p={prog(f, marks.hyd - 30, marks.hyd)} label="Hyderabad" sub={split > 0.5 ? "NOW CAPITAL OF TELANGANA" : "CAPITAL OF UNITED AP"} side="l" color={split > 0.5 ? C.coral : C.white} />;
      })()}
      {(() => {
        const s = project(P("Hyderabad", 0.3 + tgLift, [tgOff[0] + 0.2, tgOff[1] - 1.5]));
        return split > 0.6 ? <MapLabel x={s.x} y={s.y} p={prog(f, marks.split + 30, marks.split + 50)} label="Telangana" sub="FORMED 2 JUNE 2014" side="r" color={C.silver} /> : null;
      })()}
      {(() => {
        const s = project(P("Vijayawada", 0.3, [0.9, 0.6]));
        return split > 0.6 ? <MapLabel x={s.x} y={s.y} p={prog(f, marks.split + 40, marks.split + 60) * (1 - prog(f, marks.amaravati - 10, marks.amaravati))} label="Andhra Pradesh" sub="RESIDUARY STATE" side="r" /> : null;
      })()}
      {(() => {
        const s = project(P("Amaravati", 0.26));
        return <MapLabel x={s.x} y={s.y} p={prog(f, marks.amaravati, marks.amaravati + 24)} label="Amaravati" sub="CAPITAL · FOUNDATION STONE 22 OCT 2015" side="l" color={C.yellow} />;
      })()}
      {(() => {
        const s = project(P("Visakhapatnam", 0.26));
        return <MapLabel x={s.x} y={s.y} p={prog(f, marks.vizag, marks.vizag + 24)} label="Visakhapatnam" sub="THE NEW ECONOMIC ENGINE?" side="r" color={C.white} />;
      })()}
      <div style={{ position: "absolute", left: 110, bottom: 96, opacity: prog(f, marks.coast, marks.coast + 30) }}>
        <div style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: 3, color: C.teal, fontWeight: 700 }}>WHAT ANDHRA PRADESH KEPT</div>
        <div style={{ fontFamily: F.serif, fontSize: 36, color: C.white, marginTop: 8, fontStyle: "italic" }}>A long coastline · the Krishna & Godavari deltas</div>
      </div>
      <div style={{ position: "absolute", left: 110, top: 96, opacity: prog(f, 0, 20) * (1 - prog(f, marks.split - 10, marks.split)) }}>
        <StatusTag text="UNITED ANDHRA PRADESH · UNTIL 1 JUNE 2014" color={C.silver} />
      </div>
      <div style={{ position: "absolute", right: 110, top: 96, opacity: prog(f, marks.split + 10, marks.split + 30) }}>
        <StatusTag text="AP REORGANISATION ACT · 2 JUNE 2014" color={C.coral} />
      </div>
    </AbsoluteFill>
  );
};

/** Animated editorial timeline (bottom band) */
export const TimelineBand: React.FC<{ items: { date: string; label: string; at: number; color?: string }[]; dark?: boolean }> = ({ items, dark = true }) => {
  const f = useCurrentFrame();
  const n = items.length;
  const x0 = 140, x1 = 1780;
  const active = items.filter((it) => f >= it.at).length - 1;
  const lineP = prog(f, 0, 30, EZ.inOut);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 210, background: dark ? "linear-gradient(transparent, rgba(13,18,25,.92) 40%)" : "transparent" }}>
      <svg width={1920} height={210} style={{ position: "absolute", left: 0, top: 0 }}>
        <line x1={x0} y1={110} x2={x0 + (x1 - x0) * lineP} y2={110} stroke={C.grey} strokeWidth={1.5} opacity={0.6} />
        {active >= 0 ? <line x1={x0} y1={110} x2={x0 + ((x1 - x0) * Math.max(0, active)) / Math.max(1, n - 1)} y2={110} stroke={C.cobalt} strokeWidth={3} /> : null}
        {items.map((it, i) => {
          const x = x0 + ((x1 - x0) * i) / Math.max(1, n - 1);
          const p = prog(f, it.at, it.at + 14, EZ.over);
          return (
            <g key={i}>
              <circle cx={x} cy={110} r={6 + 4 * p} fill={i <= active ? it.color ?? C.cobalt : "#2A3646"} stroke={C.white} strokeWidth={i === active ? 2 : 0} />
            </g>
          );
        })}
      </svg>
      {items.map((it, i) => {
        const x = x0 + ((x1 - x0) * i) / Math.max(1, n - 1);
        const p = prog(f, it.at, it.at + 18);
        return (
          <div key={i} style={{ position: "absolute", left: x - 150, width: 300, top: 130, textAlign: "center", opacity: 0.35 + 0.65 * p }}>
            <div style={{ fontFamily: F.mono, fontSize: 20, fontWeight: 700, color: i === active ? C.yellow : C.silver, letterSpacing: 1 }}>{it.date}</div>
            <div style={{ fontFamily: F.display, fontSize: 19, color: C.white, marginTop: 4, fontWeight: 500 }}>{it.label}</div>
          </div>
        );
      })}
    </div>
  );
};
