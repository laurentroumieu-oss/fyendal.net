export type BotDifficultyId = "training" | "balanced" | "tactical" | "champion";

export interface BotDifficultyProfile {
  id: BotDifficultyId;
  label: string;
  ratingGuide: number;
  searchNodeMultiplier: number;
  transitionMultiplier: number;
  rootCandidateMultiplier: number;
  variationRate: number;
  description: string;
}

export interface BotPlannerBudget {
  maxSearchNodes: number;
  maxTransitions: number;
  maxRootCandidates: number;
}

export const BOT_DIFFICULTY_PROFILES: Readonly<Record<BotDifficultyId, BotDifficultyProfile>> = {
  training: {
    id: "training",
    label: "Training",
    ratingGuide: 1400,
    searchNodeMultiplier: 0.5,
    transitionMultiplier: 0.5,
    rootCandidateMultiplier: 0.6,
    variationRate: 0.18,
    description: "Forgiving lines with more variation for learning common decisions.",
  },
  balanced: {
    id: "balanced",
    label: "Balanced",
    ratingGuide: 1650,
    searchNodeMultiplier: 1,
    transitionMultiplier: 1,
    rootCandidateMultiplier: 1,
    variationRate: 0.08,
    description: "The standard practice opponent with stable pressure and defense.",
  },
  tactical: {
    id: "tactical",
    label: "Tactical",
    ratingGuide: 1800,
    searchNodeMultiplier: 1.5,
    transitionMultiplier: 1.5,
    rootCandidateMultiplier: 1.35,
    variationRate: 0.03,
    description: "More computation for efficient blocks, reactions, and tempo lines.",
  },
  champion: {
    id: "champion",
    label: "Champion",
    ratingGuide: 1850,
    searchNodeMultiplier: 2,
    transitionMultiplier: 2,
    rootCandidateMultiplier: 1.75,
    variationRate: 0,
    description: "The strongest bounded profile, with minimal decision variation.",
  },
};

export function botDifficultyProfile(
  id: BotDifficultyId | string | undefined,
): BotDifficultyProfile {
  return BOT_DIFFICULTY_PROFILES[
    id && id in BOT_DIFFICULTY_PROFILES ? id as BotDifficultyId : "balanced"
  ];
}

export function plannerBudget(
  base: BotPlannerBudget,
  difficulty: BotDifficultyId | string | undefined,
): BotPlannerBudget {
  const profile = botDifficultyProfile(difficulty);
  return {
    maxSearchNodes: Math.max(1, Math.round(base.maxSearchNodes * profile.searchNodeMultiplier)),
    maxTransitions: Math.max(1, Math.round(base.maxTransitions * profile.transitionMultiplier)),
    maxRootCandidates: Math.max(1, Math.round(base.maxRootCandidates * profile.rootCandidateMultiplier)),
  };
}
