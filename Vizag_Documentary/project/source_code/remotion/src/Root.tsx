import React from "react";
import { Composition } from "remotion";
import "./lib/theme";
import { Main } from "./Main";
import plan from "./plan.json";
import { TerrainTest } from "./scenes/TerrainTest";
import { SubseaScene } from "./three/Subsea";
import { DataCentreCampus, GigawattCubes } from "./three/DataCentre";
import { Bifurcation } from "./three/States";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Vizag" component={Main} durationInFrames={(plan as any).durationInFrames} fps={30} width={1920} height={1080} />
      <Composition id="SubseaTest" component={SubseaScene} defaultProps={{ dur: 900 }} durationInFrames={900} fps={30} width={1920} height={1080} />
      <Composition id="DCTest" component={DataCentreCampus} defaultProps={{ dur: 900 }} durationInFrames={900} fps={30} width={1920} height={1080} />
      <Composition id="GWTest" component={GigawattCubes} defaultProps={{ dur: 240 }} durationInFrames={240} fps={30} width={1920} height={1080} />
      <Composition id="BifTest" component={Bifurcation} defaultProps={{ dur: 600, marks: { split: 120, hyd: 60, coast: 300, amaravati: 420, vizag: 500 } }} durationInFrames={600} fps={30} width={1920} height={1080} />
      <Composition id="TerrainTest" component={TerrainTest} durationInFrames={240} fps={30} width={1920} height={1080} />
    </>
  );
};
