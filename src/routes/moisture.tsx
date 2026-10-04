import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Minus, Plus, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDrying } from "@/lib/drying-store";
import { LOT, OPERATOR, TARGET, moistureStatus } from "@/lib/drying";
import { PageHeader } from "@/components/kit";
import { uploadPhoto } from "@/lib/cloud";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/moisture")({
  head: () => ({
    meta: [
      { title: "Moisture Check — FarmSense" },
      { name: "description", content: "Record a moisture reading for lot N-001 against the 10–12% target." },
      { property: "og:title", content: "Moisture Check — FarmSense" },
      { property: "og:description", content: "Record moisture and see if drying is done." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Moisture,
});

function Moisture() {
  const { d, record } = useDrying();
  const [m, setM] = useState(d.moisture || 12);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const s = moistureStatus(m);
  const cls = s.tone === "good" ? "bg-verified text-primary-foreground" : s.tone === "bad" ? "bg-cherry text-primary-foreground" : "bg-warning text-accent-foreground";
  const step = (v: number) => setM((x) => Math.max(5, Math.min(30, Math.round((x + v) * 10) / 10)));

  return (
    <div className="space-y-4">
      <PageHeader title="Moisture Check" eyebrow={`Lot ${LOT.id} · Bed ${d.bed}`} />
      <section className="rounded-xl border-2 bg-card p-4 text-center">
        <p className="font-bold text-muted-foreground">MOISTURE %</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <button aria-label="Less" onClick={() => step(-0.1)} className="grid h-16 w-16 place-items-center rounded-xl border-2"><Minus className="h-8 w-8" /></button>
          <input type="number" step="0.1" inputMode="decimal" value={m} onChange={(e) => setM(Number(e.target.value))} className="w-32 rounded-xl border-2 bg-background p-2 text-center font-display text-4xl" />
          <button aria-label="More" onClick={() => step(0.1)} className="grid h-16 w-16 place-items-center rounded-xl border-2"><Plus className="h-8 w-8" /></button>
        </div>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">Target {TARGET.min}–{TARGET.max}%</p>
        <p className={cn("mt-3 rounded-lg p-3 font-display text-lg", cls)}>{s.label}</p>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <label className={cn("flex h-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 font-bold", photo && "border-verified bg-verified-soft text-verified")}>
          {photo ? <img src={photo} alt="Moisture photo" className="h-10 w-10 rounded object-cover" /> : <Camera className="h-7 w-7" />}{busy ? "Uploading…" : photo ? "Photo added" : "Take photo"}
          <input type="file" accept="image/*" capture="environment" className="hidden" disabled={busy} onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setBusy(true); try { setPhoto(await uploadPhoto(f, "moisture")); } catch { toast.error("Photo not saved — check network"); } finally { setBusy(false); } }} />
        </label>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add note (optional)" className="h-20 rounded-xl border-2 bg-card px-3 font-semibold" />
      </div>
      {saved ? (
        <Link to="/journey" className="flex h-16 items-center justify-center rounded-xl bg-primary font-display text-lg text-primary-foreground">Saved ✓ — See journey</Link>
      ) : (
        <button
          disabled={busy} onClick={() => { record({ type: "MOISTURE_CHECK", ...(d.bed ? { bed: d.bed } : {}), moisture: m, photo: !!photo, ...(photo ? { photoUrl: photo } : {}), ...(note ? { note } : {}), operator: OPERATOR, trust: "HUMAN_CONFIRMED" }); toast.success("Moisture saved"); setSaved(true); }}
          className="flex h-16 w-full items-center justify-center gap-2 rounded-xl bg-primary font-display text-lg text-primary-foreground"
        ><Save className="h-7 w-7" /> SAVE MOISTURE CHECK</button>
      )}
    </div>
  );
}
