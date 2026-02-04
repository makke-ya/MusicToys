// games/003_sound_updown/main.js

// Expose functions to window IMMEDIATELY to avoid undefined errors in HTML
window.showInstructions = function(level) {
    selectedLevel = level;
    
    // Save difficulty for ranking button default
    let difficulty = 'normal';
    if (level === 1) difficulty = 'easy';
    else if (level === 30) difficulty = 'hard';
    localStorage.setItem('soundUpdownDifficulty', difficulty);
    
    const radios = document.getElementsByName('instrument');
    for (const radio of radios) {
        if (radio.checked) {
            selectedInstrument = radio.value;
            break;
        }
    }
    
    const popup = document.getElementById('instructions-popup');
    if (popup) popup.classList.remove('hidden');
};

window.startGame = function() {
    if (isStarting) return;
    isStarting = true;

    // UI Switch
    const instructionsPopup = document.getElementById('instructions-popup');
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');

    if (instructionsPopup) instructionsPopup.classList.add('hidden');
    if (startScreen) startScreen.classList.add('hidden');
    if (gameScreen) gameScreen.classList.remove('hidden');

    try { SoundGame.initAudio(); } catch (e) {}

    if (!gameLogic) gameLogic = new GameLogic();
    gameLogic.setLevel(selectedLevel);
    
    timeLeft = 60;
    updateTimer();
    isPlaying = true;
    startTimer();

    SoundGame.preloadInstrument(selectedInstrument).then(() => {
        SoundGame.setInstrument(selectedInstrument);
    }).catch(e => console.warn(e));

    setTimeout(nextProblem, 50);
};

window.showHelp = function() {
    const modal = document.getElementById('help-modal');
    if (modal) {
        modal.classList.remove('hidden');
        void modal.offsetWidth;
        modal.classList.remove('opacity-0');
    }
};

window.closeHelp = function() {
    const modal = document.getElementById('help-modal');
    if (modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
};

// Internal state
let gameLogic;
let timerInterval;
let timeLeft = 60;
let isPlaying = false;
let canAnswer = false;
let selectedInstrument = 'Flute';
let selectedLevel = 1;
let isStarting = false;
let currentProblemNotes = null; // Store for replay

document.addEventListener('DOMContentLoaded', () => {
    gameLogic = new GameLogic();
    
    // Bind UI Events
    const areaUp = document.getElementById('area-up');
    const areaDown = document.getElementById('area-down');
    const infoBar = document.getElementById('info-bar');
    
    const upEvents = ['pointerdown', 'mousedown', 'touchstart'];
    const downEvents = ['pointerdown', 'mousedown', 'touchstart'];

    if (areaUp) {
        upEvents.forEach(type => areaUp.addEventListener(type, (e) => {
            e.preventDefault();
            handleInput(true, e);
        }, { passive: false }));
    }
    
    if (areaDown) {
        downEvents.forEach(type => areaDown.addEventListener(type, (e) => {
            e.preventDefault();
            handleInput(false, e);
        }, { passive: false }));
    }

    if (infoBar) {
        infoBar.addEventListener('click', () => {
            if (isPlaying && currentProblemNotes) {
                SoundGame.playProblem(currentProblemNotes.base, currentProblemNotes.target);
            }
        });
    }

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (!isPlaying || !canAnswer) return;
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            handleInput(true, e);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleInput(false, e);
        }
    });
});

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimer();
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function updateTimer() {
    const el = document.getElementById('timer');
    if (el) el.textContent = timeLeft;
}

function nextProblem() {
    if (!isPlaying) return;
    const problem = gameLogic.generateProblem();
    currentProblemNotes = { base: problem.baseNote, target: problem.targetNote };
    canAnswer = false;
    
    if (gameLogic.level < 15) {
        const up = document.getElementById('effect-up');
        const down = document.getElementById('effect-down');
        if (up) up.classList.add('hidden');
        if (down) down.classList.add('hidden');
        
        setTimeout(() => {
            const hintEl = problem.isUp ? up : down;
            if (hintEl) {
                hintEl.classList.remove('hidden');
                hintEl.classList.add('animate-flash');
                setTimeout(() => hintEl.classList.remove('animate-flash'), 500);
            }
        }, 600);
    }

    SoundGame.playProblem(problem.baseNote, problem.targetNote);
    setTimeout(() => { canAnswer = true; }, 400);
}

