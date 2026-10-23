import fs from 'node:fs';
const dir='.agents/artifacts/perf/interaction-attribution';
const q=(v,p)=>{if(!v.length)return null;v=[...v].sort((a,b)=>a-b);return v[Math.ceil(v.length*p)-1]};
const stats=v=>({count:v.length,total:v.reduce((a,b)=>a+b,0),p50:q(v,.5),p95:q(v,.95),max:v.length?Math.max(...v):null});
const rows=fs.readdirSync(dir).filter(n=>/^(clock|lantern)-[14]x-([A-Z]+|light)-\d+(-light|-trace)?\.json$/.test(n)).map(n=>{
 const r=JSON.parse(fs.readFileSync(dir+'/'+n));
 const windows=r.actions.map(a=>{
  const e=r.observer.events.find(e=>e.type==='click'&&e.target==='CANVAS'&&e.t>=a.start&&e.t<a.end);
  const t=e.t;const frames=r.frames.filter(f=>f.t>=t&&f.t<t+1300);const ops=r.ops.filter(o=>o.t>=t&&o.t<t+1300);
  const gaps=frames.map(f=>f.t-r.frames[r.frames.indexOf(f)-1].t);
  const first=frames.find(f=>f.focused===r.config.thing&&f.blend>0);
  const stages={};for(const kind of ['focus','fit','bounds','audioContext','radioSynth','noise','shader'])stages[kind]={stats:stats(ops.filter(o=>o.kind===kind).map(o=>o.ms)),ops:ops.filter(o=>o.kind===kind)};
  return {label:a.label,click:t,dispatchLead:t-a.start,dispatchToCamera:first?first.t-a.start:null,preClickShader:stats(r.ops.filter(o=>o.kind==='shader'&&o.t>=a.start&&o.t<t).map(o=>o.ms)),pointerdown:r.observer.events.filter(e=>e.type==='pointerdown'&&e.t>=a.start&&e.t<=t).at(-1)?.t,window:1300,gaps:stats(gaps),over34:gaps.filter(v=>v>34).length,cameraDelay:first?first.t-t:null,mainRender:stats(frames.map(f=>f.mainRenderMs)),outline:stats(frames.map(f=>f.outlineMs)),stages,longTasks:r.observer.long.filter(l=>l.t<t+1300&&l.t+l.d>t)};
 });
 return {file:n,...r.config,reference:r.reference,environment:r.environment,errors:r.errors,windows};
});
fs.writeFileSync(dir+'/summary.json',JSON.stringify(rows,null,2));
for(const r of rows)console.log(r.file,JSON.stringify(r.windows.map(w=>({label:w.label,gaps:w.gaps,over34:w.over34,camera:w.cameraDelay,main:w.mainRender,outline:w.outline,stages:Object.fromEntries(Object.entries(w.stages).map(([k,v])=>[k,v.stats]))}))));
