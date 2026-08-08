import { chromium } from 'playwright-core';
import path from 'node:path';

const baseUrl = 'http://127.0.0.1:56589';
const outputDir = path.resolve('qa');
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});

const results = {};

async function inspectRoute(name, route) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  const frameLocator = page.locator('.phone-screen iframe');
  await frameLocator.waitFor({ state: 'visible' });
  const frame = page.frames().find((candidate) => candidate !== page.mainFrame());
  if (!frame) throw new Error(`${name}: iframe 未加载`);
  await frame.waitForLoadState('domcontentloaded');

  const desktop = await page.evaluate(() => ({
    outerPhoneFrames: document.querySelectorAll('.phone-device').length,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: innerWidth,
    iframeTitle: document.querySelector('iframe')?.getAttribute('title'),
  }));
  const inner = await frame.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: innerWidth,
    visibleButtons: [...document.querySelectorAll('button, a')]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .slice(0, 30)
      .map((element) => (element.textContent || element.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ')),
    boxCandidates: [...document.querySelectorAll('div')]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          className: element.className,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          border: style.border,
          radius: style.borderRadius,
          overflow: style.overflow,
        };
      })
      .filter((box) => box.width > 180 && box.height > 400 && box.width < 370)
      .slice(0, 20),
    phoneChildren: [...(document.querySelector('.phone-device')?.children || [])].map((element) => ({
      tag: element.tagName,
      className: element.className,
    })),
    shortTextElements: [...document.querySelectorAll('button')].map((element) => ({
      text: (element.textContent || '').trim(),
      className: element.className,
      parentClassName: element.parentElement?.className,
    })).filter((item) => item.text.length < 20).slice(0, 12),
  }));
  await page.screenshot({ path: path.join(outputDir, `${name}-desktop.png`), fullPage: true });

  let interaction;
  if (name === 'renteye-ui') {
    await frame.getByRole('button', { name: '房源', exact: true }).click();
    interaction = {
      destination: await frame.locator('.screen-case.active').getAttribute('id'),
      activeScreens: await frame.locator('.screen-case.active').count(),
    };
  } else {
    const initialText = await frame.locator('body').innerText();
    await frame.getByRole('button', { name: '想安静一点', exact: true }).click();
    await page.waitForTimeout(700);
    const nextText = await frame.locator('body').innerText();
    interaction = {
      selectionAdvanced: nextText !== initialText,
      nextScreenPreview: nextText.trim().replace(/\s+/g, ' ').slice(0, 120),
    };
  }

  const oldSrc = await frameLocator.getAttribute('src');
  await page.getByRole('button', { name: '重新开始', exact: true }).click();
  await page.waitForFunction((previousSrc) => document.querySelector('.phone-screen iframe')?.getAttribute('src') !== previousSrc, oldSrc);
  const restartWorks = (await frameLocator.getAttribute('src')) !== oldSrc;

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  const mobile = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: innerWidth,
    phoneFitsViewport: document.querySelector('.phone-device')?.getBoundingClientRect().right <= innerWidth,
  }));
  await page.screenshot({ path: path.join(outputDir, `${name}-mobile.png`), fullPage: true });

  const fitChecks = [];
  if (name === 'wander-ui') {
    for (const viewport of [
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
    ]) {
      await page.setViewportSize(viewport);
      await page.reload({ waitUntil: 'networkidle' });
      const currentFrame = page.frames().find((candidate) => candidate !== page.mainFrame());
      if (!currentFrame) throw new Error('wander-ui: viewport test iframe 未加载');
      const fit = await currentFrame.evaluate(() => {
        const screen = document.querySelector('.device-screen')?.getBoundingClientRect();
        const dock = document.querySelector('.bottom-dock')?.getBoundingClientRect();
        return {
          viewportWidth: innerWidth,
          viewportHeight: innerHeight,
          scale: Number(getComputedStyle(document.documentElement).getPropertyValue('--portfolio-wander-scale')),
          screenRect: screen ? { left: screen.left, top: screen.top, right: screen.right, bottom: screen.bottom } : null,
          screenFits: Boolean(screen && screen.left >= -0.5 && screen.top >= -0.5 && screen.right <= innerWidth + 0.5 && screen.bottom <= innerHeight + 0.5),
          dockVisible: Boolean(dock && dock.top >= 0 && dock.bottom <= innerHeight + 0.5),
        };
      });
      let nextStepVisible = null;
      if (viewport.width === 1366) {
        await page.screenshot({ path: path.join(outputDir, 'wander-ui-1366x768.png'), fullPage: true });
        await currentFrame.getByRole('button', { name: '想安静一点', exact: true }).click();
        await page.waitForTimeout(700);
        nextStepVisible = (await currentFrame.locator('body').innerText()).includes('这次想怎么走');
        await page.screenshot({ path: path.join(outputDir, 'wander-ui-1366x768-next.png'), fullPage: true });
      }
      fitChecks.push({ viewport, ...fit, nextStepVisible });
    }
  }

  results[name] = { desktop, inner, interaction, restartWorks, mobile, fitChecks, errors };
  await page.close();
}

await inspectRoute('renteye-ui', '/experience/renteye-ui');
await inspectRoute('wander-ui', '/experience/wander-ui');

const home = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await home.goto(baseUrl, { waitUntil: 'networkidle' });
results.home = {
  renteyeLinks: await home.locator('[aria-label="租前眼项目浏览入口"] a').evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
  wanderLinks: await home.locator('[aria-label="出去晃晃项目浏览入口"] a').evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
};
await home.locator('.digital-section').screenshot({ path: path.join(outputDir, 'ui-project-home-entries.png') });
await home.close();

await browser.close();
console.log(JSON.stringify(results, null, 2));

const pass = results['renteye-ui'].interaction.destination === 'screen-library'
  && results['renteye-ui'].interaction.activeScreens === 1
  && results['wander-ui'].interaction.selectionAdvanced
  && results['renteye-ui'].restartWorks
  && results['wander-ui'].restartWorks
  && results['wander-ui'].fitChecks.every((check) => check.screenFits && check.dockVisible && check.scale > 0 && check.scale <= 1)
  && results['wander-ui'].fitChecks[0].nextStepVisible
  && results['renteye-ui'].errors.length === 0
  && results['wander-ui'].errors.length === 0;
if (!pass) process.exitCode = 1;
