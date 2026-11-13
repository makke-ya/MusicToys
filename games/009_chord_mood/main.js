// games/009_chord_mood/main.js

(function() {
    function buildFallbackLevels() {
        const list = [];
        for (let lvl = 1; lvl <= 50; lvl++) {
            const padCount = lvl <= 15 ? 2 : (lvl <= 18 || (lvl >= 23 && lvl <= 25) ? 3 : 4);
            const stepCount = lvl <= 22 ? 1 : (lvl <= 30 ? 2 : 3);
            const guideMode = lvl <= 8 ? 'all' : ((lvl >= 23 && lvl <= 26) || (lvl >= 31 && lvl <= 34) ? 'first_only' : 'none');
            const arpeggioHint = lvl <= 12;
            const useSeventh = lvl >= 41;
            const demoCount = lvl <= 6 ? 2 : 1;
            const chordDurationMs = Math.max(480, Math.round(950 - ((lvl - 1) / 49) * 470));
            const allowedInversions = lvl <= 10 ? [0] : (lvl <= 17 ? [0, 1] : [0, 1, 2]);
            const sound = lvl <= 10 ? 'piano' : (lvl <= 20 ? 'musicbox' : (lvl <= 30 ? 'strings' : (lvl <= 40 ? 'organ' : 'random')));

            const progressions = [];
            for (let i = 0; i < 6; i++) {
                const moods = [];
                for (let s = 0; s < stepCount; s++) {
                    moods.push((i + s) % padCount);
                }
                progressions.push({
                    title: i % 2 === 0 ? '☀️ ぽかぽか おひさま' : '🌧️ しとしと あめふり',
                    moods,
                    isVariation: i >= 2
                });
            }

            list.push({
                level: lvl,
                padCount,
                stepCount,
                chordDurationMs,
                demoCount,
                guideMode,
                arpeggioHint,
                useSeventh,
                allowedInversions,
                sound,
                baseStory: progressions[0].title,
                moods: progressions[0].moods,
                progressions
            });
        }
        return list;
    }

    let gameLogic = new ChordMoodGameLogic(buildFallbackLevels());
    let selectedStartLevel = 1;
    let preferredSound = 'auto';
    let activeSound = 'piano';
    let isPlaying = false;
    let canTapInput = false;
    let introTimeoutId = null;

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

    function setPadsInputState(enabled) {
        canTapInput = Boolean(enabled);
        gameLogic.setInputEnabled(canTapInput);

        const pads = document.querySelectorAll('#mood-pads-container .mood-pad');
        pads.forEach(pad => {
            pad.disabled = !canTapInput;
            pad.setAttribute('aria-disabled', String(!canTapInput));
            if (canTapInput) {
                pad.classList.remove('pad-disabled');
            } else {
                pad.classList.add('pad-disabled');
            }
        });
    }

    function setSkyStageTheme(moodIndex) {
        const skyEl = document.getElementById('sky-stage');
        const iconEl = document.getElementById('sky-stage-icon');
        if (!skyEl) return;

        skyEl.classList.remove('sky-sunny', 'sky-rainy', 'sky-stormy', 'sky-aurora');
        const mood = ChordMoodGameLogic.MOOD_PADS[moodIndex];
        if (mood) {
            skyEl.classList.add(mood.skyClass);
            if (iconEl) iconEl.textContent = mood.icon;
        } else {
            skyEl.classList.add('sky-sunny');
            if (iconEl) iconEl.textContent = '☁️';
        }
    }

    function showInstructions(level) {
        selectedStartLevel = level;
        const difficulty = gameLogic.getDifficultyCategory(level);
        localStorage.setItem('chordMoodDifficulty', difficulty);

        const radios = document.getElementsByName('chord-sound');
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

        ChordMoodAudio.initAudio();
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

    function renderMoodPads(config) {
        const container = document.getElementById('mood-pads-container');
        if (!container) return;
        container.innerHTML = '';

        const moodPads = gameLogic.getMoodPads(config.padCount);
        if (config.padCount === 2) {
            container.className = 'grid grid-cols-2 gap-4 md:gap-6 w-full max-w-2xl mx-auto px-2';
        } else if (config.padCount === 3) {
            container.className = 'grid grid-cols-3 gap-3 md:gap-5 w-full max-w-3xl mx-auto px-2';
        } else {
            container.className = 'grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full max-w-4xl mx-auto px-2';
        }

        moodPads.forEach(padInfo => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `mood-pad ${padInfo.bgClass} ${padInfo.borderClass} text-white`;
            btn.dataset.moodIndex = String(padInfo.index);

            const topBadge = document.createElement('div');
            topBadge.className = 'text-3xl md:text-4xl drop-shadow pointer-events-none';
            topBadge.textContent = padInfo.icon;

            const imgWrap = document.createElement('div');
            imgWrap.className = 'w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/90 flex items-center justify-center shadow-inner overflow-hidden pointer-events-none my-1';
            const img = document.createElement('img');
            img.src = `../../static/images/animals/${padInfo.animalImg}`;
            img.alt = padInfo.name;
            img.className = 'w-12 h-12 object-contain pointer-events-none';
            img.onerror = () => { img.remove(); imgWrap.textContent = padInfo.icon; };
            imgWrap.appendChild(img);

            const labelEl = document.createElement('span');
            labelEl.className = 'text-xl md:text-2xl font-black drop-shadow pointer-events-none';
            labelEl.textContent = padInfo.name;

            const subEl = document.createElement('span');
            subEl.className = 'text-xs font-bold text-white/95 pointer-events-none';
            subEl.textContent = padInfo.subtitle;

            let lastTrigger = 0;
            const onPadPress = (e) => {
                e.preventDefault();
                if (!canTapInput || !gameLogic.canAcceptInput()) return;
                const now = Date.now();
                if (now - lastTrigger < 40) return;
                lastTrigger = now;
                handlePadTap(padInfo.index);
            };

            btn.addEventListener('pointerdown', onPadPress, { passive: false });
            btn.addEventListener('mousedown', onPadPress, { passive: false });
            btn.addEventListener('touchstart', onPadPress, { passive: false });

            btn.appendChild(topBadge);
            btn.appendChild(imgWrap);
            btn.appendChild(labelEl);
            btn.appendChild(subEl);
            container.appendChild(btn);
        });
    }

    function renderMoodSlots(config) {
        const container = document.getElementById('mood-slots-container');
        if (!container) return;
        container.innerHTML = '';

        const totalSteps = config.moods.length;
        for (let i = 0; i < totalSteps; i++) {
            const slot = document.createElement('div');
            slot.className = 'mood-slot';
            slot.dataset.slotIndex = String(i);
            slot.textContent = '☁️';
            container.appendChild(slot);
        }

        updateInputCounter(0, totalSteps);
    }

    function updateInputCounter(current, total) {
        const counterEl = document.getElementById('input-counter-text');
        if (counterEl) {
            counterEl.textContent = `タッチ: ${current} / ${total}`;
        }
    }

    function startLevelRound(keepCurrentProblem = false) {
        if (!isPlaying) return;
        ChordMoodAudio.stopDemo();
        clearTimeout(introTimeoutId);

        if (keepCurrentProblem && gameLogic.currentProblem) {
            gameLogic.generateProblem({ keepCurrentProblem: true });
        } else {
            const useDynamic = Math.random() < 0.25;
            gameLogic.generateProblem({ forceDynamicVariation: useDynamic });
        }

        const judgmentPopup = document.getElementById('judgment-popup');
        if (judgmentPopup) judgmentPopup.classList.add('hidden');

        const replayStatusEl = document.getElementById('judgment-replay-status');
        if (replayStatusEl) replayStatusEl.textContent = '';

        const config = gameLogic.getCurrentLevelConfig();
        activeSound = gameLogic.getResolvedSound(preferredSound);
        ChordMoodAudio.setSound(activeSound);

        updateHeaderUI();
        renderMoodPads(config);
        renderMoodSlots(config);
        setSkyStageTheme(-1);

        // Lock and gray out pads during intro and demo
        setPadsInputState(false);

        const storyHintEl = document.getElementById('story-hint-text');
        if (storyHintEl) {
            storyHintEl.textContent = `おてんきテーマ: ${config.baseStory}`;
        }

        const bannerEl = document.getElementById('phase-banner');
        if (bannerEl) {
            bannerEl.textContent = '👂 おてほんを きいてね！';
            bannerEl.className = 'inline-block bg-gray-200 px-6 py-2 rounded-full shadow-md border-2 border-gray-400 text-xl md:text-2xl font-black text-gray-700';
        }

        const introPopup = document.getElementById('level-intro-popup');
        const introLevel = document.getElementById('intro-level');
        const introStory = document.getElementById('intro-story');
        const introStepsCount = document.getElementById('intro-steps-count');
        const introGuideMode = document.getElementById('intro-guide-mode');

        if (introLevel) introLevel.textContent = `レベル ${config.level}`;
        if (introStory) introStory.textContent = config.baseStory;
        if (introStepsCount) {
            introStepsCount.textContent = config.moods.length === 1
                ? '1つの わおん！'
                : `${config.moods.length}れんぞくの わおん！`;
        }
        if (introGuideMode) introGuideMode.textContent = gameLogic.getGuideModeLabel(config.guideMode);

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
        setPadsInputState(false);
        gameLogic.clearMoods();

        const config = gameLogic.getCurrentLevelConfig();
        renderMoodSlots(config);
        setSkyStageTheme(-1);

        const bannerEl = document.getElementById('phase-banner');
        if (bannerEl) {
            bannerEl.textContent = '👂 おてほんを きいてね！';
            bannerEl.className = 'inline-block bg-gray-200 px-6 py-2 rounded-full shadow-md border-2 border-gray-400 text-xl md:text-2xl font-black text-gray-700';
        }

        const totalSteps = config.moods.length;
        const steps = Array.isArray(config.steps) && config.steps.length > 0
            ? config.steps
            : config.moods.map(m => ({
                moodIndex: m,
                midiNotes: gameLogic.buildChordMidiNotes(m, config.rootMidi || 60, {
                    useSeventh: Boolean(config.useSeventh)
                })
            }));

        ChordMoodAudio.playDemo(steps, {
            sound: activeSound,
            demoCount: config.demoCount || 1,
            chordDurationMs: config.chordDurationMs,
            arpeggioHint: Boolean(config.arpeggioHint),
            onRoundStart: () => {
                clearDemoHighlights();
            },
            onStep: (step, positionIdx) => {
                const showVisual = gameLogic.shouldHighlightGuide(positionIdx, totalSteps, config.guideMode);
                highlightDemoSlot(positionIdx, step.moodIndex, showVisual);
                if (showVisual) {
                    setSkyStageTheme(step.moodIndex);
                    highlightDemoPad(step.moodIndex, Math.max(240, config.chordDurationMs - 80));
                }
            },
            onComplete: () => {
                clearDemoHighlights();
                beginInputPhase();
            }
        });
    }

    function clearDemoHighlights() {
        const pads = document.querySelectorAll('#mood-pads-container .mood-pad');
        pads.forEach(p => p.classList.remove('pad-demo-lit'));

        const slots = document.querySelectorAll('#mood-slots-container .mood-slot');
        slots.forEach(s => {
            s.classList.remove('slot-demo-active');
            s.textContent = '☁️';
        });
    }

    function highlightDemoPad(moodIdx, durationMs) {
        const pad = document.querySelector(`#mood-pads-container .mood-pad[data-mood-index="${moodIdx}"]`);
        if (pad) {
            pad.classList.add('pad-demo-lit');
            setTimeout(() => pad.classList.remove('pad-demo-lit'), durationMs);
        }
    }

    function highlightDemoSlot(positionIdx, moodIdx, showVisual) {
        const slots = document.querySelectorAll('#mood-slots-container .mood-slot');
        const slot = slots[positionIdx];
        if (!slot) return;

        const padInfo = ChordMoodGameLogic.MOOD_PADS[moodIdx];
        slot.classList.add('slot-demo-active');
        slot.textContent = showVisual && padInfo ? `${padInfo.icon}${padInfo.name}` : '❓';
    }

    function beginInputPhase() {
        if (!isPlaying) return;
        gameLogic.clearMoods();
        setPadsInputState(true);

        const config = gameLogic.getCurrentLevelConfig();
        updateInputCounter(0, config.moods.length);

        const bannerEl = document.getElementById('phase-banner');
        if (bannerEl) {
            bannerEl.textContent = '☀️ どんな きもちかな？ タッチしてね！';
            bannerEl.className = 'inline-block bg-sky-600 px-6 py-2 rounded-full shadow-md border-2 border-sky-800 text-xl md:text-2xl font-black text-white animate-bounce';
        }
    }

    function handlePadTap(moodIndex) {
        if (!isPlaying || !canTapInput || !gameLogic.canAcceptInput()) return;

        const config = gameLogic.getCurrentLevelConfig();
        const stepIdx = gameLogic.recordedMoods.length;
        const stepInfo = (Array.isArray(config.steps) && config.steps[stepIdx]) ? config.steps[stepIdx] : null;
        const stepRoot = stepInfo ? stepInfo.rootMidi : (config.rootMidi || 60);
        const stepInv = stepInfo ? stepInfo.inversion : 0;

        const midiNotes = gameLogic.buildChordMidiNotes(moodIndex, stepRoot, {
            inversion: stepInv,
            useSeventh: Boolean(config.useSeventh)
        });
        ChordMoodAudio.playChord(midiNotes, activeSound, 0.55, {
            arpeggioHint: false
        });
        setSkyStageTheme(moodIndex);

        const pad = document.querySelector(`#mood-pads-container .mood-pad[data-mood-index="${moodIndex}"]`);
        if (pad) {
            pad.classList.add('pad-tapped');
            setTimeout(() => pad.classList.remove('pad-tapped'), 150);
        }

        const count = gameLogic.recordMood(moodIndex);
        updateInputCounter(count, config.moods.length);

        const slots = document.querySelectorAll('#mood-slots-container .mood-slot');
        const slot = slots[count - 1];
        const padInfo = ChordMoodGameLogic.MOOD_PADS[moodIndex];
        if (slot && padInfo) {
            slot.classList.add('slot-filled');
            slot.textContent = `${padInfo.icon}${padInfo.name}`;
        }

        if (gameLogic.isInputComplete()) {
            setPadsInputState(false);
            setTimeout(finishLevelRound, 340);
        }
    }

    function finishLevelRound() {
        const result = gameLogic.evaluateRecordedMoods();
        updateHeaderUI();

        const slots = document.querySelectorAll('#mood-slots-container .mood-slot');
        result.judgments.forEach((j, idx) => {
            if (!slots[idx]) return;
            slots[idx].classList.remove('slot-filled');
            if (j === 'correct') {
                slots[idx].classList.add('slot-correct');
            } else {
                slots[idx].classList.add('slot-wrong');
            }
        });

        ChordMoodAudio.playResultEffect(result.stars);
        showJudgmentPopup(result);
    }

    function replayExpectedInPopup() {
        const replayData = gameLogic.getComparisonReplayData();
        const expectedSteps = replayData.expectedSteps || [];
        if (expectedSteps.length === 0) return;

        const statusEl = document.getElementById('judgment-replay-status');
        const config = gameLogic.getCurrentLevelConfig();

        ChordMoodAudio.playDemo(expectedSteps, {
            sound: activeSound,
            demoCount: 1,
            chordDurationMs: Math.max(700, config.chordDurationMs || 750),
            arpeggioHint: true,
            onStep: (step, idx) => {
                setSkyStageTheme(step.moodIndex);
                if (statusEl) {
                    statusEl.textContent = `🔊 せいかいの わおん (${idx + 1}/${expectedSteps.length}): ${step.moodIcon || ''}${step.moodName || ''}`;
                }
            },
            onComplete: () => {
                if (statusEl) {
                    statusEl.textContent = '✨ せいかいの わおんを さいせいしました';
                }
            }
        });
    }

    function replayComparisonInPopup() {
        const replayData = gameLogic.getComparisonReplayData();
        const actualSteps = replayData.actualSteps || [];
        const expectedSteps = replayData.expectedSteps || [];
        if (expectedSteps.length === 0) return;

        const statusEl = document.getElementById('judgment-replay-status');
        const combinedSteps = [];

        actualSteps.forEach((s, idx) => {
            if (Array.isArray(s.midiNotes) && s.midiNotes.length > 0) {
                combinedSteps.push({
                    moodIndex: s.moodIndex,
                    midiNotes: s.midiNotes,
                    label: `👂 あなたの選択 (${idx + 1}): ${s.moodIcon}${s.moodName}`
                });
            }
        });

        expectedSteps.forEach((s, idx) => {
            combinedSteps.push({
                moodIndex: s.moodIndex,
                midiNotes: s.midiNotes,
                label: `⭕ せいかい (${idx + 1}): ${s.moodIcon}${s.moodName}`
            });
        });

        ChordMoodAudio.playDemo(combinedSteps, {
            sound: activeSound,
            demoCount: 1,
            chordDurationMs: 780,
            arpeggioHint: true,
            onStep: (step) => {
                setSkyStageTheme(step.moodIndex);
                if (statusEl && step.label) {
                    statusEl.textContent = step.label;
                }
            },
            onComplete: () => {
                if (statusEl) {
                    statusEl.textContent = '✨ あなたの選択 → せいかい の順で聴き比べました';
                }
            }
        });
    }

    function showJudgmentPopup(result) {
        const popup = document.getElementById('judgment-popup');
        const starsEl = document.getElementById('judgment-stars');
        const titleEl = document.getElementById('judgment-title');
        const storyNameEl = document.getElementById('judgment-story-name');
        const msgEl = document.getElementById('judgment-message');
        const expectedMoodsEl = document.getElementById('judgment-expected-moods');
        const scoreEl = document.getElementById('judgment-score');
        const detailsEl = document.getElementById('judgment-details');
        const nextBtn = document.getElementById('next-level-btn');
        const retryBtn = document.getElementById('retry-level-btn');
        const replayActualBtn = document.getElementById('judgment-replay-actual-btn');
        const replayStatusEl = document.getElementById('judgment-replay-status');

        if (replayStatusEl) {
            replayStatusEl.textContent = result.wrongCount > 0
                ? '💡 「もういちど わおんを きく」で響きをたしかめてみよう！'
                : '';
        }

        if (replayActualBtn) {
            if (result.wrongCount > 0) {
                replayActualBtn.classList.remove('hidden');
            } else {
                replayActualBtn.classList.add('hidden');
            }
        }

        if (retryBtn) {
            retryBtn.textContent = result.wrongCount > 0
                ? '🔄 おなじ もんだいに ちょうせん'
                : '🔄 もういちど';
        }

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

        if (storyNameEl) {
            storyNameEl.textContent = result.storyTitle;
        }

        if (expectedMoodsEl) {
            expectedMoodsEl.textContent = gameLogic.formatMoodNames(result.expectedMoods);
        }

        if (result.stars === 3) {
            if (titleEl) titleEl.textContent = '🌟 パーフェクト！';
            if (msgEl) msgEl.textContent = 'わおんの きもちが ピッタリわかったね！';
        } else if (result.stars === 2) {
            if (titleEl) titleEl.textContent = '😊 グッド！';
            if (msgEl) msgEl.textContent = 'おしい！ リプレイで わおんを ききくらべてみよう！';
        } else {
            if (titleEl) titleEl.textContent = '💪 がんばろう！';
            if (msgEl) msgEl.textContent = '下のボタンで わおんを ききなおして、おなじ問題に再挑戦しよう！';
        }

        if (scoreEl) {
            scoreEl.textContent = `+${result.score}`;
        }

        if (detailsEl) {
            detailsEl.innerHTML = '';
            result.judgments.forEach((j, idx) => {
                const badge = document.createElement('button');
                badge.type = 'button';
                const actualPad = ChordMoodGameLogic.MOOD_PADS[result.actualMoods[idx]];
                const expectedPad = ChordMoodGameLogic.MOOD_PADS[result.expectedMoods[idx]];
                const actualLabel = actualPad ? `${actualPad.icon}${actualPad.name}` : '?';
                const expectedLabel = expectedPad ? `${expectedPad.icon}${expectedPad.name}` : '?';

                if (j === 'correct') {
                    badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300';
                    badge.textContent = `${idx + 1}: ${actualLabel} ⭕`;
                } else {
                    badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-300';
                    badge.textContent = `${idx + 1}: ${actualLabel} ❌ (正解:${expectedLabel})`;
                }

                badge.addEventListener('click', () => {
                    const stepData = result.expectedSteps && result.expectedSteps[idx];
                    if (stepData && Array.isArray(stepData.midiNotes)) {
                        ChordMoodAudio.playChord(stepData.midiNotes, activeSound, 0.7, { arpeggioHint: true });
                    }
                });

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
        const lastDiff = localStorage.getItem('chordMoodDifficulty') || 'easy';
        window.ScoreManager.showLeaderboardModal(
            `009_chord_mood_${lastDiff}`,
            null,
            [],
            [
                { label: 'かんたん', gameId: '009_chord_mood_easy' },
                { label: 'ふつう', gameId: '009_chord_mood_normal' },
                { label: 'むずかしい', gameId: '009_chord_mood_hard' }
            ]
        );
    }

    async function endGame() {
        isPlaying = false;
        setPadsInputState(false);
        ChordMoodAudio.stopDemo();
        clearTimeout(introTimeoutId);

        const judgmentPopup = document.getElementById('judgment-popup');
        if (judgmentPopup) judgmentPopup.classList.add('hidden');

        const res = document.getElementById('result-screen');

        if (window.ScoreManager) {
            const difficulty = gameLogic.getDifficultyCategory(selectedStartLevel);
            const gameId = `009_chord_mood_${difficulty}`;

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
                        { label: 'かんたん', gameId: '009_chord_mood_easy' },
                        { label: 'ふつう', gameId: '009_chord_mood_normal' },
                        { label: 'むずかしい', gameId: '009_chord_mood_hard' }
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

        // Keyboard number keys 1-4 support
        document.addEventListener('keydown', (e) => {
            if (!isPlaying || !canTapInput || !gameLogic.canAcceptInput()) return;
            const num = parseInt(e.key, 10);
            const config = gameLogic.getCurrentLevelConfig();
            if (num >= 1 && num <= config.padCount) {
                e.preventDefault();
                handlePadTap(num - 1);
            }
        });

        const replayBtn = document.getElementById('replay-btn');
        if (replayBtn) {
            replayBtn.addEventListener('click', () => {
                if (!isPlaying) return;
                playCurrentDemo();
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
                startLevelRound(true);
            });
        }

        const judgmentReplayBtn = document.getElementById('judgment-replay-btn');
        if (judgmentReplayBtn) {
            judgmentReplayBtn.addEventListener('click', () => {
                replayExpectedInPopup();
            });
        }

        const judgmentReplayActualBtn = document.getElementById('judgment-replay-actual-btn');
        if (judgmentReplayActualBtn) {
            judgmentReplayActualBtn.addEventListener('click', () => {
                replayComparisonInPopup();
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
