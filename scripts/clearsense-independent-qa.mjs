import { chromium } from 'playwright-core';
import path from 'node:path';

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--use-angle=swiftshader'],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const messages = [];
page.on('console', (message) => {
  if (message.type() === 'error') messages.push(`console: ${message.text()}`);
});
page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));

await page.goto('http://127.0.0.1:56589/', { waitUntil: 'domcontentloaded' });
const entryLinks = await page.locator('.featured-project.theme-clearsense .project-entry-links a').evaluateAll((links) => (
  links.map((link) => ({ text: link.textContent?.replace(/\s+/g, ' ').trim(), href: link.getAttribute('href') }))
));
await page.locator('.featured-project.theme-clearsense').screenshot({ path: path.resolve('qa/clearsense-three-entries-desktop.png') });

await page.goto('http://127.0.0.1:56589/#/work/clearsense', { waitUntil: 'domcontentloaded' });
const portfolio = await page.evaluate(() => ({
  pages: document.querySelectorAll('.portfolio-page').length,
  embeddedExperience: Boolean(document.querySelector('.project-experience')),
}));

await page.goto('http://127.0.0.1:56589/#/experience/clearsense-model', { waitUntil: 'domcontentloaded' });
const modelHost = page.locator('.model-canvas');
try {
  await page.waitForFunction(() => document.querySelector('.model-canvas')?.getAttribute('data-upper-parts') === '4', null, { timeout: 30000 });
} catch (error) {
  const diagnostics = await page.evaluate(() => ({
    status: document.querySelector('.model-loading span, .model-fallback figcaption')?.textContent,
    suspense: document.querySelector('.standalone-loading')?.textContent,
    bodyText: document.body.innerText.slice(0, 500),
    failed: Boolean(document.querySelector('.model-fallback')),
    hasCanvas: Boolean(document.querySelector('.model-canvas canvas')),
    webgl: Boolean(window.WebGLRenderingContext),
    upperParts: document.querySelector('.model-canvas')?.getAttribute('data-upper-parts'),
    resources: performance.getEntriesByType('resource').map((entry) => entry.name).filter((name) => name.includes('ClearSense') || name.includes('three')),
  }));
  throw new Error(`Model did not load: ${JSON.stringify({ diagnostics, messages, cause: error.message })}`);
}
await page.locator('.standalone-model-layout').screenshot({ path: path.resolve('qa/clearsense-model-new-assembled.png') });
const canvas = page.locator('.model-canvas canvas');
const findProductPoint = async () => {
  const box = await canvas.boundingBox();
  if (box) {
    for (const yRatio of [0.2, 0.3, 0.4, 0.5, 0.6, 0.7]) {
      for (const xRatio of [0.3, 0.4, 0.5, 0.6, 0.7]) {
        const x = box.x + box.width * xRatio;
        const y = box.y + box.height * yRatio;
        await page.mouse.move(x, y);
        if (await modelHost.evaluate((node) => node.classList.contains('is-over-product'))) {
          return { x, y };
        }
      }
    }
  }
  return null;
};
let dragPoint = await findProductPoint();
if (!dragPoint) throw new Error('Could not find the draggable upper product on the canvas');
await page.mouse.move(dragPoint.x, dragPoint.y);
await page.mouse.down();
await page.mouse.move(dragPoint.x, dragPoint.y - 150, { steps: 12 });
await page.mouse.up();
const separationAfterDrag = Number(await modelHost.getAttribute('data-separation'));
const stateAfterLift = await modelHost.getAttribute('data-product-state');
await page.mouse.move(dragPoint.x, dragPoint.y - 150);
await page.mouse.down();
await page.mouse.move(dragPoint.x + 120, dragPoint.y - 205, { steps: 12 });
await page.mouse.up();
const rotationAfterDrag = {
  yaw: Number(await modelHost.getAttribute('data-product-yaw')),
  pitch: Number(await modelHost.getAttribute('data-product-pitch')),
};
const separationBeforeShiftDrag = Number(await modelHost.getAttribute('data-separation'));
dragPoint = await findProductPoint();
if (!dragPoint) throw new Error('Could not find rotated product for Shift drag');
await page.keyboard.down('Shift');
await page.mouse.move(dragPoint.x, dragPoint.y);
await page.mouse.down();
await page.mouse.move(dragPoint.x, dragPoint.y + 420, { steps: 16 });
await page.mouse.up();
await page.keyboard.up('Shift');
const separationAfterShiftDrag = Number(await modelHost.getAttribute('data-separation'));
const minimumSafeSeparation = Number(await modelHost.getAttribute('data-minimum-safe-separation'));
if (separationAfterShiftDrag < minimumSafeSeparation) {
  throw new Error(`Shift drag crossed safety floor: ${separationAfterShiftDrag} < ${minimumSafeSeparation}`);
}

