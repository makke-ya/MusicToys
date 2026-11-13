// games/007_melody_detective/main.js

(function() {
    const POOLS = {
        3: [
            { title: '🌷 チューリップ（でだし）', notes: [0, 1, 2] },
            { title: '🥖 あつあつパン', notes: [2, 1, 0] },
            { title: '🐸 かえるのうた（ショート）', notes: [0, 2, 4] },
            { title: '🐑 メリーさんのひつじ（ショート）', notes: [2, 1, 2] },
            { title: '🔔 ジングルベル（ショート）', notes: [2, 2, 4] },
            { title: '🦋 ちょうちょ（ショート）', notes: [4, 2, 2] }
        ],
        4: [
            { title: '🐸 かえるのうた（4おん）', notes: [0, 1, 2, 1] },
            { title: '🐑 メリーさんのひつじ（4おん）', notes: [2, 1, 0, 1] },
            { title: '🌷 チューリップ（後半）', notes: [4, 2, 1, 0] },
            { title: '⭐ きらきらぼし（4おん）', notes: [0, 0, 4, 4] },
            { title: '🎵 よろこびのうた（4おん）', notes: [2, 2, 3, 4] },
            { title: '🌰 どんぐりころころ（4おん）', notes: [4, 4, 2, 3] }
        ],
        5: [
            { title: '🦋 ちょうちょ（5おん）', notes: [4, 2, 2, 3, 1] },
            { title: '🐸 かえるのうた（5おん）', notes: [0, 1, 2, 3, 2] },
            { title: '🔔 ジングルベル（5おん）', notes: [2, 4, 0, 1, 2] },
            { title: '🌉 ロンドンばし（5おん）', notes: [4, 5, 4, 3, 2] },
            { title: '🐝 ぶんぶんぶん（5おん）', notes: [4, 3, 2, 1, 0] },
            { title: '🏠 家路・新世界より（5おん）', notes: [2, 4, 4, 2, 1] }
        ],
        6: [
            { title: '🌷 チューリップ（6おん）', notes: [0, 1, 2, 0, 1, 2] },
            { title: '🦋 ちょうちょ（6おん）', notes: [4, 2, 2, 3, 1, 1] },
            { title: '⭐ きらきらぼし（6おん）', notes: [0, 0, 4, 4, 5, 4] },
            { title: '🎵 よろこびのうた（6おん）', notes: [2, 2, 3, 4, 4, 3] },
            { title: '🏠 家路・新世界より（6おん）', notes: [2, 4, 4, 2, 1, 0] },
            { title: '🐻 もりのくまさん（6おん）', notes: [4, 3, 2, 4, 7, 4] }
        ],
        7: [
            { title: '🐸 かえるのうた（7おん）', notes: [0, 1, 2, 3, 2, 1, 0] },
            { title: '🐑 メリーさんのひつじ（7おん）', notes: [2, 1, 0, 1, 2, 2, 2] },
            { title: '⭐ きらきらぼし（7おん）', notes: [0, 0, 4, 4, 5, 5, 4] },
            { title: '🌰 どんぐりころころ（7おん）', notes: [4, 4, 2, 3, 4, 5, 4] },
            { title: '🌉 ロンドンばし（7おん）', notes: [4, 5, 4, 3, 2, 3, 4] },
            { title: '🕰️ おおきなのっぽの古時計（7おん）', notes: [4, 7, 6, 7, 4, 3, 2] }
        ]
    };

    function buildFallbackLevels() {
        const list = [];
        for (let lvl = 1; lvl <= 50; lvl++) {
            const mode = lvl <= 15 ? 'same_or_diff' : 'find_index';
            const noteCount = lvl <= 5 ? 3
                : lvl <= 12 ? 4
                : lvl <= 15 ? 5
                : lvl <= 18 ? 3
                : lvl <= 22 ? 4
                : lvl <= 30 ? 5
                : lvl <= 40 ? 6
                : 7;
            const mistakeDistance = (lvl <= 10 || (lvl >= 16 && lvl <= 20)) ? 'large'
                : (lvl <= 15 || (lvl >= 21 && lvl <= 35)) ? 'medium'
                : 'subtle';
            const guideMode = lvl <= 15 ? 'all' : lvl <= 30 ? 'position_only' : 'ear_only';
            const allowTranspose = lvl >= 31;
            const noteDurationMs = Math.max(300, Math.round(520 - ((lvl - 1) / 49) * 220));
            const gapBetweenPhrasesMs = Math.max(550, Math.round(750 - ((lvl - 1) / 49) * 200));
            const sound = lvl <= 10 ? 'marimba' : lvl <= 20 ? 'musicbox' : lvl <= 30 ? 'piano' : lvl <= 40 ? 'synth' : 'random';
            const pool = POOLS[noteCount];
            const baseIdx = (lvl - 1) % pool.length;
            list.push({
                level: lvl,
                mode,
                noteCount,
                mistakeDistance,
                guideMode,
                allowTranspose,
                noteDurationMs,
                gapBetweenPhrasesMs,
                sound,
                baseSong: pool[baseIdx].title,
                notes: pool[baseIdx].notes,
                melodies: pool
            });
        }
        return list;
    }

    let gameLogic = new MelodyDetectiveLogic(buildFallbackLevels());
    let selectedStartLevel = 1;
    let preferredSound = 'auto';
    let activeSound = 'marimba';
    let isPlaying = false;
    let canChoose = false;
    let introTimeoutId = null;
    let judgmentTimeoutId = null;

    async function loadLevelDesign() {
        try {
            const res = await fetch('level_design.json');
            if (res.ok) {
                const data = await res.json();
                gameLogic.setLevelDesigns(data);
            }
        } catch (e) {
            console.warn('Using fallback level designs:', e);
        }
    }

    function setChoicesInputState(enabled) {
        canChoose = Boolean(enabled);
        gameLogic.setInputEnabled(canChoose);

        const choices = document.querySelectorAll('.detective-choice');
        choices.forEach(btn => {
            btn.disabled = !canChoose;
            btn.setAttribute('aria-disabled', String(!canChoose));
            if (canChoose) {
                btn.classList.remove('choice-disabled');
            } else {
                btn.classList.add('choice-disabled');
            }
        });
    }

    function showInstructions(level) {
        selectedStartLevel = level;
        const difficulty = gameLogic.getDifficultyCategory(level);
        localStorage.setItem('melodyDetectiveDifficulty', difficulty);

        const radios = document.getElementsByName('detective-sound');
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

        DetectiveAudio.initAudio();
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

    function renderSuspectsAndChoices(config) {
        const suspectsContainer = document.getElementById('note-suspects-container');
        const binaryContainer = document.getElementById('binary-choices-container');
        const guideLabel = document.getElementById('suspect-guide-label');
        const footerText = document.getElementById('mode-footer-text');

        if (!suspectsContainer) return;
        suspectsContainer.innerHTML = '';

        const totalNotes = (config.teacherNotes || config.notes || []).length;
        const isFindIndex = config.mode === 'find_index';

        if (binaryContainer) {
            if (isFindIndex) {
                binaryContainer.classList.add('hidden');
            } else {
                binaryContainer.classList.remove('hidden');
            }
        }

        if (guideLabel) {
            guideLabel.textContent = isFindIndex
                ? '🕵️ なんばんめの おとを まちがえたか タッチしよう！'
                : '🎵 おんぷが じゅんばんに ひかるよ';
        }

        if (footerText) {
            footerText.textContent = gameLogic.getModeLabel(config.mode);
        }

        for (let i = 0; i < totalNotes; i++) {
            const teacherNoteIdx = (config.teacherNotes || config.notes)[i] || 0;
            const scaleInfo = MelodyDetectiveLogic.SCALE_NOTES[teacherNoteIdx] || MelodyDetectiveLogic.SCALE_NOTES[0];

            const el = document.createElement(isFindIndex ? 'button' : 'div');
            if (isFindIndex) {
                el.type = 'button';
                el.className = 'suspect-card detective-choice bg-white border-2 border-amber-400 text-gray-800 hover:bg-amber-50';
            } else {
                el.className = 'suspect-card bg-white/90 border-2 border-sky-300 text-gray-700';
            }
            el.dataset.suspectIndex = String(i);

            const badge = document.createElement('span');
            badge.className = 'text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 pointer-events-none';
            badge.textContent = `${i + 1}ばんめ`;

            const iconEl = document.createElement('span');
            iconEl.className = 'suspect-icon text-3xl md:text-4xl my-1 pointer-events-none';
            iconEl.textContent = isFindIndex ? '🎵' : '🎶';

            const noteHintEl = document.createElement('span');
            noteHintEl.className = 'suspect-note-label text-sm font-black text-sky-700 pointer-events-none';
            noteHintEl.textContent = config.guideMode === 'all' ? scaleInfo.name : '❓';

            if (isFindIndex) {
                let lastTrigger = 0;
                const onSuspectTap = (e) => {
                    e.preventDefault();
                    if (!canChoose || !gameLogic.canAcceptInput()) return;
                    const now = Date.now();
                    if (now - lastTrigger < 40) return;
                    lastTrigger = now;
                    handleAnswerChoice(i, el);
                };
                el.addEventListener('pointerdown', onSuspectTap, { passive: false });
                el.addEventListener('click', onSuspectTap, { passive: false });
            }

            el.appendChild(badge);
            el.appendChild(iconEl);
            el.appendChild(noteHintEl);
            suspectsContainer.appendChild(el);
        }
    }

    function startLevelRound(keepCurrentProblem = false) {
        if (!isPlaying) return;
        DetectiveAudio.stopDemo();
        clearTimeout(introTimeoutId);
        clearTimeout(judgmentTimeoutId);

        gameLogic.generateProblem({ keepCurrentProblem: Boolean(keepCurrentProblem) });

        const judgmentPopup = document.getElementById('judgment-popup');
        if (judgmentPopup) judgmentPopup.classList.add('hidden');

        const config = gameLogic.getCurrentLevelConfig();
        activeSound = gameLogic.getResolvedSound(preferredSound);
        DetectiveAudio.setSound(activeSound);

        updateHeaderUI();
        renderSuspectsAndChoices(config);
        setChoicesInputState(false);

        const songHintEl = document.getElementById('song-hint-text');
        if (songHintEl) {
            songHintEl.textContent = `曲モチーフ: ${config.baseSong}`;
        }

        const bannerEl = document.getElementById('phase-banner');
        if (bannerEl) {
            bannerEl.textContent = '👂 ふたりの メロディーを ききくらべよう！';
            bannerEl.className = 'inline-block bg-gray-200 px-6 py-2 rounded-full shadow-md border-2 border-gray-400 text-lg md:text-2xl font-black text-gray-700';
        }

        const introPopup = document.getElementById('level-intro-popup');
        const introLevel = document.getElementById('intro-level');
        const introSong = document.getElementById('intro-song');
        const introMode = document.getElementById('intro-mode');
        const introGuideMode = document.getElementById('intro-guide-mode');

        if (introLevel) introLevel.textContent = `レベル ${config.level}`;
        if (introSong) introSong.textContent = config.baseSong;
        if (introMode) introMode.textContent = gameLogic.getModeLabel(config.mode);
        if (introGuideMode) introGuideMode.textContent = gameLogic.getGuideModeLabel(config.guideMode);

        if (introPopup) {
            introPopup.classList.remove('hidden');
            introTimeoutId = setTimeout(() => {
                introPopup.classList.add('hidden');
                playCurrentComparisonDemo();
            }, 950);
        } else {
            playCurrentComparisonDemo();
        }
    }

    function playCurrentComparisonDemo() {
        if (!isPlaying) return;
        setChoicesInputState(false);
        clearDemoHighlights();

        const config = gameLogic.getCurrentLevelConfig();
        const teacherCard = document.getElementById('teacher-stage-card');
        const studentCard = document.getElementById('student-stage-card');
        const bannerEl = document.getElementById('phase-banner');

        DetectiveAudio.playComparisonDemo(config.teacherNotes, config.studentNotes, {
            sound: activeSound,
            noteDurationMs: config.noteDurationMs,
            gapBetweenPhrasesMs: config.gapBetweenPhrasesMs,
            transposeSemitones: config.transposeSemitones || 0,
            onPhaseChange: (phase) => {
                clearSuspectHighlights();
                if (phase === 'teacher') {
                    if (teacherCard) teacherCard.classList.add('stage-singer-active');
                    if (studentCard) studentCard.classList.remove('stage-singer-active');
                    if (bannerEl) {
                        bannerEl.textContent = '🦉 ① おてほん先生が うたっているよ！';
                        bannerEl.className = 'inline-block bg-sky-100 px-6 py-2 rounded-full shadow-md border-2 border-sky-400 text-lg md:text-2xl font-black text-sky-800';
                    }
                } else {
                    if (teacherCard) teacherCard.classList.remove('stage-singer-active');
                    if (studentCard) studentCard.classList.add('stage-singer-active');
                    if (bannerEl) {
                        bannerEl.textContent = '🐶 ② まねっこ生徒が うたっているよ！';
                        bannerEl.className = 'inline-block bg-amber-100 px-6 py-2 rounded-full shadow-md border-2 border-amber-400 text-lg md:text-2xl font-black text-amber-800';
                    }
                }
            },
            onNote: (phase, noteIdx, positionIdx) => {
                highlightSuspectCard(phase, positionIdx, Math.max(180, config.noteDurationMs - 70));
            },
            onComplete: () => {
                clearDemoHighlights();
                beginInputPhase();
            }
        });
    }

    function clearSuspectHighlights() {
        const cards = document.querySelectorAll('#note-suspects-container .suspect-card');
        cards.forEach(c => {
            c.classList.remove('suspect-demo-teacher', 'suspect-demo-student');
        });
    }

    function clearDemoHighlights() {
        clearSuspectHighlights();
        const teacherCard = document.getElementById('teacher-stage-card');
        const studentCard = document.getElementById('student-stage-card');
        if (teacherCard) teacherCard.classList.remove('stage-singer-active');
        if (studentCard) studentCard.classList.remove('stage-singer-active');
    }

    function highlightSuspectCard(phase, positionIdx, durationMs) {
        const card = document.querySelector(`#note-suspects-container .suspect-card[data-suspect-index="${positionIdx}"]`);
        if (!card) return;
        const cls = phase === 'teacher' ? 'suspect-demo-teacher' : 'suspect-demo-student';
        card.classList.add(cls);
        setTimeout(() => card.classList.remove(cls), durationMs);
    }

    function beginInputPhase() {
        if (!isPlaying) return;
        setChoicesInputState(true);

        const config = gameLogic.getCurrentLevelConfig();
        const bannerEl = document.getElementById('phase-banner');
        if (bannerEl) {
            bannerEl.textContent = config.mode === 'find_index'
                ? '🔍 まちがえた おんぷを タッチしてね！'
                : '🔍 おなじ？ ちがう？ タッチしてね！';
            bannerEl.className = 'inline-block bg-amber-500 px-6 py-2 rounded-full shadow-md border-2 border-amber-700 text-lg md:text-2xl font-black text-white animate-bounce';
        }
    }

    function handleAnswerChoice(userChoice, buttonEl) {
        if (!isPlaying || !canChoose || !gameLogic.canAcceptInput()) return;

        const result = gameLogic.submitAnswer(userChoice);
        if (!result) return;

        setChoicesInputState(false);

        if (buttonEl) {
            buttonEl.classList.add('choice-tapped');
            setTimeout(() => buttonEl.classList.remove('choice-tapped'), 150);
        }

        updateHeaderUI();
        revealSuspectCards(result);
        DetectiveAudio.playResultEffect(result.stars);

        clearTimeout(judgmentTimeoutId);
        judgmentTimeoutId = setTimeout(() => {
            showJudgmentPopup(result);
        }, 260);
    }

    function revealSuspectCards(result) {
        const cards = document.querySelectorAll('#note-suspects-container .suspect-card');
        cards.forEach((card, idx) => {
            const labelEl = card.querySelector('.suspect-note-label');
            const studentNote = MelodyDetectiveLogic.SCALE_NOTES[result.studentNotes[idx]];
            if (labelEl && studentNote) {
                labelEl.textContent = studentNote.name;
            }
            if (idx === result.mistakeIndex) {
                card.classList.add('suspect-mistake');
            } else {
                card.classList.add('suspect-correct');
            }
        });
    }

    function showJudgmentPopup(result) {
        const popup = document.getElementById('judgment-popup');
        const starsEl = document.getElementById('judgment-stars');
        const titleEl = document.getElementById('judgment-title');
        const songNameEl = document.getElementById('judgment-song-name');
        const msgEl = document.getElementById('judgment-message');
        const teacherNotesEl = document.getElementById('judgment-teacher-notes');
        const studentNotesEl = document.getElementById('judgment-student-notes');
        const explanationEl = document.getElementById('judgment-explanation');
        const scoreEl = document.getElementById('judgment-score');
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

        if (songNameEl) songNameEl.textContent = result.songTitle;
        if (teacherNotesEl) teacherNotesEl.textContent = gameLogic.formatNoteNames(result.teacherNotes);
        if (studentNotesEl) studentNotesEl.textContent = gameLogic.formatNoteNames(result.studentNotes);

        if (explanationEl) {
            if (!result.isDifferent) {
                explanationEl.textContent = '⭕ ふたりの メロディーは ぴったり おなじ だったよ！';
                explanationEl.className = 'text-sm font-black text-emerald-700 pt-1 text-center';
            } else {
                const idx = result.mistakeIndex;
                const tName = MelodyDetectiveLogic.SCALE_NOTES[result.teacherNotes[idx]]?.name || '?';
                const sName = MelodyDetectiveLogic.SCALE_NOTES[result.studentNotes[idx]]?.name || '?';
                explanationEl.textContent = `🔍 ${idx + 1}ばんめの おと（${tName} → ${sName}）が ちがったよ！`;
                explanationEl.className = 'text-sm font-black text-rose-600 pt-1 text-center';
            }
        }

        if (result.stars === 3) {
            if (titleEl) titleEl.textContent = '🌟 めいたんてい！';
            if (msgEl) msgEl.textContent = 'ちがいを ピタリと みやぶったね！ すごい耳！';
        } else if (result.stars === 2) {
            if (titleEl) titleEl.textContent = '😊 おしい！グッド推理！';
            if (msgEl) msgEl.textContent = 'すぐ となりの おとだったね！ あとすこし！';
        } else {
            if (titleEl) titleEl.textContent = '💪 がんばろう！';
            if (msgEl) msgEl.textContent = 'もういちど ふたりの うたを ききくらべてみよう！';
        }

        if (scoreEl) {
            scoreEl.textContent = `+${result.score}`;
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
        const lastDiff = localStorage.getItem('melodyDetectiveDifficulty') || 'easy';
        window.ScoreManager.showLeaderboardModal(
            `007_melody_detective_${lastDiff}`,
            null,
            [],
            [
                { label: 'かんたん', gameId: '007_melody_detective_easy' },
                { label: 'ふつう', gameId: '007_melody_detective_normal' },
                { label: 'むずかしい', gameId: '007_melody_detective_hard' }
            ]
        );
    }

    async function endGame() {
        isPlaying = false;
        setChoicesInputState(false);
        DetectiveAudio.stopDemo();
        clearTimeout(introTimeoutId);
        clearTimeout(judgmentTimeoutId);

        const judgmentPopup = document.getElementById('judgment-popup');
        if (judgmentPopup) judgmentPopup.classList.add('hidden');

        const res = document.getElementById('result-screen');

        if (window.ScoreManager) {
            const difficulty = gameLogic.getDifficultyCategory(selectedStartLevel);
            const gameId = `007_melody_detective_${difficulty}`;

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
                        { label: 'かんたん', gameId: '007_melody_detective_easy' },
                        { label: 'ふつう', gameId: '007_melody_detective_normal' },
                        { label: 'むずかしい', gameId: '007_melody_detective_hard' }
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

    window.showInstructions = showInstructions;
    window.startGame = startGame;
    window.showHelp = showHelp;
    window.closeHelp = closeHelp;

    document.addEventListener('DOMContentLoaded', () => {
        loadLevelDesign();

        const levelBtns = document.querySelectorAll('.level-select-btn');
        levelBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const lvl = parseInt(btn.dataset.level || '1', 10);
                showInstructions(lvl);
            });
        });

        const startBtn = document.getElementById('instructions-start-button');
        if (startBtn) {
            startBtn.addEventListener('click', startGame);
        }

        const sameBtn = document.getElementById('choice-same-btn');
        if (sameBtn) {
            const onSame = (e) => {
                e.preventDefault();
                handleAnswerChoice('same', sameBtn);
            };
            sameBtn.addEventListener('pointerdown', onSame, { passive: false });
            sameBtn.addEventListener('click', onSame, { passive: false });
        }

        const diffBtn = document.getElementById('choice-diff-btn');
        if (diffBtn) {
            const onDiff = (e) => {
                e.preventDefault();
                handleAnswerChoice('diff', diffBtn);
            };
            diffBtn.addEventListener('pointerdown', onDiff, { passive: false });
            diffBtn.addEventListener('click', onDiff, { passive: false });
        }

        document.addEventListener('keydown', (e) => {
            if (!isPlaying || !canChoose || !gameLogic.canAcceptInput()) return;
            const config = gameLogic.getCurrentLevelConfig();
            if (config.mode === 'same_or_diff') {
                if (e.key === '1' || e.key === 'o' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    handleAnswerChoice('same', sameBtn);
                } else if (e.key === '2' || e.key === 'x' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    handleAnswerChoice('diff', diffBtn);
                }
            } else {
                const num = parseInt(e.key, 10);
                const total = (config.teacherNotes || config.notes || []).length;
                if (num >= 1 && num <= total) {
                    e.preventDefault();
                    const card = document.querySelector(`#note-suspects-container .suspect-card[data-suspect-index="${num - 1}"]`);
                    handleAnswerChoice(num - 1, card);
                }
            }
        });

        const replayBtn = document.getElementById('replay-btn');
        if (replayBtn) {
            replayBtn.addEventListener('click', () => {
                if (!isPlaying) return;
                playCurrentComparisonDemo();
            });
        }

        const finishBtn = document.getElementById('finish-btn');
        if (finishBtn) {
            finishBtn.addEventListener('click', () => {
                if (!isPlaying) return;
                endGame();
            });
        }

        const retryBtn = document.getElementById('retry-level-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                const keepSame = Boolean(gameLogic.lastResult && !gameLogic.lastResult.canAdvance);
                startLevelRound(keepSame);
            });
        }

        const judgmentReplayBtn = document.getElementById('judgment-replay-btn');
        if (judgmentReplayBtn) {
            judgmentReplayBtn.addEventListener('click', () => {
                const config = gameLogic.getCurrentLevelConfig();
                DetectiveAudio.playComparisonDemo(config.teacherNotes, config.studentNotes, {
                    sound: activeSound,
                    noteDurationMs: config.noteDurationMs,
                    gapBetweenPhrasesMs: config.gapBetweenPhrasesMs,
                    transposeSemitones: config.transposeSemitones || 0
                });
            });
        }

        const nextBtn = document.getElementById('next-level-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                handleNextLevel();
            });
        }

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
