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
  const PROGRESS_VERSION = 2;
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
  const phasesValueEl = document.getElementById('scoreValue');
  const cycleValueEl = document.getElementById('cycleValue');
  const oldStreakValueEl = document.getElementById('streakValue');
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
    progressVersion: PROGRESS_VERSION,
    phasesCompleted: 0,
    cycle: 0,
    cycleProgress: [false, false, false, false],
    modeIndex: 0,
    recentSolutions: [],
    currentGame: null,
    games: 0,
    boardsSolved: 0,
    perfectRounds: 0,
    streak: 0,
    bestStreak: 0,
    score: 0
  };

  let persistent = loadPersistent();
  let game = null;
  let input = Array(5).fill('');
  let cursorPos = 0;
  let locked = false;
  let messageTimer = null;

  setupProgressPanel();

  function loadPersistent() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed) return { ...defaultPersistent, cycleProgress: [...defaultPersistent.cycleProgress] };

      const migrated = { ...defaultPersistent, ...parsed };
      if (parsed.progressVersion !== PROGRESS_VERSION) {
        migrated.progressVersion = PROGRESS_VERSION;
        migrated.phasesCompleted = Number.isFinite(parsed.games) ? parsed.games : 0;
        migrated.cycle = Math.max(0, (Number(parsed.cycle) || 1) - 1);
        migrated.cycleProgress = [false, false, false, false];
        migrated.currentGame = null;
      }
      if (!Array.isArray(migrated.cycleProgress) || migrated.cycleProgress.length !== 4) {
        migrated.cycleProgress = [false, false, false, false];
      }
      migrated.phasesCompleted = Math.max(0, Number(migrated.phasesCompleted) || 0);
      migrated.cycle = Math.max(0, Number(migrated.cycle) || 0);
      migrated.modeIndex = Math.max(0, Math.min(3, Number(migrated.modeIndex) || 0));
      return migrated;
    } catch {
      return { ...defaultPersistent, cycleProgress: [...defaultPersistent.cycleProgress] };
    }
  }

  function savePersistent() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistent));
  }

  function setupProgressPanel() {
    const scorebar = document.querySelector('.stats-panel .scorebar');
    if (!scorebar) return;

    const items = [...scorebar.children];
    if (items[0]) {
      const label = items[0].querySelector('.label');
      if (label) label.textContent = 'FASES CONCLUÍDAS';
    }
    if (items[1]) {
      const label = items[1].querySelector('.label');
      if (label) label.textContent = 'CICLOS';
    }
    if (items[2]) items[2].style.display = 'none';
    if (oldStreakValueEl) oldStreakValueEl.textContent = '';

    const style = document.createElement('style');
    style.textContent = `
      .stats-panel .scorebar{grid-template-columns:1fr!important}
      .side-reset-all{
        width:100%;margin-top:8px;padding:9px 6px;border:1px solid rgba(216,98,104,.38);
        border-radius:9px;background:rgba(216,98,104,.08);color:#e9a0a5;font-size:10px;
        font-weight:800;letter-spacing:.06em;cursor:pointer;
      }
      .side-reset-all:hover{background:rgba(216,98,104,.15);color:#fff}
      @media(max-width:1200px){
        .stats-panel .scorebar{grid-template-columns:repeat(2,1fr)!important}
        .side-reset-all{width:auto;display:block;margin:6px auto 0;padding:7px 14px}
      }
    `;
    document.head.appendChild(style);

    if (!document.getElementById('sideResetAll')) {
      const reset = document.createElement('button');
      reset.id = 'sideResetAll';
      reset.className = 'side-reset-all';
      reset.type = 'button';
      reset.textContent = 'ZERAR TUDO';
      reset.addEventListener('click', resetEverything);
      document.getElementById('sidePanel')?.appendChild(reset);
    }
  }

  function resetEverything() {
    if (!confirm('Zerar fases, ciclos e a partida atual?')) return;
    persistent = { ...defaultPersistent, cycleProgress: [...defaultPersistent.cycleProgress] };
    savePersistent();
    forceCloseModal();
    clearInlineResultArtifacts();
    newGame(true);
  }

  function clearInlineResultArtifacts() {
    document.querySelectorAll('.board-answer-reveal-ui').forEach(el => el.remove());
    document.getElementById('roundResultUi')?.remove();
    keyboardEl?.classList.remove('hidden');
  }

  function saveCurrentGame() {
    if (!game) return;
    persistent.currentGame = {
      version: 1,
      modeIndex: persistent.modeIndex,
      solutions: [...game.solutions],
      guesses: [...game.guesses],
      results: game.results.map(rows => rows.map(row => row ? [...row] : row)),
      solved: [...game.solved],
      solvedAt: [...game.solvedAt],
      finished: Boolean(game.finished),
      completionCounted: Boolean(game.completionCounted),
      input: [...input],
      cursorPos
    };
    savePersistent();
  }

  function restoreCurrentGame() {
    const saved = persistent.currentGame;
    const mode = MODES[persistent.modeIndex] || MODES[0];
    if (!saved || saved.version !== 1 || saved.modeIndex !== persistent.modeIndex) return false;
    if (!Array.isArray(saved.solutions) || saved.solutions.length !== mode.boards) return false;
    if (!Array.isArray(saved.guesses) || saved.guesses.length > mode.attempts) return false;
    if (!Array.isArray(saved.results) || saved.results.length !== mode.boards) return false;
    if (!Array.isArray(saved.solved) || saved.solved.length !== mode.boards) return false;
    if (!Array.isArray(saved.solvedAt) || saved.solvedAt.length !== mode.boards) return false;

    game = {
      mode,
      solutions: [...saved.solutions],
      guesses: [...saved.guesses],
      results: saved.results.map(rows => Array.isArray(rows) ? rows.map(row => row ? [...row] : row) : []),
      solved: [...saved.solved],
      solvedAt: [...saved.solvedAt],
      finished: Boolean(saved.finished),
      completionCounted: Boolean(saved.completionCounted)
    };

    input = Array(5).fill('');
    if (Array.isArray(saved.input)) {
      for (let i = 0; i < 5; i++) {
        const value = String(saved.input[i] || '').toLowerCase();
        if (/^[a-z]$/.test(value)) input[i] = value;
      }
    }
    cursorPos = Number.isInteger(saved.cursorPos) ? Math.max(0, Math.min(4, saved.cursorPos)) : 0;
    locked = game.finished;
    modeTitleEl.textContent = mode.name;
    renderAll();

    if (game.finished) {
      setTimeout(() => showResultModal(game.solved.every(Boolean)), 0);
    }
    return true;
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

  function newGame(force = false) {
    const mode = MODES[persistent.modeIndex] || MODES[0];
    if (force) persistent.currentGame = null;
    game = {
      mode,
      solutions: randomSolutions(mode.boards),
      guesses: [],
      results: Array.from({ length: mode.boards }, () => []),
      solved: Array.from({ length: mode.boards }, () => false),
      solvedAt: Array.from({ length: mode.boards }, () => null),
      finished: false,
      completionCounted: false
    };
    input = Array(5).fill('');
    cursorPos = 0;
    locked = false;
    modeTitleEl.textContent = mode.name;
    renderAll();
    saveCurrentGame();
  }

  function renderAll() {
    updateStatsBar();
    renderSidebar();
    renderBoards();
    renderKeyboard();
  }

  function updateStatsBar() {
    phasesValueEl.textContent = persistent.phasesCompleted.toLocaleString('pt-BR');
    cycleValueEl.textContent = persistent.cycle.toLocaleString('pt-BR');
  }

  function renderSidebar() {
    if (!game) return;
    attemptValueEl.textContent = `${Math.min(game.guesses.length + (game.finished ? 0 : 1), game.mode.attempts)} / ${game.mode.attempts}`;
    boardValueEl.textContent = game.mode.boards === 1 ? '1 palavra' : `${game.mode.boards} palavras`;

    modeItems.forEach((item, index) => {
      item.classList.remove('active', 'done');
      if (persistent.cycleProgress[index]) item.classList.add('done');
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
          if (isCurrentRow && col === cursorPos) tile.classList.add('active');

          if (isCurrentRow) {
            tile.classList.add('editable');
            tile.addEventListener('click', () => {
              if (locked) return;
              cursorPos = col;
              saveCurrentGame();
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
      saveCurrentGame();
      return renderBoards();
    }
    if (key === 'ARROWRIGHT') {
      cursorPos = (cursorPos + 1) % 5;
      saveCurrentGame();
      return renderBoards();
    }
    if (key === 'DELETE') {
      input[cursorPos] = '';
      saveCurrentGame();
      return renderBoards();
    }
    if (key === 'BACKSPACE') {
      if (input[cursorPos]) {
        input[cursorPos] = '';
      } else if (cursorPos > 0) {
        cursorPos--;
        input[cursorPos] = '';
      }
      saveCurrentGame();
      return renderBoards();
    }

    if (/^[A-Z]$/.test(key)) {
      input[cursorPos] = key.toLowerCase();
      cursorPos = input.every(Boolean) ? 4 : (cursorPos + 1) % 5;
      saveCurrentGame();
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
    saveCurrentGame();
    renderBoards();
    renderSidebar();
    animateSubmittedRow(rowIndex);
    renderKeyboard();
    await delay(900);

    if (game.solved.every(Boolean) || game.guesses.length >= game.mode.attempts) {
      finishGame();
    } else {
      locked = false;
      saveCurrentGame();
    }
  }

  function animateSubmittedRow(rowIndex) {
    boardsEl.querySelectorAll(`.row[data-row="${rowIndex}"] .tile`).forEach(tile => {
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

  function finishGame() {
    game.finished = true;
    locked = true;
    const perfect = game.solved.every(Boolean);

    if (!game.completionCounted) {
      game.completionCounted = true;
      persistent.phasesCompleted += 1;
      persistent.cycleProgress[persistent.modeIndex] = true;
      persistent.games = persistent.phasesCompleted;
      persistent.boardsSolved += game.solved.filter(Boolean).length;
      if (perfect) persistent.perfectRounds += 1;

      if (persistent.cycleProgress.every(Boolean)) {
        persistent.cycle += 1;
        persistent.cycleProgress = [false, false, false, false];
      }

      persistent.recentSolutions = [...game.solutions, ...(persistent.recentSolutions || [])].slice(0, 40);
    }

    saveCurrentGame();
    updateStatsBar();
    renderSidebar();
    renderBoards();
    showResultModal(perfect);
  }

  function advanceMode() {
    if (!game?.finished) return;
    persistent.modeIndex = (persistent.modeIndex + 1) % MODES.length;
    persistent.currentGame = null;
    savePersistent();
    forceCloseModal();
    clearInlineResultArtifacts();
    newGame(true);
  }

  function answerLetters(word) {
    return [...word.toUpperCase()].map(letter => `<span>${letter}</span>`).join('');
  }

  function showResultModal(perfect) {
    modalTitleEl.textContent = perfect ? `${game.mode.name} concluído!` : `${game.mode.name} encerrado`;
    const nextMode = MODES[(persistent.modeIndex + 1) % MODES.length];

    const answers = game.solutions.map((solution, index) => {
      const solved = game.solved[index];
      const status = solved ? `Resolvida na ${game.solvedAt[index]}ª tentativa` : 'Essa era a palavra';
      return `
        <div class="answer-card ${solved ? 'solved-answer' : 'missed-answer'}">
          <div class="answer-topline"><small>${status}</small></div>
          <div class="answer-word" aria-label="${solution.toUpperCase()}">${answerLetters(solution)}</div>
        </div>
      `;
    }).join('');

    modalBodyEl.innerHTML = `
      <div class="result-solutions">${answers}</div>
      <div class="result-progress-summary">
        <span>Fases concluídas: <strong>${persistent.phasesCompleted}</strong></span>
        <span>Ciclos completos: <strong>${persistent.cycle}</strong></span>
      </div>
      <button class="primary-btn" id="continueBtn">Jogar ${nextMode.name}</button>
      <button class="secondary-btn" id="shareBtn">Compartilhar resultado</button>
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
    const text = `TERMU ∞ • ${game.mode.name}\n${solved}/${game.mode.boards} • ${game.guesses.length}/${game.mode.attempts}\nFases: ${persistent.phasesCompleted} • Ciclos: ${persistent.cycle}\n\n${modeEmoji}`;

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
      <p><strong>Ciclo:</strong> complete TERMO, DUPLO, TRIPLO e QUARTETO. Só então 1 ciclo é contado.</p>
      <p>Sua fase atual, tentativas, palavras e letras digitadas ficam salvas neste navegador.</p>
    `;
    openModal();
  }

  function showStats() {
    modalTitleEl.textContent = 'Progresso';
    modalBodyEl.innerHTML = `
      <div class="stats-grid">
        <div class="stat"><strong>${persistent.phasesCompleted}</strong><span>fases concluídas</span></div>
        <div class="stat"><strong>${persistent.cycle}</strong><span>ciclos completos</span></div>
      </div>
      <button class="secondary-btn danger-btn" id="resetBtn">Zerar tudo</button>
    `;
    openModal();
    document.getElementById('resetBtn').addEventListener('click', resetEverything);
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
  window.addEventListener('pagehide', saveCurrentGame);

  if (solutionPool.length < 50) console.warn('Poucas palavras carregadas:', solutionPool.length);
  if (!restoreCurrentGame()) newGame(true);
})();
