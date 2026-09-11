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

    if (event.repeat || rowIsFull()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    setTimeout(pinCursorToLastCell, 0);
  }, true);

  const keyboard = document.getElementById('keyboard');
  if (keyboard) {
    keyboard.addEventListener('click', event => {
      const button = event.target.closest('.key');
      const key = button?.dataset?.key || '';
      if (!/^[A-Z]$/.test(key)) return;

      if (rowIsFull()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      setTimeout(pinCursorToLastCell, 0);
    }, true);
  }
})();
