import { Hono } from "hono";

import { context, redis, reddit } from "@devvit/web/server";
import { randomUUID } from "node:crypto";
import {
  RAIDER_UNLOCK_REQUIREMENTS,
  RaiderUnlockRequirement,
  KingDay,
  KingStatusResponse,
  EnterKingBattleRequest,
  EnterKingBattleResponse,
  CompleteKingBattleRequest,
  CompleteKingBattleResponse,
  KingSlayerLeaderboardEntry,
  KingSlayerLeaderboardResponse,
} from "../../shared/raiderUnlocks";

import type {
  ApiErrorResponse,
  DecrementResponse,
  IncrementResponse,
  InitResponse,
  LeaderboardEntry,
  LeaderboardResponse,
  PlayerProfileResponse,
  ShareScoreRequest,
  ShareScoreResponse,
  SubmitHighScoreRequest,
  SubmitHighScoreResponse,
  SharedScorePostResponse,
  SharedProfilePostResponse,
  ShareProfileResponse,
  gemDonationEntry,
  gemRequestPostResponse,
  gemRequestViewData,
  CreategemRequestResponse,
  DonategemResponse,
  ClaimDailyRewardResponse,
  GetSelectedRaiderResponse,
  SaveSelectedRaiderRequest,
  SaveSelectedRaiderResponse,
  RaiderCollectionItem,
  RaiderCollectionResponse,
  UnlockRaiderRequest,
  UnlockRaiderResponse,
  TutorialStatusResponse,
  CompleteTutorialResponse,
  ShareKingSlayerLeaderboardResponse,
  SharedKingSlayerPostResponse,
  ShareKingVictoryResponse,
  SharedKingVictoryPostResponse,
  CommunityChallengeType,
  CommunityRewardValues,
  CommunityStatusResponse,
  SelectCommunityChallengeRequest,
  SelectCommunityChallengeResponse,
} from "../../shared/api";

export const api = new Hono();

const LEADERBOARD_KEY = "the-young-raider:leaderboard:all-time";

const PLAYER_gem_KEY = "the-young-raider:players:gem";

const PLAYER_HIGHEST_BASE_KEY = "the-young-raider:players:highest-base-seen";

const LEADERBOARD_SIZE = 100;

const MAXIMUM_ALLOWED_SCORE = 1_000_000_000;

const MAXIMUM_gem_PER_RUN = 1_000_000;

const MAXIMUM_BASE_LEVEL = 1_000_000;

const gem_REQUEST_LIMIT = 10;
const gem_DONATION_AMOUNT = 1;
const gem_REQUEST_DURATION_MS = 5 * 60 * 60 * 1000; // request accepts donations for five hours.
const gem_REQUEST_COOLDOWN_MS = 6 * 60 * 60 * 1000; // user can only create a new request every six hours.
const gem_REQUEST_COOLDOWN_KEY = "the-young-raider:gem-request:cooldowns";
const gem_REQUEST_KEY_PREFIX = "the-young-raider:gem-request:";

const DAILY_REWARD_gem = 5;
const DAILY_REWARD_CLAIM_KEY = "the-young-raider:daily-reward:last-claim-date";

const PLAYER_SELECTED_RAIDER_KEY = "the-young-raider:players:selected-raider";

const DEFAULT_RAIDER_CODE = 16;

const VALID_RAIDER_CODES = new Set([
  16, 17, 18, 19, 21, 23, 25, 27, 29, 31, 33, 34, 35
]);

const PLAYER_OWNED_RAIDERS_KEY = "the-young-raider:players:owned-raiders";

const PLAYER_TUTORIAL_KEY = "the-young-raider:players:tutorial-completed";

const BASE_KING_ENTRY_COST = 50;

const KING_LEVEL_GROWTH = 1.05;

const PLAYER_DAILY_KING_DEFEATS_KEY =
  "the-young-raider:players:daily-king-defeats";

const KING_BATTLE_TOKEN_DURATION_MS = 30 * 60 * 1000;

const KING_BATTLE_TOKEN_PREFIX = "the-young-raider:king-battle-token:";

const PLAYER_DEFEATED_KINGS_KEY = "the-young-raider:players:defeated-kings";

const KING_SLAYER_LEADERBOARD_KEY = "the-young-raider:leaderboard:king-slayer";

const KING_SLAYER_KILLS_KEY = "the-young-raider:players:king-kills";

const PLAYER_LATEST_KING_VICTORY_KEY =
  "the-young-raider:players:latest-king-victory";

const KING_SLAYER_LEADERBOARD_SIZE = 100;

const MAXIMUM_KING_SCORE_PER_CLEAR = 500;

const COMMUNITY_PROGRESS_KEY = "the-young-raider:community:progress";

const PLAYER_COMMUNITY_CHALLENGE_KEY =
  "the-young-raider:players:community-challenge";

const PLAYER_COMMUNITY_SCORE_BESTS_KEY =
  "the-young-raider:players:community-score-bests";

const DEFAULT_COMMUNITY_CHALLENGE: CommunityChallengeType = "damage";

const COMMUNITY_DAMAGE_TARGET = 1_000_000;
const COMMUNITY_HEALTH_TARGET = 1_000_000;
const COMMUNITY_GOLD_TARGET = 1_000;

const COMMUNITY_SCORE_MILESTONE = 10_000;
const COMMUNITY_KILL_MILESTONE = 10;

const COMMUNITY_DAMAGE_PER_MILESTONE = 2;
const COMMUNITY_HEALTH_PER_MILESTONE = 5;
const COMMUNITY_GOLD_PER_MILESTONE = 10;

const COMMUNITY_MAX_DAMAGE_BONUS = 200;
const COMMUNITY_MAX_HEALTH_BONUS = 500;
const COMMUNITY_MAX_GOLD_BONUS = 1_000;

type StoredLatestKingVictory = {
  dateKey: string;

  serverDay: KingDay;

  kingCharacterCode: number;

  kingLevel: number;

  scoreAwarded: number;

  totalKills: number;

  completedAt: number;
};

