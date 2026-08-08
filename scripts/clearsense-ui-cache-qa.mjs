import { chromium } from 'playwright-core';
import path from 'node:path';

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--disable-gpu'],
});
const context = await browser.newContext({ viewport: { width: 1885, height: 977 } });
const page = await context.newPage();
const url = 'http://127.0.0.1:56589/interactive/clearsense-ui/index.html?welcome=1&demo=1&refresh=20260807-2';

await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => navigator.serviceWorker?.ready);
await page.reload({ waitUntil: 'networkidle' });
const button = page.getByRole('button', { name: '开始使用' });
const position = await button.evaluate((node) => {
  const rect = node.getBoundingClientRect();
  return { top: rect.top, bottom: rect.bottom, viewport: innerHeight, fullyVisible: rect.bottom <= innerHeight };
});
await page.screenshot({ path: path.resolve('qa/clearsense-ui-cache-busted.png') });
await button.click();
const tabs = await page.locator('[data-tab]').allTextContents();
const cacheNames = await page.evaluate(() => caches.keys());

await browser.close();
process.stdout.write(JSON.stringify({ position, tabs, cacheNames }, null, 2));