function handleInput(isUp, event) {
    if (isUp) SoundGame.playHighEffect();
    else SoundGame.playLowEffect();

    if (!isPlaying || !canAnswer) return;

    const isCorrect = gameLogic.checkAnswer(isUp);
    const scoreEl = document.getElementById('score');
    
    if (isCorrect) {
        if (scoreEl) scoreEl.textContent = gameLogic.currentScore;
        updateComboDisplay(gameLogic.combo);
        
        const char = document.getElementById('character');
        if (char) {
            char.classList.add('animate-bounce-short');
            setTimeout(() => char.classList.remove('animate-bounce-short'), 300);
        }
        
        if (gameLogic.combo > 0 && gameLogic.combo % 10 === 0) showComboEffect(gameLogic.combo);
        
        const screen = document.getElementById('game-screen');
        if (screen) {
            screen.classList.add('bg-green-100');
            setTimeout(() => screen.classList.remove('bg-green-100'), 100);
        }
        nextProblem();
    } else {
        SoundGame.playWrong();
        updateComboDisplay(0);
        const screen = document.getElementById('game-screen');
        if (screen) {
            screen.classList.add('bg-red-100');
            setTimeout(() => screen.classList.remove('bg-red-100'), 100);
        }
        const char = document.getElementById('character');
        if (char) {
            char.style.transform = 'rotate(20deg)';
            setTimeout(() => char.style.transform = 'rotate(0deg)', 200);
        }
    }
}

function updateComboDisplay(combo) {
    let comboEl = document.getElementById('combo-display');
    if (!comboEl) {
        const char = document.getElementById('character');
        if (!char) return;
        const container = char.parentElement;
        comboEl = document.createElement('div');
        comboEl.id = 'combo-display';
        comboEl.className = 'absolute -top-8 left-1/2 transform -translate-x-1/2 text-xl font-bold text-orange-500 whitespace-nowrap opacity-0 transition-opacity';
        container.appendChild(comboEl);
    }
    if (combo > 1) {
        comboEl.textContent = `${combo} COMBO!`;
        comboEl.classList.remove('opacity-0');
    } else {
        comboEl.classList.add('opacity-0');
    }
}

function showComboEffect(combo) {
    const flash = document.createElement('div');
    flash.className = 'fixed inset-0 bg-yellow-400/50 z-[100] pointer-events-none animate-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
    
    const popup = document.createElement('div');
    popup.textContent = `${combo} COMBO!!`;
    popup.className = 'fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-black text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] z-[101] pointer-events-none animate-bounce-short';
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
}

async function endGame() {
    isPlaying = false;
    clearInterval(timerInterval);
    const res = document.getElementById('result-screen');
    // Hide default result screen initially to show name input/leaderboard first
    // if (res) res.classList.remove('hidden'); 
    // const fs = document.getElementById('final-score');
    // if (fs) fs.textContent = gameLogic.currentScore;

    // Leaderboard Integration
    if (window.ScoreManager) {
        let difficulty = 'normal';
        if (selectedLevel === 1) difficulty = 'easy';
        else if (selectedLevel === 30) difficulty = 'hard';
        
        const gameId = `003_sound_updown_${difficulty}`;
        
        try {
            // 0. Input Name
            await window.ScoreManager.showNameInputModal();

            // 1. Post Score
            await window.ScoreManager.postScore(gameId, gameLogic.currentScore, gameLogic.level);
            
            // 2. Show Leaderboard with actions and tabs
            await window.ScoreManager.showLeaderboardModal(gameId, { score: gameLogic.currentScore, level: gameLogic.level, name: localStorage.getItem('userName') }, [
                {
                    label: 'もういちど',
                    primary: true,
                    onClick: () => {
                        location.reload();
                    }
                },
                {
                    label: 'タイトルへもどる',
                    primary: false,
                    onClick: () => {
                        location.reload(); // Simplest way to title for now
                    }
                }
            ], [
                { label: 'かんたん', gameId: '003_sound_updown_easy' },
                { label: 'ふつう', gameId: '003_sound_updown_normal' },
                { label: 'むずかしい', gameId: '003_sound_updown_hard' }
            ]);
        } catch (e) {
            console.error('Leaderboard error:', e);
            alert('ランキングのとうろくに しっぱいしました。');
            location.reload();
        }
    } else {
        // Fallback if ScoreManager missing
        if (res) res.classList.remove('hidden');
        const fs = document.getElementById('final-score');
        if (fs) fs.textContent = gameLogic.currentScore;
    }
}