import { Hono } from 'hono';

import { context, redis, reddit } from '@devvit/web/server';

import type {
    ApiErrorResponse,
    DecrementResponse,
    IncrementResponse,
    InitResponse,
    LeaderboardEntry,
    LeaderboardResponse,
    PlayerProfileResponse,
    SubmitHighScoreRequest,
    SubmitHighScoreResponse,
} from '../../shared/api';

export const api = new Hono();

const LEADERBOARD_KEY = 'the-young-raider:leaderboard:all-time';

const PLAYER_CASH_KEY = 'the-young-raider:players:cash';

const PLAYER_HIGHEST_BASE_KEY = 'the-young-raider:players:highest-base-seen';

const LEADERBOARD_SIZE = 100;

const MAXIMUM_ALLOWED_SCORE = 1_000_000_000;

const MAXIMUM_CASH_PER_RUN = 1_000_000;

const MAXIMUM_BASE_LEVEL = 1_000_000;

async function getLeaderboardEntries(): Promise<LeaderboardEntry[]> {
    const totalPlayers = await redis.zCard(LEADERBOARD_KEY);

    if (totalPlayers <= 0) {
        return [];
    }

    // Devvit zRange returns entries from the lowest rank, read 100 entries
    const firstIndex = Math.max(0, totalPlayers - LEADERBOARD_SIZE);

    const lastIndex = totalPlayers - 1;

    const results = await redis.zRange(LEADERBOARD_KEY, firstIndex, lastIndex, {
        by: 'rank',
    });

    const descendingResults = results.reverse();

    // base level dont affect ordering
    const highestBaseValues = await Promise.all(descendingResults.map((result) => redis.hGet(PLAYER_HIGHEST_BASE_KEY, result.member)));

    return descendingResults.map((result, index): LeaderboardEntry => {
        const rawHighestBase = highestBaseValues[index];

        const parsedHighestBase = rawHighestBase ? Number.parseInt(rawHighestBase, 10) : 0;

        return {
            rank: index + 1,

            username: result.member,

            score: Math.floor(result.score),

            highestBaseSeen: Number.isFinite(parsedHighestBase) ? parsedHighestBase : 0,
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
api.get('/init', async (c) => {
    const { postId } = context;

    if (!postId) {
        console.error('API Init Error: postId not found in Devvit context');

        return c.json<ApiErrorResponse>(
            {
                status: 'error',

                message: 'postId is required but missing from context',
            },
            400
        );
    }

    try {
        const [count, username] = await Promise.all([redis.get('count'), reddit.getCurrentUsername()]);

        return c.json<InitResponse>({
            type: 'init',

            postId,

            count: count ? Number.parseInt(count, 10) : 0,

            username: username ?? 'anonymous',
        });
    } catch (error) {
        console.error(`API Init Error for post ${postId}:`, error);

        const message = error instanceof Error ? error.message : 'Unknown initialization error';

        return c.json<ApiErrorResponse>(
            {
                status: 'error',
                message,
            },
            500
        );
    }
});

// Template initialization route
api.post('/increment', async (c) => {
    const { postId } = context;

    if (!postId) {
        return c.json<ApiErrorResponse>(
            {
                status: 'error',

                message: 'postId is required',
            },
            400
        );
    }

    const count = await redis.incrBy('count', 1);

    return c.json<IncrementResponse>({
        type: 'increment',

        postId,

        count,
    });
});

// Template initialization route
api.post('/decrement', async (c) => {
    const { postId } = context;

    if (!postId) {
        return c.json<ApiErrorResponse>(
            {
                status: 'error',

                message: 'postId is required',
            },
            400
        );
    }

    const count = await redis.incrBy('count', -1);

    return c.json<DecrementResponse>({
        type: 'decrement',

        postId,

        count,
    });
});

// save highest score, daily highest, cash, and highest base seen
api.post('/highscore', async (c) => {
    try {
        const username = await reddit.getCurrentUsername();

        if (!username) {
            return c.json<ApiErrorResponse>(
                {
                    status: 'error',

                    message: 'You must be logged in to save your result.',
                },
                401
            );
        }

        const body = await c.req.json<SubmitHighScoreRequest>().catch(() => null);

        if (!body) {
            return c.json<ApiErrorResponse>(
                {
                    status: 'error',

                    message: 'A score, Cash value and highest base are required.',
                },
                400
            );
        }

        const submittedScore = Number(body.score);

        const cashEarned = Number(body.cashEarned);

        const submittedBaseSeen = Number(body.highestBaseSeen);

        if (!Number.isFinite(submittedScore) || !Number.isInteger(submittedScore) || submittedScore < 0 || submittedScore > MAXIMUM_ALLOWED_SCORE) {
            return c.json<ApiErrorResponse>(
                {
                    status: 'error',

                    message: 'The submitted score is invalid.',
                },
                400
            );
        }

        if (!Number.isFinite(cashEarned) || !Number.isInteger(cashEarned) || cashEarned < 0 || cashEarned > MAXIMUM_CASH_PER_RUN) {
            return c.json<ApiErrorResponse>(
                {
                    status: 'error',

                    message: 'The submitted Cash value is invalid.',
                },
                400
            );
        }

        if (!Number.isFinite(submittedBaseSeen) || !Number.isInteger(submittedBaseSeen) || submittedBaseSeen < 0 || submittedBaseSeen > MAXIMUM_BASE_LEVEL) {
            return c.json<ApiErrorResponse>(
                {
                    status: 'error',

                    message: 'The submitted base level is invalid.',
                },
                400
            );
        }

        const dailyLeaderboardKey = getDailyLeaderboardKey();

        const [existingAllTimeScore, existingDailyScore, existingHighestBaseSeen] = await Promise.all([
            redis.zScore(LEADERBOARD_KEY, username),

            redis.zScore(dailyLeaderboardKey, username),

            redis.hGet(PLAYER_HIGHEST_BASE_KEY, username),
        ]);

        const previousAllTimeBest = existingAllTimeScore === undefined || existingAllTimeScore === null ? 0 : Math.floor(existingAllTimeScore);

        const previousDailyBest = existingDailyScore === undefined || existingDailyScore === null ? 0 : Math.floor(existingDailyScore);

        const parsedPreviousBase = existingHighestBaseSeen ? Number.parseInt(existingHighestBaseSeen, 10) : 0;

        const previousHighestBaseSeen = Number.isFinite(parsedPreviousBase) ? parsedPreviousBase : 0;

        const isNewBest = submittedScore > previousAllTimeBest;

        const isNewDailyBest = submittedScore > previousDailyBest;

        const isNewHighestBaseSeen = submittedBaseSeen > previousHighestBaseSeen;

        const highestBaseSeen = Math.max(previousHighestBaseSeen, submittedBaseSeen);

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
        const totalCash = await redis.hIncrBy(PLAYER_CASH_KEY, username, cashEarned);

        const rank = await getPlayerRank(username);

        return c.json<SubmitHighScoreResponse>({
            type: 'submit-high-score',

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
        console.error('[Game Result] Failed to submit:', error);

        const message = error instanceof Error ? error.message : 'Unknown game-result error';

        return c.json<ApiErrorResponse>(
            {
                status: 'error',

                message: `Failed to save game result: ${message}`,
            },
            500
        );
    }
});


api.get('/leaderboard', async (c) => {
    try {
        const username = await reddit.getCurrentUsername();

        const entries = await getLeaderboardEntries();

        if (!username) {
            return c.json<LeaderboardResponse>({
                type: 'leaderboard',

                entries,

                username: null,

                personalBest: 0,

                personalHighestBaseSeen: 0,

                playerRank: null,
            });
        }

        const [score, playerRank, highestBaseValue] = await Promise.all([redis.zScore(LEADERBOARD_KEY, username), getPlayerRank(username), redis.hGet(PLAYER_HIGHEST_BASE_KEY, username)]);

        const parsedHighestBase = highestBaseValue ? Number.parseInt(highestBaseValue, 10) : 0;

        return c.json<LeaderboardResponse>({
            type: 'leaderboard',

            entries,

            username,

            personalBest: score === undefined || score === null ? 0 : Math.floor(score),

            personalHighestBaseSeen: Number.isFinite(parsedHighestBase) ? parsedHighestBase : 0,

            playerRank,
        });
    } catch (error) {
        console.error('[Leaderboard] Failed to load leaderboard:', error);

        const message = error instanceof Error ? error.message : 'Unknown leaderboard error';

        return c.json<ApiErrorResponse>(
            {
                status: 'error',

                message: `Failed to load leaderboard: ${message}`,
            },
            500
        );
    }
});


api.get('/player-profile', async (c) => {
    try {
        const username = await reddit.getCurrentUsername();

        if (!username) {
            return c.json<ApiErrorResponse>(
                {
                    status: 'error',

                    message: 'You must be logged in to load your profile.',
                },
                401
            );
        }

        const dailyLeaderboardKey = getDailyLeaderboardKey();

        const [allTimeScore, todayScore, cashValue, highestBaseValue, globalRank] = await Promise.all([
            redis.zScore(LEADERBOARD_KEY, username),

            redis.zScore(dailyLeaderboardKey, username),

            redis.hGet(PLAYER_CASH_KEY, username),

            redis.hGet(PLAYER_HIGHEST_BASE_KEY, username),

            getPlayerRank(username),
        ]);

        const cash = cashValue ? Number.parseInt(cashValue, 10) : 0;

        const highestBaseSeen = highestBaseValue ? Number.parseInt(highestBaseValue, 10) : 0;

        return c.json<PlayerProfileResponse>({
            type: 'player-profile',

            username,

            allTimeHighScore: allTimeScore === undefined || allTimeScore === null ? 0 : Math.floor(allTimeScore),

            todayHighScore: todayScore === undefined || todayScore === null ? 0 : Math.floor(todayScore),

            highestBaseSeen: Number.isFinite(highestBaseSeen) ? highestBaseSeen : 0,

            cash: Number.isFinite(cash) ? cash : 0,

            globalRank,
        });
    } catch (error) {
        console.error('Failed to load:', error);

        const message = error instanceof Error ? error.message : 'Unknown player-profile error';

        return c.json<ApiErrorResponse>(
            {
                status: 'error',

                message: `Failed to load player profile: ${message}`,
            },
            500
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
