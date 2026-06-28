import * as Phaser from "phaser";

import { Boot } from "./scenes/Boot";
import { Preloader } from "./scenes/Preloader";
import { MainMenu } from "./scenes/MainMenu";
import { Collections } from "./scenes/Collections";
import { Game as MainGame } from "./scenes/Game";
import BattleUI from "./game/BattleUI";
import { GameOver } from "./scenes/GameOver";
import { Leaderboard } from "./scenes/Leaderboard";

const GAME_WIDTH = 1366;
const GAME_HEIGHT = 768;
const GAME_ASPECT_RATIO = GAME_WIDTH / GAME_HEIGHT;

const MOBILE_WIDTH_LIMIT = 700;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,

  parent: "game-container",

  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },
  backgroundColor: "#028af8",

  scale: {
    mode: Phaser.Scale.NONE,

    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },

  input: {
    activePointers: 3,

    touch: {
      capture: true,
    },
  },

  scene: [
    Boot,
    Preloader,
    MainMenu,
    Collections,
    MainGame,
    BattleUI,
    GameOver,
    Leaderboard,
  ],
};

let phaserGame: Phaser.Game | null = null;
let resizeFrame: number | null = null;

function getGameAreaSize(): {
  width: number;
  height: number;
} {
  const app = document.getElementById("app");

  if (!app) {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  const bounds = app.getBoundingClientRect();

  return {
    width: Math.round(bounds.width),
    height: Math.round(bounds.height),
  };
}

function fixRotatedPointerInput(game: Phaser.Game): void {
  const inputManager = game.input;

  const originalTransformPointer =
    inputManager.transformPointer.bind(inputManager);

  inputManager.transformPointer = (
    pointer: Phaser.Input.Pointer,
    pageX: number,
    pageY: number,
    wasMove: boolean,
  ): void => {
    const rotationStage = document.getElementById("rotation-stage");

    const isRotated =
      rotationStage?.classList.contains("mobile-rotated") ?? false;

    if (!isRotated || !rotationStage) {
      originalTransformPointer(pointer, pageX, pageY, wasMove);

      return;
    }

    const bounds = rotationStage.getBoundingClientRect();

    const visibleX = pageX - bounds.left;
    const visibleY = pageY - bounds.top;

    const normalizedX = Phaser.Math.Clamp(visibleY / bounds.height, 0, 1);

    const normalizedY = Phaser.Math.Clamp(
      (bounds.width - visibleX) / bounds.width,
      0,
      1,
    );

    const gameX = normalizedX * GAME_WIDTH;
    const gameY = normalizedY * GAME_HEIGHT;

    pointer.prevPosition.copy(pointer.position);
    pointer.position.set(gameX, gameY);

    pointer.x = gameX;
    pointer.y = gameY;
  };
}

function calculateFittedSize(
  availableWidth: number,
  availableHeight: number,
): {
  width: number;
  height: number;
} {
  let width = availableWidth;
  let height = width / GAME_ASPECT_RATIO;

  if (height > availableHeight) {
    height = availableHeight;
    width = height * GAME_ASPECT_RATIO;
  }

  return {
    width: Math.floor(width),
    height: Math.floor(height),
  };
}

function updateGameLayout(): void {
  const rotationStage = document.getElementById("rotation-stage");

  if (!rotationStage) {
    return;
  }

  const gameArea = getGameAreaSize();

  const shouldRotate =
    gameArea.width <= MOBILE_WIDTH_LIMIT && gameArea.height > gameArea.width;

  let stageWidth: number;
  let stageHeight: number;

  if (shouldRotate) {
    const fittedSize = calculateFittedSize(gameArea.height, gameArea.width);

    stageWidth = fittedSize.width;
    stageHeight = fittedSize.height;

    rotationStage.classList.add("mobile-rotated");
  } else {
    const fittedSize = calculateFittedSize(gameArea.width, gameArea.height);

    stageWidth = fittedSize.width;
    stageHeight = fittedSize.height;

    rotationStage.classList.remove("mobile-rotated");
  }

  rotationStage.style.width = `${stageWidth}px`;
  rotationStage.style.height = `${stageHeight}px`;

  if (resizeFrame !== null) {
    window.cancelAnimationFrame(resizeFrame);
  }

  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = null;

      if (!phaserGame) {
        return;
      }

      phaserGame.scale.refresh();

      phaserGame.events.emit("webview-resized", {
        rotated: shouldRotate,

        availableWidth: gameArea.width,
        availableHeight: gameArea.height,

        stageWidth,
        stageHeight,
      });
    });
  });
}

function startGame(): Phaser.Game {
  return new Phaser.Game(config);
}

function initialiseGame(): void {
  updateGameLayout();

  phaserGame = startGame();

  fixRotatedPointerInput(phaserGame);

  window.requestAnimationFrame(() => {
    updateGameLayout();
  });

  window.addEventListener("resize", updateGameLayout);

  window.addEventListener("orientationchange", updateGameLayout);

  const app = document.getElementById("app");

  if (app) {
    const resizeObserver = new ResizeObserver(() => {
      updateGameLayout();
    });

    resizeObserver.observe(app);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiseGame, { once: true });
} else {
  initialiseGame();
}
