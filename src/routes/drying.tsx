import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, CloudRain, Droplets, Hourglass, Thermometer, Wind, Zap } from "lucide-react";
import { useState } from "react";
import { BigButton, PageHeader, Row, TrustBadge } from "@/components/kit";
import { dryingRiskPredictor, type DryingRisk, type Weather } from "@/lib/ai";
import { DEMO_LOT, fmtDate, STATION, STATION_GPS } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/drying")({
  head: () => ({
    meta: [
      { title: "AI Drying-Bed Guard — FarmSense" },
      { name: "description", content: "Weather and drying-risk prediction for coffee drying beds, with recorded interventions." },
      { property: "og:title", content: "AI Drying-Bed Guard" },
      { property: "og:description", content: "Predict rain risk and record drying interventions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Drying,
});

function Drying() {
  const { addEvent, getLot } = useStore();
  const lotId = DEMO_LOT;
  const [weather, setWeather] = useState<Weather>({ temperature: 26, humidity: 58, rainProbability: 12, windKmh: 9 });
  const sensors = { moisture: 14.2, days: 3 };
  const [risk, setRisk] = useState<DryingRisk | null>(null);
  const [busy, setBusy] = useState(false);
  const [recorded, setRecorded] = useState<string | null>(null);

  const trigger = async () => {
    const w = { temperature: 24, humidity: 71, rainProbability: 78, windKmh: 18 };
    setWeather(w); setBusy(true); setRecorded(null);
    const r = await dryingRiskPredictor(w, sensors, getLot(lotId)!);
    setRisk(r); setBusy(false);
    addEvent({ lotId, type: "WEATHER_ALERT", timestamp: new Date().toISOString(), location: `${STATION} · bed B07`, gps: STATION_GPS, operator: "AI Drying Guard", device: "Weather station WS-1", evidence: { kind: "sensor", label: `Humidity ${w.humidity}% · rain prob. ${w.rainProbability}%` }, aiAssessment: `${r.riskLevel} rain risk · ${r.prediction}`, aiConfidence: r.probability, status: "VERIFIED", simulated: true });
  };
  const record = () => {
    const t = new Date().toISOString();
    addEvent({ lotId, type: "DRYING_INTERVENTION", timestamp: t, location: `${STATION} · bed B07`, gps: STATION_GPS, operator: "Station Manager", device: "Tablet T-04", evidence: { kind: "manual", label: "Action recorded by operator" }, humanConfirmation: "CONFIRMED", status: "VERIFIED", notes: "Coffee moved under cover", data: { alert: "High rain risk", action: "Coffee moved under cover" } });
    setRecorded(t);
  };

  const tiles = [
    { label: "Temperature", v: `${weather.temperature}°C`, Icon: Thermometer },
    { label: "Humidity", v: `${weather.humidity}%`, Icon: Droplets },
    { label: "Rain probability", v: `${weather.rainProbability}%`, Icon: CloudRain, hot: weather.rainProbability > 60 },
    { label: "Wind", v: `${weather.windKmh} km/h`, Icon: Wind },
    { label: "Coffee moisture", v: `${sensors.moisture}%`, Icon: Droplets },
    { label: "Drying time", v: `${sensors.days} days`, Icon: Hourglass },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="AI Drying-Bed Guard" sub="Bed B07 · live conditions (demo data)" eyebrow="Drying" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map(({ label, v, Icon, hot }) => (
          <div key={label} className={`surface p-4 ${hot ? "border-warning bg-warning-soft" : ""}`}>
            <Icon className={`h-5 w-5 ${hot ? "text-warning" : "text-earth"}`} />
            <p className="mt-2 font-display text-2xl font-bold">{v}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1"><TrustBadge t="VERIFIED" /><span className="text-xs text-muted-foreground">Sensor readings</span> <TrustBadge t="SIMULATED" /></div>

      {!risk && <BigButton variant="warning" onClick={trigger} disabled={busy}><Zap className="h-5 w-5" />{busy ? "Checking forecast…" : "Simulate weather update"}</BigButton>}

      {risk && risk.riskLevel === "HIGH" && (
        <section className="animate-rise overflow-hidden rounded-3xl border-2 border-warning bg-warning-soft">
          <div className="bg-warning p-5 text-primary-foreground">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]"><CloudRain className="h-4 w-4" /> Alert</p>
            <p className="font-display text-4xl font-extrabold">HIGH RAIN RISK</p>
          </div>
          <div className="space-y-3 p-5">
            <div className="flex gap-1"><TrustBadge t="AI_ASSESSMENT" /><TrustBadge t="SIMULATED" /></div>
            <p><span className="text-sm text-muted-foreground">AI prediction</span><br /><b className="text-lg">{risk.prediction}</b></p>
            <p><span className="text-sm text-muted-foreground">Recommended action</span><br /><b className="text-lg">{risk.recommendation}</b></p>
            {!recorded ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <BigButton onClick={record}>Record Action</BigButton>
                <BigButton variant="outline" onClick={() => setRisk(null)}>Dismiss Alert</BigButton>
              </div>
            ) : (
              <div className="surface p-4">
                <p className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-verified"><CheckCircle2 /> WEATHER INTERVENTION</p>
                <Row k="Lot" v={<span className="font-mono">{lotId}</span>} />
                <Row k="Alert" v="High rain risk" />
                <Row k="Action" v="Coffee moved under cover" />
                <Row k="Time" v={fmtDate(recorded, true)} />
                <Row k="Operator" v="Station Manager" />
                <Row k="Status" v={<TrustBadge t="VERIFIED" />} />
                <Link to="/lots/$lotId" params={{ lotId }} className="mt-3 inline-block font-semibold text-primary underline">Added to Lot Passport →</Link>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
