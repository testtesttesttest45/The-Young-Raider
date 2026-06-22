// import musicManager from './music_manager.js';
const HUD_HEIGHT = 110;
import { Scene } from 'phaser';
import * as Phaser from 'phaser';
declare global {
    interface Window {
        fetchHighestScore?: () => void;
    }
}
const musicManager: any = {
    play: (_path?: string) => { },
    stop: () => { }
};

export default class BattleUI extends Scene {
    gold: number;
    score: number;

    scoreText: any;
    multiplierText: any;
    multiplierBarFill: any;

    goldText: any;
    cashText: any;

    multiplier: number;
    multiplierMin: number;
    multiplierDuration: number;
    lastMultiplierUpdate: number;

    timerStarted: boolean;

    baseRebuildText: any;
    baseRebuildBarBackground: any;
    baseRebuildBarFill: any;
    baseRebuildGraphics: any;
    baseRebuildBarFillWidth: number;

    baseRebuilding: boolean;
    isMultiplierPaused: boolean;

    cash: number;

    scrollbarTrack: any;
    scrollbarHandle: any;
    scrollPosition: number;
    shopHeaderContainer: Phaser.GameObjects.Container;
    shopContentCamera:
        Phaser.Cameras.Scene2D.Camera | null = null;
    buyButtons: any[];

    currentFeedbackText: any;

    playerHealthBaseText: any;
    playerHealthBonusText: any;

    playerHealthText: any;
    playerDamageText: any;
    playerAttackSpeedText: any;
    playerSpeedText: any;

    playerDamageBonusText: any;
    playerAttackSpeedBonusText: any;
    playerSpeedBonusText: any;

    itemPurchaseLimit: number;
    purchaseCounts: any;

    legendaryPurchaseLimit: number;
    legendaryPurchaseCount: any;

    purchaseCountText: any;
    legendaryPurchaseCountText: any;

    goldTextShop: any;

    gameDataSaved: boolean;

    penknifeBulkBuyButton: any;

    legendaryIcons: any[];

    approachingText: any;
    catastropheIcon: any;

    flashing: boolean;
    flashingTween: any;

    timerBarBackground: any;
    timerBarFill: any;

    stormMaxTime: number;
    currentTime: number;

    strengthenIcon: any;
    strengthenBarBackground: any;
    strengthenBarFill: any;

    strengthenMaxTime: number;
    strengthenCurrentTime: number;

    strengthenedSquare: any;
    strengthenedSquareContainer: any;
    strengthenedSquareText: any;

    playerIcon: any;
    playerNameText: any;

    shopButtonContainer: any;
    shopText: any;
    shopIcon: any;

    shopModalContainer: any;
    scrollableContainer: any;

    modalBackground: any;
    invisibleBackground: any;
    headerBackground: any;

    closeButtonText: any;

    damageSectionTitle: any;
    healthSectionTitle: any;
    attackSpeedSectionTitle: any;
    movementSpeedSectionTitle: any;
    legendaryUpgradesSectionTitle: any;

    upgradeTooltip: any;

    mask: any;

    inputBlocker: any;
    gameOverContainer: any;

    pauseContainer: any;

    fireballTimer: number;
    cashIcon: any;
    constructor() {
        super({ key: 'BattleUI', active: false });
        this.gold = 1750;
        this.score = 0;
        this.scoreText = null;
        this.multiplier = 5;
        this.multiplierMin = 0.5;
        this.multiplierDuration = 12000;
        this.lastMultiplierUpdate = 0;
        this.timerStarted = false;
        this.baseRebuildText = null;
        this.baseRebuildBarBackground = null;
        this.baseRebuildBarFill = null;
        this.baseRebuilding = false;
        this.isMultiplierPaused = false;
        this.cash = 0;
        this.scrollbarTrack = null;
        this.scrollbarHandle = null;
        this.scrollPosition = 0;
        this.buyButtons = [];
        this.currentFeedbackText = null;
        this.playerHealthBaseText = null;
        this.playerHealthBonusText = null;
        this.itemPurchaseLimit = 5;
        this.purchaseCounts = {
            "Energy Gun": 0,
            "Quickblade": 0,
            "Lightning Core": 0,
            "Mecha Sneakers": 0,
        };
        this.legendaryPurchaseLimit = 1;
        this.legendaryPurchaseCount = {
            "Thunderlord Seal": 0,
            "Elixir of Life": 0,
            "Winter Frost": 0,
            "Treasure Hunter": 0,
            "Forbidden Excalibur": 0,
            "Soul of the Phoenix": 0,
            "Cosmic Scimitar": 0,
        };
        this.purchaseCountText = null;
        this.legendaryPurchaseCountText = null;
        this.goldTextShop = null;
        this.gameDataSaved = false;
        this.penknifeBulkBuyButton = null;
        this.legendaryIcons = [];
    }

    resetState() {
        console.log('State resetted');
        this.gold = 1750;
        this.score = 0;
        this.scoreText = null;
        this.multiplier = 5;
        this.multiplierMin = 0.5;
        this.multiplierDuration = 12000;
        this.lastMultiplierUpdate = 0;
        this.timerStarted = false;
        this.baseRebuildText = null;
        this.baseRebuildBarBackground = null;
        this.baseRebuildBarFill = null;
        this.baseRebuilding = false;
        this.isMultiplierPaused = false;
        this.cash = 0;
        this.scrollbarTrack = null;
        this.scrollbarHandle = null;
        this.scrollPosition = 0;
        this.buyButtons = [];
        this.currentFeedbackText = null;
        this.playerHealthBaseText = null;
        this.playerHealthBonusText = null;
        this.itemPurchaseLimit = 5;
        this.purchaseCounts = {
            "Energy Gun": 0,
            "Quickblade": 0,
            "Lightning Core": 0,
            "Mecha Sneakers": 0,
        };
        this.legendaryPurchaseLimit = 1;
        this.legendaryPurchaseCount = {
            "Thunderlord Seal": 0,
            "Elixir of Life": 0,
            "Winter Frost": 0,
            "Treasure Hunter": 0,
            "Forbidden Excalibur": 0,
            "Soul of the Phoenix": 0,
            "Cosmic Scimitar": 0,
        };
        this.purchaseCountText = null;
        this.legendaryPurchaseCountText = null;
        this.goldTextShop = null;
        this.gameDataSaved = false;
        this.penknifeBulkBuyButton = null;
        this.legendaryIcons = [];
    }

    startMultiplierTimer() {
        if (!this.timerStarted) {
            this.timerStarted = true;
            this.lastMultiplierUpdate = (this.scene.get('Game') as any).activeGameTime;
        }
    }

    addGold(value: number) {
        this.gold += value;
        this.updateGoldDisplay();
    }

    updateGoldDisplay() {
        if (this.goldText) {
            this.goldText.setText(String(this.gold));
        }
        if (this.goldTextShop) {
            this.goldTextShop.setText(String(this.gold));
        }
    }

    addCash(value: number) {
        this.cash += value;
        this.updateCashDisplay();
    }

    updateCashDisplay() {
        if (this.cashText) {
            this.cashText.setText(
                String(this.cash)
            );
        }
    }

