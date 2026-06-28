import { GameObjects, Loader, Scene } from "phaser";
import characterMap from "../game/CharacterMap";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    const centerX = width / 2;
    const centerY = height / 2;

    // background
    this.add
      .image(centerX, centerY, "background")
      .setDisplaySize(width, height);

    this.add.rectangle(0, 0, width, height, 0x030a10, 0.76).setOrigin(0, 0);

    // cyan glow
    const backgroundGlow = this.add.ellipse(
      centerX,
      centerY,
      Math.min(850, width * 0.86),
      Math.min(480, height * 0.7),
      0x2193c2,
      0.12,
    );

    this.tweens.add({
      targets: backgroundGlow,
      scaleX: {
        from: 0.94,
        to: 1.06,
      },
      scaleY: {
        from: 0.92,
        to: 1.08,
      },
      alpha: {
        from: 0.07,
        to: 0.15,
      },
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const cardWidth = Math.min(720, width - 60);
    const cardHeight = Math.min(370, height - 70);

    this.add
      .rectangle(
        centerX + 8,
        centerY + 10,
        cardWidth,
        cardHeight,
        0x000000,
        0.58,
      )
      .setOrigin(0.5);

    const cardGraphics = this.add.graphics();

    cardGraphics.fillStyle(0x0b1c29, 0.97);

    cardGraphics.fillRoundedRect(
      centerX - cardWidth / 2,
      centerY - cardHeight / 2,
      cardWidth,
      cardHeight,
      24,
    );

    cardGraphics.lineStyle(2, 0x55d7ff, 0.72);

    cardGraphics.strokeRoundedRect(
      centerX - cardWidth / 2,
      centerY - cardHeight / 2,
      cardWidth,
      cardHeight,
      24,
    );

    const innerGraphics = this.add.graphics();

    innerGraphics.fillStyle(0x112737, 0.28);

    innerGraphics.fillRoundedRect(
      centerX - cardWidth / 2 + 8,
      centerY - cardHeight / 2 + 8,
      cardWidth - 16,
      cardHeight - 16,
      18,
    );

    const topLine = this.add.rectangle(
      centerX,
      centerY - cardHeight / 2 + 3,
      cardWidth * 0.72,
      2,
      0x55d7ff,
      0.9,
    );

    this.tweens.add({
      targets: topLine,
      alpha: {
        from: 0.4,
        to: 1,
      },
      scaleX: {
        from: 0.9,
        to: 1,
      },
      duration: 1900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.add
      .text(centerX, centerY - 118, "PREPARING YOUR RAID", {
        font: "bold 12px Orbitron",
        color: "#a9efff",
        stroke: "#000000",
        strokeThickness: 3,
        align: "center",
      })
      .setOrigin(0.5);

    const title = this.add
      .text(centerX, centerY - 72, "THE YOUNG RAIDER", {
        font: "bold 36px Orbitron",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 7,
        align: "center",
      })
      .setOrigin(0.5);

    title.setShadow(0, 3, "#000000", 5, true, true);

    this.add
      .text(
        centerX,
        centerY - 28,
        "Loading battlefield resources. The first load may take longer than subsequent loads...",
        {
          font: "14px Arial",
          color: "#b9cfda",
          stroke: "#000000",
          strokeThickness: 2,
          align: "center",
          wordWrap: {
            width: cardWidth - 90,
          },
        },
      )
      .setOrigin(0.5);

    const progressBarWidth = Math.min(520, cardWidth - 90);

    const progressBarHeight = 25;

    const progressBarX = centerX - progressBarWidth / 2;

    const progressBarY = centerY + 42;

    const trackShadow = this.add.graphics();

    trackShadow.fillStyle(0x000000, 0.55);

    trackShadow.fillRoundedRect(
      progressBarX + 3,
      progressBarY + 4,
      progressBarWidth,
      progressBarHeight,
      12,
    );

    const trackGraphics = this.add.graphics();

    trackGraphics.fillStyle(0x06131d, 0.96);

    trackGraphics.fillRoundedRect(
      progressBarX,
      progressBarY,
      progressBarWidth,
      progressBarHeight,
      12,
    );

    trackGraphics.lineStyle(2, 0x55d7ff, 0.38);

    trackGraphics.strokeRoundedRect(
      progressBarX,
      progressBarY,
      progressBarWidth,
      progressBarHeight,
      12,
    );

    const progressFill = this.add.graphics();

    // small highlight which moves along the filled region.
    const progressGlow = this.add
      .rectangle(
        progressBarX,
        progressBarY + progressBarHeight / 2,
        24,
        progressBarHeight - 7,
        0xffffff,
        0.18,
      )
      .setOrigin(0.5)
      .setVisible(false);

    const percentageText = this.add
      .text(centerX, progressBarY + progressBarHeight / 2, "0%", {
        font: "bold 12px Orbitron",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    const statusText = this.add
      .text(centerX, progressBarY + 52, "Starting asset loader...", {
        font: "12px Orbitron",
        color: "#8faab7",
        stroke: "#000000",
        strokeThickness: 2,
        align: "center",
      })
      .setOrigin(0.5);

    // Animated dots
    const dots: GameObjects.Arc[] = [];

    for (let index = 0; index < 3; index++) {
      const dot = this.add.circle(
        centerX - 18 + index * 18,
        progressBarY + 86,
        3,
        0x76dcff,
        0.7,
      );

      dots.push(dot);

      this.tweens.add({
        targets: dot,
        y: dot.y - 7,
        alpha: {
          from: 0.25,
          to: 1,
        },
        duration: 650,
        delay: index * 180,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    const drawProgress = (progress: number): void => {
      const clampedProgress = Math.max(0, Math.min(1, progress));

      const fillWidth = progressBarWidth * clampedProgress;

      progressFill.clear();

      if (fillWidth > 0) {
        progressFill.fillStyle(0x39c86d, 1);

        progressFill.fillRoundedRect(
          progressBarX + 3,
          progressBarY + 3,
          Math.max(6, fillWidth - 6),
          progressBarHeight - 6,
          9,
        );

        // gradient
        progressFill.fillStyle(0x72e59a, 0.32);

        progressFill.fillRoundedRect(
          progressBarX + 5,
          progressBarY + 5,
          Math.max(2, fillWidth - 10),
          Math.max(3, progressBarHeight * 0.3),
          7,
        );

        progressGlow
          .setVisible(true)
          .setX(
            Math.min(
              progressBarX + fillWidth - 13,
              progressBarX + progressBarWidth - 13,
            ),
          );
      } else {
        progressGlow.setVisible(false);
      }
    };

    this.load.on("progress", (progress: number) => {
      drawProgress(progress);

      const percentage = Math.floor(progress * 100);

      percentageText.setText(`${percentage}%`);

      if (percentage < 20) {
        statusText.setText("Preparing the battlefield...");
      } else if (percentage < 45) {
        statusText.setText("Loading Raider abilities...");
      } else if (percentage < 70) {
        statusText.setText("Summoning enemies...");
      } else if (percentage < 90) {
        statusText.setText("Preparing upgrades and rewards...");
      } else {
        statusText.setText("Finalising your raid...");
      }
    });

    this.load.once("complete", () => {
      drawProgress(1);

      percentageText.setText("100%");

      statusText.setText("Raid ready!").setColor("#8cffad");

      progressGlow.setVisible(false);

      dots.forEach((dot) => {
        dot.setFillStyle(0x8cffad, 1);
      });
    });

    this.load.on("loaderror", (file: Loader.File) => {
      console.error("[Preloader] Failed to load:", file.key, file.src);

      statusText.setText(`Failed to load ${file.key}`).setColor("#ff8f8f");
    });
  }

  async create(): Promise<void> {
    try {
      await Promise.all([
        document.fonts.load("400 14px Orbitron"),

        document.fonts.load("700 18px Orbitron"),
      ]);

      await document.fonts.ready;
    } catch (error) {
      console.error("[Preloader] Failed to load Orbitron:", error);
    }

    this.time.delayedCall(180, () => {
      this.scene.start("MainMenu");
    });
  }

  preload() {
    this.load.setPath("../assets");
    this.load.image("audio-on", "ui/audio-on.png");

    this.load.image("audio-off", "ui/audio-off.png");
    this.load.image("enemy_camp", "images/enemy_camp.png");

    this.load.image("land", "images/land2.png");

    this.load.image("blueBullet", "projectiles/blue_bullet.png");
    this.load.image("fireball", "projectiles/fireball.png");
    this.load.image("bluePlasmaBall", "projectiles/blue_plasma_ball.png");
    this.load.image("redPlasmaBall", "projectiles/red_plasma_ball.png");

    this.load.image("catastrophe", "images/catastrophe.png");
    this.load.image("strengthen", "images/strengthen.png");
    this.load.image("player", "images/player.png");
    this.load.image("gold", "images/gold.png");
    this.load.image("cash", "images/cash.png");

    this.load.image("sword1", "images/sword1.png");
    this.load.image("sword2", "images/sword2.png");
    this.load.image("health1", "images/health1.png");
    this.load.image("health2", "images/health2.png");
    this.load.image("attackSpeed1", "images/attackSpeed1.png");
    this.load.image("moveSpeed1", "images/moveSpeed1.png");
    this.load.image("thunderlordSeal", "images/thunderlordSeal.png");
    this.load.image("elixirOfLife", "images/elixirOfLife.png");
    this.load.image("winterFrost", "images/winterFrost.png");
    this.load.image("treasureFinder", "images/treasureFinder.png");

    this.load.spritesheet(
      "treasure_monster_idle",
      "images/treasure_monster_idle.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      },
    );

    this.load.spritesheet(
      "treasure_monster_die",
      "images/treasure_monster_die.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      },
    );

    this.loadEnemySpritesheets(1, 15);
    this.loadRaiderPreviewSpritesheets();
    this.loadRaiderIcons();

    this.load.audio("music-main", "audio/music/game-theme.mp3");

    this.load.audio("sfx-player-attack", "audio/sfx/player-attack.wav");

    this.load.audio("sfx-shield-block", "audio/sfx/shield-block.wav");

    this.load.audio("sfx-dash", "audio/sfx/dash.wav");

    this.load.audio("sfx-slash", "audio/sfx/slash.wav");

    this.load.audio("sfx-player-die", "audio/sfx/player-die.wav");

    this.load.audio("sfx-enemy-die", "audio/sfx/enemy-die.wav");

    this.load.audio("sfx-button-click", "audio/sfx/button-click.wav");

    this.load.audio("sfx-buy", "audio/sfx/buy.wav");

    this.load.audio("sfx-game-over", "audio/sfx/game-over.wav");
    this.load.audio("sfx-enemy-hit-player", "audio/sfx/enemy-hit-player.wav");
    this.load.audio("sfx-catastrophe", "audio/sfx/catastrophe.wav");
  }

  private loadEnemySpritesheets(
    firstCharacterCode: number,
    lastCharacterCode: number,
  ): void {
    const animationNames = ["idle", "move", "attack", "die"] as const;

    for (
      let characterCode = firstCharacterCode;
      characterCode <= lastCharacterCode;
      characterCode++
    ) {
      animationNames.forEach((animationName) => {
        const spritesheetKey = `enemy${characterCode}_${animationName}`;

        this.load.spritesheet(
          spritesheetKey,
          `characters/enemy/${spritesheetKey}.png`,
          {
            frameWidth: 128,
            frameHeight: 128,
          },
        );
      });
    }
  }

  private loadRaiderPreviewSpritesheets(): void {
    Object.values(characterMap).forEach((character) => {
      if (character.type !== "raider") {
        return;
      }

      // preload only the idle for collections page
      this.load.spritesheet(
        character.spritesheetKey,
        `characters/raider/${character.spritesheetKey}.png`,
        {
          frameWidth: 128,
          frameHeight: 128,
        },
      );
    });
  }

  private loadRaiderIcons(): void {
    Object.values(characterMap).forEach((character) => {
      if (character.type !== "raider") {
        return;
      }

      this.load.image(
        character.icon,
        // raider1Icon.png
        `images/Raider Icons/${character.icon}.png`,
      );
    });
  }
}
