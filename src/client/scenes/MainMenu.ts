import { GameObjects, Scene, Structs } from "phaser";
import audioManager from "./AudioManager";
import Phaser from "phaser";
import type {
  ApiErrorResponse,
  CommunityChallengeType,
  CommunityStatusResponse,
  PlayerProfileResponse,
  SelectCommunityChallengeResponse,
} from "../../shared/api";

import type {
  EnterKingBattleResponse,
  KingDay,
  KingStatusResponse,
} from "../../shared/raiderUnlocks";

type MainMenuLayout = {
  mobile: boolean;
  compact: boolean;

  centerX: number;

  cardTop: number;
  cardBottom: number;
  cardWidth: number;
  cardHeight: number;

  contentWidth: number;

  headerY: number;

  profileY: number;
  profileWidth: number;
  profileHeight: number;

  todayKingY: number;
  todayKingWidth: number;

  communityY: number;
  communityWidth: number;
  communityHeight: number;

  playY: number;
  kingBattleY: number;

  secondaryY: number;
  secondaryWidth: number;
  secondaryGap: number;

  footerY: number;
};

type MenuButtonOptions = {
  x: number;
  y: number;

  width: number;
  height: number;

  title: string;
  subtitle: string;

  subtitleIconKey?: string;
  subtitleIconSize?: number;

  backgroundColor: number;
  borderColor: number;

  onClick: () => void;
};

const COLORS = {
  cardFill: 0x081019,
  cardStroke: 0x3aa9cf,
  panelFill: 0x0a1722,
  panelStroke: 0x2f7e9c,
  slotFill: 0x07131c,
  slotStroke: 0x315a70,
  accent: 0x4fd2f5,
  green: 0x3fd07f,
  greenFill: 0x103a28,
  greenStroke: 0x6dffab,
  gold: 0xf2c14e,
  goldFill: 0x4a3a16,
  goldStroke: 0xffd97a,
  shadow: 0x000000,
} as const;

const TEXT = {
  bright: "#ffffff",
  primary: "#e8f4f9",
  muted: "#7d97a6",
  accent: "#8fe4ff",
  green: "#7dffb0",
  gold: "#ffd97a",
  danger: "#ff9c9c",
} as const;

const ACTION_WIDTH = 145;
const ACTION_HEIGHT = 46;

export class MainMenu extends Scene {
  private background: GameObjects.Image | null = null;

  private profileStatusText: GameObjects.Text | null = null;

  private profileContent: GameObjects.Container | null = null;

  private mainCard: GameObjects.Container | null = null;

  private layout: MainMenuLayout | null = null;

  private lastWidth = 0;

  private lastHeight = 0;
  private gemRequestStatusText: GameObjects.Text | null = null;

  private gemRequestButton: GameObjects.Container | null = null;
  private gemRequestButtonGfx: GameObjects.Graphics | null = null;
  private gemRequestButtonHit: GameObjects.Rectangle | null = null;
  private gemRequestButtonText: GameObjects.Text | null = null;
  private gemRequestAvailableAt = 0;
  private gemRequestCountdownEvent: Phaser.Time.TimerEvent | null = null;

  private dailyRewardButton: GameObjects.Container | null = null;
  private dailyRewardButtonGfx: GameObjects.Graphics | null = null;
  private dailyRewardButtonHit: GameObjects.Rectangle | null = null;
  private dailyRewardButtonText: GameObjects.Text | null = null;
  private dailyRewardNextResetAt = 0;
  private dailyRewardCanClaim = false;
  private dailyRewardCountdownEvent: Phaser.Time.TimerEvent | null = null;
  private kingEntryInProgress = false;
  private currentKingDay: KingDay = "saturday";
  private currentKingName = "SATURDAY KING";
  private currentKingRewardName = "CHICKEN RAIDER";
  private currentKingIconKey = "raider4Icon";
  private currentKingEntryCost = 5;
  private currentKingLevel = 1;

  private currentKingResetAt = 0;

  private currentActionWidth = ACTION_WIDTH;
  private currentActionHeight = ACTION_HEIGHT;

  private dailyRewardAmountText: GameObjects.Text | null = null;
  private dailyRewardgemIcon: GameObjects.Image | null = null;
  private gemRequestIcon: GameObjects.Image | null = null;

  private communityContainer: GameObjects.Container | null = null;

  private communitySelectionModal: GameObjects.Container | null = null;

  private communitySelectionInProgress = false;

  private selectedCommunityChallenge: CommunityChallengeType = "damage";

  private pendingCommunityChallenge: CommunityChallengeType = "damage";

  private communitySaveButton: GameObjects.Container | null = null;

  private communitySaveButtonText: GameObjects.Text | null = null;

  private communityCardsContainer: GameObjects.Container | null = null;

  private communityProgress = {
    damage: 0,
    health: 0,
    gold: 0,
  };

  private communityRewards = {
    damageBonus: 0,
    healthBonus: 0,
    goldBonus: 0,
  };

  private communityTargets = {
    damage: 1_000_000,
    health: 1_000_000,
    gold: 1_000,
  };

  private isLoggedIn = false;

  constructor() {
    super("MainMenu");
  }

  init(): void {
    this.background = null;
    this.profileStatusText = null;
    this.profileContent = null;
    this.mainCard = null;
    this.layout = null;
    this.gemRequestStatusText = null;
    this.gemRequestButton = null;
    this.gemRequestButtonGfx = null;
    this.gemRequestButtonHit = null;
    this.gemRequestButtonText = null;
    this.gemRequestAvailableAt = 0;
    this.gemRequestCountdownEvent = null;
    this.dailyRewardButton = null;
    this.dailyRewardButtonGfx = null;
    this.dailyRewardButtonHit = null;
    this.dailyRewardButtonText = null;
    this.dailyRewardNextResetAt = 0;
    this.dailyRewardCanClaim = false;
    this.dailyRewardCountdownEvent = null;
    this.kingEntryInProgress = false;
    this.currentKingDay = "saturday";
    this.currentKingName = "SATURDAY KING";
    this.currentKingRewardName = "CHICKEN RAIDER";
    this.currentKingIconKey = "raider4Icon";
    this.currentKingEntryCost = 5;
    this.currentKingResetAt = 0;
    this.currentActionWidth = ACTION_WIDTH;
    this.currentActionHeight = ACTION_HEIGHT;
    this.currentKingLevel = 1;
    this.communityContainer = null;

    this.communitySelectionModal = null;

    this.communitySelectionInProgress = false;

    this.selectedCommunityChallenge = "damage";
    this.pendingCommunityChallenge = "damage";

    this.communityProgress = {
      damage: 0,
      health: 0,
      gold: 0,
    };

    this.communityRewards = {
      damageBonus: 0,
      healthBonus: 0,
      goldBonus: 0,
    };

    this.communityTargets = {
      damage: 1_000_000,
      health: 1_000_000,
      gold: 1_000,
    };

    this.communitySaveButton = null;
    this.communitySaveButtonText = null;
    this.communityCardsContainer = null;
    this.isLoggedIn = false;
    this.dailyRewardAmountText = null;
    this.dailyRewardgemIcon = null;
    this.gemRequestIcon = null;
  }

  async create(): Promise<void> {
    audioManager.initialize(this.game);
    audioManager.playMusic("music-main");
    audioManager.createMuteButton(this, this.scale.width - 20, 18);
    const width = this.scale.width;
    const height = this.scale.height;

    this.lastWidth = width;
    this.lastHeight = height;

    this.layout = this.calculateLayout(width, height);

    this.createBackground(width, height);

    this.mainCard = this.add.container(0, 0);

    this.createMainCard(this.layout);
    this.createHeader(this.layout);
    this.createProfilePanel(this.layout);

    this.scale.on("resize", this.handleResize, this);

    this.events.once("shutdown", () => {
      this.scale.off("resize", this.handleResize, this);

      this.gemRequestCountdownEvent?.remove();
      this.dailyRewardCountdownEvent?.remove();

      this.gemRequestCountdownEvent = null;
      this.dailyRewardCountdownEvent = null;
    });

    await Promise.all([
      this.loadPlayerProfile(),
      this.loadKingStatus(),
      this.loadCommunityStatus(),
    ]);

    if (!this.sys.isActive() || !this.layout) {
      return;
    }

    this.createMenuButtons(this.layout);
    this.createFooter(this.layout);
  }

