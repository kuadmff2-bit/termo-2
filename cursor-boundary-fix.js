(() => {
  'use strict';

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    const activeTile = document.querySelector('.row .tile.active.editable');
    if (!activeTile) return;

    const row = activeTile.parentElement;
    if (!row) return;

    const tiles = [...row.querySelectorAll('.tile.editable')];
    const activeIndex = tiles.indexOf(activeTile);
    if (activeIndex < 0) return;

    const atLeftEdge = event.key === 'ArrowLeft' && activeIndex === 0;
    const atRightEdge = event.key === 'ArrowRight' && activeIndex === tiles.length - 1;

    if (atLeftEdge || atRightEdge) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
})();
