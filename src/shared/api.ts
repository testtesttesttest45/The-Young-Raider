export type InitResponse = {
    type: 'init';
    postId: string;
    count: number;
    username: string;
};

export type IncrementResponse = {
    type: 'increment';
    postId: string;
    count: number;
};

export type DecrementResponse = {
    type: 'decrement';
    postId: string;
    count: number;
};

// leaderboard

export type LeaderboardEntry = {
    rank: number;
    username: string;
    score: number;
};

export type SubmitHighScoreRequest = {
    score: number;
};

export type SubmitHighScoreResponse = {
    type: 'submit-high-score';

    username: string;

    submittedScore: number;
    personalBest: number;

    rank: number | null;

    isNewBest: boolean;
};

export type LeaderboardResponse = {
    type: 'leaderboard';

    entries: LeaderboardEntry[];

    username: string | null;

    personalBest: number;
    playerRank: number | null;
};

export type ApiErrorResponse = {
    status: 'error';
    message: string;
};