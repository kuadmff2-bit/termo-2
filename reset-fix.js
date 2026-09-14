(() => {
  'use strict';

  const PREFIXES = ['termo-', 'termu-'];
  const EXPLICIT_KEYS = [
    'termo-infinito-v1',
    'termo-progresso-correto-v1'
  ];

  function clearGameStorage(storage) {
    try {
      // Primeiro remove as chaves conhecidas.
      EXPLICIT_KEYS.forEach(key => storage.removeItem(key));

      // Depois remove qualquer estado antigo/auxiliar criado pelo TERMO 2.
      const keys = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && PREFIXES.some(prefix => key.toLowerCase().startsWith(prefix))) {
          keys.push(key);
        }
      }
      keys.forEach(key => storage.removeItem(key));
    } catch (_) { }
  }

  function hardReset() {
    // Sinaliza para qualquer código que ainda rode neste frame não salvar nada de volta.
    window.__TERMO_HARD_RESET__ = true;

    clearGameStorage(localStorage);
    clearGameStorage(sessionStorage);

    // Confere uma segunda vez antes de sair da página.
    EXPLICIT_KEYS.forEach(key => {
      try { localStorage.removeItem(key); } catch (_) { }
      try { sessionStorage.removeItem(key); } catch (_) { }
    });

    // O parâmetro novo força uma navegação limpa e evita reaproveitar documento em cache.
    const url = new URL(location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('reset', String(Date.now()));
    location.replace(url.toString());
  }

  function interceptReset(event) {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('#sideResetAll, #resetBtn');
    if (!button) return;

    // Capturado no WINDOW: roda antes dos listeners do document e do botão.
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    hardReset();
  }

  // Window + capture garante prioridade sobre app.js e strict-progress.js.
  window.addEventListener('click', interceptReset, true);

  // Evita que algum salvamento tardio volte a gravar progresso durante a navegação.
  window.addEventListener('pagehide', () => {
    if (!window.__TERMO_HARD_RESET__) return;
    clearGameStorage(localStorage);
    clearGameStorage(sessionStorage);
  }, true);
})();
