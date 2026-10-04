// Traceability data model. Everything in a lot's journey is an append-only Event.
export type EventType =
  | "HARVEST"
  | "COLLECTION"
  | "INTAKE"
  | "WATER_AUDIT"
  | "PROCESSING"
  | "DRYING_START"
  | "WEATHER_ALERT"
  | "DRYING_INTERVENTION"
  | "MOISTURE_CHECK"
  | "STORAGE"
  | "SALE"
  | "NOTE";

export type Trust = "VERIFIED" | "AI_ASSESSMENT" | "HUMAN_CONFIRMED" | "MISSING" | "SIMULATED";
export type EventStatus = "VERIFIED" | "CONFIRMED" | "PENDING" | "REJECTED";

export interface Farmer {
  id: string;
  name: string;
  group: string;
  contact: string;
  farmIds: string[];
}

export interface Farm {
  id: string;
  farmerId: string;
  location: string;
  gps: string;
  areaHa: number;
  variety: string;
}

export interface Lot {
  id: string;
  farmerId: string;
  farmId: string;
  quantityKg: number;
  origin: string;
  createdAt: string;
  status: "ACTIVE" | "SOLD";
}

export interface EventData {
  estimatedKg?: number; variety?: string; receivedKg?: number; grade?: string; result?: string; flags?: string;
  bed?: string; end?: string; moisture?: number; method?: string; warehouse?: string; alert?: string; action?: string;
}

export interface LotEvent {
  id: string;
  lotId: string;
  type: EventType;
  timestamp: string;
  location: string;
  gps?: string;
  operator: string;
  device: string;
  evidence?: { kind: "photo" | "sensor" | "manual"; label: string; image?: string };
  aiAssessment?: string;
  aiConfidence?: number;
  humanConfirmation?: "CONFIRMED" | "REJECTED" | "PENDING";
  status: EventStatus;
  notes?: string;
  simulated?: boolean;
  synced: boolean;
  data?: EventData;
}

export interface AppData {
  farmers: Farmer[];
  farms: Farm[];
  lots: Lot[];
  events: LotEvent[];
}

export const DEMO_LOT = "LOT-2026-00123";
export const STATION = "Mbeya Highlands Washing Station";
export const STATION_GPS = "-9.1123, 33.4561";

export const EVENT_LABEL: Record<EventType, string> = {
  HARVEST: "Harvest",
  COLLECTION: "Collection",
  INTAKE: "Intake",
  WATER_AUDIT: "Water audit",
  PROCESSING: "Wet processing",
  DRYING_START: "Drying started",
  WEATHER_ALERT: "Weather alert",
  DRYING_INTERVENTION: "Weather intervention",
  MOISTURE_CHECK: "Moisture check",
  STORAGE: "Storage",
  SALE: "Sale",
  NOTE: "Note",
};

