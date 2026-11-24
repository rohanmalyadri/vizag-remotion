import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { CamRig, CamSpec, makeProjector, Pin, surf, TerrainLook, TerrainMesh, PathTube, useTexture } from "./Terrain";
import { Dem, PLACES, RegionName, useDem } from "../lib/geo";
import { C, F, EZ } from "../lib/theme";
import { prog } from "../lib/anim";

export type PinSpec = {
  place: string;
  at: number; // frame it appears
  out?: number; // frame it disappears
  color?: string;
  label?: string;
  sub?: string;
  height?: number;
  side?: "l" | "r";
  status?: string; // factual status tag
};

export type StageProps = {
  region: RegionName;
  sat?: boolean;
  stride?: number;
  look: (f: number) => TerrainLook;
  cam: (f: number) => CamSpec;
  pins?: PinSpec[];
  extra3d?: (f: number, dem: Dem, exag: number) => React.ReactNode;
  overlay?: (f: number, project: ReturnType<typeof makeProjector>, dem: Dem, exag: number) => React.ReactNode;
  bg?: string;
};

export const StatusTag: React.FC<{ text: string; color?: string; style?: React.CSSProperties }> = ({ text, color = C.yellow, style }) => (
  <span
    style={{
      fontFamily: F.mono,
      fontSize: 15,
      letterSpacing: 2,
      fontWeight: 700,
      color: C.charcoal,
      background: color,
      padding: "3px 8px 2px",
      borderRadius: 2,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {text}
  </span>
);

export const MapLabel: React.FC<{ x: number; y: number; p: number; label: string; sub?: string; side?: "l" | "r"; color?: string; status?: string }> = ({
  x,
  y,
  p,
  label,
  sub,
  side = "r",
  color = C.white,
  status,
}) => {
  if (p <= 0) return null;
  const dir = side === "r" ? 1 : -1;
  const lead = 46 * p;
  const tx = x + dir * (lead + 8);
  return (
    <>
      <svg style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, overflow: "visible" }}>
        <line x1={x} y1={y} x2={x + dir * lead} y2={y - lead * 0.55} stroke={color} strokeWidth={1.5} opacity={0.9} />
        <circle cx={x} cy={y} r={3.5} fill={color} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: side === "r" ? tx : undefined,
          right: side === "l" ? 1920 - tx : undefined,
          top: y - lead * 0.55 - 24,
          textAlign: side === "r" ? "left" : "right",
          clipPath: `inset(0 ${side === "r" ? (1 - p) * 100 : 0}% 0 ${side === "l" ? (1 - p) * 100 : 0}%)`,
        }}
      >
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 26, letterSpacing: 1.5, color, textTransform: "uppercase", whiteSpace: "nowrap", textShadow: "0 2px 12px rgba(0,0,0,.55)" }}>
          {label}
        </div>
        {sub ? (
          <div style={{ fontFamily: F.mono, fontSize: 16, color: C.silver, opacity: 0.85, marginTop: 2, whiteSpace: "nowrap", textShadow: "0 2px 10px rgba(0,0,0,.6)" }}>{sub}</div>
        ) : null}
        {status ? <div style={{ marginTop: 6 }}><StatusTag text={status} /></div> : null}
      </div>
    </>
  );
};

export const TerrainStage: React.FC<StageProps> = ({ region, sat = true, stride = 2, look, cam, pins = [], extra3d, overlay, bg = C.charcoal }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const dem = useDem(region);
  const tex = useTexture(sat ? `geo/${region}_s2.jpg` : null);
  if (!dem) return <AbsoluteFill style={{ background: bg }} />;
  const lk = look(frame);
  const cs = cam(frame);
  const project = makeProjector(cs, width, height);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #1B2533 0%, ${bg} 70%)` }}>
      <ThreeCanvas width={width} height={height} gl={{ antialias: true, preserveDrawingBuffer: true }} dpr={(globalThis as any).__GL_DPR ?? 0.8}>
        <CamRig cam={cs} />
        <TerrainMesh dem={dem} look={lk} stride={stride} tex={sat ? tex : null} />
        {pins.map((pn, i) => {
          const pl = PLACES[pn.place];
          if (!pl) return null;
          const p = prog(frame, pn.at, pn.at + 18, EZ.over) * (pn.out ? 1 - prog(frame, pn.out, pn.out + 12, EZ.in) : 1);
          const pulse = ((frame - pn.at) % 45) / 45;
          return <Pin key={i} p={surf(dem, pl.lon, pl.lat, lk.exag)} height={pn.height ?? 0.35} progress={p} color={pn.color ?? C.white} pulse={frame > pn.at ? pulse : 0} />;
        })}
        {extra3d ? extra3d(frame, dem, lk.exag) : null}
      </ThreeCanvas>
      {pins.map((pn, i) => {
        const pl = PLACES[pn.place];
        if (!pl) return null;
        const p = prog(frame, pn.at + 8, pn.at + 26, EZ.out) * (pn.out ? 1 - prog(frame, pn.out, pn.out + 10, EZ.in) : 1);
        const top = surf(dem, pl.lon, pl.lat, lk.exag, pn.height ?? 0.35);
        const s = project(top);
        if (!s.visible) return null;
        return <MapLabel key={i} x={s.x} y={s.y} p={p} label={pn.label ?? pn.place} sub={pn.sub} side={pn.side} color={pn.color ?? C.white} status={pn.status} />;
      })}
      {overlay ? overlay(frame, project, dem, lk.exag) : null}
    </AbsoluteFill>
  );
};

export { PathTube };
