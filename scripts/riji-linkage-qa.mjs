import { writeFile } from 'node:fs/promises';

const endpoint = process.env.CDP_ENDPOINT || 'http://127.0.0.1:9222';
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
  const waiter = pending.get(message.id);
  pending.delete(message.id);
  message.error ? waiter.reject(new Error(message.error.message)) : waiter.resolve(message.result);
});

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = nextId++;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const evaluate = async (expression) => (await send('Runtime.evaluate', {
  expression,
  returnByValue: true,
  awaitPromise: true,
})).result.value;
const screenshot = async (name) => {
  const image = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(`D:/Codex_Workspace/projects/个人作品集网站/${name}`, Buffer.from(image.data, 'base64'));
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await wait(12000);

const initial = await evaluate(`(() => {
  const terminal = document.querySelector('#riji-terminal-panel iframe')?.contentDocument;
  return {
    modelStatus: document.querySelector('.riji-viewer-status')?.textContent,
    hint: document.querySelector('.riji-flow-hint')?.textContent,
    terminal: terminal?.body.innerText,
    canPrint: !!terminal?.querySelector('[data-route="printing"]'),
  };
})()`);
await screenshot('qa-riji-linkage-initial.png');

const drawerClosed = await evaluate(`(() => {
  const button = [...document.querySelectorAll('.riji-viewer-actions button')].find((item) => item.textContent.includes('抽屉'));
  return { label: button?.textContent, pressed: button?.getAttribute('aria-pressed') };
})()`);
await evaluate(`[...document.querySelectorAll('.riji-viewer-actions button')].find((item) => item.textContent.includes('抽屉'))?.click()`);
await wait(700);
const drawerOpen = await evaluate(`(() => {
  const button = [...document.querySelectorAll('.riji-viewer-actions button')].find((item) => item.textContent.includes('抽屉'));
  return { label: button?.textContent, pressed: button?.getAttribute('aria-pressed'), status: document.querySelector('.riji-viewer-status')?.textContent };
})()`);
await screenshot('qa-riji-drawer-open.png');
await evaluate(`[...document.querySelectorAll('.riji-viewer-actions button')].find((item) => item.textContent.includes('抽屉'))?.click()`);
await wait(700);
const drawerClosedAgain = await evaluate(`(() => {
  const button = [...document.querySelectorAll('.riji-viewer-actions button')].find((item) => item.textContent.includes('抽屉'));
  return { label: button?.textContent, pressed: button?.getAttribute('aria-pressed') };
})()`);

const sent = await evaluate(`(() => {
  document.querySelector('#riji-interface-mobile-tab')?.click();
  const mobile = document.querySelector('#riji-mobile-panel iframe')?.contentDocument;
  mobile?.querySelector('[data-route="send-pick"]')?.click();
  mobile?.querySelector('[data-share-id="cake"]')?.click();
  for (const route of ['send-message', 'send-voice']) {
    mobile?.querySelector('[data-route="' + route + '"]')?.click();
  }
  mobile?.querySelector('[data-voice-included="false"]')?.click();
  const preview = mobile?.body.innerText;
  for (const route of ['send-progress', 'send-success']) mobile?.querySelector('[data-route="' + route + '"]')?.click();
  return { preview, success: mobile?.body.innerText };
})()`);
await wait(1200);
await evaluate(`document.querySelector('#riji-interface-terminal-tab')?.click()`);
await wait(600);
const received = await evaluate(`(() => {
  const terminal = document.querySelector('#riji-terminal-panel iframe')?.contentDocument;
  return {
    hint: document.querySelector('.riji-flow-hint')?.textContent,
    terminal: terminal?.body.innerText,
    canPrint: !!terminal?.querySelector('[data-route="printing"]'),
    voiceDisabled: !!terminal?.querySelector('button.voice[disabled]'),
  };
})()`);
await screenshot('qa-riji-linkage-received.png');

await evaluate(`(() => {
  const canvas = document.querySelector('.riji-model-canvas');
  for (let index = 0; index < 4; index += 1) {
    canvas?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  }
})()`);
await wait(300);
await screenshot('qa-riji-linkage-angle.png');
await evaluate(`(() => {
  const canvas = document.querySelector('.riji-model-canvas');
  for (let index = 0; index < 4; index += 1) {
    canvas?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  }
})()`);
await wait(300);
await screenshot('qa-riji-linkage-opposite-angle.png');
await evaluate(`(() => {
  const canvas = document.querySelector('.riji-model-canvas');
  for (let index = 0; index < 3; index += 1) {
    canvas?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  }
})()`);
await wait(300);
await screenshot('qa-riji-linkage-side.png');
await evaluate(`document.querySelector('.riji-viewer-actions button')?.click()`);
await wait(300);

const printed = await evaluate(`(() => {
  const terminal = document.querySelector('#riji-terminal-panel iframe')?.contentDocument;
  terminal?.querySelector('[data-route="printing"]')?.click();
  return true;
})()`);
await wait(2800);
const printComplete = await evaluate(`(() => {
  const terminal = document.querySelector('#riji-terminal-panel iframe')?.contentDocument;
  return {
    modelStatus: document.querySelector('.riji-viewer-status')?.textContent,
    terminal: terminal?.body.innerText,
    photoReady: !!terminal?.querySelector('[data-photo-taken]'),
  };
})()`);
await screenshot('qa-riji-linkage-printed.png');

const taken = await evaluate(`(() => {
  const terminal = document.querySelector('#riji-terminal-panel iframe')?.contentDocument;
  terminal?.querySelector('[data-photo-taken]')?.click();
  return true;
})()`);
await wait(500);
const afterTaken = await evaluate(`(() => {
  const terminal = document.querySelector('#riji-terminal-panel iframe')?.contentDocument;
  return {
    modelStatus: document.querySelector('.riji-viewer-status')?.textContent,
    terminal: terminal?.body.innerText,
    contentRetained: terminal?.body.innerText.includes('第一次做蛋糕'),
  };
})()`);

await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await send('Page.navigate', { url: 'http://localhost:56589/?mobile-qa=1#/experience/riji' });
await wait(5000);
const mobileLayout = await evaluate(`(() => {
  const active = document.querySelector('.riji-interface-pane.is-mobile-active');
  const frame = document.querySelector('#riji-terminal-panel iframe');
  const rect = frame?.getBoundingClientRect();
  return {
    viewport: [innerWidth, innerHeight],
    activePanel: !!active,
    tabs: [...document.querySelectorAll('.riji-mobile-tabs button')].map((button) => button.textContent),
    frame: rect && { width: Math.round(rect.width), height: Math.round(rect.height) },
    bodyOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  };
})()`);
await screenshot('qa-riji-linkage-mobile.png');

await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://localhost:56589/?audio-qa=1#/experience/riji' });
await wait(5000);
await evaluate(`(() => {
  document.querySelector('#riji-interface-mobile-tab')?.click();
  const mobile = document.querySelector('#riji-mobile-panel iframe')?.contentDocument;
  mobile?.querySelector('[data-route="send-pick"]')?.click();
  mobile?.querySelector('[data-share-id="flower"]')?.click();
  for (const route of ['send-message', 'send-voice']) mobile?.querySelector('[data-route="' + route + '"]')?.click();
  mobile?.querySelector('[data-voice-included="true"]')?.click();
  for (const route of ['send-progress', 'send-success']) mobile?.querySelector('[data-route="' + route + '"]')?.click();
})()`);
await wait(700);
await evaluate(`document.querySelector('#riji-interface-terminal-tab')?.click()`);
await wait(300);
const audioReceived = await evaluate(`(() => {
  const terminal = document.querySelector('#riji-terminal-panel iframe')?.contentDocument;
  const voice = terminal?.querySelector('button.voice');
  return {
    titleVisible: terminal?.body.innerText.includes('院子里的花'),
    voiceAvailable: !!voice?.dataset.route && !voice.disabled,
    voiceLabel: voice?.innerText,
  };
})()`);

const checks = {
  drawerOpens: drawerOpen.pressed === 'true' && drawerOpen.label === '合上抽屉',
  drawerCloses: drawerClosedAgain.pressed === 'false' && drawerClosedAgain.label === '打开抽屉',
  noVoicePreview: sent.preview.includes('本次未添加声音'),
  noVoiceDisabled: received.voiceDisabled && received.terminal.includes('没有声音'),
  noVoiceStillPrints: printComplete.photoReady,
  audioPathRetained: audioReceived.titleVisible && audioReceived.voiceAvailable,
  mobileFits: !mobileLayout.bodyOverflow,
};
const failedChecks = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
if (failedChecks.length) throw new Error(`Riji QA failed: ${failedChecks.join(', ')}`);

process.stdout.write(JSON.stringify({ initial, drawerClosed, drawerOpen, drawerClosedAgain, sent, received, printed, printComplete, taken, afterTaken, mobileLayout, audioReceived, checks }, null, 2));
socket.close();