let counter = 0;
export const uid = (p = "EV") => `${p}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

function ev(e: Omit<LotEvent, "id" | "synced"> & { id?: string }): LotEvent {
  return { synced: true, ...e, id: e.id ?? `${e.lotId}-${e.type}` };
}

function noorEvents(): LotEvent[] {
  const L = DEMO_LOT;
  return [
    ev({ lotId: L, type: "HARVEST", timestamp: "2026-10-12T07:40:00Z", location: "Noor's farm, Plot 3, Mbozi", gps: "-9.1342, 33.4127", operator: "Noor (farmer)", device: "Field phone FP-11", evidence: { kind: "manual", label: "Farm GPS + harvest declaration" }, status: "VERIFIED", data: { estimatedKg: 450, variety: "Bourbon / Kent" }, notes: "Farm location recorded" }),
    ev({ lotId: L, type: "INTAKE", timestamp: "2026-10-13T09:12:00Z", location: STATION, gps: STATION_GPS, operator: "Amani J. (intake clerk)", device: "Scale SC-02 · Tablet T-04", evidence: { kind: "photo", label: "Cherry sample photo" }, aiAssessment: "Grade A recommendation · low defect risk", aiConfidence: 91, humanConfirmation: "CONFIRMED", status: "CONFIRMED", simulated: true, data: { receivedKg: 438, grade: "A" } }),
    ev({ lotId: L, type: "WATER_AUDIT", timestamp: "2026-10-13T14:30:00Z", location: STATION + " · outlet channel 1", gps: STATION_GPS, operator: "Grace M. (wet-mill lead)", device: "Tablet T-04", evidence: { kind: "photo", label: "Effluent photo" }, aiAssessment: "AI visual screening: CLEAN", aiConfidence: 94, status: "VERIFIED", simulated: true, data: { result: "CLEAN" } }),
    ev({ lotId: L, type: "DRYING_START", timestamp: "2026-10-14T08:00:00Z", location: STATION + " · bed B07", gps: STATION_GPS, operator: "Station Manager", device: "Tablet T-04", evidence: { kind: "manual", label: "Bed assignment" }, status: "VERIFIED", data: { bed: "B07", end: "2026-10-18" } }),
    ev({ lotId: L, type: "WEATHER_ALERT", timestamp: "2026-10-16T13:05:00Z", location: STATION + " · bed B07", gps: STATION_GPS, operator: "AI Drying Guard", device: "Weather station WS-1", evidence: { kind: "sensor", label: "Humidity 71% · rain prob. 78%" }, aiAssessment: "High rain risk within 60 min", aiConfidence: 78, status: "VERIFIED", simulated: true }),
    ev({ lotId: L, type: "DRYING_INTERVENTION", timestamp: "2026-10-16T13:18:00Z", location: STATION + " · bed B07", gps: STATION_GPS, operator: "Station Manager", device: "Tablet T-04", evidence: { kind: "manual", label: "Action recorded by operator" }, humanConfirmation: "CONFIRMED", status: "VERIFIED", notes: "Coffee moved under cover", data: { action: "Coffee moved under cover" } }),
    ev({ lotId: L, type: "MOISTURE_CHECK", timestamp: "2026-10-18T10:20:00Z", location: STATION + " · QC room", gps: STATION_GPS, operator: "Amani J. (QC)", device: "Moisture meter MM-3", evidence: { kind: "sensor", label: "Meter reading (simulated in prototype)" }, status: "VERIFIED", simulated: true, data: { moisture: 10.8, method: "Capacitance moisture meter" } }),
    ev({ lotId: L, type: "STORAGE", timestamp: "2026-10-18T15:00:00Z", location: "Warehouse WH-02", gps: STATION_GPS, operator: "Store keeper", device: "Tablet T-04", evidence: { kind: "manual", label: "Warehouse slot WH-02/A4" }, status: "VERIFIED", data: { warehouse: "WH-02" } }),
    ev({ lotId: L, type: "SALE", timestamp: "2026-10-25T00:00:00Z", location: "—", operator: "—", device: "—", status: "PENDING", notes: "Buyer confirmation pending" }),
  ];
}

type Stage = "HARVEST" | "INTAKE" | "WATER" | "DRYING" | "MOISTURE" | "STORAGE";
function genericLot(
  n: number,
  farmer: string,
  kg: number,
  stage: Stage,
  opts: { grade?: string; water?: string; moisture?: number; alert?: boolean; day: number },
): { lot: Lot; farmer: Farmer; farm: Farm; events: LotEvent[] } {
  const id = `LOT-2026-${String(n).padStart(5, "0")}`;
  const fid = `F-${n}`;
  const d = (o: number, h = 9) => new Date(Date.UTC(2026, 9, opts.day + o, h)).toISOString();
  const order: Stage[] = ["HARVEST", "INTAKE", "WATER", "DRYING", "MOISTURE", "STORAGE"];
  const upto = order.indexOf(stage);
  const evs: LotEvent[] = [];
  const base = { lotId: id, gps: STATION_GPS, device: "Tablet T-04", operator: "Station staff" };
  evs.push(ev({ ...base, type: "HARVEST", timestamp: d(0, 7), location: `${farmer}'s farm`, operator: farmer, status: "VERIFIED", data: { estimatedKg: kg } }));
  if (upto >= 1) evs.push(ev({ ...base, type: "INTAKE", timestamp: d(1), location: STATION, status: "CONFIRMED", aiAssessment: `Grade ${opts.grade} recommendation`, aiConfidence: 88, humanConfirmation: "CONFIRMED", simulated: true, data: { receivedKg: Math.round(kg * 0.97), grade: opts.grade ?? "B" } }));
  if (upto >= 2) evs.push(ev({ ...base, type: "WATER_AUDIT", timestamp: d(1, 14), location: STATION, status: "VERIFIED", aiAssessment: `AI visual screening: ${opts.water}`, aiConfidence: 90, simulated: true, data: { result: opts.water ?? "CLEAN" } }));
  if (upto >= 3) evs.push(ev({ ...base, type: "DRYING_START", timestamp: d(2), location: STATION, status: "VERIFIED", data: { bed: `B${String(n % 20).padStart(2, "0")}` } }));
  if (upto >= 3 && opts.alert) evs.push(ev({ ...base, type: "WEATHER_ALERT", timestamp: d(3, 13), location: STATION, operator: "AI Drying Guard", status: "VERIFIED", aiAssessment: "High rain risk", aiConfidence: 74, simulated: true }));
  if (upto >= 4) evs.push(ev({ ...base, type: "MOISTURE_CHECK", timestamp: d(6), location: STATION, status: "VERIFIED", simulated: true, data: { moisture: opts.moisture ?? 11 } }));
  if (upto >= 5) evs.push(ev({ ...base, type: "STORAGE", timestamp: d(6, 15), location: "Warehouse WH-01", status: "VERIFIED", data: { warehouse: "WH-01" } }));
  return {
    lot: { id, farmerId: fid, farmId: `FM-${n}`, quantityKg: kg, origin: "Tanzania", createdAt: d(0, 7), status: "ACTIVE" },
    farmer: { id: fid, name: farmer, group: "Mbozi Growers AMCOS", contact: "+255 7•• ••• •••", farmIds: [`FM-${n}`] },
    farm: { id: `FM-${n}`, farmerId: fid, location: "Mbozi, Songwe", gps: "-9.1" + n, areaHa: 0.8, variety: "Bourbon" },
    events: evs,
  };
}

