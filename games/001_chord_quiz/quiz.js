let quiz = [];
let index = 0;
let instant = true; // 即時採点ON/OFF
const audio = document.getElementById('audio');
let answers = [];
let answered = false;
let currentSelection = null;
let currentLevel = 1;
let waitingForNext = false; // Non-instant mode state

// Reset history on load to prevent accumulation
localStorage.removeItem('lastAnswers');

const colorMap = Site.colorMap;
const noteMap = Site.noteMap;

async function loadQuiz(level) {
  currentLevel = level;
  quiz = await Site.generateQuiz(level, Site.QUESTION_COUNT);
  answers = [];
  const sounds = await Site.getSoundsForLevel(level);
  renderChoiceButtons(sounds || [], level);
  playQuestion();
}

function playQuestion() {
  // CRITICAL: Guard against re-entry while transitioning
  if (index >= quiz.length) {
    localStorage.setItem('lastAnswers', JSON.stringify(answers));
    const score = answers.filter(a => a.correct).length;
    localStorage.setItem('score', String(score));
    window.location.href = "result.html";
    return;
  }

  // Reset state for new question
  answered = false;
  waitingForNext = false; // Reset waiting state

  const note = quiz[index];
  audio.src = `../../static/sounds/${note}`;
  audio.pause();
  audio.currentTime = 0;
  document.getElementById('buttons').classList.add('opacity-0');
  document.getElementById('nextBtn').disabled = true;
  document.getElementById('status').textContent = `さいせいちゅう...`;
  document.getElementById('questionCounter').textContent = `${index + 1} / ${Site.QUESTION_COUNT}`;
  // Ensure Next button text is reset
  document.getElementById('nextBtn').textContent = 'これでけってい';

  // Reset button styles and DISABLE immediately
  setChoiceButtonsDisabled(true);
  Array.from(document.getElementById('buttons').querySelectorAll('button')).forEach(b => {
    b.style.boxShadow = 'none';
    b.classList.remove('bg-green-200', 'bg-red-200'); // Remove old classes if any remained
  });

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      document.getElementById('startOverlay').classList.add('hidden');
      setTimeout(() => {
        // Only enable if we haven't already answered (shouldn't happen, but defensive)
        if (!answered) {
          document.getElementById('buttons').classList.remove('opacity-0');
          document.getElementById('status').textContent = `おとをきいたらボタンをおしてね`;
          setChoiceButtonsDisabled(false);
        }
      }, 2000);
    }).catch(error => {
      console.log("Autoplay prevented:", error);
      document.getElementById('startOverlay').classList.remove('hidden');
    });
  }
}

function renderChoiceButtons(sounds, level) {
  const container = document.getElementById('buttons');
  container.innerHTML = '';
  const colors = sounds.map(f => {
    const parts = f.split('_');
    return parts.length > 1 ? parts[1].split('.')[0] : f;
  });
  // map color -> representative filename (first occurrence)
  const colorToFile = {};
  sounds.forEach(f => { const parts = f.split('_'); const raw = parts.length > 1 ? parts[1].split('.')[0] : f; if (!colorToFile[raw]) colorToFile[raw] = f; });
  // allow number of choices equal to number of sound files for the level
  const unique = Array.from(new Set(colors)).slice(0, Math.max(6, sounds.length));
  unique.forEach((raw) => {
    // Find representative file for this color
    const soundFile = colorToFile[raw];
    if (!soundFile) return;

    const btn = Site.createChordButton(soundFile, {
      disabled: true,
      onPointerDown: (e) => {
        e.preventDefault(); e.stopPropagation();
        if (instant) {
          answer(raw);
        } else {
          currentSelection = raw;
          Array.from(container.querySelectorAll('button')).forEach(b => {
            b.style.outline = (b.dataset.label === raw) ? '3px solid rgba(0,0,0,0.4)' : 'none';
          });
          document.getElementById('status').textContent = `あなたの　えらんだおと: ${Site.colorMap[raw] || raw}`;
          document.getElementById('nextBtn').disabled = false;
          document.getElementById('nextBtn').classList.remove('opacity-50');
        }
      }
    });

    container.appendChild(btn);
  });
}

// Helper to extract key (color name) from filename
function getKeyFromFile(file) {
  if (!file) return '';
  const parts = file.split('_');
  return parts.length > 1 ? parts[1].split('.')[0] : file;
}

