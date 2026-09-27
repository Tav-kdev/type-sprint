const WORDS = [
  "the","be","to","of","and","a","in","that","have","it","for","not","on","with","he",
  "as","you","do","at","this","but","his","by","from","they","we","say","her","she","or",
  "an","will","my","one","all","would","there","their","what","so","up","out","if","about",
  "who","get","which","go","me","when","make","can","like","time","no","just","him","know",
  "take","people","into","year","your","good","some","could","them","see","other","than",
  "then","now","look","only","come","its","over","think","also","back","after","use","two",
  "how","our","work","first","well","way","even","new","want","because","any","these","give",
  "day","most","us","world","life","hand","part","child","eye","woman","place","water","room",
  "area","money","story","fact","month","lot","right","study","book","word","business","issue",
  "side","kind","head","house","service","friend","father","power","hour","game","line","end",
  "member","law","car","city","community","name","president","team","minute","idea","body",
  "information","back","parent","face","others","level","office","door","health","person","art"
];

function generateWords(count) {
  const words = [];
  for (let i = 0; i < count; i++) {
    words.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }
  return words;
}

const textDisplay = document.getElementById("textDisplay");
const hiddenInput = document.getElementById("hiddenInput");
const timeLeftEl = document.getElementById("timeLeft");
const liveWpmEl = document.getElementById("liveWpm");
const liveAccEl = document.getElementById("liveAcc");
const restartBtn = document.getElementById("restartBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const resultsOverlay = document.getElementById("resultsOverlay");
const durationBtns = document.querySelectorAll(".duration-btn");

let duration = 30;
let timeLeft = duration;
let timerId = null;
let started = false;
let finished = false;

let words = [];
let wordSpans = [];
let typed = [];
let wordIndex = 0;

let correctChars = 0;
let incorrectChars = 0;
let extraChars = 0;
let totalKeystrokes = 0;

function buildWords() {
  words = generateWords(200);
  typed = words.map(() => "");
  wordIndex = 0;
  textDisplay.innerHTML = "";
  wordSpans = [];

  words.forEach((word, wi) => {
    const wordEl = document.createElement("span");
    wordEl.className = "word";
    wordEl.dataset.index = wi;
    [...word].forEach((ch) => {
      const charEl = document.createElement("span");
      charEl.className = "char";
      charEl.textContent = ch;
      wordEl.appendChild(charEl);
    });
    textDisplay.appendChild(wordEl);
    textDisplay.appendChild(document.createTextNode(" "));
    wordSpans.push(wordEl);
  });

  markCurrent();
}

function markCurrent() {
  document.querySelectorAll(".char.current").forEach((el) => el.classList.remove("current"));
  const currentWordEl = wordSpans[wordIndex];
  if (!currentWordEl) return;
  const pos = typed[wordIndex].length;
  const chars = currentWordEl.querySelectorAll(".char");
  if (chars[pos]) {
    chars[pos].classList.add("current");
  } else if (chars.length > 0) {
    chars[chars.length - 1].classList.add("current");
  }
  currentWordEl.scrollIntoView({ block: "nearest" });
}

function renderWord(wi) {
  const wordEl = wordSpans[wi];
  const word = words[wi];
  const input = typed[wi];
  const chars = Array.from(wordEl.querySelectorAll(".char"));

  chars.forEach((charEl, i) => {
    charEl.classList.remove("correct", "incorrect", "current", "extra");
    if (i < input.length) {
      charEl.classList.add(input[i] === word[i] ? "correct" : "incorrect");
    }
  });

  const existingExtra = wordEl.querySelectorAll(".char.extra-added");
  existingExtra.forEach((el) => el.remove());

  if (input.length > word.length) {
    for (let i = word.length; i < input.length; i++) {
      const extraEl = document.createElement("span");
      extraEl.className = "char extra extra-added";
      extraEl.textContent = input[i];
      wordEl.appendChild(extraEl);
    }
  }
}

function startTimer() {
  if (started) return;
  started = true;
  timerId = setInterval(() => {
    timeLeft--;
    timeLeftEl.textContent = timeLeft;
    updateLiveStats();
    if (timeLeft <= 0) {
      finish();
    }
  }, 1000);
}

function updateLiveStats() {
  const elapsedMinutes = (duration - timeLeft) / 60;
  const wpm = elapsedMinutes > 0 ? Math.round((correctChars / 5) / elapsedMinutes) : 0;
  liveWpmEl.textContent = wpm > 0 ? wpm : 0;

  const totalTyped = correctChars + incorrectChars;
  const acc = totalTyped > 0 ? Math.round((correctChars / totalTyped) * 100) : 100;
  liveAccEl.textContent = acc + "%";
}

function finish() {
  finished = true;
  clearInterval(timerId);
  hiddenInput.blur();

  const elapsedMinutes = duration / 60;
  const rawWpm = Math.round((totalKeystrokes / 5) / elapsedMinutes);
  const wpm = Math.round((correctChars / 5) / elapsedMinutes);
  const totalTyped = correctChars + incorrectChars;
  const acc = totalTyped > 0 ? Math.round((correctChars / totalTyped) * 100) : 100;

  document.getElementById("resultWpm").textContent = wpm > 0 ? wpm : 0;
  document.getElementById("resultAcc").textContent = acc + "%";
  document.getElementById("resultRaw").textContent = rawWpm > 0 ? rawWpm : 0;
  document.getElementById("resultChars").textContent = `${correctChars}/${incorrectChars}/${extraChars}`;

  resultsOverlay.classList.add("visible");
}

function reset() {
  clearInterval(timerId);
  started = false;
  finished = false;
  timeLeft = duration;
  timeLeftEl.textContent = timeLeft;
  liveWpmEl.textContent = "0";
  liveAccEl.textContent = "100%";
  correctChars = 0;
  incorrectChars = 0;
  extraChars = 0;
  totalKeystrokes = 0;
  resultsOverlay.classList.remove("visible");
  buildWords();
  hiddenInput.value = "";
  hiddenInput.focus();
}

hiddenInput.addEventListener("keydown", (e) => {
  if (finished) return;

  if (e.key === "Tab") {
    e.preventDefault();
    reset();
    return;
  }

  if (e.key === " ") {
    e.preventDefault();
    if (typed[wordIndex].length === 0) return;
    if (!started) startTimer();

    const word = words[wordIndex];
    const input = typed[wordIndex];
    for (let i = 0; i < Math.max(word.length, input.length); i++) {
      if (i >= input.length) {
        incorrectChars++;
      } else if (i >= word.length) {
        extraChars++;
      } else if (input[i] === word[i]) {
        correctChars++;
      } else {
        incorrectChars++;
      }
    }
    wordSpans[wordIndex].classList.add("done");
    wordIndex++;
    if (wordIndex >= words.length) {
      words.push(...generateWords(100));
      typed.push(...words.slice(typed.length).map(() => ""));
      const start = wordSpans.length;
      words.slice(start).forEach((word, i) => {
        const wi = start + i;
        const wordEl = document.createElement("span");
        wordEl.className = "word";
        wordEl.dataset.index = wi;
        [...word].forEach((ch) => {
          const charEl = document.createElement("span");
          charEl.className = "char";
          charEl.textContent = ch;
          wordEl.appendChild(charEl);
        });
        textDisplay.appendChild(wordEl);
        textDisplay.appendChild(document.createTextNode(" "));
        wordSpans.push(wordEl);
      });
    }
    markCurrent();
    updateLiveStats();
    return;
  }

  if (e.key === "Backspace") {
    e.preventDefault();
    if (typed[wordIndex].length > 0) {
      typed[wordIndex] = typed[wordIndex].slice(0, -1);
      renderWord(wordIndex);
      markCurrent();
    } else if (wordIndex > 0) {
      wordIndex--;
      wordSpans[wordIndex].classList.remove("done");
      markCurrent();
    }
    return;
  }

  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    if (!started) startTimer();
    typed[wordIndex] += e.key;
    totalKeystrokes++;
    renderWord(wordIndex);
    markCurrent();
    updateLiveStats();
  }
});

textDisplay.addEventListener("click", () => hiddenInput.focus());
restartBtn.addEventListener("click", reset);
playAgainBtn.addEventListener("click", reset);

durationBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    durationBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    duration = parseInt(btn.dataset.time, 10);
    reset();
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    reset();
  } else if (document.activeElement !== hiddenInput && !resultsOverlay.classList.contains("visible")) {
    hiddenInput.focus();
  }
});

buildWords();
timeLeftEl.textContent = timeLeft;
hiddenInput.focus();
