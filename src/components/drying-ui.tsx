import { ArrowLeftRight, BadgeCheck, Box, CloudRain, Droplets, Package, RotateCw, Search, Sprout, StickyNote, Sun, Truck, Warehouse, type LucideIcon } from "lucide-react";
import type { DType, Risk, Trust } from "@/lib/drying";
import { cn } from "@/lib/utils";

export const EVENT_ICON: Record<DType, { Icon: LucideIcon; cls: string }> = {
  INTAKE: { Icon: Search, cls: "bg-earth text-earth-foreground" },
  HARVEST: { Icon: Sprout, cls: "bg-primary text-primary-foreground" },
  COLLECTION: { Icon: Package, cls: "bg-earth text-earth-foreground" },
  WET_PROCESSING: { Icon: Droplets, cls: "bg-water text-primary-foreground" },
  DRYING_STARTED: { Icon: Sun, cls: "bg-warning text-accent-foreground" },
  BED_TURNED: { Icon: RotateCw, cls: "bg-earth text-earth-foreground" },
  INSPECTION: { Icon: Search, cls: "bg-forest text-forest-foreground" },
  WEATHER_ALERT: { Icon: CloudRain, cls: "bg-ai text-primary-foreground" },
  BED_MOVEMENT: { Icon: ArrowLeftRight, cls: "bg-cherry text-primary-foreground" },
  MOISTURE_CHECK: { Icon: Box, cls: "bg-water text-primary-foreground" },
  NOTE: { Icon: StickyNote, cls: "bg-muted text-foreground" },
  STORED: { Icon: Warehouse, cls: "bg-forest text-forest-foreground" },
  READY_TO_SELL: { Icon: BadgeCheck, cls: "bg-verified text-primary-foreground" },
  SOLD: { Icon: Truck, cls: "bg-primary text-primary-foreground" },
  WATER_CHECK: { Icon: Droplets, cls: "bg-water text-primary-foreground" },
};

export function RiskBadge({ r, className }: { r: Risk; className?: string }) {
  const cls = r === "HIGH" ? "bg-cherry text-primary-foreground" : r === "MEDIUM" ? "bg-warning text-accent-foreground" : "bg-verified text-primary-foreground";
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-display text-sm", cls, className)}>● {r} RISK</span>;
}

export function TrustTag({ t }: { t: Trust }) {
  const m = { VERIFIED: ["Recorded", "bg-verified-soft text-verified"], HUMAN_CONFIRMED: ["Checked by worker", "bg-muted text-foreground"], SIMULATED_AI: ["Simulated AI", "bg-ai/15 text-ai"] }[t];
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", m[1])}>{m[0]}</span>;
}

export function Tile({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
      <p className={cn("font-display text-xl leading-tight", tone)}>{value}</p>
    </div>
  );
}

export const STATE_CLS = {
  EMPTY: "border-dashed bg-card text-muted-foreground",
  DRYING: "border-verified bg-verified-soft text-verified",
  ATTENTION: "border-warning bg-warning-soft text-warning",
  READY: "border-primary bg-primary text-primary-foreground",
} as const;