dragPoint = await findProductPoint();
if (!dragPoint) throw new Error('Could not find product for two-finger lift');
const cdp = await context.newCDPSession(page);
const touchStart = [
  { x: Math.round(dragPoint.x - 8), y: Math.round(dragPoint.y), id: 101 },
  { x: Math.round(dragPoint.x + 8), y: Math.round(dragPoint.y), id: 102 },
];
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touchStart });
for (let step = 1; step <= 4; step += 1) {
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: touchStart.map((point) => ({ ...point, y: point.y - step * 8 })),
  });
}
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
const separationAfterTwoFingerLift = Number(await modelHost.getAttribute('data-separation'));
const twoFingerGestureMode = await modelHost.getAttribute('data-gesture-mode');
if (separationAfterTwoFingerLift <= separationAfterShiftDrag) {
  throw new Error('Two-finger upward gesture did not lift the product');
}
dragPoint = await findProductPoint();
if (!dragPoint) throw new Error('Could not find product for pinch zoom');
const cameraDistanceBeforePinch = Number(await modelHost.getAttribute('data-camera-distance'));
const pinchStart = [
  { x: Math.round(dragPoint.x - 10), y: Math.round(dragPoint.y), id: 201 },
  { x: Math.round(dragPoint.x + 10), y: Math.round(dragPoint.y), id: 202 },
];
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pinchStart });
for (let step = 1; step <= 4; step += 1) {
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      { ...pinchStart[0], x: pinchStart[0].x - step * 8 },
      { ...pinchStart[1], x: pinchStart[1].x + step * 8 },
    ],
  });
}
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
const cameraDistanceAfterPinch = Number(await modelHost.getAttribute('data-camera-distance'));
if (cameraDistanceAfterPinch >= cameraDistanceBeforePinch) {
  throw new Error('Two-finger pinch-out did not zoom the camera in');
}
await page.getByRole('button', { name: '复位视角' }).click();
await modelHost.focus();
await page.keyboard.press('ArrowDown');
await page.keyboard.press('ArrowDown');
const separationAfterSafeKeyboardDown = Number(await modelHost.getAttribute('data-separation'));
const stateAfterSafeKeyboardDown = await modelHost.getAttribute('data-product-state');
const minimumAfterSafeKeyboardDown = Number(await modelHost.getAttribute('data-minimum-safe-separation'));
if (separationAfterSafeKeyboardDown < minimumAfterSafeKeyboardDown || stateAfterSafeKeyboardDown !== 'lifted') {
  throw new Error('Keyboard lowering crossed the safety floor or incorrectly docked the product');
}
await page.locator('.standalone-model-layout').screenshot({ path: path.resolve('qa/clearsense-model-new-separated.png') });
await page.getByRole('button', { name: '合回底座' }).click();
await page.waitForFunction(() => document.querySelector('.model-canvas')?.getAttribute('data-product-state') === 'docked');
const separationAfterClose = Number(await modelHost.getAttribute('data-separation'));
const rotationAfterClose = {
  yaw: Number(await modelHost.getAttribute('data-product-yaw')),
  pitch: Number(await modelHost.getAttribute('data-product-pitch')),
};
await modelHost.focus();
await page.keyboard.press('ArrowUp');
const separationAfterKeyboard = Number(await modelHost.getAttribute('data-separation'));
await page.keyboard.press('Home');
await page.waitForFunction(() => document.querySelector('.model-canvas')?.getAttribute('data-separation') === '0');
const separationAfterKeyboardHome = Number(await modelHost.getAttribute('data-separation'));
const model = await page.evaluate(() => ({
  upperParts: document.querySelector('.model-canvas')?.getAttribute('data-upper-parts'),
  baseParts: document.querySelector('.model-canvas')?.getAttribute('data-base-parts'),
  status: document.querySelector('.separation-status strong')?.textContent,
}));

