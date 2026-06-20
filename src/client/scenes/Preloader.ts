import { Scene } from 'phaser';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(512, 384, 'background');

    //  A simple progress bar. This is the outline of the bar.
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on('progress', (progress: number) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    //  Load the assets for the game - Replace with your own assets
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
    this.load.image('enemy_camp', 'images/enemy_camp1.png');
    this.load.image('enemy_base', 'images/enemy_base1.png');
    this.load.image('storm_shelter', 'images/storm_shelter.png');


    this.load.spritesheet('character1', 'sprites/character_1.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character2', 'sprites/character_2.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character3', 'sprites/character_3.png', { frameWidth: 400, frameHeight: 320 });
    this.load.spritesheet('character4', 'sprites/character_4.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character5', 'sprites/character_5.png', { frameWidth: 400, frameHeight: 264 });
    this.load.spritesheet('character6', 'sprites/character_6.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character7', 'sprites/character_7.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character8', 'sprites/character_8.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character9', 'sprites/character_9.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character10', 'sprites/character_10.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character11', 'sprites/character_11.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character12', 'sprites/character_12.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character13', 'sprites/character_13.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character14', 'sprites/character_14.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character15', 'sprites/character_15.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character16', 'sprites/character_16.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character17', 'sprites/character_17.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character18', 'sprites/character_18.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character19', 'sprites/character_19.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character20', 'sprites/character_20.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character21', 'sprites/character_21.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character22', 'sprites/character_22.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character23', 'sprites/character_23.png', { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet('character24', 'sprites/character_24.png', { frameWidth: 400, frameHeight: 400 });

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
    this.load.image('dino', 'images/characterIcons/dino.png');
    this.load.image('burningSlayer', 'images/characterIcons/burningSlayer.png');
    this.load.image('spectreMech', 'images/characterIcons/spectreMech.png');
    this.load.image('samuraiMech', 'images/characterIcons/samuraiMech.png');
    this.load.image('bahamutDragon', 'images/characterIcons/bahamutDragon.png');
    this.load.image('protowingedMech', 'images/characterIcons/protowingedMech.png');
    this.load.image('brutusMech', 'images/characterIcons/brutusMech.png');
    this.load.image('ravenMech', 'images/characterIcons/ravenMech.png');
    this.load.image('thunderEpicDragon', 'images/characterIcons/thunderEpicDragon.png');
    this.load.image('avengerMech', 'images/characterIcons/avengerMech.png');
    this.load.image('ninja', 'images/characterIcons/ninja.png');
    this.load.image('spartanWarriorMech', 'images/characterIcons/spartanWarriorMech.png');
    this.load.image('executionerMech', 'images/characterIcons/executionerMech.png');
    this.load.image('primeAutomech', 'images/characterIcons/primeAutomech.png');
    this.load.image('ignition', 'images/characterIcons/ignition.png');
    this.load.image('razorMech', 'images/characterIcons/razorMech.png');
    this.load.image('harvester', 'images/characterIcons/harvester.png');
    this.load.image('fireGodzillaMech', 'images/characterIcons/fireGodzillaMech.png');
    this.load.image('steelGladiator', 'images/characterIcons/steelGladiator.png');
    this.load.image('zProjectMech', 'images/characterIcons/zProjectMech.png');
    this.load.image('glaivestormMech', 'images/characterIcons/glaivestormMech.png');
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start('MainMenu');
  }
}
