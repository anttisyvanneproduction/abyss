export interface InvestigationPhase {
  name: string;
  questions: string[];
  searchQueries: string[];
  askUser: string[];
  systemHint?: string;
}

export interface ArchaeologyGuide {
  detectedSystem: string | null;
  detectedFields: string[];
  detectedYears: string[];
  summary: string;
  phases: InvestigationPhase[];
}

function detectSystem(input: string): string | null {
  if (/\bSAP\b/i.test(input)) return "SAP";
  if (/\b[ZY][A-Z0-9_]{3,}\b/.test(input)) return "SAP";
  if (/\b(SE11|SE16|SE80|CDHDR|LFA1|LFM1|MARA|RBKP|EKKO)\b/.test(input)) return "SAP";
  if (/\bOracle\s*(EBS|Fusion|R12)?\b/i.test(input)) return "Oracle";
  if (/\b(Dynamics|D365|AX|NAV|Navision)\b/i.test(input)) return "Dynamics 365";
  if (/\bFusion\b/i.test(input)) return "Oracle Fusion";
  if (/\bWorkday\b/i.test(input)) return "Workday";
  return null;
}

function detectFields(input: string): string[] {
  const custom = input.match(/\b[ZY][A-Z0-9_]{2,}\b/g) ?? [];
  const standard = input.match(/\b[A-Z]{2,6}_[A-Z0-9_]{2,}\b/g) ?? [];
  return [...new Set([...custom, ...standard])].slice(0, 4);
}

function detectYears(input: string): string[] {
  return [...new Set(input.match(/\b20\d{2}\b/g) ?? [])];
}

function sapHint(action: string): string {
  const hints: Record<string, string> = {
    "field-whereused":   "SAP: SE11 → field name → Where-Used List",
    "field-definition":  "SAP: SE11 → enter field name → Display field attributes and table",
    "change-history":    "SAP: CDHDR/CDPOS → filter by object class and date range",
    "transport-history": "SAP: SE10 → filter by date, find developer and package",
    "code-that-writes":  "SAP: SE80 → search for field name across repository",
    "vendor-record":     "SAP: BP (S/4HANA) or XK03 (ECC) → LFA1, LFM1 tables",
    "invoice-record":    "SAP: MIR4 → RBKP (header), RSEG (lines) tables",
    "material-record":   "SAP: MM03 → MARA (general), MARC (plant) tables"
  };
  return hints[action] ?? "";
}

function oracleHint(action: string): string {
  const hints: Record<string, string> = {
    "field-definition":  "Oracle: check Descriptive Flexfields in System Administrator → Flexfields",
    "change-history":    "Oracle EBS: FND_CONCURRENT_REQUESTS, WF_ITEMS for workflow audit",
    "vendor-record":     "Oracle: HZ_PARTIES, PO_VENDORS tables — Payables > Suppliers",
    "invoice-record":    "Oracle: AP_INVOICES_ALL (header), AP_INVOICE_LINES_ALL (lines)"
  };
  return hints[action] ?? "";
}

function dynamicsHint(action: string): string {
  const hints: Record<string, string> = {
    "field-definition":  "D365: check extension model in LCS or Visual Studio — field is in a custom layer",
    "change-history":    "D365: SysDataEventMonitor or audit log if enabled — check system administration",
    "vendor-record":     "D365: Accounts Payable > Vendors — VendTable in SQL",
    "invoice-record":    "D365: Accounts Payable > Invoices — VendInvoiceInfoTable"
  };
  return hints[action] ?? "";
}

function hint(system: string | null, action: string): string | undefined {
  if (system === "SAP") return sapHint(action) || undefined;
  if (system === "Oracle" || system === "Oracle Fusion") return oracleHint(action) || undefined;
  if (system === "Dynamics 365") return dynamicsHint(action) || undefined;
  return undefined;
}

