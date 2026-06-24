import {
    GameObjects,
    Scene
} from 'phaser';

export class MainMenu
    extends Scene {
    private background:
        GameObjects.Image | null =
        null;

    private logo:
        GameObjects.Image | null =
        null;

    private title:
        GameObjects.Text | null =
        null;

    constructor() {
        super(
            'MainMenu'
        );
    }

    init(): void {
        this.background = null;
        this.logo = null;
        this.title = null;
    }

    create(): void {
        const width =
            this.scale.width;

        const height =
            this.scale.height;

        this.background =
            this.add
                .image(
                    0,
                    0,
                    'background'
                )
                .setOrigin(
                    0,
                    0
                )
                .setDisplaySize(
                    width,
                    height
                );

        this.logo =
            this.add.image(
                width / 2,
                height * 0.28,
                'logo'
            );

        this.title =
            this.add
                .text(
                    width / 2,
                    height * 0.49,
                    'The Young Raider',
                    {
                        fontFamily:
                            'Arial Black',

                        fontSize:
                            '38px',

                        color:
                            '#ffffff',

                        stroke:
                            '#000000',

                        strokeThickness:
                            8,

                        align:
                            'center'
                    }
                )
                .setOrigin(0.5);

        const createMenuButton = (
            y: number,
            text: string,
            backgroundColor: string
        ): GameObjects.Text => {
            return this.add
                .text(
                    width / 2,
                    y,
                    text,
                    {
                        font:
                            'bold 27px Orbitron',

                        color:
                            '#ffffff',

                        backgroundColor,

                        padding: {
                            x: 30,
                            y: 13
                        },

                        stroke:
                            '#000000',

                        strokeThickness:
                            4
                    }
                )
                .setOrigin(0.5)
                .setInteractive({
                    useHandCursor:
                        true
                });
        };

        const playButton =
            createMenuButton(
                height * 0.65,
                'PLAY',
                '#247f4c'
            );

        const collectionsButton =
            createMenuButton(
                height * 0.76,
                'COLLECTIONS',
                '#1d6f94'
            );

        const leaderboardButton =
            createMenuButton(
                height * 0.87,
                'LEADERBOARD',
                '#6943a5'
            );

        playButton.on(
            'pointerdown',
            () => {
                this.scene.start(
                    'Game'
                );
            }
        );

        collectionsButton.on(
            'pointerdown',
            () => {
                this.scene.start(
                    'Collections'
                );
            }
        );

        leaderboardButton.on(
            'pointerdown',
            () => {
                this.scene.start(
                    'Leaderboard'
                );
            }
        );
    }
}