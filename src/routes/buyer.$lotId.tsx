import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { useState } from "react";
import hero from "@/assets/drying-beds.jpg";
import { EventSheet } from "@/components/EventDetail";
import { Ring, TrustBadge } from "@/components/kit";
import { summarize, type EventType, type Trust } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/buyer/$lotId")({
  head: ({ params }) => ({
    meta: [
      { title: `Coffee Lot Traceability — ${params.lotId}` },
      { name: "description", content: "Buyer-facing traceability summary with evidence for every claim." },
      { property: "og:title", content: `Coffee Lot Traceability — ${params.lotId}` },
      { property: "og:description", content: "Origin, process, quality, water and drying — each claim linked to evidence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Buyer,
});

function Buyer() {
  const { lotId } = Route.useParams();
  const { getLot, events, farmerName } = useStore();
  const [open, setOpen] = useState<{ title: string; types: EventType[] } | null>(null);
  const lot = getLot(lotId);
  if (!lot) return <p className="py-20 text-center">Lot not found</p>;
  const s = summarize(lot, events);
  const claims: { k: string; v: string; types: EventType[]; trust: Trust[] }[] = [
    { k: "Origin", v: lot.origin, types: ["HARVEST"], trust: ["VERIFIED"] },
    { k: "Producer", v: farmerName(lot), types: ["HARVEST"], trust: ["VERIFIED"] },
    { k: "Process", v: "Washed", types: ["WATER_AUDIT", "PROCESSING"], trust: ["VERIFIED"] },
    { k: "Quality", v: `Grade ${s.grade}`, types: ["INTAKE"], trust: ["AI_ASSESSMENT", "HUMAN_CONFIRMED"] },
    { k: "Water", v: `AI visual screening: ${s.water === "CLEAN" ? "Clean" : s.water}`, types: ["WATER_AUDIT"], trust: ["AI_ASSESSMENT"] },
    { k: "Drying", v: s.drying === "Complete" ? "Completed" : s.drying, types: ["DRYING_START", "WEATHER_ALERT", "DRYING_INTERVENTION"], trust: ["VERIFIED"] },
    { k: "Final moisture", v: s.moisture ? `${s.moisture}%` : "—", types: ["MOISTURE_CHECK"], trust: ["VERIFIED"] },
  ];
  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl text-forest-foreground">
        <img src={hero} alt="" width={1536} height={864} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest to-forest/40" />
        <div className="relative flex items-end justify-between gap-4 p-6 pt-20">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">Coffee Lot Traceability</p>
            <h1 className="truncate font-mono text-2xl font-bold">{lot.id}</h1>
            <p className="text-sm opacity-85">Mbozi, Songwe · Tanzania</p>
          </div>
          <div className="text-parchment"><Ring value={s.completeness} size={84} /></div>
        </div>
      </section>
      <div className="surface divide-y">
        {claims.map((c) => (
          <button key={c.k} onClick={() => setOpen({ title: c.k, types: c.types })} className="flex w-full items-center gap-3 p-4 text-left">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-earth">{c.k}</p>
              <p className="font-display text-lg font-bold">{c.v}</p>
              <div className="mt-1 flex flex-wrap gap-1">{c.trust.map((t) => <TrustBadge key={t} t={t} />)}</div>
            </div>
            <span className="flex shrink-0 items-center text-xs font-semibold text-primary">View evidence <ChevronRight className="h-4 w-4" /></span>
          </button>
        ))}
        <div className="flex items-center justify-between p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-earth">Traceability</p>
          <p className="font-display text-2xl font-extrabold text-primary">{s.completeness}%</p>
        </div>
      </div>
      <p className="flex gap-2 rounded-2xl bg-muted p-4 text-sm text-muted-foreground"><ShieldCheck className="h-5 w-5 shrink-0" /> AI assessments are decision-support records and should be verified against original evidence where required.</p>
      <Link to="/lots/$lotId" params={{ lotId }} className="block text-center text-sm font-semibold text-primary underline">Open full Lot Passport</Link>
      <EventSheet open={!!open} onOpenChange={(v) => !v && setOpen(null)} title={open?.title ?? ""} events={s.events.filter((e) => open?.types.includes(e.type))} />
    </div>
  );
}
