(function(root) {
    const VALID_SOUNDS = ['marimba', 'musicbox', 'piano', 'synth'];

    const SCALE_NOTES = [
        { index: 0, name: 'ド', midi: 60, freq: 261.63, color: '#ef4444', bgClass: 'bg-red-500', borderClass: 'border-red-700', animalImg: '01_red.png' },
        { index: 1, name: 'レ', midi: 62, freq: 293.66, color: '#eab308', bgClass: 'bg-yellow-400', borderClass: 'border-yellow-600', animalImg: '02_yellow.png' },
        { index: 2, name: 'ミ', midi: 64, freq: 329.63, color: '#22c55e', bgClass: 'bg-green-500', borderClass: 'border-green-700', animalImg: '05_green.png' },
        { index: 3, name: 'ファ', midi: 65, freq: 349.23, color: '#f97316', bgClass: 'bg-orange-500', borderClass: 'border-orange-700', animalImg: '06_orange.png' },
        { index: 4, name: 'ソ', midi: 67, freq: 392.00, color: '#3b82f6', bgClass: 'bg-blue-500', borderClass: 'border-blue-700', animalImg: '03_blue.png' },
        { index: 5, name: 'ラ', midi: 69, freq: 440.00, color: '#a855f7', bgClass: 'bg-purple-500', borderClass: 'border-purple-700', animalImg: '07_purple.png' },
        { index: 6, name: 'シ', midi: 71, freq: 493.88, color: '#ec4899', bgClass: 'bg-pink-500', borderClass: 'border-pink-700', animalImg: '08_pink.png' },
        { index: 7, name: 'ド(高)', midi: 72, freq: 523.25, color: '#06b6d4', bgClass: 'bg-cyan-500', borderClass: 'border-cyan-700', animalImg: '14_lightblue.png' }
    ];

    const DEFAULT_LEVEL_DESIGNS = [
        {
            level: 1,
            padCount: 3,
            noteDurationMs: 550,
            demoCount: 2,
            guideMode: 'all',
            sound: 'marimba',
            baseSong: '🌷 チューリップ（ほんもの）',
            notes: [0, 1, 2],
            melodies: [
                { title: '🌷 チューリップ（ほんもの）', notes: [0, 1, 2], isVariation: false },
                { title: '🌷 チューリップ（ちょい変え）', notes: [0, 1, 0], isVariation: true },
                { title: '🥖 あつあつパン（ほんもの）', notes: [2, 1, 0], isVariation: false },
                { title: '🥖 あつあつパン（ちょい変え）', notes: [2, 1, 2], isVariation: true },
                { title: '🐸 かえるのうた（でだし）', notes: [0, 2, 1], isVariation: true }
            ]
        }
    ];

    class MelodyGameLogic {
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
            this.recordedNotes = [];
            this.lastResult = null;
            this.inputEnabled = true;
            this.currentProblem = null;
            this.lastMelodyKey = null;
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
            this.clearNotes();
        }

        advanceLevel() {
            const maxLevel = this.levelDesigns.length;
            if (this.level >= maxLevel) {
                this.clearNotes();
                return { completedAll: true, level: this.level };
            }
            this.level += 1;
            this.currentProblem = null;
            this.clearNotes();
            return { completedAll: false, level: this.level };
        }

        reset() {
            this.level = 1;
            this.totalScore = 0;
            this.currentProblem = null;
            this.lastMelodyKey = null;
            this.inputEnabled = true;
            this.clearNotes();
        }

        clearNotes() {
            this.recordedNotes = [];
            this.lastResult = null;
        }

        setInputEnabled(enabled) {
            this.inputEnabled = Boolean(enabled);
        }

        canAcceptInput() {
            return this.inputEnabled;
        }

        getScaleNotes(padCount) {
            const count = padCount || this.getCurrentLevelConfig().padCount || 3;
            return SCALE_NOTES.slice(0, Math.max(1, Math.min(count, SCALE_NOTES.length)));
        }

        getCurrentLevelConfig() {
            const found = this.levelDesigns.find(d => d.level === this.level) || this.levelDesigns[0];
            if (this.currentProblem) {
                return Object.assign({}, found, {
                    notes: this.currentProblem.notes,
                    baseSong: this.currentProblem.title,
                    isVariation: this.currentProblem.isVariation
                });
            }
            return found;
        }

        shouldHighlightGuide(noteIndex, totalNotes, guideMode) {
            const mode = guideMode || this.getCurrentLevelConfig().guideMode || 'all';
            if (mode === 'all') {
                return true;
            }
            if (mode === 'partial') {
                return noteIndex < Math.ceil(totalNotes / 2);
            }
            if (mode === 'first_only') {
                return noteIndex === 0;
            }
            return true;
        }

        createMelodyVariation(baseNotes, padCount) {
            if (!Array.isArray(baseNotes) || baseNotes.length === 0) return [];
            const maxPad = Math.max(2, padCount || 3);
            const result = baseNotes.slice();
            const lastIdx = result.length - 1;
            const currentLast = result[lastIdx];

            // Candidate replacements within [0, maxPad - 1] excluding currentLast
            const candidates = [];
            const offsets = [-1, 1, -2, 2];
            for (const offset of offsets) {
                const next = currentLast + offset;
                if (next >= 0 && next < maxPad && next !== currentLast) {
                    candidates.push(next);
                }
            }
            if (candidates.length === 0) {
                for (let n = 0; n < maxPad; n++) {
                    if (n !== currentLast) candidates.push(n);
                }
            }

            const chosenNote = candidates[Math.floor(Math.random() * candidates.length)];
            result[lastIdx] = chosenNote;
            return result;
        }

        generateProblem(options = {}) {
            const baseConfig = this.levelDesigns.find(d => d.level === this.level) || this.levelDesigns[0];
            const candidates = (Array.isArray(baseConfig.melodies) && baseConfig.melodies.length > 0)
                ? baseConfig.melodies
                : [{ title: baseConfig.baseSong || 'メロディー', notes: baseConfig.notes, isVariation: false }];

            let pool = candidates;
            if (candidates.length > 1 && this.lastMelodyKey !== null) {
                const filtered = candidates.filter(c => JSON.stringify(c.notes) !== this.lastMelodyKey);
                if (filtered.length > 0) {
                    pool = filtered;
                }
            }

            const picked = pool[Math.floor(Math.random() * pool.length)];
            let notes = picked.notes.slice();
            let title = picked.title;
            let isVariation = Boolean(picked.isVariation);

            // Optional dynamic variation on top of a base melody
            if (options.forceDynamicVariation) {
                notes = this.createMelodyVariation(notes, baseConfig.padCount);
                title = title.replace(/（.*）/, '') + '（ちょい変え♪）';
                isVariation = true;
            }

            this.lastMelodyKey = JSON.stringify(notes);
            this.currentProblem = {
                title,
                notes,
                isVariation
            };
            this.clearNotes();
            return this.currentProblem;
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

        getGuideModeLabel(guideMode) {
            const mode = guideMode || this.getCurrentLevelConfig().guideMode;
            if (mode === 'first_only') {
                return '👂 さいしょの1おんだけ ひかるよ（耳コピ！）';
            }
            if (mode === 'partial') {
                return '✨ ぜんはんだけ ひかるよ';
            }
            return '🌟 ぜんぶ ひかるよ';
        }

        formatNoteNames(noteIndices) {
            if (!Array.isArray(noteIndices)) return '';
            return noteIndices.map(idx => (SCALE_NOTES[idx] ? SCALE_NOTES[idx].name : '?')).join(' → ');
        }

        recordNote(noteIndex) {
            if (!this.inputEnabled) {
                return 0;
            }
            this.recordedNotes.push(noteIndex);
            return this.recordedNotes.length;
        }

        isInputComplete() {
            const config = this.getCurrentLevelConfig();
            return this.recordedNotes.length >= config.notes.length;
        }

        evaluateRecordedNotes() {
            return this.evaluateSequence(this.recordedNotes);
        }

        evaluateSequence(userNotes) {
            const config = this.getCurrentLevelConfig();
            const expected = config.notes;
            const totalNotes = expected.length;

            const judgments = [];
            let correctCount = 0;
            let wrongCount = 0;

            for (let i = 0; i < totalNotes; i++) {
                const actual = (Array.isArray(userNotes) && i < userNotes.length) ? userNotes[i] : -1;
                if (actual === expected[i]) {
                    judgments.push('correct');
                    correctCount++;
                } else {
                    judgments.push('wrong');
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
            } else if (correctCount >= Math.ceil(totalNotes / 2)) {
                stars = 2;
            }

            const canAdvance = stars >= 2;
            this.totalScore += score;

            this.lastResult = {
                level: config.level,
                songTitle: config.baseSong,
                expectedNotes: expected.slice(),
                actualNotes: Array.isArray(userNotes) ? userNotes.slice(0, totalNotes) : [],
                judgments,
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
    }

    MelodyGameLogic.SCALE_NOTES = SCALE_NOTES;
    MelodyGameLogic.VALID_SOUNDS = VALID_SOUNDS;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { MelodyGameLogic };
    } else {
        root.MelodyGameLogic = MelodyGameLogic;
    }
})(typeof window !== 'undefined' ? window : this);
