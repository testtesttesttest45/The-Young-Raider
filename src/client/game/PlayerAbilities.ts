import * as Phaser from "phaser";
import Player from "./Player";
import audioManager from "../scenes/AudioManager";

export default class PlayerAbilities {
  private player: Player;

  slashSpritesheetKey: string;

  slashCooldown: number;
  slashLastUsedTime: number;

  isSlashing: boolean;
  hasAppliedSlashDamage: boolean;

  slashIndicator: Phaser.GameObjects.Graphics | null;

  dashCooldown: number;
  dashLastUsedTime: number;

  dashDistance: number;
  dashDuration: number;

  isDashing: boolean;

  dashSlashSpritesheetKey: string;

  dashSlashIndicator: Phaser.GameObjects.Graphics | null;

  hasAppliedDashSlashDamage: boolean;

  dashSlashRange: number;
  dashSlashAngle: number;

  isShieldRaised: boolean;
  shieldSpritesheetKey: string;
  shieldMoveSpritesheetKey: string;

  shieldBlockAngle: number;

  constructor(player: Player, character: any) {
    this.player = player;

    this.slashSpritesheetKey = character.slashSpritesheetKey;

    this.slashCooldown = 4000;
    this.slashLastUsedTime = -Infinity;

    this.isSlashing = false;
    this.hasAppliedSlashDamage = false;

    this.slashIndicator = null;

    this.dashCooldown = 5000;
    this.dashLastUsedTime = -Infinity;

    this.dashDistance = 180;
    this.dashDuration = 180;

    this.isDashing = false;

    this.dashSlashSpritesheetKey = character.dashSlashSpritesheetKey;

    this.dashSlashIndicator = null;

    this.hasAppliedDashSlashDamage = false;

    this.dashSlashRange = 155;

    this.dashSlashAngle = Phaser.Math.DegToRad(120);

    this.isShieldRaised = false;

    this.shieldSpritesheetKey = character.shieldSpritesheetKey;

    this.shieldMoveSpritesheetKey = character.shieldMoveSpritesheetKey;

    // Blocks attacks within 40 degrees on either side of the player facing direction
    this.shieldBlockAngle = Phaser.Math.DegToRad(80);
  }

  create(): void {
    this.createAnimations();
    this.createSlashIndicator();
    this.createDashSlashIndicator();
  }

  update(): void {
    this.updateSlashIndicatorPosition();
    this.updateDashSlashIndicatorPosition();
    this.updateShieldAnimation();
  }

  onPlayerDeath(): void {
    this.isSlashing = false;
    this.isDashing = false;
    this.isShieldRaised = false;

    this.hasAppliedSlashDamage = false;
    this.hasAppliedDashSlashDamage = false;

    this.hideSlashIndicator();
    this.hideDashSlashIndicator();
  }

  destroy(): void {
    this.slashIndicator?.destroy();
    this.dashSlashIndicator?.destroy();

    this.slashIndicator = null;
    this.dashSlashIndicator = null;
  }

