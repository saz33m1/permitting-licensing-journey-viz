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
- Exhaustive — real jurisdictions have many additional niche permits
- Ordered by dependency — the `steps` array is grouped by jurisdiction level (federal → state → local), not by true dependency chain
- Validated against a specific state or city's actual requirements

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

### Future improvements

- Add a `dependencies` field to steps (e.g., "must get EIN before state business registration")
- Add `typicalDuration` and `typicalCost` fields per step for richer visualization
- Cross-reference with actual state datasets (MD PLC catalog, NJ Navigator) to validate coverage
- Add a `jurisdictionSpecific` variant system to support state/city-specific overrides on top of the generic model
