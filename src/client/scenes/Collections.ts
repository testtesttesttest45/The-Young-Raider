import { Cameras, GameObjects, Input, Scene } from 'phaser';

import characterMap from '../game/CharacterMap';

type CharacterData = {
    name: string;
    description: string;
    icon: string;
    spritesheetKey: string;
};

type CharacterEntry = [string, CharacterData];

type CharacterCard = {
    container: GameObjects.Container;
    background: GameObjects.Graphics;
    width: number;
    height: number;
};

export class Collections extends Scene {
    private selectedCharacter = 1;

    private preview: GameObjects.Sprite | null = null;
    private nameText: GameObjects.Text | null = null;
    private descriptionText: GameObjects.Text | null = null;
    private selectedLabel: GameObjects.Text | null = null;

    private selectedCard: CharacterCard | null = null;

    private gridLayer: GameObjects.Layer | null = null;
    private gridCamera: Cameras.Scene2D.Camera | null = null;

    private scrollBarTrack: GameObjects.Rectangle | null = null;
    private scrollBarThumb: GameObjects.Rectangle | null = null;

    private gridViewportX = 0;
    private gridViewportY = 0;
    private gridViewportWidth = 0;
    private gridViewportHeight = 0;

    private gridContentHeight = 0;
    private scrollY = 0;
    private maximumScroll = 0;

    private isDraggingContent = false;
    private isDraggingScrollBar = false;

    private dragStartY = 0;
    private dragPreviousY = 0;
    private dragDistance = 0;

    private scrollBarDragOffset = 0;

    constructor() {
        super('Collections');
    }

    init(): void {
        const savedCharacter = Number(localStorage.getItem('selectedCharacter'));

        if (Number.isFinite(savedCharacter) && characterMap[savedCharacter]) {
            this.selectedCharacter = savedCharacter;
        } else {
            this.selectedCharacter = 1;
        }

        this.preview = null;
        this.nameText = null;
        this.descriptionText = null;
        this.selectedLabel = null;

        this.selectedCard = null;

        this.gridLayer = null;
        this.gridCamera = null;
        this.scrollBarTrack = null;
        this.scrollBarThumb = null;

        this.gridContentHeight = 0;
        this.scrollY = 0;
        this.maximumScroll = 0;

        this.isDraggingContent = false;
        this.isDraggingScrollBar = false;

        this.dragStartY = 0;
        this.dragPreviousY = 0;
        this.dragDistance = 0;

        this.scrollBarDragOffset = 0;
    }

    create(): void {
        const width = this.scale.width;
        const height = this.scale.height;

        this.createBackground(width, height);

        const cardLayout = this.createMainCard(width, height);

        this.createHeader(cardLayout.cardX, cardLayout.cardY, cardLayout.cardWidth);

        const contentX = cardLayout.cardX + 22;
        const contentY = cardLayout.cardY + 124;
        const contentWidth = cardLayout.cardWidth - 44;
        const contentHeight = cardLayout.cardHeight - 174;

        const gap = 16;

        const gridPanelWidth = Math.floor(contentWidth * 0.59);

        const previewPanelWidth = contentWidth - gridPanelWidth - gap;

        this.createPreviewPanel(contentX + gridPanelWidth + gap, contentY, previewPanelWidth, contentHeight);

        this.createFooter(cardLayout.cardX, cardLayout.cardY, cardLayout.cardWidth, cardLayout.cardHeight);

        this.createCharacterGridPanel(contentX, contentY, gridPanelWidth, contentHeight);

        this.configureScrolling();

        this.events.once('shutdown', () => {
            this.removeScrollingListeners();
        });
    }

    private createPreviewAnimation(spriteKey: string): string {
        const animationKey = `${spriteKey}_preview`;

        if (!this.anims.exists(animationKey)) {
            this.anims.create({
                key: animationKey,

                frames: this.anims.generateFrameNumbers(spriteKey, {
                    start: 10,
                    end: 14,
                }),

                frameRate: 6,

                repeat: -1,
            });
        }

        return animationKey;
    }

