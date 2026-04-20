# SBA 10-Step Business Startup Guide — Summary

## Source
- **URL**: https://www.sba.gov/business-guide/10-steps-start-your-business
- **Publisher**: U.S. Small Business Administration (SBA)
- **Last crawled**: April 2026
- **Page publication date**: ~2023 (content is evergreen / continuously maintained)

## Files Downloaded

| File | Description | Size |
|------|-------------|------|
| `sba-10-steps.html` | Full HTML of the canonical 10-step page | ~106 KB |
| `step-market-research-competitive-analysis.html` | Step 1 detail page | ~112 KB |
| `step-write-your-business-plan.html` | Step 2 detail page | ~121 KB |
| `step-fund-your-business.html` | Step 3 detail page | ~121 KB |
| `step-pick-your-business-location.html` | Step 4 detail page | ~113 KB |
| `step-choose-business-structure.html` | Step 5 detail page | ~121 KB |
| `step-register-your-business.html` | Step 7 detail page | ~129 KB |
| `step-get-federal-state-tax-id-numbers.html` | Step 8 detail page | ~121 KB |
| `step-apply-licenses-permits.html` | Step 9 detail page | ~110 KB |

Note: Steps 6 (Choose a business name) and 10 (Open a business bank account) have direct SBA sub-pages but were not separately archived; their content is summarized below.

## The 10 Steps — Ordered Sequence

The SBA presents these as a numbered, sequential checklist. The stated framing is:
> "Starting a business involves planning, making key financial decisions, and completing a series of legal activities."

| Step | Title | SBA Sub-page URL |
|------|-------|------------------|
| 1 | Conduct market research | /business-guide/plan-your-business/market-research-competitive-analysis |
| 2 | Write your business plan | /business-guide/plan-your-business/write-your-business-plan |
| 3 | Fund your business | /business-guide/plan-your-business/fund-your-business |
| 4 | Pick your business location | /business-guide/launch-your-business/pick-your-business-location |
| 5 | Choose a business structure | /business-guide/launch-your-business/choose-business-structure |
| 6 | Choose your business name | /business-guide/launch-your-business/choose-your-business-name |
| 7 | Register your business | /business-guide/launch-your-business/register-your-business |
| 8 | Get federal and state tax IDs | /business-guide/launch-your-business/get-federal-state-tax-id-numbers |
| 9 | Apply for licenses and permits | /business-guide/launch-your-business/apply-licenses-permits |
| 10 | Open a business bank account | /business-guide/launch-your-business/open-business-bank-account |

## Step Descriptions (from page text)

**Step 1 — Conduct market research**
Market research tells you if there's an opportunity to turn your idea into a successful business. It's a way to gather information about potential customers and businesses already operating in your area. Use that information to find a competitive advantage.

**Step 2 — Write your business plan**
Your business plan is the foundation of your business — a roadmap for how to structure, run, and grow your new business. Used to convince people (partners, investors) that working with you is a smart choice.

**Step 3 — Fund your business**
Your business plan will help you figure out how much money you'll need to start. If you don't have that amount on hand, you'll need to either raise or borrow capital.

**Step 4 — Pick your business location**
One of the most important decisions you'll make. Whether setting up a brick-and-mortar business or launching an online store, the choices could affect your taxes, legal requirements, and revenue.

**Step 5 — Choose a business structure**
The legal structure you choose will impact your business registration requirements, how much you pay in taxes, and your personal liability.

**Step 6 — Choose your business name**
Reflect your brand and capture your spirit. Ensure the business name isn't already being used by someone else.

**Step 7 — Register your business**
Once you've picked the perfect business name, make it legal and protect your brand. If doing business under a name different than your own, you'll need to register with the federal government, and possibly your state government.

**Step 8 — Get federal and state tax IDs**
You'll use your employer identification number (EIN) for important steps: opening a bank account, paying taxes. Some (not all) states require a state tax ID as well.

**Step 9 — Apply for licenses and permits**
Stay legally compliant. The licenses and permits needed vary by industry, state, location, and other factors.

**Step 10 — Open a business bank account**
A small business checking account helps handle legal, tax, and day-to-day issues. Requires the right registrations and paperwork already in place.

## Explicit Prerequisites and Ordering Logic

The SBA page numbers these 1–10, signaling a recommended sequence, but does NOT use the word "prerequisite" explicitly. Implied ordering dependencies extracted from page language:

### Hard sequential dependencies (stated in text):
- **Step 2 requires Step 1**: "Your business plan will help you figure out how much money you'll need" — plan is built from market research data.
- **Step 3 requires Step 2**: "Your business plan will help you figure out how much money you'll need to start." The plan produces the funding target.
- **Step 7 requires Step 5 and Step 6**: "Once you've picked the perfect business name, it's time to make it legal" — registration requires knowing both structure (step 5, which determines what entity to register) and name (step 6).
- **Step 8 partially requires Step 7**: EIN is used "like opening a bank account" — implies EIN comes before banking. Registration paperwork feeds into EIN application.
- **Step 10 requires Step 7 and Step 8**: "It's easy to set one up if you have the right registrations and paperwork ready" — bank account requires the registrations and EIN/tax IDs.
- **Step 9 requires Step 7**: Licenses are applied for after the business entity is registered (you must have a legal entity to apply for most licenses). Also: location (step 4) determines which licenses are required.

### Looser / advisory ordering:
- Steps 1–3 are grouped under "plan-your-business" URL path; steps 4–10 are under "launch-your-business" — indicating a plan-first, launch-second macro sequence.
- Step 4 (location) can happen somewhat in parallel with steps 5–6, but must precede step 9 because license requirements vary by state and locality.
- Step 5 (business structure) should precede step 6 (naming) because some structures (e.g., LLC, corporation) have naming requirements and conventions.

### Dependency graph (implied):

```
1 (market research)
  └─► 2 (business plan)
        └─► 3 (funding)

4 (location) ───────────────────────────────────────────────────┐
5 (structure) ──► 6 (name) ──► 7 (register) ──► 8 (tax IDs) ──► 10 (bank account)
                                      │
                          4 (location) ──► 9 (licenses & permits)
                          7 (register) ──► 9
```

## URL Structure Notes

The SBA organizes sub-pages into two phases:
- `/business-guide/plan-your-business/` — Steps 1–3
- `/business-guide/launch-your-business/` — Steps 4–10

This URL taxonomy reinforces the plan → launch ordering.

## Data Format

All files are HTML pages (standard web pages). No CSV/JSON structured data is provided by SBA directly. The structured data extracted above was parsed from page text.

## Useful for Step Dependencies

- The numbered sequence is the authoritative SBA ordering.
- The text of each step description contains language that makes sequencing rationale explicit (e.g., "once you've picked the name," "your business plan will help you figure out how much money").
- Step 9 (licenses and permits) is the primary touchpoint with occupational licensing databases (CareerOneStop, Knee Center data).
- The SBA page for step 9 links to the SBA's own license tool: https://www.sba.gov/business-guide/launch-your-business/apply-licenses-permits — which in turn references state and federal licensing resources.