  private createAnimations(): void {
    const abilityAnimationKeys = [
      "slashnorth",
      "slashnortheast",
      "slasheast",
      "slashsoutheast",
      "slashsouth",
      "slashsouthwest",
      "slashwest",
      "slashnorthwest",

      "dashslashnorth",
      "dashslashnortheast",
      "dashslasheast",
      "dashslashsoutheast",
      "dashslashsouth",
      "dashslashsouthwest",
      "dashslashwest",
      "dashslashnorthwest",

      "shieldidlenorth",
      "shieldidlenortheast",
      "shieldidleeast",
      "shieldidlesoutheast",
      "shieldidlesouth",
      "shieldidlesouthwest",
      "shieldidlewest",
      "shieldidlenorthwest",

      "shieldmovenorth",
      "shieldmovenortheast",
      "shieldmoveeast",
      "shieldmovesoutheast",
      "shieldmovesouth",
      "shieldmovesouthwest",
      "shieldmovewest",
      "shieldmovenorthwest",
    ];

    abilityAnimationKeys.forEach((animationKey: string) => {
      if (this.player.scene.anims.exists(animationKey)) {
        this.player.scene.anims.remove(animationKey);
      }
    });

    const slashAnimations = [
      {
        key: "slashnorth",
        start: 0,
        end: 75,
      },
      {
        key: "slashnortheast",
        start: 76,
        end: 151,
      },
      {
        key: "slasheast",
        start: 152,
        end: 227,
      },
      {
        key: "slashsoutheast",
        start: 228,
        end: 303,
      },
      {
        key: "slashsouth",
        start: 304,
        end: 379,
      },
      {
        key: "slashsouthwest",
        start: 380,
        end: 455,
      },
      {
        key: "slashwest",
        start: 456,
        end: 531,
      },
      {
        key: "slashnorthwest",
        start: 532,
        end: 607,
      },
    ];

    slashAnimations.forEach(
      (animation: { key: string; start: number; end: number }) => {
        this.player.scene.anims.create({
          key: animation.key,

          frames: this.player.scene.anims.generateFrameNumbers(
            this.slashSpritesheetKey,
            {
              start: animation.start,

              end: animation.end,
            },
          ),

          frameRate: 75,
          repeat: 0,
        });
      },
    );

    const dashSlashAnimations = [
      {
        key: "dashslashnorth",
        start: 0,
        end: 65,
      },
      {
        key: "dashslashnortheast",
        start: 66,
        end: 131,
      },
      {
        key: "dashslasheast",
        start: 132,
        end: 197,
      },
      {
        key: "dashslashsoutheast",
        start: 198,
        end: 263,
      },
      {
        key: "dashslashsouth",
        start: 264,
        end: 329,
      },
      {
        key: "dashslashsouthwest",
        start: 330,
        end: 395,
      },
      {
        key: "dashslashwest",
        start: 396,
        end: 461,
      },
      {
        key: "dashslashnorthwest",
        start: 462,
        end: 527,
      },
    ];

    dashSlashAnimations.forEach(
      (animation: { key: string; start: number; end: number }) => {
        this.player.scene.anims.create({
          key: animation.key,

          frames: this.player.scene.anims.generateFrameNumbers(
            this.dashSlashSpritesheetKey,
            {
              start: animation.start,

              end: animation.end,
            },
          ),

          frameRate: 75,
          repeat: 0,
        });
      },
    );

    const shieldIdleAnimations = [
      {
        key: "shieldidlenorth",
        start: 0,
        end: 42,
      },
      {
        key: "shieldidlenortheast",
        start: 43,
        end: 85,
      },
      {
        key: "shieldidleeast",
        start: 86,
        end: 128,
      },
      {
        key: "shieldidlesoutheast",
        start: 129,
        end: 171,
      },
      {
        key: "shieldidlesouth",
        start: 172,
        end: 214,
      },
      {
        key: "shieldidlesouthwest",
        start: 215,
        end: 257,
      },
      {
        key: "shieldidlewest",
        start: 258,
        end: 300,
      },
      {
        key: "shieldidlenorthwest",
        start: 301,
        end: 343,
      },
    ];

    shieldIdleAnimations.forEach(
      (animation: { key: string; start: number; end: number }) => {
        this.player.scene.anims.create({
          key: animation.key,

          frames: this.player.scene.anims.generateFrameNumbers(
            this.shieldSpritesheetKey,
            {
              start: animation.start,
              end: animation.end,
            },
          ),

          frameRate: 24,
          repeat: -1,
        });
      },
    );

    const shieldMoveAnimations = [
      {
        key: "shieldmovenorth",
        start: 0,
        end: 39,
      },
      {
        key: "shieldmovenortheast",
        start: 40,
        end: 79,
      },
      {
        key: "shieldmoveeast",
        start: 80,
        end: 119,
      },
      {
        key: "shieldmovesoutheast",
        start: 120,
        end: 159,
      },
      {
        key: "shieldmovesouth",
        start: 160,
        end: 199,
      },
      {
        key: "shieldmovesouthwest",
        start: 200,
        end: 239,
      },
      {
        key: "shieldmovewest",
        start: 240,
        end: 279,
      },
      {
        key: "shieldmovenorthwest",
        start: 280,
        end: 319,
      },
    ];

    shieldMoveAnimations.forEach(
      (animation: { key: string; start: number; end: number }) => {
        this.player.scene.anims.create({
          key: animation.key,

          frames: this.player.scene.anims.generateFrameNumbers(
            this.shieldMoveSpritesheetKey,
            {
              start: animation.start,
              end: animation.end,
            },
          ),

          frameRate: 60,
          repeat: -1,
        });
      },
    );
  }

