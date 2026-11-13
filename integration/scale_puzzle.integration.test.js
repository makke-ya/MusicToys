const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const path = require('path');

describe('Scale Puzzle Integration', () => {
    let browser;
    let page;
    let serverProcess;
    const PORT = 8086;

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

    test('should gray out candidate blocks during demo, then enable audition/placement and evaluate staircase puzzle', async () => {
        await page.goto(`http://localhost:${PORT}/games/006_scale_puzzle/`);

        // Check Title
        const title = await page.$eval('h1', el => el.textContent);
        expect(title).toContain('おとのかいだん');

        // Click Level 1 Button
        const buttons = await page.$$('.level-btn');
        expect(buttons.length).toBe(3);
        await buttons[0].click();

        // Wait for instructions popup
        await page.waitForSelector('#instructions-popup:not(.hidden)');
        await page.click('#instructions-start-button');

        // Wait for game screen
        await page.waitForSelector('#game-screen:not(.hidden)', { timeout: 10000 });

        // Verify candidate blocks and audition buttons are grayed out and disabled during demo playback
        const areBlocksDisabledDuringDemo = await page.$$eval(
            '#candidate-blocks-container .candidate-block',
            blocks => blocks.length > 0 && blocks.every(b => b.classList.contains('block-disabled') && b.disabled === true)
        );
        expect(areBlocksDisabledDuringDemo).toBe(true);

        // Wait for demo playback to finish and input phase to begin ("ききくらべて")
        await page.waitForFunction(
            () => {
                const banner = document.getElementById('phase-banner');
                return banner && banner.textContent.includes('ききくらべて');
            },
            { timeout: 15000 }
        );

        // Verify candidate blocks are enabled during input phase
        const areBlocksDisabledDuringInput = await page.$$eval(
            '#candidate-blocks-container .candidate-block',
            blocks => blocks.some(b => b.classList.contains('block-disabled') || b.disabled === true)
        );
        expect(areBlocksDisabledDuringInput).toBe(false);

        // Test audition button click without completing the puzzle
        await page.click('#candidate-blocks-container .audition-btn');

        // Place the first candidate block to fill the 1 blank in Level 1
        await page.click('#candidate-blocks-container .candidate-block[data-candidate-ordinal="0"]');

        // Wait for judgment popup
        await page.waitForSelector('#judgment-popup:not(.hidden)', { timeout: 6000 });

        const finalScore = await page.$eval('#score', el => parseInt(el.textContent, 10));
        expect(finalScore).toBeGreaterThan(0);
    }, 60000);
});
