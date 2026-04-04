# Architecture

Deep technical documentation of the visualization codebase in `index.html`.

## Overview

The entire application lives in a single HTML file with three sections:
1. **`<style>`** — CSS for layout, USWDS overrides, and visualization-specific styling
2. **`<body>`** — USWDS-based HTML structure (header, sidebar, viz canvas, overlays)
3. **`<script>`** — All application logic: data loading, D3 rendering, animation, interaction

## HTML Structure

```
<header class="usa-header usa-header--basic">     ← USWDS header with logo + controls
<div class="app-body">                              ← Full-height flex container
  <aside class="app-sidebar">                       ← Fixed-width sidebar (300px)
    <div class="sidebar-top">                        ← Search input + collapse toggle
    <div class="sidebar-body" id="sidebar-body">     ← Dynamically built journey list
  </aside>
  <div class="viz-wrap" id="viz-wrap">              ← Flex-grow visualization area
    <svg id="viz">                                   ← D3-managed SVG canvas
    <div class="landing" id="landing">               ← Landing state overlay
    <div class="info-card" id="info-panel">          ← Journey detail card (absolute positioned)
    <div class="net-stats" id="net-stats">           ← Network mode stats bar
    <div class="tip" id="tip">                       ← Hover tooltip
  </div>
</div>
```

## State Management

All application state lives in a single object `S`:

```javascript
const S = {
  active: null,     // Currently selected journey ID (string) or null
  network: false,   // Network mode on/off
  playing: false,   // Auto-play running
  playIdx: 0,       // Current position in auto-play sequence
  playTimer: null,   // setTimeout handle for auto-play
  speed: 1400,      // Animation speed in ms (controlled by dropdown)
  W: 0, H: 0,      // Current SVG dimensions
  bands: {}         // Computed band positions: { federal: {y, h}, state: {y, h}, local: {y, h} }
};
```

Mode transitions:
```
Landing ──selectJourney()──→ Journey
Landing ──toggleNetwork()──→ Network
Journey ──deselect()──────→ Landing
Journey ──toggleNetwork()──→ Network (deselects journey)
Network ──toggleNetwork()──→ Landing
Network ──selectJourney()──→ Journey (exits network)
```

## Rendering Pipeline

### On resize / init:

```
resize()
  ├── Update S.W, S.H from container dimensions
  ├── svg.attr('width', S.W).attr('height', S.H)
  ├── Compute band positions (3 equal bands with 4px gaps)
  ├── renderBase()
  │     ├── Clear SVG
  │     ├── Create <defs>: glow filters per jurisdiction + particle glow
  │     ├── Draw 3 jurisdiction band backgrounds (rect + label)
  │     └── Create empty groups: #conns, #particles, #nodes
  └── Re-render current state (journey or network)
```

### On journey selection:

```
selectJourney(id)
  ├── Update S.active
  ├── Update sidebar (.usa-current class)
  ├── renderJourney(journey, animate=true)
  │     ├── Hide landing overlay
  │     ├── Filter PLC_NODES to only this journey's steps
  │     ├── Group by jurisdiction
  │     ├── Measure text widths (canvas 2D context)
  │     ├── Position nodes centered in each band (generous spacing)
  │     ├── D3 data join on #nodes group:
  │     │     ├── EXIT: fade out + scale down removed nodes
  │     │     ├── ENTER: create <g> with <rect> + <text>, animate in (scale + fade)
  │     │     └── UPDATE: transition existing nodes to new positions
  │     ├── drawConns(journey, animate)
  │     │     ├── Clear #conns
  │     │     └── For each consecutive step pair: draw curved SVG path
  │     │           (with stroke-dasharray animation if animate=true)
  │     └── launchP(journey) [after delay]
  │           └── Particle wave loop (see Animation section)
  └── showInfo(journey) — populate info card
```

### On network mode:

