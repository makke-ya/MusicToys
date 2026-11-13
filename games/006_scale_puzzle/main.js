// games/006_scale_puzzle/main.js

(function() {
    function buildFallbackLevels() {
        const list = [];
        for (let lvl = 1; lvl <= 50; lvl++) {
            const isSort = lvl >= 21;
            const puzzleMode = !isSort ? 'fill_blank' : (lvl % 2 === 1 ? 'sort_asc' : 'sort_desc');
            const notes = !isSort
                ? (lvl <= 10 ? [0, 1, 2] : [0, 1, 2, 3, 4])
                : (puzzleMode === 'sort_asc' ? [0, 1, 2] : [2, 1, 0]);
            const blankCount = !isSort ? (lvl <= 10 ? 1 : 2) : notes.length;
            const distractorCount = !isSort ? 1 : 0;
            const hintMode = lvl <= 12 ? 'full' : (lvl <= 25 ? 'partial' : 'none');

            list.push({
                level: lvl,
                puzzleMode,
                stepCount: notes.length,
                maxNoteIndex: lvl <= 10 ? 3 : 8,
                blankCount,
                distractorCount,
                hintMode,
                maxTransposeSemitones: lvl <= 15 ? 0 : 3,
                noteDurationMs: Math.max(300, Math.round(520 - ((lvl - 1) / 49) * 220)),
                demoCount: lvl <= 8 ? 2 : 1,
                sound: lvl <= 10 ? 'marimba' : lvl <= 20 ? 'musicbox' : lvl <= 30 ? 'piano' : 'synth',
                title: !isSort ? '🪜 のぼり3だん（ド・レ・ミ）' : '🔼 ひくい順3おん（ド・レ・ミ）',
                notes,
                patterns: [
                    { title: '🪜 のぼり3だん（ド・レ・ミ）', notes: [0, 1, 2] },
                    { title: '🛝 くだり3だん（ミ・レ・ド）', notes: [2, 1, 0] },
                    { title: '🐸 かえるの階段（ド・ミ・レ）', notes: [0, 2, 1] },
                    { title: '🌷 チューリップ階段（レ・ミ・ド）', notes: [1, 2, 0] },
                    { title: '🐣 ひよこの階段（ミ・ド・レ）', notes: [2, 0, 1] }
                ]
            });
        }
        return list;
    }

    let gameLogic = new ScalePuzzleLogic(buildFallbackLevels());
    let selectedStartLevel = 1;
    let preferredSound = 'auto';
    let selectedNotationMode = 'movable';
    let activeSound = 'marimba';
    let isPlaying = false;
    let canTapInput = false;
    let introTimeoutId = null;
    let walkTimeouts = [];

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

    function clearWalkTimeouts() {
        walkTimeouts.forEach(id => clearTimeout(id));
        walkTimeouts = [];
    }

    function setBlocksInputState(enabled) {
        canTapInput = Boolean(enabled);
        gameLogic.setInputEnabled(canTapInput);

        const buttons = document.querySelectorAll('#candidate-blocks-container .candidate-block, #candidate-blocks-container .audition-btn');
        buttons.forEach(btn => {
            const isUsed = btn.dataset.used === 'true';
            const shouldDisable = !canTapInput || isUsed;
            btn.disabled = shouldDisable;
            btn.setAttribute('aria-disabled', String(shouldDisable));
            if (!canTapInput) {
                btn.classList.add('block-disabled');
            } else {
                btn.classList.remove('block-disabled');
            }
        });

        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            const canUndo = canTapInput && gameLogic.getFilledBlankCount() > 0;
            undoBtn.disabled = !canUndo;
            if (!canUndo) {
                undoBtn.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                undoBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
    }

    function showInstructions(level) {
        selectedStartLevel = level;
        const difficulty = gameLogic.getDifficultyCategory(level);
        localStorage.setItem('scalePuzzleDifficulty', difficulty);

        const radios = document.getElementsByName('puzzle-sound');
        for (const radio of radios) {
            if (radio.checked) {
                preferredSound = radio.value;
                break;
            }
        }

        const notationRadios = document.getElementsByName('puzzle-notation');
        for (const radio of notationRadios) {
            if (radio.checked) {
                selectedNotationMode = radio.value;
                break;
            }
        }
        gameLogic.setNotationMode(selectedNotationMode);
        updateNotationToggleUI();

        const popup = document.getElementById('instructions-popup');
        if (popup) popup.classList.remove('hidden');
    }

    function updateNotationToggleUI() {
        const mode = gameLogic.getNotationMode();
        const toggleBtn = document.getElementById('notation-toggle-btn');
        if (toggleBtn) {
            if (mode === 'fixed') {
                toggleBtn.innerHTML = '<span>🎹</span> 固定ド';
                toggleBtn.className = 'bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs md:text-sm py-2 px-3 rounded-xl border-b-4 border-pink-700 active:translate-y-0.5 flex items-center gap-1';
            } else {
                toggleBtn.innerHTML = '<span>🏷️</span> 移動ド';
                toggleBtn.className = 'bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs md:text-sm py-2 px-3 rounded-xl border-b-4 border-indigo-700 active:translate-y-0.5 flex items-center gap-1';
            }
        }

        const notationRadios = document.getElementsByName('puzzle-notation');
        for (const radio of notationRadios) {
            radio.checked = (radio.value === mode);
        }

        if (isPlaying) {
            const config = gameLogic.getCurrentLevelConfig();
            const hintEl = document.getElementById('puzzle-hint-text');
            if (hintEl && config.blankIndices) {
                hintEl.textContent = `${config.title} — ${gameLogic.getPuzzleModeLabel(config.puzzleMode, config.blankIndices.length)}`;
            }
        }
    }

    function toggleNotationMode() {
        const nextMode = gameLogic.getNotationMode() === 'movable' ? 'fixed' : 'movable';
        selectedNotationMode = nextMode;
        gameLogic.setNotationMode(nextMode);
        updateNotationToggleUI();
        if (isPlaying) {
            renderStaircase();
            renderCandidateBlocks();
        }
    }

    function startGame() {
        const instructionsPopup = document.getElementById('instructions-popup');
        const startScreen = document.getElementById('start-screen');
        const gameScreen = document.getElementById('game-screen');

        if (instructionsPopup) instructionsPopup.classList.add('hidden');
        if (startScreen) startScreen.classList.add('hidden');
        if (gameScreen) gameScreen.classList.remove('hidden');

        ScalePuzzleAudio.initAudio();
        gameLogic.reset();
        gameLogic.setNotationMode(selectedNotationMode);
        gameLogic.setLevel(selectedStartLevel);
        isPlaying = true;

        updateNotationToggleUI();
        updateHeaderUI();
        startLevelRound();
    }

    function updateHeaderUI() {
        const levelEl = document.getElementById('current-level');
        const scoreEl = document.getElementById('score');
        if (levelEl) levelEl.textContent = gameLogic.level;
        if (scoreEl) scoreEl.textContent = gameLogic.totalScore;
    }

    function renderStaircase() {
        const container = document.getElementById('staircase-container');
        if (!container) return;
        container.innerHTML = '';

        const config = gameLogic.getCurrentLevelConfig();
        const totalSteps = config.notes.length;
        const nextBlankOrdinal = gameLogic.getFilledBlankCount();
        const nextTargetStepIdx = config.blankIndices && nextBlankOrdinal < config.blankIndices.length
            ? config.blankIndices[nextBlankOrdinal]
            : -1;

        for (let stepIdx = 0; stepIdx < totalSteps; stepIdx++) {
            const state = gameLogic.getStepState(stepIdx);
            const stepEl = document.createElement('button');
            stepEl.type = 'button';
            stepEl.dataset.stepIndex = String(stepIdx);

            if (state.filled && state.noteIndex !== null) {
                const scaleNote = ScalePuzzleLogic.SCALE_NOTES[state.noteIndex] || ScalePuzzleLogic.SCALE_NOTES[0];
                const showFullVisual = !state.isBlank || config.hintMode === 'full';
                const heightPct = showFullVisual ? scaleNote.heightPercent : 62;
                const bgClass = showFullVisual ? `${scaleNote.bgClass} ${scaleNote.borderClass} text-white` : 'bg-indigo-500 border-indigo-700 text-white';

                stepEl.className = `stair-step ${bgClass} shadow-md`;
                stepEl.style.height = `${heightPct}%`;

                const badgeEl = document.createElement('span');
                badgeEl.className = 'text-xs font-bold opacity-85 mb-auto pt-0.5 pointer-events-none';
                badgeEl.textContent = state.isBlank ? '🧩' : `${stepIdx + 1}`;

                const nameEl = document.createElement('span');
                nameEl.className = 'text-base md:text-lg font-black drop-shadow pointer-events-none';
                const noteDisplayName = gameLogic.getNoteDisplayName(state.noteIndex, config.transposeSemitones);
                nameEl.textContent = showFullVisual ? noteDisplayName : '♪';

                stepEl.appendChild(badgeEl);
                stepEl.appendChild(nameEl);

                stepEl.addEventListener('click', () => {
                    if (!canTapInput || !gameLogic.canAcceptInput()) return;
                    ScalePuzzleAudio.playNote(state.noteIndex, activeSound, 0.4, config.transposeSemitones || 0);
                });
            } else {
                const isNext = stepIdx === nextTargetStepIdx;
                stepEl.className = `stair-step ${isNext ? 'step-next-target' : 'step-blank-empty'}`;
                stepEl.style.height = '58%';

                const numEl = document.createElement('span');
                numEl.className = 'text-xs font-bold opacity-75 mb-auto pt-0.5 pointer-events-none';
                numEl.textContent = `${stepIdx + 1}だんめ`;

                const qEl = document.createElement('span');
                qEl.className = 'text-2xl md:text-3xl font-black pointer-events-none';
                qEl.textContent = '❓';

                stepEl.appendChild(numEl);
                stepEl.appendChild(qEl);
            }

            container.appendChild(stepEl);
        }

        const totalBlanks = config.blankIndices ? config.blankIndices.length : 1;
        updateInputCounter(gameLogic.getFilledBlankCount(), totalBlanks);
    }

    function renderCandidateBlocks() {
        const container = document.getElementById('candidate-blocks-container');
        if (!container) return;
        container.innerHTML = '';

        const config = gameLogic.getCurrentLevelConfig();
        const candidates = config.candidateBlocks || [];
        const hintMode = config.hintMode || 'full';

        candidates.forEach((cand, idx) => {
            const scaleNote = ScalePuzzleLogic.SCALE_NOTES[cand.noteIndex] || ScalePuzzleLogic.SCALE_NOTES[0];
            const card = document.createElement('div');
            card.className = `candidate-card ${cand.used ? 'candidate-used' : ''}`;
            card.dataset.candidateCardId = cand.id;

            // Audition button ("🔊 きく")
            const auditionBtn = document.createElement('button');
            auditionBtn.type = 'button';
            auditionBtn.className = 'audition-btn';
            auditionBtn.dataset.candidateId = cand.id;
            auditionBtn.dataset.used = String(Boolean(cand.used));
            auditionBtn.textContent = '🔊 きく';

            auditionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (!canTapInput || !gameLogic.canAcceptInput()) return;
                const target = gameLogic.auditionCandidate(cand.id);
                if (!target) return;
                ScalePuzzleAudio.playNote(target.noteIndex, activeSound, 0.45, config.transposeSemitones || 0);
                auditionBtn.classList.add('audition-active');
                setTimeout(() => auditionBtn.classList.remove('audition-active'), 180);
            });

            // Block placement button
            const blockBtn = document.createElement('button');
            blockBtn.type = 'button';
            const colorClass = hintMode === 'none'
                ? 'bg-amber-500 border-amber-700 text-white'
                : `${scaleNote.bgClass} ${scaleNote.borderClass} text-white`;
            blockBtn.className = `candidate-block ${colorClass}`;
            blockBtn.dataset.candidateId = cand.id;
            blockBtn.dataset.candidateOrdinal = String(idx);
            blockBtn.dataset.used = String(Boolean(cand.used));

            if (hintMode !== 'none') {
                const imgWrap = document.createElement('div');
                imgWrap.className = 'w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 flex items-center justify-center shadow-inner overflow-hidden pointer-events-none';
                const img = document.createElement('img');
                img.src = `../../static/images/animals/${scaleNote.animalImg}`;
                img.alt = scaleNote.name;
                img.className = 'w-9 h-9 object-contain pointer-events-none';
                img.onerror = () => { img.remove(); imgWrap.textContent = '🎵'; };
                imgWrap.appendChild(img);
                blockBtn.appendChild(imgWrap);
            } else {
                const iconEl = document.createElement('span');
                iconEl.className = 'text-2xl md:text-3xl pointer-events-none';
                iconEl.textContent = '🧩';
                blockBtn.appendChild(iconEl);
            }

            const labelEl = document.createElement('span');
            labelEl.className = 'text-base md:text-lg font-black drop-shadow pointer-events-none mt-1';
            const candDisplayName = gameLogic.getNoteDisplayName(cand.noteIndex, config.transposeSemitones);
            labelEl.textContent = hintMode === 'full' ? candDisplayName : `ブロック ${idx + 1}`;
            blockBtn.appendChild(labelEl);

            const subEl = document.createElement('span');
            subEl.className = 'text-[11px] font-bold opacity-90 pointer-events-none';
            subEl.textContent = 'タッチではめる';
            blockBtn.appendChild(subEl);

            let lastTrigger = 0;
            const onBlockPress = (e) => {
                e.preventDefault();
                if (!canTapInput || !gameLogic.canAcceptInput()) return;
                const now = Date.now();
                if (now - lastTrigger < 40) return;
                lastTrigger = now;
                handleCandidatePlace(cand.id);
            };

            blockBtn.addEventListener('pointerdown', onBlockPress, { passive: false });
            blockBtn.addEventListener('click', onBlockPress, { passive: false });

            card.appendChild(auditionBtn);
            card.appendChild(blockBtn);
            container.appendChild(card);
        });

        setBlocksInputState(canTapInput);
    }

    function updateInputCounter(current, total) {
        const counterEl = document.getElementById('input-counter-text');
        if (counterEl) {
            counterEl.textContent = `はめたブロック: ${current} / ${total}`;
        }
    }

    function startLevelRound() {
        if (!isPlaying) return;
        ScalePuzzleAudio.stopDemo();
        clearTimeout(introTimeoutId);
        clearWalkTimeouts();

        gameLogic.generateProblem();

        const judgmentPopup = document.getElementById('judgment-popup');
        if (judgmentPopup) judgmentPopup.classList.add('hidden');

        const walkerEl = document.getElementById('walker-animal');
        if (walkerEl) walkerEl.textContent = '🐾';

        const config = gameLogic.getCurrentLevelConfig();
        activeSound = gameLogic.getResolvedSound(preferredSound);
        ScalePuzzleAudio.setSound(activeSound);

        updateHeaderUI();
        renderStaircase();
        renderCandidateBlocks();

        // Lock and gray out candidate blocks during intro and demo
        setBlocksInputState(false);

        const hintEl = document.getElementById('puzzle-hint-text');
        if (hintEl) {
            hintEl.textContent = `${config.title} — ${gameLogic.getPuzzleModeLabel(config.puzzleMode, config.blankIndices.length)}`;
        }

        const bannerEl = document.getElementById('phase-banner');
        if (bannerEl) {
            bannerEl.textContent = '👂 おてほんの かいだんを きいてね！';
            bannerEl.className = 'inline-block bg-gray-200 px-5 py-1.5 rounded-full shadow-md border-2 border-gray-400 text-lg md:text-xl font-black text-gray-700';
        }

        const introPopup = document.getElementById('level-intro-popup');
        const introLevel = document.getElementById('intro-level');
        const introTitle = document.getElementById('intro-puzzle-title');
        const introMode = document.getElementById('intro-puzzle-mode');
        const introHint = document.getElementById('intro-hint-mode');

        if (introLevel) introLevel.textContent = `レベル ${config.level}`;
        if (introTitle) introTitle.textContent = config.title;
        if (introMode) introMode.textContent = gameLogic.getPuzzleModeLabel(config.puzzleMode, config.blankIndices.length);
        if (introHint) introHint.textContent = gameLogic.getHintModeLabel(config.hintMode);

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
        setBlocksInputState(false);
        clearWalkTimeouts();

        const config = gameLogic.getCurrentLevelConfig();
        renderStaircase();
        renderCandidateBlocks();

        const bannerEl = document.getElementById('phase-banner');
        if (bannerEl) {
            bannerEl.textContent = '👂 おてほんの かいだんを きいてね！';
            bannerEl.className = 'inline-block bg-gray-200 px-5 py-1.5 rounded-full shadow-md border-2 border-gray-400 text-lg md:text-xl font-black text-gray-700';
        }

        ScalePuzzleAudio.playDemo(config.notes, {
            sound: activeSound,
            demoCount: config.demoCount || 1,
            noteDurationMs: config.noteDurationMs,
            transposeSemitones: config.transposeSemitones || 0,
            onRoundStart: () => {
                clearStepHighlights();
            },
            onNote: (_, positionIdx) => {
                highlightStep(positionIdx, Math.max(180, config.noteDurationMs - 70));
            },
            onComplete: () => {
                clearStepHighlights();
                beginInputPhase();
            }
        });
    }

    function clearStepHighlights() {
        const steps = document.querySelectorAll('#staircase-container .stair-step');
        steps.forEach(s => s.classList.remove('step-demo-active', 'step-walk-active'));
    }

    function highlightStep(stepIdx, durationMs) {
        const stepEl = document.querySelector(`#staircase-container .stair-step[data-step-index="${stepIdx}"]`);
        if (stepEl) {
            stepEl.classList.add('step-demo-active');
            setTimeout(() => stepEl.classList.remove('step-demo-active'), durationMs);
        }
    }

    function beginInputPhase() {
        if (!isPlaying) return;
        setBlocksInputState(true);
        renderStaircase();
        renderCandidateBlocks();

        const config = gameLogic.getCurrentLevelConfig();
        const bannerEl = document.getElementById('phase-banner');
        if (bannerEl) {
            bannerEl.textContent = config.puzzleMode === 'fill_blank'
                ? '🧩 ききくらべて 空いている かいだんに はめよう！'
                : '🧩 ききくらべて じゅんばん通りに ならべよう！';
            bannerEl.className = 'inline-block bg-amber-500 px-5 py-1.5 rounded-full shadow-md border-2 border-amber-700 text-lg md:text-xl font-black text-white animate-bounce';
        }
    }

    function handleCandidatePlace(candidateId) {
        if (!isPlaying || !canTapInput || !gameLogic.canAcceptInput()) return;

        const config = gameLogic.getCurrentLevelConfig();
        const candidate = gameLogic.auditionCandidate(candidateId);
        if (!candidate || candidate.used) return;

        ScalePuzzleAudio.playNote(candidate.noteIndex, activeSound, 0.38, config.transposeSemitones || 0);

        const placed = gameLogic.placeCandidate(candidateId);
        if (!placed) return;

        renderStaircase();
        renderCandidateBlocks();

        if (gameLogic.isInputComplete()) {
            setBlocksInputState(false);
            setTimeout(finishLevelRound, 260);
        }
    }

    function handleUndo() {
        if (!isPlaying || !canTapInput || !gameLogic.canAcceptInput()) return;
        const undone = gameLogic.undoLastPlacement();
        if (undone) {
            renderStaircase();
            renderCandidateBlocks();
        }
    }

    function finishLevelRound() {
        const result = gameLogic.evaluatePuzzle();
        updateHeaderUI();

        const config = gameLogic.getCurrentLevelConfig();
        const steps = document.querySelectorAll('#staircase-container .stair-step');
        const walkerEl = document.getElementById('walker-animal');
        const stepIntervalMs = 220;

        // Animate animal walking across the completed staircase!
        result.actualNotes.forEach((noteIdx, idx) => {
            const tId = setTimeout(() => {
                if (noteIdx >= 0) {
                    ScalePuzzleAudio.playNote(noteIdx, activeSound, 0.25, config.transposeSemitones || 0);
                }
                const stepEl = steps[idx];
                if (stepEl) {
                    stepEl.classList.add('step-walk-active');
                    if (result.stepJudgments[idx] === 'wrong') {
                        stepEl.classList.add('step-wrong');
                        if (walkerEl) walkerEl.textContent = '💦';
                    } else {
                        stepEl.classList.add('step-correct');
                        if (walkerEl) walkerEl.textContent = '🐾';
                    }
                }
            }, idx * stepIntervalMs);
            walkTimeouts.push(tId);
        });

        const doneTimer = setTimeout(() => {
            if (walkerEl) {
                walkerEl.textContent = result.stars === 3 ? '🎉' : (result.stars === 2 ? '😊' : '💪');
            }
            ScalePuzzleAudio.playResultEffect(result.stars);
            showJudgmentPopup(result);
        }, result.actualNotes.length * stepIntervalMs + 150);
        walkTimeouts.push(doneTimer);
    }

    function showJudgmentPopup(result) {
        const popup = document.getElementById('judgment-popup');
        const starsEl = document.getElementById('judgment-stars');
        const titleEl = document.getElementById('judgment-title');
        const puzzleNameEl = document.getElementById('judgment-puzzle-name');
        const msgEl = document.getElementById('judgment-message');
        const expectedNotesEl = document.getElementById('judgment-expected-notes');
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

        if (puzzleNameEl) {
            puzzleNameEl.textContent = result.puzzleTitle;
        }

        if (expectedNotesEl) {
            expectedNotesEl.textContent = gameLogic.formatNoteNames(result.expectedNotes);
        }

        if (result.stars === 3) {
            if (titleEl) titleEl.textContent = '🌟 パーフェクト！';
            if (msgEl) msgEl.textContent = 'かいだんが ぴったり かんせいして ゴールできたよ！';
        } else if (result.stars === 2) {
            if (titleEl) titleEl.textContent = '😊 グッド！';
            if (msgEl) msgEl.textContent = 'おしい！ でも じょうずに かいだんを つくれたね！';
        } else {
            if (titleEl) titleEl.textContent = '💪 がんばろう！';
            if (msgEl) msgEl.textContent = '🔊「きく」で おとの たかさを くらべて もういちど ちょうせんしよう！';
        }

        if (scoreEl) {
            scoreEl.textContent = `+${result.score}`;
        }

        if (detailsEl) {
            detailsEl.innerHTML = '';
            const config = gameLogic.getCurrentLevelConfig();
            result.blankIndices.forEach((stepIdx) => {
                const badge = document.createElement('span');
                const noteName = gameLogic.getNoteDisplayName(result.actualNotes[stepIdx], config.transposeSemitones);
                const isCorrect = result.stepJudgments[stepIdx] === 'correct';
                if (isCorrect) {
                    badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700';
                    badge.textContent = `${stepIdx + 1}だんめ: ${noteName} ⭕`;
                } else {
                    badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600';
                    badge.textContent = `${stepIdx + 1}だんめ: ${noteName} ❌`;
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
        const lastDiff = localStorage.getItem('scalePuzzleDifficulty') || 'easy';
        window.ScoreManager.showLeaderboardModal(
            `006_scale_puzzle_${lastDiff}`,
            null,
            [],
            [
                { label: 'かんたん', gameId: '006_scale_puzzle_easy' },
                { label: 'ふつう', gameId: '006_scale_puzzle_normal' },
                { label: 'むずかしい', gameId: '006_scale_puzzle_hard' }
            ]
        );
    }

    async function endGame() {
        isPlaying = false;
        setBlocksInputState(false);
        ScalePuzzleAudio.stopDemo();
        clearTimeout(introTimeoutId);
        clearWalkTimeouts();

        const judgmentPopup = document.getElementById('judgment-popup');
        if (judgmentPopup) judgmentPopup.classList.add('hidden');

        const res = document.getElementById('result-screen');

        if (window.ScoreManager) {
            const difficulty = gameLogic.getDifficultyCategory(selectedStartLevel);
            const gameId = `006_scale_puzzle_${difficulty}`;

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
                        { label: 'かんたん', gameId: '006_scale_puzzle_easy' },
                        { label: 'ふつう', gameId: '006_scale_puzzle_normal' },
                        { label: 'むずかしい', gameId: '006_scale_puzzle_hard' }
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

        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', handleUndo);
        }

        const notationToggleBtn = document.getElementById('notation-toggle-btn');
        if (notationToggleBtn) {
            notationToggleBtn.addEventListener('click', toggleNotationMode);
        }

        const notationRadios = document.getElementsByName('puzzle-notation');
        notationRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    selectedNotationMode = radio.value;
                    gameLogic.setNotationMode(selectedNotationMode);
                    updateNotationToggleUI();
                }
            });
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