function parseCommunityProgress(rawValue: string | undefined | null): number {
  if (!rawValue) {
    return 0;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return Math.max(0, parsedValue);
}

function parseCommunityChallenge(
  rawValue: string | undefined | null,
): CommunityChallengeType {
  if (rawValue === "damage" || rawValue === "health" || rawValue === "gold") {
    return rawValue;
  }

  return DEFAULT_COMMUNITY_CHALLENGE;
}

function getCommunityScoreBestField(
  username: string,
  challenge: "damage" | "health",
): string {
  return `${username}:${challenge}`;
}

async function contributeCommunityScore(
  username: string,
  challenge: "damage" | "health",
  submittedScore: number,
): Promise<{
  amount: number;
  previousBest: number;
  newBest: number;
}> {
  const bestField = getCommunityScoreBestField(username, challenge);

  const target =
    challenge === "damage" ? COMMUNITY_DAMAGE_TARGET : COMMUNITY_HEALTH_TARGET;

  for (let attempt = 0; attempt < 5; attempt++) {
    const transaction = await redis.watch(
      PLAYER_COMMUNITY_SCORE_BESTS_KEY,
      COMMUNITY_PROGRESS_KEY,
    );

    const [previousBestValue, currentProgressValue] = await Promise.all([
      redis.hGet(PLAYER_COMMUNITY_SCORE_BESTS_KEY, bestField),

      redis.hGet(COMMUNITY_PROGRESS_KEY, challenge),
    ]);

    const previousBest = parseCommunityProgress(previousBestValue);

    const currentProgress = parseCommunityProgress(currentProgressValue);

    const safeSubmittedScore = Math.max(0, Math.floor(submittedScore));

    const newBest = Math.max(previousBest, safeSubmittedScore);

    const rawImprovement = Math.max(0, newBest - previousBest);

    const remainingProgress = Math.max(0, target - currentProgress);

    const contributionAmount = Math.min(rawImprovement, remainingProgress);

    await transaction.multi();

    if (newBest > previousBest) {
      await transaction.hSet(PLAYER_COMMUNITY_SCORE_BESTS_KEY, {
        [bestField]: newBest.toString(),
      });
    }

    if (contributionAmount > 0) {
      await transaction.hIncrBy(
        COMMUNITY_PROGRESS_KEY,
        challenge,
        contributionAmount,
      );
    }

    const result = await transaction.exec();

    if (result === null) {
      continue;
    }

    return {
      amount: contributionAmount,
      previousBest,
      newBest,
    };
  }

  throw new Error("Community progress changed while saving the score.");
}

async function getCommunityProgress(): Promise<{
  damage: number;
  health: number;
  gold: number;
}> {
  const [damageValue, healthValue, goldValue] = await Promise.all([
    redis.hGet(COMMUNITY_PROGRESS_KEY, "damage"),
    redis.hGet(COMMUNITY_PROGRESS_KEY, "health"),
    redis.hGet(COMMUNITY_PROGRESS_KEY, "gold"),
  ]);

  return {
    damage: Math.min(
      COMMUNITY_DAMAGE_TARGET,
      parseCommunityProgress(damageValue),
    ),

    health: Math.min(
      COMMUNITY_HEALTH_TARGET,
      parseCommunityProgress(healthValue),
    ),

    gold: Math.min(COMMUNITY_GOLD_TARGET, parseCommunityProgress(goldValue)),
  };
}

function calculateCommunityRewards(progress: {
  damage: number;
  health: number;
  gold: number;
}): CommunityRewardValues {
  return {
    damageBonus: Math.min(
      COMMUNITY_MAX_DAMAGE_BONUS,
      Math.floor(progress.damage / COMMUNITY_SCORE_MILESTONE) *
        COMMUNITY_DAMAGE_PER_MILESTONE,
    ),

    healthBonus: Math.min(
      COMMUNITY_MAX_HEALTH_BONUS,
      Math.floor(progress.health / COMMUNITY_SCORE_MILESTONE) *
        COMMUNITY_HEALTH_PER_MILESTONE,
    ),

    goldBonus: Math.min(
      COMMUNITY_MAX_GOLD_BONUS,
      Math.floor(progress.gold / COMMUNITY_KILL_MILESTONE) *
        COMMUNITY_GOLD_PER_MILESTONE,
    ),
  };
}

function getDefeatedKingField(username: string, day: KingDay): string {
  return `${username}:${day}`;
}

function getDailyKingDefeatsField(username: string, dateKey: string): string {
  return `${username}:${dateKey}`;
}

function parseKingDefeatCount(rawValue: string | undefined | null): number {
  if (!rawValue) {
    return 0;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return Math.max(0, parsedValue);
}

function getKingLevelFromDefeats(defeatsToday: number): number {
  return Math.max(1, Math.floor(defeatsToday) + 1);
}

function getKingEntryCost(kingLevel: number): number {
  const safeLevel = Math.max(1, Math.floor(kingLevel));

  return Math.ceil(
    BASE_KING_ENTRY_COST * Math.pow(KING_LEVEL_GROWTH, safeLevel - 1),
  );
}

type KingConfiguration = {
  day: KingDay;

  kingCharacterCode: number;
  unlockCharacterCode: number;

  kingName: string;
  rewardName: string;

  iconKey: string;
};

const TEMPORARY_KING_CHARACTER_CODE = 20;
const TEMPORARY_UNLOCK_CHARACTER_CODE = 19;
const TEMPORARY_REWARD_NAME = "CHICKEN RAIDER";
const TEMPORARY_ICON_KEY = "raider4Icon";

const KING_CONFIGURATIONS: Record<KingDay, KingConfiguration> = {
  monday: {
    day: "monday",
    kingCharacterCode: 24,
    unlockCharacterCode: 23,
    kingName: "MONDAY KING",
    rewardName: "CHEM RAIDER",
    iconKey: "raider6Icon",
  },

  tuesday: {
    day: "tuesday",
    kingCharacterCode: 26,
    unlockCharacterCode: 25,
    kingName: "TUESDAY KING",
    rewardName: "SPACE RAIDER",
    iconKey: "raider7Icon",
  },

  wednesday: {
    day: "wednesday",
    kingCharacterCode: 28,
    unlockCharacterCode: 27,
    kingName: "WEDNESDAY KING",
    rewardName: "MECHA RAIDER",
    iconKey: "raider8Icon",
  },

  thursday: {
    day: "thursday",
    kingCharacterCode: 30,
    unlockCharacterCode: 29,
    kingName: "THURSDAY KING",
    rewardName: "FULLMETAL RAIDER",
    iconKey: "raider9Icon",
  },

  friday: {
    day: "friday",
    kingCharacterCode: 32,
    unlockCharacterCode: 31,
    kingName: "FRIDAY KING",
    rewardName: "ALIEN RAIDER",
    iconKey: "raider10Icon",
  },

  saturday: {
    day: "saturday",
    kingCharacterCode: 20,
    unlockCharacterCode: 19,
    kingName: "SATURDAY KING",
    rewardName: "CHICKEN RAIDER",
    iconKey: "raider4Icon",
  },

  sunday: {
    day: "sunday",
    kingCharacterCode: 22,
    unlockCharacterCode: 21,
    kingName: "SUNDAY KING",
    rewardName: "BEAR RAIDER",
    iconKey: "raider5Icon",
  },
};

function getCurrentServerDay(): KingDay {
  const days: readonly KingDay[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  return days[new Date().getUTCDay()] ?? "sunday";
}

function getCurrentKingConfiguration(): KingConfiguration | null {
  const serverDay = getCurrentServerDay();

  return KING_CONFIGURATIONS[serverDay] ?? null;
}

function getNextKingResetAt(): number {
  const now = new Date();

  return Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0,
  );
}

function getKingBattleTokenKey(token: string): string {
  return `${KING_BATTLE_TOKEN_PREFIX}${token}`;
}

type StoredKingBattleToken = {
  username: string;

  serverDay: KingDay;
  dateKey: string;

  enemyCharacterCode: number;
  unlockCharacterCode: number;

  kingLevel: number;
  entryCost: number;

  createdAt: number;
  expiresAt: number;
};

function getOwnedRaiderField(username: string, characterCode: number): string {
  return `${username}:${characterCode}`;
}

async function playerOwnsRaider(
  username: string,
  characterCode: number,
): Promise<boolean> {
  if (characterCode === 16) {
    return true;
  }

  const value = await redis.hGet(
    PLAYER_OWNED_RAIDERS_KEY,
    getOwnedRaiderField(username, characterCode),
  );

  return value === "1";
}

function parseStoredgem(rawValue: string | undefined | null): number {
  if (!rawValue) {
    return 0;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  return Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0;
}

function getRaiderRequirement(
  characterCode: number,
): RaiderUnlockRequirement | null {
  return RAIDER_UNLOCK_REQUIREMENTS[characterCode] ?? null;
}

async function getPlayerCollectionValues(username: string): Promise<{
  allTimeHighScore: number;
  gem: number;
}> {
  const [scoreValue, gemValue] = await Promise.all([
    redis.zScore(LEADERBOARD_KEY, username),

    redis.hGet(PLAYER_gem_KEY, username),
  ]);

  return {
    allTimeHighScore:
      scoreValue === undefined || scoreValue === null
        ? 0
        : Math.max(0, Math.floor(scoreValue)),

    gem: parseStoredgem(gemValue),
  };
}

function hasMetRaiderRequirement(
  requirement: RaiderUnlockRequirement,
  allTimeHighScore: number,
  gem: number,
): boolean {
  switch (requirement.type) {
    case "free":
      return true;

    case "highscore":
      return allTimeHighScore >= requirement.amount;

    case "gem":
      return gem >= requirement.amount;

    case "king":
      return false;
  }
}

type GameDayInfo = {
  dateKey: string;
  nextResetAt: number;
  remainingMs: number;
};

type gemRequestState = {
  requestId: string;

  requesterUsername: string;

  limit: number;

  donors: gemDonationEntry[];

  createdAt: number;
  expiresAt: number;
};

function getgemRequestKey(requestId: string): string {
  return `${gem_REQUEST_KEY_PREFIX}${requestId}`;
}
function parsegemRequestState(
  rawValue: string | undefined | null,
): gemRequestState | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<gemRequestState>;

    if (
      typeof parsed.requestId !== "string" ||
      parsed.requestId.length < 1 ||
      typeof parsed.requesterUsername !== "string" ||
      parsed.requesterUsername.length < 1 ||
      !Number.isInteger(parsed.limit) ||
      Number(parsed.limit) < 1 ||
      !Array.isArray(parsed.donors) ||
      !Number.isFinite(parsed.createdAt)
    ) {
      return null;
    }

    const createdAt = Math.floor(Number(parsed.createdAt));

    const expiresAt = Number.isFinite(parsed.expiresAt)
      ? Math.floor(Number(parsed.expiresAt))
      : createdAt + gem_REQUEST_DURATION_MS;

    const donors: gemDonationEntry[] = parsed.donors
      .filter(
        (donor): donor is gemDonationEntry =>
          typeof donor === "object" &&
          donor !== null &&
          typeof donor.username === "string" &&
          donor.username.length > 0 &&
          Number.isFinite(donor.donatedAt),
      )
      .map((donor) => ({
        username: donor.username,

        donatedAt: Math.floor(donor.donatedAt),
      }));

    return {
      requestId: parsed.requestId,

      requesterUsername: parsed.requesterUsername,

      limit: Math.max(1, Math.floor(Number(parsed.limit))),

      donors,

      createdAt,

      expiresAt,
    };
  } catch {
    return null;
  }
}

async function buildgemRequestView(
  state: gemRequestState,
  currentUsername: string | null,
): Promise<gemRequestViewData> {
  let currentUsergem: number | null = null;
  if (currentUsername) {
    const gemValue = await redis.hGet(PLAYER_gem_KEY, currentUsername);
    const parsedgem = gemValue ? Number.parseInt(gemValue, 10) : 0;
    currentUsergem = Number.isFinite(parsedgem) ? Math.max(0, parsedgem) : 0;
  }
  const receivedCount = state.donors.length;

  const hasDonated =
    currentUsername !== null &&
    state.donors.some((donor) => donor.username === currentUsername);

  const isRequester =
    currentUsername !== null && currentUsername === state.requesterUsername;

  const isComplete = receivedCount >= state.limit;

  const remainingTimeMs = Math.max(0, state.expiresAt - Date.now());

  const isExpired = remainingTimeMs <= 0;

  const canDonate =
    currentUsername !== null &&
    !isRequester &&
    !hasDonated &&
    !isComplete &&
    !isExpired &&
    currentUsergem !== null &&
    currentUsergem >= gem_DONATION_AMOUNT;
  return {
    expiresAt: state.expiresAt,
    remainingTimeMs,
    isExpired,
    requestId: state.requestId,
    requesterUsername: state.requesterUsername,
    receivedCount,
    limit: state.limit,
    gemCollected: receivedCount * gem_DONATION_AMOUNT,
    donors: [...state.donors],
    currentUsername,
    currentUsergem,
    hasDonated,
    isRequester,
    isComplete,
    canDonate,
  };
}

async function getLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  const totalPlayers = await redis.zCard(LEADERBOARD_KEY);

  if (totalPlayers <= 0) {
    return [];
  }

  // Devvit zRange returns entries from the lowest rank, read 100 entries
  const firstIndex = Math.max(0, totalPlayers - LEADERBOARD_SIZE);

  const lastIndex = totalPlayers - 1;

  const results = await redis.zRange(LEADERBOARD_KEY, firstIndex, lastIndex, {
    by: "rank",
  });

  const descendingResults = results.reverse();

  // base level dont affect ordering
  const highestBaseValues = await Promise.all(
    descendingResults.map((result) =>
      redis.hGet(PLAYER_HIGHEST_BASE_KEY, result.member),
    ),
  );

  return descendingResults.map((result, index): LeaderboardEntry => {
    const rawHighestBase = highestBaseValues[index];

    const parsedHighestBase = rawHighestBase
      ? Number.parseInt(rawHighestBase, 10)
      : 0;

    return {
      rank: index + 1,

      username: result.member,

      score: Math.floor(result.score),

      highestBaseSeen: Number.isFinite(parsedHighestBase)
        ? parsedHighestBase
        : 0,
    };
  });
}

async function getPlayerRank(username: string): Promise<number | null> {
  const ascendingRank = await redis.zRank(LEADERBOARD_KEY, username);

  if (ascendingRank === undefined || ascendingRank === null) {
    return null;
  }

  const totalPlayers = await redis.zCard(LEADERBOARD_KEY);
  return totalPlayers - ascendingRank;
}

function getGameDayInfo(currentTime: number = Date.now()): GameDayInfo {
  const currentDate = new Date(currentTime);
  const year = currentDate.getUTCFullYear();
  const month = currentDate.getUTCMonth();
  const day = currentDate.getUTCDate();
  const dateKey = [
    year.toString(),
    (month + 1).toString().padStart(2, "0"),
    day.toString().padStart(2, "0"),
  ].join("-");
  const nextResetAt = Date.UTC(year, month, day + 1, 0, 0, 0, 0);
  return {
    dateKey,
    nextResetAt,
    remainingMs: Math.max(0, nextResetAt - currentTime),
  };
}

function parseSelectedRaider(rawValue: string | undefined | null): number {
  if (!rawValue) {
    return DEFAULT_RAIDER_CODE;
  }

  const characterCode = Number.parseInt(rawValue, 10);

  if (
    !Number.isInteger(characterCode) ||
    !VALID_RAIDER_CODES.has(characterCode)
  ) {
    return DEFAULT_RAIDER_CODE;
  }

  return characterCode;
}

async function getKingSlayerRank(username: string): Promise<number | null> {
  const ascendingRank = await redis.zRank(
    KING_SLAYER_LEADERBOARD_KEY,
    username,
  );

  if (ascendingRank === undefined || ascendingRank === null) {
    return null;
  }

  const totalPlayers = await redis.zCard(KING_SLAYER_LEADERBOARD_KEY);

  return totalPlayers - ascendingRank;
}

