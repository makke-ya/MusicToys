const puppeteer = require('puppeteer');

describe('MusicToys App', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should display correct title', async () => {
    await page.goto('file:///workspace/program/MusicToys/index.html');
    const title = await page.title();
    expect(title).toBe('ゲームせんたく'); // index.htmlのタイトルに合わせてください
  });
});