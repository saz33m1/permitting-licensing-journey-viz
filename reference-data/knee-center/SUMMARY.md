# WVU Knee Regulatory Research Center (KRRC) Occupational Licensing Dataset — Summary

## Source
- **Institution**: Knee Regulatory Research Center, West Virginia University (WVU)
- **Primary URL**: https://knee.wvu.edu/data
- **2025 release page**: https://knee.wvu.edu/publications/knee-center-research/2025/12/19/annual-licensing-database-snapshot-2025
- **2024 release (CSOR mirror)**: https://csorwvu.com/annual-licensing-database-snapshot-2024-4424/
- **Older OLLRP data**: https://knee.wvu.edu/data/ollrp-database
- **Last crawled**: April 2026

## Files Downloaded

| File | Description | Size |
|------|-------------|------|
| `data-2025-release.xlsx` | **Primary file**: 2025 annual snapshot, 96 professions × 51 jurisdictions | 857 KB |
| `KRRCDatabase2024.xlsx` | 2024 annual snapshot (earlier vintage, 77 professions updated + 27 new = 77 total at that point) | 556 KB |
| `Database_Update2024.xlsx` | 2024 updated professions only | 497 KB |
| `Database_New2024.xlsx` | 2024 newly added professions only | 232 KB |
| `krrc_data_dictionary.docx` | Official data dictionary for all data files | 31 KB |
| `2025-profession-update-notes.docx` | 2025 release update notes (tracks changes per profession) | 24 KB |
| `knee-center-2025-page.html` | 2025 release web page | 59 KB |

## Dataset Coverage

### 2025 Release (primary — `data-2025-release.xlsx`)
- **96 professions** across **51 jurisdictions** (50 states + District of Columbia)
- Updated 77 professions from 2024 database; added 19 new professions
- Data collected January–December 2025 from state government sources only

### 2024 Release (`KRRCDatabase2024.xlsx`)
- 77 professions (50 from 2023 database updated; 27 new professions added)
- Data collected May 2023–December 2024

## Workbook Structure (2025 XLSX)

The 2025 XLSX contains **97 sheets**:
1. `All Professions` — consolidated data for all 96 professions (primary analysis sheet)
2. One sheet per profession (96 sheets), named by profession title

### Full list of 96 professions (sheets 2–97):
Acupuncturist, Auctioneer, Auctioneer Apprentice, Audiologist, Barber, Certified Nurse Midwife, Certified Public Accountant, Chiropractor, Chiropractor Assistant, Clinical Nurse Specialist, Cosmetologist, Crane Operator, Dental Assistant, Dental Hygienist, Dental Therapist, Dentist, Denturist, Dialysis Technician, Esthetician, Interior Designer, Lactation Consultant, Licensed Practical Nurse, Massage Therapist, Nail Technician, Natural Hair Braider, Nuclear Medicine Technologist, Nurse Anesthetist, Nurse Practitioner, Occupational Therapist, Occupational Therapist Assistant, Ocularist, Optician, Optometrist, Pharmacist, Pharmacy Technician, Physical Therapist, Physical Therapist Assistant, Physician, Physician Assistant, Podiatrist, Radiologic Technologist, Radiologic Assistant, Registered Nurse, Shampoo Assistant, Speech Language Pathologist, Speech Language Pathologist Assistant, Surgeon, Tattoo Artist, Veterinarian, Veterinarian Technician, Architect, Dietetic Technician, Embalmer, Engineer Intern, Forester, Forester Technician, Funeral Director, Funeral Service Assistant, Funeral Service Trainee, Funeral Supervisor, Geoscientist in Training, Home Inspector, Home Inspector Trainee, Land Surveyor in Training, Landscape Architect, Medical Health Physicist Assistant, Mortician, Pedorthist, Private Investigator, Professional Engineer, Professional Geophysicist, Professional Geoscientist, Professional Land Surveyor, Respiratory Therapist, Soil Scientist, Soil Classifier, Surgical Assistant, Certified Engineer Geologist, Certified Hydrologist, Dental Radiographer, Diagnostic Medical Sonographer, Landscape Architect Trainee, Limited X-ray Machine Operators, Orthotic Assistant, Orthotic Fitter, Orthotic Fitter Assistant, Orthotic Technician, Orthotist, Peace Officer, Police Officer, Prosthetic Assistant, Prosthetic Technician, Prosthetist, Prosthetist-Orthotist, Psychologist, Structural Engineer

## Column Schema (from shared strings inspection)

### Row identifiers:
| Column | Description |
|--------|-------------|
| `State` | State name (e.g., "Alabama") |
| `Statefips` | FIPS code for state |
| `Year` | Data year |
| `Profession` | Profession name |
| `Profession Code` | Internal KRRC profession code |
| `SOC` | Bureau of Labor Statistics Standard Occupational Classification code |
| `Industry` | Industry category (e.g., "Healthcare", "Engineering", "Sales") |

