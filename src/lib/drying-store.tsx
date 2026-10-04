import type React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BEDS, derive, seedEvents, type BedId, type DEvent } from "./drying";
import { appendDryingEvents, loadDryingEvents, loadState, saveState } from "./cloud";

const KEY = "coffee-drying-v1";
const KEY_BEDS = "coffee-drying-beds-v1";
type NewEvent = Omit<DEvent, "id" | "synced" | "ts"> & { ts?: string };
type Bed = { id: BedId; covered: boolean };
interface DryingStore { events: DEvent[]; d: ReturnType<typeof derive>; beds: Bed[]; addBed: (covered: boolean) => Bed; record: (e: NewEvent) => DEvent; reset: () => void }
const g = globalThis as { __dryingCtx?: React.Context<DryingStore | null> };
const Ctx = (g.__dryingCtx ??= createContext<DryingStore | null>(null));

export function DryingProvider({ online, children }: { online: boolean; children: ReactNode }) {
  const [events, setEvents] = useState<DEvent[]>(seedEvents);
  const [extraBeds, setExtraBeds] = useState<Bed[]>([]);
  const loaded = useRef(false);
  const bedsReady = useRef(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setEvents(JSON.parse(raw)); } catch { /* ignore */ }
    try { const raw = localStorage.getItem(KEY_BEDS); if (raw) setExtraBeds(JSON.parse(raw)); } catch { /* ignore */ }
    loaded.current = true;
    const pull = () => {
      // Merge online records with this phone's records (union by id; nothing is removed).
      loadDryingEvents<DEvent>().then((remote) => {
        if (!remote.length) return;
        setEvents((ev) => {
          const ids = new Set(ev.map((e) => e.id));
          const add = remote.filter((e) => !ids.has(e.id)).map((e) => ({ ...e, synced: true }));
          return add.length ? [...ev, ...add].sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts)) : ev;
        });
      }).catch(() => {});
      loadState<Bed[]>("drying-beds").then((remote) => {
        if (remote) setExtraBeds((bs) => { const ids = new Set(bs.map((b) => b.id)); const add = remote.filter((b) => !ids.has(b.id)); return add.length ? [...bs, ...add] : bs; });
        bedsReady.current = true;
      }).catch(() => { bedsReady.current = true; });
    };
    pull();
    const onFocus = () => { if (navigator.onLine) pull(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
  useEffect(() => { if (loaded.current) localStorage.setItem(KEY, JSON.stringify(events)); }, [events]);
  useEffect(() => {
    if (!loaded.current) return;
    localStorage.setItem(KEY_BEDS, JSON.stringify(extraBeds));
    if (bedsReady.current && online && extraBeds.length) saveState("drying-beds", extraBeds).catch(() => {});
  }, [extraBeds, online]);
  // When the network returns, upload offline records, then mark them saved.
  useEffect(() => {
    if (!online) return;
    const pending = events.filter((e) => !e.synced);
    if (!pending.length) return;
    appendDryingEvents(pending.map((e) => ({ ...e, synced: true })))
      .then(() => { const ids = new Set(pending.map((e) => e.id)); setEvents((ev) => ev.map((e) => (ids.has(e.id) ? { ...e, synced: true } : e))); })
      .catch(() => {});
  }, [online, events]);

  const beds = useMemo(() => [...BEDS, ...extraBeds].sort((a, b) => a.id.localeCompare(b.id)), [extraBeds]);

  // Append only — never edit or delete earlier events. Saved as unsynced; the effect above uploads it.
  const record = useCallback((e: NewEvent) => {
    // Demo clock: new records follow the seeded June timeline (+15 min after the latest record).
    const lastTs = Math.max(...events.map((x) => Date.parse(x.ts)));
    const full: DEvent = { ...e, ts: e.ts ?? new Date(lastTs + 15 * 60000).toISOString(), id: Math.random().toString(36).slice(2, 10), synced: false };
    setEvents((ev) => [...ev, full]);
    return full;
  }, [events]);

  const addBed = useCallback((covered: boolean) => {
    const row = covered ? "B" : "A";
    const taken = new Set([...BEDS, ...extraBeds].map((b) => b.id));
    let n = 4;
    while (taken.has(`${row}${String(n).padStart(2, "0")}`)) n += 1;
    const bed: Bed = { id: `${row}${String(n).padStart(2, "0")}`, covered };
    setExtraBeds((bs) => [...bs, bed]);
    return bed;
  }, [extraBeds]);

  const reset = useCallback(() => { setEvents(seedEvents()); setExtraBeds([]); }, []);
  const value = useMemo(() => ({ events, d: derive(events, beds), beds, addBed, record, reset }), [events, beds, addBed, record, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDrying() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useDrying outside provider");
  return s;
}
