(() => {
  'use strict';

  const NativeSet = window.Set;
  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/gi, 'c')
    .toLowerCase();

  window.Set = class TermuSet extends NativeSet {
    constructor(iterable) {
      super(iterable);

      const isMapIterator = Object.prototype.toString.call(iterable) === '[object Map Iterator]';
      if (!isMapIterator || !Array.isArray(window.TERMO_VALID_WORDS)) return;

      for (const raw of window.TERMO_VALID_WORDS) {
        const word = normalize(raw);
        if (word.length === 5 && /^[a-z]+$/.test(word)) this.add(word);
      }

      // O Set especial só é necessário durante a criação de validGuesses no app.js.
      window.Set = NativeSet;
    }
  };
})();
