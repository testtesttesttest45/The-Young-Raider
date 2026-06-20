import { Scene } from 'phaser';
import characterMap from '../game/CharacterMap';

export class Collections extends Scene {

    selectedCharacter = 1;

    preview!: Phaser.GameObjects.Sprite;

    constructor() {
        super('Collections');
    }

    createPreviewAnimation(
        spriteKey: string
    ): string {

        const animKey =
            `${spriteKey}_preview`;

        if (!this.anims.exists(animKey)) {

            this.anims.create({
                key: animKey,
                frames:
                    this.anims.generateFrameNumbers(
                        spriteKey,
                        {
                            start: 10,
                            end: 14
                        }
                    ),
                frameRate: 6,
                repeat: -1
            });
        }

        return animKey;
    }

    create() {

        const width =
            this.scale.width;

        const height =
            this.scale.height;

        this.cameras.main.setBackgroundColor(
            '#1a1a1a'
        );

        // TITLE

        this.add.text(
            width / 2,
            40,
            'COLLECTIONS',
            {
                fontSize: '40px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        // BACK BUTTON

        const backButton =
            this.add.text(
                40,
                40,
                '< BACK',
                {
                    fontSize: '24px',
                    color: '#ffffff'
                }
            )
                .setInteractive();

        backButton.on(
            'pointerdown',
            () => {
                this.scene.start(
                    'MainMenu'
                );
            }
        );

        // DEFAULT CHARACTER

        const firstCharacter =
            characterMap[1];

        // PREVIEW SPRITE

        this.preview =
            this.add.sprite(
                width - 250,
                height / 2 - 100,
                firstCharacter.spritesheetKey
            );


        this.preview.play(
            this.createPreviewAnimation(
                firstCharacter.spritesheetKey
            )
        );

        // NAME

        const nameText =
            this.add.text(
                width - 250,
                height / 2 + 80,
                firstCharacter.name,
                {
                    fontSize: '28px',
                    color: '#ffffff'
                }
            )
                .setOrigin(0.5);

        const descText =
            this.add.text(
                width - 250,
                height / 2 + 170,
                characterMap[1].description,
                {
                    fontSize: '16px',
                    wordWrap: {
                        width: 300
                    }
                }
            )
                .setOrigin(0.5);

        // SELECT BUTTON

        const selectButton =
            this.add.text(
                width - 250,
                height - 120,
                'SELECT',
                {
                    fontSize: '28px',
                    backgroundColor: '#008800',
                    color: '#ffffff',
                    padding: {
                        left: 20,
                        right: 20,
                        top: 10,
                        bottom: 10
                    }
                }
            )
                .setOrigin(0.5)
                .setInteractive();

        selectButton.on(
            'pointerdown',
            () => {

                localStorage.setItem(
                    'selectedCharacter',
                    this.selectedCharacter.toString()
                );

                this.scene.start(
                    'MainMenu'
                );
            }
        );

        // CHARACTER GRID

        let selectedIcon:
            Phaser.GameObjects.Image | null = null;

        const startX = 120;
        const startY = 120;

        Object.entries(
            characterMap
        ).forEach(
            ([id, character]: any, index) => {

                const col =
                    index % 4;

                const row =
                    Math.floor(index / 4);

                const icon =
                    this.add.image(
                        startX + col * 140,
                        startY + row * 140,
                        character.icon
                    );

                icon.setScale(1);

                icon.setInteractive();

                icon.on(
                    'pointerdown',
                    () => {

                        if (
                            selectedIcon
                        ) {

                            selectedIcon.clearTint();

                            selectedIcon.setScale(
                                1
                            );
                        }

                        selectedIcon =
                            icon;

                        icon.setTint(
                            0xffff00
                        );

                        icon.setScale(
                            1.2
                        );

                        this.selectedCharacter =
                            Number(id);

                        this.preview.setTexture(
                            character.spritesheetKey
                        );

                        this.preview.play(
                            this.createPreviewAnimation(
                                character.spritesheetKey
                            )
                        );

                        nameText.setText(
                            character.name
                        );

                        descText.setText(
                            character.description
                        );
                    }
                );
            }
        );
    }
}