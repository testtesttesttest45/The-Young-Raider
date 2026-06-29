import { Cameras, GameObjects, Input, Scene } from "phaser";
import type {
  ApiErrorResponse,
  RaiderCollectionItem,
  RaiderCollectionResponse,
  SaveSelectedRaiderResponse,
  UnlockRaiderResponse,
} from "../../shared/api";

import type { KingDay } from "../../shared/raiderUnlocks";

import characterMap, { type RaiderDefinition } from "../game/CharacterMap";
import audioManager from "./AudioManager";

type CharacterData = RaiderDefinition;

type CharacterEntry = [string, RaiderDefinition];

type CharacterCard = {
  characterCode: number;

  container: GameObjects.Container;
  background: GameObjects.Graphics;

  statusBadge: GameObjects.Text;

  width: number;
  height: number;
};

export class Collections extends Scene {
  private selectedCharacter = 16;
  private equippedCharacter = 16;

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

  private raiderStates = new Map<number, RaiderCollectionItem>();

  private characterCards = new Map<number, CharacterCard>();

  private allTimeHighScore = 0;
  private playergem = 0;

  private actionButton: {
    container: GameObjects.Container;
    top: GameObjects.Rectangle;
    bottom: GameObjects.Rectangle;
    interactionArea: GameObjects.Rectangle;
    label: GameObjects.Text;
    subtitle: GameObjects.Text;
  } | null = null;

  private actionInProgress = false;
  private isLoggedIn = false;
  private selectedGemIcon: GameObjects.Image | null = null;

  constructor() {
    super("Collections");
  }

  init(): void {
    this.selectedCharacter = 16;
    this.equippedCharacter = 16;

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

    this.raiderStates.clear();
    this.characterCards.clear();

    this.allTimeHighScore = 0;
    this.playergem = 0;

    this.actionButton = null;
    this.actionInProgress = false;
    this.isLoggedIn = false;
    this.selectedGemIcon = null;
  }

