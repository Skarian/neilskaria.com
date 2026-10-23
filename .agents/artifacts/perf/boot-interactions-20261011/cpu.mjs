import{readFileSync,writeFileSync}from'node:fs';
const dir='.agents/artifacts/perf/boot-interactions-20261011';const out=[];
const lines=readFileSync('.svelte-kit/output/client/_app/immutable/chunks/J0urUqxM.js','utf8').split('\n');
for(const rep of [1,2]){const prefix=`desktop-4x-dpr1-${rep}-diagnostic`;const d=JSON.parse(readFileSync(dir+'/'+prefix+'.json'));const p=JSON.parse(readFileSync(dir+'/'+prefix+'.cpuprofile'));const nodes=new Map(p.nodes.map(n=>[n.id,n]));const parent=new Map();for(const n of p.nodes)for(const c of n.children||[])parent.set(c,n.id);
 const offset=p.startTime/1000-d.actions[0].t;let t=p.startTime/1000;const samples=p.samples.map((id,i)=>{t+=p.timeDeltas[i]/1000;return{id,t:t-offset,d:p.timeDeltas[i]/1000}});
 for(const a of d.actions.filter(a=>!a.label.startsWith('back'))){const end=a.t+(a.label==='START'?8000:1300);const self=new Map(),inclusive=new Map();for(const s of samples.filter(s=>s.t>=a.t&&s.t<end)){self.set(s.id,(self.get(s.id)||0)+s.d);for(let id=s.id;id;id=parent.get(id))inclusive.set(id,(inclusive.get(id)||0)+s.d);}
 const top=m=>[...m].map(([id,ms])=>({id,ms,...nodes.get(id).callFrame,source: nodes.get(id).callFrame.url.includes('J0urUqxM')?lines[nodes.get(id).callFrame.lineNumber]?.slice(Math.max(0,nodes.get(id).callFrame.columnNumber-50),nodes.get(id).callFrame.columnNumber+230):undefined})).sort((a,b)=>b.ms-a.ms).slice(0,20);
 out.push({rep,label:a.label,self:top(self),inclusive:top(inclusive)});
 }
}writeFileSync(dir+'/cpu-summary.json',JSON.stringify(out,null,2));for(const r of out)console.log(r.rep,r.label,r.self.slice(0,8).map(n=>({name:n.functionName,ms:n.ms.toFixed(1),line:n.lineNumber,col:n.columnNumber,source:n.source?.slice(0,160)})));
