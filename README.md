# Permitting & Licensing Journey Explorer

An interactive, editorial-grade dashboard mapping how common life and business journeys — opening a restaurant, becoming a nurse, building a home addition, hosting a street festival — require permits, licenses, and compliance steps scattered across **federal, state, and local government**.

**114 journeys** | **58 PLC types** | **15 categories** | **3 jurisdiction levels** | **4 phases**

Part of [Catalyst](https://github.com/catalyst-plc), an open-source Permitting & Licensing platform.

## Stack

SvelteKit 2 · Svelte 5 (runes) · Vite 7 · TypeScript · Tailwind v4 · shadcn-svelte · GSAP.

## Develop

```bash
npm install
npm run dev          # vite dev server
npm run build        # production build
npm run preview      # preview the build
npm run check        # svelte-check (type + diagnostics)
```

## Data

All journey data lives in [`static/data/journeys.json`](static/data/journeys.json):

```
jurisdictions  — federal, state, local
categories     — 15 journey types (food, health, construction, …)
plcNodes       — 58 permit/license/compliance node types, with phase + metadata
journeys       — 114 journeys, each an ordered list of node IDs
```

See [`DATA_COLLECTION.md`](DATA_COLLECTION.md) for research methodology and [`docs/prd.html`](docs/prd.html) for the product spec.

## Deploy

Configured for **Cloudflare Pages** (SSR) via `@sveltejs/adapter-cloudflare`. In the Cloudflare dashboard, create a Pages project connected to this repo with:

- **Framework preset:** SvelteKit
- **Build command:** `npm run build`
- **Build output directory:** `.svelte-kit/cloudflare`
- **Node version:** 20+

## License

[MIT](LICENSE)
