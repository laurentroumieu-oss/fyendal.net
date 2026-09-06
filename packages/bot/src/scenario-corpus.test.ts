import { describe, expect, it } from "vitest";
import {
  BOT_SCENARIOS,
  evaluateBotScenarioCorpus,
} from "./scenario-corpus.js";

describe("bot scenario corpus", () => {
  it("contains repeatable coverage across the main decision areas", () => {
    expect(BOT_SCENARIOS).toHaveLength(3);
    expect(new Set(BOT_SCENARIOS.map((scenario) => scenario.category))).toEqual(
      new Set(["lethal-pressure", "defense", "pitch-and-arsenal"]),
    );
    for (const scenario of BOT_SCENARIOS) {
      expect(scenario.seeds).toHaveLength(4);
      expect(scenario.maxSteps).toBeGreaterThan(0);
      expect(scenario.purpose.length).toBeGreaterThan(20);
    }
  });

  it("runs every seeded scenario through authoritative legal intents", () => {
    let tick = 0;
    const results = evaluateBotScenarioCorpus(BOT_SCENARIOS, () => tick++);
    expect(results).toHaveLength(BOT_SCENARIOS.length);
    expect(results.flatMap((result) => result.matches)).toHaveLength(12);
    for (const result of results) {
      expect(result.completed).toBeGreaterThanOrEqual(0);
      expect(result.matches.every((match) => match.steps > 0)).toBe(true);
      expect(result.wins[0] + result.wins[1]).toBeLessThanOrEqual(result.matches.length);
    }
  }, 120_000);
});
