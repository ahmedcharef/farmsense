import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftRight, CloudRain, CloudSun, Droplets, Grid3x3, Route as RouteIcon, Sun } from "lucide-react";
import { FARMER } from "@/lib/drying";
import { useStore } from "@/lib/store";
import { useDrying } from "@/lib/drying-store";
import { summarize } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FarmSense" },
      { name: "description", content: "See where lot N-001 is right now, which drying bed it is on, and whether drying is at risk." },
      { property: "og:title", content: "FarmSense" },
      { property: "og:description", content: "One farmer. One lot. One drying area. Every movement is recorded." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyCoffee,
});

function MyCoffee() {
  const { lots, events } = useStore();
  const { d } = useDrying();
  const avg = Math.round(lots.reduce((a, l) => a + summarize(l, events).completeness, 0) / lots.length);
  // Occupied beds: N-001's bed plus any bed holding a new-harvest lot
  const occupied = new Set<string>();
  if (d.bed) occupied.add(d.bed);
  for (const l of lots.filter((l) => Number(l.id.split("-")[2]) > 125)) {
    const withBed = events.filter((e) => e.lotId === l.id && e.data?.bed).sort((a, b) => a.timestamp.localeCompare(b.timestamp)).at(-1);
    if (withBed) occupied.add(String(withBed.data!.bed));
  }
  // Journeys: the drying lot plus every new harvest
  const journeys = 1 + lots.filter((l) => Number(l.id.split("-")[2]) > 125).length;
  const waterChecks = events.filter((e) => e.type === "WATER_AUDIT").length + 1;
  const needsAction = d.ai.riskLevel !== "LOW" ? 1 : 0;
  const dryingNow = occupied.size;
  const STATS = [
    { label: "Beds occupied", v: occupied.size, Icon: Sun, tone: "text-warning" },
    { label: "Journeys", v: journeys, Icon: RouteIcon, tone: "text-primary" },
    { label: "Water checked", v: waterChecks, Icon: Droplets, tone: "text-water" },
    { label: "Needs action", v: needsAction, Icon: CloudSun, tone: "text-destructive" },
  ];
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">{FARMER.name}'s Coffee</h1>

      <Link to="/journey" className="flex h-16 items-center justify-center gap-3 rounded-xl bg-primary font-display text-lg text-primary-foreground active:scale-[0.98]">
        <RouteIcon className="h-7 w-7" /> VIEW LOT JOURNEY
      </Link>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/move" className="flex h-16 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-card font-display text-primary active:scale-[0.98]">
          <ArrowLeftRight className="h-6 w-6" /> SCAN / MOVE
        </Link>
        <Link to="/drying" className="flex h-16 items-center justify-center gap-2 rounded-xl border-2 border-water bg-card font-display text-water active:scale-[0.98]">
          <CloudRain className="h-6 w-6" /> AI DRYING-BED GUARD
        </Link>
      </div>

      <section className="rounded-xl border-2 bg-card p-4">
        <h2 className="mb-3 font-display text-lg">Today</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATS.map(({ label, v, Icon, tone }) => (
            <div key={label} className="rounded-lg bg-muted p-3 text-center">
              <Icon className={`mx-auto h-7 w-7 ${tone}`} />
              <p className="mt-1 font-display text-2xl">{v}</p>
              <p className="text-sm font-semibold text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-verified-soft p-3 text-verified">
          <CheckMark />
          <div><p className="font-display text-lg">{avg}% recorded</p><p className="text-sm font-semibold">Coffee records are nearly complete</p></div>
        </div>
        {needsAction > 0 && (
          <Link to="/drying" className="mt-3 flex items-center gap-3 rounded-lg border-2 border-warning bg-warning-soft p-3 text-warning active:scale-[0.98]">
            <CloudSun className="h-8 w-8 shrink-0" />
            <div>
              <p className="font-display text-lg">Needs action</p>
              <p className="text-sm font-semibold">{d.ai.reason} Tap to see the AI Drying-Bed Guard.</p>
            </div>
          </Link>
        )}
      </section>

      <Link to="/tools" className="flex items-center justify-center gap-2 py-2 font-bold text-muted-foreground underline">
        <Grid3x3 className="h-5 w-5" /> More tools (quality, water, passport, help)
      </Link>
    </div>
  );
}

function CheckMark() {
  return <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-verified text-primary-foreground text-2xl font-bold">✓</span>;
}
