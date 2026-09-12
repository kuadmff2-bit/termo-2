(() => {
  'use strict';

  const boards = document.getElementById('boards');
  const keyboard = document.getElementById('keyboard');
  if (!boards || !keyboard) return;

  const style = document.createElement('style');
  style.textContent = `
    /* Teclado mais próximo do TERMO: neutro claro e estados bem legíveis. */
    #keyboard .key{
      background:#494e59!important;
      border-color:#555b67!important;
      color:#fff!important;
      box-shadow:0 3px 0 #282c33,0 6px 14px rgba(0,0,0,.19)!important;
    }
    #keyboard .key:hover{background:#565c68!important}
    #keyboard .key.single-correct{background:var(--correct)!important;border-color:var(--correct)!important}
    #keyboard .key.single-present{background:var(--present)!important;border-color:var(--present)!important}
    #keyboard .key.single-absent,
    #keyboard .key.termu-all-absent{
      background:#202329!important;
      border-color:#292d34!important;
      color:#858c98!important;
    }

    /* Nos modos múltiplos cada barra continua representando um tabuleiro. */
    #keyboard .key-strips{
      left:3px!important;
      right:3px!important;
      bottom:3px!important;
      height:8px!important;
      gap:2px!important;
    }
    #keyboard .key-strip{
      border-radius:3px!important;
      background:#777e8b!important;
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)!important;
    }
    #keyboard .key-strip.correct{background:#39b5a0!important}
    #keyboard .key-strip.present{background:#e1b24f!important}
    #keyboard .key-strip.absent{background:#101217!important;box-shadow:none!important}

    #keyboard .key.termu-has-result{
      border-color:#666d79!important;
    }
  `;
  document.head.appendChild(style);

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

    // Se a casa para onde o motor avançou já está vazia, está tudo certo.
    if (!tiles[activeIndex].textContent.trim()) return;

    // Procura a próxima casa vazia, dando a volta somente enquanto houver espaço.
    for (let step = 1; step < 5; step++) {
      const index = (activeIndex + step) % 5;
      if (!tiles[index].textContent.trim()) {
        tiles[index].click();
        return;
      }
    }
    // Linha completa: não entra em loop e não muda o cursor.
  }

  function isLetterKey(value) {
    return typeof value === 'string' && /^[a-zA-Z]$/.test(value);
  }

  // O app processa primeiro; depois pulamos casas que já estavam ocupadas.
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

  function refreshKeyboardState() {
    keyboard.querySelectorAll('.key').forEach(key => {
      key.classList.remove('termu-all-absent','termu-has-result');
      const strips = [...key.querySelectorAll('.key-strip')];
      if (!strips.length) return;

      const used = strips.filter(strip =>
        strip.classList.contains('correct') ||
        strip.classList.contains('present') ||
        strip.classList.contains('absent')
      );
      if (!used.length) return;

      key.classList.add('termu-has-result');
      if (used.length === strips.length && used.every(strip => strip.classList.contains('absent'))) {
        key.classList.add('termu-all-absent');
      }
    });
  }

  const observer = new MutationObserver(refreshKeyboardState);
  observer.observe(keyboard, { childList:true, subtree:true });
  refreshKeyboardState();
})();
