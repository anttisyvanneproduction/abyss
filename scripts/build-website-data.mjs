import { readFileSync, writeFileSync } from "node:fs";

const fixturePath = "examples/codec/satire-codec.fixtures.json";
const outputPath = "website/codec-fixtures.json";
const fixtures = JSON.parse(readFileSync(fixturePath, "utf8"));

const publicFixtures = fixtures.fixtures.map((fixture) => ({
  id: fixture.id,
  direction: fixture.direction,
  sourceText: fixture.sourceText,
  expectedRiskLabels: fixture.expectedRiskLabels,
  reviewStatus: fixture.reviewStatus
}));

writeFileSync(outputPath, `${JSON.stringify({ generatedFrom: fixturePath, fixtures: publicFixtures }, null, 2)}\n`, "utf8");
console.log(`Wrote ${publicFixtures.length} website codec fixtures.`);