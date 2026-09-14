(() => {
  'use strict';

  const RESET_PREFIXES = ['termo-', 'termu-'];
  const EXPLICIT_KEYS = [
    'termo-infinito-v1',
    'termo-progresso-correto-v1'
  ];

  function clearTermoStorage(storage) {
    try {
      EXPLICIT_KEYS.forEach(key => storage.removeItem(key));

      const keys = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && RESET_PREFIXES.some(prefix => key.toLowerCase().startsWith(prefix))) {
          keys.push(key);
        }
      }
      keys.forEach(key => storage.removeItem(key));
    } catch (_) {
      // Se o navegador bloquear algum storage, o restante do reset ainda continua.
    }
  }

  function performReset() {
    // Apaga todo o estado do jogo, inclusive progresso auxiliar e partida atual.
    clearTermoStorage(localStorage);
    clearTermoStorage(sessionStorage);

    // Reabre o jogo do começo e evita reaproveitar uma página antiga em cache.
    const cleanUrl = `${location.pathname}?reset=${Date.now()}`;
    location.replace(cleanUrl);
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('#sideResetAll, #resetBtn');
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    performReset();
  }, true);
})();
