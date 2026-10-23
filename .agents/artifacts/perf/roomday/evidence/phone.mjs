// Baseline: what the room costs to start and to run, against the production build.
// node baseline.mjs <url> <outDir> <profile: desktop|phone> <run#>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
setTimeout(() => { console.log('TIMEOUT'); process.exit(1); }, 300000);
const [url, outDir, profile = 'desktop', run = '1'] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const tag = `${profile}-${run}`;
const PROFILES = {
	desktop: { w: 1280, h: 800, mobile: false, cpu: 1, net: null },
	// A mid-range Android phone on 4G: Lighthouse-style slow 4G and a 4x slower CPU.
	phone: { w: 412, h: 915, mobile: true, cpu: 4, net: { latency: 150, down: 1.6e6 / 8, up: 0.75e6 / 8 } }
};
const P = PROFILES[profile];
const port = 4298;
const edge = spawn('C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, '--use-angle=vulkan', '--disable-extensions', '--enable-gpu', '--mute-audio', '--autoplay-policy=no-user-gesture-required', `--user-data-dir=${outDir}/profile-${tag}-${Date.now()}`, 'about:blank']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 80; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.find((t) => t.type === 'page')) break; } catch {} await sleep(250); }
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const events = []; const requests = new Map(); const traceChunks = [];
let traceDone;
ws.addEventListener('message', (e) => {
	const m = JSON.parse(e.data);
	if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
	if (m.method === 'Tracing.dataCollected') traceChunks.push(...m.params.value);
	if (m.method === 'Tracing.tracingComplete') traceDone?.();
	if (m.method === 'Network.requestWillBeSent') requests.set(m.params.requestId, { url: m.params.request.url, start: m.params.timestamp, type: m.params.type });
	if (m.method === 'Network.responseReceived') { const r = requests.get(m.params.requestId); if (r) { r.mime = m.params.response.mimeType; r.status = m.params.response.status; r.encoding = m.params.response.headers['content-encoding'] || m.params.response.headers['Content-Encoding'] || ''; } }
	if (m.method === 'Network.loadingFinished') { const r = requests.get(m.params.requestId); if (r) { r.bytes = m.params.encodedDataLength; r.end = m.params.timestamp; } }
	if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error'&&/WebGL|packed_depth|THREE/.test(m.params.args.map(a=>a.value??a.description).join(' ')))events.push('GL ERROR '+m.params.args.map(a=>a.value??a.description).join(' '));
	if (m.method === 'Runtime.exceptionThrown') events.push('EXC ' + m.params.exceptionDetails.exception?.description?.slice(0, 200));
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result?.result?.value;
const metrics = async () => Object.fromEntries((await send('Performance.getMetrics')).result.metrics.map((m) => [m.name, m.value]));

await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Performance.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: P.w, height: P.h, deviceScaleFactor: P.mobile ? 2.625 : 1, mobile: P.mobile });
if (P.cpu > 1) await send('Emulation.setCPUThrottlingRate', { rate: P.cpu });
if (P.net) await send('Network.emulateNetworkConditions', { offline: false, latency: P.net.latency, downloadThroughput: P.net.down, uploadThroughput: P.net.up });
// A first visit: nothing remembered.
await send('Storage.clearDataForOrigin', { origin: new URL(url).origin, storageTypes: 'all' });

await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{function ready(){if(document.querySelector('[data-start]')){performance.mark('room-ready');return}requestAnimationFrame(ready)}requestAnimationFrame(ready);window.__diagLCP=[];new PerformanceObserver(list=>{for(const e of list.getEntries())window.__diagLCP.push({time:e.startTime,label:e.element?.textContent,tag:e.element?.tagName});}).observe({type:'largest-contentful-paint',buffered:true});function frame(){const c=document.querySelector('canvas'),l=document.querySelector('.room-layer');if(c&&l&&getComputedStyle(l).display!=='none'&&Number(getComputedStyle(c).opacity)>0.01){window.__diagFirstRoom=performance.now();return;}requestAnimationFrame(frame);}requestAnimationFrame(frame);})()`});
// Startup, traced, with a JavaScript CPU profile alongside.
await send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'v8.execute', 'blink', 'gpu', 'disabled-by-default-v8.cpu_profiler', 'loading', 'toplevel'] } });
await send('Profiler.enable'); await send('Profiler.setSamplingInterval', { interval: 200 }); await send('Profiler.start');
const t0 = Date.now();
await send('Page.navigate', { url });
const marks = {};
let loadingSeen = false;
for (let i = 0; i < 1200; i++) {
	const s = await ev(`(() => ({ loading: !!document.querySelector('.loading'), progress: document.querySelector('.loading')?.textContent ?? null, start: !!document.querySelector('[data-start]'), fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null, lcp: null, visible: !!document.querySelector('canvas') && getComputedStyle(document.querySelector('canvas')).opacity === '1' && (!document.querySelector('.loading') || getComputedStyle(document.querySelector('.loading')).display==='none'), shellFrame: performance.getEntriesByName('diag-shell-frame')[0]?.startTime, completeFrame: performance.getEntriesByName('diag-complete-drawn')[0]?.startTime }))()`);
	if (s) {
		if (s.loading && !loadingSeen) { loadingSeen = true; marks.loadingScreen = Date.now() - t0; }
		if (s.fcp && !marks.fcp) marks.fcp = Math.round(s.fcp);
		if(s.visible && !marks.firstRoomVisible) marks.firstRoomVisible=Date.now()-t0;
        if(s.shellFrame) marks.shellFrame=s.shellFrame;
        if(s.completeFrame) marks.completeFrame=s.completeFrame;
        if (s.start) { marks.roomInteractive = Date.now() - t0; break; }
	}
	await sleep(50);
}
await sleep(1500);
marks.firstRoomFrame=await ev('window.__diagFirstRoom');
const profile1 = (await send('Profiler.stop')).result.profile;
const traceComplete = new Promise((r) => (traceDone = r));
await send('Tracing.end'); await traceComplete;
writeFileSync(`${outDir}/trace-${tag}.json`, JSON.stringify({ traceEvents: traceChunks }));
writeFileSync(`${outDir}/cpuprofile-${tag}.cpuprofile`, JSON.stringify(profile1));
const nav = await ev(`JSON.stringify(performance.getEntriesByType('navigation')[0])`);

if(!marks.roomInteractive||events.length)throw Error('invalid room '+JSON.stringify({marks,events}));
const roomReady=await ev("performance.getEntriesByName('room-ready')[0]?.startTime");
const rendered=await ev("({start:!!document.querySelector('[data-start]'),canvas:!!document.querySelector('canvas')})");
const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(outDir+'/ready-'+tag+'.png',Buffer.from(shot.result.data,'base64'));
const running={};
const diag=await ev('performance.getEntriesByType("mark").map(m=>({name:m.name,time:m.startTime}))');
const reqs = [...requests.values()].filter((r) => r.bytes !== undefined).map((r) => ({ url: r.url.replace(url.replace(/\/lab\/boot$/, ''), '').slice(0, 110), type: r.type, mime: r.mime, bytes: r.bytes, encoding: r.encoding, ms: Math.round((r.end - r.start) * 1000), startMs: Math.round((r.start - [...requests.values()][0].start) * 1000) }));
const total = reqs.reduce((n, r) => n + r.bytes, 0);
const result = { tag, marks, roomReady, rendered, nav: JSON.parse(nav), totalBytes: total, requestCount: reqs.length, requests: reqs.sort((a, b) => b.bytes - a.bytes), running, diag, lcp:await ev('window.__diagLCP'), errors: events };
writeFileSync(`${outDir}/baseline-${tag}.json`, JSON.stringify(result, null, 1));
console.log(JSON.stringify({ tag, marks, totalKB: Math.round(total / 1024), requests: reqs.length, running }, null, 0));
ws.close(); edge.kill(); process.exit(0);

