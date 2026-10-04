import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, CheckCircle2, Cpu, Loader2, WifiOff } from "lucide-react";
import { useState } from "react";
import effluent from "@/assets/effluent.jpg";
import { BigButton, PageHeader, Row, TrustBadge } from "@/components/kit";
import type { WaterClass } from "@/lib/ai";
import { EDGE_STEPS, edgeWaterCheck, type EdgeResult } from "@/lib/edge-water";
import { DEMO_LOT, fmtDate, STATION, STATION_GPS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useDrying } from "@/lib/drying-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/water")({
  head: () => ({
    meta: [
      { title: "AI Wet-Mill Water Auditor — FarmSense" },
      { name: "description", content: "Screen wet-mill effluent and create a traceable audit record." },
      { property: "og:title", content: "AI Wet-Mill Water Auditor" },
      { property: "og:description", content: "Screen wet-mill effluent and create a traceable audit record." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Water,
});

const TONE: Record<WaterClass, string> = { CLEAN: "bg-water text-primary-foreground", WATCH: "bg-warning text-primary-foreground", "POTENTIAL HIGH RISK": "bg-missing text-primary-foreground" };
type Outcome = WaterClass | "AUTO";

function Water() {
  const { addEvent, online, lots } = useStore();
  const { record } = useDrying();
  const journeys = [DEMO_LOT, ...lots.filter((l) => Number(l.id.split("-")[2]) > 125).map((l) => l.id)];
  const [lotId, setLotId] = useState<string>(DEMO_LOT);
  const [img, setImg] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>("AUTO");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(-1);
  const [res, setRes] = useState<EdgeResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedJourney, setSavedJourney] = useState(false);
  const [now] = useState(() => new Date().toISOString());

  const run = async (src: string) => {
    setImg(src); setRes(null); setSaved(false); setSavedJourney(false); setBusy(true); setStep(0);
    setRes(await edgeWaterCheck(src, setStep, outcome === "AUTO" ? undefined : outcome));
    setBusy(false);
  };
  const save = () => {
    if (!res) return;
    addEvent({
      lotId, type: "WATER_AUDIT", timestamp: new Date().toISOString(), location: `${STATION} · outlet channel 1`, gps: STATION_GPS, operator: "Grace M. (wet-mill lead)", device: `Tablet T-04 · ${res.model}`,
      evidence: { kind: "photo", label: "Effluent photo" }, aiAssessment: `Edge AI visual screening (on-device): ${res.classification}`, aiConfidence: res.confidence, status: "VERIFIED", simulated: true,
      data: { result: res.classification, ...(res.riskFlags.length ? { flags: res.riskFlags.join(", ") } : {}) }, notes: "Laboratory confirmation may be required.",
    }, true);
    setSaved(true);
  };
  const saveJourney = () => {
    if (!res) return;
    if (lotId === DEMO_LOT) {
      record({
        type: "WATER_CHECK", operator: "Grace M. (wet-mill lead)", trust: "SIMULATED_AI", photo: true,
        text: `AI water check: ${res.classification} (confidence ${res.confidence}%)${res.riskFlags.length ? ` · Flags: ${res.riskFlags.join(", ")}` : ""}. Checked on this phone — simulated AI, laboratory confirmation may be required.`,
      });
    } else {
      addEvent({
        lotId, type: "WATER_AUDIT", timestamp: new Date().toISOString(), location: `${STATION} · outlet channel 1`, gps: STATION_GPS, operator: "Grace M. (wet-mill lead)", device: `Tablet T-04 · ${res.model}`,
        evidence: { kind: "photo", label: "Effluent photo" }, aiAssessment: `Edge AI visual screening (on-device): ${res.classification}`, aiConfidence: res.confidence, status: "VERIFIED", simulated: true,
        data: { result: res.classification, ...(res.riskFlags.length ? { flags: res.riskFlags.join(", ") } : {}) }, notes: "Laboratory confirmation may be required.",
      });
    }
    setSavedJourney(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="AI Wet-Mill Water Auditor" sub="Screen wet-mill effluent and create a traceable audit record." eyebrow="Wet processing" />

      <div className="surface p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Which journey is this water check for?</p>
        <div className="grid gap-2">
          {journeys.map((j) => (
            <button key={j} onClick={() => setLotId(j)} className={cn("flex min-h-14 items-center justify-between rounded-2xl border-2 px-4 font-display text-lg font-bold", lotId === j ? "border-water bg-water/10 text-foreground" : "bg-card text-muted-foreground")}>
              <span>{j === DEMO_LOT ? "Lot N-001 (Noor)" : `New harvest ${j}`}</span>
              {lotId === j && <CheckCircle2 className="h-6 w-6 text-water" />}
            </button>
          ))}
        </div>
      </div>

      <div className="surface p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Demo outcome (presenter)</p>
        <div className="grid grid-cols-4 gap-2">
          {(["AUTO", "CLEAN", "WATCH", "POTENTIAL HIGH RISK"] as Outcome[]).map((o) => (
            <button key={o} onClick={() => setOutcome(o)} className={cn("min-h-11 rounded-xl border px-2 text-xs font-bold", outcome === o ? (o === "AUTO" ? "bg-primary text-primary-foreground" : TONE[o]) : "bg-card")}>{o === "AUTO" ? "AI DECIDES" : o}</button>
          ))}
        </div>
      </div>

      {!img ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex min-h-16 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-water px-4 font-semibold text-primary-foreground">
            <Camera className="h-5 w-5" /> Capture / Upload Effluent Photo
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) run(URL.createObjectURL(f)); }} />
          </label>
          <BigButton variant="outline" onClick={() => run(effluent)}>Use demo effluent photo</BigButton>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-3xl">
          <img src={img} alt="Effluent channel" className="aspect-[4/3] w-full object-cover" />
          {busy && (
            <>
              <div className="absolute inset-x-0 top-0 h-1/4 animate-scan bg-gradient-to-b from-transparent to-water/60" />
              <div className="absolute inset-x-0 bottom-0 space-y-1 bg-foreground/80 p-3 text-sm font-semibold text-background">
                <p className="flex items-center gap-2"><Cpu className="h-4 w-4" /> Edge AI on this phone · no internet needed</p>
                {EDGE_STEPS.map((s, i) => (
                  <p key={s} className={cn("flex items-center gap-2", i > step && "opacity-40")}>
                    {i < step ? <CheckCircle2 className="h-4 w-4" /> : i === step ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="inline-block h-4 w-4" />} {s}
                  </p>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {res && (
        <section className="animate-rise space-y-4">
          <div className={cn("rounded-3xl p-5", TONE[res.classification])}>
            <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-90">Screening result · AI visual screening</p>
            <p className="font-display text-4xl font-extrabold">{res.classification}</p>
            <p className="mt-1 font-semibold">AI confidence: {res.confidence}%</p>
            {res.riskFlags.length > 0 && <p className="mt-1 text-sm opacity-90">Flags: {res.riskFlags.join(" · ")}</p>}
            <p className="mt-3 text-sm opacity-90">Laboratory confirmation may be required. An image alone does not prove legal environmental compliance.</p>
          </div>

          <div className="surface p-4">
            <p className="mb-2 flex items-center gap-2 font-display text-lg"><WifiOff className="h-5 w-5" /> Checked on this phone</p>
            <p className="mb-3 text-sm text-muted-foreground">{res.model} · {res.latencyMs} ms · photo never left the phone</p>
            {([["Brown colour", res.features.brownness], ["Dark water", res.features.darkness], ["Foam", res.features.foam], ["Cloudy", res.features.turbidity]] as const).map(([k, v]) => (
              <div key={k} className="mb-2">
                <div className="flex justify-between text-sm font-semibold"><span>{k}</span><span>{v}%</span></div>
                <div className="h-3 rounded-full bg-muted"><div className="h-3 rounded-full bg-water" style={{ width: `${Math.min(100, v)}%` }} /></div>
              </div>
            ))}
          </div>

          <p className="rounded-2xl border bg-card p-4 text-center font-display text-xl font-bold">Result: {res.classification} — confidence {res.confidence}%</p>

          <div className="surface p-4">
            <div className="mb-2 flex gap-1"><TrustBadge t="VERIFIED" /><TrustBadge t="AI_ASSESSMENT" /><TrustBadge t="SIMULATED" /></div>
            <Row k="Lot ID" v={<span className="font-mono">{lotId}</span>} />
            <Row k="Station" v={STATION} />
            <Row k="GPS" v={<span className="font-mono text-xs">{STATION_GPS}</span>} />
            <Row k="Date/time" v={fmtDate(now, true)} />
            <Row k="Operator" v="Grace M. (wet-mill lead)" />
            <Row k="Photo" v="Attached" />
            <Row k="AI result" v={res.classification} />
            <Row k="Confidence" v={`${res.confidence}%`} />
            <Row k="Sync status" v={online ? "Will sync immediately" : "Stored offline · waiting to sync"} />
          </div>

          {!savedJourney ? (
            <BigButton variant="water" onClick={saveJourney}>SAVE TO JOURNEY</BigButton>
          ) : (
            <div className="rounded-2xl bg-verified-soft p-4 text-verified">
              <p className="flex items-center gap-2 font-display text-lg font-bold"><CheckCircle2 /> SAVED TO JOURNEY ✓</p>
              <p className="text-sm">The water check now appears in {lotId === DEMO_LOT ? "Lot N-001's" : `harvest ${lotId}'s`} journey, and the Washed step is marked done.</p>
              <Link to="/journey/$lotId" params={{ lotId: DEMO_LOT }} className="mt-2 inline-block font-semibold underline">Open journey</Link>
            </div>
          )}

          {!saved ? (
            <BigButton variant="outline" onClick={save}>SAVE WATER AUDIT</BigButton>
          ) : (
            <div className="rounded-2xl bg-verified-soft p-4 text-verified">
              <p className="flex items-center gap-2 font-display text-lg font-bold"><CheckCircle2 /> WATER AUDIT SAVED ✓</p>
              <p className="text-sm">Added to Lot Passport.</p>
              <Link to="/lots/$lotId" params={{ lotId }} className="mt-2 inline-block font-semibold underline">Open passport</Link> · <Link to="/drying" className="font-semibold underline">Next: drying guard</Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
