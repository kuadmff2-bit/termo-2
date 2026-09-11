(() => {
  'use strict';

  const local = Array.isArray(window.TERMO_WORDS) ? window.TERMO_WORDS : [];
  const commonBR = Array.isArray(window.TERMO_COMMON_BR) ? window.TERMO_COMMON_BR : local;

  const seen = new Set();
  const common = [];

  for (const raw of commonBR) {
    const word = String(raw || '').trim().toLowerCase();
    if (!word || seen.has(word)) continue;
    seen.add(word);
    common.push(word);
  }

  // A mesma lista brasileira e conhecida serve para respostas e palpites.
  // O catálogo gigante continua no repositório, mas não participa mais do jogo.
  window.TERMO_WORDS = common;
  window.TERMO_VALID_WORDS = common;
  window.TERMO_DICTIONARY_SIZE = common.length;
  window.TERMO_SOLUTION_SIZE = common.length;
})();
