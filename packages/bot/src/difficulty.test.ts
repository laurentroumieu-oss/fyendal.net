import { describe, expect, it } from "vitest";
import {
  BOT_DIFFICULTY_PROFILES,
  botDifficultyProfile,
  plannerBudget,
} from "./difficulty.js";

describe("bot difficulty profiles", () => {
  it("defines the four player-facing levels without changing rules or card values", () => {
    expect(Object.keys(BOT_DIFFICULTY_PROFILES)).toEqual([
      "training",
      "balanced",
      "tactical",
      "champion",
    ]);
    expect(BOT_DIFFICULTY_PROFILES.training.variationRate).toBeGreaterThan(
      BOT_DIFFICULTY_PROFILES.champion.variationRate,
    );
    expect(BOT_DIFFICULTY_PROFILES.training.searchNodeMultiplier).toBeLessThan(
      BOT_DIFFICULTY_PROFILES.champion.searchNodeMultiplier,
    );
    expect(BOT_DIFFICULTY_PROFILES.champion.variationRate).toBe(0);
  });

  it("scales only bounded planner budgets and defaults unknown ids to Balanced", () => {
    expect(plannerBudget(
      { maxSearchNodes: 100, maxTransitions: 200, maxRootCandidates: 20 },
      "training",
    )).toEqual({ maxSearchNodes: 50, maxTransitions: 100, maxRootCandidates: 12 });
    expect(plannerBudget(
      { maxSearchNodes: 100, maxTransitions: 200, maxRootCandidates: 20 },
      "champion",
    )).toEqual({ maxSearchNodes: 200, maxTransitions: 400, maxRootCandidates: 35 });
    expect(botDifficultyProfile("unknown").id).toBe("balanced");
  });
});
