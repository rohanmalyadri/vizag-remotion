import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { C, EZ, F } from "../lib/theme";
import { clamp, prog } from "../lib/anim";

export type Move = "push" | "pull" | "driftL" | "driftR" | "rise" | "sink" | "static" | "pushL" | "pushR";
export type Grade = "natural" | "cool" | "warm" | "desat" | "night" | "env" | "warn";
export type Trans = "cut" | "fade" | "wipe" | "wipeL" | "iris" | "scan" | "push" | "blur" | "slit" | "luma" | "flash";

const gradeFilter: Record<Grade, string> = {
  natural: "contrast(1.06) saturate(0.94) brightness(0.98)",
  cool: "contrast(1.08) saturate(0.82) brightness(0.95) hue-rotate(-4deg)",
  warm: "contrast(1.05) saturate(1.02) brightness(1.0) sepia(0.08)",
  desat: "contrast(1.1) saturate(0.45) brightness(0.92)",
  night: "contrast(1.12) saturate(0.85) brightness(0.88)",
  env: "contrast(1.04) saturate(1.05) brightness(1.0)",
  warn: "contrast(1.12) saturate(0.6) brightness(0.9)",
};
const gradeTint: Record<Grade, string> = {
  natural: "rgba(20,43,70,0.10)",
  cool: "rgba(20,43,70,0.22)",
  warm: "rgba(241,229,167,0.06)",
  desat: "rgba(21,27,36,0.25)",
  night: "rgba(20,43,70,0.30)",
  env: "rgba(36,139,145,0.10)",
  warn: "rgba(217,119,105,0.16)",
};

/** Camera move as transform (2.5D, subtle, never a generic zoom) */
const moveTf = (m: Move, t: number) => {
  switch (m) {
    case "push": return { scale: 1.04 + 0.07 * t, x: 0, y: 0 };
    case "pull": return { scale: 1.11 - 0.07 * t, x: 0, y: 0 };
    case "driftL": return { scale: 1.08, x: 30 - 60 * t, y: 0 };
    case "driftR": return { scale: 1.08, x: -30 + 60 * t, y: 0 };
    case "rise": return { scale: 1.08, x: 0, y: 22 - 44 * t };
    case "sink": return { scale: 1.08, x: 0, y: -22 + 44 * t };
    case "pushL": return { scale: 1.05 + 0.06 * t, x: 20 - 40 * t, y: 0 };
    case "pushR": return { scale: 1.05 + 0.06 * t, x: -20 + 40 * t, y: 0 };
    default: return { scale: 1.02, x: 0, y: 0 };
  }
};

/** Mask for incoming transition at progress p (0→1) */
export const transMask = (t: Trans, p: number, seed = 0): React.CSSProperties => {
  if (p >= 1 || t === "cut") return {};
  switch (t) {
    case "fade": return { opacity: p };
    case "wipe": {
      const x = -20 + p * 140; // diagonal
      return { clipPath: `polygon(0 0, ${x}% 0, ${x - 20}% 100%, 0 100%)` };
    }
    case "wipeL": {
      const x = 120 - p * 140;
      return { clipPath: `polygon(${x}% 0, 100% 0, 100% 100%, ${x + 20}% 100%)` };
    }
    case "iris": return { clipPath: `circle(${p * 75}% at 50% 50%)` };
    case "scan": return { clipPath: `inset(0 0 ${100 - p * 100}% 0)` };
    case "slit": return { clipPath: `inset(${50 - p * 50}% 0 ${50 - p * 50}% 0)` };
    case "push": return { transform: `translateX(${(1 - p) * 100}%)` };
    case "blur": return { opacity: p, filter: `blur(${(1 - p) * 24}px)`, transform: `scale(${1.08 - 0.08 * p})` };
    case "luma": return { opacity: Math.min(1, p * 1.4), filter: `brightness(${1 + (1 - p) * 1.8}) contrast(${1 + (1 - p)})` };
    case "flash": return { opacity: p < 0.25 ? 0 : 1, filter: `brightness(${1 + Math.max(0, 1 - p) * 3})` };
    default: return {};
  }
};

