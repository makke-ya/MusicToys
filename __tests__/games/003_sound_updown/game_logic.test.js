const { GameLogic } = require('../../../games/003_sound_updown/game_logic');

describe('GameLogic', () => {
    let game;

    beforeEach(() => {
        // Mock Math.random for deterministic tests if needed, or just test logic ranges
        game = new GameLogic();
    });

    test('should initialize with level 1 defaults', () => {
        game.setLevel(1);
        expect(game.level).toBe(1);
        // Lv1: useAnimalSounds = true (or implied by implementation)
    });

    test('should generate a problem with large interval for Level 1 (Initial)', () => {
        game.setLevel(1);
        const problem = game.generateProblem();
        
        // Initial Lv1: 12.0 semitones
        const diff = Math.abs(problem.targetNote - problem.baseNote);
        expect(diff).toBeCloseTo(12.0, 5);
    });

    test('should generate a problem with small interval for Level 30 (Initial)', () => {
        game.setLevel(30);
        const problem = game.generateProblem();
        const diff = Math.abs(problem.targetNote - problem.baseNote);
        
        // Initial Lv30: 0.5 semitones
        expect(diff).toBeCloseTo(0.5, 5);
    });

    test('difficulty should increase with combo (Lv30 Max)', () => {
        game.setLevel(30);
        game.combo = 30; // Max combo
        
        const problem = game.generateProblem();
        const diff = Math.abs(problem.targetNote - problem.baseNote);
        
        // Max Lv30: 0.03 semitones
        expect(diff).toBeCloseTo(0.03, 5);
    });

    test('checkAnswer wrong should reset combo', () => {
        game.setLevel(1);
        game.combo = 10;
        
        const problem = game.generateProblem();
        const correctIsUp = problem.targetNote > problem.baseNote;
        
        const result = game.checkAnswer(!correctIsUp); // Wrong
        
        expect(result).toBe(false);
        expect(game.combo).toBe(0);
    });
});
