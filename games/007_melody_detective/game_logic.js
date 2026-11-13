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
            mode: 'same_or_diff',
            noteCount: 3,
            mistakeDistance: 'large',
            guideMode: 'all',
            allowTranspose: false,
            noteDurationMs: 520,
            gapBetweenPhrasesMs: 750,
            sound: 'marimba',
            baseSong: '🌷 チューリップ（でだし）',
            notes: [0, 1, 2],
            melodies: [
                { title: '🌷 チューリップ（でだし）', notes: [0, 1, 2] },
                { title: '🥖 あつあつパン', notes: [2, 1, 0] },
                { title: '🐸 かえるのうた（ショート）', notes: [0, 2, 4] },
                { title: '🐑 メリーさんのひつじ（ショート）', notes: [2, 1, 2] },
                { title: '🔔 ジングルベル（ショート）', notes: [2, 2, 4] }
            ]
        }
    ];

    class MelodyDetectiveLogic {
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
            this.inputEnabled = true;
            this.currentProblem = null;
            this.lastResult = null;
            this.lastProblemKey = null;
            this.lastMistakeIndex = -1;
            this.sameStreak = 0;
            this.diffStreak = 0;
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
            this.lastResult = null;
        }

        advanceLevel() {
            const maxLevel = this.levelDesigns.length;
            if (this.level >= maxLevel) {
                this.lastResult = null;
                return { completedAll: true, level: this.level };
            }
            this.level += 1;
            this.currentProblem = null;
            this.lastResult = null;
            return { completedAll: false, level: this.level };
        }

        reset() {
            this.level = 1;
            this.totalScore = 0;
            this.inputEnabled = true;
            this.currentProblem = null;
            this.lastResult = null;
            this.lastProblemKey = null;
            this.lastMistakeIndex = -1;
            this.sameStreak = 0;
            this.diffStreak = 0;
        }

        setInputEnabled(enabled) {
            this.inputEnabled = Boolean(enabled);
        }

        canAcceptInput() {
            return this.inputEnabled;
        }

        getCurrentLevelConfig() {
            const found = this.levelDesigns.find(d => d.level === this.level) || this.levelDesigns[0];
            if (this.currentProblem) {
                return Object.assign({}, found, {
                    baseSong: this.currentProblem.title,
                    notes: this.currentProblem.teacherNotes.slice(),
                    teacherNotes: this.currentProblem.teacherNotes.slice(),
                    studentNotes: this.currentProblem.studentNotes.slice(),
                    isDifferent: this.currentProblem.isDifferent,
                    mistakeIndex: this.currentProblem.mistakeIndex,
                    expectedAnswer: this.currentProblem.expectedAnswer,
                    transposeSemitones: this.currentProblem.transposeSemitones
                });
            }
            return found;
        }

        createMistakeMelody(teacherNotes, mistakeIndex, mistakeDistance = 'medium') {
            if (!Array.isArray(teacherNotes) || teacherNotes.length === 0) return [];
            const student = teacherNotes.slice();
            const idx = Math.max(0, Math.min(mistakeIndex, student.length - 1));
            const currentNote = student[idx];
            const maxNote = SCALE_NOTES.length - 1;

            let offsets;
            if (mistakeDistance === 'subtle') {
                offsets = [-1, 1];
            } else if (mistakeDistance === 'large') {
                offsets = [3, -3, 4, -4, 2, -2];
            } else {
                offsets = [2, -2, 1, -1, 3, -3];
            }

            const candidates = [];
            for (const offset of offsets) {
                const candidate = currentNote + offset;
                if (candidate >= 0 && candidate <= maxNote && candidate !== currentNote) {
                    if (mistakeDistance === 'subtle' && Math.abs(offset) !== 1) continue;
                    if (mistakeDistance === 'large' && Math.abs(offset) < 2) continue;
                    candidates.push(candidate);
                }
            }

            if (candidates.length === 0) {
                for (let n = 0; n <= maxNote; n++) {
                    if (n !== currentNote) candidates.push(n);
                }
            }

            const chosen = candidates[Math.floor(Math.random() * candidates.length)];
            student[idx] = chosen;
            return student;
        }

        generateProblem(options = {}) {
            if (options.keepCurrentProblem && this.currentProblem) {
                this.lastResult = null;
                return this.currentProblem;
            }

            const baseConfig = this.levelDesigns.find(d => d.level === this.level) || this.levelDesigns[0];
            const candidates = (Array.isArray(baseConfig.melodies) && baseConfig.melodies.length > 0)
                ? baseConfig.melodies
                : [{ title: baseConfig.baseSong || 'メロディー', notes: baseConfig.notes || [0, 1, 2] }];

            let pool = candidates;
            if (candidates.length > 1 && this.lastProblemKey !== null) {
                const filtered = candidates.filter(c => JSON.stringify(c.notes) !== this.lastProblemKey);
                if (filtered.length > 0) {
                    pool = filtered;
                }
            }

            const picked = pool[Math.floor(Math.random() * pool.length)];
            const teacherNotes = picked.notes.slice();
            const mode = baseConfig.mode || (this.level <= 15 ? 'same_or_diff' : 'find_index');

            let isDifferent;
            if (mode === 'find_index') {
                isDifferent = true;
            } else if (typeof options.forceDifferent === 'boolean') {
                isDifferent = options.forceDifferent;
            } else {
                if (this.sameStreak >= 2) {
                    isDifferent = true;
                } else if (this.diffStreak >= 2) {
                    isDifferent = false;
                } else {
                    isDifferent = Math.random() < 0.55;
                }
            }

            if (isDifferent) {
                this.diffStreak += 1;
                this.sameStreak = 0;
            } else {
                this.sameStreak += 1;
                this.diffStreak = 0;
            }

            let mistakeIndex = -1;
            let studentNotes = teacherNotes.slice();

            if (isDifferent) {
                if (typeof options.mistakeIndex === 'number' && options.mistakeIndex >= 0 && options.mistakeIndex < teacherNotes.length) {
                    mistakeIndex = options.mistakeIndex;
                } else {
                    const possibleIndices = [];
                    for (let i = 0; i < teacherNotes.length; i++) {
                        if (teacherNotes.length > 1 && i === this.lastMistakeIndex) continue;
                        possibleIndices.push(i);
                    }
                    const idxPool = possibleIndices.length > 0 ? possibleIndices : [0];
                    mistakeIndex = idxPool[Math.floor(Math.random() * idxPool.length)];
                }
                studentNotes = this.createMistakeMelody(teacherNotes, mistakeIndex, baseConfig.mistakeDistance);
                this.lastMistakeIndex = mistakeIndex;
            }

            let transposeSemitones = 0;
            if (typeof options.transposeSemitones === 'number') {
                transposeSemitones = options.transposeSemitones;
            } else if (baseConfig.allowTranspose) {
                const shifts = [-3, -2, -1, 1, 2, 3, 4];
                transposeSemitones = shifts[Math.floor(Math.random() * shifts.length)];
            }

            const expectedAnswer = mode === 'same_or_diff'
                ? (isDifferent ? 'diff' : 'same')
                : mistakeIndex;

            this.lastProblemKey = JSON.stringify(teacherNotes);
            this.currentProblem = {
                title: picked.title,
                mode,
                teacherNotes,
                studentNotes,
                isDifferent,
                mistakeIndex,
                expectedAnswer,
                transposeSemitones
            };
            this.lastResult = null;
            return this.currentProblem;
        }

        submitAnswer(userChoice) {
            if (!this.inputEnabled) {
                return null;
            }
            this.inputEnabled = false;
            return this.evaluateAnswer(userChoice);
        }

        evaluateAnswer(userChoice) {
            if (!this.currentProblem) {
                this.generateProblem();
            }
            const baseConfig = this.levelDesigns.find(d => d.level === this.level) || this.levelDesigns[0];
            const problem = this.currentProblem;
            const mode = problem.mode;
            const expectedAnswer = problem.expectedAnswer;

            const isCorrect = userChoice === expectedAnswer;
            let isNearMiss = false;
            if (!isCorrect && mode === 'find_index' && typeof userChoice === 'number') {
                isNearMiss = Math.abs(userChoice - problem.mistakeIndex) === 1;
            }

            let stars = 1;
            let baseScore = 0;
            let perfectBonus = 0;
            const levelBonus = baseConfig.level * 10;

            if (isCorrect) {
                stars = 3;
                baseScore = 300;
                perfectBonus = 100;
            } else if (isNearMiss) {
                stars = 2;
                baseScore = 150;
                perfectBonus = 0;
            }

            const score = baseScore + perfectBonus + levelBonus;
            const canAdvance = stars >= 2;
            this.totalScore += score;

            this.lastResult = {
                level: baseConfig.level,
                mode,
                songTitle: problem.title,
                teacherNotes: problem.teacherNotes.slice(),
                studentNotes: problem.studentNotes.slice(),
                isDifferent: problem.isDifferent,
                mistakeIndex: problem.mistakeIndex,
                expectedAnswer,
                userChoice,
                isCorrect,
                isNearMiss,
                baseScore,
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

        getModeLabel(mode) {
            const m = mode || this.getCurrentLevelConfig().mode;
            if (m === 'same_or_diff') {
                return '⭕❌ おなじ？ ちがう？ クイズ！';
            }
            return '🔍 なんばんめの おとが ちがう？';
        }

        getGuideModeLabel(guideMode) {
            const g = guideMode || this.getCurrentLevelConfig().guideMode;
            if (g === 'ear_only') {
                return '👂 みみだけで ききくらべよう！（名探偵）';
            }
            if (g === 'position_only') {
                return '🔢 おんぷの ばんごうに ちゅうもく！';
            }
            return '🌟 おんぷが ひかって ガイドするよ';
        }

        formatNoteNames(noteIndices) {
            if (!Array.isArray(noteIndices)) return '';
            return noteIndices.map(idx => (SCALE_NOTES[idx] ? SCALE_NOTES[idx].name : '?')).join(' → ');
        }
    }

    MelodyDetectiveLogic.SCALE_NOTES = SCALE_NOTES;
    MelodyDetectiveLogic.VALID_SOUNDS = VALID_SOUNDS;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { MelodyDetectiveLogic };
    } else {
        root.MelodyDetectiveLogic = MelodyDetectiveLogic;
    }
})(typeof window !== 'undefined' ? window : this);
