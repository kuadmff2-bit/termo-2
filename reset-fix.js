(() => {
  'use strict';

  const GAME_KEY = 'termo-infinito-v1';
  const STRICT_KEY = 'termo-progresso-correto-v1';

  function performReset() {
    localStorage.removeItem(GAME_KEY);
    localStorage.removeItem(STRICT_KEY);
    location.reload();
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('#sideResetAll, #resetBtn');
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    performReset();
  }, true);
})();
