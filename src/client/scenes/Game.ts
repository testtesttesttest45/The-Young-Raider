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
  isMobileLayout = false;

  joystickBase:
    Phaser.GameObjects.Arc | null = null;

  joystickKnob:
    Phaser.GameObjects.Arc | null = null;

  joystickPointerId: number | null = null;

  joystickVector = {
    x: 0,
    y: 0
  };

  joystickRadius = 70;
  joystickDeadZone = 0.18;

  attackButtonContainer:
    Phaser.GameObjects.Container | null = null;

  attackButtonBackground:
    Phaser.GameObjects.Arc | null = null;

  attackButtonIcon:
    Phaser.GameObjects.Image | null = null;

  attackCooldownGraphics: Phaser.GameObjects.Graphics | null = null;

  hasHandledPlayerDeath = false;
  attackKey!: Phaser.Input.Keyboard.Key;
  slashKey!: Phaser.Input.Keyboard.Key;
  slashButtonContainer:
    Phaser.GameObjects.Container | null = null;

  slashButtonBackground:
    Phaser.GameObjects.Arc | null = null;

  slashButtonIcon:
    Phaser.GameObjects.Image | null = null;

  slashCooldownGraphics:
    Phaser.GameObjects.Graphics | null = null;
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
    this.isMobileLayout =
      document
        .getElementById('rotation-stage')
        ?.classList.contains(
          'mobile-rotated'
        ) ?? false;

    this.joystickPointerId = null;

    this.joystickVector = {
      x: 0,
      y: 0
    };

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
    this.setupMobileControls();

    this.game.events.on(
      'webview-resized',
      this.handleWebviewResize,
      this
    );
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
        if (this.isMobileLayout) {
          return;
        }
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

      this.slashKey =
        this.input.keyboard.addKey(
          Phaser.Input.Keyboard.KeyCodes.E
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

      this.releaseJoystick();
      this.updateMobileControlsVisibility();

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
    if (
      this.slashKey &&
      Phaser.Input.Keyboard.JustDown(
        this.slashKey
      )
    ) {
      if (
        this.allowInput &&
        !this.isGamePaused &&
        !this.isGameOver &&
        !playerDead
      ) {
        this.player?.slashOnce?.();
      }
    }
    if (
      this.isMobileLayout &&
      !this.isGamePaused &&
      !this.isGameOver &&
      !playerDead &&
      this.allowInput
    ) {
      this.player
        ?.moveWithJoystick?.(
          this.joystickVector.x,
          this.joystickVector.y,
          delta,
          WORLD_W,
          WORLD_H,
          WORLD_TOP_PADDING
        );
    }
    this.player?.update?.(
      time,
      delta
    );

    if (this.isMobileLayout) {
      this.updateMobileAttackButtonState();
      this.updateMobileSlashButtonState();
    }

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
    this.game.events.off(
      'webview-resized',
      this.handleWebviewResize,
      this
    );

    this.input.off(
      'pointerdown',
      this.handleJoystickDown,
      this
    );

    this.input.off(
      'pointermove',
      this.handleJoystickMove,
      this
    );

    this.input.off(
      'pointerup',
      this.handleJoystickUp,
      this
    );

    this.input.off(
      'pointerupoutside',
      this.handleJoystickUp,
      this
    );

    this.releaseJoystick();

    this.joystickBase?.destroy();
    this.joystickKnob?.destroy();

    this.joystickBase = null;
    this.joystickKnob = null;
    this.scale.off('resize', this.handleResize, this);

    this.attackButtonContainer
      ?.destroy(true);

    this.attackButtonContainer = null;
    this.attackButtonBackground = null;
    this.attackButtonIcon = null;

    this.slashButtonContainer
      ?.destroy(true);

    this.slashButtonContainer = null;
    this.slashButtonBackground = null;
    this.slashButtonIcon = null;
    this.slashCooldownGraphics = null;

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

  private handleWebviewResize(
    layout: {
      rotated: boolean;
      availableWidth: number;
      availableHeight: number;
      stageWidth: number;
      stageHeight: number;
    }
  ): void {
    this.isMobileLayout =
      layout.rotated;

    this.updateMobileControlsVisibility();
  }

  private setupMobileControls(): void {
    const joystickX = 115;
    const joystickY =
      this.scale.height - 115;

    this.joystickBase =
      this.add.circle(
        joystickX,
        joystickY,
        this.joystickRadius,
        0x101820,
        0.52
      );

    this.joystickBase
      .setStrokeStyle(
        4,
        0xffffff,
        0.65
      )
      .setScrollFactor(0)
      .setDepth(2000);

    this.joystickKnob =
      this.add.circle(
        joystickX,
        joystickY,
        31,
        0x50c8ff,
        0.82
      );

    this.joystickKnob
      .setStrokeStyle(
        3,
        0xffffff,
        0.9
      )
      .setScrollFactor(0)
      .setDepth(2001);

    this.updateMobileControlsVisibility();

    this.createMobileAttackButton();
    this.createMobileSlashButton();

    this.input.on(
      'pointerdown',
      this.handleJoystickDown,
      this
    );

    this.input.on(
      'pointermove',
      this.handleJoystickMove,
      this
    );

    this.input.on(
      'pointerup',
      this.handleJoystickUp,
      this
    );

    this.input.on(
      'pointerupoutside',
      this.handleJoystickUp,
      this
    );
  }

  private updateMobileControlsVisibility(): void {
    const visible =
      this.isMobileLayout &&
      !this.isGameOver &&
      !this.player?.isDead;

    this.joystickBase?.setVisible(
      visible
    );

    this.joystickKnob?.setVisible(
      visible
    );

    this.attackButtonContainer
      ?.setVisible(
        visible
      );

    this.slashButtonContainer
      ?.setVisible(
        visible
      );
    if (!visible) {
      this.releaseJoystick();
      this.resetMobileAttackButtonAppearance();

      this.slashButtonContainer
        ?.setScale(1);
    }
  }

  private handleJoystickDown(
    pointer:
      Phaser.Input.Pointer
  ): void {
    if (
      !this.isMobileLayout ||
      this.isGamePaused ||
      this.isGameOver ||
      !this.allowInput ||
      this.player?.isDead ||
      !this.joystickBase
    ) {
      return;
    }

    const distance =
      Phaser.Math.Distance.Between(
        pointer.x,
        pointer.y,
        this.joystickBase.x,
        this.joystickBase.y
      );

    if (
      distance >
      this.joystickRadius * 1.35
    ) {
      return;
    }

    this.joystickPointerId =
      pointer.id;

    this.updateJoystickFromPointer(
      pointer
    );
  }

  private handleJoystickMove(
    pointer:
      Phaser.Input.Pointer
  ): void {
    if (
      !this.isMobileLayout ||
      this.joystickPointerId !==
      pointer.id
    ) {
      return;
    }

    this.updateJoystickFromPointer(
      pointer
    );
  }

  private handleJoystickUp(
    pointer:
      Phaser.Input.Pointer
  ): void {
    if (
      this.joystickPointerId !==
      pointer.id
    ) {
      return;
    }

    this.releaseJoystick();
  }

  private updateJoystickFromPointer(
    pointer:
      Phaser.Input.Pointer
  ): void {
    if (
      !this.joystickBase ||
      !this.joystickKnob
    ) {
      return;
    }

    const differenceX =
      pointer.x -
      this.joystickBase.x;

    const differenceY =
      pointer.y -
      this.joystickBase.y;

    const distance =
      Math.sqrt(
        differenceX * differenceX +
        differenceY * differenceY
      );

    if (distance <= 0) {
      this.joystickVector.x = 0;
      this.joystickVector.y = 0;

      return;
    }

    const normalizedX =
      differenceX / distance;

    const normalizedY =
      differenceY / distance;

    const clampedDistance =
      Math.min(
        distance,
        this.joystickRadius
      );

    this.joystickKnob.setPosition(
      this.joystickBase.x +
      normalizedX *
      clampedDistance,

      this.joystickBase.y +
      normalizedY *
      clampedDistance
    );

    const strength =
      Phaser.Math.Clamp(
        distance /
        this.joystickRadius,
        0,
        1
      );

    if (
      strength <
      this.joystickDeadZone
    ) {
      this.joystickVector.x = 0;
      this.joystickVector.y = 0;

      return;
    }

    this.joystickVector.x =
      normalizedX * strength;

    this.joystickVector.y =
      normalizedY * strength;
  }

  private releaseJoystick(): void {
    this.joystickPointerId = null;

    this.joystickVector.x = 0;
    this.joystickVector.y = 0;

    if (
      this.joystickBase &&
      this.joystickKnob
    ) {
      this.joystickKnob.setPosition(
        this.joystickBase.x,
        this.joystickBase.y
      );
    }

    this.player
      ?.stopJoystickMovement?.();
  }

  private createMobileAttackButton(): void {
    const buttonX =
      this.scale.width - 115;

    const buttonY =
      this.scale.height - 115;

    const buttonRadius = 58;

    this.attackButtonContainer =
      this.add.container(
        buttonX,
        buttonY
      );

    this.attackButtonContainer
      .setScrollFactor(0)
      .setDepth(2001);

    this.attackButtonBackground =
      this.add.circle(
        0,
        0,
        buttonRadius,
        0xf2f2f2,
        0.92
      );

    this.attackButtonBackground
      .setStrokeStyle(
        3,
        0xffffff,
        0.9
      )
      .setInteractive(
        new Phaser.Geom.Circle(
          buttonRadius,
          buttonRadius,
          buttonRadius
        ),
        Phaser.Geom.Circle.Contains
      );

    this.attackButtonIcon =
      this.add.image(
        0,
        0,
        'sword1'
      );

    this.attackButtonIcon
      .setScale(0.58)
      .disableInteractive();


    this.attackCooldownGraphics =
      this.add.graphics();

    this.attackButtonContainer.add([
      this.attackButtonBackground,
      this.attackButtonIcon,
      this.attackCooldownGraphics
    ]);

    this.attackButtonBackground.on(
      'pointerdown',
      (
        _pointer:
          Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event:
          Phaser.Types.Input.EventData
      ) => {
        event.stopPropagation();

        if (
          !this.isMobileLayout ||
          !this.allowInput ||
          this.isGamePaused ||
          this.isGameOver ||
          this.player?.isDead ||
          this.player?.isActionLocked
        ) {
          return;
        }

        this.attackButtonContainer
          ?.setScale(0.92);

        this.player?.attackOnce?.();

        this.updateMobileAttackButtonState();
      }
    );

    this.attackButtonBackground.on(
      'pointerup',
      (
        _pointer:
          Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event:
          Phaser.Types.Input.EventData
      ) => {
        event.stopPropagation();

        this.attackButtonContainer
          ?.setScale(1);
      }
    );

    this.attackButtonBackground.on(
      'pointerout',
      () => {
        this.attackButtonContainer
          ?.setScale(1);
      }
    );

    this.attackButtonBackground.on(
      'pointerupoutside',
      () => {
        this.attackButtonContainer
          ?.setScale(1);
      }
    );

    this.updateMobileControlsVisibility();
    this.updateMobileAttackButtonState();
  }

  private createMobileSlashButton(): void {
    const buttonX =
      this.scale.width - 255;

    const buttonY =
      this.scale.height - 135;

    const buttonRadius = 50;

    this.slashButtonContainer =
      this.add.container(
        buttonX,
        buttonY
      );

    this.slashButtonContainer
      .setScrollFactor(0)
      .setDepth(2001);

    this.slashButtonBackground =
      this.add.circle(
        0,
        0,
        buttonRadius,
        0xf2f2f2,
        0.92
      );

    this.slashButtonBackground
      .setStrokeStyle(
        3,
        0xffffff,
        0.9
      )
      .setInteractive(
        new Phaser.Geom.Circle(
          buttonRadius,
          buttonRadius,
          buttonRadius
        ),
        Phaser.Geom.Circle.Contains
      );

    this.slashButtonIcon =
      this.add.image(
        0,
        0,
        'sword1'
      );

    this.slashButtonIcon
      .setScale(0.52)
      .setTint(0xc38cff)
      .setRotation(-0.55)
      .disableInteractive();

    this.slashCooldownGraphics =
      this.add.graphics();

    this.slashButtonContainer.add([
      this.slashButtonBackground,
      this.slashButtonIcon,
      this.slashCooldownGraphics
    ]);

    this.slashButtonBackground.on(
      'pointerdown',
      (
        _pointer:
          Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event:
          Phaser.Types.Input.EventData
      ) => {
        event.stopPropagation();

        if (
          !this.isMobileLayout ||
          !this.allowInput ||
          this.isGamePaused ||
          this.isGameOver ||
          this.player?.isDead ||
          !this.player?.isSlashReady?.()
        ) {
          return;
        }

        this.slashButtonContainer
          ?.setScale(0.92);

        this.player?.slashOnce?.();

        this.updateMobileSlashButtonState();
      }
    );

    this.slashButtonBackground.on(
      'pointerup',
      (
        _pointer:
          Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event:
          Phaser.Types.Input.EventData
      ) => {
        event.stopPropagation();

        this.slashButtonContainer
          ?.setScale(1);
      }
    );

    this.slashButtonBackground.on(
      'pointerout',
      () => {
        this.slashButtonContainer
          ?.setScale(1);
      }
    );

    this.slashButtonBackground.on(
      'pointerupoutside',
      () => {
        this.slashButtonContainer
          ?.setScale(1);
      }
    );

    this.updateMobileControlsVisibility();
    this.updateMobileSlashButtonState();
  }

  private updateMobileSlashButtonState(): void {
    if (
      !this.slashButtonContainer ||
      !this.slashButtonBackground ||
      !this.slashButtonIcon ||
      !this.slashCooldownGraphics
    ) {
      return;
    }

    const buttonRadius = 50;
    const ringRadius =
      buttonRadius + 7;

    const isUnavailable =
      !this.allowInput ||
      this.isGamePaused ||
      this.isGameOver ||
      this.player?.isDead;

    const cooldownRemaining =
      this.player
        ?.getSlashCooldownRemaining?.() ??
      0;

    const isCoolingDown =
      cooldownRemaining > 0;

    this.slashCooldownGraphics.clear();

    if (isUnavailable) {
      this.slashButtonBackground
        .setFillStyle(
          0x333333,
          0.9
        );

      this.slashButtonIcon
        .setAlpha(0.25);

      this.slashCooldownGraphics
        .lineStyle(
          6,
          0x555555,
          0.85
        );

      this.slashCooldownGraphics
        .strokeCircle(
          0,
          0,
          ringRadius
        );

      return;
    }

    if (isCoolingDown) {
      this.slashButtonBackground
        .setFillStyle(
          0x24142f,
          0.96
        );

      this.slashButtonIcon
        .setAlpha(0.42);

      this.slashCooldownGraphics
        .lineStyle(
          7,
          0x160b1e,
          0.95
        );

      this.slashCooldownGraphics
        .strokeCircle(
          0,
          0,
          ringRadius
        );

      const cooldownProgress =
        this.player
          ?.getSlashCooldownProgress?.() ??
        0;

      const startAngle =
        -Math.PI / 2;

      const endAngle =
        startAngle +
        cooldownProgress *
        Math.PI *
        2;

      this.slashCooldownGraphics
        .lineStyle(
          7,
          0xb85cff,
          1
        );

      this.slashCooldownGraphics
        .beginPath();

      this.slashCooldownGraphics.arc(
        0,
        0,
        ringRadius,
        startAngle,
        endAngle,
        false
      );

      this.slashCooldownGraphics
        .strokePath();

      return;
    }

    // slash ready
    this.slashButtonBackground
      .setFillStyle(
        0xf2f2f2,
        0.94
      );

    this.slashButtonIcon
      .setAlpha(1);

    this.slashCooldownGraphics
      .lineStyle(
        7,
        0xffffff,
        1
      );

    this.slashCooldownGraphics
      .strokeCircle(
        0,
        0,
        ringRadius
      );
  }


  private updateMobileAttackButtonState(): void {
    if (
      !this.attackButtonContainer ||
      !this.attackButtonBackground ||
      !this.attackButtonIcon ||
      !this.attackCooldownGraphics
    ) {
      return;
    }

    const buttonRadius = 58;
    const ringRadius = buttonRadius + 7;

    const isUnavailable =
      !this.allowInput ||
      this.isGamePaused ||
      this.isGameOver ||
      this.player?.isDead;

    const isCoolingDown =
      this.player?.isActionLocked === true;

    this.attackCooldownGraphics.clear();

    if (isUnavailable) {
      this.attackButtonBackground.setFillStyle(
        0x3d3d3d,
        0.88
      );

      this.attackButtonIcon.setAlpha(0.28);

      this.attackCooldownGraphics.lineStyle(
        6,
        0x555555,
        0.8
      );

      this.attackCooldownGraphics.strokeCircle(
        0,
        0,
        ringRadius
      );

      return;
    }

    if (isCoolingDown) {
      this.attackButtonBackground.setFillStyle(
        0x4f1717,
        0.95
      );

      this.attackButtonIcon.setAlpha(0.48);

      this.attackCooldownGraphics.lineStyle(
        7,
        0x2b0b0b,
        0.95
      );

      this.attackCooldownGraphics.strokeCircle(
        0,
        0,
        ringRadius
      );

      const animationProgress =
        Phaser.Math.Clamp(
          this.player?.robotSprite
            ?.anims
            ?.getProgress?.() ?? 0,
          0,
          1
        );

      const startAngle =
        -Math.PI / 2;

      const endAngle =
        startAngle +
        animationProgress *
        Math.PI *
        2;

      this.attackCooldownGraphics.lineStyle(
        7,
        0xff3b30,
        1
      );

      this.attackCooldownGraphics.beginPath();

      this.attackCooldownGraphics.arc(
        0,
        0,
        ringRadius,
        startAngle,
        endAngle,
        false
      );

      this.attackCooldownGraphics.strokePath();

      return;
    }

    this.attackButtonBackground.setFillStyle(
      0xf2f2f2,
      0.94
    );

    this.attackButtonIcon.setAlpha(1);

    this.attackCooldownGraphics.lineStyle(
      7,
      0xffffff,
      1
    );

    this.attackCooldownGraphics.strokeCircle(
      0,
      0,
      ringRadius
    );
  }


  private resetMobileAttackButtonAppearance(): void {
    this.attackButtonContainer
      ?.setScale(1);

    this.updateMobileAttackButtonState();
  }


}