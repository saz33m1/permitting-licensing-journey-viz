# DOL CareerOneStop Occupational License Finder — Summary

## Source
- **Main page**: https://www.careeronestop.org/toolkit/training/find-licenses.aspx
- **Data download page**: https://www.careeronestop.org/Developers/Data/occupational-licenses.aspx
- **Bulk data host**: https://data.widcenter.org/wfinfodb/License/
- **API explorer**: https://api.careeronestop.org/api-explorer/
- **Publisher**: U.S. Department of Labor (DOL), via CareerOneStop / Analyst Resource Center (ARC)
- **Last crawled**: April 2026

## Files Downloaded

| File | Description | Size |
|------|-------------|------|
| `COSFlatExport.zip` | Full flat-export of all license records (Microsoft Access .mdb) | 7.8 MB zip / 138 MB uncompressed |
| `cos-flat-export/COSFlatExport.mdb` | Extracted Microsoft Access database — all license records | 138 MB |
| `LicensedOccupations_DataDownloadReadme.docx` | Official technical readme / data dictionary | 19 KB |
| `ARC_Licenses_Review_and_Processing.docx` | ARC internal review and processing documentation | 21 KB |
| `license-download-index.html` | Directory listing of all available download files on ARC server | 37 KB |
| `careeronestop-occupational-licenses-page.html` | CareerOneStop data download landing page | 30 KB |
| `api-license-finder-docs.html` | API Explorer docs for the License Finder API endpoints | 42 KB |

## Data Source Overview

License information is collected from each U.S. state by the **Analyst Resource Center (ARC)**, an arm of the Department of Labor / Employment and Training Administration. Key facts:
- States submit revisions **every two years** (cadence)
- CareerOneStop updates the public dataset **every 4–6 months** as new state data arrives
- **Not all states submit** license information; coverage is therefore incomplete for some states/professions
- Most recent dataset update in the flat export: **October 2024** (COSFlatExport.zip dated 2024-10-14)

## Bulk Download Options

### Primary: COSFlatExport.zip (recommended for analysis)
- URL: `https://data.widcenter.org/wfinfodb/License/COSFlatExport.zip`
- Contents: Single Microsoft Access .mdb file (`COSFlatExport.mdb`), 138 MB uncompressed
- Format: Microsoft Access database (requires Access, mdbtools, or similar to read)
- Coverage: All states, all license types — flat (one row per license record)

### Per-state files (also available on the ARC server)
The directory listing (`license-download-index.html`) shows state-by-state files named:
`WID28LicenseST{XX}Export{YYMM}.mdb[.zip]`
where `XX` is a state code (01–53), and `YYMM` is the export year/month.
- States with 2024 exports: ST02, ST05, ST06, ST08–ST11, ST13, ST17, ST19–ST22, ST28–ST29, ST31, ST33, ST35, ST37, ST39–ST41, ST44–ST45, ST47, ST48, ST49, ST53 (and more)
- Older states at 2023 or earlier vintages also available

### Additional reference files on the ARC server:
- `Occupational Licenses History.pptx` (546 KB, dated 2025-06-03)
- `Occupational Licensure Coverage and Climate - Copy.pptx` (857 KB, dated 2025-06-03)
- `Occupational Licensure in the States-Final.pdf` (734 KB, dated 2023-09-28)

## Data Schema — Fields Per License Record

From the readme and API response structure, each license record includes:

### Core identification fields:
| Field | Description |
|-------|-------------|
| `ID` | Unique license record identifier |
| `Title` | License title (e.g., "Registered Nurse") |
| `Description` | Full text description of the license |
| `State` | State abbreviation (e.g., "IL", "CA") |

### Status/classification fields:
| Field | Description |
|-------|-------------|
| `ActiveStatusDesc` | Whether the license is currently active |
| `CertificationIndDesc` | Whether a certification is required |
| `ContinuingEDUIndDesc` | Whether continuing education is required |
| `CriminalIndDesc` | Whether criminal background check is required |
| `EducationIndDesc` | Whether education requirement exists |
| `LicExamIndDesc` | Whether a licensing exam is required |
| `ExperienceIndDesc` | Whether experience requirement exists |
| `VeteransIndDesc` | Whether veterans-specific provisions apply |

