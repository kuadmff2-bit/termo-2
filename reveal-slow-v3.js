(() => {
  'use strict';

  const REVEAL_TOTAL_MS = 1300;
  let blockedUntil = 0;

  const style = document.createElement('style');
  style.textContent = `
    /* Revelação mais lenta e legível, da esquerda para a direita. */
    .row .tile.flip{
      animation-duration:.70s!important;
      animation-timing-function:cubic-bezier(.2,.72,.2,1)!important;
    }
    .row .tile.flip:nth-child(1){animation-delay:0ms!important}
    .row .tile.flip:nth-child(2){animation-delay:150ms!important}
    .row .tile.flip:nth-child(3){animation-delay:300ms!important}
    .row .tile.flip:nth-child(4){animation-delay:450ms!important}
    .row .tile.flip:nth-child(5){animation-delay:600ms!important}

    /* Em uma rodada encerrada, a resposta só aparece depois das caixas terminarem. */
    .board-answer-reveal-ui{
      animation-delay:.38s!important;
    }

    @media(prefers-reduced-motion:reduce){
      .row .tile.flip{
        animation-duration:.01ms!important;
        animation-delay:0ms!important;
      }
      .board-answer-reveal-ui{animation-delay:0ms!important}
    }
  `;
  document.head.appendChild(style);

  const boards = document.getElementById('boards');
  const keyboard = document.getElementById('keyboard');
  if (!boards) return;

  const beginRevealLock = () => {
    blockedUntil = Math.max(blockedUntil, performance.now() + REVEAL_TOTAL_MS);
  };

  const revealObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type !== 'attributes') continue;
      const target = mutation.target;
      if (target instanceof Element && target.classList.contains('tile') && target.classList.contains('flip')) {
        beginRevealLock();
        break;
      }
    }
  });

  revealObserver.observe(boards, {
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });

  const revealLocked = () => performance.now() < blockedUntil;

  document.addEventListener('keydown', event => {
    if (!revealLocked()) return;
    const key = String(event.key || '');
    if (/^[a-zA-Z]$/.test(key) || ['Enter','Backspace','Delete','ArrowLeft','ArrowRight'].includes(key)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  boards.addEventListener('click', event => {
    if (!revealLocked()) return;
    if (event.target.closest('.tile')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  keyboard?.addEventListener('click', event => {
    if (!revealLocked()) return;
    if (event.target.closest('.key')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
})();