async function getKingSlayerEntries(): Promise<KingSlayerLeaderboardEntry[]> {
  const totalPlayers = await redis.zCard(KING_SLAYER_LEADERBOARD_KEY);

  if (totalPlayers <= 0) {
    return [];
  }

  const firstIndex = Math.max(0, totalPlayers - KING_SLAYER_LEADERBOARD_SIZE);

  const lastIndex = totalPlayers - 1;

  const results = await redis.zRange(
    KING_SLAYER_LEADERBOARD_KEY,
    firstIndex,
    lastIndex,
    {
      by: "rank",
    },
  );

  const descendingResults = results.reverse();

  const killValues = await Promise.all(
    descendingResults.map((result) =>
      redis.hGet(KING_SLAYER_KILLS_KEY, result.member),
    ),
  );

  return descendingResults.map((result, index): KingSlayerLeaderboardEntry => {
    const rawKills = killValues[index];

    const parsedKills = rawKills ? Number.parseInt(rawKills, 10) : 0;

    return {
      rank: index + 1,

      username: result.member,

      score: Math.max(0, Math.floor(result.score)),

      kills: Number.isFinite(parsedKills) ? Math.max(0, parsedKills) : 0,
    };
  });
}

// Template initialization route
api.get("/init", async (c) => {
  const { postId } = context;

  if (!postId) {
    console.error("API Init Error: postId not found in Devvit context");

    return c.json<ApiErrorResponse>(
      {
        status: "error",

        message: "postId is required but missing from context",
      },
      400,
    );
  }

  try {
    const [count, username] = await Promise.all([
      redis.get("count"),
      reddit.getCurrentUsername(),
    ]);

    return c.json<InitResponse>({
      type: "init",

      postId,

      count: count ? Number.parseInt(count, 10) : 0,

      username: username ?? "anonymous",
    });
  } catch (error) {
    console.error(`API Init Error for post ${postId}:`, error);

    const message =
      error instanceof Error ? error.message : "Unknown initialization error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message,
      },
      500,
    );
  }
});

// Template initialization route
api.post("/increment", async (c) => {
  const { postId } = context;

  if (!postId) {
    return c.json<ApiErrorResponse>(
      {
        status: "error",

        message: "postId is required",
      },
      400,
    );
  }

  const count = await redis.incrBy("count", 1);

  return c.json<IncrementResponse>({
    type: "increment",

    postId,

    count,
  });
});

// Template initialization route
api.post("/decrement", async (c) => {
  const { postId } = context;

  if (!postId) {
    return c.json<ApiErrorResponse>(
      {
        status: "error",

        message: "postId is required",
      },
      400,
    );
  }

  const count = await redis.incrBy("count", -1);

  return c.json<DecrementResponse>({
    type: "decrement",

    postId,

    count,
  });
});

// save highest score, daily highest, gem, and highest base seen
api.post("/highscore", async (c) => {
  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",

          message: "You must be logged in to save your result.",
        },
        401,
      );
    }

    const body = await c.req.json<SubmitHighScoreRequest>().catch(() => null);

    if (!body) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",

          message: "A score, gem value and highest base are required.",
        },
        400,
      );
    }

    const submittedScore = Number(body.score);

    const gemEarned = Number(body.gemEarned);

    const submittedBaseSeen = Number(body.highestBaseSeen);

    if (
      !Number.isFinite(submittedScore) ||
      !Number.isInteger(submittedScore) ||
      submittedScore < 0 ||
      submittedScore > MAXIMUM_ALLOWED_SCORE
    ) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",

          message: "The submitted score is invalid.",
        },
        400,
      );
    }

    if (
      !Number.isFinite(gemEarned) ||
      !Number.isInteger(gemEarned) ||
      gemEarned < 0 ||
      gemEarned > MAXIMUM_gem_PER_RUN
    ) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",

          message: "The submitted gem value is invalid.",
        },
        400,
      );
    }

    if (
      !Number.isFinite(submittedBaseSeen) ||
      !Number.isInteger(submittedBaseSeen) ||
      submittedBaseSeen < 0 ||
      submittedBaseSeen > MAXIMUM_BASE_LEVEL
    ) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",

          message: "The submitted base level is invalid.",
        },
        400,
      );
    }

    const selectedCommunityValue = await redis.hGet(
      PLAYER_COMMUNITY_CHALLENGE_KEY,
      username,
    );

    const selectedCommunityChallenge = parseCommunityChallenge(
      selectedCommunityValue,
    );

    const dailyLeaderboardKey = getDailyLeaderboardKey();

    const [existingAllTimeScore, existingDailyScore, existingHighestBaseSeen] =
      await Promise.all([
        redis.zScore(LEADERBOARD_KEY, username),

        redis.zScore(dailyLeaderboardKey, username),

        redis.hGet(PLAYER_HIGHEST_BASE_KEY, username),
      ]);

    const previousAllTimeBest =
      existingAllTimeScore === undefined || existingAllTimeScore === null
        ? 0
        : Math.floor(existingAllTimeScore);

    const previousDailyBest =
      existingDailyScore === undefined || existingDailyScore === null
        ? 0
        : Math.floor(existingDailyScore);

    const parsedPreviousBase = existingHighestBaseSeen
      ? Number.parseInt(existingHighestBaseSeen, 10)
      : 0;

    const previousHighestBaseSeen = Number.isFinite(parsedPreviousBase)
      ? parsedPreviousBase
      : 0;

    const isNewBest = submittedScore > previousAllTimeBest;

    const isNewDailyBest = submittedScore > previousDailyBest;

    const isNewHighestBaseSeen = submittedBaseSeen > previousHighestBaseSeen;

    const highestBaseSeen = Math.max(
      previousHighestBaseSeen,
      submittedBaseSeen,
    );

    if (isNewBest) {
      await redis.zAdd(LEADERBOARD_KEY, {
        member: username,

        score: submittedScore,
      });
    }

    if (isNewDailyBest) {
      await redis.zAdd(dailyLeaderboardKey, {
        member: username,

        score: submittedScore,
      });

      await redis.expire(dailyLeaderboardKey, 60 * 60 * 24 * 7);
    }

    if (isNewHighestBaseSeen) {
      await redis.hSet(PLAYER_HIGHEST_BASE_KEY, {
        [username]: String(submittedBaseSeen),
      });
    }

    // add gem to player's total gem in profile
    const totalgem = await redis.hIncrBy(
      PLAYER_gem_KEY,
      username,
      gemEarned,
    );

    const rank = await getPlayerRank(username);

    let communityContributionChallenge: "damage" | "health" | null = null;

    let communityContributionAmount = 0;

    let previousCommunityBest = 0;
    let newCommunityBest = 0;

    if (
      selectedCommunityChallenge === "damage" ||
      selectedCommunityChallenge === "health"
    ) {
      const contribution = await contributeCommunityScore(
        username,
        selectedCommunityChallenge,
        submittedScore,
      );

      communityContributionChallenge = selectedCommunityChallenge;

      communityContributionAmount = contribution.amount;

      previousCommunityBest = contribution.previousBest;

      newCommunityBest = contribution.newBest;
    }

    const communityProgress = await getCommunityProgress();

    const communityRewards = calculateCommunityRewards(communityProgress);

    return c.json<SubmitHighScoreResponse>({
      type: "submit-high-score",

      username,

      submittedScore,

      submittedBaseSeen,

      personalBest: isNewBest ? submittedScore : previousAllTimeBest,

      todayBest: isNewDailyBest ? submittedScore : previousDailyBest,

      highestBaseSeen,

      totalgem,

      gemEarned,

      rank,

      isNewBest,

      isNewDailyBest,

      isNewHighestBaseSeen,
      communityContribution: {
        challenge: communityContributionChallenge,
        amount: communityContributionAmount,
        previousBest: previousCommunityBest,
        newBest: newCommunityBest,
      },

      communityRewards,
    });
  } catch (error) {
    console.error("[Game Result] Failed to submit:", error);

    const message =
      error instanceof Error ? error.message : "Unknown game-result error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",

        message: `Failed to save game result: ${message}`,
      },
      500,
    );
  }
});

api.get("/leaderboard", async (c) => {
  try {
    const username = await reddit.getCurrentUsername();

    const entries = await getLeaderboardEntries();

    if (!username) {
      return c.json<LeaderboardResponse>({
        type: "leaderboard",

        entries,

        username: null,

        personalBest: 0,

        personalHighestBaseSeen: 0,

        playerRank: null,
      });
    }

    const [score, playerRank, highestBaseValue] = await Promise.all([
      redis.zScore(LEADERBOARD_KEY, username),
      getPlayerRank(username),
      redis.hGet(PLAYER_HIGHEST_BASE_KEY, username),
    ]);

    const parsedHighestBase = highestBaseValue
      ? Number.parseInt(highestBaseValue, 10)
      : 0;

    return c.json<LeaderboardResponse>({
      type: "leaderboard",

      entries,

      username,

      personalBest:
        score === undefined || score === null ? 0 : Math.floor(score),

      personalHighestBaseSeen: Number.isFinite(parsedHighestBase)
        ? parsedHighestBase
        : 0,

      playerRank,
    });
  } catch (error) {
    console.error("[Leaderboard] Failed to load leaderboard:", error);

    const message =
      error instanceof Error ? error.message : "Unknown leaderboard error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",

        message: `Failed to load leaderboard: ${message}`,
      },
      500,
    );
  }
});

api.get("/player-profile", async (c) => {
  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",

          message: "You must be logged in to load your profile.",
        },
        401,
      );
    }

    const dailyLeaderboardKey = getDailyLeaderboardKey();

    const [
      allTimeScore,
      todayScore,
      gemValue,
      highestBaseValue,
      globalRank,
      gemRequestCooldownValue,
      lastDailyRewardDate,
    ] = await Promise.all([
      redis.zScore(LEADERBOARD_KEY, username),
      redis.zScore(dailyLeaderboardKey, username),
      redis.hGet(PLAYER_gem_KEY, username),
      redis.hGet(PLAYER_HIGHEST_BASE_KEY, username),
      getPlayerRank(username),
      redis.hGet(gem_REQUEST_COOLDOWN_KEY, username),
      redis.hGet(DAILY_REWARD_CLAIM_KEY, username),
    ]);
    const gem = gemValue ? Number.parseInt(gemValue, 10) : 0;

    const highestBaseSeen = highestBaseValue
      ? Number.parseInt(highestBaseValue, 10)
      : 0;

    const parsedgemRequestAvailableAt = gemRequestCooldownValue
      ? Number.parseInt(gemRequestCooldownValue, 10)
      : 0;
    const gemRequestAvailableAt = Number.isFinite(parsedgemRequestAvailableAt)
      ? Math.max(0, parsedgemRequestAvailableAt)
      : 0;
    const gemRequestCooldownRemainingMs = Math.max(
      0,
      gemRequestAvailableAt - Date.now(),
    );
    const canRequestgem = gemRequestCooldownRemainingMs <= 0;
    const gameDay = getGameDayInfo();
    const canClaimDailyReward = lastDailyRewardDate !== gameDay.dateKey;
    return c.json<PlayerProfileResponse>({
      type: "player-profile",
      username,
      allTimeHighScore:
        allTimeScore === undefined || allTimeScore === null
          ? 0
          : Math.floor(allTimeScore),
      todayHighScore:
        todayScore === undefined || todayScore === null
          ? 0
          : Math.floor(todayScore),
      highestBaseSeen: Number.isFinite(highestBaseSeen) ? highestBaseSeen : 0,
      gem: Number.isFinite(gem) ? gem : 0,
      globalRank,
      canRequestgem,
      gemRequestAvailableAt,
      gemRequestCooldownRemainingMs,
      canClaimDailyReward,
      dailyRewardgem: DAILY_REWARD_gem,
      dailyRewardNextResetAt: gameDay.nextResetAt,
      dailyRewardRemainingMs: gameDay.remainingMs,
    });
  } catch (error) {
    console.error("Failed to load:", error);

    const message =
      error instanceof Error ? error.message : "Unknown player-profile error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",

        message: `Failed to load player profile: ${message}`,
      },
      500,
    );
  }
});

