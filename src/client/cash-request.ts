import type { ApiErrorResponse, CashRequestPostResponse, CashRequestViewData, DonateCashResponse } from '../shared/api';

const loadingView = document.querySelector<HTMLDivElement>('#loading-view');

const requestContent = document.querySelector<HTMLElement>('#request-content');

const requesterName = document.querySelector<HTMLParagraphElement>('#requester-name');

const progressValue = document.querySelector<HTMLDivElement>('#progress-value');

const progressFill = document.querySelector<HTMLDivElement>('#progress-fill');

const cashCollected = document.querySelector<HTMLDivElement>('#cash-collected');

const donateButton = document.querySelector<HTMLButtonElement>('#donate-button');

const statusText = document.querySelector<HTMLParagraphElement>('#status-text');

const donationHistory = document.querySelector<HTMLDivElement>('#donation-history');

const countdownText = document.querySelector<HTMLElement>('#countdown');

const requestTimer = document.querySelector<HTMLDivElement>('.request-timer');

let currentRequestData: CashRequestViewData | null = null;

let donationInProgress = false;

function showLoadingError(message: string): void {
    if (requestContent) {
        requestContent.hidden = true;
    }

    if (loadingView) {
        loadingView.hidden = false;

        loadingView.classList.add('is-error');

        const paragraph = loadingView.querySelector<HTMLParagraphElement>('p');

        if (paragraph) {
            paragraph.textContent = message;
        }
    }
}

function showStatus(message: string, type: 'normal' | 'success' | 'error' = 'normal'): void {
    if (!statusText) {
        return;
    }

    statusText.textContent = message;

    statusText.classList.remove('success', 'error');

    if (type !== 'normal') {
        statusText.classList.add(type);
    }
}

function renderDonationHistory(data: CashRequestViewData): void {
    if (!donationHistory) {
        return;
    }

    donationHistory.replaceChildren();

    if (data.donors.length === 0) {
        const empty = document.createElement('div');

        empty.className = 'no-donations';

        empty.textContent = 'No donations yet. Be the first supporter!';

        donationHistory.append(empty);

        return;
    }

    data.donors.forEach((donor, index) => {
        const row = document.createElement('div');

        row.className = 'donor-row';

        const number = document.createElement('span');

        number.className = 'donor-number';

        number.textContent = `#${index + 1}`;

        const name = document.createElement('span');

        name.className = 'donor-name';

        name.textContent = `u/${donor.username}`;

        row.append(number, name);

        donationHistory.append(row);
    });
}

function renderRequest(data: CashRequestViewData): void {
    currentRequestData = data;

    updateCountdown();
    if (requesterName) {
        requesterName.replaceChildren();

        requesterName.append('Help ');

        const strong = document.createElement('strong');

        strong.textContent = `u/${data.requesterUsername}`;

        requesterName.append(strong, ' reach their goal');
    }

    if (progressValue) {
        progressValue.textContent = `${data.receivedCount} / ${data.limit}`;
    }

    if (progressFill) {
        const percentage = data.limit > 0 ? Math.min(100, (data.receivedCount / data.limit) * 100) : 0;

        progressFill.style.width = `${percentage}%`;
    }

    if (cashCollected) {
        cashCollected.textContent = `${data.cashCollected} CASH COLLECTED`;
    }

    renderDonationHistory(data);

    if (donateButton) {
        donateButton.disabled = !data.canDonate;

        if (data.isExpired) {
            donateButton.textContent = 'REQUEST EXPIRED';
        } else if (data.isComplete) {
            donateButton.textContent = 'REQUEST FULFILLED';
        } else if (data.isRequester) {
            donateButton.textContent = 'YOUR CASH REQUEST';
        } else if (data.hasDonated) {
            donateButton.textContent = 'DONATED!';
        } else if (data.currentUsername === null) {
            donateButton.textContent = 'LOG IN TO DONATE';
        } else if (data.currentUserCash !== null && data.currentUserCash < 1) {
            donateButton.textContent = 'YOU NEED 1 CASH';
        } else {
            donateButton.textContent = 'DONATE 1 CASH';
        }
    }

    if (!donationInProgress) {
        if (data.isExpired) {
            showStatus('This cash request has expired.');
        } else if (data.isComplete) {
            showStatus('This request has been fully funded.', 'success');
        } else if (data.isRequester) {
            showStatus('Share this post with the community.');
        } else if (data.hasDonated) {
            showStatus('Thank you for supporting this Raider!', 'success');
        } else if (data.currentUsername === null) {
            showStatus('Log in to Reddit to donate.');
        } else if (data.currentUserCash !== null && data.currentUserCash < 1) {
            showStatus('Earn at least 1 cash in the game before donating.');
        } else {
            showStatus('Each Reddit user may donate once.');
        }
    }

    if (loadingView) {
        loadingView.hidden = true;
    }

    if (requestContent) {
        requestContent.hidden = false;
    }
}

