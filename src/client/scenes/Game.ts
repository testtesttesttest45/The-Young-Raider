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
const HUD_HEIGHT = 120;
const WORLD_TOP_PADDING = 130;

export class Game extends Scene {
  camp1: any;

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

  hasHandledPlayerDeath = false;
  attackKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('Game');
  }


  create() {
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

    this.events.once(
      Phaser.Scenes.Events.SHUTDOWN,
      this.shutdown,
      this
    );

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
      300
    );

    this.camp1.create();

    this.camps = [
      this.camp1
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

    if (this.scene.isActive('BattleUI')) {
      this.scene.stop('BattleUI');
    }

    this.scene.launch('BattleUI');

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.handleResize(this.scale.gameSize);
    this.scale.on('resize', this.handleResize, this);

    this.input.on(
      'pointerdown',
      (pointer: Phaser.Input.Pointer) => {
        if (pointer.y <= HUD_HEIGHT) {
          return;
        }

        if (
          !this.allowInput ||
          this.isGamePaused ||
          this.isGameOver
        ) {
          return;
        }

        if (this.player.isActionLocked) {
          return;
        }

        this.enemyClicked = false;
        this.player.targetedEnemy = null;
        this.player.isMovingTowardsEnemy = false;
        this.player.continueAttacking = false;

        this.player.moveStraight(
          pointer.worldX,
          pointer.worldY
        );
      }
    );

    if (this.input.keyboard) {
      this.attackKey =
        this.input.keyboard.addKey(
          Phaser.Input.Keyboard.KeyCodes.Q
        );
    }
  }

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

  override update(
    time: number,
    delta: number
  ): void {
    const playerDead =
      this.player?.isDead === true;

    const battleUI =
      this.scene.get(
        'BattleUI'
      ) as any;

    if (
      playerDead &&
      !this.hasHandledPlayerDeath
    ) {
      this.hasHandledPlayerDeath = true;
      this.isGameOver = true;
      this.allowInput = false;

      battleUI?.pauseMultiplier?.();

      if (this.player?.currentTween) {
        this.player.currentTween.stop();
        this.player.currentTween = null;
      }
    }

    if (
      !this.isGamePaused &&
      !this.isGameOver &&
      !playerDead
    ) {
      this.activeGameTime += delta;
    }
    if (
      this.attackKey &&
      Phaser.Input.Keyboard.JustDown(
        this.attackKey
      )
    ) {
      if (
        this.allowInput &&
        !this.isGamePaused &&
        !this.isGameOver &&
        !playerDead
      ) {
        this.player?.attackOnce?.();
      }
    }

    this.player?.update?.(
      time,
      delta
    );

    const gameplayEnded =
      this.isGameOver ||
      playerDead;

    if (!gameplayEnded) {
      this.enemies.forEach(
        enemy => {
          enemy.update?.(
            time,
            delta
          );
        }
      );

      this.base?.update?.(
        time,
        delta
      );

      this.catastrophe?.update?.(
        time,
        delta
      );
    }
    if (
      battleUI &&
      !gameplayEnded
    ) {
      battleUI.updateTimer(
        this.catastrophe
          .getTimeUntilNextStorm()
      );

      const aliveEnemies =
        this.enemies.filter(
          enemy =>
            !enemy.isDead
        );

      if (aliveEnemies.length > 0) {
        const highestLevelEnemy =
          aliveEnemies.reduce(
            (
              firstEnemy,
              secondEnemy
            ) =>
              firstEnemy.strengthenLevel >
                secondEnemy.strengthenLevel
                ? firstEnemy
                : secondEnemy
          );

        battleUI.updateStrengthenTimer(
          highestLevelEnemy
            .getTimeUntilNextStrengthen()
        );
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

  createEnemy(baseLevel: number): void {
    this.enemies = this.enemies.filter(
      enemy => !enemy.isDead
    );

    const existingAliveEnemy =
      this.enemies.find(
        enemy => !enemy.isDead
      );

    if (existingAliveEnemy) {
      return;
    }

    const camp = this.camps[0];

    if (!camp) {
      
      return;
    }

    const spawnPos =
      camp.getRandomPositionInRadius();

    spawnPos.x = Phaser.Math.Clamp(
      spawnPos.x,
      50,
      WORLD_W - 50
    );

    spawnPos.y = Phaser.Math.Clamp(
      spawnPos.y,
      WORLD_TOP_PADDING,
      WORLD_H - 50
    );
    const enemyCharacterCode = 2;

    const enemy = new Enemy(
      this,
      spawnPos.x,
      spawnPos.y,
      enemyCharacterCode,
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