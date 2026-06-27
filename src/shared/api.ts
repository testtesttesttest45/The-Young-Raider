export type InitResponse = {
  type: "init";
  postId: string;
  count: number;
  username: string;
};

export type IncrementResponse = {
  type: "increment";
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: "decrement";
  postId: string;
  count: number;
};

// leaderboard
export type LeaderboardEntry = {
  rank: number;
  username: string;
  score: number;
  highestBaseSeen: number;
};

export type PlayerProfileResponse = {
  type: "player-profile";
  username: string;
  allTimeHighScore: number;
  todayHighScore: number;
  highestBaseSeen: number;
  cash: number;
  globalRank: number | null;
  canRequestCash: boolean;
  cashRequestAvailableAt: number;
  cashRequestCooldownRemainingMs: number;

  canClaimDailyReward: boolean;
  dailyRewardCash: number;
  dailyRewardNextResetAt: number;
  dailyRewardRemainingMs: number;
};

export type ClaimDailyRewardResponse = {
  type: "claim-daily-reward";
  status: "success";
  message: string;
  rewardCash: number;
  totalCash: number;
  nextResetAt: number;
};

export type CreateCashRequestResponse = {
  type: "create-cash-request";
  status: "success";
  message: string;
  requestId: string;
  nextRequestAvailableAt: number;
};

export type SubmitHighScoreRequest = {
  score: number;
  cashEarned: number;
  highestBaseSeen: number;
};

export type SubmitHighScoreResponse = {
  type: "submit-high-score";

  username: string;

  submittedScore: number;
  submittedBaseSeen: number;

  personalBest: number;
  todayBest: number;

  highestBaseSeen: number;

  totalCash: number;
  cashEarned: number;

  rank: number | null;

  isNewBest: boolean;
  isNewDailyBest: boolean;
  isNewHighestBaseSeen: boolean;
};

export type LeaderboardResponse = {
  type: "leaderboard";

  entries: LeaderboardEntry[];

  username: string | null;

  personalBest: number;
  personalHighestBaseSeen: number;

  playerRank: number | null;
};

export type ApiErrorResponse = {
  status: "error";
  message: string;
};

export type ShareScoreRequest = {
  score: number;
  highestBaseSeen: number;
  isNewHighScore: boolean;
};

export type ShareScoreResponse = {
  type: "share-score";
  status: "success";
  message: string;
};

export type SharedScorePostData = {
  postType: "shared-score";
  username: string;
  score: number;
  highestBaseSeen: number;
  isNewHighScore: boolean;
};

export type SharedScorePostResponse = {
  type: "shared-score-post";
  data: SharedScorePostData;
};

export type ShareProfileResponse = {
  type: "share-leaderboard";
  status: "success";
  message: string;
};

export type SharedProfilePostData = {
  postType: "shared-profile";
  username: string;
  highestScore: number;
  highestBaseSeen: number;
  globalRank: number | null;
};

export type SharedProfilePostResponse = {
  type: "shared-profile-post";
  data: SharedProfilePostData;
};

export type CashDonationEntry = { username: string; donatedAt: number };
export type CashRequestViewData = {
  requestId: string;

  requesterUsername: string;

  receivedCount: number;
  limit: number;
  cashCollected: number;

  donors: CashDonationEntry[];

  currentUsername: string | null;
  currentUserCash: number | null;

  hasDonated: boolean;
  isRequester: boolean;
  isComplete: boolean;

  expiresAt: number;
  remainingTimeMs: number;
  isExpired: boolean;

  canDonate: boolean;
};

export type CashRequestPostResponse = {
  type: "cash-request-post";
  data: CashRequestViewData;
};
export type DonateCashResponse = {
  type: "donate-cash";
  status: "success";
  message: string;
  data: CashRequestViewData;
};

export type GetSelectedRaiderResponse = {
  type: "selected-raider";
  characterCode: number;
};

export type SaveSelectedRaiderRequest = {
  characterCode: number;
};

export type SaveSelectedRaiderResponse = {
  type: "save-selected-raider";
  status: "success";
  characterCode: number;
  message: string;
};

export type RaiderUnlockType = "free" | "highscore" | "cash" | "king";

export type RaiderCollectionItem = {
  characterCode: number;

  owned: boolean;
  selected: boolean;

  unlockType: RaiderUnlockType;
  requirementAmount: number;

  requirementMet: boolean;
};

export type RaiderCollectionResponse = {
  type: "raider-collection";

  selectedRaider: number;

  allTimeHighScore: number;
  cash: number;

  raiders: RaiderCollectionItem[];
};

export type UnlockRaiderRequest = {
  characterCode: number;
};

export type UnlockRaiderResponse = {
  type: "unlock-raider";
  status: "success";

  characterCode: number;
  remainingCash: number;

  message: string;
};

export type TutorialStatusResponse = {
  type: "tutorial-status";
  completed: boolean;
};

export type CompleteTutorialResponse = {
  type: "tutorial-complete";
  status: "success";
  message: string;
};

export type ShareKingSlayerLeaderboardResponse = {
  type: "share-king-slayer-leaderboard";
  status: "success";
  message: string;
};

export type SharedKingSlayerPostData = {
  postType: "shared-king-slayer";

  username: string;

  score: number;

  kills: number;

  globalRank: number | null;
};

export type SharedKingSlayerPostResponse = {
  type: "shared-king-slayer-post";

  data: SharedKingSlayerPostData;
};