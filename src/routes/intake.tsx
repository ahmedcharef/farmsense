import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, CheckCircle2, Cpu, Loader2, ScanLine, Sprout, WifiOff } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import cherries from "@/assets/cherries.jpg";
import { BigButton, PageHeader, TrustBadge } from "@/components/kit";
import { EDGE_INTAKE_STEPS, edgeIntakeCheck, type EdgeIntakeResult } from "@/lib/edge-intake";
import { BEDS, type BedId } from "@/lib/drying";
import { DEMO_LOT, STATION, STATION_GPS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useDrying } from "@/lib/drying-store";

export const Route = createFileRoute("/intake")({
  validateSearch: z.object({ start: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "AI Intake Grader — FarmSense" },
      { name: "description", content: "Capture a cherry sample, get an AI grade recommendation and confirm it." },
      { property: "og:title", content: "AI Intake Grader" },
      { property: "og:description", content: "Quality assessment at delivery, confirmed by the operator." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Intake,
});

function Intake() {
  const { start } = Route.useSearch();
  const { addEvent, createLot } = useStore();
  const { record } = useDrying();
  const startTime = start ? new Date(start) : null;
  const [newLotId, setNewLotId] = useState<string | null>(null);
  const [bed, setBed] = useState<BedId>("A03");
  const [img, setImg] = useState<string | null>(null);
  const [kg, setKg] = useState("438");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(-1);
  const [res, setRes] = useState<EdgeIntakeResult | null>(null);
  const [done, setDone] = useState<"confirmed" | "rejected" | null>(null);

  const analyze = async () => {
    setBusy(true); setStep(0);
    setRes(await edgeIntakeCheck(img!, setStep));
    setBusy(false);
  };
  const decide = (ok: boolean) => {
    if (!res) return;
    const timestamp = startTime ? startTime.toISOString() : new Date().toISOString();
    // New-harvest flow: create the lot first so the grade is saved against it.
    const lotId = startTime
      ? createLot({ farmerName: "Noor", farmerId: "F-NOOR", farm: "Noor's Coffee Farm, Mbozi", gps: "-9.1342, 33.4127", variety: "Arabica", quantityKg: Number(kg) || 0, harvestDate: timestamp }).id
      : DEMO_LOT;
    if (startTime) setNewLotId(lotId);
    addEvent({
      lotId, type: "INTAKE", timestamp, location: `${STATION} · intake → bed ${bed}`, gps: STATION_GPS, operator: "Amani J. (intake clerk)", device: "Scale SC-02 · Tablet T-04",
      evidence: { kind: "photo", label: "Cherry sample photo" }, aiAssessment: `Edge AI visual screening (on-device): Grade ${res.grade}`, aiConfidence: res.confidence,
      humanConfirmation: ok ? "CONFIRMED" : "REJECTED", status: ok ? "CONFIRMED" : "REJECTED", simulated: true, data: { receivedKg: Number(kg), grade: res.grade },
    });
    // Also save as its own append-only online record (one row per intake).
    record({ type: "INTAKE", ts: timestamp, bed, kg: Number(kg) || 0, operator: "Amani J. (intake clerk)", trust: ok ? "HUMAN_CONFIRMED" : "SIMULATED_AI",
      text: `AI intake grade ${res.grade} (${res.confidence}% confidence) · ${ok ? "confirmed" : "rejected"} by clerk` });
    setDone(ok ? "confirmed" : "rejected");
  };

  return (
    <div className="space-y-5">
      <PageHeader title="AI Intake Grader" sub="Quality assessment at delivery." eyebrow="Intake" />
      {startTime && (
        <p className="flex items-center gap-3 rounded-xl border-2 border-primary bg-card p-4 font-display text-lg text-primary">
          <Sprout className="h-7 w-7 shrink-0" />
          NEW HARVEST · starts {startTime.toLocaleString()}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bed</span>
          <select value={bed} onChange={(e) => setBed(e.target.value as BedId)} className="h-12 w-full rounded-xl border bg-card px-3 font-mono text-sm">
            {BEDS.map((b) => <option key={b.id} value={b.id}>{b.id} · {b.covered ? "covered" : "open"}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Weighed on scale (kg)</span>
          <input value={kg} onChange={(e) => setKg(e.target.value)} inputMode="numeric" className="h-12 w-full rounded-xl border bg-card px-3" />
        </label>
      </div>

      <section className="surface p-4">
        <p className="mb-3 font-display font-bold">Step 1 · Capture coffee sample</p>
        {img ? (
          <div className="relative overflow-hidden rounded-2xl">
            <img src={img} alt="Coffee cherry sample" className="aspect-[4/3] w-full object-cover" />
            {busy && (
              <>
                <div className="absolute inset-x-0 top-0 h-1/4 animate-scan bg-gradient-to-b from-transparent to-primary/50" />
                <div className="absolute inset-x-0 bottom-0 space-y-1 bg-foreground/80 p-3 text-sm font-semibold text-background">
                  <p className="flex items-center gap-2"><Cpu className="h-4 w-4" /> Edge AI on this phone · no internet needed</p>
                  {EDGE_INTAKE_STEPS.map((s, i) => (
                    <p key={s} className={`flex items-center gap-2 ${i > step ? "opacity-40" : ""}`}>
                      {i < step ? <CheckCircle2 className="h-4 w-4" /> : i === step ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="inline-block h-4 w-4" />} {s}
                    </p>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-sm font-medium">
              <Camera className="h-7 w-7" /> Take / upload
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setImg(URL.createObjectURL(f)); }} />
            </label>
            <button onClick={() => setImg(cherries)} className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl bg-muted text-sm font-medium">
              <img src={cherries} alt="" width={1024} height={768} loading="lazy" className="h-12 w-16 rounded-md object-cover" /> Use demo sample
            </button>
          </div>
        )}
        {img && !res && <BigButton className="mt-3" onClick={analyze} disabled={busy}><ScanLine className="h-5 w-5" />{busy ? "Analyzing sample…" : "Run AI analysis"}</BigButton>}
      </section>

      {res && (
        <section className="surface animate-rise overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b bg-ai-soft px-4 py-2">
            <p className="text-xs font-bold uppercase tracking-wide text-ai">Step 2 · AI analysis</p>
            <div className="flex gap-1"><TrustBadge t="AI_ASSESSMENT" /><TrustBadge t="SIMULATED" /></div>
          </div>
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI grade recommendation</p>
            <p className="font-display text-5xl font-extrabold text-verified">GRADE {res.grade}</p>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <li className="rounded-xl bg-muted p-3"><span className="block text-muted-foreground">Estimated quality</span><b>{res.estimatedQuality}</b></li>
              {res.detectedIssues.map((d) => <li key={d.label} className="rounded-xl bg-muted p-3"><span className="block text-muted-foreground">{d.label}</span><b>{d.level}</b></li>)}
            </ul>
            <div className="mt-4 rounded-xl border-2 border-ai/30 bg-ai-soft p-3">
              <p className="mb-2 flex items-center gap-2 font-display text-base"><WifiOff className="h-5 w-5" /> Checked on this phone</p>
              <p className="mb-3 text-sm text-ai">{res.model} · {res.latencyMs} ms · photo never left the phone</p>
              {([["Ripe red cherries", res.features.redness], ["Underripe green", res.features.underripe], ["Dark / damaged spots", res.features.darkSpots]] as const).map(([k, v]) => (
                <div key={k} className="mb-2">
                  <div className="flex justify-between text-sm font-semibold"><span>{k}</span><span>{v}%</span></div>
                  <div className="h-3 rounded-full bg-muted"><div className="h-3 rounded-full bg-ai" style={{ width: `${Math.min(100, v)}%` }} /></div>
                </div>
              ))}
            </div>
            <p className="mt-3 font-semibold">AI confidence: {res.confidence}%</p>
            <p className="mt-2 rounded-xl border border-ai/30 bg-ai-soft p-3 text-sm font-medium text-ai">AI assessment — requires operator confirmation</p>
            {!done ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <BigButton onClick={() => decide(true)}>Confirm Grade {res.grade}</BigButton>
                <BigButton variant="outline" onClick={() => decide(false)}>Reject / Reassess</BigButton>
              </div>
            ) : done === "confirmed" ? (
              <div className="mt-4 rounded-2xl bg-verified-soft p-4 text-verified">
                <p className="flex items-center gap-2 font-display text-lg font-bold"><CheckCircle2 /> HUMAN CONFIRMATION ✓</p>
                <p className="text-sm">{newLotId ? `New harvest lot ${newLotId} created and saved online.` : "Intake event added to the Lot Passport."}</p>
                <Link to="/lots/$lotId" params={{ lotId: newLotId ?? DEMO_LOT }} className="mt-2 inline-block font-semibold underline">Open passport</Link> · <Link to="/water" className="font-semibold underline">Next: water audit</Link>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-missing-soft p-4 text-missing">
                <p className="font-bold">AI grade rejected — recorded for reassessment.</p>
                <button className="mt-2 font-semibold underline" onClick={() => { setRes(null); setDone(null); }}>Capture a new sample</button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
