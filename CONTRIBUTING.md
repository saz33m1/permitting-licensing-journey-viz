# Contributing

How to extend the data and visualization. Targeted at both human developers and AI agents.

## Prerequisites

- Python 3.6+ (for validation and build scripts)
- A local web server for testing (e.g., `python3 -m http.server`)
- A text editor (VSCode recommended)

No npm, no Node.js, no build tools required.

## Adding a Journey

1. **Edit `data/journeys.json`** — add an entry to the `journeys` array:

```json
{
  "id": "my_journey",
  "name": "Open a My Business",
  "cat": "food",
  "steps": ["ein", "fed_tax", "biz_reg", "state_tax", "biz_license"]
}
```

**Field rules:**
- `id` — unique, lowercase, underscores only (`^[a-z][a-z0-9_]*$`)
- `name` — display text, any case/punctuation
- `cat` — must match an existing category `id`
- `steps` — array of PLC node `id`s (must all exist in `plcNodes`). Order: federal → state → local by convention

2. **Validate:**
```bash
python3 scripts/validate.py
```

3. **Rebuild inline fallback:**
```bash
python3 scripts/build-inline.py
```

4. **Test:** Serve locally and verify your journey appears in the sidebar, renders nodes correctly, and the info panel shows the right details.

## Adding a PLC Node

1. **Edit `data/journeys.json`** — add to `plcNodes` array:

```json
{
  "id": "my_node",
  "name": "My Permit Type",
  "jurisdiction": "state"
}
```

**Field rules:**
- `id` — unique, lowercase, underscores only
- `name` — display text (keep it short — this renders inside a node rectangle)
- `jurisdiction` — exactly one of: `federal`, `state`, `local`

2. **Use it:** Add the node's `id` to one or more journey `steps` arrays.

3. **Validate + rebuild** (same as above).

**Note:** An orphaned node (not referenced by any journey) will trigger a validation warning and won't appear in any journey view. It will appear in Network mode.

## Adding a Category

1. **Edit `data/journeys.json`** — add to `categories` array:

```json
{
  "id": "my_category",
  "name": "My Category Name"
}
```

2. **Reference it** in journey entries via `"cat": "my_category"`.

3. **Validate + rebuild.**

The sidebar dynamically generates a section for each category that has at least one journey.

## Modifying the Visualization

All visualization code is in the `<script>` block of `index.html`. Key functions:

| Function | Purpose | When to modify |
|----------|---------|----------------|
| `renderBase()` | Draws jurisdiction bands and SVG defs | Changing band layout, colors, labels |
| `renderJourney(j, anim)` | Renders a selected journey's nodes | Changing node appearance, layout algorithm |
| `drawConns(j, anim)` | Draws connection paths between nodes | Changing path curves, colors, animation |
| `launchP(j)` | Particle animation loop | Changing particle appearance, speed, count |
| `showNetwork()` | Network mode (all nodes by frequency) | Changing density view layout or metrics |
| `buildSidebar()` | Constructs sidebar from data | Changing sidebar layout, adding features |
| `showInfo(j)` | Populates the info card | Adding fields, changing layout |
| `boot(data)` | Initializes app from loaded data | Changing data processing, adding derived data |

**Colors:** Defined in `JC` object at top of script:
```javascript
const JC = {
  federal: { fill: '#1a4480', light: '#e1eaf4', bg: 'rgba(26,68,128,.04)' },
  state:   { fill: '#1b7742', light: '#daf0e3', bg: 'rgba(27,119,66,.04)' },
  local:   { fill: '#c05600', light: '#fce2cc', bg: 'rgba(192,86,0,.04)' }
};
```

**Animation speed:** Controlled by `S.speed` (milliseconds). The dropdown sets it to 700/1400/2200.

## Testing

1. **Data validation:**
```bash
python3 scripts/validate.py --verbose
```

2. **Visual testing:** Serve locally and check:
   - Landing state shows correct counts
   - Each new journey renders its nodes in the right bands
   - Particles animate smoothly
   - Network mode shows all nodes
   - Search filter finds new journeys
   - Auto-play cycles through all journeys without errors

3. **Console errors:** Open browser DevTools. There should be zero console errors.

## Workflow Summary

```
Edit data/journeys.json
    ↓
python3 scripts/validate.py     ← check integrity
    ↓
python3 scripts/build-inline.py ← sync inline fallback
    ↓
Test in browser
    ↓
Commit all three files (journeys.json + index.html + any new docs)
```

## Code Style

- **JavaScript:** Compact but readable. No minification. Single-letter variables only for loop indices and lambda params.
- **HTML:** USWDS component markup where applicable. Custom classes prefixed descriptively (`.cat-toggle`, `.info-card`, `.viz-wrap`).
- **CSS:** Grouped by component. USWDS overrides scoped with parent selectors (`.sidebar-body .usa-sidenav a`).
- **Data:** JSON with 2-space indent. IDs are `snake_case`. Names are Title Case.