    private createBackground(width: number, height: number): void {
        this.add.image(width / 2, height / 2, 'background').setDisplaySize(width, height);

        this.add.rectangle(0, 0, width, height, 0x030a10, 0.78).setOrigin(0, 0);

        const cyanGlow = this.add.ellipse(width * 0.34, height * 0.4, Math.min(760, width * 0.78), Math.min(540, height * 0.72), 0x2193c2, 0.1);

        const greenGlow = this.add.ellipse(width * 0.8, height * 0.64, Math.min(440, width * 0.44), Math.min(420, height * 0.58), 0x44d47b, 0.035);

        this.tweens.add({
            targets: [cyanGlow, greenGlow],

            scaleX: {
                from: 0.95,
                to: 1.06,
            },

            scaleY: {
                from: 0.95,
                to: 1.08,
            },

            alpha: {
                from: 0.05,
                to: 0.13,
            },

            duration: 2800,

            yoyo: true,

            repeat: -1,

            ease: 'Sine.easeInOut',
        });
    }

    private createMainCard(
        width: number,
        height: number
    ): {
        cardX: number;
        cardY: number;
        cardWidth: number;
        cardHeight: number;
    } {
        const margin = Math.max(12, Math.min(24, width * 0.025));

        const cardX = margin;
        const cardY = margin;

        const cardWidth = width - margin * 2;

        const cardHeight = height - margin * 2;

        const shadow = this.add.graphics();

        shadow.fillStyle(0x000000, 0.58);

        shadow.fillRoundedRect(cardX + 8, cardY + 10, cardWidth, cardHeight, 24);

        const card = this.add.graphics();

        card.fillStyle(0x0b1c29, 0.97);

        card.fillRoundedRect(cardX, cardY, cardWidth, cardHeight, 24);

        card.lineStyle(2, 0x55d7ff, 0.72);

        card.strokeRoundedRect(cardX, cardY, cardWidth, cardHeight, 24);

        const innerCard = this.add.graphics();

        innerCard.fillStyle(0x112737, 0.22);

        innerCard.fillRoundedRect(cardX + 8, cardY + 8, cardWidth - 16, cardHeight - 16, 18);

        const topLine = this.add.rectangle(cardX + cardWidth / 2, cardY + 3, cardWidth * 0.76, 2, 0x55d7ff, 0.88);

        this.tweens.add({
            targets: topLine,

            alpha: {
                from: 0.4,
                to: 1,
            },

            scaleX: {
                from: 0.92,
                to: 1,
            },

            duration: 2100,

            yoyo: true,

            repeat: -1,

            ease: 'Sine.easeInOut',
        });

        return {
            cardX,
            cardY,
            cardWidth,
            cardHeight,
        };
    }

    private createHeader(cardX: number, cardY: number, cardWidth: number): void {
        const headerBackground = this.add.graphics();

        headerBackground.fillStyle(0x102838, 0.82);

        headerBackground.fillRoundedRect(cardX + 10, cardY + 10, cardWidth - 20, 94, 16);

        const backButton = this.createBackButton(cardX + 76, cardY + 48);

        backButton.on('activate', () => {
            this.scene.start('MainMenu');
        });

        const titleX = cardX + cardWidth / 2;

        this.add
            .text(titleX, cardY + 27, 'RAIDER COLLECTION', {
                font: 'bold 30px Orbitron',

                color: '#ffffff',

                stroke: '#000000',

                strokeThickness: 6,

                align: 'center',
            })
            .setOrigin(0.5, 0);

        this.add
            .text(titleX, cardY + 66, 'CHOOSE THE RAIDER WHO WILL ENTER YOUR NEXT BATTLE', {
                font: 'bold 9px Orbitron',

                color: '#a9efff',

                stroke: '#000000',

                strokeThickness: 2,

                align: 'center',
            })
            .setOrigin(0.5, 0);

        this.add.rectangle(cardX + cardWidth / 2, cardY + 113, cardWidth - 48, 1, 0x55d7ff, 0.15);
    }

