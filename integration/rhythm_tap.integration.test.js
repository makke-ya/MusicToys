const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const path = require('path');

describe('Rhythm Tap Integration', () => {
    let browser;
    let page;
    let serverProcess;
    const PORT = 8084;

    beforeAll(async () => {
        serverProcess = spawn('python3', ['-m', 'http.server', PORT.toString()], {
            cwd: path.resolve(__dirname, '..'),
            stdio: 'ignore'
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        page = await browser.newPage();
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
    });

    afterAll(async () => {
        if (browser) await browser.close();
        if (serverProcess) serverProcess.kill();
    });

    test('should gray out pad during demo, then enable pad and accept rhythm taps', async () => {
        await page.goto(`http://localhost:${PORT}/games/004_rhythm_tap/`);

        // Check Title
        const title = await page.$eval('h1', el => el.textContent);
        expect(title).toContain('リズムに');

        // Click Level 1 Button
        const buttons = await page.$$('.level-btn');
        expect(buttons.length).toBe(3);
        await buttons[0].click();

        // Wait for instructions popup
        await page.waitForSelector('#instructions-popup:not(.hidden)');

        // Click Start in popup
        await page.click('#instructions-start-button');

        // Wait for game screen
        await page.waitForSelector('#game-screen:not(.hidden)', { timeout: 10000 });

        // Verify pad is grayed out and disabled during demo playback
        const isDisabledDuringDemo = await page.$eval('#taiko-pad', el =>
            el.classList.contains('taiko-disabled') && el.disabled === true
        );
        expect(isDisabledDuringDemo).toBe(true);

        // Wait for demo playback to finish and input phase to begin ("たたいてね")
        await page.waitForFunction(
            () => {
                const banner = document.getElementById('phase-banner');
                return banner && banner.textContent.includes('たたいてね');
            },
            { timeout: 15000 }
        );

        // Verify pad is now enabled and not grayed out
        const isDisabledDuringInput = await page.$eval('#taiko-pad', el =>
            el.classList.contains('taiko-disabled') || el.disabled === true
        );
        expect(isDisabledDuringInput).toBe(false);

        // Check how many taps are required for the generated Level 1 pattern
        const requiredTaps = await page.$$eval('#guide-dots-container .guide-dot', dots => dots.length);
        for (let i = 0; i < requiredTaps; i++) {
            await page.click('#taiko-pad');
            if (i < requiredTaps - 1) {
                await new Promise(r => setTimeout(r, 600));
            }
        }

        // Wait for judgment popup to appear
        await page.waitForSelector('#judgment-popup:not(.hidden)', { timeout: 5000 });

        const finalScore = await page.$eval('#score', el => parseInt(el.textContent, 10));
        expect(finalScore).toBeGreaterThan(0);
    }, 60000);
});
