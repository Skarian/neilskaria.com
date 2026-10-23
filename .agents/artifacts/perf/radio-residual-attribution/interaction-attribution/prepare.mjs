import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const dir='radio-residual-work.tmp/interaction-attribution';
const files=['src/lib/boot/engine.ts','src/lib/boot/BootIntro.svelte','src/lib/radio/player.svelte.ts','src/lib/radio/radio.ts'];
for(const [i,p] of files.entries())fs.copyFileSync(p,dir+'/original-'+i+'.txt');
execFileSync(process.execPath,['radio-residual-work.tmp/boot-text-diagnosis/prepare.mjs']);
let s=fs.readFileSync(files[0],'utf8');
function rep(a,b){if(!s.includes(a))throw Error('missing '+a);s=s.replace(a,b);}
rep(" const diagnostic: any =", " const diagnosticLight = new URLSearchParams(location.search).has('light');\n const attribution: any = {variant:new URLSearchParams(location.search).get('interaction-control')||'A',light:diagnosticLight,frames:[],ops:[],ready:false,bounds:{},viewCache:new Map()};\n (window as any).__attrib = attribution;\n const diagnostic: any =");
rep(" screenCtx.measureText = (text: string) => {", " if (!diagnosticLight) screenCtx.measureText = (text: string) => {");
rep(" for (const name of ['texImage2D', 'texSubImage2D']) {", " if (!diagnosticLight) for (const name of ['texImage2D', 'texSubImage2D']) {");
rep(" const diagnosticGL: any = renderer.getContext();", ` const diagnosticGL: any = renderer.getContext();
 const timerExtension = diagnosticGL.getExtension('EXT_disjoint_timer_query_webgl2');
 const timerPending: any[] = [];
 diagnostic.gpu = {supported:!!timerExtension,valid:0,disjoint:0,pending:0};
 function pollTimers() {
  if(!timerExtension)return;
  const disjoint=diagnosticGL.getParameter(timerExtension.GPU_DISJOINT_EXT);
  for(let i=timerPending.length-1;i>=0;i--){
   const p=timerPending[i];
   if(!diagnosticGL.getQueryParameter(p.query,diagnosticGL.QUERY_RESULT_AVAILABLE))continue;
   if(disjoint){diagnostic.gpu.disjoint++;p.frame.gpuDisjoint=true;}
   else{p.frame.gpuMs=diagnosticGL.getQueryParameter(p.query,diagnosticGL.QUERY_RESULT)/1e6;diagnostic.gpu.valid++;}
   diagnosticGL.deleteQuery(p.query);timerPending.splice(i,1);
  }
  diagnostic.gpu.pending=timerPending.length;
 }
 if(!diagnosticLight)for(const name of ['getProgramInfoLog','getProgramParameter','getUniformLocation','linkProgram']){
  const method=diagnosticGL[name].bind(diagnosticGL);
  diagnosticGL[name]=(...args:any[])=>{
   const start=performance.now();const result=method(...args);const ms=performance.now()-start;
   if(attribution.ready&&(ms>.5||name==='linkProgram'))attribution.ops.push({kind:'shader',name,t:start,ms,focused});
   return result;
  };
 }`);
rep(" diagnostic.frames.push(diagnosticFrame);", ` diagnostic.frames.push(diagnosticFrame);
 attribution.frames.push(diagnosticFrame);
 diagnosticFrame.focused=focused;diagnosticFrame.blend=focusBlend.value;
 pollTimers();`);
rep("\t\tconst diagnosticSubmissionStart = performance.now();\n\t\trenderer.render(scene, camera);", `\t\tconst diagnosticSubmissionStart = performance.now();
 let gpuQuery:any=null;
 if(!diagnosticLight&&timerExtension&&mode==='booting'&&s.boot>=.35&&s.boot<=3.5&&diagnostic.frames.length%4===0){
  gpuQuery=diagnosticGL.createQuery();diagnosticGL.beginQuery(timerExtension.TIME_ELAPSED_EXT,gpuQuery);
 }
 if(diagnosticVariant==='D'&&mode==='booting'&&s.boot>=.35&&s.boot<=3.5)renderer.initTexture(screenTexture);
 else renderer.render(scene, camera);
 diagnosticFrame.mainRenderMs=performance.now()-diagnosticSubmissionStart;
 const diagnosticOutlineStart=performance.now();`);
