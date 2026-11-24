import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { C, EZ, F } from "../lib/theme";
import { kf, prog, rand } from "../lib/anim";
import { StatusTag } from "../three/TerrainStage";
import { BlueprintFrame, GridBG, MaskLine, BigNumber, QuoteBlock, Headline, DocCard, LowerThird } from "./Type";

/* ───────────── overlays that sit on top of real footage ───────────── */
export type Overlay =
  | { k: "number"; value: number; decimals?: number; prefix?: string; suffix?: string; label: string; sub?: string; status?: string; statusColor?: string; source?: string; at?: number; pos?: "left" | "right" | "center" }
  | { k: "quote"; quote: string; who: string; role?: string; status?: string; statusColor?: string; photo?: string; at?: number; size?: number; pos?: "left" | "center" }
  | { k: "headline"; lines: string[]; serifLine?: number; at?: number; pos?: "left" | "center" | "bottom"; size?: number }
  | { k: "tag"; text: string; color?: string; at?: number; pos?: "tl" | "tr" | "bl" | "br" }
  | { k: "callout"; x: number; y: number; dx?: number; dy?: number; label: string; sub?: string; at?: number }
  | { k: "lower"; name: string; role: string; photo?: string; credit?: string; tag?: string; tagColor?: string; at?: number; dur?: number; side?: "l" | "r" }
  | { k: "caption"; text: string; who?: string; at?: number }
  | { k: "place"; name: string; sub?: string; at?: number }
  | { k: "credit"; text: string }
  | { k: "strike"; items: string[]; at?: number[] }
  | { k: "doc"; kicker: string; headline: string; body: string[]; highlight?: number; date?: string; source: string; at?: number };

