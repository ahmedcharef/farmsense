import { CloudOff } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EVENT_LABEL, fmtDate, type LotEvent } from "@/lib/data";
import { Row, TrustBadge } from "./kit";

export function EventTrust({ e }: { e: LotEvent }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {e.status === "PENDING" ? <TrustBadge t="MISSING" /> : <TrustBadge t="VERIFIED" />}
      {e.aiAssessment && <TrustBadge t="AI_ASSESSMENT" />}
      {e.humanConfirmation === "CONFIRMED" && <TrustBadge t="HUMAN_CONFIRMED" />}
      {e.simulated && <TrustBadge t="SIMULATED" />}
    </div>
  );
}

export function EventSheet({ events, open, onOpenChange, title }: { events: LotEvent[]; open: boolean; onOpenChange: (v: boolean) => void; title: string }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">{title} · evidence</SheetTitle>
        </SheetHeader>
        <div className="mx-auto w-full max-w-2xl space-y-4 px-4 pb-8">
          {events.length === 0 && <div className="rounded-2xl border border-dashed border-missing/40 bg-missing-soft p-4 text-sm text-missing">No record yet — this is missing evidence.</div>}
          {events.map((e) => (
            <div key={e.id} className="surface p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-display font-bold">{EVENT_LABEL[e.type]}</p>
                {!e.synced && <span className="flex items-center gap-1 text-xs text-warning"><CloudOff className="h-3 w-3" /> Waiting to sync</span>}
              </div>
              <EventTrust e={e} />
              <div className="mt-3">
                <Row k="Event ID" v={<span className="font-mono text-xs">{e.id}</span>} />
                <Row k="Date/time" v={e.status === "PENDING" ? "Pending" : fmtDate(e.timestamp, true)} />
                <Row k="Location" v={e.location} />
                {e.gps && <Row k="GPS" v={<span className="font-mono text-xs">{e.gps}</span>} />}
                <Row k="Operator" v={e.operator} />
                <Row k="Device" v={e.device} />
                {e.evidence && <Row k="Evidence" v={`${e.evidence.kind} · ${e.evidence.label}`} />}
                {e.aiAssessment && <Row k="AI assessment" v={`${e.aiAssessment}${e.aiConfidence ? ` · ${e.aiConfidence}%` : ""}`} />}
                {e.humanConfirmation && <Row k="Human confirmation" v={e.humanConfirmation} />}
                {e.data && Object.entries(e.data).map(([k, v]) => <Row key={k} k={k} v={String(v)} />)}
                <Row k="Status" v={e.status} />
                {e.notes && <Row k="Notes" v={e.notes} />}
              </div>
              {e.evidence?.image && <img src={e.evidence.image} alt="Evidence" className="mt-3 aspect-video w-full rounded-xl object-cover" />}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
