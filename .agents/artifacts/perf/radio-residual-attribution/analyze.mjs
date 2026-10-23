import fs from 'node:fs';import{gunzipSync}from 'node:zlib';
const dir='radio-residual-work.tmp/interaction-attribution';
const names=fs.readdirSync(dir).filter(n=>/^clock-.*\.json$/.test(n));
const summaries=[];
for(const name of names){
 const r=JSON.parse(fs.readFileSync(`${dir}/${name}`));
 const actions=r.actions.map(a=>{
  const click=r.observer.events.find(e=>e.type==='click'&&e.target==='CANVAS'&&e.t>=a.start).t;
  const fslice=r.frames.filter(f=>f.t>=click&&f.t<click+1300);
  const gaps=fslice.map(f=>{const i=r.frames.indexOf(f);const p=r.frames[i-1];return {t:f.t-click,gap:f.t-p.t,predecessor:p.t-click,previousTotal:p.totalMs,total:f.totalMs,main:f.mainRenderMs,outline:f.outlineMs,blend:f.blend};});
  const sorted=gaps.map(g=>g.gap).sort((a,b)=>a-b);
  return{label:a.label,click,dispatchLead:click-a.start,p95:sorted[Math.ceil(sorted.length*.95)-1],max:sorted.at(-1),over34:sorted.filter(n=>n>34).length,cameraDelay:fslice.find(f=>f.blend>0)?.t-click,gaps:gaps.sort((a,b)=>b.gap-a.gap).slice(0,10),ops:r.ops.filter(o=>o.t>=click&&o.t<click+1300).map(o=>({...o,t:o.t-click})),long:r.observer.long.filter(o=>o.t<click+1300&&o.t+o.d>click).map(o=>({...o,t:o.t-click}))};
 });
 const file=`${dir}/${name.replace('.json','-trace.json.gz')}`;
 let trace=null;
 if(fs.existsSync(file)){
  const es=JSON.parse(gunzipSync(fs.readFileSync(file))).traceEvents;
  const mark=es.find(e=>e.name==='attrib-first');const offset=mark.ts-(mark.args?.data?.startTime??r.actions[0].start)*1000;
  const start=actions[0].click;
  const main=es.filter(e=>e.pid===mark.pid&&e.tid===mark.tid&&e.ph==='X'&&e.ts+(e.dur||0)>=(start-250)*1000+offset&&e.ts<(start+1300)*1000+offset);
  const tasks=main.filter(e=>e.name==='ThreadControllerImpl::RunTask'||e.name==='RunTask').sort((a,b)=>b.dur-a.dur).slice(0,12);
  trace={main:{pid:mark.pid,tid:mark.tid},offset,tasks:tasks.map(t=>({name:t.name,t:(t.ts-offset)/1000-start,ms:t.dur/1000,args:t.args,children:main.filter(e=>e!==t&&e.ts>=t.ts&&e.ts+e.dur<=t.ts+t.dur).sort((a,b)=>b.dur-a.dur).slice(0,18).map(e=>({name:e.name,t:(e.ts-offset)/1000-start,ms:e.dur/1000,args:e.args}))})),largest:main.sort((a,b)=>b.dur-a.dur).slice(0,25).map(e=>({name:e.name,t:(e.ts-offset)/1000-start,ms:e.dur/1000,args:e.args})),profiles:es.filter(e=>e.name==='Profile'||e.name==='ProfileChunk')};
 }
 summaries.push({name,config:r.config,environment:r.environment,actions,trace});
 console.log(name,actions.map(a=>({label:a.label,max:a.max,p95:a.p95,cameraDelay:a.cameraDelay,lead:a.dispatchLead,top:a.gaps.slice(0,3)})));
 if(trace)console.log('TRACE',JSON.stringify(trace.tasks.length?trace.tasks.slice(0,4):trace.largest.slice(0,12),null,2));
}
fs.writeFileSync('radio-residual-work.tmp/summary.json',JSON.stringify(summaries,null,2));