function searchQueriesForPhase(
  phase: 1 | 2 | 3 | 4,
  system: string | null,
  fields: string[],
  years: string[]
): string[] {
  const field = fields[0] ?? "custom field";
  const year = years[0] ?? "";

  if (phase === 1) {
    if (system === "SAP") return [
      `SAP ${field} SE11 table assignment where-used list`,
      `SAP data element ${field} domain field attributes display`
    ];
    if (system === "Oracle" || system === "Oracle Fusion") return [
      `Oracle EBS ${field} table column DFF descriptive flexfield definition`,
      `Oracle Fusion ${field} BI publisher OTBI subject area`
    ];
    if (system === "Dynamics 365") return [
      `Dynamics 365 ${field} data entity field metadata LCS Visual Studio`,
      `D365 FO custom field ${field} extension table layer`
    ];
    return [
      `ERP ${field} database table column definition interface`,
      `enterprise system field ${field} integration documentation`
    ];
  }

  if (phase === 2) {
    if (system === "SAP") return [
      `SAP ${field} business process functional specification transaction`,
      `SAP field ${field} use case module MM FI SD`
    ];
    if (system === "Oracle" || system === "Oracle Fusion") return [
      `Oracle EBS ${field} AP AR field meaning business process`,
      `Oracle ${field} functional specification lookup value set`
    ];
    if (system === "Dynamics 365") return [
      `D365 ${field} field purpose accounts payable vendor master`,
      `Dynamics 365 ${field} business logic configuration lookup`
    ];
    return [
      `ERP field ${field} business purpose data dictionary`,
      `enterprise ${field} functional specification`
    ];
  }

  if (phase === 3) {
    if (system === "SAP") return [
      `SAP SE80 ABAP code search field name ${field} repository`,
      `SAP user exit BAPI BAdI enhancement spot SE18 ${field} populate`,
      `SAP interface inbound mapping ${field} field assignment`
    ];
    if (system === "Oracle" || system === "Oracle Fusion") return [
      `Oracle EBS database trigger ${field} table update custom code`,
      `Oracle concurrent program ${field} PL/SQL populate procedure`
    ];
    if (system === "Dynamics 365") return [
      `Dynamics 365 X++ business logic ${field} populate custom`,
      `D365 data entity ${field} write override chain of command`
    ];
    return [
      `ERP custom code ${field} field populate write interface`,
      `enterprise integration mapping ${field} field transformation`
    ];
  }

  // phase === 4
  if (system === "SAP") {
    const queries = [
      `SAP CDHDR CDPOS change document filter ${field} date range UDATE`,
      `SAP SE10 transport request ${year || "change log"} developer package`
    ];
    if (year) queries.push(`SAP SLG1 application log ${year} object class filter`);
    return queries;
  }
  if (system === "Oracle" || system === "Oracle Fusion") return [
    `Oracle EBS FND_AUDIT_TRAIL ${year || "change history"} table audit`,
    `Oracle concurrent request log ${year || "program history"} execution`
  ];
  if (system === "Dynamics 365") return [
    `Dynamics 365 SysDataEventMonitor audit log ${year || "change history"}`,
    `D365 change tracking ${field} history version table`
  ];
  return [
    `ERP audit trail ${field} change history ${year || "date range"}`,
    `enterprise system modification log ${field} tracking`
  ];
}

function askUserForPhase(
  phase: 1 | 2 | 3 | 4,
  system: string | null,
  fields: string[],
  years: string[]
): string[] {
  const fieldLabel = fields.length > 0 ? fields[0] : "this field";
  const year = years[0];

  if (phase === 1) return [
    ...(!system ? ["Which ERP system is this? (SAP, Oracle EBS, Oracle Fusion, Dynamics 365, Workday, or other)"] : []),
    "Are there interfaces or batch jobs that move this data to other systems?",
    "Is there a downstream Excel file, report, or data warehouse table that holds a copy of this value?"
  ];

  if (phase === 2) return [
    `Which team creates or updates ${fieldLabel} — and which transaction or screen do they use?`,
    `What goes wrong in operations when ${fieldLabel} has the wrong value? What is the downstream impact?`
  ];

  if (phase === 3) return [
    `Is ${fieldLabel} wrong at the source system, or is it correct there and changes somewhere in transit?`,
    "Is there a known interface, migration, or custom program responsible for setting this field?",
    year
      ? `Was ${fieldLabel} correct before ${year}? Or was it wrong from the beginning?`
      : "Was this field ever correct? If so, approximately when did it stop being correct?"
  ];

  // phase 4
  return [
    year
      ? `What project, migration, upgrade, or organizational change was active around ${year}?`
      : "When did this problem start, and what was happening in the organization at that time?",
    "Is there someone who was involved with this system when it was first configured — a consultant, key user, or someone now in a different role?",
    "Was there a data migration? If so, who owns the migration documentation and sign-off record?"
  ];
}

