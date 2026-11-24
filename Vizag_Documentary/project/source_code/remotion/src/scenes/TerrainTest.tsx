import React from "react";
import { AbsoluteFill } from "remotion";
import { TerrainStage } from "../three/TerrainStage";
import { kf, kfv } from "../lib/anim";
import { C, EZ } from "../lib/theme";
import { Grain, Vignette } from "../mg/Finish";

export const TerrainTest: React.FC = () => (
  <AbsoluteFill>
    <TerrainStage
      region="vizag_metro"
      look={(f) => ({ exag: 2.6, satMix: kf(f, [[0, 1], [70, 1], [130, 0.0]]), contour: kf(f, [[60, 0], [140, 1]]), grid: kf(f, [[60, 0], [140, 1]]), reveal: 1 })}
      cam={(f) => {
        const pos = kfv(f, [[0, [3.6, 4.6, 7.2]], [240, [-1.6, 2.1, 4.6]]], EZ.inOut);
        const tgt = kfv(f, [[0, [0.2, 0, 1.0]], [240, [-0.5, 0.0, 1.6]]], EZ.inOut);
        return { pos, target: tgt, fov: 32 };
      }}
      pins={[
        { place: "Vizag Port", at: 90, label: "Natural Harbour", sub: "VISAKHAPATNAM PORT", color: C.white },
        { place: "Eastern Naval Command", at: 110, label: "Eastern Naval Command", sub: "INDIAN NAVY HQ", color: C.yellow, side: "r", height: 0.5 },
        { place: "Vizag Steel Plant", at: 130, label: "Steel Plant", sub: "RINL", color: C.white, side: "l" },
        { place: "HPCL Refinery", at: 150, label: "Refinery", sub: "HPCL", color: C.white, side: "l", height: 0.55 },
      ]}
    />
    <Vignette />
    <Grain />
  </AbsoluteFill>
);
