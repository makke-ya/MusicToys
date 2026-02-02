(function(root) {
  class HarmonyGameLogic {
    constructor({ tolerance, correctSliderValue, interval = 'Perfect 1st', dynamics = 'none', timbre = 'Sawtooth Wave' }) {
      this.tolerance = tolerance;
      this.correctSliderValue = correctSliderValue;
      this.interval = interval;
      this.dynamics = dynamics;
      this.timbre = timbre;
    }

    /**
     * スライダーの値に基づいて、変化させた周波数を計算する
     * @param {number} baseFreq 基準周波数
     * @param {number} sliderValue 現在のスライダーの値
     * @returns {number} 計算された周波数
     */
    calculateFrequency(baseFreq, sliderValue) {
      const centsPerStep = this.tolerance / 2;
      const stepsDiff = sliderValue - this.correctSliderValue;
      const centsDiff = stepsDiff * centsPerStep;
      return baseFreq * Math.pow(2, centsDiff / 1200);
    }

    /**
     * 回答が正解かどうかを判定する
     * @param {number} sliderValue 現在のスライダーの値
     * @returns {boolean} 正解ならtrue
     */
    isCorrect(sliderValue) {
      const diff = Math.abs(sliderValue - this.correctSliderValue);
      return diff <= 2;
    }

    /**
     * うなりの強度（視覚化用）を計算する
     * @param {number} sliderValue 現在のスライダーの値
     * @returns {number} 強度 (0以上。0は完全に一致)
     */
    getBeatIntensity(sliderValue) {
      const diff = Math.abs(sliderValue - this.correctSliderValue);
      return diff * 0.1; 
    }

    /**
     * 音程と楽器に基づいて推奨されるオシレータータイプを返す
     * @returns {string} 'sine' | 'sawtooth' | 'triangle' | 'square'
     */
    getOscillatorType() {
        if (this.timbre === 'Flute') {
            return 'triangle';
        }
        return 'sawtooth';
    }

    /**
     * ダイナミクス設定に基づいたゲインカーブ（音量変化）を返す
     * @param {number} duration 秒数
     * @returns {Float32Array} Web Audio APIのsetValueCurveAtTimeで使える配列
     */
    getDynamicsCurve(duration) {
        const sampleRate = 10;
        const length = Math.floor(duration * sampleRate);
        const curve = new Float32Array(length);
        const minVol = 0.05;
        const maxVol = 0.5; 
        
        for (let i = 0; i < length; i++) {
            const t = i / (length - 1);
            
            switch (this.dynamics) {
                case 'Crescendo':
                    curve[i] = minVol + (maxVol - minVol) * t;
                    break;
                case 'Decrescendo':
                    curve[i] = maxVol - (maxVol - minVol) * t;
                    break;
                case 'Swell':
                    if (t < 0.5) {
                        curve[i] = minVol + (maxVol - minVol) * (t * 2);
                    } else {
                        curve[i] = maxVol - (maxVol - minVol) * ((t - 0.5) * 2);
                    }
                    break;
                case 'Diminuendo-Crescendo':
                     if (t < 0.5) {
                        curve[i] = maxVol - (maxVol - minVol) * (t * 2);
                    } else {
                        curve[i] = minVol + (maxVol - minVol) * ((t - 0.5) * 2);
                    }
                    break;
                case 'none':
                default:
                    curve[i] = 0.5; 
                    break;
            }
        }
        return curve;
    }

    /**
     * 音程名に対応する周波数比（純正律 Just Intonation）を返す
     * @param {string} intervalName 
     * @returns {number} 周波数比
     */
    static getIntervalRatio(intervalName) {
        const ratioMap = {
            'Perfect 1st': 1.0,
            'minor 2nd': 16 / 15,
            'Major 2nd': 9 / 8,
            'minor 3rd': 6 / 5,
            'Major 3rd': 5 / 4,
            'Perfect 4th': 4 / 3,
            'Tritone': 45 / 32, // Diatonic Tritone
            'Perfect 5th': 3 / 2,
            'minor 6th': 8 / 5,
            'Major 6th': 5 / 3,
            'minor 7th': 9 / 5, // Just minor 7th
            'Major 7th': 15 / 8,
            'Perfect 8th': 2.0,
            'Octave': 2.0
        };

        const ratio = ratioMap[intervalName];
        if (ratio === undefined) {
            console.warn(`Unknown interval: ${intervalName}. Defaulting to Perfect 1st.`);
            return 1.0;
        }

        return ratio;
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HarmonyGameLogic };
  } else {
    root.HarmonyGameLogic = HarmonyGameLogic;
  }
})(typeof window !== 'undefined' ? window : this);