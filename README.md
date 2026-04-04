# Cross-Jurisdiction Journey Visualizer

An animated, data-driven visualization showing how permits, licenses, and compliance requirements for common life goals — opening a restaurant, becoming a nurse, building a home addition — are scattered across federal, state, and local government.

**114 journeys** | **58 PLC types** | **15 categories** | **3 jurisdiction levels**

Built with [USWDS](https://designsystem.digital.gov/) + [D3.js](https://d3js.org/). Part of the [Catalyst](https://github.com/catalyst-plc) open-source permitting platform.

**[Live Demo →](https://saz33m1.github.io/journey-viz/)**

---

## What It Shows

Each "journey" is a real-world goal that requires navigating multiple levels of government:

- Select a journey from the sidebar (e.g. *Open a Restaurant*, *Become a Nurse*)
- Watch animated particles flow through the federal → state → local permit chain
- Hit **Auto-Play** to cycle through all 114 journeys automatically
- Hit **Show Network** to see all 58 permit types at once, sized by how many journeys use them

The visualization makes the systemic complexity of permitting undeniable — most journeys touch all three levels of government.

---

## Quick Start

No build step required. Just serve the files:

```bash
# Option 1: Python
python3 -m http.server 8000
# then open http://localhost:8000

# Option 2: Node
npx serve .

# Option 3: Open directly (uses inline data fallback)
open index.html
```

---

## Deploy to GitHub Pages

1. Push this directory to a GitHub repository
2. Go to **Settings → Pages**
3. Set source to **Deploy from a branch → `main` → `/ (root)`**
4. Your site will be live at `https://<username>.github.io/<repo>/`

---

## Data

All journey data lives in [`data/journeys.json`](data/journeys.json). The schema:

```
jurisdictions  — 3 levels (federal, state, local)
categories     — 15 journey types (food, health, construction…)
plcNodes       — 58 permit/license/compliance node types
journeys       — 114 journeys, each an ordered list of node IDs
```

After editing, validate and rebuild the inline fallback:

```bash
python3 scripts/validate.py
python3 scripts/build-inline.py
```

See [DATA_COLLECTION.md](DATA_COLLECTION.md) for research methodology and [CONTRIBUTING.md](CONTRIBUTING.md) for step-by-step extension instructions.

---

## Documentation

| File | Purpose |
|------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical deep-dive into the D3 visualization |
| [DATA_COLLECTION.md](DATA_COLLECTION.md) | How the 114 journeys were researched |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to add journeys, nodes, and categories |
| [KNOWN_ISSUES.md](KNOWN_ISSUES.md) | Bugs, workarounds, and design debt |
| [CLAUDE.md](CLAUDE.md) | Full context for AI-assisted development |

---

## Tech Stack

| Layer | Tool |
|-------|------|
| UI framework | [USWDS 3.13.0](https://designsystem.digital.gov/) |
| Visualization | [D3.js v7](https://d3js.org/) |
| Language | Vanilla JavaScript (ES6+) |
| Deployment | Static HTML — no build step |

---

## License

[MIT](LICENSE)
