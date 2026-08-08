import { chromium } from 'playwright-core';
import path from 'node:path';

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
let page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));

await page.goto('http://127.0.0.1:56589/#/experience/nightcare', { waitUntil: 'domcontentloaded' });
await page.locator('.nightcare-model-canvas canvas').waitFor({ state: 'visible', timeout: 60000 });
await page.getByText('模型可旋转 · 等待终端操作', { exact: true }).waitFor({ timeout: 60000 });
await page.screenshot({ path: path.resolve('qa/nightcare-experience-initial.png'), fullPage: true });

const frame = page.frames().find((candidate) => candidate !== page.mainFrame());
if (!frame) throw new Error('NightCare iframe failed to load');
await frame.waitForLoadState('domcontentloaded');
await frame.evaluate(() => window.NightCarePrototype.goTo('payment'));
await frame.getByRole('button', { name: '已完成付款', exact: true }).click();
await page.getByText(/已送达取货位置/).waitFor({ timeout: 10000 });
await page.screenshot({ path: path.resolve('qa/nightcare-experience-delivered.png'), fullPage: true });

await page.locator('.nightcare-model-canvas').focus();
await page.keyboard.press('ArrowLeft');
await page.keyboard.press('Home');

await frame.evaluate(() => window.parent.postMessage({
  type: 'nightcare:purchase-complete',
  productId: 'private-test',
  productName: '隐私护理用品',
  delivery: 'private',
}, window.location.origin));
await page.getByText('隐私护理用品 · 已送达取货位置', { exact: true }).waitFor({ timeout: 10000 });

await frame.evaluate(() => window.parent.postMessage({
  type: 'nightcare:purchase-complete',
  productId: 'single-test',
  productName: '电子体温计',
  delivery: 'single',
}, window.location.origin));
await page.getByText('电子体温计 · 已送达取货位置', { exact: true }).waitFor({ timeout: 10000 });

const desktop = await page.evaluate(() => ({
  canvasCount: document.querySelectorAll('.nightcare-model-canvas canvas').length,
  iframeCount: document.querySelectorAll('.nightcare-terminal-frame iframe').length,
  horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
  activeStatus: document.querySelector('.nightcare-viewer-status')?.textContent?.trim(),
}));

await page.close();
page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));
await page.goto('http://127.0.0.1:56589/#/experience/nightcare', { waitUntil: 'domcontentloaded' });
await page.getByRole('tab', { name: '操作终端' }).waitFor();
const mobileInitial = await page.evaluate(() => ({
  selectedTerminal: document.querySelector('[role="tab"][aria-selected="true"]')?.textContent,
  horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
}));
const mobileFrame = page.frames().find((candidate) => candidate !== page.mainFrame());
if (!mobileFrame) throw new Error('NightCare mobile iframe failed to load');
await mobileFrame.waitForLoadState('domcontentloaded');
await mobileFrame.evaluate(() => window.parent.postMessage({
  type: 'nightcare:purchase-complete',
  productId: 'mobile-test',
  productName: '即时冷敷袋',
  delivery: 'single',
}, window.location.origin));
await page.waitForFunction(() => document.querySelector('#nightcare-model-tab')?.getAttribute('aria-selected') === 'true');
await page.locator('.nightcare-model-pane.is-mobile-active').waitFor();
try {
  await page.getByText('即时冷敷袋 · 已送达取货位置', { exact: true }).waitFor({ timeout: 20000 });
} catch (error) {
  const currentStatus = await page.locator('.nightcare-viewer-status').textContent();
  throw new Error(`Mobile delivery did not finish. Current status: ${currentStatus}`, { cause: error });
}
await page.screenshot({ path: path.resolve('qa/nightcare-experience-mobile.png'), fullPage: true });
const mobileModel = await page.evaluate(() => ({
  selectedModel: document.querySelector('[role="tab"][aria-selected="true"]')?.textContent,
  modelVisible: Boolean(document.querySelector('.nightcare-model-pane.is-mobile-active')),
}));

await browser.close();
const report = { desktop, mobileInitial, mobileModel, errors };
console.log(JSON.stringify(report, null, 2));
if (
  desktop.canvasCount !== 1
  || desktop.iframeCount !== 1
  || desktop.horizontalOverflow
  || mobileInitial.horizontalOverflow
  || !mobileModel.modelVisible
  || errors.length
) process.exitCode = 1;
