# Maryland PLC Data Catalog - Summary

## Source

- **Dataset**: PLC Data Catalog
- **Publisher**: Maryland Open Data Portal (opendata.maryland.gov)
- **Catalog page**: https://opendata.maryland.gov/d/gdzy-2fen
- **Data.gov entry**: https://catalog.data.gov/dataset/plc-data-catalog
- **Download URL**: https://opendata.maryland.gov/api/views/gdzy-2fen/rows.csv?accessType=DOWNLOAD
- **Local file**: `plc-data-catalog.csv` (1.9 MB)
- **Legal basis**: Maryland Transparent Government Act of 2024
- **Data published**: January 15, 2026; last modified January 16, 2026
- **Fiscal year represented**: 2026 (all 1,058 rows)

## Dataset Dimensions

| Metric | Value |
|--------|-------|
| Total rows (PLC types) | 1,058 |
| Total columns | 28 |
| File size | 1.9 MB |

## Columns (28 total)

| # | Column Name | Notes |
|---|-------------|-------|
| 1 | PLC Title | Name of the permit, license, or certificate |
| 2 | PLC Description | Free-text description |
| 3 | Duration Length | Numeric part of validity period |
| 4 | Legal Authority | Statute / COMAR citation |
| 5 | Application Method | How applications are submitted |
| 6 | IT System(s) | Software/system used to administer |
| 7 | Manual Tasks | Human-step description |
| 8 | Current Processing Timeline (Days) | Days to final decision |
| 9 | Application Fees | Dollar amount (numeric) |
| 10 | Revenue Allocation | Where fees go |
| 11 | Recommended Changes | Suggested statutory or resource changes |
| 12 | Is Timeline Met? | Boolean: true/false |
| 13 | Duration Type | Years / Months / Days / Indefinite / Variable |
| 14 | Submission Date/Time | When record was submitted |
| 15 | Fiscal Year | Reporting year (all = 2026) |
| 16 | Factors Impeding Timely Processing | Bottleneck description |
| 17 | Application Process | Narrative process description |
| 18 | Last Modified | Record modification timestamp |
| 19 | Applications | Volume of applications |
| 20 | Issuances | Volume of issuances |
| 21 | Review Complexity Check | Boolean / free-text on field-agent requirement |
| 22 | Review Complexity | Detailed description of review process |
| 23 | Department | Issuing department |
| 24 | Agency | Sub-agency within department |
| 25 | Department Abbrevation | Abbreviation (sic) |
| 26 | Criminal History | Criminal background check requirements |
| 27 | Significant Prior Updates | History of changes |
| 28 | Duration Explaination | Explanation of validity period (sic) |

## Key Statistics

### Issuing Departments (top 10)

| Department | PLC Count |
|------------|-----------|
| Department of Health | 374 |
| Department of Labor | 168 |
| Department of Natural Resources | 126 |
| Department of the Environment | 112 |
| Alcohol Tobacco and Cannabis Commission | 70 |
| Maryland Insurance Administration | 43 |
| State Lottery and Gaming Control Agency | 36 |
| Public Service Commission | 30 |
| Department of State Police | 20 |
| Maryland Cannabis Administration | 15 |

### Duration Types

| Type | Count |
|------|-------|
| Years | 759 |
| Indefinite | 164 |
| Variable | 101 |
| Days | 21 |
| Months | 13 |

### Application Fees

| Metric | Value |
|--------|-------|
| Rows with numeric fee | 1,058 (100%) |
| No-fee PLCs ($0) | 293 (27.7%) |
| PLCs with fees | 765 (72.3%) |
| Minimum fee | $0 |
| Maximum fee | $2,000,000 |
| Average processing timeline | 60.9 days |
| Minimum processing timeline | 0 days |
| Maximum processing timeline | 1,080 days |

### Timeline Compliance

| Status | Count | Pct |
|--------|-------|-----|
| Timeline NOT met (`false`) | 955 | 90.3% |
| Timeline met (`true`) | 103 | 9.7% |

Note: 90.3% of PLC types report that their stated processing timeline is not being met — a key finding indicating systemic backlog across Maryland agencies.

### Application Methods (top 5)

| Method | Count |
|--------|-------|
| Online (Web or Mobile) | 316 |
| Mail | 117 |
| Online + In Person | 90 |
| Online + Mail | 88 |
| Online + Mail + In Person | 61 |

### IT Systems (top 5 distinct entries)

| System | Count |
|--------|-------|
| MD Outdoors (web portal) | 88 |
| OneStop and Salesforce | 69 |
| Smartsheet | 64 |
| MyLicensing Office (MLO) | 61 |
| BPQA (in-house proprietary) | 58 |

There are 207 distinct IT system descriptions, reflecting significant fragmentation across agencies.

## Sample Records

**Record 1**: Charity deer processing plant
- Department: Department of Health / Public Health Administration
- Fee: $0, Duration: 1 Year, Timeline: 30 days (NOT met)

**Record 2**: Center for recreation and community
- Department: Department of Health / Public Health Administration
- Fee: $50, Duration: 1 Year, Timeline: 30 days (NOT met), IT: Salesforce

**Record 3**: Emergency Medical Responder
- Department: Maryland Institute for Emergency Medical Services Systems
- Fee: $0, Duration: 3 Years, Timeline: 5 days (NOT met), IT: Image Trend

## Relevance for Dependency Enrichment

This dataset is valuable for enriching permit dependency relationships because:

1. **Agency identification**: The `Department` and `Agency` columns let you map PLC types to the exact administering body, enabling cross-agency dependency detection.
2. **Processing timelines**: `Current Processing Timeline (Days)` provides realistic wait-time estimates for critical-path analysis in multi-permit workflows.
3. **Fee data**: `Application Fees` enables cost modeling for permit stacks.
4. **IT systems**: The `IT System(s)` column reveals which systems share infrastructure, hinting at bundling or cross-agency coordination opportunities.
5. **Modernization signals**: `Is Timeline Met?` (90% false) and `Recommended Changes` expose which PLCs are bottlenecks — useful for flagging high-risk dependencies.
6. **Legal authority**: `Legal Authority` links each PLC to its COMAR / statutory citation, enabling authoritative prerequisite chain validation.
7. **Duration types**: Validity period data helps model renewal cascades in dependent permit stacks.

## Files in This Directory

| File | Description |
|------|-------------|
| `plc-data-catalog.csv` | Full dataset, 1,058 rows, 28 columns, 1.9 MB |
| `SUMMARY.md` | This file |