export function seedData(): AppData {
  const others = [
    genericLot(118, "Juma", 320, "STORAGE", { grade: "A", water: "CLEAN", moisture: 11.2, day: 8 }),
    genericLot(119, "Rehema", 210, "MOISTURE", { grade: "B", water: "WATCH", moisture: 12.4, day: 9 }),
    genericLot(120, "Baraka", 515, "DRYING", { grade: "A", water: "CLEAN", alert: true, day: 11 }),
    genericLot(121, "Neema", 180, "DRYING", { grade: "B", water: "CLEAN", day: 12 }),
    genericLot(122, "Hassan", 390, "WATER", { grade: "C", water: "POTENTIAL HIGH RISK", day: 13 }),
    genericLot(124, "Zawadi", 275, "INTAKE", { grade: "A", day: 14 }),
    genericLot(125, "Elia", 140, "HARVEST", { day: 15 }),
  ];
  return {
    farmers: [{ id: "F-NOOR", name: "Noor", group: "Mbozi Growers AMCOS", contact: "+255 7•• ••• •••", farmIds: ["FM-NOOR-3"] }, ...others.map((o) => o.farmer)],
    farms: [{ id: "FM-NOOR-3", farmerId: "F-NOOR", location: "Plot 3, Mbozi, Songwe", gps: "-9.1342, 33.4127", areaHa: 1.2, variety: "Bourbon / Kent" }, ...others.map((o) => o.farm)],
    lots: [{ id: DEMO_LOT, farmerId: "F-NOOR", farmId: "FM-NOOR-3", quantityKg: 450, origin: "Tanzania", createdAt: "2026-10-12T07:40:00Z", status: "ACTIVE" }, ...others.map((o) => o.lot)],
    events: [...noorEvents(), ...others.flatMap((o) => o.events)],
  };
}

// ---------- derived views ----------
export const STAGE_GROUPS = [
  { key: "HARVEST", label: "Harvest", icon: "🌱", types: ["HARVEST", "COLLECTION"], weight: 15 },
  { key: "INTAKE", label: "Intake", icon: "⚖️", types: ["INTAKE"], weight: 18 },
  { key: "WET", label: "Wet processing", icon: "💧", types: ["WATER_AUDIT", "PROCESSING"], weight: 18 },
  { key: "DRYING", label: "Drying", icon: "☀️", types: ["DRYING_START", "WEATHER_ALERT", "DRYING_INTERVENTION"], weight: 18 },
  { key: "QUALITY", label: "Final quality", icon: "🎯", types: ["MOISTURE_CHECK"], weight: 15 },
  { key: "STORAGE", label: "Storage", icon: "📦", types: ["STORAGE"], weight: 12 },
  { key: "SALE", label: "Sale", icon: "🚢", types: ["SALE"], weight: 4 },
] as const;

export type StageKey = (typeof STAGE_GROUPS)[number]["key"];

export function lotEvents(events: LotEvent[], lotId: string) {
  return events.filter((e) => e.lotId === lotId).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function summarize(lot: Lot, events: LotEvent[]) {
  const evs = lotEvents(events, lot.id);
  const last = (t: EventType) => [...evs].reverse().find((e) => e.type === t);
  const intake = last("INTAKE");
  const water = last("WATER_AUDIT");
  const moisture = last("MOISTURE_CHECK");
  const drying = last("DRYING_START");
  const done = (e?: LotEvent) => !!e && e.status !== "PENDING" && e.status !== "REJECTED";
  let completeness = 0;
  let stage = "Harvest";
  for (const g of STAGE_GROUPS) {
    const has = evs.some((e) => (g.types as readonly string[]).includes(e.type) && done(e));
    if (has) {
      completeness += g.weight;
      stage = g.label;
    }
  }
  return {
    grade: intake?.humanConfirmation === "CONFIRMED" ? String(intake.data?.grade ?? "—") : intake ? "Pending" : "—",
    receivedKg: Number(intake?.data?.receivedKg ?? lot.quantityKg),
    water: water ? String(water.data?.result ?? "—") : "—",
    drying: moisture ? "Complete" : drying ? "In progress" : "—",
    dryingRisk: evs.some((e) => e.type === "WEATHER_ALERT") ? (evs.some((e) => e.type === "DRYING_INTERVENTION") ? "Handled" : "Alert") : "None",
    moisture: moisture ? Number(moisture.data?.moisture) : undefined,
    stage,
    completeness,
    events: evs,
  };
}

export function fmtDate(iso: string, time = false) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC", ...(time ? { hour: "2-digit", minute: "2-digit" } : {}) });
}
