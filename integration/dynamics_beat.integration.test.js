const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const path = require('path');

describe('Dynamics Beat Integration', () => {
    let browser;
    let page;
    let serverProcess;
    const PORT = 8088;

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

    test('should gray out drum pads during demo, then enable pads and evaluate dynamics input', async () => {
        await page.goto(`http://localhost:${PORT}/games/008_dynamics_beat/`);

        // Check Title
        const title = await page.$eval('h1', el => el.textContent);
        expect(title).toContain('たいこでドン');

        // Click Level 1 Button
        const buttons = await page.$$('.level-btn');
        expect(buttons.length).toBe(3);
        await buttons[0].click();

        // Wait for instructions popup
        await page.waitForSelector('#instructions-popup:not(.hidden)');
        await page.click('#instructions-start-button');

        // Wait for game screen
        await page.waitForSelector('#game-screen:not(.hidden)', { timeout: 10000 });

        // Verify drum pads are grayed out and disabled during demo playback
        const arePadsDisabledDuringDemo = await page.$$eval('#drum-pads-container .drum-pad', pads =>
            pads.length > 0 && pads.every(p => p.classList.contains('pad-disabled') && p.disabled === true)
        );
        expect(arePadsDisabledDuringDemo).toBe(true);

        // Wait for demo playback to finish and input phase to begin ("たたいてね")
        await page.waitForFunction(
            () => {
                const banner = document.getElementById('phase-banner');
                return banner && banner.textContent.includes('たたいてね');
            },
            { timeout: 15000 }
        );

        // Verify drum pads are enabled during input phase
        const arePadsDisabledDuringInput = await page.$$eval('#drum-pads-container .drum-pad', pads =>
            pads.some(p => p.classList.contains('pad-disabled') || p.disabled === true)
        );
        expect(arePadsDisabledDuringInput).toBe(false);

        // Tap pads for the required number of beat slots
        const requiredBeats = await page.$$eval('#beat-slots-container .beat-slot', slots => slots.length);
        for (let i = 0; i < requiredBeats; i++) {
            await page.click('#drum-pads-container .drum-pad[data-dynamic-id="f"]');
            await new Promise(r => setTimeout(r, 120));
        }

        // Wait for judgment popup
        await page.waitForSelector('#judgment-popup:not(.hidden)', { timeout: 5000 });

        const finalScore = await page.$eval('#score', el => parseInt(el.textContent, 10));
        expect(finalScore).toBeGreaterThan(0);
    }, 60000);
});
