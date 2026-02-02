(function(root) {
    class GameLogic {
        constructor() {
            this.level = 1;
            this.currentScore = 0;
            this.combo = 0;
            this.lastNote = null;
            this.currentProblem = null;
            
            // MIDI note range (C3=48 to C6=84 approx)
            this.minNote = 48;
            this.maxNote = 84;
        }

        setLevel(level) {
            this.level = level;
            this.reset();
        }

        reset() {
            this.currentScore = 0;
            this.combo = 0;
            this.lastNote = null;
            this.currentProblem = null;
        }

        generateProblem() {
            let baseNote;
            
            if (this.lastNote === null) {
                // First problem: pick random start note
                baseNote = Math.floor(Math.random() * (this.maxNote - this.minNote + 1)) + this.minNote;
            } else {
                baseNote = this.lastNote;
            }

            // Determine interval range based on level and combo
            // Interpolate between startInterval and endInterval based on combo (0 to 30)
            let startInterval, endInterval;
            
            if (this.level >= 30) {
                startInterval = 0.5; // Quarter tone (50 cents)
                endInterval = 0.03;  // 3 cents
            } else if (this.level >= 15) {
                startInterval = 2.0; // Major 2nd
                endInterval = 0.5;   // Quarter tone
            } else {
                // Level 1
                startInterval = 12.0; // Octave
                endInterval = 2.0;    // Major 2nd
            }

            const progress = Math.min(1, this.combo / 30);
            // Linear interpolation: start -> end
            // Note: Intervals get SMALLER as difficulty increases, so start > end
            const interval = startInterval - (startInterval - endInterval) * progress;

            // Decide direction (Up or Down)
            let isUp = Math.random() < 0.5;
            let targetNote;

            // Retry logic to stay in bounds
            // Since interval is small, simple bounce check is enough
            if (isUp) {
                targetNote = baseNote + interval;
                if (targetNote > this.maxNote) {
                    targetNote = baseNote - interval;
                    isUp = false;
                }
            } else {
                targetNote = baseNote - interval;
                if (targetNote < this.minNote) {
                    targetNote = baseNote + interval;
                    isUp = true;
                }
            }
            
            this.currentProblem = {
                baseNote: baseNote,
                targetNote: targetNote,
                isUp: isUp,
                interval: interval
            };
            
            // Update for next chain
            this.lastNote = targetNote;

            return this.currentProblem;
        }

        checkAnswer(userSelectedUp) {
            if (!this.currentProblem) return false;
            
            const isCorrect = (userSelectedUp === this.currentProblem.isUp);
            if (isCorrect) {
                this.combo++;
                // Score Bonus: Base 1 + floor(Combo / 5)
                // e.g., Combo 1-4: +1, Combo 5-9: +2
                this.currentScore += (1 + Math.floor((this.combo - 1) / 5));
            } else {
                this.combo = 0;
                // No penalty score
            }
            return isCorrect;
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { GameLogic };
    } else {
        root.GameLogic = GameLogic;
    }
})(typeof window !== 'undefined' ? window : this);
