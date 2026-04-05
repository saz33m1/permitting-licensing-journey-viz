# Known Issues & Design Debt

## Active Issues

### Inline Data Duplication
**Status:** By design
**Impact:** File size (index.html is 53KB instead of ~28KB)

The full JSON data (~25KB) is embedded in `index.html` as a `<script type="application/json">` fallback. This means the data exists in two places: `data/journeys.json` and inline in `index.html`.

**Why:** The HTML needs to work both as a standalone file (artifact preview, direct open) and with external data (GitHub Pages, local server). The fetch-then-fallback pattern requires the inline copy.

**Risk:** They can drift. Run `python3 scripts/build-inline.py` after editing `data/journeys.json`.

### No Mobile Responsiveness
**Status:** Not implemented
**Impact:** Unusable on phones/tablets

The visualization requires a large viewport. The sidebar + SVG canvas layout breaks below ~900px width. This is acceptable for the current use case (stakeholder presentations on laptops/monitors) but limits broader distribution.

**To implement:** Hide sidebar behind a hamburger menu. Stack jurisdiction bands vertically. Show fewer nodes. Significant effort.

### Network Mode Shows No Edges
**Status:** Design choice (may revisit)
**Impact:** Low

Network mode shows all 61 nodes sized by frequency but doesn't draw the connection edges between them. V1 had edges but they created visual chaos with 114 journeys worth of connections.

**To revisit:** Could add optional edge display filtered to high-frequency connections only (e.g., edges shared by 10+ journeys). Or use a Sankey/flow layout instead.

### Steps Not Dependency-Ordered
**Status:** Data limitation
**Impact:** Low (visual only)

The `steps` array in each journey is ordered by jurisdiction level (federal → state → local), not by true dependency chain. In reality, some steps have prerequisites (e.g., EIN before state business registration) that aren't modeled.

**Future:** Add a `dependencies` field per step or a DAG structure to enable true flow visualization.

### Node Positions Don't Persist Across Journey Switches
**Status:** By design
**Impact:** Low

When switching between journeys, nodes are re-centered in each band based on how many nodes that jurisdiction has. A node like "Business License" might appear at different x-positions in different journeys. D3's update transition smoothly slides it, but it can be disorienting.

**To revisit:** Could pin commonly-used nodes to fixed positions for consistency.

## Resolved Issues

### Federal and State Colors Too Similar (V1-V2)
**Fixed in V3.** Federal was navy (#1a4480), State was teal (#0d7ea2) — both blue-ish. State changed to forest green (#1b7742).

### All 39 Nodes Visible at All Times (V1)
**Fixed in V2.** Journey-focused rendering now shows only the active journey's nodes. Others are removed from the DOM, not just dimmed.

### Expand/Collapse Buttons Overlaying Content (V3)
**Fixed.** Replaced with inline "Collapse all" text link next to search, then further replaced USWDS accordion with manual toggle buttons.
