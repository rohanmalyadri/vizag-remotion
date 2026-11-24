import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { CamRig, makeProjector } from "./Terrain";
import { C, EZ, F } from "../lib/theme";
import { kfv, prog, rand } from "../lib/anim";
import { MapLabel, StatusTag } from "./TerrainStage";

/**
 * SEQUENCE C — subsea cable explainer, fully 3D.
 * Phases (local frames, scaled by `dur`):
 *  A dive through the sea surface → B seabed cable with travelling light pulses →
 *  C cut-away cross-section of the cable (labelled layers) → D cable climbs the continental shelf to a
 *  landing station on the beach and on to an inland data hall.
 */
const seabedY = (x: number, z: number) =>
  -6 + Math.sin(x * 0.35) * 0.35 + Math.cos(z * 0.27 + x * 0.1) * 0.45 + Math.sin(x * 1.3 + z * 0.9) * 0.08 +
  // continental shelf rising towards the coast at x>14
  THREE.MathUtils.smoothstep(x, 8, 18) * 6.2;

const Seabed: React.FC = () => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(70, 50, 220, 160);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setY(i, seabedY(p.getX(i), p.getZ(i)));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} position={[0, 0, 0]}>
      <meshStandardMaterial color="#2C5A66" roughness={0.95} metalness={0} />
    </mesh>
  );
};

// Beach / land block at the coast
const Shore: React.FC = () => (
  <group>
    <mesh position={[26, 0.15, 0]}>
      <boxGeometry args={[16, 0.6, 50]} />
      <meshStandardMaterial color="#C9B48A" roughness={1} />
    </mesh>
    <mesh position={[30, 0.6, 0]}>
      <boxGeometry args={[10, 0.4, 50]} />
      <meshStandardMaterial color="#5E7A55" roughness={1} />
    </mesh>
  </group>
);

const cablePath = () => {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 80; i++) {
    const x = -30 + i * 0.6;
    const z = Math.sin(i * 0.08) * 2.2;
    const y = x < 19.5 ? seabedY(x, z) + 0.12 : 0.55; // buried under the beach after landfall
    pts.push(new THREE.Vector3(x, y, z));
  }
  // to landing station
  pts.push(new THREE.Vector3(21.5, 0.5, 0.2), new THREE.Vector3(23.2, 0.55, 0.0));
  return new THREE.CatmullRomCurve3(pts, false, "centripetal");
};

const Station: React.FC<{ p: number }> = ({ p }) => (
  <group position={[24.6, 0.45, 0]} scale={[1, Math.max(p, 0.001), 1]}>
    <mesh position={[0, 0.7, 0]}>
      <boxGeometry args={[2.6, 1.4, 2.2]} />
      <meshStandardMaterial color="#E1E6EA" roughness={0.6} />
    </mesh>
    <mesh position={[0, 1.45, 0]}>
      <boxGeometry args={[2.8, 0.1, 2.4]} />
      <meshStandardMaterial color="#AEB8C3" />
    </mesh>
    {[-0.8, 0, 0.8].map((z, i) => (
      <mesh key={i} position={[0.6, 1.6, z]}>
        <boxGeometry args={[0.5, 0.25, 0.5]} />
        <meshStandardMaterial color="#8C97A3" />
      </mesh>
    ))}
  </group>
);

const DataHall: React.FC<{ p: number }> = ({ p }) => (
  <group position={[31, 0.8, -1]}>
    {[0, 1, 2].map((k) => (
      <mesh key={k} position={[k * 0.0, 0.9 * p, (k - 1) * 3.2]} scale={[1, Math.max(p, 0.001), 1]}>
        <boxGeometry args={[4.5, 1.8, 2.6]} />
        <meshStandardMaterial color="#DDE3E8" roughness={0.5} transparent opacity={0.92} />
      </mesh>
    ))}
  </group>
);

