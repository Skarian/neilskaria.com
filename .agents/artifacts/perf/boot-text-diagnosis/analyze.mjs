import fs from 'node:fs';
const dir='.agents/artifacts/perf/boot-text-diagnosis';
const q=(v,p)=>{if(!v.length)return null;v=[...v].sort((a,b)=>a-b);return v[Math.max(0,Math.ceil(p*v.length)-1)];};
const stats=v=>({count:v.length,total:v.reduce((a,b)=>a+b,0),p50:q(v,.5),p95:q(v,.95),max:v.length?Math.max(...v):null});
const runs=[];
for(const variant of ['A','B','C'])for(const rep of [1,2]){
 const r=JSON.parse(fs.readFileSync(dir+'/'+variant+rep+'.json'));
 const text=r.frames.filter(f=>f.mode==='booting'&&f.boot>=.35&&f.boot<=3.5);
 const gaps=text.map(f=>{const i=r.frames.indexOf(f);return {boot:f.boot,t:f.t,ms:f.t-r.frames[i-1].t,previousBoot:r.frames[i-1].boot,previousDrawMs:r.frames[i-1].drawMs,previousSubmissionMs:r.frames[i-1].submissionMs,previousScreenUploadMs:r.frames[i-1].uploads.filter(u=>u.screen).reduce((n,u)=>n+u.ms,0)};});
 const screenUploads=text.flatMap(f=>f.uploads.filter(u=>u.screen).map(u=>u.ms));
 const allBoot=r.frames.filter(f=>f.mode==='booting'&&f.boot>=0);
 const fullUploads=allBoot.flatMap(f=>f.uploads.filter(u=>u.screen));
 const validity=text.length>0&&r.errors.length===0&&r.panels===0&&allBoot.at(-1)?.boot>=3.9&&(variant==='B'?text.every(f=>f.drawCalls===0):text.every(f=>f.drawCalls===1))&&(variant==='C'?screenUploads.length===0&&fullUploads.length>=1:screenUploads.length>=text.length);
 runs.push({variant,rep,environment:r.environment,errors:r.errors,validity,textBootRange:[text[0]?.boot,text.at(-1)?.boot],gaps:stats(gaps.map(g=>g.ms)),gapsOver34:gaps.filter(g=>g.ms>34),gapsOver50:gaps.filter(g=>g.ms>50),drawing:stats(text.map(f=>f.drawMs)),measureText:stats(text.map(f=>f.measureMs)),measureCalls:text.reduce((n,f)=>n+f.measureCalls,0),submission:stats(text.map(f=>f.submissionMs)),screenUploads:stats(screenUploads),totalCPU:stats(text.map(f=>f.totalMs)),fullBootScreenUploads:stats(fullUploads.map(u=>u.ms)),bootProgress:text.map(f=>({t:f.t,boot:f.boot,dive:f.dive,camera:f.camera}))});
}
const summary={source:'042dc805f9135f3b4efbcd0d2a9e90eafcdd80c0',order:['A1','B1','C1','C2','B2','A2'],interval:[.35,3.5],passed:runs.every(r=>r.validity),runs};
fs.writeFileSync(dir+'/summary.json',JSON.stringify(summary,null,2));
console.log('VALID',summary.passed);
for(const r of runs)console.log(r.variant+r.rep,JSON.stringify({gaps:r.gaps,over34:r.gapsOver34.length,draw:r.drawing,measure:r.measureText,submission:r.submission,uploads:r.screenUploads,total:r.totalCPU}));
if(!summary.passed)process.exitCode=1;
