(() => {
  'use strict';

  const boards = document.getElementById('boards');
  const keyboard = document.getElementById('keyboard');
  if (!boards || !keyboard) return;

  function editableRow() {
    const firstEditable = boards.querySelector('.tile.editable');
    return firstEditable?.parentElement || null;
  }

  function movePastOccupiedCell() {
    const row = editableRow();
    if (!row) return;

    const tiles = [...row.querySelectorAll('.tile')];
    if (tiles.length !== 5) return;

    const activeIndex = tiles.findIndex(tile => tile.classList.contains('active'));
    if (activeIndex < 0) return;

    // Se a casa atual está vazia, não precisa mover.
    if (!tiles[activeIndex].textContent.trim()) return;

    // Pula casas já preenchidas e vai para a próxima vazia.
    for (let step = 1; step < 5; step++) {
      const index = (activeIndex + step) % 5;
      if (!tiles[index].textContent.trim()) {
        tiles[index].click();
        return;
      }
    }
    // Linha completa: mantém o cursor onde está e não cria loop.
  }

  function isLetterKey(value) {
    return typeof value === 'string' && /^[a-zA-Z]$/.test(value);
  }

  document.addEventListener('keydown', event => {
    if (!isLetterKey(event.key) || event.repeat) return;
    queueMicrotask(movePastOccupiedCell);
  });

  keyboard.addEventListener('click', event => {
    const button = event.target.closest('.key');
    const key = button?.dataset?.key || '';
    if (!/^[A-Z]$/.test(key)) return;
    queueMicrotask(movePastOccupiedCell);
  });
})();
