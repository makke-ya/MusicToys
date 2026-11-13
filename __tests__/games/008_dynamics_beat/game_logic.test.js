const { DynamicsGameLogic } = require('../../../games/008_dynamics_beat/game_logic');
const { DynamicsAudio } = require('../../../games/008_dynamics_beat/game');
const levelDesign = require('../../../games/008_dynamics_beat/level_design.json');

describe('DynamicsGameLogic', () => {
    let logic;

    beforeEach(() => {
        logic = new DynamicsGameLogic(levelDesign);
    });

    test('should initialize with level 1 defaults', () => {
        expect(logic.level).toBe(1);
        expect(logic.totalScore).toBe(0);
        const config = logic.getCurrentLevelConfig();
        expect(config.level).toBe(1);
        expect(config.padCount).toBe(2);
        expect(config.pattern).toEqual(['f', 'p']);
        expect(config.guideMode).toBe('all');
    });

    test('should return correct dynamics pads for padCount (2 and 3)', () => {
        const pads2 = logic.getDynamicsPads(2);
        expect(pads2).toHaveLength(2);
        expect(pads2.map(p => p.id)).toEqual(['p', 'f']);
        expect(pads2[0].shortName).toBe('トッ');
        expect(pads2[1].shortName).toBe('ドン！');

        const pads3 = logic.getDynamicsPads(3);
        expect(pads3).toHaveLength(3);
        expect(pads3.map(p => p.id)).toEqual(['p', 'mf', 'f']);
        expect(pads3[1].shortName).toBe('ポン');
    });

    test('should determine visual guide highlight correctly for all, partial, first_only, and none modes', () => {
        // all: every beat highlights
        expect(logic.shouldHighlightGuide(0, 4, 'all')).toBe(true);
        expect(logic.shouldHighlightGuide(3, 4, 'all')).toBe(true);

        // partial: first half highlights, second half does not
        expect(logic.shouldHighlightGuide(0, 4, 'partial')).toBe(true);
        expect(logic.shouldHighlightGuide(1, 4, 'partial')).toBe(true);
        expect(logic.shouldHighlightGuide(2, 4, 'partial')).toBe(false);
        expect(logic.shouldHighlightGuide(3, 4, 'partial')).toBe(false);

        // first_only: only index 0 highlights
        expect(logic.shouldHighlightGuide(0, 6, 'first_only')).toBe(true);
        expect(logic.shouldHighlightGuide(1, 6, 'first_only')).toBe(false);
        expect(logic.shouldHighlightGuide(5, 6, 'first_only')).toBe(false);

        // none: no beat highlights
        expect(logic.shouldHighlightGuide(0, 6, 'none')).toBe(false);
        expect(logic.shouldHighlightGuide(3, 6, 'none')).toBe(false);
    });

    test('should have 50 valid levels with dynamics patterns and generate non-repeating consecutive problems', () => {
        expect(levelDesign).toHaveLength(50);
        for (const lvl of levelDesign) {
            expect(Array.isArray(lvl.patterns)).toBe(true);
            expect(lvl.patterns.length).toBeGreaterThanOrEqual(5);
            const allowed = lvl.padCount === 2 ? ['p', 'f'] : ['p', 'mf', 'f'];
            expect(lvl.padCount).toBe(lvl.level <= 20 ? 2 : 3);
            for (const item of lvl.patterns) {
                expect(item.pattern.length).toBeGreaterThanOrEqual(2);
                for (const d of item.pattern) {
                    expect(allowed).toContain(d);
                }
            }
        }

        logic.setLevel(10);
        const p1 = logic.generateProblem();
        const p2 = logic.generateProblem();
        expect(p1.pattern.length).toBeGreaterThanOrEqual(2);
        expect(p2.pattern.length).toBeGreaterThanOrEqual(2);
        expect(JSON.stringify(p2.pattern)).not.toBe(JSON.stringify(p1.pattern));
    });

    test('should create a dynamics variation within allowed padCount dynamics and different from basePattern', () => {
        const base2 = ['f', 'p', 'p'];
        const varied2 = logic.createDynamicsVariation(base2, 2);
        expect(varied2).toHaveLength(3);
        expect(JSON.stringify(varied2)).not.toBe(JSON.stringify(base2));
        for (const d of varied2) {
            expect(['p', 'f']).toContain(d);
        }

        const base3 = ['p', 'mf', 'f', 'mf', 'p'];
        const varied3 = logic.createDynamicsVariation(base3, 3);
        expect(varied3).toHaveLength(5);
        expect(JSON.stringify(varied3)).not.toBe(JSON.stringify(base3));
        for (const d of varied3) {
            expect(['p', 'mf', 'f']).toContain(d);
        }
    });

    test('should reject beat input when disabled (during demo playback)', () => {
        logic.setLevel(1);
        logic.setInputEnabled(false);
        expect(logic.canAcceptInput()).toBe(false);

        expect(logic.recordBeat('f')).toBe(0);
        expect(logic.recordedBeats).toHaveLength(0);

        logic.setInputEnabled(true);
        expect(logic.canAcceptInput()).toBe(true);
        expect(logic.recordBeat('f')).toBe(1);
        expect(logic.recordedBeats).toEqual(['f']);
    });

    test('should evaluate sequence and return 3 stars for all correct beats', () => {
        logic.setLevel(3); // expected: ['f', 'p', 'p']
        const result = logic.evaluateSequence(['f', 'p', 'p']);

        expect(result.judgments).toEqual(['correct', 'correct', 'correct']);
        expect(result.stars).toBe(3);
        // 3 * 100 + 100 (perfect bonus) + 3 * 10 (level bonus) = 430
        expect(result.score).toBe(430);
        expect(result.canAdvance).toBe(true);
        expect(logic.totalScore).toBe(430);
    });

    test('should return 2 stars when at least half of beats are correct', () => {
        logic.setLevel(3); // expected: ['f', 'p', 'p']
        const result = logic.evaluateSequence(['f', 'p', 'f']); // 2 of 3 correct

        expect(result.judgments).toEqual(['correct', 'correct', 'wrong']);
        expect(result.stars).toBe(2);
        // 2 * 100 + 0 (no perfect bonus) + 30 = 230
        expect(result.score).toBe(230);
        expect(result.canAdvance).toBe(true);
    });

    test('should return 1 star and canAdvance false when majority of beats are wrong', () => {
        logic.setLevel(3); // expected: ['f', 'p', 'p']
        const result = logic.evaluateSequence(['p', 'f', 'f']); // 0 of 3 correct

        expect(result.judgments).toEqual(['wrong', 'wrong', 'wrong']);
        expect(result.stars).toBe(1);
        expect(result.score).toBe(30);
        expect(result.canAdvance).toBe(false);
    });

    test('should advance level up to 50 and report completion at level 50', () => {
        logic.setLevel(49);
        expect(logic.advanceLevel()).toEqual({ completedAll: false, level: 50 });
        expect(logic.advanceLevel()).toEqual({ completedAll: true, level: 50 });
    });

    test('DynamicsAudio should manage sound setting, dynamics acoustic parameters, and calculate demo duration', () => {
        DynamicsAudio.setSound('orchestra');
        expect(DynamicsAudio.getSound()).toBe('orchestra');

        const pParams = DynamicsAudio.getDynamicsParams('p', 1.0);
        const mfParams = DynamicsAudio.getDynamicsParams('mf', 1.0);
        const fParams = DynamicsAudio.getDynamicsParams('f', 1.0);
        expect(fParams.gain).toBeGreaterThan(mfParams.gain);
        expect(mfParams.gain).toBeGreaterThan(pParams.gain);

        const duration = DynamicsAudio.playDemo(['f', 'p', 'p'], {
            sound: 'taiko',
            demoCount: 2,
            beatDurationMs: 500
        });
        DynamicsAudio.stopDemo();
        expect(duration).toBeGreaterThan(2500);
    });
});
