import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import regionsJson from "./regions.json";

export type RegionName = "vizag_metro" | "north_andhra" | "ap_telangana" | "bay_bengal";
export type RegionMeta = {
  bbox: [number, number, number, number]; // s, w, n, e
  grid: [number, number];
  min: number;
  max: number;
  mercX: [number, number];
  mercY: [number, number];
  tex: boolean;
};
export const REGIONS = regionsJson as unknown as Record<RegionName, RegionMeta>;

export const mercX = (lon: number) => (lon + 180) / 360;
export const mercY = (lat: number) => {
  const r = (lat * Math.PI) / 180;
  return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2;
};

/** Scene units: region spans WORLD_W along x; z grows southwards. */
export const WORLD_W = 10;
export const regionDims = (m: RegionMeta) => {
  const w = WORLD_W;
  const h = (WORLD_W * (m.mercY[1] - m.mercY[0])) / (m.mercX[1] - m.mercX[0]);
  return { w, h };
};
export const lonLatToXZ = (m: RegionMeta, lon: number, lat: number): [number, number] => {
  const { w, h } = regionDims(m);
  const u = (mercX(lon) - m.mercX[0]) / (m.mercX[1] - m.mercX[0]);
  const v = (mercY(lat) - m.mercY[0]) / (m.mercY[1] - m.mercY[0]);
  return [u * w - w / 2, v * h - h / 2];
};
/** metres per scene unit along x at region centre */
export const metresPerUnit = (m: RegionMeta) => {
  const lat = (m.bbox[0] + m.bbox[2]) / 2;
  const widthM = (m.bbox[3] - m.bbox[1]) * 111320 * Math.cos((lat * Math.PI) / 180);
  return widthM / WORLD_W;
};

export type Dem = { meta: RegionMeta; data: Int16Array; w: number; h: number };
const cache: Partial<Record<RegionName, Dem>> = {};

export const useDem = (name: RegionName): Dem | null => {
  const [dem, setDem] = useState<Dem | null>(cache[name] ?? null);
  const [handle] = useState(() => (cache[name] ? null : delayRender(`dem ${name}`)));
  useEffect(() => {
    if (cache[name]) return;
    fetch(staticFile(`geo/${name}_dem.bin`))
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        const meta = REGIONS[name];
        const d: Dem = { meta, data: new Int16Array(buf), w: meta.grid[0], h: meta.grid[1] };
        cache[name] = d;
        setDem(d);
        if (handle !== null) continueRender(handle);
      });
  }, [name, handle]);
  return dem;
};

/** Bilinear elevation (metres) at scene x,z */
export const elevAt = (dem: Dem, x: number, z: number) => {
  const { w, h } = regionDims(dem.meta);
  const u = (x + w / 2) / w;
  const v = (z + h / 2) / h;
  const fx = Math.min(Math.max(u * (dem.w - 1), 0), dem.w - 1);
  const fy = Math.min(Math.max(v * (dem.h - 1), 0), dem.h - 1);
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const x1 = Math.min(x0 + 1, dem.w - 1), y1 = Math.min(y0 + 1, dem.h - 1);
  const tx = fx - x0, ty = fy - y0;
  const g = (xx: number, yy: number) => dem.data[yy * dem.w + xx];
  return (g(x0, y0) * (1 - tx) + g(x1, y0) * tx) * (1 - ty) + (g(x0, y1) * (1 - tx) + g(x1, y1) * tx) * ty;
};

// Verified/approximate coordinates (OSM Nominatim; "approx" = manual from map reading)
export const PLACES: Record<string, { lat: number; lon: number; approx?: boolean }> = {
  Visakhapatnam: { lat: 17.6868, lon: 83.2185 },
  "Vizag Port": { lat: 17.693, lon: 83.285, approx: true },
  "Eastern Naval Command": { lat: 17.707, lon: 83.293, approx: true },
  "Vizag Steel Plant": { lat: 17.6174, lon: 83.1956 },
  "HPCL Refinery": { lat: 17.689, lon: 83.257, approx: true },
  "Pharma City (Parawada)": { lat: 17.6, lon: 83.08, approx: true },
  "Dolphin's Nose": { lat: 17.6576, lon: 83.2437 },
  Kailasagiri: { lat: 17.75, lon: 83.3397 },
  "RK Beach": { lat: 17.7121, lon: 83.3201 },
  "Old Airport (INS Dega)": { lat: 17.7323, lon: 83.2238 },
  Tarluvada: { lat: 17.9056, lon: 83.329 },
  Adavivaram: { lat: 17.7822, lon: 83.266 },
  Mudasarlova: { lat: 17.7647, lon: 83.2954 },
  Simhachalam: { lat: 17.7663, lon: 83.2505 },
  Kambalakonda: { lat: 17.8, lon: 83.33, approx: true },
  Rambilli: { lat: 17.4655, lon: 82.9286 },
  Nakkapalli: { lat: 17.4106, lon: 82.7163 },
  Rajayyapeta: { lat: 17.39, lon: 82.78, approx: true },
  "Bhogapuram Airport": { lat: 17.9763, lon: 83.4955 },
  Madhurawada: { lat: 17.8102, lon: 83.354 },
  Kapuluppada: { lat: 17.8536, lon: 83.3856 },
  Srikakulam: { lat: 18.2949, lon: 83.8939 },
  Vizianagaram: { lat: 18.1141, lon: 83.4114 },
  Anakapalli: { lat: 17.691, lon: 83.0037, approx: true },
  Kakinada: { lat: 16.9437, lon: 82.2351 },
  Amalapuram: { lat: 16.5777, lon: 82.0033 },
  Hyderabad: { lat: 17.385, lon: 78.4867 },
  "HITEC City": { lat: 17.449, lon: 78.3831 },
  Amaravati: { lat: 16.5263, lon: 80.5117 },
  Chennai: { lat: 13.0827, lon: 80.2707 },
  Mumbai: { lat: 19.076, lon: 72.8777 },
  Bengaluru: { lat: 12.9716, lon: 77.5946 },
  Singapore: { lat: 1.29, lon: 103.85 },
  Vijayawada: { lat: 16.5062, lon: 80.648 },
  Tirupati: { lat: 13.6288, lon: 79.4192 },
  Kurnool: { lat: 15.8281, lon: 78.0373 },
  Gulf: { lat: 19.6, lon: 76.6, approx: true },
  "Kakinada Port": { lat: 16.98, lon: 82.28, approx: true },
  "Gangavaram Port": { lat: 17.62, lon: 83.24, approx: true },
};
