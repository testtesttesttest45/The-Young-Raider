import {
    GameObjects,
    Scene
} from 'phaser';

import type {
    ApiErrorResponse,
    LeaderboardEntry,
    LeaderboardResponse
} from '../../shared/api';

export class Leaderboard
    extends Scene {
    private background:
        GameObjects.Image | null =
        null;

    private contentContainer:
        GameObjects.Container | null =
        null;

    private statusText:
        GameObjects.Text | null =
        null;

    constructor() {
        super(
            'Leaderboard'
        );
    }

    create(): void {
        const width =
            this.scale.width;

        const height =
            this.scale.height;

        this.background =
            this.add
                .image(
                    0,
                    0,
                    'background'
                )
                .setOrigin(
                    0,
                    0
                )
                .setDisplaySize(
                    width,
                    height
                )
                .setAlpha(
                    0.45
                );

        this.add
            .rectangle(
                0,
                0,
                width,
                height,
                0x07111a,
                0.78
            )
            .setOrigin(
                0,
                0
            );

        const panelWidth =
            Math.min(
                760,
                width - 50
            );

        const panelHeight =
            Math.min(
                650,
                height - 40
            );

        const centerX =
            width / 2;

        const centerY =
            height / 2;

        this.add
            .rectangle(
                centerX,
                centerY,
                panelWidth,
                panelHeight,
                0x111c26,
                0.98
            )
            .setStrokeStyle(
                4,
                0x50c8ff,
                1
            );

        this.add
            .text(
                centerX,
                centerY -
                panelHeight / 2 +
                48,
                'LEADERBOARD',
                {
                    font:
                        'bold 39px Orbitron',

                    color:
                        '#ffffff',

                    stroke:
                        '#000000',

                    strokeThickness:
                        6
                }
            )
            .setOrigin(0.5);

        this.add
            .text(
                centerX,
                centerY -
                panelHeight / 2 +
                92,
                'ALL-TIME TOP RAIDERS',
                {
                    font:
                        '14px Orbitron',

                    color:
                        '#82e6ff'
                }
            )
            .setOrigin(0.5);

        this.statusText =
            this.add
                .text(
                    centerX,
                    centerY,
                    'Loading leaderboard...',
                    {
                        font:
                            '18px Orbitron',

                        color:
                            '#ffffff'
                    }
                )
                .setOrigin(0.5);

        const backButton =
            this.add
                .text(
                    centerX,
                    centerY +
                    panelHeight / 2 -
                    45,
                    'BACK',
                    {
                        font:
                            'bold 22px Orbitron',

                        color:
                            '#ffffff',

                        backgroundColor:
                            '#1d6f94',

                        padding: {
                            x: 28,
                            y: 12
                        },

                        stroke:
                            '#000000',

                        strokeThickness:
                            3
                    }
                )
                .setOrigin(0.5)
                .setInteractive({
                    useHandCursor:
                        true
                });

        backButton.on(
            'pointerdown',
            () => {
                this.scene.start(
                    'MainMenu'
                );
            }
        );

        this.scale.on(
            'resize',
            this.handleResize,
            this
        );

        this.events.once(
            'shutdown',
            () => {
                this.scale.off(
                    'resize',
                    this.handleResize,
                    this
                );
            }
        );

        void this.loadLeaderboard(
            centerX,
            centerY,
            panelHeight
        );
    }

    private async loadLeaderboard(
        centerX: number,
        centerY: number,
        panelHeight: number
    ): Promise<void> {
        try {
            const response =
                await fetch(
                    '/api/leaderboard'
                );

            const responseData =
                await response.json() as unknown;

            if (!response.ok) {
                const errorData =
                    responseData as ApiErrorResponse;

                throw new Error(
                    errorData.message ??
                    'Unable to load leaderboard.'
                );
            }

            // successful response
            const data =
                responseData as LeaderboardResponse;

            if (
                data.type !== 'leaderboard' ||
                !Array.isArray(data.entries)
            ) {
                throw new Error(
                    'Unexpected server response.'
                );
            }
            this.statusText
                ?.destroy();

            this.statusText = null;

            this.contentContainer
                ?.destroy(true);

            this.contentContainer =
                this.add.container(
                    0,
                    0
                );

            const startY =
                centerY -
                panelHeight / 2 +
                135;

            const rankX =
                centerX - 260;

            const usernameX =
                centerX - 190;

            const scoreX =
                centerX + 260;

            const headerStyle:
                Phaser.Types.GameObjects.Text.TextStyle = {
                font:
                    'bold 14px Orbitron',

                color:
                    '#82e6ff'
            };

            const rankHeader =
                this.add.text(
                    rankX,
                    startY,
                    '#',
                    headerStyle
                );

            const usernameHeader =
                this.add.text(
                    usernameX,
                    startY,
                    'PLAYER',
                    headerStyle
                );

            const scoreHeader =
                this.add
                    .text(
                        scoreX,
                        startY,
                        'SCORE',
                        headerStyle
                    )
                    .setOrigin(
                        1,
                        0
                    );

            this.contentContainer.add([
                rankHeader,
                usernameHeader,
                scoreHeader
            ]);

            if (
                data.entries.length === 0
            ) {
                const emptyText =
                    this.add
                        .text(
                            centerX,
                            startY + 80,
                            'No completed runs yet.\nBe the first raider on the board!',
                            {
                                font:
                                    '17px Orbitron',

                                color:
                                    '#c7d5e0',

                                align:
                                    'center'
                            }
                        )
                        .setOrigin(0.5);

                this.contentContainer.add(
                    emptyText
                );
            } else {
                data.entries.forEach(
                    (
                        entry,
                        index
                    ) => {
                        const rowY =
                            startY +
                            35 +
                            index * 34;

                        const isCurrentPlayer =
                            data.username !== null &&
                            entry.username ===
                            data.username;

                        const rowColor =
                            isCurrentPlayer
                                ? '#ffd84a'
                                : '#ffffff';

                        const rankText =
                            this.add.text(
                                rankX,
                                rowY,
                                String(
                                    entry.rank
                                ),
                                {
                                    font:
                                        '15px Orbitron',

                                    color:
                                        rowColor
                                }
                            );

                        const usernameText =
                            this.add.text(
                                usernameX,
                                rowY,
                                `u/${entry.username}`,
                                {
                                    font:
                                        '15px Orbitron',

                                    color:
                                        rowColor
                                }
                            );

                        const scoreText =
                            this.add
                                .text(
                                    scoreX,
                                    rowY,
                                    entry.score
                                        .toLocaleString(),
                                    {
                                        font:
                                            'bold 15px Orbitron',

                                        color:
                                            rowColor
                                    }
                                )
                                .setOrigin(
                                    1,
                                    0
                                );

                        this.contentContainer?.add([
                            rankText,
                            usernameText,
                            scoreText
                        ]);
                    }
                );
            }

            const personalText =
                data.username
                    ? [
                        `YOU: u/${data.username}`,
                        `PERSONAL BEST: ${data.personalBest.toLocaleString()}`,
                        data.playerRank !== null
                            ? `GLOBAL RANK: #${data.playerRank}`
                            : 'GLOBAL RANK: UNRANKED'
                    ].join('     ')
                    : 'Log in to Reddit to save a personal high score.';

            const playerSummary =
                this.add
                    .text(
                        centerX,
                        centerY +
                        panelHeight / 2 -
                        92,
                        personalText,
                        {
                            font:
                                '13px Orbitron',

                            color:
                                data.username
                                    ? '#ffd84a'
                                    : '#ffb0b0',

                            align:
                                'center',

                            wordWrap: {
                                width:
                                    650
                            }
                        }
                    )
                    .setOrigin(0.5);

            this.contentContainer.add(
                playerSummary
            );
        } catch (error) {
            console.error(
                '[Leaderboard] Failed to load:',
                error
            );

            const message =
                error instanceof Error
                    ? error.message
                    : 'Unknown error';

            this.statusText
                ?.setColor(
                    '#ff8b8b'
                )
                .setText(
                    [
                        'Unable to load leaderboard.',
                        message
                    ].join('\n')
                );
        }
    }

    private handleResize(
        gameSize:
            Phaser.Structs.Size
    ): void {
        this.cameras.resize(
            gameSize.width,
            gameSize.height
        );

        this.scene.restart();
    }
}