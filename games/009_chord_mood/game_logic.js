(function(root) {
    const VALID_SOUNDS = ['piano', 'musicbox', 'strings', 'organ'];

    const ROOT_MIDI_POOL = [57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68];

    const MOOD_PADS = [
        {
            index: 0,
            id: 'major',
            name: 'はれ',
            subtitle: 'にこにこ・あかるい',
            icon: '☀️',
            triadIntervals: [0, 4, 7],
            seventhIntervals: [0, 4, 7, 11],
            color: '#f59e0b',
            bgClass: 'bg-amber-400',
            borderClass: 'border-amber-600',
            animalImg: '02_yellow.png',
            skyClass: 'sky-sunny'
        },
        {
            index: 1,
            id: 'minor',
            name: 'あめ',
            subtitle: 'しくしく・かなしい',
            icon: '🌧️',
            triadIntervals: [0, 3, 7],
            seventhIntervals: [0, 3, 7, 10],
            color: '#0ea5e9',
            bgClass: 'bg-sky-500',
            borderClass: 'border-sky-700',
            animalImg: '03_blue.png',
            skyClass: 'sky-rainy'
        },
        {
            index: 2,
            id: 'diminished',
            name: 'かみなり',
            subtitle: 'びっくり・ドキドキ',
            icon: '⚡',
            triadIntervals: [0, 3, 6],
            seventhIntervals: [0, 3, 6, 9],
            color: '#a855f7',
            bgClass: 'bg-purple-500',
            borderClass: 'border-purple-700',
            animalImg: '07_purple.png',
            skyClass: 'sky-stormy'
        },
        {
            index: 3,
            id: 'augmented',
            name: 'オーロラ',
            subtitle: 'ふわふわ・ふしぎ',
            icon: '🌈',
            triadIntervals: [0, 4, 8],
            seventhIntervals: [0, 4, 8, 11],
            color: '#ec4899',
            bgClass: 'bg-pink-500',
            borderClass: 'border-pink-700',
            animalImg: '08_pink.png',
            skyClass: 'sky-aurora'
        }
    ];

    const DEFAULT_LEVEL_DESIGNS = [
        {
            level: 1,
            padCount: 2,
            stepCount: 1,
            chordDurationMs: 950,
            demoCount: 2,
            guideMode: 'all',
            arpeggioHint: true,
            useSeventh: false,
            allowedInversions: [0],
            sound: 'piano',
            baseStory: '☀️ ぽかぽか おひさま',
            moods: [0],
            progressions: [
                { title: '☀️ ぽかぽか おひさま', moods: [0], isVariation: false },
                { title: '🌧️ しとしと あめふり', moods: [1], isVariation: false },
                { title: '🌻 ひまわり ニコニコ', moods: [0], isVariation: true },
                { title: '🐸 カエルさんの あまやどり', moods: [1], isVariation: true },
                { title: '☀️ あかるい あさのそら', moods: [0], isVariation: true }
            ]
        }
    ];

    class ChordMoodGameLogic {
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
            this.recordedMoods = [];
            this.lastResult = null;
            this.inputEnabled = true;
            this.currentProblem = null;
            this.lastMoodsKey = null;
            this.lastRootMidi = null;
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
            this.clearMoods();
        }

        advanceLevel() {
            const maxLevel = this.levelDesigns.length;
            if (this.level >= maxLevel) {
                this.clearMoods();
                return { completedAll: true, level: this.level };
            }
            this.level += 1;
            this.currentProblem = null;
            this.clearMoods();
            return { completedAll: false, level: this.level };
        }

        reset() {
            this.level = 1;
            this.totalScore = 0;
            this.currentProblem = null;
            this.lastMoodsKey = null;
            this.lastRootMidi = null;
            this.inputEnabled = true;
            this.clearMoods();
        }

        clearMoods() {
            this.recordedMoods = [];
            this.lastResult = null;
        }

        setInputEnabled(enabled) {
            this.inputEnabled = Boolean(enabled);
        }

        canAcceptInput() {
            return this.inputEnabled;
        }

        getMoodPads(padCount) {
            const count = padCount || this.getCurrentLevelConfig().padCount || 2;
            return MOOD_PADS.slice(0, Math.max(2, Math.min(count, MOOD_PADS.length)));
        }

        getCurrentLevelConfig() {
            const found = this.levelDesigns.find(d => d.level === this.level) || this.levelDesigns[0];
            if (this.currentProblem) {
                return Object.assign({}, found, {
                    moods: this.currentProblem.moods,
                    baseStory: this.currentProblem.title,
                    rootMidi: this.currentProblem.rootMidi,
                    inversions: this.currentProblem.inversions,
                    steps: this.currentProblem.steps,
                    isVariation: this.currentProblem.isVariation
                });
            }
            return Object.assign({}, found, {
                rootMidi: 60,
                inversions: found.moods.map(() => 0)
            });
        }

        buildChordMidiNotes(moodIndex, rootMidi = 60, options = {}) {
            const mood = MOOD_PADS[moodIndex] || MOOD_PADS[0];
            const baseIntervals = options.useSeventh ? mood.seventhIntervals : mood.triadIntervals;
            const notes = baseIntervals.map(semi => rootMidi + semi);
            const invCount = Math.max(0, Math.min(options.inversion || 0, notes.length - 1));

            for (let i = 0; i < invCount; i++) {
                const lowest = notes.shift();
                notes.push(lowest + 12);
            }
            return notes;
        }

        shouldHighlightGuide(stepIndex, totalSteps, guideMode) {
            const mode = guideMode || this.getCurrentLevelConfig().guideMode || 'all';
            if (mode === 'all') {
                return true;
            }
            if (mode === 'first_only') {
                return stepIndex === 0;
            }
            if (mode === 'none') {
                return false;
            }
            return true;
        }

        createProgressionVariation(baseMoods, padCount) {
            if (!Array.isArray(baseMoods) || baseMoods.length === 0) return [];
            const maxPad = Math.max(2, Math.min(padCount || 2, MOOD_PADS.length));
            const result = baseMoods.slice();
            const lastIdx = result.length - 1;
            const currentLast = result[lastIdx];

            const candidates = [];
            for (let m = 0; m < maxPad; m++) {
                if (m !== currentLast) {
                    candidates.push(m);
                }
            }
            const chosen = candidates[Math.floor(Math.random() * candidates.length)];
            result[lastIdx] = chosen;
            return result;
        }

        generateProblem(options = {}) {
            if (options.keepCurrentProblem && this.currentProblem) {
                this.clearMoods();
                return this.currentProblem;
            }

            const baseConfig = this.levelDesigns.find(d => d.level === this.level) || this.levelDesigns[0];
            const candidates = (Array.isArray(baseConfig.progressions) && baseConfig.progressions.length > 0)
                ? baseConfig.progressions
                : [{ title: baseConfig.baseStory || 'おてんきハーモニー', moods: baseConfig.moods, isVariation: false }];

            let pool = candidates;
            if (candidates.length > 1 && this.lastMoodsKey !== null) {
                const filtered = candidates.filter(c => JSON.stringify(c.moods) !== this.lastMoodsKey);
                if (filtered.length > 0) {
                    pool = filtered;
                }
            }

            const picked = pool[Math.floor(Math.random() * pool.length)];
            let moods = picked.moods.slice();
            let title = picked.title;
            let isVariation = Boolean(picked.isVariation);

            if (options.forceDynamicVariation) {
                const varied = this.createProgressionVariation(moods, baseConfig.padCount);
                if (this.lastMoodsKey === null || JSON.stringify(varied) !== this.lastMoodsKey) {
                    moods = varied;
                    title = title + '（サプライズ♪）';
                    isVariation = true;
                }
            }

            // Pick a root MIDI note different from lastRootMidi
            const rootCandidates = ROOT_MIDI_POOL.filter(r => r !== this.lastRootMidi);
            const rootMidi = rootCandidates[Math.floor(Math.random() * rootCandidates.length)];

            const allowedInv = (Array.isArray(baseConfig.allowedInversions) && baseConfig.allowedInversions.length > 0)
                ? baseConfig.allowedInversions
                : [0];
            const inversions = moods.map(() => allowedInv[Math.floor(Math.random() * allowedInv.length)]);

            // Slight root shift between progression steps for musical movement when stepCount > 1
            const stepRootOffsets = [0, 5, 7, 0];
            const steps = moods.map((moodIdx, stepIdx) => {
                const stepOffset = moods.length > 1 ? (stepRootOffsets[stepIdx % stepRootOffsets.length] || 0) : 0;
                const stepRoot = rootMidi + stepOffset;
                const inversion = inversions[stepIdx] || 0;
                const midiNotes = this.buildChordMidiNotes(moodIdx, stepRoot, {
                    inversion,
                    useSeventh: Boolean(baseConfig.useSeventh)
                });
                return {
                    moodIndex: moodIdx,
                    rootMidi: stepRoot,
                    inversion,
                    midiNotes
                };
            });

            this.lastMoodsKey = JSON.stringify(moods);
            this.lastRootMidi = rootMidi;
            this.currentProblem = {
                title,
                moods,
                rootMidi,
                inversions,
                useSeventh: Boolean(baseConfig.useSeventh),
                steps,
                isVariation
            };
            this.clearMoods();
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
            if (mode === 'none') {
                return '👂 ヒントなし！よく きいて あてよう';
            }
            if (mode === 'first_only') {
                return '✨ さいしょの 1つだけ ひかるよ';
            }
            return '🌟 おてほんが ひかるよ';
        }

        formatMoodNames(moodIndices) {
            if (!Array.isArray(moodIndices)) return '';
            return moodIndices.map(idx => {
                const pad = MOOD_PADS[idx];
                return pad ? `${pad.icon}${pad.name}` : '?';
            }).join(' → ');
        }

        recordMood(moodIndex) {
            if (!this.inputEnabled) {
                return 0;
            }
            this.recordedMoods.push(moodIndex);
            return this.recordedMoods.length;
        }

        isInputComplete() {
            const config = this.getCurrentLevelConfig();
            return this.recordedMoods.length >= config.moods.length;
        }

        evaluateRecordedMoods() {
            return this.evaluateSequence(this.recordedMoods);
        }

        evaluateSequence(userMoods) {
            const config = this.getCurrentLevelConfig();
            const expected = config.moods;
            const totalSteps = expected.length;
            const useSeventh = Boolean(config.useSeventh);
            const stepRootOffsets = [0, 5, 7, 0];
            const baseRootMidi = config.rootMidi || 60;

            const judgments = [];
            const expectedSteps = [];
            const actualSteps = [];
            let correctCount = 0;
            let wrongCount = 0;

            for (let i = 0; i < totalSteps; i++) {
                const actual = (Array.isArray(userMoods) && i < userMoods.length) ? userMoods[i] : -1;
                const isCorrect = actual === expected[i];
                if (isCorrect) {
                    judgments.push('correct');
                    correctCount++;
                } else {
                    judgments.push('wrong');
                    wrongCount++;
                }

                const existingStep = (Array.isArray(config.steps) && config.steps[i]) ? config.steps[i] : null;
                const stepOffset = totalSteps > 1 ? (stepRootOffsets[i % stepRootOffsets.length] || 0) : 0;
                const stepRoot = existingStep ? existingStep.rootMidi : (baseRootMidi + stepOffset);
                const stepInv = existingStep ? existingStep.inversion : ((Array.isArray(config.inversions) && config.inversions[i]) || 0);

                const expectedPad = MOOD_PADS[expected[i]] || MOOD_PADS[0];
                const expectedMidiNotes = existingStep && Array.isArray(existingStep.midiNotes)
                    ? existingStep.midiNotes.slice()
                    : this.buildChordMidiNotes(expected[i], stepRoot, { inversion: stepInv, useSeventh });

                expectedSteps.push({
                    stepIndex: i,
                    moodIndex: expected[i],
                    moodName: expectedPad.name,
                    moodIcon: expectedPad.icon,
                    rootMidi: stepRoot,
                    inversion: stepInv,
                    midiNotes: expectedMidiNotes
                });

                const actualPad = MOOD_PADS[actual] || null;
                const actualMidiNotes = actualPad
                    ? this.buildChordMidiNotes(actual, stepRoot, { inversion: stepInv, useSeventh })
                    : [];

                actualSteps.push({
                    stepIndex: i,
                    moodIndex: actual,
                    moodName: actualPad ? actualPad.name : '?',
                    moodIcon: actualPad ? actualPad.icon : '❓',
                    rootMidi: stepRoot,
                    inversion: stepInv,
                    midiNotes: actualMidiNotes,
                    isCorrect
                });
            }

            const stepScore = correctCount * 100;
            const perfectBonus = wrongCount === 0 ? 100 : 0;
            const levelBonus = config.level * 10;
            const score = stepScore + perfectBonus + levelBonus;

            let stars = 1;
            if (wrongCount === 0) {
                stars = 3;
            } else if (correctCount >= Math.ceil(totalSteps / 2)) {
                stars = 2;
            }

            const canAdvance = stars >= 2;
            this.totalScore += score;

            this.lastResult = {
                level: config.level,
                storyTitle: config.baseStory,
                expectedMoods: expected.slice(),
                actualMoods: Array.isArray(userMoods) ? userMoods.slice(0, totalSteps) : [],
                expectedSteps,
                actualSteps,
                judgments,
                correctCount,
                wrongCount,
                stepScore,
                perfectBonus,
                levelBonus,
                score,
                stars,
                canAdvance
            };

            return this.lastResult;
        }

        getComparisonReplayData() {
            if (this.lastResult) {
                return {
                    expectedSteps: this.lastResult.expectedSteps,
                    actualSteps: this.lastResult.actualSteps
                };
            }
            const config = this.getCurrentLevelConfig();
            const steps = Array.isArray(config.steps) ? config.steps : [];
            return {
                expectedSteps: steps,
                actualSteps: []
            };
        }
    }

    ChordMoodGameLogic.MOOD_PADS = MOOD_PADS;
    ChordMoodGameLogic.VALID_SOUNDS = VALID_SOUNDS;
    ChordMoodGameLogic.ROOT_MIDI_POOL = ROOT_MIDI_POOL;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { ChordMoodGameLogic };
    } else {
        root.ChordMoodGameLogic = ChordMoodGameLogic;
    }
})(typeof window !== 'undefined' ? window : this);