    private createBackButton(x: number, y: number): GameObjects.Container {
        const container = this.add.container(x, y);

        const width = 120;
        const height = 42;

        const shadow = this.add.rectangle(3, 5, width, height, 0x000000, 0.5);

        const background = this.add.rectangle(0, 0, width, height, 0x14364a, 0.96).setStrokeStyle(2, 0x79ddff, 0.5).setInteractive({
            useHandCursor: true,
        });

        const label = this.add
            .text(0, 0, '‹  BACK', {
                font: 'bold 13px Orbitron',

                color: '#ffffff',

                stroke: '#000000',

                strokeThickness: 3,
            })
            .setOrigin(0.5);

        container.add([shadow, background, label]);

        let pressedHere = false;

        background.on('pointerover', () => {
            container.setScale(1.04);

            background.setFillStyle(0x1b4c67, 1);
        });

        background.on('pointerout', () => {
            pressedHere = false;

            container.setScale(1);

            background.setFillStyle(0x14364a, 0.96);
        });

        background.on('pointerdown', () => {
            pressedHere = true;

            container.setScale(0.96);
        });

        background.on('pointerup', () => {
            container.setScale(1);

            if (!pressedHere) {
                return;
            }

            pressedHere = false;

            container.emit('activate');
        });

        background.on('pointerupoutside', () => {
            pressedHere = false;

            container.setScale(1);
        });

        return container;
    }

    private createCharacterGridPanel(panelX: number, panelY: number, panelWidth: number, panelHeight: number): void {

        const panel = this.createPanelBackground(panelX, panelY, panelWidth, panelHeight);

        panel.setDepth(5);

        const title = this.add
            .text(panelX + 20, panelY + 22, 'AVAILABLE RAIDERS', {
                font: 'bold 13px Orbitron',
                color: '#a9efff',
                stroke: '#000000',
                strokeThickness: 2,
            })
            .setOrigin(0, 0.5)
            .setDepth(7);

        const divider = this.add.rectangle(panelX + panelWidth / 2, panelY + 45, panelWidth - 30, 1, 0x55d7ff, 0.15).setDepth(7);

        const scrollbarSpace = 22;

        this.gridViewportX = panelX + 12;
        this.gridViewportY = panelY + 56;

        this.gridViewportWidth = panelWidth - 24 - scrollbarSpace;

        this.gridViewportHeight = panelHeight - 68;

        this.gridLayer = this.add.layer();

        this.gridCamera = this.cameras.add(this.gridViewportX, this.gridViewportY, this.gridViewportWidth, this.gridViewportHeight);

        this.gridCamera.setScroll(this.gridViewportX, this.gridViewportY);

        this.gridCamera.setBackgroundColor('rgba(0, 0, 0, 0)');

        this.cameras.main.ignore(this.gridLayer);

        const entries = Object.entries(characterMap) as CharacterEntry[];

        const columns = this.getGridColumns(this.gridViewportWidth);

        const gap = 12;
        const padding = 7;

        const cardWidth = (this.gridViewportWidth - padding * 2 - gap * (columns - 1)) / columns;

        const cardHeight = 126;

        entries.forEach(([id, character], index) => {
            const column = index % columns;

            const row = Math.floor(index / columns);

            const cardX = this.gridViewportX + padding + column * (cardWidth + gap);

            const cardY = this.gridViewportY + padding + row * (cardHeight + gap);

            const card = this.createCharacterCard(cardX, cardY, cardWidth, cardHeight, Number(id), character);

            this.gridLayer?.add(card.container);

            if (Number(id) === this.selectedCharacter) {
                this.selectCharacterCard(card, Number(id), character, false);
            }
        });

        this.children.list.forEach((child) => {
            if (child !== this.gridLayer) {
                this.gridCamera?.ignore(child);
            }
        });

        const rows = Math.ceil(entries.length / columns);

        this.gridContentHeight = padding * 2 + rows * cardHeight + Math.max(0, rows - 1) * gap;

        this.maximumScroll = Math.max(0, this.gridContentHeight - this.gridViewportHeight);

        this.createScrollBar(panelX + panelWidth - 14, this.gridViewportY, this.gridViewportHeight);

        if (this.scrollBarTrack) {
            this.gridCamera.ignore(this.scrollBarTrack);
        }

        if (this.scrollBarThumb) {
            this.gridCamera.ignore(this.scrollBarThumb);
        }

        this.gridCamera.ignore([panel, title, divider]);

        this.setScrollPosition(0);
    }

    private getGridColumns(availableWidth: number): number {
        if (availableWidth < 320) {
            return 2;
        }

        if (availableWidth < 480) {
            return 3;
        }

        return 4;
    }