```
toggleNetwork()
  ├── Toggle S.network
  ├── showNetwork()
  │     ├── Compute node frequencies across all 114 journeys
  │     ├── Position ALL 61 nodes in bands (grid layout, wrapped rows)
  │     ├── D3 data join: render all nodes with size/color intensity ∝ frequency
  │     └── Show stats bar (top nodes per jurisdiction, avg steps)
  └── Or exit: remove nodes, show landing
```

## Animation System

### Particle Waves

The `launchP(journey)` function creates looping particle animations:

```
launchP(journey)
  ├── Build segment list: consecutive (source, target) node pairs
  └── wave() function (self-scheduling):
        ├── Guard: stop if journey deselected and not auto-playing
        ├── For each segment:
        │     ├── Create temporary SVG <path> for measurement (not added to DOM)
        │     ├── Get path total length
        │     ├── For 2 particles per segment (staggered by 140ms):
        │     │     ├── Append <circle> to #particles group
        │     │     ├── d3.transition chain:
        │     │     │     delay → opacity:0.85 → attrTween(cx,cy along path) → fade out → remove
        │     │     └── Duration: S.speed * 0.7
        │     └── Segment delay: idx * S.speed * 0.3
        └── setTimeout(wave, totalDuration + 600ms) ← loop
```

### Connection Path Drawing

Two curve types in `curve(a, b)`:
- **Same band** (|dy| < 5): Quadratic bezier arcing upward `Q` control point
- **Cross band**: Cubic bezier `C` with control points at 45% of vertical distance

### Auto-Play

```
togglePlay()
  ├── Set S.playing, update button text
  └── playNext() (self-scheduling):
        ├── Select JOURNEYS[S.playIdx]
        ├── Update sidebar (highlight + scroll into view + expand category)
        ├── renderJourney(j, true)
        ├── showInfo(j)
        ├── S.playIdx++
        └── setTimeout(playNext, steps * speed * 0.3 + speed + 1200)
```

## Sidebar Construction

`buildSidebar()` dynamically creates the sidebar from data:

```
<nav>
  <ul class="usa-sidenav">                          ← Top-level USWDS sidenav
    <li class="usa-sidenav__item">                   ← One per category
      <button class="cat-toggle">▸ Category (N)</button>  ← Manual toggle (not USWDS accordion)
      <ul class="usa-sidenav__sublist">              ← Journey links
        <li class="usa-sidenav__item">
          <a data-id="journey_id">Journey Name <dots> <count></a>
        </li>
      </ul>
    </li>
  </ul>
</nav>
```

Toggle logic: `btn.addEventListener('click', ...)` flips `aria-expanded` and `sub.hidden`.

Search filter: `input` event on `#search` hides non-matching `<li>` elements and auto-expands categories with visible matches.

## CSS Architecture

Three layers:
1. **USWDS CDN** (510KB) — provides component styles, typography, grid system
2. **App layout overrides** — full-viewport flex layout, sidebar width, header tweaks
3. **Visualization-specific** — SVG node styling, landing overlay, info card positioning, tooltip, network stats bar

Custom CSS is scoped to avoid USWDS conflicts:
- `.app-body`, `.app-sidebar`, `.viz-wrap` — layout containers (not USWDS classes)
- `.sidebar-body .usa-sidenav a` — more specific than USWDS defaults
- `.cat-toggle` — fully custom (replaces USWDS accordion)
- `.landing`, `.info-card`, `.net-stats`, `.tip` — absolute-positioned overlays

## D3 Patterns Used

- **Data joins** (`selectAll().data().join()` pattern via enter/update/exit) for nodes
- **Transitions** for animated entrance/exit/movement
- **attrTween** for particle animation along SVG paths
- **getPointAtLength** for path-following particle positions
- **stroke-dasharray/dashoffset** for connection line draw animation
- **SVG filters** (`feGaussianBlur`, `feFlood`, `feComposite`, `feMerge`) for glow effects
