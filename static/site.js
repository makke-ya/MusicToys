// Site helper: load sounds.json and provide functions to get sounds and generate quiz
window.Site = (function () {
  let ALL_CHORD_FILES = null;
  let CHORD_FILES = {};
  const QUESTION_COUNT = 10;

  async function initSounds() {
    if (ALL_CHORD_FILES) return;
    try {
      const res = await fetch('static/sounds.json');
      const data = await res.json();
      ALL_CHORD_FILES = data.filter(f => /^\d+/.test(f)).slice().sort();
      for (let i = 1; i < 14; i++) {
        CHORD_FILES[i] = ALL_CHORD_FILES.slice(0, i + 1);
      }
    } catch (e) {
      ALL_CHORD_FILES = [];
    }
  }

  function pick_random(level, last_two) {
    const choices = (CHORD_FILES[level] || []).slice();
    if (last_two.length === 2 && last_two[0] === last_two[1] && choices.includes(last_two[0])) {
      const idx = choices.indexOf(last_two[0]);
      if (idx >= 0) choices.splice(idx, 1);
    }
    if (!choices.length) return null;
    return choices[Math.floor(Math.random() * choices.length)];
  }

  async function getSoundsForLevel(level) {
    await initSounds();
    return CHORD_FILES[level] || [];
  }

  async function generateQuiz(level, num_questions = 10) {
    await initSounds();
    const quiz = [];
    const last_two = [];
    for (let i = 0; i < num_questions; i++) {
      const note = pick_random(level, last_two);
      if (!note) break;
      quiz.push(note);
      last_two.push(note);
      if (last_two.length > 2) last_two.shift();
    }
    return quiz;
  }

  const colorMap = {
    red: 'あか', yellow: 'きいろ', blue: 'あお', black: 'くろ', green: 'みどり', orange: 'おれんじ', purple: 'むらさき', pink: 'ぴんく', brown: 'ちゃいろ', beige: 'べーじゅ', lavender: 'らべんだー', gray: 'ぐれー', lightblue: 'みずいろ', yellowgreen: 'きみどり'
  };

  const noteMap = {
    red: 'ドミソ', yellow: 'ドファラ', blue: 'シレソ', black: 'ラドファ', green: 'レソシ', orange: 'ミソド', purple: 'ファラド', pink: 'ソシレ', brown: 'ソドミ', beige: 'レフィスラ', lavender: 'ミギスシ', gray: 'ベーレファ', lightblue: 'エスソベー', yellowgreen: 'ラチスミ'
  };

  /**
   * Create a chord button element
   * @param {string} soundFile - The sound filename (e.g. "01_red.mp3")
   * @param {object} options - Options: { disabled: boolean, onClick: function(e), onPointerDown: function(e) }
   * @returns {HTMLButtonElement}
   */
  function createChordButton(soundFile, options = {}) {
    const parts = soundFile.split('_');
    const raw = parts.length > 1 ? parts[1].split('.')[0] : soundFile;
    const label = colorMap[raw] || raw;

    const btn = document.createElement('button');
    btn.className = 'flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-gray-200 bg-white w-full select-none hover:bg-gray-50 transition-colors';
    if (options.extraClasses) btn.className += ' ' + options.extraClasses; // Allow adding btn-large etc
    btn.dataset.label = raw;
    btn.dataset.file = soundFile;

    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.borderRadius = '9999px';
    swatch.style.display = 'flex';
    swatch.style.alignItems = 'center';
    swatch.style.justifyContent = 'center';
    swatch.style.marginBottom = '2px';
    swatch.style.width = '80px'; // Increased size
    swatch.style.height = '80px';

    let cssColor = '#f3f4f6';
    if (raw && /^[a-z0-9]+$/.test(raw)) {
      cssColor = raw.toLowerCase();
    }
    swatch.style.background = cssColor;
    swatch.style.border = '6px solid rgba(0,0,0,0)';

    try {
      const iconSet = localStorage.getItem('iconSet') || 'animals';
      if (iconSet && iconSet !== 'none') {
        swatch.style.position = 'relative';
        swatch.style.overflow = 'visible';
        swatch.style.border = '6px solid rgba(0,0,0,0)';
        const img = document.createElement('img');
        // Try to find image based on color name
        const imgFile = soundFile.replace('.mp3', '.png');
        // If the soundFile was just "red", createChordButton might need better logic if files don't match exactly.
        // But based on current logic, imgFile is derived from soundFile.
        img.src = `static/images/${iconSet}/${imgFile}`;
        img.alt = label;
        img.style.position = 'absolute';
        img.style.width = '90%';
        img.style.height = '90%';
        img.style.objectFit = 'contain';
        img.style.pointerEvents = 'none';
        img.style.opacity = '0.95';
        img.style.zIndex = '2';
        img.style.top = '50%'; img.style.left = '50%'; img.style.transform = 'translate(-50%, -50%)';
        img.onerror = () => { try { console.debug('image not found', img.src); img.remove(); } catch (e) { } };
        swatch.appendChild(img);
      }
    } catch (e) { }

    const lbl = document.createElement('div');
    lbl.textContent = label;
    lbl.style.fontSize = '18px';
    if (options.labelClass) lbl.className = options.labelClass;

    const noteLbl = document.createElement('div');
    noteLbl.textContent = noteMap[raw] || '';
    noteLbl.className = 'text-sm text-gray-500'; // Default text-sm

    btn.appendChild(swatch);
    btn.appendChild(lbl);
    btn.appendChild(noteLbl);

    if (options.disabled) {
      btn.disabled = true;
      btn.style.opacity = '0.6';
    }

    if (options.onClick) {
      btn.addEventListener('click', options.onClick);
    }
    if (options.onPointerDown) {
      btn.addEventListener('pointerdown', options.onPointerDown);
    }

    return btn;
  }

  function getUserId() {
    let id = localStorage.getItem('userId');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem('userId', id);
    }
    return id;
  }

  return { initSounds, getSoundsForLevel, generateQuiz, createChordButton, getUserId, colorMap, noteMap, QUESTION_COUNT };
})();
