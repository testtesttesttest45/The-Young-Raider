import * as Phaser from "phaser";

class Base {
  scene: any;

  originalHealth: any;
  baseLevel: any;
  player: any;
  camps: any[];

  safeDistanceFromPlayer: any;

  minX: any;
  maxX: any;
  minY: any;
  maxY: any;

  totalHealth: any;
  health: any;

  isDestroyed: any;
  isRebuilding: any;

  rebuildTime: any;
  destroyedTime: any;

  goldValue: any;

  attacker: any;
  hasPlayerBeenDetected: any;

  sprite: any;
  healthBar: any;
  healthText: any;

  customSquare: any;
  customSquareText: any;
  customSquareContainer: any;

  idleSpritesheetKey: string;
  deathSpritesheetKey: string;

  idleAnimationKey: string;
  deathAnimationKey: string;
  constructor(
    scene: Phaser.Scene,
    player: any,
    camps: any[],
    baseLevel: number = 1,
  ) {
    this.originalHealth = 250; // 6000 at level 1
    this.baseLevel = baseLevel;
    this.scene = scene;
    this.player = player;
    this.camps = camps;
    this.sprite = null;
    this.safeDistanceFromPlayer = 200; // not too close to player
    this.minX = 200;
    this.maxX = 900;
    this.minY = 150;
    this.maxY = 600;
    this.totalHealth = Math.round(
      this.originalHealth * Math.pow(1.35, this.baseLevel - 1),
    );
    this.health = this.totalHealth;
    this.healthBar = null;
    this.isDestroyed = false;
    this.rebuildTime = 5000;
    this.destroyedTime = 0;
    this.customSquare = null;
    this.isRebuilding = false;
    this.healthText = null;
    this.goldValue = 100;
    this.idleSpritesheetKey = "treasure_monster_idle";

    this.deathSpritesheetKey = "treasure_monster_die";

    this.idleAnimationKey = "treasureMonsterIdle";

    this.deathAnimationKey = "treasureMonsterDie";
  }

  create(): void {
    this.createAnimations();

    const baseLocation = this.findSuitableBaseLocation();

    this.createTreasureMonsterSprite(baseLocation.x, baseLocation.y);

    this.isDestroyed = false;
    this.isRebuilding = false;
    this.health = this.totalHealth;

    if (this.healthBar) {
      this.healthBar.clear();
    }

    this.createHealthBar();
  }

  findSuitableBaseLocation(): {
    x: number;
    y: number;
  } {
    const maximumAttempts = 200;

    let bestX = Phaser.Math.Between(this.minX, this.maxX);

    let bestY = Phaser.Math.Between(this.minY, this.maxY);

    let bestScore = -Infinity;

    for (let attempt = 0; attempt < maximumAttempts; attempt++) {
      const baseX = Phaser.Math.Between(this.minX, this.maxX);

      const baseY = Phaser.Math.Between(this.minY, this.maxY);

      const distanceFromPlayer = Phaser.Math.Distance.Between(
        this.player.position.x,
        this.player.position.y,
        baseX,
        baseY,
      );

      let minimumCampClearance = Infinity;
      let tooCloseToCamp = false;

      for (const camp of this.camps) {
        const distanceToCamp = Phaser.Math.Distance.Between(
          camp.x,
          camp.y,
          baseX,
          baseY,
        );

        const campClearance = distanceToCamp - camp.radius;

        minimumCampClearance = Math.min(minimumCampClearance, campClearance);

        if (distanceToCamp <= camp.radius) {
          tooCloseToCamp = true;
        }
      }

      const tooCloseToPlayer = distanceFromPlayer < this.safeDistanceFromPlayer;

      if (!tooCloseToPlayer && !tooCloseToCamp) {
        return {
          x: baseX,
          y: baseY,
        };
      }

      const campScore = this.camps.length > 0 ? minimumCampClearance : 1000;

      const score = distanceFromPlayer + campScore;

      if (score > bestScore) {
        bestScore = score;
        bestX = baseX;
        bestY = baseY;
      }
    }

    console.warn(
      "[Base] No fully valid spawn location found. " +
        "Using the safest attempted location instead.",
      {
        x: bestX,
        y: bestY,
        playerPosition: this.player.position,
        campCount: this.camps.length,
      },
    );

    return {
      x: bestX,
      y: bestY,
    };
  }

  getPosition() {
    return {
      x: this.sprite.x,
      y: this.sprite.y,
    };
  }

