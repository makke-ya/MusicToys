const { MelodyGameLogic } = require('../../../games/005_melody_memory/game_logic');
const { MelodyAudio } = require('../../../games/005_melody_memory/game');
const levelDesign = require('../../../games/005_melody_memory/level_design.json');

describe('MelodyGameLogic', () => {
    let logic;

    beforeEach(() => {
        logic = new MelodyGameLogic(levelDesign);
    });

    test('should initialize with level 1 defaults', () => {
        expect(logic.level).toBe(1);
        expect(logic.totalScore).toBe(0);
        const config = logic.getCurrentLevelConfig();
        expect(config.level).toBe(1);
        expect(config.padCount).toBe(3);
        expect(config.notes).toEqual([0, 1, 2]);
        expect(config.guideMode).toBe('all');
    });

    test('should return correct scale notes for padCount (3, 5, 8)', () => {
        const pads3 = logic.getScaleNotes(3);
        expect(pads3).toHaveLength(3);
        expect(pads3[0].name).toBe('ド');
        expect(pads3[2].name).toBe('ミ');

        const pads8 = logic.getScaleNotes(8);
        expect(pads8).toHaveLength(8);
        expect(pads8[4].name).toBe('ソ');
        expect(pads8[7].name).toBe('ド(高)');
    });

    test('should determine visual guide highlight correctly for all, partial, and first_only modes', () => {
        // all: every note highlights
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
    });

    test('should have 50 valid levels with famous song melodies and generate non-repeating problems', () => {
        expect(levelDesign).toHaveLength(50);
        for (const lvl of levelDesign) {
            expect(Array.isArray(lvl.melodies)).toBe(true);
            expect(lvl.melodies.length).toBeGreaterThanOrEqual(5);
            for (const m of lvl.melodies) {
                for (const n of m.notes) {
                    expect(n).toBeGreaterThanOrEqual(0);
                    expect(n).toBeLessThan(lvl.padCount);
                }
            }
        }

        logic.setLevel(10);
        const p1 = logic.generateProblem();
        const p2 = logic.generateProblem();
        expect(p1.notes.length).toBeGreaterThanOrEqual(3);
        expect(p2.notes.length).toBeGreaterThanOrEqual(3);
        expect(JSON.stringify(p2.notes)).not.toBe(JSON.stringify(p1.notes));
    });

    test('should create a musical variation keeping the opening motif and altering the tail within padCount bounds', () => {
        const baseNotes = [0, 1, 2, 1]; // かえるのうた (4 notes, 3 pads)
        const varied = logic.createMelodyVariation(baseNotes, 3);

        expect(varied).toHaveLength(4);
        // Preserves opening motif
        expect(varied[0]).toBe(0);
        expect(varied[1]).toBe(1);
        // Tail is changed and within bounds [0..2]
        expect(varied[3]).not.toBe(1);
        expect(varied[3]).toBeGreaterThanOrEqual(0);
        expect(varied[3]).toBeLessThan(3);
    });

    test('should reject note input when disabled (during demo playback)', () => {
        logic.setLevel(1);
        logic.setInputEnabled(false);
        expect(logic.canAcceptInput()).toBe(false);

        expect(logic.recordNote(0)).toBe(0);
        expect(logic.recordedNotes).toHaveLength(0);

        logic.setInputEnabled(true);
        expect(logic.canAcceptInput()).toBe(true);
        expect(logic.recordNote(0)).toBe(1);
        expect(logic.recordedNotes).toEqual([0]);
    });

    test('should evaluate sequence and return 3 stars for all correct notes', () => {
        logic.setLevel(1); // expected: [0, 1, 2]
        const result = logic.evaluateSequence([0, 1, 2]);

        expect(result.judgments).toEqual(['correct', 'correct', 'correct']);
        expect(result.stars).toBe(3);
        // 3 * 100 + 100 (perfect bonus) + 1 * 10 (level bonus) = 410
        expect(result.score).toBe(410);
        expect(result.canAdvance).toBe(true);
        expect(logic.totalScore).toBe(410);
    });

    test('should return 2 stars when at least half of notes are correct', () => {
        logic.setLevel(1); // expected: [0, 1, 2]
        const result = logic.evaluateSequence([0, 1, 0]); // 2 of 3 correct

        expect(result.judgments).toEqual(['correct', 'correct', 'wrong']);
        expect(result.stars).toBe(2);
        // 2 * 100 + 0 (no perfect bonus) + 10 = 210
        expect(result.score).toBe(210);
        expect(result.canAdvance).toBe(true);
    });

    test('should return 1 star and canAdvance false when majority of notes are wrong', () => {
        logic.setLevel(1); // expected: [0, 1, 2]
        const result = logic.evaluateSequence([0, 0, 0]); // 1 of 3 correct

        expect(result.judgments).toEqual(['correct', 'wrong', 'wrong']);
        expect(result.stars).toBe(1);
        expect(result.score).toBe(110);
        expect(result.canAdvance).toBe(false);
    });

    test('should advance level up to 50 and report completion at level 50', () => {
        logic.setLevel(49);
        expect(logic.advanceLevel()).toEqual({ completedAll: false, level: 50 });
        expect(logic.advanceLevel()).toEqual({ completedAll: true, level: 50 });
    });

    test('MelodyAudio should manage sound setting and calculate demo duration', () => {
        MelodyAudio.setSound('musicbox');
        expect(MelodyAudio.getSound()).toBe('musicbox');

        const duration = MelodyAudio.playDemo([0, 1, 2], {
            sound: 'marimba',
            demoCount: 2,
            noteDurationMs: 500
        });
        MelodyAudio.stopDemo();
        expect(duration).toBeGreaterThan(2500);
    });
});
