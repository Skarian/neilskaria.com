import fs from 'node:fs';
const dir='.agents/artifacts/perf/first-boot-replay-20261012';
const q=(a,p)=>{a=[...a].sort((x,y)=>x-y);return a[Math.ceil(a.length*p)-1]??null};
const summary=[];
for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.json')&&!f.includes('summary'))){
 const d=JSON.parse(fs.readFileSync(dir+'/'+file));if(!d.frames)continue;
 const spans=[];
 for(const [a,b] of [['createRoom','model-parsed'],['model-parsed','assets-prepared'],['compile-wait-start','compile-wait-end'],['sound-wait-start','sound-ready'],['font-wait-start','fonts-ready'],['glyph-prep-start','glyph-prep-end'],['mesh-warm-start','mesh-warm-end'],['texture-control-start','texture-control-end']]){const x=d.ops.find(o=>o.kind===a),y=d.ops.find(o=>o.kind===b);if(x&&y)spans.push({stage:a+' → '+b,t:x.t,end:y.t,ms:y.t-x.t});}
 const runs=[1,2].map(run=>{
  const phases=[];
  for(const [label,lo,hi] of [['activation',0,.35],['arrival',.35,1.1],['drop',1.1,1.9],['colour-glint',1.9,3.5],['text',.35,3.5],['fade',3.5,4.01]]){
   const activation=d.ops.find(o=>o.run===run&&o.kind==='screen-material-activation'&&o.on)?.t??0;
   const frames=d.frames.filter(f=>f.run===run&&f.mode==='booting'&&f.boot>=lo&&f.boot<hi&&(label!=='activation'||f.t>=activation));
   const gaps=frames.map(f=>{const i=d.frames.indexOf(f);return f.t-d.frames[i-1].t;});
   phases.push({label,lo,hi,n:frames.length,p95:q(gaps,.95),max:q(gaps,1),over25:gaps.filter(g=>g>25).length,over34:gaps.filter(g=>g>34).length,paintP95:q(frames.map(f=>f.paint),.95),submitP95:q(frames.map(f=>f.submit),.95),maxFrame:q(frames.map(f=>f.total),1),uploads:frames.reduce((a,f)=>a+f.uploads,0),start:frames[0]?.t,end:frames.at(-1)?.t,worst:frames.map((f,i)=>({t:f.t,boot:f.boot,gap:gaps[i],paint:f.paint,submit:f.submit,total:f.total})).sort((a,b)=>b.gap-a.gap).slice(0,3)});
  }
  return{run,phases,markers:d.ops.filter(o=>o.run===run)};
 });
 const s={name:d.name,rate:d.rate,tracing:d.tracing,ready:d.ready,usable:d.observer.usable,loadingLongMax:q(d.observer.long.filter(l=>l.t<d.ready).map(l=>l.d),1),spans,panels:d.panels.map(p=>({...p,ms:p.end-p.t})),firstText:d.observer.firstText,runs,environment:d.environment,actions:d.actions,networkSummary:{requests:d.network.length,non200:d.network.filter(n=>n.status!==200)},navigation:d.navigation};
 summary.push(s);
 console.log(d.name,JSON.stringify({ready:s.ready,usable:s.usable,long:s.loadingLongMax,spans:s.spans.map(x=>({stage:x.stage,ms:x.ms})),text:s.runs.map(r=>r.phases.find(p=>p.label==='text')),activation:s.runs.map(r=>r.phases.find(p=>p.label==='activation'))}));
}
fs.writeFileSync(dir+'/summary.json',JSON.stringify(summary,null,2));
