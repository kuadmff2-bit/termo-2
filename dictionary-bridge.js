(() => {
  'use strict';

  const local = Array.isArray(window.TERMO_WORDS) ? window.TERMO_WORDS : [];
  const expanded = Array.isArray(window.TERMO_ALL_WORDS) ? window.TERMO_ALL_WORDS : [];
  const commonBR = Array.isArray(window.TERMO_COMMON_BR) ? window.TERMO_COMMON_BR : local;

  const seen = new Set();
  const merged = [];

  for (const raw of [...local, ...expanded]) {
    const word = String(raw || '').trim().toLowerCase();
    if (!word || seen.has(word)) continue;
    seen.add(word);
    merged.push(word);
  }

  const solutionSeen = new Set();
  const solutions = [];
  for (const raw of commonBR) {
    const word = String(raw || '').trim().toLowerCase();
    if (!word || solutionSeen.has(word)) continue;
    solutionSeen.add(word);
    solutions.push(word);
  }

  window.TERMO_WORDS = merged;
  window.TERMO_SOLUTION_WORDS = solutions;
  window.TERMO_DICTIONARY_SIZE = merged.length;
  window.TERMO_SOLUTION_SIZE = solutions.length;
})();
