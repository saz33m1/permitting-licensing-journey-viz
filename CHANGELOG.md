# What's new

Recent updates to the Permit & License Journey Explorer. The same list is rendered in context on the [Methodology page](https://saz33m1.github.io/permitting-licensing-journeys/methodology#whats-new).

This file is generated from `src/lib/data/releases.json` — run `npm run changelog` after editing releases.

## v1.2 — April 21, 2026 — Sources & Gotchas

Every step in every journey now carries an authoritative source, and high-friction steps are annotated with real-world gotchas.

- **Source citations, everywhere.** Each of the 57 permit / license / certification types links out to its official reference — IRS for an EIN, FDA for food registration, the International Code Council for a building permit.
- **Gotchas on high-friction steps.** 454 annotated gotchas flag the places where applicants commonly stall, get rejected, or hit a surprise requirement. A red dot on a step means it has one.
- **Journey sources panel.** A collapsible panel under each journey lists the broader references grouped into regulatory, industry guides, and datasets.
- **Methodology redesign.** This page was rebuilt as a dossier on the underlying dataset — live counters, the dependency-edge taxonomy, sample gotchas, the three-layer citation architecture, and the most-cited source domains.

## v1.1 — April 20, 2026 — Dependency-aware journeys

Journey steps now sequence themselves by real-world prerequisites. Zoning approval comes before a building permit because it has to.

- **Smarter step ordering.** Each step sits after everything it depends on. Within any level, shorter steps come first so the longest remaining hurdle is the visible next milestone.
- **Dependency View.** A toggle replaces the matrix with an animated flow of how steps connect. Ambient loops through the journey as a guided tour; Realistic plays once at one day ≈ 0.1 seconds and surfaces the minimum total time if independent steps run in parallel.
- **167 new dependency edges,** each typed as hard (blocks the next step), soft (conventional but not required), or parallel (can happen concurrently).
- **Mobile-ready.** The journey page works on phones with a phase-by-phase accordion and compact timeline.

## v1.0 — April 19, 2026 — Launch

The Permit & License Journey Explorer goes public — 114 real-world journeys across 15 categories, mapped across federal, state, and local requirements.

- **114 journeys,** from opening a restaurant to becoming a nurse to hosting a street festival.
- **Jurisdictional matrix view.** Each journey renders as a four-phase by three-jurisdiction grid so you can see which permits come from which level of government at a glance.
- **Search and filter.** Find a journey by name, or narrow the list by jurisdiction and category.
- **Step details.** Tap any step to see its agency, application fee, processing time, renewal cycle, and downstream impact.
