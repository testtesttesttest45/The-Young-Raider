export type RaiderUnlockRequirement =
  | {
      type: "free";
      amount: 0;
    }
  | {
      type: "highscore";
      amount: number;
    }
  | {
      type: "cash";
      amount: number;
    };

export const RAIDER_UNLOCK_REQUIREMENTS: Record<
  number,
  RaiderUnlockRequirement
> = {
  16: {
    type: "free",
    amount: 0,
  },

  17: {
    type: "highscore",
    amount: 1_000,
  },

  18: {
    type: "cash",
    amount: 50,
  },

  19: {
    type: "highscore",
    amount: 15_000,
  },
};