  createSlashIndicator(): void {
    if (this.slashIndicator) {
      this.slashIndicator.destroy();
    }

    this.slashIndicator = this.player.scene.add.graphics();

    this.slashIndicator?.setDepth(0).setVisible(false);

    this.drawSlashIndicator();
  }

  private drawSlashIndicator(): void {
    if (!this.slashIndicator) {
      return;
    }

    this.slashIndicator.clear();

    this.slashIndicator.fillStyle(0x9b4dff, 0.14);

    this.slashIndicator.lineStyle(3, 0xc38cff, 0.85);

    this.slashIndicator.fillCircle(0, 0, this.player.range);

    this.slashIndicator.strokeCircle(0, 0, this.player.range);
  }

  private showSlashIndicator(): void {
    if (!this.slashIndicator) {
      return;
    }

    this.drawSlashIndicator();

    this.slashIndicator.setPosition(
      this.player.robotSprite.x,
      this.player.robotSprite.y,
    );

    this.slashIndicator.setVisible(true);
  }

  private hideSlashIndicator(): void {
    this.slashIndicator?.setVisible(false);
  }

  private updateSlashIndicatorPosition(): void {
    if (
      !this.slashIndicator ||
      !this.slashIndicator.visible ||
      !this.player.robotSprite
    ) {
      return;
    }

    this.slashIndicator.setPosition(
      this.player.robotSprite.x,
      this.player.robotSprite.y,
    );
  }

  getSlashCooldownRemaining(): number {
    const elapsed = this.player.scene.activeGameTime - this.slashLastUsedTime;

    return Math.max(0, this.slashCooldown - elapsed);
  }

  getSlashCooldownProgress(): number {
    const remaining = this.getSlashCooldownRemaining();

    if (remaining <= 0) {
      return 1;
    }

    return Phaser.Math.Clamp(1 - remaining / this.slashCooldown, 0, 1);
  }

  isSlashReady(): boolean {
    return (
      !this.player.isDead &&
      !this.player.isActionLocked &&
      !this.isShieldRaised &&
      this.getSlashCooldownRemaining() <= 0
    );
  }

  slashOnce(): void {
    if (!this.isSlashReady()) {
      return;
    }

    const direction = this.player.lastDirection || "south";

    this.player.lastDirection = direction;

    const slashAnimationKey = `slash${direction}`;

    if (!this.player.scene.anims.exists(slashAnimationKey)) {
      console.error("[Player] Missing slash animation:", slashAnimationKey);

      return;
    }
    audioManager.playSound("sfx-slash", 0.7);

    if (this.player.currentTween) {
      this.player.currentTween.stop();
      this.player.currentTween = null;
    }

    if (this.player.moveTween) {
      this.player.moveTween.stop();
      this.player.moveTween = null;
    }

    this.player.stopJoystickMovement();

    this.player.updatePosition();

    this.player.targetedEnemy = null;
    this.player.isMovingTowardsEnemy = false;
    this.player.continueAttacking = false;

    this.player.isActionLocked = true;
    this.player.isAttacking = false;
    this.isSlashing = true;

    this.hasAppliedSlashDamage = false;

    this.slashLastUsedTime = this.player.scene.activeGameTime;

    this.showSlashIndicator();

    this.player.robotSprite.play(slashAnimationKey, true);

    const damageFrame = 38;

    const onAnimationUpdate = (
      animation: Phaser.Animations.Animation,
      frame: Phaser.Animations.AnimationFrame,
    ) => {
      if (animation.key !== slashAnimationKey) {
        return;
      }

      if (!this.hasAppliedSlashDamage && frame.index >= damageFrame) {
        this.hasAppliedSlashDamage = true;

        this.applySlashDamage();
      }
    };

    const onAnimationComplete = (animation: Phaser.Animations.Animation) => {
      if (animation.key !== slashAnimationKey) {
        return;
      }

      this.player.robotSprite.off(
        Phaser.Animations.Events.ANIMATION_UPDATE,
        onAnimationUpdate,
      );

      this.player.isActionLocked = false;
      this.isSlashing = false;
      this.hasAppliedSlashDamage = false;

      this.hideSlashIndicator();

      if (!this.player.isDead) {
        this.player.robotSprite.play(`idle${direction}`, true);
      }
    };

    this.player.robotSprite.on(
      Phaser.Animations.Events.ANIMATION_UPDATE,
      onAnimationUpdate,
    );

    this.player.robotSprite.once(
      Phaser.Animations.Events.ANIMATION_COMPLETE,
      onAnimationComplete,
    );
  }

