import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { IncrementResponse, DecrementResponse, InitResponse } from '../../shared/api';
import Camp from '../game/Camp';
import Base from '../game/Base';
import Player from '../game/Player';
import Enemy from '../game/Enemy';
import Catastrophe from '../game/Catastrophe';

const WORLD_W = 1280;
const WORLD_H = 720;

export class Game extends Scene {
  camp1: any;
  camp2: any;
  camp3: any;

  player: any;

  enemies: any[] = [];
  camps: any[] = [];

  base: any;
  catastrophe: any;
  battleUI: any;

  activeGameTime = 0;

  isGamePaused = false;
  isGameOver = false;
  allowInput = true;

  isCameraLocked = false;
  isCameraFollowingPlayer = true;

  isWinterFrostActive = false;
  isTreasureHunterActive = false;

  enemyClicked = false;

  characterInUse = 1;

  gold = 0;

  constructor() {
    super('Game');
  }

  create() {
    this.events.once(
      Phaser.Scenes.Events.SHUTDOWN,
      this.shutdown,
      this
    );
    this.gold = 0;

    this.activeGameTime = 0;

    this.enemies = [];
    this.camps = [];

    this.enemyClicked = false;

    this.isWinterFrostActive = false;
    this.isTreasureHunterActive = false;

    const isPortrait =
      this.scale.gameSize.height > this.scale.gameSize.width;

    if (isPortrait) {
      console.log("Mobile Portrait");
    } else {
      console.log("Landscape/Desktop");
    }

    const island = this.add.image(
      WORLD_W / 2,
      WORLD_H / 2,
      'land'
    );

    const cover =
      Math.max(
        WORLD_W / island.width,
        WORLD_H / island.height
      );

    island.setScale(cover);

    this.camp1 = new Camp(
      this,
      250,
      250
    );
    this.camp1.create();

    this.camp2 = new Camp(
      this,
      800,
      250
    );
    this.camp2.create();

    this.camp3 = new Camp(
      this,
      525,
      650
    );
    this.camp3.create();

    this.camps = [
      this.camp1,
      this.camp2,
      this.camp3
    ];
    this.characterInUse =
      parseInt(
        localStorage.getItem(
          'selectedCharacter'
        ) ?? '1'
      );
    this.player = new Player(
      this,
      300,
      300,
      this.characterInUse,
      this.enemies
    );

    this.player.create();

    // Base
    this.base = new Base(
      this,
      this.player,
      this.camps,
    );

    this.base.create();
    this.createEnemy(1);

    this.catastrophe = new Catastrophe(
      this,
      1
    );

    this.catastrophe.startStormTimer();
    this.catastrophe.drawstormShelter();

    this.scene.launch('BattleUI');

    // Set up camera bounds + zoom-to-cover, then keep it in sync on resize
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.handleResize(this.scale.gameSize);
    this.scale.on('resize', this.handleResize, this);

    // Movement test
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {

      if (this.enemyClicked) {
        this.enemyClicked = false;
        return;
      }

      this.player.targetedEnemy = null;

      this.player.moveStraight(
        pointer.worldX,
        pointer.worldY
      );
    });



