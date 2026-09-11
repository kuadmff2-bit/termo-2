(() => {
  'use strict';

  const local = Array.isArray(window.TERMO_WORDS) ? window.TERMO_WORDS : [];
  const commonBR = Array.isArray(window.TERMO_COMMON_BR) ? window.TERMO_COMMON_BR : local;
  const validBR = Array.isArray(window.TERMO_VALID_BR) ? window.TERMO_VALID_BR : commonBR;
  const guaranteedCommonBR = [String.fromCharCode(102,117,122,105,108)];

  const mergeUnique = (list) => {
    const seen = new Set();
    const result = [];
    for (const raw of list) {
      const word = String(raw || '').trim().toLowerCase();
      if (!word || seen.has(word)) continue;
      seen.add(word);
      result.push(word);
    }
    return result;
  };

  const solutions = mergeUnique([...commonBR, ...guaranteedCommonBR]);
  const validWords = mergeUnique([...validBR, ...guaranteedCommonBR]);

  window.TERMO_WORDS = solutions;
  window.TERMO_VALID_WORDS = validWords;
  window.TERMO_DICTIONARY_SIZE = validWords.length;
  window.TERMO_SOLUTION_SIZE = solutions.length;
})();
