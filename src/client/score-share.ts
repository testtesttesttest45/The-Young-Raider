import { requestExpandedMode } from '@devvit/web/client';

import type { ApiErrorResponse, SharedScorePostResponse } from '../shared/api';

const playerName = document.querySelector<HTMLHeadingElement>('#player-name');

const scoreText = document.querySelector<HTMLDivElement>('#score');

const baseText = document.querySelector<HTMLElement>('#base');

const statusText = document.querySelector<HTMLParagraphElement>('#status');

const playButton = document.querySelector<HTMLButtonElement>('#play-button');

const loadingView = document.querySelector<HTMLDivElement>('#score-loading');

const scoreContent = document.querySelector<HTMLDivElement>('#score-content');

const achievementText = document.querySelector<HTMLParagraphElement>('#achievement');

const rewardShine = document.querySelector<HTMLDivElement>('#reward-shine');

function showLoadedContent(): void {
    if (loadingView) {
        loadingView.hidden = true;
    }

    if (scoreContent) {
        scoreContent.hidden = false;
    }
}

function showLoadingError(message: string): void {
    if (scoreContent) {
        scoreContent.hidden = true;
    }

    if (loadingView) {
        loadingView.hidden = false;

        loadingView.classList.add('is-error');

        const loadingMessage = loadingView.querySelector<HTMLParagraphElement>('p');

        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
    }
}

async function loadSharedScore(): Promise<void> {
    try {
        const response = await fetch('/api/shared-score-post', {
            headers: {
                Accept: 'application/json',
            },
        });

        const rawResponse = await response.text();

        let responseData: SharedScorePostResponse | ApiErrorResponse;

        try {
            responseData = JSON.parse(rawResponse) as SharedScorePostResponse | ApiErrorResponse;
        } catch {
            throw new Error('The score data could not be read.');
        }

        if (!response.ok || !('type' in responseData) || responseData.type !== 'shared-score-post') {
            const message = 'message' in responseData ? responseData.message : 'Unable to load shared score.';

            throw new Error(message);
        }

        const { username, score, highestBaseSeen, isNewHighScore } = responseData.data;

        if (!username || !Number.isFinite(score) || !Number.isFinite(highestBaseSeen)) {
            throw new Error('The shared score is invalid.');
        }

        if (playerName) {
            playerName.textContent = `u/${username}`;
        }

        if (scoreText) {
            scoreText.textContent = Math.max(0, Math.floor(score)).toLocaleString();
        }

        if (baseText) {
            baseText.textContent = Math.max(1, Math.floor(highestBaseSeen)).toString();
        }

        if (statusText) {
            statusText.textContent = 'CAN YOU BEAT THIS RAIDER?';
        }

        if (achievementText) {
            achievementText.textContent = isNewHighScore ? 'NEW HIGH SCORE' : 'RUN SCORE';
        }

        if (rewardShine) {
            rewardShine.hidden = !isNewHighScore;
        }

        document.body.classList.toggle('is-new-high-score', isNewHighScore);

        showLoadedContent();
    } catch (error) {
        console.error('[Shared Score] Failed to load:', error);

        const message = error instanceof Error ? error.message : 'Unable to load score.';

        showLoadingError(message);
    }
}

playButton?.addEventListener('click', async (event) => {
    playButton.disabled = true;

    playButton.textContent = 'ENTERING...';

    try {
        await requestExpandedMode(event, 'game');
    } catch (error) {
        console.error('[Shared Score] Unable to open game:', error);

        playButton.disabled = false;

        playButton.textContent = 'PLAY THE YOUNG RAIDER';
    }
});

void loadSharedScore();
