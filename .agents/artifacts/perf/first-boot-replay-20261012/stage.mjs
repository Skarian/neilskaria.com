import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const evidence=path.resolve('.agents/artifacts/perf/first-boot-replay-20261012');
const stage=path.resolve('first-boot-owned.tmp');
fs.mkdirSync(stage,{recursive:true});
const variant=process.argv[2]||'original';
const revision=variant==='candidate'?'d82230acab7f4e2be780afd0847330a6926573d1':'a796e9aea60def6e0849cb75a151fd6570942339';
if(!fs.existsSync(path.join(stage,'package.json'))){
 execFileSync('git',['archive','--format=tar','--output='+path.join(stage,'owned.tar'),revision]);
 execFileSync('tar',['-xf',path.join(stage,'owned.tar'),'-C',stage]);
}
for(const file of ['src/lib/boot/engine.ts','src/lib/boot/BootIntro.svelte','src/lib/boot/boot-screen.ts']){
 const bytes=execFileSync('git',['show',revision+':'+file]);
 fs.writeFileSync(path.join(evidence,variant+'-'+path.basename(file)+'.bin'),bytes);
 fs.writeFileSync(path.join(stage,file),bytes);
}
let file=path.join(stage,'src/lib/boot/engine.ts'),s=fs.readFileSync(file,'utf8');
function rep(a,b){if(!s.includes(a))throw Error('Missing '+a);s=s.replace(a,b);}
rep('\tconst { canvas, layer, background, onProgress, onMode, onFocus, onCube, onBonsai } = options;',`\tconst { canvas, layer, background, onProgress, onMode, onFocus, onCube, onBonsai } = options;
 const perf:any={revision:${JSON.stringify(revision)},frames:[],ops:[],run:0,current:null};
 (window as any).__first=perf;
 const mark=(kind:string,extra:any={})=>{perf.ops.push({kind,t:performance.now(),run:perf.run,...extra});if((window as any).__obs?.traceEnabled)performance.mark(kind+'-'+perf.run);};
 mark('createRoom');`);
rep("\tconst screenCtx = screenCanvas.getContext('2d')!;",`\tconst screenCtx = screenCanvas.getContext('2d')!;
 const gl:any=renderer.getContext();
 let uploadSeen=false;
 for(const name of ['texImage2D','texSubImage2D']){
  const native=gl[name].bind(gl);
  gl[name]=(...args:any[])=>{
   const screen=args.includes(screenCanvas);
   if(screen){if(!uploadSeen){mark('first-screen-upload',{name,boot:s.boot,mode});uploadSeen=true;}if(perf.current)perf.current.uploads++;}
   return native(...args);
  };
 }
 let activationSeen=false;`);
rep('\tonProgress(0.75);',"\tonProgress(0.75);mark('model-parsed');");
rep('\tonProgress(0.9);',"\tonProgress(0.9);mark('assets-prepared');");
rep('\tawait Promise.all(compiling);',"\tmark('compile-wait-start');await Promise.all(compiling);mark('compile-wait-end');");
rep('\tconst sound = await sounding;',"\tmark('sound-wait-start');const sound = await sounding;mark('sound-ready');");
rep('\tawait document.fonts.ready;',"\tmark('font-wait-start',{status:document.fonts.status});await document.fonts.ready;mark('fonts-ready',{status:document.fonts.status,faces:[...document.fonts].map(f=>({family:f.family,status:f.status}))});");
if(s.includes('const bootScreen = await prepareBootScreen(screenCtx, breathe);'))rep('const bootScreen = await prepareBootScreen(screenCtx, breathe);',"mark('glyph-prep-start');const bootScreen = await prepareBootScreen(screenCtx, breathe);mark('glyph-prep-end');");
rep('\tconst WARM = 31;',"\tmark('mesh-warm-start');const WARM = 31;");
rep('\tconst raycaster = new THREE.Raycaster();',"\tmark('mesh-warm-end');const raycaster = new THREE.Raycaster();");
if(process.argv[3]==='texture-init')rep("\tmark('mesh-warm-end');const raycaster", "\tmark('mesh-warm-end');mark('texture-control-start');renderer.initTexture(screenTexture);mark('texture-control-end');const raycaster");
rep('\tonProgress(1);',"\tperf.ready=performance.now();mark('room-ready');perf.state=()=>({mode,boot:s.boot});onProgress(1);");
rep('\t\tlastRendered = time;',`\t\tlastRendered = time;
 const frame:any={t:performance.now(),raf:time,boot:s.boot,mode,run:perf.run,paint:0,submit:0,uploads:0};
 perf.current=frame;perf.frames.push(frame);`);
const draw=s.includes('else bootScreen.draw(s.boot, background);')?'else bootScreen.draw(s.boot, background);':'} else drawBootScreen(screenCtx, s.boot, background);';
rep(draw,draw.startsWith('}')?`} else {const pt=performance.now();drawBootScreen(screenCtx,s.boot,background);frame.paint=performance.now()-pt;}`:`else {const pt=performance.now();bootScreen.draw(s.boot,background);frame.paint=performance.now()-pt;}`);
rep('\t\trubiks.sync();\n\t\trenderer.render(scene, camera);',"\t\trubiks.sync();const st=performance.now();\n\t\trenderer.render(scene, camera);frame.submit=performance.now()-st;");
rep('\n\t}\n\n\tfunction resize() {',"\n frame.total=performance.now()-frame.t;perf.current=null;\n\t}\n\n\tfunction resize() {");
rep('\tfunction power(on: boolean) {',"\tfunction power(on: boolean) {mark('screen-material-activation',{on,first:on&&!activationSeen,boot:s.boot});if(on)activationSeen=true;");
rep("\t\tif (mode !== 'room') return;\n\t\tscreenOff = false;","\t\tif (mode !== 'room') return;\n perf.run++;mark('enter-site');\n\t\tscreenOff = false;");
rep('\tfunction setMode(next: RoomMode) {',"\tfunction setMode(next: RoomMode) {mark('mode',{next});");
fs.writeFileSync(file,s);
file=path.join(stage,'src/lib/boot/BootIntro.svelte');s=fs.readFileSync(file,'utf8');
if(variant==='candidate'){
 rep('\t\tlanternPrepared = true;\n\t\tawait tick();\n\t\tlanternPanel?.getBoundingClientRect();',"\t\tconst lp=performance.now();lanternPrepared = true;\n\t\tawait tick();\n\t\tlanternPanel?.getBoundingClientRect();((window as any).__panelFirst??=[]).push({kind:'lantern',t:lp,end:performance.now()});");
 rep('\t\tradioPrepared = true;\n\t\tawait tick();\n\t\tradioPanel?.getBoundingClientRect();',"\t\tconst rp=performance.now();radioPrepared = true;\n\t\tawait tick();\n\t\tradioPanel?.getBoundingClientRect();((window as any).__panelFirst??=[]).push({kind:'radio',t:rp,end:performance.now()});");
}
fs.writeFileSync(file,s);
fs.copyFileSync('.agents/artifacts/perf/boot-text-diagnosis/cdp.mjs',path.join(stage,'cdp.mjs'));
console.log('Staged',revision,stage);
