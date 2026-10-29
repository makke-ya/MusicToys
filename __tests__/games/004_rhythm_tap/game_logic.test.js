const { RhythmGameLogic } = require('../../../games/004_rhythm_tap/game_logic');
const { RhythmAudio } = require('../../../games/004_rhythm_tap/game');
const levelDesign = require('../../../games/004_rhythm_tap/level_design.json');

describe('RhythmGameLogic', () => {
    let logic;

    beforeEach(() => {
        logic = new RhythmGameLogic(levelDesign);
    });

    test('should initialize with level 1 defaults', () => {
        expect(logic.level).toBe(1);
        expect(logic.totalScore).toBe(0);
        const config = logic.getCurrentLevelConfig();
        expect(config.level).toBe(1);
        expect(config.bpm).toBe(60);
        expect(config.pattern).toEqual([0, 1]);
        expect(config.toleranceMs).toBe(300);
    });

    test('should convert beat pattern to expected timestamps in ms based on BPM', () => {
        // Level 1: BPM 60 (1 beat = 1000ms), pattern [0, 1] -> [0, 1000]
        logic.setLevel(1);
        expect(logic.getExpectedTimestampsMs()).toEqual([0, 1000]);

        // Level 7: BPM 75 (1 beat = 800ms), pattern [0, 0.5, 1, 2] -> [0, 400, 800, 1600]
        logic.setLevel(7);
        expect(logic.getExpectedTimestampsMs()).toEqual([0, 400, 800, 1600]);
    });

    test('should judge individual tap accuracy (perfect, good, miss)', () => {
        // Tolerance 300ms -> Perfect <= 150ms, Good <= 300ms, Miss > 300ms
        expect(logic.judgeSingleTap(1000, 1000, 300)).toBe('perfect');
        expect(logic.judgeSingleTap(1000, 1150, 300)).toBe('perfect');
        expect(logic.judgeSingleTap(1000, 850, 300)).toBe('perfect');
        expect(logic.judgeSingleTap(1000, 1151, 300)).toBe('good');
        expect(logic.judgeSingleTap(1000, 1300, 300)).toBe('good');
        expect(logic.judgeSingleTap(1000, 1301, 300)).toBe('miss');
    });

    test('should normalize raw tap timestamps relative to the first tap', () => {
        const rawTaps = [1250, 2250, 3280];
        expect(logic.normalizeTaps(rawTaps)).toEqual([0, 1000, 2030]);
        expect(logic.normalizeTaps([])).toEqual([]);
    });

    test('should evaluate a full pattern and return 3 stars for all perfect taps', () => {
        logic.setLevel(1); // pattern [0, 1], bpm 60 -> [0, 1000], tolerance 300ms
        const result = logic.evaluatePattern([0, 1050]);

        expect(result.judgments).toEqual(['perfect', 'perfect']);
        expect(result.stars).toBe(3);
        // 2 perfects (200) + level 1 bonus (10) = 210
        expect(result.score).toBe(210);
        expect(result.canAdvance).toBe(true);
        expect(logic.totalScore).toBe(210);
    });

    test('should return 2 stars when at least half of taps are good or better', () => {
        logic.setLevel(4); // pattern [0, 1, 2, 3], bpm 65, tolerance 280ms
        const expected = logic.getExpectedTimestampsMs();
        // Tap 0: perfect (diff 0)
        // Tap 1: good (diff +200ms, > 140ms perfect threshold, <= 280ms good threshold)
        // Tap 2: miss (diff +400ms)
        // Tap 3: good (diff -200ms)
        const taps = [
            expected[0],
            expected[1] + 200,
            expected[2] + 400,
            expected[3] - 200
        ];

        const result = logic.evaluatePattern(taps);
        expect(result.judgments).toEqual(['perfect', 'good', 'miss', 'good']);
        expect(result.stars).toBe(2);
        // 100 + 50 + 0 + 50 + (4 * 10) = 240
        expect(result.score).toBe(240);
        expect(result.canAdvance).toBe(true);
    });

    test('should return 1 star and canAdvance false when majority of taps are misses', () => {
        logic.setLevel(2); // pattern [0, 1, 2], bpm 60 -> [0, 1000, 2000], tolerance 300ms
        // Tap 0: perfect (0)
        // Tap 1: miss (1500 -> diff 500)
        // Tap 2: miss (2600 -> diff 600)
        const result = logic.evaluatePattern([0, 1500, 2600]);

        expect(result.judgments).toEqual(['perfect', 'miss', 'miss']);
        expect(result.stars).toBe(1);
        // 100 + 0 + 0 + (2 * 10) = 120
        expect(result.score).toBe(120);
        expect(result.canAdvance).toBe(false);
    });

    test('should record taps sequentially and detect when pattern input is complete', () => {
        logic.setLevel(1); // 2 beats
        expect(logic.isInputComplete()).toBe(false);

        logic.recordTap(500);
        expect(logic.isInputComplete()).toBe(false);

        logic.recordTap(1500);
        expect(logic.isInputComplete()).toBe(true);

        const result = logic.evaluateRecordedTaps();
        expect(result.stars).toBe(3);
        expect(result.score).toBe(210);
    });

    test('should resolve random sound to a valid percussion instrument', () => {
        logic.setLevel(18); // sound: "random"
        const validSounds = ['taiko', 'castanet', 'tambourine', 'woodblock', 'cymbal'];
        const resolved = logic.getResolvedSound();
        expect(validSounds).toContain(resolved);
    });

    test('should advance level up to max level (50) and report completion at level 50', () => {
        expect(levelDesign.length).toBe(50);

        logic.setLevel(1);
        const step1 = logic.advanceLevel();
        expect(step1).toEqual({ completedAll: false, level: 2 });
        expect(logic.level).toBe(2);

        logic.setLevel(49);
        const step49 = logic.advanceLevel();
        expect(step49).toEqual({ completedAll: false, level: 50 });
        expect(logic.level).toBe(50);

        const stepMax = logic.advanceLevel();
        expect(stepMax).toEqual({ completedAll: true, level: 50 });
        expect(logic.level).toBe(50);
    });

    test('should return appropriate tempo info and difficulty category', () => {
        expect(logic.getTempoInfo(60)).toEqual({ text: 'ゆっくり', emoji: '🐢' });
        expect(logic.getTempoInfo(85)).toEqual({ text: 'ふつう', emoji: '🐕' });
        expect(logic.getTempoInfo(110)).toEqual({ text: 'はやい', emoji: '🐇' });

        expect(logic.getDifficultyCategory(1)).toBe('easy');
        expect(logic.getDifficultyCategory(15)).toBe('normal');
        expect(logic.getDifficultyCategory(30)).toBe('hard');
    });

    test('should provide multiple pattern variations per level and avoid immediate repeats on generateProblem', () => {
        for (const lvl of levelDesign) {
            expect(Array.isArray(lvl.patterns)).toBe(true);
            expect(lvl.patterns.length).toBeGreaterThanOrEqual(4);
        }

        logic.setLevel(5);
        const firstProblem = logic.generateProblem();
        const secondProblem = logic.generateProblem();

        expect(firstProblem).toBeDefined();
        expect(secondProblem).toBeDefined();
        expect(Array.isArray(firstProblem.pattern)).toBe(true);
        expect(Array.isArray(secondProblem.pattern)).toBe(true);
        // Should pick a different variation from the previous one
        expect(JSON.stringify(secondProblem.pattern)).not.toBe(JSON.stringify(firstProblem.pattern));
    });

    test('should reject tap recording when input is disabled (during demo playback)', () => {
        logic.setLevel(1);
        logic.setInputEnabled(false);
        expect(logic.canAcceptInput()).toBe(false);

        const countWhileDisabled = logic.recordTap(500);
        expect(countWhileDisabled).toBe(0);
        expect(logic.recordedTaps.length).toBe(0);

        logic.setInputEnabled(true);
        expect(logic.canAcceptInput()).toBe(true);
        const countWhileEnabled = logic.recordTap(1000);
        expect(countWhileEnabled).toBe(1);
        expect(logic.recordedTaps.length).toBe(1);
    });

    test('RhythmAudio should manage sound setting and calculate demo duration', () => {
        RhythmAudio.setSound('castanet');
        expect(RhythmAudio.getSound()).toBe('castanet');

        const duration = RhythmAudio.playDemo([0, 1000], {
            sound: 'taiko',
            demoCount: 2,
            beatDurationMs: 1000
        });
        RhythmAudio.stopDemo();
        // 2 rounds of (1000 + 1000)ms + 300ms gap = 4300ms
        expect(duration).toBe(4300);
    });
});
