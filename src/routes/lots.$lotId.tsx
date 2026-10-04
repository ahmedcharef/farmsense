import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Droplets, Package, MessageCircle, Receipt, Scale, Ship, Sprout, Store, Sun, Target } from "lucide-react";
const ICONS = { HARVEST: Sprout, INTAKE: Scale, WET: Droplets, DRYING: Sun, QUALITY: Target, STORAGE: Package, SALE: Ship } as const;
import { useState } from "react";
import { EventSheet, EventTrust } from "@/components/EventDetail";
import { PageHeader, Ring } from "@/components/kit";
import { fmtDate, STAGE_GROUPS, summarize, type LotEvent } from "@/lib/data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lots/$lotId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.lotId} — Lot Passport` },
      { name: "description", content: `Verifiable journey of coffee lot ${params.lotId}, from harvest to sale.` },
      { property: "og:title", content: `${params.lotId} — Lot Passport` },
      { property: "og:description", content: "Every event, evidence and confirmation for this coffee lot." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Passport,
});

function stageSummary(key: string, evs: LotEvent[]): string[] {
  const e = evs.at(-1);
  if (!e) return [];
  switch (key) {
    case "HARVEST": return [e.notes ?? "Farm location recorded", `Est. ${e.data?.estimatedKg ?? "—"} kg`];
    case "INTAKE": return [`${e.data?.receivedKg} kg received`, `AI grade recommendation: ${e.data?.grade}`, `Human confirmation: ${e.humanConfirmation ?? "PENDING"}`];
    case "WET": return [`Water audit: ${e.data?.result}`, `AI screening confidence: ${e.aiConfidence}%`, `GPS: ${e.gps ? "recorded" : "missing"}`];
    case "DRYING": {
      const start = evs.find((x) => x.type === "DRYING_START");
      const alerts = evs.filter((x) => x.type === "WEATHER_ALERT").length;
      const act = evs.filter((x) => x.type === "DRYING_INTERVENTION").at(-1);
      return [`Drying bed: ${start?.data?.bed ?? "—"}`, `Rain-risk alerts: ${alerts}`, ...(act ? [`Action: ${act.data?.action ?? act.notes}`] : [])];
    }
    case "QUALITY": return [`Moisture: ${e.data?.moisture}%`];
    case "STORAGE": return [`Warehouse: ${e.data?.warehouse}`];
    case "SALE": return [e.notes ?? (e.status === "PENDING" ? "Buyer confirmation pending" : "Sold")];
  }
  return [];
}

function Passport() {
  const { lotId } = Route.useParams();
  const { getLot, events, farmerName } = useStore();
  const lot = getLot(lotId);
  const [open, setOpen] = useState<string | null>(null);
  if (!lot) return <div className="py-20 text-center"><p className="font-display text-2xl font-bold">Lot not found</p><Link to="/journey" className="mt-4 inline-block text-primary underline">Back to journey</Link></div>;
  const s = summarize(lot, events);
  const groups = STAGE_GROUPS.map((g) => ({ ...g, evs: s.events.filter((e) => (g.types as readonly string[]).includes(e.type)) }));
  const openGroup = groups.find((g) => g.key === open);

  return (
    <div>
      <PageHeader back="/journey" title={<span className="font-mono">{lot.id}</span>} sub={`${farmerName(lot)} · ${lot.quantityKg} kg · ${lot.origin}`} eyebrow="Lot Passport" />

      <div className="relative mb-6 overflow-hidden rounded-3xl bg-forest p-5 text-forest-foreground">
        <div className="bean-pattern absolute inset-0" />
        <div className="relative flex items-center gap-5">
          <div className="text-parchment"><Ring value={s.completeness} size={104} /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">Traceability completeness</p>
            <p className="font-display text-4xl font-extrabold">{s.completeness}%</p>
            <p className="text-sm opacity-80">Current stage: {s.stage}</p>
          </div>
        </div>
      </div>

      <ol className="relative">
        {groups.map((g, i) => {
          const latest = g.evs.at(-1);
          const missing = g.evs.length === 0;
          const pending = latest?.status === "PENDING";
          const last = i === groups.length - 1;
          const dates = g.evs.filter((e) => e.status !== "PENDING").map((e) => e.timestamp);
          const dateLabel = dates.length === 0 ? (pending ? "Pending" : "Not recorded") : dates.length > 1 && g.key === "DRYING" ? `${fmtDate(dates[0]!).replace(/ \d{4}$/, "")} – ${fmtDate(String(g.evs.find((e) => e.type === "DRYING_START")?.data?.end ?? dates.at(-1)))}` : fmtDate(dates.at(-1)!);
          return (
            <li key={g.key} className="relative flex gap-4 pb-4 animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex flex-col items-center">
                <span className={cn("z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 ", missing || pending ? "border-dashed border-muted-foreground/40 bg-muted text-muted-foreground" : "border-primary bg-card text-primary")}>{(() => { const I = ICONS[g.key]; return <I className="h-5 w-5" />; })()}</span>
                {!last && <span className={cn("w-0.5 flex-1", missing || pending ? "bg-border" : "bg-primary/40")} />}
              </div>
              <button onClick={() => setOpen(g.key)} className={cn("surface min-w-0 flex-1 p-4 text-left transition active:scale-[0.99]", (missing || pending) && "border-dashed bg-card/60")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-base font-bold uppercase tracking-wide">{g.label}</p>
                    <p className="text-xs text-muted-foreground">{dateLabel}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
                {!missing && (
                  <ul className="mt-2 space-y-0.5 text-sm">
                    {stageSummary(g.key, g.evs).map((t) => <li key={t}>{t}</li>)}
                  </ul>
                )}
                <div className="mt-3">
                  {missing ? <span className="text-xs font-semibold uppercase text-missing">Missing evidence</span> : latest && <EventTrust e={latest} />}
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Link to="/receipt/$lotId" params={{ lotId }} className="surface flex flex-col items-center gap-1 p-3 text-xs font-semibold"><Receipt className="h-6 w-6 text-earth" />Farmer receipt</Link>
        <Link to="/buyer/$lotId" params={{ lotId }} className="surface flex flex-col items-center gap-1 p-3 text-xs font-semibold"><Store className="h-6 w-6 text-primary" />Buyer view</Link>
        <Link to="/assistant" search={{ lot: lotId }} className="surface flex flex-col items-center gap-1 p-3 text-xs font-semibold"><MessageCircle className="h-6 w-6 text-ai" />Ask AI</Link>
      </div>

      <EventSheet open={!!open} onOpenChange={(v) => !v && setOpen(null)} title={openGroup?.label ?? ""} events={openGroup?.evs ?? []} />
    </div>
  );
}