  async create(): Promise<void> {
    audioManager.createMuteButton(this, this.scale.width - 20, 18);
    const width = this.scale.width;
    const height = this.scale.height;

    // draw background while loading raider collection data
    this.createBackground(width, height);

    const loadingText = this.add
      .text(width / 2, height / 2, "LOADING RAIDERS...", {
        font: "bold 15px Orbitron",
        color: "#a9efff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    await this.loadRaiderCollection();

    if (!this.sys.isActive()) {
      return;
    }

    loadingText.destroy();

    const cardLayout = this.createMainCard(width, height);

    this.createHeader(cardLayout.cardX, cardLayout.cardY, cardLayout.cardWidth);

    const contentX = cardLayout.cardX + 22;
    const contentY = cardLayout.cardY + 124;
    const contentWidth = cardLayout.cardWidth - 44;
    const contentHeight = cardLayout.cardHeight - 174;

    const gap = 16;

    const gridPanelWidth = Math.floor(contentWidth * 0.59);

    const previewPanelWidth = contentWidth - gridPanelWidth - gap;

    this.createPreviewPanel(
      contentX + gridPanelWidth + gap,
      contentY,
      previewPanelWidth,
      contentHeight,
    );

    this.createFooter(
      cardLayout.cardX,
      cardLayout.cardY,
      cardLayout.cardWidth,
      cardLayout.cardHeight,
    );

    this.createCharacterGridPanel(
      contentX,
      contentY,
      gridPanelWidth,
      contentHeight,
    );

    this.configureScrolling();

    this.events.once("shutdown", () => {
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
    this.add
      .image(width / 2, height / 2, "background")
      .setDisplaySize(width, height);

    this.add.rectangle(0, 0, width, height, 0x030a10, 0.78).setOrigin(0, 0);

    const cyanGlow = this.add.ellipse(
      width * 0.34,
      height * 0.4,
      Math.min(760, width * 0.78),
      Math.min(540, height * 0.72),
      0x2193c2,
      0.1,
    );

    const greenGlow = this.add.ellipse(
      width * 0.8,
      height * 0.64,
      Math.min(440, width * 0.44),
      Math.min(420, height * 0.58),
      0x44d47b,
      0.035,
    );

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

      ease: "Sine.easeInOut",
    });
  }

  private createMainCard(
    width: number,
    height: number,
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

    innerCard.fillRoundedRect(
      cardX + 8,
      cardY + 8,
      cardWidth - 16,
      cardHeight - 16,
      18,
    );

    const topLine = this.add.rectangle(
      cardX + cardWidth / 2,
      cardY + 3,
      cardWidth * 0.76,
      2,
      0x55d7ff,
      0.88,
    );

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

      ease: "Sine.easeInOut",
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

    headerBackground.fillRoundedRect(
      cardX + 10,
      cardY + 10,
      cardWidth - 20,
      94,
      16,
    );

    const backButton = this.createBackButton(cardX + 76, cardY + 48);

    audioManager.addButtonSound(backButton);

    backButton.on("activate", () => {
      this.scene.start("MainMenu");
    });

    const titleX = cardX + cardWidth / 2;

    this.add
      .text(titleX, cardY + 27, "RAIDER COLLECTION", {
        font: "bold 30px Orbitron",

        color: "#ffffff",

        stroke: "#000000",

        strokeThickness: 6,

        align: "center",
      })
      .setOrigin(0.5, 0);

    this.add
      .text(
        titleX,
        cardY + 66,
        "CHOOSE THE RAIDER WHO WILL ENTER YOUR NEXT BATTLE",
        {
          font: "bold 14px Orbitron",

          color: "#a9efff",

          stroke: "#000000",

          strokeThickness: 2,

          align: "center",
        },
      )
      .setOrigin(0.5, 0);

    this.add.rectangle(
      cardX + cardWidth / 2,
      cardY + 113,
      cardWidth - 48,
      1,
      0x55d7ff,
      0.15,
    );
  }

  private createBackButton(x: number, y: number): GameObjects.Container {
    const container = this.add.container(x, y);

    const width = 120;
    const height = 42;

    const shadow = this.add.rectangle(3, 5, width, height, 0x000000, 0.5);

    const background = this.add
      .rectangle(0, 0, width, height, 0x14364a, 0.96)
      .setStrokeStyle(2, 0x79ddff, 0.5)
      .setInteractive({
        useHandCursor: true,
      });

    const label = this.add
      .text(0, 0, "<  BACK", {
        font: "bold 18px Orbitron",

        color: "#ffffff",

        stroke: "#000000",

        strokeThickness: 3,
      })
      .setOrigin(0.5);

    container.add([shadow, background, label]);

    let pressedHere = false;

    audioManager.addButtonSound(background);

    background.on("pointerover", () => {
      container.setScale(1.04);

      background.setFillStyle(0x1b4c67, 1);
    });

    background.on("pointerout", () => {
      pressedHere = false;

      container.setScale(1);

      background.setFillStyle(0x14364a, 0.96);
    });

    background.on("pointerdown", () => {
      pressedHere = true;

      container.setScale(0.96);
    });

    background.on("pointerup", () => {
      container.setScale(1);

      if (!pressedHere) {
        return;
      }

      pressedHere = false;

      container.emit("activate");
    });

    background.on("pointerupoutside", () => {
      pressedHere = false;

      container.setScale(1);
    });

    return container;
  }

  private createCharacterGridPanel(
    panelX: number,
    panelY: number,
    panelWidth: number,
    panelHeight: number,
  ): void {
    const panel = this.createPanelBackground(
      panelX,
      panelY,
      panelWidth,
      panelHeight,
    );

    panel.setDepth(5);

    const title = this.add
      .text(panelX + 20, panelY + 22, "AVAILABLE RAIDERS", {
        font: "bold 14px Orbitron",
        color: "#a9efff",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0, 0.5)
      .setDepth(7);

    const divider = this.add
      .rectangle(
        panelX + panelWidth / 2,
        panelY + 45,
        panelWidth - 30,
        1,
        0x55d7ff,
        0.15,
      )
      .setDepth(7);

    const scrollbarSpace = 22;

    this.gridViewportX = panelX + 12;
    this.gridViewportY = panelY + 56;

    this.gridViewportWidth = panelWidth - 24 - scrollbarSpace;

    this.gridViewportHeight = panelHeight - 68;

    this.gridLayer = this.add.layer();

    this.gridCamera = this.cameras.add(
      this.gridViewportX,
      this.gridViewportY,
      this.gridViewportWidth,
      this.gridViewportHeight,
    );

    this.gridCamera.setScroll(this.gridViewportX, this.gridViewportY);

    this.gridCamera.setBackgroundColor("rgba(0, 0, 0, 0)");

    this.cameras.main.ignore(this.gridLayer);

    const unlockTypeOrder = {
      free: 0,
      highscore: 1,
      gem: 2,
      king: 3,
    } as const;

    const kingDayOrder: Record<KingDay, number> = {
      monday: 0,
      tuesday: 1,
      wednesday: 2,
      thursday: 3,
      friday: 4,
      saturday: 5,
      sunday: 6,
    };

    const entries = (
      Object.entries(characterMap).filter(([, character]) => {
        return character.type === "raider";
      }) as CharacterEntry[]
    ).sort(([firstId], [secondId]) => {
      const firstCode = Number(firstId);
      const secondCode = Number(secondId);

      const firstState = this.raiderStates.get(firstCode);
      const secondState = this.raiderStates.get(secondCode);

      const firstType =
        firstState?.unlockType ?? (firstCode === 16 ? "free" : "gem");

      const secondType =
        secondState?.unlockType ?? (secondCode === 16 ? "free" : "gem");

      const typeDifference =
        unlockTypeOrder[firstType] - unlockTypeOrder[secondType];

      if (typeDifference !== 0) {
        return typeDifference;
      }

      if (firstType === "king" && secondType === "king") {
        const firstDayOrder = firstState?.kingDay
          ? kingDayOrder[firstState.kingDay]
          : Number.MAX_SAFE_INTEGER;

        const secondDayOrder = secondState?.kingDay
          ? kingDayOrder[secondState.kingDay]
          : Number.MAX_SAFE_INTEGER;

        if (firstDayOrder !== secondDayOrder) {
          return firstDayOrder - secondDayOrder;
        }
      }

      const firstRequirement = firstState?.requirementAmount ?? 0;

      const secondRequirement = secondState?.requirementAmount ?? 0;

      if (firstRequirement !== secondRequirement) {
        return firstRequirement - secondRequirement;
      }

      return firstCode - secondCode;
    });

    const columns = this.getGridColumns(this.gridViewportWidth);

    const gap = 12;
    const padding = 7;

    const cardWidth =
      (this.gridViewportWidth - padding * 2 - gap * (columns - 1)) / columns;

    const cardHeight = 138;

    entries.forEach(([id, character], index) => {
      const column = index % columns;

      const row = Math.floor(index / columns);

      const cardX = this.gridViewportX + padding + column * (cardWidth + gap);

      const cardY = this.gridViewportY + padding + row * (cardHeight + gap);

      const card = this.createCharacterCard(
        cardX,
        cardY,
        cardWidth,
        cardHeight,
        Number(id),
        character,
      );

      this.gridLayer?.add(card.container);

      this.characterCards.set(Number(id), card);

      if (Number(id) === this.selectedCharacter) {
        this.selectedCard = card;
      }
    });

    this.refreshCharacterCards();

    this.children.list.forEach((child) => {
      if (child !== this.gridLayer) {
        this.gridCamera?.ignore(child);
      }
    });

    const rows = Math.ceil(entries.length / columns);

    this.gridContentHeight =
      padding * 2 + rows * cardHeight + Math.max(0, rows - 1) * gap;

    this.maximumScroll = Math.max(
      0,
      this.gridContentHeight - this.gridViewportHeight,
    );

    this.createScrollBar(
      panelX + panelWidth - 14,
      this.gridViewportY,
      this.gridViewportHeight,
    );

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

  private createCharacterCard(
    x: number,
    y: number,
    width: number,
    height: number,
    id: number,
    character: CharacterData,
  ): CharacterCard {
    const container = this.add.container(x, y);

    const shadow = this.add.graphics();

    shadow.fillStyle(0x000000, 0.42);

    shadow.fillRoundedRect(4, 6, width, height, 14);

    const background = this.add.graphics();

    const circleRadius = Math.min(36, width * 0.31);

    const iconCenterX = width / 2;
    const iconCenterY = 46;

    const iconBackground = this.add
      .circle(iconCenterX, iconCenterY, circleRadius + 2, 0x173a4f, 0.9)
      .setStrokeStyle(2, 0x55d7ff, 0.72);

    const circularTextureKey = this.createCircularIconTexture(
      character.icon,
      `${character.icon}_circular`,
      1.3,
    );

    const icon = this.add
      .image(iconCenterX, iconCenterY, circularTextureKey)
      .setDisplaySize(circleRadius * 2, circleRadius * 2);

    const name = this.add
      .text(width / 2, 99, character.name, {
        font: "bold 14px Orbitron",

        color: "#ffffff",

        stroke: "#000000",

        strokeThickness: 3,

        align: "center",

        wordWrap: {
          width: width - 12,
        },
      })
      .setOrigin(0.5);

    const statusBadge = this.add
      .text(width / 2, 116, "", {
        font: "bold 14px Orbitron",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
        align: "center",
      })
      .setOrigin(0.5);

    const interactionArea = this.add
      .rectangle(width / 2, height / 2, width, height, 0xffffff, 0.001)
      .setInteractive({
        useHandCursor: true,
      });

    container.add([
      shadow,
      background,
      iconBackground,
      icon,
      name,
      statusBadge,
      interactionArea,
    ]);

    const card: CharacterCard = {
      characterCode: id,
      container,
      background,
      statusBadge,
      width,
      height,
    };

    let pressedHere = false;
    let pressX = 0;
    let pressY = 0;

    audioManager.addButtonSound(interactionArea);

    interactionArea.on("pointerover", () => {
      if (card !== this.selectedCard && !this.isDraggingContent) {
        container.setScale(1.025);
      }
    });

    interactionArea.on("pointerout", () => {
      pressedHere = false;

      if (card !== this.selectedCard) {
        container.setScale(1);
      }
    });

    interactionArea.on("pointerdown", (pointer: Input.Pointer) => {
      pressedHere = true;

      pressX = pointer.x;

      pressY = pointer.y;
    });

    interactionArea.on("pointerup", (pointer: Input.Pointer) => {
      const movement =
        Math.abs(pointer.x - pressX) + Math.abs(pointer.y - pressY);

      if (
        !pressedHere ||
        movement > 12 ||
        this.dragDistance > 12 ||
        !this.isPointerInsideGrid(pointer)
      ) {
        pressedHere = false;

        return;
      }

      pressedHere = false;

      this.selectCharacterCard(card, id, character, true);
    });

    interactionArea.on("pointerupoutside", () => {
      pressedHere = false;
    });

    return card;
  }

  private refreshCharacterCards(): void {
    this.characterCards.forEach((card) => {
      this.drawCharacterCard(card);
    });
  }

  private drawCharacterCard(card: CharacterCard): void {
    const characterCode = card.characterCode;

    const state = this.raiderStates.get(characterCode);

    const isPreviewed = characterCode === this.selectedCharacter;

    const isEquipped = characterCode === this.equippedCharacter;

    const isOwned = characterCode === 16 || state?.owned === true;

    card.background.clear();

    if (isEquipped) {
      card.background.fillStyle(0x17482f, 0.98);

      card.background.lineStyle(4, 0x8cffad, 1);
    } else if (isPreviewed) {
      card.background.fillStyle(0x17465b, 0.98);

      card.background.lineStyle(3, 0x8be8ff, 0.95);
    } else if (!isOwned) {
      card.background.fillStyle(0x17212a, 0.82);

      card.background.lineStyle(1, 0x71808a, 0.42);
    } else {
      card.background.fillStyle(0x102b3b, 0.78);

      card.background.lineStyle(1, 0x55d7ff, 0.22);
    }

    card.background.fillRoundedRect(0, 0, card.width, card.height, 14);

    card.background.strokeRoundedRect(0, 0, card.width, card.height, 14);

    if (isEquipped) {
      card.statusBadge.setText("✓ SELECTED").setColor("#8cffad");
    } else if (isOwned) {
      card.statusBadge.setText("OWNED").setColor("#a9efff");
    } else if (state?.requirementMet) {
      card.statusBadge.setText("UNLOCK READY").setColor("#ffe58a");
    } else {
      card.statusBadge.setText("🔒 LOCKED").setColor("#9ba8ae");
    }

    card.container.setAlpha(isOwned || state?.requirementMet ? 1 : 0.7);

    card.container.setScale(isPreviewed ? 1.04 : 1);
  }

  private selectCharacterCard(
    card: CharacterCard,
    id: number,
    character: CharacterData,
    updatePreview: boolean,
  ): void {
    this.selectedCard = card;
    this.selectedCharacter = id;

    if (updatePreview) {
      this.updatePreview(character);
    }

    this.refreshCharacterCards();
    this.updateSelectedLabel();
    this.updateActionButton();
  }

  private createPreviewPanel(
    panelX: number,
    panelY: number,
    panelWidth: number,
    panelHeight: number,
  ): void {
    const panel = this.createPanelBackground(
      panelX,
      panelY,
      panelWidth,
      panelHeight,
    );

    panel.setDepth(5);

    this.add
      .text(panelX + 20, panelY + 22, "RAIDER PREVIEW", {
        font: "bold 14px Orbitron",

        color: "#a9efff",

        stroke: "#000000",

        strokeThickness: 2,
      })
      .setOrigin(0, 0.5)
      .setDepth(7);

    this.add
      .rectangle(
        panelX + panelWidth / 2,
        panelY + 45,
        panelWidth - 30,
        1,
        0x55d7ff,
        0.15,
      )
      .setDepth(7);

    const selectedDefinition = characterMap[this.selectedCharacter];

    const fallbackDefinition = characterMap[16];

    const character =
      selectedDefinition?.type === "raider"
        ? selectedDefinition
        : fallbackDefinition;

    if (!character || character.type !== "raider") {
      throw new Error("[Collections] Default Raider 16 is missing.");
    }

    const centerX = panelX + panelWidth / 2;

    const previewY = panelY + Math.min(160, panelHeight * 0.31);

    const previewGlow = this.add
      .ellipse(
        centerX,
        previewY,
        Math.min(245, panelWidth * 0.74),
        Math.min(190, panelHeight * 0.35),
        0x55d7ff,
        0.075,
      )
      .setDepth(6);

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

      ease: "Sine.easeInOut",
    });

    this.preview = this.add
      .sprite(centerX, previewY, character.spritesheetKey)
      .setDepth(7);

    this.preview.setScale(Math.min(1.15, panelWidth / 290));

    this.preview.play(this.createPreviewAnimation(character.spritesheetKey));

    this.nameText = this.add
      .text(centerX, panelY + panelHeight * 0.53, character.name, {
        font: "bold 21px Orbitron",

        color: "#ffffff",

        stroke: "#000000",

        strokeThickness: 5,

        align: "center",

        wordWrap: {
          width: panelWidth - 36,
        },
      })
      .setOrigin(0.5)
      .setDepth(7);

    this.descriptionText = this.add
      .text(centerX, panelY + panelHeight * 0.6, character.description, {
        font: "16px Arial",

        color: "#b9cfda",

        stroke: "#000000",

        strokeThickness: 2,

        align: "center",

        lineSpacing: 4,

        wordWrap: {
          width: panelWidth - 46,
        },
      })
      .setOrigin(0.5, 0)
      .setDepth(7);

    this.selectedLabel = this.add
      .text(centerX, panelY + panelHeight - 103, "", {
        font: "bold 14px Orbitron",

        color: "#8cffad",

        stroke: "#000000",

        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(7);

    this.selectedGemIcon = this.add
      .image(centerX, panelY + panelHeight - 103, "gem")
      .setDisplaySize(18, 18)
      .setOrigin(0.5)
      .setDepth(7)
      .setVisible(false);

    this.updateSelectedLabel();

    this.actionButton = this.createSelectButton(
      centerX,
      panelY + panelHeight - 54,
      Math.min(280, panelWidth - 38),
    );

    this.actionButton.container.setDepth(7);

    this.actionButton.container.on("activate", () => {
      void this.handleActionButton();
    });

    this.updateActionButton();
  }

  private updatePreview(character: CharacterData): void {
    this.preview?.setTexture(character.spritesheetKey);

    this.preview?.play(
      this.createPreviewAnimation(character.spritesheetKey),
      true,
    );

    this.nameText?.setText(character.name);

    this.descriptionText?.setText(character.description);
  }

  private updateSelectedLabel(): void {
    if (!this.selectedLabel || !this.actionButton) {
      return;
    }

    const labelCenterX = this.actionButton.container.x;

    this.selectedLabel.setOrigin(0.5).setX(labelCenterX);

    this.selectedGemIcon?.setVisible(false).setX(labelCenterX);

    const state = this.raiderStates.get(this.selectedCharacter);
    const isEquipped = this.equippedCharacter === this.selectedCharacter;
    const isOwned = this.selectedCharacter === 16 || state?.owned === true;

    if (isEquipped) {
      this.selectedLabel.setText("CURRENTLY SELECTED").setColor("#8cffad");

      return;
    }

    if (isOwned) {
      this.selectedLabel.setText("OWNED").setColor("#a9efff");

      return;
    }

    if (state?.unlockType === "gem") {
      const text =
        `${this.playergem.toLocaleString()} / ` +
        state.requirementAmount.toLocaleString();

      this.selectedLabel
        .setText(text)
        .setColor(state.requirementMet ? "#ffe58a" : "#9ba8ae");

      const iconSize = 18;
      const gap = 6;
      const totalWidth = iconSize + gap + this.selectedLabel.width;

      const leftX = labelCenterX - totalWidth / 2;

      this.selectedGemIcon
        ?.setVisible(true)
        .setPosition(leftX + iconSize / 2, this.selectedLabel.y);

      this.selectedLabel.setOrigin(0, 0.5).setX(leftX + iconSize + gap);

      return;
    }

    if (state?.requirementMet) {
      this.selectedLabel
        .setText("UNLOCK REQUIREMENT COMPLETE")
        .setColor("#ffe58a");

      return;
    }

    if (state?.unlockType === "highscore") {
      this.selectedLabel
        .setText(
          `HIGH SCORE ${this.allTimeHighScore.toLocaleString()} / ` +
            state.requirementAmount.toLocaleString(),
        )
        .setColor("#9ba8ae");

      return;
    }

    if (state?.unlockType === "king") {
      const kingDay = this.formatKingDay(state.kingDay);

      this.selectedLabel
        .setText(`DEFEAT THE ${kingDay} KING`)
        .setColor("#9ba8ae");

      return;
    }

    this.selectedLabel.setText("LOCKED").setColor("#9ba8ae");
  }

  private async loadRaiderCollection(): Promise<void> {
    try {
      const response = await fetch("/api/raider-collection", {
        headers: {
          Accept: "application/json",
        },
      });

      const responseData = (await response.json()) as unknown;

      if (!response.ok) {
        const errorData = responseData as ApiErrorResponse;

        throw new Error(
          errorData.message ?? "Unable to load Raider collection.",
        );
      }

      const data = responseData as RaiderCollectionResponse;

      const selectedDefinition = characterMap[data.selectedRaider];

      if (
        data.type !== "raider-collection" ||
        !selectedDefinition ||
        selectedDefinition.type !== "raider"
      ) {
        throw new Error("Invalid Raider collection response.");
      }
      this.isLoggedIn = true;
      this.equippedCharacter = data.selectedRaider;

      this.selectedCharacter = data.selectedRaider;

      this.allTimeHighScore = data.allTimeHighScore;

      this.playergem = data.gem;

      this.raiderStates.clear();

      data.raiders.forEach((raider) => {
        this.raiderStates.set(raider.characterCode, raider);
      });
    } catch (error) {
      this.isLoggedIn = false;
      console.error("[Collections] Failed to load collection:", error);

      this.equippedCharacter = 16;
      this.selectedCharacter = 16;

      this.raiderStates.clear();

      this.raiderStates.set(16, {
        characterCode: 16,
        owned: true,
        selected: true,
        unlockType: "free",
        requirementAmount: 0,
        requirementMet: true,
      });
    }
  }

  private formatKingDay(kingDay: KingDay | undefined): string {
    if (!kingDay) {
      return "DAILY";
    }

    return kingDay.toUpperCase();
  }

  private async saveSelectedRaider(): Promise<void> {
    const characterCode = this.selectedCharacter;
    const character = characterMap[characterCode];

    if (!character || character.type !== "raider") {
      this.selectedLabel?.setText("INVALID RAIDER").setColor("#ff8f8f");
      return;
    }

    this.actionInProgress = true;
    this.updateActionButton();
    this.selectedLabel?.setText("SELECTING...").setColor("#ffe58a");

    try {
      const response = await fetch("/api/selected-raider", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          characterCode,
        }),
      });

      const responseData = (await response.json()) as unknown;

      if (!response.ok) {
        const errorData = responseData as ApiErrorResponse;
        throw new Error(errorData.message ?? "Unable to select Raider.");
      }

      const data = responseData as SaveSelectedRaiderResponse;

      if (data.type !== "save-selected-raider" || data.status !== "success") {
        throw new Error("Unexpected selected Raider response.");
      }

      this.equippedCharacter = data.characterCode;

      this.raiderStates.forEach((state) => {
        state.selected = state.characterCode === data.characterCode;
      });

      // console.log("[Collections] Selected Raider:", this.equippedCharacter);

      this.refreshCharacterCards();
      this.updateSelectedLabel();
    } catch (error) {
      console.error("[Collections] Failed to select Raider:", error);

      this.selectedLabel
        ?.setText(error instanceof Error ? error.message : "SELECT FAILED")
        .setColor("#ff8f8f");
    } finally {
      this.actionInProgress = false;
      this.updateActionButton();
    }
  }

  private updateActionButton(): void {
    if (!this.actionButton) {
      return;
    }

    const state = this.raiderStates.get(this.selectedCharacter);
    const isEquipped = this.equippedCharacter === this.selectedCharacter;
    const isOwned = this.selectedCharacter === 16 || state?.owned === true;

    let label = "LOCKED";

    let subtitle = this.isLoggedIn
      ? "REQUIREMENT NOT MET"
      : "LOGIN TO CHECK REQUIREMENT";

    let enabled = false;
    let topColour = 0x3b4950;
    let bottomColour = 0x202b30;
    let borderColour = 0x71808a;

    if (!this.isLoggedIn) {
      label = "LOCKED";
      subtitle = "LOGIN TO CHECK REQUIREMENT";

      enabled = false;

      topColour = 0x3b4950;
      bottomColour = 0x202b30;
      borderColour = 0x71808a;
    } else if (this.actionInProgress) {
      label = "PLEASE WAIT...";
      subtitle = "UPDATING COLLECTION";
    } else if (isEquipped) {
      label = "SELECTED";
      subtitle = "CURRENT RAIDER";
      topColour = 0x2e8f53;
      bottomColour = 0x145b32;
      borderColour = 0x8cffad;
    } else if (isOwned) {
      label = "SELECT RAIDER";
      subtitle = "USE IN YOUR NEXT RUN";
      enabled = true;
      topColour = 0x39c86d;
      bottomColour = 0x157c3d;
      borderColour = 0xa3ffc1;
    } else if (state?.requirementMet) {
      label = "UNLOCK RAIDER";

      if (state.unlockType === "gem") {
        subtitle = `${state.requirementAmount.toLocaleString()} gem REQUIRED`;
      } else if (state.unlockType === "highscore") {
        subtitle = `${state.requirementAmount.toLocaleString()} HIGH SCORE REQUIRED`;
      } else if (state.unlockType === "king") {
        const kingDay = this.formatKingDay(state.kingDay);

        subtitle = `${kingDay} KING DEFEATED`;
      } else {
        subtitle = "FREE RAIDER";
      }

      enabled = true;

      topColour = 0xd19a31;
      bottomColour = 0x805412;
      borderColour = 0xffc65c;
    } else if (state?.unlockType === "highscore") {
      label = "LOCKED";
      subtitle = `HIGH SCORE ${this.allTimeHighScore.toLocaleString()} / ${state.requirementAmount.toLocaleString()}`;
    } else if (state?.unlockType === "gem") {
      const missinggem = Math.max(0, state.requirementAmount - this.playergem);

      label = "LOCKED";
      subtitle = `NEED ${missinggem.toLocaleString()} MORE gem`;
    } else if (state?.unlockType === "king") {
      const kingDay = this.formatKingDay(state.kingDay);

      label = "LOCKED";
      subtitle = `DEFEAT ${kingDay} KING`;
    }

    this.actionButton.label.setText(label);
    this.actionButton.subtitle.setText(subtitle);
    this.actionButton.top.setFillStyle(topColour, 1);
    this.actionButton.bottom.setFillStyle(bottomColour, 1);
    this.actionButton.interactionArea.setStrokeStyle(2, borderColour, 0.82);

    if (enabled && !this.actionInProgress) {
      this.actionButton.interactionArea.setInteractive({
        useHandCursor: true,
      });
      this.actionButton.container.setAlpha(1);
    } else {
      this.actionButton.interactionArea.disableInteractive();
      this.actionButton.container.setAlpha(0.78);
    }
  }

  private async handleActionButton(): Promise<void> {
    if (this.actionInProgress) {
      return;
    }

    const state = this.raiderStates.get(this.selectedCharacter);
    const isOwned = this.selectedCharacter === 16 || state?.owned === true;
    if (!this.isLoggedIn) {
      this.selectedLabel
        ?.setText("LOGIN TO CHECK REQUIREMENT")
        .setColor("#9ba8ae");

      return;
    }

    if (this.equippedCharacter === this.selectedCharacter) {
      return;
    }

    if (isOwned) {
      await this.saveSelectedRaider();
      return;
    }

    if (state?.requirementMet) {
      await this.unlockSelectedRaider();
    }
  }

  private async unlockSelectedRaider(): Promise<void> {
    const characterCode = this.selectedCharacter;

    this.actionInProgress = true;
    this.updateActionButton();
    this.selectedLabel?.setText("UNLOCKING...").setColor("#ffe58a");

    try {
      const response = await fetch("/api/unlock-raider", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          characterCode,
        }),
      });

