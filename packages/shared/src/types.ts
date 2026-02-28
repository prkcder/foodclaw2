export type PlanningDecision = {
  intentId: string;
  action: "AUTO_ORDER" | "ASK_CONFIRMATION" | "NO_ACTION";
  confidence: number;
  reason: string;
};

export type CandidateMeal = {
  id: string;
  name: string;
  priceCents: number;
  etaMinutes: number;
  ingredients: string[];
};

export type UserPolicy = {
  autoOrderEnabled: boolean;
  confidenceThreshold: number;
  maxMealPriceCents?: number;
};