await page.goto('http://127.0.0.1:56589/#/experience/clearsense-ui', { waitUntil: 'domcontentloaded' });
const uiFrame = page.frameLocator('.phone-screen iframe');
await uiFrame.locator('#app').waitFor({ state: 'visible', timeout: 30000 });
const startButton = uiFrame.getByRole('button', { name: /开始使用/ });
const embeddedWelcomeButton = await startButton.evaluate((button) => {
  const rect = button.getBoundingClientRect();
  return { top: rect.top, bottom: rect.bottom, viewport: window.innerHeight, fullyVisible: rect.top >= 0 && rect.bottom <= window.innerHeight };
});
await page.locator('.ui-experience-page').screenshot({ path: path.resolve('qa/clearsense-ui-welcome-visible.png') });
if (await startButton.count()) await startButton.click();
await page.locator('.ui-experience-page').screenshot({ path: path.resolve('qa/clearsense-ui-phone-desktop.png') });
const ui = await page.evaluate(() => ({
  phoneFrames: document.querySelectorAll('.phone-device').length,
  iframes: document.querySelectorAll('.phone-screen iframe').length,
  oldGrayFrame: document.querySelectorAll('.prototype-frame').length,
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}));

const directPage = await context.newPage();
await directPage.setViewportSize({ width: 1885, height: 977 });
await directPage.goto('http://127.0.0.1:56589/interactive/clearsense-ui/index.html?welcome=1&demo=1', { waitUntil: 'domcontentloaded' });
const directStart = directPage.getByRole('button', { name: /开始使用/ });
const directWelcomeButton = await directStart.evaluate((button) => {
  const rect = button.getBoundingClientRect();
  return { top: rect.top, bottom: rect.bottom, viewport: window.innerHeight, fullyVisible: rect.top >= 0 && rect.bottom <= window.innerHeight };
});
await directPage.screenshot({ path: path.resolve('qa/clearsense-ui-direct-welcome-visible.png') });
await directPage.close();

const responsive = {};
for (const width of [320, 375, 390, 414, 768, 1440]) {
  await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
  await page.goto('http://127.0.0.1:56589/', { waitUntil: 'domcontentloaded' });
  responsive[`home-${width}`] = await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth);
  await page.goto('http://127.0.0.1:56589/#/experience/clearsense-ui', { waitUntil: 'domcontentloaded' });
  responsive[`ui-${width}`] = await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth);
}

const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const mobilePage = await mobileContext.newPage();
await mobilePage.goto('http://127.0.0.1:56589/', { waitUntil: 'domcontentloaded' });
await mobilePage.locator('.featured-project.theme-clearsense').screenshot({ path: path.resolve('qa/clearsense-three-entries-mobile.png') });
await mobilePage.goto('http://127.0.0.1:56589/#/experience/clearsense-model', { waitUntil: 'domcontentloaded' });
await mobilePage.waitForFunction(() => document.querySelector('.model-canvas')?.getAttribute('data-upper-parts') === '4', null, { timeout: 90000 });
const mobileEnable = mobilePage.getByRole('button', { name: '点击操作3D模型' });
const mobileEnablePresent = Boolean(await mobileEnable.count());
await mobilePage.locator('.model-experience-page').screenshot({ path: path.resolve('qa/clearsense-model-new-mobile.png') });
if (mobileEnablePresent) await mobileEnable.click();
await mobilePage.goto('http://127.0.0.1:56589/#/experience/clearsense-ui', { waitUntil: 'domcontentloaded' });
await mobilePage.frameLocator('.phone-screen iframe').locator('#app').waitFor({ state: 'visible', timeout: 30000 });
await mobilePage.locator('.ui-experience-page').screenshot({ path: path.resolve('qa/clearsense-ui-phone-mobile.png') });
await mobileContext.close();

await browser.close();
process.stdout.write(JSON.stringify({
  entryLinks,
  portfolio,
  model,
  separationAfterDrag,
  stateAfterLift,
  rotationAfterDrag,
  separationBeforeShiftDrag,
  separationAfterShiftDrag,
  minimumSafeSeparation,
  separationAfterTwoFingerLift,
  twoFingerGestureMode,
  cameraDistanceBeforePinch,
  cameraDistanceAfterPinch,
  separationAfterSafeKeyboardDown,
  stateAfterSafeKeyboardDown,
  separationAfterClose,
  rotationAfterClose,
  separationAfterKeyboard,
  separationAfterKeyboardHome,
  mobileEnablePresent,
  ui,
  embeddedWelcomeButton,
  directWelcomeButton,
  responsive,
  messages,
}, null, 2));
