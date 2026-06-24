import * as Phaser from 'phaser';
import type BattleUI from './BattleUI';

export default class BattleShop {
    private ui: BattleUI;
    shopModalContainer: Phaser.GameObjects.Container | null;

    scrollableContainer: Phaser.GameObjects.Container | null;

    shopHeaderContainer: Phaser.GameObjects.Container | null;

    shopContentCamera: Phaser.Cameras.Scene2D.Camera | null;

    modalBackground: Phaser.GameObjects.Graphics | null;

    invisibleBackground: Phaser.GameObjects.Rectangle | null;

    headerBackground: Phaser.GameObjects.Graphics | null;

    closeButtonText: Phaser.GameObjects.Text | null;

    scrollbarTrack: Phaser.GameObjects.Rectangle | null;

    scrollbarHandle: Phaser.GameObjects.Rectangle | null;

    scrollPosition: number;

    damageSectionTitle: Phaser.GameObjects.Text | null;

    healthSectionTitle: Phaser.GameObjects.Text | null;

    attackSpeedSectionTitle: Phaser.GameObjects.Text | null;

    movementSpeedSectionTitle: Phaser.GameObjects.Text | null;

    legendaryUpgradesSectionTitle: Phaser.GameObjects.Text | null;

    upgradeTooltip: Phaser.GameObjects.Text | null;

    currentFeedbackText: Phaser.GameObjects.Text | null;

    goldTextShop: Phaser.GameObjects.Text | null;

    penknifeBulkBuyButton: Phaser.GameObjects.Text | null;

    buyButtons: any[];

    itemPurchaseLimit: number;
    purchaseCounts: Record<string, number>;

    legendaryPurchaseLimit: number;
    legendaryPurchaseCount: Record<string, number>;

    purchaseCountText: any;
    legendaryPurchaseCountText: any;

    legendaryIcons: Array<{
        name: string;
        icon: Phaser.GameObjects.Image;
    }>;

    mask: any;

    private shopWasDragged = false;

    constructor(ui: BattleUI) {
        this.ui = ui;

        this.shopModalContainer = null;
        this.scrollableContainer = null;
        this.shopHeaderContainer = null;
        this.shopContentCamera = null;

        this.modalBackground = null;
        this.invisibleBackground = null;
        this.headerBackground = null;
        this.closeButtonText = null;

        this.scrollbarTrack = null;
        this.scrollbarHandle = null;
        this.scrollPosition = 0;

        this.damageSectionTitle = null;
        this.healthSectionTitle = null;
        this.attackSpeedSectionTitle = null;
        this.movementSpeedSectionTitle = null;
        this.legendaryUpgradesSectionTitle = null;

        this.upgradeTooltip = null;
        this.currentFeedbackText = null;

        this.goldTextShop = null;
        this.penknifeBulkBuyButton = null;

        this.buyButtons = [];

        this.itemPurchaseLimit = 5;

        this.purchaseCounts = {
            'Energy Gun': 0,
            Quickblade: 0,
            'Lightning Core': 0,
            'Mecha Sneakers': 0,
        };

        this.legendaryPurchaseLimit = 1;

        this.legendaryPurchaseCount = {
            'Thunderlord Seal': 0,
            'Elixir of Life': 0,
            'Winter Frost': 0,
            'Treasure Hunter': 0,
            'Forbidden Excalibur': 0,
            'Soul of the Phoenix': 0,
            'Cosmic Scimitar': 0,
        };

        this.purchaseCountText = null;
        this.legendaryPurchaseCountText = null;

        this.legendaryIcons = [];
        this.mask = null;
    }

    reset(): void {
        this.buyButtons = [];
        this.currentFeedbackText = null;

        this.scrollPosition = 0;

        this.itemPurchaseLimit = 5;

        this.purchaseCounts = {
            'Energy Gun': 0,
            Quickblade: 0,
            'Lightning Core': 0,
            'Mecha Sneakers': 0,
        };

        this.legendaryPurchaseLimit = 1;

        this.legendaryPurchaseCount = {
            'Thunderlord Seal': 0,
            'Elixir of Life': 0,
            'Winter Frost': 0,
            'Treasure Hunter': 0,
            'Forbidden Excalibur': 0,
            'Soul of the Phoenix': 0,
            'Cosmic Scimitar': 0,
        };

        this.purchaseCountText = null;
        this.legendaryPurchaseCountText = null;

        this.goldTextShop = null;
        this.penknifeBulkBuyButton = null;

        this.legendaryIcons = [];

        this.shopModalContainer = null;
        this.scrollableContainer = null;
        this.shopHeaderContainer = null;
        this.shopContentCamera = null;

        this.modalBackground = null;
        this.invisibleBackground = null;
        this.headerBackground = null;
        this.closeButtonText = null;

        this.scrollbarTrack = null;
        this.scrollbarHandle = null;

        this.damageSectionTitle = null;
        this.healthSectionTitle = null;
        this.attackSpeedSectionTitle = null;
        this.movementSpeedSectionTitle = null;
        this.legendaryUpgradesSectionTitle = null;

        this.upgradeTooltip = null;
        this.mask = null;
    }

