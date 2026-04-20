# Data Collection Methodology

How the 114 journeys, 58 PLC nodes, and 15 categories in `static/data/journeys.json` were compiled.

## Approach

The dataset represents **archetypal** cross-jurisdiction journeys — what PLC (Permit, License, Compliance) steps a person typically encounters across federal, state, and local government. It is deliberately **not specific to any single state or city**. The goal is to demonstrate the systemic complexity of the permitting landscape for stakeholder communication.

### Three-layer classification

Every PLC step is assigned to exactly one jurisdiction level:

- **Federal** — agencies like IRS (EIN), FDA, ATF, EPA, FAA, DEA, USDA, DOT/FMCSA, FCC, NRC, Army Corps (wetlands)
- **State** — Secretary of State (business registration), state tax authorities, professional licensing boards, ABC (liquor), state environmental agencies, state health departments, fire marshal
- **Local (City/County)** — planning/zoning, building department, fire department, health inspectors, code enforcement, special use/event permits

### Sources and reasoning

The data was compiled using domain knowledge from:

1. **NJ Business.NJ.gov / Navigator** — New Jersey's open-source business formation platform (github.com/newjersey/navigator.business.nj.gov). Its NAICS-based starter kit framework maps business types to required PLC steps. This was the primary structural reference for business formation journeys.

2. **Maryland PLC Catalog** — Maryland's dataset of 1,058 PLC types with operational metadata (fees, processing times, administering agencies). Created under the Transparent Government Act of 2024. Used to validate PLC node coverage and identify gaps.

3. **DOL CareerOneStop License Finder** — Federal database covering licensing requirements across all states/territories. Used for professional and occupational licensing journeys.

4. **NCSL Occupational Licensing Database** — National Conference of State Legislatures data on 48 occupations across all states. Cross-referenced for professional licensing step accuracy.

5. **WVU Knee Center Dataset** — 96 professions across 51 jurisdictions. Used for cross-state comparison of professional licensing patterns.

6. **SBA.gov and business formation guides** — General business startup requirements at federal, state, and local levels. Used for common business journeys (restaurant, retail, salon, etc.).

7. **Municipal code references** — General patterns from city/county permitting offices for construction, land use, events, and housing categories. Not jurisdiction-specific but representative of common local requirements.

### What the data IS and IS NOT

**IS:**
- A representative model of how PLC requirements distribute across jurisdiction levels
- An abstraction useful for stakeholder presentations and system design
- Expandable — new journeys, nodes, and categories can be added to `static/data/journeys.json`
- Directionally accurate for the "typical" US jurisdiction

