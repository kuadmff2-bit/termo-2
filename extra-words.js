// Palavras extras de alta confiança que devem ser aceitas imediatamente.
// A lista automática maior continua sendo gerada em all-words.js.
(() => {
  const extras = [
    'surfa','surfe','surfo'
  ];
  window.TERMO_WORDS = Array.isArray(window.TERMO_WORDS)
    ? [...window.TERMO_WORDS, ...extras]
    : extras;
})();
