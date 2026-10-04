import { Link } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Bot, CircleAlert, FlaskConical, UserCheck } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Trust } from "@/lib/data";
import { useStore } from "@/lib/store";

const TRUST: Record<Trust, { label: string; cls: string; Icon: typeof BadgeCheck }> = {
  VERIFIED: { label: "Verified", cls: "bg-verified-soft text-verified border-verified/30", Icon: BadgeCheck },
  AI_ASSESSMENT: { label: "AI assessment", cls: "bg-ai-soft text-ai border-ai/30", Icon: Bot },
  HUMAN_CONFIRMED: { label: "Human confirmed", cls: "bg-accent text-accent-foreground border-primary/30", Icon: UserCheck },
  MISSING: { label: "Missing", cls: "bg-missing-soft text-missing border-missing/30 border-dashed", Icon: CircleAlert },
  SIMULATED: { label: "Simulated", cls: "simulated-stripe bg-muted text-muted-foreground border-border", Icon: FlaskConical },
};

export function TrustBadge({ t, className }: { t: Trust; className?: string }) {
  const { label, cls, Icon } = TRUST[t];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", cls, className)}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

export function TrustLegend() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.keys(TRUST) as Trust[]).map((t) => <TrustBadge key={t} t={t} />)}
    </div>
  );
}

const TONE: Record<string, string> = {
  CLEAN: "bg-water-soft text-water",
  WATCH: "bg-warning-soft text-warning",
  "POTENTIAL HIGH RISK": "bg-missing-soft text-missing",
  Complete: "bg-verified-soft text-verified",
  "In progress": "bg-warning-soft text-warning",
  A: "bg-verified-soft text-verified",
  B: "bg-secondary text-secondary-foreground",
  C: "bg-warning-soft text-warning",
};
export function Pill({ v }: { v: string }) {
  return <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-semibold", TONE[v] ?? "bg-muted text-muted-foreground")}>{v}</span>;
}

export function PageHeader({ title, sub, back = "/", right, eyebrow }: { title: ReactNode; sub?: ReactNode; back?: string; right?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
      <div className="min-w-0">
        <Link to={back} className="mb-2 inline-flex h-9 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-earth">{eyebrow}</p>}
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Ring({ value, size = 96, label = true }: { value: number; size?: number; label?: boolean }) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={8} className="stroke-current opacity-15" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={8} strokeLinecap="round" className="stroke-current transition-all duration-700" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      {label && <span className="absolute inset-0 grid place-items-center font-display text-xl font-bold">{value}%</span>}
    </div>
  );
}

export function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}

export function LotSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { lots, farmerName } = useStore();
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lot</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-full rounded-xl border bg-card px-3 font-mono text-sm">
        {lots.map((l) => <option key={l.id} value={l.id}>{l.id} · {farmerName(l)}</option>)}
      </select>
    </label>
  );
}

// Deterministic decorative QR placeholder
export function FakeQR({ seed, size = 132 }: { seed: string; size?: number }) {
  const n = 21;
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const cells: boolean[] = [];
  for (let i = 0; i < n * n; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    cells.push(((h >> 16) & 1) === 1);
  }
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  const s = size / n;
  return (
    <svg width={size} height={size} className="rounded-md bg-card p-1 text-foreground" viewBox={`0 0 ${size} ${size}`}>
      {cells.map((on, i) => {
        const x = i % n, y = Math.floor(i / n);
        if (finder(x, y)) return null;
        return on ? <rect key={i} x={x * s} y={y * s} width={s} height={s} className="fill-current" /> : null;
      })}
      {([[0, 0], [n - 7, 0], [0, n - 7]] as [number, number][]).map(([x, y]) => (
        <g key={`${x}-${y}`} className="fill-current">
          <rect x={x * s} y={y * s} width={7 * s} height={7 * s} />
          <rect x={(x + 1) * s} y={(y + 1) * s} width={5 * s} height={5 * s} className="fill-card" />
          <rect x={(x + 2) * s} y={(y + 2) * s} width={3 * s} height={3 * s} />
        </g>
      ))}
    </svg>
  );
}

export function BigButton({ children, className, variant = "primary", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "water" | "warning" | "earth" }) {
  const v = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border-2 bg-card text-foreground hover:bg-muted",
    water: "bg-water text-primary-foreground hover:bg-water/90",
    warning: "bg-warning text-primary-foreground hover:bg-warning/90",
    earth: "bg-earth text-earth-foreground hover:bg-earth/90",
  }[variant];
  return (
    <button {...p} className={cn("inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 text-base font-semibold transition active:scale-[0.98] disabled:opacity-50", v, className)}>
      {children}
    </button>
  );
}
