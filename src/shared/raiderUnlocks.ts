export type KingDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type KingGameMode = "normal" | "king";

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
    }
  | {
      type: "king";
      amount: 0;
      kingDay: KingDay;
    };

export type KingStatusResponse = {
  type: "king-status";

  serverDay: KingDay;

  kingCharacterCode: number;
  unlockCharacterCode: number;

  kingName: string;
  rewardName: string;
  iconKey: string;

  kingLevel: number;
  defeatsToday: number;

  entryCost: number;

  currentCash: number;
  canEnter: boolean;
  alreadyUnlocked: boolean;

  nextResetAt: number;
};

export type EnterKingBattleRequest = {
  expectedDay: KingDay;
};

export type EnterKingBattleResponse = {
  type: "enter-king-battle";
  status: "success";

  serverDay: KingDay;

  kingCharacterCode: number;
  unlockCharacterCode: number;

  kingLevel: number;
  defeatsToday: number;

  entryCost: number;
  remainingCash: number;

  battleToken: string;
};

export type CompleteKingBattleRequest = {
  battleToken: string;
  kingCharacterCode: number;
  score: number;
};

export type CompleteKingBattleResponse = {
  type: "complete-king-battle";
  status: "success";

  serverDay: KingDay;

  defeatedKingCharacterCode: number;
  unlockedCharacterCode: number;

  defeatedKingLevel: number;
  defeatsToday: number;
  nextKingLevel: number;
  nextEntryCost: number;

  alreadyUnlocked: boolean;

  scoreAwarded: number;
  totalScore: number;
  totalKills: number;

  message: string;
  communityContribution: {
    challenge: "gold" | null;
    amount: number;
  };

  communityRewards: {
    damageBonus: number;
    healthBonus: number;
    goldBonus: number;
  };
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
    amount: 1000,
  },

  19: {
    type: "king",
    amount: 0,
    kingDay: "saturday",
  },

  21: {
    type: "king",
    amount: 0,
    kingDay: "sunday",
  },

  23: {
    type: "king",
    amount: 0,
    kingDay: "monday",
  },

  25: {
    type: "king",
    amount: 0,
    kingDay: "tuesday",
  },

  27: {
    type: "king",
    amount: 0,
    kingDay: "wednesday",
  },

  29: {
    type: "king",
    amount: 0,
    kingDay: "thursday",
  },

  31: {
    type: "king",
    amount: 0,
    kingDay: "friday",
  },

  33: {
    type: "cash",
    amount: 350,
  },
};

export type KingSlayerLeaderboardEntry = {
  rank: number;
  username: string;
  score: number;
  kills: number;
};

export type KingSlayerLeaderboardResponse = {
  type: "king-slayer-leaderboard";

  entries: KingSlayerLeaderboardEntry[];

  username: string | null;

  personalScore: number;

  personalKills: number;

  playerRank: number | null;
};
