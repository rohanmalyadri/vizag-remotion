import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate } from "remotion";
import { C, EZ, F } from "../lib/theme";
import { clamp, prog, rand } from "../lib/anim";
import { StatusTag } from "../three/TerrainStage";

/** Line that reveals upward from behind a mask (classic editorial reveal) */
export const MaskLine: React.FC<{ children: React.ReactNode; start: number; dur?: number; style?: React.CSSProperties; out?: number }> = ({ children, start, dur = 22, style, out }) => {
  const f = useCurrentFrame();
  const p = prog(f, start, start + dur, EZ.out);
  const o = out !== undefined ? prog(f, out, out + 14, EZ.in) : 0;
  return (
    <div style={{ overflow: "hidden", paddingBottom: "0.08em", ...style }}>
      <div style={{ transform: `translateY(${(1 - p) * 110 + o * -110}%)`, opacity: p > 0 ? 1 : 0 }}>{children}</div>
    </div>
  );
};

/** Per-character staggered reveal with slight overshoot */
export const CharReveal: React.FC<{ text: string; start: number; stagger?: number; style?: React.CSSProperties }> = ({ text, start, stagger = 1.2, style }) => {
  const f = useCurrentFrame();
  return (
    <span style={{ display: "inline-block", whiteSpace: "pre", ...style }}>
      {text.split("").map((ch, i) => {
        const p = prog(f, start + i * stagger, start + i * stagger + 16, EZ.over);
        return (
          <span key={i} style={{ display: "inline-block", opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 0.6}em)`, filter: `blur(${(1 - Math.min(p, 1)) * 6}px)` }}>
            {ch}
          </span>
        );
      })}
    </span>
  );
};

/** Blueprint frame lines that draw on (registration marks + rules) */
export const BlueprintFrame: React.FC<{ start?: number; color?: string; inset?: number }> = ({ start = 0, color = C.cobalt, inset = 60 }) => {
  const f = useCurrentFrame();
  const p = prog(f, start, start + 30, EZ.inOut);
  const W = 1920 - inset * 2, H = 1080 - inset * 2;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <g stroke={color} strokeWidth={1.2} fill="none" opacity={0.9}>
        <line x1={inset} y1={inset} x2={inset + W * p} y2={inset} />
        <line x1={inset + W} y1={inset + H} x2={inset + W - W * p} y2={inset + H} />
        <line x1={inset} y1={inset + H} x2={inset} y2={inset + H - H * p} />
        <line x1={inset + W} y1={inset} x2={inset + W} y2={inset + H * p} />
        {[[inset, inset], [inset + W, inset], [inset, inset + H], [inset + W, inset + H]].map(([x, y], i) => (
          <g key={i} opacity={p}>
            <line x1={x - 14} y1={y} x2={x + 14} y2={y} />
            <line x1={x} y1={y - 14} x2={x} y2={y + 14} />
            <circle cx={x} cy={y} r={5} />
          </g>
        ))}
      </g>
    </svg>
  );
};

/** Chapter card: mono index, display title by line, serif dek, blueprint rules */
export const ChapterCard: React.FC<{ index: string; title: string[]; dek?: string; bg?: React.ReactNode; dur: number }> = ({ index, title, dek, bg, dur }) => {
  const f = useCurrentFrame();
  const out = dur - 16;
  const fade = 1 - prog(f, out, dur, EZ.in);
  const rule = prog(f, 4, 34, EZ.inOut);
  return (
    <AbsoluteFill style={{ background: C.charcoal }}>
      {bg}
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(13,18,25,.92) 0%, rgba(13,18,25,.55) 55%, rgba(13,18,25,.2) 100%)" }} />
      <BlueprintFrame start={0} inset={54} />
      <AbsoluteFill style={{ padding: "0 150px", justifyContent: "center", opacity: fade }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 26 }}>
          <MaskLine start={6}>
            <span style={{ fontFamily: F.mono, fontSize: 26, color: C.cobalt, letterSpacing: 6, fontWeight: 700 }}>CHAPTER {index}</span>
          </MaskLine>
          <div style={{ height: 2, width: 420 * rule, background: C.cobalt }} />
        </div>
        {title.map((l, i) => (
          <MaskLine key={i} start={12 + i * 6} dur={26}>
            <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 136, lineHeight: 1.0, letterSpacing: -4, color: C.white }}>{l}</div>
          </MaskLine>
        ))}
        {dek ? (
          <MaskLine start={30} dur={26} style={{ marginTop: 34 }}>
            <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 40, color: C.silver, maxWidth: 1100 }}>{dek}</div>
          </MaskLine>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Big data number that counts up with unit + label + status tag + source line */
export const BigNumber: React.FC<{
  value: number; decimals?: number; prefix?: string; suffix?: string; label: string; sub?: string; status?: string; statusColor?: string;
  source?: string; start?: number; color?: string; align?: "left" | "center"; size?: number; dark?: boolean;
}> = ({ value, decimals = 0, prefix = "", suffix = "", label, sub, status, statusColor, source, start = 0, color = C.white, align = "left", size = 220, dark = false }) => {
  const f = useCurrentFrame() - start;
  const p = prog(f, 0, 40, EZ.out);
  const v = value * p;
  const txt = v.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <div style={{ textAlign: align }}>
      {status ? <div style={{ marginBottom: 18, opacity: prog(f, 18, 30) }}><StatusTag text={status} color={statusColor} /></div> : null}
      <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: size, lineHeight: 0.95, letterSpacing: -size * 0.04, color, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
        <span style={{ fontSize: size * 0.55, verticalAlign: "0.55em", fontWeight: 600, marginRight: 8, opacity: 0.9 }}>{prefix}</span>
        {txt}
        <span style={{ fontSize: size * 0.42, fontWeight: 600, marginLeft: 10 }}>{suffix}</span>
      </div>
      <MaskLine start={start + 12}>
        <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 40, color: dark ? C.charcoal : C.white, marginTop: 14, letterSpacing: 0.5 }}>{label}</div>
      </MaskLine>
      {sub ? (
        <MaskLine start={start + 18}>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 30, color: dark ? "#3A4656" : C.silver, marginTop: 6 }}>{sub}</div>
        </MaskLine>
      ) : null}
      {source ? <div style={{ fontFamily: F.mono, fontSize: 16, color: dark ? "#55606E" : C.grey, marginTop: 22, letterSpacing: 1, opacity: prog(f, 26, 40) }}>SOURCE · {source}</div> : null}
    </div>
  );
};

/** Editorial quote block (serif) with attribution + factual status tag */
export const QuoteBlock: React.FC<{ quote: string; who: string; role?: string; status?: string; statusColor?: string; start?: number; size?: number; dark?: boolean; photo?: string; width?: number }> = ({
  quote, who, role, status, statusColor, start = 0, size = 58, dark = false, photo, width = 1250,
}) => {
  const f = useCurrentFrame() - start;
  const words = quote.split(" ");
  const markP = prog(f, 0, 20, EZ.over);
  return (
    <div style={{ maxWidth: width, position: "relative" }}>
      <div style={{ fontFamily: F.serif, fontSize: size * 2.6, lineHeight: 0.6, color: statusColor ?? C.cobalt, transform: `scale(${markP})`, transformOrigin: "left bottom", height: size * 0.9 }}>“</div>
      <div style={{ fontFamily: F.serif, fontSize: size, lineHeight: 1.22, color: dark ? C.charcoal : C.white, fontWeight: 400 }}>
        {words.map((w, i) => {
          const p = prog(f, 6 + i * 1.6, 6 + i * 1.6 + 14, EZ.out);
          return (
            <span key={i} style={{ opacity: p, display: "inline-block", transform: `translateY(${(1 - p) * 14}px)`, marginRight: "0.26em" }}>
              {w}
            </span>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 34, opacity: prog(f, 10 + words.length * 1.6, 24 + words.length * 1.6) }}>
        {photo ? <Img src={staticFile(photo)} style={{ width: 74, height: 74, borderRadius: 37, objectFit: "cover", border: `2px solid ${C.white}` }} /> : null}
        <div style={{ width: 40, height: 2, background: dark ? C.charcoal : C.white }} />
        <div>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 26, color: dark ? C.charcoal : C.white, letterSpacing: 1 }}>{who}</div>
          {role ? <div style={{ fontFamily: F.mono, fontSize: 17, color: dark ? "#4A5563" : C.grey, marginTop: 2 }}>{role}</div> : null}
        </div>
        {status ? <StatusTag text={status} color={statusColor} style={{ marginLeft: 12 }} /> : null}
      </div>
    </div>
  );
};

/** Editorial document: paper card w/ headline, lines, and a highlighted key passage */
export const DocCard: React.FC<{ kicker: string; headline: string; body: string[]; highlight?: number; date?: string; source: string; start?: number; tilt?: number; width?: number }> = ({
  kicker, headline, body, highlight = -1, date, source, start = 0, tilt = -2, width = 980,
}) => {
  const f = useCurrentFrame() - start;
  const enter = prog(f, 0, 26, EZ.out);
  const hl = prog(f, 34, 60, EZ.inOut);
  return (
    <div
      style={{
        width,
        background: C.white,
        color: C.charcoal,
        padding: "54px 64px 46px",
        boxShadow: "0 40px 90px rgba(0,0,0,.45), 0 4px 14px rgba(0,0,0,.25)",
        transform: `perspective(1800px) rotateX(${(1 - enter) * 24}deg) rotateZ(${tilt * enter}deg) translateY(${(1 - enter) * 300}px)`,
        opacity: Math.min(1, enter * 2),
        position: "relative",
        backgroundImage: "repeating-linear-gradient(0deg, rgba(20,43,70,.035) 0 1px, transparent 1px 34px)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.mono, fontSize: 17, letterSpacing: 2, color: C.cobalt, fontWeight: 700 }}>
        <span>{kicker}</span>
        {date ? <span style={{ color: "#5B6676" }}>{date}</span> : null}
      </div>
      <div style={{ height: 2, background: C.charcoal, margin: "16px 0 26px" }} />
      <div style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 50, lineHeight: 1.12, letterSpacing: -0.5 }}>{headline}</div>
      <div style={{ marginTop: 26 }}>
        {body.map((b, i) => (
          <div key={i} style={{ fontFamily: F.serif, fontSize: 29, lineHeight: 1.45, color: "#2A3442", position: "relative", marginBottom: 6 }}>
            {i === highlight ? (
              <span style={{ backgroundImage: `linear-gradient(${C.yellow}, ${C.yellow})`, backgroundRepeat: "no-repeat", backgroundSize: `${hl * 100}% 88%`, backgroundPosition: "0 60%", padding: "0 2px" }}>{b}</span>
            ) : (
              b
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 26, fontFamily: F.mono, fontSize: 15, color: "#5B6676", letterSpacing: 1 }}>{source}</div>
    </div>
  );
};

/** Lower third for real people: photo + name + role + credit */
export const LowerThird: React.FC<{ name: string; role: string; photo?: string; credit?: string; start?: number; dur?: number; tag?: string; tagColor?: string; side?: "l" | "r" }> = ({
  name, role, photo, credit, start = 0, dur = 150, tag, tagColor, side = "l",
}) => {
  const f = useCurrentFrame() - start;
  const p = prog(f, 0, 22, EZ.out);
  const o = prog(f, dur - 14, dur, EZ.in);
  if (f < 0 || f > dur) return null;
  return (
    <div style={{ position: "absolute", [side === "l" ? "left" : "right"]: 110, bottom: 110, display: "flex", alignItems: "center", gap: 26, opacity: 1 - o, flexDirection: side === "l" ? "row" : "row-reverse" }}>
      {photo ? (
        <div style={{ width: 150, height: 150, borderRadius: 75, overflow: "hidden", border: `3px solid ${C.white}`, transform: `scale(${p})`, boxShadow: "0 10px 30px rgba(0,0,0,.5)" }}>
          <Img src={staticFile(photo)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 25%" }} />
        </div>
      ) : null}
      <div style={{ clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`, textAlign: side === "l" ? "left" : "right" }}>
        <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 46, color: C.white, letterSpacing: -0.5, textShadow: "0 2px 14px rgba(0,0,0,.6)" }}>{name}</div>
        <div style={{ fontFamily: F.mono, fontSize: 20, color: C.silver, letterSpacing: 1.5, marginTop: 4, textShadow: "0 2px 10px rgba(0,0,0,.6)" }}>{role}</div>
        {tag ? <div style={{ marginTop: 10 }}><StatusTag text={tag} color={tagColor} /></div> : null}
        {credit ? <div style={{ fontFamily: F.mono, fontSize: 12, color: C.grey, marginTop: 8, opacity: 0.8 }}>PHOTO · {credit}</div> : null}
      </div>
    </div>
  );
};

