(() => {
  'use strict';

  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/gi, 'c')
    .toLowerCase();

  const names = window.TERMO_BANNED_NAMES instanceof Set
    ? window.TERMO_BANNED_NAMES
    : new Set();

  // Respostas que até podem existir, mas não combinam com o catálogo comum do jogo.
  const bannedAnswers = new Set(['porno']);

  const isAllowedSolution = (raw) => {
    const word = normalize(raw);
    return word.length === 5 && !names.has(word) && !bannedAnswers.has(word);
  };

  if (Array.isArray(window.TERMO_WORDS)) {
    window.TERMO_WORDS = window.TERMO_WORDS.filter(isAllowedSolution);
  }

  // Limpa partidas antigas que tenham recebido uma resposta proibida.
  // Se a fase já acabou, mantém o progresso e apenas aponta para a próxima fase.
  try {
    const key = 'termo-infinito-v1';
    const saved = JSON.parse(localStorage.getItem(key));
    const currentGame = saved?.currentGame;
    const solutions = currentGame?.solutions;

    if (Array.isArray(solutions) && solutions.some(word => !isAllowedSolution(word))) {
      if (currentGame?.finished) {
        const currentMode = Number.isInteger(saved.modeIndex) ? saved.modeIndex : 0;
        saved.modeIndex = (currentMode + 1) % 4;
      }
      saved.currentGame = null;
      localStorage.setItem(key, JSON.stringify(saved));
    }
  } catch { }
})();