api.post("/claim-daily-reward", async (c) => {
  try {
    const username = await reddit.getCurrentUsername();
    if (!username) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "You must be logged in to claim the daily reward.",
        },
        401,
      );
    }
    for (let attempt = 0; attempt < 5; attempt++) {
      const gameDay = getGameDayInfo();
      const transaction = await redis.watch(
        DAILY_REWARD_CLAIM_KEY,
        PLAYER_gem_KEY,
      );
      const lastClaimDate = await redis.hGet(DAILY_REWARD_CLAIM_KEY, username);
      if (lastClaimDate === gameDay.dateKey) {
        await transaction.unwatch();
        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message: "You have already claimed today’s reward.",
          },
          409,
        );
      }
      await transaction.multi();
      await transaction.hSet(DAILY_REWARD_CLAIM_KEY, {
        [username]: gameDay.dateKey,
      }); // add 5 gem
      await transaction.hIncrBy(PLAYER_gem_KEY, username, DAILY_REWARD_gem);
      const result = await transaction.exec();
      if (result === null) {
        continue;
      }
      const updatedgemValue = await redis.hGet(PLAYER_gem_KEY, username);
      const parsedTotalgem = updatedgemValue
        ? Number.parseInt(updatedgemValue, 10)
        : 0;
      const totalgem = Number.isFinite(parsedTotalgem)
        ? Math.max(0, parsedTotalgem)
        : 0;
      return c.json<ClaimDailyRewardResponse>({
        type: "claim-daily-reward",
        status: "success",
        message: `Daily reward claimed! You received ${DAILY_REWARD_gem} gem.`,
        rewardgem: DAILY_REWARD_gem,
        totalgem,
        nextResetAt: gameDay.nextResetAt,
      });
    }
    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message: "The reward changed while claiming. Please try again.",
      },
      409,
    );
  } catch (error) {
    console.error("[Daily Reward] Failed:", error);
    const message =
      error instanceof Error ? error.message : "Unknown daily-reward error";
    return c.json<ApiErrorResponse>(
      { status: "error", message: `Unable to claim daily reward: ${message}` },
      500,
    );
  }
});

api.post("/share-score", async (c) => {
  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "You must be logged in to share your score.",
        },
        401,
      );
    }

    const { subredditName } = context;

    if (!subredditName) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "The current subreddit could not be found.",
        },
        400,
      );
    }

    const body = await c.req.json<ShareScoreRequest>().catch(() => null);

    if (!body) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "Score information is required.",
        },
        400,
      );
    }

    const score = Number(body.score);

    const highestBaseSeen = Number(body.highestBaseSeen);

    const isNewHighScore = body.isNewHighScore === true;

    if (
      !Number.isFinite(score) ||
      !Number.isInteger(score) ||
      score < 0 ||
      score > MAXIMUM_ALLOWED_SCORE
    ) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "The score is invalid.",
        },
        400,
      );
    }

    if (
      !Number.isFinite(highestBaseSeen) ||
      !Number.isInteger(highestBaseSeen) ||
      highestBaseSeen < 1 ||
      highestBaseSeen > MAXIMUM_BASE_LEVEL
    ) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "The base level is invalid.",
        },
        400,
      );
    }

    const title = isNewHighScore
      ? `I got a new high score of ${score.toLocaleString()} points, Base ${highestBaseSeen} in The Young Raider`
      : `I scored ${score.toLocaleString()} points, Base ${highestBaseSeen} in The Young Raider`;

    const postText = [title, "", "Can you beat my score?"].join("\n");

    await reddit.submitCustomPost({
      runAs: "USER",

      title,

      entry: "sharedScore",

      postData: {
        postType: "shared-score",

        username,

        score,

        highestBaseSeen,

        isNewHighScore,
      },

      userGeneratedContent: {
        text: postText,
      },
    });

    return c.json<ShareScoreResponse>({
      type: "share-score",
      status: "success",
      message: `Score shared to r/${subredditName}!`,
    });
  } catch (error) {
    console.error("[Share Score] Failed to create post:", error);

    const message =
      error instanceof Error ? error.message : "Unknown share-score error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message: `Unable to share score: ${message}`,
      },
      500,
    );
  }
});

api.get("/shared-score-post", async (c) => {
  try {
    const postData = context.postData as
      | {
          postType?: unknown;
          username?: unknown;
          score?: unknown;
          highestBaseSeen?: unknown;
          isNewHighScore?: unknown;
        }
      | undefined;

    if (!postData || postData.postType !== "shared-score") {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "This post does not contain a shared score.",
        },
        404,
      );
    }

    const username = String(postData.username ?? "Unknown Raider");

    const score = Number(postData.score);

    const highestBaseSeen = Number(postData.highestBaseSeen);

    const isNewHighScore = postData.isNewHighScore === true;

    if (
      !Number.isFinite(score) ||
      !Number.isInteger(score) ||
      score < 0 ||
      !Number.isFinite(highestBaseSeen) ||
      !Number.isInteger(highestBaseSeen) ||
      highestBaseSeen < 1
    ) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "The shared score data is invalid.",
        },
        400,
      );
    }

    return c.json<SharedScorePostResponse>({
      type: "shared-score-post",

      data: {
        postType: "shared-score",

        username,

        score,

        highestBaseSeen,

        isNewHighScore,
      },
    });
  } catch (error) {
    console.error("[Shared Score Post] Failed to load:", error);

    const message =
      error instanceof Error ? error.message : "Unknown shared-score error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message,
      },
      500,
    );
  }
});

function getCurrentUtcDateKey(): string {
  // 2026-06-24
  return new Date().toISOString().slice(0, 10);
}

function getDailyLeaderboardKey(): string {
  const date = getCurrentUtcDateKey();

  return `the-young-raider:leaderboard:daily:${date}`;
}

api.post("/share-leaderboard", async (c) => {
  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "You must be logged in to share your profile.",
        },
        401,
      );
    }

    const { subredditName } = context;

    if (!subredditName) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "The current subreddit could not be found.",
        },
        400,
      );
    }

    const [scoreValue, highestBaseValue, globalRank] = await Promise.all([
      redis.zScore(LEADERBOARD_KEY, username),
      redis.hGet(PLAYER_HIGHEST_BASE_KEY, username),
      getPlayerRank(username),
    ]);

    const highestScore =
      scoreValue === undefined || scoreValue === null
        ? 0
        : Math.max(0, Math.floor(scoreValue));

    const parsedHighestBase = highestBaseValue
      ? Number.parseInt(highestBaseValue, 10)
      : 0;

    const highestBaseSeen = Number.isFinite(parsedHighestBase)
      ? Math.max(0, parsedHighestBase)
      : 0;

    const rankText = globalRank !== null ? `#${globalRank}` : "Unranked";

    const title = `My Raider record: ${highestScore.toLocaleString()} points, Base ${highestBaseSeen}, Rank ${rankText}`;

    const postText = [
      `My highest score is ${highestScore.toLocaleString()} points in The Young Raider.`,
      "",
      `Highest base: ${highestBaseSeen}`,
      `Global rank: ${rankText}`,
      "",
      "Can you beat my record?",
    ].join("\n");

    await reddit.submitCustomPost({
      runAs: "USER",

      title,

      entry: "sharedProfile",

      postData: {
        postType: "shared-profile",

        username,

        highestScore,

        highestBaseSeen,

        globalRank,
      },

      userGeneratedContent: {
        text: postText,
      },
    });

    return c.json<ShareProfileResponse>({
      type: "share-leaderboard",
      status: "success",
      message: `Leaderboard shared to r/${subredditName}!`,
    });
  } catch (error) {
    console.error("[Share Profile] Failed:", error);

    const message =
      error instanceof Error ? error.message : "Unknown profile-sharing error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message: `Unable to share profile: ${message}`,
      },
      500,
    );
  }
});

api.post("/share-king-slayer-leaderboard", async (c) => {
  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "You must be logged in to share your King Slayer record.",
        },
        401,
      );
    }

    const { subredditName } = context;

    if (!subredditName) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "The current subreddit could not be found.",
        },
        400,
      );
    }

    const [scoreValue, killsValue, globalRank] = await Promise.all([
      redis.zScore(KING_SLAYER_LEADERBOARD_KEY, username),

      redis.hGet(KING_SLAYER_KILLS_KEY, username),

      getKingSlayerRank(username),
    ]);

    const score =
      scoreValue === undefined || scoreValue === null
        ? 0
        : Math.max(0, Math.floor(scoreValue));

    const parsedKills = killsValue ? Number.parseInt(killsValue, 10) : 0;

    const kills = Number.isFinite(parsedKills) ? Math.max(0, parsedKills) : 0;

    const rankText = globalRank !== null ? `#${globalRank}` : "Unranked";

    const title =
      `My King Slayer record: ${score.toLocaleString()} score, ` +
      `${kills.toLocaleString()} Kings defeated, Rank ${rankText}`;

    const postText = [
      `I have defeated ${kills.toLocaleString()} Kings in The Young Raider.`,
      "",
      `King Slayer score: ${score.toLocaleString()}`,
      `Kings defeated: ${kills.toLocaleString()}`,
      `King Slayer rank: ${rankText}`,
      "",
      "Can you defeat more Kings?",
    ].join("\n");

    await reddit.submitCustomPost({
      runAs: "USER",

      title,

      entry: "sharedProfile",

      postData: {
        postType: "shared-king-slayer",

        username,

        score,

        kills,

        globalRank,
      },

      userGeneratedContent: {
        text: postText,
      },
    });

    return c.json<ShareKingSlayerLeaderboardResponse>({
      type: "share-king-slayer-leaderboard",

      status: "success",

      message: `King Slayer leaderboard shared to r/${subredditName}!`,
    });
  } catch (error) {
    console.error("[Share King Slayer] Failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown King Slayer sharing error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",

        message: `Unable to share King Slayer record: ${message}`,
      },
      500,
    );
  }
});

