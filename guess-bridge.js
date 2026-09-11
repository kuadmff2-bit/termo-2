(() => {
  'use strict';

  const NativeSet = window.Set;
  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/gi, 'c')
    .toLowerCase();

  // Força a mesma coluna de todos os tabuleiros a revelar ao mesmo tempo.
  const style = document.createElement('style');
  style.textContent = `
    .row .tile.flip:nth-child(1){animation-delay:0ms!important}
    .row .tile.flip:nth-child(2){animation-delay:145ms!important}
    .row .tile.flip:nth-child(3){animation-delay:290ms!important}
    .row .tile.flip:nth-child(4){animation-delay:435ms!important}
    .row .tile.flip:nth-child(5){animation-delay:580ms!important}

    .board-answer-word-ui>span:nth-child(1){animation-delay:0ms!important}
    .board-answer-word-ui>span:nth-child(2){animation-delay:260ms!important}
    .board-answer-word-ui>span:nth-child(3){animation-delay:520ms!important}
    .board-answer-word-ui>span:nth-child(4){animation-delay:780ms!important}
    .board-answer-word-ui>span:nth-child(5){animation-delay:1040ms!important}
  `;
  document.head.appendChild(style);

  window.Set = class TermuSet extends NativeSet {
    constructor(iterable) {
      super(iterable);

      const isMapIterator = Object.prototype.toString.call(iterable) === '[object Map Iterator]';
      if (!isMapIterator || !Array.isArray(window.TERMO_VALID_WORDS)) return;

      for (const raw of window.TERMO_VALID_WORDS) {
        const word = normalize(raw);
        if (word.length === 5 && /^[a-z]+$/.test(word)) this.add(word);
      }

      window.Set = NativeSet;
    }
  };
})();
