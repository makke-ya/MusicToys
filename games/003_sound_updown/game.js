const SoundGame = (function() {
    let audioContext;
    let masterGain;
    const loadedSamples = {}; // { instrument: { note: buffer, ... } }
    const instrumentConfigs = {}; // { instrument: { note: { file, freq }, ... } }
    
    // Default fallback instrument (Oscillator type) if load fails
    const DEFAULT_OSC_TYPE = 'triangle';
    let currentInstrument = 'Flute';

    function initAudio() {
        try {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                masterGain = audioContext.createGain();
                masterGain.gain.value = 0.5;
                masterGain.connect(audioContext.destination);
            }
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume().catch(e => console.warn("Resume warning:", e));
            }
        } catch (e) {
            console.error("AudioContext init error (ignored):", e);
        }
    }
    
    function setInstrument(name) {
        currentInstrument = name;
    }

    async function preloadInstrument(instrumentName) {
        initAudio();
        
        if (loadedSamples[instrumentName]) return; // Already loaded
        
        if (!window.Config || !window.Config.InstrumentSamples || !window.Config.InstrumentSamples[instrumentName]) {
            console.warn(`Instrument ${instrumentName} not found in Config.`);
            return;
        }

        const config = window.Config.InstrumentSamples[instrumentName];
        instrumentConfigs[instrumentName] = config;
        loadedSamples[instrumentName] = {};

        const promises = Object.entries(config).map(async ([note, info]) => {
            try {
                // Short timeout for each fetch
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                
                const response = await fetch(info.file, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!response.ok) throw new Error('Not found');
                
                const arrayBuffer = await response.arrayBuffer();
                // Support both promise and callback based decodeAudioData
                const audioBuffer = await new Promise((resolve, reject) => {
                    audioContext.decodeAudioData(arrayBuffer, resolve, reject);
                });
                loadedSamples[instrumentName][note] = audioBuffer;
            } catch (e) {
                console.warn(`Failed to load ${instrumentName} - ${note}: ${e.message}`);
                // Continue to next note
            }
        });

        // We wait for all attempts, but since each has a 2s timeout, it will finish.
        await Promise.all(promises);
    }

    function findClosestSample(instrumentName, targetFreq) {
        const samples = instrumentConfigs[instrumentName];
        if (!samples) return null;

        let closestNote = null;
        let minDiff = Infinity;

        for (const [note, info] of Object.entries(samples)) {
            const diff = Math.abs(info.freq - targetFreq);
            if (diff < minDiff) {
                minDiff = diff;
                closestNote = note;
            }
        }
        return closestNote;
    }

    function midiToFreq(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    // Play a tone using sample (or oscillator fallback)
    function playTone(midiNote, instrumentName, startTime = 0, duration = 0.5) {
        initAudio();
        if (!audioContext || !masterGain) return; // Guard against init failure

        const name = instrumentName || currentInstrument;
        const now = startTime || audioContext.currentTime;
        const targetFreq = midiToFreq(midiNote);
        
        const gain = audioContext.createGain();
        gain.connect(masterGain);
        
        // Envelope
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Try to play sample
        let source;
        const closestNote = findClosestSample(name, targetFreq);
        
        if (closestNote && loadedSamples[name] && loadedSamples[name][closestNote]) {
            source = audioContext.createBufferSource();
            source.buffer = loadedSamples[name][closestNote];
            const baseFreq = instrumentConfigs[name][closestNote].freq;
            source.playbackRate.value = targetFreq / baseFreq;
        } else {
            // Fallback to oscillator
            source = audioContext.createOscillator();
            source.type = DEFAULT_OSC_TYPE;
            source.frequency.value = targetFreq;
        }

        source.connect(gain);
        source.start(now);
        source.stop(now + duration + 0.2);
    }

    // Play two notes in sequence
    function playProblem(note1, note2, interval = 0.6) {
        initAudio();
        const now = audioContext.currentTime;
        
        playTone(note1, currentInstrument, now, 0.5);
        playTone(note2, currentInstrument, now + interval, 0.8);
    }

    function playWrong() {
        initAudio();
        const now = audioContext.currentTime;
        // Low saw for wrong
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 100;
        gain.gain.value = 0.3;
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    function playHighEffect() {
        playTone(84, currentInstrument, 0, 0.2); 
    }

    function playLowEffect() {
        playTone(48, currentInstrument, 0, 0.2);
    }

    return {
        initAudio,
        preloadInstrument,
        playProblem,
        playWrong,
        playHighEffect,
        playLowEffect
    };
})();