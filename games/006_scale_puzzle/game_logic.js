(function(root) {
    const VALID_SOUNDS = ['marimba', 'musicbox', 'piano', 'synth'];
    const VALID_NOTATION_MODES = ['movable', 'fixed'];
    const FIXED_PITCH_NAMES = ['ド', 'ド♯', 'レ', 'ミ♭', 'ミ', 'ファ', 'ファ♯', 'ソ', 'ソ♯', 'ラ', 'シ♭', 'シ'];

    const SCALE_NOTES = [
        { index: 0, name: 'ド', midi: 60, freq: 261.63, heightPercent: 32, color: '#ef4444', bgClass: 'bg-red-500', borderClass: 'border-red-700', animalImg: '01_red.png' },
        { index: 1, name: 'レ', midi: 62, freq: 293.66, heightPercent: 41, color: '#eab308', bgClass: 'bg-yellow-400', borderClass: 'border-yellow-600', animalImg: '02_yellow.png' },
        { index: 2, name: 'ミ', midi: 64, freq: 329.63, heightPercent: 50, color: '#22c55e', bgClass: 'bg-green-500', borderClass: 'border-green-700', animalImg: '05_green.png' },
        { index: 3, name: 'ファ', midi: 65, freq: 349.23, heightPercent: 59, color: '#f97316', bgClass: 'bg-orange-500', borderClass: 'border-orange-700', animalImg: '06_orange.png' },
        { index: 4, name: 'ソ', midi: 67, freq: 392.00, heightPercent: 68, color: '#3b82f6', bgClass: 'bg-blue-500', borderClass: 'border-blue-700', animalImg: '03_blue.png' },
        { index: 5, name: 'ラ', midi: 69, freq: 440.00, heightPercent: 78, color: '#a855f7', bgClass: 'bg-purple-500', borderClass: 'border-purple-700', animalImg: '07_purple.png' },
        { index: 6, name: 'シ', midi: 71, freq: 493.88, heightPercent: 88, color: '#ec4899', bgClass: 'bg-pink-500', borderClass: 'border-pink-700', animalImg: '08_pink.png' },
        { index: 7, name: 'ド(高)', midi: 72, freq: 523.25, heightPercent: 98, color: '#06b6d4', bgClass: 'bg-cyan-500', borderClass: 'border-cyan-700', animalImg: '14_lightblue.png' }
    ];

    const DEFAULT_LEVEL_DESIGNS = [
        {
            level: 1,
            puzzleMode: 'fill_blank',
            stepCount: 3,
            maxNoteIndex: 3,
            blankCount: 1,
            distractorCount: 1,
            hintMode: 'full',
            maxTransposeSemitones: 0,
            noteDurationMs: 520,
            demoCount: 2,
            sound: 'marimba',
            title: '🪜 のぼり3だん（ド・レ・ミ）',
            notes: [0, 1, 2],
            patterns: [
                { title: '🪜 のぼり3だん（ド・レ・ミ）', notes: [0, 1, 2] },
                { title: '🛝 くだり3だん（ミ・レ・ド）', notes: [2, 1, 0] },
                { title: '🐸 かえるの階段（ド・ミ・レ）', notes: [0, 2, 1] },
                { title: '🌷 チューリップ階段（レ・ミ・ド）', notes: [1, 2, 0] },
                { title: '🐣 ひよこの階段（ミ・ド・レ）', notes: [2, 0, 1] }
            ]
        }
    ];

    function shuffleArray(arr) {
        const copy = arr.slice();
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = copy[i];
            copy[i] = copy[j];
            copy[j] = tmp;
        }
        return copy;
    }

    class ScalePuzzleLogic {
        constructor(levelDesigns) {
            if (Array.isArray(levelDesigns) && levelDesigns.length > 0) {
                this.levelDesigns = levelDesigns;
            } else if (typeof require !== 'undefined') {
                try {
                    this.levelDesigns = require('./level_design.json');
                } catch (e) {
                    this.levelDesigns = DEFAULT_LEVEL_DESIGNS;
                }
            } else {
                this.levelDesigns = DEFAULT_LEVEL_DESIGNS;
            }

            this.level = 1;
            this.totalScore = 0;
            this.placements = [];
            this.lastResult = null;
            this.inputEnabled = true;
            this.notationMode = 'movable';
            this.currentProblem = null;
            this.lastProblemKey = null;
        }

        setNotationMode(mode) {
            if (VALID_NOTATION_MODES.includes(mode)) {
                this.notationMode = mode;
            } else {
                this.notationMode = 'movable';
            }
            if (this.currentProblem) {
                this._refreshProblemNotation();
            }
            return this.notationMode;
        }

        getNotationMode() {
            return this.notationMode;
        }

        getNoteDisplayName(scaleIndex, transposeSemitones, notationMode) {
            const scaleNote = SCALE_NOTES[scaleIndex];
            if (!scaleNote) return '?';
            const mode = notationMode || this.notationMode || 'movable';
            if (mode === 'movable') {
                return scaleNote.name;
            }
            const t = transposeSemitones !== undefined
                ? transposeSemitones
                : (this.currentProblem ? (this.currentProblem.transposeSemitones || 0) : 0);
            const actualMidi = scaleNote.midi + t;
            const pitchClass = ((actualMidi % 12) + 12) % 12;
            const baseName = FIXED_PITCH_NAMES[pitchClass];
            return actualMidi >= 72 ? `${baseName}(高)` : baseName;
        }

        getFormattedTitle(rawTitle, notes, transposeSemitones, notationMode) {
            const title = rawTitle || 'おとのかいだん';
            const mode = notationMode || this.notationMode || 'movable';
            const t = transposeSemitones !== undefined
                ? transposeSemitones
                : (this.currentProblem ? (this.currentProblem.transposeSemitones || 0) : 0);
            if (mode === 'movable' || t === 0 || !Array.isArray(notes) || notes.length === 0) {
                return title;
            }
            const labelList = notes.map(n => this.getNoteDisplayName(n, t, 'fixed')).join('・');
            if (title.includes('（') && title.includes('）')) {
                return title.replace(/（[^）]*）/, `（${labelList}）`);
            }
            return `${title}（${labelList}）`;
        }

        _refreshProblemNotation() {
            if (!this.currentProblem) return;
            const t = this.currentProblem.transposeSemitones || 0;
            this.currentProblem.notationMode = this.notationMode;
            this.currentProblem.displayNotes = this.currentProblem.notes.map(n =>
                this.getNoteDisplayName(n, t, this.notationMode)
            );
            this.currentProblem.displayTitle = this.getFormattedTitle(
                this.currentProblem.rawTitle || this.currentProblem.title,
                this.currentProblem.notes,
                t,
                this.notationMode
            );
            this.currentProblem.title = this.currentProblem.displayTitle;
            if (Array.isArray(this.currentProblem.candidateBlocks)) {
                this.currentProblem.candidateBlocks.forEach(c => {
                    c.displayName = this.getNoteDisplayName(c.noteIndex, t, this.notationMode);
                });
            }
        }

        getCurrentProblem() {
            if (!this.currentProblem) {
                this.generateProblem();
            }
            this._refreshProblemNotation();
            return this.currentProblem;
        }

        setLevelDesigns(levelDesigns) {
            if (Array.isArray(levelDesigns) && levelDesigns.length > 0) {
                this.levelDesigns = levelDesigns;
            }
        }

        setLevel(level) {
            const maxLevel = this.levelDesigns.length;
            this.level = Math.max(1, Math.min(level, maxLevel));
            this.currentProblem = null;
            this.clearPlacements();
        }

        advanceLevel() {
            const maxLevel = this.levelDesigns.length;
            if (this.level >= maxLevel) {
                this.clearPlacements();
                return { completedAll: true, level: this.level };
            }
            this.level += 1;
            this.currentProblem = null;
            this.clearPlacements();
            return { completedAll: false, level: this.level };
        }

        reset() {
            this.level = 1;
            this.totalScore = 0;
            this.currentProblem = null;
            this.lastProblemKey = null;
            this.inputEnabled = true;
            this.clearPlacements();
        }

        clearPlacements() {
            this.placements = [];
            this.lastResult = null;
            if (this.currentProblem && Array.isArray(this.currentProblem.candidateBlocks)) {
                this.currentProblem.candidateBlocks.forEach(c => {
                    c.used = false;
                });
            }
        }

        setInputEnabled(enabled) {
            this.inputEnabled = Boolean(enabled);
        }

        canAcceptInput() {
            return this.inputEnabled;
        }

        getScaleNotes(maxNoteIndex) {
            const count = maxNoteIndex || this.getCurrentLevelConfig().maxNoteIndex || 3;
            return SCALE_NOTES.slice(0, Math.max(1, Math.min(count, SCALE_NOTES.length)));
        }

        getCurrentLevelConfig() {
            const found = this.levelDesigns.find(d => d.level === this.level) || this.levelDesigns[0];
            if (this.currentProblem) {
                this._refreshProblemNotation();
                return Object.assign({}, found, {
                    title: this.currentProblem.displayTitle || this.currentProblem.title,
                    rawTitle: this.currentProblem.rawTitle || this.currentProblem.title,
                    notes: this.currentProblem.notes.slice(),
                    displayNotes: this.currentProblem.displayNotes.slice(),
                    blankIndices: this.currentProblem.blankIndices.slice(),
                    candidateBlocks: this.currentProblem.candidateBlocks,
                    transposeSemitones: this.currentProblem.transposeSemitones,
                    notationMode: this.notationMode
                });
            }
            return found;
        }

        generateProblem(options = {}) {
            const baseConfig = this.levelDesigns.find(d => d.level === this.level) || this.levelDesigns[0];
            const candidates = (Array.isArray(baseConfig.patterns) && baseConfig.patterns.length > 0)
                ? baseConfig.patterns
                : [{ title: baseConfig.title || 'おとのかいだん', notes: baseConfig.notes || [0, 1, 2] }];

            let pool = candidates;
            if (candidates.length > 1 && this.lastProblemKey !== null) {
                const filtered = candidates.filter(p => !this.lastProblemKey.startsWith(JSON.stringify(p.notes)));
                if (filtered.length > 0) {
                    pool = filtered;
                }
            }

            const picked = pool[Math.floor(Math.random() * pool.length)];
            const notes = picked.notes.slice();
            const stepCount = notes.length;
            const puzzleMode = baseConfig.puzzleMode || 'fill_blank';
            const maxNoteIndex = Math.max(3, baseConfig.maxNoteIndex || 8);

            let blankIndices = [];
            let rawCandidateNotes = [];

            if (puzzleMode === 'fill_blank') {
                const blankCount = Math.max(1, Math.min(baseConfig.blankCount || 1, stepCount - 1));
                const allStepIndices = Array.from({ length: stepCount }, (_, i) => i);
                const shuffledIndices = shuffleArray(allStepIndices);
                blankIndices = shuffledIndices.slice(0, blankCount).sort((a, b) => a - b);

                const missingNotes = blankIndices.map(idx => notes[idx]);
                rawCandidateNotes = missingNotes.slice();

                // Pick distractor notes distinct from missing notes where possible
                const distractorCount = Math.max(1, baseConfig.distractorCount || 1);
                const distractorPool = [];
                for (let n = 0; n < maxNoteIndex; n++) {
                    if (!missingNotes.includes(n)) {
                        distractorPool.push(n);
                    }
                }
                const shuffledDistractors = shuffleArray(distractorPool);
                for (let d = 0; d < distractorCount; d++) {
                    if (d < shuffledDistractors.length) {
                        rawCandidateNotes.push(shuffledDistractors[d]);
                    } else {
                        rawCandidateNotes.push((missingNotes[0] + d + 1) % maxNoteIndex);
                    }
                }
                rawCandidateNotes = shuffleArray(rawCandidateNotes);
            } else {
                // sort_asc or sort_desc: all steps are blanks
                blankIndices = Array.from({ length: stepCount }, (_, i) => i);
                rawCandidateNotes = shuffleArray(notes);
                // Ensure scrambled order is never identical to solved order
                let attempts = 0;
                while (JSON.stringify(rawCandidateNotes) === JSON.stringify(notes) && attempts < 12) {
                    rawCandidateNotes = shuffleArray(notes);
                    attempts++;
                }
                if (JSON.stringify(rawCandidateNotes) === JSON.stringify(notes) && rawCandidateNotes.length >= 2) {
                    const tmp = rawCandidateNotes[0];
                    rawCandidateNotes[0] = rawCandidateNotes[rawCandidateNotes.length - 1];
                    rawCandidateNotes[rawCandidateNotes.length - 1] = tmp;
                }
            }

            const candidateBlocks = rawCandidateNotes.map((noteIdx, idx) => ({
                id: `cand_${idx}_${noteIdx}`,
                index: idx,
                noteIndex: noteIdx,
                used: false
            }));

            const maxTranspose = baseConfig.maxTransposeSemitones || 0;
            const transposeSemitones = options.transposeSemitones !== undefined
                ? options.transposeSemitones
                : (maxTranspose > 0 ? Math.floor(Math.random() * (maxTranspose + 1)) : 0);

            const key = `${JSON.stringify(notes)}_${JSON.stringify(blankIndices)}_${transposeSemitones}`;
            this.lastProblemKey = key;

            this.currentProblem = {
                key,
                rawTitle: picked.title,
                title: picked.title,
                displayTitle: picked.title,
                puzzleMode,
                hintMode: baseConfig.hintMode || 'full',
                notes,
                displayNotes: [],
                blankIndices,
                candidateBlocks,
                transposeSemitones,
                notationMode: this.notationMode
            };

            this._refreshProblemNotation();
            this.clearPlacements();
            return this.currentProblem;
        }

        auditionCandidate(candidateId) {
            if (!this.inputEnabled || !this.currentProblem) {
                return null;
            }
            const found = this.currentProblem.candidateBlocks.find(c => c.id === candidateId);
            return found || null;
        }

        placeCandidate(candidateId) {
            if (!this.inputEnabled) {
                return false;
            }
            if (!this.currentProblem) {
                this.generateProblem();
            }
            if (this.isInputComplete()) {
                return false;
            }
            const candidate = this.currentProblem.candidateBlocks.find(c => c.id === candidateId);
            if (!candidate || candidate.used) {
                return false;
            }

            const blankSlotOrdinal = this.placements.length;
            const targetStepIndex = this.currentProblem.blankIndices[blankSlotOrdinal];

            candidate.used = true;
            this.placements.push({
                stepIndex: targetStepIndex,
                candidateId: candidate.id,
                noteIndex: candidate.noteIndex
            });

            return true;
        }

        undoLastPlacement() {
            if (!this.inputEnabled || this.placements.length === 0 || !this.currentProblem) {
                return null;
            }
            const last = this.placements.pop();
            const candidate = this.currentProblem.candidateBlocks.find(c => c.id === last.candidateId);
            if (candidate) {
                candidate.used = false;
                return candidate;
            }
            return null;
        }

        getFilledBlankCount() {
            return this.placements.length;
        }

        isInputComplete() {
            if (!this.currentProblem) return false;
            return this.placements.length >= this.currentProblem.blankIndices.length;
        }

        getStepState(stepIndex) {
            if (!this.currentProblem) {
                this.generateProblem();
            }
            const isBlank = this.currentProblem.blankIndices.includes(stepIndex);
            if (!isBlank) {
                return {
                    stepIndex,
                    isBlank: false,
                    filled: true,
                    noteIndex: this.currentProblem.notes[stepIndex],
                    candidateId: null
                };
            }
            const placement = this.placements.find(p => p.stepIndex === stepIndex);
            if (placement) {
                return {
                    stepIndex,
                    isBlank: true,
                    filled: true,
                    noteIndex: placement.noteIndex,
                    candidateId: placement.candidateId
                };
            }
            return {
                stepIndex,
                isBlank: true,
                filled: false,
                noteIndex: null,
                candidateId: null
            };
        }

        getConstructedSequence() {
            if (!this.currentProblem) {
                this.generateProblem();
            }
            return this.currentProblem.notes.map((_, stepIdx) => {
                const st = this.getStepState(stepIdx);
                return st.filled && st.noteIndex !== null ? st.noteIndex : -1;
            });
        }

        evaluatePuzzle() {
            const constructed = this.getConstructedSequence();
            return this.evaluateStepSequence(constructed);
        }

        evaluateStepSequence(stepNotes) {
            if (!this.currentProblem) {
                this.generateProblem();
            }
            const config = this.getCurrentLevelConfig();
            const expected = this.currentProblem.notes;
            const blankIndices = this.currentProblem.blankIndices;
            const totalBlanks = blankIndices.length;

            const stepJudgments = [];
            let correctCount = 0;
            let wrongCount = 0;

            for (let i = 0; i < expected.length; i++) {
                const actual = (Array.isArray(stepNotes) && i < stepNotes.length) ? stepNotes[i] : -1;
                const isBlank = blankIndices.includes(i);
                if (!isBlank) {
                    stepJudgments.push('fixed');
                } else if (actual === expected[i]) {
                    stepJudgments.push('correct');
                    correctCount++;
                } else {
                    stepJudgments.push('wrong');
                    wrongCount++;
                }
            }

            const noteScore = correctCount * 100;
            const perfectBonus = wrongCount === 0 ? 100 : 0;
            const levelBonus = config.level * 10;
            const score = noteScore + perfectBonus + levelBonus;

            let stars = 1;
            if (wrongCount === 0) {
                stars = 3;
            } else if (correctCount >= Math.ceil(totalBlanks / 2)) {
                stars = 2;
            }

            const canAdvance = stars >= 2;
            this.totalScore += score;

            this.lastResult = {
                level: config.level,
                puzzleTitle: this.currentProblem.title,
                puzzleMode: this.currentProblem.puzzleMode,
                expectedNotes: expected.slice(),
                actualNotes: Array.isArray(stepNotes) ? stepNotes.slice(0, expected.length) : [],
                blankIndices: blankIndices.slice(),
                stepJudgments,
                totalBlanks,
                correctCount,
                wrongCount,
                noteScore,
                perfectBonus,
                levelBonus,
                score,
                stars,
                canAdvance
            };

            return this.lastResult;
        }

        getResolvedSound(preferredSound) {
            if (preferredSound && preferredSound !== 'auto' && VALID_SOUNDS.includes(preferredSound)) {
                return preferredSound;
            }
            const config = this.getCurrentLevelConfig();
            if (config.sound === 'random' || !VALID_SOUNDS.includes(config.sound)) {
                const idx = Math.floor(Math.random() * VALID_SOUNDS.length);
                return VALID_SOUNDS[idx];
            }
            return config.sound;
        }

        getDifficultyCategory(startLevel) {
            const lvl = startLevel !== undefined ? startLevel : this.level;
            if (lvl >= 25) return 'hard';
            if (lvl >= 10) return 'normal';
            return 'easy';
        }

        getPuzzleModeLabel(puzzleMode, blankCount) {
            const mode = puzzleMode || this.getCurrentLevelConfig().puzzleMode;
            const count = blankCount || this.getCurrentLevelConfig().blankCount || 1;
            if (mode === 'sort_asc') {
                return `🔼 ひくい おとから じゅんばんに ${count}こ ならべよう！`;
            }
            if (mode === 'sort_desc') {
                return `🔽 たかい おとから じゅんばんに ${count}こ ならべよう！`;
            }
            return `❓ あいている ${count}この かいだんを うめよう！`;
        }

        getHintModeLabel(hintMode) {
            const mode = hintMode || this.getCurrentLevelConfig().hintMode;
            if (mode === 'none') {
                return '👂 いろヒントなし！ みみで ききくらべよう！';
            }
            if (mode === 'partial') {
                return '✨ おとの たかさを よく きいてね！';
            }
            return '🌟 いろと たかさヒント つき！';
        }

        formatNoteNames(noteIndices, transposeSemitones, notationMode) {
            if (!Array.isArray(noteIndices)) return '';
            const t = transposeSemitones !== undefined
                ? transposeSemitones
                : (this.currentProblem ? (this.currentProblem.transposeSemitones || 0) : 0);
            const mode = notationMode || this.notationMode || 'movable';
            return noteIndices.map(idx => this.getNoteDisplayName(idx, t, mode)).join(' → ');
        }
    }

    ScalePuzzleLogic.SCALE_NOTES = SCALE_NOTES;
    ScalePuzzleLogic.VALID_SOUNDS = VALID_SOUNDS;
    ScalePuzzleLogic.VALID_NOTATION_MODES = VALID_NOTATION_MODES;
    ScalePuzzleLogic.FIXED_PITCH_NAMES = FIXED_PITCH_NAMES;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { ScalePuzzleLogic };
    } else {
        root.ScalePuzzleLogic = ScalePuzzleLogic;
    }
})(typeof window !== 'undefined' ? window : this);
