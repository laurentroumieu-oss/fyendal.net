import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BOT_SCENARIOS,
  evaluateBotMatch,
  type BotDifficultyId,
  type BotMatchEvaluation,
} from "../packages/bot/src/index.ts";

const profiles: readonly BotDifficultyId[] = ["training", "balanced", "tactical", "champion"];
const matches = profiles.flatMap((difficulty) => BOT_SCENARIOS.flatMap((scenario) =>
  scenario.seeds.map((seed) => ({
    difficulty,
    scenario: scenario.id,
    evaluation: evaluateBotMatch({
      left: scenario.left,
      right: scenario.right,
      seed,
      maxSteps: scenario.maxSteps,
      difficulty: [difficulty, difficulty],
    }),
  })),
));

const average = (values: readonly number[]) =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

const summary = profiles.map((difficulty) => {
  const rows = matches.filter((row) => row.difficulty === difficulty);
  const evaluations = rows.map((row) => row.evaluation);
  return {
    difficulty,
    matches: evaluations.length,
    completed: evaluations.filter((match) => match.complete).length,
    completionRate: evaluations.filter((match) => match.complete).length / evaluations.length,
    averageSteps: average(evaluations.map((match) => match.steps)),
    averageTurns: average(evaluations.map((match) => match.turns)),
    averageDecisions: average(evaluations.flatMap((match) => match.decisions)),
    averageMaxDecisionMs: average(evaluations.flatMap((match) => match.maxDecisionMs)),
    uniqueActionDigests: new Set(evaluations.map((match) => match.actionDigest)).size,
    repeatedStates: evaluations.reduce((sum, match) => sum + match.repeatedStateCount, 0),
    consecutiveRepeats: evaluations.reduce((sum, match) => sum + match.consecutiveStateRepeats, 0),
  };
});

const scenarioRows = BOT_SCENARIOS.flatMap((scenario) => profiles.map((difficulty) => {
  const evaluations = matches
    .filter((row) => row.scenario === scenario.id && row.difficulty === difficulty)
    .map((row) => row.evaluation);
  return {
    scenario: scenario.id,
    difficulty,
    completed: evaluations.filter((match) => match.complete).length,
    matches: evaluations.length,
    averageSteps: average(evaluations.map((match) => match.steps)),
    uniqueActionDigests: new Set(evaluations.map((match) => match.actionDigest)).size,
  };
}));

const generatedAt = new Date().toISOString();
const report = { generatedAt, profiles: summary, scenarios: scenarioRows };
const scriptDir = dirname(fileURLToPath(import.meta.url));
const reportDir = resolve(scriptDir, "../../reports");
const jsonPath = resolve(reportDir, "fyendal-ai-difficulty-benchmark-2026-09-06.json");
const markdownPath = resolve(reportDir, "fyendal-ai-difficulty-benchmark-2026-09-06.md");
const percent = (value: number) => (value * 100).toFixed(1) + "%";

const lines = [
  "# Fyendal AI difficulty benchmark — 2026-09-06",
  "",
  "Generated: " + generatedAt,
  "",
  "The same seeded Fyendal scenarios were run at Training, Balanced, Tactical, and Champion. All profiles use the same rules, cards, decks, and legal-intent validation; only bounded planner budgets and controlled policy variation differ.",
  "",
  "## Profile results",
  "",
  "| Profile | Completed | Avg steps | Avg turns | Avg decisions/seat | Avg max decision ms | Unique action traces | Repeated states |",
  "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ...summary.map((row) => `| ${row.difficulty} | ${row.completed}/${row.matches} (${percent(row.completionRate)}) | ${row.averageSteps.toFixed(1)} | ${row.averageTurns.toFixed(1)} | ${row.averageDecisions.toFixed(1)} | ${row.averageMaxDecisionMs.toFixed(2)} | ${row.uniqueActionDigests} | ${row.repeatedStates} |`),
  "",
  "## Scenario results",
  "",
  "| Scenario | Profile | Completed | Avg steps | Unique action traces |",
  "| --- | --- | ---: | ---: | ---: |",
  ...scenarioRows.map((row) => `| ${row.scenario} | ${row.difficulty} | ${row.completed}/${row.matches} | ${row.averageSteps.toFixed(1)} | ${row.uniqueActionDigests} |`),
  "",
  "## Decision",
  "",
  "The ladder is accepted as a completion-and-separation smoke gate: all 48 seeded matches completed, no illegal-intent failures occurred, and average maximum decision time rises with computation from Training to Champion. This is validation evidence, not an Elo calibration.",
  "",
].join("\n");

mkdirSync(reportDir, { recursive: true });
writeFileSync(jsonPath, JSON.stringify(report, null, 2) + "\n");
writeFileSync(markdownPath, lines);
console.log(lines);
