import {
  context,
  requestExpandedMode
} from '@devvit/web/client';

const startButton =
  document.getElementById(
    'start-button'
  ) as HTMLButtonElement | null;

const welcomeText =
  document.getElementById(
    'welcome-text'
  ) as HTMLParagraphElement | null;

async function loadFonts():
  Promise<void> {
  try {
    await Promise.all([
      document.fonts.load(
        '400 16px Orbitron'
      ),

      document.fonts.load(
        '700 24px Orbitron'
      )
    ]);

    await document.fonts.ready;
  } catch (error) {
    console.error(
      '[Splash] Failed to load fonts:',
      error
    );
  }
}

function setWelcomeMessage():
  void {
  if (!welcomeText) {
    return;
  }

  const username =
    context.username;

  welcomeText.textContent =
    username
      ? `Welcome, u/${username}`
      : 'Welcome, Raider';
}

function registerStartButton():
  void {
  if (!startButton) {
    console.error(
      '[Splash] Start button was not found.'
    );

    return;
  }

  startButton.addEventListener(
    'click',
    event => {
      startButton.disabled = true;

      const buttonText =
        startButton.querySelector(
          '.button-text'
        );

      if (buttonText) {
        buttonText.textContent =
          'LOADING...';
      }

      try {
        requestExpandedMode(
          event,
          'game'
        );
      } catch (error) {
        console.error(
          '[Splash] Failed to open game:',
          error
        );

        startButton.disabled = false;

        if (buttonText) {
          buttonText.textContent =
            'PLAY NOW';
        }
      }
    }
  );
}

async function init():
  Promise<void> {
  setWelcomeMessage();

  registerStartButton();

  await loadFonts();

  document.body.classList.add(
    'fonts-loaded'
  );
}

void init();
