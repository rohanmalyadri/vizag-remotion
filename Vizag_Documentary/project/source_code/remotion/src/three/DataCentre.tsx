import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { CamRig, makeProjector } from "./Terrain";
import { C, EZ, F } from "../lib/theme";
import { kfv, prog, rand } from "../lib/anim";
import { MapLabel, StatusTag } from "./TerrainStage";

/** Visual language: wireframe = proposed / not yet built; solid = built. */
const Box: React.FC<{ size: [number, number, number]; pos: [number, number, number]; solid: number; color?: string; edge?: string; rise?: number }> = ({
  size, pos, solid, color = "#E6EAEE", edge = C.cobalt, rise = 1,
}) => {
  const geo = useMemo(() => new THREE.BoxGeometry(...size), [size]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geo), [geo]);
  const r = Math.max(rise, 0.001);
  return (
    <group position={[pos[0], pos[1] - (size[1] * (1 - r)) / 2, pos[2]]} scale={[1, r, 1]}>
      <mesh geometry={geo}>
        <meshStandardMaterial color={color} transparent opacity={0.08 + 0.92 * solid} roughness={0.55} metalness={0.05} depthWrite={solid > 0.5} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={edge} transparent opacity={0.9 - solid * 0.55} />
      </lineSegments>
    </group>
  );
};

const Racks: React.FC<{ f: number; origin: [number, number, number]; rows: number; perRow: number; p: number }> = ({ f, origin, rows, perRow, p }) => {
  const N = rows * perRow;
  const rackGeo = useMemo(() => new THREE.BoxGeometry(0.26, 0.62, 0.34), []);
  const rackMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1B222C", roughness: 0.4, metalness: 0.5 }), []);
  const ledGeo = useMemo(() => new THREE.BoxGeometry(0.012, 0.012, 0.012), []);
  const ledMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }), []);
  const rr = React.useRef<THREE.InstancedMesh>(null);
  const lr = React.useRef<THREE.InstancedMesh>(null);
  const LEDS = 10;
  React.useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const col = new THREE.Color();
    let k = 0;
    for (let r = 0; r < rows; r++)
      for (let i = 0; i < perRow; i++) {
        const idx = r * perRow + i;
        const appear = Math.min(1, Math.max(0, p * (N + 20) - idx) / 20);
        const x = origin[0] + i * 0.3, z = origin[2] + r * 0.95 + (r % 2) * 0.12, y = origin[1] + 0.31 * appear;
        m.makeScale(1, Math.max(appear, 0.001), 1).setPosition(x, y, z);
        rr.current?.setMatrixAt(idx, m);
        for (let l = 0; l < LEDS; l++) {
          m.makeTranslation(x - 0.08 + (l % 2) * 0.16, origin[1] + 0.06 + Math.floor(l / 2) * 0.11, z + (r % 2 ? -0.175 : 0.175));
          if (appear < 1) m.makeScale(0, 0, 0);
          lr.current?.setMatrixAt(k, m);
          const on = rand(idx * 31 + l + Math.floor(f / (3 + (l % 4)))) > 0.35;
          col.set(on ? (l % 5 === 0 ? "#F1E5A7" : "#5B84FF") : "#0C1118");
          lr.current?.setColorAt(k, col);
          k++;
        }
      }
    if (rr.current) rr.current.instanceMatrix.needsUpdate = true;
    if (lr.current) {
      lr.current.instanceMatrix.needsUpdate = true;
      if (lr.current.instanceColor) lr.current.instanceColor.needsUpdate = true;
    }
  });
  return (
    <group>
      <instancedMesh ref={rr} args={[rackGeo, rackMat, N]} />
      <instancedMesh ref={lr} args={[ledGeo, ledMat, N * LEDS]} />
    </group>
  );
};

