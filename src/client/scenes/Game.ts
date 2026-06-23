import { Scene } from 'phaser';
import * as Phaser from 'phaser';

import Camp from '../game/Camp';
import Base from '../game/Base';
import Player from '../game/Player';
import Enemy from '../game/Enemy';
import Catastrophe from '../game/Catastrophe';
import GameControls from '../game/GameControls';

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
    super('Game');
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

    this.events.once(
      Phaser.Scenes.Events.SHUTDOWN,
      this.shutdown,
      this
    );

    const island = this.add.image(
      WORLD_W / 2,
      WORLD_H / 2,
      'land'
    );

    const cover = Math.max(
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

    this.controls =
      new GameControls(this);

    this.controls.create();

    this.base = new Base(
      this,
      this.player,
      this.camps
    );

    this.base.create();

    this.createEnemy(1);

    this.catastrophe =
      new Catastrophe(
        this,
        1
      );

    this.catastrophe
      .startStormTimer();

    if (
      this.scene.isActive(
        'BattleUI'
      )
    ) {
      this.scene.stop(
        'BattleUI'
      );
    }

    this.scene.launch(
      'BattleUI'
    );

    this.cameras.main.setBounds(
      0,
      0,
      WORLD_W,
      WORLD_H
    );

    this.handleResize(
      this.scale.gameSize
    );

    this.scale.on(
      'resize',
      this.handleResize,
      this
    );
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

      this.controls
        ?.onPlayerDeath();

      if (
        this.player?.currentTween
      ) {
        this.player
          .currentTween
          .stop();

        this.player.currentTween =
          null;
      }
    }

    if (
      !this.isGamePaused &&
      !this.isGameOver &&
      !playerDead
    ) {
      this.activeGameTime += delta;
    }

    this.controls?.update(
      time,
      delta
    );

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

      if (
        aliveEnemies.length > 0
      ) {
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

  private handleResize(
    gameSize:
      Phaser.Structs.Size
  ): void {
    const width =
      gameSize.width;

    const height =
      gameSize.height;

    const camera =
      this.cameras.main;

    camera.setSize(
      width,
      height
    );

    camera.setZoom(
      Math.min(
        width / WORLD_W,
        height / WORLD_H
      )
    );

    camera.centerOn(
      WORLD_W / 2,
      WORLD_H / 2
    );

    this.controls?.handleResize(
      gameSize
    );
  }

  collectGold(
    gold: any
  ): void {
    const value =
      gold.getData(
        'value'
      ) ?? 0;

    console.log(
      'Gold Collected:',
      value
    );

    this.gold += value;

    const battleUI =
      this.scene.get(
        'BattleUI'
      ) as any;

    battleUI?.addGold?.(
      value
    );

    gold.destroy();
  }

  collectCash(
    cash: any
  ): void {
    const value =
      cash.getData(
        'value'
      ) ?? 1;

    console.log(
      'Cash Collected:',
      value
    );

    const battleUI =
      this.scene.get(
        'BattleUI'
      ) as any;

    battleUI?.addCash?.(
      value
    );

    cash.destroy();
  }

  createEnemy(
    baseLevel: number
  ): void {
    this.enemies =
      this.enemies.filter(
        enemy =>
          !enemy.isDead
      );

    const existingAliveEnemy =
      this.enemies.find(
        enemy =>
          !enemy.isDead
      );

    if (existingAliveEnemy) {
      return;
    }

    const camp =
      this.camps[0];

    if (!camp) {
      return;
    }

    const spawnPosition =
      camp.getRandomPositionInRadius();

    spawnPosition.x =
      Phaser.Math.Clamp(
        spawnPosition.x,
        50,
        WORLD_W - 50
      );

    spawnPosition.y =
      Phaser.Math.Clamp(
        spawnPosition.y,
        WORLD_TOP_PADDING,
        WORLD_H - 50
      );

    const enemyCharacterCode = 2;

    const enemy =
      new Enemy(
        this,
        spawnPosition.x,
        spawnPosition.y,
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

    this.enemies.push(
      enemy
    );
  }

  selectEnemyCharacterCode():
    number {
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
      ]!;
    }

    return easyEnemies[
      Phaser.Math.Between(
        0,
        easyEnemies.length - 1
      )
    ]!;
  }

  private shutdown(): void {

    this.controls?.shutdown();

    this.scale.off(
      'resize',
      this.handleResize,
      this
    );

    this.enemies.forEach(
      enemy => {
        enemy.moveTween?.stop();

        enemy.attackEvent
          ?.destroy();

        enemy.fireTimerEvent
          ?.destroy();

        enemy.sprite
          ?.destroy();

        enemy.healthBar
          ?.destroy();

        enemy.detectionBar
          ?.destroy();

        enemy.customSquareContainer
          ?.destroy();

        enemy.strengthenedSquareContainer
          ?.destroy();
      }
    );

    this.enemies = [];
  }
}
