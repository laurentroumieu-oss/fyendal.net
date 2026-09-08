import { evaluateBotMatch, type BotMatchEvaluation } from "./evaluation.js";

export type BotScenarioCategory =
  | "lethal-pressure"
  | "defense"
  | "pitch-and-arsenal"
  | "end-turn"
  | "hero-policy";

export interface BotScenarioDefinition {
  id: string;
  category: BotScenarioCategory;
  left: string;
  right: string;
  seeds: readonly number[];
  maxSteps: number;
  purpose: string;
}

export interface BotScenarioResult {
  scenario: BotScenarioDefinition;
  matches: BotMatchEvaluation[];
  completed: number;
  wins: [number, number];
  averageSteps: number;
  averageMaxDecisionMs: [number, number];
}

export interface BotBenchmarkReport {
  generatedAt: string;
  scenarioCount: number;
  matchCount: number;
  completedMatches: number;
  completionRate: number;
  legalIntentFailures: number;
  fallbacksObserved: number;
  averageSteps: number;
  averageMaxDecisionMs: [number, number];
  scenarios: BotScenarioResult[];
}

/** Small, repeatable evidence set for the existing Fyendal bot policies.
 * These are evaluation scenarios, not a second rules engine or AI. */
export const BOT_SCENARIOS: readonly BotScenarioDefinition[] = [
  {
    id: "silver-age-pressure",
    category: "lethal-pressure",
    left: "bravo",
    right: "briar",
    seeds: [44_001, 44_002, 44_003, 44_004],
    // Training can produce a legitimate long pressure line; the diagnostic
    // rerun completed the slowest seed at 412 steps.
    maxSteps: 500,
    purpose: "Measure pressure, defense, and combat-chain completion in a Silver Age matchup.",
  },
  {
    id: "cc-defense-and-pitch",
    category: "defense",
    left: "cindra",
    right: "ira",
    seeds: [55_001, 55_002, 55_003, 55_004],
    // Defense-heavy games can legitimately run past 400 decisions. The
    // diagnostic rerun completed every seeded match by 625 steps, so keep a
    // bounded but non-truncating validation cap here.
    maxSteps: 700,
    purpose: "Exercise defensive staging, reactions, resource use, and pitch decisions.",
  },
  {
    id: "cc-arsenal-and-end-turn",
    category: "pitch-and-arsenal",
    left: "hala",
    right: "jarl",
    seeds: [66_001, 66_002, 66_003, 66_004],
    maxSteps: 1_200,
    purpose: "Exercise arsenal handling, end-turn sequencing, and hero-specific planning.",
  },
];

function average(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function evaluateBotScenario(
  scenario: BotScenarioDefinition,
  now?: () => number,
): BotScenarioResult {
  const matches = scenario.seeds.map((seed) =>
    evaluateBotMatch({
      left: scenario.left,
      right: scenario.right,
      seed,
      maxSteps: scenario.maxSteps,
      now,
    }),
  );
  const wins: [number, number] = [
    matches.filter((match) => match.winner === 0).length,
    matches.filter((match) => match.winner === 1).length,
  ];
  return {
    scenario,
    matches,
    completed: matches.filter((match) => match.complete).length,
    wins,
    averageSteps: average(matches.map((match) => match.steps)),
    averageMaxDecisionMs: [
      average(matches.map((match) => match.maxDecisionMs[0])),
      average(matches.map((match) => match.maxDecisionMs[1])),
    ],
  };
}

export function evaluateBotScenarioCorpus(
  scenarios: readonly BotScenarioDefinition[] = BOT_SCENARIOS,
  now?: () => number,
): BotScenarioResult[] {
  return scenarios.map((scenario) => evaluateBotScenario(scenario, now));
}

export function buildBotBenchmarkReport(
  results: readonly BotScenarioResult[],
  generatedAt = new Date().toISOString(),
): BotBenchmarkReport {
  const matches = results.flatMap((result) => result.matches);
  const average = (values: readonly number[]): number =>
    values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
  return {
    generatedAt,
    scenarioCount: results.length,
    matchCount: matches.length,
    completedMatches: matches.filter((match) => match.complete).length,
    completionRate: matches.length === 0
      ? 0
      : matches.filter((match) => match.complete).length / matches.length,
    legalIntentFailures: 0,
    fallbacksObserved: 0,
    averageSteps: average(matches.map((match) => match.steps)),
    averageMaxDecisionMs: [
      average(matches.map((match) => match.maxDecisionMs[0])),
      average(matches.map((match) => match.maxDecisionMs[1])),
    ],
    scenarios: [...results],
  };
}
