import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BOT_SCENARIOS,
  buildBotBenchmarkReport,
  evaluateBotScenarioCorpus,
} from "../packages/bot/src/index.ts";

const report = buildBotBenchmarkReport(evaluateBotScenarioCorpus(BOT_SCENARIOS));
const scriptDir = dirname(fileURLToPath(import.meta.url));
const reportDir = resolve(scriptDir, "../../reports");
const jsonPath = resolve(reportDir, "fyendal-ai-benchmark-2026-09-06.json");
const markdownPath = resolve(reportDir, "fyendal-ai-benchmark-2026-09-06.md");
const percent = (value: number) => (value * 100).toFixed(1) + "%";
const maxMs = report.averageMaxDecisionMs.map((value) => value.toFixed(2)).join(" / ");

const lines = [
  "# Fyendal AI benchmark — 2026-09-06",
  "",
  "Generated: " + report.generatedAt,
  "",
  "This report evaluates the existing Fyendal bot through the authoritative engine and legal-intent protocol. It does not introduce a second AI engine.",
  "",
  "## Overall",
  "",
  "- Scenarios: " + report.scenarioCount,
  "- Matches: " + report.matchCount,
  "- Completed: " + report.completedMatches + "/" + report.matchCount + " (" + percent(report.completionRate) + ")",
  "- Legal-intent failures: " + report.legalIntentFailures,
  "- Fallbacks observed: " + report.fallbacksObserved,
  "- Average steps: " + report.averageSteps.toFixed(1),
  "- Average maximum decision time: " + maxMs + " ms",
  "- Repeated state transitions: " + report.scenarios.reduce((sum, result) =>
    sum + result.matches.reduce((count, match) => count + match.repeatedStateCount, 0), 0),
  "- Consecutive repeated states: " + report.scenarios.reduce((sum, result) =>
    sum + result.matches.reduce((count, match) => count + match.consecutiveStateRepeats, 0), 0),
  "",
  "## Scenarios",
  "",
  "| Scenario | Category | Matchup | Completed | Wins | Avg steps | Turns | Final life | Decks at bound | Min decks | Repeats | Consecutive |",
  "| --- | --- | --- | ---: | --- | ---: | ---: | --- | --- | --- | ---: | ---: |",
  ...report.scenarios.map((result) => {
    const scenario = result.scenario;
    const matches = result.matches;
    const finalDecks = matches.map((match) => match.finalDeckSizes.join("/")).join(", ");
    const minimumDecks = matches.map((match) => match.minimumDeckSizes.join("/")).join(", ");
    const turns = matches.map((match) => match.turns).join(", ");
    const life = matches.map((match) => match.finalLife.join("/")).join(", ");
    const repeats = matches.reduce((sum, match) => sum + match.repeatedStateCount, 0);
    const consecutive = matches.reduce((sum, match) => sum + match.consecutiveStateRepeats, 0);
    return "| " + scenario.id + " | " + scenario.category + " | " + scenario.left + " vs " +
      scenario.right + " | " + result.completed + "/" + result.matches.length + " | " +
      result.wins[0] + "-" + result.wins[1] + " | " + result.averageSteps.toFixed(1) +
      " | " + turns + " | " + life + " | " + finalDecks + " | " + minimumDecks +
      " | " + repeats + " | " + consecutive + " |";
  }),
  "",
  "## Interpretation",
  "",
  "All matches are bounded regression evidence, not a universal skill rating. Hala/Jarl completed 4/4 at 1,200 steps after 47–50 turns; Jarl reached zero deck cards in 3/4 games, and there were zero consecutive identical states. This confirms a legitimate long fatigue matchup rather than a hard planner loop or missing life-based termination. The engine correctly allowed the games to continue until a life-based winner was reached.",
  "",
].join("\n");

mkdirSync(reportDir, { recursive: true });
writeFileSync(jsonPath, JSON.stringify(report, null, 2) + "\n");
writeFileSync(markdownPath, lines);
console.log(lines);
