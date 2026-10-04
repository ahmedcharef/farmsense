import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Share2 } from "lucide-react";
import { FakeQR } from "@/components/kit";
import { summarize } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/receipt/$lotId")({
  head: ({ params }) => ({
    meta: [
      { title: `Risiti ya Kahawa ${params.lotId}` },
      { name: "description", content: "Simple farmer receipt in Swahili for a traceable coffee lot." },
      { property: "og:title", content: `Risiti ya Kahawa — ${params.lotId}` },
      { property: "og:description", content: "Farmer coffee receipt with lot traceability." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReceiptPage,
});

function ReceiptPage() {
  const { lotId } = Route.useParams();
  const { getLot, events, farmerName } = useStore();
  const lot = getLot(lotId);
  if (!lot) return <p className="py-20 text-center">Lot not found</p>;
  const s = summarize(lot, events);
  const rows: [string, string, string][] = [
    ["Mkulima", "Farmer", farmerName(lot)],
    ["Kiasi", "Quantity", `${s.receivedKg} kg`],
    ["Daraja", "Grade", s.grade],
    ["Usindikaji", "Processing", "Washed · Imeoshwa"],
    ["Maji", "Water screening", s.water],
    ["Kukausha", "Drying", s.drying === "Complete" ? "Completed · Imekamilika" : s.drying],
    ["Unyevu", "Final moisture", s.moisture ? `${s.moisture}%` : "—"],
  ];
  return (
    <div className="mx-auto max-w-sm">
      <Link to="/lots/$lotId" params={{ lotId }} className="mb-3 inline-block text-sm text-muted-foreground">← Back to passport</Link>
      <div className="relative overflow-hidden rounded-3xl bg-card shadow-xl">
        <div className="bean-pattern bg-forest p-5 text-center text-forest-foreground">
          <p className="text-xs uppercase tracking-[0.2em] opacity-80">Mbeya Highlands Washing Station</p>
          <h1 className="mt-1 text-3xl font-extrabold">RISITI YA KAHAWA</h1>
          <p className="text-xs opacity-80">Coffee receipt</p>
        </div>
        <div className="p-5">
          <p className="text-center font-mono text-lg font-bold">{lot.id}</p>
          <div className="my-4 border-t-2 border-dashed" />
          <dl className="space-y-3">
            {rows.map(([sw, en, v]) => (
              <div key={en} className="flex items-baseline justify-between gap-3">
                <dt><span className="block font-semibold">{sw}</span><span className="text-xs text-muted-foreground">{en}</span></dt>
                <dd className="text-right font-display text-xl font-bold">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="my-4 border-t-2 border-dashed" />
          <p className="flex items-center justify-center gap-2 rounded-xl bg-verified-soft p-3 font-semibold text-verified"><CheckCircle2 className="h-5 w-5" /> Lot traceability recorded ✓</p>
          <p className="mt-1 text-center text-xs text-muted-foreground">Historia ya kahawa yako imehifadhiwa</p>
          <div className="mt-4 flex flex-col items-center gap-1">
            <FakeQR seed={lot.id} />
            <p className="text-xs text-muted-foreground">Scan to verify · QR placeholder</p>
          </div>
        </div>
      </div>
      <button onClick={() => navigator.share?.({ title: "Risiti ya Kahawa", text: `${lot.id} · ${s.receivedKg} kg · Grade ${s.grade}` }).catch(() => {})} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-earth font-semibold text-earth-foreground"><Share2 className="h-5 w-5" /> Tuma kwa mkulima · Send to farmer</button>
    </div>
  );
}
