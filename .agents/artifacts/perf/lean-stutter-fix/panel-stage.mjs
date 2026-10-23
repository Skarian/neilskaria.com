import fs from 'node:fs';
const root='lean-stutter-work.tmp',variant=process.argv[2];
fs.copyFileSync(root+(variant==='baseline'?'/before-fitting.ts':'/panel-candidate-engine.bin'),'src/lib/boot/engine.ts');
fs.copyFileSync(root+(variant==='baseline'?'/before-panel.svelte':'/panel-candidate-Intro.bin'),'src/lib/boot/BootIntro.svelte');
let p='src/lib/boot/engine.ts',s=fs.readFileSync(p,'utf8');
function rep(a,b){if(!s.includes(a))throw Error('missing '+a);s=s.replace(a,b);}
rep("\tconst screenCtx = screenCanvas.getContext('2d')!;",`\tconst screenCtx = screenCanvas.getContext('2d')!;
 const perf:any={variant:${JSON.stringify(variant)},frames:[],ops:[]};(window as any).__lean=perf;`);
rep('lastRendered = time;',`lastRendered = time;
 const perfFrame:any={t:performance.now(),boot:s.boot,mode,focused,blend:focusBlend.value};perf.frames.push(perfFrame);`);
rep('\n\t}\n\n\tfunction resize() {',`\n perfFrame.total=performance.now()-perfFrame.t;\n\t}\n\n\tfunction resize() {`);
rep('\tfunction viewOf(thing: Thing) {',`function viewOf(thing:Thing){const t=performance.now();const result=computeViewOf(thing);perf.ops.push({kind:'fit',thing,t,ms:performance.now()-t,above:freeAbove,left:freeLeft,eye:result.eye.toArray(),target:result.target.toArray()});return result;}
\tfunction computeViewOf(thing: Thing) {`);
rep('\tfunction focus(thing: Thing) {','\tfunction focus(thing: Thing) {\n const selectionStart=performance.now();');
rep('\t\tonFocus(thing);','\t\tonFocus(thing);\n perf.ops.push({kind:"focus",thing,t:selectionStart,ms:performance.now()-selectionStart});');
rep('\tonProgress(1);',`perf.ready=performance.now();
 perf.state=()=>({mode,focused,blend:focusBlend.value});
 perf.project=(thing:Thing)=>{const o=pickers.find(o=>o.userData.thing===thing)!;const p=new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()).project(camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};};
 perf.fit=()=>({above:freeAbove,left:freeLeft,aspect:camera.aspect,eye:focusView.eye.toArray(),target:focusView.target.toArray()});
 perf.returnToRoom=returnToRoom;
 perf.unfocus=unfocus;
 perf.focus=focus;
\tonProgress(1);`);
fs.writeFileSync(p,s);
p='src/lib/boot/BootIntro.svelte';s=fs.readFileSync(p,'utf8');
rep('\t\t\tconst box = panel.getBoundingClientRect();',`const start=performance.now();
\t\t\tconst box = panel.getBoundingClientRect();
 (window as any).__lean?.ops.push({kind:'bounds',thing:focused,t:start,ms:performance.now()-start,rect:{top:box.top,left:box.left,width:box.width,height:box.height}});`);
if(variant==='candidate'){
 rep('  lanternPrepared = true;\n  await tick();\n  lanternPanel?.getBoundingClientRect();',`  const lp=performance.now();
  lanternPrepared = true;\n  await tick();\n  lanternPanel?.getBoundingClientRect();
 ((window as any).__panelPerf??=[]).push({thing:'lantern',t:lp,ms:performance.now()-lp});`);
 rep('  radioPrepared = true;\n  await tick();\n  radioPanel?.getBoundingClientRect();',`  const rp=performance.now();
  radioPrepared = true;\n  await tick();\n  radioPanel?.getBoundingClientRect();
 ((window as any).__panelPerf??=[]).push({thing:'clock',t:rp,ms:performance.now()-rp});`);
}
fs.writeFileSync(p,s);console.log('Staged',variant);
