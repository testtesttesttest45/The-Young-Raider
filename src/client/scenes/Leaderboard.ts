import { GameObjects, Scene } from 'phaser';

import type { ApiErrorResponse, LeaderboardEntry, LeaderboardResponse } from '../../shared/api';

const ROWS_PER_PAGE = 10;

export class Leaderboard extends Scene {
    private background: GameObjects.Image | null = null;

    private contentContainer: GameObjects.Container | null = null;

    private statusText: GameObjects.Text | null = null;

    private entries: LeaderboardEntry[] = [];

    private username: string | null = null;

    private personalBest = 0;

    private personalHighestBaseSeen = 0;

    private playerRank: number | null = null;

    private currentPage = 0;

    private centerX = 0;
    private centerY = 0;
    private panelHeight = 0;

    constructor() {
        super('Leaderboard');
    }

    init(): void {
        this.background = null;
        this.contentContainer = null;
        this.statusText = null;

        this.entries = [];

        this.username = null;

        this.personalBest = 0;
        this.personalHighestBaseSeen = 0;

        this.playerRank = null;

        this.currentPage = 0;

        this.centerX = 0;
        this.centerY = 0;
        this.panelHeight = 0;
    }

    create(): void {
        const width = this.scale.width;

        const height = this.scale.height;

        this.centerX = width / 2;

        this.centerY = height / 2;

        const panelWidth = Math.min(820, width - 40);

        this.panelHeight = Math.min(650, height - 40);

        this.background = this.add.image(0, 0, 'background').setOrigin(0, 0).setDisplaySize(width, height).setAlpha(0.45);

        this.add.rectangle(0, 0, width, height, 0x07111a, 0.78).setOrigin(0, 0);

        this.add.rectangle(this.centerX, this.centerY, panelWidth, this.panelHeight, 0x111c26, 0.98).setStrokeStyle(4, 0x50c8ff, 1);

        this.add
            .text(this.centerX, this.centerY - this.panelHeight / 2 + 48, 'LEADERBOARD', {
                font: 'bold 39px Orbitron',

                color: '#ffffff',

                stroke: '#000000',

                strokeThickness: 6,
            })
            .setOrigin(0.5);

        this.add
            .text(this.centerX, this.centerY - this.panelHeight / 2 + 92, 'ALL-TIME TOP 100 RAIDERS', {
                font: '14px Orbitron',

                color: '#82e6ff',
            })
            .setOrigin(0.5);

        this.statusText = this.add
            .text(this.centerX, this.centerY, 'Loading leaderboard...', {
                font: '18px Orbitron',

                color: '#ffffff',

                align: 'center',
            })
            .setOrigin(0.5);

        const backButton = this.createButton(this.centerX, this.centerY + this.panelHeight / 2 - 42, 'BACK', '#1d6f94');

        backButton.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });

        this.scale.on('resize', this.handleResize, this);

        this.events.once('shutdown', () => {
            this.scale.off('resize', this.handleResize, this);
        });

        void this.loadLeaderboard();
    }

    private async loadLeaderboard(): Promise<void> {
        try {
            const response = await fetch('/api/leaderboard');

            const responseData = (await response.json()) as unknown;

            if (!response.ok) {
                const errorData = responseData as ApiErrorResponse;

                throw new Error(errorData.message ?? 'Unable to load leaderboard.');
            }

            const data = responseData as LeaderboardResponse;

            if (data.type !== 'leaderboard' || !Array.isArray(data.entries)) {
                throw new Error('Unexpected server response.');
            }

            this.entries = data.entries;

            this.username = data.username;

            this.personalBest = data.personalBest;

            this.personalHighestBaseSeen = data.personalHighestBaseSeen;

            this.playerRank = data.playerRank;

            this.currentPage = 0;

            this.statusText?.destroy();

            this.statusText = null;

            this.renderCurrentPage();
        } catch (error) {
            console.error('[Leaderboard] Failed to load:', error);

            const message = error instanceof Error ? error.message : 'Unknown error';

            this.statusText?.setColor('#ff8b8b').setText(['Unable to load leaderboard.', message].join('\n'));
        }
    }

    private renderCurrentPage(): void {
        this.contentContainer?.destroy(true);

        this.contentContainer = this.add.container(0, 0);

        const startY = this.centerY - this.panelHeight / 2 + 135;

        const rankX = this.centerX - 315;

        const usernameX = this.centerX - 255;

        const baseX = this.centerX + 125;

        const scoreX = this.centerX + 315;

        const headerStyle: Phaser.Types.GameObjects.Text.TextStyle = {
            font: 'bold 13px Orbitron',

            color: '#82e6ff',
        };

        const rankHeader = this.add.text(rankX, startY, '#', headerStyle);

        const usernameHeader = this.add.text(usernameX, startY, 'PLAYER', headerStyle);

        const baseHeader = this.add.text(baseX, startY, 'HIGHEST BASE', headerStyle).setOrigin(0.5, 0);

        const scoreHeader = this.add.text(scoreX, startY, 'SCORE', headerStyle).setOrigin(1, 0);

        this.contentContainer.add([rankHeader, usernameHeader, baseHeader, scoreHeader]);

        if (this.entries.length === 0) {
            const emptyText = this.add
                .text(this.centerX, startY + 100, ['No completed runs yet.', 'Be the first raider on the board!'].join('\n'), {
                    font: '17px Orbitron',

                    color: '#c7d5e0',

                    align: 'center',
                })
                .setOrigin(0.5);

            this.contentContainer.add(emptyText);
        } else {
            const startIndex = this.currentPage * ROWS_PER_PAGE;

            const endIndex = startIndex + ROWS_PER_PAGE;

            const visibleEntries = this.entries.slice(startIndex, endIndex);

            visibleEntries.forEach((entry: LeaderboardEntry, index: number) => {
                const rowY = startY + 35 + index * 34;

                const isCurrentPlayer = this.username !== null && entry.username === this.username;

                const rowColor = isCurrentPlayer ? '#ffd84a' : '#ffffff';

                if (isCurrentPlayer) {
                    const rowBackground = this.add.rectangle(this.centerX, rowY + 9, 690, 28, 0xffd84a, 0.12).setStrokeStyle(1, 0xffd84a, 0.5);

                    this.contentContainer?.add(rowBackground);
                }

                const rankText = this.add.text(rankX, rowY, String(entry.rank), {
                    font: '15px Orbitron',

                    color: rowColor,
                });

                const usernameText = this.add.text(usernameX, rowY, `u/${entry.username}`, {
                    font: '15px Orbitron',

                    color: rowColor,
                });

                const baseText = this.add
                    .text(baseX, rowY, String(entry.highestBaseSeen ?? 0), {
                        font: 'bold 15px Orbitron',

                        color: rowColor,
                    })
                    .setOrigin(0.5, 0);

                const scoreText = this.add
                    .text(scoreX, rowY, entry.score.toLocaleString(), {
                        font: 'bold 15px Orbitron',

                        color: rowColor,
                    })
                    .setOrigin(1, 0);

                this.contentContainer?.add([rankText, usernameText, baseText, scoreText]);
            });
        }

        this.createPaginationControls();

        this.createPlayerSummary();
    }

    private createPaginationControls(): void {
        const totalPages = Math.max(1, Math.ceil(this.entries.length / ROWS_PER_PAGE));

        const controlsY = this.centerY + this.panelHeight / 2 - 132;

        const previousButton = this.createButton(this.centerX - 165, controlsY, 'PREVIOUS', '#33485c', 16);

        const nextButton = this.createButton(this.centerX + 165, controlsY, 'NEXT', '#33485c', 16);

        const pageText = this.add
            .text(this.centerX, controlsY, `PAGE ${this.currentPage + 1} / ${totalPages}`, {
                font: 'bold 15px Orbitron',

                color: '#ffffff',

                stroke: '#000000',

                strokeThickness: 3,
            })
            .setOrigin(0.5);

        const hasPreviousPage = this.currentPage > 0;

        const hasNextPage = this.currentPage < totalPages - 1;

        this.setButtonEnabled(previousButton, hasPreviousPage);

        this.setButtonEnabled(nextButton, hasNextPage);

        previousButton.on('pointerdown', () => {
            if (!hasPreviousPage) {
                return;
            }

            this.currentPage--;

            this.renderCurrentPage();
        });

        nextButton.on('pointerdown', () => {
            if (!hasNextPage) {
                return;
            }

            this.currentPage++;

            this.renderCurrentPage();
        });

        this.contentContainer?.add([previousButton, pageText, nextButton]);
    }

    private createPlayerSummary(): void {
        const personalText = this.username
            ? [
                  `YOU: u/${this.username}`,

                  `PERSONAL BEST: ${this.personalBest.toLocaleString()}`,

                  `HIGHEST BASE: ${this.personalHighestBaseSeen}`,

                  this.playerRank !== null ? `GLOBAL RANK: #${this.playerRank}` : 'GLOBAL RANK: UNRANKED',
              ].join('     ')
            : 'Log in to Reddit to save a personal high score.';

        const playerSummary = this.add
            .text(this.centerX, this.centerY + this.panelHeight / 2 - 86, personalText, {
                font: '12px Orbitron',

                color: this.username ? '#ffd84a' : '#ffb0b0',

                align: 'center',

                wordWrap: {
                    width: 720,
                },
            })
            .setOrigin(0.5);

        this.contentContainer?.add(playerSummary);
    }

    private createButton(x: number, y: number, label: string, backgroundColor: string, fontSize = 22): GameObjects.Text {
        return this.add
            .text(x, y, label, {
                font: `bold ${fontSize}px Orbitron`,

                color: '#ffffff',

                backgroundColor,

                padding: {
                    x: fontSize <= 16 ? 18 : 28,

                    y: fontSize <= 16 ? 9 : 12,
                },

                stroke: '#000000',

                strokeThickness: 3,
            })
            .setOrigin(0.5)
            .setInteractive({
                useHandCursor: true,
            });
    }

    private setButtonEnabled(button: GameObjects.Text, enabled: boolean): void {
        if (enabled) {
            button.setAlpha(1).setInteractive({
                useHandCursor: true,
            });

            return;
        }

        button.setAlpha(0.35).disableInteractive();
    }

    private handleResize(gameSize: Phaser.Structs.Size): void {
        this.cameras.resize(gameSize.width, gameSize.height);

        this.scene.restart();
    }
}
