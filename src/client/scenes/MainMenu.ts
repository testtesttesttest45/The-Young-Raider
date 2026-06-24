import { GameObjects, Input, Scene, Structs } from 'phaser';
import Phaser from 'phaser';
import type { ApiErrorResponse, PlayerProfileResponse } from '../../shared/api';

type MenuButtonOptions = {
    x: number;
    y: number;

    width: number;
    height: number;

    title: string;
    subtitle: string;

    backgroundColor: number;
    borderColor: number;

    onClick: () => void;
};

export class MainMenu extends Scene {
    private background: GameObjects.Image | null = null;

    private profileStatusText: GameObjects.Text | null = null;

    private profileContent: GameObjects.Container | null = null;

    private mainCard: GameObjects.Container | null = null;

    private lastWidth = 0;

    private lastHeight = 0;

    constructor() {
        super('MainMenu');
    }

    init(): void {
        this.background = null;
        this.profileStatusText = null;
        this.profileContent = null;
        this.mainCard = null;
    }

    create(): void {
        const width = this.scale.width;

        const height = this.scale.height;

        this.lastWidth = width;

        this.lastHeight = height;

        const centerX = width / 2;

        const centerY = height / 2;

        this.createBackground(width, height);

        this.mainCard = this.add.container(0, 0);

        this.createMainCard(centerX, centerY, width, height);

        this.createHeader(centerX, height);

        this.createProfilePanel(centerX, height, width);

        this.createMenuButtons(centerX, height, width);

        this.createFooter(centerX, height);

        this.scale.on('resize', this.handleResize, this);

        this.events.once('shutdown', () => {
            this.scale.off('resize', this.handleResize, this);
        });

        void this.loadPlayerProfile();
    }

    private createBackground(width: number, height: number): void {
        this.background = this.add.image(0, 0, 'background').setOrigin(0, 0).setDisplaySize(width, height);

        this.add.rectangle(0, 0, width, height, 0x030b12, 0.73).setOrigin(0, 0);

        this.add.ellipse(width / 2, height * 0.41, Math.min(width * 0.88, 900), Math.min(height * 0.8, 620), 0x38c8ff, 0.055);

        this.add.ellipse(width / 2, height * 0.77, Math.min(width * 0.56, 570), 230, 0x39df76, 0.035);

        this.createParticles(width, height);
    }

