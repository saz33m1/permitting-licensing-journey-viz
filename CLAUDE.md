# Cross-Jurisdiction Journey Visualizer

> Start here if you're an AI agent or developer picking up this project.

## What This Is

An animated, data-driven visualization showing how 114 real-world journeys (opening a restaurant, becoming a nurse, building a home addition, hosting a street festival, etc.) each require permits, licenses, and compliance steps scattered across **federal, state, and local government**. Built for stakeholder communication — making the systemic complexity of permitting undeniable.

Part of **Catalyst** — an open-source Permitting & Licensing platform for state and local governments.

## Tech Stack

| Layer | Tool | Version | Loaded via |
|-------|------|---------|-----------|
| UI framework | Custom CSS (USWDS-inspired tokens & class names) | — | Inline |
| Visualization | D3.js | 7 | CDN |
| Language | Vanilla JavaScript | ES6+ | Inline |
| Deployment | Static HTML | — | GitHub Pages |

**No build step.** No npm, no bundler, no framework. The app is a single `index.html` that loads one CDN script (D3.js) and one local JSON file.

## File Manifest

```
journey-viz/
├── index.html                  # App shell + D3 visualization + inline data fallback (53KB)
├── data/
│   ├── journeys.json           # Canonical data: 3 jurisdictions, 15 categories, 61 PLC nodes, 114 journeys (25KB)
│   └── schema.json             # JSON Schema for validating journeys.json
├── scripts/
│   ├── validate.py             # Validates journeys.json integrity (run: python3 scripts/validate.py)
│   └── build-inline.py         # Regenerates inline data fallback in index.html after editing journeys.json
├── CLAUDE.md                   # This file — AI agent context
├── ARCHITECTURE.md             # Deep technical doc of the visualization codebase
├── DATA_COLLECTION.md          # How the 114 journeys were researched and compiled
├── CONTRIBUTING.md             # How to extend the data and visualization
├── KNOWN_ISSUES.md             # Bugs, workarounds, design debt
├── README.md                   # GitHub-facing quick start
├── LICENSE                     # MIT
├── .gitignore                  # Standard ignores
└── .skill                      # Skill metadata
```

## Data Loading Strategy

The app uses a **dual loading strategy** so it works both on GitHub Pages and as a standalone HTML file:

1. **Primary:** `fetch('data/journeys.json')` — works on GitHub Pages and any local server
2. **Fallback:** `<script id="inline-data" type="application/json">` embedded in `index.html` — works when opened directly or served as a single-file artifact

The `boot()` function receives the data object from whichever source succeeds. Both paths produce identical behavior.

**After editing `data/journeys.json`**, run `python3 scripts/build-inline.py` to regenerate the inline fallback. Otherwise, the standalone HTML will use stale data.

## Data Model (Quick Reference)

**Source of truth:** `data/journeys.json`

```
{
  jurisdictions: [{ id, name }]              // 3: federal, state, local
  categories:    [{ id, name }]              // 15 journey categories
  plcNodes:      [{ id, name, jurisdiction }] // 61 PLC types (14 fed + 23 state + 24 local)
  journeys:      [{ id, name, cat, steps }]  // 114 journeys; steps = ordered PLC node IDs
}
```

**Schema:** `data/schema.json` — JSON Schema for validation.
**Validation:** `python3 scripts/validate.py` — checks referential integrity.

See `DATA_COLLECTION.md` for methodology and `CONTRIBUTING.md` for how to add data.

## Jurisdiction Colors

| Level | Color | Hex | USWDS Token |
|-------|-------|-----|-------------|
| Federal | Navy blue | #1a4480 | primary-dark |
| State | Forest green | #1b7742 | — (custom) |
| Local | Warm orange | #c05600 | accent-warm-dark |

Defined in `JC` object at top of the `<script>` block in `index.html`.

## USWDS Components Used

The app loads the full USWDS 3.13.0 CSS + JS from CDN. Components actually used:

| Component | Where | Notes |
|-----------|-------|-------|
| `usa-header--basic` | Top bar | Logo + control buttons |
| `usa-sidenav` + `usa-sidenav__sublist` | Sidebar | Journey navigation; `usa-current` for active |
| `usa-card` | Info panel | Journey detail card (floating overlay) |
| `usa-button`, `usa-button--outline` | Controls | Play, Network toggle |
| `usa-select` | Speed dropdown | Animation speed control |
| `usa-input` | Search | Journey filter in sidebar |

**Not used:** `usa-accordion` (replaced with manual toggle buttons due to CSS conflicts — see `KNOWN_ISSUES.md`).

## Three Modes

1. **Landing** — No journey selected. Three empty jurisdiction bands + centered prompt. Default state.
2. **Journey** — A journey is selected. Only that journey's PLC nodes are rendered (others hidden, not dimmed). Animated particles flow between nodes. Info card shows details.
3. **Network** — All 61 PLC nodes visible, sized by frequency across all 114 journeys. Density/heatmap view.

State transitions: Landing ↔ Journey ↔ Landing, Landing → Network → Landing, Journey → Network (deselects journey).

## Key Design Decisions

1. **Journey-focused rendering** — Only active nodes exist in the DOM. This is the core UX insight: showing all 61 nodes at once is overwhelming; showing only the 5-13 relevant ones makes each journey readable.

2. **No build step** — GitHub Pages constraint. Everything loads from CDN or is inline. Tradeoff: USWDS CSS is 510KB (includes unused components).

3. **Archetypal data, not jurisdiction-specific** — Journeys represent what's "typically" required, not what Maryland or Baltimore specifically requires. See `DATA_COLLECTION.md`.

4. **Manual sidebar toggles instead of USWDS accordion** — USWDS accordion's CSS pseudo-element icons conflicted with the compact sidebar layout. Replaced with plain `<button>` elements with text chevrons. See `KNOWN_ISSUES.md`.

## How to Extend (Summary)

| Task | Edit | Then run |
|------|------|----------|
| Add a journey | `data/journeys.json` → `journeys` array | `validate.py` then `build-inline.py` |
| Add a PLC node | `data/journeys.json` → `plcNodes` array | `validate.py` then `build-inline.py` |
| Add a category | `data/journeys.json` → `categories` array | `validate.py` then `build-inline.py` |
| Change colors | `index.html` → `JC` object | — |
| Change animation | `index.html` → `renderJourney()`, `launchP()` | — |
| Add a mode | `index.html` → new function + button handler | See `ARCHITECTURE.md` |

Full details in `CONTRIBUTING.md`.

## For AI Agents: What to Read

1. **This file** — context and orientation
2. **`ARCHITECTURE.md`** — understand the code before changing it
3. **`CONTRIBUTING.md`** — step-by-step extension instructions
4. **`KNOWN_ISSUES.md`** — avoid re-discovering solved problems
5. **`data/schema.json`** — the data contract
