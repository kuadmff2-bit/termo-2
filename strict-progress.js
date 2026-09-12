(() => {
  'use strict';

  const GAME_KEY = 'termo-infinito-v1';
  const STRICT_KEY = 'termo-progresso-correto-v1';

  const readJson = (key) => {
    try { return JSON.parse(localStorage.getItem(key)) || null; }
    catch { return null; }
  };

  const writeJson = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const signature = (gameState) => {
    const game = gameState?.currentGame;
    if (!game?.finished) return null;
    return [
      game.modeIndex ?? gameState.modeIndex ?? 0,
      ...(game.solutions || []),
      '|',
      ...(game.guesses || [])
    ].join(':');
  };

  const isPerfect = (gameState) => {
    const solved = gameState?.currentGame?.solved;
    return Boolean(
      gameState?.currentGame?.finished &&
      Array.isArray(solved) &&
      solved.length > 0 &&
      solved.every(Boolean)
    );
  };

  const makeInitialProgress = () => {
    const gameState = readJson(GAME_KEY) || {};
    const finished = Boolean(gameState?.currentGame?.finished);
    const perfect = isPerfect(gameState);
    const oldPhases = Math.max(0, Number(gameState.phasesCompleted) || 0);
    const corrected = Math.max(0, oldPhases - (finished && !perfect ? 1 : 0));
    const cycles = Math.floor(corrected / 4);
    const remainder = corrected % 4;

    return {
      phases: corrected,
      cycles,
      cycleProgress: [0, 1, 2, 3].map(index => index < remainder),
      processed: finished ? signature(gameState) : null
    };
  };

  let progress = readJson(STRICT_KEY) || makeInitialProgress();
  if (!Array.isArray(progress.cycleProgress) || progress.cycleProgress.length !== 4) {
    progress.cycleProgress = [false, false, false, false];
  }
  writeJson(STRICT_KEY, progress);

  const paint = () => {
    const phases = document.getElementById('scoreValue');
    const cycles = document.getElementById('cycleValue');
    const phaseText = String(progress.phases || 0);
    const cycleText = String(progress.cycles || 0);
    if (phases && phases.textContent !== phaseText) phases.textContent = phaseText;
    if (cycles && cycles.textContent !== cycleText) cycles.textContent = cycleText;
  };

  const processFinishedGame = () => {
    const gameState = readJson(GAME_KEY);
    const currentSignature = signature(gameState);
    if (!currentSignature || currentSignature === progress.processed) {
      paint();
      return;
    }

    if (isPerfect(gameState)) {
      const modeIndex = Math.max(0, Math.min(3, Number(gameState.currentGame?.modeIndex ?? gameState.modeIndex) || 0));

      if (!progress.cycleProgress[modeIndex]) {
        progress.cycleProgress[modeIndex] = true;
        progress.phases += 1;

        if (progress.cycleProgress.every(Boolean)) {
          progress.cycles += 1;
          progress.cycleProgress = [false, false, false, false];
        }
      }
    }

    progress.processed = currentSignature;
    writeJson(STRICT_KEY, progress);
    paint();
  };

  const observer = new MutationObserver(processFinishedGame);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });

  document.addEventListener('click', () => {
    setTimeout(() => {
      processFinishedGame();
      paint();
    }, 0);
  }, true);

  window.addEventListener('pageshow', () => {
    progress = readJson(STRICT_KEY) || makeInitialProgress();
    processFinishedGame();
    paint();
  });

  processFinishedGame();
  paint();
})();
