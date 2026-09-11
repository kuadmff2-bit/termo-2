(() => {
  'use strict';

  const MODES = [
    { id: 'termo', name: 'TERMO', boards: 1, attempts: 6, multiplier: 1 },
    { id: 'duplo', name: 'DUPLO', boards: 2, attempts: 7, multiplier: 2 },
    { id: 'triplo', name: 'TRIPLO', boards: 3, attempts: 8, multiplier: 3 },
    { id: 'quarteto', name: 'QUARTETO', boards: 4, attempts: 9, multiplier: 4 }
  ];

  const KEYS = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['ENTER','Z','X','C','V','B','N','M','BACKSPACE']
  ];

  const STORAGE_KEY = 'termo-infinito-v1';
  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/gi, 'c')
    .toLowerCase();

  const sourceWords = [...new Set((window.TERMO_WORDS || [])
    .map(word => String(word).trim().toLowerCase())
    .filter(word => normalize(word).length === 5 && /^[a-záàâãéêíóôõúüç]+$/i.test(word)))];

  const canonicalByNormalized = new Map();
  sourceWords.forEach(word => {
    const key = normalize(word);
    if (!canonicalByNormalized.has(key) || /[áàâãéêíóôõúüç]/i.test(word)) canonicalByNormalized.set(key, word);
  });

  const solutionPool = [...canonicalByNormalized.values()];
  const validGuesses = new Set(canonicalByNormalized.keys());

  const boardsEl = document.getElementById('boards');
  const keyboardEl = document.getElementById('keyboard');
  const modeTitleEl = document.getElementById('modeTitle');
  const scoreValueEl = document.getElementById('scoreValue');
  const cycleValueEl = document.getElementById('cycleValue');
  const streakValueEl = document.getElementById('streakValue');
  const messageEl = document.getElementById('message');
  const backdropEl = document.getElementById('modalBackdrop');
  const modalTitleEl = document.getElementById('modalTitle');
  const modalBodyEl = document.getElementById('modalBody');
  const modalCloseEl = document.getElementById('modalClose');
  const attemptValueEl = document.getElementById('attemptValue');
  const boardValueEl = document.getElementById('boardValue');
  const nextRoundBtn = document.getElementById('nextRoundBtn');
  const modeItems = [...document.querySelectorAll('.mode-item')];

  const defaultPersistent = {
    score: 0,
    cycle: 1,
    streak: 0,
    bestStreak: 0,
    games: 0,
    boardsSolved: 0,
    perfectRounds: 0,
    modeIndex: 0,
    recentSolutions: []
  };

  let persistent = loadPersistent();
  let game = null;
  let input = Array(5).fill('');
  let cursorPos = 0;
  let locked = false;
  let messageTimer = null;

  function loadPersistent() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return { ...defaultPersistent, ...(parsed || {}) };
    } catch {
      return { ...defaultPersistent };
    }
  }

  function savePersistent() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistent));
  }

  function randomSolutions(count) {
    const recent = new Set((persistent.recentSolutions || []).map(normalize));
    const candidates = solutionPool.filter(word => !recent.has(normalize(word)));
    const pool = candidates.length >= count ? candidates : solutionPool;
    const selected = [];
    const used = new Set();

    while (selected.length < count && used.size < pool.length) {
      const index = Math.floor(Math.random() * pool.length);
      const word = pool[index];
      const key = normalize(word);
      if (!used.has(key)) {
        used.add(key);
        selected.push(word);
      }
    }
    return selected;
  }

  function newGame() {
    const mode = MODES[persistent.modeIndex] || MODES[0];
    game = {
      mode,
      solutions: randomSolutions(mode.boards),
      guesses: [],
      results: Array.from({ length: mode.boards }, () => []),
      solved: Array.from({ length: mode.boards }, () => false),
      solvedAt: Array.from({ length: mode.boards }, () => null),
      finished: false
    };
    input = Array(5).fill('');
    cursorPos = 0;
    locked = false;
    modeTitleEl.textContent = mode.name;
    renderAll();
  }

  function renderAll() {
    updateStatsBar();
    renderSidebar();
    renderBoards();
    renderKeyboard();
  }

  function updateStatsBar() {
    scoreValueEl.textContent = persistent.score.toLocaleString('pt-BR');
    cycleValueEl.textContent = persistent.cycle;
    streakValueEl.textContent = persistent.streak;
  }

  function renderSidebar() {
    if (!game) return;
    attemptValueEl.textContent = `${Math.min(game.guesses.length + (game.finished ? 0 : 1), game.mode.attempts)} / ${game.mode.attempts}`;
    boardValueEl.textContent = game.mode.boards === 1 ? '1 palavra' : `${game.mode.boards} palavras`;

    modeItems.forEach((item, index) => {
      item.classList.remove('active', 'done');
      if (index < persistent.modeIndex || (index === persistent.modeIndex && game.finished)) item.classList.add('done');
      if (index === persistent.modeIndex && !game.finished) item.classList.add('active');
    });

    const nextMode = MODES[(persistent.modeIndex + 1) % MODES.length];
    nextRoundBtn.textContent = `Jogar ${nextMode.name} →`;
    nextRoundBtn.classList.toggle('hidden', !game.finished);
  }

  function renderBoards() {
    const { mode } = game;
    boardsEl.className = `boards boards-${mode.boards}`;
    boardsEl.innerHTML = '';

    for (let boardIndex = 0; boardIndex < mode.boards; boardIndex++) {
      const board = document.createElement('div');
      board.className = `board${game.solved[boardIndex] ? ' solved' : ''}`;
      board.dataset.board = boardIndex;
      board.setAttribute('aria-label', `Tabuleiro ${boardIndex + 1}`);

      for (let rowIndex = 0; rowIndex < mode.attempts; rowIndex++) {
        const row = document.createElement('div');
        row.className = 'row';
        row.dataset.row = rowIndex;

        const solvedBeforeThisRow = game.solved[boardIndex] && game.solvedAt[boardIndex] && rowIndex >= game.solvedAt[boardIndex];
        const submitted = solvedBeforeThisRow ? null : game.guesses[rowIndex];
        const isCurrentRow = rowIndex === game.guesses.length && !game.solved[boardIndex] && !game.finished;
        const preview = isCurrentRow ? input : '';
        const displayGuess = submitted ? canonicalGuess(submitted) : preview;
        const result = game.results[boardIndex][rowIndex];

        for (let col = 0; col < 5; col++) {
          const tile = document.createElement('div');
          tile.className = 'tile';
          const char = displayGuess?.[col] || '';
          tile.textContent = char;

          if (char && !result) tile.classList.add('filled');
          if (result?.[col]) tile.classList.add(result[col]);
          if (isCurrentRow && col === cursorPos && cursorPos < 5) tile.classList.add('active');

          if (isCurrentRow) {
            tile.classList.add('editable');
            tile.addEventListener('click', () => {
              if (locked) return;
              cursorPos = col;
              renderBoards();
            });
          }
          row.appendChild(tile);
        }
        board.appendChild(row);
      }
      boardsEl.appendChild(board);
    }
  }

  function canonicalGuess(normalizedGuess) {
    return canonicalByNormalized.get(normalize(normalizedGuess)) || normalizedGuess;
  }

  function renderKeyboard() {
    keyboardEl.innerHTML = '';
    const perBoardStatus = getKeyboardStatus();

    KEYS.forEach(rowKeys => {
      const row = document.createElement('div');
      row.className = 'keyboard-row';

      rowKeys.forEach(key => {
        const button = document.createElement('button');
        button.className = `key${key.length > 1 ? ' wide' : ''}`;
        button.type = 'button';
        button.dataset.key = key;
        button.setAttribute('aria-label', key === 'BACKSPACE' ? 'Apagar' : key);

        const label = document.createElement('span');
        label.className = 'key-label';
        label.textContent = key === 'BACKSPACE' ? '⌫' : key;
        button.appendChild(label);

        if (key.length === 1) {
          const statuses = perBoardStatus[key.toLowerCase()] || [];
          if (game.mode.boards === 1 && statuses[0]) {
            button.classList.add(`single-${statuses[0]}`);
          } else if (game.mode.boards > 1) {
            const strips = document.createElement('span');
            strips.className = 'key-strips';
            for (let i = 0; i < game.mode.boards; i++) {
              const strip = document.createElement('span');
              strip.className = `key-strip${statuses[i] ? ` ${statuses[i]}` : ''}`;
              strips.appendChild(strip);
            }
            button.appendChild(strips);
          }
        }

        button.addEventListener('click', () => handleKey(key));
        row.appendChild(button);
      });
      keyboardEl.appendChild(row);
    });
  }

  function getKeyboardStatus() {
    const status = {};
    const rank = { absent: 1, present: 2, correct: 3 };

    game.guesses.forEach((guess, guessIndex) => {
      for (let boardIndex = 0; boardIndex < game.mode.boards; boardIndex++) {
        const result = game.results[boardIndex][guessIndex];
        if (!result) continue;
        [...normalize(guess)].forEach((letter, col) => {
          status[letter] ||= Array(game.mode.boards).fill(null);
          const current = status[letter][boardIndex];
          const next = result[col];
          if (!current || rank[next] > rank[current]) status[letter][boardIndex] = next;
        });
      }
    });
    return status;
  }

  function evaluateGuess(guess, solution) {
    const g = [...normalize(guess)];
    const s = [...normalize(solution)];
    const result = Array(5).fill('absent');
    const remaining = {};

    for (let i = 0; i < 5; i++) {
      if (g[i] === s[i]) {
        result[i] = 'correct';
      } else {
        remaining[s[i]] = (remaining[s[i]] || 0) + 1;
      }
    }

    for (let i = 0; i < 5; i++) {
      if (result[i] === 'correct') continue;
      if ((remaining[g[i]] || 0) > 0) {
        result[i] = 'present';
        remaining[g[i]]--;
      }
    }
    return result;
  }

  function handleKey(rawKey) {
    if (locked || game.finished) return;
    const key = String(rawKey).toUpperCase();

    if (key === 'ENTER') return submitGuess();
    if (key === 'ARROWLEFT') {
      cursorPos = (cursorPos + 4) % 5;
      return renderBoards();
    }
    if (key === 'ARROWRIGHT') {
      cursorPos = (cursorPos + 1) % 5;
      return renderBoards();
    }
    if (key === 'DELETE') {
      input[cursorPos] = '';
      return renderBoards();
    }
    if (key === 'BACKSPACE') {
      if (input[cursorPos]) {
        input[cursorPos] = '';
      } else if (cursorPos > 0) {
        cursorPos--;
        input[cursorPos] = '';
      }
      return renderBoards();
    }

    if (/^[A-Z]$/.test(key)) {
      input[cursorPos] = key.toLowerCase();
      cursorPos = (cursorPos + 1) % 5;
      renderBoards();
    }
  }

  async function submitGuess() {
    if (input.some(char => !char)) {
      shakeCurrentRows();
      return showMessage('Preencha as 5 letras');
    }

    const normalizedInput = normalize(input.join(''));
    if (!validGuesses.has(normalizedInput)) {
      shakeCurrentRows();
      return showMessage('Palavra não reconhecida');
    }

    locked = true;
    const rowIndex = game.guesses.length;
    game.guesses.push(normalizedInput);

    for (let boardIndex = 0; boardIndex < game.mode.boards; boardIndex++) {
      if (game.solved[boardIndex]) {
        game.results[boardIndex][rowIndex] = null;
        continue;
      }

      const result = evaluateGuess(normalizedInput, game.solutions[boardIndex]);
      game.results[boardIndex][rowIndex] = result;
      if (result.every(status => status === 'correct')) {
        game.solved[boardIndex] = true;
        game.solvedAt[boardIndex] = rowIndex + 1;
      }
    }

    input = Array(5).fill('');
    cursorPos = 0;
    renderBoards();
    renderSidebar();
    animateSubmittedRow(rowIndex);
    renderKeyboard();
    await delay(1120);

    if (game.solved.every(Boolean) || game.guesses.length >= game.mode.attempts) {
      finishGame();
    } else {
      locked = false;
    }
  }

  function animateSubmittedRow(rowIndex) {
    boardsEl.querySelectorAll(`.row[data-row="${rowIndex}"] .tile`).forEach((tile, i) => {
      tile.style.animationDelay = `${i * 105}ms`;
      tile.classList.add('flip');
    });
  }

  function shakeCurrentRows() {
    const rowIndex = game.guesses.length;
    boardsEl.querySelectorAll(`.row[data-row="${rowIndex}"]`).forEach(row => {
      row.classList.remove('shake');
      void row.offsetWidth;
      row.classList.add('shake');
    });
  }

  function calculatePoints() {
    let gained = 0;
    for (let i = 0; i < game.mode.boards; i++) {
      if (!game.solved[i]) continue;
      const attemptsLeft = game.mode.attempts - game.solvedAt[i];
      gained += 100 + attemptsLeft * 25;
    }
    if (game.solved.every(Boolean)) gained += 100 * game.mode.multiplier;
    return gained;
  }

  function finishGame() {
    game.finished = true;
    locked = true;
    const perfect = game.solved.every(Boolean);
    const solvedCount = game.solved.filter(Boolean).length;
    const gained = calculatePoints();

    persistent.score += gained;
    persistent.games += 1;
    persistent.boardsSolved += solvedCount;

    if (perfect) {
      persistent.streak += 1;
      persistent.perfectRounds += 1;
      persistent.bestStreak = Math.max(persistent.bestStreak, persistent.streak);
    } else {
      persistent.streak = 0;
    }

    persistent.recentSolutions = [...game.solutions, ...(persistent.recentSolutions || [])].slice(0, 40);
    savePersistent();
    updateStatsBar();
    renderSidebar();
    renderBoards();
    showResultModal(gained, perfect);
  }

  function advanceMode() {
    if (!game?.finished) return;
    const wasQuarteto = persistent.modeIndex === MODES.length - 1;
    persistent.modeIndex = (persistent.modeIndex + 1) % MODES.length;
    if (wasQuarteto) persistent.cycle += 1;
    savePersistent();
    forceCloseModal();
    newGame();
  }

  function answerLetters(word) {
    return [...word.toUpperCase()].map(letter => `<span>${letter}</span>`).join('');
  }

  function showResultModal(gained, perfect) {
    modalTitleEl.textContent = perfect ? `${game.mode.name} concluído!` : `${game.mode.name} encerrado`;
    const nextMode = MODES[(persistent.modeIndex + 1) % MODES.length];

    const answers = game.solutions.map((solution, index) => {
      const solved = game.solved[index];
      const status = solved ? `Resolvida na ${game.solvedAt[index]}ª tentativa` : 'Essa era a palavra';
      return `
        <div class="answer-card ${solved ? 'solved-answer' : 'missed-answer'}">
          <div class="answer-topline">
            <span>${game.mode.boards > 1 ? `PALAVRA ${index + 1}` : 'A PALAVRA ERA'}</span>
            <small>${status}</small>
          </div>
          <div class="answer-word" aria-label="${solution.toUpperCase()}">${answerLetters(solution)}</div>
        </div>
      `;
    }).join('');

    modalBodyEl.innerHTML = `
      <div class="result-solutions">${answers}</div>
      <div class="result-score">
        <span>Pontos nesta rodada</span>
        <strong>+${gained}</strong>
        <small>Total acumulado: ${persistent.score.toLocaleString('pt-BR')}</small>
      </div>
      <button class="primary-btn" id="continueBtn">Jogar ${nextMode.name}</button>
      <button class="secondary-btn" id="shareBtn">Compartilhar resultado</button>
      <p class="result-hint">Você pode fechar esta janela no ×. O botão para a próxima rodada também fica no painel lateral.</p>
    `;

    openModal();
    document.getElementById('continueBtn').addEventListener('click', advanceMode);
    document.getElementById('shareBtn').addEventListener('click', shareResult);
  }

  async function shareResult() {
    const modeEmoji = game.results.map((boardResults, boardIndex) => {
      const end = game.solvedAt[boardIndex] || game.guesses.length;
      return boardResults.slice(0, end).filter(Boolean).map(row => row.map(s => s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬛').join('')).join('\n');
    }).join('\n\n');

    const solved = game.solved.filter(Boolean).length;
    const text = `TERMO ∞ • ${game.mode.name}\n${solved}/${game.mode.boards} • ${game.guesses.length}/${game.mode.attempts}\nPontos: ${persistent.score}\n\n${modeEmoji}`;

    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        showMessage('Resultado copiado!');
      }
    } catch { }
  }

  function showHelp() {
    modalTitleEl.textContent = 'Como jogar';
    modalBodyEl.innerHTML = `
      <p>Descubra as palavras de 5 letras. Cada palpite vale ao mesmo tempo para todos os tabuleiros do modo atual.</p>
      <div class="legend">
        <div class="legend-row"><span class="legend-tile correct">T</span><span>Letra certa no lugar certo.</span></div>
        <div class="legend-row"><span class="legend-tile present">O</span><span>Letra existente, mas em outra posição.</span></div>
        <div class="legend-row"><span class="legend-tile absent">G</span><span>Letra que não faz parte da palavra.</span></div>
      </div>
      <p><strong>Ciclo infinito:</strong> TERMO (6) → DUPLO (7) → TRIPLO (8) → QUARTETO (9) → TERMO...</p>
      <p>Use ← e → para andar livremente pelas 5 casas, mesmo vazias. Também dá para clicar diretamente em qualquer casa e digitar nela.</p>
      <p>A pontuação e a sequência ficam salvas neste navegador. Acentos não alteram as dicas.</p>
    `;
    openModal();
  }

  function showStats() {
    modalTitleEl.textContent = 'Estatísticas';
    modalBodyEl.innerHTML = `
      <div class="stats-grid">
        <div class="stat"><strong>${persistent.score.toLocaleString('pt-BR')}</strong><span>pontos</span></div>
        <div class="stat"><strong>${persistent.games}</strong><span>rodadas</span></div>
        <div class="stat"><strong>${persistent.cycle}</strong><span>ciclo</span></div>
        <div class="stat"><strong>${persistent.boardsSolved}</strong><span>palavras</span></div>
        <div class="stat"><strong>${persistent.streak}</strong><span>sequência</span></div>
        <div class="stat"><strong>${persistent.bestStreak}</strong><span>recorde</span></div>
      </div>
      <p>Uma rodada perfeita é aquela em que você resolve todos os tabuleiros antes do limite de tentativas.</p>
      <button class="secondary-btn danger-btn" id="resetBtn">Zerar progresso</button>
    `;
    openModal();

    document.getElementById('resetBtn').addEventListener('click', () => {
      if (!confirm('Zerar pontos, estatísticas e voltar ao primeiro TERMO?')) return;
      persistent = { ...defaultPersistent };
      savePersistent();
      forceCloseModal();
      newGame();
    });
  }

  function showMessage(text) {
    clearTimeout(messageTimer);
    messageEl.textContent = text;
    messageEl.classList.remove('show');
    void messageEl.offsetWidth;
    messageEl.classList.add('show');
    messageTimer = setTimeout(() => { messageEl.textContent = ''; }, 1800);
  }

  function openModal() {
    backdropEl.classList.remove('hidden');
  }

  function forceCloseModal() {
    backdropEl.classList.add('hidden');
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  document.addEventListener('keydown', event => {
    if (!backdropEl.classList.contains('hidden')) {
      if (event.key === 'Escape') forceCloseModal();
      return;
    }

    if (event.key === 'Enter') return handleKey('ENTER');
    if (event.key === 'Backspace') return handleKey('BACKSPACE');
    if (event.key === 'Delete') return handleKey('DELETE');
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      return handleKey('ARROWLEFT');
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      return handleKey('ARROWRIGHT');
    }

    const letter = normalize(event.key).toUpperCase();
    if (/^[A-Z]$/.test(letter)) handleKey(letter);
  });

  document.getElementById('helpBtn').addEventListener('click', showHelp);
  document.getElementById('statsBtn').addEventListener('click', showStats);
  nextRoundBtn.addEventListener('click', advanceMode);
  modalCloseEl.addEventListener('click', forceCloseModal);
  backdropEl.addEventListener('click', event => {
    if (event.target === backdropEl) forceCloseModal();
  });

  if (solutionPool.length < 50) console.warn('Poucas palavras carregadas:', solutionPool.length);
  newGame();
})();
