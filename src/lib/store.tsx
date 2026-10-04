import type React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { DryingProvider } from "./drying-store";
import { seedData, uid, type AppData, type Lot, type LotEvent } from "./data";
import { loadState, saveState } from "./cloud";

const KEY = "coffee-passport-v1";

interface Store extends AppData {
  online: boolean;
  syncing: boolean;
  pending: number;
  setOnline: (v: boolean) => void;
  addEvent: (e: Omit<LotEvent, "id" | "synced">, replaceType?: boolean) => LotEvent;
  createLot: (input: { farmerName: string; farmerId: string; farm: string; gps: string; variety: string; quantityKg: number; harvestDate: string; photoUrl?: string }) => Lot;
  loadDemo: () => void;
  farmerName: (lot: Lot) => string;
  getLot: (id: string) => Lot | undefined;
}

// Reuse one context across hot reloads so editing this file never orphans the provider.
const g = globalThis as { __storeCtx?: React.Context<Store | null> };
const Ctx = (g.__storeCtx ??= createContext<Store | null>(null));

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(seedData);
  const [online, setOnlineState] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const loaded = useRef(false);

  const remoteReady = useRef(false);
  const skipPush = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setData(JSON.parse(raw));
    } catch {}
    loaded.current = true;
    const pull = () =>
      loadState<AppData>("passport")
        .then((remote) => {
          if (remote) { skipPush.current = true; setData(remote); }
          remoteReady.current = true;
        })
        .catch(() => { remoteReady.current = true; });
    pull();
    const onFocus = () => { if (navigator.onLine) pull(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    localStorage.setItem(KEY, JSON.stringify(data));
    if (skipPush.current) { skipPush.current = false; return; }
    if (!remoteReady.current || !online) return;
    const t = setTimeout(() => { saveState("passport", data).catch(() => toast.error("Could not save online")); }, 400);
    return () => clearTimeout(t);
  }, [data, online]);

  const pending = data.events.filter((e) => !e.synced).length;

  const setOnline = useCallback(
    (v: boolean) => {
      setOnlineState(v);
      if (v && data.events.some((e) => !e.synced)) {
        setSyncing(true);
        setTimeout(() => {
          setData((d) => ({ ...d, events: d.events.map((e) => ({ ...e, synced: true })) }));
          setSyncing(false);
          toast.success("SYNC COMPLETE ✓", { description: "All offline records uploaded." });
        }, 1600);
      }
    },
    [data.events],
  );

  const addEvent = useCallback(
    (e: Omit<LotEvent, "id" | "synced">, replaceType = false) => {
      const full: LotEvent = { ...e, id: uid(), synced: online };
      setData((d) => ({
        ...d,
        events: [...(replaceType ? d.events.filter((x) => !(x.lotId === e.lotId && x.type === e.type)) : d.events), full],
      }));
      return full;
    },
    [online],
  );

  const createLot: Store["createLot"] = useCallback(
    (i) => {
      const n = Math.max(...data.lots.map((l) => Number(l.id.split("-")[2]))) + 1;
      const id = `LOT-2026-${String(n).padStart(5, "0")}`;
      const existing = data.farmers.find((f) => f.name.toLowerCase() === i.farmerName.toLowerCase());
      const fid = existing?.id ?? (i.farmerId || uid("F"));
      const farmId = uid("FM");
      const lot: Lot = { id, farmerId: fid, farmId, quantityKg: i.quantityKg, origin: "Tanzania", createdAt: new Date().toISOString(), status: "ACTIVE" };
      const ev: LotEvent = {
        id: uid(), lotId: id, type: "HARVEST", timestamp: new Date(i.harvestDate).toISOString(), location: i.farm, gps: i.gps,
        operator: `${i.farmerName} (farmer)`, device: "Field phone", evidence: i.photoUrl ? { kind: "photo", label: "Harvest photo", image: i.photoUrl } : { kind: "manual", label: "Harvest registration" },
        status: "VERIFIED", synced: online, data: { estimatedKg: i.quantityKg, variety: i.variety },
      };
      setData((d) => ({
        farmers: existing ? d.farmers : [...d.farmers, { id: fid, name: i.farmerName, group: "Independent", contact: "—", farmIds: [farmId] }],
        farms: [...d.farms, { id: farmId, farmerId: fid, location: i.farm, gps: i.gps, areaHa: 1, variety: i.variety }],
        lots: [lot, ...d.lots],
        events: [...d.events, ev],
      }));
      return lot;
    },
    [online, data.lots, data.farmers],
  );

  const loadDemo = useCallback(() => {
    setData(seedData());
    setOnlineState(true);
    toast.success("Demo mode loaded", { description: "Noor's complete journey is ready." });
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...data, online, syncing, pending, setOnline, addEvent, createLot, loadDemo,
      farmerName: (lot) => data.farmers.find((f) => f.id === lot.farmerId)?.name ?? "Unknown",
      getLot: (id) => data.lots.find((l) => l.id === id),
    }),
    [data, online, syncing, pending, setOnline, addEvent, createLot, loadDemo],
  );
  return <Ctx.Provider value={value}><DryingProvider online={online}>{children}</DryingProvider></Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}
