import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Coffee, Grid3x3, Home, RefreshCw, Route as RouteIcon, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAlerts } from "@/components/use-alerts";
import { useStore } from "@/lib/store";

export function AppShell({ children }: { children: ReactNode }) {
  const { online, setOnline, pending, syncing } = useStore();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const alertCount = useAlerts().filter((a) => a.tone !== "good").length;
  const nav = [
    { to: "/", label: "My Coffee", Icon: Home, active: path === "/", badge: 0 },
    { to: "/beds", label: "Drying Beds", Icon: Grid3x3, active: path.startsWith("/beds"), badge: 0 },
    { to: "/journey", label: "Journey", Icon: RouteIcon, active: path === "/journey", badge: 0 },
    { to: "/alerts", label: "Alerts", Icon: Bell, active: path === "/alerts", badge: alertCount },
  ];
  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-forest text-forest-foreground"><Coffee className="h-6 w-6" /></span>
            <span className="truncate font-display text-base leading-tight">FarmSense</span>
          </Link>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOnline(!online)}
            className={cn("h-11 rounded-xl px-3 text-sm font-bold", online ? "bg-card" : "border-warning bg-warning-soft text-warning")}
            aria-label="Toggle offline mode"
          >
            {syncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : online ? <Wifi className="h-4 w-4 text-verified" /> : <WifiOff className="h-4 w-4" />}
            {syncing ? "Saving…" : online ? "Ready" : "No network"}
            {pending > 0 && <span className="rounded-full bg-warning px-1.5 text-primary-foreground">{pending}</span>}
          </Button>
        </div>
        {!online && (
          <div className="bg-warning-soft px-4 py-1.5 text-center text-xs font-medium text-warning">
            Keep working — {pending} record{pending === 1 ? "" : "s"} will save later
          </div>
        )}
      </header>
      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-4">
          {nav.map(({ to, label, Icon, active, badge }) => (
            <Link key={label} to={to} className={cn("relative flex h-18 flex-col items-center justify-center gap-1 text-sm font-bold", active ? "bg-accent/20 text-primary" : "text-muted-foreground")}>
              <Icon className="h-7 w-7" strokeWidth={active ? 3 : 2} />
              {label}
              {badge > 0 && <span className="absolute right-[22%] top-2 grid h-5 min-w-5 place-items-center rounded-full bg-cherry px-1 text-xs text-primary-foreground">{badge}</span>}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
