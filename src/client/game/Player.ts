import characterMap from './CharacterMap';
import Base from './Base';
import * as Phaser from 'phaser';

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
    constructor(
        scene: any,
        initialX: number,
        initialY: number,
        characterCode: number = 1,
        enemies: any[]
    ) {
        this.scene = scene;
        this.robotSprite = null;
        this.position = { x: initialX, y: initialY };
        this.currentTween = null;
        this.idleAnimationIndex = 0;
        this.lastAnimationChange = this.scene.activeGameTime;
        this.lastActionTime = this.scene.activeGameTime;
        this.lastDirection = null;
        this.directions = [];
        this.directionAveragingSteps = 10;
        this.characterCode = characterCode;
        const character = characterMap[this.characterCode];
        this.range = character.range;
        this.speed = character.speed;
        this.originalSpeed = character.speed;
        this.originalDamage = character.damage;
        this.damage = character.damage;
        this.attackSpeed = character.attackSpeed;
        this.originalAttackSpeed = character.attackSpeed;
        this.spritesheetKey = character.spritesheetKey;
        this.isAttacking = false;
        this.attackEvent = null;
        this.originalHealth = character.health;
        this.maxHealth = character.health;
        this.currentHealth = character.health;
        this.healthBar = null;
        this.isDead = false;
        this.idleAnimations = ['idle1', 'idle2', 'idle3', 'idle4'];
        this.isMovingTowardsEnemy = false;
        this.continueAttacking = false;
        this.attackAnimationComplete = true;
        this.projectile = character.projectile;
        this.attackCount = character.attackCount;
        this.enemies = enemies;
        this.targetedEnemy = null;
        this.name = character.name;
        this.icon = character.icon;
        this.isImmuneToStorms = false;
        this.healPercentage = 0.05;
    }

    create() {
        [
            'idle1', 'idle2', 'idle3', 'idle4',
            'movesoutheast', 'movesouthwest',
            'movesouth', 'moveeast', 'movewest',
            'movenortheast', 'movenorthwest',
            'movenorth',
            'attacksoutheast', 'attacksouthwest',
            'attacksouth', 'attackeast',
            'attackwest', 'attacknortheast',
            'attacknorthwest', 'attacknorth', 'death'
        ].forEach(key => {
            if (this.scene.anims.exists(key)) {
                this.scene.anims.remove(key);
            }
        });
        this.robotSprite = this.scene.add.sprite(this.position.x, this.position.y, this.spritesheetKey);
        this.robotSprite.setOrigin(0.5, 0.5);
        this.robotSprite.setDepth(1);
        if (!this.scene.anims.exists('idle1')) {
            for (let i = 0; i < 4; i++) {
                this.scene.anims.create({
                    key: `idle${i + 1}`,
                    frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: i * 5, end: i * 5 + 4 }),
                    frameRate: 6,
                    repeat: -1,
                }); // the above code looops through the idle animation and creates a new animation for each of the 4 directions
            }
        }
        const randomIdleAnimation = this.idleAnimations[Math.floor(Math.random() * this.idleAnimations.length)];
        this.robotSprite.play(randomIdleAnimation);
        this.lastAnimationChange = this.scene.activeGameTime;


        const directions = ['southeast', 'southwest', 'south', 'east', 'west', 'northeast', 'northwest', 'north'];
        if (!this.scene.anims.exists('moveeast')) {
            directions.forEach((dir: any, index: any) => {
                this.scene.anims.create({
                    key: `move${dir}`,
                    frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: 20 + (index * 5), end: 20 + (index * 5) + 4 }),
                    frameRate: 6,
                    repeat: -1
                });
            });
        }

        // Create attacking animations
        if (!this.scene.anims.exists('attackeast')) {
            directions.forEach((dir: any, index: any) => {
                this.scene.anims.create({
                    key: `attack${dir}`,
                    frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: 60 + (index * 5), end: 60 + (index * 5) + 4 }),
                    frameRate: 6 * this.originalAttackSpeed,
                    repeat: 0
                });
            });
        }

        // Create death animation
        if (!this.scene.anims.exists('death')) {
            this.scene.anims.create({
                key: 'death',
                frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: 100, end: 105 }), // 105 does not exist. i use it to hide the final frame
                frameRate: 4,
                repeat: 0
            });
        }

        this.createHealthBar();
        this.detectionField = this.scene.add.circle(
            this.position.x,
            this.position.y,
            this.range
        );
        this.detectionField.setStrokeStyle(4, 0xff0000);

        this.healTimer = this.scene.time.addEvent({
            delay: 3000,
            callback: this.autoHeal,
            callbackScope: this,
            loop: true,
            paused: true // start at paused
        });

    }

    autoHeal(): void {
        if (this.currentHealth < this.maxHealth && !this.isDead) {
            // calc heal amount as 5% of max health
            let healAmount = Math.round(this.maxHealth * this.healPercentage);

            healAmount = Math.min(healAmount, this.maxHealth - this.currentHealth);

            this.currentHealth += healAmount;
            this.updateHealthBar();
            this.createHealingText(healAmount);
        }
    }

    resetHealTimer() {
        this.healTimer.reset({
            delay: 4000,
            callback: this.autoHeal,
            callbackScope: this,
            loop: true
        });
        this.healTimer.paused = false;
    }


    createHealingText(amount: number) {
        const healingText = this.scene.add.text(this.robotSprite.x, this.robotSprite.y - 100, `+${amount}`, { font: '36px Orbitron', fill: '#00ff00' });
        healingText.setOrigin(0.5, 0.5);
        healingText.setDepth(1);
        this.scene.tweens.add({
            targets: healingText,
            y: healingText.y - 30,
            alpha: 0,
            duration: 4000,
            ease: 'Power2',
            onComplete: () => {
                healingText.destroy();
            }
        });
    }

    moveStraight(
        newX: any,
        newY: any,
        onCompleteCallback: any = null
    ) {
        if (this.isDead) return;
        if (this.currentTween && this.currentTween.isPlaying() && !this.scene.cancelClick) {
            return;
        }
        if (this.currentTween) {
            this.currentTween.stop();
        }
        this.stopAttackingEnemy();

        const currentAnim = this.robotSprite.anims.currentAnim;
        const hasReachedTarget = Math.round(this.robotSprite.x) === Math.round(newX) && Math.round(this.robotSprite.y) === Math.round(newY);

        // Check if already at the target and playing an idle animation
        if (hasReachedTarget && currentAnim && currentAnim.key.startsWith('idle')) {
            return; // Do nothing if already at the target and idle
        }


        if (currentAnim && currentAnim.key.startsWith('idle') || currentAnim.key.startsWith('attack')) {
            if (this.lastDirection !== null) {
                this.robotSprite.play(`move${this.lastDirection}`);
            }
        }

        let targetDistance = Phaser.Math.Distance.Between(this.robotSprite.x, this.robotSprite.y, newX, newY);

        if (this.scene.enemyClicked && targetDistance <= this.range) {
            this.isMovingTowardsEnemy = true;
            // this.playAttackAnimation(this.scene.enemy);
            return; // Don't continue moving
        } else if (this.scene.enemyClicked && targetDistance > this.range) {
            this.isMovingTowardsEnemy = true;
            // Adjust the target position to stop at the attack range
            let angleToTarget = Phaser.Math.Angle.Between(this.robotSprite.x, this.robotSprite.y, newX, newY);
            newX = this.robotSprite.x + Math.cos(angleToTarget) * (targetDistance - this.range);
            newY = this.robotSprite.y + Math.sin(angleToTarget) * (targetDistance - this.range);
        }

        const direction = this.determineDirection(newX, newY);

        // Check if the player is already moving in the same direction. this prevents player from restarting animation if its already on same direction
        if (this.lastDirection !== direction) {
            this.robotSprite.play(`move${direction}`);
            this.lastDirection = direction;
        }

        let distance = Phaser.Math.Distance.Between(this.robotSprite.x, this.robotSprite.y, newX, newY);
        let duration = distance / this.speed * 1000;  // Duration based on speed

        this.currentTween = this.scene.tweens.add({
            targets: this.robotSprite,
            x: newX,
            y: newY,
            duration: duration,
            ease: 'Linear',
            onUpdate: () => {
                this.updatePosition();
            },
            onComplete: () => {
                if (this.isDead) return;

                if (!this.scene.enemyClicked) {
                    if (Math.round(this.robotSprite.x) === Math.round(newX) && Math.round(this.robotSprite.y) === Math.round(newY)) {
                        // Play a random idle animation
                        const randomIdleAnimation = this.idleAnimations[Math.floor(Math.random() * this.idleAnimations.length)];
                        this.robotSprite.play(randomIdleAnimation);
                    }
                }
                if (onCompleteCallback) {
                    onCompleteCallback();
                }
            }
        });

        this.lastActionTime = this.scene.activeGameTime; // Reset last action time on movement
    }

    playAttackAnimation(targetEnemy: any) {
        const direction = this.determineDirectionToEnemy(targetEnemy);
        const attackAnimationKey = `attack${direction}`;
        if (this.isAttacking && !this.attackAnimationComplete && this.targetedEnemy === targetEnemy) {
            return;
        }
        this.isAttacking = true;
        this.attackAnimationComplete = false;
        this.attackingWho = targetEnemy;
        const frameRateRatio = this.attackSpeed / this.originalAttackSpeed;

        this.robotSprite.anims.play(attackAnimationKey);
        this.robotSprite.anims.msPerFrame = this.robotSprite.anims.msPerFrame / frameRateRatio;

        this.robotSprite.off('animationupdate');
        this.robotSprite.off('animationcomplete');

        let damageFrames = [];
        if (this.attackCount > 1 && !this.projectile) { // multi strikes usually applies to melee attacks
            for (let i = 1; i <= this.attackCount; i++) {
                damageFrames.push(Math.ceil((5 / this.attackCount) * i)); // 5 / (2) * 1 = 2.5. round upwards to 3
            }
        } else if (!this.projectile) {
            // Default to last frame for single attack
            damageFrames.push(5);
        }

        this.robotSprite.on('animationupdate', (anim: any, frame: any) => {
            if (anim.key === attackAnimationKey) {
                if (this.projectile && this.projectile !== '' && frame.index === 4) {
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

        this.robotSprite.once('animationcomplete', (anim: any) => {
            if (anim.key === attackAnimationKey) {
                this.attackAnimationComplete = true;
                if (!this.projectile) {
                    this.robotSprite.play(attackAnimationKey);
                }
            }
        });
    }

    launchProjectile(enemy: any) {
        if (!enemy) return;
        let projectile = this.scene.add.sprite(this.robotSprite.x + 10, this.robotSprite.y - 80, this.projectile);
        projectile.setOrigin(0.5, 0.5);
        projectile.setScale(0.5);

        let targetX = enemy.sprite.x;
        let targetY = enemy.sprite.y;
        let angle = Phaser.Math.Angle.Between(this.robotSprite.x, this.robotSprite.y, targetX, targetY);

        projectile.setRotation(angle); // 90 deg.

        // Calculate a more realistic impact point instead of the center of the enemy
        const enemyWidth = enemy.sprite.width;
        const enemyHeight = enemy.sprite.height;
        const impactOffsetX = enemyWidth / 2 * Math.cos(angle); // ratio of the adjacent side to the hypotenuse of a right-angled triangle. gives x offset
        const impactOffsetY = enemyHeight / 2 * Math.sin(angle); // ratio of the opposite side to the hypotenuse of a right-angled triangle gives y offset
        targetX -= impactOffsetX;
        targetY -= impactOffsetY;

        this.scene.tweens.add({
            targets: projectile,
            x: targetX,
            y: targetY,
            duration: 500,
            ease: 'Linear',
            onComplete: () => {
                if (enemy) {
                    enemy.takeDamage(this.damage, this); // apply damage when projectile hits
                }
                projectile.destroy(); // after hitting the target
            }
        });
    }

    stopAttackingEnemy() {
        this.isMovingTowardsEnemy = false;
        this.continueAttacking = false;
        this.isAttacking = false;
        this.attackingWho = null;
        if (this.attackEvent) {
            this.attackEvent.remove(false);
            this.attackEvent = null;
        }
        const currentAnim = this.robotSprite.anims.currentAnim;
        if (currentAnim && currentAnim.key.startsWith('attack')) {
            const randomIdleAnimation = this.idleAnimations[Math.floor(Math.random() * this.idleAnimations.length)];
            this.robotSprite.play(randomIdleAnimation);
        }
    }

    calculateAverageDirection(directions: any[]) {
        // Calculate the most frequent direction in the array
        const directionCounts = directions.reduce(
            (acc: any, dir: any) => {
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

    determineDirection(
        newX: number,
        newY: number
    ) {
        const dx = newX - this.position.x;
        const dy = newY - this.position.y;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        if (angle >= -22.5 && angle < 22.5) return 'east';
        if (angle >= 22.5 && angle < 67.5) return 'southeast';
        if (angle >= 67.5 && angle < 112.5) return 'south';
        if (angle >= 112.5 && angle < 157.5) return 'southwest';
        if (angle >= 157.5 || angle < -157.5) return 'west';
        if (angle >= -157.5 && angle < -112.5) return 'northwest';
        if (angle >= -112.5 && angle < -67.5) return 'north';
        if (angle >= -67.5 && angle < -22.5) return 'northeast';
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
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        if (angle >= -22.5 && angle < 22.5) return 'east';
        if (angle >= 22.5 && angle < 67.5) return 'southeast';
        if (angle >= 67.5 && angle < 112.5) return 'south';
        if (angle >= 112.5 && angle < 157.5) return 'southwest';
        if (angle >= 157.5 || angle < -157.5) return 'west';
        if (angle >= -157.5 && angle < -112.5) return 'northwest';
        if (angle >= -112.5 && angle < -67.5) return 'north';
        if (angle >= -67.5 && angle < -22.5) return 'northeast';
    }

    updatePosition() {
        if (this.isDead) return;
        this.position.x = this.robotSprite.x;
        this.position.y = this.robotSprite.y;
    }

    getPosition() {
        return this.robotSprite ? { x: this.robotSprite.x, y: this.robotSprite.y } : this.position;
    }

    createHealthBar() {
        this.healthBar = this.scene.add.graphics();  // Create the graphics object, but don't draw anything yet

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

    takeDamage(damage: any, source: any) {
        if (this.isDead) return;
        if (this.isImmuneToStorms && source === 'catastrophe') { // legendary item was purchased
            return;
        }
        let wasAtFullHealth = this.currentHealth === this.maxHealth;

        this.currentHealth -= damage;
        this.currentHealth = Math.max(this.currentHealth, 0);

        const color = source === 'catastrophe' ? '#ff0' : '#000'; // Yellow for catastrophe, black for others
        this.createDamageText(damage, color);

        if (wasAtFullHealth) {
            this.resetHealTimer(); // to prevent instantly healing after taking damage from full health
        }
        if (this.currentHealth <= 0 && !this.isDead) {
            this.die();
        }

        this.updateHealthBar();
    }

    createDamageText(damage: any, color: any) {
        const damageText = this.scene.add.text(this.robotSprite.x, this.robotSprite.y - 100, `-${damage}`, { font: '36px Orbitron', fill: color });
        damageText.setOrigin(0.5, 0.5);
        damageText.setDepth(1);
        // Animation for damage text (move up and fade out)
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 30, // Move up
            alpha: 0, // Fade out
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                damageText.destroy(); // Remove the text object
            }
        });
    }

    die() {
        if (this.isDead) return;

        this.isDead = true;
        console.log('Player died');

        // Stop any ongoing movement
        if (this.moveTween) {
            this.moveTween.stop();
        }
        this.isMoving = false;

        // Stop any ongoing animation and play the death animation
        this.robotSprite.stop();
        this.robotSprite.play(`death`);

        if (this.attacker && !this.attacker.isDead && this.isDead) {
            this.attacker.stopAttackingPlayer();
        }

        this.healthBar.destroy();

        this.scene.scene.get('BattleUI').createGameOverScreen();
    }

    update(time: any, delta: any) {
        this.detectionField.setPosition(this.robotSprite.x, this.robotSprite.y);
        const isMoving = this.currentTween && this.currentTween.isPlaying();
        const isAttacking = this.robotSprite.anims.isPlaying && this.robotSprite.anims.currentAnim.key.startsWith('attack');

        if (!isMoving && !isAttacking && !this.isDead) {
            if (time - this.lastActionTime > 2500) { // 2.5 seconds of inactivity
                if (time - this.lastAnimationChange > 2500) {
                    this.idleAnimationIndex = (this.idleAnimationIndex + 1) % 4;
                    this.robotSprite.play(`idle${this.idleAnimationIndex + 1}`);
                    this.lastAnimationChange = time;
                }
            }
        } else {
            this.lastActionTime = time; // Reset the last action time if the player is moving or attacking
        }

        if (this.currentTween && this.currentTween.isPlaying()) {
            this.robotSprite.setPosition(this.position.x, this.position.y);
        }
        const currentAnim = this.robotSprite.anims.currentAnim;
        if (!currentAnim || !currentAnim.key.startsWith('attack')) {
            this.isAttacking = false;
        }

        // Check if the player is moving towards the targeted enemy
        if (!this.isDead && this.targetedEnemy && (this.targetedEnemy.returningToCamp || this.targetedEnemy.inCamp || this.targetedEnemy instanceof Base)) {
            //console.log('Targeted enemy is returning to camp');
            let enemyPosition = this.targetedEnemy.getPosition();
            let distanceToEnemy = Phaser.Math.Distance.Between(this.position.x, this.position.y, enemyPosition.x, enemyPosition.y);
            if (distanceToEnemy <= this.range) {
                if (this.currentTween) {
                    this.currentTween.stop();
                }
                this.isMovingTowardsEnemy = false;
                this.continueAttacking = true;
                this.playAttackAnimation(this.targetedEnemy); // Attack the targeted enemy
            } else {
                this.scene.cancelClick = false;
                this.moveStraight(enemyPosition.x, enemyPosition.y);
            }

        } else if (this.isMovingTowardsEnemy && !this.isDead && this.targetedEnemy && !this.targetedEnemy.returningToCamp && !this.targetedEnemy.inCamp) {
            let enemyPosition = this.targetedEnemy.getPosition();
            let distanceToEnemy = Phaser.Math.Distance.Between(this.position.x, this.position.y, enemyPosition.x, enemyPosition.y);
            if (distanceToEnemy <= this.range) {
                if (this.currentTween) {
                    this.currentTween.stop();
                }
                this.isMovingTowardsEnemy = false;
                this.continueAttacking = true;
                this.playAttackAnimation(this.targetedEnemy); // Attack the targeted enemy
            }
        }


        if (this.continueAttacking && !this.isDead && this.targetedEnemy) {
            this.playAttackAnimation(this.targetedEnemy); // Continue attacking the targeted enemy
        }

        this.updateHealthBar();
    }
}


export default Player;

