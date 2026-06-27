import { Scene } from "phaser";
import * as Phaser from "phaser";
import Camp from "../game/Camp";
import Base from "../game/Base";
import Player from "../game/Player";
import Enemy from "../game/Enemy";
import Catastrophe from "../game/Catastrophe";
import GameControls from "../game/GameControls";
import type {
  ApiErrorResponse,
  GetSelectedRaiderResponse,
  TutorialStatusResponse,
} from "../../shared/api";
import characterMap, { type RaiderDefinition } from "../game/CharacterMap";

const WORLD_W = 1280;
const WORLD_H = 720;
const WORLD_TOP_PADDING = 130;

export class Game extends Scene {
  camp1: any;

  player: any;

  enemies: any[] = [];
  camps: any[] = [];

  base: any;
  catastrophe: any;
  battleUI: any;

  controls!: GameControls;

  activeGameTime = 0;

  isGamePaused = false;
  isGameOver = false;
  allowInput = true;

  isWinterFrostActive = false;
  isTreasureHunterActive = false;

  enemyClicked = false;

  characterInUse = 16;

  gold = 0;

  hasHandledPlayerDeath = false;
  private initializationVersion = 0;
  private gameInitialized = false;
  shouldShowTutorial = false;
  private tutorialStatusLoaded = false;
  private loadingOverlay: Phaser.GameObjects.Container | null = null;

  constructor() {
    super("Game");
  }

  create(): void {
    this.initializationVersion += 1;
    const currentInitialization = this.initializationVersion;
    this.gameInitialized = false;
    this.shouldShowTutorial = false;
    this.tutorialStatusLoaded = false;
    this.player = null;
    this.controls = undefined as any;
    this.base = null;
    this.catastrophe = null;
    this.battleUI = null;

    this.isGamePaused = false;
    this.isGameOver = false;
    this.allowInput = false;
    this.hasHandledPlayerDeath = false;

    this.activeGameTime = 0;
    this.gold = 0;

    this.enemies = [];
    this.camps = [];

    this.enemyClicked = false;

    this.isWinterFrostActive = false;
    this.isTreasureHunterActive = false;

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

    // prevent page blank while loading raider assets
    this.createWorldBackground();
    this.createLoadingOverlay();

    void this.initializeGame(currentInitialization);
  }

  private createWorldBackground(): void {
    const island = this.add.image(WORLD_W / 2, WORLD_H / 2, "land");

    const cover = Math.max(WORLD_W / island.width, WORLD_H / island.height);

    island.setScale(cover);

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    this.handleResize(this.scale.gameSize);
  }

