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
    highestBaseSeen: number;
};

export type PlayerProfileResponse = {
    type: 'player-profile';

    username: string;

    allTimeHighScore: number;
    todayHighScore: number;

    highestBaseSeen: number;

    cash: number;

    globalRank: number | null;
};

export type SubmitHighScoreRequest = {
    score: number;
    cashEarned: number;
    highestBaseSeen: number;
};

export type SubmitHighScoreResponse = {
    type: 'submit-high-score';

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
    type: 'leaderboard';

    entries: LeaderboardEntry[];

    username: string | null;

    personalBest: number;
    personalHighestBaseSeen: number;

    playerRank: number | null;
};

export type ApiErrorResponse = {
    status: 'error';
    message: string;
};
