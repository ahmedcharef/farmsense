import { createFileRoute, Link } from "@tanstack/react-router";
import { Gauge } from "lucide-react";
import { useState } from "react";
import { LotSelect, PageHeader, Row, TrustBadge } from "@/components/kit";
import { DEMO_LOT, fmtDate, lotEvents } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/quality")({
  head: () => ({
    meta: [
      { title: "Final quality check — FarmSense" },
      { name: "description", content: "Final moisture measurement with method, operator, device and evidence source." },
      { property: "og:title", content: "Final quality check" },
      { property: "og:description", content: "Final moisture measurement for the coffee lot." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Quality,
});

function Quality() {
  const { events } = useStore();
  const [lotId, setLotId] = useState(DEMO_LOT);
  const m = lotEvents(events, lotId).filter((e) => e.type === "MOISTURE_CHECK").at(-1);
  const val = m ? Number(m.data?.moisture) : null;
  const ok = val !== null && val >= 10 && val <= 12;
  return (
    <div className="space-y-5">
      <PageHeader title="Final quality" sub="Target moisture 10–12%" eyebrow="Quality" />
      <LotSelect value={lotId} onChange={setLotId} />
      {!m ? (
        <div className="rounded-3xl border-2 border-dashed border-missing/40 bg-missing-soft p-6 text-center">
          <TrustBadge t="MISSING" />
          <p className="mt-2 font-semibold text-missing">No final moisture recorded for this lot yet.</p>
        </div>
      ) : (
        <>
          <div className={`rounded-3xl p-6 text-center ${ok ? "bg-verified-soft text-verified" : "bg-warning-soft text-warning"}`}>
            <Gauge className="mx-auto h-10 w-10" />
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em]">Moisture</p>
            <p className="font-display text-6xl font-extrabold">{val}%</p>
            <p className="mt-1 font-display text-xl font-bold">{ok ? "WITHIN TARGET" : "OUTSIDE TARGET"}</p>
          </div>
          <div className="surface p-4">
            <div className="mb-2 flex flex-wrap gap-1"><TrustBadge t="VERIFIED" /><TrustBadge t="SIMULATED" /></div>
            <p className="mb-2 rounded-xl bg-muted p-3 text-sm">Source: <b>sensor-recorded</b> (moisture meter) — values are <b>simulated</b> in this prototype. No AI involved.</p>
            <Row k="Measurement method" v={String(m.data?.method ?? "Moisture meter")} />
            <Row k="Operator" v={m.operator} />
            <Row k="Timestamp" v={fmtDate(m.timestamp, true)} />
            <Row k="Location" v={m.location} />
            <Row k="Device" v={m.device} />
          </div>
          <Link to="/lots/$lotId" params={{ lotId }} className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-primary font-semibold text-primary-foreground">Open complete Lot Passport</Link>
        </>
      )}
    </div>
  );
}
