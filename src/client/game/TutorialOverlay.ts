import * as Phaser from "phaser";
import type BattleUI from "./BattleUI";
import type {
  ApiErrorResponse,
  CompleteTutorialResponse,
} from "../../shared/api";

const HUD_HEIGHT = 110;

type TutorialStep = {
  title: string;
  description: string;
  targets: () => Phaser.Geom.Rectangle[];
  showArrow?: boolean;
  onShow?: () => void;
};

export default class TutorialOverlay {
  private tutorialContainer: Phaser.GameObjects.Container | null = null;

  private tutorialPanelContainer: Phaser.GameObjects.Container | null = null;

  private tutorialStep = 0;

  private tutorialHighlight: Phaser.GameObjects.Graphics | null = null;

  private tutorialArrow: Phaser.GameObjects.Graphics | null = null;

  private tutorialArrowTween: Phaser.Tweens.Tween | null = null;

  private tutorialTitle: Phaser.GameObjects.Text | null = null;

  private tutorialDescription: Phaser.GameObjects.Text | null = null;

  private tutorialProgressText: Phaser.GameObjects.Text | null = null;

  private tutorialPrevButton: Phaser.GameObjects.Text | null = null;

  private tutorialNextButton: Phaser.GameObjects.Text | null = null;

  private tutorialDimGraphics: Phaser.GameObjects.Graphics | null = null;

  private tutorialInputBlocker: Phaser.GameObjects.Rectangle | null = null;

  private tutorialSaving = false;

  constructor(private readonly ui: BattleUI) {}

  public reset(): void {
    this.stopTutorialArrowAnimation();

    if (this.tutorialContainer && this.tutorialContainer.active) {
      this.tutorialContainer.destroy(true);
    }

    this.tutorialContainer = null;
    this.tutorialPanelContainer = null;
    this.tutorialStep = 0;
    this.tutorialHighlight = null;
    this.tutorialArrow = null;
    this.tutorialArrowTween = null;
    this.tutorialTitle = null;
    this.tutorialDescription = null;
    this.tutorialProgressText = null;
    this.tutorialPrevButton = null;
    this.tutorialNextButton = null;
    this.tutorialDimGraphics = null;
    this.tutorialInputBlocker = null;
    this.tutorialSaving = false;
  }

