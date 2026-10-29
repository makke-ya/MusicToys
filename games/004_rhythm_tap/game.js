(function(root) {
    const RhythmAudio = (function() {
        let audioContext = null;
        let masterGain = null;
        let currentSound = 'taiko';
        let activeTimeouts = [];
        let noiseBuffer = null;

        function initAudio() {
            try {
                if (typeof window === 'undefined') return;
                if (!audioContext) {
                    const AudioCtx = window.AudioContext || window.webkitAudioContext;
                    if (!AudioCtx) return;
                    audioContext = new AudioCtx();
                    masterGain = audioContext.createGain();
                    masterGain.gain.value = 0.6;
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

        function getNoiseBuffer() {
            if (!audioContext) return null;
            if (noiseBuffer) return noiseBuffer;
            const bufferSize = audioContext.sampleRate * 0.5;
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            noiseBuffer = buffer;
            return noiseBuffer;
        }

        function playPercussion(soundName, when = 0) {
            initAudio();
            if (!audioContext || !masterGain) return;

            const name = soundName || currentSound;
            const now = when > 0 ? when : audioContext.currentTime;

            try {
                if (name === 'taiko') {
                    // Deep pitch-envelope drum ("Don!")
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(180, now);
                    osc.frequency.exponentialRampToValueAtTime(55, now + 0.22);

                    gain.gain.setValueAtTime(1.0, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

                    osc.connect(gain);
                    gain.connect(masterGain);
                    osc.start(now);
                    osc.stop(now + 0.3);

                    // Attack thump noise
                    const nb = getNoiseBuffer();
                    if (nb) {
                        const noise = audioContext.createBufferSource();
                        noise.buffer = nb;
                        const filter = audioContext.createBiquadFilter();
                        filter.type = 'lowpass';
                        filter.frequency.setValueAtTime(350, now);
                        const nGain = audioContext.createGain();
                        nGain.gain.setValueAtTime(0.4, now);
                        nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
                        noise.connect(filter);
                        filter.connect(nGain);
                        nGain.connect(masterGain);
                        noise.start(now);
                        noise.stop(now + 0.07);
                    }
                } else if (name === 'castanet') {
                    // Crisp high wooden click
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(1400, now);
                    osc.frequency.exponentialRampToValueAtTime(600, now + 0.06);

                    gain.gain.setValueAtTime(0.8, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

                    osc.connect(gain);
                    gain.connect(masterGain);
                    osc.start(now);
                    osc.stop(now + 0.09);
                } else if (name === 'tambourine') {
                    // Metallic jingle + bright overtone
                    const nb = getNoiseBuffer();
                    if (nb) {
                        const noise = audioContext.createBufferSource();
                        noise.buffer = nb;
                        const filter = audioContext.createBiquadFilter();
                        filter.type = 'highpass';
                        filter.frequency.setValueAtTime(4500, now);
                        const nGain = audioContext.createGain();
                        nGain.gain.setValueAtTime(0.5, now);
                        nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
                        noise.connect(filter);
                        filter.connect(nGain);
                        nGain.connect(masterGain);
                        noise.start(now);
                        noise.stop(now + 0.2);
                    }
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(1046.5, now);
                    gain.gain.setValueAtTime(0.3, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                    osc.connect(gain);
                    gain.connect(masterGain);
                    osc.start(now);
                    osc.stop(now + 0.13);
                } else if (name === 'woodblock') {
                    // Hollow wood resonance
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(880, now);
                    osc.frequency.exponentialRampToValueAtTime(720, now + 0.08);

                    gain.gain.setValueAtTime(0.8, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

                    osc.connect(gain);
                    gain.connect(masterGain);
                    osc.start(now);
                    osc.stop(now + 0.11);
                } else if (name === 'cymbal') {
                    // Shimmering high-frequency burst
                    const nb = getNoiseBuffer();
                    if (nb) {
                        const noise = audioContext.createBufferSource();
                        noise.buffer = nb;
                        const filter = audioContext.createBiquadFilter();
                        filter.type = 'highpass';
                        filter.frequency.setValueAtTime(3000, now);
                        const nGain = audioContext.createGain();
                        nGain.gain.setValueAtTime(0.6, now);
                        nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                        noise.connect(filter);
                        filter.connect(nGain);
                        nGain.connect(masterGain);
                        noise.start(now);
                        noise.stop(now + 0.42);
                    }
                }
            } catch (e) {
                console.warn('playPercussion error (ignored):', e);
            }
        }

        function stopDemo() {
            activeTimeouts.forEach(id => clearTimeout(id));
            activeTimeouts = [];
        }

        function playDemo(expectedTimestampsMs, options = {}) {
            stopDemo();
            initAudio();

            const soundName = options.sound || currentSound;
            const demoCount = options.demoCount || 1;
            const beatDurationMs = options.beatDurationMs || 800;
            const onBeat = typeof options.onBeat === 'function' ? options.onBeat : () => {};
            const onRoundStart = typeof options.onRoundStart === 'function' ? options.onRoundStart : () => {};
            const onComplete = typeof options.onComplete === 'function' ? options.onComplete : () => {};

            const lastBeatMs = expectedTimestampsMs.length > 0
                ? expectedTimestampsMs[expectedTimestampsMs.length - 1]
                : 0;
            const singleRoundDurationMs = lastBeatMs + beatDurationMs;

            for (let round = 0; round < demoCount; round++) {
                const roundOffsetMs = round * (singleRoundDurationMs + 300);

                const roundStartTimer = setTimeout(() => {
                    onRoundStart(round);
                }, roundOffsetMs);
                activeTimeouts.push(roundStartTimer);

                expectedTimestampsMs.forEach((timeMs, beatIndex) => {
                    const timerId = setTimeout(() => {
                        playPercussion(soundName);
                        onBeat(beatIndex, round);
                    }, roundOffsetMs + timeMs);
                    activeTimeouts.push(timerId);
                });
            }

            const totalDurationMs = demoCount * singleRoundDurationMs + (demoCount - 1) * 300;
            const completeTimer = setTimeout(() => {
                onComplete();
            }, totalDurationMs);
            activeTimeouts.push(completeTimer);

            return totalDurationMs;
        }

        function playResultEffect(stars) {
            initAudio();
            if (!audioContext || !masterGain) return;

            const now = audioContext.currentTime;
            const notes = stars === 3 ? [523.25, 659.25, 783.99, 1046.5]
                        : stars === 2 ? [523.25, 659.25, 783.99]
                        : [392.0, 440.0];

            notes.forEach((freq, idx) => {
                try {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.12);
                    gain.gain.setValueAtTime(0.35, now + idx * 0.12);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.25);
                    osc.connect(gain);
                    gain.connect(masterGain);
                    osc.start(now + idx * 0.12);
                    osc.stop(now + idx * 0.12 + 0.26);
                } catch (e) {}
            });
        }

        return {
            initAudio,
            setSound,
            getSound,
            playPercussion,
            playDemo,
            stopDemo,
            playResultEffect
        };
    })();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { RhythmAudio };
    } else {
        root.RhythmAudio = RhythmAudio;
    }
})(typeof window !== 'undefined' ? window : this);
