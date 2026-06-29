import characterMap from "./CharacterMap";
import Base from "./Base";
import * as Phaser from "phaser";
import PlayerAbilities from "./PlayerAbilities";
import audioManager from "../scenes/AudioManager";

class Player {
  scene: any;

  robotSprite: any;
  position: any;
  currentTween: any;

  idleAnimationIndex: any;
  lastAnimationChange: any;
  lastActionTime: any;

  lastDirection: any;
  directions: any[];

  directionAveragingSteps: any;

  characterCode: any;

  range: any;
  speed: any;
  originalSpeed: any;

  damage: any;
  originalDamage: any;

  attackSpeed: any;
  originalAttackSpeed: any;

  spritesheetKey: any;
  movingSpritesheetKey: any;
  attackSpritesheetKey: any;
  deathSpritesheetKey: any;
  isAttacking: any;
  attackEvent: any;

  originalHealth: any;
  maxHealth: any;
  currentHealth: any;

  healthBar: any;

  isDead: any;

  idleAnimations: any[];

  isMovingTowardsEnemy: any;
  continueAttacking: any;
  attackAnimationComplete: any;

  projectile: any;
  attackCount: any;

  enemies: any[];

  targetedEnemy: any;

  name: any;
  icon: any;

  isImmuneToStorms: any;

  healPercentage: any;

  healTimer: any;
  detectionField: any;

  attacker: any;
  attackingWho: any;

  moveTween: any;
  isMoving: any;
  isActionLocked: boolean;
  attackIndicator: Phaser.GameObjects.Graphics | null;
  attackIndicatorWidth: number;
  attackIndicatorOffset: number;
  hasAppliedAttackDamage: boolean;
  isJoystickMoving: boolean;
  abilities: PlayerAbilities;

  shieldIndicator: Phaser.GameObjects.Graphics | null;

  shieldIndicatorRadius: number;
  shieldIndicatorOffset: number;
  shieldIndicatorHalfAngle: number;

  constructor(
    scene: any,
    initialX: number,
    initialY: number,
    characterCode: number = 16,
    enemies: any[],
  ) {
    this.scene = scene;

    this.robotSprite = null;

    this.position = {
      x: initialX,
      y: initialY,
    };

    this.currentTween = null;

    this.idleAnimationIndex = 0;

    this.lastAnimationChange = this.scene.activeGameTime;

    this.lastActionTime = this.scene.activeGameTime;

    this.lastDirection = "south";

    this.directions = [];

    this.directionAveragingSteps = 10;

    this.characterCode = characterCode;

    const character = characterMap[this.characterCode];

    if (!character) {
      throw new Error(
        `[Player] Character ${this.characterCode} does not exist.`,
      );
    }

    if (character.type !== "raider") {
      throw new Error(
        `[Player] Character ${this.characterCode} is not a Raider.`,
      );
    }

    this.range = character.range;

    this.speed = character.speed;
    this.originalSpeed = character.speed;

    this.damage = character.damage;
    this.originalDamage = character.damage;

    this.attackSpeed = character.attackSpeed;
    this.originalAttackSpeed = character.attackSpeed;

    this.originalHealth = character.health;
    this.maxHealth = character.health;
    this.currentHealth = character.health;

    this.projectile = character.projectile;
    this.attackCount = character.attackCount;

    this.spritesheetKey = character.spritesheetKey;

    this.movingSpritesheetKey = character.movingSpritesheetKey;

    this.attackSpritesheetKey = character.attackSpritesheetKey;

    this.deathSpritesheetKey = character.deathSpritesheetKey;

    this.name = character.name;
    this.icon = character.icon;

    this.abilities = new PlayerAbilities(this, character);

    this.isAttacking = false;
    this.attackEvent = null;

    this.healthBar = null;
    this.isDead = false;

    this.idleAnimations = [
      "idlenorth",
      "idlenortheast",
      "idleeast",
      "idlesoutheast",
      "idlesouth",
      "idlesouthwest",
      "idlewest",
      "idlenorthwest",
    ];

    this.isMovingTowardsEnemy = false;
    this.continueAttacking = false;
    this.attackAnimationComplete = true;

    this.enemies = enemies;
    this.targetedEnemy = null;

    this.isImmuneToStorms = false;

    this.healPercentage = 0.05;

    this.isActionLocked = false;

    this.attackIndicator = null;
    this.attackIndicatorWidth = 90;
    this.attackIndicatorOffset = 25;
    this.hasAppliedAttackDamage = false;

    this.isJoystickMoving = false;

    this.shieldIndicator = null;
    this.shieldIndicatorRadius = 115;
    this.shieldIndicatorOffset = 18;

    this.shieldIndicatorHalfAngle = Phaser.Math.DegToRad(55);
  }

  applyCommunityRewards(damageBonus: number, healthBonus: number): void {
    if (this.scene.gameMode === "king") {
      return;
    }

    const safeDamageBonus = Number.isFinite(damageBonus)
      ? Phaser.Math.Clamp(Math.floor(damageBonus), 0, 200)
      : 0;

    const safeHealthBonus = Number.isFinite(healthBonus)
      ? Phaser.Math.Clamp(Math.floor(healthBonus), 0, 500)
      : 0;

    this.originalDamage += safeDamageBonus;
    this.damage += safeDamageBonus;

    this.originalHealth += safeHealthBonus;
    this.maxHealth += safeHealthBonus;
    this.currentHealth += safeHealthBonus;
  }