  private getTutorialSteps(): Array<{
    title: string;
    description: string;
    targets: () => Phaser.Geom.Rectangle[];
    showArrow?: boolean;
    onShow?: () => void;
  }> {
    const gameScene = this.ui.scene.get("Game") as any;

    return [
      {
        title: "DESTROY THE ENEMY BASE",

        description:
          "This treasure monster is the enemy base. Defeat its defenders, then attack it to progress. Each destroyed base rebuilds at a stronger level.",

        targets: () => {
          const bounds = gameScene.getBaseTutorialScreenBounds?.();

          return bounds ? [bounds] : [];
        },

        showArrow: true,
      },

      {
        title: "CATASTROPHE TIMER",

        description:
          "This timer shows when the next catastrophe will strike. Watch the complete row and prepare before the timer reaches zero.",

        targets: () => {
          const bounds = this.getCombinedTutorialBounds([
            this.ui.catastropheIcon,
            this.ui.approachingText,
            this.ui.timerBarBackground,
          ]);

          return bounds ? [bounds] : [];
        },

        showArrow: true,
      },

      {
        title: "CATASTROPHE IMMUNITY",

        description:
          "A white outline around an enemy's right hexagon means that enemy is protected from catastrophe damage. Enemies inside camp, returning to camp and undetected patrollers may be protected.",

        targets: () => {
          const bounds =
            gameScene.getEnemyStrengthLevelTutorialScreenBounds?.();

          return bounds ? [bounds] : [];
        },

        showArrow: true,
      },

      {
        title: "ENEMIES STRENGTHEN",

        description:
          "When this timer reaches zero, every enemy gains more Damage. Normal camp enemies also gain maximum Health, while patrolling enemies gain Damage only.",

        targets: () => {
          const bounds = this.getCombinedTutorialBounds([
            this.ui.strengthenIcon,
            this.ui.strengthenLabelText,
            this.ui.strengthenBarBackground,
          ]);

          return bounds ? [bounds] : [];
        },

        showArrow: true,
      },

      {
        title: "STRENGTH LEVEL",

        description:
          "This black hexagon shows how many times enemies have strengthened. The same strengthening number appears on the right side of every enemy's Health bar.",

        targets: () => {
          const hudBounds = this.getBoundsFromObject(
            this.ui.strengthenedSquareContainer,
          );

          const enemyBounds =
            gameScene.getEnemyStrengthLevelTutorialScreenBounds?.();

          return [hudBounds, enemyBounds].filter(
            (bounds): bounds is Phaser.Geom.Rectangle => bounds !== null,
          );
        },

        showArrow: true,
      },

      {
        title: "BASE LEVEL",

        description:
          "The number on the left side of an enemy's Health bar shows the base level it inherited. Newly rebuilt bases create stronger enemies.",

        targets: () => {
          const bounds = gameScene.getEnemyBaseLevelTutorialScreenBounds?.();

          return bounds ? [bounds] : [];
        },

        showArrow: true,
      },

      {
        title: "ENRAGED DEFENDERS",

        description:
          "Damaging the enemy base enrages every living enemy for five seconds. Their left marker burns with fire, their Damage doubles and they move much faster.",

        targets: () => {
          const baseBounds = gameScene.getBaseTutorialScreenBounds?.();

          const enemyLevelBounds =
            gameScene.getEnemyBaseLevelTutorialScreenBounds?.();

          return [baseBounds, enemyLevelBounds].filter(
            (bounds): bounds is Phaser.Geom.Rectangle => bounds !== null,
          );
        },

        showArrow: true,

        onShow: () => {
          gameScene.showTutorialEnrageEffect?.();
        },
      },

      {
        title: "ESCAPE ENEMY PURSUIT",

        description:
          "Move outside an enemy's detection range and the white bar beneath its Health will begin draining. When the bar empties, normal enemies give up and return to camp.",

        targets: () => {
          const enemyBounds = gameScene.getEnemyTutorialScreenBounds?.();

          const campBounds = gameScene.getEnemyCampTutorialScreenBounds?.();

          return [enemyBounds, campBounds].filter(
            (bounds): bounds is Phaser.Geom.Rectangle => bounds !== null,
          );
        },

        showArrow: true,

        onShow: () => {
          gameScene.showTutorialPursuitBar?.();
        },
      },

      {
        title: "ENEMIES HEAL AT CAMP",

        description:
          "After returning to camp, damaged enemies recover five percent of their maximum Health every second. Returning enemies are also temporarily protected from damage.",

        targets: () => {
          const campBounds = gameScene.getEnemyCampTutorialScreenBounds?.();

          return campBounds ? [campBounds] : [];
        },

        showArrow: true,
      },

      {
        title: "DODGE ENEMY ATTACKS",

        description:
          "Move outside the enemy's attack area before its weapon or damaging animation frame reaches you. The yellow cone shows the area covered by this melee attack.",

        targets: () => {
          const enemyBounds = gameScene.getEnemyTutorialScreenBounds?.();

          return enemyBounds ? [enemyBounds] : [];
        },

        showArrow: true,

        onShow: () => {
          gameScene.showTutorialAttackIndicator?.();
        },
      },

      {
        title: "BUY UPGRADES",

        description:
          "Spend Gold in the Shop to improve your Raider's Health, Damage, Attack Speed and Movement Speed. Upgrades become increasingly important as the run continues.",

        targets: () => {
          const bounds = this.getBoundsFromObject(this.ui.shopButtonContainer);

          return bounds ? [bounds] : [];
        },

        showArrow: true,
      },
      {
        title: "YOU ARE READY",

        description:
          "Destroy enemy bases, survive catastrophes, improve your Raider and earn the highest score possible.",

        targets: () => [],
      },
    ];
  }
  private getBoundsFromObject(
    object: Phaser.GameObjects.GameObject | null | undefined,
  ): Phaser.Geom.Rectangle | null {
    if (!object) {
      return null;
    }

    const boundedObject = object as Phaser.GameObjects.GameObject & {
      getBounds?: () => Phaser.Geom.Rectangle;
    };

    if (typeof boundedObject.getBounds !== "function") {
      return null;
    }

    return boundedObject.getBounds();
  }