    private createCharacterCard(x: number, y: number, width: number, height: number, id: number, character: CharacterData): CharacterCard {
        const container = this.add.container(x, y);

        const shadow = this.add.graphics();

        shadow.fillStyle(0x000000, 0.42);

        shadow.fillRoundedRect(4, 6, width, height, 14);

        const background = this.add.graphics();

        this.drawCharacterCard(background, width, height, false);

        const circleRadius = Math.min(36, width * 0.31);

        const iconCenterX = width / 2;

        const iconCenterY = 46;

        const iconBackground = this.add.circle(iconCenterX, iconCenterY, circleRadius + 2, 0x173a4f, 0.9).setStrokeStyle(2, 0x55d7ff, 0.42);

        const iconSize = circleRadius * 2;

        const icon = this.add.image(iconCenterX, iconCenterY, character.icon).setDisplaySize(iconSize, iconSize);

        const iconMaskShape = this.add.graphics();

        iconMaskShape.fillStyle(0xffffff, 1);

        iconMaskShape.fillCircle(iconCenterX, iconCenterY, circleRadius);

        iconMaskShape.setVisible(false);

        const iconMask = iconMaskShape.createGeometryMask();

        icon.setMask(iconMask);

        const name = this.add
            .text(width / 2, 99, character.name, {
                font: 'bold 9px Orbitron',

                color: '#ffffff',

                stroke: '#000000',

                strokeThickness: 3,

                align: 'center',

                wordWrap: {
                    width: width - 12,
                },
            })
            .setOrigin(0.5);

        const interactionArea = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0.001).setInteractive({
            useHandCursor: true,
        });

        container.add([shadow, background, iconBackground, iconMaskShape, icon, name, interactionArea]);

        const card: CharacterCard = {
            container,
            background,
            width,
            height,
        };

        let pressedHere = false;
        let pressX = 0;
        let pressY = 0;

        interactionArea.on('pointerover', () => {
            if (card !== this.selectedCard && !this.isDraggingContent) {
                container.setScale(1.025);
            }
        });

        interactionArea.on('pointerout', () => {
            pressedHere = false;

            if (card !== this.selectedCard) {
                container.setScale(1);
            }
        });

        interactionArea.on('pointerdown', (pointer: Input.Pointer) => {
            pressedHere = true;

            pressX = pointer.x;

            pressY = pointer.y;
        });

        interactionArea.on('pointerup', (pointer: Input.Pointer) => {
            const movement = Math.abs(pointer.x - pressX) + Math.abs(pointer.y - pressY);

            if (!pressedHere || movement > 12 || this.dragDistance > 12 || !this.isPointerInsideGrid(pointer)) {
                pressedHere = false;

                return;
            }

            pressedHere = false;

            this.selectCharacterCard(card, id, character, true);
        });

        interactionArea.on('pointerupoutside', () => {
            pressedHere = false;
        });

