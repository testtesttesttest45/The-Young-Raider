import { Hono } from "hono";

import { context, redis, reddit } from "@devvit/web/server";
import { randomUUID } from "node:crypto";

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
  CashDonationEntry,
  CashRequestPostResponse,
  CashRequestViewData,
  CreateCashRequestResponse,
  DonateCashResponse,
  ClaimDailyRewardResponse,
} from "../../shared/api";

export const api = new Hono();

const LEADERBOARD_KEY = "the-young-raider:leaderboard:all-time";

const PLAYER_CASH_KEY = "the-young-raider:players:cash";

const PLAYER_HIGHEST_BASE_KEY = "the-young-raider:players:highest-base-seen";

const LEADERBOARD_SIZE = 100;

const MAXIMUM_ALLOWED_SCORE = 1_000_000_000;

const MAXIMUM_CASH_PER_RUN = 1_000_000;

const MAXIMUM_BASE_LEVEL = 1_000_000;

const CASH_REQUEST_LIMIT = 10;
const CASH_DONATION_AMOUNT = 1;
const CASH_REQUEST_DURATION_MS = 5 * 60 * 60 * 1000; // request accepts donations for five hours.
const CASH_REQUEST_COOLDOWN_MS = 6 * 60 * 60 * 1000; // user can only create a new request every six hours.
const CASH_REQUEST_COOLDOWN_KEY = "the-young-raider:cash-request:cooldowns";
const CASH_REQUEST_KEY_PREFIX = "the-young-raider:cash-request:";

const DAILY_REWARD_CASH = 5;
const DAILY_REWARD_CLAIM_KEY = "the-young-raider:daily-reward:last-claim-date";
type GameDayInfo = {
  dateKey: string;
  nextResetAt: number;
  remainingMs: number;
};

type CashRequestState = {
  requestId: string;

  requesterUsername: string;

  limit: number;

  donors: CashDonationEntry[];

  createdAt: number;
  expiresAt: number;
};

