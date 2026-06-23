import * as Phaser from 'phaser';
import type { Game } from '../scenes/Game';

const WORLD_W = 1280;
const WORLD_H = 720;
const HUD_HEIGHT = 120;
const WORLD_TOP_PADDING = 130;

export default class GameControls {
    private scene: Game;

    public isMobileLayout = false;

    private joystickBase:
        Phaser.GameObjects.Arc | null = null;

    private joystickKnob:
        Phaser.GameObjects.Arc | null = null;

    private joystickPointerId:
        number | null = null;

    private joystickVector = {
        x: 0,
        y: 0
    };

    private joystickRadius = 70;
    private joystickDeadZone = 0.18;

    attackButtonContainer:
        Phaser.GameObjects.Container | null = null;

    attackButtonBackground:
        Phaser.GameObjects.Arc | null = null;

    attackButtonIcon:
        Phaser.GameObjects.Text | null = null;

    slashButtonIcon:
        Phaser.GameObjects.Text | null = null;

    private dashButtonIcon:
        Phaser.GameObjects.Text | null = null;

    desktopAttackIcon:
        Phaser.GameObjects.Text | null = null;

    desktopSlashIcon:
        Phaser.GameObjects.Text | null = null;

    private desktopDashIcon:
        Phaser.GameObjects.Text | null = null;


    attackCooldownGraphics: Phaser.GameObjects.Graphics | null = null;

    attackKey!: Phaser.Input.Keyboard.Key;
    slashKey!: Phaser.Input.Keyboard.Key;
    dashKey!: Phaser.Input.Keyboard.Key;
    shieldKey!: Phaser.Input.Keyboard.Key;

    slashButtonContainer:
        Phaser.GameObjects.Container | null = null;

    slashButtonBackground:
        Phaser.GameObjects.Arc | null = null;

    slashCooldownGraphics:
        Phaser.GameObjects.Graphics | null = null;

    desktopAbilityContainer:
        Phaser.GameObjects.Container | null = null;

    desktopAttackContainer:
        Phaser.GameObjects.Container | null = null;

    desktopAttackBackground:
        Phaser.GameObjects.Arc | null = null;



    desktopAttackCooldown:
        Phaser.GameObjects.Graphics | null = null;

    desktopSlashContainer:
        Phaser.GameObjects.Container | null = null;

    desktopSlashBackground:
        Phaser.GameObjects.Arc | null = null;


    desktopSlashCooldown:
        Phaser.GameObjects.Graphics | null = null;

    private dashButtonContainer:
        Phaser.GameObjects.Container | null = null;

    private dashButtonBackground:
        Phaser.GameObjects.Arc | null = null;

    private dashCooldownGraphics:
        Phaser.GameObjects.Graphics | null = null;

    private desktopDashContainer:
        Phaser.GameObjects.Container | null = null;

    private desktopDashBackground:
        Phaser.GameObjects.Arc | null = null;

    private desktopDashCooldown:
        Phaser.GameObjects.Graphics | null = null;

    private shieldButtonContainer:
        Phaser.GameObjects.Container | null = null;

    private shieldButtonBackground:
        Phaser.GameObjects.Arc | null = null;

    private shieldButtonText:
        Phaser.GameObjects.Text | null = null;

    private shieldStateGraphics:
        Phaser.GameObjects.Graphics | null = null;

    private desktopShieldContainer:
        Phaser.GameObjects.Container | null = null;

    private desktopShieldBackground:
        Phaser.GameObjects.Arc | null = null;

    private desktopShieldIcon:
        Phaser.GameObjects.Text | null = null;

    private desktopShieldState:
        Phaser.GameObjects.Graphics | null = null;


    constructor(scene: Game) {
        this.scene = scene;
    }

    public create(): void {
        this.detectInitialLayout();

        this.setupMobileControls();
        this.createDesktopAbilityUI();

        this.setupKeyboardControls();
        this.setupDesktopMovementInput();

        this.scene.game.events.on(
            'webview-resized',
            this.handleWebviewResize,
            this
        );

        this.updateMobileControlsVisibility();
        this.updateDesktopAbilityVisibility();
    }

    public update(
        _time: number,
        delta: number
    ): void {
        this.updateKeyboardControls();

        if (
            this.isMobileLayout &&
            !this.scene.isGamePaused &&
            !this.scene.isGameOver &&
            this.scene.allowInput &&
            !this.scene.player?.isDead
        ) {
            this.scene.player
                ?.moveWithJoystick?.(
                    this.joystickVector.x,
                    this.joystickVector.y,
                    delta,
                    WORLD_W,
                    WORLD_H,
                    WORLD_TOP_PADDING
                );
        }

        if (this.isMobileLayout) {
            this.updateMobileAttackButtonState();
            this.updateMobileSlashButtonState();
            this.updateMobileDashButtonState();
            this.updateMobileShieldButtonState();
        } else {
            this.updateDesktopAbilityState();
        }
    }

    public shutdown(): void {
        this.scene.game.events.off(
            'webview-resized',
            this.handleWebviewResize,
            this
        );

        this.scene.input.off(
            'pointerdown',
            this.handleDesktopPointerDown,
            this
        );

        this.scene.input.off(
            'pointerdown',
            this.handleJoystickDown,
            this
        );

        this.scene.input.off(
            'pointermove',
            this.handleJoystickMove,
            this
        );

        this.scene.input.off(
            'pointerup',
            this.handleJoystickUp,
            this
        );

        this.scene.input.off(
            'pointerupoutside',
            this.handleJoystickUp,
            this
        );

        this.releaseJoystick();

        this.attackKey?.destroy();
        this.slashKey?.destroy();
        this.dashKey?.destroy();

        this.joystickBase?.destroy();
        this.joystickKnob?.destroy();

        this.attackButtonContainer
            ?.destroy(true);

        this.slashButtonContainer
            ?.destroy(true);

        this.desktopAbilityContainer
            ?.destroy(true);

        this.joystickBase = null;
        this.joystickKnob = null;

        this.attackButtonContainer = null;
        this.attackButtonBackground = null;
        this.attackButtonIcon = null;
        this.attackCooldownGraphics = null;

        this.slashButtonContainer = null;
        this.slashButtonBackground = null;
        this.slashButtonIcon = null;
        this.slashCooldownGraphics = null;

        this.desktopAbilityContainer = null;

        this.desktopAttackContainer = null;
        this.desktopAttackBackground = null;
        this.desktopAttackIcon = null;
        this.desktopAttackCooldown = null;

        this.desktopSlashContainer = null;
        this.desktopSlashBackground = null;
        this.desktopSlashIcon = null;
        this.desktopSlashCooldown = null;

        this.dashButtonContainer
            ?.destroy(true);

        this.dashButtonContainer = null;
        this.dashButtonBackground = null;
        this.dashButtonIcon = null;
        this.dashCooldownGraphics = null;

        this.desktopDashContainer = null;
        this.desktopDashBackground = null;
        this.desktopDashIcon = null;
        this.desktopDashCooldown = null;

        this.shieldKey?.destroy();

        this.shieldButtonContainer
            ?.destroy(true);

        this.shieldButtonContainer = null;
        this.shieldButtonBackground = null;
        this.shieldButtonText = null;
        this.shieldStateGraphics = null;

        this.desktopShieldContainer = null;
        this.desktopShieldBackground = null;
        this.desktopShieldIcon = null;
        this.desktopShieldState = null;
    }

