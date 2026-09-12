(() => {
  'use strict';

  const boards = document.getElementById('boards');
  if (!boards) return;

  const getEditableRow = () => boards.querySelector('.row .tile.editable')?.parentElement || null;
  const isFull = () => {
    const row = getEditableRow();
    if (!row) return false;
    const tiles = [...row.querySelectorAll('.tile')];
    return tiles.length === 5 && tiles.every(tile => tile.textContent.trim());
  };

  let wasFull = isFull();
  let correcting = false;

  const observer = new MutationObserver(() => {
    if (correcting) return;

    const fullNow = isFull();
    const justCompleted = fullNow && !wasFull;
    wasFull = fullNow;

    if (!justCompleted) return;

    const row = getEditableRow();
    const last = row?.querySelectorAll('.tile')?.[4];
    if (!last || last.classList.contains('active')) return;

    correcting = true;
    last.click();
    correcting = false;
    wasFull = true;
  });

  observer.observe(boards, { childList: true, subtree: true, characterData: true });
})();
