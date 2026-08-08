const target = await (await fetch(`http://127.0.0.1:9222/json/new?${encodeURIComponent('http://localhost:56589/#/experience/riji')}`, { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let id = 0;
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  const waiter = pending.get(message.id);
  if (!waiter) return;
  pending.delete(message.id);
  message.error ? waiter.reject(new Error(message.error.message)) : waiter.resolve(message.result);
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const next = ++id;
  pending.set(next, { resolve, reject });
  socket.send(JSON.stringify({ id: next, method, params }));
});
await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://localhost:56589/#/experience/riji' });
await new Promise((resolve) => setTimeout(resolve, 12000));
const result = await send('Runtime.evaluate', { expression: `({
  status: document.querySelector('.riji-viewer-status')?.textContent,
  canvas: !!document.querySelector('.riji-model-canvas canvas'),
  fallback: !!document.querySelector('.riji-model-fallback'),
  resource: performance.getEntriesByType('resource').find(x=>x.name.includes('riji-optimized.glb'))?.transferSize
})`, returnByValue: true });
process.stdout.write(JSON.stringify(result.result.value));
socket.close();
