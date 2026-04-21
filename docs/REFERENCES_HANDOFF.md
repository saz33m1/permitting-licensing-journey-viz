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

See full doc in `docs/REFERENCES_HANDOFF.md` in the repo.