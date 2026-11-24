import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";

/** Film finish: pre-generated grain tiles cycled per frame (cheap) + vignette. Deterministic. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.06 }) => {
  const f = useCurrentFrame();
  const k = f % 6;
  const ox = (f * 137) % 512, oy = (f * 251) % 512;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "overlay",
        opacity,
        backgroundImage: `url(${staticFile(`fx/grain_${k}.png`)})`,
        backgroundPosition: `${ox}px ${oy}px`,
        backgroundSize: "512px 512px",
      }}
    />
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.55 }) => (
  <AbsoluteFill style={{ pointerEvents: "none", background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(5,8,12,${strength}) 100%)` }} />
);