function answer(ans) {
  // CRITICAL: Set answered flag FIRST to prevent race conditions from rapid clicking
  if (answered) return;
  answered = true;

  // Immediately disable all buttons to prevent any further clicks
  setChoiceButtonsDisabled(true);

  const file = quiz[index];
  const correctKey = getKeyFromFile(file);
  const correct = (correctKey === ans);

  answers.push({ choice: ans, correct: correct, file: file });
  const statusEl = document.getElementById('status');

  // Highlighting logic
  const container = document.getElementById('buttons');
  Array.from(container.querySelectorAll('button')).forEach(b => {
    // Remove existing outlines
    b.style.outline = 'none';

    const bRaw = b.dataset.label;
    const bIsCorrect = (bRaw === correctKey);
    const bIsSelected = (bRaw === ans);

    if (bIsCorrect) {
      // Correct answer: Green shadow
      b.style.boxShadow = '0 0 15px 5px rgba(74, 222, 128, 0.9)'; // Green-400
      b.style.opacity = '1';
    }
    if (!correct && bIsSelected) {
      // Wrong selection: Red shadow
      b.style.boxShadow = '0 0 15px 5px rgba(248, 113, 113, 0.9)'; // Red-400
      b.style.opacity = '1';
    }
  });

  if (instant) {
    if (correct) {
      statusEl.textContent = 'やったね！せいかい！';
      try { new Audio('../../static/sounds/correct.mp3').play(); } catch (e) { }
    } else {
      const label = (Site.colorMap[correctKey]) || correctKey;
      statusEl.textContent = `ちがうよ。こたえは ${label} だよ`;
      try { new Audio('../../static/sounds/wrong.mp3').play(); } catch (e) { }
    }
    // Auto advance
    setTimeout(() => {
      // CRITICAL: Guard against advancing beyond quiz length
      if (index < quiz.length) {
        index++;
        playQuestion();
      }
    }, 1500);
  } else {
    statusEl.textContent = `あなたの　えらんだおと: ${(colorMap[ans] || ans)}`;
    // No auto-advance in normal mode
    document.getElementById('nextBtn').textContent = 'これでけってい'; // Ensure text is correct if logic changes
    document.getElementById('nextBtn').disabled = false;
    document.getElementById('nextBtn').classList.remove('opacity-50');
  }
}

function setChoiceButtonsDisabled(disabled) {
  const container = document.getElementById('buttons');
  Array.from(container.querySelectorAll('button')).forEach(b => {
    b.disabled = disabled;
    b.style.opacity = disabled ? '0.6' : '1';
    b.style.pointerEvents = disabled ? 'none' : 'auto'; // Force block clicks
  });
}

document.getElementById('startBtn').addEventListener('click', () => {
  document.getElementById('startOverlay').classList.add('hidden');
  playQuestion();
});

document.getElementById('nextBtn').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (instant) return;

  if (!waitingForNext) {
    // Confirm Answer
    if (!currentSelection) return;

    const file = quiz[index];
    const choice = currentSelection;
    const correctKey = getKeyFromFile(file);
    const correct = (correctKey === choice);
    answers.push({ choice: choice, correct: correct, file: file });

    // Show Feedback
    waitingForNext = true;
    setChoiceButtonsDisabled(true);
    document.getElementById('nextBtn').disabled = true; // Disable confirm button

    const statusEl = document.getElementById('status');
    if (correct) {
      statusEl.textContent = 'やったね！せいかい！';
      try { new Audio('../../static/sounds/correct.mp3').play(); } catch (e) { }
    } else {
      const label = (Site.colorMap[correctKey]) || correctKey;
      statusEl.textContent = `ちがうよ。こたえは ${label} だよ`;
      try { new Audio('../../static/sounds/wrong.mp3').play(); } catch (e) { }
    }

    // Highlight
    const container = document.getElementById('buttons');
    Array.from(container.querySelectorAll('button')).forEach(b => {
      b.style.outline = 'none';
      const bRaw = b.dataset.label;
      if (bRaw === correctKey) {
        b.style.boxShadow = '0 0 15px 5px rgba(74, 222, 128, 0.9)';
        b.style.opacity = '1';
      }
      if (!correct && bRaw === choice) {
        b.style.boxShadow = '0 0 15px 5px rgba(248, 113, 113, 0.9)';
        b.style.opacity = '1';
      }
    });

    // Auto advance (same timing as instant mode)
    setTimeout(() => {
      if (index < quiz.length) {
        index++;
        playQuestion();
      }
    }, 1500);
  }
});

document.getElementById('replayBtn').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  audio.pause();
  audio.currentTime = 0;
  audio.play();
});

const storedLevel = Number(localStorage.getItem('selectedLevel') || 1);
const storedInstant = localStorage.getItem('instant');
if (storedInstant === '1') instant = true;
else if (storedInstant === '0') instant = false;

if (instant) {
  document.getElementById('nextBtn').style.display = 'none';
}

loadQuiz(storedLevel);
