import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
const dir='.agents/artifacts/perf/interaction-attribution';
const result=[];
for(const file of ['clock-4x-P-9-trace','clock-4x-PFR-3-light','clock-4x-PFR-4-light','clock-4x-PNF-1','clock-4x-PNF-2']){
 const raw=JSON.parse(fs.readFileSync(`${dir}/${file}.json`));
 const start=raw.observer.events.find(e=>e.type==='click'&&e.target==='CANVAS'&&e.t>=raw.actions[0].start).t;
 const frames=raw.frames.filter(f=>f.t>=start&&f.t<=start+1300);
 const gaps=frames.map(f=>{const i=raw.frames.indexOf(f);return {t:f.t-start,gap:f.t-raw.frames[i-1].t,total:f.totalMs,main:f.mainRenderMs,outline:f.outlineMs};}).sort((a,b)=>b.gap-a.gap);
 let tasks=[];
 if(file.includes('trace')){
  const es=JSON.parse(gunzipSync(fs.readFileSync(`${dir}/${file}-trace.json.gz`))).traceEvents;
  const mark=es.find(e=>e.name==='attrib-first');const offset=mark.ts-(mark.args?.data?.startTime??raw.actions[0].start)*1000;
  const main=es.filter(e=>e.pid===mark.pid&&e.tid===mark.tid&&e.ph==='X'&&e.ts+(e.dur||0)>=(start-180)*1000+offset&&e.ts<(start+300)*1000+offset);
  tasks=main.sort((a,b)=>b.dur-a.dur).slice(0,18).map(e=>({name:e.name,t:(e.ts-offset)/1000-start,ms:e.dur/1000,args:e.args}));
 }
 result.push({file,start,gaps:gaps.slice(0,8),ops:raw.ops.filter(o=>o.t>=start&&o.t<start+1300),long:raw.observer.long.filter(e=>e.t>=start&&e.t<start+1300),network:raw.network.map(n=>({type:n.type,url:n.url})),tasks});
}
fs.writeFileSync('radio-residual-existing.tmp.json',JSON.stringify(result,null,2));
for(const r of result)console.log(JSON.stringify({file:r.file,gaps:r.gaps,ops:r.ops,tasks:r.tasks},null,2));
