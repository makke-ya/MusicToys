(function(root) {
    const DynamicsAudio = (function() {
        let audioContext = null;
        let masterGain = null;
        let currentSound = 'taiko';
        let activeTimeouts = [];

        function initAudio() {
            try {
                if (typeof window === 'undefined') return;
                if (!audioContext) {
                    const AudioCtx = window.AudioContext || window.webkitAudioContext;
                    if (!AudioCtx) return;
                    audioContext = new AudioCtx();
                    masterGain = audioContext.createGain();
                    masterGain.gain.value = 0.65;
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

        function getDynamicsParams(dynamicId, contrastScale = 1.0) {
            const scale = Math.max(0.55, Math.min(1.0, Number(contrastScale) || 1.0));
            const centerGain = 0.52;

            if (dynamicId === 'p') {
                const rawGain = 0.18;
                const gain = Number((centerGain - (centerGain - rawGain) * scale).toFixed(3));
                return {
                    gain,
                    baseFreq: 240,
                    endFreq: 145,
                    clickGain: 0.06,
                    filterFreq: 950,
                    durationSec: 0.19
                };
            }

            if (dynamicId === 'mf') {
                return {
                    gain: centerGain,
                    baseFreq: 165,
                    endFreq: 88,
                    clickGain: 0.22,
                    filterFreq: 1850,
                    durationSec: 0.28
                };
            }

            // Default 'f' (forte)
            const rawGain = 0.96;
            const gain = Number((centerGain + (rawGain - centerGain) * scale).toFixed(3));
            return {
                gain,
                baseFreq: 128,
                endFreq: 48,
                clickGain: 0.48,
                filterFreq: 3600,
                durationSec: 0.38
            };
        }

        function playBeat(dynamicId, soundName, durationSec, contrastScale = 1.0) {
            initAudio();
            if (!audioContext || !masterGain) return;

            const params = getDynamicsParams(dynamicId, contrastScale);
            const dur = durationSec || params.durationSec;
            const timbre = soundName || currentSound;
            const now = audioContext.currentTime;

            try {
                const filter = audioContext.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(params.filterFreq, now);
                filter.connect(masterGain);

                if (timbre === 'taiko') {
                    // Deep resonant drum body + woody rim/skin attack
                    const osc1 = audioContext.createOscillator();
                    const gain1 = audioContext.createGain();
                    osc1.type = dynamicId === 'f' ? 'triangle' : 'sine';
                    osc1.frequency.setValueAtTime(params.baseFreq, now);
                    osc1.frequency.exponentialRampToValueAtTime(params.endFreq, now + dur * 0.75);
                    gain1.gain.setValueAtTime(0.01, now);
                    gain1.gain.linearRampToValueAtTime(params.gain, now + 0.008);
                    gain1.gain.exponentialRampToValueAtTime(0.008, now + dur);
                    osc1.connect(gain1);
                    gain1.connect(filter);
                    osc1.start(now);
                    osc1.stop(now + dur + 0.02);

                    const osc2 = audioContext.createOscillator();
                    const gain2 = audioContext.createGain();
                    osc2.type = 'square';
                    osc2.frequency.setValueAtTime(params.baseFreq * 2.7, now);
                    osc2.frequency.exponentialRampToValueAtTime(params.baseFreq * 1.1, now + 0.045);
                    gain2.gain.setValueAtTime(params.clickGain, now);
                    gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.05);
                    osc2.connect(gain2);
                    gain2.connect(filter);
                    osc2.start(now);
                    osc2.stop(now + 0.06);
                } else if (timbre === 'march') {
                    // Snare / bass drum marching band feel
                    const osc1 = audioContext.createOscillator();
                    const gain1 = audioContext.createGain();
                    osc1.type = 'triangle';
                    osc1.frequency.setValueAtTime(params.baseFreq * 1.15, now);
                    osc1.frequency.exponentialRampToValueAtTime(params.endFreq * 1.1, now + dur * 0.65);
                    gain1.gain.setValueAtTime(0.01, now);
                    gain1.gain.linearRampToValueAtTime(params.gain, now + 0.006);
                    gain1.gain.exponentialRampToValueAtTime(0.008, now + dur * 0.9);
                    osc1.connect(gain1);
                    gain1.connect(filter);
                    osc1.start(now);
                    osc1.stop(now + dur);

                    const osc2 = audioContext.createOscillator();
                    const gain2 = audioContext.createGain();
                    osc2.type = 'sawtooth';
                    osc2.frequency.setValueAtTime(params.baseFreq * 3.2, now);
                    gain2.gain.setValueAtTime(params.clickGain * 0.9, now);
                    gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.055);
                    osc2.connect(gain2);
                    gain2.connect(filter);
                    osc2.start(now);
                    osc2.stop(now + 0.06);
                } else if (timbre === 'orchestra') {
                    // Timpani + warm orchestral brass/chord hit
                    const pitchHz = dynamicId === 'f' ? 130.81 : (dynamicId === 'mf' ? 196.00 : 261.63);
                    const osc1 = audioContext.createOscillator();
                    const gain1 = audioContext.createGain();
                    osc1.type = dynamicId === 'f' ? 'sawtooth' : 'triangle';
                    osc1.frequency.setValueAtTime(pitchHz * 1.06, now);
                    osc1.frequency.exponentialRampToValueAtTime(pitchHz, now + 0.06);
                    gain1.gain.setValueAtTime(0.01, now);
                    gain1.gain.linearRampToValueAtTime(params.gain * 0.9, now + 0.012);
                    gain1.gain.exponentialRampToValueAtTime(0.008, now + dur * 1.15);
                    osc1.connect(gain1);
                    gain1.connect(filter);
                    osc1.start(now);
                    osc1.stop(now + dur * 1.2);
                } else {
                    // Synth: punchy electronic drum + harmonic pop
                    const osc1 = audioContext.createOscillator();
                    const gain1 = audioContext.createGain();
                    osc1.type = 'sine';
                    osc1.frequency.setValueAtTime(params.baseFreq * 1.4, now);
                    osc1.frequency.exponentialRampToValueAtTime(params.endFreq, now + dur * 0.6);
                    gain1.gain.setValueAtTime(0.01, now);
                    gain1.gain.linearRampToValueAtTime(params.gain, now + 0.005);
                    gain1.gain.exponentialRampToValueAtTime(0.008, now + dur);
                    osc1.connect(gain1);
                    gain1.connect(filter);
                    osc1.start(now);
                    osc1.stop(now + dur + 0.02);
                }
            } catch (e) {
                console.warn('playBeat error (ignored):', e);
            }
        }

        function stopDemo() {
            activeTimeouts.forEach(id => clearTimeout(id));
            activeTimeouts = [];
        }

        function playDemo(pattern, options = {}) {
            stopDemo();
            initAudio();

            const soundName = options.sound || currentSound;
            const demoCount = options.demoCount || 1;
            const beatDurationMs = options.beatDurationMs || 500;
            const contrastScale = options.contrastScale || 1.0;
            const onBeat = typeof options.onBeat === 'function' ? options.onBeat : () => {};
            const onRoundStart = typeof options.onRoundStart === 'function' ? options.onRoundStart : () => {};
            const onComplete = typeof options.onComplete === 'function' ? options.onComplete : () => {};

            const singleRoundDurationMs = pattern.length * beatDurationMs;

            for (let round = 0; round < demoCount; round++) {
                const roundOffsetMs = round * (singleRoundDurationMs + 500);

                const roundTimer = setTimeout(() => {
                    onRoundStart(round);
                }, roundOffsetMs);
                activeTimeouts.push(roundTimer);

                pattern.forEach((dynamicId, positionIdx) => {
                    const timerId = setTimeout(() => {
                        playBeat(dynamicId, soundName, undefined, contrastScale);
                        onBeat(dynamicId, positionIdx, round);
                    }, roundOffsetMs + positionIdx * beatDurationMs);
                    activeTimeouts.push(timerId);
                });
            }

            const totalDurationMs = demoCount * singleRoundDurationMs + (demoCount - 1) * 500 + 250;
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
            getDynamicsParams,
            playBeat,
            playDemo,
            stopDemo,
            playResultEffect
        };
    })();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { DynamicsAudio };
    } else {
        root.DynamicsAudio = DynamicsAudio;
    }
})(typeof window !== 'undefined' ? window : this);