    open(): void {
        if (!this.shopModalContainer || !this.shopModalContainer.active || !this.shopContentCamera) {
            this.createShopModal();
        }

        this.toggleShopModal(true);
    }

    close(): void {
        this.toggleShopModal(false);
    }

    updateGoldDisplay(): void {
        if (this.goldTextShop) {
            this.goldTextShop.setText(String(this.ui.gold));
        }
    }

    update(): void {
        if (this.penknifeBulkBuyButton) {
            const canAffordBulkBuy = this.ui.gold >= 55;

            this.penknifeBulkBuyButton.setText(canAffordBulkBuy ? 'BULK BUY' : '');
        }

        this.buyButtons.forEach((item: any) => {
            if (item.cost === 9999) {
                return;
            }

            if (this.purchaseCounts.hasOwnProperty(item.upgradeName) && this.purchaseCounts[item.upgradeName]! >= this.itemPurchaseLimit) {
                item.button.setText('Limit reached').setStyle({
                    color: '#FF0000',
                });

                return;
            }

            if (this.legendaryPurchaseCount.hasOwnProperty(item.upgradeName) && this.legendaryPurchaseCount[item.upgradeName]! >= this.legendaryPurchaseLimit) {
                item.button.setText('Limit reached').setStyle({
                    color: '#FF0000',
                });

                return;
            }

            if (this.ui.gold >= item.cost) {
                item.button.setText('BUY').setStyle({
                    color: '#4CAF50',
                });
            } else {
                item.button.setText('Not enough gold').setStyle({
                    color: '#FF0000',
                });
            }
        });
    }

    createShopModal(): void {
        const screenWidth = this.ui.scale.width;
        const screenHeight = this.ui.scale.height;

        const modalWidth = 840;
        const modalHeight = 560;

        const modalX = (screenWidth - modalWidth) / 2;

        const modalY = (screenHeight - modalHeight) / 2;

        const headerHeight = 58;
        const contentPadding = 20;
        const scrollbarWidth = 12;

        const viewportX = modalX + contentPadding;

        const viewportY = modalY + headerHeight + 12;

        const viewportWidth = modalWidth - contentPadding * 2 - scrollbarWidth - 8;

        const viewportHeight = modalHeight - headerHeight - 28;

        this.shopModalContainer = this.ui.add.container(0, 0).setDepth(1000).setVisible(false);

        this.invisibleBackground = this.ui.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.72).setOrigin(0, 0).setInteractive();

        this.invisibleBackground.on('pointerdown', () => {
            // Intentionally empty.
        });