    public onPlayerDeath(): void {
        this.releaseJoystick();

        this.updateMobileControlsVisibility();
        this.updateDesktopAbilityVisibility();

        this.attackButtonContainer
            ?.setScale(1);

        this.slashButtonContainer
            ?.setScale(1);

        this.shieldButtonContainer
            ?.setScale(1);
    }

    public handleResize(
        gameSize: Phaser.Structs.Size
    ): void {
        const width =
            gameSize.width;

        const height =
            gameSize.height;

        this.joystickBase?.setPosition(
            115,
            height - 115
        );

        this.joystickKnob?.setPosition(
            115,
            height - 115
        );

        this.attackButtonContainer
            ?.setPosition(
                width - 115,
                height - 115
            );

        this.slashButtonContainer
            ?.setPosition(
                width - 255,
                height - 135
            );

        this.dashButtonContainer
            ?.setPosition(
                width - 385,
                height - 115
            );

        this.shieldButtonContainer
            ?.setPosition(
                width - 115,
                height - 250
            );

        this.desktopAbilityContainer
            ?.setPosition(
                width - 315,
                height - 82
            );
    }

    private detectInitialLayout(): void {
        this.isMobileLayout =
            document
                .getElementById(
                    'rotation-stage'
                )
                ?.classList.contains(
                    'mobile-rotated'
                ) ?? false;
    }

    private setupKeyboardControls(): void {
        if (!this.scene.input.keyboard) {
            return;
        }

        this.attackKey =
            this.scene.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.Q
            );

