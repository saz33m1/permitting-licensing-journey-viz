# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

An animated, data-driven visualization showing how 114 real-world journeys (opening a restaurant, becoming a nurse, hosting a street festival, etc.) each require permits, licenses, and compliance steps scattered across **federal, state, and local government**. Part of **Catalyst** — an open-source Permitting & Licensing platform.

The visualization is an "editorial-grade" dashboard: newspaper-inspired aesthetic, a 4-phase × 3-jurisdiction matrix, Newsreader serif + IBM Plex typography, zero-radius, muted palette. See `docs/prd.html` for the product spec.

## Stack

- **SvelteKit 2** + **Svelte 5** (runes mode, global — set in `svelte.config.js`)
- **Vite 7**, **TypeScript 5**
- **Tailwind v4** (via `@tailwindcss/vite`) with design tokens in `src/app.css`
- **shadcn-svelte** primitives in `src/lib/components/ui/` (configured in `components.json`, baseColor `zinc`, registry `shadcn-svelte.com`, built on `bits-ui`)
- **GSAP** for the animated flow-path overlay
- **`@sveltejs/adapter-static`** — targets GitHub Pages as a fully static site (SPA fallback for the dynamic journey route)

## Common Commands

```bash
npm install
npm run dev           # vite dev server
npm run build         # production build
npm run preview       # preview production build
npm run check         # svelte-kit sync && svelte-check (type + diagnostics)
npm run check:watch   # continuous type check
```

There is no test runner and no linter configured. `npm run check` is the closest thing to a test gate — run it before committing non-trivial changes.

## Architecture

### Data flow

Journey data lives in `static/data/journeys.json` — a single file with four arrays:

```
jurisdictions  — federal, state, local   (3)
categories     — journey groupings       (15)
plcNodes       — permit/license/compliance node types (58)
journeys       — 114 journeys; each has steps: string[] of PLC node IDs
```

Types are declared in `src/lib/types.ts`. Note `PlcNode` carries extended metadata beyond the id/name/jurisdiction basics — `phase` (one of `preparation`/`application`/`inspection`/`active`), `agency`, `description`, `fee`, `estTime`, `renewalTerm`, `required`, `blocking`. The `phase` field is what powers the 2D matrix layout.

`src/routes/+layout.svelte` fetches `/data/journeys.json` on mount and hands the result to `app.loadData(data)`.

### State

`src/lib/stores/app.svelte.ts` is a **singleton Svelte 5 rune store**. Pattern: module-level `$state` locals + a single exported `app` object exposing getters/setters/methods. Holds:

- Selection: `active` (journey id), `selectedNode` (node id), `viewMode` (`'standard'` | `'dependency'`)
- Filters: `filterJurisdictions`, `filterCategories`, `filterSearch`
- Loaded data + indexed lookups: `journeys`, `plcNodes`, `categories`, `jurisdictions`, `nodeMap`, `catName`
- Derived: `activeJourney`, `filteredJourneys`

Also exports `JC` (jurisdiction color hex map), `PHASE_LABELS`, `PHASES`, `JURISDICTIONS_ORDER` constants that other modules reuse.

### Routes

| Route | Component | Notes |
|---|---|---|
| `/` | `HomeScreen` | Filter panel + journey list |
| `/journey/[id]` | `JourneyScreen` | 2D matrix view; invalid `[id]` redirects to `/`; Esc returns home |
| `/methodology` | static page | Explains the 4 phases, dependency ordering, sources, caveats |

`src/routes/+layout.ts` sets `prerender = true`; the dynamic `/journey/[id]` route opts out via its own `+page.ts` (`prerender = false`) and is served through the SPA fallback at build time.

### Journey view (the matrix)

`MatrixGrid` renders a 4 × 3 grid (phases × jurisdictions). `lib/utils/matrix.ts` (`computeMatrix`) bins a journey's steps into the 12 cells keyed `"${jurisdiction}-${phase}"`. Each cell contains `NodeCard`s; selecting one opens `NodeDetailPanel` (agency, fee, renewal, description, etc.).

