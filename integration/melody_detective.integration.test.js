const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const path = require('path');

describe('Melody Detective Integration', () => {
    let browser;
    let page;
    let serverProcess;
    const PORT = 8087;

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

    test('should gray out choices during comparison demo, then enable choices and evaluate answer', async () => {
        await page.goto(`http://localhost:${PORT}/games/007_melody_detective/`);

        // Check Title
        const title = await page.$eval('h1', el => el.textContent);
        expect(title).toContain('おんがくたんてい');

        // Click Level 1 Button
        const buttons = await page.$$('.level-btn');
        expect(buttons.length).toBe(3);
        await buttons[0].click();

        // Wait for instructions popup
        await page.waitForSelector('#instructions-popup:not(.hidden)');
        await page.click('#instructions-start-button');

        // Wait for game screen
        await page.waitForSelector('#game-screen:not(.hidden)', { timeout: 10000 });

        // Verify choices are grayed out and disabled during demo playback
        const areChoicesDisabledDuringDemo = await page.$$eval('.detective-choice', btns =>
            btns.length > 0 && btns.every(b => b.classList.contains('choice-disabled') && b.disabled === true)
        );
        expect(areChoicesDisabledDuringDemo).toBe(true);

        // Wait for demo playback to finish and input phase to begin ("タッチしてね")
        await page.waitForFunction(
            () => {
                const banner = document.getElementById('phase-banner');
                return banner && banner.textContent.includes('タッチしてね');
            },
            { timeout: 15000 }
        );

        // Verify choices are enabled during input phase
        const areChoicesDisabledDuringInput = await page.$$eval('.detective-choice', btns =>
            btns.some(b => b.classList.contains('choice-disabled') || b.disabled === true)
        );
        expect(areChoicesDisabledDuringInput).toBe(false);

        // Click a choice button
        await page.click('#choice-same-btn');

        // Wait for judgment popup
        await page.waitForSelector('#judgment-popup:not(.hidden)', { timeout: 5000 });

        const finalScore = await page.$eval('#score', el => parseInt(el.textContent, 10));
        expect(finalScore).toBeGreaterThan(0);
    }, 60000);
});
