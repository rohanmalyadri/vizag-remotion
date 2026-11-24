import { Easing } from "remotion";
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// ── THE COASTLINE BLUEPRINT · design tokens ─────────────────────────────
export const C = {
  white: "#F7F7F3",
  charcoal: "#151B24",
  navy: "#142B46",
  cobalt: "#315FEA",
  teal: "#248B91",
  yellow: "#F1E5A7",
  coral: "#D97769",
  grey: "#AEB8C3",
  silver: "#E1E6EA",
  ink: "#0D1219",
};

export const F = {
  display: "Inter, sans-serif",
  serif: "'Source Serif 4', Georgia, serif",
  mono: "'JetBrains Mono', monospace",
};

export const FPS = 30;

// Graph-editor style curves
export const EZ = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // expo-out: confident arrivals
  inOut: Easing.bezier(0.65, 0, 0.35, 1), // camera moves
  in: Easing.bezier(0.7, 0, 0.84, 0),
  over: Easing.bezier(0.34, 1.45, 0.64, 1), // controlled overshoot
  soft: Easing.bezier(0.33, 0, 0.2, 1),
  lin: Easing.linear,
};

const fontFiles: [string, string, string, string][] = [
  ["Inter", "inter-latin-300-normal.woff2", "300", "normal"],
  ["Inter", "inter-latin-400-normal.woff2", "400", "normal"],
  ["Inter", "inter-latin-500-normal.woff2", "500", "normal"],
  ["Inter", "inter-latin-600-normal.woff2", "600", "normal"],
  ["Inter", "inter-latin-700-normal.woff2", "700", "normal"],
  ["Inter", "inter-latin-800-normal.woff2", "800", "normal"],
  ["Inter", "inter-latin-900-normal.woff2", "900", "normal"],
  ["Source Serif 4", "source-serif-4-latin-400-normal.woff2", "400", "normal"],
  ["Source Serif 4", "source-serif-4-latin-600-normal.woff2", "600", "normal"],
  ["Source Serif 4", "source-serif-4-latin-400-italic.woff2", "400", "italic"],
  ["Source Serif 4", "source-serif-4-latin-600-italic.woff2", "600", "italic"],
  ["JetBrains Mono", "jetbrains-mono-latin-400-normal.woff2", "400", "normal"],
  ["JetBrains Mono", "jetbrains-mono-latin-500-normal.woff2", "500", "normal"],
  ["JetBrains Mono", "jetbrains-mono-latin-700-normal.woff2", "700", "normal"],
];
export const fontsReady = Promise.all(
  fontFiles.map(([family, file, weight, style]) =>
    loadFont({ family, url: staticFile(`fonts/${file}`), weight, style, display: "block" }),
  ),
);