### Occupation linkage:
| Field | Description |
|-------|-------------|
| O*NET code(s) | Linked O*NET-SOC occupation codes |

### Issuing agency fields:
| Field | Description |
|-------|-------------|
| `Agency` (issuing org) | Name of the state agency that issues the license |
| `Phone` | Agency contact phone |
| `Email` | Agency contact email |
| `Url` | Agency website URL |

## API Access

### Base URL: `https://api.careeronestop.org/v1/`

### Authentication:
- Requires **API Token** (registration at CareerOneStop developer portal)
- Requires **userId** parameter with every request

### License Endpoints:

#### List Licenses
```
GET /v1/license/{userId}/{keyword}/{location}/{sortColumns}/{sortDirections}/{startRecord}/{limitRecord}
```
Parameters:
- `keyword`: profession keyword or O*NET code (e.g., "nurse" or "29-1171.00"); use `0` for no filter
- `location`: state abbreviation (e.g., "IL"), "US" for all states, or `0` for all states
- `sortColumns`: "Title", "Agency", or "State" (or `0` for relevance)
- `sortDirections`: "ASC" or "DESC" (or `0` for relevance)
- `startRecord`: integer, pagination offset
- `limitRecord`: integer, page size

#### Get License Details by ID
```
GET /v1/license/{userId}/{licenseId}
```

### Full JSON Response Schema:
```json
{
  "LicenseList": [
    {
      "ID": "string",
      "Title": "string",
      "Description": "string",
      "State": "string",
      "ActiveStatusDesc": "string",
      "CertificationIndDesc": "string",
      "ContinuingEDUIndDesc": "string",
      "CriminalIndDesc": "string",
      "EducationIndDesc": "string",
      "LicExamIndDesc": "string",
      "ExperienceIndDesc": "string",
      "VeteransIndDesc": "string",
      "Agency": {
        "Name": "string",
        "Phone": "string",
        "Email": "string",
        "Url": "string"
      }
    }
  ],
  "LicenseDetail": { "...same fields..." },
  "RecordCount": 1,
  "DidYouMean": "string",
  "AutoCorrection": "string",
  "QueriedOn": {
    "Code": "string",
    "Title": "string",
    "Type": "string",
    "IsKeywordSearch": true
  }
}
```

## Additional API Domains Available (Context)

The CareerOneStop API also exposes (beyond licenses):
- American Job Centers (by location / by ID)
- Apprenticeships
- Certifications
- Employment Patterns
- Jobs V2 (list/detail)
- Labor Market Information (LMI by O*NET)
- Locations (validation)
- Occupations (by keyword / by skills)
- Professional Associations
- ReEntry Programs
- Salaries (compare by location / by occupation)
- Skills Gaps / Skills Matcher
- Training Programs
- Unemployment rates / UI websites

## Usefulness for Step Dependencies

This database is the federal government's canonical source for **Step 9** of the SBA guide (Apply for Licenses and Permits). It maps:
- Which licenses exist in which states (jurisdiction-level coverage)
- What requirements attach to each license (education, exams, experience, criminal check, continuing ed)
- Which O*NET occupation codes each license relates to (linking licenses to job roles)

The indicator fields (`EducationIndDesc`, `LicExamIndDesc`, `ExperienceIndDesc`, `ContinuingEDUIndDesc`) provide boolean-style flags for requirement categories — useful for building dependency trees (e.g., "this license requires an exam, which requires certain education prerequisites").

**Limitations for prerequisite analysis:**
- Fields are indicator flags (yes/no), not structured prerequisite sequences
- The database does not capture *ordering* within licensing requirements (e.g., whether the exam must precede the application)
- The Knee Center KRRC database (see reference-data/knee-center/) provides more quantitative and structured requirement data (hours, fees, degree level) that complements this dataset
