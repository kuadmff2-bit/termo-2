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

  // Impede a navegação circular: ao segurar as setas,
  // o destaque para na primeira/última casa em vez de dar a volta.
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    const activeTile = boards.querySelector('.row .tile.active.editable');
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

  // Torna bem mais evidente no teclado quais letras já foram testadas.
  const keyboard = document.getElementById('keyboard');
  if (keyboard) {
    const style = document.createElement('style');
    style.id = 'keyboard-clarity-style';
    style.textContent = `
      #keyboard .key{
        border:1px solid #48505e;
        background:#303641;
        color:#f7f9fc;
      }
      #keyboard .key:not(.used-key):hover{
        background:#3a414e;
        border-color:#697486;
      }
      #keyboard .key.used-key{
        border-color:#687384;
        box-shadow:0 2px 0 #111318,0 5px 12px rgba(0,0,0,.24),inset 0 0 0 1px rgba(255,255,255,.04);
      }
      #keyboard .key.used-key>.key-label{
        font-weight:900;
        text-shadow:0 1px 2px rgba(0,0,0,.35);
      }
      #keyboard .key.single-correct{
        background:#2fa993!important;
        border-color:#6de0ca!important;
        color:#fff!important;
        opacity:1!important;
        box-shadow:0 2px 0 #18584e,0 0 0 2px rgba(54,165,147,.18)!important;
      }
      #keyboard .key.single-present{
        background:#d5a43e!important;
        border-color:#f2ca6b!important;
        color:#fff!important;
        opacity:1!important;
        box-shadow:0 2px 0 #6f5420,0 0 0 2px rgba(211,166,80,.16)!important;
      }
      #keyboard .key.single-absent,
      #keyboard .key.all-absent{
        background:#171a20!important;
        border-color:#292e37!important;
        color:#747d8b!important;
        opacity:.66;
        box-shadow:0 2px 0 #0d0f12!important;
      }
      #keyboard .key.multi-used{
        background:#252a33;
        padding-bottom:11px;
      }
      #keyboard .key.multi-used.has-correct{
        border-color:rgba(83,205,184,.78);
      }
      #keyboard .key.multi-used.has-present:not(.has-correct){
        border-color:rgba(232,188,91,.8);
      }
      #keyboard .key-strips{
        left:3px;
        right:3px;
        bottom:3px;
        height:10px;
        gap:3px;
      }
      #keyboard .key-strip{
        border-radius:3px;
        background:#535b68;
        border:1px solid rgba(255,255,255,.09);
        box-shadow:inset 0 1px 0 rgba(255,255,255,.06);
      }
      #keyboard .key-strip.correct{
        background:#35b39d;
        border-color:#66d8c4;
      }
      #keyboard .key-strip.present{
        background:#dda943;
        border-color:#efc568;
      }
      #keyboard .key-strip.absent{
        background:#3a404b;
        border-color:#505866;
      }
      @media(max-width:760px){
        #keyboard .key-strips{height:9px;bottom:2px;left:2px;right:2px;gap:2px}
        #keyboard .key.multi-used{padding-bottom:10px}
      }
    `;
    document.head.appendChild(style);

    let keyboardRefreshQueued = false;

    const refreshKeyClarity = () => {
      keyboardRefreshQueued = false;

      keyboard.querySelectorAll('.key').forEach(key => {
        key.classList.remove('used-key', 'multi-used', 'all-absent', 'has-correct', 'has-present');

        if (key.classList.contains('single-correct')) {
          key.classList.add('used-key', 'has-correct');
          return;
        }
        if (key.classList.contains('single-present')) {
          key.classList.add('used-key', 'has-present');
          return;
        }
        if (key.classList.contains('single-absent')) {
          key.classList.add('used-key', 'all-absent');
          return;
        }

        const strips = [...key.querySelectorAll('.key-strip')];
        if (!strips.length) return;

        const usedStrips = strips.filter(strip =>
          strip.classList.contains('correct') ||
          strip.classList.contains('present') ||
          strip.classList.contains('absent')
        );

        if (!usedStrips.length) return;

        key.classList.add('used-key', 'multi-used');

        if (usedStrips.some(strip => strip.classList.contains('correct'))) {
          key.classList.add('has-correct');
        }
        if (usedStrips.some(strip => strip.classList.contains('present'))) {
          key.classList.add('has-present');
        }
        if (usedStrips.length === strips.length && usedStrips.every(strip => strip.classList.contains('absent'))) {
          key.classList.add('all-absent');
        }
      });
    };

    const queueKeyboardRefresh = () => {
      if (keyboardRefreshQueued) return;
      keyboardRefreshQueued = true;
      requestAnimationFrame(refreshKeyClarity);
    };

    const keyboardObserver = new MutationObserver(queueKeyboardRefresh);
    keyboardObserver.observe(keyboard, { childList: true, subtree: true });
    refreshKeyClarity();
  }
})();
