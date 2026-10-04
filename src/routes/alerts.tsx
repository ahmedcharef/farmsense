import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeftRight, Droplets, type LucideIcon } from "lucide-react";
import { useDrying } from "@/lib/drying-store";
import { LOT, TARGET } from "@/lib/drying";
import { useAlerts } from "@/components/use-alerts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — FarmSense" },
      { name: "description", content: "Drying risk, moisture checks due and recorded movements for lot N-001." },
      { property: "og:title", content: "Alerts — FarmSense" },
      { property: "og:description", content: "What needs attention on the drying beds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Alerts,
});

const ICONS: Record<"risk" | "moisture" | "move", LucideIcon> = { risk: AlertTriangle, moisture: Droplets, move: ArrowLeftRight };
const TONES = { warn: "border-warning bg-warning-soft", info: "border-water bg-card", good: "border-verified bg-verified-soft" };

function Alerts() {
  const { d } = useDrying();
  const alerts = useAlerts();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Alerts</h1>
      {alerts.length === 0 && <p className="rounded-xl bg-verified-soft p-4 font-bold text-verified">All good. Nothing needs attention.</p>}
      {alerts.map((a) => {
        const Icon = ICONS[a.kind];
        return (
          <Link key={a.id} to={a.bed ? "/beds/$bedId" : "/journey"} params={{ bedId: a.bed ?? "" }} className={cn("flex gap-4 rounded-xl border-2 p-4", TONES[a.tone])}>
            <Icon className="h-10 w-10 shrink-0" />
            <div className="min-w-0">
              <p className="font-display text-lg">{a.title}</p>
              <p className="text-sm font-bold">Lot {LOT.id}{a.bed && ` · Bed ${a.bed}`}</p>
              <p className="font-semibold">{a.body}</p>
            </div>
          </Link>
        );
      })}
      <p className="text-sm text-muted-foreground">Target moisture {TARGET.min}–{TARGET.max}%. Last reading {d.moisture}%. Risk alerts come from simulated AI.</p>
    </div>
  );
}