const Tower: React.FC<{ pos: [number, number, number]; h?: number }> = ({ pos, h = 3 }) => (
  <group position={pos}>
    {[[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].map(([x, z], i) => (
      <mesh key={i} position={[x * 0.6, h / 2, z * 0.6]} rotation={[z * 0.12, 0, -x * 0.12]}>
        <cylinderGeometry args={[0.025, 0.04, h, 5]} />
        <meshStandardMaterial color="#AEB8C3" metalness={0.6} roughness={0.4} />
      </mesh>
    ))}
    <mesh position={[0, h, 0]}>
      <boxGeometry args={[1.6, 0.06, 0.08]} />
      <meshStandardMaterial color="#AEB8C3" />
    </mesh>
  </group>
);

const Catenary: React.FC<{ a: number[]; b: number[]; p: number; color?: string }> = ({ a, b, p, color = "#AEB8C3" }) => {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      pts.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * 0.35, a[2] + (b[2] - a[2]) * t));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.012, 5, false);
  }, [a, b]);
  geo.setDrawRange(0, Math.floor((geo.index!.count * p) / 6) * 6);
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial color={color} />
    </mesh>
  );
};

export const DataCentreCampus: React.FC<{ dur: number; status?: string; a?: number; b?: number; caption?: string }> = ({ dur, status = "PROPOSED · ARTIST'S EXPLAINER", a = 0, b = 900, caption }) => {
  const rf = useCurrentFrame();
  const f = a + (rf / Math.max(1, dur)) * (b - a);
  const { width, height } = useVideoConfig();
  const T = (x: number) => x;
  const pos = kfv(f, [
    [0, [16, 14, 18]],
    [T(300), [10, 7.5, 13]],
    [T(420), [3.5, 5.2, 6.5]],
    [T(640), [-0.6, 3.6, 5.8]],
    [T(900), [-4.6, 3.0, 5.4]],
  ], EZ.inOut);
  const tgt = kfv(f, [
    [0, [0, 0, 0]],
    [T(300), [0, 0.5, 0]],
    [T(420), [-0.5, 0.6, -0.8]],
    [T(640), [-2.8, 0.3, 1.1]],
    [T(900), [-2.6, 0.4, 0.9]],
  ], EZ.inOut);
  const cam = { pos, target: tgt, fov: 36 };
  const project = makeProjector(cam, width, height);
  const solid = prog(f, T(120), T(260), EZ.inOut) * 0.85; // becomes semi-solid model; never presented as completed
  const rise = (k: number) => prog(f, T(20) + k * T(18), T(110) + k * T(18), EZ.over);
  const roof = prog(f, T(400), T(470), EZ.inOut);
  const racksP = prog(f, T(430), T(620), EZ.out);
  const powerP = prog(f, T(180), T(300), EZ.inOut);
  const fibreP = prog(f, T(220), T(330), EZ.inOut);
  const halls: [number, number][] = [[-2.8, -3], [2.8, -3], [-2.8, 1.2], [2.8, 1.2]];
  // airflow arrows (cold aisle teal → hot aisle coral)
  const flow = (rf % 40) / 40;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 35%, #1D2836 0%, #121820 75%)" }}>
      <ThreeCanvas width={width} height={height} gl={{ antialias: true, preserveDrawingBuffer: true }} dpr={(globalThis as any).__GL_DPR ?? 0.8}>
        <CamRig cam={cam} />
        <fog attach="fog" args={["#121820", 18, 60]} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[8, 14, 6]} intensity={1.5} />
        <directionalLight position={[-10, 6, -4]} intensity={0.35} color="#9FB7FF" />
        {/* ground + survey grid */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial color="#18212C" roughness={1} />
        </mesh>
        <gridHelper args={[60, 60, "#2B4A8A", "#1F2E44"]} position={[0, 0.001, 0]} />
        {/* site pad */}
        <Box size={[13, 0.08, 10]} pos={[0, 0.04, -1]} solid={0.5 + solid * 0.5} color="#3A4656" edge={C.cobalt} rise={prog(f, 0, T(30))} />
        {halls.map(([x, z], k) => (
          <group key={k}>
            <Box size={[4.6, 1.4, 3.1]} pos={[x, 0.78, z]} solid={k === 2 ? solid * (1 - roof * 0.9) : solid} rise={rise(k)} />
            {/* roof (lifts off the first hall to reveal the white space) */}
            {k === 2 ? (
              <Box size={[4.7, 0.08, 3.2]} pos={[x, 1.52 + roof * 2.4, z]} solid={solid * (1 - roof * 0.8)} color="#C9D1D9" rise={rise(k)} />
            ) : null}
            {/* rooftop cooling units */}
            {Array.from({ length: 6 }).map((_, i) => (
              <group key={i} position={[x - 1.8 + i * 0.72, 1.62 + (k === 2 ? roof * 2.4 : 0), z - 1.0]} scale={Math.max(rise(k) * prog(f, T(140) + i * 3, T(180) + i * 3, EZ.over), 0.001)}>
                <mesh>
                  <boxGeometry args={[0.56, 0.22, 0.56]} />
                  <meshStandardMaterial color="#8E99A6" metalness={0.4} roughness={0.5} />
                </mesh>
                <mesh position={[0, 0.115, 0]} rotation={[0, f * 0.25 + i, 0]}>
                  <cylinderGeometry args={[0.2, 0.2, 0.02, 3]} />
                  <meshStandardMaterial color="#2A333F" />
                </mesh>
              </group>
            ))}
          </group>
        ))}
        {/* interior racks of hall 2 */}
        <Racks f={rf} origin={[-4.7, 0.08, 0.05]} rows={3} perRow={13} p={racksP} />
        {/* airflow */}
        {racksP > 0.6
          ? [0, 1].map((a) => (
              <mesh key={a} position={[-4.9 + flow * 4.2, 0.5, 0.5 + a * 0.95]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.07, 0.22, 10]} />
                <meshBasicMaterial color={a === 0 ? C.teal : C.coral} transparent opacity={0.85} />
              </mesh>
            ))
          : null}
        {/* substation */}
        {[0, 1, 2].map((i) => (
          <Box key={"t" + i} size={[0.7, 0.8, 0.6]} pos={[7.6, 0.4, -4 + i * 1.2]} solid={solid} color="#9AA6B2" rise={prog(f, T(150), T(220), EZ.over)} />
        ))}
        <Tower pos={[11, 0, -2.8]} h={3.2} />
        <Tower pos={[17, 0, -2.8]} h={3.2} />
        <Tower pos={[23, 0, -2.8]} h={3.2} />
        <Catenary a={[23, 3.2, -2.8]} b={[17, 3.2, -2.8]} p={powerP} />
        <Catenary a={[17, 3.2, -2.8]} b={[11, 3.2, -2.8]} p={prog(f, T(220), T(300))} />
        <Catenary a={[11, 3.2, -2.8]} b={[7.6, 0.9, -2.8]} p={prog(f, T(260), T(320))} color={C.yellow} />
        {/* fibre trench */}
        <mesh position={[-3.5 - (1 - fibreP) * 6, 0.03, 4.6]} scale={[fibreP, 1, 1]}>
          <boxGeometry args={[14, 0.04, 0.12]} />
          <meshBasicMaterial color={C.cobalt} />
        </mesh>
        {fibreP > 0.95
          ? [0, 1, 2].map((i) => (
              <mesh key={"fp" + i} position={[-10 + (((f * 0.08 + i * 4.7) % 14)), 0.08, 4.6]}>
                <sphereGeometry args={[0.09, 10, 8]} />
                <meshBasicMaterial color="#C9D8FF" />
              </mesh>
            ))
          : null}
      </ThreeCanvas>
      {/* labels */}
      {(
        [
          ["Data halls", "servers & AI accelerators", [2.8, 1.6, -3], T(110), T(390), "r"],
          ["Cooling plant", "rejects heat from the halls", [-1.1, 1.9, 0.2], T(170), T(390), "l"],
          ["Substation", "grid power steps down here", [7.6, 1.0, -2.8], T(230), T(400), "l"],
          ["Fibre", "connects to the cable network", [-5.5, 0.1, 4.6], T(310), T(420), "l"],
          ["Server racks", "the 'white space' inside a hall", [-3.0, 0.7, 1.0], T(560), T(800), "r"],
        ] as [string, string, number[], number, number, "l" | "r"][]
      ).map(([a, b, p3, s0, s1, side], i) => {
        const sp = project(p3);
        const lp = prog(f, s0, s0 + 20) * (1 - prog(f, s1, s1 + 12, EZ.in));
        return <MapLabel key={i} x={sp.x} y={sp.y} p={lp} label={a} sub={b} side={side} color={i === 4 ? C.yellow : C.white} />;
      })}
      <div style={{ position: "absolute", left: 110, top: 92 }}>
        <div style={{ fontFamily: F.mono, fontSize: 18, color: C.cobalt, letterSpacing: 4, fontWeight: 700, opacity: prog(f, 6, 24) }}>ANATOMY OF AN AI DATA CENTRE</div>
        <div style={{ marginTop: 12, opacity: prog(f, 16, 30) }}>
          <StatusTag text={status} color={C.silver} />
        </div>
      </div>
      {caption ? (
        <div style={{ position: "absolute", left: 110, bottom: 100, opacity: prog(rf, 10, 26) }}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 76, color: C.white, letterSpacing: -2 }}>{caption}</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** 1 GW = 1,000 MW visualised as a 10×10×10 lattice of 1 MW cubes */
