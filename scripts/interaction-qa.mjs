import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--disable-gpu'],
});

const widths = [320, 375, 414, 768];
const responsive = [];

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 844 } });
  await page.goto('http://127.0.0.1:56589/work/wander', { waitUntil: 'domcontentloaded' });
  responsive.push(await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    pages: document.querySelectorAll('.portfolio-page').length,
    imagesWithoutSize: Array.from(document.querySelectorAll('.portfolio-page img')).filter(
      (image) => !image.hasAttribute('width') || !image.hasAttribute('height'),
    ).length,
  })));
  await page.close();
}

const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://127.0.0.1:56589/work/wander', { waitUntil: 'domcontentloaded' });
const firstPageButton = page.locator('.portfolio-page-open').first();
await firstPageButton.focus();
await firstPageButton.click();
const opened = await page.getByRole('dialog').isVisible();
await page.keyboard.press('ArrowRight');
const nextPageLabel = await page.getByRole('dialog').locator('.lightbox-toolbar span').textContent();
await page.getByRole('button', { name: '放大细节' }).click();
const zoomed = await page.locator('.lightbox-stage').evaluate((node) => node.classList.contains('is-zoomed'));
await page.keyboard.press('Escape');
const closed = await page.getByRole('dialog').count() === 0;
const focusRestored = await firstPageButton.evaluate((node) => document.activeElement === node);

await browser.close();
process.stdout.write(JSON.stringify({ responsive, lightbox: { opened, nextPageLabel, zoomed, closed, focusRestored } }, null, 2));