    this.input.on(
      'gameobjectdown',
      (
        pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject
      ) => {

        const enemy = this.enemies.find(
          e => e.sprite === gameObject
        );

        if (enemy) {

          console.log('Enemy clicked');

          this.enemyClicked = true;
          this.player.targetedEnemy = enemy;

          const pos = enemy.getPosition();

          this.player.moveStraight(
            pos.x,
            pos.y
          );

          return;
        }

        const baseClicked =
          this.base &&
          this.base.sprite === gameObject;

        if (baseClicked) {

          console.log('Base clicked');

          this.enemyClicked = true;

          this.player.targetedEnemy =
            this.base;

          const pos =
            this.base.getPosition();

          this.player.moveStraight(
            pos.x,
            pos.y
          );
        }
      }
    );
  }

  /**
   * Keeps the camera viewport filling the canvas and zooms the world
   * to cover it — no blue gaps past the 1280x720 design area.
   */
  private handleResize(gameSize: Phaser.Structs.Size) {
    const w = gameSize.width;
    const h = gameSize.height;
    const cam = this.cameras.main;

    cam.setSize(w, h);                               // viewport fills the canvas
    cam.setZoom(Math.min(w / WORLD_W, h / WORLD_H)); // fit whole world — nothing cropped

    if (!this.isCameraFollowingPlayer) {
      cam.centerOn(WORLD_W / 2, WORLD_H / 2);
    }
  }

  override update(time: number, delta: number) {
    if (!this.isGamePaused) {
      this.activeGameTime += delta;
    }

    this.player?.update?.(time, delta);

    this.enemies.forEach(enemy => {
      enemy.update?.(time, delta);
    });

    this.base?.update?.(time, delta);

    this.catastrophe?.update?.(time, delta);

    const battleUI =
      this.scene.get('BattleUI') as any;

    if (battleUI) {

      battleUI.updateTimer(
        this.catastrophe.getTimeUntilNextStorm()
      );

      if (this.enemies.length > 0) {

        const aliveEnemies =
          this.enemies.filter(
            e => !e.isDead
          );

        if (aliveEnemies.length > 0) {

          const highestLevelEnemy =
            aliveEnemies.reduce(
              (a, b) =>
                a.strengthenLevel >
                  b.strengthenLevel
                  ? a
                  : b
            );

          battleUI.updateStrengthenTimer(
            highestLevelEnemy
              .getTimeUntilNextStrengthen()
          );
        }
      }
    }
  }

  toggleCameraLock() {
    this.isCameraLocked = !this.isCameraLocked;
  }

  toggleCameraFollow() {
    this.isCameraFollowingPlayer = !this.isCameraFollowingPlayer;
  }

  collectGold(gold: any) {

    const value =
      gold.getData('value') ?? 0;

    console.log(
      "Gold Collected:",
      value
    );

    this.gold += value;

    const battleUI =
      this.scene.get('BattleUI') as any;

    if (battleUI?.addGold) {
      battleUI.addGold(value);
    }

    gold.destroy();
  }

  collectCash(cash: any) {

    const value =
      cash.getData('value') ?? 1;

    console.log(
      "Cash Collected:",
      value
    );

    const battleUI =
      this.scene.get('BattleUI') as any;

    if (battleUI?.addCash) {
      battleUI.addCash(value);
    }

    cash.destroy();
  }

  createEnemy(baseLevel: number) {

    // Remove dead enemies first
    this.enemies =
      this.enemies.filter(
        enemy => !enemy.isDead
      );

    const campEnemyCount =
      baseLevel === 1
        ? 1
        : Math.min(
          3,
          1 + Math.floor(baseLevel / 3)
        );

    const patrolEnemyCount =
      baseLevel === 1
        ? 1
        : Math.min(
          2,
          Math.floor(baseLevel / 5)
        );

    // CAMP ENEMIES
    this.camps.forEach((camp: any) => {

      for (
        let i = 0;
        i < campEnemyCount;
        i++
      ) {

        const spawnPos =
          camp.getRandomPositionInRadius();

        const enemy =
          new Enemy(
            this,
            spawnPos.x,
            spawnPos.y,
            this.selectEnemyCharacterCode(),
            camp,
            this.player,
            baseLevel,
            this.base,
            this.isWinterFrostActive,
            this.isTreasureHunterActive
          );

        enemy.create();
        enemy.startTimer();

        this.enemies.push(enemy);
      }
    });

    // PATROLLERS
    for (
      let i = 0;
      i < patrolEnemyCount;
      i++
    ) {

      const basePos =
        this.base.getPosition();

      const enemy =
        new Enemy(
          this,
          basePos.x,
          basePos.y,
          1,
          null,
          this.player,
          baseLevel,
          this.base,
          this.isWinterFrostActive,
          this.isTreasureHunterActive
        );

      enemy.patrolling = true;

      enemy.patrolBounds = {
        minX: 50,
        maxX: 974,
        minY: 50,
        maxY: 718
      };

      enemy.create();
      enemy.startTimer();

      this.enemies.push(enemy);
    }

    console.log(
      `Spawned ${this.enemies.length} enemies`
    );
  }

  selectEnemyCharacterCode() {

    const easyEnemies = [
      1,
      2,
      3
    ];

    const hardEnemies = [
      4,
      5,
      6
    ];

    if (
      this.base.baseLevel >= 4 &&
      Math.random() < 0.7
    ) {

      return hardEnemies[
        Phaser.Math.Between(
          0,
          hardEnemies.length - 1
        )
      ];
    }

    return easyEnemies[
      Phaser.Math.Between(
        0,
        easyEnemies.length - 1
      )
    ];
  }

  shutdown() {

    this.scale.off('resize', this.handleResize, this);

    this.enemies.forEach(enemy => {

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