import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, continueRender, delayRender, Img, staticFile } from "remotion";
import plan from "./plan.json";
import { C, fontsReady } from "./lib/theme";
import { Shot, Move, Grade, Trans, transMask, TransEdge } from "./mg/Shot";
import { Overlay, OverlayView, TitleCard, BetCard, BetIndex, SplitCompare, Triptych, StatusFunnel, JobsIsotype, CapacityBars, DataGap, ResourceBars, Questions, CreditTimeline, PhoneZoom, EndCard, SourcesRoll, WindowFrame, Plate } from "./mg/Cards";
import { ChapterCard, QuoteBlock, DocCard, GridBG } from "./mg/Type";
import { Grain, Vignette } from "./mg/Finish";
import { SubseaScene } from "./three/Subsea";
import { DataCentreCampus, GigawattCubes } from "./three/DataCentre";
import { Bifurcation } from "./three/States";
import { CableMap } from "./three/CableMap";
import { SteelText, SteelCity, Runway3D } from "./three/Industry";
import * as P from "./scenes/Presets";
import { prog } from "./lib/anim";

export type Seg = {
  id: string;
  from: number; // frame
  dur: number; // frames (includes overlap into next segment's transition)
  kind: "stock" | "photo" | "mg";
  clip?: string;
  img?: string;
  move?: Move;
  grade?: Grade;
  inT?: Trans;
  inDur?: number;
  pos?: string;
  ov?: Overlay[];
  name?: string;
  props?: any;
};

const MG: Record<string, React.FC<any>> = {
  TitleCard, BetCard, BetIndex, SplitCompare, Triptych, StatusFunnel, JobsIsotype, CapacityBars, DataGap, ResourceBars, Questions, CreditTimeline, PhoneZoom, EndCard, SourcesRoll,
  ChapterCard: (p: any) => <ChapterCard {...p} bg={p.bgClip ? <Shot src={p.bgClip} kind={p.bgKind ?? "video"} dur={p.dur} move="push" grade="night" /> : undefined} />,
  SubseaScene, DataCentreCampus, GigawattCubes, Bifurcation, CableMap, SteelText, SteelCity, Runway3D,
  OpenVizag: P.OpenVizag, WhyVizagMap: P.WhyVizagMap, RouteHome: P.RouteHome, ThreeCapitals: P.ThreeCapitals, TwoRoles: P.TwoRoles, CityChoice: P.CityChoice,
  Migration: P.Migration, GoogleSites: P.GoogleSites, SteelSite: P.SteelSite, VERMap: P.VERMap, NorthAndhra: P.NorthAndhra, Finale: P.Finale, EnvMap: P.EnvMap,
  QuoteCard: (p: any) => (
    <AbsoluteFill>
      <Plate bg={p.bg} dim={0.62} />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 160px" }}>
        <QuoteBlock {...p} />
      </AbsoluteFill>
    </AbsoluteFill>
  ),
  DocScene: (p: any) => (
    <AbsoluteFill>
      {p.bg ? <Plate bg={p.bg} dim={0.55} /> : <GridBG dark={false} />}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <DocCard {...p} />
      </AbsoluteFill>
    </AbsoluteFill>
  ),
  WindowScene: (p: any) => (
    <WindowFrame dur={p.dur}>
      {p.shots.map((s: any, i: number) => (
        <Sequence key={i} from={s.from} durationInFrames={s.dur} layout="none">
          <AbsoluteFill>
            <Shot src={s.src} kind={s.kind ?? "video"} dur={s.dur} move="driftL" grade="natural" inT={i ? "fade" : "cut"} inDur={12} />
          </AbsoluteFill>
        </Sequence>
      ))}
    </WindowFrame>
  ),
};

const Segment: React.FC<{ s: Seg }> = ({ s }) => {
  const f = useCurrentFrame();
  if (s.kind === "mg") {
    const Comp = MG[s.name!];
    if (!Comp) return <AbsoluteFill style={{ background: C.charcoal }} />;
    const p = s.inT && s.inT !== "cut" ? prog(f, 0, s.inDur ?? 14) : 1;
    return (
      <AbsoluteFill style={{ ...transMask(s.inT ?? "cut", p) }}>
        <Comp dur={s.dur} {...s.props} />
        {(s.ov ?? []).map((o, i) => (
          <OverlayView key={i} o={o} dur={s.dur} />
        ))}
        <TransEdge t={s.inT ?? "cut"} p={p} />
      </AbsoluteFill>
    );
  }
  return (
    <Shot src={(s.kind === "photo" ? s.img : s.clip)!} kind={s.kind === "photo" ? "image" : "video"} dur={s.dur} move={s.move} grade={s.grade} inT={s.inT} inDur={s.inDur} objectPosition={s.pos}>
      {(s.ov ?? []).map((o, i) => (
        <OverlayView key={i} o={o} dur={s.dur} />
      ))}
    </Shot>
  );
};

export const Main: React.FC<{ start?: number }> = () => {
  const [h] = React.useState(() => delayRender("fonts"));
  React.useEffect(() => {
    fontsReady.then(() => continueRender(h));
  }, [h]);
  const segs = (plan as any).segments as Seg[];
  return (
    <AbsoluteFill style={{ background: C.charcoal }}>
      {segs.map((s) => (
        <Sequence key={s.id} from={s.from} durationInFrames={s.dur} premountFor={30} name={s.id}>
          <Segment s={s} />
        </Sequence>
      ))}
      <div style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" }}>
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <Img key={k} src={staticFile(`fx/grain_${k}.png`)} />
        ))}
      </div>
      <Vignette strength={0.42} />
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};