**IS NOT:**
- A legal compliance guide for any specific jurisdiction
- Exhaustive -- real jurisdictions have many additional niche permits
- **Ordered by true dependency** -- see [Serious gap: No true step dependencies](#serious-gap-no-true-step-dependencies) below
- Validated against a specific state or city's actual requirements

### Serious gap: No true step dependencies

**This is the most significant deficiency in the current dataset.** The `steps` array in each journey is a flat, ordered list of PLC node IDs. There is no edge model -- no way to express "you must complete X before you can start Y." The current ordering does not reliably reflect the real-world sequence a human would follow.

#### What the data actually does

Empirical analysis across all 114 journeys:

| Metric | Count |
|--------|-------|
| Journeys where steps are strictly ordered federal then state then local | 102/114 (89%) |
| Journeys where steps are strictly ordered by phase (preparation then application then inspection then active) | 33/114 (29%) |

The `steps` array is predominantly **jurisdiction-grouped**, not dependency-ordered. Within each jurisdiction block, phase ordering is inconsistent. For example, the restaurant journey places "Federal Tax Filing" (phase: `active`) as step 2, before any state-level steps, because it falls under the federal jurisdiction block -- not because it logically comes second in a real startup sequence.

The 12 journeys that break jurisdiction ordering (demolition, cell tower, subdivision, mining, etc.) do so for genuine dependency reasons -- they place state environmental review after local permits because environmental review actually depends on having a site-specific application. These are the exceptions that prove the rule: the rest of the dataset follows jurisdiction grouping, not dependency logic.

#### Field-by-field gap analysis

Can existing node metadata derive a dependency graph?

| Field | Verdict | Detail |
|-------|---------|--------|
| `phase` | **PARTIAL** | Gives inter-phase sequence (preparation before application before inspection before active). But 111 of 114 journeys have multiple steps in the same phase. Restaurant has 4 inspection steps and 5 active steps with no way to order within those groups. |
| `blocking` | **MINIMAL** | 13 nodes flagged as gates, but no targets or directionality. We know Zoning is a gate but not that it specifically gates Building Permit. See details below. |
| `description` | **NO** | Every "required" match is "this permit is required for [activity]" -- describes what the permit IS, not what prerequisites it demands. Zero descriptions say "requires X before applying." |
| `agency` | **NO** | Same agency does not imply dependency. Different agencies do not imply independence. |
| NJ Navigator cross-ref | **PARTIAL** | Maps to only ~4 of our 58 nodes (EIN, business registration, state tax, zoning). Covers business formation backbone only. |
| SBA 10-step cross-ref | **PARTIAL** | Covers business formation sequence. No help for construction, professional licensing, events, land use, housing, or environmental categories. |

**Verdict:** The dependency data must be created as new data. Phase gives rough inter-phase ordering. The blocking flag gives 13 "this is important" markers. But neither produces actual edges. Descriptions, agency, and reference data cross-references do not bridge the gap.

#### What "blocking" does and does not do

The `blocking: boolean` field on 13 of 58 nodes is the closest thing to a dependency signal. It marks nodes that are critical gates (Zoning Approval, Building Permit, Fire Inspection, Certificate of Occupancy, Liquor License, etc.). However:

- `blocking` is a **node attribute**, not an **edge**. It says "this node is a gate" but not "this node gates *which* downstream nodes."
- It has no directionality or target. There is no way to derive a dependency graph from it.
- The UI uses it only for animation pacing (slower easing on blocking nodes) and visual emphasis, not for structural path computation.

#### Why this matters

The whole point of this project is to show people the real path they need to walk. A jurisdiction-grouped list gives the right *set* of steps but the wrong *sequence*. Someone opening a restaurant needs to know: "Get your EIN first, then register the business entity, then apply for your health license -- and you can start the zoning process in parallel." The current data cannot express that.

This gap also affects:
- The animated flow-path overlay, which traces steps in array order and implies a dependency narrative that does not exist in the data
- Any future feature that computes estimated total timeline (parallel steps compress time; sequential steps extend it)
- The methodology page, which claims steps are "ordered by real-world dependency chains" -- a claim the data does not support

#### Recommended approach

See [Recommended approach for adding dependencies](#recommended-approach-for-adding-dependencies) at the end of this document.

### Category design

The 15 categories were chosen to span the full breadth of government-citizen PLC interactions:

| Category | What it covers | Why included |
|----------|---------------|--------------|
| Food & Beverage | Restaurants, food trucks, breweries | Highest-volume, most recognizable |
| Retail & Services | Stores, salons, auto repair | Broad small business category |
| Health & Wellness | Medical practices, pharmacies, gyms | Heavy regulation, multi-jurisdiction |
| Childcare & Education | Daycares, schools | High public safety stakes |
| Construction Trades | Starting a contracting business | Trade licensing is a major PLC category |
| Professional Services | Law, accounting, insurance | White-collar professional licensing |
| Transportation | Trucking, taxi, moving | Federal DOT involvement |
| Animal Services | Vet, pet store, grooming | USDA + state + local overlap |
| Specialty & Regulated | Cannabis, firearms, hotels | Heavily regulated industries |
| Professional & Occupational Licensing | Individual credential journeys | Core Catalyst use case |
| Building & Construction Projects | Actual construction permits | Distinct from trade businesses |
| Land Use & Development | Subdivision, rezoning, mining | Environmental + zoning complexity |
| Events & Temporary Permits | Festivals, film shoots, pop-ups | Time-limited but multi-agency |
| Residential & Housing | Landlord, Airbnb, foster care | Growing regulatory area |
| Environmental & Agriculture | Farms, water rights, composting | State + federal environmental |

### PLC node design principles

1. **Abstract enough to be jurisdiction-agnostic** — "Professional License" not "Maryland Board of Nursing License #12345"
2. **Specific enough to be meaningful** — separate nodes for closely-related but functionally distinct PLCs (e.g., "Contractor License" vs "Professional License")
3. **One jurisdiction per node** — every PLC node belongs to exactly one level (federal, state, or local)
4. **Reusable across journeys** — nodes are shared (e.g., "Business License" appears in 90+ journeys)

### How to expand the dataset

1. **Add a journey:** Append to the `journeys` array in `static/data/journeys.json`. Reference existing PLC node IDs in `steps`. If a step doesn't exist, add the node first.

2. **Add a PLC node:** Append to `plcNodes` array. Choose the correct `jurisdiction`. Pick a clear, generic `name`.

3. **Add a category:** Append to `categories` array. Reference the new `id` in journey entries.

4. **Validate:** Run `npm run dev` and check that new journeys render correctly across the phase × jurisdiction matrix. Nodes referenced by a journey but missing from `plcNodes`, or nodes with an unknown `phase`/`jurisdiction`, will show up broken in the grid.

### Recommended approach for adding dependencies

#### Schema: Journey-level dependency edges (Option A)

Add an optional `dependencies` array to each journey in `journeys.json`:

```json
{
  "id": "restaurant",
  "name": "Open a Restaurant",
  "cat": "food",
  "steps": ["ein", "biz_reg", "state_tax", "sales_tax", "state_health", "liquor", "zoning", "building", "fire_insp", "health_insp", "biz_license", "signage"],
  "dependencies": [
    { "from": "ein",         "to": "biz_reg",     "type": "hard" },
    { "from": "biz_reg",     "to": "state_tax",   "type": "hard" },
    { "from": "biz_reg",     "to": "sales_tax",   "type": "hard" },
    { "from": "biz_reg",     "to": "state_health", "type": "hard" },
    { "from": "state_health","to": "liquor",       "type": "soft" },
    { "from": "zoning",      "to": "building",    "type": "hard" },
    { "from": "building",    "to": "fire_insp",   "type": "hard" },
    { "from": "building",    "to": "health_insp", "type": "hard" },
    { "from": "fire_insp",   "to": "biz_license", "type": "hard" },
    { "from": "health_insp", "to": "biz_license", "type": "hard" },
    { "from": "biz_license", "to": "signage",     "type": "soft" }
  ]
}
```

**Why journey-level, not node-level:** The same PLC node can have different prerequisites in different journey contexts. A "Business License" depends on passing health inspection in a restaurant journey, but not in a bookkeeping firm journey. Journey-level edges capture that context.

**Edge types:**

| Type | Meaning | Example |
|------|---------|--------|
| `hard` | Legally required prerequisite. You cannot apply for Y until X is complete. | Zoning Approval before Building Permit |
| `soft` | Practically necessary or strongly recommended, but not legally gated. | Business License before Signage Permit |
| `parallel` | These steps can proceed simultaneously once their shared prerequisites are met. | Fire Inspection and Health Inspection (both require Building Permit, but are independent of each other) |

**Steps without any incoming dependency edge** are entry points -- they can be started immediately. Steps with multiple incoming edges require all prerequisites to be met (AND logic). The `parallel` type is used to explicitly mark steps that share prerequisites but have no dependency on each other, which is useful for timeline estimation.

**Backward compatibility:** The `dependencies` field is optional. Journeys without it behave exactly as they do today (flat step list, no dependency information). This allows incremental migration -- add dependencies to one journey at a time.

#### Consistency harness: `dependency-rules.json`

To prevent inconsistency as the dataset grows, maintain a separate rules file that encodes **universal dependency patterns**. These are relationships that hold true in every journey where both nodes appear:

```json
{
  "universalRules": [
    { "if_both_present": ["ein", "biz_reg"],       "then": { "from": "ein",      "to": "biz_reg",    "type": "hard" }, "reason": "EIN required for state business registration filing" },
    { "if_both_present": ["biz_reg", "state_tax"],  "then": { "from": "biz_reg",  "to": "state_tax",  "type": "hard" }, "reason": "Business entity must exist before registering for state taxes" },
    { "if_both_present": ["zoning", "building"],     "then": { "from": "zoning",   "to": "building",   "type": "hard" }, "reason": "Zoning approval required before building permit application" },
    { "if_both_present": ["building", "fire_insp"],  "then": { "from": "building", "to": "fire_insp",  "type": "hard" }, "reason": "Building permit must be issued before fire inspection can be scheduled" },
    { "if_both_present": ["building", "health_insp"],"then": { "from": "building", "to": "health_insp","type": "hard" }, "reason": "Building permit must be issued before health inspection can be scheduled" },
    { "if_both_present": ["fire_insp", "cert_occ"],  "then": { "from": "fire_insp","to": "cert_occ",   "type": "hard" }, "reason": "Fire inspection clearance required for certificate of occupancy" }
  ],
  "categoryRules": [
    { "categories": ["food"], "if_both_present": ["state_health", "health_insp"], "then": { "from": "state_health", "to": "health_insp", "type": "hard" }, "reason": "State health license must be issued before local health inspection" }
  ]
}
```

**How the rules work:**
1. When adding a new journey, run a validation check against the rules file.
2. For every rule where both `if_both_present` nodes appear in the journey's `steps`, check that a matching edge exists in the journey's `dependencies`.
3. If the edge is missing, the validator flags it. The author either adds the edge or documents an explicit exception.
4. Rules also serve as a starter template: when building dependencies for a new journey, auto-populate from applicable rules, then refine.

The rules file should grow organically as dependencies are added to more journeys and common patterns emerge.

#### Data collection plan

Dependencies will be built using AI-assisted extraction validated against reference data and human review. The process for each journey:

1. **AI proposes:** Feed the journey's step list and node metadata to an LLM with the prompt: "Given these PLC steps for [journey name], what is the realistic prerequisite chain a human would follow? Which steps can run in parallel? Classify each dependency as hard, soft, or parallel."
2. **Reference data validates:** Cross-check the proposed edges against:
   - **NJ Navigator's `task-dependencies.json`** (32 explicit prerequisite entries for business formation tasks) -- available in `reference-data/nj-navigator/roadmaps/task-dependencies.json`
   - **SBA 10-step guide** dependency graph (plan then register then launch sequence) -- available in `reference-data/sba/SUMMARY.md`
   - **Maryland PLC catalog** processing metadata (which agencies gate which downstream approvals) -- available in `reference-data/maryland-plc/plc-data-catalog.csv`
3. **Human reviews:** A human validates the proposed dependency set, resolves ambiguities, and adds domain knowledge.
4. **Rules check:** Run the validated dependencies against `dependency-rules.json` to ensure universal patterns are respected.

**Prioritization:** Start with the highest-traffic categories (Food & Beverage, Retail & Services, Building & Construction) and the most-viewed individual journeys (restaurant, food truck, home addition). These cover the most reused nodes and will establish the majority of universal rules.

#### Reference data inventory

The following reference datasets are available in the `reference-data/` directory for cross-validation:

| Source | Path | Records | Key fields for dependency analysis |
|--------|------|---------|-------------------------------------|
| NJ Navigator | `reference-data/nj-navigator/` | 32 dependency entries, 7 industry roadmaps | Explicit `taskDependencies` graph; step + weight ordering within phases |
| Maryland PLC catalog | `reference-data/maryland-plc/` | 1,058 PLC types | Agency, processing time, fees, IT systems -- useful for identifying bottleneck gates |
| SBA 10-step guide | `reference-data/sba/` | 10 steps | Extracted dependency graph from page text; plan-then-launch macro sequence |
| DOL CareerOneStop | `reference-data/dol-careeronestop/` | All licensed occupations, all states | Requirement flags (education, exam, experience) -- useful for professional licensing journey deps |
| WVU Knee Center | `reference-data/knee-center/` | 96 professions x 51 jurisdictions | Trainee/apprentice tiers encode implicit prerequisite chains |

#### Validation script spec

A validation script (e.g., `scripts/validate-dependencies.py`) should check:

1. **Rule compliance:** For each journey with dependencies, verify all applicable universal and category rules are satisfied.
2. **Reference integrity:** Every node ID in a `from` or `to` field must exist in the journey's `steps` array.
3. **Acyclicity:** The dependency graph for each journey must be a DAG (directed acyclic graph). Flag any cycles.
4. **Reachability:** Every step in the journey should be reachable from at least one entry point (a step with no incoming edges).
5. **Completeness signal:** Report which journeys have dependencies and which do not, so progress can be tracked.

### Other future improvements

- Add `typicalDuration` and `typicalCost` structured fields per step (replacing free-form string parsing) for richer visualization and timeline estimation
- Cross-reference with actual state datasets (MD PLC catalog, NJ Navigator) to validate node coverage
- Add a `jurisdictionSpecific` variant system to support state/city-specific overrides on top of the generic model
