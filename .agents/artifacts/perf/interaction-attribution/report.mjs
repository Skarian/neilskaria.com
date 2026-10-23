import fs from 'node:fs';
const bootDir='.agents/artifacts/perf/boot-text-diagnosis',intDir='.agents/artifacts/perf/interaction-attribution';
const boot=JSON.parse(fs.readFileSync(bootDir+'/extended-summary.json'));
const interaction=JSON.parse(fs.readFileSync(intDir+'/summary.json'));
const median=v=>{v=[...v].sort((a,b)=>a-b);return v.length%2?v[(v.length-1)/2]:(v[v.length/2-1]+v[v.length/2])/2;};
const dist=v=>({median:median(v),min:Math.min(...v),max:Math.max(...v),values:v});
function compare(label,base,control,kind){
 const out={label,baseFiles:base.map(r=>r.file),controlFiles:control.map(r=>r.file),metrics:{}};
 const fields=kind==='boot'?{p95:r=>r.gaps.p95,max:r=>r.gaps.max,over34:r=>r.over34}:{p95:r=>r.windows[0].gaps.p95,max:r=>r.windows[0].gaps.max,over34:r=>r.windows[0].over34,cameraDelay:r=>r.windows[0].cameraDelay,dispatchLead:r=>r.windows[0].dispatchLead};
 for(const [key,fn]of Object.entries(fields)){const a=dist(base.map(fn)),b=dist(control.map(fn));out.metrics[key]={baseline:a,control:b,delta:b.median-a.median,percent:a.median?(b.median-a.median)/a.median*100:null};}
 if(kind==='interaction')for(const stage of ['fit','bounds','audioContext','radioSynth','noise']){const a=dist(base.map(r=>r.windows[0].stages[stage].stats.total)),b=dist(control.map(r=>r.windows[0].stages[stage].stats.total));out.metrics[stage]={baseline:a,control:b,delta:b.median-a.median,percent:a.median?(b.median-a.median)/a.median*100:null};}
 return out;
}
const pickBoot=(rate,variant,reps,light=true)=>boot.filter(r=>r.rate===rate&&r.variant===variant&&r.light===light&&!r.file.includes('trace')&&reps.some(n=>r.file.includes(variant+n+(light?'-light':'.json'))));
const pickInt=(thing,rate,variant,reps,light=false)=>interaction.filter(r=>r.thing===thing&&r.rate===rate&&r.variant===variant&&!!r.light===light&&!r.trace&&reps.includes(r.rep));
const comparisons=[
 compare('Boot: omit glyph painting, dirty full uploads retained (4x)',pickBoot(4,'A',[6,8,9]),pickBoot(4,'E',[1,2]),'boot'),
 compare('Boot: uploads suppressed (4x light)',pickBoot(4,'A',[4,5,6]),pickBoot(4,'C',[3,4]),'boot'),
 compare('Boot: uploads suppressed (1x light)',pickBoot(1,'A',[1,2,3]),pickBoot(1,'C',[1,2]),'boot'),
 compare('Boot: scene submission omitted (4x GPU diagnostic)',pickBoot(4,'A',[1,2,3],false),pickBoot(4,'D',[1,2],false),'boot')
];
for(const thing of ['lantern','clock'])for(const rate of [1,4]){
 const reps=rate===1?[2,3,4]:thing==='lantern'?[11,12,13]:[14,15,16];
 comparisons.push(compare(thing+' '+rate+'x: panel mounting deferred, light',pickInt(thing,rate,'A',reps,true),pickInt(thing,rate,'P',rate===1?[1,2]:[7,8],true),'interaction'));
}
for(const thing of ['lantern','clock']){
 comparisons.push(compare(thing+' 4x: fitting removed with panel held out',pickInt(thing,4,'P',[3,4,5]),pickInt(thing,4,'PF',[1,2]),'interaction'));
 comparisons.push(compare(thing+' 4x: outline omitted',pickInt(thing,4,'A',thing==='lantern'?[8,9,10]:[10,11,12]),pickInt(thing,4,'O',[1,2]),'interaction'));
 comparisons.push(compare(thing+' 4x: empty native panel animation vs cached bounds',pickInt(thing,4,'L',[3,4,5]),pickInt(thing,4,'I',[1,2]),'interaction'));
}
comparisons.push(compare('Radio 4x: prepared noise with panel/fitting held out',pickInt('clock',4,'PF',[3,4,5]),pickInt('clock',4,'PNF',[1,2]),'interaction'));
comparisons.push(compare('Radio 4x: prepared suspended context with panel/fitting held out',pickInt('clock',4,'PF',[6,7,8]),pickInt('clock',4,'PFR',[1,2]),'interaction'));
if(comparisons.some(r=>!r.baseFiles.length||!r.controlFiles.length))throw Error('empty comparison');
const traces={boot:JSON.parse(fs.readFileSync(bootDir+'/trace-summary.json')),interaction:JSON.parse(fs.readFileSync(intDir+'/trace-summary.json'))};
const sources=[
 ['src/lib/boot/engine.ts','function focus(thing: Thing)'],
 ['src/lib/boot/engine.ts','gsap.killTweensOf(focusBlend)'],
 ['src/lib/boot/engine.ts','function viewOf(thing: Thing)'],
 ['src/lib/boot/engine.ts',"if (s.boot >= 0 && !screenOff)"],
 ['src/lib/boot/engine.ts',"if (outline.thing && outline.opacity > 0.001)"],
 ['src/lib/boot/BootIntro.svelte','const box = panel.getBoundingClientRect()'],
 ['src/lib/radio/player.svelte.ts',"const ctx = new AudioContext({ latencyHint: 'playback' })"],
 ['src/lib/radio/radio.ts','for (let i = 0; i < data.length; i++) data[i]'],
 ['src/lib/boot/boot-screen.ts','function drawWordmark']
].map(([file,needle])=>({file,line:fs.readFileSync(file,'utf8').split('\n').findIndex(l=>l.includes(needle))+1,needle}));
const result={baseline:'1aafb1102b0ceecbd179f21afeb9b270e0c246b9',cameraCommit:'042dc805f9135f3b4efbcd0d2a9e90eafcdd80c0',executionThread:'thread:delegated-task:command%3Amcp%3A80542bac-c478-4132-82ff-eeb498252c1f%3Adelegate-task%3Acamera-conflict-fix-20261012-r1',comparisons,sources,counts:{interaction:interaction.length,extendedBoot:boot.length,initialBoot:6},traces};
fs.writeFileSync(intDir+'/cause-breakdown.json',JSON.stringify(result,null,2));
for(const r of comparisons)console.log(r.label,Object.fromEntries(Object.entries(r.metrics).map(([k,v])=>[k,{a:v.baseline.median,b:v.control.median,delta:v.delta,pct:v.percent}])));
