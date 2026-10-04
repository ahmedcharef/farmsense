# FarmSense — Coffee Lot Passport

Offline-first coffee traceability for smallholder farmers, washing stations, and buyers in Tanzania's Mbeya Highlands.

One farmer (Noor), one lot (`N-001` / `LOT-2026-00123`), one drying area — every movement from harvest to sale is recorded as an append-only event and rendered as a buyer-ready passport.

Built with Lovable + TanStack Start, React 19, TypeScript, Tailwind CSS 4, Supabase.

## What it does

**Lot journey & passport**
- Full farm-to-sale timeline: Harvest → Intake → Wet processing / Water audit → Drying → Moisture → Storage → Sale
- Per-lot passport (`/lots/$lotId`), buyer view (`/buyer/$lotId`), printable receipt (`/receipt/$lotId`)
- Traceability completeness score derived from events (see `STAGE_GROUPS` weights)
- Rule-based lot assistant (`/assistant`) answers where / drying / water / grade / missing questions with links to supporting events

**Field workflows (large touch targets, plain language)**
- `/` — Farmer home: bed occupancy, journeys, water checks, needs-action banner
- `/move` — Scan / move coffee between beds (append-only, history can't be overwritten)
- `/drying` — AI Drying-Bed Guard: weather + moisture → LOW/MEDIUM/HIGH risk + recommendation
- `/moisture` — Moisture checks against 10–12% target
- `/intake` — AI Intake Grader: cherry photo → Grade A/B/C + defect levels (bed selector A01–A03, B01–B03)
- `/water` — Water Auditor: effluent photo → CLEAN / WATCH / POTENTIAL HIGH RISK (+ Swahili summary)
- `/beds`, `/beds/$bedId` — Drying bed board and bed detail
- `/journey`, `/journey/$lotId` — All lots + single-lot timeline
- `/quality`, `/alerts`, `/tools` — QC, weather alerts, pictorial tool grid

**AI layer (simulated, swappable)**
- `src/lib/ai.ts` — `intakeGrader()`, `waterAuditor()`, `dryingRiskPredictor()`, `lotAssistant()` with stable return contracts. Swap bodies for real models without touching UI.
- `src/lib/edge-water.ts`, `src/lib/edge-intake.ts` — Simulated on-device classifiers (64×64 canvas colour rules). Replace `classify()` with a real TFLite/ONNX model later.

## Data model

Append-only, no overwrites:

- `LotEvent` list in `src/lib/data.ts` — every lot history entry. Registry/passport views are derived via `summarize(lot, events)`. New `EventType`s plug in without schema changes.
- Drying tracker (`N-001`) has its own event list in `src/lib/drying.ts` + `drying-store.tsx`. Current bed, bed states, and alerts are derived via `derive(events)` — never stored.
- Trust labels: `VERIFIED` / `AI_ASSESSMENT` / `HUMAN_CONFIRMED` / `MISSING` / `SIMULATED`. Anything AI-generated is marked simulated in the UI.

```
src/lib/data.ts       Lot, Farmer, Farm, LotEvent, seedData(), summarize(), STAGE_GROUPS
src/lib/drying.ts     Drying events, BEDS A01–A03 (open) / B01–B03 (covered), derive(), dryingRiskPredictor()
src/lib/store.tsx     React context + localStorage (offline copy) + Lovable Cloud sync (shared copy)
src/lib/cloud.ts      shared_state blobs (passport + beds), drying_events, photos bucket
src/lib/ai.ts         Simulated AI service layer
```

Prototype state is client-side (React context + `localStorage` key `coffee-passport-v1`) for offline-first behaviour. When online it syncs to Lovable Cloud / Supabase so all phones see the same records. Offline writes queue as `synced: false` and flush on reconnect.

## Tech stack

- TanStack Start + TanStack Router (file-based routing in `src/routes/`)
- React 19, TypeScript, Vite 8
- Tailwind CSS 4 + shadcn/ui (Radix) + Lucide icons
- TanStack Query, React Hook Form + Zod, Recharts
- Supabase (`src/integrations/supabase/`) + Drizzle ORM
- Vitest + Testing Library (`npm test`)

## Getting started

Requires Node.js + npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

| Command | What |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run build:dev` | Build in development mode |
| `npm test` / `npm run test:watch` | Run / watch Vitest suite |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |

Environment: copy `.env` values for Supabase URL / keys (see `src/integrations/supabase/client.ts`). The app runs with seed demo data (Noor's journey + lots 00118–00125) even without a backend.

## Project structure

```
src/routes/        / index, journey, lots.$lotId, buyer.$lotId, receipt.$lotId,
                     move, drying, moisture, intake, water, quality,
                     beds.index, beds.$bedId, assistant, alerts, tools
src/lib/           data.ts, drying.ts, drying-store.tsx, store.tsx,
                     ai.ts, edge-water.ts, edge-intake.ts, cloud.ts, utils.ts
src/components/    AppShell.tsx, drying-ui.tsx, kit.tsx, EventDetail.tsx, ui/*
src/integrations/supabase/  client, auth, types
src/test/          app-routing.test.tsx
supabase/ drizzle/ backend config + migrations
```

`src/routeTree.gen.ts` is auto-generated — don't edit by hand. Root layout is `src/routes/__root.tsx` (see `src/routes/README.md` for routing conventions).

## Demo data

Seeded in `src/lib/data.ts` (`seedData()`) and `src/lib/drying.ts` (`seedEvents()`):

- Hero lot `LOT-2026-00123` (Noor, 450 kg Bourbon/Kent, Mbozi) with harvest, Grade-A intake (91%), CLEAN water audit (94%), bed B07 drying, rain alert → moved under cover, 10.8% moisture, warehouse WH-02.
- 7 additional lots at different stages (storage → harvest-only) to exercise journey, alerts, and completeness views.
- Reset anytime from the UI ("Demo mode") via `loadDemo()`.

## Notes / limitations

- All AI outputs are currently simulated for the prototype and labelled as such. They are screenings, not lab grades.
- Field screens prioritize pictorial grids and large touch targets for low-literacy users.
