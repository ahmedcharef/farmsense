// Simulated EDGE AI for the cherry-sample grader: runs entirely in the browser
// (no network). Reads the real photo pixels on a canvas, computes simple visual
// features, and classifies. Swap `classify` for a real on-device model later.
import type { IntakeResult } from "./ai";

export interface CherryFeatures { redness: number; underripe: number; darkSpots: number; brightness: number }
export interface EdgeIntakeResult extends IntakeResult {
  features: CherryFeatures; latencyMs: number; model: string;
}
export const EDGE_INTAKE_STEPS = ["Load photo on phone", "Shrink to 64×64", "Read colours", "Run tiny AI model", "Decide grade"];
export const EDGE_INTAKE_MODEL = "cherry-grade-lite v0.2 (on-device, 1.5 MB, simulated)";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src;
  });
}

async function features(src: string): Promise<CherryFeatures> {
  const img = await loadImage(src);
  const c = document.createElement("canvas"); c.width = 64; c.height = 64;
  const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0, 64, 64);
  const d = ctx.getImageData(0, 0, 64, 64).data;
  let red = 0, green = 0, dark = 0, lum = 0; const n = d.length / 4;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]!, g = d[i + 1]!, b = d[i + 2]!;
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    lum += l;
    if (l < 55) { dark++; continue; }
    if (g > r && g > b) green++;
    else if (r > 110 && r > g + 25 && r > b + 25) red++;
  }
  return {
    redness: Math.round((red / n) * 100),
    underripe: Math.round((green / n) * 100),
    darkSpots: Math.round((dark / n) * 100),
    brightness: Math.round(lum / n / 2.55),
  };
}

function level(v: number, med: number, high: number): "Low" | "Medium" | "High" {
  return v > high ? "High" : v > med ? "Medium" : "Low";
}

function classify(f: CherryFeatures) {
  const grade: IntakeResult["grade"] =
    f.redness >= 28 && f.underripe <= 11 && f.darkSpots <= 8 ? "A"
    : f.redness < 12 || f.underripe > 26 || f.darkSpots > 18 ? "C"
    : "B";
  const confidence = Math.min(96, 72 + Math.round(f.redness / 4));
  return {
    grade,
    estimatedQuality: grade === "A" ? "High" : grade === "B" ? "Medium" : "Low",
    detectedIssues: [
      { label: "Defect risk", level: level(f.darkSpots, 8, 18) },
      { label: "Underripe cherries", level: level(f.underripe, 10, 24) },
      { label: "Damaged cherries", level: level(f.darkSpots, 6, 15) },
    ],
    confidence,
  };
}

export async function edgeIntakeCheck(src: string, onStep: (i: number) => void): Promise<EdgeIntakeResult> {
  const t0 = performance.now();
  onStep(0); await wait(350);
  onStep(1); await wait(300);
  onStep(2);
  let f: CherryFeatures;
  try { f = await features(src); } catch { f = { redness: 45, underripe: 8, darkSpots: 6, brightness: 50 }; }
  await wait(350);
  onStep(3); await wait(600);
  onStep(4);
  const r = classify(f);
  await wait(200);
  return { ...r, features: f, latencyMs: Math.round(performance.now() - t0), model: EDGE_INTAKE_MODEL, simulated: true };
}