    create(): void {
        this.resetState();

        const width = this.scale.width;
        const gameScene = this.scene.get('Game') as any;
        const player = gameScene.player;
        const enemy = gameScene.enemies[0];

        const HUD_DEPTH = 100;
        const CONTENT_DEPTH = 102;

        const hudBackground = this.add
            .rectangle(
                0,
                0,
                width,
                HUD_HEIGHT,
                0x111a26,
                0.62
            )
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(HUD_DEPTH)
            .setInteractive();

        hudBackground.on(
            'pointerdown',
            (
                _pointer: Phaser.Input.Pointer,
                _localX: number,
                _localY: number,
                event: Phaser.Types.Input.EventData
            ) => {
                event.stopPropagation();
            }
        );

        // Bottom border
        this.add
            .rectangle(
                0,
                HUD_HEIGHT - 3,
                width,
                3,
                0x31b8ff,
                0.55
            )
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(HUD_DEPTH + 1);

        const sectionY = 8;
        const sectionHeight = HUD_HEIGHT - 18;

        const leftSectionX = 12;
        const leftSectionWidth = 360;

        const rightSectionWidth = 300;
        const rightSectionX =
            width - rightSectionWidth - 12;

        const centerSectionX =
            leftSectionX + leftSectionWidth + 12;

        const centerSectionWidth =
            rightSectionX - centerSectionX - 12;
        // Section backgrounds
        this.add
            .rectangle(
                leftSectionX,
                sectionY,
                leftSectionWidth,
                sectionHeight,
                0x162231,
                0.9
            )
            .setOrigin(0, 0)
            .setStrokeStyle(1, 0x3b6685, 0.9)
            .setScrollFactor(0)
            .setDepth(HUD_DEPTH + 1);

        this.add
            .rectangle(
                centerSectionX,
                sectionY,
                centerSectionWidth,
                sectionHeight,
                0x162231,
                0.9
            )
            .setOrigin(0, 0)
            .setStrokeStyle(1, 0x3b6685, 0.9)
            .setScrollFactor(0)
            .setDepth(HUD_DEPTH + 1);

        this.add
            .rectangle(
                rightSectionX,
                sectionY,
                rightSectionWidth,
                sectionHeight,
                0x162231,
                0.9
            )
            .setOrigin(0, 0)
            .setStrokeStyle(1, 0x3b6685, 0.9)
            .setScrollFactor(0)
            .setDepth(HUD_DEPTH + 1);

        const playerIconX = leftSectionX + 12;
        const playerTextX = leftSectionX + 78;

        this.playerIcon = this.add
            .image(
                playerIconX,
                sectionY + sectionHeight / 2,
                player.icon
            )
            .setOrigin(0, 0.5)
            .setScale(0.46)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.playerNameText = this.add
            .text(
                playerTextX,
                15,
                player.name,
                {
                    font: 'bold 15px Orbitron',
                    color: '#ffffff'
                }
            )
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.playerHealthText = this.add
            .text(
                playerTextX,
                39,
                'Health: --/--',
                {
                    font: '13px Orbitron',
                    color: '#7dff8b'
                }
            )
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.playerHealthBonusText = this.add
            .text(
                playerTextX + 160,
                39,
                '',
                {
                    font: '11px Orbitron',
                    color: '#31b8ff'
                }
            )
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.playerDamageText = this.add
            .text(
                playerTextX,
                64,
                'Damage: --',
                {
                    font: '12px Orbitron',
                    color: '#ffffff'
                }
            )
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.playerDamageBonusText = this.add
            .text(
                playerTextX + 92,
                64,
                '',
                {
                    font: '10px Orbitron',
                    color: '#31b8ff'
                }
            )
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.playerAttackSpeedText = this.add
            .text(
                playerTextX + 165,
                64,
                'Attack: --',
                {
                    font: '12px Orbitron',
                    color: '#ffffff'
                }
            )
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.playerAttackSpeedBonusText = this.add
            .text(
                playerTextX + 255,
                64,
                '',
                {
                    font: '10px Orbitron',
                    color: '#31b8ff'
                }
            )
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.playerSpeedText = this.add
            .text(
                playerTextX,
                87,
                'Speed: --',
                {
                    font: '12px Orbitron',
                    color: '#ffffff'
                }
            )
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.playerSpeedBonusText = this.add
            .text(
                playerTextX + 85,
                87,
                '',
                {
                    font: '10px Orbitron',
                    color: '#31b8ff'
                }
            )
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);
        const timerIconX =
            centerSectionX + 28;

        const timerBarX =
            centerSectionX + 55;

        const timerBarWidth = 280;
        const timerBarHeight = 12;

        const multiplierAreaWidth = 120;

        const multiplierX =
            centerSectionX +
            centerSectionWidth -
            multiplierAreaWidth / 2 -
            8;

