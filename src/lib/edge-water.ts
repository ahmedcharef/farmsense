// Simulated EDGE AI: runs entirely in the browser (no network). Reads the real
// photo pixels on a canvas, computes simple visual features, and classifies.
// Swap `classify` for a real on-device model (e.g. TFLite/ONNX web) later.
import type { WaterClass } from "./ai";

export interface EdgeFeatures { brightness: number; turbidity: number; darkness: number; foam: number; brownness: number }
export interface EdgeResult {
  classification: WaterClass; confidence: number; riskFlags: string[]; swahili: string;
  features: EdgeFeatures; latencyMs: number; model: string; simulated: true;
}
export const EDGE_STEPS = ["Load photo on phone", "Shrink to 64×64", "Read colours", "Run tiny AI model", "Decide result"];
export const EDGE_MODEL = "water-screen-lite v0.3 (on-device, 1.2 MB, simulated)";

const SW: Record<WaterClass, string> = { CLEAN: "Maji yameainishwa kuwa safi.", WATCH: "Maji yanahitaji ufuatiliaji.", "POTENTIAL HIGH RISK": "Maji yanaweza kuwa na hatari kubwa. Pima maabara." };
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image(); i.crossOrigin = "anonymous";
    i.onload = () => res(i); i.onerror = rej; i.src = src;
  });
}

async function features(src: string): Promise<EdgeFeatures> {
  const img = await loadImage(src);
  const c = document.createElement("canvas"); c.width = 64; c.height = 64;
  const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0, 64, 64);
  const d = ctx.getImageData(0, 0, 64, 64).data;
  let sum = 0, sq = 0, dark = 0, foam = 0, brown = 0; const n = d.length / 4;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]!, g = d[i + 1]!, b = d[i + 2]!;
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    sum += l; sq += l * l;
    if (l < 60) dark++;
    if (l > 215 && Math.abs(r - b) < 20) foam++;
    if (r > g && g > b && r - b > 40) brown++;
  }
  const mean = sum / n; const sd = Math.sqrt(sq / n - mean * mean);
  return {
    brightness: Math.round(mean / 2.55),
    turbidity: Math.round(Math.min(100, sd / 0.8)),
    darkness: Math.round((dark / n) * 100),
    foam: Math.round((foam / n) * 100),
    brownness: Math.round((brown / n) * 100),
  };
}

function classify(f: EdgeFeatures) {
  const flags: string[] = [];
  if (f.brownness > 35) flags.push("Brown colour");
  if (f.darkness > 30) flags.push("Dark water");
  if (f.foam > 8) flags.push("Foam");
  if (f.turbidity > 55) flags.push("Cloudy / mixed");
  const score = f.brownness * 0.4 + f.darkness * 0.5 + f.foam * 0.6 + Math.max(0, f.turbidity - 40) * 0.3;
  const classification: WaterClass = score > 30 ? "POTENTIAL HIGH RISK" : score > 14 ? "WATCH" : "CLEAN";
  const edge = classification === "WATCH" ? Math.abs(score - 22) : Math.abs(score - (score > 30 ? 30 : 14));
  const confidence = Math.min(97, Math.round(70 + edge * 1.5));
  const swahili = SW[classification];
  return { classification, confidence, riskFlags: flags, swahili };
}

export async function edgeWaterCheck(src: string, onStep: (i: number) => void, force?: WaterClass): Promise<EdgeResult> {
  const t0 = performance.now();
  onStep(0); await wait(350);
  onStep(1); await wait(300);
  onStep(2);
  let f: EdgeFeatures;
  try { f = await features(src); } catch { f = { brightness: 50, turbidity: 40, darkness: 10, foam: 2, brownness: 20 }; }
  await wait(350);
  onStep(3); await wait(600);
  onStep(4);
  let r = classify(f);
  if (force) r = { ...r, classification: force, swahili: SW[force] };
  await wait(200);
  return { ...r, features: f, latencyMs: Math.round(performance.now() - t0), model: EDGE_MODEL, simulated: true };
}
