(() => {
  'use strict';

  const GAME_KEY = 'termo-infinito-v1';
  const STRICT_KEY = 'termo-progresso-correto-v1';
  const PREFIXES = ['termo-', 'termu-'];

  const nativeSetItem = Storage.prototype.setItem;
  const nativeRemoveItem = Storage.prototype.removeItem;

  const readJson = (key) => {
    try { return JSON.parse(localStorage.getItem(key)) || null; }
    catch { return null; }
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

  const sanitizeProgress = (raw) => {
    const progress = raw && typeof raw === 'object' ? raw : {};
    const cycleProgress = Array.isArray(progress.cycleProgress) && progress.cycleProgress.length === 4
      ? progress.cycleProgress.map(Boolean)
      : [false, false, false, false];

    return {
      phases: Math.max(0, Number(progress.phases) || 0),
      cycles: Math.max(0, Number(progress.cycles) || 0),
      cycleProgress,
      processed: typeof progress.processed === 'string' ? progress.processed : null
    };
  };

  const makeInitialProgress = () => {
    const gameState = readJson(GAME_KEY) || {};

    // Em instalações antigas, perfectRounds é o número mais confiável de fases realmente vencidas.
    const wonPhases = Math.max(0, Number(gameState.perfectRounds) || 0);

    // Se não houver histórico estrito, começa a reconstrução sem inventar vitórias.
    // Depois de um ZERAR TUDO, esse valor naturalmente é zero.
    return {
      phases: wonPhases,
      cycles: Math.floor(wonPhases / 4),
      cycleProgress: [false, false, false, false],
      processed: gameState?.currentGame?.finished ? signature(gameState) : null
    };
  };

  let progress = sanitizeProgress(readJson(STRICT_KEY) || makeInitialProgress());

  const saveProgress = () => {
    nativeSetItem.call(localStorage, STRICT_KEY, JSON.stringify(progress));
  };

  const processFinishedState = (gameState) => {
    const currentSignature = signature(gameState);
    if (!currentSignature || currentSignature === progress.processed) return;

    // Regra definida para o TERMO 2:
    // só uma fase VENCIDA entra em "Fases concluídas".
    if (isPerfect(gameState)) {
      const modeIndex = Math.max(
        0,
        Math.min(3, Number(gameState.currentGame?.modeIndex ?? gameState.modeIndex) || 0)
      );

      // A mesma etapa não pode contar duas vezes dentro do mesmo ciclo.
      if (!progress.cycleProgress[modeIndex]) {
        progress.cycleProgress[modeIndex] = true;
        progress.phases += 1;

        // Um ciclo só fecha quando TERMO, DUPLO, TRIPLO e QUARTETO foram vencidos.
        if (progress.cycleProgress.every(Boolean)) {
          progress.cycles += 1;
          progress.cycleProgress = [false, false, false, false];
        }
      }
    }

    // Vitória ou derrota: esse resultado já foi processado e não pode ser contado de novo.
    progress.processed = currentSignature;
    saveProgress();
  };

  const applyCorrectProgress = (gameState) => {
    if (!gameState || typeof gameState !== 'object') return gameState;

    gameState.phasesCompleted = progress.phases;
    gameState.cycle = progress.cycles;
    gameState.cycleProgress = [...progress.cycleProgress];
    gameState.games = progress.phases;
    gameState.perfectRounds = progress.phases;

    return gameState;
  };

  const normalizeAndSaveGameState = (value) => {
    try {
      const gameState = JSON.parse(String(value));
      if (!gameState || typeof gameState !== 'object') return String(value);

      processFinishedState(gameState);
      applyCorrectProgress(gameState);
      return JSON.stringify(gameState);
    } catch {
      return String(value);
    }
  };

  // Impede que o contador antigo do app.js grave derrota como fase concluída
  // ou restaure números diferentes dos contadores corretos.
  Storage.prototype.setItem = function(key, value) {
    if (this === localStorage && key === GAME_KEY) {
      const corrected = normalizeAndSaveGameState(value);
      const result = nativeSetItem.call(this, key, corrected);
      queuePaint();
      return result;
    }

    return nativeSetItem.call(this, key, value);
  };

  const syncStoredGame = () => {
    const gameState = readJson(GAME_KEY);
    if (!gameState) return;

    processFinishedState(gameState);
    applyCorrectProgress(gameState);
    nativeSetItem.call(localStorage, GAME_KEY, JSON.stringify(gameState));
  };

  const paint = () => {
    const phases = document.getElementById('scoreValue');
    const cycles = document.getElementById('cycleValue');

    if (phases) phases.textContent = String(progress.phases);
    if (cycles) cycles.textContent = String(progress.cycles);

    // Mantém a marcação lateral de etapas alinhada com o progresso correto.
    document.querySelectorAll('.mode-item').forEach((item, index) => {
      item.classList.toggle('done', Boolean(progress.cycleProgress[index]));
    });

    // Corrige também os números mostrados no resumo final da rodada.
    document.querySelectorAll('.result-progress-summary').forEach(summary => {
      const values = summary.querySelectorAll('strong');
      if (values[0]) values[0].textContent = String(progress.phases);
      if (values[1]) values[1].textContent = String(progress.cycles);
    });

    // Corrige a janela de estatísticas, quando estiver aberta.
    const stats = document.querySelectorAll('.stats-grid .stat strong');
    if (stats[0]) stats[0].textContent = String(progress.phases);
    if (stats[1]) stats[1].textContent = String(progress.cycles);
  };

  let paintQueued = false;
  function queuePaint() {
    if (paintQueued) return;
    paintQueued = true;
    requestAnimationFrame(() => {
      paintQueued = false;
      paint();
    });
  }

  const clearTermoStorage = (storage) => {
    try {
      const keys = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && PREFIXES.some(prefix => key.toLowerCase().startsWith(prefix))) {
          keys.push(key);
        }
      }
      keys.forEach(key => nativeRemoveItem.call(storage, key));
    } catch (_) { }
  };

  const resetEverything = (event) => {
    const button = event.target.closest?.('#sideResetAll, #resetBtn');
    if (!button) return;

    // Assume o controle antes dos listeners antigos do app.js/reset-fix.js.
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    progress = {
      phases: 0,
      cycles: 0,
      cycleProgress: [false, false, false, false],
      processed: null
    };

    clearTermoStorage(localStorage);
    clearTermoStorage(sessionStorage);

    // Recarrega do zero, no TERMO, sem reaproveitar estado de cache.
    const cleanUrl = `${location.pathname}?reset=${Date.now()}`;
    location.replace(cleanUrl);
  };

  document.addEventListener('click', resetEverything, true);

  const observer = new MutationObserver(() => {
    // Se o app acabou de salvar/finalizar uma fase, sincroniza e repinta.
    syncStoredGame();
    queuePaint();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });

  window.addEventListener('pageshow', () => {
    progress = sanitizeProgress(readJson(STRICT_KEY) || makeInitialProgress());
    syncStoredGame();
    paint();
  });

  saveProgress();
  syncStoredGame();
  paint();
})();