  private applySlashDamage(): void {
    const playerX = this.player.robotSprite.x;

    const playerY = this.player.robotSprite.y;

    this.player.scene.enemies.forEach((enemy: any) => {
      if (!enemy || enemy.isDead || !enemy.sprite || !enemy.sprite.active) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(
        playerX,
        playerY,
        enemy.sprite.x,
        enemy.sprite.y,
      );

      if (distance <= this.player.range + 30) {
        enemy.takeDamage(Math.floor(this.player.damage * 1.1), this.player);
      }
    });

    const base = this.player.scene.base;

    if (
      base &&
      !base.isDestroyed &&
      base.sprite &&
      base.sprite.active &&
      base.sprite.visible
    ) {
      const baseDistance = Phaser.Math.Distance.Between(
        playerX,
        playerY,
        base.sprite.x,
        base.sprite.y,
      );

      if (baseDistance <= this.player.range) {
        // base.takeDamage(
        //     this.player.damage,
        //     this.player
        // );
        base.takeDamage(Math.floor(this.player.damage * 1.1), this.player);
      }
    }
  }

  getDashCooldownRemaining(): number {
    const elapsed = this.player.scene.activeGameTime - this.dashLastUsedTime;

    return Math.max(0, this.dashCooldown - elapsed);
  }

  getDashCooldownProgress(): number {
    const remaining = this.getDashCooldownRemaining();

    if (remaining <= 0) {
      return 1;
    }

    return Phaser.Math.Clamp(1 - remaining / this.dashCooldown, 0, 1);
  }

  isDashReady(): boolean {
    return (
      !this.player.isDead &&
      !this.player.isActionLocked &&
      !this.isShieldRaised &&
      !this.isDashing &&
      this.getDashCooldownRemaining() <= 0
    );
  }

  dashOnce(): void {
    if (!this.isDashReady() || !this.player.robotSprite) {
      return;
    }

    const direction = this.player.lastDirection || "south";

    const directionVector = this.player.getDirectionVector(direction);

    if (this.player.currentTween) {
      this.player.currentTween.stop();
      this.player.currentTween = null;
    }

    if (this.player.moveTween) {
      this.player.moveTween.stop();
      this.player.moveTween = null;
    }

    this.player.stopJoystickMovement();

    this.player.targetedEnemy = null;
    this.player.isMovingTowardsEnemy = false;
    this.player.continueAttacking = false;
    this.player.isAttacking = false;

    this.player.isActionLocked = true;
    this.isDashing = true;

    this.dashLastUsedTime = this.player.scene.activeGameTime;

    const spritePadding = 35;
    const worldWidth = 1280;
    const worldHeight = 720;
    const minimumY = 130;

    const targetX = Phaser.Math.Clamp(
      this.player.robotSprite.x + directionVector.x * this.dashDistance,

      spritePadding,
      worldWidth - spritePadding,
    );

    const targetY = Phaser.Math.Clamp(
      this.player.robotSprite.y + directionVector.y * this.dashDistance,

      minimumY,
      worldHeight - spritePadding,
    );

    this.player.robotSprite.play(`move${direction}`, true);

    this.player.currentTween = this.player.scene.tweens.add({
      targets: this.player.robotSprite,

      x: targetX,
      y: targetY,

      duration: this.dashDuration,
      ease: "Cubic.Out",

      onUpdate: () => {
        this.player.updatePosition();
        this.player.updateAttackIndicator();
      },

      onComplete: () => {
        this.player.currentTween = null;

        this.player.updatePosition();
        this.player.updateAttackIndicator();

        if (this.player.isDead) {
          this.isDashing = false;
          this.player.isActionLocked = false;
          return;
        }

        this.playDashSlash(direction);
      },
    });
  }

