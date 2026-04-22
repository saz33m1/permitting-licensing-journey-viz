# References Implementation Handoff

Complete spec for implementing gotchas, per-step sources, and journey-level references in the Journey Explorer UI. All data is already in `static/data/journeys.json`; this document covers the code changes needed to surface it.

## Data Shape (already in journeys.json)

Three layers of source data now exist:

### Layer 1: Node-level source (on every PlcNode)

```jsonc
// In plcNodes array -- every node has this
{
  "id": "ein",
  "name": "EIN Registration",
  "jurisdiction": "federal",
  "phase": "preparation",
  "agency": "Internal Revenue Service (IRS)",
  "description": "Employer Identification Number...",
  "fee": "Free",
  "estTime": "1-2 Weeks",
  "renewalTerm": null,
  "required": true,
  "source": {
    "title": "Get an Employer Identification Number (EIN) Online - IRS",
    "url": "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online"
  }
}
```

### Layer 2: Per-gotcha source (on each gotcha in a journey)

```jsonc
// In journey.gotchas array -- 2-4 per journey, only on high-friction steps
{
  "step": "health_insp",           // must match a node id in this journey's steps
  "note": "Health departments require a plan review of kitchen layout before buildout begins; if equipment placement does not match approved drawings, inspectors will require physical changes, triggering 2-6 week re-inspection delays.",
  "severity": "major",             // "major" or "minor"
  "source": {
    "title": "FDA Food Code",
    "url": "https://www.fda.gov/food/retail-food-protection/fda-food-code"
  }
}
```

### Layer 3: Journey-level references

```jsonc
// In journey.references array -- 3-6 per journey
{
  "title": "FDA Food Code",
  "url": "https://www.fda.gov/food/retail-food-protection/fda-food-code",
  "type": "regulatory",            // "regulatory" | "guide" | "dataset"
  "accessed": "2026-04"
}
```

### Coverage numbers

- 57 plcNodes, all with `source` (100%)
- 708 step-slots across 114 journeys, all covered by node source (100%)
- 454 gotchas, each with `source` -- covering 346 of 708 step-slots (49%)
- 602 journey-level references (avg 5.3 per journey)
- Severity split: 314 major, 140 minor

---

## Step 1: TypeScript Types

**File:** `src/lib/types.ts`

Add these new interfaces:

```typescript
export interface Source {
  title: string;
  url: string;
}

export interface Gotcha {
  step: string;                     // PlcNode id, must be in journey's steps
  note: string;
  severity: 'major' | 'minor';
  source: Source;
}

export interface Reference {
  title: string;
  url: string;
  type: 'regulatory' | 'guide' | 'dataset';
  accessed: string;                 // e.g. "2026-04"
}

export interface RuleException {
  from: string;
  to: string;
  reason: string;
}
```

Modify `PlcNode` -- add one field:

```typescript
export interface PlcNode {
  // ... all existing fields stay unchanged ...
  source: Source;                   // NEW
}
```

Modify `Journey` -- add three fields:

```typescript
export interface Journey {
  // ... existing id, name, cat, steps, dependencies ...
  gotchas: Gotcha[];                // NEW
  references: Reference[];         // NEW
  ruleExceptions?: RuleException[]; // NEW (optional, only cell_tower has one)
}
```

Modify `JourneyData` if it constrains the top-level shape -- the loaded JSON matches the updated `Journey` and `PlcNode` interfaces automatically.

---

## Step 2: Store Changes

**File:** `src/lib/stores/app.svelte.ts`

No structural changes required. `loadData` copies `plcNodes` and `journeys` verbatim into state, and `nodeMap` is built as `Record<string, PlcNode>` -- the new `source` field on PlcNode is automatically available via `app.nodeMap[id].source`.

**Optional convenience getters** (add to the `app` object):

```typescript
get activeGotchas(): Gotcha[] {
  return _journeys.find(j => j.id === _active)?.gotchas ?? [];
}

get activeReferences(): Reference[] {
  return _journeys.find(j => j.id === _active)?.references ?? [];
}
```

These are optional. Components can also access `app.activeJourney?.gotchas` directly.

