(() => {
  'use strict';

  const local = Array.isArray(window.TERMO_WORDS) ? window.TERMO_WORDS : [];
  const commonBR = Array.isArray(window.TERMO_COMMON_BR) ? window.TERMO_COMMON_BR : local;
  const validBR = Array.isArray(window.TERMO_VALID_BR) ? window.TERMO_VALID_BR : commonBR;

  // Palavras que queremos manter no conjunto de respostas.
  // RAIAR é verbo no infinitivo e segue a regra atual das respostas do jogo.
  const guaranteedSolutionsBR = [String.fromCharCode(102,117,122,105,108), 'raiar'];

  // Palavras válidas em português que podem ser usadas como palpite mesmo quando
  // a lista automática de frequência não as trouxe para TERMO_VALID_BR.
  const guaranteedGuessesBR = ['finta'];

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

  const solutions = mergeUnique([...commonBR, ...guaranteedSolutionsBR]);
  const validWords = mergeUnique([
    ...validBR,
    ...guaranteedSolutionsBR,
    ...guaranteedGuessesBR
  ]);

  window.TERMO_WORDS = solutions;
  window.TERMO_VALID_WORDS = validWords;
  window.TERMO_DICTIONARY_SIZE = validWords.length;
  window.TERMO_SOLUTION_SIZE = solutions.length;

  const currentEditableRow = () => {
    const tile = document.querySelector('#boards .tile.editable');
    return tile ? tile.parentElement : null;
  };

  const rowIsFull = () => {
    const row = currentEditableRow();
    if (!row) return false;
    const tiles = [...row.querySelectorAll('.tile')];
    return tiles.length === 5 && tiles.every(tile => tile.textContent.trim());
  };

  const pinCursorToLastCell = () => {
    const row = currentEditableRow();
    if (!row || !rowIsFull()) return;
    const tiles = row.querySelectorAll('.tile');
    const last = tiles[4];
    if (last && !last.classList.contains('active')) last.click();
  };

  document.addEventListener('keydown', event => {
    const isLetter = typeof event.key === 'string' && /^[a-zA-Z]$/.test(event.key);
    if (!isLetter) return;

    // Segurar uma tecla não pode ficar sobrescrevendo a linha em loop.
    if (event.repeat) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    // Se a linha ainda não estava completa, ao preencher a 5ª casa
    // o cursor para na última. Se já estava completa, a letra selecionada
    // pode ser substituída normalmente e o cursor continua navegável.
    const wasFull = rowIsFull();
    if (!wasFull) {
      setTimeout(() => {
        if (rowIsFull()) pinCursorToLastCell();
      }, 0);
    }
  }, true);

  const keyboard = document.getElementById('keyboard');
  if (keyboard) {
    keyboard.addEventListener('click', event => {
      const button = event.target.closest('.key');
      const key = button?.dataset?.key || '';
      if (!/^[A-Z]$/.test(key)) return;

      const wasFull = rowIsFull();
      if (!wasFull) {
        setTimeout(() => {
          if (rowIsFull()) pinCursorToLastCell();
        }, 0);
      }
    }, true);
  }
})();