export const OverlayView: React.FC<{ o: Overlay; dur: number }> = ({ o, dur }) => {
  const f = useCurrentFrame();
  const rawAt = (o as any).at;
  const at = typeof rawAt === "number" && isFinite(rawAt) ? rawAt : 0;
  const fade = 1 - prog(f, dur - 10, dur, EZ.in);
  const shade = (side: "left" | "right" | "bottom" | "center") => (
    <AbsoluteFill
      style={{
        background:
          side === "left" ? "linear-gradient(90deg, rgba(13,18,25,.82) 0%, rgba(13,18,25,.45) 45%, rgba(13,18,25,0) 75%)"
          : side === "right" ? "linear-gradient(270deg, rgba(13,18,25,.82) 0%, rgba(13,18,25,.45) 45%, rgba(13,18,25,0) 75%)"
          : side === "bottom" ? "linear-gradient(0deg, rgba(13,18,25,.85) 0%, rgba(13,18,25,0) 50%)"
          : "radial-gradient(ellipse at 50% 50%, rgba(13,18,25,.7) 0%, rgba(13,18,25,.35) 70%)",
        opacity: prog(f, at - 6, at + 10) * fade,
      }}
    />
  );
  switch (o.k) {
    case "number": {
      const pos = o.pos ?? "left";
      return (
        <AbsoluteFill style={{ opacity: fade }}>
          {shade(pos === "center" ? "center" : pos)}
          <div style={{ position: "absolute", top: 0, bottom: 0, display: "flex", alignItems: "center", ...(pos === "right" ? { right: 130 } : pos === "center" ? { left: 0, right: 0, justifyContent: "center" } : { left: 130 }) }}>
            <BigNumber {...o} start={at} align={pos === "center" ? "center" : "left"} size={190} />
          </div>
        </AbsoluteFill>
      );
    }
    case "quote":
      return (
        <AbsoluteFill style={{ opacity: fade }}>
          <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(13,18,25,.93) 0%, rgba(13,18,25,.82) 50%, rgba(13,18,25,.45) 100%)", opacity: prog(f, at - 6, at + 10) }} />
          <div style={{ position: "absolute", left: o.pos === "center" ? 300 : 130, right: o.pos === "center" ? 300 : undefined, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
            <QuoteBlock quote={o.quote} who={o.who} role={o.role} status={o.status} statusColor={o.statusColor} photo={o.photo} start={at} size={o.size ?? 56} />
          </div>
        </AbsoluteFill>
      );
    case "headline":
      return (
        <AbsoluteFill style={{ opacity: fade }}>
          {shade(o.pos === "bottom" ? "bottom" : o.pos === "center" ? "center" : "left")}
          <div style={{ position: "absolute", left: o.pos === "center" ? 0 : 130, right: o.pos === "center" ? 0 : undefined, ...(o.pos === "bottom" ? { bottom: 120 } : { top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center" }) }}>
            <Headline lines={o.lines} start={at} serifLine={o.serifLine} size={o.size ?? 92} align={o.pos === "center" ? "center" : "left"} />
          </div>
        </AbsoluteFill>
      );
    case "tag": {
      const p = o.pos ?? "tl";
      return (
        <div style={{ position: "absolute", opacity: prog(f, at, at + 10) * fade, ...(p[0] === "t" ? { top: 70 } : { bottom: 70 }), ...(p[1] === "l" ? { left: 110 } : { right: 110 }) }}>
          <StatusTag text={o.text} color={o.color} />
        </div>
      );
    }
    case "callout": {
      const q = prog(f, at, at + 18);
      const dx = o.dx ?? 120, dy = o.dy ?? -80;
      return (
        <AbsoluteFill style={{ opacity: fade }}>
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            <circle cx={o.x} cy={o.y} r={7 * q} fill="none" stroke={C.white} strokeWidth={2} />
            <polyline points={`${o.x},${o.y} ${o.x + dx * q},${o.y + dy * q} ${o.x + dx * q + (dx > 0 ? 50 : -50) * q},${o.y + dy * q}`} fill="none" stroke={C.white} strokeWidth={1.6} />
          </svg>
          <div style={{ position: "absolute", left: dx > 0 ? o.x + dx + 62 : undefined, right: dx < 0 ? 1920 - (o.x + dx - 62) : undefined, top: o.y + dy - 24, opacity: prog(f, at + 10, at + 24), textAlign: dx > 0 ? "left" : "right" }}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 26, color: C.white, letterSpacing: 1.5, textTransform: "uppercase", textShadow: "0 2px 14px rgba(0,0,0,.8)" }}>{o.label}</div>
            {o.sub ? <div style={{ fontFamily: F.mono, fontSize: 16, color: C.silver, textShadow: "0 2px 10px rgba(0,0,0,.8)" }}>{o.sub}</div> : null}
          </div>
        </AbsoluteFill>
      );
    }
    case "lower":
      return <LowerThird {...o} start={at} dur={Math.min(o.dur ?? dur - at, dur - at)} />;
    case "caption":
      return (
        <AbsoluteFill style={{ opacity: fade }}>
          {shade("bottom")}
          <div style={{ position: "absolute", left: 160, right: 160, bottom: 96, textAlign: "center" }}>
            <MaskLine start={at} dur={20}>
              <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 50, color: C.white, lineHeight: 1.25, textShadow: "0 3px 20px rgba(0,0,0,.6)" }}>“{o.text}”</div>
            </MaskLine>
            {o.who ? <div style={{ fontFamily: F.mono, fontSize: 18, color: C.silver, marginTop: 14, letterSpacing: 2, opacity: prog(f, at + 12, at + 26) }}>{o.who}</div> : null}
          </div>
        </AbsoluteFill>
      );
    case "place":
      return (
        <div style={{ position: "absolute", left: 110, bottom: 92, opacity: fade }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, border: `2px solid ${C.white}`, transform: `scale(${prog(f, at, at + 12, EZ.over)})` }} />
            <MaskLine start={at + 4}>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: C.white, textTransform: "uppercase", textShadow: "0 2px 12px rgba(0,0,0,.7)" }}>{o.name}</div>
            </MaskLine>
          </div>
          {o.sub ? (
            <MaskLine start={at + 10} style={{ marginLeft: 26 }}>
              <div style={{ fontFamily: F.mono, fontSize: 17, color: C.silver, letterSpacing: 1.5, textShadow: "0 2px 10px rgba(0,0,0,.7)" }}>{o.sub}</div>
            </MaskLine>
          ) : null}
        </div>
      );
    case "credit":
      return <div style={{ position: "absolute", right: 28, bottom: 20, fontFamily: F.mono, fontSize: 13, color: C.silver, opacity: 0.75, textShadow: "0 1px 6px rgba(0,0,0,.9)" }}>{o.text}</div>;
    case "strike":
      return (
        <AbsoluteFill style={{ opacity: fade }}>
          {shade("center")}
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 18 }}>
            {o.items.map((it, i) => {
              const t = o.at?.[i] ?? i * 20;
              const p = prog(f, t, t + 14, EZ.out);
              const s = prog(f, t + 10, t + 22, EZ.inOut);
              return (
                <div key={i} style={{ position: "relative", opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
                  <span style={{ fontFamily: F.display, fontWeight: 800, fontSize: 104, color: C.white, letterSpacing: -3 }}>{it}</span>
                  <div style={{ position: "absolute", left: -10, top: "52%", height: 9, width: `calc(${s * 100}% + 20px)`, background: C.coral }} />
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      );
    case "doc":
      return (
        <AbsoluteFill style={{ opacity: fade }}>
          {shade("center")}
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
            <DocCard {...o} start={at} />
          </AbsoluteFill>
        </AbsoluteFill>
      );
  }
  return null;
};

/* ───────────── full-frame editorial cards ───────────── */
export const Plate: React.FC<{ bg?: string; dim?: number }> = ({ bg, dim = 0.72 }) => {
  const f = useCurrentFrame();
  if (!bg) return <GridBG />;
  const isImg = bg.startsWith("photos/");
  const st: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.06 + f * 0.00025})`, filter: "saturate(.75)" };
  return (
    <AbsoluteFill style={{ background: C.charcoal }}>
      {isImg ? <Img src={staticFile(bg)} style={st} /> : <OffthreadVideo src={staticFile(bg)} muted style={st} />}
      <AbsoluteFill style={{ background: `rgba(13,18,25,${dim})` }} />
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(49,95,234,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(49,95,234,.10) 1px, transparent 1px)", backgroundSize: "120px 120px" }} />
    </AbsoluteFill>
  );
};

/** Opening title: VIZAG / THE COASTLINE BLUEPRINT (sits over a terrain plate) */
export const TitleCard: React.FC<{ dur: number; words?: { t: string; at: number }[] }> = ({ dur, words = [] }) => {
  const f = useCurrentFrame();
  const out = 1 - prog(f, dur - 14, dur, EZ.in);
  const track = kf(f, [[0, 60], [dur, 18]], EZ.out);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(13,18,25,.25) 0%, rgba(13,18,25,.75) 75%)" }} />
      <BlueprintFrame start={2} inset={64} color={C.white} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
        <MaskLine start={6} dur={30}>
          <div style={{ fontFamily: F.display, fontWeight: 900, fontSize: 300, color: C.white, letterSpacing: track, lineHeight: 0.9, marginRight: -track }}>VIZAG</div>
        </MaskLine>
        <div style={{ display: "flex", alignItems: "center", gap: 26, marginTop: 30 }}>
          <div style={{ height: 2, width: 160 * prog(f, 20, 44, EZ.inOut), background: C.cobalt }} />
          <MaskLine start={22}>
            <div style={{ fontFamily: F.mono, fontSize: 34, color: C.white, letterSpacing: 14, fontWeight: 500 }}>THE COASTLINE BLUEPRINT</div>
          </MaskLine>
          <div style={{ height: 2, width: 160 * prog(f, 20, 44, EZ.inOut), background: C.cobalt }} />
        </div>
        <MaskLine start={36} style={{ marginTop: 26 }}>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 42, color: C.silver }}>Two futures. One city. A billion-dollar bet.</div>
        </MaskLine>
        <div style={{ display: "flex", gap: 18, marginTop: 52 }}>
          {words.map((w, i) => (
            <div key={i} style={{ opacity: prog(f, w.at, w.at + 10), transform: `translateY(${(1 - prog(f, w.at, w.at + 14, EZ.over)) * 20}px)` }}>
              <StatusTag text={w.t} color={i === words.length - 1 ? C.yellow : C.silver} />
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** "BET 0X" card with footage plate */
export const BetCard: React.FC<{ n: string; title: string; dek?: string; dur: number; bg?: string; bgKind?: "video" | "image" }> = ({ n, title, dek, dur, bg, bgKind = "video" }) => {
  const f = useCurrentFrame();
  const out = 1 - prog(f, dur - 10, dur, EZ.in);
  const sc = kf(f, [[0, 1.12], [dur, 1.0]], EZ.out);
  return (
    <AbsoluteFill style={{ background: C.charcoal, opacity: out }}>
      {bg ? (
        <AbsoluteFill style={{ transform: `scale(${sc})`, filter: "saturate(.6) brightness(.55)" }}>
          {bgKind === "video" ? <OffthreadVideo src={staticFile(bg)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Img src={staticFile(bg)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        </AbsoluteFill>
      ) : (
        <GridBG />
      )}
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(13,18,25,.9), rgba(13,18,25,.3))" }} />
      <BlueprintFrame inset={54} />
      <AbsoluteFill style={{ padding: "0 150px", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 30 }}>
          <MaskLine start={2}>
            <div style={{ fontFamily: F.mono, fontSize: 30, color: C.cobalt, letterSpacing: 8, fontWeight: 700 }}>BET</div>
          </MaskLine>
          <MaskLine start={4} dur={20}>
            <div style={{ fontFamily: F.display, fontWeight: 900, fontSize: 230, color: "transparent", WebkitTextStroke: `3px ${C.white}`, lineHeight: 0.9, letterSpacing: -8 }}>{n}</div>
          </MaskLine>
        </div>
        <MaskLine start={10} dur={24}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 120, color: C.white, letterSpacing: -4, lineHeight: 1 }}>{title}</div>
        </MaskLine>
        {dek ? (
          <MaskLine start={18} style={{ marginTop: 22 }}>
            <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 40, color: C.silver }}>{dek}</div>
          </MaskLine>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Five-bet index (table of contents) */
export const BetIndex: React.FC<{ bg?: string; dur: number; items: string[] }> = ({ bg, dur, items }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 1 - prog(f, dur - 10, dur, EZ.in) }}>
      <Plate bg={bg} />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 180px", gap: 8 }}>
        {items.map((it, i) => {
          const p = prog(f, i * 6, i * 6 + 18, EZ.out);
          return (
            <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 40, opacity: p, transform: `translateX(${(1 - p) * -60}px)`, borderBottom: `1px solid rgba(174,184,195,.25)`, paddingBottom: 12 }}>
              <div style={{ fontFamily: F.mono, fontSize: 30, color: C.cobalt, fontWeight: 700, width: 70 }}>0{i + 1}</div>
              <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 82, color: C.white, letterSpacing: -2 }}>{it}</div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Two-column comparison (balanced: identical styling both sides) */
export const SplitCompare: React.FC<{
  dur: number; left: { kicker: string; title: string; body?: string; img?: string; video?: string; tag?: string; tagColor?: string }; right: { kicker: string; title: string; body?: string; img?: string; video?: string; tag?: string; tagColor?: string }; mid?: string; rightAt?: number;
}> = ({ dur, left, right, mid, rightAt = 12 }) => {
  const f = useCurrentFrame();
  const fade = 1 - prog(f, dur - 10, dur, EZ.in);
  const panel = (s: typeof left, at: number, side: "l" | "r") => {
    const p = prog(f, at, at + 22, EZ.out);
    return (
      <div style={{ position: "absolute", top: 0, bottom: 0, [side === "l" ? "left" : "right"]: 0, width: "50%", overflow: "hidden", clipPath: `inset(0 ${side === "l" ? (1 - p) * 100 : 0}% 0 ${side === "r" ? (1 - p) * 100 : 0}%)` }}>
        {s.video ? <OffthreadVideo src={staticFile(s.video)} muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.08 - 0.05 * prog(f, 0, dur)})`, filter: "saturate(.85) brightness(.75)" }} /> : null}
        {s.img ? <Img src={staticFile(s.img)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.08 - 0.05 * prog(f, 0, dur)})`, filter: "saturate(.85) brightness(.75)" }} /> : null}
        {!s.video && !s.img ? <GridBG /> : null}
        <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(13,18,25,.92) 0%, rgba(13,18,25,.2) 60%)" }} />
        <div style={{ position: "absolute", left: 80, right: 80, bottom: 110 }}>
          <MaskLine start={at + 8}>
            <div style={{ fontFamily: F.mono, fontSize: 20, letterSpacing: 4, color: C.silver, fontWeight: 700 }}>{s.kicker}</div>
          </MaskLine>
          <MaskLine start={at + 12} dur={24}>
            <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 74, color: C.white, letterSpacing: -2, lineHeight: 1.02, marginTop: 8 }}>{s.title}</div>
          </MaskLine>
          {s.body ? (
            <MaskLine start={at + 18}>
              <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 32, color: C.silver, marginTop: 12 }}>{s.body}</div>
            </MaskLine>
          ) : null}
          {s.tag ? <div style={{ marginTop: 16, opacity: prog(f, at + 22, at + 32) }}><StatusTag text={s.tag} color={s.tagColor} /></div> : null}
        </div>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ background: C.charcoal, opacity: fade }}>
      {panel(left, 0, "l")}
      {panel(right, rightAt, "r")}
      <div style={{ position: "absolute", left: 959, top: 0, width: 2, height: `${prog(f, 4, 30, EZ.inOut) * 100}%`, background: C.white }} />
      {mid ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 80, textAlign: "center", opacity: prog(f, 20, 34) }}>
          <span style={{ fontFamily: F.mono, fontSize: 22, letterSpacing: 6, color: C.charcoal, background: C.white, padding: "8px 18px", fontWeight: 700 }}>{mid}</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Three stock panels side by side with labels (e.g. Hyderabad · Bengaluru · America) */
export const Triptych: React.FC<{ dur: number; panels: { video?: string; img?: string; label: string; at: number }[] }> = ({ dur, panels }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.charcoal, opacity: 1 - prog(f, dur - 8, dur, EZ.in) }}>
      {panels.map((p, i) => {
        const q = prog(f, p.at, p.at + 18, EZ.out);
        return (
          <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: `${(i * 100) / 3}%`, width: `${100 / 3}%`, overflow: "hidden", clipPath: `inset(${(1 - q) * 100}% 0 0 0)`, borderRight: i < 2 ? `2px solid ${C.charcoal}` : undefined }}>
            {p.video ? <OffthreadVideo src={staticFile(p.video)} muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.15 - 0.08 * prog(f, 0, dur)})` }} /> : <Img src={staticFile(p.img!)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(13,18,25,.85), rgba(13,18,25,0) 45%)" }} />
            <div style={{ position: "absolute", left: 40, bottom: 70 }}>
              <MaskLine start={p.at + 8}>
                <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 64, color: C.white, letterSpacing: -1 }}>{p.label}</div>
              </MaskLine>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Investment-status funnel: MoU → Approved → Under construction → Operational */
