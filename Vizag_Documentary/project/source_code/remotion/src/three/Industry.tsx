import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { CamRig } from "./Terrain";
import { C, EZ, F } from "../lib/theme";
import { kf, kfv, prog, rand } from "../lib/anim";
import { StatusTag } from "./TerrainStage";
import { MaskLine } from "../mg/Type";

/** Molten-steel footage seen only through giant metallic typography (multiply knock-out) */
export const SteelText: React.FC<{ dur: number; clip: string; word?: string; sub?: string }> = ({ dur, clip, word = "STEEL", sub }) => {
  const f = useCurrentFrame();
  const sc = kf(f, [[0, 1.18], [dur, 1.0]], EZ.out);
  const track = kf(f, [[0, 80], [dur * 0.6, -10]], EZ.out);
  return (
    <AbsoluteFill style={{ background: "#000", opacity: 1 - prog(f, dur - 8, dur, EZ.in) }}>
      <AbsoluteFill style={{ transform: `scale(${sc})` }}>
        <OffthreadVideo src={staticFile(clip)} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.25) saturate(1.3)" }} />
      </AbsoluteFill>
      {/* knock-out layer: black everywhere except the letters */}
      <AbsoluteFill style={{ background: "#000", mixBlendMode: "multiply", justifyContent: "center", alignItems: "center", opacity: kf(f, [[dur * 0.72, 1], [dur * 0.92, 0.2]]) }}>
        <div style={{ fontFamily: F.display, fontWeight: 900, fontSize: 470, color: "#fff", letterSpacing: track, lineHeight: 1 }}>{word}</div>
      </AbsoluteFill>
      {/* metallic rim on letters */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: kf(f, [[0, 0], [20, 0.9]]) * kf(f, [[dur * 0.72, 1], [dur * 0.92, 0]]) }}>
        <div style={{ fontFamily: F.display, fontWeight: 900, fontSize: 470, color: "transparent", WebkitTextStroke: "2px rgba(255,220,180,.55)", letterSpacing: track, lineHeight: 1 }}>{word}</div>
      </AbsoluteFill>
      {sub ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 130, textAlign: "center" }}>
          <MaskLine start={14}>
            <div style={{ fontFamily: F.mono, fontSize: 30, letterSpacing: 12, color: C.white }}>{sub}</div>
          </MaskLine>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Steel beams assemble into a city of frames (3D), with project figures */
const Beams: React.FC<{ p: number; f: number }> = ({ p, f }) => {
  const N = 26 * 4 * 3;
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8E99A6", metalness: 0.85, roughness: 0.32 }), []);
  const ref = React.useRef<THREE.InstancedMesh>(null);
  React.useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3();
    let k = 0;
    for (let b = 0; b < 26; b++) {
      const bx = (b % 6) * 2.2 - 5.5, bz = Math.floor(b / 6) * 2.2 - 3.3;
      const floors = 2 + Math.floor(rand(b) * 5);
      for (let fl = 0; fl < 4; fl++) {
        for (let e = 0; e < 3; e++) {
          const idx = b * 12 + fl * 3 + e;
          const local = Math.min(1, Math.max(0, p * 1.6 - (b / 26) * 0.6 - fl * 0.08));
          const show = fl < floors ? local : 0;
          const y = fl * 0.9 + 0.45;
          if (e === 0) { s.set(0.08, 0.9, 0.08); v.set(bx - 0.6, y, bz - 0.6); }
          else if (e === 1) { s.set(1.3, 0.08, 0.08); v.set(bx, y + 0.45, bz - 0.6); }
          else { s.set(0.08, 0.08, 1.3); v.set(bx - 0.6, y + 0.45, bz); }
          const drop = (1 - EZ.out(show)) * 6;
          s.multiplyScalar(Math.max(show, 0.0001));
          m.compose(v.clone().setY(v.y + drop), q, s);
          ref.current?.setMatrixAt(idx, m);
          k++;
        }
      }
    }
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, N]} />;
};

