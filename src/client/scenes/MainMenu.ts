import { GameObjects, Input, Scene, Structs } from "phaser";
import Phaser from "phaser";
import type { ApiErrorResponse, PlayerProfileResponse } from "../../shared/api";

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

  private lastWidth = 0;

  private lastHeight = 0;
  private cashRequestStatusText: GameObjects.Text | null = null;

  private cashRequestButton: GameObjects.Container | null = null;
  private cashRequestButtonGfx: GameObjects.Graphics | null = null;
  private cashRequestButtonHit: GameObjects.Rectangle | null = null;
  private cashRequestButtonText: GameObjects.Text | null = null;
  private cashRequestAvailableAt = 0;
  private cashRequestCountdownEvent: Phaser.Time.TimerEvent | null = null;

  private dailyRewardButton: GameObjects.Container | null = null;
  private dailyRewardButtonGfx: GameObjects.Graphics | null = null;
  private dailyRewardButtonHit: GameObjects.Rectangle | null = null;
  private dailyRewardButtonText: GameObjects.Text | null = null;
  private dailyRewardNextResetAt = 0;
  private dailyRewardCanClaim = false;
  private dailyRewardCountdownEvent: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super("MainMenu");
  }

  init(): void {
    this.background = null;
    this.profileStatusText = null;
    this.profileContent = null;
    this.mainCard = null;
    this.cashRequestStatusText = null;
    this.cashRequestButton = null;
    this.cashRequestButtonGfx = null;
    this.cashRequestButtonHit = null;
    this.cashRequestButtonText = null;
    this.cashRequestAvailableAt = 0;
    this.cashRequestCountdownEvent = null;
    this.dailyRewardButton = null;
    this.dailyRewardButtonGfx = null;
    this.dailyRewardButtonHit = null;
    this.dailyRewardButtonText = null;
    this.dailyRewardNextResetAt = 0;
    this.dailyRewardCanClaim = false;
    this.dailyRewardCountdownEvent = null;
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

    this.scale.on("resize", this.handleResize, this);

    this.events.once("shutdown", () => {
      this.scale.off("resize", this.handleResize, this);
      this.cashRequestCountdownEvent?.remove();
      this.dailyRewardCountdownEvent?.remove();
      this.cashRequestCountdownEvent = null;
      this.dailyRewardCountdownEvent = null;
    });

    void this.loadPlayerProfile();
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

  private createMainCard(
    centerX: number,
    centerY: number,
    width: number,
    height: number,
  ): void {
    const cardWidth = Math.min(860, width - 34);

    const cardHeight = Math.min(700, height - 22);

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
      centerY - cardHeight / 2 + 16,
      cardWidth * 0.4,
      4,
      2,
      COLORS.accent,
      0.7,
    );

    this.mainCard?.add([shadow, card, innerHairline, topAccent]);
  }

  private createHeader(centerX: number, height: number): void {
    const titleGlow = this.add.ellipse(
      centerX,
      height * 0.135,
      460,
      78,
      COLORS.accent,
      0.045,
    );

    const eyebrow = this.add
      .text(centerX, height * 0.082, "SURVIVE  •  GROW  •  CONQUER", {
        font: "bold 9px Orbitron",

        color: TEXT.accent,

        letterSpacing: 3,
      })
      .setOrigin(0.5);

    const title = this.add
      .text(centerX, height * 0.135, "THE YOUNG RAIDER", {
        font: "bold 36px Orbitron",

        color: TEXT.bright,

        stroke: "#03121b",

        strokeThickness: 5,

        align: "center",
      })
      .setOrigin(0.5);

    title.setShadow(0, 0, "#4fcfff", 10, true, true);

    const description = this.add
      .text(
        centerX,
        height * 0.19,
        "Destroy bases, survive disasters and climb the global ranks.",
        {
          font: "12px Orbitron",

          color: TEXT.muted,

          align: "center",
        },
      )
      .setOrigin(0.5);

    this.mainCard?.add([titleGlow, eyebrow, title, description]);
  }

  private createProfilePanel(
    centerX: number,
    height: number,
    width: number,
  ): void {
    const panelY = height * 0.385;

    const panelWidth = Math.min(760, width - 66);

    const panelHeight = 190;

    const radius = 14;

    const shadow = this.addSoftShadow(
      centerX,
      panelY,
      panelWidth,
      panelHeight,
      radius,
      0.4,
    );

    const panel = this.addRoundedRect(
      centerX,
      panelY,
      panelWidth,
      panelHeight,
      radius,
      COLORS.panelFill,
      0.96,
      COLORS.panelStroke,
      0.36,
      1.25,
    );

    const headerLabel = this.add
      .text(
        centerX - panelWidth / 2 + 22,
        panelY - panelHeight / 2 + 20,
        "RAIDER PROFILE",
        {
          font: "bold 11px Orbitron",

          color: TEXT.accent,

          letterSpacing: 2,
        },
      )
      .setOrigin(0, 0.5);

    const onlinePill = this.addRoundedRect(
      centerX + panelWidth / 2 - 52,
      headerLabel.y,
      66,
      18,
      9,
      COLORS.green,
      0.12,
      COLORS.green,
      0.4,
      1,
    );

    const onlineDot = this.add.circle(
      centerX + panelWidth / 2 - 76,
      headerLabel.y,
      3.5,
      0x69ff9c,
      1,
    );

    const onlineText = this.add
      .text(centerX + panelWidth / 2 - 24, headerLabel.y, "ONLINE", {
        font: "bold 8px Orbitron",

        color: TEXT.green,

        letterSpacing: 1,
      })
      .setOrigin(1, 0.5);

    const divider = this.add
      .rectangle(
        centerX,
        panelY - panelHeight / 2 + 36,
        panelWidth - 36,
        1,
        0xffffff,
        0.07,
      )
      .setOrigin(0.5);

    this.tweens.add({
      targets: onlineDot,

      alpha: {
        from: 0.35,
        to: 1,
      },

      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    this.profileStatusText = this.add
      .text(centerX, panelY + 12, "Loading Raider profile...", {
        font: "13px Orbitron",

        color: TEXT.primary,
      })
      .setOrigin(0.5);

    this.mainCard?.add([
      shadow,
      panel,
      headerLabel,
      onlinePill,
      onlineDot,
      onlineText,
      divider,
      this.profileStatusText,
    ]);
  }

  private createMenuButtons(
    centerX: number,
    height: number,
    width: number,
  ): void {
    const playButton = this.createMenuButton({
      x: centerX,
      y: height * 0.67,
      width: Math.min(390, width - 110),
      height: 62,
      title: "PLAY NOW",
      subtitle: "BEGIN A NEW RUN",
      backgroundColor: 0x14633a,
      borderColor: COLORS.greenStroke,
      onClick: () => {
        this.scene.start("Game");
      },
    });
    const secondaryWidth = Math.min(280, (width - 110) / 2);
    const buttonGap = secondaryWidth / 2 + 10;
    const collectionsButton = this.createMenuButton({
      x: centerX - buttonGap,
      y: height * 0.805,
      width: secondaryWidth,
      height: 52,
      title: "COLLECTIONS",
      subtitle: "YOUR RAIDERS",
      backgroundColor: 0x123f59,
      borderColor: 0x71d9ff,
      onClick: () => {
        this.scene.start("Collections");
      },
    });
    const leaderboardButton = this.createMenuButton({
      x: centerX + buttonGap,
      y: height * 0.805,
      width: secondaryWidth,
      height: 52,
      title: "LEADERBOARD",
      subtitle: "TOP 100 RAIDERS",
      backgroundColor: 0x3a2a5c,
      borderColor: 0xb995ef,
      onClick: () => {
        this.scene.start("Leaderboard", { returnTo: "main-menu" });
      },
    });
    this.mainCard?.add([playButton, collectionsButton, leaderboardButton]);
  }

  private createMenuButton(options: MenuButtonOptions): GameObjects.Container {
    const container = this.add.container(options.x, options.y);
    let wasPressed = false;

    const radius = Math.min(16, options.height / 2.4);

    const shadow = this.addRoundedRect(
      0,
      5,
      options.width,
      options.height,
      radius,
      COLORS.shadow,
      0.4,
    );

    const glow = this.addRoundedRect(
      0,
      0,
      options.width + 9,
      options.height + 9,
      radius + 3,
      options.borderColor,
      0,
      options.borderColor,
      0.6,
      2,
    );
    glow.setAlpha(0.12);

    const button = this.addRoundedRect(
      0,
      0,
      options.width,
      options.height,
      radius,
      options.backgroundColor,
      0.97,
      options.borderColor,
      0.6,
      1.5,
    );

    const topHighlight = this.addRoundedRect(
      0,
      -options.height * 0.28,
      options.width - 16,
      options.height * 0.2,
      radius * 0.6,
      0xffffff,
      0.05,
    );

    const titleText = this.add
      .text(0, options.title === "PLAY NOW" ? -7 : -6, options.title, {
        font:
          options.title === "PLAY NOW"
            ? "bold 21px Orbitron"
            : "bold 14px Orbitron",
        color: TEXT.bright,
        stroke: "#03121b",
        strokeThickness: 3,
        letterSpacing: 1,
      })
      .setOrigin(0.5);

    const subtitleText = this.add
      .text(0, options.title === "PLAY NOW" ? 17 : 14, options.subtitle, {
        font: "bold 7px Orbitron",
        color: "#cfe6ef",
        letterSpacing: 1,
      })
      .setOrigin(0.5);

    const hit = this.add
      .rectangle(0, 0, options.width, options.height, 0xffffff, 0)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    container.add([
      shadow,
      glow,
      button,
      topHighlight,
      titleText,
      subtitleText,
      hit,
    ]);

    hit.on("pointerover", () => {
      this.tweens.killTweensOf(container);
      this.tweens.add({
        targets: container,
        scaleX: 1.025,
        scaleY: 1.025,
        duration: 90,
        ease: "Quad.easeOut",
      });
      glow.setAlpha(0.5);
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
      glow.setAlpha(0.12);
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

  private createFooter(centerX: number, height: number): void {
    const line = this.add
      .rectangle(centerX, height * 0.905, 420, 1, COLORS.accent, 0.1)
      .setOrigin(0.5);
    const footer = this.add
      .text(centerX, height * 0.93, "EVERY RUN IS ANOTHER CHANCE", {
        font: "8px Orbitron",
        color: TEXT.muted,
        letterSpacing: 2,
      })
      .setOrigin(0.5);
    this.mainCard?.add([line, footer]);
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

      this.renderPlayerProfile(profile);
    } catch (error) {
      console.error("[MainMenu] Failed to load profile:", error);

      const message = error instanceof Error ? error.message : "Unknown error";

      this.profileStatusText
        ?.setColor(TEXT.danger)
        .setText(["PROFILE UNAVAILABLE", message].join("\n"));
    }
  }

  private renderPlayerProfile(profile: PlayerProfileResponse): void {
    this.profileStatusText?.destroy();

    this.profileStatusText = null;

    this.profileContent?.destroy(true);

    this.profileContent = this.add.container(0, 0);

    const centerX = this.scale.width / 2;

    const panelY = this.scale.height * 0.385;

    const panelWidth = Math.min(760, this.scale.width - 66);

    const contentLeft = centerX - panelWidth / 2 + 20;

    const contentRight = centerX + panelWidth / 2 - 20;

    const topRowY = panelY - 29;

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
        font: "bold 9px Orbitron",

        color: TEXT.muted,

        letterSpacing: 1,
      })
      .setOrigin(0, 0.5);

    const username = this.add
      .text(usernameTextX, topRowY + 8, `u/${profile.username}`, {
        font: "bold 13px Orbitron",

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

    const cashIcon = this.add
      .image(walletX - 60, topRowY, "cash")
      .setDisplaySize(26, 26);

    const cashLabel = this.add
      .text(walletX - 38, topRowY - 10, "WALLET", {
        font: "bold 9px Orbitron",

        color: TEXT.muted,

        letterSpacing: 1,
      })
      .setOrigin(0, 0.5);

    const cashAmount = this.add
      .text(walletX - 38, topRowY + 8, profile.cash.toLocaleString(), {
        font: "bold 14px Orbitron",

        color: TEXT.green,
      })
      .setOrigin(0, 0.5);

    // daily rewards
    this.dailyRewardCanClaim = profile.canClaimDailyReward;

    this.dailyRewardNextResetAt = profile.dailyRewardNextResetAt;

    const dailyX = contentRight - ACTION_WIDTH * 1.5 - 8;

    this.dailyRewardButton = this.add.container(dailyX, topRowY);

    this.dailyRewardButtonGfx = this.add.graphics();

    this.drawActionButton(
      this.dailyRewardButtonGfx,
      COLORS.goldFill,
      COLORS.goldStroke,
      0.7,
    );

    this.dailyRewardButtonText = this.add
      .text(0, 0, "DAILY REWARD\nCLAIM +5 CASH", {
        font: "bold 11px Orbitron",

        color: TEXT.bright,

        align: "center",

        lineSpacing: 5,
      })
      .setOrigin(0.5);

    this.dailyRewardButtonHit = this.add
      .rectangle(0, 0, ACTION_WIDTH, ACTION_HEIGHT, 0xffffff, 0)
      .setOrigin(0.5);

    this.dailyRewardButton.add([
      this.dailyRewardButtonGfx,
      this.dailyRewardButtonText,
      this.dailyRewardButtonHit,
    ]);

    // request cash
    this.cashRequestAvailableAt = profile.cashRequestAvailableAt;

    const requestX = contentRight - ACTION_WIDTH / 2;

    this.cashRequestButton = this.add.container(requestX, topRowY);

    this.cashRequestButtonGfx = this.add.graphics();

    this.drawActionButton(
      this.cashRequestButtonGfx,
      COLORS.greenFill,
      COLORS.greenStroke,
      0.65,
    );

    this.cashRequestButtonText = this.add
      .text(0, 0, "REQUEST CASH\nCREATE POST", {
        font: "bold 11px Orbitron",

        color: TEXT.bright,

        align: "center",

        lineSpacing: 5,
      })
      .setOrigin(0.5);

    this.cashRequestButtonHit = this.add
      .rectangle(0, 0, ACTION_WIDTH, ACTION_HEIGHT, 0xffffff, 0)
      .setOrigin(0.5);

    this.cashRequestButton.add([
      this.cashRequestButtonGfx,
      this.cashRequestButtonText,
      this.cashRequestButtonHit,
    ]);

    // player stats
    const statsY = panelY + 43;

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
      cashIcon,
      cashLabel,
      cashAmount,

      this.dailyRewardButton,
      this.cashRequestButton,

      allTimeBlock,
      dailyBlock,
      rankBlock,
    ]);

    this.configureCashRequestButton();
    this.configureDailyRewardButton();

    this.dailyRewardCountdownEvent?.remove();

    this.dailyRewardCountdownEvent = this.time.addEvent({
      delay: 1000,
      loop: true,

      callback: this.updateDailyRewardButton,

      callbackScope: this,
    });

    this.cashRequestCountdownEvent?.remove();

    this.cashRequestCountdownEvent = this.time.addEvent({
      delay: 1000,
      loop: true,

      callback: this.updateCashRequestButton,

      callbackScope: this,
    });

    this.profileContent.setAlpha(0).setY(5);

    this.tweens.add({
      targets: this.profileContent,

      alpha: 1,
      y: 0,

      duration: 220,

      ease: "Quad.easeOut",
    });
  }

  private drawActionButton(
    graphics: GameObjects.Graphics,
    fill: number,
    stroke: number,
    strokeAlpha: number,
  ): void {
    graphics.clear();
    graphics.fillStyle(fill, 1);
    graphics.fillRoundedRect(
      -ACTION_WIDTH / 2,
      -ACTION_HEIGHT / 2,
      ACTION_WIDTH,
      ACTION_HEIGHT,
      10,
    );
    graphics.lineStyle(1.25, stroke, strokeAlpha);
    graphics.strokeRoundedRect(
      -ACTION_WIDTH / 2,
      -ACTION_HEIGHT / 2,
      ACTION_WIDTH,
      ACTION_HEIGHT,
      10,
    );
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
        font: "bold 8px Orbitron",

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

  private formatCashRequestCountdown(milliseconds: number): string {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));

    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map((value) => value.toString().padStart(2, "0"))
      .join(":");
  }

  private updateCashRequestButton(): void {
    const button = this.cashRequestButton;

    const graphics = this.cashRequestButtonGfx;

    const hit = this.cashRequestButtonHit;

    const text = this.cashRequestButtonText;

    if (!button || !graphics || !hit || !text) {
      return;
    }

    if (button.getData("creating")) {
      return;
    }

    const remainingMs = Math.max(0, this.cashRequestAvailableAt - Date.now());

    button.setAlpha(1);

    text.setAlpha(1).setColor(TEXT.bright);

    if (remainingMs > 0) {
      text.setText(
        ["REQUEST CASH", this.formatCashRequestCountdown(remainingMs)].join(
          "\n",
        ),
      );

      this.drawActionButton(graphics, 0x1d2c34, 0x78a7b5, 0.8);

      hit.disableInteractive();

      return;
    }

    this.cashRequestAvailableAt = 0;

    text.setText("REQUEST CASH\nCREATE POST");

    this.drawActionButton(graphics, COLORS.greenFill, COLORS.greenStroke, 0.75);

    hit.setInteractive({ useHandCursor: true });
  }

  private configureCashRequestButton(): void {
    const button = this.cashRequestButton;

    const graphics = this.cashRequestButtonGfx;

    const hit = this.cashRequestButtonHit;

    const text = this.cashRequestButtonText;

    if (!button || !graphics || !hit || !text) {
      return;
    }

    hit.on("pointerover", () => {
      if (this.cashRequestAvailableAt > Date.now()) {
        return;
      }

      button.setScale(1.04);
    });

    hit.on("pointerout", () => {
      button.setScale(1);
    });

    hit.on("pointerdown", () => {
      if (this.cashRequestAvailableAt > Date.now()) {
        return;
      }

      button.setScale(0.96);
    });

    hit.on("pointerup", () => {
      button.setScale(1);

      if (
        button.getData("creating") ||
        this.cashRequestAvailableAt > Date.now()
      ) {
        return;
      }

      button.setData("creating", true);

      hit.disableInteractive();

      button.setAlpha(0.65);

      text.setText("CREATING...");

      void this.createCashRequest().then((nextRequestAvailableAt) => {
        if (!button.active) {
          return;
        }

        button.setData("creating", false);

        if (nextRequestAvailableAt !== null) {
          this.cashRequestAvailableAt = nextRequestAvailableAt;

          this.updateCashRequestButton();

          return;
        }

        this.cashRequestAvailableAt = 0;

        this.updateCashRequestButton();
      });
    });

    this.updateCashRequestButton();
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

  private showCashRequestStatus(message: string, success: boolean): void {
    this.cashRequestStatusText?.destroy();
    this.cashRequestStatusText = this.add
      .text(this.scale.width / 2, this.scale.height * 0.285, message, {
        font: "bold 11px Orbitron",
        color: success ? TEXT.green : "#ff9999",
        backgroundColor: success ? "#103a27" : "#3d1820",
        padding: { x: 16, y: 9 },
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(500);
    this.time.delayedCall(5000, () => {
      if (this.cashRequestStatusText?.active) {
        this.cashRequestStatusText.destroy();
        this.cashRequestStatusText = null;
      }
    });
  }

  private async createCashRequest(): Promise<number | null> {
    try {
      const response = await fetch("/api/request-cash", {
        method: "POST",

        headers: {
          Accept: "application/json",
        },
      });

      const rawResponse = await response.text();

      let responseData:
        | {
            type?: "create-cash-request";

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
        responseData.type !== "create-cash-request"
      ) {
        const message =
          "message" in responseData
            ? responseData.message
            : "Unable to create cash request.";

        throw new Error(message);
      }

      const nextRequestAvailableAt = Number(
        responseData.nextRequestAvailableAt,
      );

      if (!Number.isFinite(nextRequestAvailableAt)) {
        throw new Error("The server did not return the next request time.");
      }

      this.showCashRequestStatus(
        responseData.message ?? "Cash request shared!",
        true,
      );

      return nextRequestAvailableAt;
    } catch (error) {
      console.error("[MainMenu] Failed to request cash:", error);

      this.showCashRequestStatus(
        error instanceof Error
          ? error.message
          : "Unable to create cash request.",
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

    const text = this.dailyRewardButtonText;

    if (!button || !graphics || !hit || !text) {
      return;
    }

    if (button.getData("claiming")) {
      return;
    }

    button.setAlpha(1);

    text.setAlpha(1).setColor(TEXT.bright);

    if (this.dailyRewardCanClaim) {
      text.setText("DAILY REWARD\nCLAIM +5 CASH");

      this.drawActionButton(graphics, COLORS.goldFill, COLORS.goldStroke, 0.9);

      hit.setInteractive({ useHandCursor: true });

      return;
    }

    const remainingMs = Math.max(0, this.dailyRewardNextResetAt - Date.now());

    if (remainingMs <= 0) {
      text.setText("DAILY REWARD\nCHECKING...");

      this.drawActionButton(graphics, 0x33301c, 0xb8a66a, 0.8);

      hit.disableInteractive();

      //has the server whether the new UTC day begun?
      void this.loadPlayerProfile(); // void to avoid unhandled promise warning

      return;
    }

    text.setText(
      ["DAILY REWARD", this.formatCashRequestCountdown(remainingMs)].join("\n"),
    );

    this.drawActionButton(graphics, 0x33301c, 0xb8a66a, 0.8);

    hit.disableInteractive();
  }

  private configureDailyRewardButton(): void {
    const button = this.dailyRewardButton;
    const graphics = this.dailyRewardButtonGfx;
    const hit = this.dailyRewardButtonHit;
    const text = this.dailyRewardButtonText;
    if (!button || !graphics || !hit || !text) {
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
      text.setText("CLAIMING...");
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
            rewardCash?: number;
            totalCash?: number;
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
      this.showCashRequestStatus(
        responseData.message ?? "You received 5 cash!",
        true,
      );
      await this.loadPlayerProfile();
      return true;
    } catch (error) {
      console.error("[MainMenu] Daily reward failed:", error);
      this.showCashRequestStatus(
        error instanceof Error
          ? error.message
          : "Unable to claim daily reward.",
        false,
      );
      await this.loadPlayerProfile();
      return false;
    }
  }
}
