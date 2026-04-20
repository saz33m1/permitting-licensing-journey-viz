# Mini-PRD: Dependency-Aware Journey Visualization

## Context

`journeys.json` now includes a `dependencies` array on each journey. This document tells a coding assistant what to build to make the UI dependency-aware.

## What changed in the data

### Schema addition

Each journey now has an optional `dependencies` array:

```json
{
  "id": "restaurant",
  "name": "Open a Restaurant",
  "cat": "food",
  "steps": ["ein", "biz_reg", ...],
  "dependencies": [
    { "from": "ein",      "to": "biz_reg",    "type": "hard" },
    { "from": "zoning",   "to": "building",   "type": "hard" },
    { "from": "fire_insp","to": "health_insp","type": "parallel" }
  ]
}
```

### Edge types

| Type | Meaning | Visual treatment |
|------|---------|-------------------|
| `hard` | Legally required prerequisite. Y cannot start until X is complete. | Solid line, full opacity |
| `soft` | Practically recommended but not legally gated. | Dashed line, reduced opacity |
| `parallel` | These steps can run simultaneously (share prerequisites but are independent). | Dotted line or no connecting line; group visually |

### Node removed

`fed_tax` was removed from `plcNodes` and all journey step arrays. Its scope was merged into `ein` (EIN Registration now covers federal tax registration). **57 nodes** total, down from 58.

### Entry points

Steps with no incoming `hard` or `soft` dependency edge are entry points (can start immediately). Most business formation journeys have a single entry point (`ein`). Construction projects start with `zoning`. Professional credential journeys start with `bg_check`. Events start with `event_permit`.

### Validation

A rules file at `dependency-rules.json` encodes universal dependency patterns. See `DATA_COLLECTION.md` for the validation script spec.

## What to build

### 1. Update `src/lib/types.ts`

Add the dependency type:

```typescript
export interface Dependency {
  from: string;   // PlcNode id
  to: string;     // PlcNode id
  type: 'hard' | 'soft' | 'parallel';
}

export interface Journey {
  id: string;
  name: string;
  cat: string;
  steps: string[];
  dependencies?: Dependency[];  // NEW -- optional for backward compat
}
```

### 2. Reorder `steps` by topological sort

Currently `steps` is jurisdiction-grouped. The UI should derive display order from the dependency DAG, not the raw array order.

Add a utility (e.g., `src/lib/utils/topoSort.ts`):

```
topoSort(steps: string[], dependencies: Dependency[], nodeMap): string[]
```

- Input: the journey's `steps` array + `dependencies`
- Output: a valid topological ordering (entry points first, respecting all hard/soft edges)
- Parallel steps at the same level can be in any order
- If no `dependencies` exist, fall back to the original `steps` array order

Use this sorted order wherever steps are iterated: `MatrixGrid`, `FlowPathOverlay`, `MobileTimeline`, `NodeDetailPanel` navigation.

### 3. Update `FlowPathOverlay` to draw real dependency edges

Currently: draws a single sequential path through steps in array order.

New behavior:
- Draw one SVG path per dependency edge (not one path for the whole journey)
- `hard` edges: solid stroke, `stroke-width: 1.5px`, `stroke: var(--ink)`
- `soft` edges: dashed stroke (`stroke-dasharray: 4 3`), `stroke-width: 1px`, `stroke: var(--text)`
- `parallel` edges: no connecting line (or a thin dotted grouping indicator)
- Directional arrows: small filled triangle at the `to` end of each edge
- Entry point nodes (no incoming edges): subtle glow or thicker border to signal "start here"
- GSAP animation: animate edges sequentially in topological order, not in a single path. Dwell on blocking nodes longer (existing behavior).

### 4. Update `MatrixGrid` to show dependency context

- When a node is selected, highlight its predecessors (incoming edges) and successors (outgoing edges) in the grid
- Dim nodes that are not connected to the selected node
- Show edge lines between the selected node and its direct connections
- On hover, show a tooltip: "Requires: [predecessor names]" for nodes with incoming hard edges

### 5. Update `MobileTimeline` (accordion view)

- Within each phase accordion, order steps by topological sort
- Show a small "requires" chip below each step listing its hard prerequisites
- Entry point steps get a "Start here" badge

### 6. Update `RealisticHUD` for timeline estimation

With dependency data, the HUD can now compute a more accurate timeline:
- Steps at the same topological level can run in parallel (use max duration, not sum)
- Sequential steps stack (sum durations)
- This gives a realistic "best case" total timeline for the journey
- Show: "Estimated minimum timeline: X weeks (with maximum parallelism)"

### 7. Add a `computeTopologicalLevels` utility

```
computeTopologicalLevels(steps, dependencies, nodeMap):
  Array<{ level: number, steps: PlcNode[], canParallel: boolean }>
```

This powers both the timeline estimation and the visual grouping. Each level represents a set of steps that can run simultaneously. The restaurant journey produces:

```
Level 0: [EIN Registration]
Level 1: [Business Registration]
Level 2: [State Tax, Sales Tax, Health Dept License, Zoning Approval]
Level 3: [Liquor License, Building Permit]
Level 4: [Fire Inspection, Health Inspection]
Level 5: [Business License]
Level 6: [Signage Permit]
```

### 8. Backward compatibility

- If a journey has no `dependencies` array (or it's empty), all existing behavior remains unchanged
- The `steps` array order is the fallback
- No existing tests or type checks should break

## Files to modify

| File | Change |
|------|--------|
| `src/lib/types.ts` | Add `Dependency` interface, add `dependencies?` to `Journey` |
| `src/lib/stores/app.svelte.ts` | No change needed (data loads as-is from JSON) |
| `src/lib/utils/topoSort.ts` | NEW: topological sort utility |
| `src/lib/utils/topoLevels.ts` | NEW: compute topological levels for timeline/grouping |
| `src/lib/utils/matrix.ts` | Use topo-sorted step order when populating cells |
| `src/lib/utils/pathCalc.ts` | Refactor to draw per-edge paths instead of single sequential path |
| `src/lib/components/FlowPathOverlay.svelte` | Draw per-edge SVG paths with type-specific styling |
| `src/lib/components/MatrixGrid.svelte` | Highlight connected nodes on selection |
| `src/lib/components/MobileTimeline.svelte` | Order by topo sort, show "requires" chips |
| `src/lib/components/NodeDetailPanel.svelte` | Show predecessors/successors in detail panel |
| `src/lib/components/RealisticHUD.svelte` | Compute parallel-aware timeline estimate |

## Out of scope

- Editing dependencies in the UI (data is authored in JSON)
- Per-jurisdiction dependency variants
- Cycle detection at runtime (data is pre-validated; see `dependency-rules.json`)

## Testing

- Run `npm run check` (svelte-check) after changes
- Verify the restaurant journey renders with correct topological ordering
- Verify a 2-step journey (teacher: bg_check -> prof_lic) still works
- Verify a journey without dependencies falls back to array order
- Check that FlowPathOverlay draws separate edges with correct styling per type
