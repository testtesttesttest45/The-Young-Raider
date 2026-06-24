import { Hono } from 'hono';

import {
    context,
    redis,
    reddit
} from '@devvit/web/server';

import type {
    ApiErrorResponse,
    DecrementResponse,
    IncrementResponse,
    InitResponse,
    LeaderboardEntry,
    LeaderboardResponse,
    SubmitHighScoreRequest,
    SubmitHighScoreResponse
} from '../../shared/api';

export const api =
    new Hono();

// shared state in same subreddit
const LEADERBOARD_KEY =
    'the-young-raider:leaderboard:all-time';

const LEADERBOARD_SIZE = 10;

// maximum allowed score to prevent abuse
const MAXIMUM_ALLOWED_SCORE =
    1_000_000_000;

async function getLeaderboardEntries():
    Promise<LeaderboardEntry[]> {
    const totalPlayers =
        await redis.zCard(
            LEADERBOARD_KEY
        );

    if (totalPlayers <= 0) {
        return [];
    }
    // devvit zRange returns ascending rank order, so read the final ten entries, then reverse them so the highest score appears first
    const firstIndex =
        Math.max(
            0,
            totalPlayers -
            LEADERBOARD_SIZE
        );

    const lastIndex =
        totalPlayers - 1;

    const results =
        await redis.zRange(
            LEADERBOARD_KEY,
            firstIndex,
            lastIndex,
            {
                by: 'rank'
            }
        );

    return results
        .reverse()
        .map(
            (
                result,
                index
            ): LeaderboardEntry => {
                return {
                    rank:
                        index + 1,

                    username:
                        result.member,

                    score:
                        Math.floor(
                            result.score
                        )
                };
            }
        );
}

async function getPlayerRank(
    username: string
): Promise<number | null> {
    const ascendingRank =
        await redis.zRank(
            LEADERBOARD_KEY,
            username
        );

    if (
        ascendingRank === undefined ||
        ascendingRank === null
    ) {
        return null;
    }

    const totalPlayers =
        await redis.zCard(
            LEADERBOARD_KEY
        );

    // zRank ranks from lowest to highest: lowest score = rank 0, highest score = totalPlayers - 1. Convert that into: highest score = rank 1
    return (
        totalPlayers -
        ascendingRank
    );
}

// template route
api.get(
    '/init',
    async c => {
        const {
            postId
        } = context;

        if (!postId) {
            console.error(
                'API Init Error: postId not found in Devvit context'
            );

            return c.json<ApiErrorResponse>(
                {
                    status: 'error',
                    message:
                        'postId is required but missing from context'
                },
                400
            );
        }

        try {
            const [
                count,
                username
            ] = await Promise.all([
                redis.get('count'),
                reddit.getCurrentUsername()
            ]);

            return c.json<InitResponse>({
                type: 'init',
                postId,
                count:
                    count
                        ? parseInt(
                            count,
                            10
                        )
                        : 0,

                username:
                    username ??
                    'anonymous'
            });
        } catch (error) {
            console.error(
                `API Init Error for post ${postId}:`,
                error
            );

            const message =
                error instanceof Error
                    ? error.message
                    : 'Unknown initialization error';

            return c.json<ApiErrorResponse>(
                {
                    status: 'error',
                    message
                },
                500
            );
        }
    }
);

// template route
api.post(
    '/increment',
    async c => {
        const {
            postId
        } = context;

        if (!postId) {
            return c.json<ApiErrorResponse>(
                {
                    status: 'error',
                    message:
                        'postId is required'
                },
                400
            );
        }

        const count =
            await redis.incrBy(
                'count',
                1
            );

        return c.json<IncrementResponse>({
            count,
            postId,
            type: 'increment'
        });
    }
);

// template route
api.post(
    '/decrement',
    async c => {
        const {
            postId
        } = context;

        if (!postId) {
            return c.json<ApiErrorResponse>(
                {
                    status: 'error',
                    message:
                        'postId is required'
                },
                400
            );
        }

        const count =
            await redis.incrBy(
                'count',
                -1
            );

        return c.json<DecrementResponse>({
            count,
            postId,
            type: 'decrement'
        });
    }
);

// stores only the highest score
api.post(
    '/highscore',
    async c => {
        try {
            const username =
                await reddit
                    .getCurrentUsername();

            if (!username) {
                return c.json<ApiErrorResponse>(
                    {
                        status: 'error',
                        message:
                            'You must be logged in to save a high score.'
                    },
                    401
                );
            }

            const body =
                await c.req
                    .json<SubmitHighScoreRequest>()
                    .catch(
                        () => null
                    );

            if (!body) {
                return c.json<ApiErrorResponse>(
                    {
                        status: 'error',
                        message:
                            'A score is required.'
                    },
                    400
                );
            }

            const submittedScore =
                Number(
                    body.score
                );

            if (
                !Number.isFinite(
                    submittedScore
                ) ||
                !Number.isInteger(
                    submittedScore
                ) ||
                submittedScore < 0 ||
                submittedScore >
                MAXIMUM_ALLOWED_SCORE
            ) {
                return c.json<ApiErrorResponse>(
                    {
                        status: 'error',
                        message:
                            'The submitted score is invalid.'
                    },
                    400
                );
            }

            const existingScore =
                await redis.zScore(
                    LEADERBOARD_KEY,
                    username
                );

            const previousBest =
                existingScore === undefined ||
                existingScore === null
                    ? 0
                    : Math.floor(
                        existingScore
                    );

            const isNewBest =
                submittedScore >
                previousBest;

            if (isNewBest) {
                await redis.zAdd(
                    LEADERBOARD_KEY,
                    {
                        member:
                            username,

                        score:
                            submittedScore
                    }
                );
            }

            const personalBest =
                isNewBest
                    ? submittedScore
                    : previousBest;

            const rank =
                await getPlayerRank(
                    username
                );

            return c.json<SubmitHighScoreResponse>({
                type:
                    'submit-high-score',

                username,

                submittedScore,
                personalBest,
                rank,
                isNewBest
            });
        } catch (error) {
            console.error(
                '[Leaderboard] Failed to submit high score:',
                error
            );

            const message =
                error instanceof Error
                    ? error.message
                    : 'Unknown leaderboard error';

            return c.json<ApiErrorResponse>(
                {
                    status: 'error',
                    message:
                        `Failed to save score: ${message}`
                },
                500
            );
        }
    }
);

// read current player's rank and the top ten leaderboard entries
api.get(
    '/leaderboard',
    async c => {
        try {
            const username =
                await reddit
                    .getCurrentUsername();

            const entries =
                await getLeaderboardEntries();

            if (!username) {
                return c.json<LeaderboardResponse>({
                    type:
                        'leaderboard',

                    entries,

                    username: null,
                    personalBest: 0,
                    playerRank: null
                });
            }

            const [
                score,
                playerRank
            ] = await Promise.all([
                redis.zScore(
                    LEADERBOARD_KEY,
                    username
                ),

                getPlayerRank(
                    username
                )
            ]);

            return c.json<LeaderboardResponse>({
                type:
                    'leaderboard',

                entries,

                username,

                personalBest:
                    score === undefined ||
                    score === null
                        ? 0
                        : Math.floor(
                            score
                        ),

                playerRank
            });
        } catch (error) {
            console.error(
                '[Leaderboard] Failed to load leaderboard:',
                error
            );

            const message =
                error instanceof Error
                    ? error.message
                    : 'Unknown leaderboard error';

            return c.json<ApiErrorResponse>(
                {
                    status: 'error',
                    message:
                        `Failed to load leaderboard: ${message}`
                },
                500
            );
        }
    }
);