export const SteelCity: React.FC<{ dur: number; facts: { n: string; l: string; tag: string; at: number }[] }> = ({ dur, facts }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const p = prog(f, 0, dur * 0.8, EZ.inOut);
  const ang = 0.7 + f * 0.003;
  const cam = { pos: [Math.cos(ang) * 15, kf(f, [[0, 3], [dur, 7]]), Math.sin(ang) * 15], target: [0, 1.2, 0], fov: 34 };
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #2A1E18 0%, #0E1014 75%)", opacity: 1 - prog(f, dur - 10, dur, EZ.in) }}>
      <ThreeCanvas width={width} height={height} gl={{ antialias: true, preserveDrawingBuffer: true }} dpr={(globalThis as any).__GL_DPR ?? 0.8}>
        <CamRig cam={cam} />
        <fog attach="fog" args={["#0E1014", 16, 40]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[6, 12, 4]} intensity={1.4} color="#FFE2C2" />
        <pointLight position={[0, 1, 0]} intensity={40} distance={14} color="#FF7A2A" />
        <Beams p={p} f={f} />
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#14161A" roughness={0.9} />
        </mesh>
        <gridHelper args={[40, 40, "#5A3A2A", "#2A2220"]} position={[0, 0.002, 0]} />
      </ThreeCanvas>
      <div style={{ position: "absolute", left: 120, top: 120 }}>
        <div style={{ opacity: prog(f, 0, 14) }}><StatusTag text="FOUNDATION LAID · 23 MAR 2026 · PROPOSED CAPACITY" /></div>
      </div>
      <div style={{ position: "absolute", left: 120, bottom: 120, display: "flex", gap: 70 }}>
        {facts.map((x, i) => (
          <div key={i} style={{ opacity: prog(f, x.at, x.at + 14), transform: `translateY(${(1 - prog(f, x.at, x.at + 18, EZ.out)) * 30}px)` }}>
            <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 84, color: C.white, letterSpacing: -2 }}>{x.n}</div>
            <div style={{ fontFamily: F.mono, fontSize: 20, color: C.silver, letterSpacing: 1.5, marginTop: 4 }}>{x.l}</div>
            <div style={{ marginTop: 10 }}><StatusTag text={x.tag} color={C.silver} /></div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** 3D runway with an aircraft taking off; terminal block; timeline chips */
const Aircraft: React.FC<{ pos: number[]; pitch: number }> = ({ pos, pitch }) => (
  <group position={pos as [number, number, number]} rotation={[0, Math.PI / 2, pitch]}>
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.22, 0.18, 3.2, 16]} />
      <meshStandardMaterial color="#F2F4F6" metalness={0.3} roughness={0.4} />
    </mesh>
    <mesh position={[1.7, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
      <coneGeometry args={[0.22, 0.5, 16]} />
      <meshStandardMaterial color="#F2F4F6" />
    </mesh>
    <mesh position={[0.1, -0.05, 0]}>
      <boxGeometry args={[0.7, 0.05, 3.4]} />
      <meshStandardMaterial color="#D9DEE3" />
    </mesh>
    <mesh position={[-1.4, 0.35, 0]}>
      <boxGeometry args={[0.45, 0.6, 0.06]} />
      <meshStandardMaterial color={C.cobalt} />
    </mesh>
    <mesh position={[-1.4, 0.05, 0]}>
      <boxGeometry args={[0.35, 0.04, 1.2]} />
      <meshStandardMaterial color="#D9DEE3" />
    </mesh>
  </group>
);

export const Runway3D: React.FC<{ dur: number; chips: { t: string; at: number; tag: string; color?: string }[] }> = ({ dur, chips }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 4096;
    const g = c.getContext("2d")!;
    g.fillStyle = "#2B3038"; g.fillRect(0, 0, 256, 4096);
    g.fillStyle = "#EDEFF2";
    for (let y = 200; y < 3900; y += 120) g.fillRect(124, y, 8, 60);
    for (let i = 0; i < 8; i++) { g.fillRect(30 + i * 26, 40, 14, 120); g.fillRect(30 + i * 26, 3936, 14, 120); }
    g.fillRect(6, 0, 6, 4096); g.fillRect(244, 0, 6, 4096);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 8;
    return t;
  }, []);
  const roll = prog(f, dur * 0.15, dur * 0.7, EZ.in);
  const x = kf(f, [[dur * 0.15, -14], [dur * 0.7, 10], [dur, 22]], [EZ.in, EZ.lin]);
  const y = 0.45 + Math.max(0, x - 4) * 0.28 * prog(f, dur * 0.5, dur, EZ.in) * 3;
  const pitch = x > 3 ? 0.18 * prog(f, dur * 0.5, dur * 0.62) : 0;
  const cam = { pos: kfv(f, [[0, [-16, 3.4, 9]], [dur, [4, 2.4, 9.5]]], EZ.inOut), target: kfv(f, [[0, [-8, 0.5, 0]], [dur, [10, 1.8, 0]]], EZ.inOut), fov: 38 };
  void roll;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#9DB7CF 0%, #E1E6EA 55%)", opacity: 1 - prog(f, dur - 10, dur, EZ.in) }}>
      <ThreeCanvas width={width} height={height} gl={{ antialias: true, preserveDrawingBuffer: true }} dpr={(globalThis as any).__GL_DPR ?? 0.8}>
        <CamRig cam={cam} />
        <fog attach="fog" args={["#D5DEE6", 30, 90]} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 18, 6]} intensity={1.6} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#7E9466" roughness={1} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.01, 0]}>
          <planeGeometry args={[3, 60]} />
          <meshStandardMaterial map={tex} roughness={0.8} />
        </mesh>
        {/* taxiway + apron + terminal */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, -6]}>
          <planeGeometry args={[30, 6]} />
          <meshStandardMaterial color="#5C636D" />
        </mesh>
        <mesh position={[0, 1.2, -11]}>
          <boxGeometry args={[22, 2.4, 4]} />
          <meshStandardMaterial color="#E7ECF0" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0, 2.55, -11]}>
          <boxGeometry args={[23, 0.3, 4.6]} />
          <meshStandardMaterial color="#A9B4BF" />
        </mesh>
        <mesh position={[8, 3, -9.5]}>
          <cylinderGeometry args={[0.35, 0.45, 6, 12]} />
          <meshStandardMaterial color="#DDE3E8" />
        </mesh>
        <Aircraft pos={[x, y, 0]} pitch={pitch} />
      </ThreeCanvas>
      <div style={{ position: "absolute", left: 120, top: 110 }}>
        <div style={{ fontFamily: F.mono, fontSize: 20, color: C.navy, letterSpacing: 4, fontWeight: 700 }}>ALLURI SITARAMA RAJU INTERNATIONAL AIRPORT · BHOGAPURAM</div>
      </div>
      <div style={{ position: "absolute", left: 120, bottom: 110, display: "flex", gap: 22 }}>
        {chips.map((c, i) => (
          <div key={i} style={{ background: "rgba(21,27,36,.88)", padding: "18px 24px", opacity: prog(f, c.at, c.at + 12), transform: `translateY(${(1 - prog(f, c.at, c.at + 16, EZ.out)) * 24}px)` }}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 32, color: C.white }}>{c.t}</div>
            <div style={{ marginTop: 8 }}><StatusTag text={c.tag} color={c.color} /></div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
