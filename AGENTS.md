<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Coffee Lot Passport
- All lot history is an append-only `LotEvent` list (src/lib/data.ts); registry/passport views are derived via `summarize()` — new event types plug in without schema changes.
- AI functions live in src/lib/ai.ts with stable return contracts and are simulated; swap bodies for real models without touching UI. Photo checks (water auditor, intake grader) run simulated edge AI in the browser via src/lib/edge-water.ts and src/lib/edge-intake.ts — simple colour-rule classifiers over a 64×64 canvas; replace their classify() with real on-device models later.
- Prototype state is client-side (React context + localStorage) for offline-first behaviour; localStorage stays the offline copy; Lovable Cloud holds the shared copy (shared_state blobs for passport data and added beds, append-only drying_events, private photos bucket with signed links) so all phones see the same records.
- Field-facing screens prioritize pictorial task grids, large touch targets, and plain-language labels because the primary audience may have low literacy.
- Drying tracker (one lot, N-001) uses its own append-only event list in src/lib/drying.ts + drying-store.tsx; current bed, bed states and alerts are derived from events, never stored — so movement history can't be overwritten.
