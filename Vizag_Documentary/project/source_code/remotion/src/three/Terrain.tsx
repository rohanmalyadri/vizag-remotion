import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { staticFile, delayRender, continueRender } from "remotion";
import { Dem, elevAt, lonLatToXZ, metresPerUnit, regionDims } from "../lib/geo";
import { C } from "../lib/theme";

export type CamSpec = { pos: number[]; target: number[]; fov: number };

/** Applies a deterministic camera every frame (no useFrame). */
export const CamRig: React.FC<{ cam: CamSpec }> = ({ cam }) => {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    c.position.set(cam.pos[0], cam.pos[1], cam.pos[2]);
    c.fov = cam.fov;
    c.aspect = size.width / size.height;
    c.near = 0.01;
    c.far = 400;
    c.up.set(0, 1, 0);
    c.lookAt(cam.target[0], cam.target[1], cam.target[2]);
    c.updateProjectionMatrix();
  });
  return null;
};

/** Project world points to screen (for crisp HTML labels over WebGL). */
export const makeProjector = (cam: CamSpec, width: number, height: number) => {
  const c = new THREE.PerspectiveCamera(cam.fov, width / height, 0.01, 400);
  c.position.set(cam.pos[0], cam.pos[1], cam.pos[2]);
  c.lookAt(cam.target[0], cam.target[1], cam.target[2]);
  c.updateProjectionMatrix();
  c.updateMatrixWorld();
  const v = new THREE.Vector3();
  return (p: number[]) => {
    v.set(p[0], p[1], p[2]).project(c);
    const dist = c.position.distanceTo(new THREE.Vector3(p[0], p[1], p[2]));
    return { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height, visible: v.z < 1 && v.z > -1, dist };
  };
};

const texCache: Record<string, THREE.Texture> = {};
export const useTexture = (path: string | null) => {
  const [handle] = React.useState(() => (path && !texCache[path] ? delayRender("tex " + path) : null));
  const [tex, setTex] = React.useState<THREE.Texture | null>(path ? texCache[path] ?? null : null);
  React.useEffect(() => {
    if (!path || texCache[path]) return;
    new THREE.TextureLoader().load(staticFile(path), (t) => {
      t.colorSpace = THREE.NoColorSpace;
      t.needsUpdate = true;
      t.anisotropy = 8;
      texCache[path] = t;
      setTex(t);
      if (handle !== null) continueRender(handle);
    });
  }, [path, handle]);
  return tex;
};

export type TerrainLook = {
  exag: number; // vertical exaggeration
  satMix?: number; // 0 blueprint → 1 satellite
  green?: number; // environmental tint
  warn?: number; // coral warning tint
  contour?: number; // contour line strength
  grid?: number; // grid strength
  reveal?: number; // sweep reveal 0..1 (west→east), 1 = fully visible
  night?: number; // darkening
  seaLevel?: number;
  contourEvery?: number; // metres
  paper?: number; // warm-white architectural paper look
};

const vert = /* glsl */ `
attribute float aElev;
varying float vElev;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;
void main(){
  vElev = aElev; vUv = uv; vN = normalize(normalMatrix * normal);
  vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const frag = /* glsl */ `