/** Decorative edge that rides on the transition boundary */
export const TransEdge: React.FC<{ t: Trans; p: number }> = ({ t, p }) => {
  if (p <= 0 || p >= 1) return null;
  if (t === "wipe" || t === "wipeL") {
    const x = t === "wipe" ? -20 + p * 140 : 120 - p * 140;
    const x2 = t === "wipe" ? x - 20 : x + 20;
    return (
      <svg style={{ position: "absolute", inset: 0 }} width={1920} height={1080} viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1={x} y1={0} x2={x2} y2={100} stroke={C.cobalt} strokeWidth={0.35} />
        <line x1={x + (t === "wipe" ? -1.2 : 1.2)} y1={0} x2={x2 + (t === "wipe" ? -1.2 : 1.2)} y2={100} stroke={C.white} strokeWidth={0.08} opacity={0.7} />
      </svg>
    );
  }
  if (t === "scan") {
    return <div style={{ position: "absolute", left: 0, right: 0, top: `${p * 100}%`, height: 2, background: C.cobalt, boxShadow: `0 0 24px ${C.cobalt}` }} />;
  }
  if (t === "iris") {
    const r = p * 75;
    return (
      <svg style={{ position: "absolute", inset: 0 }} width={1920} height={1080}>
        <circle cx={960} cy={540} r={(r / 100) * Math.hypot(1920, 1080) / Math.SQRT2} fill="none" stroke={C.white} strokeWidth={2} opacity={0.8} />
      </svg>
    );
  }
  return null;
};

export type ShotProps = {
  src: string; // public-relative path
  kind?: "video" | "image";
  trim?: number; // seconds into source
  dur: number; // frames
  move?: Move;
  grade?: Grade;
  inT?: Trans;
  inDur?: number;
  rate?: number;
  objectPosition?: string;
  children?: React.ReactNode;
};

export const Shot: React.FC<ShotProps> = ({ src, kind = "video", trim = 0, dur, move = "push", grade = "natural", inT = "cut", inDur = 14, rate = 1, objectPosition = "50% 50%", children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(f, [0, dur], [0, 1], clamp);
  const m = moveTf(move, EZ.soft(t));
  const p = inT === "cut" ? 1 : prog(f, 0, inDur, EZ.inOut);
  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition,
    transform: `translate(${m.x}px, ${m.y}px) scale(${m.scale})`,
    filter: gradeFilter[grade],
  };
  return (
    <AbsoluteFill style={{ overflow: "hidden", ...transMask(inT, p) }}>
      {kind === "video" ? (
        <OffthreadVideo src={staticFile(src)} muted startFrom={Math.round(trim * fps)} playbackRate={rate} style={style} />
      ) : (
        <Img src={staticFile(src)} style={style} />
      )}
      <AbsoluteFill style={{ background: gradeTint[grade], mixBlendMode: "multiply" }} />
      {children}
      <TransEdge t={inT} p={p} />
    </AbsoluteFill>
  );
};

/** Small credit line for licensed photos (CC BY / BY-SA attribution) */
export const Credit: React.FC<{ text: string; dark?: boolean }> = ({ text, dark }) => (
  <div style={{ position: "absolute", right: 28, bottom: 22, fontFamily: F.mono, fontSize: 13, color: dark ? C.charcoal : C.silver, opacity: 0.7, letterSpacing: 0.5, textShadow: dark ? "none" : "0 1px 6px rgba(0,0,0,.8)" }}>
    {text}
  </div>
);

/** Footage annotation: leader line + mono label (used sparingly) */
export const Callout: React.FC<{ x: number; y: number; dx?: number; dy?: number; label: string; sub?: string; start?: number; color?: string }> = ({
  x, y, dx = 120, dy = -80, label, sub, start = 0, color = C.white,
}) => {
  const f = useCurrentFrame() - start;
  const p = prog(f, 0, 18, EZ.out);
  const q = prog(f, 10, 28, EZ.out);
  if (p <= 0) return null;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <circle cx={x} cy={y} r={6 * p} fill="none" stroke={color} strokeWidth={2} />
        <circle cx={x} cy={y} r={2.5} fill={color} opacity={p} />
        <polyline points={`${x},${y} ${x + dx * p},${y + dy * p} ${x + dx * p + (dx > 0 ? 40 : -40) * q},${y + dy * p}`} fill="none" stroke={color} strokeWidth={1.5} />
      </svg>
      <div style={{ position: "absolute", left: dx > 0 ? x + dx + 50 : undefined, right: dx < 0 ? 1920 - (x + dx - 50) : undefined, top: y + dy - 22, opacity: q, textAlign: dx > 0 ? "left" : "right" }}>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24, color, letterSpacing: 1.5, textTransform: "uppercase", textShadow: "0 2px 12px rgba(0,0,0,.7)" }}>{label}</div>
        {sub ? <div style={{ fontFamily: F.mono, fontSize: 15, color: C.silver, textShadow: "0 2px 10px rgba(0,0,0,.8)" }}>{sub}</div> : null}
      </div>
    </AbsoluteFill>
  );
};
