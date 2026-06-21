import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene {
  private background: GameObjects.Image | null = null;
  private logo: GameObjects.Image | null = null;
  private title: GameObjects.Text | null = null;

  constructor() {
    super('MainMenu');
  }

  init(): void {
    this.background = null;
    this.logo = null;
    this.title = null;
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.background = this.add
      .image(0, 0, 'background')
      .setOrigin(0, 0)
      .setDisplaySize(width, height);

    this.logo = this.add
      .image(
        width / 2,
        height * 0.38,
        'logo'
      );

    this.title = this.add
      .text(
        width / 2,
        height * 0.6,
        'The Young Raider',
        {
          fontFamily: 'Arial Black',
          fontSize: '38px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 8,
          align: 'center',
        }
      )
      .setOrigin(0.5);

    const playButton = this.add
      .text(
        width / 2,
        height * 0.75,
        'PLAY',
        {
          fontFamily: 'Orbitron',
          fontSize: '48px',
          color: '#ffffff',
        }
      )
      .setOrigin(0.5)
      .setInteractive({
        useHandCursor: true,
      });

    const collectionsButton = this.add
      .text(
        width / 2,
        height * 0.85,
        'COLLECTIONS',
        {
          fontFamily: 'Orbitron',
          fontSize: '48px',
          color: '#ffffff',
        }
      )
      .setOrigin(0.5)
      .setInteractive({
        useHandCursor: true,
      });

    playButton.on('pointerdown', () => {
      this.scene.start('Game');
    });

    collectionsButton.on('pointerdown', () => {
      this.scene.start('Collections');
    });
  }
}