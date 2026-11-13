const { ChordMoodGameLogic } = require('../../../games/009_chord_mood/game_logic');
const { ChordMoodAudio } = require('../../../games/009_chord_mood/game');
const levelDesign = require('../../../games/009_chord_mood/level_design.json');

describe('ChordMoodGameLogic', () => {
    let logic;

    beforeEach(() => {
        logic = new ChordMoodGameLogic(levelDesign);
    });

    test('should initialize with level 1 defaults', () => {
        expect(logic.level).toBe(1);
        expect(logic.totalScore).toBe(0);
        const config = logic.getCurrentLevelConfig();
        expect(config.level).toBe(1);
        expect(config.padCount).toBe(2);
        expect(config.stepCount).toBe(1);
        expect(config.moods).toEqual([0]);
        expect(config.guideMode).toBe('all');
        expect(config.arpeggioHint).toBe(true);
    });

    test('should return correct mood pads for padCount (2, 3, 4)', () => {
        const pads2 = logic.getMoodPads(2);
        expect(pads2).toHaveLength(2);
        expect(pads2[0].id).toBe('major');
        expect(pads2[0].name).toBe('はれ');
        expect(pads2[1].id).toBe('minor');
        expect(pads2[1].name).toBe('あめ');

        const pads3 = logic.getMoodPads(3);
        expect(pads3).toHaveLength(3);
        expect(pads3[2].id).toBe('diminished');
        expect(pads3[2].name).toBe('かみなり');

        const pads4 = logic.getMoodPads(4);
        expect(pads4).toHaveLength(4);
        expect(pads4[3].id).toBe('augmented');
        expect(pads4[3].name).toBe('オーロラ');
    });

    test('should build accurate chord MIDI notes for triads, inversions, and seventh chords', () => {
        // Root position C4 (60) triads
        expect(logic.buildChordMidiNotes(0, 60, { inversion: 0, useSeventh: false })).toEqual([60, 64, 67]); // C Major
        expect(logic.buildChordMidiNotes(1, 60, { inversion: 0, useSeventh: false })).toEqual([60, 63, 67]); // C Minor
        expect(logic.buildChordMidiNotes(2, 60, { inversion: 0, useSeventh: false })).toEqual([60, 63, 66]); // C Diminished
        expect(logic.buildChordMidiNotes(3, 60, { inversion: 0, useSeventh: false })).toEqual([60, 64, 68]); // C Augmented

        // 1st and 2nd inversions of C Major
        expect(logic.buildChordMidiNotes(0, 60, { inversion: 1, useSeventh: false })).toEqual([64, 67, 72]);
        expect(logic.buildChordMidiNotes(0, 60, { inversion: 2, useSeventh: false })).toEqual([67, 72, 76]);

        // 7th chords on C4 (60)
        expect(logic.buildChordMidiNotes(0, 60, { inversion: 0, useSeventh: true })).toEqual([60, 64, 67, 71]); // CMaj7
        expect(logic.buildChordMidiNotes(1, 60, { inversion: 0, useSeventh: true })).toEqual([60, 63, 67, 70]); // Cm7
        expect(logic.buildChordMidiNotes(2, 60, { inversion: 0, useSeventh: true })).toEqual([60, 63, 66, 69]); // Cdim7
        expect(logic.buildChordMidiNotes(3, 60, { inversion: 0, useSeventh: true })).toEqual([60, 64, 68, 71]); // CaugMaj7
    });

    test('should determine visual guide highlight correctly for all, first_only, and none modes', () => {
        expect(logic.shouldHighlightGuide(0, 3, 'all')).toBe(true);
        expect(logic.shouldHighlightGuide(2, 3, 'all')).toBe(true);

        expect(logic.shouldHighlightGuide(0, 3, 'first_only')).toBe(true);
        expect(logic.shouldHighlightGuide(1, 3, 'first_only')).toBe(false);
        expect(logic.shouldHighlightGuide(2, 3, 'first_only')).toBe(false);

        expect(logic.shouldHighlightGuide(0, 3, 'none')).toBe(false);
        expect(logic.shouldHighlightGuide(1, 3, 'none')).toBe(false);
    });

    test('should have 50 valid levels and generate problems with non-repeating root pitch and mood sequence', () => {
        expect(levelDesign).toHaveLength(50);
        for (const lvl of levelDesign) {
            expect(Array.isArray(lvl.progressions)).toBe(true);
            expect(lvl.progressions.length).toBeGreaterThanOrEqual(5);
            for (const p of lvl.progressions) {
                expect(p.moods).toHaveLength(lvl.stepCount);
                for (const m of p.moods) {
                    expect(m).toBeGreaterThanOrEqual(0);
                    expect(m).toBeLessThan(lvl.padCount);
                }
            }
        }

        // Single-chord level: consecutive problems must change mood and rootMidi
        logic.setLevel(10);
        const p1 = logic.generateProblem();
        const p2 = logic.generateProblem();
        expect(p1.moods).toHaveLength(1);
        expect(p2.moods).toHaveLength(1);
        expect(JSON.stringify(p2.moods)).not.toBe(JSON.stringify(p1.moods));
        expect(p2.rootMidi).not.toBe(p1.rootMidi);

        // Multi-chord progression level
        logic.setLevel(35);
        const p3 = logic.generateProblem();
        const p4 = logic.generateProblem();
        expect(p3.moods).toHaveLength(3);
        expect(p4.moods).toHaveLength(3);
        expect(JSON.stringify(p4.moods)).not.toBe(JSON.stringify(p3.moods));
        expect(p4.rootMidi).not.toBe(p3.rootMidi);
    });

    test('should create a progression variation altering the final mood within padCount bounds', () => {
        const baseMoods = [0, 1, 0];
        const varied = logic.createProgressionVariation(baseMoods, 4);

        expect(varied).toHaveLength(3);
        expect(varied[0]).toBe(0);
        expect(varied[1]).toBe(1);
        expect(varied[2]).not.toBe(0);
        expect(varied[2]).toBeGreaterThanOrEqual(0);
        expect(varied[2]).toBeLessThan(4);
    });

    test('should reject mood input when disabled (during demo playback)', () => {
        logic.setLevel(1);
        logic.setInputEnabled(false);
        expect(logic.canAcceptInput()).toBe(false);

        expect(logic.recordMood(0)).toBe(0);
        expect(logic.recordedMoods).toHaveLength(0);

        logic.setInputEnabled(true);
        expect(logic.canAcceptInput()).toBe(true);
        expect(logic.recordMood(0)).toBe(1);
        expect(logic.recordedMoods).toEqual([0]);
    });

    test('should evaluate 3-step progression and return 3 stars for all correct moods', () => {
        logic.setLevel(31); // default moods: [0, 1, 0]
        const result = logic.evaluateSequence([0, 1, 0]);

        expect(result.judgments).toEqual(['correct', 'correct', 'correct']);
        expect(result.stars).toBe(3);
        // 3 * 100 + 100 (perfect bonus) + 31 * 10 (level bonus) = 710
        expect(result.score).toBe(710);
        expect(result.canAdvance).toBe(true);
        expect(logic.totalScore).toBe(710);
    });

    test('should return 2 stars when at least half of moods are correct', () => {
        logic.setLevel(31); // expected: [0, 1, 0]
        const result = logic.evaluateSequence([0, 1, 2]); // 2 of 3 correct

        expect(result.judgments).toEqual(['correct', 'correct', 'wrong']);
        expect(result.stars).toBe(2);
        // 2 * 100 + 0 (no perfect bonus) + 310 = 510
        expect(result.score).toBe(510);
        expect(result.canAdvance).toBe(true);
    });

    test('should return 1 star and canAdvance false when majority of moods are wrong', () => {
        logic.setLevel(31); // expected: [0, 1, 0]
        const result = logic.evaluateSequence([2, 2, 0]); // 1 of 3 correct

        expect(result.judgments).toEqual(['wrong', 'wrong', 'correct']);
        expect(result.stars).toBe(1);
        expect(result.score).toBe(410);
        expect(result.canAdvance).toBe(false);
    });

    test('should advance level up to 50 and report completion at level 50', () => {
        logic.setLevel(49);
        expect(logic.advanceLevel()).toEqual({ completedAll: false, level: 50 });
        expect(logic.advanceLevel()).toEqual({ completedAll: true, level: 50 });
    });

    test('should keep the exact same problem (moods, rootMidi, inversions, steps) when retrying with keepCurrentProblem', () => {
        logic.setLevel(25);
        const firstProblem = logic.generateProblem();
        logic.recordMood(0);
        expect(logic.recordedMoods).toHaveLength(1);

        const retryProblem = logic.generateProblem({ keepCurrentProblem: true });
        expect(retryProblem.title).toBe(firstProblem.title);
        expect(retryProblem.moods).toEqual(firstProblem.moods);
        expect(retryProblem.rootMidi).toBe(firstProblem.rootMidi);
        expect(retryProblem.inversions).toEqual(firstProblem.inversions);
        expect(retryProblem.steps).toEqual(firstProblem.steps);
        expect(logic.recordedMoods).toHaveLength(0);
    });

    test('should provide replay and comparison chord data (expectedSteps and actualSteps) on evaluation for listening comparison', () => {
        logic.setLevel(23);
        const problem = logic.generateProblem();
        const expectedMoods = problem.moods;
        const wrongMood = (expectedMoods[0] + 1) % 3;
        const userMoods = [wrongMood, expectedMoods[1]];

        const result = logic.evaluateSequence(userMoods);
        expect(Array.isArray(result.expectedSteps)).toBe(true);
        expect(Array.isArray(result.actualSteps)).toBe(true);
        expect(result.expectedSteps).toHaveLength(expectedMoods.length);
        expect(result.actualSteps).toHaveLength(expectedMoods.length);

        // Step 0 was wrong: expectedSteps[0] and actualSteps[0] share the same rootMidi/inversion but have different moodIndex & midiNotes
        expect(result.expectedSteps[0].moodIndex).toBe(expectedMoods[0]);
        expect(result.actualSteps[0].moodIndex).toBe(wrongMood);
        expect(result.actualSteps[0].rootMidi).toBe(result.expectedSteps[0].rootMidi);
        expect(result.actualSteps[0].midiNotes).not.toEqual(result.expectedSteps[0].midiNotes);
        expect(result.actualSteps[0].isCorrect).toBe(false);
        expect(result.actualSteps[1].isCorrect).toBe(true);

        const replayData = logic.getComparisonReplayData();
        expect(replayData.expectedSteps).toEqual(result.expectedSteps);
        expect(replayData.actualSteps).toEqual(result.actualSteps);
    });

    test('ChordMoodAudio should manage sound setting, convert MIDI to frequency, and calculate demo duration', () => {
        ChordMoodAudio.setSound('strings');
        expect(ChordMoodAudio.getSound()).toBe('strings');
        expect(ChordMoodAudio.midiToFrequency(69)).toBeCloseTo(440.0, 2);

        const steps = [
            { moodIndex: 0, midiNotes: [60, 64, 67] },
            { moodIndex: 1, midiNotes: [60, 63, 67] }
        ];
        const duration = ChordMoodAudio.playDemo(steps, {
            sound: 'piano',
            demoCount: 1,
            chordDurationMs: 700,
            arpeggioHint: true
        });
        ChordMoodAudio.stopDemo();
        expect(duration).toBeGreaterThan(1400);
    });
});