rep("\t\tif (outline.thing && outline.opacity > 0.001) {", "\t\tif (attribution.variant !== 'O' && outline.thing && outline.opacity > 0.001) {");
rep(" diagnosticFrame.submissionMs =", ` diagnosticFrame.outlineMs=performance.now()-diagnosticOutlineStart;
 if(gpuQuery){diagnosticGL.endQuery(timerExtension.TIME_ELAPSED_EXT);timerPending.push({query:gpuQuery,frame:diagnosticFrame});}
 diagnosticFrame.submissionMs =`);
rep("\tfunction viewOf(thing: Thing) {", ` function viewOf(thing: Thing) {
  const start=performance.now();
  const key=JSON.stringify([thing,freeAbove,freeLeft]);
  const cached=attribution.variant==='F'&&attribution.viewCache.get(key);
  const result=cached?{eye:cached.eye.clone(),target:cached.target.clone()}:computeViewOf(thing);
  if(attribution.ready)attribution.ops.push({kind:'fit',thing,t:start,ms:performance.now()-start,cached:!!cached,freeAbove,freeLeft});
  return result;
 }
\tfunction computeViewOf(thing: Thing) {`);
rep("\tfunction setFree(side: 'above' | 'left', fraction: number) {", "\tfunction setFree(side: 'above' | 'left', fraction: number) {\n attribution.ops.push({kind:'setFree',side,fraction,t:performance.now(),focused});");
rep("\tfunction focus(thing: Thing) {", "\tfunction focus(thing: Thing) {\n const selectionStart=performance.now();");
rep("\t\tonFocus(thing);", "\t\tonFocus(thing);\n attribution.ops.push({kind:'focus',thing,t:selectionStart,ms:performance.now()-selectionStart,blend:focusBlend.value});");
rep("\tsetMode(mode);\n\temitCube();", ` attribution.ready=true;
 attribution.state=()=>({mode,focused,blend:focusBlend.value});
 attribution.project=(thing:Thing)=>{const o=pickers.find(o=>o.userData.thing===thing)!;const p=new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()).project(camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};};
 attribution.prewarmViews=(thing:Thing,fractions:any[])=>{
  const saved=[freeAbove,freeLeft];const start=performance.now();
  for(const [above,left]of [[freeAbove,freeLeft],...fractions]){freeAbove=above;freeLeft=left;attribution.viewCache.set(JSON.stringify([thing,above,left]),computeViewOf(thing));}
  [freeAbove,freeLeft]=saved;
  attribution.ops.push({kind:'prewarmFit',thing,t:start,ms:performance.now()-start});
 };
 diagnostic.pollTimers=pollTimers;
\tsetMode(mode);\n\temitCube();`);
fs.writeFileSync(files[0],s);
s=fs.readFileSync(files[1],'utf8');
rep("\t\t\tconst box = panel.getBoundingClientRect();", ` const attribution=(window as any).__attrib;
 const start=performance.now();
 const saved=attribution?.variant==='L'&&attribution.bounds[focused!];
 const box=saved||panel.getBoundingClientRect();
 attribution?.ops.push({kind:'bounds',thing:focused,t:start,ms:performance.now()-start,cached:!!saved,rect:{top:box.top,left:box.left,width:box.width,height:box.height}});
`);
fs.writeFileSync(files[1],s);
s=fs.readFileSync(files[2],'utf8');
rep("\t\tconst ctx = new AudioContext({ latencyHint: 'playback' });\n\t\tlocal = { ctx, synth: createRadio(ctx, ctx.destination) };", ` const start=performance.now();
 const ctx = new AudioContext({ latencyHint: 'playback' });
 (window as any).__attrib?.ops.push({kind:'audioContext',t:start,ms:performance.now()-start,sampleRate:ctx.sampleRate});
 const synthStart=performance.now();
 local = { ctx, synth: createRadio(ctx, ctx.destination) };
 (window as any).__attrib?.ops.push({kind:'radioSynth',t:synthStart,ms:performance.now()-synthStart});
`);
fs.writeFileSync(files[2],s);
s=fs.readFileSync(files[3],'utf8');
rep("\tfor (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;", ` const noiseStart=performance.now();
 const saved=(window as any).__attrib?.variant==='N'&&(window as any).__noiseData?.[ctx.sampleRate];
 if(saved)data.set(saved);
 else for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
 (window as any).__attrib?.ops.push({kind:'noise',t:noiseStart,ms:performance.now()-noiseStart,cached:!!saved,length:data.length});
`);
fs.writeFileSync(files[3],s);
fs.copyFileSync('radio-residual-work.tmp/boot-text-diagnosis/cdp.mjs',dir+'/cdp.mjs');
