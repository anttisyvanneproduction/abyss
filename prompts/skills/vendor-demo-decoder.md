<!-- trigger: vendor demo, sales demo, product demo, software demo, vendor pitch, solution presentation, demo promises, procurement demo, RFP demo, sales engineer -->
## Task: Vendor Demo Decoder

Decode a vendor demo into what was actually promised, what was merely shown, what depends on services work, and what will become the customer's problem after contract signature.

---

## Input

A vendor demo transcript, meeting notes, slide summary, proposal excerpt, RFP answer, or remembered demo claims.

If the input is only "the demo was good", ask what the vendor showed, what they claimed, and what the buyer needs the product to do.

---

## Step 1 - Extract claims

Separate what the vendor actually said from what the room inferred.

| Claim | Evidence | Type |
|---|---|---|
| <claim> | <quote, slide, demo step, or note> | shown / promised / implied / assumed |

Definitions:
- **Shown**: visible working behavior in the demo.
- **Promised**: stated future or contractual capability.
- **Implied**: suggested by wording, not actually committed.
- **Assumed**: belief created by the buyer, not evidenced by the vendor.

---

## Step 2 - Decode demo conditions

Identify what made the demo work.

```
DEMO DATA:        <real customer data / sample data / golden path / unclear>
INTEGRATIONS:     <live / mocked / preloaded / "API available">
PERMISSIONS:      <admin user / normal user / unclear>
VOLUME:           <production-like / toy example / not shown>
ERROR HANDLING:   <shown / not shown>
CONFIGURATION:    <self-service / vendor-configured / services required>
```

The demo path is usually the happy path. Name the missing unhappy path.

---

## Step 3 - Find services dependency

```
OUT-OF-THE-BOX: <what works without implementation services>
CONFIGURATION:  <what needs setup>
CUSTOM WORK:    <what needs vendor/professional services>
CUSTOMER WORK:  <data cleanup, process change, integration, governance, testing>
```

If the vendor says "configurable", translate it into who configures it, how long it takes, and whether the buyer has the skill.

---

## Step 4 - Contract questions

Generate questions that turn demo language into commitments.

```
CONTRACT QUESTIONS:
  1. <question that forces yes/no, scope, SLA, volume, or cost clarity>
  2. <...>
```

Avoid "can it support..." questions. Ask "is this included in the quoted price and standard support scope?"

---

## Step 4b - Vendor-specific patterns

**SAP (S/4HANA, BTP, SuccessFactors, Ariba)**
- The demo runs on a pre-configured best-practice tenant. The go-live tenant will not look like this.
- "Fiori" means the UX was rebuilt. The data model is still 1993.
- S/4 + Ariba integration is shown as a single click. It is a project phase with middleware, mapping, and an 18-month timeline.
- "Included in your licence" means included in the modules you bought. Ask which modules each capability requires.

**Oracle (Fusion Cloud ERP, NetSuite)**
- Fusion demos skip the configuration workbench. Ask to see setup screens, not just the output.
- "Intelligent" features require clean master data. The demo data is clean. Yours is not.
- NetSuite demos avoid subsidiary and intercompany flows. These are where the project stalls.
- Reporting is shown via pre-built dashboards. Ask who builds the next one.

**Microsoft (Dynamics 365, Business Central, Power Platform)**
- The Power Platform demo is built by a developer on a day-one environment. Production performance at your volume is a different question.
- Business Central demos run standard functionality. Ask which ISV solutions are in the demo and whether they are in the price.
- Every AI / Copilot feature is either in preview, region-restricted, or separately licensed. Confirm GA status for each one shown.
- The demo runs as a global admin. Ask what a normal user sees.

**Salesforce**
- The demo tenant has no technical debt. Ask to see a customer org after three years of use.
- Flow automations are shown as no-code. Maintaining non-trivial flows requires someone who is either a developer or costs as much as one.
- List price is not the price. The negotiation happens once, at contract signature. Understand what cannot be added later without a renegotiation.
- AppExchange solutions in the demo have their own licences. Confirm what is native and what is not.

**Data platforms (Snowflake, Databricks, Fabric)**
- The demo cluster is sized for the demo. Ask what size is needed for your volume and what the monthly cost is at that size.
- Performance is shown on pre-clustered or cached data. Ask what a cold query on unpartitioned raw data looks like.
- See the `dataplatform` skill for billing surprises by platform.

**Any vendor**
- "Open API" means an API exists. Ask who has built the specific integration you need and how long it took.
- "SSO supported" — ask which protocols, which identity providers, and whether it is included or an add-on.
- "Configurable" means the vendor configures it. "Self-service configurable" means you configure it. These are different products at different total costs.

---

## Step 5 - What the room did not see

Search for what customers say when the vendor is not present. G2 and TrustRadius one-star reviews, filtered by your company size, describe what the demo avoids. Reddit (r/ERP, r/sap, r/Dynamics365, r/salesforce, r/snowflake) contains implementation post-mortems from people who are still angry about it. Gartner Peer Insights cons section contains the polite version of the same.

Reference calls: the vendor will provide customers who had good experiences. Ask them what took longer than expected, what cost more than expected, and what they would do differently. These questions are harder to prepare a script for.

---

## Output

```
DEMO VERDICT: <credible / promising but unproven / services project disguised as product / procurement theatre>

SHOWN:
  - <capability actually demonstrated>

PROMISED:
  - <capability stated but not proven>

ASSUMED BY BUYER:
  - <belief not supported by evidence>

HIDDEN WORK:
  - Vendor:
  - Customer:

RED FLAGS:
  - <specific demo signal>

QUESTIONS BEFORE SIGNATURE:
  1. <contract-grade question>
  2. <contract-grade question>
  3. <contract-grade question>

OBSERVATION: <one dry sentence on what the demo carefully avoided showing>
```
