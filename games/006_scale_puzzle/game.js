(function(root) {
    const SCALE_FREQS = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];

    const ScalePuzzleAudio = (function() {
        let audioContext = null;
        let masterGain = null;
        let currentSound = 'marimba';
        let activeTimeouts = [];

        function initAudio() {
            try {
                if (typeof window === 'undefined') return;
                if (!audioContext) {
                    const AudioCtx = window.AudioContext || window.webkitAudioContext;
                    if (!AudioCtx) return;
                    audioContext = new AudioCtx();
                    masterGain = audioContext.createGain();
                    masterGain.gain.value = 0.55;
                    masterGain.connect(audioContext.destination);
                }
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume().catch(e => console.warn('AudioContext resume warning:', e));
                }
            } catch (e) {
                console.warn('AudioContext init error (ignored):', e);
            }
        }

        function setSound(soundName) {
            if (soundName) {
                currentSound = soundName;
            }
        }

        function getSound() {
            return currentSound;
        }

        function getNoteFrequency(noteIndex, transposeSemitones = 0) {
            const baseFreq = SCALE_FREQS[noteIndex] || 261.63;
            if (!transposeSemitones) return baseFreq;
            return baseFreq * Math.pow(2, transposeSemitones / 12);
        }

        function playNote(noteIndex, soundName, durationSec = 0.45, transposeSemitones = 0) {
            initAudio();
            if (!audioContext || !masterGain) return;

            const freq = getNoteFrequency(noteIndex, transposeSemitones);
            const timbre = soundName || currentSound;
            const now = audioContext.currentTime;

            try {
                if (timbre === 'marimba') {
                    const osc1 = audioContext.createOscillator();
                    const gain1 = audioContext.createGain();
                    osc1.type = 'sine';
                    osc1.frequency.setValueAtTime(freq, now);
                    gain1.gain.setValueAtTime(0.01, now);
                    gain1.gain.linearRampToValueAtTime(0.85, now + 0.012);
                    gain1.gain.exponentialRampToValueAtTime(0.01, now + durationSec);
                    osc1.connect(gain1);
                    gain1.connect(masterGain);
                    osc1.start(now);
                    osc1.stop(now + durationSec + 0.02);

                    const osc2 = audioContext.createOscillator();
                    const gain2 = audioContext.createGain();
                    osc2.type = 'sine';
                    osc2.frequency.setValueAtTime(freq * 4, now);
                    gain2.gain.setValueAtTime(0.25, now);
                    gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.06);
                    osc2.connect(gain2);
                    gain2.connect(masterGain);
                    osc2.start(now);
                    osc2.stop(now + 0.07);
                } else if (timbre === 'musicbox') {
                    const osc1 = audioContext.createOscillator();
                    const gain1 = audioContext.createGain();
                    osc1.type = 'sine';
                    osc1.frequency.setValueAtTime(freq, now);
                    gain1.gain.setValueAtTime(0.01, now);
                    gain1.gain.linearRampToValueAtTime(0.65, now + 0.008);
                    gain1.gain.exponentialRampToValueAtTime(0.01, now + durationSec * 1.3);
                    osc1.connect(gain1);
                    gain1.connect(masterGain);
                    osc1.start(now);
                    osc1.stop(now + durationSec * 1.35);

                    const osc2 = audioContext.createOscillator();
                    const gain2 = audioContext.createGain();
                    osc2.type = 'triangle';
                    osc2.frequency.setValueAtTime(freq * 2, now);
                    gain2.gain.setValueAtTime(0.2, now);
                    gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.18);
                    osc2.connect(gain2);
                    gain2.connect(masterGain);
                    osc2.start(now);
                    osc2.stop(now + 0.2);
                } else if (timbre === 'piano') {
                    const osc1 = audioContext.createOscillator();
                    const gain1 = audioContext.createGain();
                    osc1.type = 'triangle';
                    osc1.frequency.setValueAtTime(freq, now);
                    gain1.gain.setValueAtTime(0.01, now);
                    gain1.gain.linearRampToValueAtTime(0.75, now + 0.015);
                    gain1.gain.exponentialRampToValueAtTime(0.01, now + durationSec * 1.15);
                    osc1.connect(gain1);
                    gain1.connect(masterGain);
                    osc1.start(now);
                    osc1.stop(now + durationSec * 1.2);

                    const osc2 = audioContext.createOscillator();
                    const gain2 = audioContext.createGain();
                    osc2.type = 'sine';
                    osc2.frequency.setValueAtTime(freq * 2, now);
                    gain2.gain.setValueAtTime(0.22, now);
                    gain2.gain.exponentialRampToValueAtTime(0.01, now + durationSec * 0.6);
                    osc2.connect(gain2);
                    gain2.connect(masterGain);
                    osc2.start(now);
                    osc2.stop(now + durationSec * 0.65);
                } else {
                    [-3, 3].forEach(detuneCents => {
                        const osc = audioContext.createOscillator();
                        const gain = audioContext.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(freq, now);
                        osc.detune.setValueAtTime(detuneCents, now);
                        gain.gain.setValueAtTime(0.01, now);
                        gain.gain.linearRampToValueAtTime(0.4, now + 0.02);
                        gain.gain.exponentialRampToValueAtTime(0.01, now + durationSec);
                        osc.connect(gain);
                        gain.connect(masterGain);
                        osc.start(now);
                        osc.stop(now + durationSec + 0.02);
                    });
                }
            } catch (e) {
                console.warn('playNote error (ignored):', e);
            }
        }

        function stopDemo() {
            activeTimeouts.forEach(id => clearTimeout(id));
            activeTimeouts = [];
        }

        function playDemo(notes, options = {}) {
            stopDemo();
            initAudio();

            const soundName = options.sound || currentSound;
            const demoCount = options.demoCount || 1;
            const noteDurationMs = options.noteDurationMs || 480;
            const transposeSemitones = options.transposeSemitones || 0;
            const onNote = typeof options.onNote === 'function' ? options.onNote : () => {};
            const onRoundStart = typeof options.onRoundStart === 'function' ? options.onRoundStart : () => {};
            const onComplete = typeof options.onComplete === 'function' ? options.onComplete : () => {};

            const singleRoundDurationMs = notes.length * noteDurationMs;

            for (let round = 0; round < demoCount; round++) {
                const roundOffsetMs = round * (singleRoundDurationMs + 480);

                const roundTimer = setTimeout(() => {
                    onRoundStart(round);
                }, roundOffsetMs);
                activeTimeouts.push(roundTimer);

                notes.forEach((noteIdx, positionIdx) => {
                    const timerId = setTimeout(() => {
                        playNote(noteIdx, soundName, Math.max(0.28, (noteDurationMs / 1000) * 0.88), transposeSemitones);
                        onNote(noteIdx, positionIdx, round);
                    }, roundOffsetMs + positionIdx * noteDurationMs);
                    activeTimeouts.push(timerId);
                });
            }

            const totalDurationMs = demoCount * singleRoundDurationMs + (demoCount - 1) * 480 + 240;
            const completeTimer = setTimeout(() => {
                onComplete();
            }, totalDurationMs);
            activeTimeouts.push(completeTimer);

            return totalDurationMs;
        }

        function playResultEffect(stars) {
            initAudio();
            if (!audioContext || !masterGain) return;

            const freqs = stars === 3 ? [523.25, 659.25, 783.99, 1046.5]
                        : stars === 2 ? [523.25, 659.25, 783.99]
                        : [392.0, 349.23];
            const now = audioContext.currentTime;

            freqs.forEach((f, idx) => {
                try {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(f, now + idx * 0.11);
                    gain.gain.setValueAtTime(0.32, now + idx * 0.11);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.11 + 0.25);
                    osc.connect(gain);
                    gain.connect(masterGain);
                    osc.start(now + idx * 0.11);
                    osc.stop(now + idx * 0.11 + 0.26);
                } catch (e) {}
            });
        }

        return {
            initAudio,
            setSound,
            getSound,
            getNoteFrequency,
            playNote,
            playDemo,
            stopDemo,
            playResultEffect
        };
    })();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { ScalePuzzleAudio };
    } else {
        root.ScalePuzzleAudio = ScalePuzzleAudio;
    }
})(typeof window !== 'undefined' ? window : this);
