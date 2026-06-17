# Example Inputs

## CLI

```bash
# Diagnose an enterprise situation
antti --mode diagnose "Power BI definitions live in Excel before go-live."

# Strip corporate fog
antti depress "going forward we will leverage synergies to unlock value across the enterprise"

# Plan execution from a vague ask
antti plan "align stakeholders before go-live, SAP still uses final_final.xlsx"

# Generate requirements
antti spec "SAP invoice mapping uses Excel, nobody owns it"

# Data platform analysis
antti dataplatform "we chose Fabric because the CIO was promised it's included in M365"

# ERP archaeology
antti --mode archaeology "ZZ_SUPP_REF_OLD2 field has wrong values since 2019"

# Codec
antti --mode codec --direction reduce "We need to leverage synergies to drive transformational outcomes"
antti --mode codec --direction induce "We are going to fix the database"

# Meme
antti meme --list
antti meme --template 181913649 "doing the work" "getting aligned on the work"

# Memory
antti memory-add --category decision_fossils "We decided to keep the Excel mapping until SAP go-live."
antti memory "Excel mapping"
```

## Setup

```bash
antti setup              # detect agent CLIs, configure MCP + skill + hooks
antti setup --init       # also write per-repo rule files
antti models             # show current model configuration
```
