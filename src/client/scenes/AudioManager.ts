import * as Phaser from "phaser";

class AudioManager {
  private game: Phaser.Game | null = null;

  private music: Phaser.Sound.BaseSound | null = null;

  private currentMusicKey: string | null = null;

  private pendingMusicKey: string | null = null;

  private muted: boolean;

  private initialized = false;

  constructor() {
    this.muted = window.localStorage.getItem("audio-muted") === "true";
  }

  initialize(game: Phaser.Game): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.game = game;
    this.game.sound.mute = this.muted;

    this.game.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
      if (this.pendingMusicKey) {
        const musicKey = this.pendingMusicKey;

        this.pendingMusicKey = null;

        this.playMusic(musicKey);
      }
    });
  }

  playMusic(key: string, volume = 0.35): void {
    if (!this.game) {
      return;
    }

    // dont restart same music if already playing
    if (this.currentMusicKey === key && this.music && this.music.isPlaying) {
      return;
    }

    if (this.game.sound.locked) {
      this.pendingMusicKey = key;
      return;
    }

    if (this.music) {
      this.music.stop();
      this.music.destroy();
      this.music = null;
    }

    this.currentMusicKey = key;

    this.music = this.game.sound.add(key, {
      loop: true,
      volume,
    });

    this.music.play();
  }

  playSound(key: string, volume = 0.7, rate = 1): void {
    if (!this.game || this.muted || this.game.sound.locked) {
      return;
    }

    this.game.sound.play(key, {
      volume,
      rate,
    });
  }

  stopMusic(): void {
    if (this.music) {
      this.music.stop();
      this.music.destroy();
      this.music = null;
    }

    this.currentMusicKey = null;
    this.pendingMusicKey = null;
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);

    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;

    window.localStorage.setItem("audio-muted", String(muted));

    if (this.game) {
      this.game.sound.mute = muted;
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  createMuteButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    depth = 10000,
  ): Phaser.GameObjects.Container {
    const width = 38;
    const height = 28;

    const container = scene.add
      .container(x, y)
      .setSize(width, height)
      .setScrollFactor(0)
      .setDepth(depth)
      .setInteractive({
        useHandCursor: true,
      });

    const background = scene.add
      .rectangle(0, 0, width, height, 0x183546, 1)
      .setStrokeStyle(1, 0x63d5ff, 1);

    const icon = scene.add
      .image(0, 0, this.muted ? "audio-off" : "audio-on")
      .setDisplaySize(18, 18)
      .setOrigin(0.5);

    container.add([background, icon]);

    container.on(
      "pointerdown",
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();

        const muted = this.toggleMute();

        icon.setTexture(muted ? "audio-off" : "audio-on");
      },
    );

    return container;
  }

  addButtonSound(gameObject: Phaser.GameObjects.GameObject): void {
    gameObject.on("pointerdown", () => {
      this.playSound("sfx-button-click", 0.45);
    });
  }
}

const audioManager = new AudioManager();

export default audioManager;
