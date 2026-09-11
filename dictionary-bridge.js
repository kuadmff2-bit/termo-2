(() => {
  'use strict';

  const local = Array.isArray(window.TERMO_WORDS) ? window.TERMO_WORDS : [];
  const expanded = Array.isArray(window.TERMO_ALL_WORDS) ? window.TERMO_ALL_WORDS : [];

  const seen = new Set();
  const merged = [];

  for (const raw of [...local, ...expanded]) {
    const word = String(raw || '').trim().toLowerCase();
    if (!word || seen.has(word)) continue;
    seen.add(word);
    merged.push(word);
  }

  window.TERMO_WORDS = merged;
  window.TERMO_DICTIONARY_SIZE = merged.length;
})();