    private createParticles(width: number, height: number): void {
        const fireflyCount = 24;

        for (let index = 0; index < fireflyCount; index++) {
            const x = Math.random() * width;
            const y = height * 0.15 + Math.random() * height * 0.75;

            const radius = 1.5 + Math.random() * 2.2;
            const glowRadius = radius * (3.5 + Math.random() * 1.8);

            const driftDistanceY = 10 + Math.random() * 24;
            const driftDistanceX = 6 + Math.random() * 18;

            const duration = 2600 + Math.random() * 2600;
            const delay = Math.random() * 2200;

            const glow = this.add.circle(x, y, glowRadius, 0x5fdcff, 0.06).setBlendMode(Phaser.BlendModes.ADD);

            const firefly = this.add.circle(x, y, radius, 0x8cecff, 0.75).setBlendMode(Phaser.BlendModes.ADD);

            this.tweens.add({
                targets: [glow, firefly],

                x: x + (Math.random() < 0.5 ? -1 : 1) * driftDistanceX,
                y: y - driftDistanceY,

                duration,
                delay,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });

            this.tweens.add({
                targets: glow,

                alpha: {
                    from: 0.025,
                    to: 0.14,
                },

                scale: {
                    from: 0.85,
                    to: 1.18,
                },

                duration: 1200 + Math.random() * 1400,
                delay,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });

            this.tweens.add({
                targets: firefly,

                alpha: {
                    from: 0.35,
                    to: 0.95,
                },

                scale: {
                    from: 0.92,
                    to: 1.08,
                },

                duration: 900 + Math.random() * 1100,
                delay: delay + Math.random() * 400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });

            this.tweens.add({
                targets: [glow, firefly],

                x: `+=${(Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 8)}`,

                duration: 1400 + Math.random() * 1800,
                delay: delay + 300,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
        }
    }

    private createMainCard(centerX: number, centerY: number, width: number, height: number): void {
        const cardWidth = Math.min(880, width - 48);

        const cardHeight = Math.min(690, height - 30);

        const shadow = this.add.rectangle(centerX + 8, centerY + 10, cardWidth, cardHeight, 0x000000, 0.58).setOrigin(0.5);

        const card = this.add.rectangle(centerX, centerY, cardWidth, cardHeight, 0x091722, 0.96).setOrigin(0.5).setStrokeStyle(3, 0x55d7ff, 0.72);

        const innerCard = this.add
            .rectangle(centerX, centerY, cardWidth - 14, cardHeight - 14, 0x102536, 0.28)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0xffffff, 0.07);

        const topGlow = this.add.rectangle(centerX, centerY - cardHeight / 2 + 3, cardWidth * 0.76, 3, 0x67ddff, 0.72).setOrigin(0.5);

        this.tweens.add({
            targets: topGlow,

            alpha: {
                from: 0.35,

                to: 0.9,
            },

            scaleX: {
                from: 0.9,

                to: 1,
            },

            duration: 1700,

            yoyo: true,

            repeat: -1,

            ease: 'Sine.easeInOut',
        });

        this.mainCard?.add([shadow, card, innerCard, topGlow]);
    }

    private createHeader(centerX: number, height: number): void {
        const eyebrow = this.add
            .text(centerX, height * 0.105, 'SURVIVE  •  GROW STRONGER  •  CLIMB THE RANKS', {
                font: 'bold 12px Orbitron',

                color: '#9ceaff',

                stroke: '#000000',

                strokeThickness: 3,
            })
            .setOrigin(0.5);

        const titleGlow = this.add.ellipse(centerX, height * 0.165, 520, 105, 0x4acfff, 0.065);

        const title = this.add
            .text(centerX, height * 0.165, 'THE YOUNG RAIDER', {
                font: 'bold 45px Orbitron',

                color: '#ffffff',

                stroke: '#000000',

                strokeThickness: 8,

                align: 'center',
            })
            .setOrigin(0.5);

        title.setShadow(0, 0, '#57d5ff', 14, true, true);

        const description = this.add
            .text(centerX, height * 0.225, 'Destroy enemy bases, survive catastrophes and set a new record.', {
                font: '14px Orbitron',

                color: '#b9cfda',

                stroke: '#000000',

                strokeThickness: 3,

                align: 'center',

                wordWrap: {
                    width: 680,
                },
            })
            .setOrigin(0.5);

        this.mainCard?.add([titleGlow, eyebrow, title, description]);
    }

    private createProfilePanel(centerX: number, height: number, width: number): void {
        const panelY = height * 0.405;

        const panelWidth = Math.min(740, width - 90);

        const panelHeight = 170;

        const panelShadow = this.add.rectangle(centerX + 5, panelY + 7, panelWidth, panelHeight, 0x000000, 0.46).setOrigin(0.5);

        const panel = this.add.rectangle(centerX, panelY, panelWidth, panelHeight, 0x0d2231, 0.92).setOrigin(0.5).setStrokeStyle(2, 0x50c8ff, 0.5);

        const headerStrip = this.add.rectangle(centerX, panelY - panelHeight / 2 + 23, panelWidth - 8, 38, 0x16384e, 0.95).setOrigin(0.5);

        const headerLabel = this.add
            .text(centerX - panelWidth / 2 + 24, panelY - panelHeight / 2 + 23, 'RAIDER PROFILE', {
                font: 'bold 13px Orbitron',

                color: '#9beaff',

                stroke: '#000000',

                strokeThickness: 2,
            })
            .setOrigin(0, 0.5);

        const statusLabel = this.add
            .text(centerX + panelWidth / 2 - 24, panelY - panelHeight / 2 + 23, 'ONLINE', {
                font: 'bold 10px Orbitron',

                color: '#70ff9d',

                stroke: '#000000',

                strokeThickness: 2,
            })
            .setOrigin(1, 0.5);

        const onlineDot = this.add.circle(statusLabel.x - statusLabel.width - 12, statusLabel.y, 4, 0x70ff9d, 1);

        this.tweens.add({
            targets: onlineDot,

            alpha: {
                from: 0.35,

                to: 1,
            },

            scale: {
                from: 0.75,

                to: 1.25,
            },

            duration: 850,

            yoyo: true,

            repeat: -1,
        });

        this.profileStatusText = this.add
            .text(centerX, panelY + 17, 'Loading Raider profile...', {
                font: '16px Orbitron',

                color: '#ffffff',

                stroke: '#000000',

                strokeThickness: 3,

                align: 'center',
            })
            .setOrigin(0.5);

        this.mainCard?.add([panelShadow, panel, headerStrip, headerLabel, statusLabel, onlineDot, this.profileStatusText]);
    }

    private createMenuButtons(centerX: number, height: number, width: number): void {
        let wasPressedOnThisButton = false;
        const playButton = this.createMenuButton({
            x: centerX,

            y: height * 0.65,

            width: Math.min(430, width - 130),

            height: 70,

            title: 'PLAY NOW',

            subtitle: 'BEGIN A NEW RUN',

            backgroundColor: 0x168b48,

            borderColor: 0x8effb4,

            onClick: () => {
                this.scene.start('Game');
            },
        });

        const secondaryButtonWidth = Math.min(330, (width - 120) / 2);

        const collectionsButton = this.createMenuButton({
            x: centerX - 180,

            y: height * 0.79,

            width: secondaryButtonWidth,

            height: 62,

            title: 'COLLECTIONS',

            subtitle: 'VIEW YOUR RAIDERS',

            backgroundColor: 0x17678f,

            borderColor: 0x78ddff,

            onClick: () => {
                this.scene.start('Collections');
            },
        });

        const leaderboardButton = this.createMenuButton({
            x: centerX + 180,

            y: height * 0.79,

            width: secondaryButtonWidth,

            height: 62,

            title: 'LEADERBOARD',

            subtitle: 'TOP 100 RAIDERS',

            backgroundColor: 0x624096,

            borderColor: 0xc7a8ff,

            onClick: () => {
                this.scene.start('Leaderboard');
            },
        });

        this.mainCard?.add([playButton, collectionsButton, leaderboardButton]);
    }

    private createMenuButton(options: MenuButtonOptions): GameObjects.Container {
        const container = this.add.container(options.x, options.y);

        let wasPressedOnThisButton = false;

        const glow = this.add.rectangle(0, 4, options.width + 14, options.height + 14, options.borderColor, 0.055).setOrigin(0.5);

        const shadow = this.add.rectangle(5, 8, options.width, options.height, 0x000000, 0.58).setOrigin(0.5);

        const button = this.add.rectangle(0, 0, options.width, options.height, options.backgroundColor, 1).setOrigin(0.5).setStrokeStyle(3, options.borderColor, 0.74).setInteractive({
            useHandCursor: true,
        });

        const upperHighlight = this.add.rectangle(0, -options.height * 0.25, options.width - 12, options.height * 0.32, 0xffffff, 0.055).setOrigin(0.5);

        const titleText = this.add
            .text(0, -8, options.title, {
                font: options.title === 'PLAY NOW' ? 'bold 25px Orbitron' : 'bold 18px Orbitron',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 5,
            })
            .setOrigin(0.5);

        const subtitleText = this.add
            .text(0, 18, options.subtitle, {
                font: 'bold 9px Orbitron',
                color: '#d5eaf2',
                stroke: '#000000',
                strokeThickness: 2,
            })
            .setOrigin(0.5)
            .setAlpha(0.82);

        const leftAccent = this.add.rectangle(-options.width / 2 + 13, 0, 4, options.height - 18, options.borderColor, 0.7).setOrigin(0.5);

        const rightAccent = this.add.rectangle(options.width / 2 - 13, 0, 4, options.height - 18, options.borderColor, 0.7).setOrigin(0.5);

        container.add([glow, shadow, button, upperHighlight, leftAccent, rightAccent, titleText, subtitleText]);

        button.on('pointerover', () => {
            this.tweens.killTweensOf(container);

            this.tweens.add({
                targets: container,
                scaleX: 1.025,
                scaleY: 1.025,
                duration: 100,
                ease: 'Quad.easeOut',
            });

            glow.setAlpha(0.13);
        });

        button.on('pointerout', () => {
            wasPressedOnThisButton = false;

            this.tweens.killTweensOf(container);

            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 100,
                ease: 'Quad.easeOut',
            });

            glow.setAlpha(0.055);
        });

