// import musicManager from './music_manager.js';
const HUD_HEIGHT = 110;
import { Scene } from "phaser";
import * as Phaser from "phaser";
import BattleShop from "./BattleShop";
import TutorialOverlay from "./TutorialOverlay";
import type {
  ApiErrorResponse,
  SubmitHighScoreResponse,
} from "../../shared/api";
import audioManager from "../scenes/AudioManager";

declare global {
  interface Window {
    fetchHighestScore?: () => void;
  }
}
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
  strengthenLabelText: any;
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

  gameOverScoreStatus: Phaser.GameObjects.Text | null;

  private finalScore = 0;
  private finalBaseSeen = 1;
  private isNewHighScore = false;
  private scoreSubmissionPromise: Promise<void> | null = null;
  pauseContainer: any;

  private gameOverResultTitle: Phaser.GameObjects.Text | null = null;

  private gameOverResultRows: Phaser.GameObjects.Container | null = null;

  fireballTimer: number;
  cashIcon: any;
  shop: BattleShop;
  tutorial: TutorialOverlay;
  legendaryIconsContainer: Phaser.GameObjects.Container | null = null;

  // fpsText: Phaser.GameObjects.Text | null;
  // private lastFpsUpdateTime = 0;

  constructor() {
    super({ key: "BattleUI", active: false });
    this.shop = new BattleShop(this);
    this.gold = 20000;
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
    this.gameOverScoreStatus = null;
    this.finalScore = 0;
    this.strengthenLabelText = null;
    this.tutorial = new TutorialOverlay(this);
    // this.fpsText = null;
  }

  resetState(): void {
    console.log("State reset");

    const gameScene = this.scene.get("Game") as any;

    const communityGoldBonus =
      !this.isKingMode() && Number.isFinite(gameScene?.communityGoldBonus)
        ? Math.max(0, Math.floor(gameScene.communityGoldBonus))
        : 0;

    this.gold = 20000 + communityGoldBonus;
    this.score = 0;
    this.scoreText = null;
    this.multiplier = 5;
    this.multiplierMin = 0.5;
    this.multiplierDuration = this.isKingMode() ? 30000 : 12000;
    this.lastMultiplierUpdate = 0;
    this.timerStarted = false;
    this.baseRebuildText = null;
    this.baseRebuildBarBackground = null;
    this.baseRebuildBarFill = null;
    this.baseRebuilding = false;
    this.isMultiplierPaused = false;
    this.cash = 0;
    this.strengthenLabelText = null;
    this.playerHealthText = null;
    this.playerDamageText = null;
    this.playerAttackSpeedText = null;
    this.playerSpeedText = null;
    this.playerHealthBonusText = null;
    this.playerDamageBonusText = null;
    this.playerAttackSpeedBonusText = null;
    this.playerSpeedBonusText = null;
    this.playerIcon = null;
    this.playerNameText = null;

    this.gameDataSaved = false;
    this.gameOverScoreStatus = null;

    this.finalScore = 0;
    this.finalBaseSeen = 1;
    this.isNewHighScore = false;
    this.scoreSubmissionPromise = null;
    this.gameOverResultTitle = null;
    this.gameOverResultRows = null;
    this.gameOverContainer = null;
    this.tutorial.reset();
    this.shop.reset();
    this.legendaryIconsContainer = null;
    // this.fpsText = null;
    // this.lastFpsUpdateTime = 0;
  }

  private isKingMode(): boolean {
    const gameScene = this.scene.get("Game") as any;

    return gameScene?.gameMode === "king";
  }

  private getKingDayLabel(): string {
    const gameScene = this.scene.get("Game") as any;

    const kingDay =
      typeof gameScene?.kingDay === "string" ? gameScene.kingDay : "daily";

    return kingDay.toUpperCase();
  }

  private getKingName(): string {
    const gameScene = this.scene.get("Game") as any;

    return typeof gameScene?.kingName === "string"
      ? gameScene.kingName
      : `${this.getKingDayLabel()} KING`;
  }

  private getKingRewardName(): string {
    const gameScene = this.scene.get("Game") as any;

    return typeof gameScene?.kingRewardName === "string"
      ? gameScene.kingRewardName
      : "KING RAIDER";
  }

  startMultiplierTimer() {
    if (!this.timerStarted) {
      this.timerStarted = true;
      this.lastMultiplierUpdate = (
        this.scene.get("Game") as any
      ).activeGameTime;
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
      this.cashText.setText(String(this.cash));
    }
  }

  create(): void {
    this.resetState();

    const width = this.scale.width;
    const gameScene = this.scene.get("Game") as any;
    const player = gameScene.player;
    const enemy = gameScene.enemies[0];

    const HUD_DEPTH = 100;
    const CONTENT_DEPTH = 102;

    const hudBackground = this.add
      .rectangle(0, 0, width, HUD_HEIGHT, 0x29445c, 0.38)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH)
      .setInteractive();

    hudBackground.on(
      "pointerdown",
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
      },
    );

    // Bottom border
    this.add
      .rectangle(0, HUD_HEIGHT - 3, width, 3, 0x31b8ff, 0.55)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH + 1);

    const sectionY = 8;
    const sectionHeight = HUD_HEIGHT - 18;

    const sectionGap = 10;

    const leftSectionX = 12;
    const leftSectionWidth = 430;

    const centerSectionX = leftSectionX + leftSectionWidth + sectionGap;

    const centerSectionWidth = 430;

    const rightSectionX = centerSectionX + centerSectionWidth + sectionGap;

    const rightSectionWidth = width - rightSectionX - 12;

    // Section backgrounds
    this.add
      .rectangle(
        leftSectionX,
        sectionY,
        leftSectionWidth,
        sectionHeight,
        0x31536d,
        0.58,
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
        0.58,
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
        0.58,
      )
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x72b4dc, 0.75)
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH + 1);

    const playerIconX = leftSectionX + 12;

    const playerTextX = leftSectionX + 78;

    const playerSectionRight = leftSectionX + leftSectionWidth - 12;

    const leftStatX = playerTextX;

    const leftBonusX = playerTextX + 112;

    const rightStatX = playerTextX + 175;

    const rightBonusX = playerSectionRight;

    const playerIconSize = 54;

    this.playerIcon = this.add
      .image(playerIconX, sectionY + sectionHeight / 2, player.icon)
      .setOrigin(0, 0.5)
      .setDisplaySize(playerIconSize, playerIconSize)
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    this.playerNameText = this.add
      .text(playerTextX, 15, player.name, {
        font: "bold 15px Orbitron",
        color: "#ffffff",
      })
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    this.playerHealthText = this.add
      .text(leftStatX, 39, "Health: --/--", {
        font: "13px Orbitron",
        color: "#7dff8b",
      })
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    this.playerHealthBonusText = this.add
      .text(playerSectionRight, 39, "", {
        font: "11px Orbitron",
        color: "#31b8ff",
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    this.playerDamageText = this.add
      .text(leftStatX, 64, "Damage: --", {
        font: "12px Orbitron",
        color: "#ffffff",
      })
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    this.playerDamageBonusText = this.add
      .text(leftBonusX, 64, "", {
        font: "10px Orbitron",
        color: "#31b8ff",
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    this.playerAttackSpeedText = this.add
      .text(rightStatX, 64, "Attack Speed: --", {
        font: "12px Orbitron",
        color: "#ffffff",
      })
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    this.playerAttackSpeedBonusText = this.add
      .text(rightBonusX, 64, "", {
        font: "10px Orbitron",
        color: "#31b8ff",
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    this.playerSpeedText = this.add
      .text(leftStatX, 87, "Speed: --", {
        font: "12px Orbitron",
        color: "#ffffff",
      })
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    this.playerSpeedBonusText = this.add
      .text(leftBonusX, 87, "", {
        font: "10px Orbitron",
        color: "#31b8ff",
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    const timerIconX = centerSectionX + 22;

    const timerBarX = centerSectionX + 44;

    const timerBarWidth = 235;

    const timerBarHeight = 10;

    const multiplierAreaWidth = 105;

    const multiplierX =
      centerSectionX + centerSectionWidth - multiplierAreaWidth / 2 - 6;
    // Catastrophe row
    this.catastropheIcon = this.add
      .image(timerIconX, 29, "catastrophe")
      .setScale(0.25)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    this.approachingText = this.add
      .text(timerBarX, 14, "Catastrophe", {
        font: "12px Orbitron",
        color: "#ffffff",
      })
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    this.timerBarBackground = this.add
      .rectangle(timerBarX, 36, timerBarWidth, timerBarHeight, 0xffffff, 0.18)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    this.timerBarFill = this.add
      .rectangle(timerBarX, 36, 0, timerBarHeight, 0x00ff66)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH + 1);

    this.stormMaxTime = gameScene.catastrophe.stormInterval;

    this.currentTime = 0;

    // Strengthen row
    this.strengthenIcon = this.add
      .image(timerIconX, 77, "strengthen")
      .setScale(0.25)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    this.strengthenLabelText = this.add
      .text(timerBarX, 62, "Enemy strengthens", {
        font: "12px Orbitron",
        color: "#ffffff",
      })
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    this.strengthenBarBackground = this.add
      .rectangle(timerBarX, 84, timerBarWidth, timerBarHeight, 0xffffff, 0.18)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    this.strengthenBarFill = this.add
      .rectangle(timerBarX, 84, 0, timerBarHeight, 0xff3c3c)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH + 1);

    this.strengthenMaxTime = enemy?.enemyStrengthenInterval ?? 1;

    this.strengthenCurrentTime = 0;

    // Strength level hexagon
    this.strengthenedSquare = this.add.graphics();

    const strengthenLevelX = timerBarX + timerBarWidth + 15;

    const strengthenLevelY = 84 + timerBarHeight / 2;

    this.strengthenedSquareContainer = this.add
      .container(strengthenLevelX, strengthenLevelY)
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH + 1);

    this.drawHexagon();

    this.strengthenedSquareContainer.add(this.strengthenedSquare);

    this.strengthenedSquareText = this.add
      .text(0, 0, "1", {
        font: "13px Orbitron",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.strengthenedSquareContainer.add(this.strengthenedSquareText);

    if (this.isKingMode()) {
      this.strengthenIcon.setVisible(false);
      this.strengthenLabelText.setVisible(false);
      this.strengthenBarBackground.setVisible(false);
      this.strengthenBarFill.setVisible(false);
      this.strengthenedSquareContainer.setVisible(false);
    }

    // Multiplier title
    this.add
      .text(multiplierX, 14, "SCORE MULTIPLIER", {
        font: "10px Orbitron",
        color: "#b9c8d6",
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    this.multiplierText = this.add
      .text(multiplierX, 31, `x${this.multiplier}`, {
        font: "bold 18px Orbitron",
        color: "#ffe866",
      })
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
        0.18,
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
        0xffd900,
      )
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH + 1);

    this.lastMultiplierUpdate = gameScene.activeGameTime;

    const rightContentX = rightSectionX + 14;

    this.legendaryIconsContainer = this.add
      .container(rightSectionX + 220, 43)
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH + 2);

    const rightSectionCenterX = rightSectionX + rightSectionWidth / 2;

    this.scoreText = this.add
      .text(rightContentX, 16, this.isKingMode() ? "KING BATTLE" : "Score: 0", {
        font: "bold 15px Orbitron",
        color: "#ffffff",
      })
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    this.shopIcon = this.add
      .image(rightContentX + 10, 52, "gold")
      .setScale(0.25)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    this.goldText = this.add
      .text(rightContentX + 27, 43, String(this.gold), {
        font: "13px Orbitron",
        color: "#ffd84a",
      })
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    this.cashIcon = this.add
      .image(rightContentX + 103, 52, "cash")
      .setScale(0.25)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    this.cashText = this.add
      .text(rightContentX + 120, 43, String(this.cash), {
        font: "13px Orbitron",
        color: "#82e6ff",
      })
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH);

    const shopButtonWidth = 120;
    const shopButtonHeight = 26;

    this.shopButtonContainer = this.add
      .container(rightSectionX + 80, 84)
      .setSize(shopButtonWidth, shopButtonHeight)
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH + 1)
      .setInteractive({
        useHandCursor: true,
      });

    audioManager.addButtonSound(this.shopButtonContainer);

    const shopButtonBackground = this.add
      .rectangle(0, 0, shopButtonWidth, shopButtonHeight, 0x1d6f94, 1)
      .setStrokeStyle(2, 0x63d5ff);

    this.shopText = this.add
      .text(0, 0, "SHOP", {
        font: "bold 13px Orbitron",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.shopButtonContainer.add([shopButtonBackground, this.shopText]);

    this.shopButtonContainer.on(
      "pointerdown",
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();

        if (this.isKingMode()) {
          return;
        }

        this.shop.open();
      },
    );

    if (this.isKingMode()) {
      this.shopButtonContainer.disableInteractive();
      this.shopButtonContainer.setAlpha(0.45);

      this.shopText.setText("SHOP (Disabled)");
    }

    const utilityY = 84;

    const utilityRight = rightSectionX + rightSectionWidth - 14;

    const controlHeight = 28;

    const pauseWidth = 34;
    const muteWidth = 38;
    // const fpsWidth = 72;

    const controlGap = 7;

    const pauseX = utilityRight - pauseWidth / 2;

    const muteX = pauseX - pauseWidth / 2 - controlGap - muteWidth / 2;

    // const fpsX = muteX - muteWidth / 2 - controlGap - fpsWidth / 2;

    // const fpsBackground = this.add
    //   .rectangle(fpsX, utilityY, fpsWidth, controlHeight, 0x101a22, 0.92)
    //   .setStrokeStyle(1, 0x44758d, 0.9)
    //   .setScrollFactor(0)
    //   .setDepth(CONTENT_DEPTH + 1);

    // this.fpsText = this.add
    //   .text(fpsX, utilityY, "FPS: --", {
    //     font: "bold 11px monospace",
    //     color: "#7dff8b",
    //   })
    //   .setOrigin(0.5)
    //   .setScrollFactor(0)
    //   .setDepth(CONTENT_DEPTH + 2);

    audioManager.createMuteButton(this, muteX, utilityY, CONTENT_DEPTH + 2);

    const pauseButton = this.add
      .text(pauseX, utilityY, "Ⅱ", {
        font: "bold 16px Orbitron",
        color: "#ffffff",
        backgroundColor: "#8f3036",

        fixedWidth: pauseWidth,
        fixedHeight: controlHeight,

        align: "center",

        padding: {
          top: 5,
        },
      })
      .setOrigin(0.5)
      .setStroke("#ff737b", 1)
      .setScrollFactor(0)
      .setDepth(CONTENT_DEPTH + 2)
      .setInteractive({
        useHandCursor: true,
      });

    audioManager.addButtonSound(pauseButton);

    pauseButton.on("pointerover", () => {
      pauseButton.setScale(1.05);
    });

    pauseButton.on("pointerout", () => {
      pauseButton.setScale(1);
    });

    pauseButton.on(
      "pointerdown",
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();

        pauseButton.setScale(0.95);

        this.pauseGame();
      },
    );

    pauseButton.on("pointerup", () => {
      pauseButton.setScale(1.05);
    });

    this.flashing = false;
    this.flashingTween = null;

    this.createBaseRebuildTimer();
    this.startMultiplierTimer();
    this.displayPlayerStats();
    this.time.delayedCall(0, () => {
      const gameScene = this.scene.get("Game") as any;

      if (gameScene.shouldShowTutorial) {
        this.tutorial.start();
      }
    });
  }

  hasHealthBelowThreshold(currentHealth: number, maxHealth: number): boolean {
    const threshold = 0.2;
    return currentHealth / maxHealth < threshold;
  }

  displayPlayerStats(): void {
    const gameScene = this.scene.get("Game") as any;

    const player = gameScene.player;

    if (!player) {
      console.error("[BattleUI] Game player does not exist.");

      return;
    }

    const {
      originalHealth,
      currentHealth,
      maxHealth,

      originalDamage,
      damage,

      originalAttackSpeed,
      attackSpeed,

      originalSpeed,
      speed,
    } = player;

    const statsAreValid =
      Number.isFinite(originalHealth) &&
      Number.isFinite(currentHealth) &&
      Number.isFinite(maxHealth) &&
      Number.isFinite(originalDamage) &&
      Number.isFinite(damage) &&
      Number.isFinite(originalAttackSpeed) &&
      Number.isFinite(attackSpeed) &&
      Number.isFinite(originalSpeed) &&
      Number.isFinite(speed);

    if (!statsAreValid) {
      console.error("[BattleUI] Invalid player stats.", player);

      return;
    }

    const bonusHealth = maxHealth - originalHealth;

    const bonusDamage = damage - originalDamage;

    const bonusAttackSpeed =
      Math.round((attackSpeed - originalAttackSpeed) * 100) / 100;

    const bonusSpeed = speed - originalSpeed;

    this.playerHealthText.setText(`Health: ${currentHealth}/${maxHealth}`);

    this.playerHealthText.setColor(
      this.hasHealthBelowThreshold(currentHealth, maxHealth)
        ? "#ff0000"
        : "#7dff8b",
    );

    this.playerDamageText.setText(`Damage: ${damage}`);

    this.playerAttackSpeedText.setText(`Attack Speed: ${attackSpeed}`);

    this.playerSpeedText.setText(`Speed: ${speed}`);

    this.playerHealthBonusText.setText(
      bonusHealth > 0 ? `(+${bonusHealth})` : "",
    );

    this.playerDamageBonusText.setText(
      bonusDamage > 0 ? `(+${bonusDamage})` : "",
    );

    this.playerAttackSpeedBonusText.setText(
      bonusAttackSpeed > 0 ? `(+${bonusAttackSpeed})` : "",
    );

    this.playerSpeedBonusText.setText(bonusSpeed > 0 ? `(+${bonusSpeed})` : "");
  }

  updateTimer(currentTime: number) {
    this.currentTime = currentTime;
    const fillWidth = Math.max(
      0,
      (this.currentTime / this.stormMaxTime) * this.timerBarBackground.width,
    );
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
        ease: "Linear",
        duration: 500,
        repeat: -1,
        yoyo: true,
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
      const stormDamage = (this.scene.get("Game") as any).catastrophe.damage;
      this.approachingText.setText(
        `Storm launching!\nIncoming Damage: ${stormDamage}`,
      );
    } else {
      this.approachingText.setText("Catastrophe approaches");
    }
  }

  updateScore(amount: number): void {
    const gameScene = this.scene.get("Game") as any;

    if (this.isKingMode() || gameScene.player?.isDead) {
      return;
    }

    this.score += amount * this.multiplier;

    this.scoreText.setText(`Score: ${this.score}`);
  }

  createBaseRebuildTimer() {
    this.baseRebuildText = this.add
      .text(this.scale.width / 2, 150, "", {
        font: "20px Orbitron",
        color: "#000",
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setVisible(false);

    this.baseRebuildGraphics = this.add
      .graphics()
      .setScrollFactor(0)
      .setVisible(false);
  }

  updateBaseRebuildUI(rebuildProgress: number) {
    this.baseRebuildText.setVisible(true);
    this.baseRebuildGraphics.setVisible(true);

    this.baseRebuildText.setText("REBUILDING BASE...");

    this.baseRebuildGraphics.clear();
    this.baseRebuildGraphics.fillStyle(0x000000, 0.5);
    this.baseRebuildGraphics.fillRect(this.scale.width / 2 - 150, 200, 300, 30);
    this.baseRebuildBarFillWidth = Math.max(0, (1 - rebuildProgress) * 300);
    this.baseRebuildBarFillWidth = Math.min(this.baseRebuildBarFillWidth, 300);

    this.baseRebuildGraphics.fillStyle(0x00ff00, 1);
    // this.baseRebuildGraphics.fillRoundedRect(this.scale.width / 2 - 150, 200, this.baseRebuildBarFillWidth + 10, 30, 10);
    this.baseRebuildGraphics.fillRect(
      this.scale.width / 2 - 150,
      200,
      this.baseRebuildBarFillWidth,
      30,
    );
  }

  resetBaseRebuildUI() {
    this.baseRebuilding = false;
    this.baseRebuildText.setText("");
    this.baseRebuildGraphics.clear();
  }

  override update(time: number): void {
    // if (this.fpsText && time - this.lastFpsUpdateTime >= 250) {
    //   const fps = Math.round(this.game.loop.actualFps);

    //   this.fpsText.setText(`FPS: ${fps}`);

    //   if (fps >= 50) {
    //     this.fpsText.setColor("#7dff8b");
    //   } else if (fps >= 30) {
    //     this.fpsText.setColor("#ffd84a");
    //   } else {
    //     this.fpsText.setColor("#ff6666");
    //   }

    //   this.lastFpsUpdateTime = time;
    // }

    this.displayPlayerStats();

    if (!this.timerStarted) {
      return;
    }

    this.updateMultiplierFill();

    if (!this.isKingMode()) {
      this.shop.update();

      if (this.strengthenedSquareText) {
        const enemies = (this.scene.get("Game") as any).enemies;

        if (enemies.length > 0) {
          const highestStrengthLevel = Math.max(
            ...enemies.map((enemy: any) => enemy.strengthenLevel ?? 1),
          );

          this.strengthenedSquareText.setText(`${highestStrengthLevel}`);
        }
      }
    }
  }

  updateMultiplierFill() {
    if (!this.timerStarted || this.isMultiplierPaused) return;
    if (this.multiplier === this.multiplierMin) {
      this.multiplierBarFill.width = 92; // Keep the bar full
      return; // Stop further processing
    }
    const currentTime = (this.scene.get("Game") as any).activeGameTime;
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

    this.lastMultiplierUpdate = (this.scene.get("Game") as any).activeGameTime;
  }

  pauseMultiplier(): void {
    this.isMultiplierPaused = true;
  }

  updateStrengthenTimer(currentTime: number) {
    this.strengthenCurrentTime = currentTime;
    const fillWidth = Math.max(
      0,
      (this.strengthenCurrentTime / this.strengthenMaxTime) *
        this.strengthenBarBackground.width,
    );
    this.strengthenBarFill.width = fillWidth;
    if (this.strengthenCurrentTime / this.strengthenMaxTime <= 0.5) {
      this.strengthenBarFill.setFillStyle(0xff0000); // red
    } else {
      this.strengthenBarFill.setFillStyle(0x00ff00);
    }
  }

  drawHexagon() {
    this.strengthenedSquare.clear();
    this.strengthenedSquare.fillStyle("#000", 1); // black, 100% opacity

    // Draw a hexagon
    const radius = 15;
    this.strengthenedSquare.beginPath();
    for (let i = 0; i < 6; i++) {
      // calculate vertex positions
      const x = radius * Math.cos((2 * Math.PI * i) / 6 - Math.PI / 2);
      const y = radius * Math.sin((2 * Math.PI * i) / 6 - Math.PI / 2);
      if (i === 0) this.strengthenedSquare.moveTo(x, y);
      else this.strengthenedSquare.lineTo(x, y);
    }
    this.strengthenedSquare.closePath();
    this.strengthenedSquare.fill();
  }

  createGameOverScreen(): void {
    if (this.isKingMode()) {
      this.createKingDefeatScreen();

      return;
    }
    if (this.gameOverContainer && this.gameOverContainer.active) {
      return;
    }

    audioManager.playSound("sfx-game-over", 0.9);

    const width = this.scale.width;
    const height = this.scale.height;

    const gameScene = this.scene.get("Game") as any;

    this.finalScore = Math.max(0, Math.floor(this.score));

    this.finalBaseSeen = Math.max(
      1,
      Math.floor(gameScene.base?.baseLevel ?? 1),
    );

    this.isNewHighScore = false;

    this.gameOverContainer = this.add.container(0, 0).setDepth(4000);

    // dark overlay
    const overlay = this.add
      .rectangle(0, 0, width, height, 0x02070c, 0.84)
      .setOrigin(0, 0)
      .setInteractive();

    overlay.on(
      "pointerdown",
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
      },
    );

    const panelWidth = Math.min(700, width - 42);

    const panelHeight = Math.min(610, height - 30);

    const panelX = width / 2;

    const panelY = height / 2;

    const panelLeft = panelX - panelWidth / 2;

    const panelTop = panelY - panelHeight / 2;

    // min panel shadow and layered background
    const panelGraphics = this.add.graphics();

    panelGraphics.fillStyle(0x000000, 0.45);

    panelGraphics.fillRoundedRect(
      panelLeft + 9,
      panelTop + 11,
      panelWidth,
      panelHeight,
      24,
    );

    panelGraphics.fillStyle(0x0b1721, 0.99);

    panelGraphics.fillRoundedRect(
      panelLeft,
      panelTop,
      panelWidth,
      panelHeight,
      24,
    );

    panelGraphics.lineStyle(3, 0x52cfff, 0.95);

    panelGraphics.strokeRoundedRect(
      panelLeft,
      panelTop,
      panelWidth,
      panelHeight,
      24,
    );

    panelGraphics.lineStyle(1, 0x9be7ff, 0.18);

    panelGraphics.strokeRoundedRect(
      panelLeft + 8,
      panelTop + 8,
      panelWidth - 16,
      panelHeight - 16,
      18,
    );

    panelGraphics.fillStyle(0xff4f58, 1);

    panelGraphics.fillRoundedRect(panelX - 90, panelTop + 17, 180, 5, 3);

    panelGraphics.fillStyle(0xff4f58, 0.07);

    const runCompleteLabel = this.add
      .text(panelX, panelTop + 39, "RUN COMPLETE", {
        font: "bold 12px Orbitron",

        color: "#ff8c92",

        letterSpacing: 5,
      })
      .setOrigin(0.5);

    const title = this.add
      .text(panelX, panelTop + 86, "GAME OVER", {
        font: "bold 48px Orbitron",

        color: "#ffffff",

        stroke: "#25070a",

        strokeThickness: 7,

        shadow: {
          offsetX: 0,

          offsetY: 4,

          color: "#ff3344",

          blur: 13,

          fill: true,
        },
      })
      .setOrigin(0.5);

    const titleDivider = this.add.graphics();

    titleDivider.lineStyle(2, 0x50c8ff, 0.45);

    titleDivider.lineBetween(
      panelLeft + 52,
      panelTop + 135,
      panelX - 115,
      panelTop + 135,
    );

    titleDivider.lineBetween(
      panelX + 115,
      panelTop + 135,
      panelLeft + panelWidth - 52,
      panelTop + 135,
    );

    titleDivider.fillStyle(0x50c8ff, 0.85);

    // result card
    const statGap = 18;

    const statCardWidth = (panelWidth - 108 - statGap) / 2;

    const statCardHeight = 108;

    const statCardY = panelTop + 164;

    const scoreCardX = panelX - statGap / 2 - statCardWidth;

    const baseCardX = panelX + statGap / 2;

    const statGraphics = this.add.graphics();

    // score card
    statGraphics.fillStyle(0x102735, 0.95);

    statGraphics.fillRoundedRect(
      scoreCardX,
      statCardY,
      statCardWidth,
      statCardHeight,
      15,
    );

    statGraphics.lineStyle(2, 0x49cfff, 0.72);

    statGraphics.strokeRoundedRect(
      scoreCardX,
      statCardY,
      statCardWidth,
      statCardHeight,
      15,
    );

    statGraphics.fillStyle(0x49cfff, 0.08);

    // base card
    statGraphics.fillStyle(0x2a2312, 0.94);

    statGraphics.fillRoundedRect(
      baseCardX,
      statCardY,
      statCardWidth,
      statCardHeight,
      15,
    );

    statGraphics.lineStyle(2, 0xffd84a, 0.72);

    statGraphics.strokeRoundedRect(
      baseCardX,
      statCardY,
      statCardWidth,
      statCardHeight,
      15,
    );

    statGraphics.fillStyle(0xffd84a, 0.07);

    const scoreCaption = this.add
      .text(scoreCardX + statCardWidth / 2, statCardY + 22, "FINAL SCORE", {
        font: "bold 11px Orbitron",

        color: "#83dcff",

        letterSpacing: 3,
      })
      .setOrigin(0.5);

    const scoreLabel = this.add
      .text(
        scoreCardX + statCardWidth / 2,
        statCardY + 67,
        this.finalScore.toLocaleString(),
        {
          font: "bold 35px Orbitron",

          color: "#ffffff",

          stroke: "#000000",

          strokeThickness: 5,
        },
      )
      .setOrigin(0.5);

    const baseCaption = this.add
      .text(baseCardX + statCardWidth / 2, statCardY + 22, "BASE REACHED", {
        font: "bold 11px Orbitron",

        color: "#ffe77c",

        letterSpacing: 3,
      })
      .setOrigin(0.5);

    const baseLabel = this.add
      .text(
        baseCardX + statCardWidth / 2,
        statCardY + 67,
        `${this.finalBaseSeen}`,
        {
          font: "bold 31px Orbitron",

          color: "#ffd84a",

          stroke: "#000000",

          strokeThickness: 5,
        },
      )
      .setOrigin(0.5);

    // status result area
    const statusAreaTop = statCardY + statCardHeight + 20;

    const statusAreaHeight = 142;

    const statusLeft = panelLeft + 54;

    const statusWidth = panelWidth - 108;

    const statusGraphics = this.add.graphics();

    // main result area background
    statusGraphics.fillStyle(0x071119, 0.92);

    statusGraphics.fillRoundedRect(
      statusLeft,
      statusAreaTop,
      statusWidth,
      statusAreaHeight,
      15,
    );

    statusGraphics.lineStyle(1, 0x5ccff5, 0.28);

    statusGraphics.strokeRoundedRect(
      statusLeft,
      statusAreaTop,
      statusWidth,
      statusAreaHeight,
      15,
    );

    // header section
    statusGraphics.fillStyle(0x102733, 0.9);

    statusGraphics.fillRoundedRect(
      statusLeft + 1,
      statusAreaTop + 1,
      statusWidth - 2,
      38,
      14,
    );

    statusGraphics.fillRect(
      statusLeft + 1,
      statusAreaTop + 22,
      statusWidth - 2,
      17,
    );

    statusGraphics.lineStyle(1, 0x62d9ff, 0.25);

    statusGraphics.lineBetween(
      statusLeft + 20,
      statusAreaTop + 39,
      statusLeft + statusWidth - 20,
      statusAreaTop + 39,
    );

    this.gameOverResultTitle = this.add
      .text(panelX, statusAreaTop + 20, "SAVING RUN...", {
        font: "bold 15px Orbitron",

        color: "#82e6ff",

        letterSpacing: 2,

        stroke: "#000000",

        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.gameOverScoreStatus = this.add
      .text(panelX, statusAreaTop + 89, "Please wait...", {
        font: "12px Orbitron",

        color: "#7fa6b8",

        align: "center",

        stroke: "#000000",

        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.gameOverResultRows = this.add.container(0, 0).setVisible(false);

    const createGameOverButton = (
      x: number,
      y: number,
      label: string,
      backgroundColor: string,
      borderColor: number,
      callback: () => void,
    ): Phaser.GameObjects.Text => {
      const button = this.add
        .text(x, y, label, {
          font: "bold 15px Orbitron",

          color: "#ffffff",

          align: "center",

          fixedWidth: 245,

          fixedHeight: 46,

          padding: {
            top: 13,
          },

          backgroundColor,
        })
        .setOrigin(0.5)
        .setStroke("#000000", 3)
        .setShadow(0, 4, "rgba(0,0,0,0.65)", 5, true, true)
        .setInteractive({
          useHandCursor: true,
        });

      const border = this.add.graphics();

      border.lineStyle(2, borderColor, 0.9);

      border.strokeRoundedRect(x - 122.5, y - 23, 245, 46, 8);

      audioManager.addButtonSound(button);
      button.on("pointerover", () => {
        button.setScale(1.025).setAlpha(1);
      });

      button.on("pointerout", () => {
        button.setScale(1).setAlpha(1);
      });

      button.on(
        "pointerdown",
        (
          _pointer: Phaser.Input.Pointer,
          _localX: number,
          _localY: number,
          event: Phaser.Types.Input.EventData,
        ) => {
          event.stopPropagation();

          button.setScale(0.97);

          callback();
        },
      );

      button.on("pointerup", () => {
        if (button.active) {
          button.setScale(1.025);
        }
      });

      this.gameOverContainer.add(border);

      return button;
    };

    const buttonRowOneY = panelTop + panelHeight - 103;

    const buttonRowTwoY = panelTop + panelHeight - 45;

    const buttonColumnOffset = 132;

    const retryButton = createGameOverButton(
      panelX - buttonColumnOffset,
      buttonRowOneY,
      "RETRY",
      "#17658c",
      0x63d5ff,
      () => {
        this.restartGameScene();
      },
    );

    const shareButton = createGameOverButton(
      panelX + buttonColumnOffset,
      buttonRowOneY,
      "SHARE RUN",
      "#24744a",
      0x70e69b,
      () => {
        if (shareButton.getData("sharing")) {
          return;
        }

        shareButton.setData("sharing", true);

        shareButton.disableInteractive().setAlpha(0.62).setText("SHARING...");

        void this.shareScorePost().then((success) => {
          if (!shareButton.active) {
            return;
          }

          if (success) {
            shareButton.setText("SHARED!").setAlpha(1);

            return;
          }

          shareButton.setText("SHARE RUN").setAlpha(1).setInteractive({
            useHandCursor: true,
          });

          shareButton.setData("sharing", false);
        });
      },
    );

    const leaderboardButton = createGameOverButton(
      panelX - buttonColumnOffset,
      buttonRowTwoY,
      "LEADERBOARD",
      "#523684",
      0xa788ef,
      () => {
        this.openLeaderboard();
      },
    );

    const mainMenuButton = createGameOverButton(
      panelX + buttonColumnOffset,
      buttonRowTwoY,
      "MAIN MENU",
      "#712b32",
      0xff747d,
      () => {
        this.goToMainMenu();
      },
    );

    this.gameOverContainer.add([
      overlay,
      panelGraphics,
      titleDivider,
      statGraphics,
      statusGraphics,
      this.gameOverResultTitle,
      this.gameOverResultRows,
      runCompleteLabel,
      title,
      scoreCaption,
      scoreLabel,
      baseCaption,
      baseLabel,
      this.gameOverScoreStatus,
      retryButton,
      shareButton,
      leaderboardButton,
      mainMenuButton,
    ]);

    // share button waits for this
    this.scoreSubmissionPromise = this.submitFinalScore();
  }

  private async submitFinalScore(): Promise<void> {
    if (this.gameDataSaved) {
      return;
    }

    this.gameDataSaved = true;

    try {
      const finalCashEarned = Math.max(0, Math.floor(this.cash));

      const response = await fetch("/api/highscore", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          score: this.finalScore,

          cashEarned: finalCashEarned,

          highestBaseSeen: this.finalBaseSeen,
        }),
      });

      const responseData = (await response.json()) as unknown;

      if (!response.ok) {
        const errorData = responseData as ApiErrorResponse;

        throw new Error(errorData.message ?? "Unable to save score.");
      }

      const data = responseData as SubmitHighScoreResponse;

      if (data.type !== "submit-high-score") {
        throw new Error("Unexpected server response.");
      }

      this.isNewHighScore = data.isNewBest === true;

      if (!this.gameOverScoreStatus) {
        return;
      }
      this.isNewHighScore = data.isNewBest === true;

      this.displayGameOverResults(data);
    } catch (error) {
      console.error("[BattleUI] Failed to submit score:", error);

      const message =
        error instanceof Error ? error.message : "Failed to save run.";

      if (this.gameOverResultTitle) {
        this.gameOverResultTitle
          .setText("SAVE FAILED")
          .setColor("#ff7b86")
          .setShadow(0, 0, "#ff5a66", 8, true, true);
      }

      if (this.gameOverScoreStatus) {
        this.gameOverScoreStatus
          .setVisible(true)
          .setColor("#ff9aa5")
          .setText(message);
      }

      this.gameOverResultRows?.setVisible(false);
    }
  }

  private openLeaderboard(): void {
    this.scene.sleep("Game");
    this.scene.sleep("BattleUI");

    this.scene.launch("Leaderboard", {
      returnTo: "game-over",
    });

    this.scene.bringToTop("Leaderboard");
  }

  createStyledButton(
    x: number,
    y: number,
    text: string,
    backgroundColor: string,
    callback: () => void,
  ) {
    let button = this.add
      .text(x, y, text, {
        font: "28px Orbitron",
        color: "#ffffff",
        padding: { x: 20, y: 10 },
        backgroundColor: backgroundColor,
      })
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", callback);

    button.setStroke("#000000", 4);
    button.setShadow(2, 2, "rgba(0,0,0,0.5)", 2, true, true);
    audioManager.addButtonSound(button);

    return button;
  }

  restartGameScene(): void {
    const gameScene = this.scene.get("Game") as any;

    if (this.isKingMode()) {
      this.goToMainMenu();

      return;
    }

    if (this.scene.isPaused("Game")) {
      this.scene.resume("Game");
    }

    if (gameScene) {
      gameScene.isGamePaused = false;
    }

    this.closePauseScreen();

    this.scene.stop("BattleUI");

    this.scene.stop("Game");

    this.scene.start("Game", {
      mode: "normal",
    });
  }

  goToMainMenu() {
    this.scene.stop("BattleUI");

    this.scene.stop("Game");

    this.scene.start("MainMenu");
  }

  pauseGame(): void {
    const gameScene = this.scene.get("Game") as any;

    if (this.pauseContainer && this.pauseContainer.active) {
      return;
    }

    console.log("pausing game");

    this.scene.pause("Game");
    gameScene.isGamePaused = true;

    this.createPauseScreen();
  }

  createPauseScreen(): void {
    if (this.pauseContainer && this.pauseContainer.active) {
      return;
    }

    const width = this.scale.width;
    const height = this.scale.height;

    this.pauseContainer = this.add.container(0, 0).setDepth(3000);

    const overlay = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.78)
      .setOrigin(0, 0)
      .setInteractive();

    overlay.on(
      "pointerdown",
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
      },
    );

    const panelWidth = 420;
    const panelHeight = 360;

    const panelX = width / 2;
    const panelY = height / 2;

    const panel = this.add
      .rectangle(panelX, panelY, panelWidth, panelHeight, 0x121b24, 0.98)
      .setStrokeStyle(3, 0x50c8ff, 1);

    const title = this.add
      .text(panelX, panelY - 125, "PAUSED", {
        font: "bold 48px Orbitron",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const resumeButton = this.createStyledButton(
      panelX,
      panelY - 35,
      "Resume",
      "#247f4c",
      () => {
        this.closePauseScreen();
        this.scene.resume("Game");

        const gameScene = this.scene.get("Game") as any;

        gameScene.isGamePaused = false;
      },
    );

    const retryButton = this.createStyledButton(
      panelX,
      panelY + 45,
      "Retry",
      "#1d6f94",
      () => {
        this.restartGameScene();
      },
    );

    const mainMenuButton = this.createStyledButton(
      panelX,
      panelY + 125,
      "Main Menu",
      "#8f2d2d",
      () => {
        this.closePauseScreen();
        this.goToMainMenu();
      },
    );

    this.pauseContainer.add([
      overlay,
      panel,
      title,
      resumeButton,
      retryButton,
      mainMenuButton,
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
    this.scene.resume("Game");
    (this.scene.get("Game") as any).isGamePaused = false;
  }

  private async shareScorePost(): Promise<boolean> {
    if (this.scoreSubmissionPromise) {
      await this.scoreSubmissionPromise;
    }
    const score = this.finalScore;

    const highestBaseSeen = this.finalBaseSeen;

    const isNewHighScore = this.isNewHighScore;

    try {
      if (this.gameOverScoreStatus) {
        this.gameOverScoreStatus
          .setText("Creating Reddit post...")
          .setColor("#82e6ff");
      }

      const response = await fetch("/api/share-score", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          score,
          highestBaseSeen,
          isNewHighScore,
        }),
      });

      const rawResponse = await response.text();

      let data: {
        message?: string;
      } = {};

      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error("The server returned invalid data.");
      }

      if (!response.ok) {
        throw new Error(data.message ?? "Unable to share score.");
      }

      if (this.gameOverScoreStatus) {
        this.gameOverScoreStatus
          .setText(data.message ?? "Score shared!")
          .setColor("#65ff9a");
      }

      return true;
    } catch (error) {
      console.error("[Share Score] Failed:", error);

      const message =
        error instanceof Error ? error.message : "Unable to share score.";

      if (this.gameOverScoreStatus) {
        this.gameOverScoreStatus.setText(message).setColor("#ff7777");
      }

      return false;
    }
  }

  private async shareKingVictory(): Promise<boolean> {
    try {
      const response = await fetch("/api/share-king-victory", {
        method: "POST",

        headers: {
          Accept: "application/json",
        },
      });

      const rawResponse = await response.text();

      let data: {
        type?: string;
        message?: string;
      };

      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error("The server returned invalid sharing data.");
      }

      if (!response.ok || data.type !== "share-king-victory") {
        throw new Error(data.message ?? "Unable to share King victory.");
      }

      return true;
    } catch (error) {
      console.error("[Share King Victory] Failed:", error);

      return false;
    }
  }

  private displayGameOverResults(data: SubmitHighScoreResponse): void {
    if (
      !this.gameOverResultRows ||
      !this.gameOverResultTitle ||
      !this.gameOverScoreStatus
    ) {
      return;
    }

    this.gameOverResultRows.removeAll(true);
    this.gameOverResultRows.setVisible(true);

    this.gameOverScoreStatus.setVisible(false);

    if (this.isNewHighScore) {
      this.gameOverResultTitle
        .setText("★ NEW HIGH SCORE ★")
        .setColor("#ffd84a")
        .setShadow(0, 0, "#ffd84a", 10, true, true);
    } else if (data.isNewDailyBest) {
      this.gameOverResultTitle
        .setText("NEW DAILY BEST")
        .setColor("#b891ff")
        .setShadow(0, 0, "#8d5fff", 8, true, true);
    } else {
      this.gameOverResultTitle
        .setText("RUN SAVED")
        .setColor("#72e7a3")
        .setShadow(0, 0, "#36ba71", 6, true, true);
    }

    const width = this.scale.width;
    const height = this.scale.height;

    const panelWidth = Math.min(700, width - 42);
    const panelHeight = Math.min(610, height - 30);

    const panelX = width / 2;
    const panelTop = height / 2 - panelHeight / 2;

    const statCardY = panelTop + 164;
    const statCardHeight = 108;

    const statusAreaTop = statCardY + statCardHeight + 20;

    const leftX = panelX - panelWidth / 2 + 92;
    const rightX = panelX + panelWidth / 2 - 92;

    const rowStartY = statusAreaTop + 60;
    const rowSpacing = 24;

    const rows = [
      {
        label: "ALL-TIME BEST",
        value: data.personalBest.toLocaleString(),
        color: "#82e6ff",
      },
      {
        label: "CASH EARNED",
        value: `+${data.cashEarned.toLocaleString()}`,
        color: "#72e7a3",
        iconKey: "cash",
      },
      {
        label: "GLOBAL RANK",
        value: data.rank !== null ? `#${data.rank}` : "UNRANKED",
        color: data.rank !== null ? "#d7b0ff" : "#7f95a2",
      },
    ];

    rows.forEach((row, index) => {
      const y = rowStartY + index * rowSpacing;

      const labelText = this.add
        .text(leftX, y, row.label, {
          font: "11px Orbitron",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 2,
        })
        .setOrigin(0, 0.5);

      const valueText = this.add
        .text(rightX, y, row.value, {
          font: "bold 14px Orbitron",
          color: row.color,
          stroke: "#000000",
          strokeThickness: 3,
        })
        .setOrigin(1, 0.5);

      this.gameOverResultRows?.add([labelText, valueText]);

      if ("iconKey" in row && row.iconKey) {
        const icon = this.add
          .image(rightX - valueText.width - 12, y, row.iconKey)
          .setDisplaySize(18, 18)
          .setOrigin(1, 0.5);

        this.gameOverResultRows?.add(icon);
      }
    });
  }

  createKingVictoryScreen(result: {
    success: boolean;

    message: string;

    defeatedKingLevel?: number;
    defeatedKingCharacterCode?: number;

    scoreAwarded?: number;
    totalKills?: number;

    unlockedCharacterCode?: number;

    alreadyUnlocked?: boolean;
  }): void {
    if (result.success) {
      const kingName = this.getKingName();
      const rewardName = this.getKingRewardName();

      const defeatedKingLevel =
        typeof result.defeatedKingLevel === "number" &&
        result.defeatedKingLevel >= 1
          ? result.defeatedKingLevel
          : 1;

      this.createKingResultScreen({
        victory: true,

        title: "KING DEFEATED",

        subtitle:
          result.alreadyUnlocked === true
            ? `${kingName} CONQUERED`
            : `${rewardName} UNLOCKED`,

        message: result.message,

        kingLevel: defeatedKingLevel,
      });

      return;
    }

    this.createKingResultScreen({
      victory: false,

      title: "VICTORY NOT SAVED",

      subtitle: "KING BATTLE ERROR",

      message: result.message,
    });
  }

  private createKingDefeatScreen(): void {
    const gameScene = this.scene.get("Game") as any;

    gameScene.isGameOver = true;
    gameScene.isGamePaused = true;
    gameScene.allowInput = false;
    audioManager.playSound("sfx-game-over", 0.9);
    const kingName = this.getKingName();

    this.createKingResultScreen({
      victory: false,

      title: "KING BATTLE LOST",

      subtitle: `${kingName} SURVIVED`,

      message: "Return to the Main Menu to challenge the King again.",
    });
  }

  private createKingResultScreen(options: {
    victory: boolean;

    title: string;

    subtitle: string;

    message: string;

    kingLevel?: number;
  }): void {
    if (this.gameOverContainer && this.gameOverContainer.active) {
      return;
    }

    const width = this.scale.width;

    const height = this.scale.height;

    this.pauseMultiplier();

    this.gameOverContainer = this.add.container(0, 0).setDepth(5000);

    const overlay = this.add
      .rectangle(0, 0, width, height, 0x02070c, 0.88)
      .setOrigin(0, 0)
      .setInteractive();

    overlay.on(
      "pointerdown",
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
      },
    );

    const panelWidth = Math.min(650, width - 40);

    const panelHeight = Math.min(470, height - 40);

    const panelX = width / 2;

    const panelY = height / 2;

    const panelLeft = panelX - panelWidth / 2;

    const panelTop = panelY - panelHeight / 2;

    const accentColour = options.victory ? 0xffd84a : 0xff626b;

    const panelGraphics = this.add.graphics();

    panelGraphics.fillStyle(0x000000, 0.5);

    panelGraphics.fillRoundedRect(
      panelLeft + 9,
      panelTop + 11,
      panelWidth,
      panelHeight,
      24,
    );

    panelGraphics.fillStyle(0x0b1721, 0.99);

    panelGraphics.fillRoundedRect(
      panelLeft,
      panelTop,
      panelWidth,
      panelHeight,
      24,
    );

    panelGraphics.lineStyle(3, accentColour, 0.95);

    panelGraphics.strokeRoundedRect(
      panelLeft,
      panelTop,
      panelWidth,
      panelHeight,
      24,
    );

    panelGraphics.lineStyle(1, 0xffffff, 0.12);

    panelGraphics.strokeRoundedRect(
      panelLeft + 8,
      panelTop + 8,
      panelWidth - 16,
      panelHeight - 16,
      18,
    );

    panelGraphics.fillStyle(accentColour, 0.95);

    panelGraphics.fillRoundedRect(panelX - 100, panelTop + 18, 200, 5, 3);

    const modeLabel = this.add
      .text(panelX, panelTop + 47, `${this.getKingDayLabel()} KING BATTLE`, {
        font: "bold 11px Orbitron",

        color: options.victory ? "#ffe790" : "#ff9ca2",

        letterSpacing: 4,
      })
      .setOrigin(0.5);

    const title = this.add
      .text(panelX, panelTop + 112, options.title, {
        font: "bold 40px Orbitron",

        color: "#ffffff",

        stroke: "#000000",

        strokeThickness: 7,

        align: "center",
      })
      .setOrigin(0.5);

    title.setShadow(
      0,
      0,
      options.victory ? "#ffd84a" : "#ff4e59",
      12,
      true,
      true,
    );

    const subtitle = this.add
      .text(panelX, panelTop + 165, options.subtitle, {
        font: "bold 15px Orbitron",

        color: options.victory ? "#ffd84a" : "#ff8c94",

        align: "center",

        letterSpacing: 2,
      })
      .setOrigin(0.5);

    const messagePanel = this.add.graphics();

    messagePanel.fillStyle(0x071119, 0.92);

    messagePanel.fillRoundedRect(
      panelLeft + 45,
      panelTop + 205,
      panelWidth - 90,
      105,
      14,
    );

    messagePanel.lineStyle(1, accentColour, 0.35);

    messagePanel.strokeRoundedRect(
      panelLeft + 45,
      panelTop + 205,
      panelWidth - 90,
      105,
      14,
    );

    const message = this.add
      .text(panelX, panelTop + 257, options.message, {
        font: "13px Orbitron",

        color: "#d2e8f1",

        align: "center",

        lineSpacing: 6,

        wordWrap: {
          width: panelWidth - 130,
        },
      })
      .setOrigin(0.5);

    const createResultButton = (
      x: number,
      y: number,
      label: string,
      backgroundColour: number,
      borderColour: number,
      callback: () => void,
    ): Phaser.GameObjects.Container => {
      const container = this.add.container(x, y);

      const buttonWidth = 220;

      const buttonHeight = 48;

      const shadow = this.add.rectangle(
        3,
        5,
        buttonWidth,
        buttonHeight,
        0x000000,
        0.5,
      );

      const background = this.add
        .rectangle(0, 0, buttonWidth, buttonHeight, backgroundColour, 1)
        .setStrokeStyle(2, borderColour, 0.9)
        .setInteractive({
          useHandCursor: true,
        });

      const labelText = this.add
        .text(0, 0, label, {
          font: "bold 14px Orbitron",

          color: "#ffffff",

          stroke: "#000000",

          strokeThickness: 3,
        })
        .setOrigin(0.5);

      container.add([shadow, background, labelText]);

      let pressed = false;

      background.on("pointerover", () => {
        container.setScale(1.03);
      });

      background.on("pointerout", () => {
        pressed = false;

        container.setScale(1);
      });

      background.on(
        "pointerdown",
        (
          _pointer: Phaser.Input.Pointer,
          _localX: number,
          _localY: number,
          event: Phaser.Types.Input.EventData,
        ) => {
          event.stopPropagation();

          pressed = true;

          container.setScale(0.97);
        },
      );

      background.on("pointerup", () => {
        container.setScale(1);

        if (!pressed) {
          return;
        }

        pressed = false;

        callback();
      });

      return container;
    };

    const primaryButtonY = options.victory
      ? panelTop + panelHeight - 98
      : panelTop + panelHeight - 70;

    const lowerButtonY = panelTop + panelHeight - 42;

    const collectionsButton = createResultButton(
      options.victory ? panelX - 120 : panelX - 120,
      primaryButtonY,
      "COLLECTIONS",
      0x17658c,
      0x63d5ff,
      () => {
        this.scene.stop("BattleUI");

        this.scene.stop("Game");

        this.scene.start("Collections");
      },
    );

    let shareButton: Phaser.GameObjects.Container | null = null;

    if (options.victory) {
      shareButton = createResultButton(
        panelX + 120,
        primaryButtonY,
        "SHARE VICTORY",
        0x24744a,
        0x70e69b,
        () => {
          if (!shareButton || shareButton.getData("sharing")) {
            return;
          }

          shareButton.setData("sharing", true);

          const label = shareButton.list.find(
            (child): child is Phaser.GameObjects.Text =>
              child instanceof Phaser.GameObjects.Text,
          );

          label?.setText("SHARING...");

          void this.shareKingVictory().then((success) => {
            if (!shareButton?.active) {
              return;
            }

            if (success) {
              label?.setText("SHARED!");

              return;
            }

            shareButton.setData("sharing", false);

            label?.setText("SHARE VICTORY");
          });
        },
      );
    }

    const mainMenuButton = createResultButton(
      options.victory ? panelX : panelX + 120,
      options.victory ? lowerButtonY : primaryButtonY,
      "MAIN MENU",
      0x712b32,
      0xff747d,
      () => {
        this.goToMainMenu();
      },
    );

    const resultObjects: Phaser.GameObjects.GameObject[] = [
      overlay,
      panelGraphics,
      messagePanel,
      modeLabel,
      title,
      subtitle,
      message,
      collectionsButton,
      mainMenuButton,
    ];

    if (shareButton) {
      resultObjects.push(shareButton);
    }

    this.gameOverContainer.add(resultObjects);
  }
}
