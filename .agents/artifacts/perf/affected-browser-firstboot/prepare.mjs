import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const out = path.resolve('.agents/artifacts/perf/affected-browser-firstboot');
const stage = path.join(out, 'source-stage');
const revision = 'a796e9aea60def6e0849cb75a151fd6570942339';
if (fs.existsSync(stage)) throw Error('Stage already exists');
execFileSync('git', ['merge-base', '--is-ancestor', '042dc805', revision]);
const allow = ['src/', 'public/', 'scripts/', 'package.json', 'package-lock.json', 'vite.config.ts', 'vercel.json', 'tsconfig.json', '.node-version', '.npmrc'];
const files = execFileSync('git', ['ls-tree', '-r', revision], { encoding: 'utf8' }).trim().split('\n').map(line => { const [meta, file] = line.split('\t'); return { mode: meta.split(' ')[0], file }; }).filter(e => allow.some(a => a.endsWith('/') ? e.file.startsWith(a) : e.file === a));
const hash = b => createHash('sha256').update(b).digest('hex');
const manifest = [];
for (const e of files) {
 if (!['100644', '100755'].includes(e.mode)) throw Error('Nonregular file');
 const dest = path.resolve(stage, e.file);
 if (!dest.startsWith(stage + path.sep)) throw Error('Path escape');
 const bytes = execFileSync('git', ['show', revision + ':' + e.file], { maxBuffer: 50 * 1024 * 1024 });
 if (e.file === '.npmrc' && bytes.toString().trim() !== 'engine-strict=true') throw Error('Unexpected npmrc');
 fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, bytes);
 manifest.push({ path: e.file, bytes: bytes.length, referenceSha256: hash(bytes), mode: e.mode });
}
fs.writeFileSync(out + '/reference-manifest.json', JSON.stringify({ revision, allow, stage, files: manifest }, null, 2));

function change(file, edits) {
 const dest = stage + '/src/lib/boot/' + file;
 let s = fs.readFileSync(dest, 'utf8');
 s = "import { diagnostic as diag } from './diagnostic';\n" + s;
 if(file.endsWith('.svelte')) s = s.replace("import { diagnostic as diag } from './diagnostic';\n", '').replace('<script lang="ts">', '<script lang="ts">\n import { diagnostic as diag } from \'./diagnostic\';');
 for (const [a,b] of edits) { if(!s.includes(a)) throw Error('Missing '+a); s=s.replace(a,b); }
 fs.writeFileSync(dest,s);
}
change('engine.ts', [
 ['\tconst { canvas, layer, background, onProgress, onMode, onFocus, onCube, onBonsai } = options;', '\tconst { canvas, layer, background, onProgress, onMode, onFocus, onCube, onBonsai } = options;\n diag?.mark("create-room");'],
 ['\trenderer.setSize(innerWidth, innerHeight, false);', '\trenderer.setSize(innerWidth, innerHeight, false);\n diag?.renderer(renderer.getContext());'],
 ['\tconst screenTexture = new THREE.CanvasTexture(screenCanvas);', '\tconst screenTexture = new THREE.CanvasTexture(screenCanvas);\n screenTexture.onUpdate = () => diag?.once("screen-texture-upload-submitted", { boot: s.boot, mode });\n diag?.mark("screen-texture-created", { width: screenCanvas.width, height: screenCanvas.height, context: "default Canvas2D" });'],
 ['\tonProgress(0.75);', '\tonProgress(0.75); diag?.mark("model-parsed");'],
 ['\tonProgress(0.9);', '\tonProgress(0.9); diag?.mark("assets-prepared");'],
 ['\tawait Promise.all(compiling);', '\tdiag?.mark("compile-wait-start"); await Promise.all(compiling); diag?.mark("compile-wait-end");'],
 ['\tawait document.fonts.ready;', '\tdiag?.mark("font-wait-start"); await document.fonts.ready; diag?.mark("fonts-ready", { status: document.fonts.status });'],
 ['\tonProgress(1);', '\tdiag?.mark("room-ready"); onProgress(1);'],
 ['\tfunction power(on: boolean) {', '\tfunction power(on: boolean) {\n diag?.mark("screen-material-power", { on, boot: s.boot, mode });'],
 ['\t\tlastRendered = time;', '\t\tlastRendered = time;\n const df = diag?.frameStart(time, s.boot, mode);'],
 ['} else drawBootScreen(screenCtx, s.boot, background);', '} else { const pt = df ? performance.now() : 0; drawBootScreen(screenCtx, s.boot, background); if(df) df.paintMs = performance.now() - pt; }'],
 ['\t\trubiks.sync();\n\t\trenderer.render(scene, camera);', '\t\trubiks.sync();\n const st = df ? performance.now() : 0;\n\t\trenderer.render(scene, camera);\n if(df) df.submitMs = performance.now() - st;'],
 ['\n\t}\n\n\tfunction resize() {', '\n diag?.frameEnd(df);\n\t}\n\n\tfunction resize() {'],
 ['\tfunction setMode(next: RoomMode) {', '\tfunction setMode(next: RoomMode) {\n diag?.mode(next);'],
 ["timeline.eventCallback('onComplete', () => setMode('site'));", "timeline.eventCallback('onComplete', () => { diag?.mark('boot-animation-complete'); setMode('site'); });"],
 ["const tl = gsap.timeline({ onComplete: () => setMode('room') });", "const tl = gsap.timeline({ onComplete: () => { diag?.mark('return-animation-complete'); setMode('room'); } });"]
]);
change('boot-screen.ts', [
 ['ctx.fillText(letter, -ctx.measureText(letter).width / 2, 0);', 'ctx.fillText(letter, -ctx.measureText(letter).width / 2, 0);\n diag?.once("glyph-painted-" + i, { glyph: letter, index: i, font: ctx.font, boot: t });'],
 ['ctx.fillText(LINE, x, y);', 'ctx.fillText(LINE, x, y);\n diag?.once("domain-painted", { font: ctx.font, boot: t });']
]);
change('BootIntro.svelte', [
 ['onProgress: (value) => (progress = value),', 'onProgress: (value) => { progress = value; diag?.mark("progress", { value }); },'],
 ['\t\t\tdata-start\n', '\t\t\tdata-start\n onintrostart={() => diag?.mark("START-animation-start")}\n onintroend={() => diag?.mark("START-animation-complete")}\n']
]);


console.log('Prepared',files.length,'committed files plus diagnostic module');