        // Catastrophe row
        this.catastropheIcon = this.add
            .image(
                timerIconX,
                29,
                'catastrophe'
            )
            .setScale(0.29)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.approachingText = this.add
            .text(
                timerBarX,
                14,
                'Catastrophe',
                {
                    font: '12px Orbitron',
                    color: '#ffffff'
                }
            )
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.timerBarBackground = this.add
            .rectangle(
                timerBarX,
                36,
                timerBarWidth,
                timerBarHeight,
                0xffffff,
                0.18
            )
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.timerBarFill = this.add
            .rectangle(
                timerBarX,
                36,
                0,
                timerBarHeight,
                0x00ff66
            )
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH + 1);

        this.stormMaxTime =
            gameScene.catastrophe.stormInterval;

        this.currentTime = 0;

        // Strengthen row
        this.strengthenIcon = this.add
            .image(
                timerIconX,
                77,
                'strengthen'
            )
            .setScale(0.29)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.add
            .text(
                timerBarX,
                62,
                'Enemy strengthens',
                {
                    font: '12px Orbitron',
                    color: '#ffffff'
                }
            )
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.strengthenBarBackground = this.add
            .rectangle(
                timerBarX,
                84,
                timerBarWidth,
                timerBarHeight,
                0xffffff,
                0.18
            )
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.strengthenBarFill = this.add
            .rectangle(
                timerBarX,
                84,
                0,
                timerBarHeight,
                0xff3c3c
            )
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH + 1);

        this.strengthenMaxTime =
            enemy?.enemyStrengthenInterval ?? 1;

        this.strengthenCurrentTime = 0;

        // Strength level hexagon
        this.strengthenedSquare = this.add.graphics();

        const strengthenLevelX =
            timerBarX + timerBarWidth + 24;

        const strengthenLevelY =
            84 + timerBarHeight / 2;

        this.strengthenedSquareContainer = this.add
            .container(
                strengthenLevelX,
                strengthenLevelY
            )
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH + 1);

        this.drawHexagon();

        this.strengthenedSquareContainer.add(
            this.strengthenedSquare
        );

        this.strengthenedSquareText = this.add
            .text(
                0,
                0,
                '1',
                {
                    font: '13px Orbitron',
                    color: '#ffffff'
                }
            )
            .setOrigin(0.5);

        this.strengthenedSquareContainer.add(
            this.strengthenedSquareText
        );

        // Multiplier title
        this.add
            .text(
                multiplierX,
                14,
                'SCORE MULTIPLIER',
                {
                    font: '10px Orbitron',
                    color: '#b9c8d6'
                }
            )
            .setOrigin(0.5, 0)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.multiplierText = this.add
            .text(
                multiplierX,
                31,
                `x${this.multiplier}`,
                {
                    font: 'bold 18px Orbitron',
                    color: '#ffe866'
                }
            )
            .setOrigin(0.5, 0)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        const multiplierBarWidth = 92;

        const multiplierBarBackground = this.add
            .rectangle(
                multiplierX - multiplierBarWidth / 2,
                57,
                multiplierBarWidth,
                10,
                0xffffff,
                0.18
            )
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.multiplierBarFill = this.add
            .rectangle(
                multiplierBarBackground.x,
                multiplierBarBackground.y,
                multiplierBarWidth,
                10,
                0xffd900
            )
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH + 1);

        this.lastMultiplierUpdate =
            gameScene.activeGameTime;


        const rightContentX =
            rightSectionX + 14;

        // Score
        this.scoreText = this.add
            .text(
                rightContentX,
                16,
                'Score: 0',
                {
                    font: 'bold 15px Orbitron',
                    color: '#ffffff'
                }
            )
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        // Gold
        this.shopIcon = this.add
            .image(
                rightContentX + 12,
                53,
                'gold'
            )
            .setScale(0.38)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.goldText = this.add
            .text(
                rightContentX + 30,
                43,
                String(this.gold),
                {
                    font: '14px Orbitron',
                    color: '#ffd84a'
                }
            )
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        // Cash
        this.cashIcon = this.add
            .image(
                rightContentX + 115,
                53,
                'cash'
            )
            .setScale(0.38)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.cashText = this.add
            .text(
                rightContentX + 133,
                43,
                String(this.cash),
                {
                    font: '14px Orbitron',
                    color: '#82e6ff'
                }
            )
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        // Shop button
        this.shopButtonContainer = this.add
            .container(
                rightSectionX + 68,
                91
            )
            .setSize(105, 32)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH + 1)
            .setInteractive({
                useHandCursor: true
            });

        const shopButtonBackground = this.add
            .rectangle(
                0,
                0,
                105,
                32,
                0x1d6f94,
                1
            )
            .setStrokeStyle(
                2,
                0x63d5ff
            );

        this.shopText = this.add
            .text(
                0,
                0,
                'SHOP',
                {
                    font: 'bold 14px Orbitron',
                    color: '#ffffff'
                }
            )
            .setOrigin(0.5);

        this.shopButtonContainer.add([
            shopButtonBackground,
            this.shopText
        ]);

        this.shopButtonContainer.on(
            'pointerdown',
            (
                _pointer: Phaser.Input.Pointer,
                _localX: number,
                _localY: number,
                event: Phaser.Types.Input.EventData
            ) => {
                event.stopPropagation();

                if (!this.shopModalContainer) {
                    this.createShopModal();
                }

                this.toggleShopModal(true);
            }
        );

        // Pause button
        const pauseButton = this.add
            .text(
                rightSectionX +
                rightSectionWidth -
                42,
                59,
                'Ⅱ',
                {
                    font: 'bold 22px Orbitron',
                    color: '#ffffff',
                    backgroundColor: '#a92e2e',
                    padding: {
                        x: 11,
                        y: 8
                    }
                }
            )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH + 1)
            .setInteractive({
                useHandCursor: true
            });

        pauseButton.on(
            'pointerdown',
            (
                _pointer: Phaser.Input.Pointer,
                _localX: number,
                _localY: number,
                event: Phaser.Types.Input.EventData
            ) => {
                event.stopPropagation();
                this.pauseGame();
            }
        );

        this.flashing = false;
        this.flashingTween = null;

        this.createBaseRebuildTimer();
        this.startMultiplierTimer();
    }

    hasHealthBelowThreshold(currentHealth: number, maxHealth: number): boolean {
        const threshold = 0.2;
        return currentHealth / maxHealth < threshold;
    }

    displayPlayerStats(x: number, y: number): void {
        const {
            originalHealth,
            currentHealth,
            maxHealth,
            damage,
            originalDamage,
            attackSpeed,
            originalAttackSpeed,
            speed,
            originalSpeed
        } = (this.scene.get('Game') as any).player;

        const bonusHealth =
            maxHealth - originalHealth;

        const bonusDamage =
            damage - originalDamage;

        const bonusAttackSpeed =
            Math.round(
                (attackSpeed - originalAttackSpeed) * 100
            ) / 100;

        const bonusSpeed =
            speed - originalSpeed;

        this.playerHealthText.setText(
            `Health: ${currentHealth}/${maxHealth}`
        );

        this.playerHealthText.setColor(
            this.hasHealthBelowThreshold(
                currentHealth,
                maxHealth
            )
                ? '#ff0000'
                : '#7dff8b'
        );

        this.playerDamageText.setText(
            `Damage: ${damage}`
        );

        this.playerAttackSpeedText.setText(
            `Attack Speed: ${attackSpeed}`
        );

        this.playerSpeedText.setText(
            `Speed: ${speed}`
        );

        this.playerHealthBonusText.setText(
            bonusHealth > 0
                ? `(+${bonusHealth})`
                : ''
        );

        this.playerDamageBonusText.setText(
            bonusDamage > 0
                ? `(+${bonusDamage})`
                : ''
        );

        this.playerAttackSpeedBonusText.setText(
            bonusAttackSpeed > 0
                ? `(+${bonusAttackSpeed})`
                : ''
        );

        this.playerSpeedBonusText.setText(
            bonusSpeed > 0
                ? `(+${bonusSpeed})`
                : ''
        );
    }

    createShopModal(): void {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        const modalWidth = 840;
        const modalHeight = 560;

        const modalX =
            (screenWidth - modalWidth) / 2;

        const modalY =
            (screenHeight - modalHeight) / 2;

        const headerHeight = 58;
        const contentPadding = 20;
        const scrollbarWidth = 12;

        const viewportX =
            modalX + contentPadding;

        const viewportY =
            modalY + headerHeight + 12;

        const viewportWidth =
            modalWidth -
            contentPadding * 2 -
            scrollbarWidth -
            8;

        const viewportHeight =
            modalHeight -
            headerHeight -
            28;

        this.shopModalContainer = this.add
            .container(0, 0)
            .setDepth(1000)
            .setVisible(false);

        this.invisibleBackground = this.add
            .rectangle(
                0,
                0,
                screenWidth,
                screenHeight,
                0x000000,
                0.72
            )
            .setOrigin(0, 0)
            .setInteractive();

        this.invisibleBackground.on(
            'pointerdown',
            (
                _pointer: Phaser.Input.Pointer,
                _localX: number,
                _localY: number,
                event: Phaser.Types.Input.EventData
            ) => {
                event.stopPropagation();
            }
        );

        this.modalBackground = this.add
            .graphics()
            .fillStyle(0x111923, 0.98)
            .fillRoundedRect(
                modalX,
                modalY,
                modalWidth,
                modalHeight,
                16
            )
            .lineStyle(
                2,
                0x50c8ff,
                0.9
            )
            .strokeRoundedRect(
                modalX,
                modalY,
                modalWidth,
                modalHeight,
                16
            );

        this.headerBackground = this.add
            .graphics()
            .fillStyle(0x1d3447, 1)
            .fillRoundedRect(
                modalX,
                modalY,
                modalWidth,
                headerHeight,
                {
                    tl: 16,
                    tr: 16,
                    bl: 0,
                    br: 0
                }
            );

        const shopTitle = this.add
            .text(
                modalX + modalWidth / 2,
                modalY + headerHeight / 2,
                'UPGRADE SHOP',
                {
                    font: 'bold 22px Orbitron',
                    color: '#ffffff'
                }
            )
            .setOrigin(0.5);

        const goldIcon = this.add
            .image(
                modalX + 26,
                modalY + headerHeight / 2,
                'gold'
            )
            .setScale(0.42)
            .setOrigin(0.5);

        this.goldTextShop = this.add
            .text(
                modalX + 47,
                modalY + headerHeight / 2,
                String(this.gold),
                {
                    font: '17px Orbitron',
                    color: '#ffd84a'
                }
            )
            .setOrigin(0, 0.5);

        this.closeButtonText = this.add
            .text(
                modalX + modalWidth - 18,
                modalY + headerHeight / 2,
                '✕',
                {
                    font: 'bold 22px Arial',
                    color: '#ffffff',
                    backgroundColor: '#9e3030',
                    padding: {
                        x: 10,
                        y: 5
                    }
                }
            )
            .setOrigin(1, 0.5)
            .setInteractive({
                useHandCursor: true
            });

        this.closeButtonText.on(
            'pointerdown',
            (
                _pointer: Phaser.Input.Pointer,
                _localX: number,
                _localY: number,
                event: Phaser.Types.Input.EventData
            ) => {
                event.stopPropagation();
                this.toggleShopModal(false);
            }
        );
        this.shopModalContainer.add([
            this.invisibleBackground,
            this.modalBackground
        ]);

        this.scrollableContainer = this.add
            .container(0, 0)
            .setDepth(1001)
            .setVisible(false);

        this.shopContentCamera = this.cameras.add(
            viewportX,
            viewportY,
            viewportWidth,
            viewportHeight
        );

        this.shopContentCamera
            .setScroll(
                viewportX,
                viewportY
            )
            .setBackgroundColor(
                'rgba(0,0,0,0)'
            )
            .setVisible(false);

        this.shopHeaderContainer = this.add
            .container(0, 0)
            .setDepth(1002)
            .setVisible(false);

        this.shopHeaderContainer.add([
            this.headerBackground,
            shopTitle,
            goldIcon,
            this.goldTextShop,
            this.closeButtonText
        ]);

        const damageUpgrades = [
            {
                name: 'Penknife',
                description: 'Increase damage by 1',
                cost: 55,
                icon: 'sword1'
            },
            {
                name: "Hunter's Blade",
                description: 'Increase damage by 2%',
                cost: 200,
                icon: 'sword2'
            }
        ];

        const healthUpgrades = [
            {
                name: "Heaven's Rain",
                description: 'Increase max health by 12%',
                cost: 750,
                icon: 'health1'
            },
            {
                name: 'Health Potion',
                description: 'Restore 50% of maximum health',
                cost: 300,
                icon: 'health2'
            }
        ];

        const attackSpeedUpgrades = [
            {
                name: 'Energy Gun',
                description: 'Increase attack speed by 9%',
                cost: 660,
                icon: 'attackSpeed1'
            },
            {
                name: 'Quickblade',
                description: 'Increase attack speed by 18%',
                cost: 1250,
                icon: 'attackSpeed2'
            }
        ];

        const movementSpeedUpgrades = [
            {
                name: 'Lightning Core',
                description: 'Increase movement speed by 6%',
                cost: 700,
                icon: 'moveSpeed1'
            },
            {
                name: 'Mecha Sneakers',
                description: 'Increase movement speed by 12%',
                cost: 1300,
                icon: 'moveSpeed2'
            }
        ];

        const legendaryUpgrades = [
            {
                name: 'Cash',
                description: 'Exchange 300 Gold for 1 Cash',
                cost: 300,
                icon: 'cash'
            },
            {
                name: 'Thunderlord Seal',
                description: 'Permanent immunity to catastrophe storms',
                cost: 7000,
                icon: 'thunderlordSeal'
            },
            {
                name: 'Elixir of Life',
                description: 'Triple passive healing',
                cost: 5400,
                icon: 'elixirOfLife'
            },
            {
                name: 'Winter Frost',
                description: 'Greatly reduces enraged enemy movement speed',
                cost: 5600,
                icon: 'winterFrost'
            },
            {
                name: 'Treasure Hunter',
                description: 'Every Gold drop is worth twice as much',
                cost: 4800,
                icon: 'treasureFinder'
            },
            {
                name: 'Forbidden Excalibur',
                description: 'Double damage and health for the next 5 bases',
                cost: 9999,
                icon: 'sword2'
            },
            {
                name: 'Soul of the Phoenix',
                description: 'Revive once after being defeated',
                cost: 9999,
                icon: 'attackSpeed2'
            },
            {
                name: 'Cosmic Scimitar',
                description: 'Gain damage and health after each destroyed base',
                cost: 9999,
                icon: 'sword2'
            }
        ];
        const columnGap = 16;

        const columnWidth =
            (viewportWidth - columnGap) / 2;

        const leftColumnX = viewportX;

        const rightColumnX =
            viewportX +
            columnWidth +
            columnGap;

        let leftY = viewportY;
        let rightY = viewportY;

        this.damageSectionTitle = this.createShopSectionTitle(
            leftColumnX,
            leftY,
            'DAMAGE'
        );

        leftY += 34;

        leftY = this.createItems(
            damageUpgrades,
            leftColumnX,
            leftY,
            columnWidth
        );

        leftY += 18;

        this.attackSpeedSectionTitle =
            this.createShopSectionTitle(
                leftColumnX,
                leftY,
                'ATTACK SPEED'
            );

        leftY += 34;

        leftY = this.createItems(
            attackSpeedUpgrades,
            leftColumnX,
            leftY,
            columnWidth
        );

        this.healthSectionTitle =
            this.createShopSectionTitle(
                rightColumnX,
                rightY,
                'HEALTH'
            );

        rightY += 34;

        rightY = this.createItems(
            healthUpgrades,
            rightColumnX,
            rightY,
            columnWidth
        );

        rightY += 18;

        this.movementSpeedSectionTitle =
            this.createShopSectionTitle(
                rightColumnX,
                rightY,
                'MOVEMENT SPEED'
            );

        rightY += 34;

        rightY = this.createItems(
            movementSpeedUpgrades,
            rightColumnX,
            rightY,
            columnWidth
        );

        let legendaryY =
            Math.max(leftY, rightY) + 26;

        this.legendaryUpgradesSectionTitle =
            this.createShopSectionTitle(
                viewportX,
                legendaryY,
                'LEGENDARY UPGRADES'
            );

        legendaryY += 38;

        const contentBottom = this.createItems(
            legendaryUpgrades,
            viewportX,
            legendaryY,
            viewportWidth
        );

        this.scrollableContainer.add([
            this.damageSectionTitle,
            this.healthSectionTitle,
            this.attackSpeedSectionTitle,
            this.movementSpeedSectionTitle,
            this.legendaryUpgradesSectionTitle
        ]);

        const contentTop = viewportY;

        const contentHeight =
            contentBottom - contentTop;

        const minimumScrollY =
            Math.min(
                0,
                viewportHeight - contentHeight - 16
            );

        const trackX =
            modalX +
            modalWidth -
            contentPadding -
            scrollbarWidth / 2;

        const trackY = viewportY;

        this.scrollbarTrack = this.add
            .rectangle(
                trackX,
                trackY,
                scrollbarWidth,
                viewportHeight,
                0xffffff,
                0.16
            )
            .setOrigin(0.5, 0);

        const visibleRatio =
            Math.min(
                1,
                viewportHeight / contentHeight
            );

        const handleHeight =
            Math.max(
                54,
                viewportHeight * visibleRatio
            );

        this.scrollbarHandle = this.add
            .rectangle(
                trackX,
                trackY,
                scrollbarWidth,
                handleHeight,
                0x50c8ff,
                0.9
            )
            .setOrigin(0.5, 0)
            .setInteractive({
                useHandCursor: true
            });

        this.scrollbarTrack
            .setDepth(1002)
            .setVisible(false);

        this.scrollbarHandle
            .setDepth(1003)
            .setVisible(false);

        const handleRange =
            viewportHeight - handleHeight;

        let isDraggingContent = false;
        let isDraggingHandle = false;
        let lastPointerY = 0;

        const updateScrollbarFromContent = () => {
            if (minimumScrollY === 0) {
                this.scrollbarHandle.y = trackY;
                return;
            }

            const ratio =
                this.scrollableContainer.y /
                minimumScrollY;

            this.scrollbarHandle.y =
                trackY +
                Phaser.Math.Clamp(
                    ratio,
                    0,
                    1
                ) *
                handleRange;
        };

        const updateContentFromScrollbar = () => {
            if (handleRange <= 0) {
                this.scrollableContainer.y = 0;
                return;
            }

            const ratio =
                (this.scrollbarHandle.y - trackY) /
                handleRange;

            this.scrollableContainer.y =
                Phaser.Math.Clamp(
                    ratio,
                    0,
                    1
                ) *
                minimumScrollY;
        };

        this.input.on(
            'pointerdown',
            (
                pointer: Phaser.Input.Pointer
            ) => {
                if (!this.shopModalContainer.visible) {
                    return;
                }

                const insideViewport =
                    pointer.x >= viewportX &&
                    pointer.x <=
                    viewportX + viewportWidth &&
                    pointer.y >= viewportY &&
                    pointer.y <=
                    viewportY + viewportHeight;

                if (!insideViewport) {
                    return;
                }

                isDraggingContent = true;
                lastPointerY = pointer.y;
            }
        );

        this.scrollbarHandle.on(
            'pointerdown',
            (
                pointer: Phaser.Input.Pointer,
                _localX: number,
                _localY: number,
                event: Phaser.Types.Input.EventData
            ) => {
                event.stopPropagation();

                isDraggingHandle = true;
                isDraggingContent = false;
                lastPointerY = pointer.y;
            }
        );

        this.input.on(
            'pointermove',
            (
                pointer: Phaser.Input.Pointer
            ) => {
                if (!this.shopModalContainer.visible) {
                    return;
                }

                if (isDraggingHandle) {
                    const deltaY =
                        pointer.y - lastPointerY;

                    lastPointerY = pointer.y;

                    this.scrollbarHandle.y =
                        Phaser.Math.Clamp(
                            this.scrollbarHandle.y +
                            deltaY,
                            trackY,
                            trackY + handleRange
                        );

                    updateContentFromScrollbar();
                    return;
                }

                if (isDraggingContent) {
                    const deltaY =
                        pointer.y - lastPointerY;

                    lastPointerY = pointer.y;

                    this.scrollableContainer.y =
                        Phaser.Math.Clamp(
                            this.scrollableContainer.y +
                            deltaY,
                            minimumScrollY,
                            0
                        );

                    updateScrollbarFromContent();
                }
            }
        );

        this.input.on('pointerup', () => {
            isDraggingContent = false;
            isDraggingHandle = false;
        });

        this.input.on(
            'wheel',
            (
                pointer: Phaser.Input.Pointer,
                _gameObjects: Phaser.GameObjects.GameObject[],
                _deltaX: number,
                deltaY: number
            ) => {
                if (!this.shopModalContainer.visible) {
                    return;
                }

                const insideViewport =
                    pointer.x >= viewportX &&
                    pointer.x <=
                    viewportX + viewportWidth &&
                    pointer.y >= viewportY &&
                    pointer.y <=
                    viewportY + viewportHeight;

                if (!insideViewport) {
                    return;
                }

                this.scrollableContainer.y =
                    Phaser.Math.Clamp(
                        this.scrollableContainer.y -
                        deltaY * 0.65,
                        minimumScrollY,
                        0
                    );

                updateScrollbarFromContent();
            }
        );

        this.cameras.main.ignore(
            this.scrollableContainer
        );

        const objectsIgnoredByShopCamera =
            this.children.list.filter(
                gameObject =>
                    gameObject !==
                    this.scrollableContainer
            );

        this.shopContentCamera.ignore(
            objectsIgnoredByShopCamera
        );
    }
    private createShopSectionTitle(
        x: number,
        y: number,
        text: string
    ): Phaser.GameObjects.Text {
        const title = this.add
            .text(
                x,
                y,
                text,
                {
                    font: 'bold 16px Orbitron',
                    color: '#ffd84a'
                }
            );

        return title;
    }

    createItems(
        upgrades: any[],
        startX: number,
        startY: number,
        sectionWidth: number
    ): number {
        const itemHeight = 104;
        const itemGap = 12;

        let bottomY = startY;

        upgrades.forEach(
            (
                upgrade,
                index
            ) => {
                const itemY =
                    startY +
                    index *
                    (itemHeight + itemGap);

                const itemWidth =
                    sectionWidth;

                const itemBackground = this.add
                    .graphics()
                    .fillStyle(
                        0x202c38,
                        0.96
                    )
                    .fillRoundedRect(
                        startX,
                        itemY,
                        itemWidth,
                        itemHeight,
                        10
                    )
                    .lineStyle(
                        1,
                        0x3c6682,
                        0.85
                    )
                    .strokeRoundedRect(
                        startX,
                        itemY,
                        itemWidth,
                        itemHeight,
                        10
                    );

                const iconScale =
                    upgrade.icon === 'cash'
                        ? 0.46
                        : 0.36;

                const icon = this.add
                    .image(
                        startX + 31,
                        itemY + 34,
                        upgrade.icon
                    )
                    .setScale(iconScale);

                const nameText = this.add
                    .text(
                        startX + 58,
                        itemY + 10,
                        upgrade.name,
                        {
                            font: 'bold 14px Orbitron',
                            color: '#50c8ff'
                        }
                    );

                const descriptionText = this.add
                    .text(
                        startX + 58,
                        itemY + 35,
                        upgrade.description,
                        {
                            font: '11px Orbitron',
                            color: '#ffffff',
                            wordWrap: {
                                width:
                                    itemWidth - 76
                            }
                        }
                    );

                const costIcon = this.add
                    .image(
                        startX + 22,
                        itemY + itemHeight - 24,
                        'gold'
                    )
                    .setScale(0.26)
                    .setOrigin(0.5);

                const costText = this.add
                    .text(
                        startX + 38,
                        itemY + itemHeight - 24,
                        String(upgrade.cost),
                        {
                            font: 'bold 13px Orbitron',
                            color: '#ffd84a'
                        }
                    )
                    .setOrigin(0, 0.5);

                let buyButton:
                    Phaser.GameObjects.Text;

                if (upgrade.cost === 9999) {
                    buyButton = this.add
                        .text(
                            startX + itemWidth - 14,
                            itemY + itemHeight - 25,
                            'LOCKED',
                            {
                                font: 'bold 12px Orbitron',
                                color: '#ff6666'
                            }
                        )
                        .setOrigin(1, 0.5);
                } else {
                    buyButton = this.add
                        .text(
                            startX + itemWidth - 14,
                            itemY + itemHeight - 25,
                            'BUY',
                            {
                                font: 'bold 13px Orbitron',
                                color: '#ffffff',
                                backgroundColor: '#247f4c',
                                padding: {
                                    x: 9,
                                    y: 4
                                }
                            }
                        )
                        .setOrigin(1, 0.5)
                        .setInteractive({
                            useHandCursor: true
                        });

                    buyButton.on(
                        'pointerdown',
                        (
                            _pointer: Phaser.Input.Pointer,
                            _localX: number,
                            _localY: number,
                            event: Phaser.Types.Input.EventData
                        ) => {
                            event.stopPropagation();

                            this.purchaseUpgrade(
                                upgrade.name,
                                upgrade.cost,
                                upgrade.icon
                            );
                        }
                    );
                }

                this.buyButtons.push({
                    button: buyButton,
                    cost: upgrade.cost,
                    upgradeName: upgrade.name
                });

                this.scrollableContainer.add([
                    itemBackground,
                    icon,
                    nameText,
                    descriptionText,
                    costIcon,
                    costText,
                    buyButton
                ]);

                if (
                    upgrade.name ===
                    'Penknife'
                ) {
                    this.penknifeBulkBuyButton =
                        this.add
                            .text(
                                startX +
                                itemWidth -
                                72,
                                itemY +
                                itemHeight -
                                25,
                                'BULK',
                                {
                                    font: 'bold 11px Orbitron',
                                    color: '#8ac7ff'
                                }
                            )
                            .setOrigin(1, 0.5)
                            .setInteractive({
                                useHandCursor: true
                            });

                    this.penknifeBulkBuyButton.on(
                        'pointerdown',
                        (
                            _pointer:
                                Phaser.Input.Pointer,
                            _localX: number,
                            _localY: number,
                            event:
                                Phaser.Types.Input.EventData
                        ) => {
                            event.stopPropagation();

                            this.bulkPurchasePenknife(
                                upgrade.cost
                            );
                        }
                    );

                    this.scrollableContainer.add(
                        this.penknifeBulkBuyButton
                    );
                }

                if (
                    this.purchaseCounts
                        .hasOwnProperty(
                            upgrade.name
                        )
                ) {
                    const purchaseCountText =
                        this.add
                            .text(
                                startX +
                                itemWidth -
                                10,
                                itemY + 8,
                                `(${this.purchaseCounts[
                                upgrade.name
                                ] ?? 0
                                }/${this.itemPurchaseLimit})`,
                                {
                                    font: '10px Orbitron',
                                    color: '#ffd84a'
                                }
                            )
                            .setOrigin(1, 0);

                    this.scrollableContainer.add(
                        purchaseCountText
                    );

                    this.buyButtons.push({
                        button: buyButton,
                        cost: upgrade.cost,
                        upgradeName:
                            upgrade.name,
                        purchaseCountText
                    });
                } else if (
                    this.legendaryPurchaseCount
                        .hasOwnProperty(
                            upgrade.name
                        )
                ) {
                    const purchaseCountText =
                        this.add
                            .text(
                                startX +
                                itemWidth -
                                10,
                                itemY + 8,
                                `(${this.legendaryPurchaseCount[
                                upgrade.name
                                ] ?? 0
                                }/${this.legendaryPurchaseLimit})`,
                                {
                                    font: '10px Orbitron',
                                    color: '#ffd84a'
                                }
                            )
                            .setOrigin(1, 0);

                    this.scrollableContainer.add(
                        purchaseCountText
                    );

                    this.buyButtons.push({
                        button: buyButton,
                        cost: upgrade.cost,
                        upgradeName:
                            upgrade.name,
                        purchaseCountText
                    });
                }

                bottomY =
                    itemY +
                    itemHeight +
                    itemGap;
            }
        );

        return bottomY;
    }

    bulkPurchasePenknife(cost: number) {
        const maxPurchases = Math.floor(this.gold / cost);
        if (maxPurchases > 0) {
            this.gold -= maxPurchases * cost;
            this.updateGoldDisplay();
            (this.scene.get('Game') as any).player.damage += maxPurchases;
            this.showPurchaseFeedback(`Bought ${maxPurchases} Penknives! +${maxPurchases} Damage`, '#00ff00');
        }
    }
    toggleShopModal(
        visible: boolean
    ): void {
        if (
            !this.shopModalContainer ||
            !this.shopContentCamera
        ) {
            return;
        }

        this.shopModalContainer.setVisible(
            visible
        );

        this.scrollableContainer.setVisible(
            visible
        );

        this.shopHeaderContainer.setVisible(
            visible
        );

        this.scrollbarTrack.setVisible(
            visible
        );

        this.scrollbarHandle.setVisible(
            visible
        );

        this.shopContentCamera.setVisible(
            visible
        );

        if (visible) {
            this.scrollableContainer.y = 0;

            this.scrollbarHandle.y =
                this.scrollbarTrack.y;
        } else {
            this.hideUpgradeTooltip();
        }
    }

    purchaseUpgrade(upgradeName: string, cost: number, upgradeIcon: string) {
        // if player is dead, don't allow purchase
        if ((this.scene.get('Game') as any).player.currentHealth <= 0) {
            this.showPurchaseFeedback("You are dead! You cannot purchase upgrades", '#ff0000');
            return;
        }
        if (this.gold >= cost) {

            if (this.purchaseCounts.hasOwnProperty(upgradeName)) {
                if (this.purchaseCounts[upgradeName] < this.itemPurchaseLimit) {
                    this.purchaseCounts[upgradeName]++;
                    const item = this.buyButtons.find(item => item.upgradeName === upgradeName);
                    if (item && item.purchaseCountText) {
                        item.purchaseCountText.setText(`(${this.purchaseCounts[upgradeName]}/${this.itemPurchaseLimit})`);
                    }
                } else {
                    this.showPurchaseFeedback(`Limit reached for ${upgradeName}`, '#ff0000');
                    return;
                }
            }

            if (this.legendaryPurchaseCount.hasOwnProperty(upgradeName) && upgradeName !== "Cash") {
                if (this.legendaryPurchaseCount[upgradeName] < this.legendaryPurchaseLimit) {
                    this.legendaryPurchaseCount[upgradeName]++;
                    const item = this.buyButtons.find(item => item.upgradeName === upgradeName);
                    if (item && item.purchaseCountText) {
                        item.purchaseCountText.setText(`(${this.legendaryPurchaseCount[upgradeName]}/${this.legendaryPurchaseLimit})`);
                    }
                } else {
                    this.showPurchaseFeedback(`Limit reached for ${upgradeName}`, '#ff0000');
                    return;
                }
            }

            this.gold -= cost;
            console.log(`Purchased Upgrade: ${upgradeName}`);
            this.updateGoldDisplay();
            this.showPurchaseFeedback(`${upgradeName} Purchased! \n -${cost} Gold`, '#00ff00');
            if (upgradeName === "Penknife") {
                (this.scene.get('Game') as any).player.damage += 1;
            }
            if (upgradeName === "Hunter's Blade") {
                (this.scene.get('Game') as any).player.damage = Math.round((this.scene.get('Game') as any).player.damage * 1.02);
            }
            if (upgradeName === "Heaven's Rain") {
                (this.scene.get('Game') as any).player.maxHealth = Math.round((this.scene.get('Game') as any).player.maxHealth * 1.12);
            }
            if (upgradeName === "Health Potion") {
                const healPercentage = 0.5;
                let healAmount = Math.round((this.scene.get('Game') as any).player.maxHealth * healPercentage);
                healAmount = Math.min(healAmount, (this.scene.get('Game') as any).player.maxHealth - (this.scene.get('Game') as any).player.currentHealth);
                (this.scene.get('Game') as any).player.currentHealth += healAmount;
                (this.scene.get('Game') as any).player.createHealingText(healAmount);
            }
            if (upgradeName === "Energy Gun") {
                (this.scene.get('Game') as any).player.attackSpeed = Math.round((this.scene.get('Game') as any).player.attackSpeed * 1.09 * 100) / 100;
            }
            if (upgradeName === "Quickblade") {
                (this.scene.get('Game') as any).player.attackSpeed = Math.round((this.scene.get('Game') as any).player.attackSpeed * 1.18 * 100) / 100;
            }
            if (upgradeName === "Lightning Core") {
                (this.scene.get('Game') as any).player.speed = Math.round((this.scene.get('Game') as any).player.speed * 1.06);
            }
            if (upgradeName === "Mecha Sneakers") {
                (this.scene.get('Game') as any).player.speed = Math.round((this.scene.get('Game') as any).player.speed * 1.12);
            }
            if (upgradeName === "Cash") {
                this.cash++;
                this.updateCashDisplay();
            }
            if (upgradeName === "Thunderlord Seal") {
                (this.scene.get('Game') as any).player.isImmuneToStorms = true;
            }
            if (upgradeName === "Elixir of Life") {
                (this.scene.get('Game') as any).player.healPercentage *= 3;
            }
            if (upgradeName === "Winter Frost") {
                (this.scene.get('Game') as any).enemies.forEach((enemy: any) => {
                    enemy.isWinterFrosted = true;
                });
                (this.scene.get('Game') as any).isWinterFrostActive = true;
            }
            if (upgradeName === "Treasure Hunter") {
                (this.scene.get('Game') as any).enemies.forEach((enemy: any) => {
                    enemy.goldValue *= 2;
                });
                (this.scene.get('Game') as any).base.goldValue *= 2;
                (this.scene.get('Game') as any).isTreasureHunterActive = true;
            }
            if (upgradeName === "Thunderlord Seal" || upgradeName === "Elixir of Life" || upgradeName === "Winter Frost" || upgradeName === "Treasure Hunter" || upgradeName === "Forbidden Excalibur" || upgradeName === "Soul of the Phoenix" || upgradeName === "Cosmic Scimitar") {
                if (!this.legendaryIcons.some(icon => icon.name === upgradeName)) {
                    const iconX = this.playerSpeedBonusText.x - 180 + (this.legendaryIcons.length * 50);
                    const iconY = this.playerSpeedBonusText.y + 60;
                    const icon = this.add.image(iconX, iconY, upgradeIcon).setScale(0.5).setInteractive({ useHandCursor: true });

                    icon.on('pointerover', () => {
                        this.showUpgradeTooltip(upgradeName, iconX, iconY - 30);
                    }).on('pointerout', () => {
                        this.hideUpgradeTooltip();
                    });

                    // Save icon and its upgrade name for future reference
                    this.legendaryIcons.push({ name: upgradeName, icon: icon });
                }
            }

        } else {
            this.showPurchaseFeedback(`You need ${cost - this.gold} more gold`, '#ff0000');
        }
    }

    showUpgradeTooltip(
        upgradeName: string,
        x: number,
        y: number
    ) {
        this.hideUpgradeTooltip(); // Hide existing tooltip if any
        this.upgradeTooltip = this.add.text(x, y, upgradeName, {
            font: '18px Orbitron',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: {
                left: 5,
                right: 5,
                top: 2,
                bottom: 2
            }
        }).setOrigin(0.5, 1).setDepth(20);
    }

    hideUpgradeTooltip() {
        if (this.upgradeTooltip) {
            this.upgradeTooltip.destroy();
            this.upgradeTooltip = null;
        }
    }

    showPurchaseFeedback(
        message: string,
        color: string = '#ffffff'
    ): void {
        if (this.currentFeedbackText) {
            this.currentFeedbackText.destroy();
            this.currentFeedbackText = null;
        }

        const modalHeight = 560;
        const modalY =
            (this.scale.height - modalHeight) / 2;

        const feedbackX =
            this.scale.width / 2;

        const feedbackY =
            modalY - 18;

        this.currentFeedbackText = this.add
            .text(
                feedbackX,
                feedbackY,
                message,
                {
                    font: 'bold 16px Orbitron',
                    color,
                    backgroundColor: '#101820',
                    align: 'center',

                    padding: {
                        left: 16,
                        right: 16,
                        top: 8,
                        bottom: 8
                    },

                    stroke: '#000000',
                    strokeThickness: 3
                }
            )
            .setOrigin(0.5, 1)
            .setScrollFactor(0)
            .setDepth(5000);

        /*
         * The scrolling-content camera must not render it.
         */
        if (this.shopContentCamera) {
            this.shopContentCamera.ignore(
                this.currentFeedbackText
            );
        }

        this.tweens.add({
            targets: this.currentFeedbackText,

            y: feedbackY - 12,

            alpha: {
                from: 1,
                to: 0
            },

            duration: 1800,
            ease: 'Sine.easeOut',

            onComplete: () => {
                this.currentFeedbackText?.destroy();
                this.currentFeedbackText = null;
            }
        });
    }

    updateTimer(currentTime: number) {
        this.currentTime = currentTime;
        const fillWidth = Math.max(0, (this.currentTime / this.stormMaxTime) * this.timerBarBackground.width);
        this.timerBarFill.width = fillWidth;

        if (this.currentTime / this.stormMaxTime <= 0.5) {
            this.timerBarFill.setFillStyle(0xff0000); // red
            if (!this.flashing) {
                this.flashing = true;
                this.startFlashing();
            }
        } else {
            this.timerBarFill.setFillStyle(0x00ff00);
            if (this.flashing) {
                this.flashing = false;
                this.stopFlashing();
            }
        }

    }

    startFlashing() {
        if (this.flashingTween) {
            this.flashingTween.restart();
        } else {
            this.flashingTween = this.tweens.add({
                targets: this.timerBarFill,
                alpha: { from: 1, to: 0.2 },
                ease: 'Linear',
                duration: 500,
                repeat: -1,
                yoyo: true
            });
        }
    }

    stopFlashing() {
        if (this.flashingTween) {
            this.flashingTween.stop();
            this.timerBarFill.alpha = 1;
            this.flashingTween = null;
        }
    }

    updateCatastropheText(isStormLaunching: boolean) {
        if (isStormLaunching) {
            const stormDamage = (this.scene.get('Game') as any).catastrophe.damage;
            this.approachingText.setText(`Storm launching!\nIncoming Damage: ${stormDamage}`);
        } else {
            this.approachingText.setText("Catastrophe approaches");
        }
    }

    updateScore(amount: number) {
        if ((this.scene.get('Game') as any).player.isDead) return;
        this.score += amount * this.multiplier;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    createBaseRebuildTimer() {
        this.baseRebuildText = this.add.text(this.scale.width / 2, 150, '', {
            font: '20px Orbitron',
            color: '#000'
        }).setOrigin(0.5, 0).setScrollFactor(0).setVisible(false);

        this.baseRebuildGraphics = this.add.graphics().setScrollFactor(0).setVisible(false);
    }

    updateBaseRebuildUI(rebuildProgress: number) {
        this.baseRebuildText.setVisible(true);
        this.baseRebuildGraphics.setVisible(true);

        this.baseRebuildText.setText('REBUILDING BASE...');

        this.baseRebuildGraphics.clear();
        this.baseRebuildGraphics.fillStyle(0x000000, 0.5);
        this.baseRebuildGraphics.fillRect(this.scale.width / 2 - 150, 200, 300, 30);
        this.baseRebuildBarFillWidth = Math.max(0, (1 - rebuildProgress) * 300);
        this.baseRebuildBarFillWidth = Math.min(this.baseRebuildBarFillWidth, 300);

        this.baseRebuildGraphics.fillStyle(0x00ff00, 1);
        // this.baseRebuildGraphics.fillRoundedRect(this.scale.width / 2 - 150, 200, this.baseRebuildBarFillWidth + 10, 30, 10);
        this.baseRebuildGraphics.fillRect(this.scale.width / 2 - 150, 200, this.baseRebuildBarFillWidth, 30);
    }

    resetBaseRebuildUI() {
        this.baseRebuilding = false;
        this.baseRebuildText.setText('');
        this.baseRebuildGraphics.clear();
    }

    override update() {
        if (!this.timerStarted) return;
        this.updateMultiplierFill();
        this.displayPlayerStats(this.scale.width - 350, 500);
        if (this.strengthenedSquareText) {

            const enemies =
                (this.scene.get('Game') as any)
                    .enemies;

            if (enemies.length > 0) {

                const highestStrengthLevel =
                    Math.max(
                        ...enemies.map(
                            (e: any) =>
                                e.strengthenLevel ?? 1
                        )
                    );

                this.strengthenedSquareText.setText(
                    `${highestStrengthLevel}`
                );
            }
        }
        if (this.penknifeBulkBuyButton) {
            const canAffordBulkBuy = this.gold >= 55;
            this.penknifeBulkBuyButton.setText(canAffordBulkBuy ? 'BULK BUY' : '');
        }
        this.buyButtons.forEach((item) => {
            if (item.cost === 9999) return;
            if (this.purchaseCounts.hasOwnProperty(item.upgradeName) && this.purchaseCounts[item.upgradeName] >= this.itemPurchaseLimit) {
                item.button.setText('Limit reached').setStyle({ color: '#FF0000' });
                return;
            }
            if (this.legendaryPurchaseCount.hasOwnProperty(item.upgradeName) && this.legendaryPurchaseCount[item.upgradeName] >= this.legendaryPurchaseLimit) {
                item.button.setText('Limit reached').setStyle({ color: '#FF0000' });
                return;
            }
            if (this.gold >= item.cost) {
                item.button.setText('BUY').setStyle({ color: '#4CAF50' });
            } else {
                item.button.setText('Not enough gold').setStyle({ color: '#FF0000' });
            }
        });
    }

    updateMultiplierFill() {
        if (!this.timerStarted || this.isMultiplierPaused) return;
        if (this.multiplier === this.multiplierMin) {
            this.multiplierBarFill.width = 92; // Keep the bar full
            return; // Stop further processing
        }
        const currentTime = (this.scene.get('Game') as any).activeGameTime;
        const elapsedTime = currentTime - this.lastMultiplierUpdate;
        const remainingTime = this.multiplierDuration - elapsedTime;
        const fillPercentage = remainingTime / this.multiplierDuration;
        const newWidth = fillPercentage * 92;
        this.multiplierBarFill.width = newWidth;

        // Check if it's time to decrement the multiplier
        if (remainingTime <= 0) {
            if (this.multiplier > this.multiplierMin) {
                this.multiplier -= 0.5; // Decrement by 0.5
                this.multiplier = Math.max(this.multiplier, this.multiplierMin); // Ensure it doesn't go below 0.5
                this.multiplierText.setText(`x${this.multiplier}`);
                this.lastMultiplierUpdate = currentTime;
            }

            // If the multiplier is at its minimum, reset the fill width to full
            if (this.multiplier === this.multiplierMin) {
                this.multiplierBarFill.width = 92;
            }
        }
    }

    resetMultiplier() {
        this.multiplier = 5;
        this.multiplierText.setText(`x${this.multiplier}`);
        this.isMultiplierPaused = false;

        this.multiplierBarFill.width = 92;

        this.lastMultiplierUpdate = (this.scene.get('Game') as any).activeGameTime;
    }

    pauseMultiplier(): void {
        this.isMultiplierPaused = true;
    }


    updateStrengthenTimer(currentTime: number) {
        this.strengthenCurrentTime = currentTime;
        const fillWidth = Math.max(0, (this.strengthenCurrentTime / this.strengthenMaxTime) * this.strengthenBarBackground.width);
        this.strengthenBarFill.width = fillWidth;
        if (this.strengthenCurrentTime / this.strengthenMaxTime <= 0.5) {
            this.strengthenBarFill.setFillStyle(0xff0000); // red
        } else {
            this.strengthenBarFill.setFillStyle(0x00ff00);
        }
    }

    drawHexagon() {
        this.strengthenedSquare.clear();
        this.strengthenedSquare.fillStyle('#000', 1); // black, 100% opacity

        // Draw a hexagon
        const radius = 15;
        this.strengthenedSquare.beginPath();
        for (let i = 0; i < 6; i++) {
            // calculate vertex positions
            const x = radius * Math.cos(2 * Math.PI * i / 6 - Math.PI / 2);
            const y = radius * Math.sin(2 * Math.PI * i / 6 - Math.PI / 2);
            if (i === 0) this.strengthenedSquare.moveTo(x, y);
            else this.strengthenedSquare.lineTo(x, y);
        }
        this.strengthenedSquare.closePath();
        this.strengthenedSquare.fill();
    }

    createGameOverScreen() {

        const overlay =
            this.add.rectangle(
                0,
                0,
                this.scale.width,
                this.scale.height,
                0x000000,
                0.85
            )
                .setOrigin(0);

        const title =
            this.add.text(
                this.scale.width / 2,
                200,
                'GAME OVER',
                {
                    fontSize: '72px',
                    color: '#ff0000'
                }
            )
                .setOrigin(0.5);

        const retryButton =
            this.add.text(
                this.scale.width / 2,
                350,
                'Retry',
                {
                    fontSize: '32px'
                }
            )
                .setOrigin(0.5)
                .setInteractive();

        const mainMenuButton =
            this.add.text(
                this.scale.width / 2,
                430,
                'Main Menu',
                {
                    fontSize: '32px'
                }
            )
                .setOrigin(0.5)
                .setInteractive();

        retryButton.on(
            'pointerdown',
            () => this.restartGameScene()
        );

        mainMenuButton.on(
            'pointerdown',
            () => this.goToMainMenu()
        );
    }

    createStyledButton(x: number, y: number, text: string, backgroundColor: string, callback: () => void) {
        let button = this.add.text(x, y, text, {
            font: '28px Orbitron',
            color: '#ffffff',
            padding: { x: 20, y: 10 },
            backgroundColor: backgroundColor
        })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', callback);

        button.setStroke('#000000', 4);
        button.setShadow(2, 2, 'rgba(0,0,0,0.5)', 2, true, true);

        return button;
    }

    restartGameScene(): void {
        const gameScene =
            this.scene.get('Game') as any;

        if (this.scene.isPaused('Game')) {
            this.scene.resume('Game');
        }

        if (gameScene) {
            gameScene.isGamePaused = false;
        }

        this.closePauseScreen();

        this.scene.stop('BattleUI');

        this.scene.stop('Game');
        this.scene.start('Game');
    }

    goToMainMenu() {

        this.scene.stop('BattleUI');

        this.scene.stop('Game');

        this.scene.start('MainMenu');
    }

    pauseGame(): void {
        const gameScene =
            this.scene.get('Game') as any;

        if (
            this.pauseContainer &&
            this.pauseContainer.active
        ) {
            return;
        }

        console.log('pausing game');

        this.scene.pause('Game');
        gameScene.isGamePaused = true;

        this.createPauseScreen();
    }

    createPauseScreen(): void {
        if (
            this.pauseContainer &&
            this.pauseContainer.active
        ) {
            return;
        }

        const width = this.scale.width;
        const height = this.scale.height;

        this.pauseContainer = this.add
            .container(0, 0)
            .setDepth(3000);

        const overlay = this.add
            .rectangle(
                0,
                0,
                width,
                height,
                0x000000,
                0.78
            )
            .setOrigin(0, 0)
            .setInteractive();

        overlay.on(
            'pointerdown',
            (
                _pointer: Phaser.Input.Pointer,
                _localX: number,
                _localY: number,
                event: Phaser.Types.Input.EventData
            ) => {
                event.stopPropagation();
            }
        );

        const panelWidth = 420;
        const panelHeight = 360;

        const panelX = width / 2;
        const panelY = height / 2;

        const panel = this.add
            .rectangle(
                panelX,
                panelY,
                panelWidth,
                panelHeight,
                0x121b24,
                0.98
            )
            .setStrokeStyle(
                3,
                0x50c8ff,
                1
            );

        const title = this.add
            .text(
                panelX,
                panelY - 125,
                'PAUSED',
                {
                    font: 'bold 48px Orbitron',
                    color: '#ffffff'
                }
            )
            .setOrigin(0.5);

        const resumeButton =
            this.createStyledButton(
                panelX,
                panelY - 35,
                'Resume',
                '#247f4c',
                () => {
                    this.closePauseScreen();
                    this.scene.resume('Game');

                    const gameScene =
                        this.scene.get('Game') as any;

                    gameScene.isGamePaused = false;
                }
            );

        const retryButton =
            this.createStyledButton(
                panelX,
                panelY + 45,
                'Retry',
                '#1d6f94',
                () => {
                    this.restartGameScene();
                }
            );

        const mainMenuButton =
            this.createStyledButton(
                panelX,
                panelY + 125,
                'Main Menu',
                '#8f2d2d',
                () => {
                    this.closePauseScreen();
                    this.goToMainMenu();
                }
            );

        this.pauseContainer.add([
            overlay,
            panel,
            title,
            resumeButton,
            retryButton,
            mainMenuButton
        ]);
    }

    private closePauseScreen(): void {
        if (!this.pauseContainer) {
            return;
        }

        this.pauseContainer.destroy(true);
        this.pauseContainer = null;
    }

    resumeGame() {
        this.pauseContainer.setVisible(false);
        this.scene.resume('Game');
        (this.scene.get('Game') as any).isGamePaused = false;
    }

    async saveGameData() {
        const gameData = {
            incomingCash: this.cash,
            score: this.score,
            latestBaseLevel: (this.scene.get('Game') as any).base.baseLevel
        };
        try {
            const response = await fetch('/save-game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(gameData),
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return console.log('Success:', data);
        } catch (error) {
            return console.error('Error:', error);
        }
    }


}

