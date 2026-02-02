const { HarmonyGameLogic } = require('../../../games/002_harmony_game/game_logic');

describe('HarmonyGameLogic', () => {
  let gameLogic;

  beforeEach(() => {
    // レベル1の設定（許容誤差20セント、ユニゾン）を想定
    // 正解のスライダー位置を固定（例: 5）してテストしやすくする
    gameLogic = new HarmonyGameLogic({
      tolerance: 20, // 20セント
      correctSliderValue: 5 // 正解はスライダー位置「5」
    });
  });

  test('should calculate frequency correctly based on slider value', () => {
    const baseFreq = 440; // 基準音 440Hz
    // 1目盛りあたりの変化量 = tolerance(20) / 2 = 10セント
    
    // ケース1: 正解位置 (5) の場合 -> ズレなし (440Hz)
    let freq = gameLogic.calculateFrequency(baseFreq, 5);
    expect(freq).toBeCloseTo(440, 2);

    // ケース2: 正解位置より+1目盛り (6) -> +10セント
    // 440 * 2^(10/1200)
    freq = gameLogic.calculateFrequency(baseFreq, 6);
    const expectedFreqPlus10 = 440 * Math.pow(2, 10 / 1200);
    expect(freq).toBeCloseTo(expectedFreqPlus10, 2);

    // ケース3: 正解位置より-2目盛り (3) -> -20セント
    // 440 * 2^(-20/1200)
    freq = gameLogic.calculateFrequency(baseFreq, 3);
    const expectedFreqMinus20 = 440 * Math.pow(2, -20 / 1200);
    expect(freq).toBeCloseTo(expectedFreqMinus20, 2);
  });

  test('should judge answer correctly', () => {
    // 正解位置は 5、許容範囲は ±2 (3 〜 7)
    
    expect(gameLogic.isCorrect(5)).toBe(true); // ど真ん中
    expect(gameLogic.isCorrect(3)).toBe(true); // ギリギリ下限
    expect(gameLogic.isCorrect(7)).toBe(true); // ギリギリ上限
    
    expect(gameLogic.isCorrect(2)).toBe(false); // 下限外
    expect(gameLogic.isCorrect(8)).toBe(false); // 上限外
  });

  test('should return beat intensity based on difference', () => {
    // 正解は 5, 許容範囲 ±2
    // ズレがない時は強度0
    expect(gameLogic.getBeatIntensity(5)).toBe(0);
    
    // ズレが大きいほど強度が大きくなる
    const intensitySmallDiff = gameLogic.getBeatIntensity(6); // 差1
    const intensityLargeDiff = gameLogic.getBeatIntensity(10); // 差5
    
    expect(intensitySmallDiff).toBeGreaterThan(0);
    expect(intensityLargeDiff).toBeGreaterThan(intensitySmallDiff);
  });

  test('should return correct oscillator type based on interval', () => {
    // 常に sawtooth (倍音が必要なため)
    let logic = new HarmonyGameLogic({ tolerance: 20, correctSliderValue: 0, interval: 'Perfect 1st' });
    expect(logic.getOscillatorType()).toBe('sawtooth');

    logic = new HarmonyGameLogic({ tolerance: 20, correctSliderValue: 0, interval: 'Perfect 5th' });
    expect(logic.getOscillatorType()).toBe('sawtooth');
    
    logic = new HarmonyGameLogic({ tolerance: 20, correctSliderValue: 0, interval: 'Perfect 8th' });
    expect(logic.getOscillatorType()).toBe('sawtooth');
  });

  test('should return dynamics gain curve', () => {
    // none: 変化なし (一定)
    let logic = new HarmonyGameLogic({ tolerance: 20, correctSliderValue: 0, dynamics: 'none' });
    let curve = logic.getDynamicsCurve(3.0); // 3秒間
    expect(curve[0]).toBeCloseTo(0.5);
    expect(curve[curve.length - 1]).toBeCloseTo(0.5);

    // Crescendo: だんだん大きく
    logic = new HarmonyGameLogic({ tolerance: 20, correctSliderValue: 0, dynamics: 'Crescendo' });
    curve = logic.getDynamicsCurve(3.0);
    expect(curve[0]).toBeLessThan(curve[curve.length - 1]);
  });

    test('should return correct interval ratio', () => {

      expect(HarmonyGameLogic.getIntervalRatio('Perfect 1st')).toBe(1.0);

      expect(HarmonyGameLogic.getIntervalRatio('Perfect 8th')).toBe(2.0);

      // Just Intonation 3/2 = 1.5

      expect(HarmonyGameLogic.getIntervalRatio('Perfect 5th')).toBe(1.5);

      expect(HarmonyGameLogic.getIntervalRatio('Unknown')).toBe(1.0);

    });

  });

  