  private createLoadingOverlay(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    const backdrop = this.add
      .rectangle(0, 0, width, height, 0x02070c, 0.72)
      .setOrigin(0, 0)
      .setScrollFactor(0);

    const panel = this.add
      .rectangle(width / 2, height / 2, 330, 120, 0x0b1c29, 0.96)
      .setStrokeStyle(2, 0x55d7ff, 0.8)
      .setScrollFactor(0);

    const title = this.add
      .text(width / 2, height / 2 - 18, "PREPARING RAID", {
        font: "bold 17px Orbitron",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    const subtitle = this.add
      .text(width / 2, height / 2 + 20, "Loading your selected Raider...", {
        font: "11px Orbitron",
        color: "#a9efff",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.loadingOverlay = this.add
      .container(0, 0, [backdrop, panel, title, subtitle])
      .setDepth(5000);
  }

  private async initializeGame(initializationVersion: number): Promise<void> {
    const [selectedRaider, tutorialCompleted] = await Promise.all([
      this.loadSelectedRaider(),
      this.loadTutorialStatus(),
    ]);

    this.characterInUse = selectedRaider;

    this.shouldShowTutorial = !tutorialCompleted;

    this.tutorialStatusLoaded = true;

    if (!this.sys.isActive()) {
      return;
    }

    this.characterInUse = this.characterInUse ?? 16;

    await this.loadSelectedRaiderAssets(this.characterInUse);

    if (!this.sys.isActive()) {
      return;
    }

    const playerStartX = WORLD_W / 2;

    const playerStartY = WORLD_H - 90;

    const campPositions = [
      {
        x: 210,
        y: 235,
      },
      {
        x: WORLD_W / 2,
        y: 205,
      },
      {
        x: WORLD_W - 210,
        y: 235,
      },
    ];

    this.camps = campPositions.map((position) => {
      const camp = new Camp(this, position.x, position.y);

      camp.create();

      return camp;
    });

    this.camp1 = this.camps[0];

    this.player = new Player(
      this,
      playerStartX,
      playerStartY,
      this.characterInUse,
      this.enemies,
    );

    this.player.create();

    this.controls = new GameControls(this);

    this.controls.create();

    this.base = new Base(this, this.player, this.camps);

    this.base.create();

    this.createLevelEnemies(1);

    this.catastrophe = new Catastrophe(this, 1);

    this.catastrophe.startStormTimer();

    if (this.scene.isActive("BattleUI")) {
      this.scene.stop("BattleUI");
    }

    this.scene.launch("BattleUI");

    this.scale.on("resize", this.handleResize, this);

    this.loadingOverlay?.destroy(true);
    this.loadingOverlay = null;

    this.gameInitialized = true;

    if (this.shouldShowTutorial) {
      this.isGamePaused = true;
      this.allowInput = false;

      console.log("[Game] First-time player. Tutorial required.");
    } else {
      this.isGamePaused = false;
      this.allowInput = true;

      console.log("[Game] Returning player. Starting normally.");
    }
  }

  private async loadSelectedRaider(): Promise<number> {
    try {
      const response = await fetch("/api/selected-raider", {
        headers: {
          Accept: "application/json",
        },
      });

      const responseData = (await response.json()) as unknown;

      if (!response.ok) {
        const errorData = responseData as ApiErrorResponse;

        throw new Error(errorData.message ?? "Unable to load selected Raider.");
      }

      const data = responseData as GetSelectedRaiderResponse;

      if (data.type !== "selected-raider") {
        throw new Error("Unexpected selected-Raider response.");
      }

      const validRaiderCodes = [16, 17, 18, 19];

      if (!validRaiderCodes.includes(data.characterCode)) {
        throw new Error(
          `Invalid Raider code returned by server: ${data.characterCode}`,
        );
      }

      return data.characterCode;
    } catch (error) {
      console.error("[Game] Failed to load selected Raider:", error);

      // Runtime fallback only. Nothing is saved locally.
      return 16;
    }
  }

  private async loadTutorialStatus(): Promise<boolean> {
    try {
      const response = await fetch("/api/tutorial-status", {
        headers: {
          Accept: "application/json",
        },
      });

      const responseData = (await response.json()) as unknown;

      if (!response.ok) {
        const errorData = responseData as ApiErrorResponse;

        throw new Error(errorData.message ?? "Unable to load tutorial status.");
      }

      const data = responseData as TutorialStatusResponse;

      if (
        data.type !== "tutorial-status" ||
        typeof data.completed !== "boolean"
      ) {
        throw new Error("Unexpected tutorial-status response.");
      }

      console.log("[Game] Tutorial completed:", data.completed);

      return data.completed;
    } catch (error) {
      console.error("[Game] Failed to load tutorial status:", error);

      // Runtime fallback only. Nothing is saved locally.
      return false;
    }
  }

  override update(time: number, delta: number): void {
    if (
      !this.gameInitialized ||
      !this.player ||
      !this.player.robotSprite ||
      !this.player.robotSprite.active ||
      !this.player.robotSprite.anims ||
      !this.controls ||
      !this.base ||
      !this.catastrophe
    ) {
      return;
    }
    const playerDead = this.player?.isDead === true;

    const battleUI = this.scene.get("BattleUI") as any;

    if (playerDead && !this.hasHandledPlayerDeath) {
      this.hasHandledPlayerDeath = true;

      this.isGameOver = true;
      this.allowInput = false;

      battleUI?.pauseMultiplier?.();

      this.controls?.onPlayerDeath();

      if (this.player?.currentTween) {
        this.player.currentTween.stop();

        this.player.currentTween = null;
      }
    }

    if (!this.isGamePaused && !this.isGameOver && !playerDead) {
      this.activeGameTime += delta;
    }

    this.controls?.update(time, delta);

    this.player?.update?.(time, delta);

    const gameplayEnded = this.isGameOver || playerDead;

    const gameplayRunning = !gameplayEnded && !this.isGamePaused;

    if (gameplayRunning) {
      this.enemies.forEach((enemy) => {
        enemy.update?.(time, delta);
      });

      this.base?.update?.(time, delta);

      this.catastrophe?.update?.(time, delta);
    }

    if (battleUI && gameplayRunning) {
      battleUI.updateTimer(this.catastrophe.getTimeUntilNextStorm());

      const aliveEnemies = this.enemies.filter((enemy) => !enemy.isDead);

      if (aliveEnemies.length > 0) {
        const highestLevelEnemy = aliveEnemies.reduce(
          (firstEnemy, secondEnemy) =>
            firstEnemy.strengthenLevel > secondEnemy.strengthenLevel
              ? firstEnemy
              : secondEnemy,
        );

        battleUI.updateStrengthenTimer(
          highestLevelEnemy.getTimeUntilNextStrengthen(),
        );
      }
    }
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const width = gameSize.width;

    const height = gameSize.height;

    const camera = this.cameras.main;

    camera.setSize(width, height);

    camera.setZoom(Math.min(width / WORLD_W, height / WORLD_H));

    camera.centerOn(WORLD_W / 2, WORLD_H / 2);

    this.controls?.handleResize(gameSize);
  }

  collectGold(gold: any): void {
    const value = gold.getData("value") ?? 0;

    console.log("Gold Collected:", value);

    this.gold += value;

    const battleUI = this.scene.get("BattleUI") as any;

    battleUI?.addGold?.(value);

    gold.destroy();
  }

  collectCash(cash: any): void {
    const value = cash.getData("value") ?? 1;

    console.log("Cash Collected:", value);

    const battleUI = this.scene.get("BattleUI") as any;

    battleUI?.addCash?.(value);

    cash.destroy();
  }

  private createLevelEnemies(baseLevel: number): void {
    // level 1: 1 enemy per camp, 1 patroller
    // level 2+: 3 enemies per camp, 2 patrollers
    const enemiesPerCamp = baseLevel === 1 ? 1 : 3;

    const patrollerCount = baseLevel === 1 ? 1 : 2;

    this.camps.forEach((camp) => {
      for (let enemyIndex = 0; enemyIndex < enemiesPerCamp; enemyIndex++) {
        const spawnPosition = this.getCampSpawnPosition(camp);

        this.spawnEnemy(
          spawnPosition.x,
          spawnPosition.y,
          camp,
          baseLevel,
          false,
        );
      }
    });

    // patrollers spawn near base
    for (
      let patrollerIndex = 0;
      patrollerIndex < patrollerCount;
      patrollerIndex++
    ) {
      const spawnPosition = this.getBasePatrollerSpawnPosition();

      this.spawnEnemy(spawnPosition.x, spawnPosition.y, null, baseLevel, true);
    }
  }

  private spawnEnemy(
    x: number,
    y: number,
    camp: any,
    baseLevel: number,
    isPatrolling: boolean,
  ): Enemy {
    const enemyCharacterCode = this.selectEnemyCharacterCode();

    const enemy = new Enemy(
      this,
      x,
      y,
      enemyCharacterCode,
      camp,
      this.player,
      baseLevel,
      this.base,
      this.isWinterFrostActive,
      this.isTreasureHunterActive,
    );

    enemy.patrolling = isPatrolling;

    enemy.create();
    enemy.startTimer();

    if (isPatrolling) {
      enemy.inCamp = false;
      enemy.returningToCamp = false;
      enemy.hasPlayerBeenDetected = false;
      enemy.isAlert = false;

      enemy.nextPatrolTime = this.time.now + Phaser.Math.Between(300, 1200);
    }

    this.enemies.push(enemy);

    return enemy;
  }

  private getCampSpawnPosition(camp: any): {
    x: number;
    y: number;
  } {
    const position = camp.getRandomPositionInRadius();

    return {
      x: Phaser.Math.Clamp(position.x, 50, WORLD_W - 50),

      y: Phaser.Math.Clamp(position.y, WORLD_TOP_PADDING, WORLD_H - 50),
    };
  }

  private getBasePatrollerSpawnPosition(): {
    x: number;
    y: number;
  } {
    const basePosition = this.getEnemyBasePosition();

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);

    const distance = Phaser.Math.Between(70, 140);

    return {
      x: Phaser.Math.Clamp(
        basePosition.x + Math.cos(angle) * distance,
        60,
        WORLD_W - 60,
      ),

      y: Phaser.Math.Clamp(
        basePosition.y + Math.sin(angle) * distance,
        WORLD_TOP_PADDING,
        WORLD_H - 60,
      ),
    };
  }

  private getEnemyBasePosition(): {
    x: number;
    y: number;
  } {
    if (typeof this.base?.getPosition === "function") {
      const position = this.base.getPosition();

      return {
        x: position.x,
        y: position.y,
      };
    }

    if (this.base?.sprite) {
      return {
        x: this.base.sprite.x,
        y: this.base.sprite.y,
      };
    }

    if (typeof this.base?.x === "number" && typeof this.base?.y === "number") {
      return {
        x: this.base.x,
        y: this.base.y,
      };
    }
    return {
      x: WORLD_W / 2,
      y: WORLD_TOP_PADDING + 80,
    };
  }

  createEnemy(baseLevel: number): void {
    // remove dead enemies from array before creating new ones to avoid memory leaks and performance issues
    this.enemies = this.enemies.filter((enemy) => !enemy.isDead);

    this.createLevelEnemies(baseLevel);
  }

  selectEnemyCharacterCode(): number {
    // Characters 1–15 are enemies
    return Phaser.Math.Between(1, 15);
  }

  private shutdown(): void {
    this.initializationVersion += 1;

    this.gameInitialized = false;
    this.allowInput = false;
    this.controls?.shutdown();

    this.scale.off("resize", this.handleResize, this);

    this.enemies.forEach((enemy) => {
      enemy.moveTween?.stop();

      enemy.attackEvent?.destroy();

      enemy.fireTimerEvent?.destroy();

      enemy.sprite?.destroy();

      enemy.healthBar?.destroy();

      enemy.detectionBar?.destroy();

      enemy.customSquareContainer?.destroy();

      enemy.strengthenedSquareContainer?.destroy();
    });

    this.enemies = [];
    if (this.player?.currentTween) {
      this.player.currentTween.stop();
      this.player.currentTween = null;
    }

    if (this.player?.moveTween) {
      this.player.moveTween.stop();
      this.player.moveTween = null;
    }

    this.player?.attackEvent?.destroy?.();

    this.player?.robotSprite?.off?.();

    this.player = null;
    this.base = null;
    this.catastrophe = null;
    this.controls = undefined as any;

    this.enemies = [];
    this.camps = [];
  }
  private async loadSelectedRaiderAssets(characterCode: number): Promise<void> {
    const character = characterMap[characterCode];

    if (!character || character.type !== "raider") {
      throw new Error(`[Game] Invalid Raider code: ${characterCode}`);
    }

    const assets = [
      {
        key: character.movingSpritesheetKey,

        path: `characters/raider/${character.movingSpritesheetKey}.png`,
      },
      {
        key: character.attackSpritesheetKey,

        path: `characters/raider/${character.attackSpritesheetKey}.png`,
      },
      {
        key: character.deathSpritesheetKey,

        path: `characters/raider/${character.deathSpritesheetKey}.png`,
      },
      {
        key: character.slashSpritesheetKey,

        path: `characters/raider/${character.slashSpritesheetKey}.png`,
      },
      {
        key: character.dashSlashSpritesheetKey,

        path: `characters/raider/${character.dashSlashSpritesheetKey}.png`,
      },
      {
        key: character.shieldSpritesheetKey,

        path: `characters/raider/${character.shieldSpritesheetKey}.png`,
      },
      {
        key: character.shieldMoveSpritesheetKey,

        path: `characters/raider/${character.shieldMoveSpritesheetKey}.png`,
      },
    ];

    const missingAssets = assets.filter((asset) => {
      return !this.textures.exists(asset.key);
    });

    if (missingAssets.length === 0) {
      console.log("[Game] Raider assets already loaded:", characterCode);

      return;
    }

    await new Promise<void>((resolve, reject) => {
      const handleLoadError = (file: Phaser.Loader.File): void => {
        cleanup();

        reject(new Error(`[Game] Failed to load ${file.key}`));
      };

      const handleComplete = (): void => {
        cleanup();
        resolve();
      };

      const cleanup = (): void => {
        this.load.off("loaderror", handleLoadError);

        this.load.off("complete", handleComplete);
      };

      this.load.once("loaderror", handleLoadError);

      this.load.once("complete", handleComplete);

      missingAssets.forEach((asset) => {
        this.load.spritesheet(asset.key, `../assets/${asset.path}`, {
          frameWidth: 128,
          frameHeight: 128,
        });
      });

      this.load.start();
    });
  }

  public getTutorialEnemy(): any | null {
    return (
      this.enemies.find(
        (enemy) => !enemy.isDead && !enemy.patrolling && enemy.sprite?.active,
      ) ??
      this.enemies.find((enemy) => !enemy.isDead && enemy.sprite?.active) ??
      null
    );
  }

  public getBaseTutorialBounds(): Phaser.Geom.Rectangle | null {
    return this.base?.getTutorialBounds?.() ?? null;
  }

  public getEnemyTutorialBounds(): Phaser.Geom.Rectangle | null {
    return this.getTutorialEnemy()?.getTutorialBounds?.() ?? null;
  }

  public getEnemyBaseLevelTutorialBounds(): Phaser.Geom.Rectangle | null {
    return this.getTutorialEnemy()?.getBaseLevelTutorialBounds?.() ?? null;
  }

  public getEnemyStrengthLevelTutorialBounds(): Phaser.Geom.Rectangle | null {
    return this.getTutorialEnemy()?.getStrengthLevelTutorialBounds?.() ?? null;
  }

  public getEnemyHealthAreaTutorialBounds(): Phaser.Geom.Rectangle | null {
    return this.getTutorialEnemy()?.getHealthAreaTutorialBounds?.() ?? null;
  }

  public getEnemyCampTutorialBounds(): Phaser.Geom.Rectangle | null {
    const enemy = this.getTutorialEnemy();

    return enemy?.originalCamp?.getTutorialBounds?.() ?? null;
  }

  public worldBoundsToScreenBounds(
    worldBounds: Phaser.Geom.Rectangle,
  ): Phaser.Geom.Rectangle {
    const camera = this.cameras.main;

    const zoom = camera.zoom;

    return new Phaser.Geom.Rectangle(
      (worldBounds.x - camera.worldView.x) * zoom,

      (worldBounds.y - camera.worldView.y) * zoom,

      worldBounds.width * zoom,
      worldBounds.height * zoom,
    );
  }

  public getBaseTutorialScreenBounds(): Phaser.Geom.Rectangle | null {
    const bounds = this.getBaseTutorialBounds();

    return bounds ? this.worldBoundsToScreenBounds(bounds) : null;
  }

  public getEnemyTutorialScreenBounds(): Phaser.Geom.Rectangle | null {
    const bounds = this.getEnemyTutorialBounds();

    return bounds ? this.worldBoundsToScreenBounds(bounds) : null;
  }

  public getEnemyBaseLevelTutorialScreenBounds(): Phaser.Geom.Rectangle | null {
    const bounds = this.getEnemyBaseLevelTutorialBounds();

    return bounds ? this.worldBoundsToScreenBounds(bounds) : null;
  }

  public getEnemyStrengthLevelTutorialScreenBounds(): Phaser.Geom.Rectangle | null {
    const bounds = this.getEnemyStrengthLevelTutorialBounds();

    return bounds ? this.worldBoundsToScreenBounds(bounds) : null;
  }

  public getEnemyHealthAreaTutorialScreenBounds(): Phaser.Geom.Rectangle | null {
    const bounds = this.getEnemyHealthAreaTutorialBounds();

    return bounds ? this.worldBoundsToScreenBounds(bounds) : null;
  }

  public getEnemyCampTutorialScreenBounds(): Phaser.Geom.Rectangle | null {
    const bounds = this.getEnemyCampTutorialBounds();

    return bounds ? this.worldBoundsToScreenBounds(bounds) : null;
  }

  public showTutorialAttackIndicator(): void {
    this.getTutorialEnemy()?.showTutorialAttackIndicator?.();
  }

  public hideTutorialAttackIndicator(): void {
    this.enemies.forEach((enemy) => {
      enemy?.hideTutorialAttackIndicator?.();
    });
  }

  public showTutorialEnrageEffect(): void {
    this.getTutorialEnemy()?.showTutorialEnrageEffect?.();
  }

  public hideTutorialEnrageEffect(): void {
    this.enemies.forEach((enemy) => {
      enemy?.hideTutorialEnrageEffect?.();
    });
  }

  public showTutorialPursuitBar(): void {
    this.getTutorialEnemy()?.showTutorialPursuitBar?.();
  }

  public hideTutorialPursuitBar(): void {
    this.enemies.forEach((enemy) => {
      enemy?.hideTutorialPursuitBar?.();
    });
  }
}
