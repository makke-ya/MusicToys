// games/004_rhythm_tap/main.js

(function() {
    const TIER_PATTERNS = {
        lv1: [
            { pattern: [0, 1], label: 'タン タン' },
            { pattern: [0, 1.5], label: 'タン ーン タン' },
            { pattern: [0, 0.5, 1], label: 'タタ タン' },
            { pattern: [0, 1, 1.5], label: 'タン タタ' }
        ],
        lv2: [
            { pattern: [0, 1, 2], label: 'タン タン タン' },
            { pattern: [0, 0.5, 1.5], label: 'タタ ウン タン' },
            { pattern: [0, 1, 2.5], label: 'タン タン ーン タン' },
            { pattern: [0, 0.5, 1], label: 'タタ タン' }
        ],
        lv3: [
            { pattern: [0, 1, 2], label: 'タン タン タン' },
            { pattern: [0, 0.5, 1, 2], label: 'タタ タン タン' },
            { pattern: [0, 1, 1.5, 2], label: 'タン タタ タン' },
            { pattern: [0, 1.5, 2.5], label: 'タン ウン タン タン' }
        ],
        lv4: [
            { pattern: [0, 1, 2, 3], label: 'タン タン タン タン' },
            { pattern: [0, 0.5, 1, 2], label: 'タタ タン タン' },
            { pattern: [0, 1, 1.5, 2.5], label: 'タン タタ ウン タン' },
            { pattern: [0, 1, 2, 2.5], label: 'タン タン タタ' }
        ],
        lv5_6: [
            { pattern: [0, 1, 2, 3], label: 'タン タン タン タン' },
            { pattern: [0, 0.5, 1, 2, 3], label: 'タタ タン タン タン' },
            { pattern: [0, 1, 2, 2.5, 3], label: 'タン タン タタ タン' },
            { pattern: [0, 1, 1.5, 2, 3], label: 'タン タタ タン タン' },
            { pattern: [0, 0.5, 1.5, 2, 3], label: 'タタ ウン タン タン' }
        ],
        lv7: [
            { pattern: [0, 0.5, 1, 2], label: 'タタ タン タン' },
            { pattern: [0, 1, 1.5, 2], label: 'タン タタ タン' },
            { pattern: [0, 0.5, 1.5, 2], label: 'タタ ウン タタ' },
            { pattern: [0, 1, 2, 2.5], label: 'タン タン タタ' }
        ],
        lv8_12: [
            { pattern: [0, 1, 1.5, 2, 3], label: 'タン タタ タン タン' },
            { pattern: [0, 0.5, 1, 1.5, 2], label: 'タタ タタ タン' },
            { pattern: [0, 1, 2, 2.5, 3], label: 'タン タン タタ タン' },
            { pattern: [0, 0.5, 1, 2, 2.5, 3], label: 'タタ タン タタ タン' },
            { pattern: [0, 0.5, 1.5, 2, 2.5, 3], label: 'タタ ウン タタ タン' }
        ],
        lv13_18: [
            { pattern: [0, 0.5, 1, 1.5, 2, 2.5, 3], label: 'タタ タタ タタ タン' },
            { pattern: [0, 1, 1.5, 2, 3, 3.5], label: 'タン タタ タン タタ' },
            { pattern: [0, 0.5, 1, 2, 3, 3.5, 4], label: 'タタ タン タン タタ タン' },
            { pattern: [0, 0.5, 1.5, 2, 3, 3.5, 4], label: 'タタ ウン タン タタ タン' },
            { pattern: [0, 1, 1.5, 2.5, 3, 3.5, 4], label: 'タン タタ ウン タタ タン' }
        ],
        lv19_25: [
            { pattern: [0, 0.75, 1, 2, 2.75, 3], label: 'タッタ タン タッタ タン' },
            { pattern: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], label: 'タタ タタ タタ タタ' },
            { pattern: [0, 0.75, 1, 1.5, 2, 3, 3.5], label: 'タッタ タタ タン タタ' },
            { pattern: [0, 0.5, 1.5, 2, 2.75, 3, 4], label: 'タタ ウン タン タッタ タン' },
            { pattern: [0, 1, 1.75, 2, 2.5, 3, 4], label: 'タン タッタ タン タタ タン' }
        ],
        lv26_35: [
            { pattern: [0, 0.5, 0.75, 1, 1.5, 2, 2.5, 3], label: 'タタッタ タタ タン タタ タン' },
            { pattern: [0, 0.33, 0.67, 1, 2, 2.5, 3], label: 'タタタ タン タン タタ タン' },
            { pattern: [0, 0.75, 1.5, 2, 2.5, 3, 3.5, 4], label: 'ドン ドコ ドン タタ タタ タン' },
            { pattern: [0, 0.5, 1, 1.75, 2, 2.5, 3, 3.5, 4], label: 'タタ タッタ タタ タタ タン' },
            { pattern: [0, 1, 1.33, 1.67, 2, 2.75, 3, 4], label: 'タン タタタ タン タッタ タン' }
        ],
        lv36_43: [
            { pattern: [0, 0.25, 0.5, 0.75, 1, 2, 2.5, 3, 4], label: 'タカタカ タン タン タタ タン' },
            { pattern: [0, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 3.5, 4], label: 'タタッタ タタ タン タタ タタ タン' },
            { pattern: [0, 0.75, 1.5, 2.5, 3, 3.5, 4, 4.5, 5], label: 'シンコペーション・ビート' },
            { pattern: [0, 0.33, 0.67, 1, 1.5, 2, 2.25, 2.5, 2.75, 3], label: '3連符＆タカタカ・コンボ' },
            { pattern: [0, 0.5, 1, 1.25, 1.5, 2, 2.75, 3, 3.5, 4], label: 'おまつり太鼓リズム' }
        ],
        lv44_50: [
            { pattern: [0, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.25, 2.5, 2.75, 3, 4], label: 'タカタカ タン タカタカ タン タン' },
            { pattern: [0, 0.5, 0.75, 1.5, 2, 2.33, 2.67, 3, 3.5, 3.75, 4], label: 'リズムマスター・スペシャル1' },
            { pattern: [0, 0.75, 1.5, 2, 2.25, 2.5, 3, 3.5, 4, 4.5, 5], label: 'リズムマスター・スペシャル2' },
            { pattern: [0, 0.33, 0.67, 1, 1.75, 2, 2.5, 3, 3.25, 3.5, 3.75, 4], label: 'リズムマスター・ファイナル' },
            { pattern: [0, 0.25, 0.5, 1, 1.5, 1.75, 2, 2.75, 3, 3.5, 4, 4.5], label: '超絶技巧たいこビート' }
        ]
    };

    function buildFallbackLevels() {
        const list = [];
        for (let lvl = 1; lvl <= 50; lvl++) {
            const patterns = lvl === 1 ? TIER_PATTERNS.lv1
                : lvl === 2 ? TIER_PATTERNS.lv2
                : lvl === 3 ? TIER_PATTERNS.lv3
                : lvl === 4 ? TIER_PATTERNS.lv4
                : lvl <= 6 ? TIER_PATTERNS.lv5_6
                : lvl === 7 ? TIER_PATTERNS.lv7
                : lvl <= 12 ? TIER_PATTERNS.lv8_12
                : lvl <= 18 ? TIER_PATTERNS.lv13_18
                : lvl <= 25 ? TIER_PATTERNS.lv19_25
                : lvl <= 35 ? TIER_PATTERNS.lv26_35
                : lvl <= 43 ? TIER_PATTERNS.lv36_43
                : TIER_PATTERNS.lv44_50;
            const bpm = lvl <= 2 ? 60 : lvl <= 4 ? 65 : lvl <= 6 ? 70 : lvl === 7 ? 75 : Math.round(75 + ((lvl - 7) / 43) * 70);
            const toleranceMs = lvl <= 2 ? 300 : lvl <= 4 ? 280 : Math.max(75, Math.round(270 - ((lvl - 5) / 45) * 195));
            const sound = lvl <= 7 ? 'taiko' : lvl <= 11 ? 'castanet' : lvl <= 15 ? 'tambourine' : lvl <= 20 ? 'woodblock' : lvl <= 25 ? 'cymbal' : 'random';
            list.push({
                level: lvl,
                bpm,
                pattern: patterns[0].pattern,
                label: patterns[0].label,
                patterns,
                toleranceMs,
                sound,
                demoCount: lvl <= 12 ? 2 : 1,
                visualGuide: lvl <= 15 ? true : (lvl <= 25 ? 'small' : false)
            });
        }
        return list;
    }

    const SOUND_DISPLAY = {
        taiko: { emoji: '🥁', subtext: 'ドン！' },
        castanet: { emoji: '🔴', subtext: 'カチッ！' },
        tambourine: { emoji: '铃', subtext: 'シャリン！' },
        woodblock: { emoji: '🪵', subtext: 'コッ！' },
        cymbal: { emoji: '📀', subtext: 'ジャーン！' }
    };

    let gameLogic = new RhythmGameLogic(buildFallbackLevels());
    let selectedStartLevel = 1;
    let preferredSound = 'auto';
    let activeSound = 'taiko';
    let isPlaying = false;
    let canTapInput = false;
    let introTimeoutId = null;

    async function loadLevelDesign() {
        try {
            const response = await fetch('level_design.json');
            if (response.ok) {
                const data = await response.json();
                gameLogic.setLevelDesigns(data);
            }
        } catch (e) {
            console.warn('Using fallback level designs:', e);
        }
    }

    function setPadInputState(enabled) {
        canTapInput = Boolean(enabled);
        gameLogic.setInputEnabled(canTapInput);

        const pad = document.getElementById('taiko-pad');
        const subEl = document.getElementById('taiko-subtext');
        const info = SOUND_DISPLAY[activeSound] || SOUND_DISPLAY.taiko;

        if (pad) {
            pad.disabled = !canTapInput;
            pad.setAttribute('aria-disabled', String(!canTapInput));
            if (canTapInput) {
                pad.classList.remove('taiko-disabled');
            } else {
                pad.classList.add('taiko-disabled');
            }
        }

        if (subEl) {
            subEl.textContent = canTapInput ? info.subtext : '👂 きいてね';
        }
    }

    function showInstructions(level) {
        selectedStartLevel = level;
        const difficulty = gameLogic.getDifficultyCategory(level);
        localStorage.setItem('rhythmTapDifficulty', difficulty);

        const radios = document.getElementsByName('percussion-sound');
        for (const radio of radios) {
            if (radio.checked) {
                preferredSound = radio.value;
                break;
            }
        }

        const popup = document.getElementById('instructions-popup');
        if (popup) popup.classList.remove('hidden');
    }

    function startGame() {
        const instructionsPopup = document.getElementById('instructions-popup');
        const startScreen = document.getElementById('start-screen');
        const gameScreen = document.getElementById('game-screen');

        if (instructionsPopup) instructionsPopup.classList.add('hidden');
        if (startScreen) startScreen.classList.add('hidden');
        if (gameScreen) gameScreen.classList.remove('hidden');

        RhythmAudio.initAudio();
        gameLogic.reset();
        gameLogic.setLevel(selectedStartLevel);
        isPlaying = true;

        updateHeaderUI();
        startLevelRound();
    }

    function updateHeaderUI() {
        const levelEl = document.getElementById('current-level');
        const scoreEl = document.getElementById('score');
        if (levelEl) levelEl.textContent = gameLogic.level;
        if (scoreEl) scoreEl.textContent = gameLogic.totalScore;
    }

    function updateDrumAppearance(soundName) {
        const info = SOUND_DISPLAY[soundName] || SOUND_DISPLAY.taiko;
        const charEl = document.getElementById('taiko-character');
        const subEl = document.getElementById('taiko-subtext');
        if (charEl) charEl.textContent = info.emoji;
        if (subEl) subEl.textContent = canTapInput ? info.subtext : '👂 きいてね';
    }

    function renderGuideDots(config) {
        const container = document.getElementById('guide-dots-container');
        if (!container) return;
        container.innerHTML = '';

        const beatCount = config.pattern.length;
        for (let i = 0; i < beatCount; i++) {
            const dot = document.createElement('div');
            dot.className = 'guide-dot';
            if (config.visualGuide === 'small') {
                dot.classList.add('guide-dot-small');
            }
            dot.dataset.index = String(i);
            container.appendChild(dot);
        }

        updateTapCounter(0, beatCount);
    }

    function updateTapCounter(current, total) {
        const counterEl = document.getElementById('tap-counter-text');
        if (counterEl) {
            counterEl.textContent = `タップ: ${current} / ${total}`;
        }
    }

    function startLevelRound() {
        if (!isPlaying) return;
        RhythmAudio.stopDemo();
        clearTimeout(introTimeoutId);

        // Lock input and gray out drum pad while showing intro and playing demo
        setPadInputState(false);

        // Pick a fresh rhythm variation for this level
        gameLogic.generateProblem();

        const judgmentPopup = document.getElementById('judgment-popup');
        if (judgmentPopup) judgmentPopup.classList.add('hidden');

        const config = gameLogic.getCurrentLevelConfig();
        activeSound = gameLogic.getResolvedSound(preferredSound);
        RhythmAudio.setSound(activeSound);
        updateDrumAppearance(activeSound);
        updateHeaderUI();
        renderGuideDots(config);

        const hintEl = document.getElementById('rhythm-hint-text');
        if (hintEl) {
            hintEl.textContent = config.visualGuide === false ? '耳で よく きいてね！' : `「${config.label || ''}」`;
        }

        const bannerEl = document.getElementById('phase-banner');
        if (bannerEl) {
            bannerEl.textContent = '🎵 おてほんを きいてね！';
            bannerEl.className = 'inline-block bg-gray-200 px-6 py-2 rounded-full shadow-md border-2 border-gray-400 text-xl md:text-2xl font-black text-gray-700';
        }

        // Show brief level intro overlay
        const introPopup = document.getElementById('level-intro-popup');
        const introLevel = document.getElementById('intro-level');
        const introBeats = document.getElementById('intro-beats');
        const introTempo = document.getElementById('intro-tempo');
        const introLabel = document.getElementById('intro-label');

        const tempoInfo = gameLogic.getTempoInfo(config.bpm);
        if (introLevel) introLevel.textContent = `レベル ${config.level}`;
        if (introBeats) introBeats.textContent = `${config.pattern.length}かいの リズム！`;
        if (introTempo) introTempo.textContent = `はやさ: ${tempoInfo.text} ${tempoInfo.emoji}`;
        if (introLabel) introLabel.textContent = `「${config.label || ''}」`;

        if (introPopup) {
            introPopup.classList.remove('hidden');
            introTimeoutId = setTimeout(() => {
                introPopup.classList.add('hidden');
                playCurrentDemo();
            }, 1100);
        } else {
            playCurrentDemo();
        }
    }

    function playCurrentDemo() {
        if (!isPlaying) return;
        setPadInputState(false);
        gameLogic.clearTaps();

        const config = gameLogic.getCurrentLevelConfig();
        renderGuideDots(config);

        const bannerEl = document.getElementById('phase-banner');
        if (bannerEl) {
            bannerEl.textContent = '🎵 おてほんを きいてね！';
            bannerEl.className = 'inline-block bg-gray-200 px-6 py-2 rounded-full shadow-md border-2 border-gray-400 text-xl md:text-2xl font-black text-gray-700';
        }

        const expectedMs = gameLogic.getExpectedTimestampsMs(config);
        const beatDurationMs = gameLogic.getBeatDurationMs(config.bpm);

        RhythmAudio.playDemo(expectedMs, {
            sound: activeSound,
            demoCount: config.demoCount || 1,
            beatDurationMs,
            onRoundStart: () => {
                clearGuideDotHighlights();
            },
            onBeat: (beatIndex) => {
                triggerDemoPulseVisual();
                if (config.visualGuide !== false) {
                    highlightGuideDotDemo(beatIndex);
                }
            },
            onComplete: () => {
                clearGuideDotHighlights();
                beginInputPhase();
            }
        });
    }

    function clearGuideDotHighlights() {
        const dots = document.querySelectorAll('#guide-dots-container .guide-dot');
        dots.forEach(dot => {
            dot.classList.remove('dot-demo-active', 'dot-tapped-perfect', 'dot-tapped-good', 'dot-tapped-miss');
        });
    }

    function highlightGuideDotDemo(index) {
        const dots = document.querySelectorAll('#guide-dots-container .guide-dot');
        dots.forEach((dot, idx) => {
            if (idx === index) {
                dot.classList.add('dot-demo-active');
                setTimeout(() => dot.classList.remove('dot-demo-active'), 240);
            }
        });
    }

    function beginInputPhase() {
        if (!isPlaying) return;
        gameLogic.clearTaps();
        setPadInputState(true);

        const config = gameLogic.getCurrentLevelConfig();
        updateTapCounter(0, config.pattern.length);

        const bannerEl = document.getElementById('phase-banner');
        if (bannerEl) {
            bannerEl.textContent = '🥁 おなじ リズムで たたいてね！';
            bannerEl.className = 'inline-block bg-green-500 px-6 py-2 rounded-full shadow-md border-2 border-green-700 text-xl md:text-2xl font-black text-white animate-bounce';
        }
    }

    function triggerDemoPulseVisual() {
        const pad = document.getElementById('taiko-pad');
        const charEl = document.getElementById('taiko-character');
        if (pad) {
            pad.classList.add('drum-demo-pulse');
            setTimeout(() => pad.classList.remove('drum-demo-pulse'), 110);
        }
        if (charEl) {
            charEl.style.transform = 'scale(1.18)';
            setTimeout(() => { charEl.style.transform = 'scale(1)'; }, 120);
        }
    }

    function triggerDrumVisual(event) {
        const pad = document.getElementById('taiko-pad');
        const charEl = document.getElementById('taiko-character');
        const rippleContainer = document.getElementById('ripple-container');

        if (pad) {
            pad.classList.add('drum-hit');
            setTimeout(() => pad.classList.remove('drum-hit'), 110);
        }
        if (charEl) {
            charEl.style.transform = 'scale(1.22)';
            setTimeout(() => { charEl.style.transform = 'scale(1)'; }, 120);
        }
        if (rippleContainer && pad) {
            const ripple = document.createElement('div');
            ripple.className = 'tap-ripple';
            const rect = pad.getBoundingClientRect();
            let x = rect.width / 2;
            let y = rect.height / 2;
            if (event && typeof event.clientX === 'number' && event.clientX > 0) {
                x = event.clientX - rect.left;
                y = event.clientY - rect.top;
            }
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            rippleContainer.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        }
    }

    function handleTaikoTap(event) {
        // Strictly ignore any user input while demo is playing or input is disabled
        if (!isPlaying || !canTapInput || !gameLogic.canAcceptInput()) return;

        RhythmAudio.playPercussion(activeSound);
        triggerDrumVisual(event);

        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const tapCount = gameLogic.recordTap(now);
        const config = gameLogic.getCurrentLevelConfig();

        updateTapCounter(tapCount, config.pattern.length);

        // Highlight tapped dot immediately
        const dots = document.querySelectorAll('#guide-dots-container .guide-dot');
        if (dots[tapCount - 1]) {
            dots[tapCount - 1].classList.add('dot-demo-active');
        }

        if (gameLogic.isInputComplete()) {
            setPadInputState(false);
            setTimeout(finishLevelRound, 300);
        }
    }

    function finishLevelRound() {
        const result = gameLogic.evaluateRecordedTaps();
        updateHeaderUI();

        // Colorize guide dots based on individual tap judgment
        const dots = document.querySelectorAll('#guide-dots-container .guide-dot');
        result.judgments.forEach((j, idx) => {
            if (!dots[idx]) return;
            dots[idx].classList.remove('dot-demo-active');
            if (j === 'perfect') dots[idx].classList.add('dot-tapped-perfect');
            else if (j === 'good') dots[idx].classList.add('dot-tapped-good');
            else dots[idx].classList.add('dot-tapped-miss');
        });

        RhythmAudio.playResultEffect(result.stars);
        showJudgmentPopup(result);
    }

    function showJudgmentPopup(result) {
        const popup = document.getElementById('judgment-popup');
        const starsEl = document.getElementById('judgment-stars');
        const titleEl = document.getElementById('judgment-title');
        const msgEl = document.getElementById('judgment-message');
        const scoreEl = document.getElementById('judgment-score');
        const detailsEl = document.getElementById('judgment-details');
        const nextBtn = document.getElementById('next-level-btn');

        if (starsEl) {
            starsEl.innerHTML = '';
            for (let i = 0; i < 3; i++) {
                const span = document.createElement('span');
                span.className = 'star-animate';
                span.style.animationDelay = `${i * 0.12}s`;
                span.textContent = i < result.stars ? '⭐' : '☆';
                starsEl.appendChild(span);
            }
        }

        if (result.stars === 3) {
            if (titleEl) titleEl.textContent = '🌟 パーフェクト！';
            if (msgEl) msgEl.textContent = 'リズムぴったんこ！ すごいね！';
        } else if (result.stars === 2) {
            if (titleEl) titleEl.textContent = '😊 グッド！';
            if (msgEl) msgEl.textContent = 'じょうずに たたけたね！';
        } else {
            if (titleEl) titleEl.textContent = '💪 がんばろう！';
            if (msgEl) msgEl.textContent = 'もういちど おてほんを きいて ちょうせんしよう！';
        }

        if (scoreEl) {
            scoreEl.textContent = `+${result.score}`;
        }

        if (detailsEl) {
            detailsEl.innerHTML = '';
            result.judgments.forEach((j, idx) => {
                const badge = document.createElement('span');
                if (j === 'perfect') {
                    badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700';
                    badge.textContent = `${idx + 1}: ぴったんこ`;
                } else if (j === 'good') {
                    badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700';
                    badge.textContent = `${idx + 1}: グッド`;
                } else {
                    badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600';
                    badge.textContent = `${idx + 1}: おしい`;
                }
                detailsEl.appendChild(badge);
            });
        }

        if (nextBtn) {
            if (result.canAdvance) {
                nextBtn.classList.remove('hidden');
                const isMaxLevel = gameLogic.level >= gameLogic.levelDesigns.length;
                nextBtn.textContent = isMaxLevel ? '🏆 けっか発表へ！' : 'つぎへ！ ➡️';
            } else {
                nextBtn.classList.add('hidden');
            }
        }

        if (popup) popup.classList.remove('hidden');
    }

    function handleNextLevel() {
        const step = gameLogic.advanceLevel();
        if (step.completedAll) {
            endGame();
        } else {
            startLevelRound();
        }
    }

    function showHelp() {
        const modal = document.getElementById('help-modal');
        if (modal) {
            modal.classList.remove('hidden');
            void modal.offsetWidth;
            modal.classList.remove('opacity-0');
        }
    }

    function closeHelp() {
        const modal = document.getElementById('help-modal');
        if (modal) {
            modal.classList.add('opacity-0');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }
    }

    function openRankingFromTitle() {
        if (!window.ScoreManager) return;
        const lastDiff = localStorage.getItem('rhythmTapDifficulty') || 'easy';
        window.ScoreManager.showLeaderboardModal(
            `004_rhythm_tap_${lastDiff}`,
            null,
            [],
            [
                { label: 'かんたん', gameId: '004_rhythm_tap_easy' },
                { label: 'ふつう', gameId: '004_rhythm_tap_normal' },
                { label: 'むずかしい', gameId: '004_rhythm_tap_hard' }
            ]
        );
    }

    async function endGame() {
        isPlaying = false;
        setPadInputState(false);
        RhythmAudio.stopDemo();
        clearTimeout(introTimeoutId);

        const judgmentPopup = document.getElementById('judgment-popup');
        if (judgmentPopup) judgmentPopup.classList.add('hidden');

        const res = document.getElementById('result-screen');

        if (window.ScoreManager) {
            const difficulty = gameLogic.getDifficultyCategory(selectedStartLevel);
            const gameId = `004_rhythm_tap_${difficulty}`;

            try {
                await window.ScoreManager.showNameInputModal();
                await window.ScoreManager.postScore(gameId, gameLogic.totalScore, gameLogic.level);
                await window.ScoreManager.showLeaderboardModal(
                    gameId,
                    {
                        score: gameLogic.totalScore,
                        level: gameLogic.level,
                        name: localStorage.getItem('userName')
                    },
                    [
                        {
                            label: 'もういちど',
                            primary: true,
                            onClick: () => location.reload()
                        },
                        {
                            label: 'タイトルへもどる',
                            primary: false,
                            onClick: () => location.reload()
                        }
                    ],
                    [
                        { label: 'かんたん', gameId: '004_rhythm_tap_easy' },
                        { label: 'ふつう', gameId: '004_rhythm_tap_normal' },
                        { label: 'むずかしい', gameId: '004_rhythm_tap_hard' }
                    ]
                );
            } catch (e) {
                console.error('Leaderboard error:', e);
                if (res) res.classList.remove('hidden');
                const fs = document.getElementById('final-score');
                if (fs) fs.textContent = gameLogic.totalScore;
            }
        } else {
            if (res) res.classList.remove('hidden');
            const fs = document.getElementById('final-score');
            if (fs) fs.textContent = gameLogic.totalScore;
        }
    }

    // Expose key entry points for compatibility
    window.showInstructions = showInstructions;
    window.startGame = startGame;
    window.showHelp = showHelp;
    window.closeHelp = closeHelp;

    document.addEventListener('DOMContentLoaded', () => {
        loadLevelDesign();

        // Level select buttons
        const levelBtns = document.querySelectorAll('.level-select-btn');
        levelBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const lvl = parseInt(btn.dataset.level || '1', 10);
                showInstructions(lvl);
            });
        });

        // Start button inside instructions popup
        const startBtn = document.getElementById('instructions-start-button');
        if (startBtn) {
            startBtn.addEventListener('click', startGame);
        }

        // Taiko pad tap events
        const taikoPad = document.getElementById('taiko-pad');
        if (taikoPad) {
            let lastTapTimestamp = 0;
            const onPadTrigger = (e) => {
                e.preventDefault();
                if (!canTapInput || !gameLogic.canAcceptInput()) return;
                const now = Date.now();
                // Prevent duplicate firing from pointerdown + mousedown/touchstart
                if (now - lastTapTimestamp < 40) return;
                lastTapTimestamp = now;
                handleTaikoTap(e);
            };
            taikoPad.addEventListener('pointerdown', onPadTrigger, { passive: false });
            taikoPad.addEventListener('mousedown', onPadTrigger, { passive: false });
            taikoPad.addEventListener('touchstart', onPadTrigger, { passive: false });
        }

        // Keyboard space/enter support for accessibility & testing
        document.addEventListener('keydown', (e) => {
            if (!isPlaying || !canTapInput || !gameLogic.canAcceptInput()) return;
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                handleTaikoTap(e);
            }
        });

        // Replay demo button
        const replayBtn = document.getElementById('replay-btn');
        if (replayBtn) {
            replayBtn.addEventListener('click', () => {
                if (!isPlaying) return;
                playCurrentDemo();
            });
        }

        // Finish button
        const finishBtn = document.getElementById('finish-btn');
        if (finishBtn) {
            finishBtn.addEventListener('click', () => {
                if (!isPlaying) return;
                endGame();
            });
        }

        // Retry & Next buttons in judgment popup
        const retryBtn = document.getElementById('retry-level-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                startLevelRound();
            });
        }

        const nextBtn = document.getElementById('next-level-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                handleNextLevel();
            });
        }

        // Help & Ranking modals
        const openHelpBtn = document.getElementById('open-help-btn');
        if (openHelpBtn) openHelpBtn.addEventListener('click', showHelp);

        const closeHelpTop = document.getElementById('close-help-top-btn');
        if (closeHelpTop) closeHelpTop.addEventListener('click', closeHelp);

        const closeHelpBottom = document.getElementById('close-help-bottom-btn');
        if (closeHelpBottom) closeHelpBottom.addEventListener('click', closeHelp);

        const openRankingBtn = document.getElementById('open-ranking-btn');
        if (openRankingBtn) openRankingBtn.addEventListener('click', openRankingFromTitle);

        const restartBtn = document.getElementById('restart-game-btn');
        if (restartBtn) restartBtn.addEventListener('click', () => location.reload());
    });
})();
