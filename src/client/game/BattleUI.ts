// import musicManager from './music_manager.js';
const HUD_HEIGHT = 110;
import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import BattleShop from './BattleShop';

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

    playerHealthBaseText: any;
    playerHealthBonusText: any;

    playerHealthText: any;
    playerDamageText: any;
    playerAttackSpeedText: any;
    playerSpeedText: any;

    playerDamageBonusText: any;
    playerAttackSpeedBonusText: any;
    playerSpeedBonusText: any;

    gameDataSaved: boolean;

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


    inputBlocker: any;
    gameOverContainer: any;

    pauseContainer: any;

    fireballTimer: number;
    cashIcon: any;
    shop: BattleShop;
    constructor() {
        super({ key: 'BattleUI', active: false });
        this.shop = new BattleShop(this);
        this.gold = 200000;
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
        this.playerHealthBaseText = null;
        this.playerHealthBonusText = null;
        this.gameDataSaved = false;
    }

    resetState() {
        console.log('State resetted');
        this.gold = 200000;
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

        this.playerHealthBaseText = null;
        this.playerHealthBonusText = null;
        this.gameDataSaved = false;


        this.shop.reset();
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
        this.shop.updateGoldDisplay();
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
                0x29445c,
                0.38
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

        const sectionGap = 10;

        const leftSectionX = 12;
        const leftSectionWidth = 430;

        const rightSectionWidth = 280;
        const rightSectionX =
            width -
            rightSectionWidth -
            12;

        const centerSectionX =
            leftSectionX +
            leftSectionWidth +
            sectionGap;

        const centerSectionWidth =
            rightSectionX -
            centerSectionX -
            sectionGap;


        // Section backgrounds
        this.add
            .rectangle(
                leftSectionX,
                sectionY,
                leftSectionWidth,
                sectionHeight,
                0x31536d,
                0.58
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
                0x31536d,
                0.58
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
                0x31536d,
                0.58
            )
            .setOrigin(0, 0)
            .setStrokeStyle(1, 0x72b4dc,
                0.75)
            .setScrollFactor(0)
            .setDepth(HUD_DEPTH + 1);

        const playerIconX =
            leftSectionX + 12;

        const playerTextX =
            leftSectionX + 78;

        const playerSectionRight =
            leftSectionX +
            leftSectionWidth -
            12;

        const leftStatX =
            playerTextX;

        const leftBonusX =
            playerTextX + 112;

        const rightStatX =
            playerTextX + 175;

        const rightBonusX =
            playerSectionRight;

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
                leftStatX,
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
                playerSectionRight,
                39,
                '',
                {
                    font: '11px Orbitron',
                    color: '#31b8ff'
                }
            )
            .setOrigin(1, 0)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.playerDamageText = this.add
            .text(
                leftStatX,
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
                leftBonusX,
                64,
                '',
                {
                    font: '10px Orbitron',
                    color: '#31b8ff'
                }
            )
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.playerAttackSpeedText = this.add
            .text(
                rightStatX,
                64,
                'Attack Speed: --',
                {
                    font: '12px Orbitron',
                    color: '#ffffff'
                }
            )
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.playerAttackSpeedBonusText = this.add
            .text(
                rightBonusX,
                64,
                '',
                {
                    font: '10px Orbitron',
                    color: '#31b8ff'
                }
            )
            .setOrigin(1, 0)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.playerSpeedText = this.add
            .text(
                leftStatX,
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
                leftBonusX,
                87,
                '',
                {
                    font: '10px Orbitron',
                    color: '#31b8ff'
                }
            )
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);



        const timerIconX =
            centerSectionX + 22;

        const timerBarX =
            centerSectionX + 44;

        const multiplierAreaWidth = 96;

        const timerBarWidth =
            Math.max(
                130,
                centerSectionWidth -
                multiplierAreaWidth -
                74
            );

        const timerBarHeight = 10;

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
            timerBarX + timerBarWidth + 15;

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

        const multiplierBarWidth = 76;

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

        const rightSectionCenterX =
            rightSectionX +
            rightSectionWidth / 2;

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

        this.shopIcon = this.add
            .image(
                rightContentX + 10,
                52,
                'gold'
            )
            .setScale(0.34)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.goldText = this.add
            .text(
                rightContentX + 27,
                43,
                String(this.gold),
                {
                    font: '13px Orbitron',
                    color: '#ffd84a'
                }
            )
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.cashIcon = this.add
            .image(
                rightContentX + 103,
                52,
                'cash'
            )
            .setScale(0.34)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        this.cashText = this.add
            .text(
                rightContentX + 120,
                43,
                String(this.cash),
                {
                    font: '13px Orbitron',
                    color: '#82e6ff'
                }
            )
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH);

        const shopButtonWidth = 105;
        const shopButtonHeight = 26;

        this.shopButtonContainer = this.add
            .container(
                rightSectionCenterX - 35,
                84
            )
            .setSize(
                shopButtonWidth,
                shopButtonHeight
            )
            .setScrollFactor(0)
            .setDepth(CONTENT_DEPTH + 1)
            .setInteractive({
                useHandCursor: true
            });

        const shopButtonBackground = this.add
            .rectangle(
                0,
                0,
                shopButtonWidth,
                shopButtonHeight,
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
                    font: 'bold 13px Orbitron',
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
                this.shop.open();
            }
        );

        const pauseButton = this.add
            .text(
                rightSectionX +
                rightSectionWidth -
                30,
                84,
                'Ⅱ',
                {
                    font: 'bold 18px Orbitron',
                    color: '#ffffff',
                    backgroundColor: '#a92e2e',
                    padding: {
                        x: 8,
                        y: 5
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
        this.shop.update();
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

