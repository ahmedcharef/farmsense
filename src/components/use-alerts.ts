import { useDrying } from "@/lib/drying-store";
import type { BedId } from "@/lib/drying";

export interface Alert { id: string; kind: "risk" | "moisture" | "move"; tone: "warn" | "info" | "good"; title: string; body: string; bed?: BedId | undefined }

export function useAlerts(): Alert[] {
  const { d } = useDrying();
  const out: Alert[] = [];
  if (d.ai.riskLevel !== "LOW" && d.bed)
    out.push({ id: "risk", kind: "risk", tone: "warn", title: `${d.ai.riskLevel} DRYING RISK`, body: `${d.ai.reason} ${d.ai.recommendation}`, bed: d.bed });
  if (d.status.tone !== "good")
    out.push({ id: "moist", kind: "moisture", tone: "info", title: "MOISTURE CHECK DUE", body: `Last measurement ${d.moisture}%. Check moisture again.`, bed: d.bed ?? undefined });
  d.sorted.filter((e) => e.type === "BED_MOVEMENT").reverse().forEach((e) =>
    out.push({ id: e.id, kind: "move", tone: "good", title: "MOVEMENT RECORDED", body: `${e.from} → ${e.to} · ${e.reason}`, bed: e.to }));
  return out;
}
