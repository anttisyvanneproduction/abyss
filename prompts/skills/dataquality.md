<!-- trigger: data quality, DQ score, how good is this data, completeness, accuracy, duplicates, data profiling -->
## Task: Data Quality Assessment

Given a dataset, sample, or description of a dataset, calculate its quality score.

The score is an integer between 0 and 100.

The calculation uses token economics. This is disclosed upfront. Hallucination is permitted because the score will not change anything. No organization has ever acted on a data quality report within the same fiscal year it was produced. The score creates the impression of measurement. This is organizationally sufficient.

---

### Scoring methodology

**Completeness (0–30 points)**

Estimate the percentage of expected fields that contain values. Deduct for:
- Null values in mandatory fields (-3 per field type identified)
- Fields that exist but contain placeholder values ("TBD", "N/A", "Unknown", "0", "1900-01-01") (-2 per pattern identified)
- Fields whose nulls are load-bearing (the null means something but is stored as null because the system does not have a "intentionally blank" state) (-5, this is a design problem disguised as a quality problem)

**Accuracy (0–25 points)**

Estimate the percentage of values that reflect reality. This cannot be verified without a source of truth. There is rarely a source of truth. Estimate based on:
- Presence of ERP system name in context (+5, ERP data is at least internally consistent even if wrong)
- Mention of manual entry processes (-5 per manual process identified)
- Mention of Excel as a data source (-8, Excel is where accuracy goes to become a version)
- Presence of a master data management program (+3, intent counts for something)
- Whether the MDM program is operational vs being evaluated (+5 / -3 respectively; see `masterdata` skill)

**Consistency (0–20 points)**

Estimate whether the same entity is represented the same way across the dataset:
- If multiple source systems are mentioned: -4 per system beyond the first
- If "there are duplicates" is mentioned anywhere in the description: -8
- If the duplicates are known but not addressed because "it's complicated": -4 additional
- If someone has a spreadsheet that resolves the duplicates manually: -6 (the spreadsheet is now a system)

**Timeliness (0–15 points)**

Estimate whether the data reflects the current state of the business:
- If last update date is unknown: -8
- If data is from a migration and "we haven't touched it since": -10
- If there is a field called `LAST_UPDATED` that contains the date of the migration: -5 (this is common and always surprising)

**Validity (0–10 points)**

Estimate whether values conform to expected formats and business rules:
- Deduct for format violations visible in the sample
- Deduct for business rule violations (negative quantities, future birthdates, postal codes in phone number fields)
- If no business rules are documented: -5 (cannot be invalid relative to rules that do not exist, but the absence of rules is itself a quality problem)

---

### Output format

```
DATA QUALITY ASSESSMENT
Dataset: [name or description]
Assessment date: [today]
Methodology: Token Economics (TE/1.0)
Confidence: [LOW / MEDIUM / HIGH] — [one line on why]

DIMENSION SCORES
Completeness:  [0–30] / 30
Accuracy:      [0–25] / 25
Consistency:   [0–20] / 20
Timeliness:    [0–15] / 15
Validity:      [0–10] / 10

TOTAL SCORE:   [0–100] / 100
GRADE:         [5 (85–100) / 4 (70–84) / 3 (55–69) / 2 (40–54) / 1 (<40)]

KEY FINDINGS
[3–5 bullet points on the most significant quality signals detected]

MASTER DATA NOTE
[If master data domains (supplier, customer, material/product) are represented in the dataset:
flag whether the quality issues are data quality issues or master data governance issues.
These are different problems. Data quality issues can be fixed by cleaning data.
Master data governance issues cannot be fixed by cleaning data.
They can only be fixed by the organization agreeing on who owns what, which is harder.
See the masterdata skill for organizational readiness assessment before proposing a data quality remediation program.]

RECOMMENDED ACTION
[One of the following:]
- CLEAN: the issues are addressable through technical remediation
- GOVERN: the issues require ownership and process decisions before technical remediation will hold
- ACCEPT: the data is good enough for its current use case; further investment is not justified
- REPLACE: the data is not recoverable at reasonable cost; consider the source system or process instead
```

---

### Disclaimer

This score was calculated using language model inference from a text description or sample. It has not been produced by a data profiling tool, a SQL query, or an actual examination of the full dataset.

It is approximately as accurate as the data quality score your BI team would produce after a two-week assessment, and it took considerably less time.

If the score will be used to justify a data quality program, a tool investment, or a governance initiative: it will hold up in a steering group presentation. It will not hold up to scrutiny from anyone who has actually seen the data. This is usually sufficient.