export const StatusFunnel: React.FC<{ bg?: string; dur: number; title?: string }> = ({ bg, dur, title = "A SIGNED MoU IS NOT MONEY SPENT" }) => {
  const f = useCurrentFrame();
  const stages = [
    { t: "MoU SIGNED", d: "a promise to invest", w: 1.0, c: C.grey },
    { t: "APPROVED", d: "land, permits, clearances", w: 0.85, c: C.silver },
    { t: "UNDER CONSTRUCTION", d: "money actually being spent", w: 0.7, c: C.yellow },
    { t: "OPERATIONAL", d: "jobs, output, revenue", w: 0.55, c: C.teal },
  ];
  return (
    <AbsoluteFill style={{ opacity: 1 - prog(f, dur - 10, dur, EZ.in) }}>
      <Plate bg={bg} />
      <div style={{ position: "absolute", left: 130, top: 110 }}>
        <MaskLine start={0}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 70, color: C.white, letterSpacing: -2 }}>{title}</div>
        </MaskLine>
      </div>
      {stages.map((s, i) => {
        const p = prog(f, 14 + i * 12, 34 + i * 12, EZ.out);
        const W = 1180 * s.w;
        const x0 = 130 + (1180 - W) / 2;
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: x0, top: 290 + i * 165, width: W * p, height: 118, background: i === 0 ? "rgba(174,184,195,.18)" : "rgba(49,95,234,.16)", border: `2px solid ${s.c}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxSizing: "border-box" }}>
              <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: s.c, letterSpacing: 3, whiteSpace: "nowrap" }}>{s.t}</div>
            </div>
            <div style={{ position: "absolute", left: 1370, top: 290 + i * 165 + 38, fontFamily: F.serif, fontStyle: "italic", fontSize: 34, color: C.silver, whiteSpace: "nowrap", opacity: prog(f, 30 + i * 12, 44 + i * 12) }}>{s.d}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Isotype: each dot = 100 jobs. Construction (company estimate) vs permanent ("hundreds") */
export const JobsIsotype: React.FC<{ bg?: string; dur: number; showPermanentAt: number }> = ({ bg, dur, showPermanentAt }) => {
  const f = useCurrentFrame();
  const cons = 42; // 4,200 / 100
  const dot = (i: number, n: number, x0: number, color: string, start: number, ghost = false) => {
    const col = i % 6, row = Math.floor(i / 6);
    const p = prog(f, start + i * 0.8, start + i * 0.8 + 12, EZ.over);
    return <circle key={x0 + "_" + i} cx={x0 + col * 46} cy={(x0 > 1000 ? 380 : 300) + row * 46} r={16 * p} fill={ghost ? "none" : color} stroke={color} strokeWidth={ghost ? 2 : 0} strokeDasharray={ghost ? "4 4" : undefined} />;
  };
  return (
    <AbsoluteFill style={{ opacity: 1 - prog(f, dur - 10, dur, EZ.in) }}>
      <Plate bg={bg} />
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        {Array.from({ length: cons }).map((_, i) => dot(i, cons, 250, C.yellow, 10))}
        {Array.from({ length: 9 }).map((_, i) => dot(i, 9, 1150, C.teal, showPermanentAt, i >= 2))}
      </svg>
      <div style={{ position: "absolute", left: 240, top: 150 }}>
        <div style={{ fontFamily: F.mono, fontSize: 20, color: C.yellow, letterSpacing: 3, fontWeight: 700 }}>DURING CONSTRUCTION</div>
        <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 64, color: C.white }}>~4,200 jobs</div>
      </div>
      <div style={{ position: "absolute", left: 1140, top: 150, opacity: prog(f, showPermanentAt, showPermanentAt + 16) }}>
        <div style={{ fontFamily: F.mono, fontSize: 20, color: C.teal, letterSpacing: 3, fontWeight: 700 }}>PERMANENT, ONCE OPERATIONAL (2028)</div>
        <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 64, color: C.white }}>“Hundreds”</div>
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 28, color: C.silver, marginTop: 6 }}>exact number not disclosed — range shown</div>
      </div>
      <div style={{ position: "absolute", left: 240, bottom: 150, display: "flex", gap: 30, alignItems: "center", opacity: prog(f, 30, 44) }}>
        <svg width={40} height={40}><circle cx={20} cy={20} r={16} fill={C.silver} /></svg>
        <div style={{ fontFamily: F.mono, fontSize: 22, color: C.silver, letterSpacing: 2 }}>EACH DOT = 100 JOBS</div>
        <StatusTag text="COMPANY ESTIMATES · GOOGLE" />
      </div>
    </AbsoluteFill>
  );
};

/** Horizontal capacity bars with a claimed total vs. reported figures */
export const CapacityBars: React.FC<{ bg?: string; dur: number }> = ({ bg, dur }) => {
  const f = useCurrentFrame();
  const rows = [
    { l: "Google AI hub (with AdaniConneX, Airtel)", v: 1, tag: "ANNOUNCED", at: 6 },
    { l: "Digital Connexion (Reliance · Brookfield · Digital Realty)", v: 1, tag: "MoU", at: 16 },
  ];
  const scale = 140;
  return (
    <AbsoluteFill style={{ opacity: 1 - prog(f, dur - 10, dur, EZ.in) }}>
      <Plate bg={bg} />
      <div style={{ position: "absolute", left: 130, top: 110 }}>
        <div style={{ fontFamily: F.mono, fontSize: 20, color: C.cobalt, letterSpacing: 4, fontWeight: 700 }}>DATA-CENTRE CAPACITY AROUND VIZAG · GIGAWATTS</div>
      </div>
      {rows.map((r, i) => {
        const p = prog(f, r.at, r.at + 24, EZ.out);
        return (
          <div key={i} style={{ position: "absolute", left: 130, top: 230 + i * 150 }}>
            <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 34, color: C.white, opacity: p }}>{r.l}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 12 }}>
              <div style={{ height: 46, width: r.v * scale * p, background: C.cobalt }} />
              <div style={{ fontFamily: F.mono, fontSize: 30, color: C.white, opacity: p }}>{r.v} GW</div>
              <StatusTag text={r.tag} />
            </div>
          </div>
        );
      })}
      {(() => {
        const p = prog(f, 40, 80, EZ.inOut);
        return (
          <div style={{ position: "absolute", left: 130, top: 560 }}>
            <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 34, color: C.white, opacity: prog(f, 36, 50) }}>All agreements combined — as claimed by the state government</div>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 12 }}>
              <div style={{ height: 46, width: 9 * scale * p, border: `2px dashed ${C.yellow}`, boxSizing: "border-box" }} />
              <div style={{ fontFamily: F.mono, fontSize: 30, color: C.yellow, opacity: prog(f, 70, 84) }}>~9 GW</div>
              <span style={{ opacity: prog(f, 74, 88) }}><StatusTag text="CLAIM" /></span>
            </div>
            <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 28, color: C.silver, marginTop: 22, maxWidth: 1400, opacity: prog(f, 90, 110) }}>
              Fact-check: state figures published in 2026 put signed agreements at about 6–6.5 GW. Most of this capacity exists only on paper so far.
            </div>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};

/** ~20% of data vs ~3% of capacity */
export const DataGap: React.FC<{ bg?: string; dur: number }> = ({ bg, dur }) => {
  const f = useCurrentFrame();
  const a = prog(f, 6, 40, EZ.out), b = prog(f, 40, 74, EZ.out);
  const R = 300;
  return (
    <AbsoluteFill style={{ opacity: 1 - prog(f, dur - 10, dur, EZ.in) }}>
      <Plate bg={bg} />
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        {[[560, a, 0.2, C.yellow], [1360, b, 0.03, C.cobalt]].map(([cx, p, share, col], i) => (
          <g key={i}>
            <circle cx={cx as number} cy={520} r={R} fill="none" stroke="rgba(174,184,195,.3)" strokeWidth={2} />
            <circle cx={cx as number} cy={520} r={R - 30} fill="none" stroke={col as string} strokeWidth={60} strokeDasharray={`${2 * Math.PI * (R - 30) * (share as number) * (p as number)} ${2 * Math.PI * (R - 30)}`} transform={`rotate(-90 ${cx} 520)`} />
          </g>
        ))}
      </svg>
      {[
        { x: 560, n: "~20%", l: "of the world's data comes from India", p: a, c: C.yellow },
        { x: 1360, n: "~3%", l: "of global data-centre capacity is in India", p: b, c: C.cobalt },
      ].map((d, i) => (
        <div key={i} style={{ position: "absolute", left: d.x - 260, width: 520, top: 430, textAlign: "center", opacity: d.p }}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 130, color: C.white, letterSpacing: -4 }}>{d.n}</div>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 30, color: C.silver, marginTop: 4 }}>{d.l}</div>
        </div>
      ))}
      <div style={{ position: "absolute", left: 130, bottom: 70, fontFamily: F.mono, fontSize: 16, color: C.grey, letterSpacing: 1, opacity: prog(f, 70, 90) }}>
        SOURCE · DELOITTE (2025), KPMG (2026) INDUSTRY ESTIMATES · CAPACITY-SHARE ESTIMATES RANGE ROUGHLY 1–4%
      </div>
      <div style={{ position: "absolute", right: 130, top: 90, opacity: prog(f, 80, 96) }}>
        <StatusTag text="ESTIMATES" />
      </div>
    </AbsoluteFill>
  );
};

/** Data centres: resources up, people down (qualitative, no invented numbers) */
export const ResourceBars: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const items = [
    { l: "LAND", up: true, c: C.yellow },
    { l: "POWER", up: true, c: C.yellow },
    { l: "WATER", up: true, c: C.teal },
    { l: "PEOPLE", up: false, c: C.coral },
  ];
  return (
    <AbsoluteFill style={{ opacity: 1 - prog(f, dur - 10, dur, EZ.in) }}>
      <GridBG />
      <div style={{ position: "absolute", left: 130, top: 100 }}>
        <div style={{ fontFamily: F.mono, fontSize: 20, color: C.cobalt, letterSpacing: 4, fontWeight: 700 }}>WHAT A HYPERSCALE DATA CENTRE NEEDS</div>
      </div>
      {items.map((it, i) => {
        const p = prog(f, 8 + i * 10, 34 + i * 10, EZ.over);
        const h = it.up ? 520 : 90;
        return (
          <div key={i} style={{ position: "absolute", left: 300 + i * 360, bottom: 200, width: 200, textAlign: "center" }}>
            <div style={{ height: h * p, background: it.c, opacity: 0.9, margin: "0 auto", width: 140 }} />
            <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 46, color: C.white, marginTop: 20 }}>{it.l}</div>
            <div style={{ fontFamily: F.mono, fontSize: 22, color: it.c, marginTop: 6 }}>{it.up ? "A LOT" : "FEW"}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 130, bottom: 70, fontFamily: F.serif, fontStyle: "italic", fontSize: 28, color: C.silver, opacity: prog(f, 50, 70) }}>Illustrative comparison — capital-intensive, not labour-intensive.</div>
    </AbsoluteFill>
  );
};

/** Final three questions */
export const Questions: React.FC<{ bg?: string; dur: number; qs: { q: string; at: number }[] }> = ({ bg, dur, qs }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 1 - prog(f, dur - 12, dur, EZ.in) }}>
      <Plate bg={bg} />
      <div style={{ position: "absolute", left: 150, top: 110 }}>
        <MaskLine start={0}>
          <div style={{ fontFamily: F.mono, fontSize: 24, color: C.yellow, letterSpacing: 6, fontWeight: 700 }}>THREE QUESTIONS FOR YOU</div>
        </MaskLine>
      </div>
      {qs.map((q, i) => {
        const p = prog(f, q.at, q.at + 20, EZ.out);
        const dim = qs.findIndex((x) => f < x.at) - 1;
        const active = dim === -2 ? qs.length - 1 : dim;
        return (
          <div key={i} style={{ position: "absolute", left: 150, right: 150, top: 230 + i * 230, opacity: p * (i === active ? 1 : 0.45), transform: `translateX(${(1 - p) * 60}px)`, display: "flex", gap: 46 }}>
            <div style={{ fontFamily: F.display, fontWeight: 900, fontSize: 120, color: "transparent", WebkitTextStroke: `2px ${i === active ? C.yellow : C.grey}`, lineHeight: 1 }}>{i + 1}</div>
            <div style={{ fontFamily: F.serif, fontSize: 56, color: C.white, lineHeight: 1.2, paddingTop: 10 }}>{q.q}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Two-track neutral political timeline */
export type TrackEvent = { date: string; text: string; tag: string; tagColor?: string; at: number; x: number };
export const CreditTimeline: React.FC<{ dur: number; top: { name: string; photo?: string; events: TrackEvent[] }; bottom: { name: string; photo?: string; events: TrackEvent[] }; mergeAt?: number }> = ({ dur, top, bottom, mergeAt }) => {
  const f = useCurrentFrame();
  const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const X = (y: number) => 260 + ((y - 2019) / 7.6) * 1500;
  const axisP = prog(f, 0, 30, EZ.inOut);
  const merge = mergeAt !== undefined ? prog(f, mergeAt, mergeAt + 30, EZ.inOut) : 0;
  const trackY = [330, 740];
  const ev = (e: TrackEvent, y: number, up: boolean, row = 0) => {
    const p = prog(f, e.at, e.at + 18, EZ.out);
    if (p <= 0) return null;
    const x = X(e.x);
    const off = row * 118;
    return (
      <div key={e.date + e.text} style={{ position: "absolute", left: x - 125, width: 250, top: up ? y - 150 - off : y + 34 + off, opacity: p * (1 - merge * 0.6), transform: `translateY(${(1 - p) * (up ? 20 : -20)}px)` }}>
        <div style={{ fontFamily: F.mono, fontSize: 19, color: C.yellow, fontWeight: 700 }}>{e.date}</div>
        <div style={{ fontFamily: F.display, fontSize: 22, color: C.white, lineHeight: 1.25, marginTop: 4, fontWeight: 500 }}>{e.text}</div>
        <div style={{ marginTop: 8 }}><StatusTag text={e.tag} color={e.tagColor ?? C.silver} /></div>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ opacity: 1 - prog(f, dur - 10, dur, EZ.in) }}>
      <GridBG />
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        {trackY.map((y, i) => (
          <line key={i} x1={260} x2={260 + 1500 * axisP} y1={y + (540 - y) * merge} y2={y + (540 - y) * merge} stroke={C.white} strokeWidth={2} opacity={0.7} />
        ))}
        {years.map((y) => (
          <g key={y} opacity={axisP}>
            <line x1={X(y)} x2={X(y)} y1={500} y2={580} stroke={C.grey} strokeWidth={1} opacity={0.5} />
            <text x={X(y)} y={540 + 8} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={22} fill={C.grey}>{y}</text>
          </g>
        ))}
        {[...top.events.map((e) => [e, trackY[0]] as const), ...bottom.events.map((e) => [e, trackY[1]] as const)].map(([e, y], i) => {
          const p = prog(f, e.at, e.at + 14, EZ.over);
          return <circle key={i} cx={X(e.x)} cy={y + (540 - y) * merge} r={9 * p} fill={C.white} />;
        })}
        {merge > 0 ? <rect x={X(2019)} y={520} width={(X(2026.4) - X(2019)) * merge} height={40} fill="none" stroke={C.yellow} strokeWidth={3} /> : null}
      </svg>
      {[top, bottom].map((t, i) => (
        <div key={i} style={{ position: "absolute", left: 70, top: trackY[i] - 40, display: "flex", alignItems: "center", gap: 14, opacity: prog(f, 4, 18) * (1 - merge) }}>
          {t.photo ? <Img src={staticFile(t.photo)} style={{ width: 64, height: 64, borderRadius: 32, objectFit: "cover", border: `2px solid ${C.white}` }} /> : null}
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 24, color: C.white, letterSpacing: 2, width: 110 }}>{t.name}</div>
        </div>
      ))}
      {[...top.events].sort((a, b) => a.x - b.x).map((e, i) => ev(e, trackY[0], true, i % 2))}
      {[...bottom.events].sort((a, b) => a.x - b.x).map((e, i) => ev(e, trackY[1], false, i % 2))}
      {merge > 0.5 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 620, textAlign: "center", opacity: prog(f, (mergeAt ?? 0) + 20, (mergeAt ?? 0) + 40) }}>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 46, color: C.white }}>2019 → 2026: both governments shaped this project.</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Phone UI → zoom-through transition into the network (generic app tiles, no logos) */
export const PhoneZoom: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const zoom = kf(f, [[0, 1], [dur * 0.55, 1.15], [dur, 14]], [EZ.out, EZ.in]);
  const apps = ["VIDEO", "MESSAGES", "AI ASSISTANT", "MAPS", "PAYMENTS", "CLOUD"];
  const packets = Array.from({ length: 40 });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #1C2737 0%, #0D1219 70%)", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "50% 46%", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: 400, height: 820, borderRadius: 60, background: "#0B0F15", border: `3px solid ${C.grey}`, boxShadow: "0 40px 120px rgba(0,0,0,.6)", padding: 26, boxSizing: "border-box", position: "relative" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 40, background: "linear-gradient(160deg, #142B46, #151B24)", padding: 30, boxSizing: "border-box", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, alignContent: "start" }}>
            {apps.map((a, i) => {
              const p = prog(f, 4 + i * 3, 16 + i * 3, EZ.over);
              return (
                <div key={i} style={{ height: 130, borderRadius: 26, background: i % 3 === 0 ? C.cobalt : i % 3 === 1 ? C.teal : "#2A3646", transform: `scale(${p})`, display: "flex", alignItems: "flex-end", padding: 14, boxSizing: "border-box" }}>
                  <span style={{ fontFamily: F.mono, fontSize: 14, color: C.white, fontWeight: 700, letterSpacing: 1 }}>{a}</span>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute", opacity: prog(f, dur * 0.35, dur * 0.6) }}>
        {packets.map((_, i) => {
          const y = 120 + rand(i) * 840;
          const t = ((f * (6 + rand(i + 9) * 10) + rand(i + 3) * 1920) % 2200) - 140;
          return <rect key={i} x={t} y={y} width={60 + rand(i + 5) * 120} height={3} fill={i % 4 === 0 ? C.yellow : C.cobalt} opacity={0.8} />;
        })}
      </svg>
      <div style={{ position: "absolute", left: 130, bottom: 120, opacity: prog(f, 10, 24) * (1 - prog(f, dur * 0.6, dur * 0.75)) }}>
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 44, color: C.white, maxWidth: 700 }}>Every video, message and AI answer on your phone…</div>
      </div>
      <AbsoluteFill style={{ background: C.white, opacity: kf(f, [[dur - 6, 0], [dur, 0.9]]) }} />
    </AbsoluteFill>
  );
};

/** End slate: verdict + sources */
export const EndCard: React.FC<{ bg?: string; dur: number }> = ({ bg, dur }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 1 - prog(f, dur - 20, dur, EZ.in) }}>
      <Plate bg={bg} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
        <MaskLine start={0}>
          <div style={{ fontFamily: F.display, fontWeight: 900, fontSize: 150, color: C.white, letterSpacing: -5 }}>Your verdict?</div>
        </MaskLine>
        <MaskLine start={10} style={{ marginTop: 20 }}>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 44, color: C.silver }}>Tell us in the comments — and share this with North Andhra.</div>
        </MaskLine>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Credits / sources roll */
export const SourcesRoll: React.FC<{ dur: number; lines: string[] }> = ({ dur, lines }) => {
  const f = useCurrentFrame();
  const y = kf(f, [[0, 1080], [dur, -lines.length * 34 - 200]], EZ.lin);
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center" }}>
        <div style={{ fontFamily: F.mono, fontSize: 22, color: C.cobalt, letterSpacing: 6, fontWeight: 700, marginBottom: 30 }}>SOURCES · LICENCES · CREDITS</div>
        {lines.map((l, i) => (
          <div key={i} style={{ fontFamily: F.mono, fontSize: 18, color: C.silver, lineHeight: "34px" }}>{l}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** Bus-window frame: footage seen through a window with reflections and rain-light */
export const WindowFrame: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  const bob = Math.sin(f * 0.35) * 2.5 + Math.sin(f * 0.13) * 3;
  return (
    <AbsoluteFill style={{ background: "#07090C", opacity: 1 - prog(f, dur - 10, dur, EZ.in) }}>
      <div style={{ position: "absolute", left: 150, top: 110 + bob, width: 1620, height: 830, borderRadius: 70, overflow: "hidden", boxShadow: "inset 0 0 120px rgba(0,0,0,.8)" }}>
        {children}
        <AbsoluteFill style={{ background: "linear-gradient(115deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,.06) 55%, rgba(255,255,255,0) 70%)" }} />
        <AbsoluteFill style={{ boxShadow: "inset 0 0 160px rgba(0,0,0,.75)" }} />
      </div>
      <div style={{ position: "absolute", left: 150, top: 110 + bob, width: 1620, height: 830, borderRadius: 70, border: "26px solid #11161D", boxSizing: "border-box" }} />
      <div style={{ position: "absolute", left: 958, top: 110 + bob, width: 6, height: 830, background: "#11161D" }} />
    </AbsoluteFill>
  );
};

export { Headline, QuoteBlock, BigNumber, DocCard };