  private addRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fill: number,
    fillAlpha: number,
    stroke?: number,
    strokeAlpha = 1,
    strokeWidth = 1,
  ): GameObjects.Graphics {
    const graphics = this.add.graphics();

    if (fillAlpha > 0) {
      graphics.fillStyle(fill, fillAlpha);
      graphics.fillRoundedRect(
        x - width / 2,
        y - height / 2,
        width,
        height,
        radius,
      );
    }

    if (stroke !== undefined) {
      graphics.lineStyle(strokeWidth, stroke, strokeAlpha);
      graphics.strokeRoundedRect(
        x - width / 2,
        y - height / 2,
        width,
        height,
        radius,
      );
    }

    return graphics;
  }

  private addSoftShadow(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    alpha: number,
  ): GameObjects.Graphics {
    const graphics = this.add.graphics();

    graphics.fillStyle(COLORS.shadow, alpha);
    graphics.fillRoundedRect(
      x - width / 2 + 3,
      y - height / 2 + 6,
      width,
      height,
      radius,
    );

    return graphics;
  }

  private createBackground(width: number, height: number): void {
    this.background = this.add
      .image(0, 0, "background")
      .setOrigin(0, 0)
      .setDisplaySize(width, height);

    this.add.rectangle(0, 0, width, height, 0x040a11, 0.8).setOrigin(0, 0);

    this.add.ellipse(
      width / 2,
      height * 0.34,
      Math.min(width * 0.9, 940),
      Math.min(height * 0.78, 640),
      COLORS.accent,
      0.04,
    );

    this.createParticles(width, height);
  }

  private createParticles(width: number, height: number): void {
    const fireflyCount = 12;

    for (let index = 0; index < fireflyCount; index++) {
      const x = Math.random() * width;
      const y = height * 0.15 + Math.random() * height * 0.75;

      const radius = 1.4 + Math.random() * 1.8;
      const glowRadius = radius * (3.4 + Math.random() * 1.6);

      const driftDistanceY = 10 + Math.random() * 22;
      const driftDistanceX = 6 + Math.random() * 14;

      const duration = 3000 + Math.random() * 2800;
      const delay = Math.random() * 2400;

      const glow = this.add
        .circle(x, y, glowRadius, 0x5fdcff, 0.04)
        .setBlendMode(Phaser.BlendModes.ADD);

      const firefly = this.add
        .circle(x, y, radius, 0x8cecff, 0.55)
        .setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: [glow, firefly],

        x: x + (Math.random() < 0.5 ? -1 : 1) * driftDistanceX,
        y: y - driftDistanceY,

        duration,
        delay,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      this.tweens.add({
        targets: firefly,

        alpha: {
          from: 0.25,
          to: 0.7,
        },

        duration: 1100 + Math.random() * 1300,
        delay: delay + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  private createMainCard(layout: MainMenuLayout): void {
    const { centerX, cardTop, cardWidth, cardHeight } = layout;

    const centerY = cardTop + cardHeight / 2;

    const radius = 22;

    const shadow = this.addSoftShadow(
      centerX,
      centerY,
      cardWidth,
      cardHeight,
      radius,
      0.5,
    );

    const card = this.addRoundedRect(
      centerX,
      centerY,
      cardWidth,
      cardHeight,
      radius,
      COLORS.cardFill,
      0.97,
      COLORS.cardStroke,
      0.35,
      1.5,
    );

    const innerHairline = this.addRoundedRect(
      centerX,
      centerY,
      cardWidth - 14,
      cardHeight - 14,
      radius - 5,
      0xffffff,
      0,
      0xffffff,
      0.04,
      1,
    );

    const topAccent = this.addRoundedRect(
      centerX,
      cardTop + 16,
      cardWidth * 0.4,
      4,
      2,
      COLORS.accent,
      0.7,
    );

    this.mainCard?.add([shadow, card, innerHairline, topAccent]);
  }

  private createHeader(layout: MainMenuLayout): void {
    const { centerX, headerY, mobile, compact, contentWidth } = layout;

    const glowWidth = Math.min(mobile ? contentWidth : 460, contentWidth);

    const titleGlow = this.add.ellipse(
      centerX,
      headerY,
      glowWidth,
      compact ? 58 : 76,
      COLORS.accent,
      0.045,
    );

    const eyebrow = this.add
      .text(
        centerX,
        headerY - (compact ? 24 : 33),
        "SURVIVE  •  GROW  •  CONQUER",
        {
          font: `bold 14px Orbitron`,

          color: TEXT.accent,

          letterSpacing: mobile ? 2 : 3,
        },
      )
      .setOrigin(0.5);

    const title = this.add
      .text(centerX, headerY, "THE YOUNG RAIDER", {
        font: `bold 34px Orbitron`,

        color: TEXT.bright,

        stroke: "#03121b",

        strokeThickness: 1,

        align: "center",
      })
      .setOrigin(0.5);

    title.setShadow(0, 0, "#4fcfff", mobile ? 7 : 10, true, true);

    const description = this.add
      .text(
        centerX,
        headerY + (compact ? 36 : 48),
        mobile
          ? "Survive, conquer and climb the ranks."
          : "Destroy bases, survive disasters and climb the global ranks.",
        {
          font: `14px Orbitron`,

          color: TEXT.muted,

          align: "center",

          wordWrap: {
            width: contentWidth - 20,
          },
        },
      )
      .setOrigin(0.5);

    this.mainCard?.add([titleGlow, eyebrow, title, description]);
  }

  private createProfilePanel(layout: MainMenuLayout): void {
    const { centerX, profileWidth, profileHeight, mobile } = layout;
    const profileY = layout.profileY + 70;
    const radius = 14;

    const shadow = this.addSoftShadow(
      centerX,
      profileY,
      profileWidth,
      profileHeight,
      radius,
      0.4,
    );

    const panel = this.addRoundedRect(
      centerX,
      profileY,
      profileWidth,
      profileHeight,
      radius,
      COLORS.panelFill,
      0.96,
      COLORS.panelStroke,
      0.36,
      1.25,
    );

    const headerY = profileY - profileHeight / 2 + 21;

    const headerLabel = this.add
      .text(centerX - profileWidth / 2 + 18, headerY, "RAIDER PROFILE", {
        font: `bold 14px Orbitron`,

        color: TEXT.accent,

        letterSpacing: mobile ? 1 : 2,
      })
      .setOrigin(0, 0.5);

    const divider = this.add.rectangle(
      centerX,
      headerY + 18,
      profileWidth - 30,
      1,
      0xffffff,
      0.07,
    );

    this.profileStatusText = this.add
      .text(centerX, profileY + 10, "Loading Raider profile...", {
        font: `14px Orbitron`,

        color: TEXT.primary,
      })
      .setOrigin(0.5);

    this.mainCard?.add([
      shadow,
      panel,
      headerLabel,
      divider,
      this.profileStatusText,
    ]);
  }

  private createMenuButtons(layout: MainMenuLayout): void {
    const {
      centerX,
      contentWidth,

      todayKingY,
      todayKingWidth,

      communityY,
      communityWidth,
      communityHeight,

      playY,
      kingBattleY,

      secondaryY,
      secondaryWidth,
      secondaryGap,

      compact,
      mobile,
    } = layout;

    const featureGap = mobile ? 8 : 12;

    const featuresShareRow = todayKingY === communityY;

    const todayKingX = featuresShareRow
      ? centerX - featureGap / 2 - todayKingWidth / 2
      : centerX;

    const communityX = featuresShareRow
      ? centerX + featureGap / 2 + communityWidth / 2
      : centerX;

    const todayKingPanel = this.createTodayKingPanel(
      todayKingX,
      todayKingY + 90,
      todayKingWidth,
    );

    const communityPanel = this.createCommunityPanel(
      communityX,
      communityY + 90,
      communityWidth,
      communityHeight,
    );

    const buttonGap = mobile ? 8 : 12;

    const buttonWidth = (contentWidth - buttonGap) / 2;

    const leftButtonX = centerX - buttonGap / 2 - buttonWidth / 2;

    const rightButtonX = centerX + buttonGap / 2 + buttonWidth / 2;

    const mainButtonHeight = 60;

    const secondaryButtonHeight = 50;

    const playButton = this.createMenuButton({
      x: leftButtonX,
      y: playY + 110,

      width: buttonWidth,
      height: mainButtonHeight,

      title: "PLAY NOW",
      subtitle: "START A NEW RUN",

      backgroundColor: 0x14633a,
      borderColor: COLORS.greenStroke,

      onClick: () => {
        this.scene.start("Game", {
          mode: "normal",
        });
      },
    });

    const kingButton = this.createMenuButton({
      x: rightButtonX,
      y: kingBattleY + 110,

      width: buttonWidth,
      height: mainButtonHeight,

      title: "KING BATTLE",

      subtitle:
        `LV.${this.currentKingLevel}` + `  •  ${this.currentKingEntryCost}`,

      subtitleIconKey: "gem",
      subtitleIconSize: 14,

      backgroundColor: 0x6b3515,
      borderColor: 0xffb45c,

      onClick: () => {
        void this.enterKingBattle();
      },
    });

    const collectionsButton = this.createMenuButton({
      x: centerX - secondaryGap,
      y: secondaryY + 120,

      width: secondaryWidth,
      height: secondaryButtonHeight,

      title: "COLLECTIONS",
      subtitle: "YOUR RAIDERS",

      backgroundColor: 0x123f59,
      borderColor: 0x71d9ff,

      onClick: () => {
        this.scene.start("Collections");
      },
    });

    const leaderboardButton = this.createMenuButton({
      x: centerX + secondaryGap,
      y: secondaryY + 120,

      width: secondaryWidth,
      height: secondaryButtonHeight,

      title: mobile ? "RANKINGS" : "LEADERBOARD",

      subtitle: "TOP RAIDERS",

      backgroundColor: 0x3a2a5c,
      borderColor: 0xb995ef,

      onClick: () => {
        this.scene.start("Leaderboard", {
          returnTo: "main-menu",
        });
      },
    });

    this.mainCard?.add([
      todayKingPanel,
      communityPanel,
      playButton,
      kingButton,
      collectionsButton,
      leaderboardButton,
    ]);
  }

  private createMenuButton(options: MenuButtonOptions): GameObjects.Container {
    const container = this.add.container(options.x, options.y);

    let wasPressed = false;

    const radius = Math.min(12, options.height / 2.6);

    const shadow = this.addRoundedRect(
      0,
      4,
      options.width,
      options.height,
      radius,
      COLORS.shadow,
      0.38,
    );

    const glow = this.addRoundedRect(
      0,
      0,
      options.width + 6,
      options.height + 6,
      radius + 2,
      options.borderColor,
      0,
      options.borderColor,
      0.55,
      1.5,
    );

    glow.setAlpha(0.1);

    const button = this.addRoundedRect(
      0,
      0,
      options.width,
      options.height,
      radius,
      options.backgroundColor,
      0.96,
      options.borderColor,
      0.62,
      1.25,
    );

    const topHighlight = this.addRoundedRect(
      0,
      -options.height * 0.27,
      options.width - 12,
      Math.max(5, options.height * 0.16),
      radius * 0.55,
      0xffffff,
      0.045,
    );

    const titleText = this.add
      .text(0, options.height >= 48 ? -6 : -5, options.title, {
        font: "bold 20px Orbitron",
        color: TEXT.bright,
        stroke: "#03121b",
        strokeThickness: 2,
        letterSpacing: 1,
        align: "center",
      })
      .setOrigin(0.5);

    const subtitleY = options.height >= 48 ? 13 : 11;

    const subtitleContainer = this.add.container(0, subtitleY);

    const subtitleText = this.add
      .text(0, 0, options.subtitle, {
        font: "bold 14px Orbitron",
        color: "#cfe6ef",
        letterSpacing: 1,
        align: "center",
      })
      .setOrigin(0.5);

    if (options.subtitleIconKey) {
      const iconSize = options.subtitleIconSize ?? 18;
      const iconGap = 5;

      const totalWidth = subtitleText.width + iconGap + iconSize;

      subtitleText.setOrigin(0, 0.5).setPosition(-totalWidth / 2, 0);

      const subtitleIcon = this.add
        .image(
          -totalWidth / 2 + subtitleText.width + iconGap + iconSize / 2,
          2,
          options.subtitleIconKey,
        )
        .setDisplaySize(iconSize, iconSize)
        .setOrigin(0.5);

      subtitleContainer.add([subtitleText, subtitleIcon]);
    } else {
      subtitleText.setCrop(0, 0, options.width - 16, subtitleText.height);

      subtitleContainer.add(subtitleText);
    }

    const hit = this.add
      .rectangle(0, 0, options.width, options.height, 0xffffff, 0)
      .setOrigin(0.5)
      .setInteractive({
        useHandCursor: true,
      });

    container.add([
      shadow,
      glow,
      button,
      topHighlight,
      titleText,
      subtitleContainer,
      hit,
    ]);

    audioManager.addButtonSound(hit);

    hit.on("pointerover", () => {
      this.tweens.killTweensOf(container);

      this.tweens.add({
        targets: container,
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 90,
        ease: "Quad.easeOut",
      });

      glow.setAlpha(0.42);
    });

    hit.on("pointerout", () => {
      wasPressed = false;

      this.tweens.killTweensOf(container);

      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 90,
        ease: "Quad.easeOut",
      });

      glow.setAlpha(0.1);
    });

    hit.on("pointerdown", () => {
      wasPressed = true;

      container.setScale(0.97);
    });

    hit.on("pointerup", () => {
      container.setScale(1);

      if (!wasPressed) {
        return;
      }

      wasPressed = false;

      options.onClick();
    });

    hit.on("pointerupoutside", () => {
      wasPressed = false;

      container.setScale(1);
    });

    return container;
  }

  private createCommunityPanel(
    centerX: number,
    y: number,
    width: number,
    height: number,
  ): GameObjects.Container {
    this.communityContainer?.destroy(true);

    const container = this.add.container(centerX, y);

    this.communityContainer = container;

    const challenge = this.selectedCommunityChallenge;

    const progress = this.communityProgress[challenge];

    const target = this.communityTargets[challenge];

    const progressPercentage =
      target > 0 ? Phaser.Math.Clamp(progress / target, 0, 1) : 0;

    const narrow = width < 300;

    const challengeLabel =
      challenge === "damage"
        ? "DAMAGE"
        : challenge === "health"
          ? "MAX HEALTH"
          : "STARTING GOLD";

    const rewardValue =
      challenge === "damage"
        ? `+${this.communityRewards.damageBonus} DMG`
        : challenge === "health"
          ? `+${this.communityRewards.healthBonus} HP`
          : `+${this.communityRewards.goldBonus} GOLD`;

    const borderColor =
      challenge === "damage"
        ? 0xff6f61
        : challenge === "health"
          ? 0x63e68c
          : 0xffd45c;

    const backgroundColor =
      challenge === "damage"
        ? 0x301719
        : challenge === "health"
          ? 0x12301f
          : 0x342c15;

    const shadow = this.addRoundedRect(
      3,
      5,
      width,
      height,
      12,
      COLORS.shadow,
      0.42,
    );

    const background = this.addRoundedRect(
      0,
      0,
      width,
      height,
      12,
      backgroundColor,
      0.97,
      borderColor,
      0.72,
      1.5,
    );

    const leftX = -width / 2 + 14;

    const rightX = width / 2 - 14;

    const heading = this.add
      .text(leftX, -height / 2 + 17, "COMMUNITY", {
        font: `bold 14px Orbitron`,
        color: TEXT.muted,
        letterSpacing: 1,
      })
      .setOrigin(0, 0.5);

    const editText = this.add
      .text(
        rightX,
        -height / 2 + 17,
        this.isLoggedIn ? "CHANGE" : "LOGIN TO CHANGE",
        {
          font: `bold 14px Orbitron`,
          color: this.isLoggedIn ? TEXT.accent : TEXT.muted,

          letterSpacing: 1,
        },
      )
      .setOrigin(1, 0.5);

    const challengeText = this.add
      .text(leftX, -height / 2 + 38, challengeLabel, {
        font: `bold 14px Orbitron`,
        color: TEXT.bright,
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0, 0.5);

    const rewardText = this.add
      .text(rightX, -height / 2 + 38, rewardValue, {
        font: `bold 14px Orbitron`,
        color:
          challenge === "gold"
            ? TEXT.gold
            : challenge === "health"
              ? TEXT.green
              : "#ffaaa3",
      })
      .setOrigin(1, 0.5);

    const progressLabel = this.add
      .text(
        leftX,
        height / 2 - 28,
        `${progress.toLocaleString()} / ${target.toLocaleString()}`,
        {
          font: `bold 14px Orbitron`,
          color: "#d7e6ec",
        },
      )
      .setOrigin(0, 0.5);

    const percentageText = this.add
      .text(
        rightX,
        height / 2 - 28,
        `${Math.floor(progressPercentage * 100)}%`,
        {
          font: `bold 14px Orbitron`,
          color: TEXT.primary,
        },
      )
      .setOrigin(1, 0.5);

    const barWidth = width - 28;

    const barY = height / 2 - 13;

    const barBackground = this.add
      .rectangle(leftX, barY, barWidth, 7, 0x000000, 0.55)
      .setOrigin(0, 0.5);

    const fillWidth = Math.max(
      progressPercentage > 0 ? 2 : 0,
      barWidth * progressPercentage,
    );

    const barFill = this.add
      .rectangle(leftX, barY, fillWidth, 7, borderColor, 1)
      .setOrigin(0, 0.5);

    const hit = this.add.rectangle(0, 0, width, height, 0xffffff, 0);

    if (this.isLoggedIn) {
      hit.setInteractive({
        useHandCursor: true,
      });
    }

    container.add([
      shadow,
      background,
      heading,
      editText,
      challengeText,
      rewardText,
      progressLabel,
      percentageText,
      barBackground,
      barFill,
      hit,
    ]);

    if (this.isLoggedIn) {
      audioManager.addButtonSound(hit);

      let pressed = false;

      hit.on("pointerover", () => {
        container.setScale(1.012);
      });

      hit.on("pointerout", () => {
        pressed = false;

        container.setScale(1);
      });

      hit.on("pointerdown", () => {
        pressed = true;

        container.setScale(0.985);
      });

      hit.on("pointerup", () => {
        container.setScale(1);

        if (!pressed) {
          return;
        }

        pressed = false;

        this.openCommunitySelectionModal();
      });
    }

    return container;
  }

  private openCommunitySelectionModal(): void {
    if (this.communitySelectionModal?.active) {
      return;
    }

    this.pendingCommunityChallenge = this.selectedCommunityChallenge;

    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    const modal = this.add.container(0, 0).setDepth(2000);

    this.communitySelectionModal = modal;

    const overlay = this.add
      .rectangle(0, 0, screenWidth, screenHeight, 0x02070c, 0.9)
      .setOrigin(0, 0)
      .setInteractive();

    const mobile = screenWidth < 680;

    const panelWidth = Math.min(
      mobile ? screenWidth - 24 : 700,
      screenWidth - 24,
    );

    const panelHeight = Math.min(
      mobile ? screenHeight - 30 : 620,
      screenHeight - 30,
    );

    const panelX = screenWidth / 2;
    const panelY = screenHeight / 2;

    const panelShadow = this.add
      .rectangle(
        panelX + 5,
        panelY + 7,
        panelWidth,
        panelHeight,
        0x000000,
        0.55,
      )
      .setStrokeStyle(0);

    const panel = this.add
      .rectangle(panelX, panelY, panelWidth, panelHeight, 0x08131d, 1)
      .setStrokeStyle(2, COLORS.accent, 0.75);

    const titleY = panelY - panelHeight / 2 + 42;

    const title = this.add
      .text(panelX, titleY, "COMMUNITY CHALLENGE", {
        font: `bold 20px Orbitron`,
        color: TEXT.bright,
        stroke: "#02090e",
        strokeThickness: 4,
        align: "center",
      })
      .setOrigin(0.5);

    const description = this.add
      .text(
        panelX,
        titleY + 35,
        [
          "Choose where your next result contributes.",
          "Only improvements over your personal best add score.",
        ],
        {
          font: `14px Orbitron`,
          color: TEXT.muted,
          align: "center",
          lineSpacing: 6,
          wordWrap: {
            width: panelWidth - 50,
          },
        },
      )
      .setOrigin(0.5);

    const divider = this.add.rectangle(
      panelX,
      titleY + 76,
      panelWidth - 42,
      1,
      COLORS.accent,
      0.14,
    );

    this.communityCardsContainer = this.add.container(0, 0);

    modal.add([
      overlay,
      panelShadow,
      panel,
      title,
      description,
      divider,
      this.communityCardsContainer,
    ]);

    this.rebuildCommunitySelectionCards(
      panelX,
      panelY,
      panelWidth,
      panelHeight,
      mobile,
    );

    const actionY = panelY + panelHeight / 2 - 58;

    const actionGap = mobile ? 8 : 12;

    const availableActionWidth = panelWidth - 44;

    const saveButtonWidth = Math.floor(availableActionWidth * 0.64);

    const cancelButtonWidth =
      availableActionWidth - saveButtonWidth - actionGap;

    const saveButtonX = panelX - availableActionWidth / 2 + saveButtonWidth / 2;

    const cancelButtonX =
      panelX + availableActionWidth / 2 - cancelButtonWidth / 2;

    this.communitySaveButton = this.createCommunitySaveButton(
      saveButtonX,
      actionY,
      saveButtonWidth,
      mobile ? 48 : 54,
    );

    const cancelButton = this.add.container(cancelButtonX, actionY);

    const cancelBackground = this.add
      .rectangle(0, 0, cancelButtonWidth, mobile ? 48 : 54, 0x26343c, 1)
      .setStrokeStyle(2, 0x71808a, 0.8);

    const closeText = this.add
      .text(0, 0, "CANCEL", {
        font: `bold 14px Orbitron`,
        color: TEXT.bright,
        letterSpacing: 1,
      })
      .setOrigin(0.5);

    const cancelHit = this.add
      .rectangle(0, 0, cancelButtonWidth, mobile ? 48 : 54, 0xffffff, 0)
      .setInteractive({
        useHandCursor: true,
      });

    cancelButton.add([cancelBackground, closeText, cancelHit]);

    audioManager.addButtonSound(cancelHit);

    cancelHit.on("pointerover", () => {
      if (this.communitySelectionInProgress) {
        return;
      }

      cancelButton.setScale(1.02);

      cancelBackground.setFillStyle(0x344750, 1);
    });

    cancelHit.on("pointerout", () => {
      cancelButton.setScale(1);

      cancelBackground.setFillStyle(0x26343c, 1);
    });

    cancelHit.on("pointerdown", () => {
      if (this.communitySelectionInProgress) {
        return;
      }

      cancelButton.setScale(0.98);
    });

    cancelHit.on("pointerup", () => {
      cancelButton.setScale(1);

      if (!this.communitySelectionInProgress) {
        this.closeCommunitySelectionModal();
      }
    });

    cancelHit.on("pointerupoutside", () => {
      cancelButton.setScale(1);
    });

    modal.add([this.communitySaveButton, cancelButton]);
  }

  private rebuildCommunitySelectionCards(
    panelX: number,
    panelY: number,
    panelWidth: number,
    panelHeight: number,
    mobile: boolean,
  ): void {
    this.communityCardsContainer?.removeAll(true);

    const cardWidth = panelWidth - 46;

    const availableHeight = panelHeight - 250;

    const cardGap = mobile ? 9 : 12;

    const cardHeight = Math.min(
      mobile ? 96 : 108,
      (availableHeight - cardGap * 2) / 3,
    );

    const totalCardsHeight = cardHeight * 3 + cardGap * 2;

    const firstCardY = panelY - totalCardsHeight / 2 + 21;

    const challengeDefinitions = [
      {
        type: "damage" as const,
        title: "DAMAGE",
        description: "Improve your normal-game high score.",
        milestone: "Every 10,000 community points grants +2 base damage.",
        maximum: "MAXIMUM BONUS: +200 DAMAGE",
        color: 0xff756a,
        fill: 0x321719,
      },
      {
        type: "health" as const,
        title: "MAX HEALTH",
        description: "Improve your normal-game high score.",
        milestone: "Every 10,000 community points grants +5 max health.",
        maximum: "MAXIMUM BONUS: +500 HEALTH",
        color: 0x69e99a,
        fill: 0x13321f,
      },
      {
        type: "gold" as const,
        title: "STARTING GOLD",
        description: "Defeat Kings while this challenge is selected.",
        milestone: "Every 10 community King kills grants +10 starting gold.",
        maximum: "MAXIMUM BONUS: +1,000 GOLD",
        color: 0xffd76a,
        fill: 0x382f15,
      },
    ];

    challengeDefinitions.forEach((definition, index) => {
      const cardY =
        firstCardY + cardHeight / 2 + index * (cardHeight + cardGap);

      const card = this.createCommunitySelectionCard(
        panelX,
        cardY,
        cardWidth,
        cardHeight,
        definition,
        mobile,
      );

      this.communityCardsContainer?.add(card);
    });
  }

  private createFooter(layout: MainMenuLayout): void {
    const { centerX, contentWidth, mobile } = layout;
    const footerY = layout.footerY + 150;
    const line = this.add
      .rectangle(
        centerX,
        footerY - 14,
        Math.min(contentWidth, mobile ? 300 : 420),
        1,
        COLORS.accent,
        0.1,
      )
      .setOrigin(0.5);

    const footer = this.add
      .text(centerX, footerY + 5, "EVERY RUN IS ANOTHER CHANCE", {
        font: `14px Orbitron`,

        color: TEXT.muted,

        letterSpacing: mobile ? 1 : 2,
      })
      .setOrigin(0.5);

    this.mainCard?.add([line, footer]);
  }

  private createCommunitySelectionCard(
    x: number,
    y: number,
    width: number,
    height: number,
    challenge: {
      type: CommunityChallengeType;
      title: string;
      description: string;
      milestone: string;
      maximum: string;
      color: number;
      fill: number;
    },
    mobile: boolean,
  ): GameObjects.Container {
    const container = this.add.container(x, y);

    const selected = challenge.type === this.pendingCommunityChallenge;

    const savedSelection = challenge.type === this.selectedCommunityChallenge;

    const shadow = this.add.rectangle(3, 5, width, height, 0x000000, 0.35);

    const background = this.add
      .rectangle(0, 0, width, height, challenge.fill, selected ? 1 : 0.88)
      .setStrokeStyle(selected ? 3 : 1, challenge.color, selected ? 1 : 0.34);

    const indicatorX = -width / 2 + (mobile ? 23 : 29);

    const indicator = this.add
      .circle(
        indicatorX,
        0,
        mobile ? 10 : 12,
        selected ? challenge.color : 0x071019,
        1,
      )
      .setStrokeStyle(2, challenge.color, selected ? 1 : 0.6);

    const innerIndicator = this.add.circle(
      indicatorX,
      0,
      selected ? (mobile ? 4 : 5) : 0,
      0xffffff,
      1,
    );

    const contentX = -width / 2 + (mobile ? 48 : 58);

    const title = this.add
      .text(contentX, -height * 0.3, challenge.title, {
        font: `bold 14px Orbitron`,
        color: TEXT.bright,
        letterSpacing: 1,
      })
      .setOrigin(0, 0.5);

    const status = this.add
      .text(
        width / 2 - 15,
        -height * 0.3,
        savedSelection ? "CURRENT" : selected ? "SELECTED" : "",
        {
          font: `bold 14px Orbitron`,
          color: savedSelection ? TEXT.green : TEXT.accent,
          letterSpacing: 1,
        },
      )
      .setOrigin(1, 0.5);

    const description = this.add
      .text(contentX, -height * 0.03, challenge.description, {
        font: `14px Orbitron`,
        color: "#d7e6ec",
      })
      .setOrigin(0, 0.5);

    const milestone = this.add
      .text(contentX, height * 0.21, challenge.milestone, {
        font: `bold 14px Orbitron`,
        color: Phaser.Display.Color.IntegerToColor(challenge.color).rgba,
        wordWrap: {
          width: width - (mobile ? 72 : 90),
        },
      })
      .setOrigin(0, 0.5);

    const maximum = this.add
      .text(width / 2 - 15, height * 0.36, challenge.maximum, {
        font: `bold 14px Orbitron`,
        color: TEXT.muted,
      })
      .setOrigin(1, 0.5);

    const hit = this.add
      .rectangle(0, 0, width, height, 0xffffff, 0)
      .setInteractive({
        useHandCursor: true,
      });

    container.add([
      shadow,
      background,
      indicator,
      innerIndicator,
      title,
      status,
      description,
      milestone,
      maximum,
      hit,
    ]);

    audioManager.addButtonSound(hit);

    hit.on("pointerover", () => {
      if (challenge.type !== this.pendingCommunityChallenge) {
        container.setScale(1.01);
      }
    });

    hit.on("pointerout", () => {
      container.setScale(1);
    });

    hit.on("pointerdown", () => {
      container.setScale(0.99);
    });

    hit.on("pointerup", () => {
      container.setScale(1);

      if (this.communitySelectionInProgress) {
        return;
      }

      this.pendingCommunityChallenge = challenge.type;

      const modalWidth = Math.min(
        mobile ? this.scale.width - 24 : 700,
        this.scale.width - 24,
      );

      const modalHeight = Math.min(
        mobile ? this.scale.height - 30 : 620,
        this.scale.height - 30,
      );

      this.rebuildCommunitySelectionCards(
        this.scale.width / 2,
        this.scale.height / 2,
        modalWidth,
        modalHeight,
        mobile,
      );

      this.updateCommunitySaveButton();
    });

    return container;
  }

  private createCommunitySaveButton(
    x: number,
    y: number,
    width: number,
    height: number,
  ): GameObjects.Container {
    const container = this.add.container(x, y);

    const background = this.add
      .rectangle(0, 0, width, height, 0x145f39, 1)
      .setStrokeStyle(2, COLORS.greenStroke, 0.9);

    this.communitySaveButtonText = this.add
      .text(0, 0, "SAVE SELECTION", {
        font: "bold 14px Orbitron",
        color: TEXT.bright,
        letterSpacing: 1,
      })
      .setOrigin(0.5);

    const hit = this.add
      .rectangle(0, 0, width, height, 0xffffff, 0)
      .setInteractive({
        useHandCursor: true,
      });

    container.add([background, this.communitySaveButtonText, hit]);

    audioManager.addButtonSound(hit);

    hit.on("pointerover", () => {
      if (!this.communitySelectionInProgress) {
        container.setScale(1.02);
      }
    });

    hit.on("pointerout", () => {
      container.setScale(1);
    });

    hit.on("pointerdown", () => {
      if (!this.communitySelectionInProgress) {
        container.setScale(0.98);
      }
    });

    hit.on("pointerup", () => {
      container.setScale(1);

      if (this.communitySelectionInProgress) {
        return;
      }

      if (this.pendingCommunityChallenge === this.selectedCommunityChallenge) {
        this.communitySaveButtonText?.setText("ALREADY SAVED");

        return;
      }

      void this.savePendingCommunityChallenge();
    });

    this.updateCommunitySaveButton();

    return container;
  }

  private updateCommunitySaveButton(): void {
    if (!this.communitySaveButtonText) {
      return;
    }

    if (this.communitySelectionInProgress) {
      this.communitySaveButtonText.setText("SAVING...");

      return;
    }

    if (this.pendingCommunityChallenge === this.selectedCommunityChallenge) {
      this.communitySaveButtonText.setText("SAVED");

      return;
    }

    this.communitySaveButtonText.setText("SAVE SELECTION");
  }

  private closeCommunitySelectionModal(): void {
    this.communitySelectionModal?.destroy(true);

    this.communitySelectionModal = null;
  }

  private async savePendingCommunityChallenge(): Promise<void> {
    if (this.communitySelectionInProgress) {
      return;
    }

    if (this.pendingCommunityChallenge === this.selectedCommunityChallenge) {
      this.updateCommunitySaveButton();

      return;
    }

    this.communitySelectionInProgress = true;

    this.updateCommunitySaveButton();

    try {
      const response = await fetch("/api/community-selection", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          challenge: this.pendingCommunityChallenge,
        }),
      });

      const rawResponse = await response.text();

      let responseData: SelectCommunityChallengeResponse | ApiErrorResponse;

      try {
        responseData = rawResponse
          ? JSON.parse(rawResponse)
          : {
              status: "error",
              message: "The server returned no selection information.",
            };
      } catch {
        throw new Error("The server returned invalid selection information.");
      }

      if (
        !response.ok ||
        !("type" in responseData) ||
        responseData.type !== "select-community-challenge"
      ) {
        const message =
          "message" in responseData
            ? responseData.message
            : "Unable to save Community challenge.";

        throw new Error(message);
      }

      this.selectedCommunityChallenge = responseData.selectedChallenge;

      this.pendingCommunityChallenge = responseData.selectedChallenge;

      await this.loadCommunityStatus();

      this.communitySaveButtonText?.setText("SAVED");

      this.rebuildCommunityPanel();

      this.showgemRequestStatus(responseData.message, true);

      this.time.delayedCall(700, () => {
        if (this.communitySelectionModal?.active) {
          this.closeCommunitySelectionModal();
        }
      });
    } catch (error) {
      console.error("[MainMenu] Community save failed:", error);

      this.communitySaveButtonText?.setText("SAVE FAILED — TRY AGAIN");

      this.showgemRequestStatus(
        error instanceof Error
          ? error.message
          : "Unable to save Community challenge.",
        false,
      );
    } finally {
      this.communitySelectionInProgress = false;
    }
  }

  private rebuildCommunityPanel(): void {
    if (!this.layout) {
      return;
    }

    const {
      centerX,
      todayKingY,
      communityY,
      communityWidth,
      communityHeight,
      mobile,
    } = this.layout;

    const featureGap = mobile ? 8 : 12;

    const featuresShareRow = todayKingY === communityY;

    const communityX = featuresShareRow
      ? centerX + featureGap / 2 + communityWidth / 2
      : centerX;

    this.communityContainer?.destroy(true);

    this.communityContainer = this.createCommunityPanel(
      communityX,
      communityY + 90,
      communityWidth,
      communityHeight,
    );

    this.mainCard?.add(this.communityContainer);
  }

  private async loadPlayerProfile(): Promise<void> {
    try {
      const response = await fetch("/api/player-profile");

      const responseData = (await response.json()) as unknown;

      if (!response.ok) {
        const errorData = responseData as ApiErrorResponse;

        throw new Error(errorData.message ?? "Unable to load profile.");
      }

      const profile = responseData as PlayerProfileResponse;

      if (profile.type !== "player-profile") {
        throw new Error("Unexpected server response.");
      }
      this.isLoggedIn = true;
      this.renderPlayerProfile(profile);
    } catch (error) {
      this.isLoggedIn = false;
      console.error("[MainMenu] Failed to load profile:", error);

      const message = error instanceof Error ? error.message : "Unknown error";

      this.profileStatusText
        ?.setColor(TEXT.danger)
        .setText(["PROFILE UNAVAILABLE", message].join("\n"));
    }
  }

  private async loadKingStatus(): Promise<void> {
    try {
      const response = await fetch("/api/king-status", {
        headers: {
          Accept: "application/json",
        },
      });

      const rawResponse = await response.text();

      let responseData: KingStatusResponse | ApiErrorResponse;

      try {
        responseData = rawResponse
          ? JSON.parse(rawResponse)
          : {
              status: "error",
              message: "The server returned no King information.",
            };
      } catch {
        throw new Error("The server returned invalid King information.");
      }

      if (
        !response.ok ||
        !("type" in responseData) ||
        responseData.type !== "king-status"
      ) {
        const message =
          "message" in responseData
            ? responseData.message
            : "Unable to load today's King.";

        throw new Error(message);
      }

      this.currentKingDay = responseData.serverDay;

      this.currentKingName = responseData.kingName;

      this.currentKingRewardName = responseData.rewardName;

      this.currentKingIconKey = responseData.iconKey;

      this.currentKingEntryCost = responseData.entryCost;

      this.currentKingLevel = responseData.kingLevel;

      this.currentKingResetAt = responseData.nextResetAt;
    } catch (error) {
      console.error("[MainMenu] Failed to load King status:", error);
    }
  }

  private async loadCommunityStatus(): Promise<void> {
    try {
      const response = await fetch("/api/community-status", {
        headers: {
          Accept: "application/json",
        },
      });

      const rawResponse = await response.text();

      let responseData: CommunityStatusResponse | ApiErrorResponse;

      try {
        responseData = rawResponse
          ? JSON.parse(rawResponse)
          : {
              status: "error",
              message: "The server returned no Community information.",
            };
      } catch {
        throw new Error("The server returned invalid Community information.");
      }

      if (
        !response.ok ||
        !("type" in responseData) ||
        responseData.type !== "community-status"
      ) {
        const message =
          "message" in responseData
            ? responseData.message
            : "Unable to load Community progress.";

        throw new Error(message);
      }

      this.selectedCommunityChallenge = responseData.selectedChallenge;

      this.pendingCommunityChallenge = responseData.selectedChallenge;

      this.communityProgress = {
        damage: responseData.progress.damage,
        health: responseData.progress.health,
        gold: responseData.progress.gold,
      };

      this.communityRewards = {
        damageBonus: responseData.rewards.damageBonus,
        healthBonus: responseData.rewards.healthBonus,
        goldBonus: responseData.rewards.goldBonus,
      };

      this.communityTargets = {
        damage: responseData.targets.damage,
        health: responseData.targets.health,
        gold: responseData.targets.gold,
      };
    } catch (error) {
      console.error("[MainMenu] Failed to load Community status:", error);
    }
  }

  private renderPlayerProfile(profile: PlayerProfileResponse): void {
    this.profileStatusText?.destroy();

    this.profileStatusText = null;

    this.profileContent?.destroy(true);

    this.profileContent = this.add.container(0, 0);

    if (!this.layout) {
      return;
    }

    const {
      centerX,
      profileY: panelY,
      profileWidth: panelWidth,
      mobile,
    } = this.layout;

    const contentLeft = centerX - panelWidth / 2 + 16;

    const contentRight = centerX + panelWidth / 2 - 16;

    this.currentActionWidth = ACTION_WIDTH;
    this.currentActionHeight = ACTION_HEIGHT;

    const topRowY = panelY + 50;

    // username card
    const usernameCardWidth = 230;

    const usernameCardX = contentLeft + usernameCardWidth / 2;

    const usernameCard = this.addRoundedRect(
      usernameCardX,
      topRowY,
      usernameCardWidth,
      46,
      9,
      COLORS.slotFill,
      0.92,
      COLORS.slotStroke,
      0.4,
      1,
    );

    const usernameTextX = contentLeft + 12;

    const usernameLabel = this.add
      .text(usernameTextX, topRowY - 10, "RAIDER", {
        font: "bold 14px Orbitron",

        color: TEXT.muted,

        letterSpacing: 1,
      })
      .setOrigin(0, 0.5);

    const username = this.add
      .text(usernameTextX, topRowY + 8, `u/${profile.username}`, {
        font: "bold 14px Orbitron",

        color: TEXT.primary,
      })
      .setOrigin(0, 0.5);

    username.setCrop(0, 0, usernameCardWidth - 24, username.height); // long names will be cropped to fit the card width

    // wallet card
    const walletX = contentLeft + 330;

    const walletCard = this.addRoundedRect(
      walletX,
      topRowY,
      168,
      46,
      9,
      COLORS.greenFill,
      0.55,
      COLORS.green,
      0.32,
      1,
    );

    const gemIcon = this.add
      .image(walletX - 60, topRowY, "gem")
      .setDisplaySize(26, 26);

    const gemLabel = this.add
      .text(walletX - 38, topRowY - 10, "WALLET", {
        font: "bold 14px Orbitron",

        color: TEXT.muted,

        letterSpacing: 1,
      })
      .setOrigin(0, 0.5);

    const gemAmount = this.add
      .text(walletX - 38, topRowY + 8, profile.gem.toLocaleString(), {
        font: "bold 14px Orbitron",

        color: TEXT.green,
      })
      .setOrigin(0, 0.5);

    // daily rewards
    this.dailyRewardCanClaim = profile.canClaimDailyReward;

    this.dailyRewardNextResetAt = profile.dailyRewardNextResetAt;

    const dailyX = contentRight - ACTION_WIDTH * 1.5 - 45;

    this.dailyRewardButton = this.add.container(dailyX, topRowY);

    this.dailyRewardButtonGfx = this.add.graphics();

    this.drawActionButton(
      this.dailyRewardButtonGfx,
      COLORS.goldFill,
      COLORS.goldStroke,
      0.7,
    );

    this.dailyRewardButtonText = this.add
      .text(0, -8, "DAILY REWARD", {
        font: "bold 14px Orbitron",
        color: TEXT.bright,
        align: "center",
      })
      .setOrigin(0.5);

    this.dailyRewardgemIcon = this.add
      .image(-31, 11, "gem")
      .setDisplaySize(18, 18)
      .setOrigin(0.5);

    this.dailyRewardAmountText = this.add
      .text(-18, 11, "CLAIM +5", {
        font: "bold 14px Orbitron",
        color: TEXT.bright,
      })
      .setOrigin(0, 0.5);

    this.dailyRewardButtonHit = this.add
      .rectangle(0, 0, ACTION_WIDTH, ACTION_HEIGHT, 0xffffff, 0)
      .setOrigin(0.5);

    this.dailyRewardButton.add([
      this.dailyRewardButtonGfx,
      this.dailyRewardButtonText,
      this.dailyRewardgemIcon,
      this.dailyRewardAmountText,
      this.dailyRewardButtonHit,
    ]);

    audioManager.addButtonSound(this.dailyRewardButtonHit);

    // request gem
    this.gemRequestAvailableAt = profile.gemRequestAvailableAt;

    const requestButtonWidth = 175;

    const requestX = contentRight - requestButtonWidth / 2;

    this.gemRequestButton = this.add.container(requestX, topRowY);

    this.gemRequestButtonGfx = this.add.graphics();

    this.drawActionButton(
      this.gemRequestButtonGfx,
      COLORS.greenFill,
      COLORS.greenStroke,
      0.65,
    );

    this.gemRequestButtonGfx.setScale(requestButtonWidth / ACTION_WIDTH, 1);

    this.gemRequestButtonText = this.add
      .text(10, 0, "REQUEST GEM\nFROM COMMUNITY", {
        font: "bold 14px Orbitron",
        color: TEXT.bright,
        align: "center",
        lineSpacing: 4,
      })
      .setOrigin(0.5);

    this.gemRequestIcon = this.add
      .image(-60, -5, "gem")
      .setDisplaySize(24, 24)
      .setOrigin(0.5);

    this.gemRequestButtonHit = this.add
      .rectangle(0, 0, requestButtonWidth, ACTION_HEIGHT, 0xffffff, 0)
      .setOrigin(0.5);

    this.gemRequestButton.add([
      this.gemRequestButtonGfx,
      this.gemRequestIcon,
      this.gemRequestButtonText,
      this.gemRequestButtonHit,
    ]);

    audioManager.addButtonSound(this.gemRequestButtonHit);

    // player stats
    const statsY = panelY + 125;

    const statGap = 10;

    const statWidth = (panelWidth - 40 - statGap * 2) / 3;

    const allTimeBlock = this.createStatisticBlock(
      contentLeft + statWidth / 2,
      statsY,
      statWidth,
      "ALL-TIME BEST",
      profile.allTimeHighScore.toLocaleString(),
      TEXT.gold,
      0x2a230f,
    );

    const dailyBlock = this.createStatisticBlock(
      contentLeft + statWidth + statGap + statWidth / 2,
      statsY,
      statWidth,
      "TODAY'S BEST",
      profile.todayHighScore.toLocaleString(),
      TEXT.accent,
      0x0e2a36,
    );

    const rankBlock = this.createStatisticBlock(
      contentLeft + (statWidth + statGap) * 2 + statWidth / 2,
      statsY,
      statWidth,
      "GLOBAL RANK",
      profile.globalRank !== null ? `#${profile.globalRank}` : "UNRANKED",
      "#cdb4f0",
      0x231a33,
    );

    this.profileContent.add([
      usernameCard,
      usernameLabel,
      username,

      walletCard,
      gemIcon,
      gemLabel,
      gemAmount,

      this.dailyRewardButton,
      this.gemRequestButton,

      allTimeBlock,
      dailyBlock,
      rankBlock,
    ]);

    this.finishProfileSetup();
  }

  private renderMobilePlayerProfile(
    profile: PlayerProfileResponse,
    centerX: number,
    panelY: number,
    panelWidth: number,
    contentLeft: number,
    contentRight: number,
  ): void {
    const horizontalGap = 8;

    const availableWidth = contentRight - contentLeft;

    const halfWidth = (availableWidth - horizontalGap) / 2;

    const firstRowY = panelY - 49;
    const secondRowY = panelY + 4;
    const statsY = panelY + 70;

    // username
    const usernameX = contentLeft + halfWidth / 2;

    const usernameCard = this.addRoundedRect(
      usernameX,
      firstRowY,
      halfWidth,
      42,
      9,
      COLORS.slotFill,
      0.92,
      COLORS.slotStroke,
      0.4,
      1,
    );

    const usernameLabel = this.add
      .text(contentLeft + 10, firstRowY - 9, "RAIDER", {
        font: "bold 14px Orbitron",
        color: TEXT.muted,
        letterSpacing: 1,
      })
      .setOrigin(0, 0.5);

    const usernameText = this.add
      .text(contentLeft + 10, firstRowY + 8, `u/${profile.username}`, {
        font: "bold 14px Orbitron",
        color: TEXT.primary,
      })
      .setOrigin(0, 0.5);

    usernameText.setCrop(0, 0, halfWidth - 20, usernameText.height);

    // wallet
    const walletX = contentRight - halfWidth / 2;

    const walletCard = this.addRoundedRect(
      walletX,
      firstRowY,
      halfWidth,
      42,
      9,
      COLORS.greenFill,
      0.55,
      COLORS.green,
      0.32,
      1,
    );

    const gemIcon = this.add
      .image(walletX - halfWidth / 2 + 24, firstRowY, "gem")
      .setDisplaySize(22, 22);

    const gemLabel = this.add
      .text(walletX - halfWidth / 2 + 42, firstRowY - 9, "WALLET", {
        font: "bold 14px Orbitron",
        color: TEXT.muted,
        letterSpacing: 1,
      })
      .setOrigin(0, 0.5);

    const gemAmount = this.add
      .text(
        walletX - halfWidth / 2 + 42,
        firstRowY + 8,
        profile.gem.toLocaleString(),
        {
          font: "bold 14px Orbitron",
          color: TEXT.green,
        },
      )
      .setOrigin(0, 0.5);

    // action buttons
    this.dailyRewardCanClaim = profile.canClaimDailyReward;

    this.dailyRewardNextResetAt = profile.dailyRewardNextResetAt;

    this.gemRequestAvailableAt = profile.gemRequestAvailableAt;

    const mobileActionWidth = halfWidth;
    this.currentActionWidth = mobileActionWidth;
    this.currentActionHeight = 42;

    this.dailyRewardButton = this.add.container(
      contentLeft + halfWidth / 2,
      secondRowY,
    );

    this.dailyRewardButtonGfx = this.add.graphics();

    this.drawActionButton(
      this.dailyRewardButtonGfx,
      COLORS.goldFill,
      COLORS.goldStroke,
      0.7,
    );

    this.dailyRewardButtonText = this.add
      .text(0, -7, "DAILY REWARD", {
        font: "bold 14px Orbitron",
        color: TEXT.bright,
        align: "center",
      })
      .setOrigin(0.5);

    const dailyRewardgemIcon = this.add
      .image(-20, 9, "gem")
      .setDisplaySize(15, 15)
      .setOrigin(0.5);

    const dailyRewardAmountText = this.add
      .text(-9, 9, "CLAIM +5", {
        font: "bold 14px Orbitron",
        color: TEXT.bright,
      })
      .setOrigin(0, 0.5);

    this.dailyRewardButtonHit = this.add
      .rectangle(
        0,
        0,
        this.currentActionWidth,
        this.currentActionHeight,
        0xffffff,
        0,
      )
      .setOrigin(0.5);

    this.dailyRewardButton.add([
      this.dailyRewardButtonGfx,
      this.dailyRewardButtonText,
      dailyRewardgemIcon,
      dailyRewardAmountText,
      this.dailyRewardButtonHit,
    ]);

    this.gemRequestButton = this.add.container(
      contentRight - halfWidth / 2,
      secondRowY,
    );

    this.gemRequestButtonGfx = this.add.graphics();

    this.drawActionButton(
      this.gemRequestButtonGfx,
      COLORS.greenFill,
      COLORS.greenStroke,
      0.65,
    );

    this.gemRequestButtonText = this.add
      .text(0, 0, "REQUEST gem\nCREATE POST", {
        font: "bold 14px Orbitron",
        color: TEXT.bright,
        align: "center",
        lineSpacing: 3,
      })
      .setOrigin(0.5);

    this.gemRequestButtonHit = this.add
      .rectangle(
        0,
        0,
        this.currentActionWidth,
        this.currentActionHeight,
        0xffffff,
        0,
      )
      .setOrigin(0.5);

    this.gemRequestButton.add([
      this.gemRequestButtonGfx,
      this.gemRequestButtonText,
      this.gemRequestButtonHit,
    ]);

    // stats
    const statGap = 6;

    const statWidth = (availableWidth - statGap * 2) / 3;

    const allTimeBlock = this.createResponsiveStatisticBlock(
      contentLeft + statWidth / 2,
      statsY,
      statWidth,
      "ALL-TIME",
      profile.allTimeHighScore.toLocaleString(),
      TEXT.gold,
      0x2a230f,
    );

    const dailyBlock = this.createResponsiveStatisticBlock(
      contentLeft + statWidth + statGap + statWidth / 2,
      statsY,
      statWidth,
      "TODAY",
      profile.todayHighScore.toLocaleString(),
      TEXT.accent,
      0x0e2a36,
    );

    const rankBlock = this.createResponsiveStatisticBlock(
      contentLeft + (statWidth + statGap) * 2 + statWidth / 2,
      statsY,
      statWidth,
      "RANK",
      profile.globalRank !== null ? `#${profile.globalRank}` : "—",
      "#cdb4f0",
      0x231a33,
    );

    this.profileContent?.add([
      usernameCard,
      usernameLabel,
      usernameText,

      walletCard,
      gemIcon,
      gemLabel,
      gemAmount,

      this.dailyRewardButton,
      this.gemRequestButton,

      allTimeBlock,
      dailyBlock,
      rankBlock,
    ]);

    this.finishProfileSetup();
  }

  private createResponsiveStatisticBlock(
    x: number,
    y: number,
    width: number,
    label: string,
    value: string,
    valueColor: string,
    panelColor: number,
  ): GameObjects.Container {
    const container = this.add.container(x, y);

    const panel = this.addRoundedRect(
      0,
      0,
      width,
      48,
      8,
      panelColor,
      0.85,
      0xffffff,
      0.08,
      1,
    );

    const labelText = this.add
      .text(0, -11, label, {
        font: "bold 14px Orbitron",
        color: TEXT.muted,
        letterSpacing: 1,
      })
      .setOrigin(0.5);

    const valueText = this.add
      .text(0, 9, value, {
        font: "bold 14px Orbitron",
        color: valueColor,
        stroke: "#03121b",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    container.add([panel, labelText, valueText]);

    return container;
  }

  private finishProfileSetup(): void {
    this.configuregemRequestButton();
    this.configureDailyRewardButton();

    this.dailyRewardCountdownEvent?.remove();

    this.dailyRewardCountdownEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this.updateDailyRewardButton,
      callbackScope: this,
    });

    this.gemRequestCountdownEvent?.remove();

    this.gemRequestCountdownEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this.updategemRequestButton,
      callbackScope: this,
    });

    this.profileContent?.setAlpha(0).setY(13);

    if (this.profileContent) {
      this.tweens.add({
        targets: this.profileContent,
        alpha: 1,
        y: 0,
        duration: 220,
        ease: "Quad.easeOut",
      });
    }
  }

  private drawActionButton(
    graphics: GameObjects.Graphics,
    fill: number,
    stroke: number,
    strokeAlpha: number,
  ): void {
    const width = this.currentActionWidth;
    const height = this.currentActionHeight;

    graphics.clear();

    graphics.fillStyle(fill, 1);

    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 10);

    graphics.lineStyle(1.25, stroke, strokeAlpha);

    graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
  }

  private createStatisticBlock(
    x: number,
    y: number,
    width: number,
    label: string,
    value: string,
    valueColor: string,
    panelColor: number,
  ): GameObjects.Container {
    const container = this.add.container(x, y);

    const panel = this.addRoundedRect(
      0,
      0,
      width,
      58,
      10,
      panelColor,
      0.85,
      0xffffff,
      0.08,
      1,
    );

    const labelText = this.add
      .text(0, -14, label, {
        font: "bold 14px Orbitron",

        color: TEXT.muted,

        letterSpacing: 1,
      })
      .setOrigin(0.5);

    const valueText = this.add
      .text(0, 11, value, {
        font: "bold 17px Orbitron",

        color: valueColor,

        stroke: "#03121b",

        strokeThickness: 3,
      })
      .setOrigin(0.5);

    container.add([panel, labelText, valueText]);

    return container;
  }

  private formatgemRequestCountdown(milliseconds: number): string {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));

    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map((value) => value.toString().padStart(2, "0"))
      .join(":");
  }

  private updategemRequestButton(): void {
    const icon = this.gemRequestIcon;
    const button = this.gemRequestButton;

    const graphics = this.gemRequestButtonGfx;

    const hit = this.gemRequestButtonHit;

    const text = this.gemRequestButtonText;

    if (!button || !graphics || !hit || !text || !icon) {
      return;
    }

    if (button.getData("creating")) {
      return;
    }

    const remainingMs = Math.max(0, this.gemRequestAvailableAt - Date.now());

    button.setAlpha(1);

    text.setAlpha(1).setColor(TEXT.bright);

    if (remainingMs > 0) {
      icon.setVisible(false);

      text
        .setText(
          ["REQUEST AGAIN", this.formatgemRequestCountdown(remainingMs)].join(
            "\n",
          ),
        )
        .setPosition(0, 0)
        .setOrigin(0.5);

      this.drawActionButton(graphics, 0x1d2c34, 0x78a7b5, 0.8);

      hit.disableInteractive();

      return;
    }

    this.gemRequestAvailableAt = 0;

    icon.setVisible(true);

    text.setText("REQUEST\nFROM COMMUNITY").setPosition(7, 0).setOrigin(0.5);

    this.drawActionButton(graphics, COLORS.greenFill, COLORS.greenStroke, 0.75);

    hit.setInteractive({ useHandCursor: true });
  }

  private configuregemRequestButton(): void {
    const button = this.gemRequestButton;

    const graphics = this.gemRequestButtonGfx;

    const hit = this.gemRequestButtonHit;

    const text = this.gemRequestButtonText;

    if (!button || !graphics || !hit || !text) {
      return;
    }

    hit.on("pointerover", () => {
      if (this.gemRequestAvailableAt > Date.now()) {
        return;
      }

      button.setScale(1.04);
    });

    hit.on("pointerout", () => {
      button.setScale(1);
    });

    hit.on("pointerdown", () => {
      if (this.gemRequestAvailableAt > Date.now()) {
        return;
      }

      button.setScale(0.96);
    });

    hit.on("pointerup", () => {
      button.setScale(1);

      if (
        button.getData("creating") ||
        this.gemRequestAvailableAt > Date.now()
      ) {
        return;
      }

      button.setData("creating", true);

      hit.disableInteractive();

      button.setAlpha(0.65);

      this.gemRequestIcon?.setVisible(false);

      text.setText("CREATING\nREQUEST...").setPosition(0, 0).setOrigin(0.5);

      void this.creategemRequest().then((nextRequestAvailableAt) => {
        if (!button.active) {
          return;
        }

        button.setData("creating", false);

        if (nextRequestAvailableAt !== null) {
          this.gemRequestAvailableAt = nextRequestAvailableAt;

          this.updategemRequestButton();

          return;
        }

        this.gemRequestAvailableAt = 0;

        this.updategemRequestButton();
      });
    });

    this.updategemRequestButton();
  }

  private handleResize(gameSize: Structs.Size): void {
    const widthDifference = Math.abs(gameSize.width - this.lastWidth);

    const heightDifference = Math.abs(gameSize.height - this.lastHeight);

    const isSmallMobileAdjustment =
      widthDifference < 10 && heightDifference < 80;

    if (isSmallMobileAdjustment) {
      return;
    }

    this.lastWidth = gameSize.width;

    this.lastHeight = gameSize.height;

    this.cameras.resize(gameSize.width, gameSize.height);

    this.scene.restart();
  }

  private showgemRequestStatus(message: string, success: boolean): void {
    this.gemRequestStatusText?.destroy();
    this.gemRequestStatusText = this.add
      .text(this.scale.width / 2, this.scale.height * 0.285, message, {
        font: "bold 14px Orbitron",
        color: success ? TEXT.green : "#ff9999",
        backgroundColor: success ? "#103a27" : "#3d1820",
        padding: { x: 16, y: 9 },
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(500);
    this.time.delayedCall(5000, () => {
      if (this.gemRequestStatusText?.active) {
        this.gemRequestStatusText.destroy();
        this.gemRequestStatusText = null;
      }
    });
  }

  private async creategemRequest(): Promise<number | null> {
    try {
      const response = await fetch("/api/request-gem", {
        method: "POST",

        headers: {
          Accept: "application/json",
        },
      });

      const rawResponse = await response.text();

      let responseData:
        | {
            type?: "create-gem-request";

            status?: "success";

            message?: string;

            requestId?: string;

            nextRequestAvailableAt?: number;
          }
        | ApiErrorResponse;

      try {
        responseData = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error("The server returned invalid data.");
      }

      if (
        !response.ok ||
        !("type" in responseData) ||
        responseData.type !== "create-gem-request"
      ) {
        const message =
          "message" in responseData
            ? responseData.message
            : "Unable to create gem request.";

        throw new Error(message);
      }

      const nextRequestAvailableAt = Number(
        responseData.nextRequestAvailableAt,
      );

      if (!Number.isFinite(nextRequestAvailableAt)) {
        throw new Error("The server did not return the next request time.");
      }

      this.showgemRequestStatus(
        responseData.message ?? "Gem request shared",
        true,
      );

      return nextRequestAvailableAt;
    } catch (error) {
      console.error("[MainMenu] Failed to request gem:", error);

      this.showgemRequestStatus(
        error instanceof Error
          ? error.message
          : "Unable to create gem request.",
        false,
      );

      // reload authoritative cooldown state.
      void this.loadPlayerProfile();

      return null;
    }
  }

  private updateDailyRewardButton(): void {
    const button = this.dailyRewardButton;
    const graphics = this.dailyRewardButtonGfx;
    const hit = this.dailyRewardButtonHit;
    const titleText = this.dailyRewardButtonText;
    const amountText = this.dailyRewardAmountText;
    const gemIcon = this.dailyRewardgemIcon;

    if (!button || !graphics || !hit || !titleText || !amountText || !gemIcon) {
      return;
    }

    if (button.getData("claiming")) {
      return;
    }

    button.setAlpha(1);

    titleText.setText("DAILY REWARD").setAlpha(1).setColor(TEXT.bright);

    amountText.setAlpha(1).setColor(TEXT.bright);

    gemIcon.setAlpha(1);

    if (this.dailyRewardCanClaim) {
      amountText.setText("CLAIM +5").setPosition(-18, 11).setOrigin(0, 0.5);

      gemIcon.setVisible(true).setPosition(-31, 11);

      this.drawActionButton(graphics, COLORS.goldFill, COLORS.goldStroke, 0.9);

      hit.setInteractive({
        useHandCursor: true,
      });

      return;
    }

    const remainingMs = Math.max(0, this.dailyRewardNextResetAt - Date.now());

    gemIcon.setVisible(false);

    if (remainingMs <= 0) {
      amountText.setText("CHECKING...").setPosition(0, 11).setOrigin(0.5);

      this.drawActionButton(graphics, 0x33301c, 0xb8a66a, 0.8);

      hit.disableInteractive();

      void this.loadPlayerProfile();

      return;
    }

    amountText
      .setText(this.formatgemRequestCountdown(remainingMs))
      .setPosition(0, 11)
      .setOrigin(0.5);

    this.drawActionButton(graphics, 0x33301c, 0xb8a66a, 0.8);

    hit.disableInteractive();
  }

  private configureDailyRewardButton(): void {
    const button = this.dailyRewardButton;
    const graphics = this.dailyRewardButtonGfx;
    const hit = this.dailyRewardButtonHit;
    const titleText = this.dailyRewardButtonText;
    const amountText = this.dailyRewardAmountText;
    const gemIcon = this.dailyRewardgemIcon;

    if (!button || !graphics || !hit || !titleText || !amountText || !gemIcon) {
      return;
    }

    hit.on("pointerover", () => {
      if (!this.dailyRewardCanClaim) {
        return;
      }

      button.setScale(1.04);
    });

    hit.on("pointerout", () => {
      button.setScale(1);
    });

    hit.on("pointerdown", () => {
      if (!this.dailyRewardCanClaim) {
        return;
      }

      button.setScale(0.96);
    });

    hit.on("pointerup", () => {
      button.setScale(1);

      if (!this.dailyRewardCanClaim || button.getData("claiming")) {
        return;
      }

      button.setData("claiming", true);

      hit.disableInteractive();

      button.setAlpha(0.65);

      titleText.setText("DAILY REWARD");

      amountText.setText("CLAIMING...").setPosition(0, 11).setOrigin(0.5);

      gemIcon.setVisible(false);

      void this.claimDailyReward().then((success) => {
        if (!button.active) {
          return;
        }

        button.setData("claiming", false);

        if (!success) {
          this.updateDailyRewardButton();
        }
      });
    });

    this.updateDailyRewardButton();
  }

  private async claimDailyReward(): Promise<boolean> {
    try {
      const response = await fetch("/api/claim-daily-reward", {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      const rawResponse = await response.text();
      let responseData:
        | {
            type?: "claim-daily-reward";
            status?: "success";
            message?: string;
            rewardgem?: number;
            totalgem?: number;
            nextResetAt?: number;
          }
        | ApiErrorResponse;
      try {
        responseData = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error("The server returned invalid daily-reward data.");
      }
      if (
        !response.ok ||
        !("type" in responseData) ||
        responseData.type !== "claim-daily-reward"
      ) {
        const message =
          "message" in responseData
            ? responseData.message
            : "Unable to claim daily reward.";
        throw new Error(message);
      }
      this.dailyRewardCanClaim = false;
      this.dailyRewardNextResetAt = Number(responseData.nextResetAt);
      this.showgemRequestStatus(
        responseData.message ?? "You received 5 gem!",
        true,
      );
      await this.loadPlayerProfile();
      return true;
    } catch (error) {
      console.error("[MainMenu] Daily reward failed:", error);
      this.showgemRequestStatus(
        error instanceof Error
          ? error.message
          : "Unable to claim daily reward.",
        false,
      );
      await this.loadPlayerProfile();
      return false;
    }
  }

  private async enterKingBattle(): Promise<void> {
    if (this.kingEntryInProgress) {
      return;
    }

    this.kingEntryInProgress = true;

    this.showgemRequestStatus(`Preparing ${this.currentKingName}...`, true);

    try {
      const response = await fetch("/api/king-entry", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          expectedDay: this.currentKingDay,
        }),
      });

      const rawResponse = await response.text();

      let responseData: EnterKingBattleResponse | ApiErrorResponse;

      try {
        responseData = rawResponse
          ? JSON.parse(rawResponse)
          : {
              status: "error",
              message: "The server returned no data.",
            };
      } catch {
        throw new Error("The server returned invalid King Battle data.");
      }

      if (
        !response.ok ||
        !("type" in responseData) ||
        responseData.type !== "enter-king-battle"
      ) {
        const message =
          "message" in responseData
            ? responseData.message
            : "Unable to enter King Battle.";

        throw new Error(message);
      }

      this.scene.start("Game", {
        mode: "king",
        kingDay: responseData.serverDay,
        kingCharacterCode: responseData.kingCharacterCode,
        unlockCharacterCode: responseData.unlockCharacterCode,
        kingLevel: responseData.kingLevel,
        kingName: this.currentKingName,
        kingRewardName: this.currentKingRewardName,
        battleToken: responseData.battleToken,
      });
    } catch (error) {
      console.error("[MainMenu] Failed to enter King Battle:", error);

      this.showgemRequestStatus(
        error instanceof Error ? error.message : "Unable to enter King Battle.",
        false,
      );

      this.kingEntryInProgress = false;

      void this.loadPlayerProfile();
    }
  }
  private async resetRaider4ForTesting(): Promise<void> {
    try {
      const response = await fetch("/api/dev-lock-raider4", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });

      const rawResponse = await response.text();

      let data: {
        status?: string;
        message?: string;
      } = {};

      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(
          `Server returned non-JSON data. Status: ${response.status}`,
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ?? `Reset failed with status ${response.status}.`,
        );
      }

      await this.loadPlayerProfile();
    } catch (error) {
      console.error("[DEV RESET] Failed:", error);
    }
  }
  private createTodayKingPanel(
    centerX: number,
    y: number,
    width: number,
  ): GameObjects.Container {
    const mobile = width < 500;

    const panelHeight = 90;

    const iconRadius = mobile ? 27 : 31;

    const iconX = -width / 2 + (mobile ? 42 : 53);

    const textX = -width / 2 + (mobile ? 78 : 98);

    const container = this.add.container(centerX, y);

    const shadow = this.add.rectangle(4, 6, width, panelHeight, 0x000000, 0.48);

    const background = this.add
      .rectangle(0, 0, width, panelHeight, 0x291b12, 0.96)
      .setStrokeStyle(2, 0xffb45c, 0.88);

    const iconBackground = this.add
      .circle(iconX, 0, iconRadius, 0x422515, 1)
      .setStrokeStyle(2, 0xffd37a, 0.9);

    const sourceIconKey = this.textures.exists(this.currentKingIconKey)
      ? this.currentKingIconKey
      : "raider4Icon";

    const circularKingTexture = this.createCircularIconTexture(
      sourceIconKey,
      `${sourceIconKey}_today_king_circular`,
      1.3,
    );

    const kingIcon = this.add
      .image(iconX, 0, circularKingTexture)
      .setDisplaySize(iconRadius * 1.68, iconRadius * 1.68);
    const titleText = this.add
      .text(textX, -22, "TODAY'S KING", {
        font: `bold 14px Orbitron`,

        color: "#ffd37a",

        stroke: "#000000",

        strokeThickness: 3,

        letterSpacing: 2,
      })
      .setOrigin(0, 0.5);

    const kingNameText = this.add
      .text(textX, 1, this.currentKingName, {
        font: `bold 17px Orbitron`,

        color: "#ffffff",

        stroke: "#000000",

        strokeThickness: 4,
      })
      .setOrigin(0, 0.5);

    const rewardText = this.add
      .text(
        textX,
        25,
        `DEFEAT TO UNLOCK ${this.currentKingRewardName.toUpperCase()}`,
        {
          font: `14px Arial`,

          color: "#ffcf86",

          stroke: "#000000",

          strokeThickness: 2,
          wordWrap: {
            width: width - (mobile ? 96 : 125),
          },
        },
      )
      .setOrigin(0, 0.5);

    container.add([
      shadow,
      background,
      iconBackground,
      kingIcon,
      titleText,
      kingNameText,
      rewardText,
    ]);

    this.tweens.add({
      targets: iconBackground,

      alpha: {
        from: 0.72,
        to: 1,
      },

      scaleX: {
        from: 0.95,
        to: 1.05,
      },

      scaleY: {
        from: 0.95,
        to: 1.05,
      },

      duration: 1500,

      yoyo: true,

      repeat: -1,

      ease: "Sine.easeInOut",
    });

    return container;
  }

  private createCircularIconTexture(
    sourceTextureKey: string,
    outputTextureKey: string,
    zoom = 1.25,
  ): string {
    if (this.textures.exists(outputTextureKey)) {
      return outputTextureKey;
    }

    const textureSize = 256;

    const canvasTexture = this.textures.createCanvas(
      outputTextureKey,
      textureSize,
      textureSize,
    );

    if (!canvasTexture) {
      return sourceTextureKey;
    }

    const context = canvasTexture.getContext();

    const sourceImage = this.textures
      .get(sourceTextureKey)
      .getSourceImage() as CanvasImageSource;

    context.clearRect(0, 0, textureSize, textureSize);

    context.save();

    context.beginPath();

    context.arc(
      textureSize / 2,
      textureSize / 2,
      textureSize / 2,
      0,
      Math.PI * 2,
    );

    context.closePath();
    context.clip();

    const drawnSize = textureSize * zoom;

    const drawX = (textureSize - drawnSize) / 2;

    const drawY = (textureSize - drawnSize) / 2;

    context.drawImage(sourceImage, drawX, drawY, drawnSize, drawnSize);

    context.restore();

    canvasTexture.refresh();

    return outputTextureKey;
  }

  private calculateLayout(width: number, height: number): MainMenuLayout {
    const mobile = width < 680;

    const compact = height < 720;

    const outerMargin = mobile ? 10 : 17;

    const cardWidth = Math.min(
      mobile ? width - outerMargin * 2 : 860,
      width - outerMargin * 2,
    );

    const cardHeight = height - outerMargin * 2;

    const cardTop = outerMargin;

    const cardBottom = cardTop + cardHeight;

    const centerX = width / 2;

    const horizontalPadding = mobile ? 14 : 32;

    const contentWidth = cardWidth - horizontalPadding * 2;

    const headerY = cardTop + (compact ? 44 : mobile ? 55 : 66);

    const profileHeight = mobile ? (compact ? 198 : 215) : 184;

    const profileY = cardTop + (compact ? 140 : mobile ? 160 : 196);

    const profileWidth = contentWidth;

    const profileBottom = profileY + profileHeight / 2;

    const featureGap = mobile ? 8 : 12;

    const featuresShareRow = !mobile;

    const featureHeight = compact ? 78 : 86;

    const todayKingWidth = featuresShareRow
      ? (contentWidth - featureGap) / 2
      : contentWidth;

    const communityWidth = featuresShareRow
      ? (contentWidth - featureGap) / 2
      : contentWidth;

    const communityHeight = featureHeight;

    const todayKingY = profileBottom + 12 + featureHeight / 2;

    const communityY = featuresShareRow
      ? todayKingY
      : todayKingY + featureHeight / 2 + 8 + communityHeight / 2;

    const featureBottom = featuresShareRow
      ? todayKingY + featureHeight / 2
      : communityY + communityHeight / 2;

    const mainButtonHeight = compact ? 46 : 50;

    const secondaryButtonHeight = compact ? 42 : 46;

    const buttonRowGap = compact ? 8 : 10;

    const playY = featureBottom + 12 + mainButtonHeight / 2;

    // Play and King Battle share the same row.
    const kingBattleY = playY;

    const secondaryY =
      playY + mainButtonHeight / 2 + buttonRowGap + secondaryButtonHeight / 2;

    const buttonHorizontalGap = mobile ? 8 : 12;

    const secondaryWidth = (contentWidth - buttonHorizontalGap) / 2;

    const secondaryGap = secondaryWidth / 2 + buttonHorizontalGap / 2;

    const footerY = Math.min(
      cardBottom - 20,
      secondaryY + secondaryButtonHeight / 2 + 24,
    );

    return {
      mobile,
      compact,

      centerX,

      cardTop,
      cardBottom,
      cardWidth,
      cardHeight,

      contentWidth,

      headerY,

      profileY,
      profileWidth,
      profileHeight,

      todayKingY,
      todayKingWidth,

      communityY,
      communityWidth,
      communityHeight,

      playY,
      kingBattleY,

      secondaryY,
      secondaryWidth,
      secondaryGap,

      footerY,
    };
  }
}
