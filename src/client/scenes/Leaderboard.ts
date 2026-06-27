import { GameObjects, Scene } from "phaser";

import type {
  ApiErrorResponse,
  LeaderboardEntry,
  LeaderboardResponse,
} from "../../shared/api";
import type {
  KingSlayerLeaderboardEntry,
  KingSlayerLeaderboardResponse,
} from "../../shared/raiderUnlocks";

const ROWS_PER_PAGE = 10;
type LeaderboardTab = "normal" | "king-slayer";

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
  private returnTo: "main-menu" | "game-over" = "main-menu";
  private shareStatusText: GameObjects.Text | null = null;

  private activeTab: LeaderboardTab = "normal";

  private kingSlayerEntries: KingSlayerLeaderboardEntry[] = [];
  private kingSlayerPersonalScore = 0;
  private kingSlayerPersonalKills = 0;
  private kingSlayerPlayerRank: number | null = null;
  private subtitleText: GameObjects.Text | null = null;

  constructor() {
    super("Leaderboard");
  }

  init(data?: { returnTo?: "main-menu" | "game-over" }): void {
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

    this.returnTo = data?.returnTo ?? "main-menu";
    this.shareStatusText = null;

    this.activeTab = "normal";
    this.kingSlayerEntries = [];
    this.kingSlayerPersonalScore = 0;
    this.kingSlayerPersonalKills = 0;
    this.kingSlayerPlayerRank = null;
    this.subtitleText = null;
  }

  create(): void {
    const width = this.scale.width;

    const height = this.scale.height;

    this.centerX = width / 2;

    this.centerY = height / 2;

    const panelWidth = Math.min(820, width - 40);

    this.panelHeight = Math.min(650, height - 40);

    this.background = this.add
      .image(0, 0, "background")
      .setOrigin(0, 0)
      .setDisplaySize(width, height)
      .setAlpha(0.45);

    this.add.rectangle(0, 0, width, height, 0x07111a, 0.78).setOrigin(0, 0);

    this.add
      .rectangle(
        this.centerX,
        this.centerY,
        panelWidth,
        this.panelHeight,
        0x111c26,
        0.98,
      )
      .setStrokeStyle(4, 0x50c8ff, 1);

    this.add
      .text(
        this.centerX,
        this.centerY - this.panelHeight / 2 + 48,
        "LEADERBOARD",
        {
          font: "bold 39px Orbitron",

          color: "#ffffff",

          stroke: "#000000",

          strokeThickness: 6,
        },
      )
      .setOrigin(0.5);

    this.subtitleText = this.add
      .text(
        this.centerX,
        this.centerY - this.panelHeight / 2 + 92,
        "ALL-TIME TOP 100 RAIDERS",
        {
          font: "14px Orbitron",
          color: "#82e6ff",
        },
      )
      .setOrigin(0.5);

    this.statusText = this.add
      .text(this.centerX, this.centerY, "Loading leaderboard...", {
        font: "18px Orbitron",

        color: "#ffffff",

        align: "center",
      })
      .setOrigin(0.5);

    this.scale.on("resize", this.handleResize, this);

    this.events.once("shutdown", () => {
      this.scale.off("resize", this.handleResize, this);
    });

    void this.loadLeaderboards();
  }

  private async loadLeaderboards(): Promise<void> {
    try {
      const [normalResponse, kingSlayerResponse] = await Promise.all([
        fetch("/api/leaderboard"),
        fetch("/api/king-slayer-leaderboard"),
      ]);

      const normalResponseData = (await normalResponse.json()) as unknown;

      const kingSlayerResponseData =
        (await kingSlayerResponse.json()) as unknown;

      if (!normalResponse.ok) {
        const errorData = normalResponseData as ApiErrorResponse;

        throw new Error(
          errorData.message ?? "Unable to load normal leaderboard.",
        );
      }

      if (!kingSlayerResponse.ok) {
        const errorData = kingSlayerResponseData as ApiErrorResponse;

        throw new Error(
          errorData.message ?? "Unable to load King Slayer leaderboard.",
        );
      }

      const normalData = normalResponseData as LeaderboardResponse;

      const kingSlayerData =
        kingSlayerResponseData as KingSlayerLeaderboardResponse;

      if (
        normalData.type !== "leaderboard" ||
        !Array.isArray(normalData.entries)
      ) {
        throw new Error("Unexpected normal leaderboard response.");
      }

      if (
        kingSlayerData.type !== "king-slayer-leaderboard" ||
        !Array.isArray(kingSlayerData.entries)
      ) {
        throw new Error("Unexpected King Slayer leaderboard response.");
      }

      this.entries = normalData.entries;

      this.username = normalData.username;

      this.personalBest = normalData.personalBest;

      this.personalHighestBaseSeen = normalData.personalHighestBaseSeen;

      this.playerRank = normalData.playerRank;

      this.kingSlayerEntries = kingSlayerData.entries;

      this.kingSlayerPersonalScore = kingSlayerData.personalScore;

      this.kingSlayerPersonalKills = kingSlayerData.personalKills;

      this.kingSlayerPlayerRank = kingSlayerData.playerRank;

      /*
       * Both endpoints should return the same
       * current Reddit username.
       */
      if (!this.username) {
        this.username = kingSlayerData.username;
      }

      this.currentPage = 0;

      this.statusText?.destroy();

      this.statusText = null;

      this.renderCurrentPage();
    } catch (error) {
      console.error("[Leaderboard] Failed to load:", error);

      const message = error instanceof Error ? error.message : "Unknown error";

      this.statusText
        ?.setColor("#ff8b8b")
        .setText(["Unable to load leaderboard.", message].join("\n"));
    }
  }

  private renderCurrentPage(): void {
    this.contentContainer?.destroy(true);

    this.contentContainer = this.add.container(0, 0);

    this.updateLeaderboardSubtitle();

    this.createTabControls();

    const startY = this.centerY - this.panelHeight / 2 + 185;

    const rankX = this.centerX - 315;

    const usernameX = this.centerX - 255;

    const middleColumnX = this.centerX + 125;

    const scoreX = this.centerX + 315;

    const headerStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      font: "bold 13px Orbitron",
      color: "#82e6ff",
    };

    const rankHeader = this.add.text(rankX, startY, "#", headerStyle);

    const usernameHeader = this.add.text(
      usernameX,
      startY,
      "PLAYER",
      headerStyle,
    );

    const middleHeader = this.add
      .text(
        middleColumnX,
        startY,
        this.activeTab === "normal" ? "HIGHEST BASE" : "KILLS",
        headerStyle,
      )
      .setOrigin(0.5, 0);

    const scoreHeader = this.add
      .text(scoreX, startY, "SCORE", headerStyle)
      .setOrigin(1, 0);

    this.contentContainer.add([
      rankHeader,
      usernameHeader,
      middleHeader,
      scoreHeader,
    ]);

    if (this.activeTab === "normal") {
      this.renderNormalLeaderboardRows({
        startY,
        rankX,
        usernameX,
        middleColumnX,
        scoreX,
      });
    } else {
      this.renderKingSlayerRows({
        startY,
        rankX,
        usernameX,
        middleColumnX,
        scoreX,
      });
    }

    this.createPaginationControls();

    this.createPlayerSummary();

    this.createFooterControls();
  }

  private createTabControls(): void {
    const tabY = this.centerY - this.panelHeight / 2 + 135;

    const normalButton = this.createButton(
      this.centerX - 145,
      tabY,
      "NORMAL RUNS",
      this.activeTab === "normal" ? "#17658c" : "#263846",
      14,
    );

    const kingSlayerButton = this.createButton(
      this.centerX + 145,
      tabY,
      "KING SLAYERS",
      this.activeTab === "king-slayer" ? "#8a5d18" : "#263846",
      14,
    );

    normalButton.setFixedSize(250, 42);

    kingSlayerButton.setFixedSize(250, 42);

    if (this.activeTab === "normal") {
      normalButton.setStroke("#63d5ff", 3).setAlpha(1);

      kingSlayerButton.setStroke("#000000", 3).setAlpha(0.72);
    } else {
      normalButton.setStroke("#000000", 3).setAlpha(0.72);

      kingSlayerButton.setStroke("#ffd36b", 3).setAlpha(1);
    }

    normalButton.on("pointerdown", () => {
      if (this.activeTab === "normal") {
        return;
      }

      this.activeTab = "normal";

      this.currentPage = 0;

      this.renderCurrentPage();
    });

    kingSlayerButton.on("pointerdown", () => {
      if (this.activeTab === "king-slayer") {
        return;
      }

      this.activeTab = "king-slayer";

      this.currentPage = 0;

      this.renderCurrentPage();
    });

    this.contentContainer?.add([normalButton, kingSlayerButton]);
  }

  private renderNormalLeaderboardRows(layout: {
    startY: number;

    rankX: number;

    usernameX: number;

    middleColumnX: number;

    scoreX: number;
  }): void {
    if (this.entries.length === 0) {
      const emptyText = this.add
        .text(
          this.centerX,
          layout.startY + 100,
          ["No completed runs yet.", "Be the first Raider on the board!"].join(
            "\n",
          ),
          {
            font: "17px Orbitron",

            color: "#c7d5e0",

            align: "center",
          },
        )
        .setOrigin(0.5);

      this.contentContainer?.add(emptyText);

      return;
    }

    const startIndex = this.currentPage * ROWS_PER_PAGE;

    const endIndex = startIndex + ROWS_PER_PAGE;

    const visibleEntries = this.entries.slice(startIndex, endIndex);

    visibleEntries.forEach((entry: LeaderboardEntry, index: number) => {
      const rowY = layout.startY + 35 + index * 34;

      const isCurrentPlayer =
        this.username !== null && entry.username === this.username;

      const rowColor = isCurrentPlayer ? "#ffd84a" : "#ffffff";

      this.createLeaderboardRowBackground(rowY, isCurrentPlayer);

      const rankText = this.add.text(layout.rankX, rowY, String(entry.rank), {
        font: "15px Orbitron",
        color: rowColor,
      });

      const usernameText = this.add.text(
        layout.usernameX,
        rowY,
        `u/${entry.username}`,
        {
          font: "15px Orbitron",
          color: rowColor,
        },
      );

      const baseText = this.add
        .text(layout.middleColumnX, rowY, String(entry.highestBaseSeen ?? 0), {
          font: "bold 15px Orbitron",
          color: rowColor,
        })
        .setOrigin(0.5, 0);

      const scoreText = this.add
        .text(layout.scoreX, rowY, entry.score.toLocaleString(), {
          font: "bold 15px Orbitron",
          color: rowColor,
        })
        .setOrigin(1, 0);

      this.contentContainer?.add([rankText, usernameText, baseText, scoreText]);
    });
  }

  private renderKingSlayerRows(layout: {
    startY: number;

    rankX: number;

    usernameX: number;

    middleColumnX: number;

    scoreX: number;
  }): void {
    if (this.kingSlayerEntries.length === 0) {
      const emptyText = this.add
        .text(
          this.centerX,
          layout.startY + 100,
          [
            "No Kings have been defeated yet.",
            "Be the first King Slayer!",
          ].join("\n"),
          {
            font: "17px Orbitron",

            color: "#c7d5e0",

            align: "center",
          },
        )
        .setOrigin(0.5);

      this.contentContainer?.add(emptyText);

      return;
    }

    const startIndex = this.currentPage * ROWS_PER_PAGE;

    const endIndex = startIndex + ROWS_PER_PAGE;

    const visibleEntries = this.kingSlayerEntries.slice(startIndex, endIndex);

    visibleEntries.forEach(
      (entry: KingSlayerLeaderboardEntry, index: number) => {
        const rowY = layout.startY + 35 + index * 34;

        const isCurrentPlayer =
          this.username !== null && entry.username === this.username;

        const rowColor = isCurrentPlayer ? "#ffd84a" : "#ffffff";

        this.createLeaderboardRowBackground(rowY, isCurrentPlayer);

        const rankText = this.add.text(layout.rankX, rowY, String(entry.rank), {
          font: "15px Orbitron",
          color: rowColor,
        });

        const usernameText = this.add.text(
          layout.usernameX,
          rowY,
          `u/${entry.username}`,
          {
            font: "15px Orbitron",
            color: rowColor,
          },
        );

        const killsText = this.add
          .text(layout.middleColumnX, rowY, entry.kills.toLocaleString(), {
            font: "bold 15px Orbitron",

            color: isCurrentPlayer ? "#ffd84a" : "#ffcf75",
          })
          .setOrigin(0.5, 0);

        const scoreText = this.add
          .text(layout.scoreX, rowY, entry.score.toLocaleString(), {
            font: "bold 15px Orbitron",
            color: rowColor,
          })
          .setOrigin(1, 0);

        this.contentContainer?.add([
          rankText,
          usernameText,
          killsText,
          scoreText,
        ]);
      },
    );
  }

  private updateLeaderboardSubtitle(): void {
    if (!this.subtitleText) {
      return;
    }

    if (this.activeTab === "normal") {
      this.subtitleText.setText("ALL-TIME TOP 100 RAIDERS").setColor("#82e6ff");

      return;
    }

    this.subtitleText
      .setText("ALL-TIME TOP 100 KING SLAYERS")
      .setColor("#ffd36b");
  }

  private createLeaderboardRowBackground(
    rowY: number,
    isCurrentPlayer: boolean,
  ): void {
    if (!isCurrentPlayer) {
      return;
    }

    const rowBackground = this.add
      .rectangle(this.centerX, rowY + 9, 690, 28, 0xffd84a, 0.12)
      .setStrokeStyle(1, 0xffd84a, 0.5);

    this.contentContainer?.add(rowBackground);
  }

  private createPaginationControls(): void {
    const activeEntryCount =
      this.activeTab === "normal"
        ? this.entries.length
        : this.kingSlayerEntries.length;

    const totalPages = Math.max(1, Math.ceil(activeEntryCount / ROWS_PER_PAGE));

    const controlsY = this.centerY + this.panelHeight / 2 - 132;

    const previousButton = this.createButton(
      this.centerX - 165,
      controlsY,
      "PREVIOUS",
      "#33485c",
      16,
    );

    const nextButton = this.createButton(
      this.centerX + 165,
      controlsY,
      "NEXT",
      "#33485c",
      16,
    );

    const pageText = this.add
      .text(
        this.centerX,
        controlsY,
        `PAGE ${this.currentPage + 1} / ${totalPages}`,
        {
          font: "bold 15px Orbitron",

          color: "#ffffff",

          stroke: "#000000",

          strokeThickness: 3,
        },
      )
      .setOrigin(0.5);

    const hasPreviousPage = this.currentPage > 0;

    const hasNextPage = this.currentPage < totalPages - 1;

    this.setButtonEnabled(previousButton, hasPreviousPage);

    this.setButtonEnabled(nextButton, hasNextPage);

    previousButton.on("pointerdown", () => {
      if (!hasPreviousPage) {
        return;
      }

      this.currentPage--;

      this.renderCurrentPage();
    });

    nextButton.on("pointerdown", () => {
      if (!hasNextPage) {
        return;
      }

      this.currentPage++;

      this.renderCurrentPage();
    });

    this.contentContainer?.add([previousButton, pageText, nextButton]);
  }

  private createPlayerSummary(): void {
    let personalText: string;

    if (!this.username) {
      personalText = "Log in to Reddit to save your leaderboard results.";
    } else if (this.activeTab === "normal") {
      personalText = [
        `YOU: u/${this.username}`,

        `PERSONAL BEST: ${this.personalBest.toLocaleString()}`,

        `HIGHEST BASE: ${this.personalHighestBaseSeen}`,

        this.playerRank !== null
          ? `GLOBAL RANK: #${this.playerRank}`
          : "GLOBAL RANK: UNRANKED",
      ].join("     ");
    } else {
      personalText = [
        `YOU: u/${this.username}`,

        `KING SCORE: ${this.kingSlayerPersonalScore.toLocaleString()}`,

        `KINGS DEFEATED: ${this.kingSlayerPersonalKills.toLocaleString()}`,

        this.kingSlayerPlayerRank !== null
          ? `KING SLAYER RANK: #${this.kingSlayerPlayerRank}`
          : "KING SLAYER RANK: UNRANKED",
      ].join("     ");
    }

    const playerSummary = this.add
      .text(
        this.centerX,
        this.centerY + this.panelHeight / 2 - 86,
        personalText,
        {
          font: "12px Orbitron",

          color: this.username ? "#ffd84a" : "#ffb0b0",

          align: "center",

          wordWrap: {
            width: 720,
          },
        },
      )
      .setOrigin(0.5);

    this.contentContainer?.add(playerSummary);
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    backgroundColor: string,
    fontSize = 22,
  ): GameObjects.Text {
    return this.add
      .text(x, y, label, {
        font: `bold ${fontSize}px Orbitron`,

        color: "#ffffff",

        backgroundColor,

        padding: {
          x: fontSize <= 16 ? 18 : 28,

          y: fontSize <= 16 ? 9 : 12,
        },

        stroke: "#000000",

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

  private async shareLeaderboard(): Promise<boolean> {
    try {
      const response = await fetch("/api/share-leaderboard", {
        method: "POST",

        headers: {
          Accept: "application/json",
        },
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
        throw new Error(data.message ?? "Unable to share profile.");
      }

      this.showShareStatus(data.message ?? "Leaderboard shared!", true);

      return true;
    } catch (error) {
      console.error("[Leaderboard] Failed to share profile:", error);

      const message =
        error instanceof Error ? error.message : "Unable to share profile.";

      this.showShareStatus(message, false);

      return false;
    }
  }

  private createFooterControls(): void {
    const footerY = this.centerY + this.panelHeight / 2 - 42;

    const shareButton = this.createButton(
      this.centerX - 155,
      footerY,
      "SHARE LEADERBOARD",
      "#24744a",
      16,
    );

    if (!this.username) {
      shareButton.setText("LOGIN TO SHARE").setAlpha(0.55).disableInteractive();
    } else if (this.activeTab === "king-slayer") {
      shareButton.setText("SHARE KING SLAYERS");
    } else if (!this.username) {
      shareButton.setText("LOGIN TO SHARE").setAlpha(0.55).disableInteractive();
    }

    const backButton = this.createButton(
      this.centerX + 155,
      footerY,
      "BACK",
      "#1d6f94",
      16,
    );

    shareButton.on("pointerdown", () => {
      if (!this.username || shareButton.getData("sharing")) {
        return;
      }

      shareButton.setData("sharing", true);

      shareButton.disableInteractive().setAlpha(0.65).setText("SHARING...");

      const sharePromise =
        this.activeTab === "normal"
          ? this.shareLeaderboard()
          : this.shareKingSlayerLeaderboard();

      void sharePromise.then((success) => {
        if (!shareButton.active) {
          return;
        }

        if (success) {
          shareButton.setText("SHARED!").setAlpha(1);

          return;
        }

        shareButton
          .setText(
            this.activeTab === "normal"
              ? "SHARE LEADERBOARD"
              : "SHARE KING SLAYERS",
          )
          .setAlpha(1)
          .setInteractive({
            useHandCursor: true,
          });

        shareButton.setData("sharing", false);
      });
    });

    backButton.on("pointerdown", () => {
      if (this.returnTo === "game-over") {
        this.scene.stop("Leaderboard");

        this.scene.wake("Game");
        this.scene.wake("BattleUI");

        this.scene.bringToTop("BattleUI");

        return;
      }

      this.scene.start("MainMenu");
    });

    this.contentContainer?.add([shareButton, backButton]);
  }

  private showShareStatus(message: string, success: boolean): void {
    this.shareStatusText?.destroy();

    const messageY = this.centerY - this.panelHeight / 2 + 116;

    this.shareStatusText = this.add
      .text(this.centerX, messageY, message, {
        font: "bold 12px Orbitron",

        color: success ? "#72e7a3" : "#ff8b8b",

        backgroundColor: success ? "#143426" : "#3b171b",

        padding: {
          x: 16,
          y: 7,
        },

        stroke: "#000000",

        strokeThickness: 3,

        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(200);

    this.time.delayedCall(4000, () => {
      if (this.shareStatusText?.active) {
        this.shareStatusText.destroy();
        this.shareStatusText = null;
      }
    });
  }

  private async shareKingSlayerLeaderboard(): Promise<boolean> {
    try {
      const response = await fetch("/api/share-king-slayer-leaderboard", {
        method: "POST",

        headers: {
          Accept: "application/json",
        },
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
        throw new Error(data.message ?? "Unable to share King Slayer record.");
      }

      this.showShareStatus(
        data.message ?? "King Slayer leaderboard shared!",
        true,
      );

      return true;
    } catch (error) {
      console.error("[Leaderboard] Failed to share King Slayer record:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to share King Slayer record.";

      this.showShareStatus(message, false);

      return false;
    }
  }
}
