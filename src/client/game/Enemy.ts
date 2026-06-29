import chroma from "chroma-js";
import * as Phaser from "phaser";
import characterMap, { EnemyAnimationConfig } from "./CharacterMap";
import audioManager from "../scenes/AudioManager";

const WORLD_W = 1280;
const WORLD_H = 720;
const WORLD_TOP_PADDING = 130;

class Enemy {
  scene: any;

  x: any;
  y: any;

  characterCode: any;

  sprite: any;

  currentAnimationIndex: any;

  level: any;
  strengthenLevel: any;

  health: any;
  maxHealth: any;

  isDead: any;

  healthBar: any;

  speed: any;
  attackSpeed: any;
  attackRange: any;

  isMoving: any;
  moveTween: any;

  lastDirection: string;

  detectionRadius: any;
  timeOutOfDetection: any;
  detectionBar: any;

  isAlert: any;
  alertTime: any;
  timeInAlert: any;

  hasPlayerBeenDetected: any;
  lastActionTime: any;

  isAttacking: any;
  attackEvent: any;

  damage: any;

  attackRangeRect: any;
  attackRangeArc: any;

  projectile: any;

  originalCamp: any;

  returningToCamp: any;
  inCamp: any;

  lastHealTime: any;

  isEnraged: any;
  enrageDuration: any;
  enrageStartTime: any;

  player: any;

  customSquare: any;
  customSquareText: any;

  strengthenedSquare: any;
  strengthenedSquareText: any;

  strengthenedSquareContainer: any;
  customSquareContainer: any;

  fireTimerEvent: any;

  base: any;

  idleAnimations: any[];

  timerStarted: any;

  enemyStrengthenInterval: any;
  strengthenTimer: any;

  attackCount: any;

  patrolling: any;
  isChasingPlayer: boolean;
  patrolBounds: any;
  nextPatrolTime: any;
  patrolInterval: any;

  destination: any;

  isWinterFrosted: any;

  goldValue: any;

  isTreasureHunted: any;

  attacker: any;

  immuneToStorm: any;

  fireWidth: any;
  fireHeight: any;
  fireArray: any;
  firePixelSize: any;
  fireGradient: any;
  fireGraphics: any;
  animationConfig: EnemyAnimationConfig;

  nextIdleTurnTime: number;
  idleTurnInterval: number;
  private tutorialEnrageEffectActive = false;
  private tutorialPursuitBarActive = false;

  isKing: boolean;
  strengtheningEnabled: boolean;

  private nextAIUpdateTime = 0;
  private readonly aiUpdateInterval = 100;

  private lastSpriteX = Number.NaN;
  private lastSpriteY = Number.NaN;

  private lastDetectionPercentage = -1;
  private lastDetectionX = Number.NaN;
  private lastDetectionY = Number.NaN;

  private healthBarDirty = true;
  private lastAIUpdateTime = 0;
  private fireTween: Phaser.Tweens.Tween | null = null;
  constructor(
    scene: any,
    x: number,
    y: number,
    characterCode: number = 2,
    originalCamp: any,
    player: any,
    level: number = 1,
    base: any,
    isWinterFrostActive: boolean = false,
    isTreasureHunterActive: boolean = false,
    isKing: boolean = false,
    strengtheningEnabled: boolean = true,
  ) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.characterCode = characterCode;
    this.sprite = null;
    this.currentAnimationIndex = 0;
    const character = characterMap[this.characterCode];
    if (!character) {
      throw new Error(`Character ${this.characterCode} does not exist.`);
    }

    if (character.type !== "enemy") {
      throw new Error(`Character ${this.characterCode} is not an enemy.`);
    }

    if (!character.enemyAnimations) {
      throw new Error(
        `Character ${this.characterCode} has no enemy animation configuration.`,
      );
    }

    this.animationConfig = character.enemyAnimations;

    this.level = Math.max(1, Math.floor(level));

    this.strengthenLevel = 1;

    const levelMultiplier = isKing
      ? Math.pow(1.05, this.level - 1)
      : 1 + (this.level - 1) * 0.3;
    this.health = Math.round(character.health * levelMultiplier * 0.75); // player character and enemy character same, the enemy should be weaker
    this.maxHealth = this.health;
    this.isDead = false;
    this.healthBar = null;
    this.speed = Math.ceil(character.speed * 0.75);
    // this.attackSpeed = character.attackSpeed;
    this.attackSpeed = Math.round(character.attackSpeed * 0.6 * 100) / 100; // 2.51 * 0.6 = 1.51
    this.attackRange = character.range;
    this.isMoving = false;
    this.moveTween = null;

    this.lastDirection = this.getRandomEnemyDirection();

    this.idleTurnInterval = Phaser.Math.Between(2500, 5000);

    this.nextIdleTurnTime = this.scene.time.now + this.idleTurnInterval;

    // this.detectionRadius = 200;
    this.detectionRadius = this.attackRange * 1.5;
    this.timeOutOfDetection = 0;
    this.detectionBar = null;
    this.isAlert = false;
    this.alertTime = 2000;
    this.timeInAlert = 0;
    this.hasPlayerBeenDetected = false;
    this.lastActionTime = 0;
    this.isAttacking = false;
    this.attackEvent = null;
    this.damage = Math.ceil(character.damage * levelMultiplier * 0.3);
    this.attackRangeRect = null;
    this.attackRangeArc = null;
    this.projectile = character.projectile;
    this.originalCamp = originalCamp;
    this.returningToCamp = false;
    this.inCamp = true;
    this.lastHealTime = 0;
    this.isEnraged = false;
    this.enrageDuration = 5000;
    this.enrageStartTime = 0;
    this.player = player;
    this.customSquare = null;
    this.customSquareText = null;
    this.strengthenedSquare = null;
    this.strengthenedSquareText = null;
    this.fireTimerEvent = null;
    this.base = base;
    this.idleAnimations = [
      `character${this.characterCode}Idlenorth`,
      `character${this.characterCode}Idlenortheast`,
      `character${this.characterCode}Idleeast`,
      `character${this.characterCode}Idlesoutheast`,
      `character${this.characterCode}Idlesouth`,
      `character${this.characterCode}Idlesouthwest`,
      `character${this.characterCode}Idlewest`,
      `character${this.characterCode}Idlenorthwest`,
    ];
    this.timerStarted = false;
    this.enemyStrengthenInterval = 15000;
    this.attackCount = character.attackCount;
    this.patrolling = false;
    this.isChasingPlayer = false;
    this.patrolBounds = {
      minX: 50,
      maxX: WORLD_W - 50,
      minY: WORLD_TOP_PADDING,
      maxY: WORLD_H - 50,
    };

