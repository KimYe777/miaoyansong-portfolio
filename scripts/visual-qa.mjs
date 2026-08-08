import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.PORTFOLIO_BASE_URL ?? 'http://127.0.0.1:56589';
const outputDir = path.resolve('qa');
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--disable-gpu'],
});

const results = [];
const quick = process.argv.includes('--quick');

async function inspect(name, route, viewport, options = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: options.reducedMotion ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  const messages = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') messages.push(`${message.type()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));

  const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(650);
  if (!options.reducedMotion) {
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < pageHeight; y += Math.max(320, Math.floor(viewport.height * 0.72))) {
      await page.evaluate((nextY) => window.scrollTo(0, nextY), y);
      await page.waitForTimeout(55);
    }
    await page.waitForTimeout(620);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(120);
  }
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: true });

  const metrics = await page.evaluate(() => ({
    title: document.title,
    bodyText: document.body.innerText.slice(0, 300),
    rootHTMLLength: document.querySelector('#root')?.innerHTML.length ?? 0,
    width: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    headings: Array.from(document.querySelectorAll('h1, h2')).map((node) => node.textContent?.trim()).filter(Boolean).slice(0, 8),
    projectLinks: document.querySelectorAll('a[href^="/work/"]').length,
    portfolioPages: document.querySelectorAll('.portfolio-page').length,
    hiddenReveals: Array.from(document.querySelectorAll('.reveal')).filter((node) => getComputedStyle(node).opacity === '0').length,
    aboutAccentLines: (() => {
      const node = document.querySelector('.about-hero-accent');
      if (!node) return null;
      const lineHeight = Number.parseFloat(getComputedStyle(node).lineHeight);
      return Math.round(node.getBoundingClientRect().height / lineHeight);
    })(),
    contactLinks: Array.from(document.querySelectorAll('.about-contact-links a')).map((node) => node.getAttribute('href')),
    primaryNavigation: Array.from(document.querySelectorAll('#site-navigation a')).map((node) => node.textContent?.trim()),
    hasSiteFooter: Boolean(document.querySelector('.site-footer')),
  }));

  let mobileMenu = null;
  if (viewport.width < 681 && route === '/') {
    const menuButton = page.getByRole('button', { name: '菜单' });
    if (await menuButton.count()) {
      await menuButton.click();
      mobileMenu = await page.locator('#site-navigation').evaluate((node) => node.classList.contains('is-open'));
    }
  }

  results.push({ name, status: response?.status(), messages, metrics, mobileMenu });
  await context.close();
}

await inspect('home-desktop', '/', { width: 1440, height: 1200 });
await inspect('home-mobile', '/', { width: 390, height: 844 });
await inspect('about-desktop', '/#/about', { width: 1440, height: 1200 });
await inspect('about-mobile', '/#/about', { width: 390, height: 844 });
if (!quick) {
  await inspect('clearsense-desktop', '/work/clearsense', { width: 1440, height: 1200 });
  await inspect('nightcare-desktop', '/work/nightcare', { width: 1440, height: 1200 });
  await inspect('renteye-mobile', '/work/renteye', { width: 390, height: 844 });
  await inspect('wander-desktop', '/work/wander', { width: 1440, height: 1200 });
  await inspect('home-reduced-motion', '/', { width: 1280, height: 900 }, { reducedMotion: true });
  await inspect('not-found', '/not-a-real-page', { width: 1280, height: 900 });
}

await browser.close();
process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
