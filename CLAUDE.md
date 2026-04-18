# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

An animated, data-driven visualization showing how 114 real-world journeys (opening a restaurant, becoming a nurse, hosting a street festival, etc.) each require permits, licenses, and compliance steps scattered across **federal, state, and local government**. Part of **Catalyst** — an open-source Permitting & Licensing platform.

## Two Apps Coexist In This Repo

This is the single most important thing to understand. The repo contains **two independent implementations** of the same visualization, sharing only the journeys dataset as a concept (not as a file — see below).

| | Legacy (root) | SvelteKit (`svelte-app/`) |
|---|---|---|
| Entry | `index.html` | `svelte-app/src/routes/+page.svelte` |
| Stack | Vanilla JS + D3.js v7 + USWDS (CDN) | SvelteKit 2 + Svelte 5 (runes) + Vite 7 + Tailwind v4 + shadcn-svelte + GSAP |
| Build | None — static HTML | `npm run build` |
| Deploy target | GitHub Pages (live at saz33m1.github.io/...) | Not yet deployed; `adapter-auto` |
| Data file | `data/journeys.json` | `svelte-app/static/data/journeys.json` |
| PLC node shape | `{id, name, jurisdiction}` | Extended: `+{phase, agency, description, fee, estTime, renewalTerm, required, blocking}` |
| Layout axis | Jurisdiction bands (1D) | Jurisdiction × Phase matrix (2D) |

**The two `journeys.json` files have diverged.** They have the same journeys/categories/jurisdictions, but the SvelteKit copy carries extra per-node metadata that the legacy copy doesn't. There is no sync script — treat them as separate datasets maintained independently.

When the user says "the app," ask or infer which one they mean. Changes to one generally do **not** propagate to the other.

## Common Commands

### Legacy (repo root)

```bash
# Serve locally (no build)
python3 -m http.server 8000

# Validate data integrity
python3 scripts/validate.py [--verbose]

# Regenerate the inline data fallback inside index.html after editing data/journeys.json
python3 scripts/build-inline.py
```

The legacy app uses a **dual data-loading strategy**: `fetch('data/journeys.json')` first, then falls back to a `<script type="application/json" id="inline-data">` block embedded in `index.html`. Editing `data/journeys.json` without running `build-inline.py` leaves the inline fallback stale, which is what standalone/file:// opens use.

### SvelteKit (`svelte-app/`)

```bash
cd svelte-app
npm install
npm run dev           # vite dev server
npm run build         # production build
npm run preview       # preview production build
npm run check         # svelte-kit sync && svelte-check (type + diagnostics)
npm run check:watch   # continuous type check
```

There are no tests or linter configs. `check` is the closest thing to a test command.

## Data Model (Both Apps)

