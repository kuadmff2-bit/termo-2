(() => {
  'use strict';

  const local = Array.isArray(window.TERMO_WORDS) ? window.TERMO_WORDS : [];
  const expanded = Array.isArray(window.TERMO_ALL_WORDS) ? window.TERMO_ALL_WORDS : [];
  const commonBR = Array.isArray(window.TERMO_COMMON_BR) ? window.TERMO_COMMON_BR : local;

  const mergeUnique = (lists) => {
    const seen = new Set();
    const result = [];
    for (const raw of lists.flat()) {
      const word = String(raw || '').trim().toLowerCase();
      if (!word || seen.has(word)) continue;
      seen.add(word);
      result.push(word);
    }
    return result;
  };

  const solutions = mergeUnique([commonBR]);
  const validWords = mergeUnique([local, expanded, commonBR]);

  // app.js usa TERMO_WORDS para montar as respostas.
  window.TERMO_WORDS = solutions;
  // O catálogo grande fica separado e é injetado somente na validação dos palpites.
  window.TERMO_VALID_WORDS = validWords;
  window.TERMO_DICTIONARY_SIZE = validWords.length;
  window.TERMO_SOLUTION_SIZE = solutions.length;
})();
