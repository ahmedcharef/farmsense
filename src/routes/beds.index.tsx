import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, QrCode, Umbrella } from "lucide-react";
import { useState } from "react";
import { useDrying } from "@/lib/drying-store";
import { useStore } from "@/lib/store";
import { LOT } from "@/lib/drying";
import { STATE_CLS } from "@/components/drying-ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/beds/")({
  head: () => ({
    meta: [
      { title: "Drying Area — FarmSense" },
      { name: "description", content: "Map of the drying beds showing which bed holds lot N-001 and its drying state." },
      { property: "og:title", content: "Drying Area — FarmSense" },
      { property: "og:description", content: "Every drying bed and its current state at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BedMap,
});

function BedMap() {
  const { d, beds, addBed } = useDrying();
  const { lots, events } = useStore();
  // New-harvest lots: their latest recorded bed puts them on the map
  const onBed: Record<string, { id: string; kg: number }> = {};
  for (const l of lots.filter((l) => Number(l.id.split("-")[2]) > 125)) {
    const withBed = events.filter((e) => e.lotId === l.id && e.data?.bed).sort((a, b) => a.timestamp.localeCompare(b.timestamp)).at(-1);
    if (withBed) onBed[String(withBed.data!.bed)] = { id: l.id, kg: l.quantityKg };
  }
  const [scanning, setScanning] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const navigate = Route.useNavigate();
  const scan = () => {
    setScanning(true);
    setTimeout(() => navigate({ to: "/beds/$bedId", params: { bedId: d.bed ?? "A03" } }), 1200);
  };
  const add = (covered: boolean) => {
    const bed = addBed(covered);
    setAdded(bed.id);
    setTimeout(() => { setAdded(null); setAdding(false); }, 2500);
  };
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Drying Area</h1>
      {(["A", "B"] as const).map((row) => (
        <section key={row}>
          <p className="mb-2 flex items-center gap-2 font-bold text-muted-foreground">
            ROW {row} {row === "B" && <><Umbrella className="h-4 w-4" /> covered</>}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {beds.filter((b) => b.id.startsWith(row)).map((b) => {
              const other = onBed[b.id];
              const s = d.bedState(b.id) === "EMPTY" && other ? "DRYING" : d.bedState(b.id);
              return (
                <Link key={b.id} to="/beds/$bedId" params={{ bedId: b.id }} className={cn("flex min-h-28 flex-col justify-between rounded-xl border-2 p-3 active:scale-[0.97]", STATE_CLS[s])}>
                  <span className="font-display text-lg">BED {b.id}</span>
                  <span className="text-sm font-bold">{s}</span>
                  {d.bed === b.id ? <span className="text-sm font-semibold">LOT {LOT.id} · {LOT.dryingKg} kg</span> : other && <span className="text-sm font-semibold">LOT {other.id.split("-")[2]} · {other.kg} kg</span>}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
      <div className="flex flex-wrap gap-2 text-sm font-bold">
        {(Object.keys(STATE_CLS) as (keyof typeof STATE_CLS)[]).map((k) => <span key={k} className={cn("rounded-full border-2 px-3 py-1", STATE_CLS[k])}>{k}</span>)}
      </div>
      {adding ? (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => add(false)} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 border-primary font-display text-primary">
            <Plus className="h-7 w-7" /> Open bed<span className="block text-xs font-bold text-muted-foreground">row A · open air</span>
          </button>
          <button onClick={() => add(true)} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl bg-earth font-display text-earth-foreground">
            <Plus className="h-7 w-7" /> Covered bed<span className="block text-xs font-bold opacity-80">row B · under cover</span>
          </button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="flex h-16 w-full items-center justify-center gap-3 rounded-xl border-2 border-primary font-display text-lg text-primary">
          <Plus className="h-7 w-7" /> {added ? `BED ${added} ADDED` : "ADD BED"}
        </button>
      )}
      <button onClick={scan} className="flex h-16 w-full items-center justify-center gap-3 rounded-xl bg-primary font-display text-lg text-primary-foreground">
        <QrCode className={cn("h-7 w-7", scanning && "animate-pulse")} /> {scanning ? "Scanning… (simulated)" : "SCAN BED"}
      </button>
    </div>
  );
}
