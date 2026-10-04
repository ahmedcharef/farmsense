// Drying & Lot Tracker — one farmer, one lot, one drying area.
// Append-only event list; current location and bed states are derived, never overwritten.

export const FARMER = { name: "Noor", farm: "Noor's Coffee Farm", location: "Tanzania" };
export const LOT = { id: "N-001", coffee: "Arabica", harvestKg: 450, dryingKg: 150, harvestDate: "2026-06-18", processing: "Washed" };
export const TARGET = { min: 10, max: 12 };
export const OPERATOR = "Station Worker";

export type BedId = "A01" | "A02" | "A03" | "B01" | "B02" | "B03" | (string & {});
export const BEDS: { id: BedId; covered: boolean }[] = [
  { id: "A01", covered: false }, { id: "A02", covered: false }, { id: "A03", covered: false },
  { id: "B01", covered: true }, { id: "B02", covered: true }, { id: "B03", covered: true },
];

export type DType = "HARVEST" | "COLLECTION" | "WET_PROCESSING" | "DRYING_STARTED" | "BED_TURNED" | "INSPECTION" | "WEATHER_ALERT" | "BED_MOVEMENT" | "MOISTURE_CHECK" | "INTAKE" | "NOTE" | "STORED" | "READY_TO_SELL" | "SOLD" | "WATER_CHECK";
export type Trust = "VERIFIED" | "HUMAN_CONFIRMED" | "SIMULATED_AI";
export type Risk = "LOW" | "MEDIUM" | "HIGH";

export interface DEvent {
  id: string; type: DType; ts: string; operator: string; trust: Trust; synced: boolean;
  kg?: number; bed?: BedId; from?: BedId; to?: BedId; reason?: string; moisture?: number; risk?: Risk; note?: string; photo?: boolean; photoUrl?: string; text?: string;
}

const t = (s: string) => new Date(s + ":00+03:00").toISOString();
export const seedEvents = (): DEvent[] => [
  { id: "d1", type: "HARVEST", ts: t("2026-06-18T06:00"), operator: "Noor (farmer)", trust: "VERIFIED", synced: true, kg: 450, text: "Noor harvested coffee." },
  { id: "d2", type: "COLLECTION", ts: t("2026-06-18T08:10"), operator: OPERATOR, trust: "VERIFIED", synced: true, kg: 450, text: "Coffee collected from farm." },
  { id: "d3", type: "WET_PROCESSING", ts: t("2026-06-18T09:30"), operator: OPERATOR, trust: "HUMAN_CONFIRMED", synced: true, text: "Washed processing completed." },
  { id: "d4", type: "DRYING_STARTED", ts: t("2026-06-18T10:20"), operator: OPERATOR, trust: "VERIFIED", synced: true, kg: 150, bed: "A03", photo: true },
  { id: "d5", type: "BED_TURNED", ts: t("2026-06-20T13:10"), operator: OPERATOR, trust: "HUMAN_CONFIRMED", synced: true, bed: "A03" },
  { id: "d6", type: "INSPECTION", ts: t("2026-06-20T14:35"), operator: OPERATOR, trust: "HUMAN_CONFIRMED", synced: true, bed: "A03", moisture: 14.2, risk: "MEDIUM", photo: true },
  { id: "d7", type: "WEATHER_ALERT", ts: t("2026-06-20T14:50"), operator: "System", trust: "SIMULATED_AI", synced: true, bed: "A03", risk: "MEDIUM", text: "Rain risk increased. Prepare covered drying area." },
];

export const LABEL: Record<DType, string> = {
  INTAKE: "AI intake grade",
  HARVEST: "Harvest", COLLECTION: "Collection", WET_PROCESSING: "Washed", DRYING_STARTED: "Drying started",
  BED_TURNED: "Coffee turned", INSPECTION: "Inspection", WEATHER_ALERT: "Weather alert", BED_MOVEMENT: "Bed movement", MOISTURE_CHECK: "Moisture check",
  NOTE: "Note", STORED: "Moved to storage", READY_TO_SELL: "Ready to sell", SOLD: "Moved to buyer", WATER_CHECK: "Water check",
};