function getCashRequestKey(requestId: string): string {
  return `${CASH_REQUEST_KEY_PREFIX}${requestId}`;
}
function parseCashRequestState(
  rawValue: string | undefined | null,
): CashRequestState | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<CashRequestState>;

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
      : createdAt + CASH_REQUEST_DURATION_MS;

    const donors: CashDonationEntry[] = parsed.donors
      .filter(
        (donor): donor is CashDonationEntry =>
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

async function buildCashRequestView(
  state: CashRequestState,
  currentUsername: string | null,
): Promise<CashRequestViewData> {
  let currentUserCash: number | null = null;
  if (currentUsername) {
    const cashValue = await redis.hGet(PLAYER_CASH_KEY, currentUsername);
    const parsedCash = cashValue ? Number.parseInt(cashValue, 10) : 0;
    currentUserCash = Number.isFinite(parsedCash) ? Math.max(0, parsedCash) : 0;
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
    currentUserCash !== null &&
    currentUserCash >= CASH_DONATION_AMOUNT;
  return {
    expiresAt: state.expiresAt,
    remainingTimeMs,
    isExpired,
    requestId: state.requestId,
    requesterUsername: state.requesterUsername,
    receivedCount,
    limit: state.limit,
    cashCollected: receivedCount * CASH_DONATION_AMOUNT,
    donors: [...state.donors],
    currentUsername,
    currentUserCash,
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

// save highest score, daily highest, cash, and highest base seen
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

          message: "A score, Cash value and highest base are required.",
        },
        400,
      );
    }

    const submittedScore = Number(body.score);

    const cashEarned = Number(body.cashEarned);

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
      !Number.isFinite(cashEarned) ||
      !Number.isInteger(cashEarned) ||
      cashEarned < 0 ||
      cashEarned > MAXIMUM_CASH_PER_RUN
    ) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",

          message: "The submitted Cash value is invalid.",
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

    // add cash to player's total cash in profile
    const totalCash = await redis.hIncrBy(
      PLAYER_CASH_KEY,
      username,
      cashEarned,
    );

    const rank = await getPlayerRank(username);

    return c.json<SubmitHighScoreResponse>({
      type: "submit-high-score",

      username,

      submittedScore,

      submittedBaseSeen,

      personalBest: isNewBest ? submittedScore : previousAllTimeBest,

      todayBest: isNewDailyBest ? submittedScore : previousDailyBest,

      highestBaseSeen,

      totalCash,

      cashEarned,

      rank,

      isNewBest,

      isNewDailyBest,

      isNewHighestBaseSeen,
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
      cashValue,
      highestBaseValue,
      globalRank,
      cashRequestCooldownValue,
      lastDailyRewardDate,
    ] = await Promise.all([
      redis.zScore(LEADERBOARD_KEY, username),
      redis.zScore(dailyLeaderboardKey, username),
      redis.hGet(PLAYER_CASH_KEY, username),
      redis.hGet(PLAYER_HIGHEST_BASE_KEY, username),
      getPlayerRank(username),
      redis.hGet(CASH_REQUEST_COOLDOWN_KEY, username),
      redis.hGet(DAILY_REWARD_CLAIM_KEY, username),
    ]);
    const cash = cashValue ? Number.parseInt(cashValue, 10) : 0;

    const highestBaseSeen = highestBaseValue
      ? Number.parseInt(highestBaseValue, 10)
      : 0;

    const parsedCashRequestAvailableAt = cashRequestCooldownValue
      ? Number.parseInt(cashRequestCooldownValue, 10)
      : 0;
    const cashRequestAvailableAt = Number.isFinite(parsedCashRequestAvailableAt)
      ? Math.max(0, parsedCashRequestAvailableAt)
      : 0;
    const cashRequestCooldownRemainingMs = Math.max(
      0,
      cashRequestAvailableAt - Date.now(),
    );
    const canRequestCash = cashRequestCooldownRemainingMs <= 0;
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
      cash: Number.isFinite(cash) ? cash : 0,
      globalRank,
      canRequestCash,
      cashRequestAvailableAt,
      cashRequestCooldownRemainingMs,
      canClaimDailyReward,
      dailyRewardCash: DAILY_REWARD_CASH,
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
        PLAYER_CASH_KEY,
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
      }); // add 5 cash
      await transaction.hIncrBy(PLAYER_CASH_KEY, username, DAILY_REWARD_CASH);
      const result = await transaction.exec();
      if (result === null) {
        continue;
      }
      const updatedCashValue = await redis.hGet(PLAYER_CASH_KEY, username);
      const parsedTotalCash = updatedCashValue
        ? Number.parseInt(updatedCashValue, 10)
        : 0;
      const totalCash = Number.isFinite(parsedTotalCash)
        ? Math.max(0, parsedTotalCash)
        : 0;
      return c.json<ClaimDailyRewardResponse>({
        type: "claim-daily-reward",
        status: "success",
        message: `Daily reward claimed! You received ${DAILY_REWARD_CASH} cash.`,
        rewardCash: DAILY_REWARD_CASH,
        totalCash,
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

    /*
     * Read the authoritative values from Redis.
     */
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

api.get("/shared-profile-post", async (c) => {
  try {
    const postData = context.postData as
      | {
          postType?: unknown;
          username?: unknown;
          highestScore?: unknown;
          highestBaseSeen?: unknown;
          globalRank?: unknown;
        }
      | undefined;

    if (!postData || postData.postType !== "shared-profile") {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "This post does not contain a shared Raider profile.",
        },
        404,
      );
    }

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

api.post("/request-cash", async (c) => {
  let requestKey: string | null = null;

  try {
    const username = await reddit.getCurrentUsername();

    if (!username) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "You must be logged in to request cash.",
        },
        401,
      );
    }

    const now = Date.now();

    const cooldownValue = await redis.hGet(CASH_REQUEST_COOLDOWN_KEY, username);

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

          message: `You can create another cash request in ${timeText}.`,
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

    requestKey = getCashRequestKey(requestId);

    const createdAt = Date.now();

    const state: CashRequestState = {
      requestId,

      requesterUsername: username,

      limit: CASH_REQUEST_LIMIT,

      donors: [],

      createdAt,

      expiresAt: createdAt + CASH_REQUEST_DURATION_MS,
    };

    await redis.set(requestKey, JSON.stringify(state));

    const title = `u/${username} is requesting cash in The Young Raider`;

    const postText = [
      `u/${username} is requesting help from the community.`,
      "",
      `0 / ${CASH_REQUEST_LIMIT} received`,
      "",
      `Each Raider may donate ${CASH_DONATION_AMOUNT} cash once.`,
    ].join("\n");

    await reddit.submitCustomPost({
      runAs: "USER",

      title,

      entry: "cashRequest",

      postData: {
        postType: "cash-request",
        requestId,
        requesterUsername: username,
      },

      userGeneratedContent: {
        text: postText,
      },
    });

    const nextRequestAvailableAt = createdAt + CASH_REQUEST_COOLDOWN_MS;

    await redis.hSet(CASH_REQUEST_COOLDOWN_KEY, {
      [username]: String(nextRequestAvailableAt),
    });

    return c.json<CreateCashRequestResponse>({
      type: "create-cash-request",
      status: "success",
      message: `Cash request shared to r/${subredditName}!`,
      requestId,
      nextRequestAvailableAt,
    });
  } catch (error) {
    if (requestKey) {
      try {
        await redis.del(requestKey);
      } catch (cleanupError) {
        console.error("[Request Cash] Cleanup failed:", cleanupError);
      }
    }

    console.error("[Request Cash] Failed:", error);

    const message =
      error instanceof Error ? error.message : "Unknown request-cash error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message: `Unable to create cash request: ${message}`,
      },
      500,
    );
  }
});

