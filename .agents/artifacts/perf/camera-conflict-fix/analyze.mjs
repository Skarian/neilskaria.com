import {readFileSync,writeFileSync} from 'node:fs';
const dir='.agents/artifacts/perf/camera-conflict-fix';
const baseline=JSON.parse(readFileSync('.agents/artifacts/perf/boot-interactions-20261011/desktop-4x-dpr1-1-rapid.json'));
function direction(frames){
 const deltas=frames.slice(1).map((f,i)=>f.blend-frames[i].blend);
 return {samples:frames.length,first:frames[0]?.blend,last:frames.at(-1)?.blend,decreases:deltas.filter(v=>v < -1e-7).length,increases:deltas.filter(v=>v > 1e-7).length,firstEight:frames.slice(0,8).map(f=>({t:f.t,blend:f.blend}))};
}
const prior=baseline.actions.filter(a=>/^clock-[2-4]$/.test(a.label)).map(a=>{
 const op=baseline.profile.ops.find(o=>o.kind==='focus'&&o.t>=a.t&&o.t<a.end);
 return {label:a.label,...direction(baseline.profile.frames.filter(f=>f.t>=op.t&&f.t<op.t+250&&f.focused==='clock'))};
});
const runs=[1,4].map(rate=>{
 const r=JSON.parse(readFileSync(dir+'/'+rate+'x.json'));
 const actions=r.actions.map(a=>{
   const focused=a.label.includes('back')||a.label.includes('cleanup')?null:a.label.startsWith('clock')?'clock':'lantern';
   const op=focused&&r.profile.ops.find(o=>o.kind==='focus'&&o.t>=a.before.t&&o.t<=a.after.t);
   const start=op?.t??a.after.t;
   const frames=r.profile.frames.filter(f=>f.t>=start&&f.t<a.end.t&&f.focused===focused);
   const d=direction(frames);
   return {label:a.label,before:a.before,after:a.after,end:a.end,direction:d,reverseWindow:a.label.includes('reselect')?direction(frames.filter(f=>f.t<start+250)):undefined,passed:a.end.focused===focused&&(a.label.includes('early-focus')||a.label.includes('-back')&&a.label.includes('rapid')?a.end.blend>0&&a.end.blend<1:a.end.blend===(focused?1:0))&&(focused?d.decreases===0:d.increases===0)&&frames.length>0};
 });
 return {rate,environment:r.environment,errors:r.errors,actions};
});
const summary={baseline:prior,runs,passed:runs.every(r=>r.errors.length===0&&r.actions.every(a=>a.passed))};
writeFileSync(dir+'/summary.json',JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary,null,2));
if(!summary.passed)process.exitCode=1;
