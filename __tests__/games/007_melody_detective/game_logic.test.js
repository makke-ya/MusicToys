const { MelodyDetectiveLogic } = require('../../../games/007_melody_detective/game_logic');
const { DetectiveAudio } = require('../../../games/007_melody_detective/game');
const levelDesign = require('../../../games/007_melody_detective/level_design.json');

describe('MelodyDetectiveLogic', () => {
    let logic;

    beforeEach(() => {
        logic = new MelodyDetectiveLogic(levelDesign);
    });

    test('should initialize with level 1 defaults', () => {
        expect(logic.level).toBe(1);
        expect(logic.totalScore).toBe(0);
        const config = logic.getCurrentLevelConfig();
        expect(config.level).toBe(1);
        expect(config.mode).toBe('same_or_diff');
        expect(config.noteCount).toBe(3);
        expect(config.guideMode).toBe('all');
        expect(MelodyDetectiveLogic.SCALE_NOTES).toHaveLength(8);
    });

    test('should have 50 valid levels with melodies and proper mode progression', () => {
        expect(levelDesign).toHaveLength(50);
        for (const lvl of levelDesign) {
            expect(lvl.mode).toBe(lvl.level <= 15 ? 'same_or_diff' : 'find_index');
            expect(Array.isArray(lvl.melodies)).toBe(true);
            expect(lvl.melodies.length).toBeGreaterThanOrEqual(5);
            for (const m of lvl.melodies) {
                expect(m.notes).toHaveLength(lvl.noteCount);
                for (const n of m.notes) {
                    expect(n).toBeGreaterThanOrEqual(0);
                    expect(n).toBeLessThan(8);
                }
            }
        }
    });

    test('should create a 1-note mistake melody respecting mistakeIndex and mistakeDistance', () => {
        const teacherNotes = [0, 1, 2, 1];
        const studentSubtle = logic.createMistakeMelody(teacherNotes, 2, 'subtle');
        expect(studentSubtle).toHaveLength(4);
        expect(studentSubtle[0]).toBe(0);
        expect(studentSubtle[1]).toBe(1);
        expect(studentSubtle[3]).toBe(1);
        expect(studentSubtle[2]).not.toBe(2);
        expect(Math.abs(studentSubtle[2] - 2)).toBe(1);

        const studentLarge = logic.createMistakeMelody(teacherNotes, 1, 'large');
        expect(studentLarge[1]).not.toBe(1);
        expect(Math.abs(studentLarge[1] - 1)).toBeGreaterThanOrEqual(2);
    });

    test('should generate valid same_or_diff and find_index problems without immediate repetition', () => {
        // Level 1: same_or_diff mode
        logic.setLevel(1);
        const pSame = logic.generateProblem({ forceDifferent: false });
        expect(pSame.mode).toBe('same_or_diff');
        expect(pSame.isDifferent).toBe(false);
        expect(pSame.mistakeIndex).toBe(-1);
        expect(pSame.expectedAnswer).toBe('same');
        expect(pSame.studentNotes).toEqual(pSame.teacherNotes);

        const pDiff = logic.generateProblem({ forceDifferent: true, mistakeIndex: 1 });
        expect(pDiff.mode).toBe('same_or_diff');
        expect(pDiff.isDifferent).toBe(true);
        expect(pDiff.mistakeIndex).toBe(1);
        expect(pDiff.expectedAnswer).toBe('diff');
        expect(pDiff.studentNotes[1]).not.toBe(pDiff.teacherNotes[1]);

        // Level 20: find_index mode
        logic.setLevel(20);
        const f1 = logic.generateProblem();
        const f2 = logic.generateProblem();
        expect(f1.mode).toBe('find_index');
        expect(f1.isDifferent).toBe(true);
        expect(f1.mistakeIndex).toBeGreaterThanOrEqual(0);
        expect(f1.mistakeIndex).toBeLessThan(f1.teacherNotes.length);
        expect(f1.expectedAnswer).toBe(f1.mistakeIndex);
        expect(f1.studentNotes[f1.mistakeIndex]).not.toBe(f1.teacherNotes[f1.mistakeIndex]);
        expect(JSON.stringify(f2.teacherNotes) === JSON.stringify(f1.teacherNotes) && f2.mistakeIndex === f1.mistakeIndex).toBe(false);
    });

    test('should reject answer submission when input is disabled (during demo playback)', () => {
        logic.setLevel(1);
        logic.generateProblem({ forceDifferent: false });

        logic.setInputEnabled(false);
        expect(logic.canAcceptInput()).toBe(false);
        expect(logic.submitAnswer('same')).toBeNull();

        logic.setInputEnabled(true);
        expect(logic.canAcceptInput()).toBe(true);
        const res = logic.submitAnswer('same');
        expect(res).not.toBeNull();
        expect(res.isCorrect).toBe(true);
        // After a valid submitAnswer, input should automatically lock to prevent duplicate pointerdown/click triggers
        expect(logic.canAcceptInput()).toBe(false);
        expect(logic.submitAnswer('same')).toBeNull();
    });

    test('should complete full answer -> judgment -> next level transition flow across multiple levels', () => {
        logic.setLevel(1);
        const prob1 = logic.generateProblem({ forceDifferent: true, mistakeIndex: 1 });
        // Demo playback locks input
        logic.setInputEnabled(false);
        expect(logic.submitAnswer('diff')).toBeNull();

        // Demo finishes, input unlocked
        logic.setInputEnabled(true);
        const res1 = logic.submitAnswer(prob1.expectedAnswer);
        expect(res1).not.toBeNull();
        expect(res1.isCorrect).toBe(true);
        expect(res1.canAdvance).toBe(true);
        expect(logic.lastResult).toEqual(res1);

        // Advance to level 2 and play next round
        const step = logic.advanceLevel();
        expect(step).toEqual({ completedAll: false, level: 2 });
        expect(logic.lastResult).toBeNull();

        const prob2 = logic.generateProblem({ forceDifferent: false });
        logic.setInputEnabled(true);
        const res2 = logic.submitAnswer(prob2.expectedAnswer);
        expect(res2).not.toBeNull();
        expect(res2.level).toBe(2);
        expect(res2.isCorrect).toBe(true);
        expect(res2.canAdvance).toBe(true);

        // Retrying with keepCurrentProblem should preserve the exact same problem
        const keptProb = logic.generateProblem({ keepCurrentProblem: true });
        expect(keptProb).toEqual(prob2);
        expect(logic.lastResult).toBeNull();
    });

    test('should evaluate same_or_diff mode answers and return 3 stars on correct or 1 star on wrong', () => {
        logic.setLevel(1);
        logic.generateProblem({ forceDifferent: true, mistakeIndex: 2 });

        const correctRes = logic.evaluateAnswer('diff');
        expect(correctRes.isCorrect).toBe(true);
        expect(correctRes.stars).toBe(3);
        // 300 + 100 (perfect bonus) + 1 * 10 = 410
        expect(correctRes.score).toBe(410);
        expect(correctRes.canAdvance).toBe(true);
        expect(logic.totalScore).toBe(410);

        const wrongRes = logic.evaluateAnswer('same');
        expect(wrongRes.isCorrect).toBe(false);
        expect(wrongRes.stars).toBe(1);
        expect(wrongRes.score).toBe(10);
        expect(wrongRes.canAdvance).toBe(false);
    });

    test('should evaluate find_index mode with 3 stars for exact index, 2 stars for adjacent note, and 1 star for far miss', () => {
        logic.setLevel(20); // 4 notes, find_index mode
        logic.generateProblem({ mistakeIndex: 2 });

        // Exact hit (index 2) -> 3 stars
        const exactRes = logic.evaluateAnswer(2);
        expect(exactRes.isCorrect).toBe(true);
        expect(exactRes.stars).toBe(3);
        // 300 + 100 + 20 * 10 = 600
        expect(exactRes.score).toBe(600);
        expect(exactRes.canAdvance).toBe(true);

        // Adjacent near-miss (index 1) -> 2 stars
        const nearRes = logic.evaluateAnswer(1);
        expect(nearRes.isCorrect).toBe(false);
        expect(nearRes.isNearMiss).toBe(true);
        expect(nearRes.stars).toBe(2);
        // 150 + 20 * 10 = 350
        expect(nearRes.score).toBe(350);
        expect(nearRes.canAdvance).toBe(true);

        // Far miss (index 0) -> 1 star
        const farRes = logic.evaluateAnswer(0);
        expect(farRes.isCorrect).toBe(false);
        expect(farRes.isNearMiss).toBe(false);
        expect(farRes.stars).toBe(1);
        expect(farRes.score).toBe(200);
        expect(farRes.canAdvance).toBe(false);
    });

    test('should advance level up to 50 and report completion at level 50', () => {
        logic.setLevel(49);
        expect(logic.advanceLevel()).toEqual({ completedAll: false, level: 50 });
        expect(logic.advanceLevel()).toEqual({ completedAll: true, level: 50 });
    });

    test('DetectiveAudio should manage sound setting, transpose frequency, and calculate comparison demo duration', () => {
        DetectiveAudio.setSound('piano');
        expect(DetectiveAudio.getSound()).toBe('piano');

        const baseFreq = DetectiveAudio.getNoteFrequency(0, 0);
        const higherFreq = DetectiveAudio.getNoteFrequency(0, 2);
        expect(higherFreq).toBeGreaterThan(baseFreq);

        const duration = DetectiveAudio.playComparisonDemo([0, 1, 2], [0, 1, 4], {
            sound: 'marimba',
            noteDurationMs: 450,
            gapBetweenPhrasesMs: 600
        });
        DetectiveAudio.stopDemo();
        expect(duration).toBeGreaterThan(2500);
    });
});
