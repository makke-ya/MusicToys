(function(root) {
    const VALID_SOUNDS = ['taiko', 'orchestra', 'march', 'synth'];

    const DYNAMICS_DEFS = {
        p: {
            id: 'p',
            index: 0,
            name: 'トッ（よわい）',
            shortName: 'トッ',
            symbol: 'p',
            emoji: '🐭',
            animalImg: '03_blue.png',
            color: '#38bdf8',
            bgClass: 'bg-sky-400',
            borderClass: 'border-sky-600',
            sizeClass: 'drum-pad-sm',
            slotClass: 'slot-p'
        },
        mf: {
            id: 'mf',
            index: 1,
            name: 'ポン（ふつう）',
            shortName: 'ポン',
            symbol: 'mf',
            emoji: '🐰',
            animalImg: '02_yellow.png',
            color: '#fbbf24',
            bgClass: 'bg-amber-400',
            borderClass: 'border-amber-600',
            sizeClass: 'drum-pad-md',
            slotClass: 'slot-mf'
        },
        f: {
            id: 'f',
            index: 2,
            name: 'ドン！（つよい）',
            shortName: 'ドン！',
            symbol: 'f',
            emoji: '🦁',
            animalImg: '01_red.png',
            color: '#ef4444',
            bgClass: 'bg-red-500',
            borderClass: 'border-red-700',
            sizeClass: 'drum-pad-lg',
            slotClass: 'slot-f'
        }
    };

    const DYNAMICS_PADS = [DYNAMICS_DEFS.p, DYNAMICS_DEFS.mf, DYNAMICS_DEFS.f];

    const DEFAULT_LEVEL_DESIGNS = [
        {
            level: 1,
            padCount: 2,
            beatDurationMs: 580,
            demoCount: 2,
            guideMode: 'all',
            sound: 'taiko',
            contrastScale: 1.0,
            baseTitle: '🦁 ドン・トッ（2びょうし）',
            meter: '2拍子',
            pattern: ['f', 'p'],
            patterns: [
                { title: '🦁 ドン・トッ（つよい→よわい）', pattern: ['f', 'p'], meter: '2拍子', isVariation: false },
                { title: '🐭 トッ・ドン（よわい→つよい）', pattern: ['p', 'f'], meter: '2拍子', isVariation: true },
                { title: '🦁 ドン・ドン（どっちもつよい！）', pattern: ['f', 'f'], meter: '2拍子', isVariation: true },
                { title: '🐭 トッ・トッ（どっちもよわい！）', pattern: ['p', 'p'], meter: '2拍子', isVariation: true },
                { title: '🥁 ドン・トッ・ドン（3かい）', pattern: ['f', 'p', 'f'], meter: '3拍', isVariation: true }
            ]
        }
    ];

    class DynamicsGameLogic {
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
            this.recordedBeats = [];
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
            this.clearBeats();
        }

        advanceLevel() {
            const maxLevel = this.levelDesigns.length;
            if (this.level >= maxLevel) {
                this.clearBeats();
                return { completedAll: true, level: this.level };
            }
            this.level += 1;
            this.currentProblem = null;
            this.clearBeats();
            return { completedAll: false, level: this.level };
        }

        reset() {
            this.level = 1;
            this.totalScore = 0;
            this.currentProblem = null;
            this.lastPatternKey = null;
            this.inputEnabled = true;
            this.clearBeats();
        }

        clearBeats() {
            this.recordedBeats = [];
            this.lastResult = null;
        }

        setInputEnabled(enabled) {
            this.inputEnabled = Boolean(enabled);
        }

        canAcceptInput() {
            return this.inputEnabled;
        }

        getAllowedDynamics(padCount) {
            const count = padCount || this.getCurrentLevelConfig().padCount || 2;
            return count <= 2 ? ['p', 'f'] : ['p', 'mf', 'f'];
        }

        getDynamicsPads(padCount) {
            const count = padCount || this.getCurrentLevelConfig().padCount || 2;
            if (count <= 2) {
                return [DYNAMICS_DEFS.p, DYNAMICS_DEFS.f];
            }
            return [DYNAMICS_DEFS.p, DYNAMICS_DEFS.mf, DYNAMICS_DEFS.f];
        }

        getDynamicDef(dynamicId) {
            return DYNAMICS_DEFS[dynamicId] || DYNAMICS_DEFS.f;
        }

        getCurrentLevelConfig() {
            const found = this.levelDesigns.find(d => d.level === this.level) || this.levelDesigns[0];
            if (this.currentProblem) {
                return Object.assign({}, found, {
                    pattern: this.currentProblem.pattern,
                    baseTitle: this.currentProblem.title,
                    meter: this.currentProblem.meter || found.meter,
                    isVariation: this.currentProblem.isVariation
                });
            }
            return found;
        }

        shouldHighlightGuide(beatIndex, totalBeats, guideMode) {
            const mode = guideMode || this.getCurrentLevelConfig().guideMode || 'all';
            if (mode === 'all') {
                return true;
            }
            if (mode === 'partial') {
                return beatIndex < Math.ceil(totalBeats / 2);
            }
            if (mode === 'first_only') {
                return beatIndex === 0;
            }
            if (mode === 'none') {
                return false;
            }
            return true;
        }

        createDynamicsVariation(basePattern, padCount) {
            if (!Array.isArray(basePattern) || basePattern.length === 0) return [];
            const allowed = this.getAllowedDynamics(padCount);
            const result = basePattern.slice().map(d => (allowed.includes(d) ? d : allowed[0]));
            const lastIdx = result.length - 1;
            const currentLast = result[lastIdx];

            const alternatives = allowed.filter(d => d !== currentLast);
            if (alternatives.length > 0) {
                result[lastIdx] = alternatives[Math.floor(Math.random() * alternatives.length)];
            }
            return result;
        }

        generateProblem(options = {}) {
            const baseConfig = this.levelDesigns.find(d => d.level === this.level) || this.levelDesigns[0];
            const candidates = (Array.isArray(baseConfig.patterns) && baseConfig.patterns.length > 0)
                ? baseConfig.patterns
                : [{ title: baseConfig.baseTitle || 'たいこリズム', pattern: baseConfig.pattern, meter: baseConfig.meter || 'リズム', isVariation: false }];

            let pool = candidates;
            if (candidates.length > 1 && this.lastPatternKey !== null) {
                const filtered = candidates.filter(c => JSON.stringify(c.pattern) !== this.lastPatternKey);
                if (filtered.length > 0) {
                    pool = filtered;
                }
            }

            const picked = pool[Math.floor(Math.random() * pool.length)];
            let pattern = picked.pattern.slice();
            let title = picked.title;
            let meter = picked.meter || baseConfig.meter || 'リズム';
            let isVariation = Boolean(picked.isVariation);

            if (options.forceDynamicVariation) {
                const varied = this.createDynamicsVariation(pattern, baseConfig.padCount);
                if (JSON.stringify(varied) !== this.lastPatternKey) {
                    pattern = varied;
                    title = title.replace(/（.*）/, '') + '（ちょい変え♪）';
                    isVariation = true;
                }
            }

            this.lastPatternKey = JSON.stringify(pattern);
            this.currentProblem = {
                title,
                pattern,
                meter,
                isVariation
            };
            this.clearBeats();
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
                return '🎧 おとだけで ききわけよう！';
            }
            if (mode === 'first_only') {
                return '👂 さいしょの1かいだけ ひかるよ';
            }
            if (mode === 'partial') {
                return '✨ ぜんはんだけ ひかるよ';
            }
            return '🌟 ぜんぶ ひかるよ';
        }

        formatPatternNames(pattern) {
            if (!Array.isArray(pattern)) return '';
            return pattern.map(id => {
                const def = DYNAMICS_DEFS[id];
                return def ? `${def.shortName}(${def.symbol})` : '?';
            }).join(' → ');
        }

        recordBeat(dynamicId) {
            if (!this.inputEnabled) {
                return 0;
            }
            this.recordedBeats.push(dynamicId);
            return this.recordedBeats.length;
        }

        isInputComplete() {
            const config = this.getCurrentLevelConfig();
            return this.recordedBeats.length >= config.pattern.length;
        }

        evaluateRecordedBeats() {
            return this.evaluateSequence(this.recordedBeats);
        }

        evaluateSequence(userPattern) {
            const config = this.getCurrentLevelConfig();
            const expected = config.pattern;
            const totalBeats = expected.length;

            const judgments = [];
            let correctCount = 0;
            let wrongCount = 0;

            for (let i = 0; i < totalBeats; i++) {
                const actual = (Array.isArray(userPattern) && i < userPattern.length) ? userPattern[i] : null;
                if (actual === expected[i]) {
                    judgments.push('correct');
                    correctCount++;
                } else {
                    judgments.push('wrong');
                    wrongCount++;
                }
            }

            const beatScore = correctCount * 100;
            const perfectBonus = wrongCount === 0 ? 100 : 0;
            const levelBonus = config.level * 10;
            const score = beatScore + perfectBonus + levelBonus;

            let stars = 1;
            if (wrongCount === 0) {
                stars = 3;
            } else if (correctCount >= Math.ceil(totalBeats / 2)) {
                stars = 2;
            }

            const canAdvance = stars >= 2;
            this.totalScore += score;

            this.lastResult = {
                level: config.level,
                patternTitle: config.baseTitle,
                meter: config.meter,
                expectedPattern: expected.slice(),
                actualPattern: Array.isArray(userPattern) ? userPattern.slice(0, totalBeats) : [],
                judgments,
                correctCount,
                wrongCount,
                beatScore,
                perfectBonus,
                levelBonus,
                score,
                stars,
                canAdvance
            };

            return this.lastResult;
        }
    }

    DynamicsGameLogic.DYNAMICS_DEFS = DYNAMICS_DEFS;
    DynamicsGameLogic.DYNAMICS_PADS = DYNAMICS_PADS;
    DynamicsGameLogic.VALID_SOUNDS = VALID_SOUNDS;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { DynamicsGameLogic };
    } else {
        root.DynamicsGameLogic = DynamicsGameLogic;
    }
})(typeof window !== 'undefined' ? window : this);
