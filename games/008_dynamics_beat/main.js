// games/008_dynamics_beat/main.js

(function() {
    function buildFallbackLevels() {
        const list = [];
        for (let lvl = 1; lvl <= 50; lvl++) {
            const padCount = lvl <= 20 ? 2 : 3;
            const guideMode = lvl <= 10 ? 'all' : (lvl <= 15 ? 'partial' : (lvl <= 25 ? 'first_only' : 'none'));
            const demoCount = lvl <= 10 ? 2 : 1;
            const beatDurationMs = Math.max(300, Math.round(580 - ((lvl - 1) / 49) * 280));
            const contrastScale = lvl <= 35 ? 1.0 : (lvl <= 44 ? 0.85 : 0.72);
            const patterns = padCount === 2
                ? [
                    { title: '🦁 ドン・トッ（2びょうし）', pattern: ['f', 'p'], meter: '2拍子', isVariation: false },
                    { title: '🐭 トッ・ドン（よわい→つよい）', pattern: ['p', 'f'], meter: '2拍子', isVariation: true },
                    { title: '💃 3びょうしの ワルツ（ドン・ト・ト）', pattern: ['f', 'p', 'p'], meter: '3拍子', isVariation: false },
                    { title: '🚶 2びょうし マーチ（ドン・ト・ドン・ト）', pattern: ['f', 'p', 'f', 'p'], meter: '2拍子×2', isVariation: false },
                    { title: '🥁 シンコペーション（ドン・ト・ト・ドン）', pattern: ['f', 'p', 'p', 'f'], meter: '4拍子', isVariation: true }
                ]
                : [
                    { title: '📈 クレッシェンド（トッ→ポン→ドン！）', pattern: ['p', 'mf', 'f'], meter: 'クレッシェンド', isVariation: false },
                    { title: '📉 デクレッシェンド（ドン！→ポン→トッ）', pattern: ['f', 'mf', 'p'], meter: 'デクレッシェンド', isVariation: false },
                    { title: '🎼 ほんかく4びょうし（ドン！・トッ・ポン・トッ）', pattern: ['f', 'p', 'mf', 'p'], meter: '4拍子', isVariation: false },
                    { title: '⛰️ やまがた5拍（トッ→ポン→ドン！→ポン→トッ）', pattern: ['p', 'mf', 'f', 'mf', 'p'], meter: '山型', isVariation: false },
                    { title: '🌊 たにがた5拍（ドン！→ポン→トッ→ポン→ドン！）', pattern: ['f', 'mf', 'p', 'mf', 'f'], meter: '谷型', isVariation: true }
                ];
            list.push({
                level: lvl,
                padCount,
                beatDurationMs,
                demoCount,
                guideMode,
                sound: 'taiko',
                contrastScale,
                baseTitle: patterns[0].title,
                meter: patterns[0].meter,
                pattern: patterns[0].pattern,
                patterns
            });
        }
        return list;
    }

    let gameLogic = new DynamicsGameLogic(buildFallbackLevels());
    let selectedStartLevel = 1;
    let preferredSound = 'auto';
    let activeSound = 'taiko';
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

        const pads = document.querySelectorAll('#drum-pads-container .drum-pad');
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

    function showInstructions(level) {
        selectedStartLevel = level;
        const difficulty = gameLogic.getDifficultyCategory(level);
        localStorage.setItem('dynamicsBeatDifficulty', difficulty);

        const radios = document.getElementsByName('dynamics-sound');
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

        DynamicsAudio.initAudio();
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

    function renderDrumPads(config) {
        const container = document.getElementById('drum-pads-container');
        if (!container) return;
        container.innerHTML = '';

        const pads = gameLogic.getDynamicsPads(config.padCount);

        pads.forEach(padDef => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `drum-pad ${padDef.sizeClass} ${padDef.bgClass} ${padDef.borderClass} text-white`;
            btn.dataset.dynamicId = padDef.id;

            const imgWrap = document.createElement('div');
            const iconSizeClass = padDef.id === 'f'
                ? 'w-16 h-16 md:w-20 md:h-20'
                : (padDef.id === 'mf' ? 'w-14 h-14 md:w-16 md:h-16' : 'w-11 h-11 md:w-14 md:h-14');
            imgWrap.className = `${iconSizeClass} rounded-full bg-white/90 flex items-center justify-center shadow-inner overflow-hidden pointer-events-none`;

            const img = document.createElement('img');
            img.src = `../../static/images/animals/${padDef.animalImg}`;
            img.alt = padDef.name;
            img.className = 'w-4/5 h-4/5 object-contain pointer-events-none';
            img.onerror = () => {
                img.remove();
                imgWrap.textContent = padDef.emoji;
            };
            imgWrap.appendChild(img);

            const labelEl = document.createElement('span');
            const textSizeClass = padDef.id === 'f'
                ? 'text-2xl md:text-3xl'
                : (padDef.id === 'mf' ? 'text-xl md:text-2xl' : 'text-lg md:text-xl');
            labelEl.className = `${textSizeClass} font-black drop-shadow pointer-events-none mt-1`;
            labelEl.textContent = padDef.shortName;

            const subLabelEl = document.createElement('span');
            subLabelEl.className = 'text-xs md:text-sm font-bold text-white/90 pointer-events-none';
            subLabelEl.textContent = padDef.name;

            let lastTrigger = 0;
            const onPadPress = (e) => {
                e.preventDefault();
                if (!canTapInput || !gameLogic.canAcceptInput()) return;
                const now = Date.now();
                if (now - lastTrigger < 40) return;
                lastTrigger = now;
                handlePadTap(padDef.id);
            };

            btn.addEventListener('pointerdown', onPadPress, { passive: false });
            btn.addEventListener('mousedown', onPadPress, { passive: false });
            btn.addEventListener('touchstart', onPadPress, { passive: false });

            btn.appendChild(imgWrap);
            btn.appendChild(labelEl);
            btn.appendChild(subLabelEl);
            container.appendChild(btn);
        });
    }

    function renderBeatSlots(config) {
        const container = document.getElementById('beat-slots-container');
        if (!container) return;
        container.innerHTML = '';

        const totalBeats = config.pattern.length;
        for (let i = 0; i < totalBeats; i++) {
            const slot = document.createElement('div');
            slot.className = 'beat-slot';
            slot.dataset.slotIndex = String(i);
            slot.textContent = '🥁';
            container.appendChild(slot);
        }

        updateInputCounter(0, totalBeats);
    }

    function updateInputCounter(current, total) {
        const counterEl = document.getElementById('input-counter-text');
        if (counterEl) {
            counterEl.textContent = `タッチ: ${current} / ${total}`;
        }
    }

    function startLevelRound() {
        if (!isPlaying) return;
        DynamicsAudio.stopDemo();
        clearTimeout(introTimeoutId);

        const useDynamic = Math.random() < 0.3;
        gameLogic.generateProblem({ forceDynamicVariation: useDynamic });

        const judgmentPopup = document.getElementById('judgment-popup');
        if (judgmentPopup) judgmentPopup.classList.add('hidden');

        const config = gameLogic.getCurrentLevelConfig();
        activeSound = gameLogic.getResolvedSound(preferredSound);
        DynamicsAudio.setSound(activeSound);

        updateHeaderUI();
        renderDrumPads(config);
        renderBeatSlots(config);

        // Lock and gray out pads during intro and demo playback
        setPadsInputState(false);

        const hintEl = document.getElementById('pattern-hint-text');
        if (hintEl) {
            hintEl.textContent = `リズムテーマ: ${config.baseTitle}`;
        }

        const bannerEl = document.getElementById('phase-banner');
        if (bannerEl) {
            bannerEl.textContent = '👂 おてほんを きいてね！';
            bannerEl.className = 'inline-block bg-gray-200 px-6 py-2 rounded-full shadow-md border-2 border-gray-400 text-xl md:text-2xl font-black text-gray-700';
        }

        const introPopup = document.getElementById('level-intro-popup');
        const introLevel = document.getElementById('intro-level');
        const introTitle = document.getElementById('intro-pattern-title');
        const introBeatsCount = document.getElementById('intro-beats-count');
        const introGuideMode = document.getElementById('intro-guide-mode');

        if (introLevel) introLevel.textContent = `レベル ${config.level}`;
        if (introTitle) introTitle.textContent = config.baseTitle;
        if (introBeatsCount) introBeatsCount.textContent = `${config.pattern.length}かいの リズム！`;
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
        gameLogic.clearBeats();

        const config = gameLogic.getCurrentLevelConfig();
        renderBeatSlots(config);

        const bannerEl = document.getElementById('phase-banner');
        if (bannerEl) {
            bannerEl.textContent = '👂 おてほんを きいてね！';
            bannerEl.className = 'inline-block bg-gray-200 px-6 py-2 rounded-full shadow-md border-2 border-gray-400 text-xl md:text-2xl font-black text-gray-700';
        }

        const totalBeats = config.pattern.length;

        DynamicsAudio.playDemo(config.pattern, {
            sound: activeSound,
            demoCount: config.demoCount || 1,
            beatDurationMs: config.beatDurationMs,
            contrastScale: config.contrastScale || 1.0,
            onRoundStart: () => {
                clearDemoHighlights();
            },
            onBeat: (dynamicId, positionIdx) => {
                const showVisual = gameLogic.shouldHighlightGuide(positionIdx, totalBeats, config.guideMode);
                highlightDemoSlot(positionIdx, dynamicId, showVisual);
                if (showVisual) {
                    highlightDemoPad(dynamicId, Math.max(200, config.beatDurationMs - 80));
                }
            },
            onComplete: () => {
                clearDemoHighlights();
                beginInputPhase();
            }
        });
    }

    function clearDemoHighlights() {
        const pads = document.querySelectorAll('#drum-pads-container .drum-pad');
        pads.forEach(p => p.classList.remove('pad-demo-lit'));

        const slots = document.querySelectorAll('#beat-slots-container .beat-slot');
        slots.forEach(s => {
            s.classList.remove('slot-demo-active');
            s.textContent = '🥁';
        });
    }

    function highlightDemoPad(dynamicId, durationMs) {
        const pad = document.querySelector(`#drum-pads-container .drum-pad[data-dynamic-id="${dynamicId}"]`);
        if (pad) {
            pad.classList.add('pad-demo-lit');
            setTimeout(() => pad.classList.remove('pad-demo-lit'), durationMs);
        }
    }

    function highlightDemoSlot(positionIdx, dynamicId, showVisual) {
        const slots = document.querySelectorAll('#beat-slots-container .beat-slot');
        const slot = slots[positionIdx];
        if (!slot) return;

        const def = gameLogic.getDynamicDef(dynamicId);
        slot.classList.add('slot-demo-active');
        slot.textContent = showVisual && def ? def.shortName : '❓';
    }

    function beginInputPhase() {
        if (!isPlaying) return;
        gameLogic.clearBeats();
        setPadsInputState(true);

        const config = gameLogic.getCurrentLevelConfig();
        updateInputCounter(0, config.pattern.length);

        const bannerEl = document.getElementById('phase-banner');
        if (bannerEl) {
            bannerEl.textContent = '🥁 おなじ つよさで たたいてね！';
            bannerEl.className = 'inline-block bg-red-600 px-6 py-2 rounded-full shadow-md border-2 border-red-800 text-xl md:text-2xl font-black text-white animate-bounce';
        }
    }

    function handlePadTap(dynamicId) {
        if (!isPlaying || !canTapInput || !gameLogic.canAcceptInput()) return;

        const config = gameLogic.getCurrentLevelConfig();
        DynamicsAudio.playBeat(dynamicId, activeSound, undefined, config.contrastScale || 1.0);

        const pad = document.querySelector(`#drum-pads-container .drum-pad[data-dynamic-id="${dynamicId}"]`);
        if (pad) {
            pad.classList.add('pad-tapped');
            setTimeout(() => pad.classList.remove('pad-tapped'), 140);
        }

        const count = gameLogic.recordBeat(dynamicId);
        updateInputCounter(count, config.pattern.length);

        const slots = document.querySelectorAll('#beat-slots-container .beat-slot');
        const slot = slots[count - 1];
        const def = gameLogic.getDynamicDef(dynamicId);
        if (slot && def) {
            slot.classList.add(`slot-filled-${dynamicId}`);
            slot.textContent = def.shortName;
        }

        if (gameLogic.isInputComplete()) {
            setPadsInputState(false);
            setTimeout(finishLevelRound, 320);
        }
    }

    function finishLevelRound() {
        const result = gameLogic.evaluateRecordedBeats();
        updateHeaderUI();

        const slots = document.querySelectorAll('#beat-slots-container .beat-slot');
        result.judgments.forEach((j, idx) => {
            if (!slots[idx]) return;
            slots[idx].classList.remove('slot-filled-p', 'slot-filled-mf', 'slot-filled-f');
            if (j === 'correct') {
                slots[idx].classList.add('slot-correct');
            } else {
                slots[idx].classList.add('slot-wrong');
            }
        });

        DynamicsAudio.playResultEffect(result.stars);
        showJudgmentPopup(result);
    }

    function showJudgmentPopup(result) {
        const popup = document.getElementById('judgment-popup');
        const starsEl = document.getElementById('judgment-stars');
        const titleEl = document.getElementById('judgment-title');
        const patternNameEl = document.getElementById('judgment-pattern-name');
        const msgEl = document.getElementById('judgment-message');
        const expectedEl = document.getElementById('judgment-expected-pattern');
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

        if (patternNameEl) {
            patternNameEl.textContent = result.patternTitle;
        }

        if (expectedEl) {
            expectedEl.textContent = gameLogic.formatPatternNames(result.expectedPattern);
        }

        if (result.stars === 3) {
            if (titleEl) titleEl.textContent = '🌟 パーフェクト！';
            if (msgEl) msgEl.textContent = 'つよさも リズムも ぴったんこ！ すごいね！';
        } else if (result.stars === 2) {
            if (titleEl) titleEl.textContent = '😊 グッド！';
            if (msgEl) msgEl.textContent = 'おしい！ でも じょうずに たたけたね！';
        } else {
            if (titleEl) titleEl.textContent = '💪 がんばろう！';
            if (msgEl) msgEl.textContent = 'もういちど おてほんの つよさを きいて ちょうせんしよう！';
        }

        if (scoreEl) {
            scoreEl.textContent = `+${result.score}`;
        }

        if (detailsEl) {
            detailsEl.innerHTML = '';
            result.judgments.forEach((j, idx) => {
                const badge = document.createElement('span');
                const actualDef = DynamicsGameLogic.DYNAMICS_DEFS[result.actualPattern[idx]];
                const beatLabel = actualDef ? actualDef.shortName : '?';
                if (j === 'correct') {
                    badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700';
                    badge.textContent = `${idx + 1}: ${beatLabel} ⭕`;
                } else {
                    badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600';
                    badge.textContent = `${idx + 1}: ${beatLabel} ❌`;
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
        const lastDiff = localStorage.getItem('dynamicsBeatDifficulty') || 'easy';
        window.ScoreManager.showLeaderboardModal(
            `008_dynamics_beat_${lastDiff}`,
            null,
            [],
            [
                { label: 'かんたん', gameId: '008_dynamics_beat_easy' },
                { label: 'ふつう', gameId: '008_dynamics_beat_normal' },
                { label: 'むずかしい', gameId: '008_dynamics_beat_hard' }
            ]
        );
    }

    async function endGame() {
        isPlaying = false;
        setPadsInputState(false);
        DynamicsAudio.stopDemo();
        clearTimeout(introTimeoutId);

        const judgmentPopup = document.getElementById('judgment-popup');
        if (judgmentPopup) judgmentPopup.classList.add('hidden');

        const res = document.getElementById('result-screen');

        if (window.ScoreManager) {
            const difficulty = gameLogic.getDifficultyCategory(selectedStartLevel);
            const gameId = `008_dynamics_beat_${difficulty}`;

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
                        { label: 'かんたん', gameId: '008_dynamics_beat_easy' },
                        { label: 'ふつう', gameId: '008_dynamics_beat_normal' },
                        { label: 'むずかしい', gameId: '008_dynamics_beat_hard' }
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

        // Keyboard number keys 1-3 support
        document.addEventListener('keydown', (e) => {
            if (!isPlaying || !canTapInput || !gameLogic.canAcceptInput()) return;
            const num = parseInt(e.key, 10);
            const config = gameLogic.getCurrentLevelConfig();
            const pads = gameLogic.getDynamicsPads(config.padCount);
            if (num >= 1 && num <= pads.length) {
                e.preventDefault();
                handlePadTap(pads[num - 1].id);
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
                startLevelRound();
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
