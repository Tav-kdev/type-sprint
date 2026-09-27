(() => {
  'use strict';

  // ===== Lesson data (16 levels across 3 tiers) =====
  const LEVELS = [
    // Tier 1: Home Row Foundation
    { id: 1, tier: 1, title: 'F J Only', desc: 'Index fingers, anchor keys — find them by touch.', type: 'drill', pool: 'fj' },
    { id: 2, tier: 1, title: 'D K Added', desc: 'f j d k', type: 'drill', pool: 'fjdk' },
    { id: 3, tier: 1, title: 'S L Added', desc: 'f j d k s l', type: 'drill', pool: 'fjdksl' },
    { id: 4, tier: 1, title: 'Full Home Row', desc: 'a s d f j k l ;', type: 'drill', pool: 'asdfjkl;' },
    { id: 5, tier: 1, title: 'Home Row Words', desc: 'Home row words only', type: 'words', words: [
      'dad', 'add', 'all', 'ask', 'sad', 'lad', 'fall', 'falls', 'flask', 'salad', 'alas', 'salsa', 'lass', 'a lass'
    ] },
    { id: 6, tier: 1, title: 'Home Row Sentences', desc: 'Home row sentences', type: 'sentences', sentences: [
      'a sad lad; a glass falls',
      'a lad asks a sad dad',
      'salad falls; add a flask'
    ] },

    // Tier 2: Top Row
    { id: 7, tier: 2, title: 'Left Hand Top Row', desc: 'q w e r t', type: 'drill', pool: 'qwert' },
    { id: 8, tier: 2, title: 'Right Hand Top Row', desc: 'y u i o p', type: 'drill', pool: 'yuiop' },
    { id: 9, tier: 2, title: 'Top + Home Combined', desc: 'Combined top + home row drills', type: 'drill', pool: 'asdfjkl;qwertyuiop' },
    { id: 10, tier: 2, title: 'Top + Home Words', desc: 'Real words mixing top + home', type: 'words', words: [
      'water', 'quiet', 'perfect', 'treaty', 'quote', 'tower', 'write', 'wear', 'request',
      'operate', 'quarter', 'waiter', 'worry', 'tray'
    ] },
    { id: 11, tier: 2, title: 'Top + Home Sentences', desc: 'Sentences mixing top + home row', type: 'sentences', sentences: [
      'water quietly powers the tower',
      'we request a treaty to operate the quarter',
      'the quiet waiter wrote a proper request'
    ] },

    // Tier 3: Bottom Row
    { id: 12, tier: 3, title: 'Left Hand Bottom Row', desc: 'z x c v b', type: 'drill', pool: 'zxcvb' },
    { id: 13, tier: 3, title: 'Right Hand Bottom Row', desc: 'n m , . /', type: 'drill', pool: 'nm,./' },
    { id: 14, tier: 3, title: 'Bottom + Home Combined', desc: 'Combined bottom + home row drills', type: 'drill', pool: 'asdfjkl;zxcvbnm,./' },
    { id: 15, tier: 3, title: 'All Three Rows Words', desc: 'Words using all three rows', type: 'words', words: [
      'zoo', 'mix', 'brave', 'nimble', 'exam', 'crazy', 'dozen', 'voice', 'mercy',
      'zombie', 'bronze', 'vintage', 'maze', 'mixer', 'vanish'
    ] },
    { id: 16, tier: 3, title: 'Full Sentences', desc: 'Full sentences, all letters, lowercase only', type: 'sentences', sentences: [
      'the quick brown fox jumps over the lazy dog',
      'she sells seashells down by the sunny shore',
      'practice makes progress, not just perfect typing',
      'a journey of a thousand miles begins with a single step',
      'pack my box with five dozen liquor jugs'
    ] }
  ];

  // ===== General typing pools =====
  const GENERAL_LETTERS = {
    allLetters: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789'
  };

  const GENERAL_WORDS = [
    'space', 'orbit', 'galaxy', 'nebula', 'comet', 'planet', 'stellar', 'cosmic',
    'rocket', 'lunar', 'solar', 'asteroid', 'meteor', 'void', 'pulse', 'signal',
    'quantum', 'photon', 'plasma', 'thrust', 'vector', 'module', 'station', 'probe',
    'launch', 'voyage', 'system', 'engine', 'radar', 'beacon', 'warp', 'fleet',
    'crew', 'dock', 'hull', 'shield', 'laser', 'nova', 'quasar', 'pulsar',
    'gravity', 'fusion', 'reactor', 'capsule', 'mission', 'command', 'relay', 'scan',
    'drift', 'boost', 'ignite', 'navigate', 'deploy', 'transmit', 'receive', 'align',
    'calibrate', 'trajectory', 'velocity', 'altitude', 'horizon', 'eclipse', 'orbiting',
    'satellite', 'telescope', 'astronaut', 'spaceship', 'starship', 'hyperspace', 'wormhole'
  ];

  // ===== State =====
  let mode = 'lessons'; // 'lessons' | 'general'
  let currentLevelId = 1;
  let generalType = 'words';
  let duration = 30;
  let targetText = '';
  let typed = '';
  let started = false;
  let finished = false;
  let startTime = 0;
  let timerId = null;
  let timeLeft = 30;
  let correctCount = 0;
  let incorrectCount = 0;
  let extraCount = 0;

  // ===== DOM =====
  const textDisplay = document.getElementById('textDisplay');
  const hiddenInput = document.getElementById('hiddenInput');
  const timeLeftEl = document.getElementById('timeLeft');
  const liveWpmEl = document.getElementById('liveWpm');
  const liveAccEl = document.getElementById('liveAcc');
  const restartBtn = document.getElementById('restartBtn');
  const resultsOverlay = document.getElementById('resultsOverlay');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const resultWpm = document.getElementById('resultWpm');
  const resultAcc = document.getElementById('resultAcc');
  const resultRaw = document.getElementById('resultRaw');
  const resultChars = document.getElementById('resultChars');
  const levelBtns = document.querySelectorAll('.level-btn');
  const generalBtns = document.querySelectorAll('.general-btn');
  const durationBtns = document.querySelectorAll('.duration-btn');
  const modeTabs = document.querySelectorAll('.mode-tab');
  const lessonsPanel = document.getElementById('lessonsPanel');
  const generalPanel = document.getElementById('generalPanel');
  const lessonInfo = document.getElementById('lessonInfo');
  const lessonTitle = document.getElementById('lessonTitle');
  const lessonDesc = document.getElementById('lessonDesc');

  // ===== Helpers =====
  function randChar(pool) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randomPseudoWord(pool) {
    const length = 2 + Math.floor(Math.random() * 4);
    let word = '';
    for (let i = 0; i < length; i++) word += randChar(pool);
    return word;
  }

  function currentLevel() {
    return LEVELS.find((l) => l.id === currentLevelId) || LEVELS[0];
  }

  function textLengthTarget() {
    return duration >= 60 ? 280 : duration >= 30 ? 160 : 90;
  }

  function buildFromItems(itemFn, targetLen) {
    let text = '';
    while (text.length < targetLen) {
      text += (text ? ' ' : '') + itemFn();
    }
    return text;
  }

  function generateText() {
    const targetLen = textLengthTarget();

    if (mode === 'general') {
      if (generalType === 'words') {
        return buildFromItems(() => randomFrom(GENERAL_WORDS), targetLen);
      }
      const pool = GENERAL_LETTERS[generalType] || GENERAL_LETTERS.allLetters;
      return buildFromItems(() => randomPseudoWord(pool), targetLen);
    }

    const level = currentLevel();
    if (level.type === 'words') {
      return buildFromItems(() => randomFrom(level.words), targetLen);
    }
    if (level.type === 'sentences') {
      return buildFromItems(() => randomFrom(level.sentences), targetLen);
    }
    return buildFromItems(() => randomPseudoWord(level.pool), targetLen);
  }

  function updateLessonInfo() {
    if (mode !== 'lessons') {
      lessonInfo.hidden = true;
      return;
    }
    lessonInfo.hidden = false;
    const level = currentLevel();
    lessonTitle.textContent = `Level ${level.id} · ${level.title}`;
    lessonDesc.textContent = level.desc;
  }

  function renderText() {
    const target = targetText;
    const typedLen = typed.length;
    let html = '';

    for (let i = 0; i < target.length; i++) {
      const ch = target[i];
      const isSpace = ch === ' ';
      let cls = 'char pending';

      if (i < typedLen) {
        cls = typed[i] === ch ? 'char correct' : 'char incorrect';
      } else if (i === typedLen) {
        cls = 'char current';
      }

      if (isSpace) {
        html += `<span class="${cls} space-char">${i < typedLen && typed[i] !== ' ' ? typed[i] : ' '}</span>`;
      } else {
        const display = i < typedLen && typed[i] !== ch ? typed[i] : ch;
        html += `<span class="${cls}">${escapeHtml(display)}</span>`;
      }
    }

    if (typedLen > target.length) {
      for (let i = target.length; i < typedLen; i++) {
        html += `<span class="char extra">${escapeHtml(typed[i])}</span>`;
      }
    }

    textDisplay.innerHTML = html;

    const currentEl = textDisplay.querySelector('.char.current');
    if (currentEl) {
      currentEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function countStats() {
    correctCount = 0;
    incorrectCount = 0;
    extraCount = 0;
    const len = Math.min(typed.length, targetText.length);
    for (let i = 0; i < len; i++) {
      if (typed[i] === targetText[i]) correctCount++;
      else incorrectCount++;
    }
    if (typed.length > targetText.length) {
      extraCount = typed.length - targetText.length;
    }
  }

  function calcWpm(elapsedMs) {
    const minutes = elapsedMs / 60000;
    if (minutes <= 0) return 0;
    return Math.round((correctCount / 5) / minutes);
  }

  function calcRawWpm(elapsedMs) {
    const minutes = elapsedMs / 60000;
    if (minutes <= 0) return 0;
    return Math.round((typed.length / 5) / minutes);
  }

  function calcAccuracy() {
    const total = correctCount + incorrectCount + extraCount;
    if (total === 0) return 100;
    return Math.round((correctCount / total) * 100);
  }

  function updateLiveStats() {
    if (!started) {
      liveWpmEl.textContent = '0';
      liveAccEl.textContent = '100%';
      return;
    }
    const elapsed = Date.now() - startTime;
    countStats();
    liveWpmEl.textContent = String(calcWpm(elapsed));
    liveAccEl.textContent = calcAccuracy() + '%';
  }

  function tick() {
    if (finished) return;
    const elapsed = (Date.now() - startTime) / 1000;
    timeLeft = Math.max(0, Math.ceil(duration - elapsed));
    timeLeftEl.textContent = String(timeLeft);
    updateLiveStats();

    if (timeLeft <= 0) {
      finish();
    }
  }

  function start() {
    if (started || finished) return;
    started = true;
    startTime = Date.now();
    timeLeft = duration;
    timerId = setInterval(tick, 200);
  }

  function finish() {
    if (finished) return;
    finished = true;
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    timeLeftEl.textContent = '0';
    countStats();
    const elapsed = Math.min(Date.now() - startTime, duration * 1000);
    const wpm = calcWpm(elapsed);
    const raw = calcRawWpm(elapsed);
    const acc = calcAccuracy();

    resultWpm.textContent = String(wpm);
    resultAcc.textContent = acc + '%';
    resultRaw.textContent = String(raw);
    resultChars.textContent = `${correctCount}/${incorrectCount}/${extraCount}`;

    resultsOverlay.hidden = false;
    requestAnimationFrame(() => {
      resultsOverlay.classList.add('visible');
    });
  }

  function reset() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    started = false;
    finished = false;
    typed = '';
    startTime = 0;
    timeLeft = duration;
    correctCount = 0;
    incorrectCount = 0;
    extraCount = 0;

    targetText = generateText();
    timeLeftEl.textContent = String(duration);
    liveWpmEl.textContent = '0';
    liveAccEl.textContent = '100%';

    updateLessonInfo();

    resultsOverlay.classList.remove('visible');
    setTimeout(() => {
      resultsOverlay.hidden = true;
    }, 300);

    renderText();
    hiddenInput.value = '';
    textDisplay.classList.remove('focused');
  }

  // ===== Input handling =====
  function handleInput() {
    if (finished) return;
    const value = hiddenInput.value;
    if (!started && value.length > 0) start();

    if (value.length > targetText.length + 20) {
      hiddenInput.value = typed;
      return;
    }

    typed = value;
    renderText();
    updateLiveStats();

    if (typed.length >= targetText.length && typed === targetText) {
      finish();
    }
  }

  function focusInput() {
    hiddenInput.focus();
    textDisplay.classList.add('focused');
  }

  // ===== Events =====
  textDisplay.addEventListener('click', focusInput);
  textDisplay.addEventListener('focus', focusInput);

  hiddenInput.addEventListener('input', handleInput);

  hiddenInput.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      reset();
      focusInput();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      reset();
      focusInput();
    }
    if (!finished && document.activeElement !== hiddenInput) {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        focusInput();
      }
    }
  });

  restartBtn.addEventListener('click', () => {
    reset();
    focusInput();
  });

  playAgainBtn.addEventListener('click', () => {
    reset();
    focusInput();
  });

  levelBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      levelBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentLevelId = parseInt(btn.dataset.level, 10);
      reset();
    });
  });

  generalBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      generalBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      generalType = btn.dataset.general;
      reset();
    });
  });

  modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      modeTabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      mode = tab.dataset.mode;
      lessonsPanel.hidden = mode !== 'lessons';
      generalPanel.hidden = mode !== 'general';
      reset();
    });
  });

  durationBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      durationBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      duration = parseInt(btn.dataset.time, 10);
      reset();
    });
  });

  hiddenInput.addEventListener('blur', () => {
    textDisplay.classList.remove('focused');
  });

  // ===== Interactive Rocket =====
  const rocket = document.getElementById('rocket');
  if (rocket) {
    let boosting = false;
    rocket.addEventListener('click', (e) => {
      e.stopPropagation();
      if (boosting) return;
      boosting = true;
      rocket.classList.add('boost');
      for (let i = 0; i < 8; i++) {
        const spark = document.createElement('span');
        spark.className = 'spark';
        const rect = rocket.getBoundingClientRect();
        spark.style.cssText = `
          position:fixed;left:${rect.left + rect.width / 2}px;top:${rect.bottom}px;
          width:4px;height:4px;border-radius:50%;background:#5eead4;
          pointer-events:none;z-index:5;
          box-shadow:0 0 6px #5eead4;
          animation:sparkFly 0.7s ease-out forwards;
          --dx:${(Math.random() - 0.5) * 80}px;
          --dy:${40 + Math.random() * 60}px;
        `;
        document.body.appendChild(spark);
        setTimeout(() => spark.remove(), 700);
      }
      setTimeout(() => {
        rocket.classList.remove('boost');
        rocket.style.opacity = '0';
        setTimeout(() => {
          rocket.style.transition = 'none';
          rocket.style.transform = '';
          rocket.style.opacity = '1';
          requestAnimationFrame(() => {
            rocket.style.transition = '';
            boosting = false;
          });
        }, 50);
      }, 1200);
    });
  }

  if (!document.getElementById('spark-style')) {
    const style = document.createElement('style');
    style.id = 'spark-style';
    style.textContent = `
      @keyframes sparkFly {
        0% { transform: translate(0,0) scale(1); opacity:1; }
        100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity:0; }
      }
    `;
    document.head.appendChild(style);
  }

  // ===== Init =====
  reset();
})();
