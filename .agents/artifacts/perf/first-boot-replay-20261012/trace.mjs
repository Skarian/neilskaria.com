import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
const dir='.agents/artifacts/perf/first-boot-replay-20261012',name='original-targeted';
const d=JSON.parse(fs.readFileSync(dir+'/'+name+'.json'));
const events=JSON.parse(gunzipSync(fs.readFileSync(dir+'/'+name+'-trace.json.gz'))).traceEvents;
const sync=events.find(e=>e.name==='capture-sync');
if(!sync)throw Error('no trace sync');
const offset=sync.ts/1000-d.observer.traceSync;
const output={sync:{trace:sync.ts/1000,page:d.observer.traceSync,offset},runs:[]};
for(const run of [1,2]){
 const frames=d.frames.filter(f=>f.run===run&&f.mode==='booting'&&f.boot>=.35&&f.boot<=3.5);
 const activation=d.ops.find(o=>o.run===run&&o.kind==='screen-material-activation'&&o.on).t;
 const windows=[];
 for(const [label,lo,hi] of [['activation',activation-20,activation+350],['text',frames[0].t,frames.at(-1).t+20]]){
  const selected=events.filter(e=>e.ph==='X'&&e.dur&&e.ts/1000-offset>=lo&&e.ts/1000-offset<hi);
  const grouped=new Map();
  for(const e of selected){if(!/Raster|Program|Shader|TexImage|texImage|Layout|RunTask|AnimationFrame/.test(e.name))continue;const a=grouped.get(e.name)||[];a.push(e);grouped.set(e.name,a);}
  const spans=[...grouped].map(([name,a])=>({name,n:a.length,wallTotal:a.reduce((s,e)=>s+e.dur/1000,0),max:Math.max(...a.map(e=>e.dur/1000)),top:a.sort((a,b)=>b.dur-a.dur).slice(0,4).map(e=>({t:e.ts/1000-offset,d:e.dur/1000,pid:e.pid,tid:e.tid}))}));
  const calls=d.observer.graphics.filter(g=>g.run===run&&g.t>=lo&&g.t<hi);
  windows.push({label,lo,hi,spans,graphics:calls.filter(g=>g.name!=='useProgram'),useProgramCount:calls.filter(g=>g.name==='useProgram').length,links:calls.filter(g=>g.name==='linkProgram').length});
 }
 output.runs.push({run,windows,textFirst:d.observer.textFirst.filter(t=>t.run===run)});
}
fs.writeFileSync(dir+'/trace-detail.json',JSON.stringify(output,null,2));
for(const r of output.runs)for(const w of r.windows)console.log(r.run,w.label,JSON.stringify({spans:w.spans,graphics:w.graphics.filter(g=>g.name==='linkProgram'||g.d>3),links:w.links}));
