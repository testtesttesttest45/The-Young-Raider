import { requestExpandedMode } from "@devvit/web/client";

import type {
  ApiErrorResponse,
  SharedKingSlayerPostResponse,
  SharedProfilePostResponse,
} from "../shared/api";

const loadingView = document.querySelector<HTMLDivElement>("#score-loading");

const profileContent =
  document.querySelector<HTMLDivElement>("#profile-content");

const playerName = document.querySelector<HTMLHeadingElement>("#player-name");

const scoreText = document.querySelector<HTMLDivElement>("#highest-score");

const baseText = document.querySelector<HTMLElement>("#highest-base");

const rankText = document.querySelector<HTMLElement>("#global-rank");

const scoreLabel = document.querySelector<HTMLElement>("#score-label");

const baseLabel = document.querySelector<HTMLElement>("#base-label");

const profileTitle = document.querySelector<HTMLElement>("#profile-title");

const playButton = document.querySelector<HTMLButtonElement>("#play-button");

const challengeText = document.querySelector<HTMLElement>("#challenge-text");

const pageTitle = document.querySelector<HTMLTitleElement>("#page-title");

type SharedPostResponse =
  | SharedProfilePostResponse
  | SharedKingSlayerPostResponse
  | ApiErrorResponse;

function showNormalProfile(responseData: SharedProfilePostResponse): void {
  const { username, highestScore, highestBaseSeen, globalRank } =
    responseData.data;

  if (profileTitle) {
    profileTitle.textContent = "RAIDER PROFILE";
  }

  if (playerName) {
    playerName.textContent = `u/${username}`;
  }

  if (scoreLabel) {
    scoreLabel.textContent = "HIGHEST SCORE";
  }

  if (scoreText) {
    scoreText.textContent = highestScore.toLocaleString();
  }

  if (baseLabel) {
    baseLabel.textContent = "HIGHEST BASE";
  }

  if (baseText) {
    baseText.textContent = highestBaseSeen.toLocaleString();
  }

  if (rankText) {
    rankText.textContent = globalRank !== null ? `#${globalRank}` : "UNRANKED";
  }

  if (challengeText) {
    challengeText.textContent = "CAN YOU BEAT THIS RAIDER?";
  }

  if (pageTitle) {
    pageTitle.textContent = "Raider Profile";
  }
}

function showKingSlayerProfile(
  responseData: SharedKingSlayerPostResponse,
): void {
  const { username, score, kills, globalRank } = responseData.data;

  if (profileTitle) {
    profileTitle.textContent = "KING SLAYER RECORD";
  }

  if (playerName) {
    playerName.textContent = `u/${username}`;
  }

  if (scoreLabel) {
    scoreLabel.textContent = "KING SLAYER SCORE";
  }

  if (scoreText) {
    scoreText.textContent = score.toLocaleString();
  }

  if (baseLabel) {
    baseLabel.textContent = "KINGS DEFEATED";
  }

  if (baseText) {
    baseText.textContent = kills.toLocaleString();
  }

  if (rankText) {
    rankText.textContent = globalRank !== null ? `#${globalRank}` : "UNRANKED";
  }

  if (challengeText) {
    challengeText.textContent = "CAN YOU DEFEAT MORE KINGS?";
  }

  if (pageTitle) {
    pageTitle.textContent = "King Slayer Record";
  }
}

async function loadProfile(): Promise<void> {
  try {
    const response = await fetch("/api/shared-profile-post", {
      headers: {
        Accept: "application/json",
      },
    });

    const rawResponse = await response.text();

    let responseData: SharedPostResponse;

    try {
      responseData = rawResponse
        ? JSON.parse(rawResponse)
        : {
            status: "error",
            message: "The server returned no shared profile data.",
          };
    } catch {
      throw new Error("The server returned invalid shared profile data.");
    }

    if (!response.ok) {
      const message =
        "message" in responseData
          ? responseData.message
          : "Unable to load shared profile.";

      throw new Error(message);
    }

    if (!("type" in responseData)) {
      throw new Error("Unexpected server response.");
    }

    if (responseData.type === "shared-profile-post") {
      showNormalProfile(responseData);
    } else if (responseData.type === "shared-king-slayer-post") {
      showKingSlayerProfile(responseData);
    } else {
      throw new Error("This shared post type is not supported.");
    }

    if (loadingView) {
      loadingView.hidden = true;
    }

    if (profileContent) {
      profileContent.hidden = false;
    }
  } catch (error) {
    console.error("[Shared Profile] Failed:", error);

    const loadingMessage =
      loadingView?.querySelector<HTMLParagraphElement>("p");

    if (loadingMessage) {
      loadingMessage.textContent =
        error instanceof Error
          ? error.message
          : "Unable to load shared profile.";
    }
  }
}

playButton?.addEventListener("click", async (event) => {
  playButton.disabled = true;

  playButton.textContent = "ENTERING...";

  try {
    await requestExpandedMode(event, "game");
  } catch (error) {
    console.error("[Shared Profile] Unable to enter:", error);

    playButton.disabled = false;

    playButton.textContent = "PLAY THE YOUNG RAIDER";
  }
});

void loadProfile();