      const responseData = (await response.json()) as unknown;

      if (!response.ok) {
        const errorData = responseData as ApiErrorResponse;
        throw new Error(errorData.message ?? "Unable to unlock Raider.");
      }

      const data = responseData as UnlockRaiderResponse;

      if (data.type !== "unlock-raider" || data.status !== "success") {
        throw new Error("Unexpected unlock response.");
      }

      const state = this.raiderStates.get(data.characterCode);

      if (state) {
        state.owned = true;
        state.requirementMet = true;
      }

      this.playergem = data.remaininggem;

      this.selectedLabel?.setText("RAIDER UNLOCKED").setColor("#8cffad");
      this.refreshCharacterCards();
    } catch (error) {
      console.error("[Collections] Failed to unlock Raider:", error);

      this.selectedLabel
        ?.setText(error instanceof Error ? error.message : "UNLOCK FAILED")
        .setColor("#ff8f8f");
    } finally {
      this.actionInProgress = false;
      this.updateActionButton();
    }
  }

  private createPanelBackground(
    x: number,
    y: number,
    width: number,
    height: number,
  ): GameObjects.Graphics {
    const panel = this.add.graphics();

    panel.fillStyle(0x0f2737, 0.76);

    panel.fillRoundedRect(x, y, width, height, 18);

    panel.lineStyle(1, 0x55d7ff, 0.24);

    panel.strokeRoundedRect(x, y, width, height, 18);

    return panel;
  }

  private createSelectButton(
    x: number,
    y: number,
    width: number,
  ): {
    container: GameObjects.Container;
    top: GameObjects.Rectangle;
    bottom: GameObjects.Rectangle;
    interactionArea: GameObjects.Rectangle;
    label: GameObjects.Text;
    subtitle: GameObjects.Text;
  } {
    const height = 58;

    const container = this.add.container(x, y);

    const glow = this.add.rectangle(
      0,
      4,
      width + 12,
      height + 12,
      0x8cffad,
      0.045,
    );

    const shadow = this.add.rectangle(0, 7, width, height, 0x000000, 0.54);

    const top = this.add.rectangle(
      0,
      -height * 0.24,
      width,
      height * 0.52,
      0x39c86d,
      1,
    );

    const bottom = this.add.rectangle(
      0,
      height * 0.25,
      width,
      height * 0.5,
      0x157c3d,
      1,
    );

    const interactionArea = this.add
      .rectangle(0, 0, width, height, 0xffffff, 0.001)
      .setStrokeStyle(2, 0xa3ffc1, 0.82)
      .setInteractive({
        useHandCursor: true,
      });

    const label = this.add
      .text(0, -5, "SELECT RAIDER", {
        font: "bold 16px Orbitron",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
        align: "center",
      })
      .setOrigin(0.5);

    const subtitle = this.add
      .text(0, 16, "USE IN YOUR NEXT RUN", {
        font: "bold 14px Orbitron",
        color: "#d9ffe5",
        stroke: "#000000",
        strokeThickness: 2,
        align: "center",
      })
      .setOrigin(0.5);

    container.add([
      glow,
      shadow,
      top,
      bottom,
      interactionArea,
      label,
      subtitle,
    ]);

    let pressedHere = false;

    audioManager.addButtonSound(interactionArea);

    interactionArea.on("pointerover", () => {
      container.setScale(1.025);
      glow.setAlpha(0.12);
    });

    interactionArea.on("pointerout", () => {
      pressedHere = false;
      container.setScale(1);
      glow.setAlpha(0.045);
    });

    interactionArea.on("pointerdown", () => {
      pressedHere = true;
      container.setScale(0.97);
    });

    interactionArea.on("pointerup", () => {
      container.setScale(1);

      if (!pressedHere) {
        return;
      }

      pressedHere = false;
      container.emit("activate");
    });

    interactionArea.on("pointerupoutside", () => {
      pressedHere = false;
      container.setScale(1);
    });

    return {
      container,
      top,
      bottom,
      interactionArea,
      label,
      subtitle,
    };
  }

  private createScrollBar(x: number, y: number, height: number): void {
    this.scrollBarTrack = this.add
      .rectangle(x, y, 14, height, 0x06131d, 0.86)
      .setOrigin(0.5, 0)
      .setInteractive({
        useHandCursor: true,
      })
      .setDepth(8);

    const visibleRatio =
      this.gridContentHeight > 0
        ? Math.min(1, this.gridViewportHeight / this.gridContentHeight)
        : 1;

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

    this.scrollBarTrack.on("pointerdown", (pointer: Input.Pointer) => {
      if (!this.scrollBarThumb) {
        return;
      }

      const thumbHeight = this.scrollBarThumb.displayHeight;

      const desiredThumbY = pointer.y - thumbHeight / 2;

      this.setScrollFromThumbY(desiredThumbY);
    });

    this.scrollBarThumb.on("pointerover", () => {
      this.scrollBarThumb?.setFillStyle(0xa9efff, 1);
    });

    this.scrollBarThumb.on("pointerout", () => {
      if (!this.isDraggingScrollBar) {
        this.scrollBarThumb?.setFillStyle(0x55d7ff, 0.78);
      }
    });

    this.scrollBarThumb.on("dragstart", (pointer: Input.Pointer) => {
      if (!this.scrollBarThumb) {
        return;
      }

      this.isDraggingScrollBar = true;

      this.isDraggingContent = false;

      this.scrollBarDragOffset = pointer.y - this.scrollBarThumb.y;

      this.scrollBarThumb.setFillStyle(0xa9efff, 1);
    });

    this.scrollBarThumb.on("drag", (pointer: Input.Pointer) => {
      const desiredThumbY = pointer.y - this.scrollBarDragOffset;

      this.setScrollFromThumbY(desiredThumbY);
    });

    this.scrollBarThumb.on("dragend", () => {
      this.isDraggingScrollBar = false;

      this.scrollBarThumb?.setFillStyle(0x55d7ff, 0.78);
    });
  }

  private setScrollFromThumbY(desiredThumbY: number): void {
    if (
      !this.scrollBarTrack ||
      !this.scrollBarThumb ||
      this.maximumScroll <= 0
    ) {
      return;
    }

    const trackTop = this.scrollBarTrack.y;

    const trackHeight = this.scrollBarTrack.displayHeight;

    const thumbHeight = this.scrollBarThumb.displayHeight;

    const maximumThumbY = trackTop + trackHeight - thumbHeight;

    const clampedThumbY = Math.max(
      trackTop,
      Math.min(maximumThumbY, desiredThumbY),
    );

    const travelDistance = Math.max(1, maximumThumbY - trackTop);

    const ratio = (clampedThumbY - trackTop) / travelDistance;

    this.setScrollPosition(ratio * this.maximumScroll);
  }

  private configureScrolling(): void {
    this.input.on("wheel", this.handleMouseWheel, this);

    this.input.on("pointerdown", this.handlePointerDown, this);

    this.input.on("pointermove", this.handlePointerMove, this);

    this.input.on("pointerup", this.handlePointerUp, this);
  }

  private removeScrollingListeners(): void {
    this.input.off("wheel", this.handleMouseWheel, this);

    this.input.off("pointerdown", this.handlePointerDown, this);

    this.input.off("pointermove", this.handlePointerMove, this);

    this.input.off("pointerup", this.handlePointerUp, this);
  }

  private handleMouseWheel(
    pointer: Input.Pointer,
    _gameObjects: GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ): void {
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
    if (
      !this.isDraggingContent ||
      this.isDraggingScrollBar ||
      !pointer.isDown
    ) {
      return;
    }

    const movement = pointer.y - this.dragPreviousY;

    this.dragDistance = Math.max(
      this.dragDistance,
      Math.abs(pointer.y - this.dragStartY),
    );

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
      pointer.x >= this.gridViewportX &&
      pointer.x <= this.gridViewportX + this.gridViewportWidth &&
      pointer.y >= this.gridViewportY &&
      pointer.y <= this.gridViewportY + this.gridViewportHeight
    );
  }

  private setScrollPosition(value: number): void {
    this.scrollY = Math.max(0, Math.min(this.maximumScroll, value));

    this.gridCamera?.setScroll(
      this.gridViewportX,
      this.gridViewportY + this.scrollY,
    );

    this.updateScrollBarThumb();
  }

  private updateScrollBarThumb(): void {
    if (
      !this.scrollBarTrack ||
      !this.scrollBarThumb ||
      this.maximumScroll <= 0
    ) {
      return;
    }

    const trackTop = this.scrollBarTrack.y;

    const trackHeight = this.scrollBarTrack.displayHeight;

    const thumbHeight = this.scrollBarThumb.displayHeight;

    const travelDistance = trackHeight - thumbHeight;

    const scrollRatio = this.scrollY / this.maximumScroll;

    this.scrollBarThumb.y = trackTop + travelDistance * scrollRatio;
  }

  private createFooter(
    cardX: number,
    cardY: number,
    cardWidth: number,
    cardHeight: number,
  ): void {
    const footerY = cardY + cardHeight - 24;

    this.add.rectangle(
      cardX + cardWidth / 2,
      footerY - 20,
      cardWidth - 48,
      1,
      0x55d7ff,
      0.12,
    );

    this.add
      .text(
        cardX + cardWidth / 2,
        footerY,
        "SCROLL OR DRAG INSIDE AVAILABLE RAIDERS TO VIEW MORE",
        {
          font: "14px Orbitron",

          color: "#879ca8",

          stroke: "#000000",

          strokeThickness: 2,
        },
      )
      .setOrigin(0.5);
  }

  private createCircularIconTexture(
    sourceTextureKey: string,
    outputTextureKey: string,
    zoom = 1.25,
  ): string {
    if (this.textures.exists(outputTextureKey)) {
      return outputTextureKey;
    }

    const textureSize = 256;

    const canvasTexture = this.textures.createCanvas(
      outputTextureKey,
      textureSize,
      textureSize,
    );

    if (!canvasTexture) {
      return sourceTextureKey;
    }

    const context = canvasTexture.getContext();

    const sourceImage = this.textures
      .get(sourceTextureKey)
      .getSourceImage() as CanvasImageSource;

    context.clearRect(0, 0, textureSize, textureSize);

    context.save();

    context.beginPath();

    context.arc(
      textureSize / 2,
      textureSize / 2,
      textureSize / 2,
      0,
      Math.PI * 2,
    );

    context.closePath();
    context.clip();

    const drawnSize = textureSize * zoom;

    const drawX = (textureSize - drawnSize) / 2;

    const drawY = (textureSize - drawnSize) / 2;

    context.drawImage(sourceImage, drawX, drawY, drawnSize, drawnSize);

    context.restore();

    canvasTexture.refresh();

    return outputTextureKey;
  }
}