export const GigawattCubes: React.FC<{ dur: number; label?: string; status?: string; source?: string }> = ({
  dur, label = "Planned capacity of the Google AI hub", status = "ANNOUNCED", source = "Google / Govt. of Andhra Pradesh MoU, 14 Oct 2025",
}) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const fill = prog(f, 10, Math.min(dur * 0.55, 150), EZ.inOut);
  const ang = f * 0.004 + 0.6;
  const cam = { pos: [Math.cos(ang) * 5.4 + 1.6, 3.6, Math.sin(ang) * 5.4], target: [1.8, 1.35, -0.4], fov: 36 };
  const mw = Math.round(1000 * Math.min(1, fill * 1.06));
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 60% 45%, #1A2534 0%, #10151C 75%)" }}>
      <ThreeCanvas width={width} height={height} gl={{ antialias: true, preserveDrawingBuffer: true }} dpr={(globalThis as any).__GL_DPR ?? 0.8}>
        <CamRig cam={cam} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 9, 4]} intensity={1.6} />
        <directionalLight position={[-6, 3, -5]} intensity={0.4} color="#F1E5A7" />
        <group position={[2.6, 0, -0.6]}>
          <Cubes fill={fill} />
        </group>
        <gridHelper args={[20, 40, "#2B4A8A", "#1C2A3E"]} />
      </ThreeCanvas>
      <GWText f={f} mw={mw} label={label} status={status} source={source} />
    </AbsoluteFill>
  );
};

