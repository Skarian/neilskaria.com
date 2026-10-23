import fs from 'node:fs';import {gunzipSync} from 'node:zlib';import {out,write,hash} from './setup.mjs';
const order=['p1-before','p1-control','p2-control','p2-before'];
const stat=a=>{a=a.filter(Number.isFinite).sort((a,b)=>a-b);const q=p=>a[Math.max(0,Math.ceil(a.length*p)-1)]??null;return {n:a.length,mean:a.length?a.reduce((s,x)=>s+x,0)/a.length:null,p50:q(.5),p95:q(.95),max:a.at(-1)??null,ge25:a.filter(x=>x>=25).length,ge42:a.filter(x=>x>=42).length,ge100:a.filter(x=>x>=100).length}};
const gaps=t=>stat(t.slice(1).map((x,i)=>x-t[i]));
const result=[];
for(const name of order){
const dir=out+'/runs/'+name;if(!fs.existsSync(dir+'/result.json'))continue;const d=JSON.parse(fs.readFileSync(dir+'/result.json'));const r={name,variant:d.variant,valid:d.valid,failure:d.failure,version:d.version,environment:d.environment,system:d.system,flow:d.flow,errors:d.errors,cleanup:d.cleanup,serverCleanup:d.serverCleanup,smoke:d.smoke,states:d.states,actions:[]};result.push(r);if(!d.valid)continue;
r.startup={responseEnd:d.navigation[0].responseEnd,startDOM:d.flow.phases.find(p=>p.name==='external-start-DOM')?.t,introCompleted:d.flow.animations.filter(a=>a.start).map(a=>({label:a.label,t:a.t,finished:a.finished,cancelled:a.cancelled,timing:a.timing})),site:d.flow.phases.filter(p=>p.name==='external-site'),trustedStarts:d.flow.inputs.filter(i=>i.type==='click'&&i.text==='START')};
r.capture={observerDropped:!!d.observer.dropped,commandsFailed:JSON.parse(fs.readFileSync(dir+'/measured-commands.json')).filter(c=>!c.ok)};
for(const label of ['open-first','Candle','close','open-second']){
const td=dir+'/'+label,e=JSON.parse(gunzipSync(fs.readFileSync(td+'/trace.json.gz'))).traceEvents,completion=JSON.parse(fs.readFileSync(td+'/trace-completion.json'));
const input=d.observer.inputs.map((x,i)=>({...x,index:i+1})).filter(x=>x.label===label&&x.trusted),click=input.find(x=>x.type==='click'),first=input[0];if(!click||input.some(x=>x.pointerType!=='touch'))throw Error('trusted touch missing '+name+' '+label);
const aligns=input.map(x=>({input:x,mark:e.find(y=>y.name==='input-'+x.index)}));if(aligns.some(a=>!a.mark))throw Error('missing mark');const offsets=aligns.map(x=>x.mark.ts/1000-x.input.t),offset=offsets[0],residual=Math.max(...offsets.map(x=>Math.abs(x-offset)));if(residual>=.5)throw Error('clock residual '+residual);
const thread=aligns[0].mark,pid=thread.pid,tid=thread.tid;
const page=x=>x.ts/1000-offset;
const overlap=(x,a,b)=>Math.max(0,Math.min(page(x)+(x.dur||0)/1000,b)-Math.max(page(x),a));
const span=(x,a,b)=>({name:x.name,t:page(x),dur:x.dur/1000,clipped:overlap(x,a,b),tdur:x.tdur/1000,pid:x.pid,tid:x.tid,args:x.args});
function window(a,b){
const native=e.filter(x=>x.ph==='X'&&x.pid===pid&&x.tid===tid&&overlap(x,a,b)>0),tasks=native.filter(x=>x.name==='RunTask'),layout=native.filter(x=>x.name==='Layout'),update=native.filter(x=>x.name==='UpdateLayoutTree');let lower=0,upper=0,wall=0;
for(const x of tasks){wall+=overlap(x,a,b);if(page(x)>=a&&page(x)+x.dur/1000<=b){lower+=(x.tdur||0)/1000;upper+=(Number.isFinite(x.tdur)?x.tdur:x.dur)/1000}else upper+=overlap(x,a,b)}
const raf=d.observer.raf.filter(t=>t>=a&&t<=b),present=e.filter(x=>x.name==='AnimationFrame::Presentation'&&x.pid===pid&&x.tid===tid&&page(x)>=a&&page(x)<=b).map(page).sort((a,b)=>a-b),unique=present.filter((x,i)=>!i||x-present[i-1]>1);
const observerCallbacks=native.filter(x=>x.name==='FunctionCall'&&x.args?.data?.functionName==='frame'&&x.args?.data?.url===''&&x.args?.data?.lineNumber===11).toSorted((x,y)=>x.ts-y.ts);const actualRaf=observerCallbacks.map(page).filter(t=>t>=a&&t<=b); const largest=tasks.toSorted((x,y)=>overlap(y,a,b)-overlap(x,a,b)).slice(0,5);
const program=e.filter(x=>x.ph==='X'&&/GetProgramiv/.test(x.name)&&overlap(x,a,b)>0);
const measures=d.observer.measurements.filter(x=>x.t>=a&&x.t<=b);
return {from:a,to:b,renderer:{pid,tid},taskN:tasks.length,mainWall:wall,threadCpuLower:lower,threadCpuUpper:upper,worstTask:Math.max(0,...tasks.map(x=>overlap(x,a,b))),raf:gaps(raf),actualRafCallback:gaps(actualRaf),actualRafGapsOver25:actualRaf.slice(1).map((t,i)=>({from:actualRaf[i],to:t,gap:t-actualRaf[i]})).filter(x=>x.gap>=25),observerNativeCallbackWall:stat(observerCallbacks.map(x=>overlap(x,a,b))),observerNativeCallbacksOver1:observerCallbacks.filter(x=>overlap(x,a,b)>1).map(x=>span(x,a,b)),headlessPresentation:gaps(unique),presentationTimestampN:unique.length,layout:layout.reduce((s,x)=>s+overlap(x,a,b),0),updateLayoutTree:update.reduce((s,x)=>s+overlap(x,a,b),0),layoutSpans:layout.map(x=>span(x,a,b)),updateSpans:update.map(x=>span(x,a,b)),measurements:measures,largestTasks:largest.map(x=>({...span(x,a,b),inside:native.filter(y=>page(y)>=page(x)&&page(y)<page(x)+x.dur/1000&&/Layout|FunctionCall|FireAnimationFrame|ResizeObserver|UpdateLayout/.test(y.name)).map(y=>span(y,a,b))})),getProgramiv:program.map(x=>span(x,a,b)),longTailTasks:tasks.filter(x=>overlap(x,a,b)>25).map(x=>span(x,a,b))};
}
const panel=d.observer.panels.find(p=>p.label===label&&(label==='close'?!p.panel:!!p.panel)),anim=d.observer.animations.filter(a=>a.label===label);
const nativeAnims=e.filter(x=>x.name==='Animation'&&(x.ph==='b'||x.ph==='e')).map(x=>({t:page(x),ph:x.ph,args:x.args,id2:x.id2}));
r.actions.push({label,first,click,clock:{offset,maxResidual:residual},completion,traceHash:hash(fs.readFileSync(td+'/trace.json.gz')),panelInsertion:panel?.t,clickToPanel:panel?panel.t-click.t:null,animations:anim.map(a=>({...a,clickToFinish:a.finished===null?null:a.finished-click.t})),nativeAnimations:nativeAnims,full:window(first.t-250,click.t+2000),after1200:window(click.t,click.t+1200)});
}
write('runs/'+name+'/analysis.json',r);
}
write('measurements.json',result);
console.log(JSON.stringify(result.map(r=>({name:r.name,valid:r.valid,failure:r.failure,actions:r.actions.map(a=>({label:a.label,DOM:a.clickToPanel,animation:a.animations.map(x=>x.clickToFinish),clock:a.clock.maxResidual,full:{layout:a.full.layout,update:a.full.updateLayoutTree,cpu:[a.full.threadCpuLower,a.full.threadCpuUpper],wall:a.full.mainWall,worst:a.full.worstTask,raf:a.full.raf,actualRaf:a.full.actualRafCallback,present:a.full.headlessPresentation},after1200:{layout:a.after1200.layout,cpu:[a.after1200.threadCpuLower,a.after1200.threadCpuUpper],worst:a.after1200.worstTask,raf:a.after1200.raf,actualRaf:a.after1200.actualRafCallback,present:a.after1200.headlessPresentation}}))})),null,2));



