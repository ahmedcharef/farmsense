import { Outlet } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/journey")({
  head: () => ({
    meta: [
      { title: "Journey — FarmSense" },
      { name: "description", content: "Your coffee's journey: every step from harvest to drying bed." },
      { property: "og:title", content: "Coffee Journey" },
      { property: "og:description", content: "Where the coffee is now and everything that happened to it." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JourneyLayout,
});

function JourneyLayout() {
  return <Outlet />;
}