api.get("/shared-profile-post", async (c) => {
  try {
    const postData = context.postData as
      | {
          postType?: unknown;

          username?: unknown;

          highestScore?: unknown;
          highestBaseSeen?: unknown;

          score?: unknown;
          kills?: unknown;

          globalRank?: unknown;
          kingDay?: unknown;
          kingName?: unknown;
          kingLevel?: unknown;
          kingCharacterCode?: unknown;
          iconKey?: unknown;
          scoreAwarded?: unknown;
          totalKills?: unknown;
        }
      | undefined;

    if (!postData) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "This post does not contain a shared profile.",
        },
        404,
      );
    }

    if (postData.postType === "shared-king-victory") {
      const username = String(postData.username ?? "Unknown King Slayer");

      const kingDay = String(postData.kingDay ?? "") as KingDay;

      const kingName = String(postData.kingName ?? "DAILY KING");

      const kingLevel = Number(postData.kingLevel);

      const kingCharacterCode = Number(postData.kingCharacterCode);

      const iconKey = String(postData.iconKey ?? "");

      const scoreAwarded = Number(postData.scoreAwarded);

      const totalKills = Number(postData.totalKills);

      const validDays: readonly KingDay[] = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];

      if (
        !validDays.includes(kingDay) ||
        kingName.length < 1 ||
        !Number.isInteger(kingLevel) ||
        kingLevel < 1 ||
        !Number.isInteger(kingCharacterCode) ||
        !Number.isInteger(scoreAwarded) ||
        scoreAwarded < 0 ||
        !Number.isInteger(totalKills) ||
        totalKills < 1 ||
        iconKey.length < 1
      ) {
        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message: "The shared King victory data is invalid.",
          },
          400,
        );
      }

      return c.json<SharedKingVictoryPostResponse>({
        type: "shared-king-victory-post",

        data: {
          postType: "shared-king-victory",

          username,

          kingDay,

          kingName,

          kingLevel,

          kingCharacterCode,

          iconKey,

          scoreAwarded,

          totalKills,
        },
      });
    }

    // share king slayer leaderboard
    if (postData.postType === "shared-king-slayer") {
      const username = String(postData.username ?? "Unknown King Slayer");

      const score = Number(postData.score);

      const kills = Number(postData.kills);

      const rawRank = postData.globalRank;

      const globalRank =
        rawRank === null || rawRank === undefined ? null : Number(rawRank);

      if (
        !Number.isFinite(score) ||
        !Number.isInteger(score) ||
        score < 0 ||
        !Number.isFinite(kills) ||
        !Number.isInteger(kills) ||
        kills < 0 ||
        (globalRank !== null &&
          (!Number.isFinite(globalRank) ||
            !Number.isInteger(globalRank) ||
            globalRank < 1))
      ) {
        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message: "The shared King Slayer data is invalid.",
          },
          400,
        );
      }

      return c.json<SharedKingSlayerPostResponse>({
        type: "shared-king-slayer-post",

        data: {
          postType: "shared-king-slayer",

          username,

          score,

          kills,

          globalRank,
        },
      });
    }

    // share profile leaderboard
    if (postData.postType === "shared-profile") {
      const username = String(postData.username ?? "Unknown Raider");

      const highestScore = Number(postData.highestScore);

      const highestBaseSeen = Number(postData.highestBaseSeen);

      const rawRank = postData.globalRank;

      const globalRank =
        rawRank === null || rawRank === undefined ? null : Number(rawRank);

      if (
        !Number.isFinite(highestScore) ||
        !Number.isInteger(highestScore) ||
        highestScore < 0 ||
        !Number.isFinite(highestBaseSeen) ||
        !Number.isInteger(highestBaseSeen) ||
        highestBaseSeen < 0 ||
        (globalRank !== null &&
          (!Number.isFinite(globalRank) ||
            !Number.isInteger(globalRank) ||
            globalRank < 1))
      ) {
        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message: "The shared profile data is invalid.",
          },
          400,
        );
      }

      return c.json<SharedProfilePostResponse>({
        type: "shared-profile-post",

        data: {
          postType: "shared-profile",

          username,

          highestScore,

          highestBaseSeen,

          globalRank,
        },
      });
    }

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message:
          "This post does not contain a shared Raider or King Slayer profile.",
      },
      404,
    );
  } catch (error) {
    console.error("[Shared Profile Post] Failed:", error);

    const message =
      error instanceof Error ? error.message : "Unknown shared-profile error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message,
      },
      500,
    );
  }
});

api.post("/request-gem", async (c) => {
  let requestKey: string | null = null;

  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "You must be logged in to request gem.",
        },
        401,
      );
    }

    const now = Date.now();

    const cooldownValue = await redis.hGet(gem_REQUEST_COOLDOWN_KEY, username);

    const parsedAvailableAt = cooldownValue
      ? Number.parseInt(cooldownValue, 10)
      : 0;

    const availableAt = Number.isFinite(parsedAvailableAt)
      ? parsedAvailableAt
      : 0;

    if (now < availableAt) {
      const remainingMs = availableAt - now;

      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

      const hours = Math.floor(remainingMinutes / 60);

      const minutes = remainingMinutes % 60;

      const timeText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      return c.json<ApiErrorResponse>(
        {
          status: "error",

          message: `You can create another gem request in ${timeText}.`,
        },
        429,
      );
    }

    const { subredditName } = context;

    if (!subredditName) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "The current subreddit could not be found.",
        },
        400,
      );
    }

    const requestId = randomUUID();

    requestKey = getgemRequestKey(requestId);

    const createdAt = Date.now();

    const state: gemRequestState = {
      requestId,

      requesterUsername: username,

      limit: gem_REQUEST_LIMIT,

      donors: [],

      createdAt,

      expiresAt: createdAt + gem_REQUEST_DURATION_MS,
    };

    await redis.set(requestKey, JSON.stringify(state));

    const title = `u/${username} is requesting gem in The Young Raider`;

    const postText = [
      `u/${username} is requesting help from the community.`,
      "",
      `0 / ${gem_REQUEST_LIMIT} received`,
      "",
      `Each Raider may donate ${gem_DONATION_AMOUNT} gem once.`,
    ].join("\n");

    await reddit.submitCustomPost({
      runAs: "USER",

      title,

      entry: "gemRequest",

      postData: {
        postType: "gem-request",
        requestId,
        requesterUsername: username,
      },

      userGeneratedContent: {
        text: postText,
      },
    });

    const nextRequestAvailableAt = createdAt + gem_REQUEST_COOLDOWN_MS;

    await redis.hSet(gem_REQUEST_COOLDOWN_KEY, {
      [username]: String(nextRequestAvailableAt),
    });

    return c.json<CreategemRequestResponse>({
      type: "create-gem-request",
      status: "success",
      message: `Gem request shared to r/${subredditName}!`,
      requestId,
      nextRequestAvailableAt,
    });
  } catch (error) {
    if (requestKey) {
      try {
        await redis.del(requestKey);
      } catch (cleanupError) {
        console.error("[Request gem] Cleanup failed:", cleanupError);
      }
    }

    console.error("[Request gem] Failed:", error);

    const message =
      error instanceof Error ? error.message : "Unknown request-gem error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message: `Unable to create gem request: ${message}`,
      },
      500,
    );
  }
});

api.get("/gem-request-post", async (c) => {
  try {
    const postData = context.postData as
      | {
          postType?: unknown;
          requestId?: unknown;
          requesterUsername?: unknown;
        }
      | undefined;

    if (
      !postData ||
      postData.postType !== "gem-request" ||
      typeof postData.requestId !== "string"
    ) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "This post does not contain a valid gem request.",
        },
        404,
      );
    }

    const requestId = postData.requestId;

    const requestKey = getgemRequestKey(requestId);

    const rawState = await redis.get(requestKey);

    const state = parsegemRequestState(rawState);

    if (!state) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "This gem request could not be found.",
        },
        404,
      );
    }

    const currentUsername = (await reddit.getCurrentUsername()) ?? null;

    const data = await buildgemRequestView(state, currentUsername);

    return c.json<gemRequestPostResponse>({
      type: "gem-request-post",
      data,
    });
  } catch (error) {
    console.error("[gem Request Post] Failed:", error);

    const message =
      error instanceof Error ? error.message : "Unknown gem-request error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message,
      },
      500,
    );
  }
});

// donate 1 gem
api.post("/donate-gem", async (c) => {
  try {
    const donorUsername = await reddit.getCurrentUsername();

    if (!donorUsername) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "You must be logged in to donate gem.",
        },
        401,
      );
    }

    const postData = context.postData as
      | {
          postType?: unknown;
          requestId?: unknown;
        }
      | undefined;

    if (
      !postData ||
      postData.postType !== "gem-request" ||
      typeof postData.requestId !== "string"
    ) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "This post does not contain a valid gem request.",
        },
        400,
      );
    }

    const requestId = postData.requestId;

    const requestKey = getgemRequestKey(requestId);

    for (let attempt = 0; attempt < 5; attempt++) {
      const transaction = await redis.watch(requestKey, PLAYER_gem_KEY);

      const [rawState, donorgemValue] = await Promise.all([
        redis.get(requestKey),
        redis.hGet(PLAYER_gem_KEY, donorUsername),
      ]);

      const state = parsegemRequestState(rawState);

      if (!state) {
        await transaction.unwatch();

        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message: "This gem request could not be found.",
          },
          404,
        );
      }

      if (Date.now() >= state.expiresAt) {
        await transaction.unwatch();

        return c.json<ApiErrorResponse>(
          {
            status: "error",

            message: "This gem request has expired.",
          },
          410,
        );
      }

      if (donorUsername === state.requesterUsername) {
        await transaction.unwatch();

        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message: "You cannot donate to your own gem request.",
          },
          400,
        );
      }

      const alreadyDonated = state.donors.some(
        (donor) => donor.username === donorUsername,
      );

      if (alreadyDonated) {
        await transaction.unwatch();

        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message: "You have already donated to this request.",
          },
          409,
        );
      }

      if (state.donors.length >= state.limit) {
        await transaction.unwatch();

        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message: "This gem request has already been fulfilled.",
          },
          409,
        );
      }

      const parsedDonorgem = donorgemValue
        ? Number.parseInt(donorgemValue, 10)
        : 0;

      const donorgem = Number.isFinite(parsedDonorgem)
        ? Math.max(0, parsedDonorgem)
        : 0;

      if (donorgem < gem_DONATION_AMOUNT) {
        await transaction.unwatch();

        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message: "You need at least 1 gem to donate.",
          },
          400,
        );
      }

      const updatedState: gemRequestState = {
        ...state,

        donors: [
          ...state.donors,
          {
            username: donorUsername,

            donatedAt: Date.now(),
          },
        ],
      };

      await transaction.multi();

      await transaction.hIncrBy(
        PLAYER_gem_KEY,
        donorUsername,
        -gem_DONATION_AMOUNT,
      );

      await transaction.hIncrBy(
        PLAYER_gem_KEY,
        state.requesterUsername,
        gem_DONATION_AMOUNT,
      );

      await transaction.set(requestKey, JSON.stringify(updatedState));

      const result = await transaction.exec();

      if (result === null) {
        continue;
      }

      const data = await buildgemRequestView(updatedState, donorUsername);

      return c.json<DonategemResponse>({
        type: "donate-gem",
        status: "success",
        message: `You donated ${gem_DONATION_AMOUNT} gem to u/${state.requesterUsername}!`,
        data,
      });
    }

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message:
          "The request changed while you were donating. Please try again.",
      },
      409,
    );
  } catch (error) {
    console.error("[Donate gem] Failed:", error);

    const message =
      error instanceof Error ? error.message : "Unknown donation error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message: `Unable to donate gem: ${message}`,
      },
      500,
    );
  }
});