async function loadCashRequest(): Promise<void> {
    try {
        const response = await fetch('/api/cash-request-post', {
            headers: {
                Accept: 'application/json',
            },
        });

        const rawResponse = await response.text();

        // console.log('[Cash Request] Response:', response.status, response.headers.get('content-type'), rawResponse);

        if (!rawResponse.trim()) {
            throw new Error(`The server returned an empty response (${response.status}).`);
        }

        let responseData: CashRequestPostResponse | ApiErrorResponse;

        try {
            responseData = JSON.parse(rawResponse) as CashRequestPostResponse | ApiErrorResponse;
        } catch {
            throw new Error(`The server returned non-JSON data (${response.status}): ` + rawResponse.slice(0, 180));
        }

        if (!response.ok) {
            const message = 'message' in responseData ? responseData.message : `Unable to load cash request (${response.status}).`;

            throw new Error(message);
        }

        if (!('type' in responseData) || responseData.type !== 'cash-request-post') {
            throw new Error('The server returned an unexpected cash-request response.');
        }

        renderRequest(responseData.data);
    } catch (error) {
        console.error('[Cash Request] Failed to load:', error);

        showLoadingError(error instanceof Error ? error.message : 'Unable to load cash request.');
    }
}

function formatCountdown(milliseconds: number): string {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));

    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds].map((value) => value.toString().padStart(2, '0')).join(':');
}

function updateCountdown(): void {
    if (!currentRequestData || !countdownText) {
        return;
    }

    const remainingMs = Math.max(0, currentRequestData.expiresAt - Date.now());

    countdownText.textContent = formatCountdown(remainingMs);

    requestTimer?.classList.remove('is-warning', 'is-expired');

    if (remainingMs <= 0) {
        requestTimer?.classList.add('is-expired');

        countdownText.textContent = 'EXPIRED';

        if (donateButton) {
            donateButton.disabled = true;

            donateButton.textContent = 'REQUEST EXPIRED';
        }

        showStatus('This cash request has expired.');

        return;
    }

    if (remainingMs <= 30 * 60 * 1000) {
        requestTimer?.classList.add('is-warning');
    }
}

donateButton?.addEventListener('click', async () => {
    if (donationInProgress || !donateButton) {
        return;
    }

    donationInProgress = true;

    donateButton.disabled = true;
    donateButton.textContent = 'DONATING...';

    showStatus('Transferring 1 cash...');

    try {
        const response = await fetch('/api/donate-cash', {
            method: 'POST',

            headers: {
                Accept: 'application/json',
            },
        });

        const rawResponse = await response.text();

        let responseData: DonateCashResponse | ApiErrorResponse;

        try {
            responseData = JSON.parse(rawResponse) as DonateCashResponse | ApiErrorResponse;
        } catch {
            throw new Error('The donation response could not be read.');
        }

        if (!response.ok || !('type' in responseData) || responseData.type !== 'donate-cash') {
            const message = 'message' in responseData ? responseData.message : 'Unable to donate cash.';

            throw new Error(message);
        }

        donationInProgress = false;

        renderRequest(responseData.data);

        showStatus(responseData.message, 'success');
    } catch (error) {
        donationInProgress = false;

        console.error('[Cash Request] Donation failed:', error);

        showStatus(error instanceof Error ? error.message : 'Unable to donate cash.', 'error');

        await loadCashRequest();
    }
});

void loadCashRequest();

window.setInterval(() => {
    if (!donationInProgress) {
        void loadCashRequest();
    }
}, 15_000);

window.setInterval(updateCountdown, 1000);
