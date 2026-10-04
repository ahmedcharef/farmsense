import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftRight, Brain, Droplets, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { useDrying } from "@/lib/drying-store";
import { LOT, OPERATOR, TARGET, WEATHER, fmt, type BedId } from "@/lib/drying";
import { PageHeader, FakeQR } from "@/components/kit";
import { RiskBadge, Tile } from "@/components/drying-ui";

export const Route = createFileRoute("/beds/$bedId")({
  head: ({ params }) => ({
    meta: [
      { title: `Bed ${params.bedId} — FarmSense` },
      { name: "description", content: `Lot, moisture, weather and simulated AI drying risk for bed ${params.bedId}.` },
      { property: "og:title", content: `Bed ${params.bedId} — FarmSense` },
      { property: "og:description", content: "Drying bed details and AI drying risk." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BedDetail,
});

function BedDetail() {
  const { bedId } = Route.useParams();
  const { d, events, record, beds } = useDrying();
  const bed = beds.find((b) => b.id === bedId);
  if (!bed) return <p className="font-display text-xl">Bed not found.</p>;
  const here = d.bed === bed.id;
  const history = d.sorted.filter((e) => e.bed === bed.id || e.from === bed.id || e.to === bed.id);

  return (
    <div className="space-y-4">
      <PageHeader back="/beds" eyebrow={bed.covered ? "Covered bed" : "Open-air bed"} title={`BED ${bed.id}`} right={<FakeQR seed={`BED-${bed.id}`} size={64} />} />
      {!here ? (
        <div className="rounded-xl border-2 border-dashed bg-card p-6 text-center">
          <p className="font-display text-2xl text-muted-foreground">EMPTY</p>
          <p className="mt-1 font-semibold text-muted-foreground">No coffee on this bed right now.</p>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 rounded-xl border-2 bg-card p-4">
            <Tile label="Current lot" value={LOT.id} />
            <Tile label="Quantity" value={`${LOT.dryingKg} kg`} />
            <Tile label="Moisture" value={`${d.moisture}%`} tone={d.status.tone === "good" ? "text-verified" : "text-warning"} />
            <Tile label="Target" value={`${TARGET.min}–${TARGET.max}%`} />
            <Tile label="Drying started" value={d.start ? fmt(d.start.ts) : "—"} />
            <Tile label="Drying days" value={`${d.days} days`} />
            <Tile label="Last turned" value={d.lastTurn ? fmt(d.lastTurn.ts) : "—"} />
            <Tile label="Last inspection" value={d.lastCheck ? fmt(d.lastCheck.ts) : "—"} />
            <div className="col-span-2"><Tile label="Operator" value={OPERATOR} /></div>
          </section>

          <section className="simulated-stripe rounded-xl border-2 border-ai bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display text-xl"><Brain className="h-6 w-6 text-ai" /> AI Drying Risk</h2>
              <span className="rounded-full bg-ai px-2 py-0.5 text-xs font-bold text-primary-foreground">SIMULATED AI</span>
            </div>
            <div className="mt-3 flex items-center gap-3"><RiskBadge r={d.ai.riskLevel} /><span className="text-sm font-bold text-muted-foreground">{d.ai.confidence}% confidence</span></div>
            <p className="mt-3 text-lg font-semibold">{d.ai.reason}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Tile label="Rain chance" value={`${WEATHER.rainProbability}%`} />
              <Tile label="Humidity" value={`${WEATHER.humidity}%`} />
              <Tile label="Temperature" value={`${WEATHER.temperatureC}°C`} />
              <Tile label="Coffee moisture" value={`${d.moisture}%`} />
            </div>
            <p className="mt-3 rounded-lg bg-warning-soft p-3 font-bold text-warning">{d.ai.recommendation}</p>
            <p className="mt-2 text-xs text-muted-foreground">This is an AI estimate, not a measurement.</p>
          </section>

          <p className="font-display text-lg">RECORD ACTION</p>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => { record({ type: "BED_TURNED", bed: bed.id as BedId, operator: OPERATOR, trust: "HUMAN_CONFIRMED" }); toast.success("Turning recorded"); }} className="flex h-24 flex-col items-center justify-center gap-1 rounded-xl bg-earth font-bold text-earth-foreground">
              <RotateCw className="h-8 w-8" /> Turned
            </button>
            <Link to="/moisture" className="flex h-24 flex-col items-center justify-center gap-1 rounded-xl bg-water font-bold text-primary-foreground"><Droplets className="h-8 w-8" /> Moisture</Link>
            <Link to="/move" className="flex h-24 flex-col items-center justify-center gap-1 rounded-xl bg-cherry font-bold text-primary-foreground"><ArrowLeftRight className="h-8 w-8" /> Move</Link>
          </div>
        </>
      )}
      <section>
        <h2 className="mb-2 font-display text-lg">Bed history ({history.length})</h2>
        <ul className="space-y-2">
          {history.slice().reverse().map((e) => (
            <li key={e.id} className="rounded-lg border bg-card p-3 text-sm">
              <span className="font-bold">{fmt(e.ts)}</span> · {e.type === "BED_MOVEMENT" ? `Moved ${e.from} → ${e.to}` : e.type.replace("_", " ").toLowerCase()}
              {e.moisture != null && ` · ${e.moisture}%`}
            </li>
          ))}
          {history.length === 0 && <li className="text-muted-foreground">Nothing recorded yet. {events.length} records in total for this lot.</li>}
        </ul>
      </section>
    </div>
  );
}