### Licensing requirement fields:
| Column | Description |
|--------|-------------|
| `Type of Regulation` | License / Registration / Certification / Certificate / Voluntary Certification / Unique License |
| `Type of Regulation Notes` | Notes on the regulation type |
| `Initial Licensing Fee` (also `Initial_Fee`) | Fee to obtain initial license (dollars) |
| `Renewal_Fee` | Fee to renew license, prorated to biennial cycle |
| `Degree` | Minimum education degree required (e.g., "High School Diploma", "Associate's Degree", "Bachelor's Degree", "Master's Degree", "Doctorate Degree") |
| `Education Code` | Coded version of the education requirement |
| `Continuing_Education` | Continuing education hours required per renewal cycle (prorated to biennial) |
| `Citizenship` | Whether citizenship is required |
| `Minimum Age` | Minimum age requirement |
| `Good Moral Character` | Whether good moral character requirement exists |
| `English_Language` | Whether English language requirement exists |
| `Exams` | Number or type of exams required |
| `Experience` | Experience hours/years required |
| `Experience Or Training` | Alternative field for experience or training |
| `Number of Exams` | Count of required exams |
| `Credit To Sit for Exam` | Whether educational credit required to sit for exam |
| `Reciprocity or Endorsement` | Whether reciprocity/endorsement with other states is available |
| `Multiple Pathways` | Whether multiple education/experience path combinations exist |
| `Regulation` | Citation or description of the authorizing regulation |

### Values used for Degree field (ordered, from lowest to highest):
1. 7th Grade
2. 8th Grade
3. 9th Grade
4. 10th Grade
5. High School / High School Diploma / High School degree
6. Some College / One year of college / Three Years of College
7. Associate's Degree / Associates Degree
8. Bachelor's Degree / Bachelors Degree
9. Master's Degree
10. Doctorate Degree

### Values used for Type of Regulation:
- License (most restrictive — title and practice protected)
- Registration
- Certification
- Certificate
- Voluntary Certification (weakest — optional)
- Unique License
- Apprenticeship (for trainee/intern roles)

### Values for Reciprocity or Endorsement:
- Yes
- No
- Endorsement
- Reciprocity
- Reciprocity/Endorsement
- Comity
- Equivalency

## Methodology Notes

- **Data sources**: State government sources only (statutes, administrative codes, agency communications, licensing board websites). Industry groups explicitly excluded as "frequently out of date."
- **When data not publicly available**: Researchers contacted licensing boards directly by email or phone.
- **Standardization approach**:
  - Education/training hours converted to a common scale using standard full-time working hours definitions
  - Renewal fees and continuing education hours **prorated to a biennial (2-year) period** for cross-state comparability
  - Multiple pathways: when multiple education/experience combinations qualify, the "most common or reasonable" path is listed; the `Multiple Pathways` flag indicates alternatives exist
- **Versioning**: Database may be adjusted for errors. All changes tracked in the Universal Read.Me and Update Notes documents.

## Suggested Citation
Norris, Conor, Kelley, Ethan, and Carneal, Troy. (2025). "KRRC Annual Licensing Database Snapshot: 2025." Knee Regulatory Research Center, West Virginia University.

## Related Dataset: OLLRP (Historical Data)
The Knee Center also hosts the Occupational Licensing Law Research Project (OLLRP) database covering ~300 occupations across all 50 states + DC from **1870 to 2019** (historical panel data). This is different from the annual snapshots — it is cross-sectional/longitudinal, authored by Morris Kleiner, Jason Hicks, et al. Data and Stata code available at: https://knee.wvu.edu/data/ollrp-database

## Usefulness for Step Dependencies

This dataset is directly useful for analyzing **licensing requirements as structured prerequisites**:

1. **Degree field** defines the minimum educational attainment required before applying — a hard prerequisite step (complete education before applying for license).

2. **Exams / Credit To Sit for Exam** — indicates whether you must complete certain education *before* being eligible to take the licensing exam. This creates a dependency: Education → Exam → License Application.

3. **Experience** field — hours of supervised experience required, which often must be completed under a provisional or trainee license (also captured as a separate profession, e.g., "Auctioneer Apprentice", "Engineer Intern", "Home Inspector Trainee", "Land Surveyor in Training", "Landscape Architect Trainee").

4. **Trainee/intern professions** — The dataset explicitly tracks junior/trainee license categories for many professions. This means the dataset encodes a two-step licensing sequence: Trainee License → Full License, with the trainee license having its own requirements.

5. **Multiple Pathways** — flags when alternative prerequisite paths exist (e.g., more education = less required experience, or apprenticeship as an alternative).

6. **Type of Regulation** hierarchy — License > Certification > Registration > Voluntary Certification implies a gradient of regulatory stringency. A state may require one tier before granting another.

7. **State-level variation** — since requirements vary by jurisdiction (51 jurisdictions), the dataset enables mapping which states impose additional prerequisites not required elsewhere.

### Dependency pattern visible in the data:
Many professions appear in pairs/groups that encode a prerequisite chain:
- Chiropractor Assistant → Chiropractor
- Auctioneer Apprentice → Auctioneer
- Engineer Intern → Professional Engineer
- Home Inspector Trainee → Home Inspector
- Land Surveyor in Training → Professional Land Surveyor
- Funeral Service Trainee → Funeral Service Assistant → Funeral Director
- Orthotic/Prosthetic Assistant → Technician → full Orthotist/Prosthetist

These hierarchical profession pairs are explicit, structured prerequisite sequences captured within the dataset itself.