export function buildArchaeologyGuide(input: string): ArchaeologyGuide {
  const detectedSystem = detectSystem(input);
  const detectedFields = detectFields(input);
  const detectedYears = detectYears(input);

  const fieldLabel = detectedFields.length > 0
    ? detectedFields.join(", ")
    : "the relevant field or record";

  const yearLabel = detectedYears.length > 0 ? detectedYears.join(", ") : null;

  const summaryParts: string[] = [];
  if (detectedSystem) summaryParts.push(detectedSystem);
  if (detectedFields.length > 0) summaryParts.push(`field: ${detectedFields.join(", ")}`);
  if (yearLabel) summaryParts.push(`year reference: ${yearLabel}`);
  const summary = summaryParts.length > 0
    ? summaryParts.join(" · ")
    : "no system or field identified — see Phase 1";

  const phases: InvestigationPhase[] = [
    {
      name: "Phase 1 — What systems does this data touch?",
      questions: [
        `Where does ${fieldLabel} live? Is it in one system or synchronized across several?`,
        "Is there a source system that owns this record, or is it created inside the current system?",
        "Are there interfaces, APIs, flat files, or scheduled jobs that read or write this data?",
        "Is there a downstream system, report, or Excel file that also holds a copy of this value?",
        ...(!detectedSystem ? [
          "Which ERP system is this in? (SAP, Oracle EBS, Oracle Fusion, Dynamics 365, Workday, or other)"
        ] : [])
      ],
      searchQueries: searchQueriesForPhase(1, detectedSystem, detectedFields, detectedYears),
      askUser: askUserForPhase(1, detectedSystem, detectedFields, detectedYears),
      systemHint: hint(detectedSystem, "field-whereused")
    },
    {
      name: "Phase 2 — What business process does this data support?",
      questions: [
        `What process depends on ${fieldLabel}? (invoicing, vendor payment, reporting, ordering, compliance)`,
        "Who creates or enters this record — which team, which role, which transaction?",
        "Who reads it and what do they do with it?",
        "What breaks or is wrong when this value is incorrect? What is the operational impact?"
      ],
      searchQueries: searchQueriesForPhase(2, detectedSystem, detectedFields, detectedYears),
      askUser: askUserForPhase(2, detectedSystem, detectedFields, detectedYears),
      systemHint: hint(detectedSystem,
        /vendor|supplier/i.test(input) ? "vendor-record" :
        /invoice/i.test(input) ? "invoice-record" :
        /material/i.test(input) ? "material-record" : "field-definition"
      )
    },
    {
      name: "Phase 3 — Where did the wrong value come from?",
      questions: [
        `Is ${fieldLabel} wrong at the source, or correct at the source and corrupted in transit?`,
        "What populates this field — manual entry, a program, an interface, a migration, or a default value?",
        yearLabel
          ? `Was it correct before ${yearLabel} and wrong after? Or wrong from the beginning?`
          : "Was this ever correct? If so, when did it change?",
        "Is there a user exit, BAPI, enhancement, or custom program that sets this value?",
        "Is there a manual override or correction step somewhere in the process?"
      ],
      searchQueries: searchQueriesForPhase(3, detectedSystem, detectedFields, detectedYears),
      askUser: askUserForPhase(3, detectedSystem, detectedFields, detectedYears),
      systemHint: hint(detectedSystem, "code-that-writes")
    },
    {
      name: "Phase 4 — What changed, and when?",
      questions: [
        yearLabel
          ? `What went live around ${yearLabel}? A migration, a project closure, a system upgrade, a reorg?`
          : "When did this problem start? What project or change was active at that time?",
        "Is there someone who knew how this worked before — a consultant, a key user, a person now in a different role?",
        "Was there a data migration? If so, what was the transformation logic and who signed it off?",
        "Is the wrong value consistent (same wrong value every time) or random? Consistent means a rule. Random means an interface timing issue or manual error."
      ],
      searchQueries: searchQueriesForPhase(4, detectedSystem, detectedFields, detectedYears),
      askUser: askUserForPhase(4, detectedSystem, detectedFields, detectedYears),
      systemHint: hint(detectedSystem, yearLabel ? "change-history" : "transport-history")
    }
  ];

  return { detectedSystem, detectedFields, detectedYears, summary, phases };
}