  private getCombinedTutorialBounds(
    objects: Array<Phaser.GameObjects.GameObject | null | undefined>,
  ): Phaser.Geom.Rectangle | null {
    const bounds = objects
      .map((object) => this.getBoundsFromObject(object))
      .filter(
        (rectangle): rectangle is Phaser.Geom.Rectangle => rectangle !== null,
      );

    return this.combineRectangles(bounds);
  }

  private combineRectangles(
    rectangles: Phaser.Geom.Rectangle[],
  ): Phaser.Geom.Rectangle | null {
    const firstRectangle = rectangles[0];

    if (!firstRectangle) {
      return null;
    }

    let minimumX = firstRectangle.x;

    let minimumY = firstRectangle.y;

    let maximumX = firstRectangle.right;

    let maximumY = firstRectangle.bottom;

    for (let index = 1; index < rectangles.length; index++) {
      const rectangle = rectangles[index];

      if (!rectangle) {
        continue;
      }

      minimumX = Math.min(minimumX, rectangle.x);

      minimumY = Math.min(minimumY, rectangle.y);

      maximumX = Math.max(maximumX, rectangle.right);

      maximumY = Math.max(maximumY, rectangle.bottom);
    }

    return new Phaser.Geom.Rectangle(
      minimumX,
      minimumY,
      maximumX - minimumX,
      maximumY - minimumY,
    );
  }
  public start(): void {
    if (this.tutorialContainer && this.tutorialContainer.active) {
      return;
    }

    const gameScene = this.ui.scene.get("Game") as any;

    gameScene.isGamePaused = true;
    gameScene.allowInput = false;

    this.ui.pauseMultiplier();

    this.tutorialStep = 0;

    const width = this.ui.scale.width;

    const height = this.ui.scale.height;

    this.tutorialContainer = this.ui.add.container(0, 0).setDepth(6000);

    this.tutorialInputBlocker = this.ui.add
      .rectangle(0, 0, width, height, 0x000000, 0.001)
      .setOrigin(0, 0)
      .setInteractive();

    this.tutorialInputBlocker.on(
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

    this.tutorialDimGraphics = this.ui.add.graphics();
    this.tutorialHighlight = this.ui.add.graphics();

    this.tutorialArrow = this.ui.add.graphics();

    this.tutorialPanelContainer = this.ui.add.container(width / 2, height / 2);

    const panelWidth = Math.min(590, width - 34);

    const panelHeight = 230;

    const panel = this.ui.add
      .rectangle(0, 0, panelWidth, panelHeight, 0x0b1c29, 0.98)
      .setStrokeStyle(3, 0xffd84a, 0.95);

    this.tutorialTitle = this.ui.add
      .text(0, -82, "", {
        font: "bold 21px Orbitron",

        color: "#ffe866",

        stroke: "#000000",

        strokeThickness: 5,

        align: "center",
      })
      .setOrigin(0.5);

    this.tutorialDescription = this.ui.add
      .text(0, -44, "", {
        font: "15px Arial",

        color: "#ffffff",

        stroke: "#000000",

        strokeThickness: 2,

        align: "center",

        lineSpacing: 5,

        wordWrap: {
          width: panelWidth - 52,
        },
      })
      .setOrigin(0.5, 0);

    this.tutorialProgressText = this.ui.add
      .text(0, 88, "", {
        font: "11px Orbitron",

        color: "#91a8b6",
      })
      .setOrigin(0.5);

    this.tutorialPrevButton = this.ui.add
      .text(-panelWidth / 2 + 20, 82, "PREV", {
        font: "bold 14px Orbitron",

        color: "#ffffff",

        backgroundColor: "#3a4854",

        padding: {
          x: 20,
          y: 10,
        },
      })
      .setOrigin(0, 0.5)
      .setStroke("#000000", 3)
      .setInteractive({
        useHandCursor: true,
      });

    this.tutorialNextButton = this.ui.add
      .text(panelWidth / 2 - 20, 82, "NEXT", {
        font: "bold 14px Orbitron",

        color: "#ffffff",

        backgroundColor: "#17658c",

        padding: {
          x: 20,
          y: 10,
        },
      })
      .setOrigin(1, 0.5)
      .setStroke("#000000", 3)
      .setInteractive({
        useHandCursor: true,
      });

    this.tutorialPrevButton.on(
      "pointerdown",
      (
        _pointer: Phaser.Input.Pointer,

        _localX: number,

        _localY: number,

        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();

        this.previousTutorialStep();
      },
    );

    this.tutorialNextButton.on(
      "pointerdown",
      (
        _pointer: Phaser.Input.Pointer,

        _localX: number,

        _localY: number,

        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();

        void this.advanceTutorial();
      },
    );

    this.tutorialPanelContainer.add([
      panel,
      this.tutorialTitle,
      this.tutorialDescription,
      this.tutorialProgressText,
      this.tutorialPrevButton,
      this.tutorialNextButton,
    ]);

    this.tutorialContainer.add([
      this.tutorialInputBlocker,
      this.tutorialDimGraphics,
      this.tutorialHighlight,
      this.tutorialArrow,
      this.tutorialPanelContainer,
    ]);

    this.showTutorialStep();
  }

  private updateTutorialSpotlight(targets: Phaser.Geom.Rectangle[]): void {
    if (!this.tutorialDimGraphics) {
      return;
    }

    const width = this.ui.scale.width;

    const height = this.ui.scale.height;

    this.tutorialDimGraphics.clear();

    this.tutorialDimGraphics.fillStyle(0x000000, 0.76);

    const combinedTarget = this.combineRectangles(targets);

    // pages without any highlighted targets should just show a full-screen dark overlay
    if (!combinedTarget) {
      this.tutorialDimGraphics.fillRect(0, 0, width, height);

      return;
    }

    const padding = 12;

    const holeLeft = Phaser.Math.Clamp(combinedTarget.left - padding, 0, width);

    const holeTop = Phaser.Math.Clamp(combinedTarget.top - padding, 0, height);

    const holeRight = Phaser.Math.Clamp(
      combinedTarget.right + padding,
      0,
      width,
    );

    const holeBottom = Phaser.Math.Clamp(
      combinedTarget.bottom + padding,
      0,
      height,
    );

    // top darkness
    if (holeTop > 0) {
      this.tutorialDimGraphics.fillRect(0, 0, width, holeTop);
    }

    // bottom darkness
    if (holeBottom < height) {
      this.tutorialDimGraphics.fillRect(
        0,
        holeBottom,
        width,
        height - holeBottom,
      );
    }

    // left darkness
    if (holeLeft > 0) {
      this.tutorialDimGraphics.fillRect(
        0,
        holeTop,
        holeLeft,
        holeBottom - holeTop,
      );
    }

    // right darkness
    if (holeRight < width) {
      this.tutorialDimGraphics.fillRect(
        holeRight,
        holeTop,
        width - holeRight,
        holeBottom - holeTop,
      );
    }
  }
  private showTutorialStep(): void {
    const gameScene = this.ui.scene.get("Game") as any;

    // Hide any temporary visuals from the previous step
    gameScene.hideTutorialAttackIndicator?.();
    gameScene.hideTutorialEnrageEffect?.();

    gameScene.hideTutorialPursuitBar?.();

    const steps = this.getTutorialSteps();

    const step = steps[this.tutorialStep];

    if (!step) {
      return;
    }
    step.onShow?.();

    this.stopTutorialArrowAnimation();

    this.tutorialTitle?.setText(step.title);

    this.tutorialDescription?.setText(step.description);

    this.tutorialProgressText?.setText(
      `${this.tutorialStep + 1} / ${steps.length}`,
    );

    this.tutorialNextButton?.setText(
      this.tutorialStep === steps.length - 1 ? "START BATTLE" : "NEXT",
    );

    // disable prev button on first step
    if (this.tutorialStep === 0) {
      this.tutorialPrevButton?.disableInteractive().setAlpha(0.3);
    } else {
      this.tutorialPrevButton
        ?.setInteractive({
          useHandCursor: true,
        })
        .setAlpha(1);
    }

    this.tutorialHighlight?.clear();
    this.tutorialArrow?.clear();

    const targets = step.targets();

    this.updateTutorialSpotlight(targets);

    // draws yellow borders around every highlighted target
    targets.forEach((bounds) => {
      const padding = 9;

      this.tutorialHighlight
        ?.lineStyle(5, 0xffe866, 1)
        .strokeRoundedRect(
          bounds.x - padding,
          bounds.y - padding,
          bounds.width + padding * 2,
          bounds.height + padding * 2,
          10,
        );
    });

    // ensure the tutorial panel is positioned correctly based on the highlighted targets
    this.positionTutorialPanel(targets);

    const primaryTarget = targets[0];

    if (step.showArrow && primaryTarget) {
      this.drawTutorialArrow(primaryTarget);
    }
  }
  private previousTutorialStep(): void {
    if (this.tutorialSaving || this.tutorialStep <= 0) {
      return;
    }

    this.tutorialStep -= 1;

    this.showTutorialStep();
  }
  private positionTutorialPanel(targets: Phaser.Geom.Rectangle[]): void {
    if (!this.tutorialPanelContainer) {
      return;
    }

    const width = this.ui.scale.width;

    const height = this.ui.scale.height;

    const panelHeight = 230;

    const topPanelY = HUD_HEIGHT + panelHeight / 2 + 20;

    const bottomPanelY = height - panelHeight / 2 - 18;

    if (targets.length === 0) {
      this.tutorialPanelContainer.setPosition(width / 2, height / 2);

      return;
    }

    const combined = this.combineRectangles(targets);

    if (!combined) {
      return;
    }

    const targetCenterY = combined.centerY;

    const panelY = targetCenterY < height / 2 ? bottomPanelY : topPanelY;

    this.tutorialPanelContainer.setPosition(width / 2, panelY);
  }
  private drawTutorialArrow(target: Phaser.Geom.Rectangle): void {
    if (!this.tutorialArrow || !this.tutorialPanelContainer) {
      return;
    }

    const panelX = this.tutorialPanelContainer.x;

    const panelY = this.tutorialPanelContainer.y;

    const panelWidth = Math.min(590, this.ui.scale.width - 34);

    const panelHeight = 230;

    const targetX = target.centerX;

    const targetY = target.centerY;

    const targetIsAbove = targetY < panelY;

    const startX = Phaser.Math.Clamp(
      targetX,
      panelX - panelWidth / 2 + 30,
      panelX + panelWidth / 2 - 30,
    );

    const startY = targetIsAbove
      ? panelY - panelHeight / 2
      : panelY + panelHeight / 2;

    const angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);

    const arrowEndX = targetX - Math.cos(angle) * 18;

    const arrowEndY = targetY - Math.sin(angle) * 18;

    this.tutorialArrow.clear();

    this.tutorialArrow
      .lineStyle(4, 0xffe866, 1)
      .beginPath()
      .moveTo(startX, startY)
      .lineTo(arrowEndX, arrowEndY)
      .strokePath();

    const arrowSize = 13;

    const leftAngle = angle + Math.PI * 0.82;

    const rightAngle = angle - Math.PI * 0.82;

    this.tutorialArrow
      .fillStyle(0xffe866, 1)
      .beginPath()
      .moveTo(targetX, targetY)
      .lineTo(
        targetX + Math.cos(leftAngle) * arrowSize,
        targetY + Math.sin(leftAngle) * arrowSize,
      )
      .lineTo(
        targetX + Math.cos(rightAngle) * arrowSize,
        targetY + Math.sin(rightAngle) * arrowSize,
      )
      .closePath()
      .fillPath();

    this.tutorialArrowTween = this.ui.tweens.add({
      targets: this.tutorialArrow,

      alpha: {
        from: 0.45,
        to: 1,
      },

      duration: 500,

      yoyo: true,
      repeat: -1,
    });
  }
  private stopTutorialArrowAnimation(): void {
    this.tutorialArrowTween?.stop();

    this.tutorialArrowTween = null;

    this.tutorialArrow?.setAlpha(1);
  }
  private getTutorialTargetBounds(
    target: Phaser.GameObjects.GameObject,
  ): Phaser.Geom.Rectangle | null {
    const object = target as Phaser.GameObjects.GameObject & {
      getBounds?: () => Phaser.Geom.Rectangle;
    };

    if (typeof object.getBounds !== "function") {
      return null;
    }

    return object.getBounds();
  }
  private async advanceTutorial(): Promise<void> {
    if (this.tutorialSaving) {
      return;
    }

    const steps = this.getTutorialSteps();

    if (this.tutorialStep < steps.length - 1) {
      this.tutorialStep += 1;

      this.showTutorialStep();

      return;
    }

    await this.completeTutorial();
  }
  private async completeTutorial(): Promise<void> {
    if (this.tutorialSaving) {
      return;
    }

    this.tutorialSaving = true;

    this.tutorialNextButton?.disableInteractive().setText("SAVING...");

    try {
      const response = await fetch("/api/tutorial-complete", {
        method: "POST",

        headers: {
          Accept: "application/json",
        },
      });

      const responseData = (await response.json()) as unknown;

      // if not logged in, just complete the tutorial locally without saving to server
      if (response.status === 401) {
        console.log("[Tutorial] Guest player completed tutorial locally.");

        this.finishTutorial();

        return;
      }

      if (!response.ok) {
        const errorData = responseData as ApiErrorResponse;

        throw new Error(errorData.message ?? "Unable to complete tutorial.");
      }

      const data = responseData as CompleteTutorialResponse;

      if (data.type !== "tutorial-complete" || data.status !== "success") {
        throw new Error("Unexpected tutorial completion response.");
      }

      this.finishTutorial();
    } catch (error) {
      console.error("[Tutorial] Failed to save completion:", error);

      this.tutorialSaving = false;

      this.tutorialNextButton?.setText("TRY AGAIN").setInteractive({
        useHandCursor: true,
      });
    }
  }
  private finishTutorial(): void {
    const gameScene = this.ui.scene.get("Game") as any;
    gameScene.hideTutorialAttackIndicator?.();
    gameScene.hideTutorialEnrageEffect?.();
    gameScene.hideTutorialPursuitBar?.();
    this.stopTutorialArrowAnimation();
    this.tutorialDimGraphics = null;
    this.tutorialInputBlocker = null;
    this.tutorialContainer?.destroy(true);

    this.tutorialContainer = null;
    this.tutorialPanelContainer = null;

    this.tutorialHighlight = null;
    this.tutorialArrow = null;
    this.tutorialArrowTween = null;

    this.tutorialTitle = null;
    this.tutorialDescription = null;
    this.tutorialProgressText = null;

    this.tutorialPrevButton = null;
    this.tutorialNextButton = null;
    this.tutorialSaving = false;

    gameScene.shouldShowTutorial = false;
    gameScene.isGamePaused = false;
    gameScene.allowInput = true;

    this.ui.isMultiplierPaused = false;

    this.ui.lastMultiplierUpdate = gameScene.activeGameTime;
  }
}
