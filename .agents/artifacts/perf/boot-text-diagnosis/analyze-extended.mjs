import fs from 'node:fs';
const q=(v,p)=>{if(!v.length)return null;v=[...v].sort((a,b)=>a-b);return v[Math.ceil(v.length*p)-1];};
const stats=v=>({count:v.length,total:v.reduce((a,b)=>a+b,0),p50:q(v,.5),p95:q(v,.95),max:v.length?Math.max(...v):null});
const d='.agents/artifacts/perf/boot-text-diagnosis';
const rows=fs.readdirSync(d).filter(n=>/^extended-[14]x-[A-E]\d+(-light)?(-trace)?\.json$/.test(n)).map(n=>{
 const r=JSON.parse(fs.readFileSync(d+'/'+n));const f=r.frames.filter(f=>f.mode==='booting'&&f.boot>=.35&&f.boot<=3.5);
 const gaps=f.map(x=>x.t-r.frames[r.frames.indexOf(x)-1].t);
 return {file:n,variant:r.variant,rate:r.rate,light:!!r.light,suppressedTextCalls:f.reduce((n,x)=>n+(x.suppressedTextCalls||0),0),gpuStatus:r.gpu,errors:r.errors,bootUploadCalls:f.reduce((n,x)=>n+(x.bootUploadCalls||x.uploads.filter(u=>u.screen).length),0),gaps:stats(gaps),over34:gaps.filter(v=>v>34).length,drawing:stats(f.map(x=>x.drawMs)),submission:stats(f.map(x=>x.submissionMs)),uploads:stats(f.flatMap(x=>x.uploads.filter(u=>u.screen).map(u=>u.ms))),gpu:stats(f.filter(x=>x.gpuMs!=null).map(x=>x.gpuMs)),textRange:[f[0]?.boot,f.at(-1)?.boot]};
});
fs.writeFileSync(d+'/extended-summary.json',JSON.stringify(rows,null,2));
for(const r of rows)console.log(r.file,JSON.stringify(r));
