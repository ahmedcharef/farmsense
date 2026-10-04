import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, Scale, Sprout, Sun, Waves } from "lucide-react";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "More tools — FarmSense" },
      { name: "description", content: "Every coffee lot has a story. We make that story verifiable — from harvest to drying to buyer." },
      { property: "og:title", content: "FarmSense" },
      { property: "og:description", content: "Every coffee lot has a story. We make that story verifiable." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const tools = [
    { to: "/intake", title: "Check quality", sub: "Look at the cherries", Icon: Scale, cls: "bg-earth text-earth-foreground" },
    { to: "/water", title: "Check water", sub: "See if water is safe", Icon: Waves, cls: "bg-water text-primary-foreground" },
    { to: "/drying", title: "Watch drying", sub: "Rain and drying warning", Icon: Sun, cls: "bg-warning text-accent-foreground" },
    { to: "/assistant", title: "Get help", sub: "Ask a question", Icon: MessageCircle, cls: "bg-ai text-primary-foreground" },
  ] as const;

  return (
    <div className="space-y-5">
      <section className="flex items-center gap-4 rounded-xl bg-forest p-5 text-forest-foreground">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-card/15"><Sprout className="h-10 w-10" /></span>
        <div><p className="text-sm font-bold opacity-80">WELCOME</p><h1 className="font-display text-2xl leading-tight">More tools</h1></div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {tools.map(({ to, title, sub, Icon, cls }) => (
          <Link key={to} to={to} className="flex min-h-40 flex-col justify-between rounded-xl border-2 bg-card p-4 shadow-sm transition active:scale-[0.97]">
            <span className={`grid h-16 w-16 place-items-center rounded-xl ${cls}`}><Icon className="h-9 w-9" strokeWidth={2.5} /></span>
            <span><span className="block font-display text-lg leading-tight">{title}</span><span className="mt-1 block text-sm font-semibold text-muted-foreground">{sub}</span></span>
            <ArrowRight className="h-6 w-6 self-end text-muted-foreground" />
          </Link>
        ))}
      </section>

    </div>
  );
}
