# Journey Data Audit Report

**Date:** 2026-04-20
**Scope:** All 114 journeys in `static/data/journeys.json`
**Actions:** Edge audit & repair + per-journey gotchas research

## Summary

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Total dependencies | 678 | 845 | +167 |
| Hard edges | 519 | 741 | +222 |
| Soft edges | 127 | 67 | -60 |
| Parallel edges | 32 | 37 | +5 |
| Gotchas | 0 | 454 | +454 |
| Major gotchas | -- | 314 | -- |
| Minor gotchas | -- | 140 | -- |
| Underspecified journeys | 17 | 0 | -17 |
| Rule violations | 0 | 0 | 0 |
| Rule exceptions | 0 | 1 | +1 |
| File size | 128,763 B | 354,697 B | +175% |

See full report in the file for methodology, per-category breakdowns, and cross-validation results.