        this.slashKey =
            this.scene.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.E
            );

        this.dashKey =
            this.scene.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.R
            );

        this.shieldKey =
            this.scene.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.W
            );
    }

    private updateKeyboardControls(): void {
        if (
            this.isMobileLayout ||
            !this.scene.allowInput ||
            this.scene.isGamePaused ||
            this.scene.isGameOver ||
            this.scene.player?.isDead
        ) {
            return;
        }

        if (
            this.shieldKey &&
            Phaser.Input.Keyboard.JustDown(
                this.shieldKey
            )
        ) {
            this.scene.player
                ?.toggleShield?.();
        }

        if (
            this.attackKey &&
            Phaser.Input.Keyboard.JustDown(
                this.attackKey
            )
        ) {
            this.scene.player
                ?.attackOnce?.();
        }

        if (
            this.slashKey &&
            Phaser.Input.Keyboard.JustDown(
                this.slashKey
            )
        ) {
            this.scene.player
                ?.slashOnce?.();
        }
        if (
            this.dashKey &&
            Phaser.Input.Keyboard.JustDown(
                this.dashKey
            )
        ) {
            this.scene.player
                ?.dashOnce?.();
        }

    }

    private setupDesktopMovementInput(): void {
        this.scene.input.on(
            'pointerdown',
            this.handleDesktopPointerDown,
            this
        );
    }
    private handleDesktopPointerDown(
        pointer: Phaser.Input.Pointer
    ): void {
        if (this.isMobileLayout) {
            return;
        }

        if (pointer.y <= HUD_HEIGHT) {
            return;
        }

        if (
            !this.scene.allowInput ||
            this.scene.isGamePaused ||
            this.scene.isGameOver ||
            this.scene.player?.isDead ||
            this.scene.player?.isActionLocked
        ) {
            return;
        }

        this.scene.enemyClicked = false;

        this.scene.player.targetedEnemy =
            null;

        this.scene.player.isMovingTowardsEnemy =
            false;

        this.scene.player.continueAttacking =
            false;

        this.scene.player.moveStraight(
            pointer.worldX,
            pointer.worldY
        );
    }

    private handleWebviewResize(
        layout: {
            rotated: boolean;
            availableWidth: number;
            availableHeight: number;
            stageWidth: number;
            stageHeight: number;
        }
    ): void {
        this.isMobileLayout =
            layout.rotated;

        this.updateMobileControlsVisibility();
        this.updateDesktopAbilityVisibility();
    }

    private setupMobileControls(): void {
        const joystickX = 115;
        const joystickY =
            this.scene.scale.height - 115;

        this.joystickBase =
            this.scene.add.circle(
                joystickX,
                joystickY,
                this.joystickRadius,
                0x101820,
                0.52
            );

        this.joystickBase
            .setStrokeStyle(
                4,
                0xffffff,
                0.65
            )
            .setScrollFactor(0)
            .setDepth(2000);

        this.joystickKnob =
            this.scene.add.circle(
                joystickX,
                joystickY,
                31,
                0x50c8ff,
                0.82
            );

        this.joystickKnob
            .setStrokeStyle(
                3,
                0xffffff,
                0.9
            )
            .setScrollFactor(0)
            .setDepth(2001);

        this.updateMobileControlsVisibility();

        this.createMobileAttackButton();
        this.createMobileSlashButton();
        this.createMobileDashButton();
        this.createMobileShieldButton();

        this.scene.input.on(
            'pointerdown',
            this.handleJoystickDown,
            this
        );

        this.scene.input.on(
            'pointermove',
            this.handleJoystickMove,
            this
        );

        this.scene.input.on(
            'pointerup',
            this.handleJoystickUp,
            this
        );

        this.scene.input.on(
            'pointerupoutside',
            this.handleJoystickUp,
            this
        );
    }

    private updateMobileControlsVisibility(): void {
        const visible =
            this.isMobileLayout &&
            !this.scene.isGameOver &&
            !this.scene.player?.isDead;

        this.joystickBase?.setVisible(
            visible
        );

        this.joystickKnob?.setVisible(
            visible
        );

        this.attackButtonContainer
            ?.setVisible(
                visible
            );

        this.slashButtonContainer
            ?.setVisible(
                visible
            );

        this.dashButtonContainer
            ?.setVisible(
                visible
            );

        this.shieldButtonContainer
            ?.setVisible(
                visible
            );
        this.shieldButtonContainer
            ?.setVisible(
                visible
            );

        if (!visible) {
            this.releaseJoystick();
            this.resetMobileAttackButtonAppearance();

            this.shieldButtonContainer
                ?.setScale(1);

            this.slashButtonContainer
                ?.setScale(1);

            this.dashButtonContainer
                ?.setScale(1);
        }
    }

    private handleJoystickDown(
        pointer:
            Phaser.Input.Pointer
    ): void {
        if (
            !this.isMobileLayout ||
            this.scene.isGamePaused ||
            this.scene.isGameOver ||
            !this.scene.allowInput ||
            this.scene.player?.isDead ||
            !this.joystickBase
        ) {
            return;
        }

        const distance =
            Phaser.Math.Distance.Between(
                pointer.x,
                pointer.y,
                this.joystickBase.x,
                this.joystickBase.y
            );

        if (
            distance >
            this.joystickRadius * 1.35
        ) {
            return;
        }

        this.joystickPointerId =
            pointer.id;

        this.updateJoystickFromPointer(
            pointer
        );
    }

    private handleJoystickMove(
        pointer:
            Phaser.Input.Pointer
    ): void {
        if (
            !this.isMobileLayout ||
            this.joystickPointerId !==
            pointer.id
        ) {
            return;
        }

        this.updateJoystickFromPointer(
            pointer
        );
    }

    private handleJoystickUp(
        pointer:
            Phaser.Input.Pointer
    ): void {
        if (
            this.joystickPointerId !==
            pointer.id
        ) {
            return;
        }

        this.releaseJoystick();
    }

    private updateJoystickFromPointer(
        pointer:
            Phaser.Input.Pointer
    ): void {
        if (
            !this.joystickBase ||
            !this.joystickKnob
        ) {
            return;
        }

        const differenceX =
            pointer.x -
            this.joystickBase.x;

        const differenceY =
            pointer.y -
            this.joystickBase.y;

        const distance =
            Math.sqrt(
                differenceX * differenceX +
                differenceY * differenceY
            );

        if (distance <= 0) {
            this.joystickVector.x = 0;
            this.joystickVector.y = 0;

            return;
        }

        const normalizedX =
            differenceX / distance;

        const normalizedY =
            differenceY / distance;

        const clampedDistance =
            Math.min(
                distance,
                this.joystickRadius
            );

        this.joystickKnob.setPosition(
            this.joystickBase.x +
            normalizedX *
            clampedDistance,

            this.joystickBase.y +
            normalizedY *
            clampedDistance
        );

        const strength =
            Phaser.Math.Clamp(
                distance /
                this.joystickRadius,
                0,
                1
            );

        if (
            strength <
            this.joystickDeadZone
        ) {
            this.joystickVector.x = 0;
            this.joystickVector.y = 0;

            return;
        }

        this.joystickVector.x =
            normalizedX * strength;

        this.joystickVector.y =
            normalizedY * strength;
    }

    private releaseJoystick(): void {
        this.joystickPointerId = null;

        this.joystickVector.x = 0;
        this.joystickVector.y = 0;

        if (
            this.joystickBase &&
            this.joystickKnob
        ) {
            this.joystickKnob.setPosition(
                this.joystickBase.x,
                this.joystickBase.y
            );
        }

        this.scene.player
            ?.stopJoystickMovement?.();
    }

    private createMobileAttackButton(): void {
        const buttonX =
            this.scene.scale.width - 115;

        const buttonY =
            this.scene.scale.height - 115;

        const buttonRadius = 58;

        this.attackButtonContainer =
            this.scene.add.container(
                buttonX,
                buttonY
            );

        this.attackButtonContainer
            .setScrollFactor(0)
            .setDepth(2001);

        this.attackButtonBackground =
            this.scene.add.circle(
                0,
                0,
                buttonRadius,
                0xf2f2f2,
                0.92
            );

        this.attackButtonBackground
            .setStrokeStyle(
                3,
                0xffffff,
                0.9
            )
            .setInteractive(
                new Phaser.Geom.Circle(
                    buttonRadius,
                    buttonRadius,
                    buttonRadius
                ),
                Phaser.Geom.Circle.Contains
            );

        this.attackButtonIcon =
            this.scene.add.text(
                0,
                0,
                'ATTACK',
                {
                    fontFamily: 'Orbitron',
                    fontSize: '13px',
                    color: '#1a2633',
                    fontStyle: 'bold'
                }
            )
                .setOrigin(0.5)
                .disableInteractive();

        this.attackCooldownGraphics =
            this.scene.add.graphics();

        this.attackButtonContainer.add([
            this.attackButtonBackground,
            this.attackButtonIcon,
            this.attackCooldownGraphics
        ]);

        this.attackButtonBackground.on(
            'pointerdown',
            (
                _pointer:
                    Phaser.Input.Pointer,
                _localX: number,
                _localY: number,
                event:
                    Phaser.Types.Input.EventData
            ) => {
                event.stopPropagation();

                if (
                    !this.isMobileLayout ||
                    !this.scene.allowInput ||
                    this.scene.isGamePaused ||
                    this.scene.isGameOver ||
                    this.scene.player?.isDead ||
                    this.scene.player?.isActionLocked ||
                    this.scene.player?.isShieldRaised?.()
                ) {
                    return;
                }

                this.attackButtonContainer
                    ?.setScale(0.92);

                this.scene.player?.attackOnce?.();

                this.updateMobileAttackButtonState();
            }
        );

        this.attackButtonBackground.on(
            'pointerup',
            (
                _pointer:
                    Phaser.Input.Pointer,
                _localX: number,
                _localY: number,
                event:
                    Phaser.Types.Input.EventData
            ) => {
                event.stopPropagation();

                this.attackButtonContainer
                    ?.setScale(1);
            }
        );

        this.attackButtonBackground.on(
            'pointerout',
            () => {
                this.attackButtonContainer
                    ?.setScale(1);
            }
        );

        this.attackButtonBackground.on(
            'pointerupoutside',
            () => {
                this.attackButtonContainer
                    ?.setScale(1);
            }
        );

        this.updateMobileControlsVisibility();
        this.updateMobileAttackButtonState();
    }

    private createMobileSlashButton(): void {
        const buttonX =
            this.scene.scale.width - 255;

        const buttonY =
            this.scene.scale.height - 135;

        const buttonRadius = 50;

        this.slashButtonContainer =
            this.scene.add.container(
                buttonX,
                buttonY
            );

        this.slashButtonContainer
            .setScrollFactor(0)
            .setDepth(2001);

        this.slashButtonBackground =
            this.scene.add.circle(
                0,
                0,
                buttonRadius,
                0xf2f2f2,
                0.92
            );

        this.slashButtonBackground
            .setStrokeStyle(
                3,
                0xffffff,
                0.9
            )
            .setInteractive(
                new Phaser.Geom.Circle(
                    buttonRadius,
                    buttonRadius,
                    buttonRadius
                ),
                Phaser.Geom.Circle.Contains
            );

        this.slashButtonIcon =
            this.scene.add.text(
                0,
                0,
                'SLASH',
                {
                    fontFamily: 'Orbitron',
                    fontSize: '13px',
                    color: '#6d2ca0',
                    fontStyle: 'bold'
                }
            )
                .setOrigin(0.5)
                .disableInteractive();

        this.slashCooldownGraphics =
            this.scene.add.graphics();

        this.slashButtonContainer.add([
            this.slashButtonBackground,
            this.slashButtonIcon,
            this.slashCooldownGraphics
        ]);

        this.slashButtonBackground.on(
            'pointerdown',
            (
                _pointer:
                    Phaser.Input.Pointer,
                _localX: number,
                _localY: number,
                event:
                    Phaser.Types.Input.EventData
            ) => {
                event.stopPropagation();

                if (
                    !this.isMobileLayout ||
                    !this.scene.allowInput ||
                    this.scene.isGamePaused ||
                    this.scene.isGameOver ||
                    this.scene.player?.isDead ||
                    !this.scene.player?.isSlashReady?.()
                ) {
                    return;
                }

                this.slashButtonContainer
                    ?.setScale(0.92);

                this.scene.player?.slashOnce?.();

                this.updateMobileSlashButtonState();
            }
        );

        this.slashButtonBackground.on(
            'pointerup',
            (
                _pointer:
                    Phaser.Input.Pointer,
                _localX: number,
                _localY: number,
                event:
                    Phaser.Types.Input.EventData
            ) => {
                event.stopPropagation();

                this.slashButtonContainer
                    ?.setScale(1);
            }
        );

        this.slashButtonBackground.on(
            'pointerout',
            () => {
                this.slashButtonContainer
                    ?.setScale(1);
            }
        );

        this.slashButtonBackground.on(
            'pointerupoutside',
            () => {
                this.slashButtonContainer
                    ?.setScale(1);
            }
        );

        this.updateMobileControlsVisibility();
        this.updateMobileSlashButtonState();
    }

    private updateMobileSlashButtonState(): void {
        if (
            !this.slashButtonContainer ||
            !this.slashButtonBackground ||
            !this.slashButtonIcon ||
            !this.slashCooldownGraphics
        ) {
            return;
        }

        const buttonRadius = 50;
        const ringRadius =
            buttonRadius + 7;

        const isUnavailable =
            !this.scene.allowInput ||
            this.scene.isGamePaused ||
            this.scene.isGameOver ||
            this.scene.player?.isDead;

        const disabledByShield =
            this.scene.player
                ?.isShieldRaised?.() === true;

        const cooldownRemaining =
            this.scene.player
                ?.getSlashCooldownRemaining?.() ??
            0;

        const isCoolingDown =
            cooldownRemaining > 0;

        this.slashCooldownGraphics.clear();

        if (isUnavailable) {
            this.slashButtonBackground
                .setFillStyle(
                    0x333333,
                    0.9
                );

            this.slashButtonIcon
                .setAlpha(0.25);

            this.slashCooldownGraphics
                .lineStyle(
                    6,
                    0x555555,
                    0.85
                );

            this.slashCooldownGraphics
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            return;
        }

        if (disabledByShield) {
            this.slashButtonBackground
                .setFillStyle(
                    0x555b61,
                    0.92
                );

            this.slashButtonIcon
                .setColor('#b5b5b5')
                .setAlpha(0.55);

            this.slashCooldownGraphics
                .lineStyle(
                    7,
                    0x777777,
                    0.95
                )
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            return;
        }

        if (isCoolingDown) {
            this.slashButtonBackground
                .setFillStyle(
                    0x24142f,
                    0.96
                );

            this.slashButtonIcon
                .setColor('#9f65c7')
                .setAlpha(0.42);

            this.slashCooldownGraphics
                .lineStyle(
                    7,
                    0x160b1e,
                    0.95
                );

            this.slashCooldownGraphics
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            const cooldownProgress =
                this.scene.player
                    ?.getSlashCooldownProgress?.() ??
                0;

            const startAngle =
                -Math.PI / 2;

            const endAngle =
                startAngle +
                cooldownProgress *
                Math.PI *
                2;

            this.slashCooldownGraphics
                .lineStyle(
                    7,
                    0xb85cff,
                    1
                );

            this.slashCooldownGraphics
                .beginPath();

            this.slashCooldownGraphics.arc(
                0,
                0,
                ringRadius,
                startAngle,
                endAngle,
                false
            );

            this.slashCooldownGraphics
                .strokePath();

            return;
        }

        // slash ready
        this.slashButtonBackground
            .setFillStyle(
                0xf2f2f2,
                0.94
            );

        this.slashButtonIcon
            .setColor('#6d2ca0')
            .setAlpha(1);

        this.slashCooldownGraphics
            .lineStyle(
                7,
                0xffffff,
                1
            );

        this.slashCooldownGraphics
            .strokeCircle(
                0,
                0,
                ringRadius
            );
    }

    private updateMobileAttackButtonState(): void {
        if (
            !this.attackButtonContainer ||
            !this.attackButtonBackground ||
            !this.attackButtonIcon ||
            !this.attackCooldownGraphics
        ) {
            return;
        }

        const buttonRadius = 58;
        const ringRadius =
            buttonRadius + 7;

        const unavailable =
            !this.scene.allowInput ||
            this.scene.isGamePaused ||
            this.scene.isGameOver ||
            this.scene.player?.isDead;

        const disabledByShield =
            this.scene.player
                ?.isShieldRaised?.() === true;

        const actionLocked =
            this.scene.player
                ?.isActionLocked === true;

        this.attackCooldownGraphics.clear();

        if (unavailable) {
            this.attackButtonBackground
                .setFillStyle(
                    0x333333,
                    0.9
                );

            this.attackButtonIcon
                .setColor('#777777')
                .setAlpha(0.45);

            this.attackCooldownGraphics
                .lineStyle(
                    6,
                    0x555555,
                    0.85
                )
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            return;
        }

        // shield raised, disabled, on cooldown
        if (disabledByShield) {
            this.attackButtonBackground
                .setFillStyle(
                    0x555b61,
                    0.92
                );

            this.attackButtonIcon
                .setColor('#b5b5b5')
                .setAlpha(0.55);

            this.attackCooldownGraphics
                .lineStyle(
                    7,
                    0x777777,
                    0.95
                )
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            return;
        }

        if (actionLocked) {
            this.attackButtonBackground
                .setFillStyle(
                    0x4f1717,
                    0.95
                );

            this.attackButtonIcon
                .setColor('#ffffff')
                .setAlpha(0.48);

            this.attackCooldownGraphics
                .lineStyle(
                    7,
                    0x2b0b0b,
                    0.95
                )
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            const animationProgress =
                Phaser.Math.Clamp(
                    this.scene.player
                        ?.robotSprite
                        ?.anims
                        ?.getProgress?.() ?? 0,
                    0,
                    1
                );

            const startAngle =
                -Math.PI / 2;

            const endAngle =
                startAngle +
                animationProgress *
                Math.PI *
                2;

            this.attackCooldownGraphics
                .lineStyle(
                    7,
                    0xff3b30,
                    1
                );

            this.attackCooldownGraphics
                .beginPath();

            this.attackCooldownGraphics.arc(
                0,
                0,
                ringRadius,
                startAngle,
                endAngle,
                false
            );

            this.attackCooldownGraphics
                .strokePath();

            return;
        }

        this.attackButtonBackground
            .setFillStyle(
                0xf2f2f2,
                0.94
            );

        this.attackButtonIcon
            .setColor('#1a2633')
            .setAlpha(1);

        this.attackCooldownGraphics
            .lineStyle(
                7,
                0xffffff,
                1
            )
            .strokeCircle(
                0,
                0,
                ringRadius
            );
    }

    private resetMobileAttackButtonAppearance(): void {
        this.attackButtonContainer
            ?.setScale(1);

        this.updateMobileAttackButtonState();
    }

    private createDesktopAbilityUI(): void {
        const hudX =
            this.scene.scale.width - 315;

        const hudY =
            this.scene.scale.height - 82;

        this.desktopAbilityContainer =
            this.scene.add.container(
                hudX,
                hudY
            );

        this.desktopAbilityContainer
            .setScrollFactor(0)
            .setDepth(2001);

        this.desktopAttackContainer =
            this.createDesktopAbilitySlot(
                -180,
                0,
                'Attack',
                'Q'
            );

        this.desktopShieldContainer =
            this.createDesktopShieldSlot(
                -60,
                0
            );

        this.desktopSlashContainer =
            this.createDesktopAbilitySlot(
                60,
                0,
                'Slash',
                'E'
            );

        this.desktopDashContainer =
            this.createDesktopAbilitySlot(
                180,
                0,
                'Dash',
                'R'
            );

        this.desktopAbilityContainer.add([
            this.desktopAttackContainer,
            this.desktopShieldContainer,
            this.desktopSlashContainer,
            this.desktopDashContainer
        ]);

        this.updateDesktopAbilityVisibility();
        this.updateDesktopAbilityState();
    }

    private createDesktopAbilitySlot(
        x: number,
        y: number,
        abilityName: string,
        keyboardKey: string
    ): Phaser.GameObjects.Container {
        const slot =
            this.scene.add.container(
                x,
                y
            );

        const radius = 44;

        const background =
            this.scene.add.circle(
                0,
                0,
                radius,
                0xf2f2f2,
                0.94
            );

        background.setStrokeStyle(
            3,
            0xffffff,
            1
        );

        const label =
            this.scene.add.text(
                0,
                -3,
                abilityName.toUpperCase(),
                {
                    fontFamily: 'Orbitron',
                    fontSize: '11px',
                    color: '#1a2633',
                    fontStyle: 'bold'
                }
            )
                .setOrigin(0.5);

        const cooldown =
            this.scene.add.graphics();

        const keyBadge =
            this.scene.add.rectangle(
                29,
                30,
                29,
                25,
                0x111111,
                0.94
            );

        keyBadge.setStrokeStyle(
            2,
            0xffffff,
            0.9
        );

        const keyText =
            this.scene.add.text(
                29,
                30,
                keyboardKey,
                {
                    fontFamily: 'Orbitron',
                    fontSize: '16px',
                    color: '#ffffff',
                    fontStyle: 'bold'
                }
            )
                .setOrigin(0.5);

        slot.add([
            background,
            label,
            cooldown,
            keyBadge,
            keyText
        ]);

        if (keyboardKey === 'Q') {
            this.desktopAttackBackground =
                background;

            this.desktopAttackIcon =
                label;

            this.desktopAttackCooldown =
                cooldown;
        } else if (keyboardKey === 'E') {
            this.desktopSlashBackground =
                background;

            this.desktopSlashIcon =
                label;

            this.desktopSlashCooldown =
                cooldown;
        } else if (keyboardKey === 'R') {
            this.desktopDashBackground =
                background;

            this.desktopDashIcon =
                label;

            this.desktopDashCooldown =
                cooldown;
        }

        return slot;
    }

    private updateDesktopAbilityVisibility(): void {
        const visible =
            !this.isMobileLayout &&
            !this.scene.isGameOver &&
            !this.scene.player?.isDead;

        this.desktopAbilityContainer
            ?.setVisible(
                visible
            );
    }

    private updateDesktopAbilityState(): void {
        this.updateDesktopAttackState();
        this.updateDesktopShieldState();
        this.updateDesktopSlashState();
        this.updateDesktopDashState();
    }

    private updateDesktopAttackState(): void {
        if (
            !this.desktopAttackBackground ||
            !this.desktopAttackIcon ||
            !this.desktopAttackCooldown
        ) {
            return;
        }

        const radius = 44;
        const ringRadius = radius + 6;

        const unavailable =
            !this.scene.allowInput ||
            this.scene.isGamePaused ||
            this.scene.isGameOver ||
            this.scene.player?.isDead;

        const disabledByShield =
            this.scene.player
                ?.isShieldRaised?.() === true;

        const actionLocked =
            this.scene.player
                ?.isActionLocked === true;

        this.desktopAttackCooldown.clear();

        if (unavailable) {
            this.desktopAttackBackground
                .setFillStyle(
                    0x333333,
                    0.9
                );

            this.desktopAttackIcon
                .setAlpha(0.25);

            this.desktopAttackCooldown
                .lineStyle(
                    6,
                    0x555555,
                    0.85
                );

            this.desktopAttackCooldown
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            return;
        }
        if (disabledByShield) {
            this.desktopAttackBackground
                .setFillStyle(
                    0x555b61,
                    0.92
                );

            this.desktopAttackIcon
                .setColor('#b5b5b5')
                .setAlpha(0.55);

            this.desktopAttackCooldown
                .lineStyle(
                    6,
                    0x777777,
                    0.95
                )
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            return;
        }

        if (actionLocked) {
            this.desktopAttackBackground
                .setFillStyle(
                    0x4f1717,
                    0.95
                );

            this.desktopAttackIcon
                .setAlpha(0.42);

            this.desktopAttackCooldown
                .lineStyle(
                    6,
                    0x2b0b0b,
                    0.95
                );

            this.desktopAttackCooldown
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            const animationProgress =
                Phaser.Math.Clamp(
                    this.scene.player
                        ?.robotSprite
                        ?.anims
                        ?.getProgress?.() ?? 0,
                    0,
                    1
                );

            const startAngle =
                -Math.PI / 2;

            const endAngle =
                startAngle +
                animationProgress *
                Math.PI *
                2;

            this.desktopAttackCooldown
                .lineStyle(
                    6,
                    0xff3b30,
                    1
                );

            this.desktopAttackCooldown
                .beginPath();

            this.desktopAttackCooldown.arc(
                0,
                0,
                ringRadius,
                startAngle,
                endAngle,
                false
            );

            this.desktopAttackCooldown
                .strokePath();

            return;
        }

        this.desktopAttackBackground
            .setFillStyle(
                0xf2f2f2,
                0.94
            );

        this.desktopAttackIcon
            .setColor('#1a2633')
            .setAlpha(1);

        this.desktopAttackCooldown
            .lineStyle(
                6,
                0xffffff,
                1
            );

        this.desktopAttackCooldown
            .strokeCircle(
                0,
                0,
                ringRadius
            );
    }

    private updateDesktopSlashState(): void {
        if (
            !this.desktopSlashBackground ||
            !this.desktopSlashIcon ||
            !this.desktopSlashCooldown
        ) {
            return;
        }

        const radius = 44;
        const ringRadius = radius + 6;

        const unavailable =
            !this.scene.allowInput ||
            this.scene.isGamePaused ||
            this.scene.isGameOver ||
            this.scene.player?.isDead;
        const disabledByShield =
            this.scene.player
                ?.isShieldRaised?.() === true;
        const cooldownRemaining =
            this.scene.player
                ?.getSlashCooldownRemaining?.() ??
            0;

        const coolingDown =
            cooldownRemaining > 0;

        this.desktopSlashCooldown.clear();

        if (unavailable) {
            this.desktopSlashBackground
                .setFillStyle(
                    0x333333,
                    0.9
                );

            this.desktopSlashIcon
                .setAlpha(0.25);

            this.desktopSlashCooldown
                .lineStyle(
                    6,
                    0x555555,
                    0.85
                );

            this.desktopSlashCooldown
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            return;
        }
        if (disabledByShield) {
            this.desktopSlashBackground
                .setFillStyle(
                    0x555b61,
                    0.92
                );

            this.desktopSlashIcon
                .setColor('#b5b5b5')
                .setAlpha(0.55);

            this.desktopSlashCooldown
                .lineStyle(
                    6,
                    0x777777,
                    0.95
                )
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            return;
        }

        if (coolingDown) {
            this.desktopSlashBackground
                .setFillStyle(
                    0x24142f,
                    0.96
                );

            this.desktopSlashIcon
                .setAlpha(0.42);

            this.desktopSlashCooldown
                .lineStyle(
                    6,
                    0x160b1e,
                    0.95
                );

            this.desktopSlashCooldown
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            const progress =
                this.scene.player
                    ?.getSlashCooldownProgress?.() ??
                0;

            const startAngle =
                -Math.PI / 2;

            const endAngle =
                startAngle +
                progress *
                Math.PI *
                2;

            this.desktopSlashCooldown
                .lineStyle(
                    6,
                    0xb85cff,
                    1
                );

            this.desktopSlashCooldown
                .beginPath();

            this.desktopSlashCooldown.arc(
                0,
                0,
                ringRadius,
                startAngle,
                endAngle,
                false
            );

            this.desktopSlashCooldown
                .strokePath();

            return;
        }

        this.desktopSlashBackground
            .setFillStyle(
                0xf2f2f2,
                0.94
            );

        this.desktopSlashIcon
            .setColor('#6d2ca0')
            .setAlpha(1);

        this.desktopSlashCooldown
            .lineStyle(
                6,
                0xffffff,
                1
            );

        this.desktopSlashCooldown
            .strokeCircle(
                0,
                0,
                ringRadius
            );
    }

    private createMobileDashButton(): void {
        const buttonX =
            this.scene.scale.width - 385;

        const buttonY =
            this.scene.scale.height - 115;

        const buttonRadius = 48;

        this.dashButtonContainer =
            this.scene.add.container(
                buttonX,
                buttonY
            );

        this.dashButtonContainer
            .setScrollFactor(0)
            .setDepth(2001);

        this.dashButtonBackground =
            this.scene.add.circle(
                0,
                0,
                buttonRadius,
                0xf2f2f2,
                0.92
            );

        this.dashButtonBackground
            .setStrokeStyle(
                3,
                0xffffff,
                0.9
            )
            .setInteractive(
                new Phaser.Geom.Circle(
                    buttonRadius,
                    buttonRadius,
                    buttonRadius
                ),
                Phaser.Geom.Circle.Contains
            );

        this.dashButtonIcon =
            this.scene.add.text(
                0,
                0,
                'DASH',
                {
                    fontFamily: 'Orbitron',
                    fontSize: '13px',
                    color: '#167498',
                    fontStyle: 'bold'
                }
            )
                .setOrigin(0.5)
                .disableInteractive();

        this.dashCooldownGraphics =
            this.scene.add.graphics();

        this.dashButtonContainer.add([
            this.dashButtonBackground,
            this.dashButtonIcon,
            this.dashCooldownGraphics
        ]);

        this.dashButtonBackground.on(
            'pointerdown',
            (
                _pointer:
                    Phaser.Input.Pointer,
                _localX: number,
                _localY: number,
                event:
                    Phaser.Types.Input.EventData
            ) => {
                event.stopPropagation();

                if (
                    !this.isMobileLayout ||
                    !this.scene.allowInput ||
                    this.scene.isGamePaused ||
                    this.scene.isGameOver ||
                    this.scene.player?.isDead ||
                    !this.scene.player?.isDashReady?.()
                ) {
                    return;
                }

                this.dashButtonContainer
                    ?.setScale(0.92);

                this.scene.player
                    ?.dashOnce?.();

                this.updateMobileDashButtonState();
            }
        );

        this.dashButtonBackground.on(
            'pointerup',
            (
                _pointer:
                    Phaser.Input.Pointer,
                _localX: number,
                _localY: number,
                event:
                    Phaser.Types.Input.EventData
            ) => {
                event.stopPropagation();

                this.dashButtonContainer
                    ?.setScale(1);
            }
        );

        this.dashButtonBackground.on(
            'pointerout',
            () => {
                this.dashButtonContainer
                    ?.setScale(1);
            }
        );

        this.dashButtonBackground.on(
            'pointerupoutside',
            () => {
                this.dashButtonContainer
                    ?.setScale(1);
            }
        );

        this.updateMobileControlsVisibility();
        this.updateMobileDashButtonState();
    }

    private updateMobileDashButtonState(): void {
        if (
            !this.dashButtonContainer ||
            !this.dashButtonBackground ||
            !this.dashButtonIcon ||
            !this.dashCooldownGraphics
        ) {
            return;
        }

        const buttonRadius = 48;
        const ringRadius =
            buttonRadius + 7;

        const unavailable =
            !this.scene.allowInput ||
            this.scene.isGamePaused ||
            this.scene.isGameOver ||
            this.scene.player?.isDead;

        const disabledByShield =
            this.scene.player
                ?.isShieldRaised?.() === true;

        const cooldownRemaining =
            this.scene.player
                ?.getDashCooldownRemaining?.() ??
            0;

        const coolingDown =
            cooldownRemaining > 0;

        this.dashCooldownGraphics.clear();

        if (unavailable) {
            this.dashButtonBackground
                .setFillStyle(
                    0x333333,
                    0.9
                );

            this.dashButtonIcon
                .setAlpha(0.25);

            this.dashCooldownGraphics
                .lineStyle(
                    6,
                    0x555555,
                    0.85
                )
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            return;
        }
        if (disabledByShield) {
            this.dashButtonBackground
                .setFillStyle(
                    0x555b61,
                    0.92
                );

            this.dashButtonIcon
                .setColor('#b5b5b5')
                .setAlpha(0.55);

            this.dashCooldownGraphics
                .lineStyle(
                    7,
                    0x777777,
                    0.95
                )
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            return;
        }
        if (coolingDown) {
            this.dashButtonBackground
                .setFillStyle(
                    0x102c3d,
                    0.96
                );

            this.dashButtonIcon
                .setColor('#5da9c7')
                .setAlpha(0.42);

            this.dashCooldownGraphics
                .lineStyle(
                    7,
                    0x071820,
                    0.95
                )
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            const progress =
                this.scene.player
                    ?.getDashCooldownProgress?.() ??
                0;

            const startAngle =
                -Math.PI / 2;

            const endAngle =
                startAngle +
                progress *
                Math.PI *
                2;

            this.dashCooldownGraphics
                .lineStyle(
                    7,
                    0x50c8ff,
                    1
                );

            this.dashCooldownGraphics
                .beginPath();

            this.dashCooldownGraphics.arc(
                0,
                0,
                ringRadius,
                startAngle,
                endAngle,
                false
            );

            this.dashCooldownGraphics
                .strokePath();

            return;
        }

        this.dashButtonBackground
            .setFillStyle(
                0xf2f2f2,
                0.94
            );

        this.dashButtonIcon
            .setColor('#167498')
            .setAlpha(1);

        this.dashCooldownGraphics
            .lineStyle(
                7,
                0xffffff,
                1
            )
            .strokeCircle(
                0,
                0,
                ringRadius
            );
    }

    private updateDesktopDashState(): void {
        if (
            !this.desktopDashBackground ||
            !this.desktopDashIcon ||
            !this.desktopDashCooldown
        ) {
            return;
        }

        const radius = 44;
        const ringRadius =
            radius + 6;

        const unavailable =
            !this.scene.allowInput ||
            this.scene.isGamePaused ||
            this.scene.isGameOver ||
            this.scene.player?.isDead;
        const disabledByShield =
            this.scene.player
                ?.isShieldRaised?.() === true;
        const cooldownRemaining =
            this.scene.player
                ?.getDashCooldownRemaining?.() ??
            0;

        const coolingDown =
            cooldownRemaining > 0;

        this.desktopDashCooldown.clear();

        if (unavailable) {
            this.desktopDashBackground
                .setFillStyle(
                    0x333333,
                    0.9
                );

            this.desktopDashIcon
                .setAlpha(0.25);

            this.desktopDashCooldown
                .lineStyle(
                    6,
                    0x555555,
                    0.85
                )
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            return;
        }
        if (disabledByShield) {
            this.desktopDashBackground
                .setFillStyle(
                    0x555b61,
                    0.92
                );

            this.desktopDashIcon
                .setColor('#b5b5b5')
                .setAlpha(0.55);

            this.desktopDashCooldown
                .lineStyle(
                    6,
                    0x777777,
                    0.95
                )
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            return;
        }
        if (coolingDown) {
            this.desktopDashBackground
                .setFillStyle(
                    0x102c3d,
                    0.96
                );

            this.desktopDashIcon
                .setAlpha(0.42);

            this.desktopDashCooldown
                .lineStyle(
                    6,
                    0x071820,
                    0.95
                )
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            const progress =
                this.scene.player
                    ?.getDashCooldownProgress?.() ??
                0;

            const startAngle =
                -Math.PI / 2;

            const endAngle =
                startAngle +
                progress *
                Math.PI *
                2;

            this.desktopDashCooldown
                .lineStyle(
                    6,
                    0x50c8ff,
                    1
                );

            this.desktopDashCooldown
                .beginPath();

            this.desktopDashCooldown.arc(
                0,
                0,
                ringRadius,
                startAngle,
                endAngle,
                false
            );

            this.desktopDashCooldown
                .strokePath();

            return;
        }

        this.desktopDashBackground
            .setFillStyle(
                0xf2f2f2,
                0.94
            );

        this.desktopDashIcon
            .setColor('#167498')
            .setAlpha(1);

        this.desktopDashCooldown
            .lineStyle(
                6,
                0xffffff,
                1
            )
            .strokeCircle(
                0,
                0,
                ringRadius
            );
    }

    private createMobileShieldButton(): void {
        const buttonX =
            this.scene.scale.width - 115;

        const buttonY =
            this.scene.scale.height - 250;

        const buttonRadius = 48;

        this.shieldButtonContainer =
            this.scene.add.container(
                buttonX,
                buttonY
            );

        this.shieldButtonContainer
            .setScrollFactor(0)
            .setDepth(2001);

        this.shieldButtonBackground =
            this.scene.add.circle(
                0,
                0,
                buttonRadius,
                0xf2f2f2,
                0.92
            );

        this.shieldButtonBackground
            .setStrokeStyle(
                3,
                0xffffff,
                0.9
            )
            .setInteractive(
                new Phaser.Geom.Circle(
                    buttonRadius,
                    buttonRadius,
                    buttonRadius
                ),
                Phaser.Geom.Circle.Contains
            );

        this.shieldButtonText =
            this.scene.add.text(
                0,
                0,
                'SHIELD',
                {
                    fontFamily: 'Orbitron',
                    fontSize: '12px',
                    color: '#1a2633',
                    fontStyle: 'bold'
                }
            )
                .setOrigin(0.5);

        this.shieldStateGraphics =
            this.scene.add.graphics();

        this.shieldButtonContainer.add([
            this.shieldButtonBackground,
            this.shieldButtonText,
            this.shieldStateGraphics
        ]);

        this.shieldButtonBackground.on(
            'pointerdown',
            (
                _pointer:
                    Phaser.Input.Pointer,
                _localX: number,
                _localY: number,
                event:
                    Phaser.Types.Input.EventData
            ) => {
                event.stopPropagation();

                if (
                    !this.isMobileLayout ||
                    !this.scene.allowInput ||
                    this.scene.isGamePaused ||
                    this.scene.isGameOver ||
                    this.scene.player?.isDead ||
                    this.scene.player?.isActionLocked
                ) {
                    return;
                }

                this.shieldButtonContainer
                    ?.setScale(0.92);

                this.scene.player
                    ?.toggleShield?.();

                this.updateMobileShieldButtonState();
            }
        );

        this.shieldButtonBackground.on(
            'pointerup',
            () => {
                this.shieldButtonContainer
                    ?.setScale(1);
            }
        );

        this.shieldButtonBackground.on(
            'pointerout',
            () => {
                this.shieldButtonContainer
                    ?.setScale(1);
            }
        );

        this.shieldButtonBackground.on(
            'pointerupoutside',
            () => {
                this.shieldButtonContainer
                    ?.setScale(1);
            }
        );

        this.updateMobileControlsVisibility();
        this.updateMobileShieldButtonState();
    }

    private updateMobileShieldButtonState(): void {
        if (
            !this.shieldButtonBackground ||
            !this.shieldButtonText ||
            !this.shieldStateGraphics
        ) {
            return;
        }

        const buttonRadius = 48;
        const ringRadius = buttonRadius + 7;

        const unavailable =
            !this.scene.allowInput ||
            this.scene.isGamePaused ||
            this.scene.isGameOver ||
            this.scene.player?.isDead;

        const shieldRaised =
            this.scene.player
                ?.isShieldRaised?.() === true;

        this.shieldStateGraphics.clear();

        if (unavailable) {
            this.shieldButtonBackground
                .setFillStyle(
                    0x333333,
                    0.9
                );

            this.shieldButtonText
                .setColor('#777777');

            this.shieldStateGraphics
                .lineStyle(
                    7,
                    0x555555,
                    0.9
                )
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            return;
        }

        if (shieldRaised) {
            this.shieldButtonBackground
                .setFillStyle(
                    0x174f68,
                    0.98
                );

            this.shieldButtonText
                .setColor('#ffffff')
                .setText('LOWER');

            this.shieldStateGraphics
                .lineStyle(
                    7,
                    0x50c8ff,
                    1
                )
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            return;
        }

        this.shieldButtonBackground
            .setFillStyle(
                0xf2f2f2,
                0.94
            );

        this.shieldButtonText
            .setColor('#1a2633')
            .setText('SHIELD');

        this.shieldStateGraphics
            .lineStyle(
                7,
                0xffffff,
                1
            )
            .strokeCircle(
                0,
                0,
                ringRadius
            );
    }

    private createDesktopShieldSlot(
        x: number,
        y: number
    ): Phaser.GameObjects.Container {
        const slot =
            this.scene.add.container(
                x,
                y
            );

        const radius = 44;

        this.desktopShieldBackground =
            this.scene.add.circle(
                0,
                0,
                radius,
                0xf2f2f2,
                0.94
            );

        this.desktopShieldBackground
            .setStrokeStyle(
                3,
                0xffffff,
                1
            );

        this.desktopShieldIcon =
            this.scene.add.text(
                0,
                -3,
                'SHIELD',
                {
                    fontFamily: 'Orbitron',
                    fontSize: '11px',
                    color: '#1a2633',
                    fontStyle: 'bold'
                }
            )
                .setOrigin(0.5);

        this.desktopShieldState =
            this.scene.add.graphics();

        const keyBadge =
            this.scene.add.rectangle(
                29,
                30,
                29,
                25,
                0x111111,
                0.94
            );

        keyBadge.setStrokeStyle(
            2,
            0xffffff,
            0.9
        );

        const keyText =
            this.scene.add.text(
                29,
                30,
                'W',
                {
                    fontFamily: 'Orbitron',
                    fontSize: '16px',
                    color: '#ffffff',
                    fontStyle: 'bold'
                }
            )
                .setOrigin(0.5);

        slot.add([
            this.desktopShieldBackground,
            this.desktopShieldIcon,
            this.desktopShieldState,
            keyBadge,
            keyText
        ]);

        return slot;
    }

    private updateDesktopShieldState(): void {
        if (
            !this.desktopShieldBackground ||
            !this.desktopShieldIcon ||
            !this.desktopShieldState
        ) {
            return;
        }

        const radius = 44;
        const ringRadius = radius + 6;

        const unavailable =
            !this.scene.allowInput ||
            this.scene.isGamePaused ||
            this.scene.isGameOver ||
            this.scene.player?.isDead;

        const shieldRaised =
            this.scene.player
                ?.isShieldRaised?.() === true;

        this.desktopShieldState.clear();

        if (unavailable) {
            this.desktopShieldBackground
                .setFillStyle(
                    0x333333,
                    0.9
                );

            this.desktopShieldIcon
                .setColor('#777777');

            this.desktopShieldState
                .lineStyle(
                    6,
                    0x555555,
                    0.85
                )
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            return;
        }

        if (shieldRaised) {
            this.desktopShieldBackground
                .setFillStyle(
                    0x174f68,
                    0.98
                );

            this.desktopShieldIcon
                .setColor('#ffffff')
                .setText('LOWER');

            this.desktopShieldState
                .lineStyle(
                    6,
                    0x50c8ff,
                    1
                )
                .strokeCircle(
                    0,
                    0,
                    ringRadius
                );

            return;
        }

        this.desktopShieldBackground
            .setFillStyle(
                0xf2f2f2,
                0.94
            );

        this.desktopShieldIcon
            .setColor('#1a2633')
            .setText('SHIELD');

        this.desktopShieldState
            .lineStyle(
                6,
                0xffffff,
                1
            )
            .strokeCircle(
                0,
                0,
                ringRadius
            );
    }


}