api.get("/selected-raider", async (c) => {
  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "You must be logged in to load your selected Raider.",
        },
        401,
      );
    }

    const savedValue = await redis.hGet(PLAYER_SELECTED_RAIDER_KEY, username);

    const savedCharacterCode = parseSelectedRaider(savedValue);

    const ownsSavedRaider = await playerOwnsRaider(
      username,
      savedCharacterCode,
    );

    const characterCode = ownsSavedRaider
      ? savedCharacterCode
      : DEFAULT_RAIDER_CODE;

    if (characterCode !== savedCharacterCode) {
      await redis.hSet(PLAYER_SELECTED_RAIDER_KEY, {
        [username]: String(DEFAULT_RAIDER_CODE),
      });
    }

    return c.json<GetSelectedRaiderResponse>({
      type: "selected-raider",
      characterCode,
    });
  } catch (error) {
    console.error("[Selected Raider] Failed to load:", error);

    const message =
      error instanceof Error ? error.message : "Unknown selected-Raider error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message: `Unable to load selected Raider: ${message}`,
      },
      500,
    );
  }
});

api.post("/selected-raider", async (c) => {
  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "You must be logged in to select a Raider.",
        },
        401,
      );
    }

    const body = await c.req
      .json<SaveSelectedRaiderRequest>()
      .catch(() => null);

    if (!body) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "A Raider character code is required.",
        },
        400,
      );
    }

    const characterCode = Number(body.characterCode);

    if (
      !Number.isInteger(characterCode) ||
      !VALID_RAIDER_CODES.has(characterCode)
    ) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "The selected character is not a valid Raider.",
        },
        400,
      );
    }

    const ownsRaider = await playerOwnsRaider(username, characterCode);

    if (!ownsRaider) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "You have not unlocked this Raider.",
        },
        403,
      );
    }

    await redis.hSet(PLAYER_SELECTED_RAIDER_KEY, {
      [username]: String(characterCode),
    });

    return c.json<SaveSelectedRaiderResponse>({
      type: "save-selected-raider",
      status: "success",
      characterCode,
      message: "Your selected Raider has been saved.",
    });
  } catch (error) {
    console.error("[Selected Raider] Failed to save:", error);

    const message =
      error instanceof Error ? error.message : "Unknown selected-Raider error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message: `Unable to save selected Raider: ${message}`,
      },
      500,
    );
  }
});

api.get("/raider-collection", async (c) => {
  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "You must be logged in to load your Raider collection.",
        },
        401,
      );
    }

    const [savedSelectedValue, playerValues] = await Promise.all([
      redis.hGet(PLAYER_SELECTED_RAIDER_KEY, username),

      getPlayerCollectionValues(username),
    ]);

    const savedSelectedRaider = parseSelectedRaider(savedSelectedValue);

    const raiderCodes = Array.from(VALID_RAIDER_CODES).sort(
      (first, second) => first - second,
    );

    const ownershipValues = await Promise.all(
      raiderCodes.map(async (characterCode) => {
        const owned = await playerOwnsRaider(username, characterCode);

        return {
          characterCode,
          owned,
        };
      }),
    );

    const savedSelectedOwnership = ownershipValues.find(
      (entry) => entry.characterCode === savedSelectedRaider,
    );

    const selectedRaider = savedSelectedOwnership?.owned
      ? savedSelectedRaider
      : DEFAULT_RAIDER_CODE;

    if (selectedRaider !== savedSelectedRaider) {
      // repair prev broken selection
      await redis.hSet(PLAYER_SELECTED_RAIDER_KEY, {
        [username]: String(DEFAULT_RAIDER_CODE),
      });
    }

    const raiders: RaiderCollectionItem[] = await Promise.all(
      ownershipValues.map(async ({ characterCode, owned }) => {
        const requirement = getRaiderRequirement(characterCode);

        if (!requirement) {
          throw new Error(
            `Missing unlock requirement for Raider ${characterCode}.`,
          );
        }

        let requirementMet = owned;

        if (!requirementMet) {
          if (requirement.type === "king") {
            const defeatedKingValue = await redis.hGet(
              PLAYER_DEFEATED_KINGS_KEY,
              getDefeatedKingField(username, requirement.kingDay),
            );

            requirementMet = defeatedKingValue === "1";
          } else {
            requirementMet = hasMetRaiderRequirement(
              requirement,
              playerValues.allTimeHighScore,
              playerValues.gem,
            );
          }
        }

        return {
          characterCode,

          owned,

          selected: characterCode === selectedRaider,

          unlockType: requirement.type,

          requirementAmount: requirement.amount,

          requirementMet,

          kingDay:
            requirement.type === "king" ? requirement.kingDay : undefined,
        };
      }),
    );

    return c.json<RaiderCollectionResponse>({
      type: "raider-collection",

      selectedRaider,

      allTimeHighScore: playerValues.allTimeHighScore,

      gem: playerValues.gem,

      raiders,
    });
  } catch (error) {
    console.error("[Raider Collection] Failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown Raider collection error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message: `Unable to load Raider collection: ${message}`,
      },
      500,
    );
  }
});

api.post("/unlock-raider", async (c) => {
  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "You must be logged in to unlock a Raider.",
        },
        401,
      );
    }

    const body = await c.req.json<UnlockRaiderRequest>().catch(() => null);

    if (!body) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "A Raider character code is required.",
        },
        400,
      );
    }

    const characterCode = Number(body.characterCode);

    if (
      !Number.isInteger(characterCode) ||
      !VALID_RAIDER_CODES.has(characterCode)
    ) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "The selected character is not a valid Raider.",
        },
        400,
      );
    }

    const requirement = getRaiderRequirement(characterCode);

    if (!requirement) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "This Raider has no unlock requirement configured.",
        },
        500,
      );
    }

    const alreadyOwned = await playerOwnsRaider(username, characterCode);

    if (alreadyOwned) {
      const gemValue = await redis.hGet(PLAYER_gem_KEY, username);

      return c.json<UnlockRaiderResponse>({
        type: "unlock-raider",
        status: "success",

        characterCode,

        remaininggem: parseStoredgem(gemValue),

        message: "This Raider is already unlocked.",
      });
    }

    if (requirement.type === "free") {
      return c.json<UnlockRaiderResponse>({
        type: "unlock-raider",
        status: "success",

        characterCode,

        remaininggem: (await getPlayerCollectionValues(username)).gem,

        message: "This Raider is already available.",
      });
    }

    if (requirement.type === "highscore") {
      const scoreValue = await redis.zScore(LEADERBOARD_KEY, username);

      const allTimeHighScore =
        scoreValue === undefined || scoreValue === null
          ? 0
          : Math.max(0, Math.floor(scoreValue));

      if (allTimeHighScore < requirement.amount) {
        return c.json<ApiErrorResponse>(
          {
            status: "error",

            message: `You need an all-time high score of ${requirement.amount.toLocaleString()} to unlock this Raider.`,
          },
          403,
        );
      }

      await redis.hSet(PLAYER_OWNED_RAIDERS_KEY, {
        [getOwnedRaiderField(username, characterCode)]: "1",
      });

      const gemValue = await redis.hGet(PLAYER_gem_KEY, username);

      return c.json<UnlockRaiderResponse>({
        type: "unlock-raider",
        status: "success",

        characterCode,

        remaininggem: parseStoredgem(gemValue),

        message: "Raider unlocked!",
      });
    }

    if (requirement.type === "king") {
      const defeatedKingValue = await redis.hGet(
        PLAYER_DEFEATED_KINGS_KEY,
        getDefeatedKingField(username, requirement.kingDay),
      );

      if (defeatedKingValue !== "1") {
        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message: `Defeat the ${requirement.kingDay} King to unlock this Raider.`,
          },
          403,
        );
      }

      await redis.hSet(PLAYER_OWNED_RAIDERS_KEY, {
        [getOwnedRaiderField(username, characterCode)]: "1",
      });

      const gemValue = await redis.hGet(PLAYER_gem_KEY, username);

      return c.json<UnlockRaiderResponse>({
        type: "unlock-raider",
        status: "success",

        characterCode,

        remaininggem: parseStoredgem(gemValue),

        message: "King reward unlocked!",
      });
    }

    // gem unlock with hash transaction
    for (let attempt = 0; attempt < 5; attempt++) {
      const transaction = await redis.watch(
        PLAYER_gem_KEY,
        PLAYER_OWNED_RAIDERS_KEY,
      );

      const [gemValue, ownershipValue] = await Promise.all([
        redis.hGet(PLAYER_gem_KEY, username),

        redis.hGet(
          PLAYER_OWNED_RAIDERS_KEY,
          getOwnedRaiderField(username, characterCode),
        ),
      ]);

      const currentgem = parseStoredgem(gemValue);

      if (ownershipValue === "1") {
        await transaction.unwatch();

        return c.json<UnlockRaiderResponse>({
          type: "unlock-raider",
          status: "success",

          characterCode,

          remaininggem: currentgem,

          message: "This Raider is already unlocked.",
        });
      }

      if (currentgem < requirement.amount) {
        await transaction.unwatch();

        const missinggem = requirement.amount - currentgem;

        return c.json<ApiErrorResponse>(
          {
            status: "error",

            message: `You need ${missinggem} more gem to unlock this Raider.`,
          },
          403,
        );
      }

      await transaction.multi();

      await transaction.hIncrBy(PLAYER_gem_KEY, username, -requirement.amount);

      await transaction.hSet(PLAYER_OWNED_RAIDERS_KEY, {
        [getOwnedRaiderField(username, characterCode)]: "1",
      });

      const result = await transaction.exec();

      if (result === null) {
        continue;
      }

      return c.json<UnlockRaiderResponse>({
        type: "unlock-raider",
        status: "success",

        characterCode,

        remaininggem: currentgem - requirement.amount,

        message: `Raider unlocked for ${requirement.amount} gem!`,
      });
    }

    return c.json<ApiErrorResponse>(
      {
        status: "error",

        message: "Your collection changed while unlocking. Please try again.",
      },
      409,
    );
  } catch (error) {
    console.error("[Unlock Raider] Failed:", error);

    const message =
      error instanceof Error ? error.message : "Unknown Raider unlock error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",

        message: `Unable to unlock Raider: ${message}`,
      },
      500,
    );
  }
});

api.get("/tutorial-status", async (c) => {
  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "You must be logged in to load your tutorial status.",
        },
        401,
      );
    }

    const storedValue = await redis.hGet(PLAYER_TUTORIAL_KEY, username);

    return c.json<TutorialStatusResponse>({
      type: "tutorial-status",
      completed: storedValue === "1",
    });
  } catch (error) {
    console.error("[Tutorial] Failed to load tutorial status:", error);

    const message =
      error instanceof Error ? error.message : "Unknown tutorial-status error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message: `Unable to load tutorial status: ${message}`,
      },
      500,
    );
  }
});