api.get("/cash-request-post", async (c) => {
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
      postData.postType !== "cash-request" ||
      typeof postData.requestId !== "string"
    ) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "This post does not contain a valid cash request.",
        },
        404,
      );
    }

    const requestId = postData.requestId;

    const requestKey = getCashRequestKey(requestId);

    const rawState = await redis.get(requestKey);

    const state = parseCashRequestState(rawState);

    if (!state) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "This cash request could not be found.",
        },
        404,
      );
    }

    const currentUsername = (await reddit.getCurrentUsername()) ?? null;

    const data = await buildCashRequestView(state, currentUsername);

    return c.json<CashRequestPostResponse>({
      type: "cash-request-post",
      data,
    });
  } catch (error) {
    console.error("[Cash Request Post] Failed:", error);

    const message =
      error instanceof Error ? error.message : "Unknown cash-request error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message,
      },
      500,
    );
  }
});

// donate 1 cash
api.post("/donate-cash", async (c) => {
  try {
    const donorUsername = await reddit.getCurrentUsername();

    if (!donorUsername) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "You must be logged in to donate cash.",
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
      postData.postType !== "cash-request" ||
      typeof postData.requestId !== "string"
    ) {
      return c.json<ApiErrorResponse>(
        {
          status: "error",
          message: "This post does not contain a valid cash request.",
        },
        400,
      );
    }

    const requestId = postData.requestId;

    const requestKey = getCashRequestKey(requestId);

    for (let attempt = 0; attempt < 5; attempt++) {
      const transaction = await redis.watch(requestKey, PLAYER_CASH_KEY);

      const [rawState, donorCashValue] = await Promise.all([
        redis.get(requestKey),
        redis.hGet(PLAYER_CASH_KEY, donorUsername),
      ]);

      const state = parseCashRequestState(rawState);

      if (!state) {
        await transaction.unwatch();

        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message: "This cash request could not be found.",
          },
          404,
        );
      }

      if (Date.now() >= state.expiresAt) {
        await transaction.unwatch();

        return c.json<ApiErrorResponse>(
          {
            status: "error",

            message: "This cash request has expired.",
          },
          410,
        );
      }

      if (donorUsername === state.requesterUsername) {
        await transaction.unwatch();

        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message: "You cannot donate to your own cash request.",
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
            message: "This cash request has already been fulfilled.",
          },
          409,
        );
      }

      const parsedDonorCash = donorCashValue
        ? Number.parseInt(donorCashValue, 10)
        : 0;

      const donorCash = Number.isFinite(parsedDonorCash)
        ? Math.max(0, parsedDonorCash)
        : 0;

      if (donorCash < CASH_DONATION_AMOUNT) {
        await transaction.unwatch();

        return c.json<ApiErrorResponse>(
          {
            status: "error",
            message: "You need at least 1 cash to donate.",
          },
          400,
        );
      }

      const updatedState: CashRequestState = {
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
        PLAYER_CASH_KEY,
        donorUsername,
        -CASH_DONATION_AMOUNT,
      );

      await transaction.hIncrBy(
        PLAYER_CASH_KEY,
        state.requesterUsername,
        CASH_DONATION_AMOUNT,
      );

      await transaction.set(requestKey, JSON.stringify(updatedState));

      const result = await transaction.exec();

      if (result === null) {
        continue;
      }

      const data = await buildCashRequestView(updatedState, donorUsername);

      return c.json<DonateCashResponse>({
        type: "donate-cash",
        status: "success",
        message: `You donated ${CASH_DONATION_AMOUNT} cash to u/${state.requesterUsername}!`,
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
    console.error("[Donate Cash] Failed:", error);

    const message =
      error instanceof Error ? error.message : "Unknown donation error";

    return c.json<ApiErrorResponse>(
      {
        status: "error",
        message: `Unable to donate cash: ${message}`,
      },
      500,
    );
  }
});

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
