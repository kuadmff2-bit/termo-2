(() => {
  'use strict';

  const MODES = ['TERMO', 'DUPLO', 'TRIPLO', 'QUARTETO'];
  const STORAGE_KEY = 'termo-infinito-v1';

  const style = document.createElement('style');
  style.textContent = `
    .brand-wrap{pointer-events:auto!important;gap:6px!important}
    .mode-arrow-ui{
      width:34px;height:34px;border:0;border-radius:9px;display:grid;place-items:center;
      background:transparent;color:#dce2ec;font-size:31px;font-weight:800;line-height:1;
      cursor:pointer;transition:background .16s ease,transform .12s ease,color .16s ease;
    }
    .mode-arrow-ui:hover{background:rgba(255,255,255,.07);color:#fff}
    .mode-arrow-ui:active{transform:scale(.9)}

    .board-answer-reveal-ui{
      min-height:54px;margin-bottom:8px;padding:7px 10px;border-radius:10px;
      display:grid;place-items:center;overflow:hidden;color:#fff;
      animation:termuAnswerBoxIn .24s ease both;
    }
    .board-answer-reveal-ui.answer-miss-ui{background:#b9434b;border:1px solid #d96067}
    .board-answer-reveal-ui.answer-ok-ui{background:#237f70;border:1px solid #36a593}
    .board-answer-label-ui{display:none!important}
    .board-answer-word-ui{
      display:flex!important;align-items:center!important;justify-content:center!important;gap:0!important;
      font-size:clamp(22px,3.4vmin,30px)!important;font-weight:800!important;
      letter-spacing:.01em!important;line-height:1!important;
    }
    .board-answer-word-ui>span{
      display:inline-block!important;opacity:1!important;transform:none!important;
      animation:none!important;filter:none!important;margin:0!important;padding:0 .01em!important;
      text-shadow:0 2px 4px rgba(0,0,0,.2)!important;
    }

    .round-result-ui{
      width:min(100%,330px);margin:10px auto 22px;display:grid;
      animation:termuResultIn .3s ease .65s both;
    }
    .round-continue-ui{
      min-height:60px;border:0;border-radius:11px;background:#36a593;color:#fff;
      font-weight:800;font-size:15px;cursor:pointer;padding:0 18px;
    }
    .round-continue-ui:hover{filter:brightness(1.08)}

    @keyframes termuAnswerBoxIn{
      from{opacity:0;transform:translateY(-5px)}
      to{opacity:1;transform:translateY(0)}
    }
    @keyframes termuResultIn{
      from{opacity:0;transform:translateY(8px)}
      to{opacity:1;transform:translateY(0)}
    }

    @media(max-width:760px){
      .mode-arrow-ui{width:29px;height:29px;font-size:26px}
      .brand-wrap{gap:2px!important}
      .board-answer-reveal-ui{min-height:48px;padding:6px 7px}
      .board-answer-word-ui{font-size:22px!important}
      .round-result-ui{width:min(100%,300px);margin-bottom:15px}
      .round-continue-ui{min-height:54px}
    }

    @media(prefers-reduced-motion:reduce){
      .board-answer-reveal-ui,.round-result-ui{animation-duration:.01ms!important;animation-delay:0!important}
    }
  `;
  document.head.appendChild(style);

  const brand = document.querySelector('.brand-wrap');
  const modeTitle = document.getElementById('modeTitle');
  const infinity = brand?.querySelector('.infinity');
  const boards = document.getElementById('boards');
  const keyboard = document.getElementById('keyboard');
  const backdrop = document.getElementById('modalBackdrop');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function changeMode(delta) {
    const state = readState();
    const current = Number.isInteger(state.modeIndex) ? state.modeIndex : 0;
    state.modeIndex = (current + delta + MODES.length) % MODES.length;
    state.currentGame = null;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    location.reload();
  }

  if (brand && modeTitle && infinity && !document.getElementById('prevModeUi')) {
    const prev = document.createElement('button');
    prev.id = 'prevModeUi';
    prev.className = 'mode-arrow-ui';
    prev.type = 'button';
    prev.textContent = '‹';
    prev.setAttribute('aria-label', 'Modo anterior');

    const next = document.createElement('button');
    next.id = 'nextModeUi';
    next.className = 'mode-arrow-ui';
    next.type = 'button';
    next.textContent = '›';
    next.setAttribute('aria-label', 'Próximo modo');

    brand.insertBefore(prev, modeTitle);
    brand.appendChild(next);
    prev.addEventListener('click', () => changeMode(-1));
    next.addEventListener('click', () => changeMode(1));
  }

  function clearInlineResult() {
    document.querySelectorAll('.board-answer-reveal-ui').forEach(el => el.remove());
    document.getElementById('roundResultUi')?.remove();
    keyboard?.classList.remove('hidden');
  }

  function buildAnswer(board, card) {
    const letters = [...card.querySelectorAll('.answer-word span')]
      .map(el => el.textContent.trim())
      .filter(Boolean);
    if (!letters.length) return;

    const missed = card.classList.contains('missed-answer');
    const reveal = document.createElement('div');
    reveal.className = `board-answer-reveal-ui ${missed ? 'answer-miss-ui' : 'answer-ok-ui'}`;

    const word = document.createElement('div');
    word.className = 'board-answer-word-ui';
    letters.forEach(letter => {
      const span = document.createElement('span');
      span.textContent = letter;
      word.appendChild(span);
    });
    reveal.appendChild(word);
    board.insertBefore(reveal, board.firstChild);
  }

  function replaceResultModal() {
    const title = modalTitle?.textContent || '';
    if (!/(concluído|encerrado)/i.test(title)) return;

    const cards = [...modalBody.querySelectorAll('.answer-card')];
    const boardEls = [...boards.querySelectorAll('.board')];
    if (!cards.length || !boardEls.length) return;

    clearInlineResult();
    cards.forEach((card, index) => {
      if (boardEls[index]) buildAnswer(boardEls[index], card);
    });

    const originalContinue = modalBody.querySelector('#continueBtn');
    const nextLabel = originalContinue?.textContent?.trim() || 'Próxima rodada';

    const result = document.createElement('section');
    result.id = 'roundResultUi';
    result.className = 'round-result-ui';
    result.innerHTML = `<button class="round-continue-ui" type="button">${nextLabel}</button>`;

    boards.insertAdjacentElement('afterend', result);
    keyboard?.classList.add('hidden');
    backdrop?.classList.add('hidden');

    result.querySelector('.round-continue-ui')?.addEventListener('click', () => {
      const continueButton = modalBody.querySelector('#continueBtn');
      clearInlineResult();
      if (continueButton) continueButton.click();
    });
  }

  if (backdrop) {
    const observer = new MutationObserver(() => {
      if (!backdrop.classList.contains('hidden')) replaceResultModal();
    });
    observer.observe(backdrop, { attributes: true, attributeFilter: ['class'] });
  }
})();
