(() => {
  'use strict';

  const NativeSet = window.Set;
  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/gi, 'c')
    .toLowerCase();

  const guaranteedCommon = [
    'fosco','filha','ferra','fuzil','surfa','surfe','surfo','força','porta','fonte',
    'terra','carro','carta','casal','caixa','campo','canto','custo','festa','firme',
    'fraco','fruta','grupo','janta','jeito','jovem','limpo','lindo','livro','lugar',
    'matar','morto','mundo','norte','nuvem','olhar','pedra','perto','plano','praia',
    'preto','prova','quase','renda','roupa','sabor','santo','sexta','sinal','solto',
    'tempo','tenso','terno','tonto','troca','verde','vidro','viver','volta','focar',
    'focos','forma','forte','frase','ferro','forro','fundo','farto'
  ];

  const merge = (base) => [...new Set([...(Array.isArray(base) ? base : []), ...guaranteedCommon])];
  window.TERMO_WORDS = merge(window.TERMO_WORDS);
  window.TERMO_VALID_WORDS = merge(window.TERMO_VALID_WORDS);

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