/** Animated survey grid background (paper or dark) */
export const GridBG: React.FC<{ dark?: boolean; drift?: number }> = ({ dark = true, drift = 0.3 }) => {
  const f = useCurrentFrame();
  const off = (f * drift) % 60;
  const col = dark ? "rgba(49,95,234,.13)" : "rgba(20,43,70,.08)";
  return (
    <AbsoluteFill
      style={{
        background: dark ? C.charcoal : C.white,
        backgroundImage: `linear-gradient(${col} 1px, transparent 1px), linear-gradient(90deg, ${col} 1px, transparent 1px), linear-gradient(${col.replace(".13", ".06").replace(".08", ".04")} 1px, transparent 1px), linear-gradient(90deg, ${col.replace(".13", ".06").replace(".08", ".04")} 1px, transparent 1px)`,
        backgroundSize: "120px 120px, 120px 120px, 30px 30px, 30px 30px",
        backgroundPosition: `${off}px ${off}px, ${off}px ${off}px, ${off}px ${off}px, ${off}px ${off}px`,
      }}
    />
  );
};

/** Kinetic headline across the frame, used over footage (sparingly) */
export const Headline: React.FC<{ lines: string[]; start?: number; size?: number; serifLine?: number; color?: string; align?: "left" | "center" }> = ({
  lines, start = 0, size = 96, serifLine = -1, color = C.white, align = "left",
}) => (
  <div style={{ textAlign: align }}>
    {lines.map((l, i) => (
      <MaskLine key={i} start={start + i * 7} dur={24}>
        <div
          style={{
            fontFamily: i === serifLine ? F.serif : F.display,
            fontStyle: i === serifLine ? "italic" : "normal",
            fontWeight: i === serifLine ? 400 : 800,
            fontSize: i === serifLine ? size * 0.78 : size,
            letterSpacing: i === serifLine ? 0 : -size * 0.03,
            lineHeight: 1.06,
            color,
            textShadow: "0 4px 30px rgba(0,0,0,.35)",
          }}
        >
          {l}
        </div>
      </MaskLine>
    ))}
  </div>
);

export const SourceLine: React.FC<{ text: string; start?: number; dark?: boolean; style?: React.CSSProperties }> = ({ text, start = 0, dark, style }) => {
  const f = useCurrentFrame() - start;
  return (
    <div style={{ position: "absolute", left: 110, bottom: 56, fontFamily: F.mono, fontSize: 16, letterSpacing: 1, color: dark ? "#55606E" : C.grey, opacity: prog(f, 0, 16), ...style }}>
      SOURCE · {text}
    </div>
  );
};

export const Noise: React.FC<{ seed: number }> = ({ seed }) => <span>{rand(seed)}</span>;
export { interpolate, clamp };
