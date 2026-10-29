(function(root) {
    const VALID_SOUNDS = ['taiko', 'castanet', 'tambourine', 'woodblock', 'cymbal'];

    const DEFAULT_LEVEL_DESIGNS = [
        {
            level: 1,
            bpm: 60,
            pattern: [0, 1],
            label: 'タン タン',
            patterns: [
                { pattern: [0, 1], label: 'タン タン' },
                { pattern: [0, 1.5], label: 'タン ーン タン' },
                { pattern: [0, 0.5, 1], label: 'タタ タン' },
                { pattern: [0, 1, 1.5], label: 'タン タタ' }
            ],
            toleranceMs: 300,
            sound: 'taiko',
            demoCount: 2,
            visualGuide: true
        }
    ];

    class RhythmGameLogic {
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
            this.recordedTaps = [];
            this.lastResult = null;
            this.inputEnabled = true;
            this.currentProblem = null;
            this.lastPatternKey = null;
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
            this.clearTaps();
        }

        advanceLevel() {
            const maxLevel = this.levelDesigns.length;
            if (this.level >= maxLevel) {
                this.clearTaps();
                return { completedAll: true, level: this.level };
            }
            this.level += 1;
            this.currentProblem = null;
            this.clearTaps();
            return { completedAll: false, level: this.level };
        }

        setInputEnabled(enabled) {
            this.inputEnabled = Boolean(enabled);
        }

        canAcceptInput() {
            return this.inputEnabled;
        }

        generateProblem() {
            const baseConfig = this.levelDesigns.find(d => d.level === this.level) || this.levelDesigns[0];
            const candidates = (Array.isArray(baseConfig.patterns) && baseConfig.patterns.length > 0)
                ? baseConfig.patterns
                : [{ pattern: baseConfig.pattern, label: baseConfig.label || '' }];

            let pool = candidates;
            if (candidates.length > 1 && this.lastPatternKey !== null) {
                const filtered = candidates.filter(c => JSON.stringify(c.pattern) !== this.lastPatternKey);
                if (filtered.length > 0) {
                    pool = filtered;
                }
            }

            const chosen = pool[Math.floor(Math.random() * pool.length)];
            this.lastPatternKey = JSON.stringify(chosen.pattern);
            this.currentProblem = {
                pattern: chosen.pattern.slice(),
                label: chosen.label || baseConfig.label || ''
            };
            this.clearTaps();
            return this.currentProblem;
        }

        getTempoInfo(bpm) {
            const targetBpm = bpm || this.getCurrentLevelConfig().bpm;
            if (targetBpm <= 70) {
                return { text: 'ゆっくり', emoji: '🐢' };
            }
            if (targetBpm <= 95) {
                return { text: 'ふつう', emoji: '🐕' };
            }
            return { text: 'はやい', emoji: '🐇' };
        }

        getDifficultyCategory(startLevel) {
            const lvl = startLevel !== undefined ? startLevel : this.level;
            if (lvl >= 25) return 'hard';
            if (lvl >= 10) return 'normal';
            return 'easy';
        }

        reset() {
            this.level = 1;
            this.totalScore = 0;
            this.currentProblem = null;
            this.lastPatternKey = null;
            this.inputEnabled = true;
            this.clearTaps();
        }

        clearTaps() {
            this.recordedTaps = [];
            this.lastResult = null;
        }

        getCurrentLevelConfig() {
            const found = this.levelDesigns.find(d => d.level === this.level) || this.levelDesigns[0];
            if (this.currentProblem) {
                return Object.assign({}, found, {
                    pattern: this.currentProblem.pattern,
                    label: this.currentProblem.label
                });
            }
            return found;
        }

        getBeatDurationMs(bpm) {
            const targetBpm = bpm || this.getCurrentLevelConfig().bpm;
            return 60000 / targetBpm;
        }

        getExpectedTimestampsMs(levelConfig) {
            const config = levelConfig || this.getCurrentLevelConfig();
            const beatDurationMs = this.getBeatDurationMs(config.bpm);
            return config.pattern.map(beat => Math.round(beat * beatDurationMs * 100) / 100);
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

        judgeSingleTap(expectedMs, actualMs, toleranceMs) {
            const tol = toleranceMs !== undefined ? toleranceMs : this.getCurrentLevelConfig().toleranceMs;
            const diff = Math.abs(actualMs - expectedMs);
            if (diff <= tol * 0.5) {
                return 'perfect';
            }
            if (diff <= tol) {
                return 'good';
            }
            return 'miss';
        }

        normalizeTaps(rawTimestampsMs) {
            if (!Array.isArray(rawTimestampsMs) || rawTimestampsMs.length === 0) {
                return [];
            }
            const base = rawTimestampsMs[0];
            return rawTimestampsMs.map(t => t - base);
        }

        recordTap(timestampMs) {
            if (!this.inputEnabled) {
                return 0;
            }
            this.recordedTaps.push(timestampMs);
            return this.recordedTaps.length;
        }

        isInputComplete() {
            const config = this.getCurrentLevelConfig();
            return this.recordedTaps.length >= config.pattern.length;
        }

        evaluateRecordedTaps() {
            const normalized = this.normalizeTaps(this.recordedTaps);
            return this.evaluatePattern(normalized);
        }

        evaluatePattern(tapTimestampsMs) {
            const config = this.getCurrentLevelConfig();
            const expected = this.getExpectedTimestampsMs(config);
            const totalBeats = expected.length;

            const judgments = [];
            const diffsMs = [];
            let perfectCount = 0;
            let goodCount = 0;
            let missCount = 0;
            let tapScore = 0;

            for (let i = 0; i < totalBeats; i++) {
                const actual = (tapTimestampsMs && i < tapTimestampsMs.length) ? tapTimestampsMs[i] : Infinity;
                const exp = expected[i];
                const diff = Number.isFinite(actual) ? Math.abs(actual - exp) : Infinity;
                diffsMs.push(diff);

                const judgment = this.judgeSingleTap(exp, actual, config.toleranceMs);
                judgments.push(judgment);

                if (judgment === 'perfect') {
                    perfectCount++;
                    tapScore += 100;
                } else if (judgment === 'good') {
                    goodCount++;
                    tapScore += 50;
                } else {
                    missCount++;
                }
            }

            const levelBonus = config.level * 10;
            const score = tapScore + levelBonus;

            let stars = 1;
            if (missCount === 0 && perfectCount >= Math.ceil(totalBeats / 2)) {
                stars = 3;
            } else if ((perfectCount + goodCount) >= Math.ceil(totalBeats / 2)) {
                stars = 2;
            }

            const canAdvance = stars >= 2;
            this.totalScore += score;

            this.lastResult = {
                level: config.level,
                judgments,
                diffsMs,
                perfectCount,
                goodCount,
                missCount,
                tapScore,
                levelBonus,
                score,
                stars,
                canAdvance
            };

            return this.lastResult;
        }
    }

    RhythmGameLogic.VALID_SOUNDS = VALID_SOUNDS;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { RhythmGameLogic };
    } else {
        root.RhythmGameLogic = RhythmGameLogic;
    }
})(typeof window !== 'undefined' ? window : this);
