const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

describe('Sound UpDown Integration', () => {
  let browser;
  let page;
  let serverProcess;
  const PORT = 8083; 

  beforeAll(async () => {
    serverProcess = spawn('python3', ['-m', 'http.server', PORT.toString()], {
        cwd: '/workspace/program/MusicToys',
        stdio: 'ignore'
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    // Capture console logs from browser
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  });

  afterAll(async () => {
    await browser.close();
    if (serverProcess) serverProcess.kill();
  });

  test('should start game and progress score', async () => {
    await page.goto(`http://localhost:${PORT}/games/003_sound_updown/`);
    
    // Check Title
    const title = await page.$eval('h1', el => el.textContent);
    expect(title).toContain('おと');
    expect(title).toContain('アップ');

    // Click Level 1 Button
    const buttons = await page.$$('.level-btn');
    expect(buttons.length).toBe(3);
    await buttons[0].click();

    // Wait for instructions popup
    await page.waitForSelector('#instructions-popup:not(.hidden)');
    await new Promise(r => setTimeout(r, 500));
    
    // Click Start in popup via JS to ensure it fires
    await page.evaluate(() => {
        const btn = document.getElementById('instructions-start-button');
        if (btn) btn.click();
        else window.startGame(); // Fallback
    });

    // Wait for game screen
    await page.waitForSelector('#game-screen:not(.hidden)', { timeout: 10000 });
    
    // Wait for logic initialization (nextProblem called)
    await new Promise(r => setTimeout(r, 1000));

    // Cheat: Check current problem via console logic or infer
    // Since we can't hear sound, we need to inspect gameLogic state.
    // gameLogic is global in main.js scope? No, it's 'let gameLogic' inside file but not attached to window.
    // We can't access it easily unless we expose it.
    
    // For testability, let's expose it in main.js
    // OR we can just try both buttons. One MUST be correct.
    
    const initialScore = await page.$eval('#score', el => parseInt(el.textContent));
    expect(initialScore).toBe(0);

    // Try clicking Up
    await page.click('#area-up');
    await new Promise(r => setTimeout(r, 500));
    
    let newScore = await page.$eval('#score', el => parseInt(el.textContent));
    
    if (newScore === 0) {
        // Up was wrong, so Down must be correct (unless blocked by canAnswer)
        // Wait a bit more to ensure canAnswer is true
        await page.click('#area-down');
        await new Promise(r => setTimeout(r, 500));
        newScore = await page.$eval('#score', el => parseInt(el.textContent));
    }
    
    expect(newScore).toBe(1);
  }, 60000);
});
