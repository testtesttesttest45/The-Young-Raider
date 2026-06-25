import { requestExpandedMode } from '@devvit/web/client';

import type { ApiErrorResponse, SharedProfilePostResponse } from '../shared/api';

const loadingView = document.querySelector<HTMLDivElement>('#score-loading');

const profileContent = document.querySelector<HTMLDivElement>('#profile-content');

const playerName = document.querySelector<HTMLHeadingElement>('#player-name');

const scoreText = document.querySelector<HTMLDivElement>('#highest-score');

const baseText = document.querySelector<HTMLElement>('#highest-base');

const rankText = document.querySelector<HTMLElement>('#global-rank');

const playButton = document.querySelector<HTMLButtonElement>('#play-button');

async function loadProfile(): Promise<void> {
    try {
        const response = await fetch('/api/shared-profile-post');

        const responseData = (await response.json()) as SharedProfilePostResponse | ApiErrorResponse;

        if (!response.ok) {
            const message = 'message' in responseData ? responseData.message : 'Unable to load profile.';

            throw new Error(message);
        }

        if (!('type' in responseData) || responseData.type !== 'shared-profile-post') {
            throw new Error('Unexpected server response.');
        }

        const { username, highestScore, highestBaseSeen, globalRank } = responseData.data;

        if (playerName) {
            playerName.textContent = `u/${username}`;
        }

        if (scoreText) {
            scoreText.textContent = highestScore.toLocaleString();
        }

        if (baseText) {
            baseText.textContent = highestBaseSeen.toString();
        }

        if (rankText) {
            rankText.textContent = globalRank !== null ? `#${globalRank}` : 'UNRANKED';
        }

        if (loadingView) {
            loadingView.hidden = true;
        }

        if (profileContent) {
            profileContent.hidden = false;
        }
    } catch (error) {
        console.error('[Shared Profile] Failed:', error);

        const loadingMessage = loadingView?.querySelector<HTMLParagraphElement>('p');

        if (loadingMessage) {
            loadingMessage.textContent = error instanceof Error ? error.message : 'Unable to load profile.';
        }
    }
}

playButton?.addEventListener('click', async (event) => {
    playButton.disabled = true;

    playButton.textContent = 'ENTERING...';

    try {
        await requestExpandedMode(event, 'game');
    } catch (error) {
        console.error('[Shared Profile] Unable to enter:', error);

        playButton.disabled = false;

        playButton.textContent = 'PLAY THE YOUNG RAIDER';
    }
});

void loadProfile();
