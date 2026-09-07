import type { CardView, GameIntent } from "@fyendal/shared";
import { chooseScoredIntent, intentCard, ownCards, type BotPolicyInput } from "./policy.js";

/**
 * A deliberately conservative fallback for Silver Age practice decks that do
 * not have a hero-specific policy yet. It only selects engine-provided legal
 * intents and prefers attacks, useful activations, and efficient defense.
 * This is a playable baseline, not a claim of optimal hero strategy.
 */
function cardFor(intent: GameIntent, input: BotPolicyInput): CardView | undefined {
  return intentCard(intent, ownCards(input));
}

function scoreCard(intent: GameIntent, input: BotPolicyInput): number {
  const card = cardFor(intent, input);
  const data = card ? input.cards[card.cardId] : undefined;
  if (!data) return 0;
  if (data.cardType === "weapon" || data.attack !== undefined) {
    return 20 + (data.attack ?? 0) * 4 + (data.cost ?? 0);
  }
  if (data.cardType === "instant" || data.cardType === "action") return 8 + (data.cost ?? 0);
  return data.defense ?? data.pitch ?? 0;
}

function scoreProfiledCard(
  intent: GameIntent,
  input: BotPolicyInput,
  profile: "kayo" | "iyslander",
): number {
  const score = scoreCard(intent, input);
  const card = cardFor(intent, input);
  const data = card ? input.cards[card.cardId] : undefined;
  if (!data) return score;
  const name = data.name.toLowerCase();
  const text = data.text.toLowerCase();

  if (profile === "kayo") {
    // Kayo alternates efficient two-card turns with explosive attack turns.
    if (data.attack !== undefined) return score + (data.attack >= 6 ? 24 : 10);
    if (
      name.includes("clash of might") ||
      name.includes("high pitched howl") ||
      name.includes("rough up") ||
      name.includes("wild ride") ||
      name.includes("savage feast") ||
      name.includes("sirens of safe harbor")
    ) return score + 24;
    if (name.includes("pulping") || name.includes("strongest survive")) return score + 18;
    if (name.includes("agile windup") || name.includes("draw") || text.includes("discard")) {
      return score + 10;
    }
    return score;
  }

  // Silver Age Iyslander is the Bullander plan: physical pressure on our
  // turn, then Ice/Wizard disruption when the opponent owns priority.
  if (
    name === "wounded bull" ||
    name === "fyendal's fighting spirit" ||
    name === "look tuff"
  ) {
    return score + 28;
  }
  if (input.view.activePlayer !== input.seat &&
      (text.includes("arcane damage") || text.includes("frostbite") || text.includes("ice"))) {
    return score + 30;
  }
  if (text.includes("arcane damage") || text.includes("frostbite")) return score + 12;
  return score;
}

function scoreDefense(
  intent: Extract<GameIntent, { kind: "defend" }>,
  input: BotPolicyInput,
): number {
  const own = ownCards(input);
  return intent.instanceIds.reduce((total, id) => {
    const card = own.get(id);
    return total + (card?.defense ?? input.cards[card?.cardId ?? ""]?.defense ?? 0);
  }, 0) - (intent.pitchInstanceIds?.length ?? 0);
}

export function chooseGenericSilverAgeIntent(input: BotPolicyInput): GameIntent {
  return chooseProfiledIntent(input, "kayo");
}

function chooseProfiledIntent(
  input: BotPolicyInput,
  profile: "kayo" | "iyslander",
): GameIntent {
  return chooseScoredIntent(input, {
    defend: (intent, policyInput) => scoreDefense(intent, policyInput),
    choose: () => 0,
    play: (intent, policyInput) => scoreProfiledCard(intent, policyInput, profile),
    nextTurnArsenal: (card) => card.defense ?? 0,
  });
}

export function chooseKayoIntent(input: BotPolicyInput): GameIntent {
  return chooseProfiledIntent(input, "kayo");
}

export function chooseIyslanderIntent(input: BotPolicyInput): GameIntent {
  return chooseProfiledIntent(input, "iyslander");
}
