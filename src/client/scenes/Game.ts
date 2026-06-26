import { Scene } from "phaser";
import * as Phaser from "phaser";

import Camp from "../game/Camp";
import Base from "../game/Base";
import Player from "../game/Player";
import Enemy from "../game/Enemy";
import Catastrophe from "../game/Catastrophe";
import GameControls from "../game/GameControls";

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

  characterInUse = 1;

  gold = 0;

  hasHandledPlayerDeath = false;

  constructor() {
    super("Game");
  }

  create(): void {
    this.isGamePaused = false;
    this.isGameOver = false;
    this.allowInput = true;
    this.hasHandledPlayerDeath = false;

    this.activeGameTime = 0;
    this.gold = 0;

    this.enemies = [];
    this.camps = [];

    this.enemyClicked = false;

    this.isWinterFrostActive = false;
    this.isTreasureHunterActive = false;

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

    const island = this.add.image(WORLD_W / 2, WORLD_H / 2, "land");

    const cover = Math.max(WORLD_W / island.width, WORLD_H / island.height);

    island.setScale(cover);

    // keep a large distance between the player and camps
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

    this.characterInUse = parseInt(
      localStorage.getItem("selectedCharacter") ?? "1",
    );

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

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    this.handleResize(this.scale.gameSize);

    this.scale.on("resize", this.handleResize, this);
  }

  override update(time: number, delta: number): void {
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

    if (!gameplayEnded) {
      this.enemies.forEach((enemy) => {
        enemy.update?.(time, delta);
      });

      this.base?.update?.(time, delta);

      this.catastrophe?.update?.(time, delta);
    }

    if (battleUI && !gameplayEnded) {
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
    // Characters 2–16 are enemies
    return Phaser.Math.Between(2, 16);
  }

  private shutdown(): void {
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
  }
}
