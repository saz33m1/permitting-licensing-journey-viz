# Data Research Methodology

A handoff guide for replicating and extending the data research workflow that produced the dependency edges in this repo. Read this when you need to: add new journeys, add or modify dependencies, refresh reference data, evolve the schema, or onboard an AI assistant (like Claude Code) to do that work.

This doc is self-contained. With it plus the repo, you can bootstrap a full research project end-to-end.

---

## Table of Contents

1. [Purpose and audience](#purpose-and-audience)
2. [Quick start](#quick-start)
3. [Data model recap](#data-model-recap)
4. [Reference data catalog](#reference-data-catalog)
5. [The rule engine](#the-rule-engine)
6. [Generation playbook (the 5 tiers)](#generation-playbook)
7. [Validation suite](#validation-suite)
8. [Schema evolution patterns](#schema-evolution-patterns)
9. [Python script appendix](#python-script-appendix)
10. [Common edge cases](#common-edge-cases)
11. [How to extend](#how-to-extend)
12. [PR workflow](#pr-workflow)

---

## Purpose and audience

**Purpose:** Codify the methodology used to research, generate, and validate the dependency edges in `static/data/journeys.json` so future work can build on it instead of reconstructing it.

**Audience:**
- Future-you, returning to this codebase after a break
- Claude Code or another AI coding assistant, invoked on the repo with no prior context
- A collaborator joining the project

**What this doc covers:**
- How to acquire and refresh reference data from 5 government sources
- How to evolve the schema (add fields, deprecate nodes, merge nodes)
- How to generate dependency edges using rules + AI assistance
- How to validate the resulting dataset (cycles, references, rule compliance, reachability)
- How to extend the dataset (new journeys, nodes, categories, rules, tiers)
- The PR workflow when sandbox push doesn't work

**What this doc does NOT cover:**
- UI implementation (see `docs/DEPENDENCY_PRD.md`)
- Stack/architecture details (see `CLAUDE.md`)
- Project background and design philosophy (see `README.md`, `DATA_COLLECTION.md`)

---

## Quick start

Five-minute orientation for someone who needs to add or modify dependency data right now:

```bash
# 1. Clone the repo
git clone https://github.com/saz33m1/permitting-licensing-journeys.git
cd permitting-licensing-journeys

# 2. Inspect the data
python3 -c "
import json
d = json.load(open('static/data/journeys.json'))
print(f'jurisdictions: {len(d[\"jurisdictions\"])}')
print(f'categories: {len(d[\"categories\"])}')
print(f'plcNodes: {len(d[\"plcNodes\"])}')
print(f'journeys: {len(d[\"journeys\"])}')
print(f'journeys with deps: {sum(1 for j in d[\"journeys\"] if j.get(\"dependencies\"))}')
"

# 3. Read the rules
cat dependency-rules.json | python3 -m json.tool | head -40

# 4. Read the reference data summaries
ls reference-data/*/SUMMARY.md
cat reference-data/nj-navigator/roadmaps/task-dependencies.json | python3 -m json.tool | head -30
```

After the orientation, the typical workflow is:

1. **Decide what's changing.** New journey? New dependency for an existing journey? New node type? New rule?
2. **Pick the right section below.** Section 11 (How to extend) has a recipe for each case.
3. **Run the validation suite.** Section 7. Zero violations is the bar.
4. **Open a PR.** Section 12 has the workflow.

---

## Data model recap

The data lives in two files plus an optional rules file:

### `static/data/journeys.json`

Single source of truth for the journey data. Four top-level arrays:

```json
{
  "jurisdictions": [
    { "id": "federal", "name": "Federal" },
    { "id": "state", "name": "State" },
    { "id": "local", "name": "Local (City / County)" }
  ],
  "categories": [
    { "id": "food", "name": "Food & Beverage" },
    ...
  ],
  "plcNodes": [
    {
      "id": "ein",
      "name": "EIN Registration",
      "jurisdiction": "federal",
      "phase": "preparation",
      "agency": "Internal Revenue Service (IRS)",
      "description": "Employer Identification Number and federal tax registration...",
      "fee": "Free",
      "estTime": "1-2 Weeks",
      "renewalTerm": null,
      "required": true
    },
    ...
  ],
  "journeys": [
    {
      "id": "restaurant",
      "name": "Open a Restaurant",
      "cat": "food",
      "steps": ["ein", "biz_reg", "state_tax", ...],
      "dependencies": [
        { "from": "ein", "to": "biz_reg", "type": "hard" },
        ...
      ]
    },
    ...
  ]
}
```

### `src/lib/types.ts`

TypeScript interfaces. Single source of truth for the data shape:

```typescript
export interface Jurisdiction { id: string; name: string; }
export interface Category { id: string; name: string; }

export type Phase = 'preparation' | 'application' | 'inspection' | 'active';

export interface PlcNode {
  id: string;
  name: string;
  jurisdiction: string;
  phase: Phase;
  estTime?: string | null;
  blocking?: boolean;
  agency?: string | null;
  description?: string | null;
  fee?: string | null;
  renewalTerm?: string | null;
  required?: boolean;
}

export interface Dependency {
  from: string;          // PlcNode id
  to: string;            // PlcNode id
  type: 'hard' | 'soft' | 'parallel';
}

export interface Journey {
  id: string;
  name: string;
  cat: string;           // ref to Category.id
  steps: string[];       // ordered array of PlcNode ids
  dependencies?: Dependency[];  // optional, backward compatible
}

export interface JourneyData {
  jurisdictions: Jurisdiction[];
  categories: Category[];
  plcNodes: PlcNode[];
  journeys: Journey[];
}
```

### `dependency-rules.json`

Encodes universal and category-specific rules. Used to validate that new journeys have the dependencies they should, and to auto-populate edges for new journeys:

```json
{
  "universalRules": [
    {
      "if_both_present": ["ein", "biz_reg"],
      "then": { "from": "ein", "to": "biz_reg", "type": "hard" },
      "reason": "EIN required for state business entity registration"
    },
    ...
  ],
  "categoryRules": [
    {
      "categories": ["food"],
      "if_both_present": ["state_health", "health_insp"],
      "then": { "from": "state_health", "to": "health_insp", "type": "hard" },
      "reason": "State health license before local health inspection for food"
    },
    ...
  ]
}
```

The rules file is not consumed by the app at runtime. It is used only for data validation and as a starter template for new journey dependencies.

### Edge types

| Type | Meaning | Visual treatment |
|------|---------|-----------------|
| `hard` | Legally required prerequisite. Y cannot start until X is complete. | Solid line |
| `soft` | Practically necessary or strongly recommended, but not legally gated. | Dashed line |
| `parallel` | These steps can proceed simultaneously (share prerequisites but are independent). | Dotted line or no connecting line |

**Entry points** are steps with no incoming `hard` or `soft` edge. They can start immediately. Most journeys have exactly one entry point (`ein` for business formation, `zoning` for homeowner construction, `bg_check` for individual credentials).

**Topological levels** are derived from the dependency graph using Kahn's algorithm. Steps at the same level can run in parallel.

---

## Reference data catalog

Five external data sources were used to research dependency relationships. Each has different coverage and trustworthiness. The reference data lives in `reference-data/` in this repo, alongside `SUMMARY.md` files explaining what was extracted from each.

### 1. NJ Navigator (highest signal for business formation)

**What it is:** New Jersey's open-source business formation platform. NAICS-based starter kit framework with explicit task dependencies.

**Coverage:** Business formation journeys (~50 of our 114). Strong for federal/state setup, weak for construction and credential journeys.

**Source:** https://github.com/newjersey/navigator.business.nj.gov

**Key files (already in `reference-data/nj-navigator/`):**
- `roadmaps/task-dependencies.json` -- 32 explicit prerequisite entries. The gold standard reference.
- `roadmaps/steps.json` -- 4-phase ordering (Plan / Register / After / Before Opening)
- `roadmaps/industries/*.json` -- per-industry roadmaps with step + weight ordering
- `shared-types/types.ts` -- their TypeScript schema for Task, Roadmap, TaskDependencies

**How to refresh:**

```bash
# Run from the repo root
BASE='https://raw.githubusercontent.com/newjersey/navigator.business.nj.gov/main'

# Get task dependencies (the most important file)
curl -s -o reference-data/nj-navigator/roadmaps/task-dependencies.json \
  "$BASE/content/src/roadmaps/task-dependencies.json"

# Get steps and industry roadmaps
for f in steps.json steps-domestic-employer.json steps-foreign.json nonEssentialQuestions.json; do
  curl -s -o "reference-data/nj-navigator/roadmaps/$f" "$BASE/content/src/roadmaps/$f"
done

# Get a few key industry roadmaps
for industry in restaurant retail food-truck cannabis cosmetology acupuncture architecture; do
  curl -s -o "reference-data/nj-navigator/roadmaps/industries/$industry.json" \
    "$BASE/content/src/roadmaps/industries/$industry.json"
done

# Get TypeScript types
for f in types.ts industry.ts loadTasks.ts roadmapBuilder.ts fetchTaskByFilename.ts; do
  curl -s -o "reference-data/nj-navigator/shared-types/$f" \
    "$BASE/shared/types/$f"
done
```

### 2. Maryland PLC Catalog (rich metadata, 1,058 types)

**What it is:** Maryland's dataset of 1,058 PLC types with fees, processing times, administering agencies, IT systems. Created under the Transparent Government Act of 2024.

**Coverage:** Broad PLC type coverage, but Maryland-specific. Useful for cross-validating node coverage and identifying bottleneck signals (90% of PLCs report timelines NOT being met).

**Source:** https://opendata.maryland.gov/api/views/gdzy-2fen/rows.csv?accessType=DOWNLOAD

**How to refresh:**

```bash
curl -s -o reference-data/maryland-plc/plc-data-catalog.csv \
  'https://opendata.maryland.gov/api/views/gdzy-2fen/rows.csv?accessType=DOWNLOAD'

# Quick stats
python3 -c "
import csv
with open('reference-data/maryland-plc/plc-data-catalog.csv') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    print(f'Rows: {len(rows)}')
    print(f'Columns: {list(rows[0].keys())[:5]}...')
"
```

### 3. SBA 10-Step Guide (canonical business startup sequence)

**What it is:** SBA's authoritative 10-step business startup checklist. No structured data, but the text contains explicit prerequisite language.

**Coverage:** Business formation only. Extracted dependency graph is in `reference-data/sba/SUMMARY.md`.

**Source:** https://www.sba.gov/business-guide/10-steps-start-your-business

**How to refresh:**

```bash
curl -s -o reference-data/sba/sba-10-steps.html \
  'https://www.sba.gov/business-guide/10-steps-start-your-business'

# Also archive individual step pages (paths derived from the main page)
for step in market-research-competitive-analysis write-your-business-plan \
            fund-your-business pick-your-business-location choose-business-structure \
            register-your-business get-federal-state-tax-id-numbers apply-licenses-permits; do
  url="https://www.sba.gov/business-guide/plan-your-business/$step"
  [[ "$step" =~ ^(pick|choose|register|get|apply) ]] && \
    url="https://www.sba.gov/business-guide/launch-your-business/$step"
  curl -s -o "reference-data/sba/step-$step.html" "$url"
done
```

After refresh, re-read each HTML file and extract any new dependency language into `reference-data/sba/SUMMARY.md`. The key thing to capture is sentences like "your business plan will help you figure out how much money you'll need" (implies Step 3 depends on Step 2).

### 4. DOL CareerOneStop (occupational licensing, all states)

**What it is:** Federal database of licensing requirements across all states/territories. 138MB bulk export (.mdb file). API also available.

**Coverage:** Professional/occupational licensing journeys. Requirement flags only (education, exam, experience). No prerequisite chains.

**Source:** https://www.careeronestop.org/toolkit/training/find-licenses.aspx

**How to refresh:**

```bash
# Bulk export (138MB - gitignored, download fresh each time)
curl -s -o /tmp/COSFlatExport.zip \
  'https://data.widcenter.org/wfinfodb/License/COSFlatExport.zip'
unzip -o /tmp/COSFlatExport.zip -d reference-data/dol-careeronestop/

# Or use the API (paginated)
curl -s -o reference-data/dol-careeronestop/api-sample.json \
  'https://api.careeronestop.org/v1/licenses/{userId}/RN/CA/0/0/0/100'
```

Note: The .mdb file is gitignored (.gitignore in `reference-data/`). Only `SUMMARY.md` and any extracted derivatives commit to the repo.

### 5. WVU Knee Center (cross-state credential comparison)

**What it is:** Annual snapshot of 96 professions across 51 jurisdictions (50 states + DC). Includes trainee/apprentice tiers, education requirements, fees, exams, experience.

**Coverage:** Professional/occupational licensing. Strong for credential prerequisite chains (trainee -> licensed practitioner).

**Source:** https://knee.wvu.edu/data

**How to refresh:**

```bash
# 2025 release (857KB xlsx)
curl -s -o /tmp/data-2025-release.xlsx \
  'https://knee.wvu.edu/files/d/dataset/2025/data-2025-release.xlsx'

mv /tmp/data-2025-release.xlsx reference-data/knee-center/
# .xlsx is gitignored; only SUMMARY.md commits

# Parse with openpyxl for analysis
python3 -c "
import openpyxl
wb = openpyxl.load_workbook('reference-data/knee-center/data-2025-release.xlsx', read_only=True)
print('Sheets:', wb.sheetnames[:5], '...')
print(f'Total professions: {len(wb.sheetnames) - 1}')  # minus the 'All Professions' summary
"
```

### Adding a 6th source

If a new authoritative dataset emerges (a new state PLC catalog, an updated occupational database, etc.):

1. Create `reference-data/<source-name>/`
2. Download the data files (large binaries should be gitignored; small files commit)
3. Write `reference-data/<source-name>/SUMMARY.md` documenting:
   - Source URL
   - What's in it (rows, columns, coverage)
   - How to refresh
   - What's useful for dependency analysis
4. Update this doc's "Reference data catalog" section

---

## The rule engine

The rule engine encodes recurring dependency patterns so they apply consistently across journeys. Three rule types compose to produce the full dependency graph:

### Universal rules

If both nodes appear in a journey's steps, the edge must exist. These rules hold for every journey type.

```json
{
  "if_both_present": ["zoning", "building"],
  "then": { "from": "zoning", "to": "building", "type": "hard" },
  "reason": "Zoning approval required before building permit application"
}
```

There are 23 universal rules in the current dataset. They cover:
- Business formation backbone (ein -> biz_reg, biz_reg -> state_tax, etc.)
- Federal industry permits (ein -> fda, ein -> atf, etc.)
- State licenses requiring business entity (biz_reg -> state_health, biz_reg -> liquor, etc.)
- Construction inspection chain (zoning -> building -> fire_insp/health_insp -> cert_occ)
- Final operating permits (inspections -> biz_license -> signage)
- Professional credential chain (bg_check -> prof_lic -> liability_ins -> biz_license)
- Environmental dependencies (env_review -> building, env_review -> water_rights)

### Category rules

Same shape as universal rules, but only apply to journeys in specified categories:

```json
{
  "categories": ["food"],
  "if_both_present": ["state_health", "health_insp"],
  "then": { "from": "state_health", "to": "health_insp", "type": "hard" },
  "reason": "State health license before local health inspection for food"
}
```

There are 6 category rules in the current dataset. Use a category rule when a relationship is genuine and consistent within a category but doesn't generalize.

### Parallel rules

Identify steps that share prerequisites but are independent of each other. Adds `type: "parallel"` edges between each pair.

```json
{
  "nodes": ["fire_insp", "health_insp"]
}
```

There are 6 parallel rule groups. Common cases:
- Fire and Health inspections (both depend on building permit; independent of each other)
- State tax and sales tax registrations (both depend on biz_reg; independent)
- EIN and Background check (no dependency between them; can start simultaneously)
- Electrical and plumbing permits (both depend on building permit; independent)
- Grading and Stormwater (both depend on zoning; can run together)

### Adding a new rule

Decide which type:
- **Universal:** holds for every journey where both nodes appear
- **Category:** holds within specific journey categories
- **Parallel:** the two nodes share prerequisites but don't depend on each other

Add the rule to `dependency-rules.json`. Then regenerate dependencies for affected journeys (see Section 6).

### Rule conflict resolution

If two rules would create conflicting edges, the more specific rule wins:
- Category rule > universal rule
- Hard edge > soft edge (for the same pair)

If you add a rule that creates a cycle when applied to existing data, the validation suite catches it (Section 7). Fix the rule or add explicit exceptions to the affected journeys.

---

## Generation playbook

The 114 journeys break into 5 tiers based on how much reference data coverage exists. Work tier-by-tier. Earlier tiers establish universal rules that subsequent tiers reuse.

### Tier 1: Business formation (45 journeys)

**Categories:** food, retail, health, childcare, trades, profsvc, transport, animal, specialty

**Why first:** These share a 5-node backbone (ein, biz_reg, state_tax, biz_license, plus optional sales_tax / workers_comp). NJ Navigator and SBA both cover this backbone directly.

**Pattern:**
```
ein -> biz_reg -> [state_tax, sales_tax, workers_comp, prof_lic, contr_lic, state_health, liquor, ...]
biz_reg -> zoning -> building -> [fire_insp, health_insp] -> biz_license -> signage
```

**Reference validation:**
- Cross-check against `reference-data/nj-navigator/roadmaps/task-dependencies.json`
- Map NJ task names to our node IDs (e.g., `register-for-ein` -> `ein`, `form-business-entity` -> `biz_reg`)
- Confirm: NJ shows `register-for-taxes` requires `form-business-entity` + `register-for-ein` -- we encode this as `biz_reg -> state_tax` (universal hard rule)

### Tier 2: Professional licensing (18 journeys)

**Category:** proflic

**Why second:** Smaller scope, simpler patterns. Credential journeys, not business setup.

**Pattern:**
```
[ein, bg_check] (parallel) -> biz_reg (if applicable) -> state_tax -> prof_lic -> liability_ins -> biz_license
```

Special cases:
- 2-step journeys (teacher, notary): `bg_check -> prof_lic`
- DEA-required (psychologist): `dea -> prof_lic` (category rule)
- Federal cert (CDL, pilot): `dot/faa` is parallel with `biz_reg`, not a prerequisite
- Trade journeys (electrician, plumber): `prof_lic -> contr_lic` (category rule for trades+proflic)

**Reference validation:**
- WVU Knee Center data shows trainee/apprentice tiers (e.g., Engineer Intern -> Professional Engineer). This encodes prerequisite chains.
- DOL CareerOneStop requirement flags (education, exam, experience) confirm the bg_check -> prof_lic ordering.

### Tier 3: Building/construction (15 journeys)

**Category:** bldg

**Why third:** Well-known municipal permitting pattern. The blocking flags on our nodes (zoning, building, fire_insp, etc.) directly map to this chain.

**Pattern:**
```
zoning -> building -> [fire_insp, health_insp, elec_permit, plumb_permit] -> cert_occ -> biz_license
```

Many construction journeys are homeowner projects (no business entity), so `zoning` is the entry point instead of `ein`. This is correct -- homeowners apply for building permits in their personal name.

**Category rule:** `contr_lic -> building` (must have contractor license before pulling building permit, for bldg category specifically)

### Tier 4: Land use, events, housing, environmental (36 journeys)

**Categories:** landuse, events, housing, envag

**Why fourth:** Less reference data coverage. More diverse patterns.

**Land use** (subdivision, mining, water rights):
```
env_review -> [zoning, building, water_rights, mining]
```

**Events** (festivals, concerts, weddings):
```
[fire_marshal, state_health] -> event_permit -> street_close
```

Events often don't have business formation steps -- the entry point can be `event_permit` itself for one-time activities.

**Housing** (landlord, foster care, str_license):
```
biz_reg -> [rental_reg, str_license, foster_care]
zoning -> housing_insp
```

**Environmental** (farm, organic, water rights):
```
[usda, epa] -> [agriculture, env_review] -> water_rights
```

### Tier 5: Validation sweep (all 114 journeys)

After Tiers 1-4 are complete:
1. Run the full validation suite (Section 7)
2. Check that every applicable rule is enforced
3. Fix any cycles or unreachable steps
4. Spot-check 10-15 journeys across categories for human-readable correctness

### Suggested generation prompt (AI-assisted)

When using an AI assistant to propose edges for a new journey, the prompt should:

```
Given this journey's steps for [journey name], propose dependency edges.

Steps: [list of node IDs with their phase, jurisdiction, and description]

Constraints from existing rules:
[paste applicable universal rules]
[paste applicable category rules]
[paste applicable parallel rules]

Output JSON only, with edges in this shape:
{
  "from": "<node_id>",
  "to": "<node_id>",
  "type": "hard" | "soft" | "parallel"
}

Classify each edge:
- "hard" if legally required (cannot start Y until X complete)
- "soft" if practically recommended but not legally gated
- "parallel" if X and Y share prerequisites but don't depend on each other

Do not invent edges that aren't supported by the steps in this journey.
```

After AI generates edges, run validation (Section 7) and review.

---

## Validation suite

Four checks run against the final dataset. Zero violations on all four is the bar for a PR.

### Check 1: Cycle detection

The dependency graph for each journey must be a DAG. Cycles indicate either bad data or a missing parallel marker (parallel edges are exempt from cycle checks because they don't imply ordering).

```python
def has_cycle(steps, deps):
    adj = {s: [] for s in steps}
    for dep in deps:
        if dep['type'] != 'parallel' and dep['from'] in adj:
            adj[dep['from']].append(dep['to'])
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {s: WHITE for s in steps}
    def dfs(u):
        color[u] = GRAY
        for v in adj.get(u, []):
            if color.get(v) == GRAY: return True
            if color.get(v) == WHITE and dfs(v): return True
        color[u] = BLACK
        return False
    return any(dfs(s) for s in steps if color[s] == WHITE)
```

### Check 2: Reference integrity

Every `from` and `to` node ID in a dependency must exist in the journey's `steps` array.

```python
def check_refs(journey):
    steps_set = set(journey['steps'])
    broken = []
    for dep in journey.get('dependencies', []):
        if dep['from'] not in steps_set:
            broken.append((dep['from'], 'from'))
        if dep['to'] not in steps_set:
            broken.append((dep['to'], 'to'))
    return broken
```

### Check 3: Rule compliance

For every universal or category rule, if both `if_both_present` nodes appear in the journey's steps, the matching edge must exist in the dependencies.

```python
def check_rules(journey, rules):
    steps_set = set(journey['steps'])
    dep_set = {(dep['from'], dep['to']) for dep in journey.get('dependencies', [])}
    violations = []
    for rule in rules['universalRules']:
        a, b = rule['if_both_present']
        if a in steps_set and b in steps_set:
            expected = (rule['then']['from'], rule['then']['to'])
            if expected not in dep_set:
                violations.append((rule['then']['from'], rule['then']['to'], rule['reason']))
    for rule in rules['categoryRules']:
        if journey['cat'] not in rule['categories']:
            continue
        a, b = rule['if_both_present']
        if a in steps_set and b in steps_set:
            expected = (rule['then']['from'], rule['then']['to'])
            if expected not in dep_set:
                violations.append((rule['then']['from'], rule['then']['to'], rule['reason']))
    return violations
```

### Check 4: Reachability

Every step in a journey should be reachable from at least one entry point via hard/soft edges. Unreachable steps indicate orphan nodes (a step that's listed but has no path from any starting point).

```python
def check_reachability(journey):
    steps = journey['steps']
    deps = journey.get('dependencies', [])
    adj = {s: [] for s in steps}
    for dep in deps:
        if dep['type'] != 'parallel' and dep['from'] in adj:
            adj[dep['from']].append(dep['to'])
    has_incoming = {dep['to'] for dep in deps if dep['type'] != 'parallel'}
    entries = [s for s in steps if s not in has_incoming]
    visited = set(entries)
    queue = list(entries)
    while queue:
        u = queue.pop(0)
        for v in adj.get(u, []):
            if v not in visited:
                visited.add(v)
                queue.append(v)
    return [s for s in steps if s not in visited]
```

### Running the full suite

See `scripts/validate-dependencies.py` in the [Python Script Appendix](#python-script-appendix) for the full runnable validator.

---

## Schema evolution patterns

Three common schema changes and how to handle them safely.

### Pattern 1: Adding a new optional field to PlcNode or Journey

Example: adding `typicalCost: { min: number, max: number, currency: string }` to PlcNode.

Steps:
1. Update `src/lib/types.ts` -- add the field as `optional` (use `?`)
2. Update `journeys.json` -- populate the field for nodes where you have data; leave it absent (NOT `null`) for others
3. Update `DATA_COLLECTION.md` -- document the field
4. Update the UI consumers (or leave them ignoring the field if they're not ready)

**Why optional:** Preserves backward compatibility. Old code keeps working. New consumers can check `if (node.typicalCost)` before using it.

### Pattern 2: Deprecating a node

Example: deciding `fed_tax` is no longer a useful PLC node (as we did this session).

Steps:
1. **Audit usage:** find all journeys referencing the node.
   ```python
   refs = [j['id'] for j in journeys if 'fed_tax' in j['steps']]
   ```
2. **Decide:** delete entirely, or merge into another node?
3. **If merging:** update the absorbing node's description to cover the new scope.
4. **Remove from `steps` arrays** in every affected journey.
5. **Remove `dependencies` edges** that reference the deprecated node from every affected journey.
6. **Remove from `plcNodes`** array.
7. **Run validation** -- every step reference and every dep should still resolve.

### Pattern 3: Merging two nodes

Same as Pattern 2 but the absorbing node already exists.

Example: if you decided `sales_tax` and `state_tax` should merge into a single `tax_reg` node.

Steps:
1. Find journeys that have both nodes. For these, the merge keeps one entry and removes the other from the steps array.
2. Find journeys that have only one. For these, rename the surviving node's ID to the new merged ID.
3. Update all dependency edges to use the new ID.
4. Remove the deprecated node from `plcNodes`.
5. Update any rules in `dependency-rules.json` that referenced the old IDs.
6. Run validation.

### Pattern 4: Renaming an ID

Example: renaming `biz_reg` to `business_registration` for readability.

Use a find-and-replace across `journeys.json` and `dependency-rules.json`. Then validate. This is mechanical -- the script in the appendix can do it.

---

## Python script appendix

Four runnable scripts. Save these to `scripts/` in the repo. Each is standalone (no imports beyond standard library + json/csv).

### `scripts/download_reference_data.py`

```python
#!/usr/bin/env python3
"""Refresh reference data from the 5 external sources.

Usage:
    python3 scripts/download_reference_data.py [--source nj|md|sba|dol|knee|all]
"""

import argparse
import os
import subprocess
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF_DIR = os.path.join(REPO_ROOT, 'reference-data')

NJ_BASE = 'https://raw.githubusercontent.com/newjersey/navigator.business.nj.gov/main'
NJ_FILES = [
    ('content/src/roadmaps/task-dependencies.json', 'nj-navigator/roadmaps/task-dependencies.json'),
    ('content/src/roadmaps/steps.json', 'nj-navigator/roadmaps/steps.json'),
    ('content/src/roadmaps/steps-domestic-employer.json', 'nj-navigator/roadmaps/steps-domestic-employer.json'),
    ('content/src/roadmaps/steps-foreign.json', 'nj-navigator/roadmaps/steps-foreign.json'),
    ('content/src/roadmaps/nonEssentialQuestions.json', 'nj-navigator/roadmaps/nonEssentialQuestions.json'),
    ('shared/types/types.ts', 'nj-navigator/shared-types/types.ts'),
    ('shared/types/industry.ts', 'nj-navigator/shared-types/industry.ts'),
    ('shared/types/loadTasks.ts', 'nj-navigator/shared-types/loadTasks.ts'),
    ('shared/types/roadmapBuilder.ts', 'nj-navigator/shared-types/roadmapBuilder.ts'),
    ('shared/types/fetchTaskByFilename.ts', 'nj-navigator/shared-types/fetchTaskByFilename.ts'),
]
NJ_INDUSTRIES = ['restaurant', 'retail', 'food-truck', 'cannabis', 'cosmetology', 'acupuncture', 'architecture']

MD_URL = 'https://opendata.maryland.gov/api/views/gdzy-2fen/rows.csv?accessType=DOWNLOAD'
MD_PATH = 'maryland-plc/plc-data-catalog.csv'

SBA_BASE = 'https://www.sba.gov/business-guide'
SBA_PAGES = [
    ('10-steps-start-your-business', 'sba/sba-10-steps.html'),
    ('plan-your-business/market-research-competitive-analysis', 'sba/step-market-research.html'),
    ('plan-your-business/write-your-business-plan', 'sba/step-business-plan.html'),
    ('plan-your-business/fund-your-business', 'sba/step-funding.html'),
    ('launch-your-business/pick-your-business-location', 'sba/step-location.html'),
    ('launch-your-business/choose-business-structure', 'sba/step-structure.html'),
    ('launch-your-business/register-your-business', 'sba/step-register.html'),
    ('launch-your-business/get-federal-state-tax-id-numbers', 'sba/step-tax-id.html'),
    ('launch-your-business/apply-licenses-permits', 'sba/step-licenses.html'),
]

DOL_URL = 'https://data.widcenter.org/wfinfodb/License/COSFlatExport.zip'
KNEE_URL = 'https://knee.wvu.edu/files/d/dataset/2025/data-2025-release.xlsx'


def curl(url, dest):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    print(f'Fetching {url}')
    result = subprocess.run(['curl', '-sSL', '-o', dest, url], capture_output=True)
    if result.returncode != 0:
        print(f'  FAILED: {result.stderr.decode()}', file=sys.stderr)
        return False
    return True


def refresh_nj():
    for src, dest in NJ_FILES:
        curl(f'{NJ_BASE}/{src}', os.path.join(REF_DIR, dest))
    for industry in NJ_INDUSTRIES:
        curl(f'{NJ_BASE}/content/src/roadmaps/industries/{industry}.json',
             os.path.join(REF_DIR, f'nj-navigator/roadmaps/industries/{industry}.json'))


def refresh_md():
    curl(MD_URL, os.path.join(REF_DIR, MD_PATH))


def refresh_sba():
    for path, dest in SBA_PAGES:
        curl(f'{SBA_BASE}/{path}', os.path.join(REF_DIR, dest))


def refresh_dol():
    # Large binary, gitignored
    dest = os.path.join(REF_DIR, 'dol-careeronestop/COSFlatExport.zip')
    curl(DOL_URL, dest)


def refresh_knee():
    # Large binary, gitignored
    dest = os.path.join(REF_DIR, 'knee-center/data-2025-release.xlsx')
    curl(KNEE_URL, dest)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', choices=['nj', 'md', 'sba', 'dol', 'knee', 'all'], default='all')
    args = parser.parse_args()

    if args.source in ('nj', 'all'): refresh_nj()
    if args.source in ('md', 'all'): refresh_md()
    if args.source in ('sba', 'all'): refresh_sba()
    if args.source in ('dol', 'all'): refresh_dol()
    if args.source in ('knee', 'all'): refresh_knee()


if __name__ == '__main__':
    main()
```

### `scripts/generate_dependencies.py`

The rule engine that produced the current dependency edges. Run it after editing rules or adding journeys to regenerate the full dependency set.

```python
#!/usr/bin/env python3
"""Generate dependency edges for all journeys using the rule engine.

Usage:
    python3 scripts/generate_dependencies.py [--journey JOURNEY_ID] [--dry-run]
"""

import argparse
import json
import os
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(REPO_ROOT, 'static/data/journeys.json')
RULES_PATH = os.path.join(REPO_ROOT, 'dependency-rules.json')


def generate_for_journey(journey, node_map, universal_rules, category_rules, parallel_rules):
    steps_set = set(journey['steps'])
    deps = []
    seen = set()

    def add(from_, to_, type_):
        key = (from_, to_)
        if type_ == 'parallel':
            key = (from_, to_, 'parallel')
        if key in seen:
            return
        deps.append({'from': from_, 'to': to_, 'type': type_})
        seen.add(key)

    # Apply universal rules
    for rule in universal_rules:
        a, b = rule['if_both_present']
        if a in steps_set and b in steps_set:
            add(rule['then']['from'], rule['then']['to'], rule['then']['type'])

    # Apply category rules
    for rule in category_rules:
        if journey['cat'] not in rule['categories']:
            continue
        a, b = rule['if_both_present']
        if a in steps_set and b in steps_set:
            add(rule['then']['from'], rule['then']['to'], rule['then']['type'])

    # Apply parallel rules
    for rule in parallel_rules:
        present = [n for n in rule['nodes'] if n in steps_set]
        for i in range(len(present)):
            for k in range(i + 1, len(present)):
                add(present[i], present[k], 'parallel')

    return deps


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--journey', help='Generate for one journey only')
    parser.add_argument('--dry-run', action='store_true', help='Print results, do not write')
    args = parser.parse_args()

    data = json.load(open(DATA_PATH))
    rules = json.load(open(RULES_PATH))

    node_map = {n['id']: n for n in data['plcNodes']}

    # The current rules file does not include parallel rules in the same file.
    # If you add a parallel_rules field to dependency-rules.json, load it here.
    parallel_rules = rules.get('parallelRules', [
        {'nodes': ['fire_insp', 'health_insp']},
        {'nodes': ['state_tax', 'sales_tax']},
        {'nodes': ['ein', 'bg_check']},
        {'nodes': ['elec_permit', 'plumb_permit']},
        {'nodes': ['grading', 'stormwater']},
        {'nodes': ['demolition', 'env_review']},
    ])

    for journey in data['journeys']:
        if args.journey and journey['id'] != args.journey:
            continue
        deps = generate_for_journey(
            journey, node_map,
            rules['universalRules'],
            rules['categoryRules'],
            parallel_rules
        )
        if args.dry_run:
            print(f'\n{journey["id"]} ({len(deps)} edges):')
            for d in deps:
                print(f'  {d["from"]:20s} --[{d["type"]:8s}]--> {d["to"]}')
        else:
            journey['dependencies'] = deps

    if not args.dry_run:
        with open(DATA_PATH, 'w') as f:
            json.dump(data, f, indent=2)
            f.write('\n')
        print(f'Wrote dependencies to {DATA_PATH}')


if __name__ == '__main__':
    main()
```

### `scripts/validate_dependencies.py`

Runs all 4 validation checks. Returns non-zero exit on any violation.

```python
#!/usr/bin/env python3
"""Validate the dependency graph in journeys.json against dependency-rules.json.

Usage:
    python3 scripts/validate_dependencies.py
"""

import json
import os
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(REPO_ROOT, 'static/data/journeys.json')
RULES_PATH = os.path.join(REPO_ROOT, 'dependency-rules.json')


def has_cycle(steps, deps):
    adj = {s: [] for s in steps}
    for dep in deps:
        if dep['type'] != 'parallel' and dep['from'] in adj:
            adj[dep['from']].append(dep['to'])
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {s: WHITE for s in steps}
    def dfs(u):
        color[u] = GRAY
        for v in adj.get(u, []):
            if color.get(v) == GRAY: return True
            if color.get(v) == WHITE and dfs(v): return True
        color[u] = BLACK
        return False
    return any(dfs(s) for s in steps if color[s] == WHITE)


def check_refs(journey):
    steps_set = set(journey['steps'])
    broken = []
    for dep in journey.get('dependencies', []):
        if dep['from'] not in steps_set:
            broken.append((dep['from'], 'from'))
        if dep['to'] not in steps_set:
            broken.append((dep['to'], 'to'))
    return broken


def check_rules(journey, rules):
    steps_set = set(journey['steps'])
    dep_set = {(d['from'], d['to']) for d in journey.get('dependencies', [])}
    violations = []
    for rule in rules['universalRules']:
        a, b = rule['if_both_present']
        if a in steps_set and b in steps_set:
            expected = (rule['then']['from'], rule['then']['to'])
            if expected not in dep_set:
                violations.append((expected, rule['reason']))
    for rule in rules['categoryRules']:
        if journey['cat'] not in rule['categories']:
            continue
        a, b = rule['if_both_present']
        if a in steps_set and b in steps_set:
            expected = (rule['then']['from'], rule['then']['to'])
            if expected not in dep_set:
                violations.append((expected, rule['reason']))
    return violations


def check_reachability(journey):
    steps = journey['steps']
    deps = journey.get('dependencies', [])
    adj = {s: [] for s in steps}
    for dep in deps:
        if dep['type'] != 'parallel' and dep['from'] in adj:
            adj[dep['from']].append(dep['to'])
    has_incoming = {dep['to'] for dep in deps if dep['type'] != 'parallel'}
    entries = [s for s in steps if s not in has_incoming]
    visited = set(entries)
    queue = list(entries)
    while queue:
        u = queue.pop(0)
        for v in adj.get(u, []):
            if v not in visited:
                visited.add(v)
                queue.append(v)
    return [s for s in steps if s not in visited]


def main():
    data = json.load(open(DATA_PATH))
    rules = json.load(open(RULES_PATH))

    cycles = []
    bad_refs = []
    violations = []
    unreachable = []

    for journey in data['journeys']:
        if has_cycle(journey['steps'], journey.get('dependencies', [])):
            cycles.append(journey['id'])
        broken = check_refs(journey)
        if broken:
            bad_refs.append((journey['id'], broken))
        rule_viols = check_rules(journey, rules)
        if rule_viols:
            violations.append((journey['id'], rule_viols))
        unr = check_reachability(journey)
        if unr:
            unreachable.append((journey['id'], unr))

    print('=== VALIDATION REPORT ===')
    print(f'1. CYCLES:           {len(cycles)} {"PASS" if len(cycles) == 0 else "FAIL"}')
    for c in cycles: print(f'   CYCLE: {c}')
    print(f'2. REFERENCE INTEGRITY: {len(bad_refs)} {"PASS" if len(bad_refs) == 0 else "FAIL"}')
    for jid, broken in bad_refs: print(f'   {jid}: {broken}')
    print(f'3. RULE COMPLIANCE:  {sum(len(v) for _, v in violations)} {"PASS" if not violations else "FAIL"}')
    for jid, viols in violations:
        for expected, reason in viols:
            print(f'   {jid:25s} missing {expected[0]} -> {expected[1]} ({reason})')
    print(f'4. REACHABILITY:     {len(unreachable)} {"PASS" if len(unreachable) == 0 else "FAIL"}')
    for jid, unr in unreachable: print(f'   {jid}: {unr}')

    print()
    total_journeys = len(data['journeys'])
    with_deps = sum(1 for j in data['journeys'] if j.get('dependencies'))
    total_edges = sum(len(j.get('dependencies', [])) for j in data['journeys'])
    print(f'Summary: {with_deps}/{total_journeys} journeys with dependencies, {total_edges} total edges')

    all_pass = not (cycles or bad_refs or violations or unreachable)
    print(f'\n{"ALL CHECKS PASSED" if all_pass else "SOME CHECKS FAILED"}')
    sys.exit(0 if all_pass else 1)


if __name__ == '__main__':
    main()
```

### `scripts/analyze_journeys.py`

Useful queries against the dataset: entry points, topological levels, stats.

```python
#!/usr/bin/env python3
"""Analyze the journeys dataset.

Usage:
    python3 scripts/analyze_journeys.py [--journey JOURNEY_ID] [--levels]
"""

import argparse
import json
import os
from collections import Counter

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(REPO_ROOT, 'static/data/journeys.json')


def topological_levels(journey):
    steps = journey['steps']
    deps = journey.get('dependencies', [])
    adj = {s: [] for s in steps}
    in_deg = {s: 0 for s in steps}
    for dep in deps:
        if dep['type'] != 'parallel':
            adj[dep['from']].append(dep['to'])
            in_deg[dep['to']] += 1
    levels = []
    queue = [s for s in steps if in_deg[s] == 0]
    while queue:
        levels.append(list(queue))
        next_queue = []
        for u in queue:
            for v in adj[u]:
                in_deg[v] -= 1
                if in_deg[v] == 0:
                    next_queue.append(v)
        queue = next_queue
    return levels


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--journey', help='Analyze one journey')
    parser.add_argument('--levels', action='store_true', help='Show topological levels')
    args = parser.parse_args()

    data = json.load(open(DATA_PATH))
    node_map = {n['id']: n for n in data['plcNodes']}

    if args.journey:
        j = next((j for j in data['journeys'] if j['id'] == args.journey), None)
        if not j:
            print(f'Journey not found: {args.journey}')
            return
        print(f'{j["name"]} ({j["cat"]}) -- {len(j["steps"])} steps, {len(j.get("dependencies", []))} edges')
        if args.levels:
            print('\nTopological levels:')
            for i, level in enumerate(topological_levels(j)):
                names = [node_map[s]['name'] for s in level]
                print(f'  L{i}: {names}')
        return

    # Global stats
    print(f'Total journeys: {len(data["journeys"])}')
    print(f'Total PLC nodes: {len(data["plcNodes"])}')
    print(f'Total categories: {len(data["categories"])}')

    cat_counts = Counter(j['cat'] for j in data['journeys'])
    print('\nJourneys per category:')
    for cat, c in sorted(cat_counts.items()):
        print(f'  {cat:15s} {c}')

    edge_types = Counter()
    for j in data['journeys']:
        for dep in j.get('dependencies', []):
            edge_types[dep['type']] += 1
    print(f'\nTotal edges: {sum(edge_types.values())}')
    for t, c in sorted(edge_types.items()):
        print(f'  {t:10s} {c}')

    # Most reused nodes
    node_usage = Counter()
    for j in data['journeys']:
        for s in j['steps']:
            node_usage[s] += 1
    print('\nMost reused nodes:')
    for node_id, c in node_usage.most_common(10):
        print(f'  {node_id:20s} {c}/{len(data["journeys"])}')

    # Journey complexity
    print('\nJourney complexity:')
    sizes = [len(j['steps']) for j in data['journeys']]
    print(f'  Steps:   min={min(sizes)} max={max(sizes)} avg={sum(sizes)/len(sizes):.1f}')
    edge_sizes = [len(j.get('dependencies', [])) for j in data['journeys']]
    print(f'  Edges:   min={min(edge_sizes)} max={max(edge_sizes)} avg={sum(edge_sizes)/len(edge_sizes):.1f}')


if __name__ == '__main__':
    main()
```

---

## Common edge cases

Patterns that came up during the original research that you'll likely hit again.

### Edge case 1: Journeys without `ein`

Homeowner construction (home_remodel, adu, pool, deck, fence) and event-only journeys (block_party, popup) don't have `ein` in their steps. These are not business formation journeys.

**Handling:** Entry point is `zoning` (construction) or `event_permit` (events). The universal rule `ein -> biz_reg` doesn't fire because `ein` isn't present. Correct behavior.

### Edge case 2: Federal cert is the credential

For CDL and pilot journeys, the federal certification IS the professional credential. `dot` (CDL) and `faa` (pilot) are parallel entry points with `biz_reg`, not prerequisites for `prof_lic`.

**Handling:** Do NOT add `dot -> prof_lic` or `faa -> prof_lic` as universal rules. These are credentials that the journey is trying to obtain.

### Edge case 3: Cycle from blocking-flag interpretation

If you try to add `liquor -> state_health` because both are blocking and they're related, you might create a cycle with `state_health -> liquor` (the existing soft category rule).

**Handling:** When two nodes are both important gates, pick ONE direction based on the most common real-world sequence. Don't add bidirectional edges.

### Edge case 4: Steps that look like duplicates

`prof_lic` (state) and `contr_lic` (state) are both application-phase state credentials. They're not duplicates -- a contractor license is a business operating credential, separate from any individual trade license.

**Handling:** For trades (electrician, plumber): `prof_lic -> contr_lic` (you need the personal trade credential before the contractor business license).

### Edge case 5: Background check applies broadly

`bg_check` (federal preparation) is required not just for `prof_lic` but also for `foster_care`. Universal rules need both: `bg_check -> prof_lic` AND `bg_check -> foster_care`.

**Handling:** When a node has multiple downstream targets, add a universal rule for each pair. Don't try to encode "bg_check is required before all credential applications" -- be explicit.

### Edge case 6: Event permit vs. fire marshal ordering

For large events, fire marshal approval is required before the event permit. For small events, no fire marshal review is involved.

**Handling:** Category rule for `events`: `fire_marshal -> event_permit` (hard) when both present. Small events don't include `fire_marshal` in their steps, so the rule doesn't fire.

### Edge case 7: Empty `steps` arrays

Should not exist. If a journey has zero steps, it's a data error.

**Handling:** Validation script should catch this if you add an `empty_steps` check (not currently in the suite).

---

## How to extend

Recipes for the most common modifications.

### Recipe 1: Add a new journey

1. Pick a category (existing, or add a new one -- see Recipe 3).
2. Identify which PLC nodes the journey needs. Reuse existing nodes if possible.
3. Add to `journeys` array:
   ```json
   {
     "id": "new_journey",
     "name": "Become a Licensed X",
     "cat": "proflic",
     "steps": ["ein", "biz_reg", "prof_lic", "biz_license"]
   }
   ```
4. Run `python3 scripts/generate_dependencies.py --journey new_journey --dry-run` to see what edges the rule engine produces.
5. Review and add to the journey:
   ```json
   "dependencies": [
     { "from": "ein", "to": "biz_reg", "type": "hard" },
     ...
   ]
   ```
6. Run `python3 scripts/validate_dependencies.py` -- must pass.
7. Spot-check the topological levels: `python3 scripts/analyze_journeys.py --journey new_journey --levels`

### Recipe 2: Add a new PLC node

1. Decide jurisdiction (federal, state, local) and phase (preparation, application, inspection, active).
2. Add to `plcNodes` array:
   ```json
   {
     "id": "new_node",
     "name": "Display Name",
     "jurisdiction": "state",
     "phase": "application",
     "agency": "Department of X",
     "description": "What this PLC is for.",
     "fee": "$X-$Y",
     "estTime": "N Weeks",
     "renewalTerm": "Annual",
     "required": true,
     "blocking": false
   }
   ```
3. Reference it in any journeys that need it.
4. Consider adding universal rules: does this node have known prerequisites in all journeys where it appears? If so, add to `dependency-rules.json`.
5. Regenerate and validate.

### Recipe 3: Add a new category

1. Add to `categories` array: `{ "id": "new_cat", "name": "New Category" }`
2. Use the new ID in `cat` field of new journeys.
3. Consider category-specific rules: does this category have unique dependency patterns?
4. Regenerate and validate.

### Recipe 4: Add a new universal rule

1. Identify the pattern: "Whenever X and Y both appear in a journey, X must come before Y."
2. Add to `dependency-rules.json`:
   ```json
   {
     "if_both_present": ["X", "Y"],
     "then": { "from": "X", "to": "Y", "type": "hard" },
     "reason": "Explanation"
   }
   ```
3. Run `python3 scripts/generate_dependencies.py` to regenerate dependencies for all journeys.
4. Validate. The new rule will now be enforced.

### Recipe 5: Add a new category rule

Same as Recipe 4, but in the `categoryRules` section with a `categories` array specifying which categories the rule applies to.

### Recipe 6: Add a new tier of journeys

When you outgrow the 5 existing tiers (e.g., adding a whole new domain like international trade, or healthcare facility-specific journeys):

1. Identify the unifying pattern -- what backbone do the new journeys share?
2. Document it in the [Generation Playbook](#generation-playbook) section above (or in a fork of this doc).
3. Generate dependencies tier-by-tier as before.
4. Add category rules as patterns become clear within the tier.

---

## PR workflow

When the sandbox can't push directly via `git push` (common in CI/sandbox environments), use the GitHub API.

### Option A: git push (when authentication works)

```bash
git checkout -b feat/<name>
# make changes
git add <files>
git commit -m "Message"
git push -u origin feat/<name>
gh pr create --title "Title" --body "Body"
```

### Option B: GitHub API (sandbox fallback)

When `git push` fails with authentication errors, use the GitHub integration tools:

1. **Get current master HEAD SHA:**
   ```
   GITHUB_GET_A_BRANCH(owner, repo, branch="master")
   # Returns commit.sha
   ```

2. **Create the branch:**
   ```
   GITHUB_CREATE_A_REFERENCE(
     owner, repo,
     ref="refs/heads/feat/<name>",
     sha=<master_head_sha>
   )
   ```

3. **Push each file:**
   ```
   GITHUB_CREATE_OR_UPDATE_FILE_CONTENTS(
     owner, repo,
     path="path/to/file.md",
     branch="feat/<name>",
     message="commit message",
     content=<file_content>  # plain text, API auto-encodes to base64
   )
   ```

4. **For large files (>10MB):** use the Git Data API:
   - `GITHUB_CREATE_A_BLOB` with base64-encoded content
   - `GITHUB_CREATE_A_TREE` with base_tree (the branch's current tree) + blob references
   - `GITHUB_CREATE_A_COMMIT` with tree SHA and parent
   - `GITHUB_UPDATE_A_REFERENCE` to advance the branch to the new commit

5. **Open the PR:**
   ```
   GITHUB_CREATE_A_PULL_REQUEST(
     owner, repo,
     head="feat/<name>",
     base="master",
     title="...",
     body="..."
   )
   ```

### Common pitfalls

- **The "branch does not exist" gotcha:** If you call `GITHUB_CREATE_OR_UPDATE_FILE_CONTENTS` with a `branch` parameter that doesn't exist, it silently falls back to master and commits there. Always create the branch FIRST with `GITHUB_CREATE_A_REFERENCE`.
- **Update vs. create:** If the file already exists on the branch (e.g., from an earlier failed push), you must pass `sha` (the existing file's blob SHA). Get it via `GITHUB_GET_REPOSITORY_CONTENT`.
- **Large file size limits:** `GITHUB_CREATE_OR_UPDATE_FILE_CONTENTS` accepts files up to ~10MB inline. For larger files, use the Git Data API (blobs + tree + commit).
- **Rate limits:** Pushing 30+ files via one-file-per-call hits rate limits. Batch with `GITHUB_CREATE_A_TREE`.

### Validation before pushing

Always run the validation suite before opening a PR:

```bash
python3 scripts/validate_dependencies.py
# Must exit 0. If not, fix the violations first.
```

---

## When to update this doc

Update this doc whenever:
- You add a new reference data source (add to Section 4)
- You add a new rule type or change the rule engine semantics (Section 5)
- You add a new tier of journeys (Section 6)
- You add a new validation check (Section 7)
- You discover an edge case worth documenting (Section 10)
- You evolve the schema (Section 8)

This doc is the methodology contract. Keep it accurate and your future self will thank you.