/** Concentric cut-away cable cross-section (real cable anatomy, simplified) */
const CrossSection: React.FC<{ p: number; explode: number }> = ({ p, explode }) => {
  const layers = [
    { r: 0.16, len: 3.2, col: "#7FA6FF", emissive: "#315FEA", label: "fibres" },
    { r: 0.26, len: 2.9, col: "#C98B52", emissive: "#000000", label: "copper" },
    { r: 0.42, len: 2.5, col: "#9AA6B2", emissive: "#000000", label: "steel" },
    { r: 0.55, len: 2.1, col: "#1E2632", emissive: "#000000", label: "sheath" },
  ];
  return (
    <group rotation={[0, 0, Math.PI / 2]} scale={p}>
      {layers.map((l, i) => (
        <mesh key={i} position={[0, -i * 0.35 * explode, 0]}>
          <cylinderGeometry args={[l.r, l.r, l.len, 48, 1, false, 0, Math.PI * 1.55]} />
          <meshStandardMaterial color={l.col} emissive={l.emissive} emissiveIntensity={i === 0 ? 1.4 : 0} roughness={0.45} metalness={i === 1 || i === 2 ? 0.6 : 0.05} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* individual fibres */}
      {Array.from({ length: 8 }).map((_, k) => {
        const a = (k / 8) * Math.PI * 2;
        return (
          <mesh key={"f" + k} position={[Math.cos(a) * 0.08, 0.2, Math.sin(a) * 0.08]}>
            <cylinderGeometry args={[0.025, 0.025, 3.6, 10]} />
            <meshStandardMaterial color="#DCE6FF" emissive="#5B84FF" emissiveIntensity={2} />
          </mesh>
        );
      })}
    </group>
  );
};

const Snow: React.FC<{ f: number }> = ({ f }) => {
  const N = 420;
  const geo = useMemo(() => new THREE.SphereGeometry(0.03, 5, 4), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#9FC7CC", transparent: true, opacity: 0.55 }), []);
  const ref = React.useRef<THREE.InstancedMesh>(null);
  React.useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    for (let i = 0; i < N; i++) {
      const x = -30 + rand(i) * 60, z = -12 + rand(i + 99) * 24;
      const y = -6 + rand(i + 7) * 6.5 + ((-f * 0.004 * (0.5 + rand(i + 3))) % 1);
      m.makeTranslation(x + Math.sin(f * 0.01 + i) * 0.2, y, z);
      ref.current?.setMatrixAt(i, m);
    }
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, N]} />;
};

export const SubseaScene: React.FC<{ dur: number; a?: number; b?: number }> = ({ dur, a = 0, b = 900 }) => {
  const rf = useCurrentFrame();
  const f = a + (rf / Math.max(1, dur)) * (b - a); // design-timeline frame
  const { width, height } = useVideoConfig();
  const T = (x: number) => x; // design frames
  const curve = useMemo(cablePath, []);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 400, 0.09, 12, false), [curve]);
  // Camera choreography
  const pos = kfv(f, [
    [0, [-18, 6, 10]], // above surface
    [T(120), [-16, -1.5, 7]], // through surface
    [T(300), [-6, -4.6, 3.4]], // along seabed beside the cable
    [T(420), [2.2, -3.2, 5.0]], // three-quarter view on cross-section
    [T(560), [1.4, -3.5, 4.4]], // cross-section reveal
    [T(700), [12, -1.0, 9]], // pull back, shelf
    [T(900), [17, 6, 14]], // landing station & beach
  ], EZ.inOut);
  const tgt = kfv(f, [
    [0, [-12, -2, 0]],
    [T(120), [-10, -4, 0]],
    [T(300), [-1, -5.6, 0]],
    [T(420), [-1.6, -3.9, 0.2]],
    [T(560), [-1.8, -3.9, 0.2]],
    [T(700), [18, -2, 0]],
    [T(900), [25, 0.4, 0]],
  ], EZ.inOut);
  const cam = { pos, target: tgt, fov: 38 };
  const project = makeProjector(cam, width, height);
  const underwater = pos[1] < 0 ? 1 : 0;
  const csP = prog(f, T(420), T(470), EZ.over) * (1 - prog(f, T(600), T(640), EZ.in));
  const explode = prog(f, T(470), T(540), EZ.inOut);
  const stP = prog(f, T(700), T(760), EZ.over);
  const dcP = prog(f, T(790), T(860), EZ.out);
  // Light pulses travelling along the cable (data)
  const pulses = Array.from({ length: 16 }).map((_, i) => ((rf * 0.006 + i / 16) % 1));
  const fogColor = underwater ? "#0E2A36" : "#1A2533";
  // Labels for cross-section layers
  // label anchors computed from the telescoped layer geometry (visible end of each layer, top surface)
  const layerDefs = [[0.16, 3.2], [0.26, 2.9], [0.42, 2.5], [0.55, 2.1]];
  const grp = new THREE.Matrix4().compose(new THREE.Vector3(-1.3, -3.9, 0.2), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.35, 0)), new THREE.Vector3(1, 1, 1));
  const inner = new THREE.Matrix4().makeRotationZ(Math.PI / 2);
  const anchor = (i: number) => {
    const [r, len] = layerDefs[i];
    const yEnd = len / 2 - i * 0.35 * explode - 0.08;
    const v = new THREE.Vector3(r, yEnd, 0).applyMatrix4(inner).applyMatrix4(grp);
    return [v.x, v.y, v.z];
  };
  const csLabels: [string, string, number[]][] = [
    ["Optical fibres", "light pulses carry the data", anchor(0)],
    ["Copper conductor", "powers undersea repeaters", anchor(1)],
    ["Steel armour wires", "strength & protection", anchor(2)],
    ["Polyethylene sheath", "insulation", anchor(3)],
  ];
  return (
    <AbsoluteFill style={{ background: underwater ? "linear-gradient(#0F3340, #07141B)" : "linear-gradient(#1C2A3A, #2E4A5E)" }}>
      <ThreeCanvas width={width} height={height} gl={{ antialias: true, preserveDrawingBuffer: true }} dpr={(globalThis as any).__GL_DPR ?? 0.8}>
        <CamRig cam={cam} />
        <fog attach="fog" args={[fogColor, underwater ? 6 : 30, underwater ? 34 : 120]} />
        <ambientLight intensity={underwater ? 0.55 : 0.8} color={underwater ? "#7FC4C8" : "#ffffff"} />
        <directionalLight position={[10, 20, 8]} intensity={1.6} color="#E8F3FF" />
        <directionalLight position={[-12, 6, -8]} intensity={0.4} color="#248B91" />
        <Seabed />
        <Shore />
        {/* sea surface */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2, 0, 0]}>
          <planeGeometry args={[60, 50, 1, 1]} />
          <meshStandardMaterial color={underwater ? "#3FA3A8" : "#1F5866"} transparent opacity={underwater ? 0.35 : 0.85} side={THREE.DoubleSide} roughness={0.2} metalness={0.3} />
        </mesh>
        {/* god rays */}
        {underwater
          ? [0, 1, 2, 3, 4].map((k) => (
              <mesh key={k} position={[-8 + k * 4.5, -3, -3 + k]} rotation={[0, 0.3, 0.25]}>
                <planeGeometry args={[1.2, 8]} />
                <meshBasicMaterial color="#9FE0E0" transparent opacity={0.05 + 0.03 * Math.sin(f * 0.03 + k)} depthWrite={false} blending={THREE.AdditiveBlending} />
              </mesh>
            ))
          : null}
        <mesh geometry={tube}>
          <meshStandardMaterial color="#141A22" roughness={0.6} metalness={0.4} />
        </mesh>
        {pulses.map((t, i) => {
          const p = curve.getPointAt(t);
          return (
            <mesh key={i} position={p}>
              <sphereGeometry args={[0.13, 12, 10]} />
              <meshBasicMaterial color={i % 3 === 0 ? "#F1E5A7" : "#7FA6FF"} transparent opacity={0.9} />
            </mesh>
          );
        })}
        <group position={[-1.3, -3.9, 0.2]} rotation={[0, -0.35, 0]}>
          <CrossSection p={csP} explode={explode} />
        </group>
        <Station p={stP} />
        <DataHall p={dcP} />
        {/* fibre backhaul from station to data hall */}
        {dcP > 0 ? (
          <mesh position={[27.8, 0.68, -0.5]} rotation={[0, 0, Math.PI / 2]} scale={[1, dcP, 1]}>
            <cylinderGeometry args={[0.07, 0.07, 6, 10]} />
            <meshBasicMaterial color={C.cobalt} />
          </mesh>
        ) : null}
        {underwater ? <Snow f={rf} /> : null}
      </ThreeCanvas>
      {/* labels */}
      {csP > 0.6 ? (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
            {csLabels.map(([, , p3], i) => {
              const sp = project(p3);
              const lp = prog(f, T(480) + i * 8, T(500) + i * 8, EZ.out) * (1 - prog(f, T(600), T(620), EZ.in));
              const tx = 640, ty = 250 + (3 - i) * 120;
              return (
                <g key={i} opacity={lp}>
                  <polyline points={`${tx},${ty} ${tx + 40},${ty} ${sp.x},${sp.y}`} fill="none" stroke={i === 0 ? C.yellow : C.white} strokeWidth={1.6} />
                  <circle cx={sp.x} cy={sp.y} r={4} fill={i === 0 ? C.yellow : C.white} />
                </g>
              );
            })}
          </svg>
          {csLabels.map(([a, b], i) => {
            const lp = prog(f, T(480) + i * 8, T(500) + i * 8, EZ.out) * (1 - prog(f, T(600), T(620), EZ.in));
            return (
              <div key={i} style={{ position: "absolute", right: 1920 - 625, top: 250 + (3 - i) * 120 - 26, textAlign: "right", opacity: lp, transform: `translateX(${(1 - lp) * -30}px)` }}>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 28, letterSpacing: 1.5, color: i === 0 ? C.yellow : C.white, textTransform: "uppercase", whiteSpace: "nowrap" }}>{a}</div>
                <div style={{ fontFamily: F.mono, fontSize: 17, color: C.silver, whiteSpace: "nowrap" }}>{b}</div>
              </div>
            );
          })}
        </>
      ) : null}
      {stP > 0.5
        ? (() => {
            const sp = project([24.6, 2.2, 0]);
            return <MapLabel x={sp.x} y={sp.y} p={prog(f, T(740), T(770))} label="Cable landing station" sub="where subsea cables come ashore" side="l" />;
          })()
        : null}
      {dcP > 0.5
        ? (() => {
            const sp = project([31, 2.6, -2]);
            return <MapLabel x={sp.x} y={sp.y} p={prog(f, T(830), T(860))} label="Data centre" sub="inland, fed by fibre" side="r" color={C.yellow} />;
          })()
        : null}
      {/* scale annotation during seabed phase */}
      <div style={{ position: "absolute", left: 110, top: 96, opacity: prog(f, T(200), T(230)) * (1 - prog(f, T(400), T(420))) }}>
        <div style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: 3, color: C.teal, fontWeight: 700 }}>SUBSEA FIBRE-OPTIC CABLE</div>
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 34, color: C.white, marginTop: 8, maxWidth: 720 }}>Data travels as pulses of light, thousands of kilometres along the sea floor.</div>
        <div style={{ marginTop: 14 }}>
          <StatusTag text="EXPLAINER · NOT TO SCALE" color={C.silver} />
        </div>
      </div>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(3,8,12,.6) 100%)" }} />
    </AbsoluteFill>
  );
};
