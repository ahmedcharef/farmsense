import { createFileRoute } from "@tanstack/react-router";
import { Bot, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { LotSelect, PageHeader, TrustBadge } from "@/components/kit";
import { lotAssistant, type AssistantAnswer } from "@/lib/ai";
import { DEMO_LOT } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/assistant")({
  validateSearch: z.object({ lot: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Ask about this lot — FarmSense" },
      { name: "description", content: "Ask questions about a coffee lot; answers separate recorded facts from AI predictions." },
      { property: "og:title", content: "Ask about this lot" },
      { property: "og:description", content: "A traceability assistant grounded in lot events." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Assistant,
});

const SUGGESTED = [
  "Summarize this lot for a buyer.",
  "Where did this coffee come from?",
  "What happened during drying?",
  "Was the water audit completed?",
  "What evidence supports the Grade A result?",
  "Are there any missing records?",
];

type Msg = { role: "user"; text: string } | { role: "ai"; a: AssistantAnswer };

function Assistant() {
  const search = Route.useSearch();
  const { getLot, events, farmerName } = useStore();
  const [lotId, setLotId] = useState(search.lot ?? DEMO_LOT);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
    return undefined;
  }, [msgs, busy]);

  const ask = async (q: string) => {
    const lot = getLot(lotId);
    if (!q.trim() || !lot || busy) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    const a = await lotAssistant(lot, farmerName(lot), events, q);
    setMsgs((m) => [...m, { role: "ai", a }]);
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Ask about this lot" sub="Answers come only from recorded lot events." eyebrow="Traceability assistant" />
      <LotSelect value={lotId} onChange={(v) => { setLotId(v); setMsgs([]); }} />
      <div className="flex flex-wrap gap-2">
        {SUGGESTED.map((s) => <button key={s} onClick={() => ask(s)} className="min-h-10 rounded-full border bg-card px-3 text-sm">{s}</button>)}
      </div>
      <div className="space-y-3">
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto flex max-w-[85%] items-start gap-2 rounded-2xl rounded-tr-sm bg-primary p-3 text-primary-foreground"><User className="mt-0.5 h-4 w-4 shrink-0" /><p>{m.text}</p></div>
          ) : (
            <div key={i} className="surface max-w-[95%] animate-rise p-4">
              <div className="mb-2 flex items-center gap-2 text-ai"><Bot className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-wide">Assistant</span><TrustBadge t="SIMULATED" /></div>
              <p className="leading-relaxed">{m.a.answer}</p>
              {m.a.facts.length > 0 && (
                <div className="mt-3"><TrustBadge t="VERIFIED" /><ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">{m.a.facts.map((f) => <li key={f}>{f}</li>)}</ul></div>
              )}
              {m.a.aiNotes.length > 0 && (
                <div className="mt-3"><TrustBadge t="AI_ASSESSMENT" /><ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">{m.a.aiNotes.map((f) => <li key={f}>{f}</li>)}</ul></div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">Based on {m.a.supportingEvents.length} lot event(s).</p>
            </div>
          ),
        )}
        {busy && <div className="surface w-24 p-3 text-center text-muted-foreground animate-pulse">…</div>}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="sticky bottom-20 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="What happened to Noor's coffee?" className="h-14 min-w-0 flex-1 rounded-2xl border bg-card px-4 shadow-lg" />
        <button className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg" aria-label="Send"><Send /></button>
      </form>
    </div>
  );
}
