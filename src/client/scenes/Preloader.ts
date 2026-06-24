import { GameObjects, Loader, Scene } from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    init(): void {
        const width = this.scale.width;
        const height = this.scale.height;

        const centerX = width / 2;
        const centerY = height / 2;

        // background
        this.add.image(centerX, centerY, 'background').setDisplaySize(width, height);

        this.add.rectangle(0, 0, width, height, 0x030a10, 0.76).setOrigin(0, 0);

        // cyan glow
        const backgroundGlow = this.add.ellipse(
            centerX,
            centerY,
            Math.min(850, width * 0.86),
            Math.min(480, height * 0.7),
            0x2193c2,
            0.12
        );

        this.tweens.add({
            targets: backgroundGlow,
            scaleX: {
                from: 0.94,
                to: 1.06,
            },
            scaleY: {
                from: 0.92,
                to: 1.08,
            },
            alpha: {
                from: 0.07,
                to: 0.15,
            },
            duration: 2600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        const cardWidth = Math.min(720, width - 60);
        const cardHeight = Math.min(370, height - 70);

        this.add
            .rectangle(centerX + 8, centerY + 10, cardWidth, cardHeight, 0x000000, 0.58)
            .setOrigin(0.5);

        const cardGraphics = this.add.graphics();

        cardGraphics.fillStyle(0x0b1c29, 0.97);

        cardGraphics.fillRoundedRect(
            centerX - cardWidth / 2,
            centerY - cardHeight / 2,
            cardWidth,
            cardHeight,
            24
        );

        cardGraphics.lineStyle(2, 0x55d7ff, 0.72);

        cardGraphics.strokeRoundedRect(
            centerX - cardWidth / 2,
            centerY - cardHeight / 2,
            cardWidth,
            cardHeight,
            24
        );

        const innerGraphics = this.add.graphics();

        innerGraphics.fillStyle(0x112737, 0.28);

        innerGraphics.fillRoundedRect(
            centerX - cardWidth / 2 + 8,
            centerY - cardHeight / 2 + 8,
            cardWidth - 16,
            cardHeight - 16,
            18
        );

        const topLine = this.add.rectangle(
            centerX,
            centerY - cardHeight / 2 + 3,
            cardWidth * 0.72,
            2,
            0x55d7ff,
            0.9
        );

        this.tweens.add({
            targets: topLine,
            alpha: {
                from: 0.4,
                to: 1,
            },
            scaleX: {
                from: 0.9,
                to: 1,
            },
            duration: 1900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        this.add
            .text(centerX, centerY - 118, 'PREPARING YOUR RAID', {
                font: 'bold 12px Orbitron',
                color: '#a9efff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center',
            })
            .setOrigin(0.5);

        const title = this.add
            .text(centerX, centerY - 72, 'THE YOUNG RAIDER', {
                font: 'bold 36px Orbitron',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 7,
                align: 'center',
            })
            .setOrigin(0.5);

        title.setShadow(0, 3, '#000000', 5, true, true);

        this.add
            .text(
                centerX,
                centerY - 28,
                'Loading enemies, abilities and battlefield resources...',
                {
                    font: '14px Arial',
                    color: '#b9cfda',
                    stroke: '#000000',
                    strokeThickness: 2,
                    align: 'center',
                    wordWrap: {
                        width: cardWidth - 90,
                    },
                }
            )
            .setOrigin(0.5);

        const progressBarWidth = Math.min(520, cardWidth - 90);

        const progressBarHeight = 25;

        const progressBarX = centerX - progressBarWidth / 2;

        const progressBarY = centerY + 42;

        const trackShadow = this.add.graphics();

        trackShadow.fillStyle(0x000000, 0.55);

        trackShadow.fillRoundedRect(
            progressBarX + 3,
            progressBarY + 4,
            progressBarWidth,
            progressBarHeight,
            12
        );

        const trackGraphics = this.add.graphics();

        trackGraphics.fillStyle(0x06131d, 0.96);

        trackGraphics.fillRoundedRect(
            progressBarX,
            progressBarY,
            progressBarWidth,
            progressBarHeight,
            12
        );

        trackGraphics.lineStyle(2, 0x55d7ff, 0.38);

        trackGraphics.strokeRoundedRect(
            progressBarX,
            progressBarY,
            progressBarWidth,
            progressBarHeight,
            12
        );

        const progressFill = this.add.graphics();

        // small highlight which moves along the filled region.
        const progressGlow = this.add
            .rectangle(
                progressBarX,
                progressBarY + progressBarHeight / 2,
                24,
                progressBarHeight - 7,
                0xffffff,
                0.18
            )
            .setOrigin(0.5)
            .setVisible(false);

        const percentageText = this.add
            .text(centerX, progressBarY + progressBarHeight / 2, '0%', {
                font: 'bold 12px Orbitron',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
            })
            .setOrigin(0.5);

        const statusText = this.add
            .text(centerX, progressBarY + 52, 'Starting asset loader...', {
                font: '12px Orbitron',
                color: '#8faab7',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'center',
            })
            .setOrigin(0.5);

        // Animated dots
        const dots: GameObjects.Arc[] = [];

        for (let index = 0; index < 3; index++) {
            const dot = this.add.circle(
                centerX - 18 + index * 18,
                progressBarY + 86,
                3,
                0x76dcff,
                0.7
            );

            dots.push(dot);

            this.tweens.add({
                targets: dot,
                y: dot.y - 7,
                alpha: {
                    from: 0.25,
                    to: 1,
                },
                duration: 650,
                delay: index * 180,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
        }

        const drawProgress = (progress: number): void => {
            const clampedProgress = Math.max(0, Math.min(1, progress));

            const fillWidth = progressBarWidth * clampedProgress;

            progressFill.clear();

            if (fillWidth > 0) {
                progressFill.fillStyle(0x39c86d, 1);

                progressFill.fillRoundedRect(
                    progressBarX + 3,
                    progressBarY + 3,
                    Math.max(6, fillWidth - 6),
                    progressBarHeight - 6,
                    9
                );

                // gradient
                progressFill.fillStyle(0x72e59a, 0.32);

                progressFill.fillRoundedRect(
                    progressBarX + 5,
                    progressBarY + 5,
                    Math.max(2, fillWidth - 10),
                    Math.max(3, progressBarHeight * 0.3),
                    7
                );

                progressGlow
                    .setVisible(true)
                    .setX(
                        Math.min(
                            progressBarX + fillWidth - 13,
                            progressBarX + progressBarWidth - 13
                        )
                    );
            } else {
                progressGlow.setVisible(false);
            }
        };

        this.load.on('progress', (progress: number) => {
            drawProgress(progress);

            const percentage = Math.floor(progress * 100);

            percentageText.setText(`${percentage}%`);

            if (percentage < 20) {
                statusText.setText('Preparing the battlefield...');
            } else if (percentage < 45) {
                statusText.setText('Loading Raider abilities...');
            } else if (percentage < 70) {
                statusText.setText('Summoning enemies...');
            } else if (percentage < 90) {
                statusText.setText('Preparing upgrades and rewards...');
            } else {
                statusText.setText('Finalising your raid...');
            }
        });

        this.load.once('complete', () => {
            drawProgress(1);

            percentageText.setText('100%');

            statusText.setText('Raid ready!').setColor('#8cffad');

            progressGlow.setVisible(false);

            dots.forEach((dot) => {
                dot.setFillStyle(0x8cffad, 1);
            });
        });

        this.load.on('loaderror', (file: Loader.File) => {
            console.error('[Preloader] Failed to load:', file.key, file.src);

            statusText.setText(`Failed to load ${file.key}`).setColor('#ff8f8f');
        });
    }

    async create(): Promise<void> {
        try {
            await Promise.all([
                document.fonts.load('400 14px Orbitron'),

                document.fonts.load('700 18px Orbitron'),
            ]);

            await document.fonts.ready;
        } catch (error) {
            console.error('[Preloader] Failed to load Orbitron:', error);
        }

        this.time.delayedCall(180, () => {
            this.scene.start('MainMenu');
        });
    }

    preload() {
        this.load.setPath('../assets');

        this.load.image('logo', 'logo.png');

        this.load.image('enemy_camp', 'images/enemy_camp.png');
        this.load.spritesheet('character3', 'sprites/character_3.png', {
            frameWidth: 400,
            frameHeight: 320,
        });

        this.load.image('ocean', 'images/ocean.png');
        this.load.image('land', 'images/land2.png');

        this.load.image('mouse_cursor', 'images/mouse_cursor.png');
        this.load.image('mouse_cursor_attack', 'images/mouse_cursor_attack.png');

        this.load.spritesheet('character1', 'sprites/character_1.png', {
            frameWidth: 400,
            frameHeight: 400,
        });
        this.load.spritesheet('character2', 'sprites/character_2.png', {
            frameWidth: 400,
            frameHeight: 400,
        });
        // this.load.spritesheet('character3', 'sprites/character_3.png', { frameWidth: 400, frameHeight: 320 });
        // this.load.spritesheet('character4', 'sprites/character_4.png', { frameWidth: 400, frameHeight: 400 });
        // this.load.spritesheet('character5', 'sprites/character_5.png', { frameWidth: 400, frameHeight: 264 });
        // this.load.spritesheet('character6', 'sprites/character_6.png', { frameWidth: 400, frameHeight: 400 });
        // this.load.spritesheet('character7', 'sprites/character_7.png', { frameWidth: 400, frameHeight: 400 });
        // this.load.spritesheet('character8', 'sprites/character_8.png', { frameWidth: 400, frameHeight: 400 });
        // this.load.spritesheet('character9', 'sprites/character_9.png', { frameWidth: 400, frameHeight: 400 });
        // this.load.spritesheet('character10', 'sprites/character_10.png', { frameWidth: 400, frameHeight: 400 });
        // this.load.spritesheet('character11', 'sprites/character_11.png', { frameWidth: 400, frameHeight: 400 });
        // this.load.spritesheet('character12', 'sprites/character_12.png', { frameWidth: 400, frameHeight: 400 });
        // this.load.spritesheet('character13', 'sprites/character_13.png', { frameWidth: 400, frameHeight: 400 });
        // this.load.spritesheet('character14', 'sprites/character_14.png', { frameWidth: 400, frameHeight: 400 });
        // this.load.spritesheet('character15', 'sprites/character_15.png', { frameWidth: 400, frameHeight: 400 });
        // this.load.spritesheet('character16', 'sprites/character_16.png', { frameWidth: 400, frameHeight: 400 });
        // this.load.spritesheet('character17', 'sprites/character_17.png', { frameWidth: 400, frameHeight: 400 });
        // this.load.spritesheet('character18', 'sprites/character_18.png', { frameWidth: 400, frameHeight: 400 });
        // this.load.spritesheet('character19', 'sprites/character_19.png', { frameWidth: 400, frameHeight: 400 });
        // this.load.spritesheet('character20', 'sprites/character_20.png', { frameWidth: 400, frameHeight: 400 });
        // this.load.spritesheet('character21', 'sprites/character_21.png', { frameWidth: 400, frameHeight: 400 });
        // this.load.spritesheet('character22', 'sprites/character_22.png', { frameWidth: 400, frameHeight: 400 });
        // this.load.spritesheet('character23', 'sprites/character_23.png', { frameWidth: 400, frameHeight: 400 });
        // this.load.spritesheet('character24', 'sprites/character_24.png', { frameWidth: 400, frameHeight: 400 });

        this.load.image('blueBullet', 'projectiles/blue_bullet.png');
        this.load.image('fireball', 'projectiles/fireball.png');
        this.load.image('flame', 'projectiles/flame.png');
        this.load.image('bluePlasmaBall', 'projectiles/blue_plasma_ball.png');
        this.load.image('redPlasmaBall', 'projectiles/red_plasma_ball.png');

        this.load.image('catastrophe', 'images/catastrophe.png');
        this.load.image('strengthen', 'images/strengthen.png');
        this.load.image('player', 'images/player.png');
        this.load.image('gold', 'images/gold.png');
        this.load.image('cash', 'images/cash.png');

        this.load.image('sword1', 'images/sword1.png');
        this.load.image('sword2', 'images/sword2.png');
        this.load.image('health1', 'images/health1.png');
        this.load.image('health2', 'images/health2.png');
        this.load.image('attackSpeed1', 'images/attackSpeed1.png');
        this.load.image('attackSpeed2', 'images/attackSpeed2.png');
        this.load.image('moveSpeed1', 'images/moveSpeed1.png');
        this.load.image('moveSpeed2', 'images/moveSpeed2.png');
        this.load.image('thunderlordSeal', 'images/thunderlordSeal.png');
        this.load.image('elixirOfLife', 'images/elixirOfLife.png');
        this.load.image('winterFrost', 'images/winterFrost.png');
        this.load.image('treasureFinder', 'images/treasureFinder.png');

        this.load.image('darkEtherMessiah', 'images/characterIcons/darkEtherMessiah.png');
        this.load.image('orc', 'images/characterIcons/orc.png');

        this.load.spritesheet('test_idle', 'images/test_idle.png', {
            frameWidth: 128,
            frameHeight: 128,
        });
        this.load.spritesheet('test_moving', 'images/test_moving.png', {
            frameWidth: 128,
            frameHeight: 128,
        });
        this.load.spritesheet('test_attack', 'images/test_attack.png', {
            frameWidth: 128,
            frameHeight: 128,
        });

        this.load.spritesheet('test_death', 'images/test_death.png', {
            frameWidth: 128,
            frameHeight: 128,
        });

        this.load.spritesheet('test_slash', 'images/test_slash.png', {
            frameWidth: 128,
            frameHeight: 128,
        });

        this.load.spritesheet('test_dash', 'images/test_dash.png', {
            frameWidth: 128,
            frameHeight: 128,
        });

        this.load.spritesheet('test_shield', 'images/test_shield.png', {
            frameWidth: 128,
            frameHeight: 128,
        });

        this.load.spritesheet('test_shield_move', 'images/test_shield_move.png', {
            frameWidth: 128,
            frameHeight: 128,
        });
        // this.load.image('dino', 'images/characterIcons/dino.png');
        // this.load.image('burningSlayer', 'images/characterIcons/burningSlayer.png');
        // this.load.image('spectreMech', 'images/characterIcons/spectreMech.png');
        // this.load.image('samuraiMech', 'images/characterIcons/samuraiMech.png');
        // this.load.image('bahamutDragon', 'images/characterIcons/bahamutDragon.png');
        // this.load.image('protowingedMech', 'images/characterIcons/protowingedMech.png');
        // this.load.image('brutusMech', 'images/characterIcons/brutusMech.png');
        // this.load.image('ravenMech', 'images/characterIcons/ravenMech.png');
        // this.load.image('thunderEpicDragon', 'images/characterIcons/thunderEpicDragon.png');
        // this.load.image('avengerMech', 'images/characterIcons/avengerMech.png');
        // this.load.image('ninja', 'images/characterIcons/ninja.png');
        // this.load.image('spartanWarriorMech', 'images/characterIcons/spartanWarriorMech.png');
        // this.load.image('executionerMech', 'images/characterIcons/executionerMech.png');
        // this.load.image('primeAutomech', 'images/characterIcons/primeAutomech.png');
        // this.load.image('ignition', 'images/characterIcons/ignition.png');
        // this.load.image('razorMech', 'images/characterIcons/razorMech.png');
        // this.load.image('harvester', 'images/characterIcons/harvester.png');
        // this.load.image('fireGodzillaMech', 'images/characterIcons/fireGodzillaMech.png');
        // this.load.image('steelGladiator', 'images/characterIcons/steelGladiator.png');
        // this.load.image('zProjectMech', 'images/characterIcons/zProjectMech.png');
        // this.load.image('glaivestormMech', 'images/characterIcons/glaivestormMech.png');

        this.load.spritesheet('treasure_monster_idle', 'images/treasure_monster_idle.png', {
            frameWidth: 128,
            frameHeight: 128,
        });

        this.load.spritesheet('treasure_monster_death', 'images/treasure_monster_death.png', {
            frameWidth: 128,
            frameHeight: 128,
        });

        this.load.spritesheet('enemy1_idle', 'images/enemy1_idle.png', {
            frameWidth: 128,
            frameHeight: 128,
        });

        this.load.spritesheet('enemy1_move', 'images/enemy1_move.png', {
            frameWidth: 128,
            frameHeight: 128,
        });

        this.load.spritesheet('enemy1_attack', 'images/enemy1_attack.png', {
            frameWidth: 128,
            frameHeight: 128,
        });

        this.load.spritesheet('enemy1_die', 'images/enemy1_die.png', {
            frameWidth: 128,
            frameHeight: 128,
        });
    }
}
