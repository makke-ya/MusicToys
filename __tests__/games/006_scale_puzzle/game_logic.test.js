const { ScalePuzzleLogic } = require('../../../games/006_scale_puzzle/game_logic');
const { ScalePuzzleAudio } = require('../../../games/006_scale_puzzle/game');
const levelDesign = require('../../../games/006_scale_puzzle/level_design.json');

describe('ScalePuzzleLogic', () => {
    let logic;

    beforeEach(() => {
        logic = new ScalePuzzleLogic(levelDesign);
    });

    test('should initialize with level 1 defaults', () => {
        expect(logic.level).toBe(1);
        expect(logic.totalScore).toBe(0);
        const config = logic.getCurrentLevelConfig();
        expect(config.level).toBe(1);
        expect(config.puzzleMode).toBe('fill_blank');
        expect(config.blankCount).toBe(1);
        expect(config.hintMode).toBe('full');
    });

    test('should return correct scale notes for maxNoteIndex (3, 5, 8)', () => {
        const notes3 = logic.getScaleNotes(3);
        expect(notes3).toHaveLength(3);
        expect(notes3[0].name).toBe('ド');
        expect(notes3[2].name).toBe('ミ');

        const notes8 = logic.getScaleNotes(8);
        expect(notes8).toHaveLength(8);
        expect(notes8[4].name).toBe('ソ');
        expect(notes8[7].name).toBe('ド(高)');
    });

    test('should have 50 valid levels covering fill_blank (Lv.1-20) and sort_asc/sort_desc (Lv.21-50)', () => {
        expect(levelDesign).toHaveLength(50);
        for (const lvl of levelDesign) {
            expect(Array.isArray(lvl.patterns)).toBe(true);
            expect(lvl.patterns.length).toBeGreaterThanOrEqual(5);
            if (lvl.level <= 20) {
                expect(lvl.puzzleMode).toBe('fill_blank');
                expect(lvl.blankCount).toBeGreaterThanOrEqual(1);
            } else {
                expect(['sort_asc', 'sort_desc']).toContain(lvl.puzzleMode);
                expect(lvl.blankCount).toBe(lvl.stepCount);
            }
        }
    });

    test('should generate non-repeating problems with valid blankIndices and candidateBlocks', () => {
        logic.setLevel(5);
        const p1 = logic.generateProblem();
        const p2 = logic.generateProblem();

        expect(p1.blankIndices).toHaveLength(1);
        expect(p1.candidateBlocks).toHaveLength(2); // 1 blank + 1 distractor
        expect(p1.key).not.toBe(p2.key);

        // Candidate blocks must contain the missing note(s)
        const missingNote = p1.notes[p1.blankIndices[0]];
        const candidateNotes = p1.candidateBlocks.map(c => c.noteIndex);
        expect(candidateNotes).toContain(missingNote);

        // Sort level problem generation
        logic.setLevel(25);
        const sortProb = logic.generateProblem();
        expect(sortProb.blankIndices).toEqual([0, 1, 2]);
        expect(sortProb.candidateBlocks).toHaveLength(3);
        // Scrambled candidates should not already match expected order
        expect(sortProb.candidateBlocks.map(c => c.noteIndex)).not.toEqual(sortProb.notes);
    });

    test('should reject audition and placement when input is disabled (during demo playback)', () => {
        logic.setLevel(1);
        const problem = logic.generateProblem();
        const firstCandidateId = problem.candidateBlocks[0].id;

        logic.setInputEnabled(false);
        expect(logic.canAcceptInput()).toBe(false);
        expect(logic.auditionCandidate(firstCandidateId)).toBeNull();
        expect(logic.placeCandidate(firstCandidateId)).toBe(false);
        expect(logic.getFilledBlankCount()).toBe(0);

        logic.setInputEnabled(true);
        expect(logic.canAcceptInput()).toBe(true);
        const auditioned = logic.auditionCandidate(firstCandidateId);
        expect(auditioned).not.toBeNull();
        expect(auditioned.id).toBe(firstCandidateId);

        expect(logic.placeCandidate(firstCandidateId)).toBe(true);
        expect(logic.getFilledBlankCount()).toBe(1);
    });

    test('should support undoLastPlacement to remove the most recently placed block', () => {
        logic.setLevel(12); // 2 blanks
        const problem = logic.generateProblem();
        const c0 = problem.candidateBlocks[0];
        const c1 = problem.candidateBlocks[1];

        expect(logic.placeCandidate(c0.id)).toBe(true);
        expect(logic.getFilledBlankCount()).toBe(1);
        expect(logic.isInputComplete()).toBe(false);

        const undone = logic.undoLastPlacement();
        expect(undone).not.toBeNull();
        expect(undone.id).toBe(c0.id);
        expect(logic.getFilledBlankCount()).toBe(0);

        // Can place c0 again after undo
        expect(logic.placeCandidate(c0.id)).toBe(true);
        expect(logic.placeCandidate(c1.id)).toBe(true);
        expect(logic.isInputComplete()).toBe(true);
    });

    test('should evaluate puzzle and return 3 stars when all blanks are filled with correct notes', () => {
        logic.setLevel(1);
        const problem = logic.generateProblem();
        const targetStepIdx = problem.blankIndices[0];
        const expectedNote = problem.notes[targetStepIdx];
        const correctCandidate = problem.candidateBlocks.find(c => c.noteIndex === expectedNote);

        logic.placeCandidate(correctCandidate.id);
        expect(logic.isInputComplete()).toBe(true);

        const result = logic.evaluatePuzzle();
        expect(result.stars).toBe(3);
        expect(result.correctCount).toBe(1);
        expect(result.wrongCount).toBe(0);
        // 1 * 100 + 100 (perfect bonus) + 1 * 10 (level bonus) = 210
        expect(result.score).toBe(210);
        expect(result.canAdvance).toBe(true);
        expect(logic.totalScore).toBe(210);
    });

    test('should return 2 stars when at least half of blanks are correct, and 1 star when fewer', () => {
        logic.setLevel(21); // 3 blanks in sort_asc
        const problem = logic.generateProblem();

        // Test 1 star (all wrong or only 1 of 3 correct)
        // Find an order where at most 1 of 3 matches problem.notes
        const wrongOrder = problem.notes.slice().reverse();
        const result1 = logic.evaluateStepSequence(wrongOrder);
        // For 3 notes reversed, only middle index (1 of 3) is correct -> < ceil(3/2)=2 -> 1 star
        expect(result1.correctCount).toBe(1);
        expect(result1.stars).toBe(1);
        expect(result1.canAdvance).toBe(false);

        // Test 2 stars on a 2-blank problem where 1 of 2 is correct
        logic.setLevel(12); // 2 blanks
        const p12 = logic.generateProblem();
        const seq12 = p12.notes.slice();
        // Make first blank correct, second blank wrong
        const secondBlankStep = p12.blankIndices[1];
        seq12[secondBlankStep] = (seq12[secondBlankStep] + 1) % 5;
        const result2 = logic.evaluateStepSequence(seq12);
        expect(result2.correctCount).toBe(1);
        expect(result2.totalBlanks).toBe(2);
        expect(result2.stars).toBe(2);
        expect(result2.canAdvance).toBe(true);
    });

    test('should advance level up to 50 and report completion at level 50', () => {
        logic.setLevel(49);
        expect(logic.advanceLevel()).toEqual({ completedAll: false, level: 50 });
        expect(logic.advanceLevel()).toEqual({ completedAll: true, level: 50 });
    });

    test('ScalePuzzleAudio should manage sound setting, transposition frequency, and demo duration', () => {
        ScalePuzzleAudio.setSound('piano');
        expect(ScalePuzzleAudio.getSound()).toBe('piano');

        const baseFreq = ScalePuzzleAudio.getNoteFrequency(0, 0);
        const transposedFreq = ScalePuzzleAudio.getNoteFrequency(0, 12);
        expect(baseFreq).toBeCloseTo(261.63, 1);
        expect(transposedFreq).toBeCloseTo(baseFreq * 2, 1);

        const duration = ScalePuzzleAudio.playDemo([0, 1, 2], {
            sound: 'marimba',
            demoCount: 2,
            noteDurationMs: 450,
            transposeSemitones: 2
        });
        ScalePuzzleAudio.stopDemo();
        expect(duration).toBeGreaterThan(2200);
    });

    test('should support switching notationMode between movable and fixed and return accurate note display names', () => {
        // Default notationMode is movable
        expect(logic.getNotationMode()).toBe('movable');
        expect(logic.getNoteDisplayName(0, 2)).toBe('ド');
        expect(logic.getNoteDisplayName(2, 2)).toBe('ミ');
        expect(logic.getNoteDisplayName(7, 2)).toBe('ド(高)');

        // Switch to fixed notationMode
        logic.setNotationMode('fixed');
        expect(logic.getNotationMode()).toBe('fixed');

        // Transpose = 0 (C major): 0 -> ド, 1 -> レ, 2 -> ミ, 7 -> ド(高)
        expect(logic.getNoteDisplayName(0, 0)).toBe('ド');
        expect(logic.getNoteDisplayName(1, 0)).toBe('レ');
        expect(logic.getNoteDisplayName(7, 0)).toBe('ド(高)');

        // Transpose = +2 semitones (D major):
        // scaleIndex 0 (C4=60 + 2 = 62 -> D4) = 'レ'
        // scaleIndex 1 (D4=62 + 2 = 64 -> E4) = 'ミ'
        // scaleIndex 2 (E4=64 + 2 = 66 -> F#4) = 'ファ♯'
        // scaleIndex 3 (F4=65 + 2 = 67 -> G4) = 'ソ'
        // scaleIndex 7 (C5=72 + 2 = 74 -> D5, octave >= 72) = 'レ(高)'
        expect(logic.getNoteDisplayName(0, 2)).toBe('レ');
        expect(logic.getNoteDisplayName(1, 2)).toBe('ミ');
        expect(logic.getNoteDisplayName(2, 2)).toBe('ファ♯');
        expect(logic.getNoteDisplayName(3, 2)).toBe('ソ');
        expect(logic.getNoteDisplayName(7, 2)).toBe('レ(高)');

        // Transpose = +3 semitones (Eb major):
        // scaleIndex 0 (60 + 3 = 63 -> Eb4) = 'ミ♭'
        // scaleIndex 3 (65 + 3 = 68 -> G#4) = 'ソ♯'
        // scaleIndex 4 (67 + 3 = 70 -> Bb4) = 'シ♭'
        expect(logic.getNoteDisplayName(0, 3)).toBe('ミ♭');
        expect(logic.getNoteDisplayName(3, 3)).toBe('ソ♯');
        expect(logic.getNoteDisplayName(4, 3)).toBe('シ♭');

        // Problem and formatNoteNames should reflect current notationMode
        logic.setLevel(20);
        logic.generateProblem({ transposeSemitones: 2 });
        const probFixed = logic.getCurrentProblem();
        expect(probFixed.notationMode).toBe('fixed');
        expect(probFixed.displayNotes[0]).toBe(logic.getNoteDisplayName(probFixed.notes[0], 2, 'fixed'));
        expect(logic.formatNoteNames([0, 1, 2], 2)).toBe('レ → ミ → ファ♯');

        logic.setNotationMode('movable');
        const probMovable = logic.getCurrentProblem();
        expect(probMovable.notationMode).toBe('movable');
        expect(probMovable.displayNotes[0]).toBe(logic.getNoteDisplayName(probMovable.notes[0], 2, 'movable'));
        expect(logic.formatNoteNames([0, 1, 2], 2)).toBe('ド → レ → ミ');
    });
});