        this.modalBackground = this.ui.add
            .graphics()
            .fillStyle(0x111923, 0.98)
            .fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 16)
            .lineStyle(2, 0x50c8ff, 0.9)
            .strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 16);

        this.headerBackground = this.ui.add.graphics().fillStyle(0x1d3447, 1).fillRoundedRect(modalX, modalY, modalWidth, headerHeight, {
            tl: 16,
            tr: 16,
            bl: 0,
            br: 0,
        });

        const shopTitle = this.ui.add
            .text(modalX + modalWidth / 2, modalY + headerHeight / 2, 'UPGRADE SHOP', {
                font: 'bold 22px Orbitron',
                color: '#ffffff',
            })
            .setOrigin(0.5);

        const goldIcon = this.ui.add
            .image(modalX + 26, modalY + headerHeight / 2, 'gold')
            .setScale(0.42)
            .setOrigin(0.5);

        this.goldTextShop = this.ui.add
            .text(modalX + 47, modalY + headerHeight / 2, String(this.ui.gold), {
                font: '17px Orbitron',
                color: '#ffd84a',
            })
            .setOrigin(0, 0.5);

        this.closeButtonText = this.ui.add
            .text(modalX + modalWidth - 18, modalY + headerHeight / 2, '✕', {
                font: 'bold 22px Arial',
                color: '#ffffff',
                backgroundColor: '#9e3030',
                padding: {
                    x: 10,
                    y: 5,
                },
            })
            .setOrigin(1, 0.5)
            .setInteractive({
                useHandCursor: true,
            });

        this.closeButtonText.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
            this.toggleShopModal(false);
        });
        this.shopModalContainer.add([this.invisibleBackground, this.modalBackground]);

        this.scrollableContainer = this.ui.add.container(0, 0).setDepth(1001).setVisible(false);

        this.shopContentCamera = this.ui.cameras.add(viewportX, viewportY, viewportWidth, viewportHeight);

        this.shopContentCamera.setScroll(viewportX, viewportY).setBackgroundColor('rgba(0,0,0,0)').setVisible(false);

        this.shopHeaderContainer = this.ui.add.container(0, 0).setDepth(1002).setVisible(false);

        this.shopHeaderContainer.add([this.headerBackground, shopTitle, goldIcon, this.goldTextShop, this.closeButtonText]);

        const damageUpgrades = [
            {
                name: 'Penknife',
                description: 'Increase damage by 1',
                cost: 55,
                icon: 'sword1',
            },
            {
                name: "Hunter's Blade",
                description: 'Increase damage by 2%',
                cost: 200,
                icon: 'sword2',
            },
        ];

        const healthUpgrades = [
            {
                name: "Heaven's Rain",
                description: 'Increase max health by 12%',
                cost: 750,
                icon: 'health1',
            },
            {
                name: 'Health Potion',
                description: 'Restore 50% of maximum health',
                cost: 300,
                icon: 'health2',
            },
        ];

        const attackSpeedUpgrades = [
            {
                name: 'Energy Gun',
                description: 'Increase attack speed by 9%',
                cost: 660,
                icon: 'attackSpeed1',
            },
            {
                name: 'Quickblade',
                description: 'Increase attack speed by 18%',
                cost: 1250,
                icon: 'attackSpeed2',
            },
        ];

        const movementSpeedUpgrades = [
            {
                name: 'Lightning Core',
                description: 'Increase movement speed by 6%',
                cost: 700,
                icon: 'moveSpeed1',
            },
            {
                name: 'Mecha Sneakers',
                description: 'Increase movement speed by 12%',
                cost: 1300,
                icon: 'moveSpeed2',
            },
        ];

        const legendaryUpgrades = [
            {
                name: 'Cash',
                description: 'Exchange 300 Gold for 1 Cash',
                cost: 300,
                icon: 'cash',
            },
            {
                name: 'Thunderlord Seal',
                description: 'Permanent immunity to catastrophe storms',
                cost: 7000,
                icon: 'thunderlordSeal',
            },
            {
                name: 'Elixir of Life',
                description: 'Triple passive healing',
                cost: 5400,
                icon: 'elixirOfLife',
            },
            {
                name: 'Winter Frost',
                description: 'Greatly reduces enraged enemy movement speed',
                cost: 5600,
                icon: 'winterFrost',
            },
            {
                name: 'Treasure Hunter',
                description: 'Every Gold drop is worth twice as much',
                cost: 4800,
                icon: 'treasureFinder',
            },
            {
                name: 'Forbidden Excalibur',
                description: 'Double damage and health for the next 5 bases',
                cost: 9999,
                icon: 'sword2',
            },
            {
                name: 'Soul of the Phoenix',
                description: 'Revive once after being defeated',
                cost: 9999,
                icon: 'attackSpeed2',
            },
            {
                name: 'Cosmic Scimitar',
                description: 'Gain damage and health after each destroyed base',
                cost: 9999,
                icon: 'sword2',
            },
        ];
        const columnGap = 16;

        const columnWidth = (viewportWidth - columnGap) / 2;

        const leftColumnX = viewportX;

        const rightColumnX = viewportX + columnWidth + columnGap;

        let leftY = viewportY;
        let rightY = viewportY;

        this.damageSectionTitle = this.createShopSectionTitle(leftColumnX, leftY, 'DAMAGE');

        leftY += 34;

        leftY = this.createItems(damageUpgrades, leftColumnX, leftY, columnWidth);

        leftY += 18;

        this.attackSpeedSectionTitle = this.createShopSectionTitle(leftColumnX, leftY, 'ATTACK SPEED');

        leftY += 34;

        leftY = this.createItems(attackSpeedUpgrades, leftColumnX, leftY, columnWidth);

        this.healthSectionTitle = this.createShopSectionTitle(rightColumnX, rightY, 'HEALTH');

        rightY += 34;

        rightY = this.createItems(healthUpgrades, rightColumnX, rightY, columnWidth);

        rightY += 18;

        this.movementSpeedSectionTitle = this.createShopSectionTitle(rightColumnX, rightY, 'MOVEMENT SPEED');

        rightY += 34;

        rightY = this.createItems(movementSpeedUpgrades, rightColumnX, rightY, columnWidth);

        let legendaryY = Math.max(leftY, rightY) + 26;

        this.legendaryUpgradesSectionTitle = this.createShopSectionTitle(viewportX, legendaryY, 'LEGENDARY UPGRADES');

        legendaryY += 38;

        const contentBottom = this.createItems(legendaryUpgrades, viewportX, legendaryY, viewportWidth);

        this.scrollableContainer.add([this.damageSectionTitle, this.healthSectionTitle, this.attackSpeedSectionTitle, this.movementSpeedSectionTitle, this.legendaryUpgradesSectionTitle]);

        const contentTop = viewportY;

        const contentHeight = contentBottom - contentTop;

        const minimumScrollY = Math.min(0, viewportHeight - contentHeight - 16);

        const trackX = modalX + modalWidth - contentPadding - scrollbarWidth / 2;

        const trackY = viewportY;

        this.scrollbarTrack = this.ui.add.rectangle(trackX, trackY, scrollbarWidth, viewportHeight, 0xffffff, 0.16).setOrigin(0.5, 0);

        const visibleRatio = Math.min(1, viewportHeight / contentHeight);

        const handleHeight = Math.max(54, viewportHeight * visibleRatio);

        this.scrollbarHandle = this.ui.add.rectangle(trackX, trackY, scrollbarWidth, handleHeight, 0x50c8ff, 0.9).setOrigin(0.5, 0).setInteractive({
            useHandCursor: true,
        });

        this.scrollbarTrack.setDepth(1002).setVisible(false);

        this.scrollbarHandle.setDepth(1003).setVisible(false);

        const handleRange = viewportHeight - handleHeight;

        let isDraggingContent = false;
        let isDraggingHandle = false;

        let activePointerId: number | null = null;

        let dragStartY = 0;
        let previousPointerY = 0;
        let totalDragDistance = 0;

        const dragThreshold = 6;

        const isInsideShopModal = (pointer: Phaser.Input.Pointer): boolean => {
            return pointer.x >= modalX && pointer.x <= modalX + modalWidth && pointer.y >= viewportY && pointer.y <= modalY + modalHeight;
        };

        const updateScrollbarFromContent = (): void => {
            if (!this.scrollbarHandle || !this.scrollableContainer) {
                return;
            }

            if (minimumScrollY === 0 || handleRange <= 0) {
                this.scrollbarHandle.y = trackY;

                return;
            }

            const ratio = this.scrollableContainer.y / minimumScrollY;

            this.scrollbarHandle.y = trackY + Phaser.Math.Clamp(ratio, 0, 1) * handleRange;
        };

        const updateContentFromScrollbar = (): void => {
            if (!this.scrollbarHandle || !this.scrollableContainer) {
                return;
            }

            if (handleRange <= 0) {
                this.scrollableContainer.y = 0;

                return;
            }

            const ratio = (this.scrollbarHandle.y - trackY) / handleRange;

            this.scrollableContainer.y = Phaser.Math.Clamp(ratio, 0, 1) * minimumScrollY;
        };

        const stopDragging = (): void => {
            isDraggingContent = false;
            isDraggingHandle = false;
            activePointerId = null;
            totalDragDistance = 0;

            this.ui.time.delayedCall(0, () => {
                this.shopWasDragged = false;
            });
        };

        this.ui.input.on('pointerdown', (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
            if (!this.shopModalContainer?.visible) {
                return;
            }

            if (this.scrollbarHandle && currentlyOver.includes(this.scrollbarHandle)) {
                return;
            }

            if (!isInsideShopModal(pointer)) {
                return;
            }

            this.shopWasDragged = false;

            activePointerId = pointer.id;
            dragStartY = pointer.y;
            previousPointerY = pointer.y;
            totalDragDistance = 0;
            isDraggingContent = false;
        });

        this.ui.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!this.shopModalContainer?.visible || activePointerId !== pointer.id || isDraggingHandle || !pointer.isDown || !this.scrollableContainer) {
                return;
            }

            const distanceFromStart = Math.abs(pointer.y - dragStartY);

            totalDragDistance = Math.max(totalDragDistance, distanceFromStart);

            if (!isDraggingContent && distanceFromStart < dragThreshold) {
                return;
            }

            isDraggingContent = true;
            this.shopWasDragged = true;
            const deltaY = pointer.y - previousPointerY;

            previousPointerY = pointer.y;

            this.scrollableContainer.y = Phaser.Math.Clamp(this.scrollableContainer.y + deltaY, minimumScrollY, 0);

            updateScrollbarFromContent();
        });

        this.scrollbarHandle.on(
            'pointerdown',
            (
                pointer: Phaser.Input.Pointer,

                _localX: number,

                _localY: number,

                event: Phaser.Types.Input.EventData
            ) => {
                event.stopPropagation();
                this.shopWasDragged = true;
                if (!this.scrollbarHandle || handleRange <= 0) {
                    return;
                }
                activePointerId = pointer.id;

                isDraggingHandle = true;

                isDraggingContent = false;

                previousPointerY = pointer.y;

                this.scrollbarHandle?.setFillStyle(0xa9efff, 1);
            }
        );

        this.ui.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!this.shopModalContainer?.visible || !isDraggingHandle || activePointerId !== pointer.id || !pointer.isDown || !this.scrollbarHandle) {
                return;
            }

            const deltaY = pointer.y - previousPointerY;

            previousPointerY = pointer.y;

            this.scrollbarHandle.y = Phaser.Math.Clamp(this.scrollbarHandle.y + deltaY, trackY, trackY + handleRange);

            updateContentFromScrollbar();
        });

        this.scrollbarTrack
            .setInteractive({
                useHandCursor: true,
            })
            .on(
                'pointerdown',
                (
                    pointer: Phaser.Input.Pointer,

                    _localX: number,

                    _localY: number,

                    event: Phaser.Types.Input.EventData
                ) => {
                    event.stopPropagation();

                    if (!this.scrollbarHandle || handleRange <= 0) {
                        return;
                    }

                    const desiredHandleY = pointer.y - handleHeight / 2;

                    this.scrollbarHandle.y = Phaser.Math.Clamp(desiredHandleY, trackY, trackY + handleRange);

                    updateContentFromScrollbar();
                }
            );

        this.ui.input.on(
            'wheel',
            (
                pointer: Phaser.Input.Pointer,

                _gameObjects: Phaser.GameObjects.GameObject[],

                _deltaX: number,

                deltaY: number
            ) => {
                if (!this.shopModalContainer?.visible || !this.scrollableContainer || !isInsideShopModal(pointer)) {
                    return;
                }

                this.scrollableContainer.y = Phaser.Math.Clamp(this.scrollableContainer.y - deltaY * 0.65, minimumScrollY, 0);

                updateScrollbarFromContent();
            }
        );

        this.ui.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (activePointerId !== pointer.id) {
                return;
            }

            this.scrollbarHandle?.setFillStyle(0x50c8ff, 0.9);

            stopDragging();
        });

        this.ui.input.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => {
            if (activePointerId !== pointer.id) {
                return;
            }

            this.scrollbarHandle?.setFillStyle(0x50c8ff, 0.9);

            stopDragging();
        });

        updateScrollbarFromContent();

        this.ui.cameras.main.ignore(this.scrollableContainer);

        const objectsIgnoredByShopCamera = this.ui.children.list.filter((gameObject) => gameObject !== this.scrollableContainer);

        this.shopContentCamera.ignore(objectsIgnoredByShopCamera);
    }
    private createShopSectionTitle(x: number, y: number, text: string): Phaser.GameObjects.Text {
        const title = this.ui.add.text(x, y, text, {
            font: 'bold 16px Orbitron',
            color: '#ffd84a',
        });

        return title;
    }

    createItems(upgrades: any[], startX: number, startY: number, sectionWidth: number): number {
        const itemHeight = 104;
        const itemGap = 12;

        let bottomY = startY;

        upgrades.forEach((upgrade, index) => {
            const itemY = startY + index * (itemHeight + itemGap);

            const itemWidth = sectionWidth;

            const itemBackground = this.ui.add
                .graphics()
                .fillStyle(0x202c38, 0.96)
                .fillRoundedRect(startX, itemY, itemWidth, itemHeight, 10)
                .lineStyle(1, 0x3c6682, 0.85)
                .strokeRoundedRect(startX, itemY, itemWidth, itemHeight, 10);

            const iconScale = upgrade.icon === 'cash' ? 0.46 : 0.36;

            const icon = this.ui.add.image(startX + 31, itemY + 34, upgrade.icon).setScale(iconScale);

            const nameText = this.ui.add.text(startX + 58, itemY + 10, upgrade.name, {
                font: 'bold 14px Orbitron',
                color: '#50c8ff',
            });

            const descriptionText = this.ui.add.text(startX + 58, itemY + 35, upgrade.description, {
                font: '11px Orbitron',
                color: '#ffffff',
                wordWrap: {
                    width: itemWidth - 76,
                },
            });

            const costIcon = this.ui.add
                .image(startX + 22, itemY + itemHeight - 24, 'gold')
                .setScale(0.26)
                .setOrigin(0.5);

            const costText = this.ui.add
                .text(startX + 38, itemY + itemHeight - 24, String(upgrade.cost), {
                    font: 'bold 13px Orbitron',
                    color: '#ffd84a',
                })
                .setOrigin(0, 0.5);

            let buyButton: Phaser.GameObjects.Text;

            if (upgrade.cost === 9999) {
                buyButton = this.ui.add
                    .text(startX + itemWidth - 14, itemY + itemHeight - 25, 'LOCKED', {
                        font: 'bold 12px Orbitron',
                        color: '#ff6666',
                    })
                    .setOrigin(1, 0.5);
            } else {
                buyButton = this.ui.add
                    .text(startX + itemWidth - 14, itemY + itemHeight - 25, 'BUY', {
                        font: 'bold 13px Orbitron',
                        color: '#ffffff',
                        backgroundColor: '#247f4c',
                        padding: {
                            x: 9,
                            y: 4,
                        },
                    })
                    .setOrigin(1, 0.5)
                    .setInteractive({
                        useHandCursor: true,
                    });

                let buyButtonPressed = false;

                buyButton.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
                    buyButtonPressed = true;
                });

                buyButton.on('pointerout', () => {
                    buyButtonPressed = false;
                });

                buyButton.on('pointerup', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
                    event.stopPropagation();

                    if (!buyButtonPressed || this.shopWasDragged) {
                        buyButtonPressed = false;
                        return;
                    }

                    buyButtonPressed = false;

                    this.purchaseUpgrade(upgrade.name, upgrade.cost, upgrade.icon);
                });

                buyButton.on('pointerupoutside', () => {
                    buyButtonPressed = false;
                });
            }

            this.buyButtons.push({
                button: buyButton,
                cost: upgrade.cost,
                upgradeName: upgrade.name,
            });

            this.scrollableContainer?.add([itemBackground, icon, nameText, descriptionText, costIcon, costText, buyButton]);

            if (upgrade.name === 'Penknife') {
                this.penknifeBulkBuyButton = this.ui.add
                    .text(startX + itemWidth - 72, itemY + itemHeight - 25, 'BULK', {
                        font: 'bold 11px Orbitron',
                        color: '#8ac7ff',
                    })
                    .setOrigin(1, 0.5)
                    .setInteractive({
                        useHandCursor: true,
                    });

                let bulkButtonPressed = false;

                this.penknifeBulkBuyButton.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
                    bulkButtonPressed = true;
                });

                this.penknifeBulkBuyButton.on('pointerout', () => {
                    bulkButtonPressed = false;
                });

                this.penknifeBulkBuyButton.on('pointerup', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
                    event.stopPropagation();

                    if (!bulkButtonPressed || this.shopWasDragged) {
                        bulkButtonPressed = false;
                        return;
                    }

                    bulkButtonPressed = false;

                    this.bulkPurchasePenknife(upgrade.cost);
                });

                this.penknifeBulkBuyButton.on('pointerupoutside', () => {
                    bulkButtonPressed = false;
                });

                this.scrollableContainer!.add(this.penknifeBulkBuyButton);
            }

            if (this.purchaseCounts.hasOwnProperty(upgrade.name)) {
                const purchaseCountText = this.ui.add
                    .text(startX + itemWidth - 10, itemY + 8, `(${this.purchaseCounts[upgrade.name] ?? 0}/${this.itemPurchaseLimit})`, {
                        font: '10px Orbitron',
                        color: '#ffd84a',
                    })
                    .setOrigin(1, 0);

                this.scrollableContainer!.add(purchaseCountText);

                this.buyButtons.push({
                    button: buyButton,
                    cost: upgrade.cost,
                    upgradeName: upgrade.name,
                    purchaseCountText,
                });
            } else if (this.legendaryPurchaseCount.hasOwnProperty(upgrade.name)) {
                const purchaseCountText = this.ui.add
                    .text(startX + itemWidth - 10, itemY + 8, `(${this.legendaryPurchaseCount[upgrade.name] ?? 0}/${this.legendaryPurchaseLimit})`, {
                        font: '10px Orbitron',
                        color: '#ffd84a',
                    })
                    .setOrigin(1, 0);

                this.scrollableContainer!.add(purchaseCountText);

                this.buyButtons.push({
                    button: buyButton,
                    cost: upgrade.cost,
                    upgradeName: upgrade.name,
                    purchaseCountText,
                });
            }

            bottomY = itemY + itemHeight + itemGap;
        });

        return bottomY;
    }

    bulkPurchasePenknife(cost: number) {
        if ((this.ui.scene.get('Game') as any).player.currentHealth <= 0) {
            this.showPurchaseFeedback('You are dead! You cannot purchase upgrades', '#ff0000');
            return;
        }
        const maxPurchases = Math.floor(this.ui.gold / cost);
        if (maxPurchases > 0) {
            this.ui.gold -= maxPurchases * cost;
            this.ui.updateGoldDisplay();
            (this.ui.scene.get('Game') as any).player.damage += maxPurchases;
            this.showPurchaseFeedback(`Bought ${maxPurchases} Penknives! +${maxPurchases} Damage`, '#00ff00');
        }
    }
    toggleShopModal(visible: boolean): void {
        if (
            !this.shopModalContainer ||
            !this.shopModalContainer.active ||
            !this.scrollableContainer ||
            !this.scrollableContainer.active ||
            !this.shopHeaderContainer ||
            !this.shopHeaderContainer.active ||
            !this.shopContentCamera
        ) {
            return;
        }

        this.shopModalContainer.setVisible(visible);

        this.scrollableContainer.setVisible(visible);

        this.shopHeaderContainer.setVisible(visible);

        this.scrollbarTrack?.setVisible(visible);

        this.scrollbarHandle?.setVisible(visible);

        this.shopContentCamera.setVisible(visible);

        if (visible) {
            this.shopWasDragged = false;
            this.scrollableContainer.y = 0;

            if (this.scrollbarHandle && this.scrollbarTrack) {
                this.scrollbarHandle.y = this.scrollbarTrack.y;
            }
        } else {
            this.hideUpgradeTooltip();
        }
    }

    purchaseUpgrade(upgradeName: string, cost: number, upgradeIcon: string) {
        // if player is dead, don't allow purchase
        if ((this.ui.scene.get('Game') as any).player.currentHealth <= 0) {
            this.showPurchaseFeedback('You are dead! You cannot purchase upgrades', '#ff0000');
            return;
        }
        if (this.ui.gold >= cost) {
            if (this.purchaseCounts.hasOwnProperty(upgradeName)) {
                if (this.purchaseCounts[upgradeName]! < this.itemPurchaseLimit) {
                    this.purchaseCounts[upgradeName]!++;
                    const item = this.buyButtons.find((item) => item.upgradeName === upgradeName);
                    if (item && item.purchaseCountText) {
                        item.purchaseCountText.setText(`(${this.purchaseCounts[upgradeName]}/${this.itemPurchaseLimit})`);
                    }
                } else {
                    this.showPurchaseFeedback(`Limit reached for ${upgradeName}`, '#ff0000');
                    return;
                }
            }

            if (this.legendaryPurchaseCount.hasOwnProperty(upgradeName) && upgradeName !== 'Cash') {
                if (this.legendaryPurchaseCount[upgradeName]! < this.legendaryPurchaseLimit) {
                    this.legendaryPurchaseCount[upgradeName]!++;
                    const item = this.buyButtons.find((item) => item.upgradeName === upgradeName);
                    if (item && item.purchaseCountText) {
                        item.purchaseCountText.setText(`(${this.legendaryPurchaseCount[upgradeName]}/${this.legendaryPurchaseLimit})`);
                    }
                } else {
                    this.showPurchaseFeedback(`Limit reached for ${upgradeName}`, '#ff0000');
                    return;
                }
            }

            this.ui.gold -= cost;
            console.log(`Purchased Upgrade: ${upgradeName}`);
            this.ui.updateGoldDisplay();
            this.showPurchaseFeedback(`${upgradeName} Purchased! \n -${cost} Gold`, '#00ff00');
            if (upgradeName === 'Penknife') {
                (this.ui.scene.get('Game') as any).player.damage += 1;
            }
            if (upgradeName === "Hunter's Blade") {
                (this.ui.scene.get('Game') as any).player.damage = Math.round((this.ui.scene.get('Game') as any).player.damage * 1.02);
            }
            if (upgradeName === "Heaven's Rain") {
                (this.ui.scene.get('Game') as any).player.maxHealth = Math.round((this.ui.scene.get('Game') as any).player.maxHealth * 1.12);
            }
            if (upgradeName === 'Health Potion') {
                const healPercentage = 0.5;
                let healAmount = Math.round((this.ui.scene.get('Game') as any).player.maxHealth * healPercentage);
                healAmount = Math.min(healAmount, (this.ui.scene.get('Game') as any).player.maxHealth - (this.ui.scene.get('Game') as any).player.currentHealth);
                (this.ui.scene.get('Game') as any).player.currentHealth += healAmount;
                (this.ui.scene.get('Game') as any).player.createHealingText(healAmount);
            }
            if (upgradeName === 'Energy Gun') {
                (this.ui.scene.get('Game') as any).player.attackSpeed = Math.round((this.ui.scene.get('Game') as any).player.attackSpeed * 1.09 * 100) / 100;
            }
            if (upgradeName === 'Quickblade') {
                (this.ui.scene.get('Game') as any).player.attackSpeed = Math.round((this.ui.scene.get('Game') as any).player.attackSpeed * 1.18 * 100) / 100;
            }
            if (upgradeName === 'Lightning Core') {
                (this.ui.scene.get('Game') as any).player.speed = Math.round((this.ui.scene.get('Game') as any).player.speed * 1.06);
            }
            if (upgradeName === 'Mecha Sneakers') {
                (this.ui.scene.get('Game') as any).player.speed = Math.round((this.ui.scene.get('Game') as any).player.speed * 1.12);
            }
            if (upgradeName === 'Cash') {
                this.ui.cash++;
                this.ui.updateCashDisplay();
            }
            if (upgradeName === 'Thunderlord Seal') {
                (this.ui.scene.get('Game') as any).player.isImmuneToStorms = true;
            }
            if (upgradeName === 'Elixir of Life') {
                (this.ui.scene.get('Game') as any).player.healPercentage *= 3;
            }
            if (upgradeName === 'Winter Frost') {
                (this.ui.scene.get('Game') as any).enemies.forEach((enemy: any) => {
                    enemy.isWinterFrosted = true;
                });
                (this.ui.scene.get('Game') as any).isWinterFrostActive = true;
            }
            if (upgradeName === 'Treasure Hunter') {
                (this.ui.scene.get('Game') as any).enemies.forEach((enemy: any) => {
                    enemy.goldValue *= 2;
                });
                (this.ui.scene.get('Game') as any).base.goldValue *= 2;
                (this.ui.scene.get('Game') as any).isTreasureHunterActive = true;
            }
            if (
                upgradeName === 'Thunderlord Seal' ||
                upgradeName === 'Elixir of Life' ||
                upgradeName === 'Winter Frost' ||
                upgradeName === 'Treasure Hunter' ||
                upgradeName === 'Forbidden Excalibur' ||
                upgradeName === 'Soul of the Phoenix' ||
                upgradeName === 'Cosmic Scimitar'
            ) {
                if (!this.legendaryIcons.some((icon) => icon.name === upgradeName)) {
                    const iconX = this.ui.playerSpeedBonusText.x - 180 + this.legendaryIcons.length * 50;
                    const iconY = this.ui.playerSpeedBonusText.y + 60;
                    const icon = this.ui.add.image(iconX, iconY, upgradeIcon).setScale(0.5).setInteractive({ useHandCursor: true });

                    icon.on('pointerover', () => {
                        this.showUpgradeTooltip(upgradeName, iconX, iconY - 30);
                    }).on('pointerout', () => {
                        this.hideUpgradeTooltip();
                    });

                    // Save icon and its upgrade name for future reference
                    this.legendaryIcons.push({ name: upgradeName, icon: icon });
                }
            }
        } else {
            this.showPurchaseFeedback(`You need ${cost - this.ui.gold} more gold`, '#ff0000');
        }
    }

    showUpgradeTooltip(upgradeName: string, x: number, y: number) {
        this.hideUpgradeTooltip(); // Hide existing tooltip if any
        this.upgradeTooltip = this.ui.add
            .text(x, y, upgradeName, {
                font: '18px Orbitron',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: {
                    left: 5,
                    right: 5,
                    top: 2,
                    bottom: 2,
                },
            })
            .setOrigin(0.5, 1)
            .setDepth(20);
    }

    hideUpgradeTooltip() {
        if (this.upgradeTooltip) {
            this.upgradeTooltip.destroy();
            this.upgradeTooltip = null;
        }
    }

    showPurchaseFeedback(message: string, color: string = '#ffffff'): void {
        if (this.currentFeedbackText) {
            this.currentFeedbackText.destroy();
            this.currentFeedbackText = null;
        }

        const modalHeight = 560;
        const modalY = (this.ui.scale.height - modalHeight) / 2;

        const feedbackX = this.ui.scale.width / 2;

        const feedbackY = modalY - 18;

        this.currentFeedbackText = this.ui.add
            .text(feedbackX, feedbackY, message, {
                font: 'bold 16px Orbitron',
                color,
                backgroundColor: '#101820',
                align: 'center',

                padding: {
                    left: 16,
                    right: 16,
                    top: 8,
                    bottom: 8,
                },

                stroke: '#000000',
                strokeThickness: 3,
            })
            .setOrigin(0.5, 1)
            .setScrollFactor(0)
            .setDepth(5000);

        if (this.shopContentCamera) {
            this.shopContentCamera.ignore(this.currentFeedbackText);
        }

        this.ui.tweens.add({
            targets: this.currentFeedbackText,

            y: feedbackY - 12,

            alpha: {
                from: 1,
                to: 0,
            },

            duration: 1800,
            ease: 'Sine.easeOut',

            onComplete: () => {
                this.currentFeedbackText?.destroy();
                this.currentFeedbackText = null;
            },
        });
    }
}
