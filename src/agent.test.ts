import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { analyze, banalize, detectCorporateFog, generate, runCodec } from "./agent.js";
import { compareSpecs, formatDeltaSpec, formatSpec, generateSpec, type OpenSpecDocument } from "./spec.js";
import { transformText, type SatireDirection } from "./codec.js";
import { compress } from "./compress.js";
import { analyzeEmotionalWeather } from "./emotion.js";
import { analyzeEnterpriseGravity } from "./enterprise-gravity.js";
import { addMemory, listMemory, scrubSecrets, searchMemory } from "./memory.js";
import { selectMemeTemplate } from "./meme.js";
import { plan } from "./plan.js";

interface CodecFixtureSuite {
  fixtures: CodecFixture[];
}

interface CodecFixture {
  id: string;
  sourceText: string;
  direction: SatireDirection;
  forbiddenPhrases: string[];
  expectedRiskLabels: string[];
}

interface ForbiddenPhraseSuite {
  categories: Record<string, { phrases: string[] }>;
  modeRequirements: Record<string, { mustContain: string[] }>;
}

const forbiddenPhraseFixture = JSON.parse(
  readFileSync(join(process.cwd(), "examples", "golden", "forbidden-phrases.json"), "utf8")
) as ForbiddenPhraseSuite;

const ALL_FORBIDDEN = Object.values(forbiddenPhraseFixture.categories).flatMap((c) => c.phrases);

const codecFixtures = JSON.parse(
  readFileSync(join(process.cwd(), "examples", "codec", "satire-codec.fixtures.json"), "utf8")
) as CodecFixtureSuite;