  create(): void {
    const idleFrameRate = 24;
    const movementFrameRate = 24;
    const attackFrameRate = 24;
    const deathFrameRate = 24;

    const animationKeys = [
      "idlenorth",
      "idlenortheast",
      "idleeast",
      "idlesoutheast",
      "idlesouth",
      "idlesouthwest",
      "idlewest",
      "idlenorthwest",

      "movenorth",
      "movenortheast",
      "moveeast",
      "movesoutheast",
      "movesouth",
      "movesouthwest",
      "movewest",
      "movenorthwest",

      "attacknorth",
      "attacknortheast",
      "attackeast",
      "attacksoutheast",
      "attacksouth",
      "attacksouthwest",
      "attackwest",
      "attacknorthwest",

      "death",
    ];

    animationKeys.forEach((animationKey: string) => {
      if (this.scene.anims.exists(animationKey)) {
        this.scene.anims.remove(animationKey);
      }
    });

    this.robotSprite = this.scene.add.sprite(
      this.position.x,
      this.position.y,
      this.spritesheetKey,
      0,
    );

    // idle: 41 frames per direction
    this.robotSprite.setOrigin(0.5, 0.5).setScale(0.75).setDepth(10);

    const idleAnimations = [
      {
        key: "idlenorth",
        start: 0,
        end: 40,
      },
      {
        key: "idlenortheast",
        start: 41,
        end: 81,
      },
      {
        key: "idleeast",
        start: 82,
        end: 122,
      },
      {
        key: "idlesoutheast",
        start: 123,
        end: 163,
      },
      {
        key: "idlesouth",
        start: 164,
        end: 204,
      },
      {
        key: "idlesouthwest",
        start: 205,
        end: 245,
      },
      {
        key: "idlewest",
        start: 246,
        end: 286,
      },
      {
        key: "idlenorthwest",
        start: 287,
        end: 327,
      },
    ];

    idleAnimations.forEach(
      (idleAnimation: { key: string; start: number; end: number }) => {
        this.scene.anims.create({
          key: idleAnimation.key,

          frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, {
            start: idleAnimation.start,
            end: idleAnimation.end,
          }),

          frameRate: idleFrameRate,
          repeat: -1,
        });
      },
    );

    // 21 frames per direction

    const movementAnimations = [
      {
        key: "movenorth",
        start: 0,
        end: 20,
      },
      {
        key: "movenortheast",
        start: 21,
        end: 41,
      },
      {
        key: "moveeast",
        start: 42,
        end: 62,
      },
      {
        key: "movesoutheast",
        start: 63,
        end: 83,
      },
      {
        key: "movesouth",
        start: 84,
        end: 104,
      },
      {
        key: "movesouthwest",
        start: 105,
        end: 125,
      },
      {
        key: "movewest",
        start: 126,
        end: 146,
      },
      {
        key: "movenorthwest",
        start: 147,
        end: 167,
      },
    ];

    movementAnimations.forEach(
      (movementAnimation: { key: string; start: number; end: number }) => {
        this.scene.anims.create({
          key: movementAnimation.key,

          frames: this.scene.anims.generateFrameNumbers(
            this.movingSpritesheetKey,
            {
              start: movementAnimation.start,
              end: movementAnimation.end,
            },
          ),

          frameRate: movementFrameRate,
          repeat: -1,
        });
      },
    );

    // 30 frames per direction, total 240 frames

    const attackAnimations = [
      {
        key: "attacknorth",
        start: 0,
        end: 29,
      },
      {
        key: "attacknortheast",
        start: 30,
        end: 59,
      },
      {
        key: "attackeast",
        start: 60,
        end: 89,
      },
      {
        key: "attacksoutheast",
        start: 90,
        end: 119,
      },
      {
        key: "attacksouth",
        start: 120,
        end: 149,
      },
      {
        key: "attacksouthwest",
        start: 150,
        end: 179,
      },
      {
        key: "attackwest",
        start: 180,
        end: 209,
      },
      {
        key: "attacknorthwest",
        start: 210,
        end: 239,
      },
    ];

    attackAnimations.forEach(
      (attackAnimation: { key: string; start: number; end: number }) => {
        this.scene.anims.create({
          key: attackAnimation.key,

          frames: this.scene.anims.generateFrameNumbers(
            this.attackSpritesheetKey,
            {
              start: attackAnimation.start,
              end: attackAnimation.end,
            },
          ),

          frameRate: attackFrameRate * this.originalAttackSpeed,

          repeat: 0,
        });
      },
    );
    // 69 frames

    this.scene.anims.create({
      key: "death",

      frames: this.scene.anims.generateFrameNumbers(this.deathSpritesheetKey, {
        start: 0,
        end: 68,
      }),

      frameRate: deathFrameRate,
      repeat: 0,
    });