// The coffee's life stages, in order. A stage is done when a matching record exists.
export const STAGES: { key: string; label: string; match: DType[]; nextType: DType | null }[] = [
  { key: "harvest", label: "Harvest", match: ["HARVEST"], nextType: null },
  { key: "washed", label: "Washed", match: ["WET_PROCESSING", "WATER_CHECK"], nextType: "WET_PROCESSING" },
  { key: "drying", label: "Drying", match: ["DRYING_STARTED"], nextType: "DRYING_STARTED" },
  { key: "storage", label: "In storage", match: ["STORED"], nextType: "STORED" },
  { key: "ready", label: "Ready to sell", match: ["READY_TO_SELL"], nextType: "READY_TO_SELL" },
  { key: "sold", label: "Moved to buyer", match: ["SOLD"], nextType: "SOLD" },
];

export const WEATHER = { rainProbability: 62, humidity: 78, temperatureC: 23 };

/** SIMULATED AI. Same contract a real weather/ML model would return. */
export function dryingRiskPredictor(weather: typeof WEATHER, moisture: number, dryingDays: number, bed: { covered: boolean }, coffeeKg: number) {
  let score = 0; const why: string[] = [];
  if (weather.rainProbability >= 50) { score += bed.covered ? 0 : 2; why.push("rain probability is increasing"); }
  if (weather.humidity >= 75) { score += 1; why.push("humidity is high"); }
  if (moisture > TARGET.max + 2 && dryingDays >= 3) { score += 1; why.push("drying is slow"); }
  if (coffeeKg > 200) score += 0.5;
  if (moisture <= TARGET.max) score -= 1;
  const riskLevel: Risk = score >= 3.5 ? "HIGH" : score >= 1.5 ? "MEDIUM" : "LOW";
  const reason = why.length ? `${why.join(" and ").replace(/^./, (c) => c.toUpperCase())}.${riskLevel !== "LOW" ? " Coffee may dry slowly over the next 12 hours." : ""}` : "Conditions look good for drying.";
  const recommendation = riskLevel === "LOW" ? (bed.covered ? "Coffee is protected. Keep turning it and check moisture." : "Keep turning the coffee every few hours.")
    : bed.covered ? "Coffee is under cover. Keep turning it and check moisture again soon." : "Consider moving coffee to a covered drying area if rain begins.";
  return { riskLevel, confidence: 87, reason, recommendation };
}

export function moistureStatus(m: number) {
  if (m < TARGET.min) return { tone: "bad" as const, label: "Check coffee condition" };
  if (m <= TARGET.max) return { tone: "good" as const, label: "Target moisture reached" };
  return { tone: "warn" as const, label: "Still drying" };
}

export function derive(events: DEvent[], beds: { id: BedId; covered: boolean }[] = BEDS) {
  const sorted = [...events].sort((a, b) => a.ts.localeCompare(b.ts));
  let bed: BedId | null = null;
  for (const e of sorted) { if (e.type === "DRYING_STARTED") bed = e.bed!; if (e.type === "BED_MOVEMENT") bed = e.to!; }
  const start = sorted.find((e) => e.type === "DRYING_STARTED");
  const checks = sorted.filter((e) => e.moisture != null);
  const lastCheck = checks.at(-1);
  const moisture = lastCheck?.moisture ?? 0;
  const dry = sorted.filter((e) => e.type !== "INTAKE");
  const last = dry.at(-1) ?? sorted.at(-1)!;
  const days = start ? Math.floor((Date.parse(last.ts) - Date.parse(start.ts)) / 86400000) : 0;
  const bedInfo = beds.find((b) => b.id === bed) ?? beds[0]!;
  const ai = dryingRiskPredictor(WEATHER, moisture, days, bedInfo, LOT.dryingKg);
  const lastTurn = sorted.filter((e) => e.type === "BED_TURNED").at(-1);
  const status = moistureStatus(moisture);
  const bedState = (id: BedId): "EMPTY" | "DRYING" | "ATTENTION" | "READY" =>
    id !== bed ? "EMPTY" : status.tone === "good" ? "READY" : ai.riskLevel !== "LOW" || status.tone === "bad" ? "ATTENTION" : "DRYING";
  return { sorted, bed, bedInfo, start, lastCheck, moisture, days, ai, lastTurn, status, bedState, pending: events.filter((e) => !e.synced).length };
}

export const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Dar_es_Salaam" });
export const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Dar_es_Salaam" }).toUpperCase();
