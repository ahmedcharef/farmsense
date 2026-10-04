import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowLeftRight, Camera, Check, Droplets, FileText, Minus, Plus, Sprout, StickyNote } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDrying } from "@/lib/drying-store";
import { useStore } from "@/lib/store";
import { FARMER, LABEL, LOT, OPERATOR, STAGES, fmt, fmtDay, type DType } from "@/lib/drying";
import { EVENT_ICON, RiskBadge, TrustTag } from "@/components/drying-ui";
import { TrustBadge } from "@/components/kit";
import { DEMO_LOT, EVENT_LABEL, STATION, fmtDate, lotEvents, summarize, type EventType, type Lot, type LotEvent } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/journey/$lotId")({
  head: ({ params }) => ({
    meta: [
      { title: `Journey ${params.lotId} — FarmSense` },
      { name: "description", content: "Every step of this coffee's journey, from harvest to drying bed." },
      { property: "og:title", content: `Journey ${params.lotId}` },
      { property: "og:description", content: "Where the coffee is now and everything that happened to it." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JourneyDetail,
});

function JourneyDetail() {
  const { lotId } = Route.useParams();
  const { lots, events, farmerName } = useStore();

  if (lotId === LOT.id) return <DryingDetail />;

  const lot = lots.find((l) => l.id === lotId);
  if (lot) return <LotDetail lot={lot} events={lotEvents(events, lot.id)} farmerName={farmerName(lot)} />;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Journey not found</h1>
      <p className="font-semibold text-muted-foreground">No journey with ID {lotId}.</p>
      <Link to="/journey" className="flex h-14 items-center justify-center gap-2 rounded-xl bg-primary font-display text-lg text-primary-foreground">
        <ArrowLeft className="h-6 w-6" /> Back to journeys
      </Link>
    </div>
  );
}

// Stage progress bar for Lot N-001 (drying store). Shows Harvest → Washed → Drying →
// Storage → Ready to sell → Moved to buyer, with a button to record the next stage.
function StageTrackerDrying() {
  const { record, d } = useDrying();
  const done = new Set(d.sorted.map((e) => e.type));
  const current = STAGES.findIndex((s) => !s.match.some((t) => done.has(t)));
  const idx = current === -1 ? STAGES.length : current; // first unfinished stage
  const next = STAGES[idx];
  const advance = () => {
    if (!next?.nextType) return;
    record({ type: next.nextType as DType, operator: OPERATOR, trust: "HUMAN_CONFIRMED", text: `${next.label} — confirmed by worker.` });
    toast.success(`${next.label} recorded`);
  };
  return (
    <section className="rounded-xl border-2 bg-card p-4">
      <p className="mb-3 text-sm font-bold text-muted-foreground">COFFEE STAGES</p>
      <ol className="space-y-2">
        {STAGES.map((s, i) => {
          const isDone = i < idx;
          const isNow = i === idx;
          return (
            <li key={s.key} className={cn("flex items-center gap-3 rounded-lg p-2", isNow && "bg-accent/40", !isDone && !isNow && "opacity-50")}>
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 font-display", isDone ? "border-verified bg-verified text-primary-foreground" : isNow ? "border-primary bg-card text-primary" : "border-muted bg-card text-muted-foreground")}>
                {isDone ? <Check className="h-5 w-5" /> : i + 1}
              </span>
              <p className="font-bold">{s.label}</p>
              {s.key === "washed" && (
                <Link to="/water" className="ml-auto flex items-center gap-1 rounded-full bg-ai px-3 py-1.5 text-xs font-bold text-primary-foreground">
                  <Droplets className="h-4 w-4" /> AI WATER CHECK
                </Link>
              )}
              {isNow && s.key !== "washed" && <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">NOW</span>}
              {isNow && s.key === "washed" && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">NOW</span>}
            </li>
          );
        })}
      </ol>
      {next ? (
        <button onClick={advance} className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-display text-lg text-primary-foreground">
          <Check className="h-6 w-6" /> MARK: {next.label.toUpperCase()}
        </button>
      ) : (
        <p className="mt-3 rounded-lg bg-verified-soft p-3 text-center font-bold text-verified">Journey complete — coffee is with the buyer.</p>
      )}
    </section>
  );
}

function NextStepDrying() {
  const { record, d } = useDrying();
  const [addingNote, setAddingNote] = useState(false);
  const [note, setNote] = useState("");
  // The recommended step follows the last record: after a move → check moisture,
  // after a moisture check → rotate to another bed.
  const lastType = d.sorted.at(-1)?.type;
  const recommended: "move" | "moisture" | null = lastType === "BED_MOVEMENT" ? "moisture" : lastType === "MOISTURE_CHECK" ? "move" : null;
  const hint = recommended === "moisture"
    ? "Coffee just moved — check the moisture."
    : recommended === "move"
      ? "Moisture checked — move the coffee to a new bed."
      : "Check the moisture, move the coffee, or add a note.";
  const saveNote = () => {
    if (!note.trim()) return;
    record({ type: "NOTE", note: note.trim(), text: note.trim(), operator: OPERATOR, trust: "HUMAN_CONFIRMED" });
    toast.success("Note added to journey");
    setNote("");
    setAddingNote(false);
  };
  return (
    <section className="rounded-xl border-2 border-primary bg-card p-4">
      <p className="mb-2 text-sm font-bold text-muted-foreground">WHAT IS THE NEXT STEP?</p>
      <p className="mb-3 rounded-lg bg-accent/40 p-2 text-sm font-bold">{hint}</p>
      <div className="grid grid-cols-3 gap-2">
        <Link to="/move" className={cn("relative flex h-20 flex-col items-center justify-center gap-1 rounded-xl border-2 bg-card text-sm font-bold", recommended === "move" && "border-primary bg-accent/30")}>
          {recommended === "move" && <span className="absolute -top-2 rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">NEXT</span>}
          <ArrowLeftRight className="h-6 w-6" /> MOVE COFFEE
        </Link>
        <Link to="/moisture" className={cn("relative flex h-20 flex-col items-center justify-center gap-1 rounded-xl border-2 bg-card text-sm font-bold", recommended === "moisture" && "border-primary bg-accent/30")}>
          {recommended === "moisture" && <span className="absolute -top-2 rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">NEXT</span>}
          <Droplets className="h-6 w-6" /> CHECK MOISTURE
        </Link>
        <button onClick={() => setAddingNote((v) => !v)} className={cn("flex h-20 flex-col items-center justify-center gap-1 rounded-xl border-2 text-sm font-bold", addingNote && "border-primary bg-accent/30")}>
          <StickyNote className="h-6 w-6" /> ADD NOTE
        </button>
      </div>
      {addingNote && (
        <div className="mt-3 space-y-2">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write note…" className="h-14 w-full rounded-xl border-2 bg-background px-3 font-semibold" />
          <button onClick={saveNote} className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-display text-lg text-primary-foreground">
            <Check className="h-6 w-6" /> SAVE NOTE
          </button>
        </div>
      )}
    </section>
  );
}

function DryingDetail() {
  const { d } = useDrying();
  return (
    <div className="space-y-4">
      <Link to="/journey" className="inline-flex h-10 items-center gap-1 font-bold text-muted-foreground">
        <ArrowLeft className="h-5 w-5" /> Back
      </Link>
      <h1 className="font-display text-3xl">Lot {LOT.id} Journey</h1>
      <p className="rounded-lg bg-verified-soft p-3 font-bold text-verified">Now: Drying Bed {d.bed} · {d.sorted.length} records, none ever deleted</p>
      <StageTrackerDrying />
      <NextStepDrying />
      <ol className="relative space-y-4 border-l-4 border-muted pl-6">
        {d.sorted.map((e) => {
          const { Icon, cls } = EVENT_ICON[e.type];
          return (
            <li key={e.id} className="relative">
              <span className={`absolute -left-[46px] grid h-10 w-10 place-items-center rounded-full ${cls}`}><Icon className="h-5 w-5" /></span>
              <div className="rounded-xl border-2 bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-muted-foreground">{fmtDay(e.ts)} · {fmt(e.ts).split(", ")[1] ?? ""}</p>
                  <TrustTag t={e.trust} />
                </div>
                <p className="font-display text-xl">{LABEL[e.type].toUpperCase()}</p>
                {e.type === "BED_MOVEMENT" && <p className="font-display text-2xl text-cherry">BED {e.from} → BED {e.to}</p>}
                {e.type === "DRYING_STARTED" && <p className="font-semibold">{e.kg} kg assigned to <b>BED {e.bed}</b></p>}
                {e.text && <p className="font-semibold">{e.text}</p>}
                {e.type === "HARVEST" && <p className="text-sm">Farm: {FARMER.farm}</p>}
                {e.kg && e.type !== "DRYING_STARTED" && <p className="text-sm font-bold">{e.kg} kg</p>}
                {e.moisture != null && <p className="font-semibold">Moisture: {e.moisture}%</p>}
                {e.risk && <RiskBadge r={e.risk} className="mt-1" />}
                {e.reason && <p className="text-sm">Reason: {e.reason}</p>}
                {e.note && <p className="text-sm italic">“{e.note}”</p>}
                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  {e.operator}{e.photo && <><Camera className="h-3.5 w-3.5" /> photo</>}{!e.synced && <span className="font-bold text-warning">· waiting for network</span>}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <Link to="/lots/$lotId" params={{ lotId: DEMO_LOT }} className="flex h-14 items-center justify-center gap-2 rounded-xl border-2 border-primary font-display text-primary">
        <FileText className="h-6 w-6" /> Full lot passport
      </Link>
    </div>
  );
}

type StepKind = "move" | "moisture" | "note" | null;

// Stage progress for new-harvest lots (passport store). Same stages, recorded as
// passport events: PROCESSING (washed), DRYING_START, STORAGE, SALE.
const LOT_STAGES: { key: string; label: string; match: EventType[]; nextType: EventType | null; notes: string }[] = [
  { key: "harvest", label: "Harvest", match: ["HARVEST"], nextType: null, notes: "" },
  { key: "washed", label: "Washed", match: ["PROCESSING", "WATER_AUDIT"], nextType: "PROCESSING", notes: "Washed processing completed." },
  { key: "drying", label: "Drying", match: ["DRYING_START"], nextType: "DRYING_START", notes: "Drying started." },
  { key: "storage", label: "In storage", match: ["STORAGE"], nextType: "STORAGE", notes: "Moved to storage." },
  { key: "ready", label: "Ready to sell", match: [], nextType: null, notes: "" },
  { key: "sold", label: "Moved to buyer", match: ["SALE"], nextType: "SALE", notes: "Coffee moved to buyer." },
];

function StageTrackerLot({ lotId, events }: { lotId: string; events: LotEvent[] }) {
  const { addEvent } = useStore();
  const done = new Set(events.map((e) => e.type));
  const current = LOT_STAGES.findIndex((s) => s.match.length > 0 && !s.match.some((t) => done.has(t)));
  const idx = current === -1 ? LOT_STAGES.length : current;
  const next = LOT_STAGES[idx];
  const advance = () => {
    if (!next?.nextType) return;
    addEvent({ lotId, type: next.nextType, timestamp: new Date().toISOString(), location: STATION, operator: OPERATOR, device: "Field phone", evidence: { kind: "manual", label: next.label }, status: "CONFIRMED", notes: next.notes });
    toast.success(`${next.label} recorded`);
  };
  return (
    <section className="rounded-xl border-2 bg-card p-4">
      <p className="mb-3 text-sm font-bold text-muted-foreground">COFFEE STAGES</p>
      <ol className="space-y-2">
        {LOT_STAGES.map((s, i) => {
          const isDone = i < idx;
          const isNow = i === idx;
          return (
            <li key={s.key} className={cn("flex items-center gap-3 rounded-lg p-2", isNow && "bg-accent/40", !isDone && !isNow && "opacity-50")}>
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 font-display", isDone ? "border-verified bg-verified text-primary-foreground" : isNow ? "border-primary bg-card text-primary" : "border-muted bg-card text-muted-foreground")}>
                {isDone ? <Check className="h-5 w-5" /> : i + 1}
              </span>
              <p className="font-bold">{s.label}</p>
              {s.key === "washed" && (
                <Link to="/water" className="ml-auto flex items-center gap-1 rounded-full bg-ai px-3 py-1.5 text-xs font-bold text-primary-foreground">
                  <Droplets className="h-4 w-4" /> AI WATER CHECK
                </Link>
              )}
              {isNow && s.key !== "washed" && <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">NOW</span>}
              {isNow && s.key === "washed" && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">NOW</span>}
            </li>
          );
        })}
      </ol>
      {next?.nextType ? (
        <button onClick={advance} className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-display text-lg text-primary-foreground">
          <Check className="h-6 w-6" /> MARK: {next.label.toUpperCase()}
        </button>
      ) : (
        <p className="mt-3 rounded-lg bg-verified-soft p-3 text-center font-bold text-verified">
          {idx >= LOT_STAGES.length ? "Journey complete — coffee is with the buyer." : "Waiting for the next stage."}
        </p>
      )}
    </section>
  );
}

function NextStepLot({ lotId }: { lotId: string }) {
  const { addEvent, events } = useStore();
  const { beds, d } = useDrying();
  // Occupied beds: N-001's current bed plus the latest bed of every other lot —
  // never offer those as a move target.
  const occupied = new Set<string>(d.bed ? [d.bed] : []);
  for (const e of events) {
    if (e.lotId !== lotId && e.data?.bed) {
      const latest = events.filter((x) => x.lotId === e.lotId && x.data?.bed).sort((a, b) => a.timestamp.localeCompare(b.timestamp)).at(-1);
      if (latest?.data?.bed) occupied.add(String(latest.data.bed));
    }
  }
  const freeBeds = beds.filter((b) => !occupied.has(b.id));
  const [step, setStep] = useState<StepKind>(null);
  const [m, setM] = useState(11);
  const [note, setNote] = useState("");
  const stepBtn = (kind: Exclude<StepKind, null>, label: string) => (
    <button onClick={() => setStep(step === kind ? null : kind)} className={cn("flex h-20 flex-col items-center justify-center gap-1 rounded-xl border-2 bg-card text-sm font-bold", step === kind && "border-primary bg-accent/30")}>
      {kind === "move" ? <ArrowLeftRight className="h-6 w-6" /> : kind === "moisture" ? <Droplets className="h-6 w-6" /> : <StickyNote className="h-6 w-6" />}
      {label}
    </button>
  );
  const moveTo = (bed: string) => {
    addEvent({ lotId, type: "DRYING_INTERVENTION", timestamp: new Date().toISOString(), location: `${STATION} · bed ${bed}`, operator: OPERATOR, device: "Field phone", evidence: { kind: "manual", label: `Moved to bed ${bed}` }, status: "CONFIRMED", notes: `Moved to bed ${bed}`, data: { bed, action: `Moved to bed ${bed}` } });
    toast.success(`Moved to bed ${bed}`);
    setStep(null);
  };
  const saveMoisture = () => {
    if (!m) return;
    addEvent({ lotId, type: "MOISTURE_CHECK", timestamp: new Date().toISOString(), location: STATION, operator: OPERATOR, device: "Field phone", evidence: { kind: "sensor", label: "Meter reading" }, status: "CONFIRMED", data: { moisture: m } });
    toast.success("Moisture saved");
    setStep(null);
  };
  const saveNote = () => {
    if (!note.trim()) return;
    addEvent({ lotId, type: "NOTE", timestamp: new Date().toISOString(), location: STATION, operator: OPERATOR, device: "Field phone", evidence: { kind: "manual", label: "Note added" }, status: "CONFIRMED", notes: note.trim() });
    toast.success("Note added to journey");
    setNote("");
    setStep(null);
  };
  return (
    <section className="rounded-xl border-2 border-primary bg-card p-4">
      <p className="mb-2 text-sm font-bold text-muted-foreground">WHAT IS THE NEXT STEP?</p>
      <div className="grid grid-cols-3 gap-2">
        {stepBtn("move", "MOVE COFFEE")}
        {stepBtn("moisture", "CHECK MOISTURE")}
        {stepBtn("note", "ADD NOTE")}
      </div>
      {step === "move" && (
        <div className="mt-3">
          <p className="mb-2 font-bold">Tap the new bed</p>
          {freeBeds.length === 0 ? (
            <p className="rounded-lg bg-muted p-3 text-center font-bold text-muted-foreground">All beds are busy — add a new bed first.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {freeBeds.map((b) => (
                <button key={b.id} onClick={() => moveTo(b.id)} className="h-16 rounded-xl border-2 bg-card font-display">
                  {b.id}<span className="block text-xs font-bold">{b.covered ? "covered" : "open"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {step === "moisture" && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-center gap-3">
            <button aria-label="Less" onClick={() => setM((x) => Math.max(5, Math.round((x - 0.1) * 10) / 10))} className="grid h-14 w-14 place-items-center rounded-xl border-2"><Minus className="h-6 w-6" /></button>
            <input type="number" step="0.1" inputMode="decimal" value={m} onChange={(e) => setM(Number(e.target.value))} className="w-28 rounded-xl border-2 bg-background p-2 text-center font-display text-3xl" />
            <button aria-label="More" onClick={() => setM((x) => Math.min(30, Math.round((x + 0.1) * 10) / 10))} className="grid h-14 w-14 place-items-center rounded-xl border-2"><Plus className="h-6 w-6" /></button>
          </div>
          <p className="text-center text-sm font-semibold text-muted-foreground">Target 10–12%</p>
          <button onClick={saveMoisture} className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-display text-lg text-primary-foreground">
            <Check className="h-6 w-6" /> SAVE MOISTURE CHECK
          </button>
        </div>
      )}
      {step === "note" && (
        <div className="mt-3 space-y-2">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write note…" className="h-14 w-full rounded-xl border-2 bg-background px-3 font-semibold" />
          <button onClick={saveNote} className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-display text-lg text-primary-foreground">
            <Check className="h-6 w-6" /> SAVE NOTE
          </button>
        </div>
      )}
    </section>
  );
}

function LotDetail({ lot, events, farmerName }: { lot: Lot; events: LotEvent[]; farmerName: string }) {
  const s = summarize(lot, events);
  return (
    <div className="space-y-4">
      <Link to="/journey" className="inline-flex h-10 items-center gap-1 font-bold text-muted-foreground">
        <ArrowLeft className="h-5 w-5" /> Back
      </Link>
      <h1 className="font-display text-3xl">{farmerName} · {lot.id}</h1>
      <p className="rounded-lg bg-muted p-3 font-bold">{s.receivedKg} kg · Stage: {s.stage} · {events.length} records</p>
      <StageTrackerLot lotId={lot.id} events={events} />
      <NextStepLot lotId={lot.id} />
      <ol className="relative space-y-4 border-l-4 border-muted pl-6">
        {events.map((e) => (
          <li key={e.id} className="relative">
            <span className="absolute -left-[46px] grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground"><Sprout className="h-5 w-5" /></span>
            <div className="rounded-xl border-2 bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-muted-foreground">{fmtDate(e.timestamp, true)}</p>
                <TrustBadge t={e.simulated ? "SIMULATED" : e.status === "VERIFIED" ? "VERIFIED" : e.status === "CONFIRMED" ? "HUMAN_CONFIRMED" : "MISSING"} />
              </div>
              <p className="font-display text-xl">{EVENT_LABEL[e.type].toUpperCase()}</p>
              <p className="text-sm font-semibold">{e.location}</p>
              {e.aiAssessment && <p className="text-sm font-semibold text-ai">{e.aiAssessment}{e.aiConfidence ? ` · ${e.aiConfidence}%` : ""}</p>}
              {e.data?.estimatedKg != null && <p className="text-sm font-bold">{e.data.estimatedKg} kg</p>}
              {e.data?.receivedKg != null && <p className="text-sm font-bold">{e.data.receivedKg} kg received{e.data.grade ? ` · Grade ${e.data.grade}` : ""}</p>}
              {e.data?.moisture != null && <p className="text-sm font-semibold">Moisture: {e.data.moisture}%</p>}
              {e.data?.bed && <p className="text-sm font-semibold">Bed {e.data.bed}</p>}
              {e.data?.action && <p className="text-sm font-semibold">{e.data.action}</p>}
              {e.notes && <p className="text-sm italic">“{e.notes}”</p>}
              <p className="mt-1 text-xs text-muted-foreground">{e.operator} · {e.device}</p>
            </div>
          </li>
        ))}
      </ol>
      <Link to="/lots/$lotId" params={{ lotId: lot.id }} className="flex h-14 items-center justify-center gap-2 rounded-xl border-2 border-primary font-display text-primary">
        <FileText className="h-6 w-6" /> Full lot passport
      </Link>
    </div>
  );
}
