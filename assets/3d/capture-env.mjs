// Captures the reflections the room's live objects see: `npm run capture-env`, with the dev server
// running (`npm run dev`; or pass its URL). Opens the room in a headless browser with ?capture-env,
// where the room renders them as it once did on every load (see captureEnv in engine.ts), and saves
// them as assets/3d/export/env.png; then `npm run pack-room` turns that into the WebP the site loads.
// Run it again whenever the room's look changes (a new bake, new materials).

import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const url = new URL(process.argv[2] ?? 'http://localhost:5173/lab/boot');
url.searchParams.set('capture-env', '');
const BROWSER =
	process.env.BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9600 + Math.floor(Math.random() * 300);
const browser = spawn(BROWSER, [
	'--headless=new',
	`--remote-debugging-port=${port}`,
	'--enable-gpu',
	`--user-data-dir=${mkdtempSync(join(tmpdir(), 'capture-env-'))}`,
	'about:blank'
]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
	let page;
	for (let i = 0; i < 80 && !page; i++) {
		await sleep(250);
		page = await fetch(`http://127.0.0.1:${port}/json`)
			.then((r) => r.json())
			.then((targets) => targets.find((t) => t.type === 'page'))
			.catch(() => undefined);
	}
	const ws = new WebSocket(page.webSocketDebuggerUrl);
	await new Promise((resolve) => ws.addEventListener('open', resolve));
	let id = 0;
	const pending = new Map();
	ws.addEventListener('message', (event) => {
		const message = JSON.parse(event.data);
		pending.get(message.id)?.(message);
	});
	const send = (method, params = {}) =>
		new Promise((resolve) => {
			pending.set(++id, resolve);
			ws.send(JSON.stringify({ id, method, params }));
		});
	await send('Emulation.setDeviceMetricsOverride', {
		width: 1280,
		height: 800,
		deviceScaleFactor: 1,
		mobile: false
	});
	await send('Page.navigate', { url: url.href });
	let png;
	for (let i = 0; i < 600 && !png; i++) {
		await sleep(200);
		const result = await send('Runtime.evaluate', { expression: 'window.__env', returnByValue: true });
		png = result.result?.result?.value;
	}
	if (!png) throw new Error(`No capture from ${url.href}: is the dev server running?`);
	const out = fileURLToPath(new URL('./export/env.png', import.meta.url));
	writeFileSync(out, Buffer.from(png.split(',')[1], 'base64'));
	console.log('Saved', out);
	ws.close();
} finally {
	browser.kill();
}
