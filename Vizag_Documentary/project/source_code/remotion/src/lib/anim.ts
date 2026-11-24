import { interpolate } from "remotion";
import { EZ } from "./theme";

type EasingFn = (t: number) => number;
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Scalar keyframes: [[frame, value], ...] with one easing for every segment (or per-segment array). */
export const kf = (f: number, keys: [number, number][], ease: EasingFn | EasingFn[] = EZ.inOut): number => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, v0] = keys[i];
    const [f1, v1] = keys[i + 1];
    if (f <= f1) {
      const e = Array.isArray(ease) ? ease[Math.min(i, ease.length - 1)] : ease;
      const t = f1 === f0 ? 1 : e((f - f0) / (f1 - f0));
      return v0 + (v1 - v0) * t;
    }
  }
  return keys[keys.length - 1][1];
};

/** Vector keyframes */
export const kfv = (f: number, keys: [number, number[]][], ease: EasingFn | EasingFn[] = EZ.inOut): number[] => {
  const n = keys[0][1].length;
  return Array.from({ length: n }, (_, i) => kf(f, keys.map(([fr, v]) => [fr, v[i]] as [number, number]), ease));
};

/** 0→1 progress over [a,b] with easing */
export const prog = (f: number, a: number, b: number, ease: EasingFn = EZ.out) =>
  interpolate(f, [a, b], [0, 1], { ...clamp, easing: ease });

/** In-hold-out envelope */
export const env = (f: number, dur: number, fin = 12, fout = 12, ease: EasingFn = EZ.out) =>
  Math.min(prog(f, 0, fin, ease), 1 - prog(f, dur - fout, dur, EZ.in));

/** Deterministic pseudo random */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