api.post("/tutorial-complete", async (c) => {
  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "You must be logged in to complete the tutorial.",
        },
        401,
      );
    }

    await redis.hSet(PLAYER_TUTORIAL_KEY, {
      [username]: "1",
    });

    return c.json<CompleteTutorialResponse>({
      type: "tutorial-complete",
      status: "success",
      message: "Tutorial completed.",
    });
  } catch (error) {
    console.error("[Tutorial] Failed to save tutorial completion:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown tutorial-completion error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message: `Unable to save tutorial completion: ${message}`,
      },
      500,
    );
  }
});

api.get("/king-status", async (c) => {
  try {
    const configuration = getCurrentKingConfiguration();

    if (!configuration) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "Today's King Battle is not available.",
        },
        404,
      );
    }

    const gameDay = getGameDayInfo();

    const username = await reddit.getCurrentUsername();

    let currentgem = 0;
    let defeatsToday = 0;
    let alreadyUnlocked = false;

    if (username) {
      const dailyDefeatsField = getDailyKingDefeatsField(
        username,
        gameDay.dateKey,
      );

      const [gemValue, ownedValue, dailyDefeatsValue] = await Promise.all([
        redis.hGet(PLAYER_gem_KEY, username),

        playerOwnsRaider(username, configuration.unlockCharacterCode),

        redis.hGet(PLAYER_DAILY_KING_DEFEATS_KEY, dailyDefeatsField),
      ]);

      currentgem = parseStoredgem(gemValue);

      alreadyUnlocked = ownedValue;

      defeatsToday = parseKingDefeatCount(dailyDefeatsValue);
    }

    const kingLevel = getKingLevelFromDefeats(defeatsToday);

    const entryCost = getKingEntryCost(kingLevel);

    return c.json<KingStatusResponse>({
      type: "king-status",

      serverDay: configuration.day,

      kingCharacterCode: configuration.kingCharacterCode,

      unlockCharacterCode: configuration.unlockCharacterCode,

      kingName: configuration.kingName,

      rewardName: configuration.rewardName,

      iconKey: configuration.iconKey,

      kingLevel,

      defeatsToday,

      entryCost,

      currentgem,

      canEnter:
        username !== null && username !== undefined && currentgem >= entryCost,

      alreadyUnlocked,

      nextResetAt: gameDay.nextResetAt,
    });
  } catch (error) {
    console.error("[King Status] Failed:", error);

    const message =
      error instanceof Error ? error.message : "Unknown King-status error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",

        message: `Unable to load King Battle: ${message}`,
      },
      500,
    );
  }
});

api.post("/king-entry", async (c) => {
  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "You must be logged in to enter a King Battle.",
        },
        401,
      );
    }

    const body = await c.req.json<EnterKingBattleRequest>().catch(() => null);

    if (!body) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "King Battle information is required.",
        },
        400,
      );
    }

    const configuration = getCurrentKingConfiguration();

    if (!configuration) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "Today's King Battle is not available.",
        },
        404,
      );
    }

    if (body.expectedDay !== configuration.day) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message:
            "The daily King has changed. Please return to the Main Menu.",
        },
        409,
      );
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const gameDay = getGameDayInfo();

      const dailyDefeatsField = getDailyKingDefeatsField(
        username,
        gameDay.dateKey,
      );

      const transaction = await redis.watch(
        PLAYER_gem_KEY,
        PLAYER_DAILY_KING_DEFEATS_KEY,
      );

      const [gemValue, dailyDefeatsValue] = await Promise.all([
        redis.hGet(PLAYER_gem_KEY, username),

        redis.hGet(PLAYER_DAILY_KING_DEFEATS_KEY, dailyDefeatsField),
      ]);

      const currentgem = parseStoredgem(gemValue);

      const defeatsToday = parseKingDefeatCount(dailyDefeatsValue);

      const kingLevel = getKingLevelFromDefeats(defeatsToday);

      const entryCost = getKingEntryCost(kingLevel);

      if (currentgem < entryCost) {
        await transaction.unwatch();

        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message:
              `You need ${entryCost} gem ` +
              `to enter Level ${kingLevel} King Battle.`,
          },
          403,
        );
      }

      const battleToken = randomUUID();

      const tokenKey = getKingBattleTokenKey(battleToken);

      const createdAt = Date.now();

      const tokenData: StoredKingBattleToken = {
        username,

        serverDay: configuration.day,
        dateKey: gameDay.dateKey,

        enemyCharacterCode: configuration.kingCharacterCode,

        unlockCharacterCode: configuration.unlockCharacterCode,

        kingLevel,
        entryCost,

        createdAt,

        expiresAt: createdAt + KING_BATTLE_TOKEN_DURATION_MS,
      };

      await transaction.multi();

      await transaction.hIncrBy(PLAYER_gem_KEY, username, -entryCost);

      const result = await transaction.exec();

      if (result === null) {
        continue;
      }

      await redis.set(tokenKey, JSON.stringify(tokenData));

      await redis.expire(
        tokenKey,
        Math.ceil(KING_BATTLE_TOKEN_DURATION_MS / 1000),
      );

      return c.json<EnterKingBattleResponse>({
        type: "enter-king-battle",

        status: "success",

        serverDay: configuration.day,

        kingCharacterCode: configuration.kingCharacterCode,

        unlockCharacterCode: configuration.unlockCharacterCode,

        kingLevel,

        defeatsToday,

        entryCost,

        remaininggem: currentgem - entryCost,

        battleToken,
      });
    }

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message: "Your King progress changed while entering. Please try again.",
      },
      409,
    );
  } catch (error) {
    console.error("[King Entry] Failed:", error);

    const message =
      error instanceof Error ? error.message : "Unknown King-entry error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message: `Unable to enter King Battle: ${message}`,
      },
      500,
    );
  }
});

api.post("/king-victory", async (c) => {
  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "You must be logged in to complete a King Battle.",
        },
        401,
      );
    }

    const body = await c.req
      .json<CompleteKingBattleRequest>()
      .catch(() => null);

    if (
      !body ||
      typeof body.battleToken !== "string" ||
      body.battleToken.length < 1
    ) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "A valid King Battle token is required.",
        },
        400,
      );
    }

    const kingCharacterCode = Number(body.kingCharacterCode);

    if (!Number.isInteger(kingCharacterCode)) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "The defeated King is invalid.",
        },
        400,
      );
    }

    const submittedScore = Number(body.score);

    if (
      !Number.isFinite(submittedScore) ||
      !Number.isInteger(submittedScore) ||
      submittedScore < 50 ||
      submittedScore > MAXIMUM_KING_SCORE_PER_CLEAR
    ) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "The submitted King Slayer score is invalid.",
        },
        400,
      );
    }

    const tokenKey = getKingBattleTokenKey(body.battleToken);

    for (let attempt = 0; attempt < 5; attempt++) {
      const transaction = await redis.watch(
        tokenKey,
        PLAYER_DAILY_KING_DEFEATS_KEY,
        PLAYER_DEFEATED_KINGS_KEY,
        KING_SLAYER_LEADERBOARD_KEY,
        KING_SLAYER_KILLS_KEY,
        PLAYER_LATEST_KING_VICTORY_KEY,
        COMMUNITY_PROGRESS_KEY,
      );

      const rawToken = await redis.get(tokenKey);

      if (!rawToken) {
        await transaction.unwatch();

        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message:
              "This King Battle has expired or has already been completed.",
          },
          410,
        );
      }

      let tokenData: StoredKingBattleToken;

      try {
        tokenData = JSON.parse(rawToken) as StoredKingBattleToken;
      } catch {
        await transaction.unwatch();

        await redis.del(tokenKey);

        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message: "The King Battle token is invalid.",
          },
          400,
        );
      }

      if (
        typeof tokenData.username !== "string" ||
        typeof tokenData.serverDay !== "string" ||
        typeof tokenData.dateKey !== "string" ||
        !Number.isInteger(tokenData.enemyCharacterCode) ||
        !Number.isInteger(tokenData.unlockCharacterCode) ||
        !Number.isInteger(tokenData.kingLevel) ||
        tokenData.kingLevel < 1 ||
        !Number.isInteger(tokenData.entryCost) ||
        tokenData.entryCost < 0 ||
        !Number.isFinite(tokenData.createdAt) ||
        !Number.isFinite(tokenData.expiresAt)
      ) {
        await transaction.unwatch();

        await redis.del(tokenKey);

        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message: "The King Battle token contains invalid data.",
          },
          400,
        );
      }

      if (tokenData.username !== username) {
        await transaction.unwatch();

        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message: "This King Battle belongs to another player.",
          },
          403,
        );
      }

      if (Date.now() >= tokenData.expiresAt) {
        await transaction.unwatch();

        await redis.del(tokenKey);

        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message: "This King Battle has expired.",
          },
          410,
        );
      }

      if (kingCharacterCode !== tokenData.enemyCharacterCode) {
        await transaction.unwatch();

        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message: "The defeated King does not match this battle.",
          },
          400,
        );
      }

      const currentGameDay = getGameDayInfo();

      if (tokenData.dateKey !== currentGameDay.dateKey) {
        await transaction.unwatch();

        await redis.del(tokenKey);

        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message: "This King Battle belongs to a previous daily King.",
          },
          409,
        );
      }

      const currentConfiguration = getCurrentKingConfiguration();

      if (
        !currentConfiguration ||
        currentConfiguration.day !== tokenData.serverDay ||
        currentConfiguration.kingCharacterCode !== tokenData.enemyCharacterCode
      ) {
        await transaction.unwatch();

        await redis.del(tokenKey);

        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message:
              "The daily King has changed. This battle can no longer be completed.",
          },
          409,
        );
      }

      const dailyDefeatsField = getDailyKingDefeatsField(
        username,
        tokenData.dateKey,
      );

      const defeatedKingField = getDefeatedKingField(
        username,
        tokenData.serverDay,
      );

      const [
        dailyDefeatsValue,
        existingScoreValue,
        existingKillsValue,
        ownedRaiderValue,
        selectedCommunityValue,
        currentCommunityGoldValue,
      ] = await Promise.all([
        redis.hGet(PLAYER_DAILY_KING_DEFEATS_KEY, dailyDefeatsField),

        redis.zScore(KING_SLAYER_LEADERBOARD_KEY, username),

        redis.hGet(KING_SLAYER_KILLS_KEY, username),

        redis.hGet(
          PLAYER_OWNED_RAIDERS_KEY,
          getOwnedRaiderField(username, tokenData.unlockCharacterCode),
        ),

        redis.hGet(PLAYER_COMMUNITY_CHALLENGE_KEY, username),

        redis.hGet(COMMUNITY_PROGRESS_KEY, "gold"),
      ]);

      const currentDailyDefeats = parseKingDefeatCount(dailyDefeatsValue);

      const expectedDefeatsBeforeVictory = tokenData.kingLevel - 1;

      if (currentDailyDefeats !== expectedDefeatsBeforeVictory) {
        await transaction.unwatch();

        await redis.del(tokenKey);

        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message:
              "Your King level has already changed. Return to the Main Menu to enter the current King Battle.",
          },
          409,
        );
      }

      const previousTotalScore =
        existingScoreValue === undefined || existingScoreValue === null
          ? 0
          : Math.max(0, Math.floor(existingScoreValue));

      const parsedTotalKills = existingKillsValue
        ? Number.parseInt(existingKillsValue, 10)
        : 0;

      const previousTotalKills = Number.isFinite(parsedTotalKills)
        ? Math.max(0, parsedTotalKills)
        : 0;

      const alreadyUnlocked = ownedRaiderValue === "1";

      const defeatsToday = currentDailyDefeats + 1;

      const nextKingLevel = getKingLevelFromDefeats(defeatsToday);

      const nextEntryCost = getKingEntryCost(nextKingLevel);

      const totalScore = previousTotalScore + submittedScore;

      const totalKills = previousTotalKills + 1;

      const selectedCommunityChallenge = parseCommunityChallenge(
        selectedCommunityValue,
      );

      const currentCommunityGold = parseCommunityProgress(
        currentCommunityGoldValue,
      );

      const communityGoldContribution =
        selectedCommunityChallenge === "gold" &&
        currentCommunityGold < COMMUNITY_GOLD_TARGET
          ? 1
          : 0;

      const latestVictory: StoredLatestKingVictory = {
        dateKey: tokenData.dateKey,

        serverDay: tokenData.serverDay,

        kingCharacterCode: tokenData.enemyCharacterCode,

        kingLevel: tokenData.kingLevel,

        scoreAwarded: submittedScore,

        totalKills,

        completedAt: Date.now(),
      };

      await transaction.multi();

      if (communityGoldContribution > 0) {
        await transaction.hIncrBy(
          COMMUNITY_PROGRESS_KEY,
          "gold",
          communityGoldContribution,
        );
      }

      await transaction.del(tokenKey);

      await transaction.hIncrBy(
        PLAYER_DAILY_KING_DEFEATS_KEY,
        dailyDefeatsField,
        1,
      );

      await transaction.hSet(PLAYER_DEFEATED_KINGS_KEY, {
        [defeatedKingField]: "1",
      });

      await transaction.zIncrBy(
        KING_SLAYER_LEADERBOARD_KEY,
        username,
        submittedScore,
      );

      await transaction.hIncrBy(KING_SLAYER_KILLS_KEY, username, 1);

      await transaction.hSet(PLAYER_LATEST_KING_VICTORY_KEY, {
        [username]: JSON.stringify(latestVictory),
      });

      const result = await transaction.exec();

      if (result === null) {
        continue;
      }

      const communityProgress = await getCommunityProgress();

      const communityRewards = calculateCommunityRewards(communityProgress);

      const completedConfiguration = KING_CONFIGURATIONS[tokenData.serverDay];

      const completedKingName =
        completedConfiguration?.kingName ??
        `${tokenData.serverDay.toUpperCase()} KING`;

      const rewardName = completedConfiguration?.rewardName ?? "RAIDER";

      return c.json<CompleteKingBattleResponse>({
        type: "complete-king-battle",

        status: "success",

        serverDay: tokenData.serverDay,

        defeatedKingCharacterCode: tokenData.enemyCharacterCode,

        unlockedCharacterCode: tokenData.unlockCharacterCode,

        defeatedKingLevel: tokenData.kingLevel,

        defeatsToday,

        nextKingLevel,

        nextEntryCost,

        alreadyUnlocked,

        scoreAwarded: submittedScore,

        totalScore,

        totalKills,

        communityContribution: {
          challenge: communityGoldContribution > 0 ? "gold" : null,

          amount: communityGoldContribution,
        },

        communityRewards,

        message: alreadyUnlocked
          ? `${completedKingName} Level ${tokenData.kingLevel} defeated! ` +
            `+${submittedScore} King Slayer score.`
          : `${completedKingName} Level ${tokenData.kingLevel} defeated! ` +
            `+${submittedScore} King Slayer score. ` +
            `Visit Collections to unlock ${rewardName}.`,
      });
    }

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message:
          "Your King progress changed while saving the victory. Please try again.",
      },
      409,
    );
  } catch (error) {
    console.error("[King Victory] Failed:", error);

    const message =
      error instanceof Error ? error.message : "Unknown King-victory error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message: `Unable to complete King Battle: ${message}`,
      },
      500,
    );
  }
});