    this.nextPatrolTime = 0;
    this.patrolInterval = 2000;
    this.destination = {
      x: this.x,
      y: this.y,
    };
    this.isWinterFrosted = isWinterFrostActive;
    this.goldValue = 100;
    this.isTreasureHunted = isTreasureHunterActive;
    this.isKing = isKing;
    this.strengtheningEnabled = strengtheningEnabled;
    this.nextAIUpdateTime =
      this.scene.time.now + Phaser.Math.Between(0, this.aiUpdateInterval);
  }

  startTimer(): void {
    if (!this.strengtheningEnabled) {
      this.timerStarted = false;
      return;
    }

    if (!this.timerStarted) {
      this.strengthenTimer =
        this.scene.activeGameTime + this.enemyStrengthenInterval;

      this.timerStarted = true;
    }
  }

  getTimeUntilNextStrengthen(): number {
    if (!this.strengtheningEnabled || !this.timerStarted) {
      return 0;
    }

    return Math.max(0, this.strengthenTimer - this.scene.activeGameTime);
  }

  strengthenEnemies() {
    const damageIncrease = Math.ceil(this.damage * 0.27);
    this.strengthenLevel++;
    if (this.strengthenedSquareText && this.strengthenedSquareText.setTexture) {
      this.strengthenedSquareText.setTexture(
        this.getNumberTextureKey(
          "enemy-strength-level-number",
          this.strengthenLevel,
        ),
      );
    }
    this.damage += damageIncrease;

    // Only increase max health if the enemy is not patrolling
    if (!this.patrolling) {
      const healthIncrease = Math.round(this.maxHealth * 0.25);
      this.maxHealth += healthIncrease;
      this.createStrengthenedText(damageIncrease, healthIncrease);
    } else {
      this.createStrengthenedText(damageIncrease, 0); // Pass 0 for health increase as it remains unchanged
    }

    this.strengthenTimer =
      this.scene.activeGameTime + this.enemyStrengthenInterval;
  }

  createStrengthenedText(damageIncrease: any, healthIncrease: any) {
    let textMessage = `DMG +${Math.round(damageIncrease)}`;
    // Append health increase text only if there is any health increase
    if (healthIncrease > 0) {
      textMessage += `\nMax HP +${Math.round(healthIncrease)}`;
    }

    this.healthBarDirty = true;

    const strengthenedText = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 100,
      textMessage,
      {
        font: "24px Orbitron",
        fill: "#0d00ff",
      },
    );
    strengthenedText.setOrigin(0.5, 0.5);
    strengthenedText.setDepth(1);
    this.scene.tweens.add({
      targets: strengthenedText,
      y: strengthenedText.y - 30,
      alpha: 0,
      duration: 2500,
      ease: "Power2",
      onComplete: () => {
        strengthenedText.destroy();
      },
    });
  }

  private createDirectionalAnimations(
    animationType: "Idle" | "Moving" | "Attack",
    definition: {
      spritesheetKey: string;
      framesPerDirection: number;
      frameRate: number;
      repeat: number;
    },
  ): void {
    this.enemyDirections.forEach((direction, directionIndex) => {
      const animationKey = `character${this.characterCode}${animationType}${direction}`;

      if (this.scene.anims.exists(animationKey)) {
        return;
      }

      const startFrame = directionIndex * definition.framesPerDirection;

      const endFrame = startFrame + definition.framesPerDirection - 1;

      this.scene.anims.create({
        key: animationKey,

        frames: this.scene.anims.generateFrameNumbers(
          definition.spritesheetKey,
          {
            start: startFrame,
            end: endFrame,
          },
        ),

        frameRate:
          animationType === "Attack"
            ? definition.frameRate * this.attackSpeed
            : definition.frameRate,

        repeat: definition.repeat,
      });
    });
  }

  private createEnemyAnimations(): void {
    const config = this.animationConfig;
    this.createDirectionalAnimations("Idle", config.idle);
    this.createDirectionalAnimations("Moving", config.move);
    this.createDirectionalAnimations("Attack", config.attack);
    const deathAnimationKey = `character${this.characterCode}Death`;
    if (!this.scene.anims.exists(deathAnimationKey)) {
      this.scene.anims.create({
        key: deathAnimationKey,
        frames: this.scene.anims.generateFrameNumbers(
          config.death.spritesheetKey,
          { start: 0, end: config.death.frameCount - 1 },
        ),
        frameRate: config.death.frameRate,
        repeat: config.death.repeat,
      });
    }
  }
  private getAnimationKey(
    animationType: "Idle" | "Moving" | "Attack",
    direction: string,
  ): string {
    return `character${this.characterCode}${animationType}${direction}`;
  }
  private playEnemyAnimation(
    animationType: "Idle" | "Moving" | "Attack",
    direction: string,
    ignoreIfPlaying = true,
  ): void {
    const animationKey = this.getAnimationKey(animationType, direction);
    if (
      this.sprite.anims.currentAnim?.key === animationKey &&
      ignoreIfPlaying
    ) {
      return;
    }
    this.sprite.play(animationKey, ignoreIfPlaying);
  }

  create(): void {
    this.createEnemyAnimations();

    this.sprite = this.scene.add.sprite(
      this.x,
      this.y,
      this.animationConfig.idle.spritesheetKey,
      0,
    );

    this.sprite
      .setOrigin(0.5, 0.5)
      .setScale(this.animationConfig.scale)
      .setDepth(1);

    this.playEnemyAnimation("Idle", this.lastDirection, true);

    // The spritesheet frame is always 128×128. display dimension helps the interaction follow the configured enemy scale.
    const hitAreaWidth = this.sprite.width;

    const hitAreaHeight = this.sprite.height;

    const hitArea = new Phaser.Geom.Rectangle(
      0,
      0,
      hitAreaWidth,
      hitAreaHeight,
    );

    this.sprite.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    this.createHealthBar();

    this.detectionBar = this.scene.add.graphics();

    this.updateDetectionBar(1);
  }

  private updateIdleDirection(time: number): void {
    // camp enemies will change idle directions
    if (
      this.patrolling ||
      this.isDead ||
      this.isMoving ||
      this.isAttacking ||
      this.returningToCamp ||
      this.hasPlayerBeenDetected ||
      !this.inCamp ||
      !this.sprite?.active
    ) {
      return;
    }

    if (time < this.nextIdleTurnTime) {
      return;
    }

    const availableDirections = this.enemyDirections.filter(
      (direction) => direction !== this.lastDirection,
    );

    const newDirection = this.getRandomEnemyDirection(this.lastDirection);
    this.lastDirection = newDirection;
    this.playEnemyAnimation("Idle", newDirection, false);

    // Randomise the next turn so enemies do not all rotate similarly
    this.idleTurnInterval = Phaser.Math.Between(2500, 5000);

    this.nextIdleTurnTime = time + this.idleTurnInterval;
  }

  takeDamage(damage: any, source: any) {
    // console.log('Enemy taking damage');
    if (this.isDead) return;

    // Enemy is immune to all damage when returning to camp
    if (this.returningToCamp) return;

    // Enemy is immune to catastrophe damage if it has reached camp but not to player damage
    if (
      (this.inCamp && source === "catastrophe") ||
      (this.patrolling &&
        source === "catastrophe" &&
        !this.hasPlayerBeenDetected)
    )
      return;
    this.health -= damage;
    this.health = Math.max(this.health, 0);
    this.healthBarDirty = true;

    // Enemy detects player if damage source is the player
    if (source !== "catastrophe") {
      this.hasPlayerBeenDetected = true;

      this.stopPatrolMovementForCombat();

      this.isAlert = true;
      this.timeInAlert = 0;
      this.timeOutOfDetection = 0;
    }

    const color = source === "catastrophe" ? "#ff0" : "#ff0000"; // Yellow for catastrophe, red for player
    this.createDamageText(damage, color);

    // Enemy dies if health drops to 0
    if (this.health <= 0 && !this.isDead) {
      this.die();
    }

    this.updateHealthBar();

    if (this.hasPlayerBeenDetected) {
      this.timeInAlert = 0;
      this.timeOutOfDetection = 0;
      this.isAlert = true; // Ensure the enemy is in an alert state
      this.updateDetectionBar(1); // Full detection bar
    }
  }

  moveToPlayer(_playerX: number, _playerY: number): void {
    if (
      this.isDead ||
      this.isMoving ||
      this.isAttacking ||
      this.returningToCamp ||
      !this.hasPlayerBeenDetected ||
      !this.attacker?.getPosition ||
      this.attacker.isDead
    ) {
      return;
    }

    this.isMoving = true;
    this.isChasingPlayer = true;
    this.isAttacking = false;
    this.inCamp = false;

    const refreshInterval = 300;

    const stopChasing = (): void => {
      if (this.moveTween) {
        this.moveTween.stop();
        this.moveTween = null;
      }

      this.isMoving = false;
      this.isChasingPlayer = false;
    };

    const moveTowardsCurrentPlayerPosition = (): void => {
      if (
        this.isDead ||
        this.isAttacking ||
        this.returningToCamp ||
        !this.hasPlayerBeenDetected ||
        !this.attacker?.getPosition ||
        this.attacker.isDead
      ) {
        stopChasing();
        return;
      }

      const playerPosition = this.attacker.getPosition();

      const distance = Phaser.Math.Distance.Between(
        this.sprite.x,
        this.sprite.y,
        playerPosition.x,
        playerPosition.y,
      );

      if (distance <= this.attackRange) {
        stopChasing();
        return;
      }

      const direction = this.determineDirectionToPoint(
        playerPosition.x,
        playerPosition.y,
      );

      this.lastDirection = direction;

      this.playEnemyAnimation("Moving", direction, true);

      const movementDuration = Math.max(
        16,
        Math.min(refreshInterval, (distance / Math.max(1, this.speed)) * 1000),
      );

      const movementDistance = this.speed * (movementDuration / 1000);

      const ratio = Math.min(1, movementDistance / Math.max(1, distance));

      const targetX = Phaser.Math.Linear(
        this.sprite.x,
        playerPosition.x,
        ratio,
      );

      const targetY = Phaser.Math.Linear(
        this.sprite.y,
        playerPosition.y,
        ratio,
      );

      if (this.moveTween) {
        this.moveTween.stop();
        this.moveTween = null;
      }

      const chaseTween = this.scene.tweens.add({
        targets: this.sprite,

        x: targetX,
        y: targetY,

        duration: movementDuration,

        ease: "Linear",

        onComplete: () => {
          // Ignore an old callback after another tween replaced it.
          if (this.moveTween !== chaseTween) {
            return;
          }

          this.moveTween = null;

          if (
            this.isDead ||
            this.isAttacking ||
            this.returningToCamp ||
            !this.hasPlayerBeenDetected ||
            !this.attacker?.getPosition ||
            this.attacker.isDead
          ) {
            this.isMoving = false;
            this.isChasingPlayer = false;
            return;
          }

          moveTowardsCurrentPlayerPosition();
        },
      });

      this.moveTween = chaseTween;
    };

    moveTowardsCurrentPlayerPosition();
  }

  private stopPatrolMovementForCombat(): void {
    if (!this.patrolling) {
      return;
    }

    // Do not stop a tween that already belongs to the chase.
    if (this.isChasingPlayer) {
      return;
    }

    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = null;
    }

    this.isMoving = false;
  }

  updateEnemy(
    playerX: number,
    playerY: number,
    player: any,
    delta: number,
  ): void {
    this.attacker = player;

    if (
      this.isDead ||
      !this.sprite?.active ||
      !this.attacker ||
      this.attacker.isDead
    ) {
      return;
    }

    const differenceX = playerX - this.sprite.x;
    const differenceY = playerY - this.sprite.y;

    const distanceSquared =
      differenceX * differenceX + differenceY * differenceY;

    const attackRangeSquared = this.attackRange * this.attackRange;

    const detectionRadiusSquared = this.detectionRadius * this.detectionRadius;

    const isInsideAttackRange = distanceSquared <= attackRangeSquared;

    const isInsideDetectionRadius = distanceSquared < detectionRadiusSquared;

    if (this.isEnraged) {
      this.hasPlayerBeenDetected = true;
      this.isAlert = true;

      this.updateDetectionBar(1);

      if (isInsideAttackRange && !this.isAttacking) {
        this.isMoving = false;
        this.isChasingPlayer = false;

        if (this.moveTween) {
          this.moveTween.stop();
          this.moveTween = null;
        }

        this.attackPlayer(player);
      } else if (!isInsideAttackRange && !this.isMoving && !this.isAttacking) {
        this.moveToPlayer(playerX, playerY);
      }

      this.timeInAlert = this.alertTime;
      this.timeOutOfDetection = 0;

      if (
        this.scene.activeGameTime - this.enrageStartTime >
        this.enrageDuration
      ) {
        this.disenrage();
      }

      return;
    }

    if (this.returningToCamp) {
      return;
    }

    if (
      isInsideDetectionRadius ||
      (isInsideAttackRange && this.hasPlayerBeenDetected)
    ) {
      if (!this.hasPlayerBeenDetected && isInsideDetectionRadius) {
        this.hasPlayerBeenDetected = true;

        this.stopPatrolMovementForCombat();
      }

      this.isAlert = true;

      this.stopPatrolMovementForCombat();

      this.timeInAlert = 0;
      this.timeOutOfDetection = 0;

      this.updateDetectionBar(1);

      if (isInsideAttackRange && !this.isAttacking) {
        this.isMoving = false;
        this.isChasingPlayer = false;

        if (this.moveTween) {
          this.moveTween.stop();
          this.moveTween = null;
        }

        this.attackPlayer(player);
      } else if (!isInsideAttackRange && !this.isMoving && !this.isAttacking) {
        this.moveToPlayer(playerX, playerY);
      }

      return;
    }

    if (!this.hasPlayerBeenDetected) {
      return;
    }

    if (this.timeInAlert < this.alertTime) {
      this.timeInAlert += Math.round(delta);
      this.isAlert = true;

      this.updateDetectionBar(1);

      if (isInsideAttackRange && !this.isAttacking) {
        this.isMoving = false;
        this.isChasingPlayer = false;

        if (this.moveTween) {
          this.moveTween.stop();
          this.moveTween = null;
        }

        this.attackPlayer(player);
      } else if (!isInsideAttackRange && !this.isMoving && !this.isAttacking) {
        this.moveToPlayer(playerX, playerY);
      }

      return;
    }

    this.isAlert = false;

    this.timeOutOfDetection += Math.round(delta);

    const detectionPercentage = Phaser.Math.Clamp(
      1 - this.timeOutOfDetection / 3000,
      0,
      1,
    );

    this.updateDetectionBar(detectionPercentage);

    if (this.timeOutOfDetection < 3000) {
      if (isInsideAttackRange && !this.isAttacking) {
        this.isMoving = false;
        this.isChasingPlayer = false;

        if (this.moveTween) {
          this.moveTween.stop();
          this.moveTween = null;
        }

        this.attackPlayer(player);
      } else if (!isInsideAttackRange && !this.isMoving && !this.isAttacking) {
        this.moveToPlayer(playerX, playerY);
      }

      return;
    }

    this.hasPlayerBeenDetected = false;
    this.isAlert = false;

    this.timeInAlert = 0;
    this.timeOutOfDetection = 0;

    this.detectionBar?.clear();

    this.lastDetectionPercentage = -1;

    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = null;
    }

    this.isMoving = false;
    this.isAttacking = false;
    this.isChasingPlayer = false;

    if (this.patrolling) {
      this.returningToCamp = false;

      this.nextPatrolTime = this.scene.time.now + Phaser.Math.Between(300, 900);

      this.playEnemyAnimation("Idle", this.lastDirection || "south", true);
    } else {
      this.returnToCamp();
    }
  }

  attackPlayer(player: any): void {
    if (player.isDead) {
      this.stopAttackingPlayer();
      return;
    }

    this.isAttacking = true;
    this.attacker = player;

    const playerPosition = player.getPosition();

    const direction = this.determineDirectionToPoint(
      playerPosition.x,
      playerPosition.y,
    );

    this.lastDirection = direction;

    const attackAnimationKey = this.getAnimationKey("Attack", direction);

    this.playEnemyAnimation("Attack", direction, false);

    const angleToPlayer = Phaser.Math.Angle.Between(
      this.sprite.x,
      this.sprite.y,
      playerPosition.x,
      playerPosition.y,
    );

    const hasProjectile = this.projectile !== "";

    if (hasProjectile) {
      this.createAttackRangeRectangle(angleToPlayer);
    } else {
      this.createAttackRangeArc(angleToPlayer);
    }

    this.sprite.off("animationupdate");

    this.sprite.off("animationcomplete");

    const attackConfig = this.animationConfig.attack;

    const totalAttackFrames = attackConfig.framesPerDirection;

    const projectileReleaseFrame =
      attackConfig.projectileReleaseFrame ??
      Math.ceil(totalAttackFrames * 0.52);

    const damageFrames: number[] = attackConfig.damageFrames
      ? [...attackConfig.damageFrames]
      : [];

    if (damageFrames.length === 0 && !hasProjectile) {
      if (this.attackCount > 1) {
        for (
          let attackIndex = 1;
          attackIndex <= this.attackCount;
          attackIndex++
        ) {
          damageFrames.push(
            Math.ceil(
              (totalAttackFrames / (this.attackCount + 1)) * attackIndex,
            ),
          );
        }
      } else {
        damageFrames.push(Math.ceil(totalAttackFrames * 0.6));
      }
    }

    let hasReleasedProjectile = false;

    const appliedDamageFrames = new Set<number>();

    this.sprite.on(
      "animationupdate",
      (
        animation: Phaser.Animations.Animation,
        frame: Phaser.Animations.AnimationFrame,
      ) => {
        if (animation.key !== attackAnimationKey) {
          return;
        }

        const animationFrameIndex = frame.index;

        if (
          hasProjectile &&
          !hasReleasedProjectile &&
          animationFrameIndex >= projectileReleaseFrame
        ) {
          hasReleasedProjectile = true;

          this.launchProjectile(player, angleToPlayer);

          return;
        }

        if (
          hasProjectile ||
          !damageFrames.includes(animationFrameIndex) ||
          appliedDamageFrames.has(animationFrameIndex)
        ) {
          return;
        }

        appliedDamageFrames.add(animationFrameIndex);

        const currentPlayerPosition = player.getPosition();

        const currentAngle = Phaser.Math.Angle.Between(
          this.sprite.x,
          this.sprite.y,
          currentPlayerPosition.x,
          currentPlayerPosition.y,
        );

        if (
          this.isPlayerInArc(
            currentPlayerPosition,
            this.sprite,
            this.attackRange,
            currentAngle - Math.PI / 6,
            currentAngle + Math.PI / 6,
          )
        ) {
          audioManager.playSound("sfx-enemy-hit-player", 0.6);
          player.takeDamage(this.damage, this);
        } else {
          this.createDodgeText(player);
        }
      },
    );

    this.sprite.once(
      "animationcomplete",
      (animation: Phaser.Animations.Animation) => {
        if (animation.key !== attackAnimationKey) {
          return;
        }

        this.sprite.off("animationupdate");

        if (player.isDead) {
          this.stopAttackingPlayer();
          return;
        }

        this.isAttacking = false;

        this.playEnemyAnimation("Idle", this.lastDirection, false);

        if (this.attackRangeArc) {
          this.attackRangeArc.destroy();

          this.attackRangeArc = null;
        }

        if (this.attackRangeRect) {
          this.attackRangeRect.destroy();

          this.attackRangeRect = null;
        }
      },
    );
  }

  launchProjectile(player: any, angleToPlayer: any) {
    let projectile = this.scene.add.sprite(
      this.sprite.x,
      this.sprite.y,
      this.projectile,
    );
    projectile.setOrigin(0.5, 0.5);
    projectile.setScale(0.5);
    projectile.setRotation(angleToPlayer);

    const projectileSpeed = 500;
    const maxDistance = this.attackRange;
    projectile.hit = false; // ensure damage is applied only once

    // Calculate the end point of the projectile's path within the rectangle path
    const endPointX = this.sprite.x + Math.cos(angleToPlayer) * maxDistance;
    const endPointY = this.sprite.y + Math.sin(angleToPlayer) * maxDistance;

    // Calculate the duration for the projectile to travel to the end point
    const distanceToEndPoint = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      endPointX,
      endPointY,
    );
    const duration = (distanceToEndPoint / projectileSpeed) * 1000;

    this.scene.tweens.add({
      targets: projectile,
      x: endPointX,
      y: endPointY,
      duration: duration,
      ease: "Linear",
      onUpdate: () => {
        if (projectile.hit || !projectile.active) {
          return;
        }

        const playerX = player.sprite?.x ?? player.getPosition().x;
        const playerY = player.sprite?.y ?? player.getPosition().y;

        const differenceX = projectile.x - playerX;
        const differenceY = projectile.y - playerY;

        if (differenceX * differenceX + differenceY * differenceY < 100) {
          audioManager.playSound("sfx-enemy-hit-player", 0.6);

          player.takeDamage(this.damage, this);

          projectile.hit = true;
          projectile.destroy();
        }
      },
      onComplete: () => {
        if (!projectile.hit) {
          this.createDodgeText(player);
          projectile.destroy();
        }
      },
    });
  }

  createAttackRangeArc(angleToPlayer: any) {
    // Define the start and end angles for the arcs
    const startAngle = angleToPlayer - Math.PI / 6;
    const endAngle = angleToPlayer + Math.PI / 6;

    // Draw the attack area with curved edges
    if (this.attackRangeArc) {
      this.attackRangeArc.destroy(); // Destroy existing shape if any
    }
    this.attackRangeArc = this.scene.add.graphics({
      fillStyle: { color: 0xffff00, alpha: 0.4 },
    });
    this.attackRangeArc.beginPath(); // Phaser's graphics API to draw two arcs that form the outer edges
    // https://newdocs.phaser.io/docs/3.54.0/focus/Phaser.GameObjects.Graphics-arc
    this.attackRangeArc.moveTo(this.sprite.x, this.sprite.y); // Move to sprite's position
    this.attackRangeArc.arc(
      this.sprite.x,
      this.sprite.y,
      this.attackRange,
      startAngle,
      endAngle,
      false,
    );
    this.attackRangeArc.closePath();
    this.attackRangeArc.fillPath();
    this.attackRangeArc.strokePath();
  }

  createAttackRangeRectangle(angleToPlayer: any) {
    if (this.attackRangeRect) {
      this.attackRangeRect.destroy();
    }
    const rectWidth = this.attackRange;
    const rectHeight = 45; // Adjust this value as needed
    this.attackRangeRect = this.scene.add.rectangle(
      this.sprite.x,
      this.sprite.y,
      rectWidth,
      rectHeight,
      0xff0000,
      0.4,
    );
    this.attackRangeRect.setOrigin(0, 0.5);
    this.attackRangeRect.setRotation(angleToPlayer);
  }

  isPlayerInArc(
    playerPos: any,
    spritePos: any,
    range: any,
    startAngle: any,
    endAngle: any,
  ) {
    const angleToPlayer = Phaser.Math.Angle.Between(
      spritePos.x,
      spritePos.y,
      playerPos.x,
      playerPos.y,
    );
    const distanceToPlayer = Phaser.Math.Distance.Between(
      spritePos.x,
      spritePos.y,
      playerPos.x,
      playerPos.y,
    );
    return (
      distanceToPlayer <= range &&
      angleToPlayer >= startAngle &&
      angleToPlayer <= endAngle
    );
  }

  getPosition() {
    return {
      x: this.sprite.x,
      y: this.sprite.y,
    };
  }

  determineDirectionToPoint(targetX: number, targetY: number): string {
    const differenceX = targetX - this.sprite.x;

    const differenceY = targetY - this.sprite.y;

    const angle = (Math.atan2(differenceY, differenceX) * 180) / Math.PI;

    if (angle >= -22.5 && angle < 22.5) {
      return "east";
    }

    if (angle >= 22.5 && angle < 67.5) {
      return "southeast";
    }

    if (angle >= 67.5 && angle < 112.5) {
      return "south";
    }

    if (angle >= 112.5 && angle < 157.5) {
      return "southwest";
    }

    if (angle >= 157.5 || angle < -157.5) {
      return "west";
    }

    if (angle >= -157.5 && angle < -112.5) {
      return "northwest";
    }

    if (angle >= -112.5 && angle < -67.5) {
      return "north";
    }

    return "northeast";
  }

  createDamageText(damage: any, color: any) {
    const damageText = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 100,
      `-${damage}`,
      { font: "36px Orbitron", fill: color },
    );
    damageText.setOrigin(0.5, 0.5);

    // Animation for damage text (move up and fade out)
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 30, // Move up
      alpha: 0, // Fade out
      duration: 800,
      ease: "Power2",
      onComplete: () => {
        damageText.destroy();
      },
    });
  }

  createDodgeText(player: any) {
    const dodgeText = this.scene.add.text(
      player.getPosition().x,
      player.getPosition().y - 100,
      "Dodged!",
      { font: "24px Orbitron", fill: "#fff" },
    );
    dodgeText.setOrigin(0.5, 0.5);

    this.scene.tweens.add({
      targets: dodgeText,
      y: dodgeText.y - 30,
      alpha: 0,
      duration: 800,
      ease: "Power2",
      onComplete: () => {
        dodgeText.destroy();
      },
    });
  }

  die(causedByBaseDestruction = false) {
    if (this.fireTween) {
      this.fireTween.stop();
      this.fireTween.remove();
      this.fireTween = null;
    }
    if (this.fireTimerEvent) this.fireTimerEvent.destroy();
    if (this.isDead) return;
    if (this.scene.player.targetedEnemy === this) {
      this.scene.player.targetedEnemy = null;
    }
    this.isDead = true;

    audioManager.playSound("sfx-enemy-die", 0.55);

    if (!this.isKing) {
      const scoreAward = causedByBaseDestruction ? 50 : 100;

      this.scene.scene.get("BattleUI").updateScore(scoreAward);

      this.dropGold(causedByBaseDestruction);
      this.dropgem();
    }
    // Stop any ongoing movement
    if (this.moveTween) {
      this.moveTween.stop();
    }
    this.isMoving = false;
    this.isChasingPlayer = false;
    this.moveTween = null;

    const scoreAward = causedByBaseDestruction ? 50 : 100;

    this.isAttacking = false;

    this.sprite.off("animationupdate");

    this.sprite.off("animationcomplete");

    this.sprite.stop();

    this.sprite.play(`character${this.characterCode}Death`, true);

    this.sprite.once(
      "animationcomplete",
      (animation: Phaser.Animations.Animation) => {
        if (animation.key !== `character${this.characterCode}Death`) {
          return;
        }

        if (this.isKing) {
          this.scene.handleKingDefeated?.(this);
        }

        this.sprite.destroy();
      },
    );

    this.sprite.removeInteractive();
    this.sprite.removeInteractive();

    if (this.attacker) {
      this.attacker.stopAttackingEnemy();
    }

    this.healthBar.destroy();

    this.detectionBar.destroy();

    this.customSquareContainer.destroy();

    this.strengthenedSquareContainer.destroy();

    [this.attackRangeArc, this.attackRangeRect].forEach((banana) => {
      if (banana) banana.destroy();
    });
  }

  dropGold(causedByBaseDestruction: any) {
    const goldPieces = causedByBaseDestruction ? 1 : 2;
    for (let i = 0; i < goldPieces; i++) {
      let goldX = this.sprite.x + Math.random() * 100 - 50; // random between -50 and 50
      let goldY = this.sprite.y + Math.random() * 100 - 50;
      let gold = this.scene.add.sprite(goldX, goldY, "gold");
      gold.setScale(0.25);
      // gold.setData('value', this.goldValue);
      gold.setData(
        "value",
        this.isTreasureHunted ? this.goldValue * 2 : this.goldValue,
      );
      this.scene.time.delayedCall(
        500,
        () => {
          this.scene.collectGold(gold);
        },
        [],
        this,
      );
    }
  }

  dropgem() {
    if (Math.random() < 0.5) {
      let gem = this.scene.add.sprite(
        this.sprite.x - 70,
        this.sprite.y,
        "gem",
      );
      gem.setScale(0.25);
      gem.setData("value", 1);
      this.scene.time.delayedCall(
        500,
        () => {
          this.scene.collectgem(gem);
        },
        [],
        this,
      );
    }
  }

  public destroy(): void {
    if (this.fireTween) {
      this.fireTween.stop();
      this.fireTween.remove();
      this.fireTween = null;
    }

    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = null;
    }

    this.attackEvent?.destroy?.();

    this.sprite?.off?.();
    this.sprite?.destroy?.();

    this.healthBar?.destroy?.();
    this.detectionBar?.destroy?.();
    this.customSquareContainer?.destroy?.();
    this.strengthenedSquareContainer?.destroy?.();

    this.attackRangeArc?.destroy?.();
    this.attackRangeRect?.destroy?.();

    this.attackRangeArc = null;
    this.attackRangeRect = null;
  }

  fireEffect(): Phaser.GameObjects.Arc {
    if (this.fireGraphics?.active) {
      return this.fireGraphics;
    }

    const glow = this.scene.add.circle(0, 0, 14, 0xff5500, 0.8);

    this.fireGraphics = glow;

    this.fireTween = this.scene.tweens.add({
      targets: glow,
      scale: 1.2,
      alpha: 0.45,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    return glow;
  }

  private getBlueSquareTextureKey(): string {
    const key = "enemy-blue-level-square";

    if (this.scene.textures.exists(key)) {
      return key;
    }

    const texture = this.scene.textures.createCanvas(key, 25, 25);
    const context = texture.getContext();

    context.clearRect(0, 0, 25, 25);
    context.fillStyle = "#0000ff";
    context.fillRect(0, 0, 25, 25);

    texture.refresh();

    return key;
  }

  private getNumberTextureKey(prefix: string, value: number): string {
    const key = `${prefix}-${value}`;

    if (this.scene.textures.exists(key)) {
      return key;
    }

    const size = 32;

    const texture = this.scene.textures.createCanvas(key, size, size);

    const context = texture.getContext();

    context.clearRect(0, 0, size, size);

    context.font = "16px Orbitron";
    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillText(String(value), size / 2, size / 2 + 1);

    texture.refresh();

    return key;
  }

  private getStrengthHexagonTextureKey(): string {
    const immuneToStorm =
      this.inCamp ||
      this.returningToCamp ||
      (this.patrolling && !this.hasPlayerBeenDetected);

    const key =
      `enemy-strength-hex-` +
      `${this.patrolling ? "patrol" : "normal"}-` +
      `${immuneToStorm ? "immune" : "open"}`;

    if (this.scene.textures.exists(key)) {
      return key;
    }

    const size = 38;
    const radius = 15;

    const texture = this.scene.textures.createCanvas(key, size, size);

    const context = texture.getContext();

    context.clearRect(0, 0, size, size);

    context.beginPath();

    for (let index = 0; index < 6; index++) {
      const angle = (Math.PI * 2 * index) / 6;

      const x = size / 2 + radius * Math.cos(angle);

      const y = size / 2 + radius * Math.sin(angle);

      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.closePath();

    context.fillStyle = this.patrolling ? "#228b6c" : "#000000";

    context.fill();

    if (immuneToStorm) {
      context.strokeStyle = "#ffffff";
      context.lineWidth = 3;
      context.stroke();
    }

    texture.refresh();

    return key;
  }

  createHealthBar(): void {
    const healthBackground = this.scene.add.rectangle(
      0,
      0,
      60,
      7,
      0x000000,
      0.5,
    );

    healthBackground.setOrigin(0, 0);

    const healthFill = this.scene.add.rectangle(0, 0, 60, 7, 0xff0000, 1);

    healthFill.setOrigin(0, 0);

    this.healthBar = this.scene.add.container(
      this.sprite.x - 30,
      this.sprite.y - this.sprite.displayHeight / 2,
    );

    this.healthBar.add([healthBackground, healthFill]);

    this.healthBar.setDepth(1);

    this.healthBar.setData("fill", healthFill);

    this.customSquareContainer = this.scene.add.container(0, 0);

    this.customSquare = this.scene.add.image(
      0,
      0,
      this.getBlueSquareTextureKey(),
    );

    this.customSquareText = this.scene.add.image(
      0,
      0,
      this.getNumberTextureKey("enemy-base-level-number", this.level),
    );

    this.customSquareContainer.add([this.customSquare, this.customSquareText]);

    this.customSquareContainer.setDepth(1);

    this.strengthenedSquareContainer = this.scene.add.container(0, 0);

    this.strengthenedSquare = this.scene.add.image(
      0,
      0,
      this.getStrengthHexagonTextureKey(),
    );

    this.strengthenedSquareText = this.scene.add.image(
      0,
      0,
      this.getNumberTextureKey(
        "enemy-strength-level-number",
        this.strengthenLevel,
      ),
    );

    this.strengthenedSquareContainer.add([
      this.strengthenedSquare,
      this.strengthenedSquareText,
    ]);

    this.strengthenedSquareContainer.setDepth(1);

    this.updateHealthBar();
  }

  drawHexagon(): void {
    if (!this.strengthenedSquare || !this.strengthenedSquare.setTexture) {
      return;
    }

    this.strengthenedSquare.setTexture(this.getStrengthHexagonTextureKey());
  }

  updateHealthBar(): void {
    if (this.isDead || !this.sprite || !this.healthBar) {
      return;
    }

    const topY = this.sprite.y - this.sprite.displayHeight / 2;

    this.healthBar.setPosition(this.sprite.x - 30, topY);

    const healthFill = this.healthBar.getData(
      "fill",
    ) as Phaser.GameObjects.Rectangle;

    if (healthFill) {
      const healthPercentage = Phaser.Math.Clamp(
        this.health / this.maxHealth,
        0,
        1,
      );

      healthFill.displayWidth = 60 * healthPercentage;
    }

    this.customSquareContainer?.setPosition(this.sprite.x - 40, topY + 5);

    this.strengthenedSquareContainer?.setPosition(this.sprite.x + 42, topY + 3);
  }

  updateDetectionBar(percentage: number): void {
    if (this.isDead || !this.sprite || !this.detectionBar) {
      return;
    }

    if (!this.hasPlayerBeenDetected && !this.tutorialPursuitBarActive) {
      if (this.lastDetectionPercentage !== -1) {
        this.detectionBar.clear();
        this.lastDetectionPercentage = -1;
      }

      return;
    }

    const clampedPercentage = Phaser.Math.Clamp(percentage, 0, 1);

    const barX = this.sprite.x - 30;
    const topY = this.sprite.y - this.sprite.displayHeight / 2;
    const barY = topY + 9;

    const positionChanged =
      barX !== this.lastDetectionX || barY !== this.lastDetectionY;

    const percentageChanged =
      Math.abs(clampedPercentage - this.lastDetectionPercentage) >= 0.02;

    if (!positionChanged && !percentageChanged) {
      return;
    }

    this.lastDetectionX = barX;
    this.lastDetectionY = barY;
    this.lastDetectionPercentage = clampedPercentage;

    this.detectionBar.clear();
    this.detectionBar.setPosition(barX, barY);

    if (clampedPercentage <= 0) {
      return;
    }

    this.detectionBar.fillStyle(0xffffff, 0.4);
    this.detectionBar.fillRect(0, 0, 60, 5);

    this.detectionBar.fillStyle(0xffffff, 1);
    this.detectionBar.fillRect(0, 0, 60 * clampedPercentage, 5);
  }

  stopAttackingPlayer(): void {
    if (this.attackEvent) {
      this.attackEvent.remove(false);
      this.attackEvent = null;
    }

    this.isAttacking = false;
    this.isMoving = false;
    this.isChasingPlayer = false;
    this.attacker = null;

    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = null;
    }

    if (this.isDead || !this.sprite || !this.sprite.active) {
      return;
    }

    this.playEnemyAnimation("Idle", this.lastDirection || "south", true);
  }

  returnToCamp() {
    if (!this.originalCamp) return;
    this.isMoving = true;
    this.isAttacking = false;
    this.hasPlayerBeenDetected = false;

    let increasedSpeed = this.speed * 1.5; // Increase speed by 50%
    let randomPosition = this.originalCamp.getRandomPositionInRadius();

    let directionToCamp = this.determineDirectionToPoint(
      randomPosition.x,
      randomPosition.y,
    );
    this.lastDirection = directionToCamp;
    this.playEnemyAnimation("Moving", this.lastDirection, true);
    let distance = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      randomPosition.x,
      randomPosition.y,
    );
    let duration = (distance / increasedSpeed) * 1000;

    if (this.moveTween) {
      this.moveTween.stop();
    }

    this.moveTween = this.scene.tweens.add({
      targets: this.sprite,
      x: randomPosition.x,
      y: randomPosition.y,
      duration: duration,
      ease: "Linear",
      onUpdate: () => {
        if (this.isEnraged) {
          this.returningToCamp = false;
          this.isMoving = false;
          if (this.moveTween) {
            this.moveTween.stop();
          }
        } else {
          this.returningToCamp = true;
        }
        let updatedDirection = this.determineDirectionToPoint(
          randomPosition.x,
          randomPosition.y,
        );
        this.lastDirection = updatedDirection;
        this.playEnemyAnimation("Moving", updatedDirection, true);
      },
      onComplete: () => {
        this.isMoving = false;
        this.returningToCamp = false;
        this.inCamp = true;
        this.playEnemyAnimation("Idle", this.lastDirection, true);
      },
    });
  }

  heal(amount: number): void {
    const previousHealth = this.health;

    this.health = Math.min(this.health + amount, this.maxHealth);

    if (this.health !== previousHealth) {
      this.healthBarDirty = true;
      this.updateHealthBar();
    }

    this.createHealingText(amount);
  }

  createHealingText(amount: any) {
    const healingText = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 100,
      `+${amount}`,
      { font: "36px Orbitron", fill: "#00ff00" },
    );
    healingText.setOrigin(0.5, 0.5);

    // Animation for healing text (move up and fade out)
    this.scene.tweens.add({
      targets: healingText,
      y: healingText.y - 30, // Move up
      alpha: 0, // Fade out
      duration: 800,
      ease: "Power2",
      onComplete: () => {
        healingText.destroy(); // Remove the text object
      },
    });
  }

  setEnraged() {
    if (this.base.isDestroyed) return;
    this.stopPatrolMovementForCombat();
    if (!this.isEnraged) {
      this.isEnraged = true;
      this.damage = this.damage * 2;
      this.speed = this.isWinterFrosted ? this.speed * 1.1 : this.speed * 2;
      this.enrageStartTime = this.scene.activeGameTime;

      this.customSquareContainer.remove(this.customSquare, true);

      this.fireGraphics = this.fireEffect();

      this.fireGraphics.setPosition(0, 0);

      this.customSquareContainer.addAt(this.fireGraphics, 0);
    } else {
      // Reset enrage timer
      this.enrageStartTime = this.scene.activeGameTime;
    }
  }

  disenrage() {
    if (this.fireTween) {
      this.fireTween.stop();
      this.fireTween.remove();
      this.fireTween = null;
    }
    this.isEnraged = false;

    this.damage = Math.round(this.damage / 2);

    this.speed = this.isWinterFrosted ? this.speed / 1.1 : this.speed / 2;

    if (this.fireTimerEvent) {
      this.fireTimerEvent.destroy();
      this.fireTimerEvent = null;
    }

    if (this.fireGraphics) {
      this.customSquareContainer.remove(this.fireGraphics, true);

      this.fireGraphics = null;
    }

    this.customSquare = this.scene.add.graphics();

    this.customSquare.fillStyle(0x0000ff, 1);

    this.customSquare.fillRect(-10, -10, 25, 25);

    this.customSquareContainer.addAt(this.customSquare, 0);

    this.customSquareContainer.bringToTop(this.customSquareText);
  }

  updatePatrol(time: number, _delta: number): void {
    if (
      !this.patrolling ||
      this.isDead ||
      this.isAttacking ||
      this.hasPlayerBeenDetected ||
      this.isChasingPlayer ||
      this.returningToCamp
    ) {
      return;
    }

    if (!this.sprite || !this.sprite.active || !this.sprite.anims) {
      return;
    }

    // Allow the current patrol route to finish.
    if (this.isMoving || this.moveTween) {
      return;
    }

    if (time < this.nextPatrolTime) {
      return;
    }

    const newX = Phaser.Math.Between(
      this.patrolBounds.minX,
      this.patrolBounds.maxX,
    );

    const newY = Phaser.Math.Between(
      this.patrolBounds.minY,
      this.patrolBounds.maxY,
    );

    this.destination = {
      x: newX,
      y: newY,
    };

    const distance = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      newX,
      newY,
    );

    if (distance <= 2) {
      this.nextPatrolTime = time + this.patrolInterval;

      this.playEnemyAnimation("Idle", this.lastDirection || "south", true);

      return;
    }

    const patrolSpeed = Math.max(1, this.speed * 0.65);

    const duration = (distance / patrolSpeed) * 1000;

    const direction = this.determineDirectionToPoint(newX, newY);

    this.lastDirection = direction;
    this.isMoving = true;
    this.isChasingPlayer = false;

    this.playEnemyAnimation("Moving", direction, true);

    const patrolTween = this.scene.tweens.add({
      targets: this.sprite,

      x: newX,
      y: newY,

      duration,

      ease: "Linear",

      onComplete: () => {
        // Ignore a stale callback if combat replaced this tween.
        if (this.moveTween !== patrolTween) {
          return;
        }

        this.moveTween = null;
        this.isMoving = false;

        if (
          this.isDead ||
          this.isAttacking ||
          this.hasPlayerBeenDetected ||
          this.isChasingPlayer
        ) {
          return;
        }

        this.playEnemyAnimation("Idle", this.lastDirection || "south", true);

        // Wait before choosing the next patrol destination.
        this.nextPatrolTime = this.scene.time.now + this.patrolInterval;
      },
    });

    this.moveTween = patrolTween;
  }

  update(time: number, delta: number): void {
    if (this.isDead || !this.sprite?.active) {
      return;
    }

    const spriteMoved =
      this.sprite.x !== this.lastSpriteX || this.sprite.y !== this.lastSpriteY;

    if (spriteMoved || this.healthBarDirty) {
      this.updateHealthBar();

      this.lastSpriteX = this.sprite.x;
      this.lastSpriteY = this.sprite.y;
      this.healthBarDirty = false;
    }

    if (this.hasPlayerBeenDetected || this.tutorialPursuitBarActive) {
      const detectionPercentage =
        this.isAlert || this.isEnraged || this.timeInAlert < this.alertTime
          ? 1
          : Phaser.Math.Clamp(1 - this.timeOutOfDetection / 3000, 0, 1);

      this.updateDetectionBar(detectionPercentage);
    }

    const camera = this.scene.cameras.main;
    const margin = 250;

    const isNearCamera =
      this.sprite.x >= camera.worldView.x - margin &&
      this.sprite.x <= camera.worldView.right + margin &&
      this.sprite.y >= camera.worldView.y - margin &&
      this.sprite.y <= camera.worldView.bottom + margin;

    const currentAIInterval = isNearCamera ? 100 : 500;

    if (time < this.nextAIUpdateTime) {
      return;
    }

    const aiDelta =
      this.lastAIUpdateTime > 0
        ? Math.max(1, time - this.lastAIUpdateTime)
        : currentAIInterval;

    this.lastAIUpdateTime = time;
    this.nextAIUpdateTime =
      time + currentAIInterval + Phaser.Math.Between(0, 20);

    if (this.player && !this.player.isDead) {
      let playerX: number;
      let playerY: number;

      if (this.player.sprite?.active) {
        playerX = this.player.sprite.x;
        playerY = this.player.sprite.y;
      } else {
        const playerPosition = this.player.getPosition();

        playerX = playerPosition.x;
        playerY = playerPosition.y;
      }

      this.updateEnemy(playerX, playerY, this.player, aiDelta);
    }

    if (this.isDead) {
      return;
    }

    this.updatePatrol(time, aiDelta);
    this.updateIdleDirection(time);

    const wasImmuneToStorm = this.immuneToStorm;

    this.immuneToStorm =
      this.inCamp ||
      (this.patrolling && !this.hasPlayerBeenDetected) ||
      this.returningToCamp;

    if (this.immuneToStorm !== wasImmuneToStorm) {
      this.drawHexagon();
    }

    if (this.originalCamp) {
      const differenceX = this.sprite.x - this.originalCamp.x;

      const differenceY = this.sprite.y - this.originalCamp.y;

      const distanceSquared =
        differenceX * differenceX + differenceY * differenceY;

      const campRadiusSquared =
        this.originalCamp.radius * this.originalCamp.radius;

      if (distanceSquared > campRadiusSquared) {
        this.inCamp = false;
      } else if (!this.isMoving && !this.isAttacking) {
        this.inCamp = true;
      } else {
        this.inCamp = false;
      }

      if (
        this.inCamp &&
        this.health < this.maxHealth &&
        time - this.lastHealTime > 1000
      ) {
        const healAmount = Math.min(
          Math.round(this.maxHealth * 0.05),
          this.maxHealth - this.health,
        );

        this.heal(healAmount);
        this.lastHealTime = time;
      }
    }

    if (
      this.isEnraged &&
      this.scene.activeGameTime - this.enrageStartTime > this.enrageDuration
    ) {
      this.disenrage();
    }

    if (
      this.strengtheningEnabled &&
      this.timerStarted &&
      this.scene.activeGameTime > this.strengthenTimer
    ) {
      this.strengthenEnemies();
    }
  }

  private readonly enemyDirections = [
    "north",
    "northeast",
    "east",
    "southeast",
    "south",
    "southwest",
    "west",
    "northwest",
  ] as const;

  private getRandomEnemyDirection(excludedDirection?: string): string {
    const availableDirections = excludedDirection
      ? this.enemyDirections.filter(
          (direction) => direction !== excludedDirection,
        )
      : [...this.enemyDirections];

    return (
      availableDirections[
        Phaser.Math.Between(0, availableDirections.length - 1)
      ] ?? "south"
    );
  }

  public getTutorialBounds(): Phaser.Geom.Rectangle | null {
    if (!this.sprite || !this.sprite.active || this.isDead) {
      return null;
    }

    const spriteBounds = this.sprite.getBounds();

    return new Phaser.Geom.Rectangle(
      spriteBounds.x - 18,
      spriteBounds.y - 40,
      spriteBounds.width + 36,
      spriteBounds.height + 48,
    );
  }

  public getBaseLevelTutorialBounds(): Phaser.Geom.Rectangle | null {
    if (
      !this.customSquareContainer ||
      !this.customSquareContainer.active ||
      this.isDead
    ) {
      return null;
    }

    const bounds = this.customSquareContainer.getBounds();

    return new Phaser.Geom.Rectangle(
      bounds.x - 7,
      bounds.y - 7,
      bounds.width + 14,
      bounds.height + 14,
    );
  }

  public getStrengthLevelTutorialBounds(): Phaser.Geom.Rectangle | null {
    if (
      !this.strengthenedSquareContainer ||
      !this.strengthenedSquareContainer.active ||
      this.isDead
    ) {
      return null;
    }

    const bounds = this.strengthenedSquareContainer.getBounds();

    return new Phaser.Geom.Rectangle(
      bounds.x - 7,
      bounds.y - 7,
      bounds.width + 14,
      bounds.height + 14,
    );
  }

  public getHealthAreaTutorialBounds(): Phaser.Geom.Rectangle | null {
    if (!this.sprite || !this.sprite.active || this.isDead) {
      return null;
    }

    const healthBarY = this.sprite.y - this.sprite.height / 2;

    return new Phaser.Geom.Rectangle(
      this.sprite.x - 52,
      healthBarY - 24,
      104,
      46,
    );
  }

  public showTutorialAttackIndicator(): void {
    if (this.isDead || !this.sprite || !this.sprite.active) {
      return;
    }

    const playerPosition = this.player?.getPosition?.();

    if (!playerPosition) {
      return;
    }

    const angleToPlayer = Phaser.Math.Angle.Between(
      this.sprite.x,
      this.sprite.y,
      playerPosition.x,
      playerPosition.y,
    );

    // show the yellow cone indicator
    this.createAttackRangeArc(angleToPlayer);

    this.attackRangeArc?.setDepth(2);
  }

  public hideTutorialAttackIndicator(): void {
    if (!this.attackRangeArc) {
      return;
    }

    this.attackRangeArc.destroy();
    this.attackRangeArc = null;
  }
  public showTutorialEnrageEffect(): void {
    if (
      this.isDead ||
      !this.sprite?.active ||
      !this.customSquareContainer ||
      this.isEnraged ||
      this.tutorialEnrageEffectActive
    ) {
      return;
    }

    this.tutorialEnrageEffectActive = true;
    // remove only normal blue square, do not change Damage, Speed or actual enemy behaviour
    if (this.customSquare && this.customSquare.active) {
      this.customSquareContainer.remove(this.customSquare, false);

      this.customSquare.setVisible(false);
    }

    this.fireGraphics = this.fireEffect();

    if (this.fireGraphics) {
      this.fireGraphics.setPosition(0, 0);

      if (!this.customSquareContainer.exists(this.fireGraphics)) {
        this.customSquareContainer.addAt(this.fireGraphics, 0);
      }

      this.customSquareContainer.bringToTop(this.customSquareText);
    }
  }
  public hideTutorialEnrageEffect(): void {
    if (!this.tutorialEnrageEffectActive) {
      return;
    }

    this.tutorialEnrageEffectActive = false;

    if (this.fireTween) {
      this.fireTween.stop();
      this.fireTween.remove();
      this.fireTween = null;
    }

    if (this.fireGraphics) {
      this.customSquareContainer?.remove(this.fireGraphics, true);

      this.fireGraphics = null;
    }

    if (this.customSquare && this.customSquare.active) {
      this.customSquare.setVisible(true);

      if (!this.customSquareContainer?.exists(this.customSquare)) {
        this.customSquareContainer?.addAt(this.customSquare, 0);
      }
    }

    if (this.customSquareText && this.customSquareContainer) {
      this.customSquareContainer.bringToTop(this.customSquareText);
    }
  }
  public showTutorialPursuitBar(): void {
    if (this.isDead || !this.sprite?.active || !this.detectionBar) {
      return;
    }

    this.tutorialPursuitBarActive = true;

    this.updateDetectionBar(0.68);
  }
  public hideTutorialPursuitBar(): void {
    if (!this.tutorialPursuitBarActive) {
      return;
    }

    this.tutorialPursuitBarActive = false;

    this.detectionBar?.clear();
    if (this.hasPlayerBeenDetected) {
      this.updateDetectionBar(1);
    }
  }
}

export default Enemy;
