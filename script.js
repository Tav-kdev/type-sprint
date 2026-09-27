(() => {
  'use strict';

  // ===== Content pools =====
  const LETTERS = {
    homeRow: 'asdfghjkl',
    topRow: 'qwertyuiop',
    bottomRow: 'zxcvbnm',
    allLetters: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789'
  };

  const WORDS = [
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
  let level = 'homeRow';
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
  const durationBtns = document.querySelectorAll('.duration-btn');

  // ===== Helpers =====
  function randChar(pool) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function generateLetters(count) {
    const pool = LETTERS[level] || LETTERS.homeRow;
    const chars = [];
    for (let i = 0; i < count; i++) {
      chars.push(randChar(pool));
      if ((i + 1) % 5 === 0 && i < count - 1) chars.push(' ');
    }
    return chars.join('');
  }

  function generateWords(count) {
    const out = [];
    for (let i = 0; i < count; i++) {
      out.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
    }
    return out.join(' ');
  }

  function generateText() {
    if (level === 'words') {
      return generateWords(duration >= 60 ? 80 : duration >= 30 ? 50 : 30);
    }
    const charCount = duration >= 60 ? 280 : duration >= 30 ? 160 : 90;
    return generateLetters(charCount);
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
        if (typed[i] === ch) {
          cls = 'char correct';
        } else {
          cls = 'char incorrect';
        }
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
      level = btn.dataset.level;
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

  // ===== Init =====
  reset();
})();