uniform sampler2D uSat; uniform float uHasSat, uSatMix, uGreen, uWarn, uContour, uGrid, uReveal, uNight, uEvery, uMaxE, uPaper, uSeaLvl;
uniform vec3 uLight; uniform vec2 uSpan;
varying float vElev; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
vec3 hex(float r,float g,float b){return vec3(r,g,b)/255.0;}
void main(){
  vec3 N = normalize(vN);
  float diff = clamp(dot(N, normalize(uLight)), 0.0, 1.0);
  float shade = 0.42 + 0.72*diff;
  float h = vElev - uSeaLvl;
  float t = clamp(h / uMaxE, 0.0, 1.0);
  bool sea = h <= 0.6;
  // Blueprint palette: midnight navy land, cobalt ridgelines, deep charcoal sea
  vec3 landLo = hex(30.,52.,82.), landHi = hex(70.,104.,160.);
  vec3 land = mix(landLo, landHi, pow(t,0.7)) * shade;
  float depth = clamp(-h/600.0, 0.0, 1.0);
  vec3 seaC = mix(hex(20.,43.,70.), hex(14.,20.,30.), depth);
  // Paper (architectural model) palette
  vec3 pLand = mix(hex(236.,233.,224.), hex(205.,212.,220.), pow(t,0.8)) * (0.55+0.55*diff);
  vec3 pSea = mix(hex(214.,226.,232.), hex(170.,196.,208.), depth);
  land = mix(land, pLand, uPaper); seaC = mix(seaC, pSea, uPaper);
  // Environmental tint: teal water, living green hills
  vec3 gLand = mix(hex(46.,84.,64.), hex(98.,138.,92.), pow(t,0.6)) * shade;
  land = mix(land, gLand, uGreen);
  seaC = mix(seaC, mix(hex(36.,139.,145.)*0.55, hex(20.,60.,72.), depth), uGreen*0.8);
  vec3 col = sea ? seaC : land;
  // Satellite
  if (uHasSat > 0.5) {
    vec3 s = texture2D(uSat, vUv).rgb;
    s = pow(s, vec3(0.92)) * (0.62 + 0.55*diff);
    col = mix(col, s, uSatMix);
  }
  // Contours (anti-aliased)
  float cl = h / uEvery; float fw = fwidth(cl);
  float line = 1.0 - smoothstep(0.0, max(fw*1.3, 1e-4), abs(fract(cl - 0.5) - 0.5));
  line *= step(0.0001, fw);
  vec3 lineCol = mix(hex(49.,95.,234.), hex(120.,130.,140.), uPaper);
  col = mix(col, mix(lineCol, hex(170.,230.,220.), uGreen), line * uContour * (sea ? 0.3 : 0.9));
  // Coastline (sea-level contour) emphasised
  float coast = 1.0 - smoothstep(0.0, max(fwidth(h)*1.6, 0.35), abs(h - 0.6));
  col = mix(col, mix(hex(247.,247.,243.), hex(36.,139.,145.), uGreen), coast * 0.9);
  // Survey grid
  vec2 g = vW.xz * 2.0; vec2 gw = fwidth(g);
  vec2 gl = 1.0 - smoothstep(vec2(0.0), max(gw*1.1, vec2(1e-4)), abs(fract(g - 0.5) - 0.5));
  col = mix(col, mix(hex(225.,230.,234.), hex(40.,60.,90.), uPaper), max(gl.x, gl.y) * uGrid * 0.22);
  // Warning tint
  col = mix(col, col*0.55 + hex(217.,119.,105.)*0.45, uWarn);
  col *= (1.0 - uNight*0.6);
  // Sweep reveal with scanning edge
  float u = (vW.x / uSpan.x) + 0.5;
  float edge = uReveal*1.15 - 0.075;
  float vis = smoothstep(edge+0.02, edge-0.02, u);
  float scan = exp(-pow((u-edge)*60.0, 2.0));
  col = mix(hex(21.,27.,36.), col, vis) + hex(49.,95.,234.)*scan*1.6*(uReveal<0.999?1.0:0.0);
  gl_FragColor = vec4(col, 1.0);
}`;

export const TerrainMesh: React.FC<{ dem: Dem; look: TerrainLook; stride?: number; tex?: THREE.Texture | null; base?: number }> = ({
  dem,
  look,
  stride = 2,
  tex = null,
  base = -0.25,
}) => {
  const { w, h } = regionDims(dem.meta);
  const mpu = metresPerUnit(dem.meta);
  const geo = useMemo(() => {
    const sx = Math.floor((dem.w - 1) / stride);
    const sy = Math.floor((dem.h - 1) / stride);
    const g = new THREE.PlaneGeometry(w, h, sx, sy);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const el = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const e = elevAt(dem, x, z);
      el[i] = e;
      pos.setY(i, (Math.max(e, -2000) * look.exag) / mpu);
    }
    g.setAttribute("aElev", new THREE.BufferAttribute(el, 1));
    g.computeVertexNormals();
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dem, stride, look.exag]);
  // Skirt (model block sides)
  const skirt = useMemo(() => {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const sx = Math.floor((dem.w - 1) / stride) + 1;
    const sy = Math.floor((dem.h - 1) / stride) + 1;
    const edges: number[][] = [];
    const top = Array.from({ length: sx }, (_, i) => i);
    const bottom = Array.from({ length: sx }, (_, i) => (sy - 1) * sx + i).reverse();
    const left = Array.from({ length: sy }, (_, j) => j * sx).reverse();
    const right = Array.from({ length: sy }, (_, j) => j * sx + sx - 1);
    edges.push(top, right, bottom, left);
    const verts: number[] = [];
    for (const e of edges) {
      for (let k = 0; k < e.length - 1; k++) {
        const a = e[k], b = e[k + 1];
        const ax = pos.getX(a), ay = pos.getY(a), az = pos.getZ(a);
        const bx = pos.getX(b), by = pos.getY(b), bz = pos.getZ(b);
        verts.push(ax, ay, az, bx, by, bz, bx, base, bz, ax, ay, az, bx, base, bz, ax, base, az);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    g.computeVertexNormals();
    return g;
  }, [geo, dem, stride, base]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uSat: { value: null },
          uHasSat: { value: 0 },
          uSatMix: { value: 0 },
          uGreen: { value: 0 },
          uWarn: { value: 0 },
          uContour: { value: 1 },
          uGrid: { value: 1 },
          uReveal: { value: 1 },
          uNight: { value: 0 },
          uEvery: { value: 50 },
          uMaxE: { value: 600 },
          uPaper: { value: 0 },
          uSeaLvl: { value: 0 },
          uLight: { value: new THREE.Vector3(-0.6, 0.9, -0.35) },
          uSpan: { value: new THREE.Vector2(w, h) },
        },
      }),
    [w, h],
  );
  const u = mat.uniforms;
  u.uSat.value = tex;
  u.uHasSat.value = tex ? 1 : 0;
  u.uSatMix.value = look.satMix ?? 0;
  u.uGreen.value = look.green ?? 0;
  u.uWarn.value = look.warn ?? 0;
  u.uContour.value = look.contour ?? 1;
  u.uGrid.value = look.grid ?? 1;
  u.uReveal.value = look.reveal ?? 1;
  u.uNight.value = look.night ?? 0;
  u.uEvery.value = look.contourEvery ?? 50;
  u.uMaxE.value = Math.max(dem.meta.max * 0.85, 50);
  u.uPaper.value = look.paper ?? 0;
  u.uSeaLvl.value = look.seaLevel ?? 0;
  const sideCol = useMemo(() => new THREE.Color(look.paper && look.paper > 0.5 ? "#C9CFD6" : "#0F1620"), [look.paper]);
  return (
    <group>
      <mesh geometry={geo} material={mat} />
      <mesh geometry={skirt}>
        <meshBasicMaterial color={sideCol} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

/** World position on terrain surface for a lon/lat */
export const surf = (dem: Dem, lon: number, lat: number, exag: number, lift = 0): [number, number, number] => {
  const [x, z] = lonLatToXZ(dem.meta, lon, lat);
  const e = Math.max(elevAt(dem, x, z), 0);
  return [x, (e * exag) / metresPerUnit(dem.meta) + lift, z];
};

/** Vertical survey pin with pulsing base ring */
export const Pin: React.FC<{ p: [number, number, number]; height: number; progress: number; color?: string; pulse?: number; radius?: number }> = ({
  p,
  height,
  progress,
  color = C.white,
  pulse = 0,
  radius = 0.05,
}) => {
  if (progress <= 0.001) return null;
  const hh = height * progress;
  return (
    <group position={p}>
      <mesh position={[0, hh / 2, 0]}>
        <cylinderGeometry args={[0.006, 0.006, hh, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} />
      </mesh>
      <mesh position={[0, hh, 0]}>
        <sphereGeometry args={[0.022, 14, 10]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} scale={radius * (1 + pulse * 2.2) * progress}>
        <ringGeometry args={[0.8, 1, 48]} />
        <meshBasicMaterial color={color} transparent opacity={Math.max(0, 0.9 - pulse * 0.85)} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

/** Tube following a polyline (draped/arched) with draw-on progress */
export const PathTube: React.FC<{ pts: number[][]; progress: number; radius?: number; color?: string; opacity?: number; closed?: boolean; segs?: number }> = ({
  pts,
  progress,
  radius = 0.012,
  color = C.cobalt,
  opacity = 1,
  closed = false,
  segs = 200,
}) => {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), closed, "centripetal");
    return new THREE.TubeGeometry(curve, segs, radius, 8, closed);
  }, [pts, radius, closed, segs]);
  const total = geo.index ? geo.index.count : 0;
  geo.setDrawRange(0, Math.floor((total * Math.min(Math.max(progress, 0), 1)) / 6) * 6);
  if (progress <= 0) return null;
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
};

/** Arc between two surface points */
export const arcPts = (a: number[], b: number[], lift: number, n = 48) => {
  const out: number[][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = a[0] + (b[0] - a[0]) * t;
    const z = a[2] + (b[2] - a[2]) * t;
    const y = a[1] + (b[1] - a[1]) * t + Math.sin(Math.PI * t) * lift;
    out.push([x, y, z]);
  }
  return out;
};

/** Extruded site footprint (e.g. proposed campus) rising from terrain */
export const SiteBlock: React.FC<{ ring: [number, number][]; y: number; height: number; progress: number; color?: string; opacity?: number }> = ({
  ring,
  y,
  height,
  progress,
  color = C.coral,
  opacity = 0.75,
}) => {
  const geo = useMemo(() => {
    const s = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    return g;
  }, [ring]);
  if (progress <= 0) return null;
  return (
    <mesh geometry={geo} position={[0, y, 0]} scale={[1, Math.max(height * progress, 0.0001), 1]}>
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
};