  private createDashSlashIndicator(): void {
    if (this.dashSlashIndicator) {
      this.dashSlashIndicator.destroy();
    }

    this.dashSlashIndicator = this.player.scene.add.graphics();

    this.dashSlashIndicator?.setDepth(0).setVisible(false);

    this.drawDashSlashIndicator();
  }

  private drawDashSlashIndicator(): void {
    if (!this.dashSlashIndicator) {
      return;
    }

    const halfAngle = this.dashSlashAngle / 2;

    const startAngle = -halfAngle;

    const endAngle = halfAngle;

    this.dashSlashIndicator.clear();

    this.dashSlashIndicator.fillStyle(0x50c8ff, 0.18);

    this.dashSlashIndicator.lineStyle(3, 0x8de4ff, 0.9);

    this.dashSlashIndicator.beginPath();

    this.dashSlashIndicator.moveTo(0, 0);

    this.dashSlashIndicator.arc(
      0,
      0,
      this.dashSlashRange,
      startAngle,
      endAngle,
      false,
    );

    this.dashSlashIndicator.closePath();

    this.dashSlashIndicator.fillPath();
    this.dashSlashIndicator.strokePath();
  }

  private showDashSlashIndicator(direction: string): void {
    if (!this.dashSlashIndicator || !this.player.robotSprite) {
      return;
    }

    const vector = this.player.getDirectionVector(direction);

    const rotation = Math.atan2(vector.y, vector.x);

    this.drawDashSlashIndicator();

    this.dashSlashIndicator.setPosition(
      this.player.robotSprite.x,
      this.player.robotSprite.y,
    );

    this.dashSlashIndicator.setRotation(rotation);

    this.dashSlashIndicator.setVisible(true);
  }

  private hideDashSlashIndicator(): void {
    this.dashSlashIndicator?.setVisible(false);
  }

  private updateDashSlashIndicatorPosition(): void {
    if (
      !this.dashSlashIndicator ||
      !this.dashSlashIndicator.visible ||
      !this.player.robotSprite
    ) {
      return;
    }

    this.dashSlashIndicator.setPosition(
      this.player.robotSprite.x,
      this.player.robotSprite.y,
    );
  }

  private isTargetInsideDashSlash(
    targetX: number,
    targetY: number,
    targetRadius: number = 0,
  ): boolean {
    const direction = this.player.lastDirection || "south";

    const forwardVector = this.player.getDirectionVector(direction);

    const differenceX = targetX - this.player.robotSprite.x;

    const differenceY = targetY - this.player.robotSprite.y;

    const distance = Math.sqrt(
      differenceX * differenceX + differenceY * differenceY,
    );

    if (distance > this.dashSlashRange + targetRadius) {
      return false;
    }

    if (distance <= 0) {
      return true;
    }

    const normalizedX = differenceX / distance;

    const normalizedY = differenceY / distance;

    const dotProduct = Phaser.Math.Clamp(
      normalizedX * forwardVector.x + normalizedY * forwardVector.y,
      -1,
      1,
    );

    const targetAngle = Math.acos(dotProduct);

    return targetAngle <= this.dashSlashAngle / 2;
  }

  private applyDashSlashDamage(): void {
    this.player.scene.enemies.forEach((enemy: any) => {
      if (!enemy || enemy.isDead || !enemy.sprite || !enemy.sprite.active) {
        return;
      }

      if (this.isTargetInsideDashSlash(enemy.sprite.x, enemy.sprite.y)) {
        enemy.takeDamage(Math.floor(this.player.damage * 1.1), this.player);
      }
    });

    const base = this.player.scene.base;

    if (
      base &&
      !base.isDestroyed &&
      base.sprite &&
      base.sprite.active &&
      base.sprite.visible &&
      this.isTargetInsideDashSlash(base.sprite.x, base.sprite.y)
    ) {
      base.takeDamage(Math.floor(this.player.damage * 1.1), this.player);
    }
  }

