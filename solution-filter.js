(() => {
  'use strict';

  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/gi, 'c')
    .toLowerCase();

  const names = window.TERMO_BANNED_NAMES instanceof Set
    ? window.TERMO_BANNED_NAMES
    : new Set();

  // Respostas que até podem existir, mas não combinam com o catálogo comum do jogo.
  const bannedAnswers = new Set(['porno']);

  // Palavras gramaticais/referenciais que continuam válidas como PALPITE,
  // mas não devem ser sorteadas como resposta do jogo.
  const grammaticalAnswers = new Set(`
    estes estas esses essas
    deste desta desse dessa
    neste nesta nesse nessa
    disso disto nisso nisto
  `.trim().split(/\s+/).map(normalize));

  // O jogo pode aceitar flexões como PALPITE, mas não deve sorteá-las como resposta.
  // Para verbos, a resposta preferida é a forma direta no infinitivo:
  // falar, pegar, nadar, comer, partir, poder etc.
  const conjugatedVerbAnswers = new Set(`
    estou vamos tenho disse quero posso estão temos tinha sabia seria venha tenha podem
    fique foram somos fosse achei deixe teria gosta havia houve devia sendo podia possa
    vindo faria falou sabem pegue sente ouviu pensa dizem vendo falei volte pegou passou
    levou farei tiver fomos dando mudou penso senti ligue tendo saiba puder fazia adoro
    serão parem trouxe entra trata tirou ficam dizia saiam viram sejam vemos fizer matei
    olhem vejam amava ponha ganha manda bateu tomou odeia farei terem manda serve mande
    venho falam jogou comeu virou sinta viveu notei pagou criou levei adoro perde tento
    sabia viria parei desça podes andou traiu iriam abram menti levam envie dance segui
    vinda andem comem pinto ajudo casei meteu nasceu criou atira sumiu durmo chego pegam
    tomem vence valem jogam beija sirva envia viaja feriu temia lutei pariu verem ponho
    dando vindo sendo tendo lendo rindo pondo vendo iria serao terao farao darao dirao
    virao serei terei darei direi verei puder tiver fizer puser forem fossem foram houve
    havia sejam tenha venha saiba possa facam digam oucam vejam olhem tragam
    ponha cubra finja sirva caiba valha saia saiam virem tirem parem falem levem subam
    corra morra durma minta grite chore cuide trate mande avise acabe perca pague prove
    andei mudei tirei tomei levei criei vendi errei notei lutei casei segui nasci perdi
    senti ouviu abriu subiu fugiu feriu bebeu viveu comeu bateu levou ligou matou tomou
    falou pegou ficou achou parou mudou criou pagou jogou virou casou tocou sacou notou
    pulou puxou armou durou errou jurou caiu saiu farão serão terão virão dirão darão
    sairá trará farei serei terei direi darei verei teria seria faria daria diria viria
    veria iria iriam íamos fomos eram

    soube coube valeu
    morre corre dorme nasce segue serve
    venho tenho posso quero dizem fazem devem sabem podem
    gosto penso tento cuido mando chamo adoro odeio
    custa resta basta passa volta chega falta sobra
    vende perde ganha chama trata torna fecha corta
    beija chora grita tenta sofre enche exige atrai
    finge desce sobe
  `.trim().split(/\s+/).map(normalize));

  // Algumas palavras terminam como gerúndio sem serem verbos conjugados.
  const gerundLookalikes = new Set([
    'bando', // substantivo
    'lindo', // adjetivo
    'findo'  // adjetivo/substantivado
  ]);

  const looksLikeConjugatedVerb = (raw) => {
    const word = normalize(raw);

    // Subjuntivos irregulares terminados em -er que parecem infinitivo.
    // Ex.: PODER é permitido; PUDER não.
    if (['puder', 'tiver', 'fizer', 'puser'].includes(word)) return true;

    if (conjugatedVerbAnswers.has(word)) return true;

    // Gerúndios de cinco letras: dando, tendo, vendo, sendo, lendo, vindo, rindo...
    if (!gerundLookalikes.has(word)) {
      if (word.endsWith('ando') || word.endsWith('endo')) return true;
      if (word.endsWith('indo')) return true;
    }

    // Condicional/futuro do pretérito: faria, teria, seria, daria, diria, viria...
    if (/^(?:.|..)(?:aria|eria|iria)$/.test(word)) return true;

    // Formas plurais como IRIAM, ODIAM, ADIAM, GUIAM etc.
    if (word.endsWith('iam')) return true;

    // Formas regulares muito evidentes quando o infinitivo de 5 letras também está
    // no catálogo: FALOU -> FALAR, PEGOU -> PEGAR, FALEM -> FALAR, DEVEM -> DEVER.
    const solutionWords = Array.isArray(window.TERMO_WORDS) ? window.TERMO_WORDS : [];
    const normalizedSolutions = looksLikeConjugatedVerb._solutions ||
      (looksLikeConjugatedVerb._solutions = new Set(solutionWords.map(normalize)));

    const hasInfinitive = (stem, endings) => endings.some(ending => normalizedSolutions.has(stem + ending));

    if (word.endsWith('ou') && hasInfinitive(word.slice(0, -2), ['ar'])) return true;
    if (word.endsWith('ei') && hasInfinitive(word.slice(0, -2), ['ar'])) return true;
    if (word.endsWith('am') && hasInfinitive(word.slice(0, -2), ['ar', 'er', 'ir'])) return true;
    if (word.endsWith('em') && hasInfinitive(word.slice(0, -2), ['ar', 'er', 'ir'])) return true;

    return false;
  };

  const isAllowedSolution = (raw) => {
    const word = normalize(raw);
    return word.length === 5 &&
      !names.has(word) &&
      !bannedAnswers.has(word) &&
      !grammaticalAnswers.has(word) &&
      !looksLikeConjugatedVerb(word);
  };

  if (Array.isArray(window.TERMO_WORDS)) {
    delete looksLikeConjugatedVerb._solutions;
    window.TERMO_WORDS = window.TERMO_WORDS.filter(isAllowedSolution);
  }

  // Limpa partidas antigas que tenham recebido uma resposta que agora é proibida.
  // Se a fase já acabou, mantém o progresso e apenas aponta para a próxima fase.
  try {
    const key = 'termo-infinito-v1';
    const saved = JSON.parse(localStorage.getItem(key));
    const currentGame = saved?.currentGame;
    const solutions = currentGame?.solutions;

    if (Array.isArray(solutions) && solutions.some(word => !isAllowedSolution(word))) {
      if (currentGame?.finished) {
        const currentMode = Number.isInteger(saved.modeIndex) ? saved.modeIndex : 0;
        saved.modeIndex = (currentMode + 1) % 4;
      }
      saved.currentGame = null;
      localStorage.setItem(key, JSON.stringify(saved));
    }
  } catch { }
})();
