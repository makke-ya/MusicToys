(function(root) {
    const ChordMoodAudio = (function() {
        let audioContext = null;
        let masterGain = null;
        let currentSound = 'piano';
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

        function midiToFrequency(midi) {
            return 440 * Math.pow(2, (midi - 69) / 12);
        }

        function playSingleVoice(freq, timbre, startTime, durationSec, voiceScale) {
            if (!audioContext || !masterGain) return;

            try {
                if (timbre === 'piano') {
                    const osc1 = audioContext.createOscillator();
                    const gain1 = audioContext.createGain();
                    osc1.type = 'triangle';
                    osc1.frequency.setValueAtTime(freq, startTime);
                    gain1.gain.setValueAtTime(0.005, startTime);
                    gain1.gain.linearRampToValueAtTime(0.55 * voiceScale, startTime + 0.015);
                    gain1.gain.exponentialRampToValueAtTime(0.008, startTime + durationSec * 1.1);
                    osc1.connect(gain1);
                    gain1.connect(masterGain);
                    osc1.start(startTime);
                    osc1.stop(startTime + durationSec * 1.15);

                    const osc2 = audioContext.createOscillator();
                    const gain2 = audioContext.createGain();
                    osc2.type = 'sine';
                    osc2.frequency.setValueAtTime(freq * 2, startTime);
                    gain2.gain.setValueAtTime(0.18 * voiceScale, startTime);
                    gain2.gain.exponentialRampToValueAtTime(0.005, startTime + durationSec * 0.65);
                    osc2.connect(gain2);
                    gain2.connect(masterGain);
                    osc2.start(startTime);
                    osc2.stop(startTime + durationSec * 0.7);
                } else if (timbre === 'musicbox') {
                    const osc1 = audioContext.createOscillator();
                    const gain1 = audioContext.createGain();
                    osc1.type = 'sine';
                    osc1.frequency.setValueAtTime(freq, startTime);
                    gain1.gain.setValueAtTime(0.005, startTime);
                    gain1.gain.linearRampToValueAtTime(0.5 * voiceScale, startTime + 0.008);
                    gain1.gain.exponentialRampToValueAtTime(0.008, startTime + durationSec * 1.25);
                    osc1.connect(gain1);
                    gain1.connect(masterGain);
                    osc1.start(startTime);
                    osc1.stop(startTime + durationSec * 1.3);

                    const osc2 = audioContext.createOscillator();
                    const gain2 = audioContext.createGain();
                    osc2.type = 'triangle';
                    osc2.frequency.setValueAtTime(freq * 3, startTime);
                    gain2.gain.setValueAtTime(0.12 * voiceScale, startTime);
                    gain2.gain.exponentialRampToValueAtTime(0.004, startTime + 0.22);
                    osc2.connect(gain2);
                    gain2.connect(masterGain);
                    osc2.start(startTime);
                    osc2.stop(startTime + 0.25);
                } else if (timbre === 'strings') {
                    [-4, 4].forEach(detuneCents => {
                        const osc = audioContext.createOscillator();
                        const gain = audioContext.createGain();
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(freq, startTime);
                        osc.detune.setValueAtTime(detuneCents, startTime);

                        const filter = audioContext.createBiquadFilter();
                        filter.type = 'lowpass';
                        filter.frequency.setValueAtTime(freq * 3.5, startTime);

                        gain.gain.setValueAtTime(0.005, startTime);
                        gain.gain.linearRampToValueAtTime(0.24 * voiceScale, startTime + Math.min(0.08, durationSec * 0.25));
                        gain.gain.exponentialRampToValueAtTime(0.008, startTime + durationSec * 1.08);
                        osc.connect(filter);
                        filter.connect(gain);
                        gain.connect(masterGain);
                        osc.start(startTime);
                        osc.stop(startTime + durationSec * 1.12);
                    });
                } else {
                    // organ: warm sine + octave + fifth harmonic
                    [1, 2].forEach((mult, idx) => {
                        const osc = audioContext.createOscillator();
                        const gain = audioContext.createGain();
                        osc.type = idx === 0 ? 'sine' : 'triangle';
                        osc.frequency.setValueAtTime(freq * mult, startTime);
                        const amp = (idx === 0 ? 0.42 : 0.16) * voiceScale;
                        gain.gain.setValueAtTime(0.005, startTime);
                        gain.gain.linearRampToValueAtTime(amp, startTime + 0.025);
                        gain.gain.exponentialRampToValueAtTime(0.008, startTime + durationSec * 1.05);
                        osc.connect(gain);
                        gain.connect(masterGain);
                        osc.start(startTime);
                        osc.stop(startTime + durationSec * 1.08);
                    });
                }
            } catch (e) {
                console.warn('playSingleVoice error (ignored):', e);
            }
        }

        function playChord(midiNotes, soundName, durationSec = 0.65, options = {}) {
            initAudio();
            if (!audioContext || !masterGain || !Array.isArray(midiNotes) || midiNotes.length === 0) return;

            const timbre = soundName || currentSound;
            const now = audioContext.currentTime;
            const voiceScale = 1 / Math.sqrt(midiNotes.length);
            const arpeggioOffsetSec = options.arpeggioHint ? 0.065 : 0;

            midiNotes.forEach((midi, idx) => {
                const freq = midiToFrequency(midi);
                const startTime = now + idx * arpeggioOffsetSec;
                const remainSec = Math.max(0.25, durationSec - idx * arpeggioOffsetSec * 0.5);
                playSingleVoice(freq, timbre, startTime, remainSec, voiceScale);
            });
        }

        function stopDemo() {
            activeTimeouts.forEach(id => clearTimeout(id));
            activeTimeouts = [];
        }

        function playDemo(steps, options = {}) {
            stopDemo();
            initAudio();

            const soundName = options.sound || currentSound;
            const demoCount = options.demoCount || 1;
            const chordDurationMs = options.chordDurationMs || 750;
            const arpeggioHint = Boolean(options.arpeggioHint);
            const onStep = typeof options.onStep === 'function' ? options.onStep : () => {};
            const onRoundStart = typeof options.onRoundStart === 'function' ? options.onRoundStart : () => {};
            const onComplete = typeof options.onComplete === 'function' ? options.onComplete : () => {};

            const stepGapMs = 140;
            const singleRoundDurationMs = steps.length * (chordDurationMs + stepGapMs);

            for (let round = 0; round < demoCount; round++) {
                const roundOffsetMs = round * (singleRoundDurationMs + 480);

                const roundTimer = setTimeout(() => {
                    onRoundStart(round);
                }, roundOffsetMs);
                activeTimeouts.push(roundTimer);

                steps.forEach((step, positionIdx) => {
                    const timerId = setTimeout(() => {
                        const midiNotes = Array.isArray(step.midiNotes) ? step.midiNotes : [60, 64, 67];
                        playChord(midiNotes, soundName, Math.max(0.35, (chordDurationMs / 1000) * 0.92), {
                            arpeggioHint
                        });
                        onStep(step, positionIdx, round);
                    }, roundOffsetMs + positionIdx * (chordDurationMs + stepGapMs));
                    activeTimeouts.push(timerId);
                });
            }

            const totalDurationMs = demoCount * singleRoundDurationMs + (demoCount - 1) * 480 + 250;
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
            midiToFrequency,
            playChord,
            playDemo,
            stopDemo,
            playResultEffect
        };
    })();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { ChordMoodAudio };
    } else {
        root.ChordMoodAudio = ChordMoodAudio;
    }
})(typeof window !== 'undefined' ? window : this);