api.post("/share-king-victory", async (c) => {
  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "You must be logged in to share a King victory.",
        },
        401,
      );
    }

    const { subredditName } = context;

    if (!subredditName) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "The current subreddit could not be found.",
        },
        400,
      );
    }

    const rawVictory = await redis.hGet(
      PLAYER_LATEST_KING_VICTORY_KEY,
      username,
    );

    if (!rawVictory) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "No completed King victory was found.",
        },
        404,
      );
    }

    let victory: StoredLatestKingVictory;

    try {
      victory = JSON.parse(rawVictory) as StoredLatestKingVictory;
    } catch {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "Your latest King victory could not be read.",
        },
        500,
      );
    }

    if (
      typeof victory.dateKey !== "string" ||
      typeof victory.serverDay !== "string" ||
      !Number.isInteger(victory.kingCharacterCode) ||
      !Number.isInteger(victory.kingLevel) ||
      victory.kingLevel < 1 ||
      !Number.isInteger(victory.scoreAwarded) ||
      victory.scoreAwarded < 0 ||
      !Number.isInteger(victory.totalKills) ||
      victory.totalKills < 1
    ) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "Your latest King victory is invalid.",
        },
        500,
      );
    }

    const configuration = KING_CONFIGURATIONS[victory.serverDay];

    if (
      !configuration ||
      configuration.kingCharacterCode !== victory.kingCharacterCode
    ) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "The defeated King configuration could not be found.",
        },
        500,
      );
    }

    const dayLabel =
      victory.serverDay.charAt(0).toUpperCase() + victory.serverDay.slice(1);

    const title =
      `I defeated Level ${victory.kingLevel} ` +
      `${dayLabel} King in The Young Raider!`;

    const postText = [
      `I have defeated Level ${victory.kingLevel} ${dayLabel} King.`,
      "",
      `King Slayer score earned: ${victory.scoreAwarded.toLocaleString()}`,
      `Total Kings defeated: ${victory.totalKills.toLocaleString()}`,
      "",
      "Can you defeat a stronger King?",
    ].join("\n");

    await reddit.submitCustomPost({
      runAs: "USER",

      title,

      entry: "sharedProfile",

      postData: {
        postType: "shared-king-victory",

        username,

        kingDay: victory.serverDay,

        kingName: configuration.kingName,

        kingLevel: victory.kingLevel,

        kingCharacterCode: victory.kingCharacterCode,

        iconKey: configuration.iconKey,

        scoreAwarded: victory.scoreAwarded,

        totalKills: victory.totalKills,
      },

      userGeneratedContent: {
        text: postText,
      },
    });

    return c.json<ShareKingVictoryResponse>({
      type: "share-king-victory",

      status: "success",

      message:
        `Level ${victory.kingLevel} ` +
        `${dayLabel} King victory shared to r/${subredditName}!`,
    });
  } catch (error) {
    console.error("[Share King Victory] Failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown King victory sharing error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message: `Unable to share King victory: ${message}`,
      },
      500,
    );
  }
});

api.post("/dev-lock-raider4", async (c) => {
  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "You must be logged in.",
        },
        401,
      );
    }

    await redis.hDel(PLAYER_OWNED_RAIDERS_KEY, [
      getOwnedRaiderField(username, 19),
    ]);

    const selectedValue = await redis.hGet(
      PLAYER_SELECTED_RAIDER_KEY,
      username,
    );

    if (selectedValue === "19") {
      await redis.hSet(PLAYER_SELECTED_RAIDER_KEY, {
        [username]: String(DEFAULT_RAIDER_CODE),
      });
    }

    return c.json({
      type: "dev-lock-raider4",
      status: "success",
      message: "Raider 4 has been locked again.",
    });
  } catch (error) {
    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message:
          error instanceof Error ? error.message : "Unable to reset Raider 4.",
      },
      500,
    );
  }
});

api.get("/king-slayer-leaderboard", async (c) => {
  try {
    const username = await reddit.getCurrentUsername();

    const entries = await getKingSlayerEntries();

    if (!username) {
      return c.json<KingSlayerLeaderboardResponse>({
        type: "king-slayer-leaderboard",

        entries,

        username: null,

        personalScore: 0,

        personalKills: 0,

        playerRank: null,
      });
    }

    const [scoreValue, killsValue, playerRank] = await Promise.all([
      redis.zScore(KING_SLAYER_LEADERBOARD_KEY, username),

      redis.hGet(KING_SLAYER_KILLS_KEY, username),

      getKingSlayerRank(username),
    ]);

    const personalScore =
      scoreValue === undefined || scoreValue === null
        ? 0
        : Math.max(0, Math.floor(scoreValue));

    const parsedKills = killsValue ? Number.parseInt(killsValue, 10) : 0;

    const personalKills = Number.isFinite(parsedKills)
      ? Math.max(0, parsedKills)
      : 0;

    return c.json<KingSlayerLeaderboardResponse>({
      type: "king-slayer-leaderboard",

      entries,

      username,

      personalScore,

      personalKills,

      playerRank,
    });
  } catch (error) {
    console.error("[King Slayer Leaderboard] Failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown King Slayer leaderboard error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",

        message: `Unable to load King Slayer leaderboard: ${message}`,
      },
      500,
    );
  }
});

api.get("/community-status", async (c) => {
  try {
    const username = await reddit.getCurrentUsername();

    const progress = await getCommunityProgress();

    let selectedChallenge: CommunityChallengeType = DEFAULT_COMMUNITY_CHALLENGE;

    if (username) {
      const selectionValue = await redis.hGet(
        PLAYER_COMMUNITY_CHALLENGE_KEY,
        username,
      );

      selectedChallenge = parseCommunityChallenge(selectionValue);
    }

    const rewards = calculateCommunityRewards(progress);

    return c.json<CommunityStatusResponse>({
      type: "community-status",

      selectedChallenge,

      progress,

      rewards,

      targets: {
        damage: COMMUNITY_DAMAGE_TARGET,

        health: COMMUNITY_HEALTH_TARGET,

        gold: COMMUNITY_GOLD_TARGET,
      },
    });
  } catch (error) {
    console.error("[Community Status] Failed:", error);

    const message =
      error instanceof Error ? error.message : "Unknown community-status error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",

        message: `Unable to load community progress: ${message}`,
      },
      500,
    );
  }
});

api.post("/community-selection", async (c) => {
  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "You must be logged in to select a community challenge.",
        },
        401,
      );
    }

    const body = await c.req
      .json<SelectCommunityChallengeRequest>()
      .catch(() => null);

    const challenge = body?.challenge;

    if (
      challenge !== "damage" &&
      challenge !== "health" &&
      challenge !== "gold"
    ) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "The selected community challenge is invalid.",
        },
        400,
      );
    }

    await redis.hSet(PLAYER_COMMUNITY_CHALLENGE_KEY, {
      [username]: challenge,
    });

    const challengeLabel =
      challenge.charAt(0).toUpperCase() + challenge.slice(1);

    return c.json<SelectCommunityChallengeResponse>({
      type: "select-community-challenge",

      status: "success",

      selectedChallenge: challenge,

      message: `${challengeLabel} community challenge selected.`,
    });
  } catch (error) {
    console.error("[Community Selection] Failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown community-selection error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message: `Unable to select community challenge: ${message}`,
      },
      500,
    );
  }
});
