import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, Check, CloudRain, QrCode } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDrying } from "@/lib/drying-store";
import { useStore } from "@/lib/store";
import { LOT, OPERATOR, fmt, type BedId } from "@/lib/drying";
import { PageHeader } from "@/components/kit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/move")({
  head: () => ({
    meta: [
      { title: "Move Coffee — FarmSense" },
      { name: "description", content: "Scan source and destination beds to record a coffee movement." },
      { property: "og:title", content: "Move Coffee — FarmSense" },
      { property: "og:description", content: "Every physical movement creates a new record." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MoveCoffee,
});

const REASONS = [
  { v: "Rain protection", Icon: CloudRain },
  { v: "Even drying", Icon: Check },
  { v: "Bed needed", Icon: QrCode },
];

function MoveCoffee() {
  const { d, record, beds } = useDrying();
  const { events } = useStore();
  const [to, setTo] = useState<BedId | null>(null);
  const [reason, setReason] = useState("Rain protection");
  const [done, setDone] = useState(false);
  const from = d.bed;
  // Beds already holding another lot's coffee are never offered as a target.
  const occupied = new Set<string>();
  const lotIds = [...new Set(events.map((e) => e.lotId))];
  for (const id of lotIds) {
    const latest = events.filter((e) => e.lotId === id && e.data?.bed).sort((a, b) => a.timestamp.localeCompare(b.timestamp)).at(-1);
    if (latest?.data?.bed) occupied.add(String(latest.data.bed));
  }
  const free = beds.filter((b) => b.id !== from && !occupied.has(b.id));

  if (done) return (
    <div className="space-y-4 text-center">
      <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-verified text-primary-foreground"><Check className="h-14 w-14" /></span>
      <h1 className="font-display text-3xl">Coffee moved</h1>
      <p className="text-lg font-semibold">Lot {LOT.id} is now on Bed {d.bed}.</p>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/beds" className="flex h-14 items-center justify-center rounded-xl border-2 border-primary font-display text-primary">See beds</Link>
        <Link to="/journey" className="flex h-14 items-center justify-center rounded-xl bg-primary font-display text-primary-foreground">Journey</Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Move Coffee" eyebrow="Scan beds (simulated)" />
      <section className="rounded-xl border-2 bg-card p-4">
        <p className="text-sm font-bold text-muted-foreground">1 · FROM BED</p>
        <p className="font-display text-2xl">BED {from}</p>
        <p className="font-semibold">Lot {LOT.id} · {LOT.dryingKg} kg</p>
      </section>
      <ArrowDown className="mx-auto h-8 w-8 text-muted-foreground" />
      <section className="rounded-xl border-2 bg-card p-4">
        <p className="mb-2 text-sm font-bold text-muted-foreground">2 · TO BED — tap one</p>
        <div className="grid grid-cols-3 gap-2">
          {free.map((b) => (
            <button key={b.id} onClick={() => setTo(b.id)} className={cn("h-20 rounded-xl border-2 font-display", to === b.id ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
              {b.id}<span className="block text-xs font-bold">{b.covered ? "covered" : "open"}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="rounded-xl border-2 bg-card p-4">
        <p className="mb-2 text-sm font-bold text-muted-foreground">3 · WHY?</p>
        <div className="grid grid-cols-3 gap-2">
          {REASONS.map(({ v, Icon }) => (
            <button key={v} onClick={() => setReason(v)} className={cn("flex h-20 flex-col items-center justify-center gap-1 rounded-xl border-2 text-sm font-bold", reason === v ? "border-primary bg-accent/30" : "bg-card")}>
              <Icon className="h-6 w-6" />{v}
            </button>
          ))}
        </div>
      </section>
      {to && from && (
        <section className="rounded-xl border-2 border-primary bg-card p-4 font-semibold">
          <p className="font-display text-lg">MOVE COFFEE</p>
          <p>Lot {LOT.id} · {LOT.dryingKg} kg</p>
          <p className="font-display text-2xl">{from} → {to}</p>
          <p>Reason: {reason}</p>
          <p>Time: {fmt(new Date(Date.parse(d.sorted.at(-1)!.ts) + 15 * 60000).toISOString())}</p>
          <button
            onClick={() => { record({ type: "BED_MOVEMENT", from, to, reason, kg: LOT.dryingKg, operator: OPERATOR, trust: "VERIFIED" }); toast.success(`Moved ${from} → ${to}`); setDone(true); }}
            className="mt-3 flex h-16 w-full items-center justify-center gap-2 rounded-xl bg-primary font-display text-lg text-primary-foreground"
          ><Check className="h-7 w-7" /> CONFIRM MOVE</button>
        </section>
      )}
    </div>
  );
}