`FlowPathOverlay` draws an animated dependency path **over** the grid: `lib/utils/pathCalc.ts` measures DOM positions via `[data-node-id]` query, builds a cubic-bezier SVG with horizontal-biased S-curves for cross-column links and offset curves for same-column links (to avoid overlaps), and GSAP animates it.

### Design tokens

Defined as CSS custom properties in `src/app.css`:

- Editorial palette: `--ink`, `--newsprint`, `--surface`, `--text`, `--muted`, `--accent`
- Jurisdiction colors: `--federal: #2A4B7C`, `--state: #4A6D5E`, `--local: #8C5A46` (also mirrored in the `JC` object in the store)
- Typography: `--font-display: 'Newsreader'`, `--font-body: 'IBM Plex Sans'`, `--font-mono: 'IBM Plex Mono'`
- Radii: all zero (intentional editorial look)
- shadcn compat tokens (`--primary`, `--border`, etc.) are aliased onto the editorial palette so shadcn components match

Custom utility classes: `.hatch-pattern`, `.vertical-text`, `.node-glow`.

### UI primitives

`src/lib/components/ui/` is **generated** by the shadcn-svelte CLI (button, input, card, dropdown-menu, sheet, sidebar, scroll-area, tooltip, badge, separator, skeleton). Prefer re-running the CLI over hand-editing these; hand edits will be overwritten on regeneration.

### Keyboard

- **Cmd/Ctrl+K** focuses the journey search input (`+layout.svelte`)
- **Esc** from a journey page returns to `/` (`journey/[id]/+page.svelte`)

## Data methodology

The 114 journeys are **archetypal** — what steps a person typically encounters across federal/state/local, not state- or city-specific. See `DATA_COLLECTION.md` for the research approach, sources, and caveats.

## Deployment

Target: **GitHub Pages** (fully static). Uses `@sveltejs/adapter-static` with `fallback: '404.html'`. Build output lands in `build/`.

Static pages (`/`, `/methodology`, `/contact`) are prerendered via `src/routes/+layout.ts` (`prerender = true`). The dynamic `/journey/[id]` route sets `prerender = false` and relies on the SPA fallback: GitHub Pages serves `404.html` (the SPA shell) for any unknown path, and the SvelteKit client router loads the requested journey.

`svelte.config.js` reads `BASE_PATH` (set by CI to `/<repo-name>`) into `kit.paths.base` so asset and route URLs resolve correctly under `https://<user>.github.io/<repo-name>/`. All internal link paths (`<a href>`, `goto(...)`, and the `fetch` of `/data/journeys.json` in `+layout.svelte`) are prefixed with `import { base } from '$app/paths'` — keep that convention when adding new routes or asset URLs.

Deploy flow: `.github/workflows/deploy.yml` runs on push to `master`, builds with `BASE_PATH=/<repo-name>`, and uploads `build/` via `actions/deploy-pages`. `static/.nojekyll` suppresses Jekyll processing so SvelteKit's `_app/` directory is served as-is.

## Repo layout

```
├── src/
│   ├── routes/                  ← /, /journey/[id], /methodology
│   ├── lib/
│   │   ├── components/          ← HomeScreen, JourneyScreen, MatrixGrid, NodeCard, NodeDetailPanel, FlowPathOverlay, TopNavbar, JourneyRow
│   │   ├── components/ui/       ← shadcn-svelte primitives (generated)
│   │   ├── stores/app.svelte.ts ← singleton rune store
│   │   ├── utils/{matrix,pathCalc}.ts
│   │   ├── hooks/is-mobile.svelte.ts
│   │   ├── types.ts
│   │   └── utils.ts             ← shadcn `cn` helper
│   ├── app.css                  ← Tailwind v4 + design tokens
│   └── app.html
├── static/data/journeys.json    ← canonical data
├── docs/prd.html                ← product spec
├── DATA_COLLECTION.md           ← data research methodology
└── {package,svelte.config,vite.config,tsconfig,components}.{json,js,ts}
```