        return card;
    }

    private drawCharacterCard(graphics: GameObjects.Graphics, width: number, height: number, selected: boolean): void {
        graphics.clear();

        graphics.fillStyle(selected ? 0x17465b : 0x102b3b, selected ? 0.98 : 0.78);

        graphics.fillRoundedRect(0, 0, width, height, 14);

        graphics.lineStyle(selected ? 3 : 1, selected ? 0x8be8ff : 0x55d7ff, selected ? 0.95 : 0.22);

        graphics.strokeRoundedRect(0, 0, width, height, 14);

        if (selected) {
            graphics.fillStyle(0x8be8ff, 0.1);
        }
    }

    private selectCharacterCard(card: CharacterCard, id: number, character: CharacterData, updatePreview: boolean): void {
        if (this.selectedCard) {
            this.drawCharacterCard(this.selectedCard.background, this.selectedCard.width, this.selectedCard.height, false);

            this.selectedCard.container.setScale(1);
        }

        this.drawCharacterCard(card.background, card.width, card.height, true);

        card.container.setScale(1.04);

        this.selectedCard = card;

        this.selectedCharacter = id;

        if (updatePreview) {
            this.updatePreview(character);
        }

        this.updateSelectedLabel();
    }

    private createPreviewPanel(panelX: number, panelY: number, panelWidth: number, panelHeight: number): void {
        const panel = this.createPanelBackground(panelX, panelY, panelWidth, panelHeight);

        panel.setDepth(5);

        this.add
            .text(panelX + 20, panelY + 22, 'RAIDER PREVIEW', {
                font: 'bold 13px Orbitron',

                color: '#a9efff',

                stroke: '#000000',

                strokeThickness: 2,
            })
            .setOrigin(0, 0.5)
            .setDepth(7);

        this.add.rectangle(panelX + panelWidth / 2, panelY + 45, panelWidth - 30, 1, 0x55d7ff, 0.15).setDepth(7);

        const character = characterMap[this.selectedCharacter] as CharacterData;

        const centerX = panelX + panelWidth / 2;

        const previewY = panelY + Math.min(160, panelHeight * 0.31);

        const previewGlow = this.add.ellipse(centerX, previewY, Math.min(245, panelWidth * 0.74), Math.min(190, panelHeight * 0.35), 0x55d7ff, 0.075).setDepth(6);

        this.tweens.add({
            targets: previewGlow,

            scaleX: {
                from: 0.94,
                to: 1.07,
            },

            scaleY: {
                from: 0.94,
                to: 1.07,
            },

            alpha: {
                from: 0.04,
                to: 0.11,
            },

            duration: 2400,

            yoyo: true,

            repeat: -1,

            ease: 'Sine.easeInOut',
        });

        this.preview = this.add.sprite(centerX, previewY, character.spritesheetKey).setDepth(7);

        this.preview.setScale(Math.min(1.15, panelWidth / 290));

        this.preview.play(this.createPreviewAnimation(character.spritesheetKey));

        this.nameText = this.add
            .text(centerX, panelY + panelHeight * 0.53, character.name, {
                font: 'bold 21px Orbitron',

                color: '#ffffff',

                stroke: '#000000',

                strokeThickness: 5,

                align: 'center',

                wordWrap: {
                    width: panelWidth - 36,
                },
            })
            .setOrigin(0.5)
            .setDepth(7);

        this.descriptionText = this.add
            .text(centerX, panelY + panelHeight * 0.6, character.description, {
                font: '14px Arial',

                color: '#b9cfda',

                stroke: '#000000',

                strokeThickness: 2,

                align: 'center',

                lineSpacing: 4,

                wordWrap: {
                    width: panelWidth - 46,
                },
            })
            .setOrigin(0.5, 0)
            .setDepth(7);

        this.selectedLabel = this.add
            .text(centerX, panelY + panelHeight - 103, '', {
                font: 'bold 10px Orbitron',

                color: '#8cffad',

                stroke: '#000000',

                strokeThickness: 2,
            })
            .setOrigin(0.5)
            .setDepth(7);

        this.updateSelectedLabel();

        const selectButton = this.createSelectButton(centerX, panelY + panelHeight - 54, Math.min(280, panelWidth - 38));

        selectButton.setDepth(7);

        selectButton.on('activate', () => {
            localStorage.setItem('selectedCharacter', this.selectedCharacter.toString());

            this.updateSelectedLabel();
        });
    }

    private updatePreview(character: CharacterData): void {
        this.preview?.setTexture(character.spritesheetKey);

        this.preview?.play(this.createPreviewAnimation(character.spritesheetKey), true);

        this.nameText?.setText(character.name);

        this.descriptionText?.setText(character.description);
    }

    private updateSelectedLabel(): void {
        if (!this.selectedLabel) {
            return;
        }

        const savedCharacter = Number(localStorage.getItem('selectedCharacter'));

        const isEquipped = savedCharacter === this.selectedCharacter;

        this.selectedLabel.setText(isEquipped ? 'CURRENTLY EQUIPPED' : 'READY TO SELECT').setColor(isEquipped ? '#8cffad' : '#a9efff');
    }

    private createPanelBackground(x: number, y: number, width: number, height: number): GameObjects.Graphics {
        const panel = this.add.graphics();

        panel.fillStyle(0x0f2737, 0.76);

        panel.fillRoundedRect(x, y, width, height, 18);

        panel.lineStyle(1, 0x55d7ff, 0.24);

        panel.strokeRoundedRect(x, y, width, height, 18);

        return panel;
    }

    private createSelectButton(x: number, y: number, width: number): GameObjects.Container {
        const height = 58;

        const container = this.add.container(x, y);

        const glow = this.add.rectangle(0, 4, width + 12, height + 12, 0x8cffad, 0.045);

        const shadow = this.add.rectangle(0, 7, width, height, 0x000000, 0.54);

        const top = this.add.rectangle(0, -height * 0.24, width, height * 0.52, 0x39c86d, 1);

        const bottom = this.add.rectangle(0, height * 0.25, width, height * 0.5, 0x157c3d, 1);

        const interactionArea = this.add.rectangle(0, 0, width, height, 0xffffff, 0.001).setStrokeStyle(2, 0xa3ffc1, 0.82).setInteractive({
            useHandCursor: true,
        });

        const label = this.add
            .text(0, -5, 'SELECT RAIDER', {
                font: 'bold 18px Orbitron',

                color: '#ffffff',

                stroke: '#000000',

                strokeThickness: 4,
            })
            .setOrigin(0.5);

        const subtitle = this.add
            .text(0, 16, 'USE IN YOUR NEXT RUN', {
                font: 'bold 8px Orbitron',

                color: '#d9ffe5',

                stroke: '#000000',

                strokeThickness: 2,
            })
            .setOrigin(0.5);

        container.add([glow, shadow, top, bottom, interactionArea, label, subtitle]);

        let pressedHere = false;

        interactionArea.on('pointerover', () => {
            container.setScale(1.025);

            glow.setAlpha(0.12);
        });

        interactionArea.on('pointerout', () => {
            pressedHere = false;

            container.setScale(1);

            glow.setAlpha(0.045);
        });

        interactionArea.on('pointerdown', () => {
            pressedHere = true;

            container.setScale(0.97);
        });

        interactionArea.on('pointerup', () => {
            container.setScale(1);

            if (!pressedHere) {
                return;
            }

            pressedHere = false;

            container.emit('activate');
        });

        interactionArea.on('pointerupoutside', () => {
            pressedHere = false;

            container.setScale(1);
        });

        return container;
    }

    private createScrollBar(x: number, y: number, height: number): void {
        this.scrollBarTrack = this.add
            .rectangle(x, y, 14, height, 0x06131d, 0.86)
            .setOrigin(0.5, 0)
            .setInteractive({
                useHandCursor: true,
            })
            .setDepth(8);

        const visibleRatio = this.gridContentHeight > 0 ? Math.min(1, this.gridViewportHeight / this.gridContentHeight) : 1;

        const thumbHeight = Math.max(42, height * visibleRatio);

        this.scrollBarThumb = this.add
            .rectangle(x, y, 10, thumbHeight, 0x55d7ff, 0.78)
            .setOrigin(0.5, 0)
            .setInteractive({
                useHandCursor: true,
                draggable: true,
            })
            .setDepth(9);

        this.input.setDraggable(this.scrollBarThumb);

        if (this.maximumScroll <= 0) {
            this.scrollBarTrack.setAlpha(0.25).disableInteractive();

            this.scrollBarThumb.setVisible(false);

            return;
        }

        this.scrollBarTrack.on('pointerdown', (pointer: Input.Pointer) => {
            if (!this.scrollBarThumb) {
                return;
            }

            const thumbHeight = this.scrollBarThumb.displayHeight;

            const desiredThumbY = pointer.y - thumbHeight / 2;

            this.setScrollFromThumbY(desiredThumbY);
        });

        this.scrollBarThumb.on('pointerover', () => {
            this.scrollBarThumb?.setFillStyle(0xa9efff, 1);
        });

        this.scrollBarThumb.on('pointerout', () => {
            if (!this.isDraggingScrollBar) {
                this.scrollBarThumb?.setFillStyle(0x55d7ff, 0.78);
            }
        });

        this.scrollBarThumb.on('dragstart', (pointer: Input.Pointer) => {
            if (!this.scrollBarThumb) {
                return;
            }

            this.isDraggingScrollBar = true;

            this.isDraggingContent = false;

            this.scrollBarDragOffset = pointer.y - this.scrollBarThumb.y;

            this.scrollBarThumb.setFillStyle(0xa9efff, 1);
        });

        this.scrollBarThumb.on('drag', (pointer: Input.Pointer) => {
            const desiredThumbY = pointer.y - this.scrollBarDragOffset;

            this.setScrollFromThumbY(desiredThumbY);
        });

        this.scrollBarThumb.on('dragend', () => {
            this.isDraggingScrollBar = false;

            this.scrollBarThumb?.setFillStyle(0x55d7ff, 0.78);
        });
    }

    private setScrollFromThumbY(desiredThumbY: number): void {
        if (!this.scrollBarTrack || !this.scrollBarThumb || this.maximumScroll <= 0) {
            return;
        }

        const trackTop = this.scrollBarTrack.y;

        const trackHeight = this.scrollBarTrack.displayHeight;

        const thumbHeight = this.scrollBarThumb.displayHeight;

        const maximumThumbY = trackTop + trackHeight - thumbHeight;

        const clampedThumbY = Math.max(trackTop, Math.min(maximumThumbY, desiredThumbY));

        const travelDistance = Math.max(1, maximumThumbY - trackTop);

        const ratio = (clampedThumbY - trackTop) / travelDistance;

        this.setScrollPosition(ratio * this.maximumScroll);
    }

    private configureScrolling(): void {
        this.input.on('wheel', this.handleMouseWheel, this);

        this.input.on('pointerdown', this.handlePointerDown, this);

        this.input.on('pointermove', this.handlePointerMove, this);

        this.input.on('pointerup', this.handlePointerUp, this);
    }

    private removeScrollingListeners(): void {
        this.input.off('wheel', this.handleMouseWheel, this);

        this.input.off('pointerdown', this.handlePointerDown, this);

        this.input.off('pointermove', this.handlePointerMove, this);

        this.input.off('pointerup', this.handlePointerUp, this);
    }

    private handleMouseWheel(pointer: Input.Pointer, _gameObjects: GameObjects.GameObject[], _deltaX: number, deltaY: number): void {
        if (!this.isPointerInsideGrid(pointer)) {
            return;
        }

        this.setScrollPosition(this.scrollY + deltaY * 0.65);
    }

    private handlePointerDown(pointer: Input.Pointer): void {
        if (this.isDraggingScrollBar || !this.isPointerInsideGrid(pointer)) {
            return;
        }

        this.isDraggingContent = true;

        this.dragStartY = pointer.y;

        this.dragPreviousY = pointer.y;

        this.dragDistance = 0;
    }

    private handlePointerMove(pointer: Input.Pointer): void {
        if (!this.isDraggingContent || this.isDraggingScrollBar || !pointer.isDown) {
            return;
        }

        const movement = pointer.y - this.dragPreviousY;

        this.dragDistance = Math.max(this.dragDistance, Math.abs(pointer.y - this.dragStartY));

        this.dragPreviousY = pointer.y;

        if (this.dragDistance < 5) {
            return;
        }

        this.setScrollPosition(this.scrollY - movement);
    }

    private handlePointerUp(): void {
        this.isDraggingContent = false;

        this.time.delayedCall(0, () => {
            this.dragDistance = 0;
        });
    }

    private isPointerInsideGrid(pointer: Input.Pointer): boolean {
        return (
            pointer.x >= this.gridViewportX && pointer.x <= this.gridViewportX + this.gridViewportWidth && pointer.y >= this.gridViewportY && pointer.y <= this.gridViewportY + this.gridViewportHeight
        );
    }

    private setScrollPosition(value: number): void {
        this.scrollY = Math.max(0, Math.min(this.maximumScroll, value));

        this.gridCamera?.setScroll(this.gridViewportX, this.gridViewportY + this.scrollY);

        this.updateScrollBarThumb();
    }

    private updateScrollBarThumb(): void {
        if (!this.scrollBarTrack || !this.scrollBarThumb || this.maximumScroll <= 0) {
            return;
        }

        const trackTop = this.scrollBarTrack.y;

        const trackHeight = this.scrollBarTrack.displayHeight;

        const thumbHeight = this.scrollBarThumb.displayHeight;

        const travelDistance = trackHeight - thumbHeight;

        const scrollRatio = this.scrollY / this.maximumScroll;

        this.scrollBarThumb.y = trackTop + travelDistance * scrollRatio;
    }

    private createFooter(cardX: number, cardY: number, cardWidth: number, cardHeight: number): void {
        const footerY = cardY + cardHeight - 24;

        this.add.rectangle(cardX + cardWidth / 2, footerY - 20, cardWidth - 48, 1, 0x55d7ff, 0.12);

        this.add
            .text(cardX + cardWidth / 2, footerY, 'SCROLL OR DRAG INSIDE AVAILABLE RAIDERS TO VIEW MORE', {
                font: '9px Orbitron',

                color: '#879ca8',

                stroke: '#000000',

                strokeThickness: 2,
            })
            .setOrigin(0.5);
    }
}