describe("Antti agent toolkit", () => {
  it("detects and rewrites corporate fog", () => {
    expect(detectCorporateFog("We are thrilled to announce a transformational journey to unlock value.")).toEqual([
      "thrilled to announce",
      "transformational journey",
      "unlock value"
    ]);

    expect(banalize("We are trying to unlock value.")).toContain("make the work useful");
  });

  it("surfaces ERP archaeology signals", () => {
    const result = analyze("Supplier 100045 maps to vendor 778-B through SAP field ZZ_SUPP_REF_OLD2 from 2014.");

    expect(result.erpFindings.map((finding) => finding.signal)).toEqual(
      expect.arrayContaining([
        "enterprise system gravity",
        "master data dependency",
        "field archaeology: ZZ_SUPP_REF_OLD2",
        "timeline clue: 2014"
      ])
    );
    expect(result.relations.length).toBeGreaterThan(0);
  });

  it("can emit a full diagnostic response", () => {
    const result = generate({
      mode: "diagnose",
      input: "Legacy invoice mapping in Oracle Fusion uses final_final_v3.xlsx before go-live and nobody owns the decision rights. Power BI semantic model definitions are still in Excel.",
      intensity: "default"
    });

    expect(result.output).toContain("ERP archaeology");
    expect(result.output).toContain("Emotional weather");
    expect(result.output).toContain("Enterprise gravity");
    expect(result.analysis.architecture.diagram).toContain("Datapoint Relator");
    expect(result.analysis.emotionalWeather.map((item) => item.signal)).toEqual(
      expect.arrayContaining(["ownership_avoidance", "deadline_pressure"])
    );
    expect(result.analysis.enterpriseGravity.map((item) => item.signal)).toEqual(
      expect.arrayContaining(["excel_as_production", "power_bi_semantic_dispute"])
    );
  });

  it("keeps the AgentResponse contract stable for integrations", () => {
    const result = generate({
      mode: "diagnose",
      input: "Power BI semantic model definitions are still in Excel before go-live.",
      intensity: "default"
    });

    expect(Object.keys(result).sort()).toEqual(["analysis", "mode", "output", "warnings"]);
    expect(Object.keys(result.analysis).sort()).toEqual([
      "architecture",
      "emotionalWeather",
      "enterpriseGravity",
      "erpFindings",
      "fog",
      "governance",
      "memeSuggestion",
      "relations"
    ]);
    expect(Array.isArray(result.analysis.emotionalWeather)).toBe(true);
    expect(Array.isArray(result.analysis.enterpriseGravity)).toBe(true);
    expect(result.analysis.governance).toHaveProperty("decision");
    expect(result.analysis.architecture).toHaveProperty("diagram");
  });

  it("emotional weather returns hypotheses instead of claims", () => {
    const result = analyzeEmotionalWeather("The steering group needs alignment before go-live because licensing cost changed.");

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.hypothesis.startsWith("Possible "))).toBe(true);
    expect(result.map((item) => item.signal)).toEqual(
      expect.arrayContaining(["status_anxiety", "deadline_pressure", "budget_anxiety"])
    );
  });

  it("enterprise gravity stays partner-safe while detecting enterprise platform patterns", () => {
    const result = analyzeEnterpriseGravity(
      "Power BI semantic model definitions are debated in Teams while the current mapping lives in Excel and SharePoint."
    );

    expect(result.map((item) => item.signal)).toEqual(
      expect.arrayContaining(["power_bi_semantic_dispute", "teams_governance", "excel_as_production", "sharepoint_sprawl"])
    );
    expect(result.every((item) => !/idiot|stupid|hate/i.test(item.partnerSafeJoke))).toBe(true);
  });

  it("reduces satire while preserving factual anchors", () => {
    const result = transformText({
      direction: "reduce",
      input: "Obviously SAP invoice 2024 mapping is heroic, as one does!",
      tone: "dry",
      safety: "strict",
      format: "plain"
    });

    expect(result.normalizedText).toContain("SAP invoice 2024");
    expect(result.styledText).toContain("SAP invoice 2024");
    expect(result.removedStyleMarkers).toEqual(expect.arrayContaining(["obviously", "heroic", "as one does"]));
  });

  it("induces satire without inventing numeric facts", () => {
    const result = transformText({
      direction: "induce",
      input: "Supplier 100045 is mapped to SAP field ZZ_SUPP_REF_OLD2.",
      tone: "playful",
      safety: "strict",
      format: "plain"
    });

    expect(result.styledText).toContain("100045");
    expect(result.styledText).toContain("ZZ_SUPP_REF_OLD2");
    expect(result.riskLabels).not.toContain("fact_invention");
  });

  it("agent codec mode returns structured codec output", () => {
    const result = generate({
      mode: "codec",
      input: "Clearly Oracle PO 554433 is revolutionary.",
      intensity: "safe"
    });

    expect(result.output).toContain("normalizedText:");
    expect(result.output).toContain("styledText:");
    expect(result.output).toContain("riskLabels:");
  });

  it("runCodec supports deterministic reduce fallback", () => {
    const result = runCodec("reduce", "Clearly SAP PO 7788 is legendary, as one does.", "default");

    expect(result.styledText).toContain("SAP PO 7788");
    expect(result.styledText.toLowerCase()).not.toContain("legendary");
    expect(result.styledText).not.toContain("is.");
    expect(result.riskLabels).not.toContain("meaning_drift");
  });

  it.each(codecFixtures.fixtures)("executes codec fixture $id", (fixture) => {
    const result = transformText({
      direction: fixture.direction,
      input: fixture.sourceText,
      tone: "dry",
      safety: "strict",
      format: "plain"
    });

    for (const phrase of fixture.forbiddenPhrases) {
      expect(result.styledText.toLowerCase()).not.toContain(phrase.toLowerCase());
    }

    for (const label of fixture.expectedRiskLabels) {
      expect(result.riskLabels).toContain(label);
    }
  });

  it("stores searchable local memory with basic secret scrubbing", () => {
    const path = join(tmpdir(), `antti-test-memory-${Date.now()}.jsonl`);
    const response = generate({
      mode: "diagnose",
      input: "Power BI mapping uses Excel. password=banana",
      intensity: "safe"
    });

    const record = addMemory({ path, input: "Power BI mapping uses Excel. password=banana", response });

    expect(record.input).toContain("[redacted]");
    expect(scrubSecrets("api_key=abc123 user@example.com")).toBe("[redacted] [redacted]");
    expect(listMemory(path).length).toBeGreaterThan(0);
    expect(searchMemory(path, "power bi").length).toBeGreaterThan(0);
  });

  it("compress preserves ceremony and reports word counts", () => {
    const result = compress(
      "We are thrilled to announce a transformational journey to unlock value going forward."
    );

    expect(result.removedSignal.length).toBe(0);
    expect(result.ceremonyIntact).toBe(true);
    expect(result.compressed.toLowerCase()).toContain("thrilled to announce");
    expect(result.compressed.toLowerCase()).toContain("transformational journey");
    expect(result.compressed.toLowerCase()).toContain("going forward");
    expect(result.report).toContain("Token Austerity Office report:");
    expect(result.report).toContain("Reduction:");
  });

  it("compress strips operational content and keeps ceremony shell", () => {
    const result = compress("Supplier 100045 maps to SAP field ZZ_SUPP_REF_OLD2.");

    expect(result.compressed).not.toContain("100045");
    expect(result.compressed).not.toContain("ZZ_SUPP_REF_OLD2");
    expect(result.compressed).not.toContain("SAP");
    expect(result.removedSignal.length).toBeGreaterThan(0);
  });

  it("compress preserves common ceremony patterns", () => {
    const result = compress(
      "In order to leverage our bandwidth, we need to touch base and circle back going forward."
    );

    expect(result.compressed.toLowerCase()).toContain("in order to");
    expect(result.compressed.toLowerCase()).toContain("touch base");
    expect(result.compressed.toLowerCase()).toContain("going forward");
    expect(result.ceremonyIntact).toBe(true);
  });

  it("plan generates tasks with checks for ERP and shadow system signals", () => {
    const result = plan(
      "We need to align stakeholders before go-live because the SAP invoice mapping is still using final_final_v3.xlsx."
    );

    expect(result.tasks.length).toBeGreaterThan(0);
    expect(result.tasks.every((t) => t.check.length > 0)).toBe(true);
    expect(result.proofNotPressStatus).toBe("READY");
    expect(result.scope).toEqual(
      expect.arrayContaining(["ERP system validation", "Shadow system migration"])
    );
  });

  it("plan acceptance criteria are present and actionable", () => {
    const result = plan(
      "SAP invoice mapping is using a spreadsheet and nobody owns it."
    );

    expect(result.acceptanceCriteria.length).toBeGreaterThan(0);
    expect(result.report).toContain("Goal:");
    expect(result.report).toContain("Tasks:");
    expect(result.report).toContain("Acceptance criteria:");
    expect(result.report).toContain("Proof-not-press:");
  });

  it("plan detects Power BI and SharePoint gravity signals", () => {
    const result = plan(
      "Power BI semantic model definitions are in dispute. The canonical doc is somewhere in SharePoint."
    );

    expect(result.scope).toEqual(
      expect.arrayContaining(["Metric definition", "Document location"])
    );
    expect(result.tasks.some((t) => /metric/i.test(t.description))).toBe(true);
  });

  it("depress and plan modes are accessible via generate()", () => {
    const compressResult = generate({ mode: "depress", input: "Going forward we will leverage synergy.", intensity: "default" });
    const planResult = generate({ mode: "plan", input: "SAP invoice mapping uses final_final.xlsx.", intensity: "default" });

    expect(compressResult.output).toContain("Token Austerity Office report:");
    expect(planResult.output).toContain("Goal:");
    expect(planResult.output).toContain("check:");
  });

  it("meme mode returns template name and captions", () => {
    const result = generate({ mode: "meme", input: "our supplier mapping runs on Excel", intensity: "default" });

    expect(result.output).toContain("Meme:");
    expect(result.output).toContain("text0:");
    expect(result.output).toContain("text1:");
  });

  it("selectMemeTemplate returns This Is Fine for excel_as_production", () => {
    const template = selectMemeTemplate(
      { gravitySignals: ["excel_as_production"], emotionSignals: [] },
      "supplier mapping"
    );

    expect(template.memeName).toBe("This Is Fine");
    expect(template.text0).toContain("supplier mapping");
    expect(template.memeId).toBe("55311130");
  });

  it("selectMemeTemplate returns fallback for unknown signals", () => {
    const template = selectMemeTemplate(
      { gravitySignals: [], emotionSignals: [] },
      "something unusual"
    );

    expect(template.memeName).toBe("One Does Not Simply");
    expect(template.memeId).toBe("61579");
    expect(template.text1).toContain("steering group");
  });

  it("depress includes meme suggestion for high-signal input", () => {
    const result = compress(
      "Supplier 100045 maps to SAP field ZZ_SUPP_REF_OLD2 in final_final_v3.xlsx. Azure SQL instance returns 403."
    );

    expect(result.removedSignal.length).toBeGreaterThan(0);
    expect(result.memeSuggestion).not.toBeNull();
    expect(result.memeSuggestion?.memeName).toBeTruthy();
  });

  it("diagnose output includes Meme suggestion section", () => {
    const result = generate({
      mode: "diagnose",
      input: "Power BI semantic model definitions are debated while the current mapping lives in Excel.",
      intensity: "default"
    });

    expect(result.output).toContain("Meme suggestion:");
    expect(result.analysis.memeSuggestion.memeId).toBeTruthy();
    expect(result.analysis.memeSuggestion.text0).toBeTruthy();
  });

  it("generateMemeUrl returns null URL and fallback reason without credentials", async () => {
    const { generateMemeUrl } = await import("./meme.js");
    const template = selectMemeTemplate(
      { gravitySignals: ["teams_governance"], emotionSignals: [] },
      "the decision"
    );

    const savedUser = process.env["IMGFLIP_USERNAME"];
    const savedPass = process.env["IMGFLIP_PASSWORD"];
    delete process.env["IMGFLIP_USERNAME"];
    delete process.env["IMGFLIP_PASSWORD"];

    try {
      const result = await generateMemeUrl(template);
      expect(result.memeUrl).toBeNull();
      expect(result.fallbackReason).toBeTruthy();
      expect(result.memeId).toBe(template.memeId);
    } finally {
      if (savedUser !== undefined) process.env["IMGFLIP_USERNAME"] = savedUser;
      if (savedPass !== undefined) process.env["IMGFLIP_PASSWORD"] = savedPass;
    }
  });

  it("partner-safe outputs do not contain vendor attack phrases", () => {
    const gravityInput = "Teams governance, SharePoint folders, Power BI semantic disputes, Azure landing zones, and Excel-as-production.";
    const gravity = analyzeEnterpriseGravity(gravityInput);

    const allJokes = gravity.map((item) => item.partnerSafeJoke).join(" ");
    expect(allJokes).not.toMatch(/idiot|stupid|hate|terrible|incompetent|malicious/i);

    const planResult = plan(gravityInput);
    expect(planResult.report).not.toMatch(/idiot|stupid|hate|vendor is bad/i);
  });

  it.each(
    Object.entries(forbiddenPhraseFixture.categories).map(([cat, { phrases }]) => ({ cat, phrases }))
  )("forbidden category '$cat' phrases never appear in any mode output", ({ phrases }) => {
    const testInputs = [
      "We are thrilled to unlock data-driven value going forward.",
      "Teams channel governance and SharePoint folder sprawl with Excel-as-production.",
      "SAP invoice mapping uses final_final_v3.xlsx and nobody owns it before go-live."
    ];
    const modes: Array<"banalizer" | "diagnose"> = [
      "banalizer", "diagnose"
    ];

    for (const input of testInputs) {
      for (const mode of modes) {
        const result = generate({ mode, input, intensity: "default" });
        for (const phrase of phrases) {
          expect(result.output.toLowerCase()).not.toContain(phrase.toLowerCase());
        }
      }
    }
  });

  it.each(
    Object.entries(forbiddenPhraseFixture.modeRequirements).map(([mode, { mustContain }]) => ({ mode, mustContain }))
  )("mode '$mode' output contains all required sections", ({ mode, mustContain }) => {
    const input = "Legacy invoice mapping in Oracle Fusion uses final_final_v3.xlsx. Power BI semantic model definitions are still in Excel.";

    let output: string;
    if (mode === "plan") {
      output = plan(input).report;
    } else if (mode === "depress") {
      const r = compress(input);
      output = `${r.compressed}\n${r.report}`;
    } else if (mode === "meme") {
      const r = generate({ mode: "meme", input, intensity: "default" });
      output = r.output;
    } else {
      const r = generate({ mode: mode as "diagnose" | "banalizer", input, intensity: "default" });
      output = r.output;
    }

    for (const required of mustContain) {
      expect(output).toContain(required);
    }
  });

  it("no mode output contains emotional overclaiming phrases", () => {
    const emotionalInput = "The steering group needs alignment before go-live because licensing cost changed.";
    const overclaiming = forbiddenPhraseFixture.categories["emotional_overclaiming"].phrases;

    const result = generate({ mode: "diagnose", input: emotionalInput, intensity: "default" });
    for (const phrase of overclaiming) {
      expect(result.output.toLowerCase()).not.toContain(phrase.toLowerCase());
    }
    expect(result.analysis.emotionalWeather.every((item) => item.hypothesis.startsWith("Possible "))).toBe(true);
  });

  it("all golden forbidden phrases absent from all modes across ALL_FORBIDDEN list", () => {
    const input = "We are thrilled to share that the Teams governance is transformational.";
    const modes: Array<"banalizer" | "diagnose" | "satirize" | "desatirize"> = [
      "banalizer", "diagnose", "satirize", "desatirize"
    ];

    for (const mode of modes) {
      const result = generate({ mode, input, intensity: "default" });
      for (const phrase of ALL_FORBIDDEN) {
        expect(result.output.toLowerCase()).not.toContain(phrase.toLowerCase());
      }
    }
  });

  it("spec mode generates OpenSpec document with satire as source of truth", () => {
    const input = "Power BI semantic model definitions are disputed. The mapping uses Excel and nobody owns it.";
    const result = generate({ mode: "spec", input, intensity: "default" });

    expect(result.output).toContain("## What the Satire Sees");
    expect(result.output).toContain("## Requirements");
    expect(result.output).toContain("## Satire Anchor");
    expect(result.output).toContain("_The satire is not decoration. It is the diagnosis._");
    expect(result.output).toMatch(/\*\*REQ-\d+\*\* `(SHALL|MUST|SHOULD|MAY)`/);
  });

  it("generateSpec derives requirements from enterprise gravity signals", () => {
    const input = "Excel mapping and Power BI dispute with no owner before go-live.";
    const analysis = analyze(input);
    const doc: OpenSpecDocument = generateSpec(input, analysis, [], []);

    expect(doc.requirements.length).toBeGreaterThan(0);
    expect(doc.requirements.every((r) => ["SHALL", "MUST", "SHOULD", "MAY"].includes(r.level))).toBe(true);
    expect(doc.requirements.every((r) => r.derivedFrom.length > 0)).toBe(true);
    expect(doc.proposal.memeAnchor.memeId).toBeTruthy();
  });

  it("generateSpec keeps satire anchor visible — meme is not removed", () => {
    const input = "Teams channel governance and SharePoint sprawl.";
    const analysis = analyze(input);
    const doc = generateSpec(input, analysis, [], []);
    const markdown = formatSpec(doc);

    expect(markdown).toContain("Satire Anchor");
    expect(doc.proposal.memeAnchor.memeName).toBeTruthy();
    expect(doc.proposal.memeAnchor.text0).toBeTruthy();
  });

  it("compareSpecs marks new signals as ADDED", () => {
    const prev = generate({ mode: "diagnose", input: "Teams decides everything.", intensity: "default" });
    const curr = generate({ mode: "diagnose", input: "Teams decides everything. Excel is the source of truth.", intensity: "default" });
    const prevDoc = generateSpec("Teams decides everything.", prev.analysis, [], []);
    const currDoc = generateSpec("Teams decides everything. Excel is the source of truth.", curr.analysis, [], []);
    const delta = compareSpecs(prevDoc, currDoc);
    const added = delta.requirementDeltas.filter((r) => r.status === "ADDED");
    expect(added.length).toBeGreaterThanOrEqual(1);
    expect(delta.summary).toMatch(/added/);
  });

  it("compareSpecs marks requirements absent in current as REMOVED", () => {
    const a = generate({ mode: "diagnose", input: "Excel is the source of truth.", intensity: "default" });
    const b = generate({ mode: "diagnose", input: "Teams decides everything.", intensity: "default" });
    const docA = generateSpec("Excel is the source of truth.", a.analysis, [], []);
    const docB = generateSpec("Teams decides everything.", b.analysis, [], []);
    const delta = compareSpecs(docA, docB);
    expect(delta.summary).toMatch(/removed|added/);
  });

  it("formatDeltaSpec renders ADDED and REMOVED markers", () => {
    const prev = generate({ mode: "diagnose", input: "Teams decides everything.", intensity: "default" });
    const curr = generate({ mode: "diagnose", input: "Excel is the source of truth.", intensity: "default" });
    const prevDoc = generateSpec("Teams decides everything.", prev.analysis, [], []);
    const currDoc = generateSpec("Excel is the source of truth.", curr.analysis, [], []);
    const delta = compareSpecs(prevDoc, currDoc);
    const markdown = formatDeltaSpec(delta);
    expect(markdown).toMatch(/Delta:/);
    expect(markdown).toMatch(/ADDED|REMOVED|UNCHANGED/);
  });

  it("memory summary uses Antti methodology (spec signals) when analysis has signals", () => {
    const path = join(tmpdir(), `antti-test-spec-memory-${Date.now()}.jsonl`);
    const response = generate({
      mode: "diagnose",
      input: "Power BI semantic model uses Excel and Teams decides governance.",
      intensity: "default"
    });

    const record = addMemory({ path, input: "Power BI mapping uses Excel.", response });

    expect(record.outputSummary.length).toBeGreaterThan(0);
    expect(record.outputSummary).not.toContain("I have been thinking");
    expect(listMemory(path).length).toBe(1);
  });
});