---

## Step 3: NodeDetailPanel -- Add Gotchas + Node Source

**File:** `src/lib/components/NodeDetailPanel.svelte`

### Current structure (from codebase analysis)

```
Props: { node: PlcNode, stepIndex?: number, totalSteps?: number }

Body sections (in order):
  1. section#description     -- node.description blockquote
  2. section#key-metadata    -- 2x2 grid: fee, estTime, renewalTerm, impact
  3. section#journey-position -- "Step N of M"
  4. section#dependencies    -- Requires / Unblocks lists
```

### Changes

**A. Add node source link in the sticky header** (after agency name):

```svelte
<!-- In the sticky header, after the agency paragraph -->
{#if node.source?.url}
  <a
    href={node.source.url}
    target="_blank"
    rel="noopener noreferrer"
    class="text-xs mt-1 inline-flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
    style="color: var(--muted); font-family: var(--font-body);"
  >
    {node.source.title}
    <!-- external link icon (use your preferred icon approach) -->
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M4 1H1v10h10V8M7 1h4v4M11 1L5 7"/>
    </svg>
  </a>
{/if}
```

**B. Add gotchas section** -- insert between `section#description` and `section#key-metadata`:

```svelte
<!-- Gotchas section -->
{#if gotchasForNode.length > 0}
  <section>
    <h4 style="font-family: var(--font-mono); text-transform: uppercase; font-size: 0.65rem; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 0.5rem;">
      Common Gotchas
    </h4>
    {#each gotchasForNode as gotcha}
      <div style="margin-bottom: 0.75rem; padding: 0.5rem; border-left: 3px solid {gotcha.severity === 'major' ? '#C13B22' : 'var(--muted)'}; background: var(--newsprint);">
        <span
          style="font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.05em; padding: 1px 4px; color: {gotcha.severity === 'major' ? '#C13B22' : 'var(--muted)'};"
        >
          {gotcha.severity.toUpperCase()}
        </span>
        <p style="font-size: 0.8rem; line-height: 1.4; margin: 0.25rem 0 0.25rem 0; font-family: var(--font-body);">
          {gotcha.note}
        </p>
        {#if gotcha.source?.url}
          <a
            href={gotcha.source.url}
            target="_blank"
            rel="noopener noreferrer"
            style="font-size: 0.65rem; color: var(--muted); font-family: var(--font-mono); text-decoration: none;"
          >
            Source: {gotcha.source.title}
          </a>
        {/if}
      </div>
    {/each}
  </section>
{/if}
```

**C. Add the derived value** (in the `<script>` block):

```typescript
// After existing $derived declarations
const gotchasForNode = $derived(
  app.activeJourney?.gotchas?.filter(g => g.step === node.id) ?? []
);
```

---

## Step 4: MatrixGrid -- Add Gotcha Indicators

**File:** `src/lib/components/MatrixGrid.svelte`

### Desktop cells

Inside the `{#each sorted as node}` loop (within the phase x jurisdiction grid cells), after `<NodeCard>`, add a small gotcha indicator:

```svelte
{#if (app.activeJourney?.gotchas?.filter(g => g.step === node.id) ?? []).length > 0}
  <div
    style="position: absolute; top: 2px; right: 2px; width: 6px; height: 6px; border-radius: 0; background: #C13B22;"
    title="Has gotchas"
  ></div>
{/if}
```

This renders a small brick-red dot on NodeCards that have gotchas, inviting the user to click for details. Zero-radius to match the editorial design system.

### Mobile accordion

Inside the mobile `{#each phaseNodes}` loop, after the existing "Requires" chips block, add:

```svelte
{#if (app.activeJourney?.gotchas?.filter(g => g.step === node.id) ?? []).length > 0}
  {@const nodeGotchas = app.activeJourney?.gotchas?.filter(g => g.step === node.id) ?? []}
  <div style="margin-top: 0.25rem; padding-left: 1.5rem;">
    {#each nodeGotchas as gotcha}
      <div style="font-size: 0.7rem; color: {gotcha.severity === 'major' ? '#C13B22' : 'var(--muted)'}; margin-bottom: 0.25rem; font-family: var(--font-body); line-height: 1.3;">
        <span style="font-family: var(--font-mono); font-size: 0.55rem;">{gotcha.severity === 'major' ? '!' : 'i'}</span>
        {gotcha.note.length > 120 ? gotcha.note.slice(0, 120) + '...' : gotcha.note}
      </div>
    {/each}
  </div>
{/if}
```

