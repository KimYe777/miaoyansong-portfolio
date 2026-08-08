import { chromium } from 'playwright-core';
import path from 'node:path';

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--disable-gpu'],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const messages = [];
page.on('console', (message) => {
  if (message.type() === 'error' || message.type() === 'warning') messages.push(`${message.type()}: ${message.text()}`);
});
page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));

await page.goto('http://127.0.0.1:56589/work/clearsense', { waitUntil: 'domcontentloaded' });
await page.locator('.model-experience').scrollIntoViewIfNeeded();
await page.locator('.part-count').waitFor({ state: 'visible', timeout: 90000 });

const slider = page.locator('#clearsense-explode');
await page.locator('.model-experience').screenshot({ path: path.resolve('qa/clearsense-model-assembled.png') });
const desktopCanvas = page.locator('.model-canvas canvas');
const desktopCanvasBox = await desktopCanvas.boundingBox();
if (desktopCanvasBox) {
  await page.mouse.move(desktopCanvasBox.x + desktopCanvasBox.width * 0.35, desktopCanvasBox.y + desktopCanvasBox.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(desktopCanvasBox.x + desktopCanvasBox.width * 0.65, desktopCanvasBox.y + desktopCanvasBox.height * 0.42, { steps: 8 });
  await page.mouse.up();
  await page.mouse.wheel(0, -280);
}
await slider.fill('100');
await page.getByRole('button', { name: '自动旋转' }).click();
await page.locator('.model-experience').screenshot({ path: path.resolve('qa/clearsense-model-desktop.png') });

await page.locator('.prototype-experience').scrollIntoViewIfNeeded();
const frame = page.frameLocator('.prototype-frame');
await frame.locator('#app').waitFor({ state: 'visible', timeout: 30000 });
const startButton = frame.getByRole('button', { name: '开始使用' });
if (await startButton.count()) await startButton.click();
await frame.getByText(/环境比较温和|花粉正在缓慢升高/).waitFor({ state: 'visible', timeout: 10000 });
await page.locator('.prototype-experience').screenshot({ path: path.resolve('qa/clearsense-prototype-desktop.png') });

const desktop = await page.evaluate(() => ({
  portfolioPages: document.querySelectorAll('.portfolio-page').length,
  canvases: document.querySelectorAll('.model-canvas canvas').length,
  partCount: document.querySelector('.part-count')?.textContent,
  exploded: document.querySelector('#clearsense-explode')?.value,
  autoRotate: document.querySelector('.model-control-buttons button')?.getAttribute('aria-pressed'),
  iframe: Boolean(document.querySelector('.prototype-frame')),
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}));

const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const mobilePage = await mobileContext.newPage();
await mobilePage.goto('http://127.0.0.1:56589/work/clearsense', { waitUntil: 'domcontentloaded' });
await mobilePage.locator('.model-experience').scrollIntoViewIfNeeded();
await mobilePage.locator('.part-count').waitFor({ state: 'visible', timeout: 90000 });
await mobilePage.locator('.model-experience').screenshot({ path: path.resolve('qa/clearsense-model-mobile.png') });
const mobileEnable = mobilePage.locator('.model-enable');
if (await mobileEnable.count()) await mobileEnable.click();
await mobilePage.locator('#clearsense-explode').fill('65');
await mobilePage.locator('.model-experience').screenshot({ path: path.resolve('qa/clearsense-model-mobile-active.png') });
await mobilePage.locator('.prototype-experience').scrollIntoViewIfNeeded();
await mobilePage.frameLocator('.prototype-frame').locator('#app').waitFor({ state: 'visible', timeout: 30000 });
await mobilePage.locator('.prototype-experience').screenshot({ path: path.resolve('qa/clearsense-prototype-mobile.png') });
const mobile = await mobilePage.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  enableButton: document.querySelector('.model-enable')?.textContent?.trim() ?? null,
  exploded: document.querySelector('#clearsense-explode')?.value,
  iframeWidth: document.querySelector('.prototype-frame')?.getBoundingClientRect().width ?? 0,
}));
await mobileContext.close();

const responsive = {};
for (const width of [320, 375, 414, 768]) {
  const responsivePage = await context.newPage();
  await responsivePage.setViewportSize({ width, height: 900 });
  await responsivePage.goto('http://127.0.0.1:56589/work/clearsense', { waitUntil: 'domcontentloaded' });
  responsive[width] = await responsivePage.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  await responsivePage.close();
}

await browser.close();
process.stdout.write(JSON.stringify({ desktop, mobile, responsive, messages }, null, 2));
