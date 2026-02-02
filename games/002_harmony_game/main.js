document.addEventListener('DOMContentLoaded', () => {
    let level = 1;
    let score = 0;
    let lives = 3;
    let questionNumber = 0;
    let isPlaying = false; 
    let isGameReady = false; 
    let gameLogic = null; 
    let animationFrameId = null; 
    let intervalCounts = {};
    
    // For integration tests
    window.gameStates = {
        get isPlaying() { return isPlaying; },
        get isGameReady() { return isGameReady; },
        get intervalCounts() { return intervalCounts; }
    };
    
    let currentProblem = {
        baseNote: null,
        targetNote: null,
        instrument: 'Sawtooth Wave',
        interval: 'Perfect 1st'
    };

    let levelDesign = [];
    let instrumentNotes = {};

    let scoreEl, livesEl, questionNumberEl, slidersContainerEl, chordNameEl, 
        answerControlsEl, answerButtonEl, characterEl,
        volumeSliderEl, introPopupEl, introContentEl, introLevelEl, introIntervalEl,
        introTimbreEl, introToleranceEl, introDescriptionEl, feedbackPopupEl, feedbackContentEl,
        feedbackIconEl, feedbackMessageEl, nextProblemButtonEl,
        postAnswerControlsEl, replayButtonEl, mainNextButtonEl;

    async function initGame() {
        const urlParams = new URLSearchParams(window.location.search);
        const debugLevel = urlParams.get('level');
        if (debugLevel) {
            level = parseInt(debugLevel, 10);
            console.log(`Debug: Starting at Level ${level}`);
        } else {
            const savedLevel = localStorage.getItem('harmonyGameLevel');
            if (savedLevel) {
                level = parseInt(savedLevel, 10);
            }
        }
        
        intervalCounts = {};

        scoreEl = document.getElementById('score');
        livesEl = document.getElementById('lives');
        questionNumberEl = document.getElementById('question-number');
        slidersContainerEl = document.getElementById('sliders-container');
        chordNameEl = document.getElementById('chord-name');
        answerControlsEl = document.getElementById('answer-controls');
        answerButtonEl = document.getElementById('answer-button');
        characterEl = document.getElementById('character');
        
        // New UI Elements
        volumeSliderEl = document.getElementById('volume-slider');
        introPopupEl = document.getElementById('intro-popup');
        introContentEl = introPopupEl.querySelector('.intro-content');
        introLevelEl = document.getElementById('intro-level');
        introIntervalEl = document.getElementById('intro-interval');
        introTimbreEl = document.getElementById('intro-timbre');
        introToleranceEl = document.getElementById('intro-tolerance');
        introDescriptionEl = document.getElementById('intro-description');
        
        feedbackPopupEl = document.getElementById('feedback-popup');
        feedbackContentEl = feedbackPopupEl.querySelector('.feedback-content');
        feedbackIconEl = document.getElementById('feedback-icon');
        feedbackMessageEl = document.getElementById('feedback-popup-message');
        nextProblemButtonEl = document.getElementById('next-problem-button'); // Button inside popup

        postAnswerControlsEl = document.getElementById('post-answer-controls');
        replayButtonEl = document.getElementById('replay-button');
        mainNextButtonEl = document.getElementById('main-next-button');

        answerButtonEl.addEventListener('click', checkAnswer);
        nextProblemButtonEl.addEventListener('click', nextProblem);
        
        // Replay button enables interactive review mode
        replayButtonEl.addEventListener('click', () => {
            isGameReady = true;
            isPlaying = true;
            playSounds();
        });
        
        mainNextButtonEl.addEventListener('click', nextProblem);

        volumeSliderEl.addEventListener('input', (e) => {
            HarmonyGame.setVolume(parseFloat(e.target.value));
        });

        try {
            const [levelRes, notesRes] = await Promise.all([
                fetch('level_design.json'),
                fetch('instrument_notes.json')
            ]);
            levelDesign = await levelRes.json();
            instrumentNotes = await notesRes.json();
            
            startAnimationLoop();
            
            const instructionsStartButton = document.getElementById('instructions-start-button');
            if (instructionsStartButton) {
                instructionsStartButton.addEventListener('click', () => {
                    const popup = document.getElementById('instructions-popup');
                    if (popup) popup.classList.add('hidden');
                    nextProblem();
                });
            } else {
                nextProblem();
            }
        } catch (e) {
            console.error("Failed to load game data:", e);
            alert("データの読み込みに失敗しました。");
        }
    }

    async function nextProblem() {
        isGameReady = false;
        questionNumber++;
        
        // UIリセット
        feedbackPopupEl.classList.add('hidden');
        feedbackContentEl.classList.remove('popup-show');
        nextProblemButtonEl.classList.add('hidden');
        
        postAnswerControlsEl.classList.add('hidden');
        answerControlsEl.classList.remove('hidden');
        answerButtonEl.disabled = true;
        
        isPlaying = false;
        HarmonyGame.stopAllSounds();

        const currentLevelConfig = levelDesign.find(d => d.level === level) || levelDesign[levelDesign.length - 1];
        
        let currentInterval = currentLevelConfig.interval;
        if (currentInterval === 'Random') {
            // Use all available intervals sorted by LCM
            const intervals = [
                'Perfect 1st', 'Perfect 8th', 'Perfect 5th', 'Perfect 4th', 
                'Major 6th', 'Major 3rd', 'minor 3rd', 'minor 6th', 
                'minor 7th', 'Major 2nd', 'Major 7th', 'minor 2nd', 'Tritone'
            ];
            currentInterval = intervals[Math.floor(Math.random() * intervals.length)];
        }

        // Increment count for this interval
        intervalCounts[currentInterval] = (intervalCounts[currentInterval] || 0) + 1;

        // --- Instrument Selection Logic ---
        let baseInstrument = currentLevelConfig.timbre || 'Sawtooth Wave';
        let targetInstrument = baseInstrument;

        const availableInstruments = ['Sawtooth Wave'];
        if (window.Config && window.Config.InstrumentSamples) {
            availableInstruments.push(...Object.keys(window.Config.InstrumentSamples));
        }

        if (level >= 30) {
            baseInstrument = availableInstruments[Math.floor(Math.random() * availableInstruments.length)];
            targetInstrument = baseInstrument;
        }

        // Mix instruments condition:
        // 1. Level >= 50 (Always active)
        // 2. Level >= 30 AND Interval Count > 10 (High familiarity)
        const currentCount = intervalCounts[currentInterval] || 0;
        if (level >= 30 && currentCount > 10) {
             // 50% chance to mix instruments
             if (Math.random() < 0.5) {
                 // Ensure target instrument is different from base instrument
                 const otherInstruments = availableInstruments.filter(i => i !== baseInstrument);
                 if (otherInstruments.length > 0) {
                     targetInstrument = otherInstruments[Math.floor(Math.random() * otherInstruments.length)];
                 }
             }
        }

        const notesList = instrumentNotes[baseInstrument] || instrumentNotes['Sawtooth Wave'];
        const randomNote = notesList[Math.floor(Math.random() * notesList.length)];
        
        let baseFreq = noteToFreq(randomNote);

        // Level 50+: Randomly vary base frequency by up to ±50 cents (1/4 tone)
        if (level >= 50) {
            const randomCents = (Math.random() * 100) - 50; // -50 to +50
            baseFreq = baseFreq * Math.pow(2, randomCents / 1200);
        }

        const intervalRatio = HarmonyGameLogic.getIntervalRatio(currentInterval);
        const targetBaseFreq = baseFreq * intervalRatio;
        
        // --- Tolerance Calculation Logic ---
        // Base 20c, decrease by 1c every 5 levels. Min 3c.
        let calculatedTolerance = Math.max(3, 20 - Math.floor((level - 1) / 5));

        const correctSliderValue = Math.floor(Math.random() * 17) - 8; 

        gameLogic = new HarmonyGameLogic({
            tolerance: calculatedTolerance,
            correctSliderValue: correctSliderValue,
            interval: currentInterval,
            dynamics: currentLevelConfig.dynamics,
            timbre: baseInstrument // Use base instrument for logic (oscillator type etc)
        });

        currentProblem = {
            baseNote: { note: randomNote, freq: baseFreq, id: 'base_note', instrument: baseInstrument },
            targetNote: { note: randomNote, freq: targetBaseFreq, id: 'target_note', instrument: targetInstrument },
            instrument: baseInstrument, // Main instrument for reference
            interval: currentInterval
        };

        // Preload all used instruments
        const instrumentsToLoad = [...new Set([baseInstrument, targetInstrument])];
        await HarmonyGame.preloadAudioForGame(instrumentsToLoad);

        // Update popup display
        const displayTimbre = (baseInstrument === targetInstrument) 
            ? baseInstrument 
            : `${baseInstrument} & ${targetInstrument}`;
        
        showIntroPopup({ 
            timbre: displayTimbre, 
            tolerance: calculatedTolerance, 
            level: level 
        }, currentInterval);

        
        updateUI();
        createSlider(); 
        
        // 2秒後に自動再生
        setTimeout(() => {
            hideIntroPopup();
            isGameReady = true;
            answerButtonEl.disabled = false;
            const slider = document.getElementById('frequency-slider');
            if (slider) slider.disabled = false;
            
            isPlaying = true;
            playSounds();
        }, 2000);
    }

    const instrumentDisplayMap = {
        'Sawtooth Wave': '🎹 でんしおん1',
        'Sine Wave': '〰️ でんしおん2',
        'Violin': '🎻 バイオリン',
        'Viola': '🎻 ビオラ',
        'Cello': '🎻 チェロ',
        'Contrabass': '🎻 コントラバス',
        'Flute': '🪈 フルート',
        'Piccolo': '🪈 ピッコロ',
        'Oboe': '🪈 オーボエ',
        'Bassoon': '🪈 ファゴット',
        'Clarinet': '🪈 クラリネット',
        'Horn': '📯 ホルン',
        'Trumpet': '🎺 トランペット',
        'Trombone': '🎺 トロンボーン',
        'Tuba': '🎺 チューバ',
        'Saxophone': '🎷 サックス'
    };

    const intervalDisplayMap = {
        'Perfect 1st': 'かんぜん1ど',
        'minor 2nd': 'たん2ど',
        'Major 2nd': 'ちょう2ど',
        'minor 3rd': 'たん3ど',
        'Major 3rd': 'ちょう3ど',
        'Perfect 4th': 'かんぜん4ど',
        'Tritone': 'ぞう4ど',
        'Perfect 5th': 'かんぜん5ど',
        'minor 6th': 'たん6ど',
        'Major 6th': 'ちょう6ど',
        'minor 7th': 'たん7ど',
        'Major 7th': 'ちょう7ど',
        'Perfect 8th': 'かんぜん8ど',
        'Octave': 'かんぜん8ど'
    };

    const intervalDescriptions = {
        'Perfect 1st': 'おなじ高さの音だよ。ぴたっとあわせてね！',
        'Perfect 8th': 'たかい音とひくい音のペアだよ。',
        'Perfect 5th': '力づよい響きがするよ。きれいにハモるかな？',
        'Major 3rd': 'あかるくて楽しそうな音だよ。',
        'minor 3rd': 'ちょっとだけ悲しそうな、おちついた音だよ。',
        'Major 6th': 'やさしくて、ひろがりがある音だよ。',
        'Perfect 4th': 'ちょっとだけ ふしぎな響きだよ。',
        'Major 2nd': 'となりあった音だよ。ぶつからないように気をつけて！',
        'minor 2nd': 'とっても近い音同士だよ。にごって聞こえるかも？',
        'Major 7th': 'キラキラした、おしゃれな響きだよ。',
        'minor 7th': 'ブルースのような、かっこいい音だよ。',
        'Tritone': 'あやしくて、ちょっとこわい音だよ。'
    };

    function showIntroPopup(config, interval) {
        introLevelEl.textContent = level;
        
        const localizedInterval = intervalDisplayMap[interval] || interval;
        introIntervalEl.textContent = localizedInterval;
        
        let displayTimbre = config.timbre;
        if (displayTimbre.includes('&')) {
            // "Violin & Flute" -> "🎻 ばいおりん & 🪈 ふるーと"
            const parts = displayTimbre.split(' & ');
            const localizedParts = parts.map(p => instrumentDisplayMap[p] || p);
            introTimbreEl.textContent = localizedParts.join(' & ');
        } else {
            introTimbreEl.textContent = instrumentDisplayMap[displayTimbre] || displayTimbre;
        }

        introToleranceEl.textContent = `±${config.tolerance}c`;
        
        if (introDescriptionEl) {
            introDescriptionEl.textContent = intervalDescriptions[interval] || 'きれいなハーモニーをつくろう！';
        }

        introPopupEl.classList.remove('hidden');
        setTimeout(() => introContentEl.classList.add('popup-show'), 10);
    }

    function hideIntroPopup() {
        introContentEl.classList.remove('popup-show');
        setTimeout(() => introPopupEl.classList.add('hidden'), 300);
    }

    function createSlider() {
        slidersContainerEl.innerHTML = '';
        
        const wrapper = document.createElement('div');
        wrapper.className = 'w-full max-w-lg mx-auto';
        
        const label = document.createElement('div');
        label.textContent = 'スライダーをうごかして、きれいにハモらせよう！';
        label.className = 'text-center mb-4 text-xl font-bold text-gray-700';
        wrapper.appendChild(label);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = 'frequency-slider'; 
        slider.min = -10;
        slider.max = 10;
        slider.step = 1;
        slider.value = 0; 
        slider.className = 'w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
        slider.disabled = true;

        slider.addEventListener('input', (e) => {
            if (isPlaying && isGameReady) { 
                const val = parseInt(e.target.value, 10);
                updateSoundFreq(val);
            }
        });
        
        wrapper.appendChild(slider);
        slidersContainerEl.appendChild(wrapper);
    }

    function updateSoundFreq(sliderValue) {
        if (!isGameReady || !gameLogic || typeof gameLogic.calculateFrequency !== 'function' || !currentProblem.targetNote) return;

        const newFreq = gameLogic.calculateFrequency(currentProblem.targetNote.freq, sliderValue);
        HarmonyGame.updateFrequency(currentProblem.targetNote.id, newFreq);
    }

    function togglePlayback() {
        // 廃止されたが、念のため残しておくか検討
    }

    function playSounds() {
        if (!isGameReady || !gameLogic || typeof gameLogic.calculateFrequency !== 'function') return;

        const oscType = gameLogic.getOscillatorType();
        const dynamicsCurve = gameLogic.getDynamicsCurve(3.5); 

        const base = { 
            id: currentProblem.baseNote.id, 
            instrument: currentProblem.baseNote.instrument, 
            freq: currentProblem.baseNote.freq,
            oscillatorType: oscType,
            dynamicsCurve: dynamicsCurve 
        };
        
        const slider = document.getElementById('frequency-slider');
        const sliderValue = slider ? parseInt(slider.value, 10) : 0;
        
        const targetFreq = gameLogic.calculateFrequency(currentProblem.targetNote.freq, sliderValue);
        
        const target = {
            id: currentProblem.targetNote.id,
            instrument: currentProblem.targetNote.instrument,
            freq: targetFreq,
            oscillatorType: oscType,
            dynamicsCurve: null 
        };

        HarmonyGame.playChord([base, target]);
    }
    
    function playCorrectSound() {
        if (!isGameReady || !gameLogic || typeof gameLogic.calculateFrequency !== 'function') return;

        const oscType = gameLogic.getOscillatorType();
        const dynamicsCurve = gameLogic.getDynamicsCurve(3.0);

        const base = { 
            id: 'correct_base', 
            instrument: currentProblem.baseNote.instrument, 
            freq: currentProblem.baseNote.freq,
            oscillatorType: oscType,
            dynamicsCurve: dynamicsCurve
        };
        
        const correctFreq = gameLogic.calculateFrequency(currentProblem.targetNote.freq, gameLogic.correctSliderValue);
         const target = {
            id: 'correct_target',
            instrument: currentProblem.targetNote.instrument,
            freq: correctFreq,
            oscillatorType: oscType,
            dynamicsCurve: null
        };
        
        HarmonyGame.playChord([base, target]);
        setTimeout(() => HarmonyGame.stopAllSounds(), 4000);
    }

    function checkAnswer() {
        if (!isGameReady || !gameLogic || typeof gameLogic.isCorrect !== 'function') return;

        HarmonyGame.stopAllSounds();
        isPlaying = false;
        answerButtonEl.disabled = true;
        answerControlsEl.classList.add('hidden');

        const slider = document.getElementById('frequency-slider');
        const val = parseInt(slider.value, 10);
        const isCorrect = gameLogic.isCorrect(val);

        feedbackPopupEl.classList.remove('hidden');
        setTimeout(() => feedbackContentEl.classList.add('popup-show'), 10);

        showFeedbackOnSlider(val);
        updateUI();

        if (isCorrect) {
            score++;
            level++; 
            localStorage.setItem('harmonyGameLevel', level); 
            
            HarmonyGame.playEffect('correct');
            feedbackIconEl.textContent = '⭕';
            feedbackMessageEl.textContent = 'せいかい！';
            feedbackMessageEl.className = 'text-5xl font-black mb-6 text-green-500';

            // Auto advance for correct answer
            setTimeout(() => {
                nextProblem();
            }, 2000);
        } else {
            lives--;
            HarmonyGame.playEffect('wrong');
            feedbackIconEl.textContent = '❌';
            feedbackMessageEl.textContent = 'ざんねん...';
            feedbackMessageEl.className = 'text-5xl font-black mb-6 text-red-500';
            
            if (lives <= 0) {
                 setTimeout(() => {
                    alert('ゲームオーバー！');
                    level = 1; 
                    localStorage.setItem('harmonyGameLevel', level);
                    location.reload(); 
                 }, 2000);
                 return;
            }

            // Show controls for wrong answer
            setTimeout(() => {
                feedbackContentEl.classList.remove('popup-show');
                setTimeout(() => feedbackPopupEl.classList.add('hidden'), 300);
                postAnswerControlsEl.classList.remove('hidden');
            }, 2000);
        }
    }

    function showFeedbackOnSlider(userValue) {
        const wrapper = slidersContainerEl.querySelector('.w-full.max-w-lg'); 
        if (!wrapper) return;
        
        const existing = wrapper.querySelector('.feedback-overlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'feedback-overlay relative h-2 w-full mt-2';
        
        const correctCenter = gameLogic.correctSliderValue;
        const rangeMin = correctCenter - 2;
        const rangeMax = correctCenter + 2;
        
        const minPercent = ((rangeMin + 10) / 20) * 100;
        const maxPercent = ((rangeMax + 10) / 20) * 100;
        const width = maxPercent - minPercent;
        
        const correctBar = document.createElement('div');
        correctBar.style.cssText = `
            position: absolute;
            left: ${Math.max(0, minPercent)}%;
            width: ${Math.min(100, width)}%;
            height: 100%;
            background-color: rgba(74, 222, 128, 0.7); /* Green */
            border-radius: 4px;
        `;
        overlay.appendChild(correctBar);
        
        const userPercent = ((userValue + 10) / 20) * 100;
        const userMarker = document.createElement('div');
        userMarker.style.cssText = `
            position: absolute;
            left: ${userPercent}%;
            top: -4px;
            width: 4px;
            height: 16px;
            background-color: red;
            transform: translateX(-50%);
        `;
        overlay.appendChild(userMarker);
        
        wrapper.appendChild(overlay);
    }

    function updateUI() {
        scoreEl.textContent = `せいかい: ${score}`;
        livesEl.textContent = '❤️'.repeat(lives);
        if (questionNumberEl) questionNumberEl.textContent = `もんだい ${questionNumber} (Lv.${level})`;
        
        if (currentProblem && currentProblem.interval) {
             const localizedInterval = intervalDisplayMap[currentProblem.interval] || currentProblem.interval;
             chordNameEl.textContent = localizedInterval;
        }
    }

    function noteToFreq(note) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octaveStr = note.slice(-1);
        const noteStr = note.slice(0, -1);
        const octave = parseInt(octaveStr, 10);
        const noteIndex = notes.indexOf(noteStr);
        const midiNum = noteIndex + (octave + 1) * 12;
        return 442 * Math.pow(2, (midiNum - 69) / 12);
    }

    function startAnimationLoop() {
        let startTime = Date.now();
        
        function loop() {
            animationFrameId = requestAnimationFrame(loop);
            
            if (!isGameReady || !isPlaying || !gameLogic || typeof gameLogic.getBeatIntensity !== 'function' || !characterEl) {
                if (characterEl) characterEl.style.transform = `translate(0px, 0px) rotate(0deg)`;
                return;
            }

            const slider = document.getElementById('frequency-slider');
            const sliderValue = slider ? parseInt(slider.value, 10) : 0;
            
            // 視覚補助（キャラクターの揺れ）の強度計算
            // ヒントの減少ロジック: 出現回数に応じて「動かない範囲（デッドゾーン）」を広げる
            const currentCount = (currentProblem && currentProblem.interval) 
                ? (intervalCounts[currentProblem.interval] || 1) 
                : 1;
            
            // Count 1 -> DeadZone 0
            // Count 11 -> DeadZone 5 (Max)
            const deadZone = Math.min(5, (currentCount - 1) * 0.5);
            
            if (window.gameStates) {
                window.gameStates.currentDeadZone = deadZone;
            }

            let intensity = 0;
            if (gameLogic && typeof gameLogic.correctSliderValue === 'number') {
                const diff = Math.abs(sliderValue - gameLogic.correctSliderValue);
                if (diff > deadZone) {
                    // デッドゾーンを超えた分だけ揺れる
                    intensity = (diff - deadZone) * 0.1; 
                }
            }
            
            if (Math.random() < 0.01) {
                console.log('Animation Loop:', { sliderValue, intensity, visualAidScale });
            }
            
            const time = (Date.now() - startTime) / 1000;
            const shakeSpeed = 20; 
            const shakeAmount = intensity * 10; 
            
            const offsetX = Math.sin(time * shakeSpeed) * shakeAmount;
            const offsetY = Math.cos(time * shakeSpeed * 1.3) * shakeAmount;
            const rotate = Math.sin(time * shakeSpeed * 0.5) * intensity * 5;

            characterEl.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotate}deg)`;
        }
        
        loop();
    }

    initGame();
});