  createHealthBar(): void {
    this.healthBar = this.scene.add.graphics();

    this.healthBar.setDepth(11);
    this.customSquare = this.scene.add.graphics();

    this.customSquare.fillStyle(0x0000ff, 1);

    this.customSquare.fillRect(-8, -8, 16, 16);

    this.customSquareText = this.scene.add
      .text(0, 0, `${this.baseLevel}`, {
        fontFamily: "Orbitron",
        fontSize: "11px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.customSquareContainer = this.scene.add.container(0, 0);

    this.customSquareContainer.add([this.customSquare, this.customSquareText]);

    this.customSquareContainer.setDepth(11);

    if (!this.healthText) {
      this.healthText = this.scene.add
        .text(0, 0, "", {
          fontFamily: "Orbitron",
          fontSize: "11px",
          color: "#ffffff",

          stroke: "#000000",
          strokeThickness: 3,

          backgroundColor: "rgba(0, 0, 0, 0.72)",

          padding: {
            x: 5,
            y: 2,
          },
        })
        .setOrigin(0.5, 0.5)
        .setDepth(12);
    }

    this.updateHealthBar();
  }

  updateHealthBar(): void {
    if (!this.sprite || !this.healthBar) {
      return;
    }

    const barWidth = 110;
    const barHeight = 10;

    const barX = this.sprite.x - barWidth / 2;

    const barY = this.sprite.y - 82;

    const healthPercentage = Phaser.Math.Clamp(
      this.health / this.totalHealth,
      0,
      1,
    );

    const currentHealthWidth = barWidth * healthPercentage;

    this.healthBar.clear();

    this.healthBar.setPosition(barX, barY);

    this.healthBar.fillStyle(0x000000, 0.7);

    this.healthBar.fillRoundedRect(0, 0, barWidth, barHeight, 4);

    if (currentHealthWidth > 0) {
      this.healthBar.fillStyle(0xff3b30, 1);

      this.healthBar.fillRoundedRect(0, 0, currentHealthWidth, barHeight, 4);
    }

    this.healthBar.lineStyle(1, 0xffffff, 0.7);

    this.healthBar.strokeRoundedRect(0, 0, barWidth, barHeight, 4);

    if (this.customSquareContainer) {
      this.customSquareContainer.setPosition(barX - 12, barY + barHeight / 2);
    }

    if (this.healthText) {
      this.healthText.setText(`${this.health}/${this.totalHealth}`);

      this.healthText.setPosition(this.sprite.x, barY - 10);
    }
  }

  takeDamage(damage: any, player: any) {
    this.attacker = player; // Store reference to the attacking player
    if (this.isDestroyed || !this.sprite || !this.sprite.active) {
      return;
    }

    if (damage >= this.health) {
      const remainingHealth = this.health;

      this.health = 0;

      this.createDamageText(remainingHealth);

      this.updateHealthBar();
      this.destroyed();

      return;
    }
    this.enrageEnemies();
    this.health -= damage;
    this.hasPlayerBeenDetected = true;

    // every 10% health of the base, award 50 points
    if (this.health % (this.totalHealth / 10) > 0) {
      // console.log('Awarding 50 points');
      // this.scene.scene.get('BattleUI').updateScore(50);
    }

    this.createDamageText(damage);

    if (this.health <= 0 && !this.isDestroyed) {
      this.destroyed();
    }
    this.updateHealthBar();
  }

  createDamageText(damage: any) {
    const damageText = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 100,
      `-${damage}`,
      { font: "36px Orbitron", fill: "#ff0000" },
    );
    damageText.setOrigin(0.5, 0.5);

    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 30,
      alpha: 0,
      duration: 800,
      ease: "Power2",
      onComplete: () => {
        damageText.destroy();
      },
    });
  }

  destroyed(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    this.health = 0;

    if (this.scene.player.targetedEnemy === this) {
      this.scene.player.targetedEnemy = null;
    }

    this.randomGoldDrop();

    // keep the dead body until the base is rebuilt
    if (this.sprite && this.sprite.active) {
      this.sprite.disableInteractive();

      this.sprite.stop();

      this.sprite.play(this.deathAnimationKey, true);
    }

    const enemiesToKill = [...this.scene.enemies];

    enemiesToKill.forEach((enemy: any) => {
      if (!enemy.isDead) {
        enemy.die(true);
      }
    });

    if (this.attacker) {
      this.attacker.stopAttackingEnemy();
    }

    this.healthBar?.destroy();
    this.healthBar = null;

    this.customSquareContainer?.destroy();
    this.customSquareContainer = null;

    if (this.healthText) {
      this.healthText.destroy();
      this.healthText = null;
    }

    this.destroyedTime = this.scene.activeGameTime;

    this.isRebuilding = true;
  }

  randomGoldDrop() {
    const goldPieces = 5;
    for (let i = 0; i < goldPieces; i++) {
      let goldX = this.sprite.x + Math.random() * 100 - 50; // random between -50 and 50
      let goldY = this.sprite.y + Math.random() * 100 - 50;
      let gold = this.scene.add.sprite(goldX, goldY, "gold");
      gold.setScale(0.5);
      gold.setData("value", this.goldValue);
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

  enrageEnemies() {
    this.scene.enemies.forEach((enemy: any) => {
      if (!enemy.isDead) {
        enemy.setEnraged();
      }
    });
  }

  recreateBaseAndEnemies(): void {
    this.baseLevel++;

    this.totalHealth = Math.round(
      this.originalHealth * Math.pow(1.35, this.baseLevel - 1),
    );

    this.scene.scene.get("BattleUI").resetBaseRebuildUI();

    this.scene.enemies.forEach((enemy: any) => {
      if (!enemy.isDead) {
        return;
      }

      enemy.sprite?.destroy();

      enemy.healthBar?.destroy();
      enemy.detectionBar?.destroy();

      enemy.customSquareContainer?.destroy();

      enemy.strengthenedSquareContainer?.destroy();

      enemy.attackRangeArc?.destroy();
      enemy.attackRangeRect?.destroy();

      enemy.fireTimerEvent?.destroy();
      enemy.fireGraphics?.destroy();
    });

    this.scene.enemies = this.scene.enemies.filter(
      (enemy: any) => !enemy.isDead,
    );

    // remove the sprite
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }

    const newBaseLocation = this.findSuitableBaseLocation();

    // new level, new treasure monster
    this.createTreasureMonsterSprite(newBaseLocation.x, newBaseLocation.y);

    this.health = this.totalHealth;
    this.isDestroyed = false;
    this.isRebuilding = false;

    this.createHealthBar();

    this.scene.createEnemy(this.baseLevel);

    this.scene.catastrophe.updateDamage(this.baseLevel);
  }

  update(time: number, delta: number): void {
    if (!this.isDestroyed || !this.isRebuilding) {
      return;
    }

    const elapsedRebuildTime = this.scene.activeGameTime - this.destroyedTime;

    const rebuildProgress = Phaser.Math.Clamp(
      elapsedRebuildTime / this.rebuildTime,
      0,
      1,
    );

    const battleUI = this.scene.scene.get("BattleUI");

    battleUI?.updateBaseRebuildUI?.(rebuildProgress);

    if (elapsedRebuildTime >= this.rebuildTime) {
      this.isRebuilding = false;

      try {
        this.recreateBaseAndEnemies();

        battleUI?.resetMultiplier?.();
      } catch (error) {
        console.error("[Base] Failed to rebuild base:", error);

        this.isRebuilding = true;
        this.destroyedTime = this.scene.activeGameTime;
      }
    }
  }

  private createAnimations(): void {
    // reversed, due to technical issues

    if (this.scene.anims.exists(this.idleAnimationKey)) {
      this.scene.anims.remove(this.idleAnimationKey);
    }

    if (this.scene.anims.exists(this.deathAnimationKey)) {
      this.scene.anims.remove(this.deathAnimationKey);
    }

    const reversedIdleFrames = this.scene.anims
      .generateFrameNumbers(this.idleSpritesheetKey, {
        start: 0,
        end: 40,
      })
      .reverse();

    this.scene.anims.create({
      key: this.idleAnimationKey,
      frames: reversedIdleFrames,
      frameRate: 24,
      repeat: -1,
    });

    const reversedDeathFrames = this.scene.anims
      .generateFrameNumbers(this.deathSpritesheetKey, {
        start: 0,
        end: 40,
      })
      .reverse();

    this.scene.anims.create({
      key: this.deathAnimationKey,
      frames: reversedDeathFrames,
      frameRate: 24,
      repeat: 0,
    });
  }

  private createTreasureMonsterSprite(x: number, y: number): void {
    this.sprite = this.scene.add.sprite(x, y, this.idleSpritesheetKey, 40);

    this.sprite.setOrigin(0.5, 0.5).setScale(0.75).setDepth(1).setInteractive();

    this.sprite.play(this.idleAnimationKey, true);
  }
  public getTutorialBounds(): Phaser.Geom.Rectangle | null {
    if (!this.sprite || !this.sprite.active) {
      return null;
    }

    const spriteBounds = this.sprite.getBounds();

    /*
     * Include the base Health bar and
     * level marker above the sprite.
     */
    return new Phaser.Geom.Rectangle(
      spriteBounds.x - 18,
      spriteBounds.y - 45,
      spriteBounds.width + 36,
      spriteBounds.height + 55,
    );
  }
}

export default Base;