        button.on('pointerdown', () => {
            wasPressedOnThisButton = true;

            this.tweens.killTweensOf(container);

            this.tweens.add({
                targets: container,
                scaleX: 0.965,
                scaleY: 0.965,
                duration: 65,
                ease: 'Quad.easeIn',
            });
        });

        button.on('pointerup', (_pointer: Input.Pointer) => {
            container.setScale(1);

            if (!wasPressedOnThisButton) {
                return;
            }

            wasPressedOnThisButton = false;

            options.onClick();
        });

        button.on('pointerupoutside', () => {
            wasPressedOnThisButton = false;

            container.setScale(1);
        });

        return container;
    }

    private createFooter(centerX: number, height: number): void {
        const line = this.add.rectangle(centerX, height * 0.895, 530, 1, 0x6edfff, 0.18).setOrigin(0.5);

        const footer = this.add
            .text(centerX, height * 0.92, 'EVERY RUN IS ANOTHER CHANCE TO CLIMB HIGHER', {
                font: '10px Orbitron',

                color: '#8faab7',

                stroke: '#000000',

                strokeThickness: 2,
            })
            .setOrigin(0.5);

        this.mainCard?.add([line, footer]);
    }

    private async loadPlayerProfile(): Promise<void> {
        try {
            const response = await fetch('/api/player-profile');

            const responseData = (await response.json()) as unknown;

            if (!response.ok) {
                const errorData = responseData as ApiErrorResponse;

                throw new Error(errorData.message ?? 'Unable to load profile.');
            }

            const profile = responseData as PlayerProfileResponse;

            if (profile.type !== 'player-profile') {
                throw new Error('Unexpected server response.');
            }

            this.renderPlayerProfile(profile);
        } catch (error) {
            console.error('[MainMenu] Failed to load profile:', error);

            const message = error instanceof Error ? error.message : 'Unknown error';

            this.profileStatusText?.setColor('#ff9c9c').setText(['PROFILE UNAVAILABLE', message].join('\n'));
        }
    }

    private renderPlayerProfile(profile: PlayerProfileResponse): void {
        this.profileStatusText?.destroy();

        this.profileStatusText = null;

        this.profileContent?.destroy(true);

        this.profileContent = this.add.container(0, 0);

        const centerX = this.scale.width / 2;

        const panelY = this.scale.height * 0.405;

        const panelWidth = Math.min(740, this.scale.width - 90);

        const username = this.add
            .text(centerX - panelWidth / 2 + 28, panelY - 20, `u/${profile.username}`, {
                font: 'bold 15px Orbitron',

                color: '#ffffff',

                backgroundColor: '#08141d',

                padding: {
                    x: 14,
                    y: 9,
                },

                stroke: '#000000',

                strokeThickness: 3,
            })
            .setOrigin(0, 0.5);

        const cashPanel = this.add
            .rectangle(centerX + panelWidth / 2 - 115, panelY - 20, 205, 42, 0x09261a, 0.78)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0x70ff9d, 0.32);

        const cashIcon = this.add.image(cashPanel.x - 76, cashPanel.y, 'cash').setDisplaySize(28, 28);

        const cashTitle = this.add
            .text(cashPanel.x - 55, cashPanel.y, 'CASH', {
                font: 'bold 10px Orbitron',

                color: '#baffca',

                stroke: '#000000',

                strokeThickness: 2,
            })
            .setOrigin(0, 0.5);

        const cashAmount = this.add
            .text(centerX + panelWidth / 2 - 25, cashPanel.y, profile.cash.toLocaleString(), {
                font: 'bold 17px Orbitron',

                color: '#7dffa7',

                stroke: '#000000',

                strokeThickness: 3,
            })
            .setOrigin(1, 0.5);

        const statsY = panelY + 42;

        const allTimeBlock = this.createStatisticBlock(centerX - 225, statsY, 'ALL-TIME BEST', profile.allTimeHighScore.toLocaleString(), '#ffd85a', 0x584815);

        const dailyBlock = this.createStatisticBlock(centerX, statsY, "TODAY'S BEST", profile.todayHighScore.toLocaleString(), '#8cecff', 0x174d5f);

        const rankBlock = this.createStatisticBlock(centerX + 225, statsY, 'GLOBAL RANK', profile.globalRank !== null ? `#${profile.globalRank}` : 'UNRANKED', '#d9b8ff', 0x493262);

        this.profileContent.add([username, cashPanel, cashIcon, cashTitle, cashAmount, allTimeBlock, dailyBlock, rankBlock]);

        this.profileContent.setAlpha(1).setY(0);
    }

    private createStatisticBlock(x: number, y: number, label: string, value: string, valueColor: string, panelColor: number): GameObjects.Container {
        const container = this.add.container(x, y);

        const panel = this.add.rectangle(0, 0, 195, 62, panelColor, 0.28).setOrigin(0.5).setStrokeStyle(1, 0xffffff, 0.09);

        const labelText = this.add
            .text(0, -15, label, {
                font: 'bold 10px Orbitron',

                color: '#9eb6c7',

                stroke: '#000000',

                strokeThickness: 2,
            })
            .setOrigin(0.5);

        const valueText = this.add
            .text(0, 13, value, {
                font: 'bold 20px Orbitron',

                color: valueColor,

                stroke: '#000000',

                strokeThickness: 4,
            })
            .setOrigin(0.5);

        container.add([panel, labelText, valueText]);

        return container;
    }

    private handleResize(gameSize: Structs.Size): void {
        const widthDifference = Math.abs(gameSize.width - this.lastWidth);

        const heightDifference = Math.abs(gameSize.height - this.lastHeight);

        const isSmallMobileAdjustment = widthDifference < 10 && heightDifference < 80;

        if (isSmallMobileAdjustment) {
            return;
        }

        this.lastWidth = gameSize.width;

        this.lastHeight = gameSize.height;

        this.cameras.resize(gameSize.width, gameSize.height);

        this.scene.restart();
    }
}
