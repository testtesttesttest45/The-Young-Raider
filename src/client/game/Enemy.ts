import chroma from "chroma-js";
import * as Phaser from "phaser";
import characterMap, { EnemyAnimationConfig } from "./CharacterMap";

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
    this.level = level;
    this.strengthenLevel = 1;
    const levelMultiplier = 1 + (this.level - 1) * 0.3; // 20% increase per level
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
  }

  startTimer() {
    if (!this.timerStarted) {
      this.strengthenTimer =
        this.scene.activeGameTime + this.enemyStrengthenInterval;
      this.timerStarted = true;
    }
  }

  getTimeUntilNextStrengthen() {
    return Math.max(0, this.strengthenTimer - this.scene.activeGameTime);
  }

  strengthenEnemies() {
    const damageIncrease = Math.ceil(this.damage * 0.27);
    this.strengthenLevel++;
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

    // Enemy detects player if damage source is the player
    if (source !== "catastrophe") {
      this.hasPlayerBeenDetected = true;
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
      !this.attacker?.getPosition
    ) {
      return;
    }

    this.isMoving = true;
    this.isAttacking = false;
    this.inCamp = false;

    const refreshInterval = 150;

    const stopChasing = (): void => {
      if (this.moveTween) {
        this.moveTween.stop();
        this.moveTween = null;
      }

      this.isMoving = false;
    };

    const moveTowardsCurrentPlayerPosition = (): void => {
      // stop the recursive chase if the enemy is dead, attacking, returning to camp, or if the player has not been detected
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

      const movementDuration = Math.min(
        refreshInterval,
        (distance / this.speed) * 1000,
      );

      const movementDistance = this.speed * (movementDuration / 1000);

      const ratio = Math.min(1, movementDistance / distance);

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

      this.moveTween = this.scene.tweens.add({
        targets: this.sprite,

        x: targetX,
        y: targetY,

        duration: movementDuration,

        ease: "Linear",

        onComplete: () => {
          this.moveTween = null;

          if (
            this.isDead ||
            this.isAttacking ||
            this.returningToCamp ||
            !this.hasPlayerBeenDetected ||
            this.attacker?.isDead
          ) {
            this.isMoving = false;
            return;
          }

          moveTowardsCurrentPlayerPosition();
        },
      });
    };

    moveTowardsCurrentPlayerPosition();
  }

  updateEnemy(playerX: any, playerY: any, player: any, delta: any) {
    this.attacker = player;
    if (this.isDead || this.attacker.isDead) return;
    const distance = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      playerX,
      playerY,
    );

    // Determine the direction to the player
    const direction = this.determineDirectionToPoint(playerX, playerY);
    const attackAnimationKey = `character${this.characterCode}Attack${direction}`;
    if (this.isEnraged) {
      this.hasPlayerBeenDetected = true;
      // Keep the enemy alert and the detection bar full
      this.isAlert = true;
      this.updateDetectionBar(1); // Full detection bar

      // If the player is within attack range, attack; otherwise, move towards the player
      if (distance <= this.attackRange && !this.isAttacking) {
        this.isMoving = false;
        if (this.moveTween) this.moveTween.stop();
        this.attackPlayer(player);
      } else if (distance > this.attackRange && !this.isMoving) {
        this.moveToPlayer(playerX, playerY);
      }

      // During the enraged state, the alert timer does not decrease
      this.timeInAlert = this.alertTime;

      // Check if the enrage duration has elapsed
      if (
        this.scene.activeGameTime - this.enrageStartTime >
        this.enrageDuration
      ) {
        this.disenrage();
      }
    } else {
      if (this.returningToCamp) return;
      // Player is within detection radius or the enemy is attacking
      if (
        distance < this.detectionRadius ||
        (distance <= this.attackRange && this.hasPlayerBeenDetected)
      ) {
        // Set player as detected if within detection radius for the first time
        if (!this.hasPlayerBeenDetected && distance < this.detectionRadius) {
          this.hasPlayerBeenDetected = true;
        }

        this.isAlert = true;
        this.timeOutOfDetection = 0; // Reset out-of-detection timer
        this.updateDetectionBar(1); // full bar
        if (distance <= this.attackRange && !this.isAttacking) {
          this.isMoving = false;
          if (this.moveTween) {
            this.moveTween.stop();
          }
          this.attackPlayer(player);
        } else if (distance > this.attackRange && !this.isMoving) {
          this.moveToPlayer(playerX, playerY);
        }
        this.timeInAlert = 0;
        this.timeOutOfDetection = 0;
      } else {
        // out of detection radius
        if (!this.hasPlayerBeenDetected) {
          return;
        }

        // full bar for alertTime during grace period which drains over 3 sec
        if (this.timeInAlert < this.alertTime) {
          this.timeInAlert += Math.round(delta);

          this.updateDetectionBar(1);

          if (distance <= this.attackRange && !this.isAttacking) {
            this.isMoving = false;

            if (this.moveTween) {
              this.moveTween.stop();
              this.moveTween = null;
            }

            this.attackPlayer(player);
          } else if (
            distance > this.attackRange &&
            !this.isMoving &&
            !this.isAttacking
          ) {
            this.moveToPlayer(playerX, playerY);
          }

          return;
        }

        // grace period over, start draining the bar over 3 sec, but enemy still chases the player
        this.timeOutOfDetection += Math.round(delta);

        const detectionPercentage = Math.max(
          0,
          1 - this.timeOutOfDetection / 3000,
        );

        this.updateDetectionBar(detectionPercentage);

        if (this.timeOutOfDetection < 3000) {
          if (distance <= this.attackRange && !this.isAttacking) {
            this.isMoving = false;

            if (this.moveTween) {
              this.moveTween.stop();
              this.moveTween = null;
            }

            this.attackPlayer(player);
          } else if (
            distance > this.attackRange &&
            !this.isMoving &&
            !this.isAttacking
          ) {
            this.moveToPlayer(playerX, playerY);
          }

          return;
        }

        // bar fully drained, reset detection state and return to camp or patrol
        this.hasPlayerBeenDetected = false;
        this.isAlert = false;

        this.timeInAlert = 0;
        this.timeOutOfDetection = 0;

        this.detectionBar.clear();

        if (this.moveTween) {
          this.moveTween.stop();
          this.moveTween = null;
        }

        this.isMoving = false;
        this.isAttacking = false;

        if (this.patrolling) { // patrollers go to patrol
          this.returningToCamp = false;
          this.isMoving = false;

          this.nextPatrolTime =
            this.scene.time.now + Phaser.Math.Between(300, 900);

          this.playEnemyAnimation("Idle", this.lastDirection || "south", true);
        } else { // normal enemies return to camp
          this.returnToCamp();
        }
      }
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
        // Check if projectile is close to the player for hit detection
        if (
          !projectile.hit &&
          Phaser.Math.Distance.Between(
            projectile.x,
            projectile.y,
            player.getPosition().x,
            player.getPosition().y,
          ) < 10
        ) {
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
    if (this.fireTimerEvent) this.fireTimerEvent.destroy();
    if (this.isDead) return;
    if (this.scene.player.targetedEnemy === this) {
      this.scene.player.targetedEnemy = null;
    }
    this.isDead = true;
    const scoreAward = causedByBaseDestruction ? 50 : 100;
    this.scene.scene.get("BattleUI").updateScore(scoreAward);
    // Stop any ongoing movement
    if (this.moveTween) {
      this.moveTween.stop();
    }
    this.isMoving = false;

    this.dropGold(causedByBaseDestruction);
    this.dropCash();

    this.isAttacking = false;

    this.sprite.off("animationupdate");

    this.sprite.off("animationcomplete");

    this.sprite.stop();

    this.sprite.play(`character${this.characterCode}Death`, true);

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
      gold.setScale(0.5);
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

  dropCash() {
    if (Math.random() < 0.5) {
      let cash = this.scene.add.sprite(
        this.sprite.x - 70,
        this.sprite.y,
        "cash",
      );
      cash.setData("value", 1);
      this.scene.time.delayedCall(
        500,
        () => {
          this.scene.collectCash(cash);
        },
        [],
        this,
      );
    }
  }

  initializeFire() {
    this.fireWidth = 25;
    this.fireHeight = 25;
    this.fireArray = new Array(this.fireWidth * this.fireHeight).fill(0);
    this.firePixelSize = 1;
    this.fireGradient = chroma
      .scale(["#000000", "#000000", "#ffff00", "#ff8700", "#FF0000"])
      .domain([0, 10, 20, 50, 100]);
  }

  fireEffect() {
    if (this.isDead) return;
    if (!this.fireGraphics) {
      this.fireGraphics = new Phaser.GameObjects.Graphics(this.scene);

      this.scene.add.existing(this.fireGraphics);
      this.initializeFire();
      this.fireGraphics.setPosition(0, 0);
    }
    if (!this.fireTimerEvent) {
      this.fireTimerEvent = this.scene.time.addEvent({
        callback: () => {
          const updateFire = () => {
            for (let x = 0; x < this.fireWidth; x++) {
              this.fireArray[(this.fireHeight - 1) * this.fireWidth + x] =
                Math.floor(Math.random() * 255);
            }

            for (let y = 0; y < this.fireHeight - 1; y++) {
              for (let x = 0; x < this.fireWidth; x++) {
                let c = 0;
                c +=
                  this.fireArray[
                    Math.max(y + 1, 0) * this.fireWidth + Math.max(x - 1, 0)
                  ];
                c += this.fireArray[Math.max(y + 1, 0) * this.fireWidth + x];
                c +=
                  this.fireArray[
                    Math.max(y + 1, 0) * this.fireWidth +
                      Math.min(x + 1, this.fireWidth - 1)
                  ];
                c +=
                  this.fireArray[
                    Math.min(y + 2, this.fireHeight - 1) * this.fireWidth + x
                  ];
                this.fireArray[y * this.fireWidth + x] = c / 4.1;
              }
            }

            this.fireGraphics.clear();
            for (let y = 0; y < this.fireHeight; y++) {
              for (let x = 0; x < this.fireWidth; x++) {
                const colorValue =
                  (this.fireArray[y * this.fireWidth + x] * 100.0) / 255;
                const color = this.fireGradient(colorValue).hex();
                this.fireGraphics.fillStyle(
                  Phaser.Display.Color.HexStringToColor(color).color,
                  1,
                );
                this.fireGraphics.fillRect(
                  x * this.firePixelSize,
                  y * this.firePixelSize,
                  this.firePixelSize,
                  this.firePixelSize,
                );
              }
            }
          };
          updateFire();
        },
        callbackScope: this,
        loop: true,
        delay: 75,
      });
    }

    return this.fireGraphics;
  }

  createHealthBar() {
    this.healthBar = this.scene.add.graphics();
    this.healthBar.setDepth(1);

    // this.customSquare = this.fireEffect(); // i do not understand this fire code by the way!
    this.customSquare = this.scene.add.graphics();
    this.customSquare.fillStyle(0x0000ff, 1);
    this.customSquare.fillRect(-10, -10, 25, 25);
    this.customSquareText = this.scene.add
      .text(0, 0, this.level, {
        font: "16px Orbitron",
        fill: "#ffffff",
      })
      .setOrigin(0.5, 0.5);

    this.customSquareContainer = this.scene.add.container(0, 0);
    this.customSquareContainer.add(this.customSquare);
    this.customSquareContainer.add(this.customSquareText);
    this.customSquareContainer.setDepth(1);

    this.strengthenedSquare = this.scene.add.graphics();
    this.strengthenedSquareContainer = this.scene.add.container(
      this.sprite.x + 40,
      this.sprite.y,
    );
    this.drawHexagon();
    this.strengthenedSquareContainer.add(this.strengthenedSquare);
    this.strengthenedSquareText = this.scene.add
      .text(0, 0, "1", {
        font: "16px Orbitron",
        fill: "#ffffff",
      })
      .setOrigin(0.5, 0.5);
    this.strengthenedSquareContainer.add(this.strengthenedSquareText);
    this.strengthenedSquareContainer.setDepth(1);

    this.updateHealthBar();
  }

  drawHexagon() {
    const immuneToStorm =
      this.inCamp ||
      this.returningToCamp ||
      (this.patrolling && !this.hasPlayerBeenDetected);

    this.strengthenedSquare.clear();
    if (this.patrolling) {
      this.strengthenedSquare.fillStyle(0x228b6c, 1);
    } else {
      this.strengthenedSquare.fillStyle(0x000000, 1);
    }

    if (immuneToStorm) {
      this.strengthenedSquare.lineStyle(3, 0xffffff, 1);
    }

    const radius = 15;
    this.strengthenedSquare.beginPath();
    for (let i = 0; i < 6; i++) {
      const x = radius * Math.cos((2 * Math.PI * i) / 6);
      const y = radius * Math.sin((2 * Math.PI * i) / 6);
      if (i === 0) this.strengthenedSquare.moveTo(x, y);
      else this.strengthenedSquare.lineTo(x, y);
    }
    this.strengthenedSquare.closePath();
    this.strengthenedSquare.fill();

    if (immuneToStorm) {
      this.strengthenedSquare.strokePath();
    }
  }

  updateHealthBar() {
    if (this.isDead) return;
    const barX = this.sprite.x - 30;
    const barY = this.sprite.y - this.sprite.height / 2;
    this.healthBar.clear();
    this.healthBar.setPosition(barX, barY);

    // Background of health bar (transparent part)
    this.healthBar.fillStyle(0x000000, 0.5);
    this.healthBar.fillRect(0, 0, 60, 7);

    // Health portion (dynamic width based on current health)
    const healthPercentage = this.health / this.maxHealth;
    const healthBarWidth = healthPercentage * 60;
    this.healthBar.fillStyle(0xff0000, 1);
    this.healthBar.fillRect(0, 0, healthBarWidth, 7);

    if (this.customSquareContainer) {
      const containerX = this.sprite.x - 40;
      const containerY = this.sprite.y - this.sprite.height / 2 + 5;
      this.customSquareContainer.setPosition(containerX, containerY);
    }
    if (this.strengthenedSquareContainer) {
      const strengthenedSquareX = this.sprite.x + 42;
      const strengthenedSquareY = this.sprite.y - this.sprite.height / 2 + 3;
      this.strengthenedSquareContainer.setPosition(
        strengthenedSquareX,
        strengthenedSquareY,
      );
      // update the text
      this.strengthenedSquareText.setText(this.strengthenLevel);
    }
  }

  updateDetectionBar(percentage: any) {
    if (!this.hasPlayerBeenDetected) return;
    const barX = this.sprite.x - 30; // same x as the health bar
    const barY = this.sprite.y - this.sprite.height / 2 + 8;

    // this.detectionField.alpha = percentage;
    this.detectionBar.clear();
    this.detectionBar.setPosition(barX, barY);

    // White background
    this.detectionBar.fillStyle(0xffffff, 1);
    this.detectionBar.fillRect(0, 0, 60 * percentage, 5);

    // transparent background
    this.detectionBar.fillStyle(0xffffff, 0.4);
    this.detectionBar.fillRect(60 * percentage, 0, 60 * (1 - percentage), 5);

    if (percentage == 0) {
      this.detectionBar.clear();
    }
  }

  stopAttackingPlayer(): void {
    if (this.attackEvent) {
      this.attackEvent.remove(false);
      this.attackEvent = null;
    }

    this.isAttacking = false;
    this.attacker = null;

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

  heal(amount: any) {
    this.health = Math.min(this.health + amount, this.maxHealth);
    this.updateHealthBar();
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
    if (!this.isEnraged) {
      this.isEnraged = true;
      this.damage = this.damage * 2;
      this.speed = this.isWinterFrosted ? this.speed * 1.1 : this.speed * 2;
      this.enrageStartTime = this.scene.activeGameTime;

      this.customSquareContainer.remove(this.customSquare, true);

      this.fireGraphics = this.fireEffect();

      this.fireGraphics.setPosition(-10, -10);

      this.customSquareContainer.addAt(this.fireGraphics, 0);
    } else {
      // Reset enrage timer
      this.enrageStartTime = this.scene.activeGameTime;
    }
  }

  disenrage() {
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

  updatePatrol(time: any, delta: any) {
    if (!this.patrolling) return;
    if (this.isAttacking || this.hasPlayerBeenDetected) return;

    if (!this.sprite || !this.sprite.active || !this.sprite.anims) {
      return;
    }

    if (time >= this.nextPatrolTime) {
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

      this.nextPatrolTime = time + this.patrolInterval;

      const distance = Phaser.Math.Distance.Between(
        this.sprite.x,
        this.sprite.y,
        newX,
        newY,
      );

      const duration = (distance / (this.speed * 0.65)) * 1000;

      const direction = this.determineDirectionToPoint(newX, newY);

      this.lastDirection = direction;

      this.playEnemyAnimation("Moving", direction, true);

      if (this.moveTween) {
        this.moveTween.stop();
      }
      this.isMoving = true;
      this.moveTween = this.scene.tweens.add({
        targets: this.sprite,
        x: newX,
        y: newY,
        duration,
        ease: "Linear",

        onComplete: () => {
          this.isMoving = false;

          if (
            !this.isDead &&
            !this.isAttacking &&
            !this.hasPlayerBeenDetected
          ) {
            this.playEnemyAnimation("Idle", this.lastDirection, true);
          }
        },
      });
    }
  }

  update(time: any, delta: any) {
    if (this.isDead) {
      return;
    }
    if (this.player && !this.player.isDead) {
      const playerPos = this.player.getPosition();

      this.updateEnemy(playerPos.x, playerPos.y, this.player, delta);
    }
    if (this.isDead) return;

    this.updateHealthBar();
    this.updatePatrol(time, delta);
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
      const distanceFromCamp = Phaser.Math.Distance.Between(
        this.sprite.x,
        this.sprite.y,
        this.originalCamp.x,
        this.originalCamp.y,
      );

      if (distanceFromCamp > this.originalCamp.radius) {
        this.inCamp = false;
      } else if (!this.isMoving && !this.isAttacking) {
        this.inCamp = true;
      } else {
        this.inCamp = false;
      }

      if (this.inCamp && this.health < this.maxHealth) {
        if (time - this.lastHealTime > 1000) {
          // Heal every 1 second
          const healPercentage = 0.05; // 5% of max health per second
          let healAmount = Math.round(this.maxHealth * healPercentage);

          healAmount = Math.min(healAmount, this.maxHealth - this.health);
          this.heal(healAmount);
          this.lastHealTime = time;
        }
      }
    }

    if (
      this.isEnraged &&
      this.scene.activeGameTime - this.enrageStartTime > this.enrageDuration
    ) {
      this.disenrage();
    }

    if (this.scene.activeGameTime > this.strengthenTimer) {
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
}

export default Enemy;
