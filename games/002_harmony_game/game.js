// games/002_harmony_game/game.js

const HarmonyGame = (function() {
    let audioContext;
    let masterGainNode;
    // { id: { source: Node, gain: GainNode, instrument: string, baseFreq: number, intervalId: number }, ... }
    const playingSources = {}; 

    const instrumentConfigs = {};
    const loadedSamples = {};     
    const loadedEffects = {};

    function initAudio() {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                masterGainNode = audioContext.createGain();
                masterGainNode.gain.value = 0.5; // Default
                masterGainNode.connect(audioContext.destination);
            } catch (e) {
                console.error("Web Audio API is not supported in this browser");
                return false;
            }
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        return true;
    }

    function setVolume(volume) {
        if (!initAudio()) return;
        masterGainNode.gain.setTargetAtTime(volume, audioContext.currentTime, 0.05);
    }

    async function preloadAudioForGame(instrumentNames) {
        if (!initAudio()) return;
        
        // オシレーター系の楽器（Sawtooth Wave）以外はサンプリング音源をロード
        const oscillatorInstruments = ['Sawtooth Wave'];
        const instrumentsToLoad = instrumentNames.filter(name => !oscillatorInstruments.includes(name) && !loadedSamples[name]);
        
        if (instrumentsToLoad.length === 0) {
            await preloadEffects();
            return;
        }

        const samplePromises = instrumentsToLoad.flatMap(name => {
            const instrumentConfig = (window.Config && window.Config.InstrumentSamples) ? window.Config.InstrumentSamples[name] : null;
            if (!instrumentConfig) return [];
            instrumentConfigs[name] = instrumentConfig;
            loadedSamples[name] = {};

            return Object.entries(instrumentConfig).map(async ([note, sampleInfo]) => {
                try {
                    const response = await fetch(sampleInfo.file);
                    const arrayBuffer = await response.arrayBuffer();
                    loadedSamples[name][note] = await audioContext.decodeAudioData(arrayBuffer);
                } catch (error) {
                    console.error(`Error loading sample ${name}/${note}:`, error);
                }
            });
        });
        
        await Promise.all([...samplePromises, preloadEffects()]);
    }
    
    async function preloadEffects() {
        if (Object.keys(loadedEffects).length > 0) return;
        const effectsToLoad = {
            'correct': '/static/sounds/correct.mp3',
            'wrong': '/static/sounds/wrong.mp3'
        };
        const effectPromises = Object.entries(effectsToLoad).map(async ([name, path]) => {
            try {
                const response = await fetch(path);
                const arrayBuffer = await response.arrayBuffer();
                loadedEffects[name] = await audioContext.decodeAudioData(arrayBuffer);
            } catch (error) {
                console.error(`Error loading effect ${name}:`, error);
            }
        });
        await Promise.all(effectPromises);
    }

    function playEffect(effectName) {
        const buffer = loadedEffects[effectName];
        if (buffer) {
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(masterGainNode);
            source.start(0);
        }
    }
    
    function findClosestSample(instrument, frequency) {
        const samples = instrumentConfigs[instrument];
        if (!samples) return null;
        let closestNote = null;
        let minDiff = Infinity;
        for (const note in samples) {
            const diff = Math.abs(samples[note].freq - frequency);
            if (diff < minDiff) {
                minDiff = diff;
                closestNote = note;
            }
        }
        return closestNote;
    }

    /**
     * 和音を再生し、4秒周期のループを開始する
     */
    function playChord(chord) {
        if (!initAudio()) return;
        stopAllSounds();

        chord.forEach(note => {
            const { id, instrument, freq, oscillatorType, dynamicsCurve } = note;
            startNoteLoop(id, instrument, freq, oscillatorType, dynamicsCurve);
        });
    }

    /**
     * 1つの音を4秒周期でループ再生させる
     */
    function startNoteLoop(id, instrument, freq, oscillatorType = 'sine', dynamicsCurve = null) {
        let sampleBaseFreq = freq; // デフォルト
        
        if (instrument !== 'Sawtooth Wave') {
            const closestSampleName = findClosestSample(instrument, freq);
            if (closestSampleName) {
                sampleBaseFreq = instrumentConfigs[instrument][closestSampleName].freq;
            }
        }

        // 初期登録
        playingSources[id] = { 
            instrument, 
            currentFreq: freq, 
            sampleBaseFreq: sampleBaseFreq, // 使用中のサンプルの基準周波数を保持
            activeSource: null, 
            activeGain: null, 
            oscillatorType,
            intervalId: null
        };

        const playOnce = () => {
            const now = audioContext.currentTime;
            let source;
            const gain = audioContext.createGain();
            
            // 最新の周波数を使用
            const currentFreq = playingSources[id] ? playingSources[id].currentFreq : freq;
            
            // 音量設定 (Sawtooth Waveは振幅比0.0625)
            const baseGain = (instrument === 'Sawtooth Wave') ? 0.0625 : 0.5;

            gain.gain.setValueAtTime(0, now);
            
            if (dynamicsCurve && dynamicsCurve.length > 0) {
                // dynamicsCurveの値（基準0.5）をbaseGainに合わせてスケーリング
                const scale = baseGain / 0.5;
                const scaledCurve = new Float32Array(dynamicsCurve.length);
                for (let i = 0; i < dynamicsCurve.length; i++) {
                    scaledCurve[i] = dynamicsCurve[i] * scale;
                }
                gain.gain.linearRampToValueAtTime(scaledCurve[0], now + 0.05); 
                gain.gain.setValueCurveAtTime(scaledCurve, now + 0.05, 3.45);
            } else {
                gain.gain.linearRampToValueAtTime(baseGain, now + 0.05);
                gain.gain.setValueAtTime(baseGain, now + 3.5);
            }
            
            // フェードアウト (少し長めに)
            gain.gain.linearRampToValueAtTime(0, now + 3.9);

            if (instrument === 'Sawtooth Wave') {
                source = audioContext.createOscillator();
                source.type = oscillatorType; 
                source.frequency.value = currentFreq;
            } else {
                const closestSampleName = findClosestSample(instrument, currentFreq);
                if (!closestSampleName) return;
                const sampleBuffer = loadedSamples[instrument][closestSampleName];
                const baseFreq = instrumentConfigs[instrument][closestSampleName].freq;
                
                // 再生開始時のサンプル基準周波数を更新（ループごとに最適なサンプルに切り替える）
                if (playingSources[id]) playingSources[id].sampleBaseFreq = baseFreq;

                source = audioContext.createBufferSource();
                source.buffer = sampleBuffer;
                source.playbackRate.value = currentFreq / baseFreq;
            }

            source.connect(gain);
            gain.connect(masterGainNode);
            source.start(now);
            source.stop(now + 3.9);

            if (playingSources[id]) {
                playingSources[id].activeSource = source;
                playingSources[id].activeGain = gain;
                playingSources[id].oscillatorType = oscillatorType;
            }
        };

        playOnce();

        const intervalId = setInterval(playOnce, 4000);
        playingSources[id].intervalId = intervalId;
    }

    function updateFrequency(id, frequency) {
        const info = playingSources[id];
        if (!info) return;

        info.currentFreq = frequency;

        if (info.activeSource) {
            if (info.instrument === 'Sawtooth Wave') {
                info.activeSource.frequency.setTargetAtTime(frequency, audioContext.currentTime, 0.03);
            } else {
                // 再生中のサンプルの基準周波数を使用してplaybackRateを計算
                const baseFreq = info.sampleBaseFreq;
                info.activeSource.playbackRate.setTargetAtTime(frequency / baseFreq, audioContext.currentTime, 0.03);
            }
        }
    }

    function stopAllSounds() {
        for (const id in playingSources) {
            stopNote(id);
        }
    }

    function stopNote(id) {
        const info = playingSources[id];
        if (info) {
            if (info.intervalId) clearInterval(info.intervalId);
            if (info.activeSource) {
                try { info.activeSource.stop(); } catch(e) {}
            }
            delete playingSources[id];
        }
    }

    return {
        initAudio,
        setVolume,
        preloadAudioForGame,
        playEffect,
        playChord,
        updateFrequency,
        stopAllSounds,
        stopNote
    };
})();