    this.robotSprite.play(`idle${this.lastDirection}`, true);

    this.lastAnimationChange = this.scene.activeGameTime;

    this.createHealthBar();

    this.createAttackIndicator();
    this.createShieldIndicator();
    this.abilities.create();

    if (this.scene.gameMode !== "king") {
      this.healTimer = this.scene.time.addEvent({
        delay: 3000,
        callback: this.autoHeal,
        callbackScope: this,
        loop: true,
        paused: true,
      });
    } else {
      this.healTimer = null;
    }
  }

  autoHeal(): void {
    // if king battle is active, do not heal
    if (this.scene.gameMode === "king") {
      return;
    }
    if (this.currentHealth < this.maxHealth && !this.isDead) {
      // calc heal amount as 5% of max health
      let healAmount = Math.round(this.maxHealth * this.healPercentage);

      healAmount = Math.min(healAmount, this.maxHealth - this.currentHealth);

      this.currentHealth += healAmount;
      this.updateHealthBar();
      this.createHealingText(healAmount);
    }
  }

  resetHealTimer(): void {
    if (this.scene.gameMode === "king" || !this.healTimer) {
      return;
    }

    this.healTimer.reset({
      delay: 4000,
      callback: this.autoHeal,
      callbackScope: this,
      loop: true,
    });

    this.healTimer.paused = false;
  }

  createHealingText(amount: number) {
    const healingText = this.scene.add.text(
      this.robotSprite.x,
      this.robotSprite.y - 100,
      `+${amount}`,
      { font: "36px Orbitron", fill: "#00ff00" },
    );
    healingText.setOrigin(0.5, 0.5);
    healingText.setDepth(1);
    this.scene.tweens.add({
      targets: healingText,
      y: healingText.y - 30,
      alpha: 0,
      duration: 4000,
      ease: "Power2",
      onComplete: () => {
        healingText.destroy();
      },
    });
  }

  moveStraight(
    newX: number,
    newY: number,
    onCompleteCallback: (() => void) | null = null,
  ): void {
    if (this.isDead || this.isActionLocked) {
      return;
    }

    if (this.currentTween) {
      this.currentTween.stop();
      this.currentTween = null;

      this.updatePosition();
    }

    this.stopAttackingEnemy();

    const currentAnim = this.robotSprite.anims.currentAnim;

    const hasReachedTarget =
      Math.round(this.robotSprite.x) === Math.round(newX) &&
      Math.round(this.robotSprite.y) === Math.round(newY);

    if (hasReachedTarget && currentAnim && currentAnim.key.startsWith("idle")) {
      return;
    }

    const direction = this.determineDirection(newX, newY);

    if (!direction) {
      return;
    }

    this.lastDirection = direction;

    const movementAnimationKey = this.abilities.isShieldRaised
      ? `shieldmove${direction}`
      : `move${direction}`;

    if (!currentAnim || currentAnim.key !== movementAnimationKey) {
      this.robotSprite.play(movementAnimationKey, true);
    }
    this.updateAttackIndicator();
    this.updateShieldIndicator();

    const distance = Phaser.Math.Distance.Between(
      this.robotSprite.x,
      this.robotSprite.y,
      newX,
      newY,
    );

    if (distance <= 1) {
      const idleAnimationKey = this.abilities.isShieldRaised
        ? `shieldidle${this.lastDirection}`
        : `idle${this.lastDirection}`;

      this.robotSprite.play(idleAnimationKey, true);

      return;
    }

    const duration = (distance / this.speed) * 1000;

    this.currentTween = this.scene.tweens.add({
      targets: this.robotSprite,

      x: newX,
      y: newY,

      duration,
      ease: "Linear",

      onUpdate: () => {
        this.updatePosition();
        this.updateAttackIndicator();
        this.updateShieldIndicator();
      },

      onComplete: () => {
        if (this.isDead) {
          return;
        }

        this.currentTween = null;
        this.updatePosition();

        const idleAnimationKey = this.abilities.isShieldRaised
          ? `shieldidle${this.lastDirection}`
          : `idle${this.lastDirection}`;

        this.robotSprite.play(idleAnimationKey, true);

        this.updateAttackIndicator();
        this.updateShieldIndicator();

        if (onCompleteCallback) {
          onCompleteCallback();
        }
      },
    });

    this.lastActionTime = this.scene.activeGameTime;
  }

  launchProjectile(enemy: any) {
    if (!enemy) return;
    let projectile = this.scene.add.sprite(
      this.robotSprite.x + 10,
      this.robotSprite.y - 80,
      this.projectile,
    );
    projectile.setOrigin(0.5, 0.5);
    projectile.setScale(0.5);

    let targetX = enemy.sprite.x;
    let targetY = enemy.sprite.y;
    let angle = Phaser.Math.Angle.Between(
      this.robotSprite.x,
      this.robotSprite.y,
      targetX,
      targetY,
    );

    projectile.setRotation(angle); // 90 deg.

    // Calculate a more realistic impact point instead of the center of the enemy
    const enemyWidth = enemy.sprite.width;
    const enemyHeight = enemy.sprite.height;
    const impactOffsetX = (enemyWidth / 2) * Math.cos(angle); // ratio of the adjacent side to the hypotenuse of a right-angled triangle. gives x offset
    const impactOffsetY = (enemyHeight / 2) * Math.sin(angle); // ratio of the opposite side to the hypotenuse of a right-angled triangle gives y offset
    targetX -= impactOffsetX;
    targetY -= impactOffsetY;

    this.scene.tweens.add({
      targets: projectile,
      x: targetX,
      y: targetY,
      duration: 500,
      ease: "Linear",
      onComplete: () => {
        if (enemy) {
          enemy.takeDamage(this.damage, this); // apply damage when projectile hits
        }
        projectile.destroy(); // after hitting the target
      },
    });
  }

  stopAttackingEnemy(): void {
    this.isMovingTowardsEnemy = false;
    this.continueAttacking = false;
    this.attackingWho = null;
    this.targetedEnemy = null;

    if (this.attackEvent) {
      this.attackEvent.remove(false);
      this.attackEvent = null;
    }

    if (this.isActionLocked) {
      return;
    }

    this.isAttacking = false;

    const currentAnim = this.robotSprite.anims.currentAnim;

    if (currentAnim && currentAnim.key.startsWith("attack")) {
      const direction = this.lastDirection || "south";

      const idleAnimationKey = this.abilities.isShieldRaised
        ? `shieldidle${direction}`
        : `idle${direction}`;

      this.robotSprite.play(idleAnimationKey, true);
    }
  }

  calculateAverageDirection(directions: any[]) {
    // Calculate the most frequent direction in the array
    const directionCounts = directions.reduce((acc: any, dir: any) => {
      acc[dir] = (acc[dir] || 0) + 1;
      return acc;
    }, {});

    let mostFrequentDirection = null;
    let maxCount = 0;
    for (let dir in directionCounts) {
      if (directionCounts[dir] > maxCount) {
        mostFrequentDirection = dir;
        maxCount = directionCounts[dir];
      }
    }
    return mostFrequentDirection;
  }

  determineDirection(newX: number, newY: number) {
    const dx = newX - this.position.x;
    const dy = newY - this.position.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    if (angle >= -22.5 && angle < 22.5) return "east";
    if (angle >= 22.5 && angle < 67.5) return "southeast";
    if (angle >= 67.5 && angle < 112.5) return "south";
    if (angle >= 112.5 && angle < 157.5) return "southwest";
    if (angle >= 157.5 || angle < -157.5) return "west";
    if (angle >= -157.5 && angle < -112.5) return "northwest";
    if (angle >= -112.5 && angle < -67.5) return "north";
    if (angle >= -67.5 && angle < -22.5) return "northeast";
  }

  // determineDirectionToEnemy() {
  //     const enemyX = this.scene.enemy.sprite.x;
  //     const enemyY = this.scene.enemy.sprite.y;
  //     const dx = enemyX - this.robotSprite.x;
  //     const dy = enemyY - this.robotSprite.y;
  //     const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  //     if (angle >= -22.5 && angle < 22.5) return 'east';
  //     if (angle >= 22.5 && angle < 67.5) return 'southeast';
  //     if (angle >= 67.5 && angle < 112.5) return 'south';
  //     if (angle >= 112.5 && angle < 157.5) return 'southwest';
  //     if (angle >= 157.5 || angle < -157.5) return 'west';
  //     if (angle >= -157.5 && angle < -112.5) return 'northwest';
  //     if (angle >= -112.5 && angle < -67.5) return 'north';
  //     if (angle >= -67.5 && angle < -22.5) return 'northeast';
  // }

  determineDirectionToEnemy(enemy: any) {
    const enemyX = enemy.sprite.x;
    const enemyY = enemy.sprite.y;
    const dx = enemyX - this.robotSprite.x;
    const dy = enemyY - this.robotSprite.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    if (angle >= -22.5 && angle < 22.5) return "east";
    if (angle >= 22.5 && angle < 67.5) return "southeast";
    if (angle >= 67.5 && angle < 112.5) return "south";
    if (angle >= 112.5 && angle < 157.5) return "southwest";
    if (angle >= 157.5 || angle < -157.5) return "west";
    if (angle >= -157.5 && angle < -112.5) return "northwest";
    if (angle >= -112.5 && angle < -67.5) return "north";
    if (angle >= -67.5 && angle < -22.5) return "northeast";
  }

  updatePosition() {
    if (this.isDead) return;
    this.position.x = this.robotSprite.x;
    this.position.y = this.robotSprite.y;
  }

  getPosition() {
    return this.robotSprite
      ? { x: this.robotSprite.x, y: this.robotSprite.y }
      : this.position;
  }

  createHealthBar() {
    this.healthBar = this.scene.add.graphics(); // Create the graphics object, but don't draw anything yet

    // Draw the initial health bar
    this.updateHealthBar();
  }

  updateHealthBar() {
    // Calculate the position of the health bar above the player
    const barX = this.robotSprite.x - 70;
    const barY = this.robotSprite.y - this.robotSprite.displayHeight / 2;

    this.healthBar.clear();
    this.healthBar.setPosition(barX, barY);

    // Background of health bar (transparent part)
    this.healthBar.fillStyle(0x000000, 0.5);
    this.healthBar.fillRect(0, 0, 150, 10);

    // Health portion
    const healthPercentage = this.currentHealth / this.maxHealth;
    const healthBarWidth = healthPercentage * 150;
    // fill style dark green
    this.healthBar.fillStyle(0x00ff00, 1);
    this.healthBar.fillRect(0, 0, healthBarWidth, 10);
  }

  takeDamage(damage: any, source: any): void {
    if (this.isDead) {
      return;
    }

    if (this.isImmuneToStorms && source === "catastrophe") {
      return;
    }

    // shield only blocks directional damage, not catastrophe
    if (this.abilities.shouldBlockDamage(source)) {
      this.createShieldBlockedText();
      audioManager.playSound("sfx-shield-block", 0.5);
      return;
    }

    const wasAtFullHealth = this.currentHealth === this.maxHealth;

    this.currentHealth -= damage;

    this.currentHealth = Math.max(this.currentHealth, 0);

    const color = source === "catastrophe" ? "#ff0" : "#000";

    this.createDamageText(damage, color);

    if (wasAtFullHealth) {
      this.resetHealTimer();
    }

    if (this.currentHealth <= 0 && !this.isDead) {
      this.die();
    }

    this.updateHealthBar();
  }

  createShieldBlockedText(): void {
    const blockedText = this.scene.add.text(
      this.robotSprite.x,
      this.robotSprite.y - 90,
      "BLOCKED",
      {
        font: "bold 24px Orbitron",
        color: "#66d9ff",
        stroke: "#000000",
        strokeThickness: 4,
      },
    );

    blockedText.setOrigin(0.5).setDepth(5);

    this.scene.tweens.add({
      targets: blockedText,

      y: blockedText.y - 28,
      alpha: 0,

      duration: 700,
      ease: "Power2",

      onComplete: () => {
        blockedText.destroy();
      },
    });
  }

  createDamageText(damage: any, color: any) {
    const damageText = this.scene.add.text(
      this.robotSprite.x,
      this.robotSprite.y - 100,
      `-${damage}`,
      { font: "36px Orbitron", fill: color },
    );
    damageText.setOrigin(0.5, 0.5);
    damageText.setDepth(1);
    // Animation for damage text (move up and fade out)
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 30, // Move up
      alpha: 0, // Fade out
      duration: 800,
      ease: "Power2",
      onComplete: () => {
        damageText.destroy(); // Remove the text object
      },
    });
  }

  die(): void {
    if (this.isDead) return;

    this.isDead = true;

    // console.log("Player died");
    audioManager.playSound("sfx-player-die", 0.85);
    if (this.currentTween) {
      this.currentTween.stop();
    }

    if (this.moveTween) {
      this.moveTween.stop();
    }

    this.isMoving = false;
    this.isAttacking = false;
    this.abilities.onPlayerDeath();
    this.continueAttacking = false;

    this.robotSprite.stop();

    this.robotSprite.play("death", true);

    if (this.attacker && !this.attacker.isDead) {
      this.attacker.stopAttackingPlayer();
    }

    if (this.healthBar) {
      this.healthBar.destroy();
    }

    this.robotSprite.once(
      Phaser.Animations.Events.ANIMATION_COMPLETE,
      (animation: Phaser.Animations.Animation) => {
        if (animation.key !== "death") {
          return;
        }

        this.scene.scene.get("BattleUI").createGameOverScreen();
      },
    );
  }

  update(time: number, delta: number): void {
    this.abilities.update();

    this.updateAttackIndicator();
    this.updateShieldIndicator();
    const isTweenMoving = this.currentTween && this.currentTween.isPlaying();

    const isMoving = Boolean(isTweenMoving || this.isJoystickMoving);

    const currentAnimation = this.robotSprite.anims.currentAnim;

    const isAttacking =
      this.robotSprite.anims.isPlaying &&
      currentAnimation &&
      currentAnimation.key.startsWith("attack");

    const isSlashAnimation =
      this.robotSprite.anims.isPlaying &&
      currentAnimation &&
      currentAnimation.key.startsWith("slash");

    const isDashSlashAnimation =
      this.robotSprite.anims.isPlaying &&
      currentAnimation &&
      currentAnimation.key.startsWith("dashslash");

    if (
      !isMoving &&
      !isAttacking &&
      !isSlashAnimation &&
      !isDashSlashAnimation &&
      !this.isDead
    ) {
      const direction = this.lastDirection || "south";

      const idleKey = this.abilities.isShieldRaised
        ? `shieldidle${direction}`
        : `idle${direction}`;

      if (this.robotSprite.anims.currentAnim?.key !== idleKey) {
        this.robotSprite.play(idleKey, true);
      }
    } else {
      this.lastActionTime = time;
    }

    if (!currentAnimation || !currentAnimation.key.startsWith("attack")) {
      this.isAttacking = false;
    }

    this.updateHealthBar();
  }

  getDirectionVector(direction: string): {
    x: number;
    y: number;
  } {
    const diagonal = Math.SQRT1_2;

    switch (direction) {
      case "north":
        return {
          x: 0,
          y: -1,
        };

      case "northeast":
        return {
          x: diagonal,
          y: -diagonal,
        };

      case "east":
        return {
          x: 1,
          y: 0,
        };

      case "southeast":
        return {
          x: diagonal,
          y: diagonal,
        };

      case "south":
        return {
          x: 0,
          y: 1,
        };

      case "southwest":
        return {
          x: -diagonal,
          y: diagonal,
        };

      case "west":
        return {
          x: -1,
          y: 0,
        };

      case "northwest":
        return {
          x: -diagonal,
          y: -diagonal,
        };

      default:
        return {
          x: 0,
          y: 1,
        };
    }
  }

  playAttackAnimation(targetEnemy: any) {
    if (this.abilities.isShieldRaised) {
      return;
    }
    const direction = this.determineDirectionToEnemy(targetEnemy);
    const attackAnimationKey = `attack${direction}`;
    if (
      this.isAttacking &&
      !this.attackAnimationComplete &&
      this.targetedEnemy === targetEnemy
    ) {
      return;
    }
    this.isAttacking = true;
    this.attackAnimationComplete = false;
    this.attackingWho = targetEnemy;
    const frameRateRatio = this.attackSpeed / this.originalAttackSpeed;

    this.robotSprite.anims.play(attackAnimationKey);

    this.robotSprite.off("animationupdate");
    this.robotSprite.off("animationcomplete");

    let damageFrames = [];
    if (!this.projectile) {
      damageFrames.push(18);
    }

    this.robotSprite.on("animationupdate", (anim: any, frame: any) => {
      if (anim.key === attackAnimationKey) {
        if (this.projectile && this.projectile !== "" && frame.index === 4) {
          this.launchProjectile(this.targetedEnemy);
        } else if (!this.projectile && damageFrames.includes(frame.index)) {
          // if (this.attacker) {
          //     this.attacker.takeDamage(this.damage, this);
          // }
          if (this.targetedEnemy) {
            this.targetedEnemy.takeDamage(this.damage, this);
          }
        }
      }
    });

    this.robotSprite.once("animationcomplete", (anim: any) => {
      if (anim.key === attackAnimationKey) {
        this.attackAnimationComplete = true;
        if (!this.projectile) {
          this.robotSprite.play(attackAnimationKey);
        }
      }
    });
  }

  createAttackIndicator(): void {
    if (this.attackIndicator) {
      this.attackIndicator.destroy();
    }

    this.attackIndicator = this.scene.add.graphics();

    this.attackIndicator?.setDepth(0);

    this.updateAttackIndicator();
  }

  updateAttackIndicator(): void {
    if (!this.attackIndicator || !this.robotSprite) {
      return;
    }

    const shouldHide =
      this.isDead ||
      this.abilities?.isShieldRaised === true ||
      this.isActionLocked;

    if (shouldHide) {
      this.attackIndicator.clear().setVisible(false);

      return;
    }

    this.attackIndicator.setVisible(true);

    const direction = this.lastDirection || "south";

    const vector = this.getDirectionVector(direction);

    const facingAngle = Math.atan2(vector.y, vector.x);

    const halfArc = Phaser.Math.DegToRad(40); // 80 deg total

    const startAngle = facingAngle - halfArc;

    const endAngle = facingAngle + halfArc;

    const originX = this.robotSprite.x + vector.x * this.attackIndicatorOffset;

    const originY = this.robotSprite.y + vector.y * this.attackIndicatorOffset;

    this.attackIndicator.clear();

    this.attackIndicator.fillStyle(0xff3b30, 0.08);

    this.attackIndicator.lineStyle(2, 0xff6b61, 0.38);

    this.attackIndicator.beginPath();

    this.attackIndicator.moveTo(originX, originY);

    this.attackIndicator.arc(
      originX,
      originY,
      this.range,
      startAngle,
      endAngle,
      false,
    );

    this.attackIndicator.closePath();

    this.attackIndicator.fillPath();
    this.attackIndicator.strokePath();

    this.attackIndicator.setPosition(0, 0);

    this.attackIndicator.setRotation(0);
  }

  attackOnce(): void {
    if (this.isDead || this.isActionLocked || this.abilities.isShieldRaised) {
      return;
    }

    const direction = this.lastDirection || "south";

    this.lastDirection = direction;

    const attackAnimationKey = `attack${direction}`;

    if (!this.scene.anims.exists(attackAnimationKey)) {
      console.error("[Player] Missing attack animation:", attackAnimationKey);

      return;
    }

    if (this.currentTween) {
      this.currentTween.stop();
      this.currentTween = null;
    }

    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = null;
    }

    this.updatePosition();

    this.targetedEnemy = null;
    this.isMovingTowardsEnemy = false;
    this.continueAttacking = false;

    this.isAttacking = true;
    this.isActionLocked = true;
    audioManager.playSound("sfx-player-attack", 0.55);

    this.attackAnimationComplete = false;
    this.hasAppliedAttackDamage = false;

    const attackSpeedMultiplier = Phaser.Math.Clamp(
      this.attackSpeed / this.originalAttackSpeed,
      0.25,
      3,
    );

    this.robotSprite.anims.timeScale = attackSpeedMultiplier;

    this.robotSprite.play(attackAnimationKey, true);

    const damageFrame = 20;

    const onAnimationUpdate = (
      animation: Phaser.Animations.Animation,
      frame: Phaser.Animations.AnimationFrame,
    ): void => {
      if (animation.key !== attackAnimationKey) {
        return;
      }

      if (!this.hasAppliedAttackDamage && frame.index >= damageFrame) {
        this.hasAppliedAttackDamage = true;

        this.applyDirectionalAttackDamage();
      }
    };

    const onAnimationComplete = (
      animation: Phaser.Animations.Animation,
    ): void => {
      if (animation.key !== attackAnimationKey) {
        return;
      }

      this.robotSprite.off(
        Phaser.Animations.Events.ANIMATION_UPDATE,
        onAnimationUpdate,
      );

      this.robotSprite.anims.timeScale = 1;

      this.isActionLocked = false;
      this.isAttacking = false;
      this.attackAnimationComplete = true;
      this.hasAppliedAttackDamage = false;

      if (!this.isDead) {
        this.robotSprite.play(`idle${this.lastDirection}`, true);
      }
    };

    this.robotSprite.on(
      Phaser.Animations.Events.ANIMATION_UPDATE,
      onAnimationUpdate,
    );

    this.robotSprite.once(
      Phaser.Animations.Events.ANIMATION_COMPLETE,
      onAnimationComplete,
    );
  }

  isTargetInsideAttackArea(
    targetX: number,
    targetY: number,
    targetRadius: number = 0,
  ): boolean {
    const direction = this.lastDirection || "south";

    const forwardVector = this.getDirectionVector(direction);

    const sideVector = {
      x: -forwardVector.y,
      y: forwardVector.x,
    };

    const differenceX = targetX - this.robotSprite.x;

    const differenceY = targetY - this.robotSprite.y;

    const forwardDistance =
      differenceX * forwardVector.x + differenceY * forwardVector.y;

    const sideDistance =
      differenceX * sideVector.x + differenceY * sideVector.y;

    const minimumForwardDistance = this.attackIndicatorOffset - targetRadius;

    const maximumForwardDistance =
      this.attackIndicatorOffset + this.range + targetRadius;

    const maximumSideDistance = this.attackIndicatorWidth / 2 + targetRadius;

    return (
      forwardDistance >= minimumForwardDistance &&
      forwardDistance <= maximumForwardDistance &&
      Math.abs(sideDistance) <= maximumSideDistance
    );
  }

  applyDirectionalAttackDamage(): void {
    this.scene.enemies.forEach((enemy: any) => {
      if (!enemy || enemy.isDead || !enemy.sprite || !enemy.sprite.active) {
        return;
      }

      // of requiring its exact center to enter the rectangle. the higher the multiplier, the more forgiving the hit area will be.
      const enemyRadius =
        Math.min(enemy.sprite.displayWidth, enemy.sprite.displayHeight) * 0.2;

      const isHit = this.isTargetInsideAttackArea(
        enemy.sprite.x,
        enemy.sprite.y,
        enemyRadius,
      );

      if (isHit) {
        enemy.takeDamage(this.damage, this);
      }
    });

    const base = this.scene.base;

    if (
      base &&
      !base.isDestroyed &&
      base.sprite &&
      base.sprite.active &&
      base.sprite.visible
    ) {
      const baseRadius =
        Math.min(base.sprite.displayWidth, base.sprite.displayHeight) * 0.35;

      const baseIsHit = this.isTargetInsideAttackArea(
        base.sprite.x,
        base.sprite.y,
        baseRadius,
      );

      if (baseIsHit) {
        base.takeDamage(this.damage, this);
      }
    }
  }

  moveWithJoystick(
    inputX: number,
    inputY: number,
    delta: number,
    worldWidth: number,
    worldHeight: number,
    minimumY: number,
  ): void {
    if (this.isDead || this.isActionLocked || !this.robotSprite) {
      this.stopJoystickMovement();
      return;
    }

    const inputLength = Math.sqrt(inputX * inputX + inputY * inputY);

    if (inputLength < 0.01) {
      this.stopJoystickMovement();
      return;
    }

    if (this.currentTween) {
      this.currentTween.stop();
      this.currentTween = null;
    }

    const normalizedX = inputX / inputLength;

    const normalizedY = inputY / inputLength;

    const strength = Phaser.Math.Clamp(inputLength, 0, 1);

    const movementDistance = this.speed * strength * (delta / 1000);

    const spritePadding = 35;

    const nextX = Phaser.Math.Clamp(
      this.robotSprite.x + normalizedX * movementDistance,

      spritePadding,
      worldWidth - spritePadding,
    );

    const nextY = Phaser.Math.Clamp(
      this.robotSprite.y + normalizedY * movementDistance,

      minimumY,
      worldHeight - spritePadding,
    );

    const direction = this.determineDirectionFromVector(
      normalizedX,
      normalizedY,
    );

    if (!direction) {
      this.stopJoystickMovement();
      return;
    }

    this.isJoystickMoving = true;
    this.lastDirection = direction;

    const movementAnimationKey = this.abilities.isShieldRaised
      ? `shieldmove${direction}`
      : `move${direction}`;

    const currentAnimationKey = this.robotSprite.anims.currentAnim?.key;

    if (currentAnimationKey !== movementAnimationKey) {
      this.robotSprite.play(movementAnimationKey, true);
    }

    this.robotSprite.setPosition(nextX, nextY);

    this.updatePosition();
    this.updateAttackIndicator();
    this.updateShieldIndicator();

    this.lastActionTime = this.scene.activeGameTime;
  }

  stopJoystickMovement(): void {
    if (!this.isJoystickMoving) {
      return;
    }

    this.isJoystickMoving = false;

    if (this.isDead || this.isActionLocked) {
      return;
    }

    const direction = this.lastDirection || "south";

    const idleAnimationKey = this.abilities.isShieldRaised
      ? `shieldidle${direction}`
      : `idle${direction}`;

    if (this.robotSprite.anims.currentAnim?.key !== idleAnimationKey) {
      this.robotSprite.play(idleAnimationKey, true);
    }

    this.updateAttackIndicator();
    this.updateShieldIndicator();
  }

  determineDirectionFromVector(directionX: number, directionY: number): string {
    const angle = (Math.atan2(directionY, directionX) * 180) / Math.PI;

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

  createShieldIndicator(): void {
    if (this.shieldIndicator) {
      this.shieldIndicator.destroy();
    }

    this.shieldIndicator = this.scene.add.graphics();

    this.shieldIndicator?.setDepth(9);

    this.updateShieldIndicator();
  }

  updateShieldIndicator(): void {
    if (!this.shieldIndicator || !this.robotSprite) {
      return;
    }

    const shouldShow = !this.isDead && this.abilities?.isShieldRaised === true;

    if (!shouldShow) {
      this.shieldIndicator.clear().setVisible(false);

      return;
    }

    this.shieldIndicator.setVisible(true);

    const direction = this.lastDirection || "south";

    const vector = this.getDirectionVector(direction);

    const facingAngle = Math.atan2(vector.y, vector.x);

    const startAngle = facingAngle - this.shieldIndicatorHalfAngle;

    const endAngle = facingAngle + this.shieldIndicatorHalfAngle;

    const originX = this.robotSprite.x + vector.x * this.shieldIndicatorOffset;

    const originY = this.robotSprite.y + vector.y * this.shieldIndicatorOffset;

    this.shieldIndicator.clear();

    // cyan
    this.shieldIndicator.fillStyle(0x50c8ff, 0.12);

    this.shieldIndicator.beginPath();

    this.shieldIndicator.moveTo(originX, originY);

    this.shieldIndicator.arc(
      originX,
      originY,
      this.shieldIndicatorRadius,
      startAngle,
      endAngle,
      false,
    );

    this.shieldIndicator.closePath();
    this.shieldIndicator.fillPath();

    this.shieldIndicator.lineStyle(5, 0x50c8ff, 0.85);

    this.shieldIndicator.beginPath();

    this.shieldIndicator.arc(
      originX,
      originY,
      this.shieldIndicatorRadius,
      startAngle,
      endAngle,
      false,
    );

    this.shieldIndicator.strokePath();

    this.shieldIndicator.lineStyle(2, 0xbceeff, 0.35);

    this.shieldIndicator.beginPath();

    this.shieldIndicator.moveTo(originX, originY);

    this.shieldIndicator.lineTo(
      originX + Math.cos(startAngle) * this.shieldIndicatorRadius,

      originY + Math.sin(startAngle) * this.shieldIndicatorRadius,
    );

    this.shieldIndicator.strokePath();

    this.shieldIndicator.beginPath();

    this.shieldIndicator.moveTo(originX, originY);

    this.shieldIndicator.lineTo(
      originX + Math.cos(endAngle) * this.shieldIndicatorRadius,

      originY + Math.sin(endAngle) * this.shieldIndicatorRadius,
    );

    this.shieldIndicator.strokePath();

    this.shieldIndicator.setPosition(0, 0);

    this.shieldIndicator.setRotation(0);
  }

  slashOnce(): void {
    this.abilities.slashOnce();
  }

  dashOnce(): void {
    this.abilities.dashOnce();
  }

  getSlashCooldownRemaining(): number {
    return this.abilities.getSlashCooldownRemaining();
  }

  getSlashCooldownProgress(): number {
    return this.abilities.getSlashCooldownProgress();
  }

  isSlashReady(): boolean {
    return this.abilities.isSlashReady();
  }

  getDashCooldownRemaining(): number {
    return this.abilities.getDashCooldownRemaining();
  }

  getDashCooldownProgress(): number {
    return this.abilities.getDashCooldownProgress();
  }

  isDashReady(): boolean {
    return this.abilities.isDashReady();
  }

  toggleShield(): void {
    this.abilities.toggleShield();
  }

  isShieldRaised(): boolean {
    return this.abilities.isShieldRaised;
  }
}

export default Player;
