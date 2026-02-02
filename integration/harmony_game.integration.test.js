const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

describe('Harmony Game Integration', () => {
  let browser;
  let page;
  let serverProcess;
  const PORT = 8082; 

  beforeAll(async () => {
    serverProcess = spawn('python3', ['-m', 'http.server', PORT.toString()], {
        cwd: '/workspace/program/MusicToys',
        stdio: 'ignore'
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    // page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  });

  afterAll(async () => {
    await browser.close();
    if (serverProcess) {
        serverProcess.kill();
    }
  });

  test('should show instructions popup on start', async () => {
    await page.goto(`http://localhost:${PORT}/games/002_harmony_game/index.html?level=1`);
    
    // Check for instructions popup
    await page.waitForSelector('#instructions-popup', { visible: true });
    const content = await page.$eval('#instructions-popup', el => el.textContent);
    expect(content).toContain('あそびかた');
    expect(content).toContain('合図'); // New explanation text matches '合図'
    
    // Click start button
    await page.click('#instructions-start-button');
    
    // Verify instructions hidden and intro shown
    await page.waitForSelector('#instructions-popup', { hidden: true });
    const isIntroVisible = await page.$eval('#intro-popup', el => !el.classList.contains('hidden'));
    expect(isIntroVisible).toBe(true);
  }, 30000);

  test('visual aid dead zone should be zero at start even for high levels', async () => {
    // New logic: Dead zone depends on interval count.
    // So even at Level 30, if it's the first time for that interval, dead zone should be 0.
    await page.goto(`http://localhost:${PORT}/games/002_harmony_game/index.html?level=30`);
    
    // Close instructions
    await page.waitForSelector('#instructions-start-button', { visible: true });
    await page.click('#instructions-start-button');
    
    // Wait for game to be ready
    await new Promise(r => setTimeout(r, 4000));
    
    const deadZone = await page.evaluate(() => window.gameStates.currentDeadZone);
    expect(deadZone).toBe(0);
  }, 30000);

  test('visual aid dead zone should expand based on specific interval count', async () => {
    await page.goto(`http://localhost:${PORT}/games/002_harmony_game/index.html?level=1`);
    
    // Close instructions
    await page.waitForSelector('#instructions-start-button', { visible: true });
    await page.click('#instructions-start-button');
    await new Promise(r => setTimeout(r, 4000));

    // Get current interval name
    const counts = await page.evaluate(() => window.gameStates.intervalCounts);
    const intervals = Object.keys(counts);
    expect(intervals.length).toBeGreaterThan(0);
    const currentInterval = intervals[0];

    // Check initial dead zone
    let deadZone = await page.evaluate(() => window.gameStates.currentDeadZone);
    expect(deadZone).toBe(0);

    // Manipulate count to 5
    await page.evaluate((interval) => {
        window.gameStates.intervalCounts[interval] = 5; // (5-1)*0.5 = 2.0
    }, currentInterval);

    // Wait for loop
    await new Promise(r => setTimeout(r, 100));

    deadZone = await page.evaluate(() => window.gameStates.currentDeadZone);
    expect(deadZone).toBe(2);

    // Manipulate count to 11 (Max)
    await page.evaluate((interval) => {
        window.gameStates.intervalCounts[interval] = 11; // (11-1)*0.5 = 5.0 (min(5, 5) = 5)
    }, currentInterval);

    await new Promise(r => setTimeout(r, 100));

    deadZone = await page.evaluate(() => window.gameStates.currentDeadZone);
    expect(deadZone).toBe(5);
  }, 30000);

  test('should mix instruments when interval count is high at level 30', async () => {
    await page.goto(`http://localhost:${PORT}/games/002_harmony_game/index.html?level=30`);
    
    await page.waitForSelector('#instructions-start-button', { visible: true });
    await page.click('#instructions-start-button');
    await new Promise(r => setTimeout(r, 4000));

    let mixedFound = false;
    for (let i = 0; i < 10; i++) {
        // Set count for ALL possible intervals to > 10
        await page.evaluate(() => {
            const allIntervals = [
                'Perfect 1st', 'Perfect 8th', 'Perfect 5th', 'Perfect 4th', 
                'Major 6th', 'Major 3rd', 'minor 3rd', 'minor 6th', 
                'minor 7th', 'Major 2nd', 'Major 7th', 'minor 2nd', 'Tritone'
            ];
            allIntervals.forEach(k => {
                window.gameStates.intervalCounts[k] = 15;
            });
        });

        // Check current timbre display
        const timbreText = await page.$eval('#intro-timbre', el => el.textContent);
        if (timbreText.includes('&')) {
            mixedFound = true;
            break;
        }
        
        // Move to next
        await page.click('#answer-button');
        await new Promise(r => setTimeout(r, 1000));
        
        const isCorrect = await page.$eval('#feedback-icon', el => el.textContent.includes('⭕'));
        
        if (isCorrect) {
            await new Promise(r => setTimeout(r, 2500));
        } else {
            await new Promise(r => setTimeout(r, 2500));
            await page.click('#main-next-button');
            await new Promise(r => setTimeout(r, 1000));
        }
        
        await page.waitForSelector('#intro-timbre', { visible: true });
    }
    
    expect(mixedFound).toBe(true);
  }, 60000);

  test('should show intro popup and start audio automatically', async () => {
    await page.goto(`http://localhost:${PORT}/games/002_harmony_game/index.html?level=1`);
    
    // Close instructions
    await page.waitForSelector('#instructions-start-button', { visible: true });
    await page.click('#instructions-start-button');
    
    const introPopup = await page.$('#intro-popup');
    expect(introPopup).not.toBeNull();
    const isIntroVisible = await page.$eval('#intro-popup', el => !el.classList.contains('hidden'));
    expect(isIntroVisible).toBe(true);

    const introContent = await page.$eval('#intro-popup', el => el.textContent);
    expect(introContent).toContain('Level');
    expect(introContent).toContain('1');
    // 日本語化された和音名をチェック
    // Lv1 can be Perfect 1st or Perfect 8th
    const isP1 = introContent.includes('かんぜん1ど');
    const isP8 = introContent.includes('かんぜん8ど');
    expect(isP1 || isP8).toBe(true);

    await new Promise(r => setTimeout(r, 2500));
    const isIntroHidden = await page.$eval('#intro-popup', el => el.classList.contains('hidden'));
    expect(isIntroHidden).toBe(true);

    const isPlaying = await page.evaluate(() => window.gameStates.isPlaying);
    expect(isPlaying).toBe(true);
  }, 30000);

  test('should show feedback popup then post-answer controls (on wrong answer)', async () => {
    await page.goto(`http://localhost:${PORT}/games/002_harmony_game/index.html?level=1`);
    
    // Close instructions
    await page.waitForSelector('#instructions-start-button', { visible: true });
    await page.click('#instructions-start-button');

    await new Promise(r => setTimeout(r, 2500)); 
    
    // Ensure wrong answer by moving slider to extreme
    await page.$eval('#frequency-slider', el => {
        el.value = 10; // Correct range is -8 to +8
        el.dispatchEvent(new Event('input'));
    });

    await page.click('#answer-button');

    const feedbackPopup = await page.$('#feedback-popup');
    expect(feedbackPopup).not.toBeNull();
    const isFeedbackVisible = await page.$eval('#feedback-popup', el => !el.classList.contains('hidden'));
    expect(isFeedbackVisible).toBe(true);

    // Wait for 2.5s -> popup should hide, controls appear (because it's wrong)
    await new Promise(r => setTimeout(r, 2500));
    
    const isFeedbackHidden = await page.$eval('#feedback-popup', el => el.classList.contains('hidden'));
    expect(isFeedbackHidden).toBe(true);

    const isControlsVisible = await page.$eval('#post-answer-controls', el => !el.classList.contains('hidden'));
    expect(isControlsVisible).toBe(true);
  }, 30000);

  test('should decrease tolerance every 5 levels', async () => {
    // Level 1: 20c
    await page.goto(`http://localhost:${PORT}/games/002_harmony_game/index.html?level=1`);
    await page.waitForSelector('#instructions-start-button', { visible: true });
    await page.click('#instructions-start-button');

    await page.waitForFunction(() => document.querySelector('#intro-tolerance').textContent.includes('c'), { timeout: 5000 });
    let toleranceText = await page.$eval('#intro-tolerance', el => el.textContent);
    expect(toleranceText).toContain('20c');

    // Level 4: 20c (20 - floor(3/5) = 20)
    await page.goto(`http://localhost:${PORT}/games/002_harmony_game/index.html?level=4`);
    await page.waitForSelector('#instructions-start-button', { visible: true });
    await page.click('#instructions-start-button');

    await page.waitForFunction(() => document.querySelector('#intro-tolerance').textContent.includes('c'), { timeout: 5000 });
    toleranceText = await page.$eval('#intro-tolerance', el => el.textContent);
    expect(toleranceText).toContain('20c');

    // Level 6: 19c (20 - floor(5/5) = 19)
    await page.goto(`http://localhost:${PORT}/games/002_harmony_game/index.html?level=6`);
    await page.waitForSelector('#instructions-start-button', { visible: true });
    await page.click('#instructions-start-button');

    await page.waitForFunction(() => document.querySelector('#intro-tolerance').textContent.includes('c'), { timeout: 5000 });
    toleranceText = await page.$eval('#intro-tolerance', el => el.textContent);
    expect(toleranceText).toContain('19c');
    
    // Level 31: 14c (20 - floor(30/5) = 14)
    await page.goto(`http://localhost:${PORT}/games/002_harmony_game/index.html?level=31`);
    await page.waitForSelector('#instructions-start-button', { visible: true });
    await page.click('#instructions-start-button');
    
    // Wait for popup to appear (loading audio might take time)
    await page.waitForSelector('#intro-tolerance', { visible: true, timeout: 5000 });
    // Also ensure text is populated
    await page.waitForFunction(
        () => document.querySelector('#intro-tolerance').textContent.includes('c'),
        { timeout: 5000 }
    );
    
    toleranceText = await page.$eval('#intro-tolerance', el => el.textContent);
    expect(toleranceText).toContain('14c');
  }, 30000);
    
  test('should use random instrument for Level 30+', async () => {
    await page.goto(`http://localhost:${PORT}/games/002_harmony_game/index.html?level=30`);
    await page.waitForSelector('#instructions-start-button', { visible: true });
    await page.click('#instructions-start-button');
    
    await page.waitForSelector('#intro-timbre', { visible: true, timeout: 5000 });
    await page.waitForFunction(
        () => document.querySelector('#intro-timbre').textContent.length > 0,
        { timeout: 5000 }
    );
    
    const instrumentName = await page.$eval('#intro-timbre', el => el.textContent);
    expect(instrumentName.length).toBeGreaterThan(0);
  }, 30000);
    
    });
    
    