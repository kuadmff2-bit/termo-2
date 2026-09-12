(() => {
  'use strict';

  const STORAGE_KEY = 'termo-infinito-v1';
  let resetArmed = false;
  let resetTimer = null;

  function resetButtonLabel(button) {
    if (!button) return;
    button.textContent = button.id === 'resetBtn' ? 'Zerar tudo' : 'ZERAR TUDO';
    button.removeAttribute('data-reset-confirm');
  }

  function armReset(button) {
    resetArmed = true;
    button.dataset.resetConfirm = 'true';
    button.textContent = 'CONFIRMAR RESET';
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      resetArmed = false;
      resetButtonLabel(button);
    }, 4000);
  }

  function performReset() {
    clearTimeout(resetTimer);
    resetArmed = false;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('#sideResetAll, #resetBtn');
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (!resetArmed || button.dataset.resetConfirm !== 'true') {
      armReset(button);
      return;
    }

    performReset();
  }, true);
})();