Mobile shows truncated gotcha notes inline. Full detail is in NodeDetailPanel on tap.

---

## Step 5: SourcesPanel -- New Component

**File:** `src/lib/components/SourcesPanel.svelte` (new file)

A collapsible panel showing journey-level references, placed below the matrix grid on the journey page.

```svelte
<script lang="ts">
  import type { Reference } from '$lib/types';

  let { references }: { references: Reference[] } = $props();
  let isOpen = $state(false);

  const grouped = $derived.by(() => {
    const groups: Record<string, Reference[]> = { regulatory: [], guide: [], dataset: [] };
    for (const ref of references) {
      (groups[ref.type] ??= []).push(ref);
    }
    return groups;
  });

  const typeLabels: Record<string, string> = {
    regulatory: 'Regulatory',
    guide: 'Industry Guides',
    dataset: 'Datasets',
  };
</script>

{#if references.length > 0}
  <div style="border-top: 1px solid var(--border); margin-top: 1.5rem; padding-top: 1rem;">
    <button
      onclick={() => isOpen = !isOpen}
      style="display: flex; align-items: center; gap: 0.5rem; background: none; border: none; cursor: pointer; font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); padding: 0;"
    >
      <span style="transition: transform 0.2s; transform: rotate({isOpen ? 90 : 0}deg);">&#9654;</span>
      Sources ({references.length})
    </button>

    {#if isOpen}
      <div style="margin-top: 0.75rem; padding-left: 0.5rem;">
        {#each Object.entries(grouped) as [type, refs]}
          {#if refs.length > 0}
            <div style="margin-bottom: 0.75rem;">
              <h5 style="font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 0.25rem;">
                {typeLabels[type] ?? type}
              </h5>
              {#each refs as ref}
                <div style="display: flex; justify-content: space-between; align-items: baseline; padding: 0.15rem 0;">
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style="font-family: var(--font-body); font-size: 0.75rem; color: var(--text); text-decoration: none; border-bottom: 1px solid var(--border);"
                  >
                    {ref.title}
                  </a>
                  <span style="font-family: var(--font-mono); font-size: 0.6rem; color: var(--muted); white-space: nowrap; margin-left: 0.5rem;">
                    {ref.accessed}
                  </span>
                </div>
              {/each}
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
{/if}
```

### Where to mount it

**File:** `src/lib/components/JourneyScreen.svelte` (or wherever the journey page layout is composed)

After the `<MatrixGrid>` component and before the page footer:

```svelte
<SourcesPanel references={app.activeJourney?.references ?? []} />
```

---

## Step 6: Methodology Page -- Dataset Index

**File:** `src/routes/methodology/+page.svelte`

### Current Sources section structure

The page has a hardcoded `sources` array rendered in a 3-column card grid (section 5 of 6). Each card has `name` and `desc`.

### Changes

Extend the existing sources array entries to include URLs:

```typescript
const sources = [
  { name: 'SBA.gov', desc: '10-step startup guide...', url: 'https://www.sba.gov/business-guide/10-steps-start-your-business' },
  { name: 'NJ Business Navigator', desc: 'Open-source roadmaps...', url: 'https://navigator.business.nj.gov' },
  { name: 'Maryland PLC Catalog', desc: '1,058 PLC types...', url: 'https://opendata.maryland.gov/d/gdzy-2fen' },
  { name: 'DOL License Finder', desc: 'State-by-state licensing...', url: 'https://www.careeronestop.org/toolkit/training/find-licenses.aspx' },
  { name: 'WVU Knee Center', desc: '96 professions x 51 jurisdictions...', url: 'https://knee.wvu.edu/data' },
  { name: 'Municipal Codes', desc: 'Zoning, building, fire codes...', url: null },
];
```

