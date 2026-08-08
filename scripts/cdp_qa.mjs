import { writeFile } from 'node:fs/promises';

const endpoint = 'http://127.0.0.1:9222';
const url = 'http://localhost:56589/#/experience/riji';
const target = await (await fetch(`${endpoint}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let nextId = 1;

await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = nextId++;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
const screenshot = async (path) => {
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(path, Buffer.from(result.data, 'base64'));
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await wait(18000);

const desktop = await evaluate(`(() => {
  const model = document.querySelector('.riji-model-canvas');
  const terminal = document.querySelector('#riji-terminal-panel iframe');
  const rect = terminal?.getBoundingClientRect();
  return {
    title: document.title,
    body: document.body.innerText.slice(0, 1200),
    modelCanvas: !!model?.querySelector('canvas'),
    status: document.querySelector('.riji-viewer-status')?.textContent,
    terminalRect: rect && {width: Math.round(rect.width), height: Math.round(rect.height)},
    terminalButton: terminal?.contentDocument?.querySelector('[data-route="printing"]')?.textContent,
  };
})()`);
await screenshot('D:/Codex_Workspace/projects/个人作品集网站/qa-riji-experience-desktop.png');

const clicked = await evaluate(`(() => {
  const button = document.querySelector('#riji-terminal-panel iframe')?.contentDocument?.querySelector('[data-route="printing"]');
  button?.click();
  return !!button;
})()`);
await wait(3200);
const afterPrint = await evaluate(`({
  status: document.querySelector('.riji-viewer-status')?.textContent,
  terminal: document.querySelector('#riji-terminal-panel iframe')?.contentDocument?.body.innerText.slice(-220)
})`);
await screenshot('D:/Codex_Workspace/projects/个人作品集网站/qa-riji-print-desktop.png');

await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await send('Page.navigate', { url: 'http://localhost:56589/?qa=mobile#/experience/riji' });
await wait(5000);
const mobile = await evaluate(`(() => {
  const active = document.querySelector('.riji-interface-pane.is-mobile-active');
  const iframe = document.querySelector('#riji-terminal-panel iframe');
  const device = iframe?.contentDocument?.querySelector('.standalone-terminal-device');
  const frameRect = iframe?.getBoundingClientRect();
  const deviceRect = device?.getBoundingClientRect();
  const screen = iframe?.contentDocument?.querySelector('.terminal-screen');
  return {
    tabs: [...document.querySelectorAll('.riji-mobile-tabs button')].map(x => [x.textContent, x.getAttribute('aria-selected')]),
    interfaceVisible: !!active,
    frameRect: frameRect && {width: Math.round(frameRect.width), height: Math.round(frameRect.height)},
    deviceRect: deviceRect && {width: Math.round(deviceRect.width), height: Math.round(deviceRect.height)},
    screenOverflow: screen && {width: screen.scrollWidth-screen.clientWidth, height: screen.scrollHeight-screen.clientHeight},
  };
})()`);
await screenshot('D:/Codex_Workspace/projects/个人作品集网站/qa-riji-experience-mobile.png');

await evaluate(`document.querySelectorAll('.riji-mobile-tabs button')[2]?.click()`);
await wait(800);
const phone = await evaluate(`(() => {
  const iframe = document.querySelector('#riji-mobile-panel iframe');
  const device = iframe?.contentDocument?.querySelector('.standalone-mobile-device');
  const screen = iframe?.contentDocument?.querySelector('.mobile-screen');
  const rect = device?.getBoundingClientRect();
  return {
    deviceRect: rect && {width: Math.round(rect.width), height: Math.round(rect.height)},
    screenOverflow: screen && {width: screen.scrollWidth-screen.clientWidth, height: screen.scrollHeight-screen.clientHeight},
  };
})()`);
await screenshot('D:/Codex_Workspace/projects/个人作品集网站/qa-riji-phone-mobile.png');

await evaluate(`document.querySelector('#riji-mobile-panel iframe').contentWindow.location.href = '${url.replace('/#/experience/riji', '/interactive/riji-ui/mobile.html?embedded=1&screen=send-progress')}'`);
await wait(1200);
await evaluate(`document.querySelector('#riji-mobile-panel iframe')?.contentDocument?.querySelector('[data-route="send-success"]')?.click()`);
await wait(500);
const linkage = await evaluate(`({
  hint: document.querySelector('.riji-flow-hint')?.textContent,
  badge: document.querySelector('.riji-interface-tabs button b')?.textContent,
  terminalRoute: new URL(document.querySelector('#riji-terminal-panel iframe').contentWindow.location.href).searchParams.get('screen')
})`);

process.stdout.write(JSON.stringify({ desktop, clicked, afterPrint, mobile, phone, linkage }, null, 2));
socket.close();
