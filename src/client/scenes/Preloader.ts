import { Scene } from 'phaser';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  init(): void {
    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;

    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;

    this.add
      .image(centerX, centerY, 'background')
      .setDisplaySize(gameWidth, gameHeight);

    const progressBarWidth = 464;
    const progressBarHeight = 28;

    this.add
      .rectangle(
        centerX,
        centerY,
        progressBarWidth + 4,
        progressBarHeight + 4
      )
      .setStrokeStyle(2, 0xffffff);

    const progressBar = this.add
      .rectangle(
        centerX - progressBarWidth / 2,
        centerY,
        0,
        progressBarHeight,
        0xffffff
      )
      .setOrigin(0, 0.5);

    const loadingText = this.add
      .text(
        centerX,
        centerY - 45,
        'Loading 0%',
        {
          fontFamily: 'Arial',
          fontSize: '24px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 4,
        }
      )
      .setOrigin(0.5);

    this.load.on(
      'progress',
      (progress: number) => {
        progressBar.width =
          progressBarWidth * progress;

        loadingText.setText(
          `Loading ${Math.floor(progress * 100)}%`
        );
      }
    );

    this.load.once('complete', () => {
      progressBar.width = progressBarWidth;
      loadingText.setText('Loading 100%');
    });
  }

  preload() {
    this.load.setPath('../assets');

    this.load.image('logo', 'logo.png');

    this.load.image('enemy_camp', 'images/enemy_camp1.png');
    this.load.image(
      'enemy_base',
      'images/enemy_base1.png'
    );
    this.load.spritesheet(
      'character1',
      'sprites/character_1.png',
      {
        frameWidth: 400,
        frameHeight: 400
      }
    );
    this.load.spritesheet(
      'character3',
      'sprites/character_3.png',
      {
        frameWidth: 400,
        frameHeight: 320
      }
    );
    this.load.image('catastrophe', 'images/catastrophe.png');
    this.load.image('strengthen', 'images/strengthen.png');
    this.load.image('player', 'images/player.png');
    this.load.image('gold', 'images/gold.png');
    this.load.image('cash', 'images/cash.png');


    this.load.image('ocean', 'images/ocean.png');
    this.load.image('land', 'images/land2.png');

    this.load.image('mouse_cursor', 'images/mouse_cursor.png');
    this.load.image('mouse_cursor_attack', 'images/mouse_cursor_attack.png');
    this.load.image('storm_shelter', 'images/storm_shelter.png');


    this.load.spritesheet('character1', 'sprites/character_1.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character2', 'sprites/character_2.png', { frameWidth: 400, frameHeight: 400 });
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

    this.load.spritesheet(
      'test_idle',
      'images/test_idle.png',
      {
        frameWidth: 128,
        frameHeight: 128
      }
    );
    this.load.spritesheet(
      'test_moving',
      'images/test_moving.png',
      {
        frameWidth: 128,
        frameHeight: 128
      }
    );
    this.load.spritesheet(
      'test_attack',
      'images/test_attack.png',
      {
        frameWidth: 128,
        frameHeight: 128
      }
    );

    this.load.spritesheet(
      'test_death',
      'images/test_death.png',
      {
        frameWidth: 128,
        frameHeight: 128
      }
    );

    this.load.spritesheet(
      'test_slash',
      'images/test_slash.png',
      {
        frameWidth: 128,
        frameHeight: 128
      }
    );

    this.load.spritesheet(
      'test_dash',
      'images/test_dash.png',
      {
        frameWidth: 128,
        frameHeight: 128
      }
    );
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
  }

  create() {
    this.scene.start('MainMenu');
  }
}
