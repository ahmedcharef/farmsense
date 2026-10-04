import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Clock, Sprout } from "lucide-react";
import { useState } from "react";
import { useDrying } from "@/lib/drying-store";
import { useStore } from "@/lib/store";
import { FARMER, LOT } from "@/lib/drying";
import { summarize } from "@/lib/data";

export const Route = createFileRoute("/journey/")({
  component: Journey,
});

function Journey() {
  const { d } = useDrying();
  const { lots, events } = useStore();
  // Lots created through NEW HARVEST (seed demo lots end at …00125).
  const newLots = lots.filter((l) => Number(l.id.split("-")[2]) > 125);
  const [newOpen, setNewOpen] = useState(false);
  const navigate = useNavigate();
  const [start, setStart] = useState(() => {
    const n = new Date();
    n.setSeconds(0, 0);
    const p = (x: number) => String(x).padStart(2, "0");
    return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}T${p(n.getHours())}:${p(n.getMinutes())}`;
  });
  const startTime = start ? new Date(start) : null;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Journey</h1>
      <button onClick={() => setNewOpen((v) => !v)} className="flex h-16 w-full items-center justify-center gap-3 rounded-xl bg-primary font-display text-xl text-primary-foreground shadow-md active:scale-[0.98]">
        <Sprout className="h-7 w-7" /> NEW HARVEST / NEW JOURNEY
      </button>
      {newOpen && (
        <div className="animate-rise rounded-xl border-2 border-primary bg-card p-4">
          <p className="font-display text-lg">When does the harvest start?</p>
          <p className="text-sm font-semibold text-muted-foreground">Pick the date and time the harvest begins — it is written into the new journey.</p>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-3 h-14 w-full rounded-xl border-2 bg-card px-3 text-lg font-bold"
          />
          <button
            onClick={() => startTime && navigate({ to: "/intake", search: { start: startTime.toISOString() } })}
            disabled={!startTime}
            className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-display text-lg text-primary-foreground disabled:opacity-50"
          >
            <Clock className="h-6 w-6" />
            START HARVEST{startTime ? ` · ${startTime.toLocaleString()}` : ""}
          </button>
        </div>
      )}

      <Link to="/journey/$lotId" params={{ lotId: LOT.id }} className="flex w-full items-center gap-3 rounded-xl border-2 border-primary bg-verified-soft p-4 text-left shadow-sm active:scale-[0.99]">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Sprout className="h-6 w-6" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg leading-tight">{FARMER.name} · Lot {LOT.id}</span>
          <span className="block text-sm font-bold text-verified">
            Now: Drying Bed {d.bed} · {d.sorted.length} records, none ever deleted
          </span>
        </span>
        <ChevronRight className="h-6 w-6 shrink-0 text-verified" />
      </Link>

      {newLots.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">New harvests</p>
          {newLots.map((l) => {
            const s = summarize(l, events);
            return (
              <Link key={l.id} to="/journey/$lotId" params={{ lotId: l.id }} className="flex w-full items-center gap-3 rounded-xl border-2 bg-card p-4 text-left shadow-sm active:scale-[0.99]">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Sprout className="h-6 w-6" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg leading-tight">{l.id}</span>
                  <span className="block text-sm font-semibold text-muted-foreground">
                    {s.receivedKg} kg · {s.stage} · {s.events.length} records
                  </span>
                </span>
                <ChevronRight className="h-6 w-6 shrink-0 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