**Counts as of writing:** 3 jurisdictions, 15 categories, 58 plcNodes, 114 journeys. (The README says "115 journeys, 59 PLC types" — it's stale; trust the JSON.)

```
jurisdictions  — federal, state, local
categories     — 15 journey groupings (food, health, construction, …)
plcNodes       — 58 permit/license/compliance node types
journeys       — 114 journeys; each has steps: string[] of PLC node IDs
```

The legacy schema is authoritative at `data/schema.json`. The SvelteKit extended shape is declared in `svelte-app/src/lib/types.ts`. `scripts/validate.py` only validates the legacy file.

## Jurisdiction Colors (Differ Between Apps)

| Level | Legacy (`index.html` → `JC` object) | SvelteKit (`src/app.css` + `src/lib/stores/app.svelte.ts`) |
|---|---|---|
| Federal | `#1a4480` (USWDS navy) | `#2A4B7C` |
| State   | `#1b7742` (forest green) | `#4A6D5E` |
| Local   | `#c05600` (warm orange) | `#8C5A46` |

The SvelteKit palette is a muted "editorial" redesign (Newsreader serif + IBM Plex Sans/Mono, zero-radius, newsprint background). Don't cross-apply legacy colors to it.

## SvelteKit Architecture Notes

- **Data load:** `src/routes/+layout.svelte` fetches `/data/journeys.json` (served from `static/`) on mount and calls `app.loadData(data)`.
- **State:** `src/lib/stores/app.svelte.ts` is a singleton Svelte 5 rune store. Module-level `$state` locals + an exported `app` object with getters/setters. Holds selection (`active`, `selectedNode`), filters, loaded data, and derived `activeJourney` / `filteredJourneys`.
- **Routes:** `/` (HomeScreen filter + list), `/journey/[id]` (JourneyScreen; invalid ID redirects to `/`), `/methodology` (static page). The `[id]` route is not prerendered — the adapter is `adapter-auto` with no `prerender` config.
- **Journey view structure:** The 4 phases × 3 jurisdictions form a 12-cell matrix. `lib/utils/matrix.ts` bins steps into cells. `MatrixGrid` renders cells of `NodeCard`s. `FlowPathOverlay` uses GSAP + `lib/utils/pathCalc.ts` (DOM measurement via `[data-node-id]` + cubic-bezier SVG) to animate the dependency path over the grid.
- **UI primitives:** `src/lib/components/ui/` is shadcn-svelte (configured in `components.json`, baseColor `zinc`, registry `shadcn-svelte.com`). `bits-ui` provides the headless behavior. Don't hand-edit these — re-generate via the shadcn CLI when you need to.
- **Cmd/Ctrl+K** focuses the search input (handler in `+layout.svelte`).

## Legacy Architecture Notes

All logic is inline in `index.html`. State lives in a single `S` object; modes are Landing / Journey / Network. Only the active journey's nodes are rendered (others removed from DOM, not dimmed) — this is an intentional UX decision. See `ARCHITECTURE.md` for the full render pipeline, animation loop, and D3 patterns used. See `KNOWN_ISSUES.md` before "fixing" things that look broken (e.g., network-mode has no edges by design; mobile is not responsive by design).

## Which App To Work On

- If the task is about the **live GitHub Pages demo**, the D3 viz, USWDS layout, or anything referenced in `ARCHITECTURE.md` / `CONTRIBUTING.md` / `KNOWN_ISSUES.md` → **legacy**.
- If the task mentions **Svelte**, **shadcn**, **Tailwind**, **routes**, **phases**, **matrix grid**, or **NodeDetailPanel** → **SvelteKit**.
- If unclear, ask. `CONTRIBUTING.md` was written for the legacy app only.

## Deployment

- Legacy: GitHub Pages, root of `main`. Already live.
- SvelteKit: not deployed. `adapter-auto` is currently the default — swap in `adapter-static` (plus `prerender = true` and an `entries()` export on `/journey/[id]`) for free static hosting (Cloudflare Pages, GitHub Pages, Netlify), or use a platform adapter for SSR hosts.

## Repo Layout

```
/                        ← legacy app
├── index.html           ← full app (HTML + CSS + JS + inline data fallback, ~70KB)
├── data/{journeys,schema}.json
├── scripts/{validate,build-inline}.py
├── docs/prd.html
├── ARCHITECTURE.md, CONTRIBUTING.md, DATA_COLLECTION.md, KNOWN_ISSUES.md, README.md
└── svelte-app/          ← SvelteKit rewrite
    ├── src/
    │   ├── routes/      ← /, /journey/[id], /methodology
    │   ├── lib/
    │   │   ├── components/       ← app components (HomeScreen, JourneyScreen, MatrixGrid, …)
    │   │   ├── components/ui/    ← shadcn-svelte primitives
    │   │   ├── stores/app.svelte.ts
    │   │   ├── utils/{matrix,pathCalc}.ts
    │   │   └── types.ts
    │   ├── app.css      ← Tailwind v4 + design tokens
    │   └── app.html
    ├── static/data/journeys.json   ← SvelteKit's own data copy
    └── {package,svelte.config,vite.config,tsconfig}.*
```
