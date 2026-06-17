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
