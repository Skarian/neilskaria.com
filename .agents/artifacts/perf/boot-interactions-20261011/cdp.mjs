// Small CDP harness for the room: headless Edge, real GPU.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
export const PROFILES = {
  desktop: { w: 1280, h: 800, dpr: 1, mobile: false },
  tablet: { w: 820, h: 1180, dpr: 2, mobile: true },
  phone: { w: 412, h: 915, dpr: 2.625, mobile: true }
};
export async function launch({ url, profile = 'desktop', dir = process.env.TEMP + '/impl/prof', storage = null }) {
  mkdirSync(dir, { recursive: true });
  const P = PROFILES[profile];
  const port = 9500 + Math.floor(Math.random() * 400);
  const edge = spawn('C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, '--use-angle=vulkan', '--enable-gpu', `--user-data-dir=${dir}/p-${Date.now()}-${port}`, 'about:blank']);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let targets;
  for (let i = 0; i < 80; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.find((t) => t.type === 'page')) break; } catch {} await sleep(250); }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map(); const errors = []; const handlers = [];
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description?.slice(0, 300) ?? m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('console: ' + m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 300));
    for (const h of handlers) h(m); });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (x) => { const r = await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'eval failed'); return r.result?.result?.value; };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: P.w, height: P.h, deviceScaleFactor: P.dpr, mobile: P.mobile });
  if (P.mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  if (storage) await send('Page.addScriptToEvaluateOnNewDocument', { source: `try { if (!sessionStorage.__seeded) { ${Object.entries(storage).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join('')} sessionStorage.__seeded = 1; } } catch {}` });
  const api = {
    P, send, ev, sleep, errors, on: (h) => handlers.push(h),
    async go(u = url) { await send('Page.navigate', { url: u }); },
    async waitFor(expr, ms = 120000) { const end = Date.now() + ms; while (Date.now() < end) { try { if (await ev(expr)) return true; } catch {} await sleep(200); } return false; },
    async shot(file, clip) { const r = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) }); writeFileSync(file, Buffer.from(r.result.data, 'base64')); },
    async mouse(x, y, type = 'mouseMoved') { await send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: type === 'mouseMoved' ? 0 : 1 }); },
    async click(x, y) { await api.mouse(x, y); await api.mouse(x, y, 'mousePressed'); await api.mouse(x, y, 'mouseReleased'); },
    close() { try { ws.close(); } catch {} edge.kill(); }
  };
  return api;
}
// Screen position of a world-space point, from the dev hook.
export const project = (expr) => `(() => { const { camera, THREE } = window.__boot; const p = (${expr}).clone().project(camera); return { x: Math.round((p.x + 1) / 2 * innerWidth), y: Math.round((1 - p.y) / 2 * innerHeight) }; })()`;