Wrap `name` in an `<a>` tag when `url` is truthy. Alternatively, import `MANIFEST.json` via Vite:

```typescript
import manifest from '../../../reference-data/MANIFEST.json';
```

And render `manifest.datasets` instead of the hardcoded array.

---

## Design Tokens

Add to `src/app.css`:

```css
--severity-major: #C13B22;    /* brick-red, matches existing blocking color */
--severity-minor: var(--muted);
```

---

## Design Principles

- **Editorial footnote style** -- sources are understated, not shouty. Small text, muted color, external-link icon.
- **Zero-radius borders** everywhere -- matches existing design system.
- **Newsreader + IBM Plex** -- gotcha notes use `var(--font-body)` (IBM Plex Sans). Labels/badges use `var(--font-mono)` (IBM Plex Mono). Section headers use mono uppercase.
- **Severity color** -- `#C13B22` brick-red for major (same as blocking nodes). `var(--muted)` for minor.
- **All external links** -- `target="_blank" rel="noopener noreferrer"`.
- **Collapsible sections** -- default collapsed for SourcesPanel (consistent with DependencyLegend behavior).
- **Mobile gotchas** -- truncated inline previews. Full detail on NodeDetailPanel tap.

---

## Edge Cases

- **0 gotchas for a step**: Node source link still shows in NodeDetailPanel header. No gotchas section renders.
- **0 references for a journey**: SourcesPanel does not render (guarded by `{#if references.length > 0}`).
- **ruleExceptions**: Only `cell_tower` has one. No UI needed for now; it is metadata for the dependency-rules validation system.
- **Duplicate source URLs**: A gotcha source may duplicate a journey reference URL. This is intentional -- the gotcha cites the specific claim, the reference provides broader context.
- **FDA.gov outage**: 5 gotcha sources point to FDA.gov, which is currently returning 404 site-wide (federal website restructuring). The URLs are canonical and will resolve when the site returns. Do not replace them.

---

## Component Hierarchy (final)

```
JourneyScreen
  +-- MatrixGrid
  |     +-- NodeCard (existing -- add gotcha indicator dot)
  |     +-- MobileTimeline (existing -- no changes needed)
  |     +-- FlowPathOverlay (existing -- no changes)
  |     +-- DependencyLegend (existing -- no changes)
  |     +-- RealisticHUD (existing -- no changes)
  +-- NodeDetailPanel (existing -- add node source link + gotchas section)
  +-- SourcesPanel (NEW -- collapsible journey references)

MethodologyPage
  +-- Sources section (existing -- extend with URLs and/or MANIFEST.json import)
```

---

## Implementation Priority

1. **types.ts** -- Add Source, Gotcha, Reference, RuleException interfaces; update PlcNode and Journey
2. **NodeDetailPanel** -- Add node source link + gotchas section (highest user value)
3. **MatrixGrid** -- Add gotcha indicator dots on NodeCards
4. **SourcesPanel** -- New component for journey references
5. **JourneyScreen** -- Mount SourcesPanel
6. **methodology page** -- Extend sources section with URLs
7. Run `npm run check` to verify types

---

## Testing Checklist

- [ ] All 57 plcNodes render their `source` link in NodeDetailPanel header
- [ ] Steps without gotchas still show the node-level source link
- [ ] Steps with gotchas show both the node source and gotcha-specific sources
- [ ] Severity badges use correct colors (major = #C13B22, minor = muted)
- [ ] Gotcha indicator dots appear on NodeCards with gotchas (desktop)
- [ ] Mobile accordion shows truncated gotcha notes after "Requires" chips
- [ ] SourcesPanel groups references by type (regulatory, guide, dataset)
- [ ] SourcesPanel defaults to collapsed and toggles correctly
- [ ] All source links open in new tabs
- [ ] `npm run check` (svelte-check) passes with no type errors
- [ ] No layout shifts when gotchas/sources sections expand/collapse
- [ ] NodeDetailPanel scroll behavior is not broken by new content
- [ ] Methodology page sources have working links
