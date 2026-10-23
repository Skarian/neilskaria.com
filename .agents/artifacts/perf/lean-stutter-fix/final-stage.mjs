import fs from 'node:fs';import{execFileSync}from 'node:child_process';
const root='lean-stutter-work.tmp',p=root+'/panel-candidate-Intro.bin';let s=fs.readFileSync(p,'utf8');
s=s.replace(' .panel[data-panel-hidden] .presets button { animation: none; }\n .panel[data-panel-hidden] :global(*),\n .panel[data-panel-hidden] :global(*::after) { animation-play-state: paused; }',` .panel[data-panel-hidden] .presets button,
 .panel[data-panel-hidden] .swatches button::after,
 .panel[data-panel-hidden] .station .status,
 .panel[data-panel-hidden] .freq.on { animation: none; }`);
fs.writeFileSync(p,s);
execFileSync(process.execPath,['lean-stutter-panel-stage.tmp.mjs','candidate'],{stdio:'inherit'});
let e='src/lib/boot/engine.ts';s=fs.readFileSync(e,'utf8');
s=s.replace('BOOT_DURATION, prepareBootScreen','BOOT_DURATION, drawBootScreen, prepareBootScreen');
s=s.replace('const bootScreen = await prepareBootScreen(screenCtx, breathe);',`const preparedBoot = await prepareBootScreen(screenCtx,breathe);
 const bootScreen={draw:(t:number,c:string)=>new URLSearchParams(location.search).get('lean')==='baseline'?drawBootScreen(screenCtx,t,c):preparedBoot.draw(t,c),dispose:preparedBoot.dispose};`);
s=s.replace('perf.returnToRoom=returnToRoom;',`perf.snapshot=(t:number)=>{timeline?.pause().seek(2.8+t,true);power(true);render(performance.now());return screenCanvas.toDataURL();};
 perf.returnToRoom=returnToRoom;`);
fs.writeFileSync(e,s);
e='src/lib/boot/BootIntro.svelte';s=fs.readFileSync(e,'utf8');s=s.replace('async function preparePanels() {',"async function preparePanels() {\n if(new URLSearchParams(location.search).has('late-panels'))return;");fs.writeFileSync(e,s);
console.log('Staged final behavior/appearance hooks.');
