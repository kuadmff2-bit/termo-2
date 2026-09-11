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
      min-height:62px;margin-bottom:8px;padding:8px 10px 9px;border-radius:10px;
      display:grid;gap:5px;justify-items:center;overflow:hidden;color:#fff;
      perspective:900px;
    }
    .board-answer-reveal-ui.answer-miss-ui{background:#b9434b;border:1px solid #d96067}
    .board-answer-reveal-ui.answer-ok-ui{background:#237f70;border:1px solid #36a593}
    .board-answer-label-ui{font-size:8px;font-weight:800;letter-spacing:.16em;color:rgba(255,255,255,.8)}
    .board-answer-word-ui{
      display:flex;align-items:center;justify-content:center;gap:0;
      font-size:clamp(21px,3.4vmin,29px);font-weight:800;letter-spacing:.015em;
      line-height:1;font-kerning:normal;perspective:720px;transform-style:preserve-3d;
    }
    .board-answer-word-ui>span{
      display:inline-block;min-width:0;margin:0;padding:0 .015em;
      opacity:0;transform-origin:50% 50%;backface-visibility:hidden;
      transform:rotateY(-96deg) translateZ(-24px) scale(.82);
      text-shadow:0 3px 0 rgba(0,0,0,.18),0 8px 16px rgba(0,0,0,.24);
      animation:termuAnswerReveal3D .9s cubic-bezier(.18,.76,.24,1) forwards;
      will-change:transform,opacity,filter;
    }

    .round-result-ui{
      width:min(100%,470px);margin:10px auto 22px;display:grid;grid-template-columns:1fr 1.35fr;
      gap:10px;align-items:stretch;animation:termuResultIn .42s ease 2.25s both;
    }
    .round-result-score-ui{
      min-height:68px;padding:9px 14px;border:1px solid rgba(255,255,255,.08);border-radius:11px;
      background:#1b1f27;display:grid;place-items:center;align-content:center;
    }
    .round-result-score-ui span{color:#8f98a8;font-size:8px;font-weight:800;letter-spacing:.13em}
    .round-result-score-ui strong{font-size:24px;line-height:1.05;color:#fff}
    .round-result-score-ui small{color:#8f98a8;font-size:9px}
    .round-continue-ui{
      min-height:68px;border:0;border-radius:11px;background:#36a593;color:#fff;
      font-weight:800;font-size:15px;cursor:pointer;
    }
    .round-continue-ui:hover{filter:brightness(1.08)}

    @keyframes termuAnswerReveal3D{
      0%{
        opacity:0;
        filter:brightness(.55) blur(1px);
        transform:rotateY(-96deg) translateZ(-24px) scale(.82);
      }
      52%{
        opacity:1;
        filter:brightness(1.12) blur(0);
        transform:rotateY(13deg) translateZ(14px) scale(1.08);
      }
      72%{
        transform:rotateY(-7deg) translateZ(7px) scale(1.035);
      }
      88%{
        transform:rotateY(3deg) translateZ(2px) scale(1.01);
      }
      100%{
        opacity:1;
        filter:brightness(1) blur(0);
        transform:rotateY(0) translateZ(0) scale(1);
      }
    }
    @keyframes termuResultIn{
      from{opacity:0;transform:translateY(10px)}
      to{opacity:1;transform:translateY(0)}
    }

    @media(max-width:760px){
      .mode-arrow-ui{width:29px;height:29px;font-size:26px}
      .brand-wrap{gap:2px!important}
      .board-answer-reveal-ui{min-height:50px;padding:6px 7px}
      .board-answer-word-ui{font-size:22px}
      .round-result-ui{grid-template-columns:1fr;width:min(100%,350px);margin-bottom:15px}
      .round-result-score-ui,.round-continue-ui{min-height:54px}
    }

    @media(prefers-reduced-motion:reduce){
      .board-answer-word-ui>span{animation-duration:.01ms!important;animation-delay:0!important}
      .round-result-ui{animation-delay:0!important}
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
    const letters = [...card.querySelectorAll('.answer-word span')].map(el => el.textContent.trim()).filter(Boolean);
    if (!letters.length) return;

    const missed = card.classList.contains('missed-answer');
    const reveal = document.createElement('div');
    reveal.className = `board-answer-reveal-ui ${missed ? 'answer-miss-ui' : 'answer-ok-ui'}`;

    const label = document.createElement('span');
    label.className = 'board-answer-label-ui';
    label.textContent = missed ? 'PALAVRA CERTA' : 'ACERTOU';
    reveal.appendChild(label);

    const word = document.createElement('div');
    word.className = 'board-answer-word-ui';
    letters.forEach((letter, letterIndex) => {
      const span = document.createElement('span');
      span.textContent = letter;
      span.style.animationDelay = `${letterIndex * 285}ms`;
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

    const scoreBox = modalBody.querySelector('.result-score');
    const gained = scoreBox?.querySelector('strong')?.textContent?.trim() || '+0';
    const total = scoreBox?.querySelector('small')?.textContent?.trim() || '';
    const originalContinue = modalBody.querySelector('#continueBtn');
    const nextLabel = originalContinue?.textContent?.trim() || 'Próxima rodada';

    const result = document.createElement('section');
    result.id = 'roundResultUi';
    result.className = 'round-result-ui';
    result.innerHTML = `
      <div class="round-result-score-ui">
        <span>PONTOS NESTA RODADA</span>
        <strong>${gained}</strong>
        <small>${total}</small>
      </div>
      <button class="round-continue-ui" type="button">${nextLabel}</button>
    `;

    boards.insertAdjacentElement('afterend', result);
    keyboard.classList.add('hidden');
    backdrop.classList.add('hidden');

    result.querySelector('.round-continue-ui').addEventListener('click', () => {
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
