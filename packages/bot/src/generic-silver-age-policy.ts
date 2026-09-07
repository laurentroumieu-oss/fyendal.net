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
  return chooseScoredIntent(input, {
    defend: (intent, policyInput) => scoreDefense(intent, policyInput),
    choose: () => 0,
    play: (intent, policyInput) => scoreCard(intent, policyInput),
    nextTurnArsenal: (card) => card.defense ?? 0,
  });
}
