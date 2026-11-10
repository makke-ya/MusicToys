// games/005_melody_memory/main.js

(function() {
    const TIER_MELODIES = {
        lv1_4: [
            { title: '🌷 チューリップ（ほんもの）', notes: [0, 1, 2], isVariation: false },
            { title: '🌷 チューリップ（ちょい変え）', notes: [0, 1, 0], isVariation: true },
            { title: '🥖 あつあつパン（ほんもの）', notes: [2, 1, 0], isVariation: false },
            { title: '🥖 あつあつパン（ちょい変え）', notes: [2, 1, 2], isVariation: true },
            { title: '🐸 かえるのうた（でだし）', notes: [0, 2, 1], isVariation: true }
        ],
        lv5_8: [
            { title: '🐸 かえるのうた（ほんもの）', notes: [0, 1, 2, 1], isVariation: false },
            { title: '🐸 かえるのうた（ちょい変え）', notes: [0, 1, 2, 0], isVariation: true },
            { title: '🐑 メリーさんのひつじ（ほんもの）', notes: [2, 1, 0, 1], isVariation: false },
            { title: '🐑 メリーさんのひつじ（ちょい変え）', notes: [2, 1, 0, 2], isVariation: true },
            { title: '🌷 チューリップ（おりかえし）', notes: [0, 1, 2, 2], isVariation: true }
        ],
        lv9_14: [
            { title: '🦋 ちょうちょ（ほんもの）', notes: [4, 2, 2, 3, 1], isVariation: false },
            { title: '🦋 ちょうちょ（ちょい変え）', notes: [4, 2, 2, 1, 0], isVariation: true },
            { title: '🌷 チューリップ（後半ほんもの）', notes: [4, 2, 1, 0], isVariation: false },
            { title: '🌷 チューリップ（後半ちょい変え）', notes: [4, 2, 1, 2], isVariation: true },
            { title: '🐸 かえるのうた（5おん）', notes: [0, 1, 2, 3, 2], isVariation: false },
            { title: '🐸 かえるのうた（のぼりアレンジ）', notes: [0, 1, 2, 3, 4], isVariation: true }
        ],
        lv15_20: [
            { title: '🐸 かえるのうた（ほんもの）', notes: [0, 1, 2, 3, 2, 1, 0], isVariation: false },
            { title: '🐸 かえるのうた（ちょい変え）', notes: [0, 1, 2, 3, 2, 1, 2], isVariation: true },
            { title: '🦋 ちょうちょ（ほんもの）', notes: [4, 2, 2, 3, 1, 1], isVariation: false },
            { title: '🦋 ちょうちょ（ちょい変え）', notes: [4, 2, 2, 3, 1, 0], isVariation: true },
            { title: '🐑 メリーさんのひつじ（ほんもの）', notes: [2, 1, 0, 1, 2, 2, 2], isVariation: false },
            { title: '🐑 メリーさんのひつじ（ソまでジャンプ）', notes: [2, 1, 0, 1, 2, 2, 4], isVariation: true }
        ],
        lv21_25: [
            { title: '⭐ きらきらぼし（でだし）', notes: [0, 0, 4, 4, 5, 4], isVariation: false },
            { title: '⭐ きらきらぼし（ちょい変え）', notes: [0, 0, 4, 4, 5, 7], isVariation: true },
            { title: '🎵 よろこびのうた（ほんもの）', notes: [2, 2, 3, 4, 4, 3], isVariation: false },
            { title: '🎵 よろこびのうた（ちょい変え）', notes: [2, 2, 3, 4, 5, 4], isVariation: true },
            { title: '🔔 ジングルベル（ほんもの）', notes: [2, 2, 2, 4, 0, 1, 2], isVariation: false },
            { title: '🔔 ジングルベル（ちょい変え）', notes: [2, 2, 2, 4, 0, 1, 0], isVariation: true }
        ],
        lv26_30: [
            { title: '⭐ きらきらぼし（ほんもの）', notes: [0, 0, 4, 4, 5, 5, 4], isVariation: false },
            { title: '⭐ きらきらぼし（ちょい変え）', notes: [0, 0, 4, 4, 5, 4, 2], isVariation: true },
            { title: '🌰 どんぐりころころ（ほんもの）', notes: [4, 4, 2, 3, 4, 5, 4], isVariation: false },
            { title: '🌰 どんぐりころころ（ちょい変え）', notes: [4, 4, 2, 3, 4, 5, 7], isVariation: true },
            { title: '🌉 ロンドンばし（ほんもの）', notes: [4, 5, 4, 3, 2, 3, 4], isVariation: false },
            { title: '🌉 ロンドンばし（ちょい変え）', notes: [4, 5, 4, 3, 2, 1, 0], isVariation: true }
        ],
        lv31_37: [
            { title: '🌷 チューリップ（耳コピ・ほんもの）', notes: [0, 1, 2, 4, 2, 1, 0], isVariation: false },
            { title: '🌷 チューリップ（耳コピ・ちょい変え）', notes: [0, 1, 2, 4, 2, 1, 2], isVariation: true },
            { title: '🌷 チューリップ（レから移調アレンジ）', notes: [1, 2, 3, 5, 3, 2, 1], isVariation: true },
            { title: '🐸 かえるのうた（ファから移調アレンジ）', notes: [3, 4, 5, 6, 5, 4, 3], isVariation: true },
            { title: '🏠 家路・新世界より（ほんもの）', notes: [2, 4, 4, 2, 1, 0], isVariation: false },
            { title: '🏠 家路・新世界より（ちょい変え）', notes: [2, 4, 4, 2, 1, 2], isVariation: true }
        ],
        lv38_44: [
            { title: '🐝 ぶんぶんぶん（ほんもの）', notes: [4, 3, 2, 1, 2, 3, 1, 0], isVariation: false },
            { title: '🐝 ぶんぶんぶん（ちょい変え）', notes: [4, 3, 2, 1, 2, 3, 4, 4], isVariation: true },
            { title: '🕰️ おおきなのっぽの古時計（ほんもの）', notes: [4, 7, 6, 7, 4, 3, 2], isVariation: false },
            { title: '🕰️ おおきなのっぽの古時計（ちょい変え）', notes: [4, 7, 6, 5, 4, 2, 0], isVariation: true },
            { title: '🐻 もりのくまさん（ほんもの）', notes: [4, 3, 2, 4, 7, 4, 2], isVariation: false },
            { title: '🐻 もりのくまさん（ちょい変え）', notes: [4, 3, 2, 4, 5, 4, 7], isVariation: true }
        ],
        lv45_50: [
            { title: '🎵 よろこびのうた（フル・ほんもの）', notes: [2, 2, 3, 4, 4, 3, 2, 1], isVariation: false },
            { title: '🎵 よろこびのうた（フル・ちょい変え）', notes: [2, 2, 3, 4, 5, 4, 2, 0], isVariation: true },
            { title: '⭐ きらきらぼし（後半・ほんもの）', notes: [4, 4, 3, 3, 2, 2, 1, 0], isVariation: false },
            { title: '⭐ きらきらぼし（後半・ちょい変え）', notes: [4, 4, 3, 3, 2, 4, 7, 7], isVariation: true },
            { title: '🌈 ドレミの階段スペシャル（ほんもの）', notes: [0, 1, 2, 3, 4, 5, 6, 7], isVariation: false },
            { title: '🌈 ドレミの階段（折り返しアレンジ）', notes: [0, 2, 4, 7, 6, 4, 2, 0], isVariation: true }
        ]
    };

    function buildFallbackLevels() {
        const list = [];
        for (let lvl = 1; lvl <= 50; lvl++) {
            const padCount = lvl <= 8 ? 3 : (lvl <= 20 ? 5 : 8);
            const guideMode = lvl <= 20 ? 'all' : (lvl <= 30 ? 'partial' : 'first_only');
            const demoCount = lvl <= 10 ? 2 : 1;
            const noteDurationMs = Math.max(280, Math.round(550 - ((lvl - 1) / 49) * 270));
            const melodies = lvl <= 4 ? TIER_MELODIES.lv1_4
                : lvl <= 8 ? TIER_MELODIES.lv5_8
                : lvl <= 14 ? TIER_MELODIES.lv9_14
                : lvl <= 20 ? TIER_MELODIES.lv15_20
                : lvl <= 25 ? TIER_MELODIES.lv21_25
                : lvl <= 30 ? TIER_MELODIES.lv26_30
                : lvl <= 37 ? TIER_MELODIES.lv31_37
                : lvl <= 44 ? TIER_MELODIES.lv38_44
                : TIER_MELODIES.lv45_50;
            const sound = lvl <= 10 ? 'marimba' : lvl <= 20 ? 'musicbox' : lvl <= 30 ? 'piano' : lvl <= 40 ? 'synth' : 'random';
            list.push({
                level: lvl,
                padCount,
                noteDurationMs,
                demoCount,
                guideMode,
                sound,
                baseSong: melodies[0].title,
                notes: melodies[0].notes,
                melodies
            });
        }
        return list;
    }

    let gameLogic = new MelodyGameLogic(buildFallbackLevels());
    let selectedStartLevel = 1;
    let preferredSound = 'auto';
    let activeSound = 'marimba';
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

        const pads = document.querySelectorAll('#melody-pads-container .melody-pad');
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
        localStorage.setItem('melodyMemoryDifficulty', difficulty);

        const radios = document.getElementsByName('melody-sound');
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

        MelodyAudio.initAudio();
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

    function renderMelodyPads(config) {
        const container = document.getElementById('melody-pads-container');
        if (!container) return;
        container.innerHTML = '';

        const scaleNotes = gameLogic.getScaleNotes(config.padCount);
        if (config.padCount <= 3) {
            container.className = 'grid grid-cols-3 gap-4 w-full max-w-xl mx-auto px-2';
        } else if (config.padCount <= 5) {
            container.className = 'grid grid-cols-5 gap-2.5 md:gap-4 w-full max-w-3xl mx-auto px-2';
        } else {
            container.className = 'grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-3 w-full max-w-5xl mx-auto px-2';
        }

        scaleNotes.forEach(note => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `melody-pad ${note.bgClass} ${note.borderClass} text-white`;
            btn.dataset.noteIndex = String(note.index);

            const imgWrap = document.createElement('div');
            imgWrap.className = 'w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/90 flex items-center justify-center shadow-inner overflow-hidden pointer-events-none';
            const img = document.createElement('img');
            img.src = `../../static/images/animals/${note.animalImg}`;
            img.alt = note.name;
            img.className = 'w-12 h-12 object-contain pointer-events-none';
            img.onerror = () => { img.remove(); imgWrap.textContent = '🎵'; };
            imgWrap.appendChild(img);

            const labelEl = document.createElement('span');
            labelEl.className = 'text-xl md:text-2xl font-black drop-shadow pointer-events-none mt-2';
            labelEl.textContent = note.name;

            let lastTrigger = 0;
            const onPadPress = (e) => {
                e.preventDefault();
                if (!canTapInput || !gameLogic.canAcceptInput()) return;
                const now = Date.now();
                if (now - lastTrigger < 40) return;
                lastTrigger = now;
                handlePadTap(note.index);
            };

            btn.addEventListener('pointerdown', onPadPress, { passive: false });
            btn.addEventListener('mousedown', onPadPress, { passive: false });
            btn.addEventListener('touchstart', onPadPress, { passive: false });

            btn.appendChild(imgWrap);
            btn.appendChild(labelEl);
            container.appendChild(btn);
        });
    }

    function renderNoteSlots(config) {
        const container = document.getElementById('note-slots-container');
        if (!container) return;
        container.innerHTML = '';

        const totalNotes = config.notes.length;
        for (let i = 0; i < totalNotes; i++) {
            const slot = document.createElement('div');
            slot.className = 'note-slot';
            slot.dataset.slotIndex = String(i);
            slot.textContent = '♪';
            container.appendChild(slot);
        }

        updateInputCounter(0, totalNotes);
    }

    function updateInputCounter(current, total) {
        const counterEl = document.getElementById('input-counter-text');
        if (counterEl) {
            counterEl.textContent = `タッチ: ${current} / ${total}`;
        }
    }

    function startLevelRound() {
        if (!isPlaying) return;
        MelodyAudio.stopDemo();
        clearTimeout(introTimeoutId);

        // Pick a famous song motif or variation (with 30% chance of extra dynamic variation)
        const useDynamic = Math.random() < 0.3;
        gameLogic.generateProblem({ forceDynamicVariation: useDynamic });

        const judgmentPopup = document.getElementById('judgment-popup');
        if (judgmentPopup) judgmentPopup.classList.add('hidden');

        const config = gameLogic.getCurrentLevelConfig();
        activeSound = gameLogic.getResolvedSound(preferredSound);
        MelodyAudio.setSound(activeSound);

        updateHeaderUI();
        renderMelodyPads(config);
        renderNoteSlots(config);

        // Lock and gray out pads during intro and demo
        setPadsInputState(false);

        const songHintEl = document.getElementById('song-hint-text');
        if (songHintEl) {
            songHintEl.textContent = `曲モチーフ: ${config.baseSong}`;
        }

        const bannerEl = document.getElementById('phase-banner');
        if (bannerEl) {
            bannerEl.textContent = '👂 おてほんを きいてね！';
            bannerEl.className = 'inline-block bg-gray-200 px-6 py-2 rounded-full shadow-md border-2 border-gray-400 text-xl md:text-2xl font-black text-gray-700';
        }

        // Show brief level intro popup
        const introPopup = document.getElementById('level-intro-popup');
        const introLevel = document.getElementById('intro-level');
        const introSong = document.getElementById('intro-song');
        const introNotesCount = document.getElementById('intro-notes-count');
        const introGuideMode = document.getElementById('intro-guide-mode');

        if (introLevel) introLevel.textContent = `レベル ${config.level}`;
        if (introSong) introSong.textContent = config.baseSong;
        if (introNotesCount) introNotesCount.textContent = `${config.notes.length}おんの メロディー！`;
        if (introGuideMode) introGuideMode.textContent = gameLogic.getGuideModeLabel(config.guideMode);

        if (introPopup) {
            introPopup.classList.remove('hidden');
            introTimeoutId = setTimeout(() => {
                introPopup.classList.add('hidden');
                playCurrentDemo();
            }, 1150);
        } else {
            playCurrentDemo();
        }
    }

    function playCurrentDemo() {
        if (!isPlaying) return;
        setPadsInputState(false);
        gameLogic.clearNotes();

        const config = gameLogic.getCurrentLevelConfig();
        renderNoteSlots(config);

        const bannerEl = document.getElementById('phase-banner');
        if (bannerEl) {
            bannerEl.textContent = '👂 おてほんを きいてね！';
            bannerEl.className = 'inline-block bg-gray-200 px-6 py-2 rounded-full shadow-md border-2 border-gray-400 text-xl md:text-2xl font-black text-gray-700';
        }

        const totalNotes = config.notes.length;

        MelodyAudio.playDemo(config.notes, {
            sound: activeSound,
            demoCount: config.demoCount || 1,
            noteDurationMs: config.noteDurationMs,
            onRoundStart: () => {
                clearDemoHighlights();
            },
            onNote: (noteIdx, positionIdx) => {
                const showVisual = gameLogic.shouldHighlightGuide(positionIdx, totalNotes, config.guideMode);
                highlightDemoSlot(positionIdx, noteIdx, showVisual);
                if (showVisual) {
                    highlightDemoPad(noteIdx, Math.max(200, config.noteDurationMs - 80));
                }
            },
            onComplete: () => {
                clearDemoHighlights();
                beginInputPhase();
            }
        });
    }

    function clearDemoHighlights() {
        const pads = document.querySelectorAll('#melody-pads-container .melody-pad');
        pads.forEach(p => p.classList.remove('pad-demo-lit'));

        const slots = document.querySelectorAll('#note-slots-container .note-slot');
        slots.forEach(s => {
            s.classList.remove('slot-demo-active');
            s.textContent = '♪';
        });
    }

    function highlightDemoPad(noteIdx, durationMs) {
        const pad = document.querySelector(`#melody-pads-container .melody-pad[data-note-index="${noteIdx}"]`);
        if (pad) {
            pad.classList.add('pad-demo-lit');
            setTimeout(() => pad.classList.remove('pad-demo-lit'), durationMs);
        }
    }

    function highlightDemoSlot(positionIdx, noteIdx, showVisual) {
        const slots = document.querySelectorAll('#note-slots-container .note-slot');
        const slot = slots[positionIdx];
        if (!slot) return;

        const scaleNote = MelodyGameLogic.SCALE_NOTES[noteIdx];
        slot.classList.add('slot-demo-active');
        slot.textContent = showVisual && scaleNote ? scaleNote.name : '❓';
    }

    function beginInputPhase() {
        if (!isPlaying) return;
        gameLogic.clearNotes();
        setPadsInputState(true);

        const config = gameLogic.getCurrentLevelConfig();
        updateInputCounter(0, config.notes.length);

        const bannerEl = document.getElementById('phase-banner');
        if (bannerEl) {
            bannerEl.textContent = '🎹 おなじ じゅんばんで タッチしてね！';
            bannerEl.className = 'inline-block bg-indigo-600 px-6 py-2 rounded-full shadow-md border-2 border-indigo-800 text-xl md:text-2xl font-black text-white animate-bounce';
        }
    }

    function handlePadTap(noteIndex) {
        if (!isPlaying || !canTapInput || !gameLogic.canAcceptInput()) return;

        MelodyAudio.playNote(noteIndex, activeSound, 0.4);

        const pad = document.querySelector(`#melody-pads-container .melody-pad[data-note-index="${noteIndex}"]`);
        if (pad) {
            pad.classList.add('pad-tapped');
            setTimeout(() => pad.classList.remove('pad-tapped'), 140);
        }

        const count = gameLogic.recordNote(noteIndex);
        const config = gameLogic.getCurrentLevelConfig();
        updateInputCounter(count, config.notes.length);

        const slots = document.querySelectorAll('#note-slots-container .note-slot');
        const slot = slots[count - 1];
        const scaleNote = MelodyGameLogic.SCALE_NOTES[noteIndex];
        if (slot && scaleNote) {
            slot.classList.add('slot-filled');
            slot.textContent = scaleNote.name;
        }

        if (gameLogic.isInputComplete()) {
            setPadsInputState(false);
            setTimeout(finishLevelRound, 320);
        }
    }

    function finishLevelRound() {
        const result = gameLogic.evaluateRecordedNotes();
        updateHeaderUI();

        const slots = document.querySelectorAll('#note-slots-container .note-slot');
        result.judgments.forEach((j, idx) => {
            if (!slots[idx]) return;
            slots[idx].classList.remove('slot-filled');
            if (j === 'correct') {
                slots[idx].classList.add('slot-correct');
            } else {
                slots[idx].classList.add('slot-wrong');
            }
        });

        MelodyAudio.playResultEffect(result.stars);
        showJudgmentPopup(result);
    }

    function showJudgmentPopup(result) {
        const popup = document.getElementById('judgment-popup');
        const starsEl = document.getElementById('judgment-stars');
        const titleEl = document.getElementById('judgment-title');
        const songNameEl = document.getElementById('judgment-song-name');
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

        if (songNameEl) {
            songNameEl.textContent = result.songTitle;
        }

        if (expectedNotesEl) {
            expectedNotesEl.textContent = gameLogic.formatNoteNames(result.expectedNotes);
        }

        if (result.stars === 3) {
            if (titleEl) titleEl.textContent = '🌟 パーフェクト！';
            if (msgEl) msgEl.textContent = 'メロディーぴったんこ！ すごいね！';
        } else if (result.stars === 2) {
            if (titleEl) titleEl.textContent = '😊 グッド！';
            if (msgEl) msgEl.textContent = 'おしい！ でも じょうずに ひけたね！';
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
                const actualNote = MelodyGameLogic.SCALE_NOTES[result.actualNotes[idx]];
                const noteName = actualNote ? actualNote.name : '?';
                if (j === 'correct') {
                    badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700';
                    badge.textContent = `${idx + 1}: ${noteName} ⭕`;
                } else {
                    badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600';
                    badge.textContent = `${idx + 1}: ${noteName} ❌`;
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
        const lastDiff = localStorage.getItem('melodyMemoryDifficulty') || 'easy';
        window.ScoreManager.showLeaderboardModal(
            `005_melody_memory_${lastDiff}`,
            null,
            [],
            [
                { label: 'かんたん', gameId: '005_melody_memory_easy' },
                { label: 'ふつう', gameId: '005_melody_memory_normal' },
                { label: 'むずかしい', gameId: '005_melody_memory_hard' }
            ]
        );
    }

    async function endGame() {
        isPlaying = false;
        setPadsInputState(false);
        MelodyAudio.stopDemo();
        clearTimeout(introTimeoutId);

        const judgmentPopup = document.getElementById('judgment-popup');
        if (judgmentPopup) judgmentPopup.classList.add('hidden');

        const res = document.getElementById('result-screen');

        if (window.ScoreManager) {
            const difficulty = gameLogic.getDifficultyCategory(selectedStartLevel);
            const gameId = `005_melody_memory_${difficulty}`;

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
                        { label: 'かんたん', gameId: '005_melody_memory_easy' },
                        { label: 'ふつう', gameId: '005_melody_memory_normal' },
                        { label: 'むずかしい', gameId: '005_melody_memory_hard' }
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

        // Keyboard number keys 1-8 support
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
