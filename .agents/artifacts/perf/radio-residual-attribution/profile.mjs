import fs from 'node:fs';import{gunzipSync}from 'node:zlib';
const dir='radio-residual-work.tmp/interaction-attribution';const summaries=[];
for(const file of fs.readdirSync(dir).filter(n=>n.endsWith('-trace.json.gz'))){
 const raw=JSON.parse(fs.readFileSync(`${dir}/${file.replace('-trace.json.gz','.json')}`));
 const es=JSON.parse(gunzipSync(fs.readFileSync(`${dir}/${file}`))).traceEvents;
 const mark=es.find(e=>e.name==='attrib-first'),offset=mark.ts-raw.actions[0].start*1000;
 const click=raw.observer.events.find(e=>e.type==='click'&&e.target==='CANVAS'&&e.t>=raw.actions[0].start).t;
 const main=es.filter(e=>e.pid===mark.pid&&e.tid===mark.tid&&e.ph==='X');
 const regions=[[-150,0],[0,300],[300,1300]];
 const profile=es.find(e=>e.name==='Profile'&&e.pid===mark.pid);let ts=profile?.args.data.startTime;
 const nodes=new Map(),samples=[];
 if(profile)for(const chunk of es.filter(e=>e.name==='ProfileChunk'&&e.pid===profile.pid&&e.id===profile.id)){
  const d=chunk.args.data;
  for(const n of d.cpuProfile?.nodes||[])nodes.set(n.id,n);
  for(const [i,id]of(d.cpuProfile?.samples||[]).entries()){ts+=d.timeDeltas[i];samples.push({id,t:(ts-offset)/1000-click,ms:d.timeDeltas[i]/1000});}
 }
 const result=regions.map(([lo,hi])=>{
  const spans=main.filter(e=>e.ts<(click+hi)*1000+offset&&e.ts+(e.dur||0)>(click+lo)*1000+offset);
  const totals={};for(const e of spans){const d=Math.max(0,Math.min(e.ts+e.dur,(click+hi)*1000+offset)-Math.max(e.ts,(click+lo)*1000+offset))/1000;const item=totals[e.name]??={total:0,max:0,count:0};item.total+=d;item.max=Math.max(item.max,d);item.count++;}
  const leaves={};for(const s of samples.filter(s=>s.t>=lo&&s.t<hi)){const n=nodes.get(s.id),f=n?.callFrame;if(!f)continue;const k=JSON.stringify(f);leaves[k]=(leaves[k]||0)+s.ms;}
  return{region:[lo,hi],events:Object.entries(totals).map(([name,v])=>({name,...v})).sort((a,b)=>b.total-a.total),sampleLeaves:Object.entries(leaves).map(([k,ms])=>({frame:JSON.parse(k),ms})).sort((a,b)=>b.ms-a.ms).slice(0,15)};
 });
 summaries.push({file,regions:result});
 console.log(file,result.map(r=>({region:r.region,events:r.events.filter(e=>['Layout','UpdateLayoutTree','EventDispatch','FireAnimationFrame','GLES2Implementation::GetProgramiv','EvaluateScript','RasterImplementation::RasterCHROMIUM','CpuProfiler::StartProfiling'].includes(e.name)),leaves:r.sampleLeaves.slice(0,8)})));
}
fs.writeFileSync('radio-residual-work.tmp/trace-detail.json',JSON.stringify(summaries,null,2));