const Cubes: React.FC<{ fill: number }> = ({ fill }) => {
  const N = 1000;
  const geo = useMemo(() => new THREE.BoxGeometry(0.22, 0.22, 0.22), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.35, metalness: 0.1 }), []);
  const ref = React.useRef<THREE.InstancedMesh>(null);
  React.useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const x = i % 10, y = Math.floor(i / 100), z = Math.floor(i / 10) % 10;
      const order = (y * 100 + ((x + z) % 20) * 5 + x) / 1100;
      const a = Math.min(1, Math.max(0, (fill * 1.15 - order) * 9));
      m.makeScale(a, a, a).setPosition((x - 4.5) * 0.3, y * 0.3 + 0.15 + (1 - a) * 1.5, (z - 4.5) * 0.3);
      ref.current?.setMatrixAt(i, m);
      c.set(i % 97 === 0 ? C.yellow : y % 2 ? "#5B84FF" : "#315FEA");
      ref.current?.setColorAt(i, c);
    }
    if (ref.current) {
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }
  });
  return <instancedMesh ref={ref} args={[geo, mat, N]} />;
};

const GWText: React.FC<{ f: number; mw: number; label: string; status: string; source: string }> = ({ f, mw, label, status, source }) => {
  return (
      <div style={{ position: "absolute", left: 120, top: 300 }}>
        <div style={{ opacity: prog(f, 4, 18) }}>
          <StatusTag text={status} />
        </div>
        <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 210, color: C.white, letterSpacing: -8, lineHeight: 1, marginTop: 20, fontVariantNumeric: "tabular-nums" }}>
          {mw >= 1000 ? "1 GW" : `${mw} MW`}
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 24, color: C.silver, marginTop: 10, letterSpacing: 2, opacity: prog(f, 30, 50) }}>1 GIGAWATT = 1,000 MEGAWATTS · EACH CUBE = 1 MW</div>
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 36, color: C.white, marginTop: 26, maxWidth: 680, opacity: prog(f, 40, 60) }}>{label}</div>
        <div style={{ fontFamily: F.mono, fontSize: 15, color: C.grey, marginTop: 26, letterSpacing: 1, opacity: prog(f, 50, 70) }}>SOURCE · {source}</div>
      </div>
  );
};