  private playDashSlash(direction: string): void {
    const animationKey = `dashslash${direction}`;

    if (!this.player.scene.anims.exists(animationKey)) {
      console.error("[Player] Missing dash-slash animation:", animationKey);

      this.isDashing = false;
      this.player.isActionLocked = false;

      return;
    }
    

    this.hasAppliedDashSlashDamage = false;

    this.showDashSlashIndicator(direction);

    this.player.robotSprite.play(animationKey, true);

    // 66-frame animation.
    const damageFrame = 33;

    const onAnimationUpdate = (
      animation: Phaser.Animations.Animation,
      frame: Phaser.Animations.AnimationFrame,
    ) => {
      if (animation.key !== animationKey) {
        return;
      }

      if (!this.hasAppliedDashSlashDamage && frame.index >= damageFrame) {
        audioManager.playSound("sfx-dash", 0.65);
        this.hasAppliedDashSlashDamage = true;
        this.applyDashSlashDamage();
      }
    };

    const onAnimationComplete = (animation: Phaser.Animations.Animation) => {
      if (animation.key !== animationKey) {
        return;
      }

      this.player.robotSprite.off(
        Phaser.Animations.Events.ANIMATION_UPDATE,
        onAnimationUpdate,
      );

      this.hideDashSlashIndicator();

      this.hasAppliedDashSlashDamage = false;

      this.isDashing = false;
      this.player.isActionLocked = false;

      if (!this.player.isDead) {
        this.player.robotSprite.play(`idle${direction}`, true);
      }
    };

    this.player.robotSprite.on(
      Phaser.Animations.Events.ANIMATION_UPDATE,
      onAnimationUpdate,
    );

    this.player.robotSprite.once(
      Phaser.Animations.Events.ANIMATION_COMPLETE,
      onAnimationComplete,
    );
  }

  toggleShield(): void {
    if (this.player.isDead || this.player.isActionLocked) {
      return;
    }

    this.isShieldRaised = !this.isShieldRaised;

    if (this.isShieldRaised) {
      // stop attacking, but not movement
      this.player.targetedEnemy = null;
      this.player.isMovingTowardsEnemy = false;
      this.player.continueAttacking = false;
      this.player.isAttacking = false;

      if (this.player.attackEvent) {
        this.player.attackEvent.remove(false);
        this.player.attackEvent = null;
      }

      this.updateShieldAnimation(true);
    } else {
      this.restoreNormalAnimation();
    }
  }

  private restoreNormalAnimation(): void {
    if (this.player.isDead || !this.player.robotSprite) {
      return;
    }

    const direction = this.player.lastDirection || "south";

    const isMoving = Boolean(
      (this.player.currentTween && this.player.currentTween.isPlaying()) ||
      this.player.isJoystickMoving,
    );

    const animationKey = isMoving ? `move${direction}` : `idle${direction}`;

    if (this.player.robotSprite.anims.currentAnim?.key !== animationKey) {
      this.player.robotSprite.play(animationKey, true);
    }
  }

  updateShieldAnimation(force: boolean = false): void {
    if (
      !this.isShieldRaised ||
      this.player.isDead ||
      !this.player.robotSprite
    ) {
      return;
    }

    const direction = this.player.lastDirection || "south";

    const isMoving = Boolean(
      (this.player.currentTween && this.player.currentTween.isPlaying()) ||
      this.player.isJoystickMoving,
    );

    const animationKey = isMoving
      ? `shieldmove${direction}`
      : `shieldidle${direction}`;

    if (
      force ||
      this.player.robotSprite.anims.currentAnim?.key !== animationKey
    ) {
      this.player.robotSprite.play(animationKey, true);
    }
  }

  shouldBlockDamage(source: any): boolean {
    if (
      !this.isShieldRaised ||
      this.player.isDead ||
      !source ||
      typeof source === "string"
    ) {
      return false;
    }

    const sourceSprite = source.sprite ?? source.robotSprite;

    if (!sourceSprite) {
      return false;
    }

    const differenceX = sourceSprite.x - this.player.robotSprite.x;

    const differenceY = sourceSprite.y - this.player.robotSprite.y;

    const distance = Math.sqrt(
      differenceX * differenceX + differenceY * differenceY,
    );

    if (distance <= 0.001) {
      return true;
    }

    const direction = this.player.lastDirection || "south";

    const facingVector = this.player.getDirectionVector(direction);

    const sourceDirectionX = differenceX / distance;

    const sourceDirectionY = differenceY / distance;

    const dotProduct = Phaser.Math.Clamp(
      facingVector.x * sourceDirectionX + facingVector.y * sourceDirectionY,
      -1,
      1,
    );

    const attackAngle = Math.acos(dotProduct);

    return attackAngle <= this.shieldBlockAngle / 2;
  }
}
