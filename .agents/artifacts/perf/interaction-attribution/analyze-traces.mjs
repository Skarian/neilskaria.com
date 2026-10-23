import fs from 'node:fs';import{gunzipSync}from 'node:zlib';
const dirs=['.agents/artifacts/perf/boot-text-diagnosis','.agents/artifacts/perf/interaction-attribution'];
for(const dir of dirs){
 const summaries=[];
 for(const file of fs.readdirSync(dir).filter(n=>n.endsWith('-trace.json.gz'))){
  const name=file.slice(0,-'-trace.json.gz'.length),rawPath=dir+'/'+name+'.json';
  if(!fs.existsSync(rawPath))continue;
  const raw=JSON.parse(fs.readFileSync(rawPath)),events=JSON.parse(gunzipSync(fs.readFileSync(dir+'/'+file))).traceEvents;
  const boot=name.startsWith('extended-'),mark=events.find(e=>e.name===(boot?'boot-START':'attrib-first'));
  if(!mark)throw Error('missing marker '+name);
  const markPerf=mark.args?.data?.startTime??(boot?raw.start:raw.actions[0].start),offset=mark.ts-markPerf*1000;
  let start,end;
  if(boot){const frames=raw.frames.filter(f=>f.mode==='booting'&&f.boot>=.35&&f.boot<=3.5);start=frames[0].t*1000+offset;end=frames.at(-1).t*1000+offset;}
  else{const click=raw.observer.events.find(e=>e.type==='click'&&e.target==='CANVAS'&&e.t>=raw.actions[0].start);start=click.t*1000+offset;end=start+1300000;}
  const spans=events.filter(e=>e.ph==='X'&&e.ts<end&&e.ts+(e.dur||0)>start),byName={};
  for(const e of spans){const ms=Math.max(0,Math.min(end,e.ts+(e.dur||0))-Math.max(start,e.ts))/1000;if(!ms)continue;
   const k=e.name;const item=byName[k]??={name:k,count:0,total:0,max:0,mainTotal:0,mainMax:0};item.count++;item.total+=ms;item.max=Math.max(item.max,ms);
   if(e.pid===mark.pid&&e.tid===mark.tid){item.mainTotal+=ms;item.mainMax=Math.max(item.mainMax,ms);}
  }
  const rasters=spans.filter(e=>e.name==='RasterImplementation::RasterCHROMIUM'&&e.pid===mark.pid&&e.tid===mark.tid);
  const callbacks=spans.filter(e=>e.name==='FireAnimationFrame'&&e.pid===mark.pid&&e.tid===mark.tid);
  const contained=rasters.filter(e=>callbacks.some(c=>c.ts<=e.ts&&c.ts+c.dur>=e.ts+e.dur));
  const rasterAlignment=rasters.map(e=>({t:(e.ts-offset)/1000,ms:e.dur/1000,args:e.args,insideAnimationCallback:contained.includes(e)}));
  summaries.push({file:name,boot,main:{pid:mark.pid,tid:mark.tid},window:[(start-offset)/1000,(end-offset)/1000],events:Object.values(byName).sort((a,b)=>b.mainTotal-a.mainTotal),raster:{count:rasters.length,total:rasters.reduce((n,e)=>n+e.dur/1000,0),insideCount:contained.length,insideTotal:contained.reduce((n,e)=>n+e.dur/1000,0)},rasterAlignment});
 }
 fs.writeFileSync(dir+'/trace-summary.json',JSON.stringify(summaries,null,2));
 for(const s of summaries)console.log(s.file,'raster',s.raster,'layout',s.events.filter(e=>['Layout','UpdateLayoutTree','Paint','PrePaint'].includes(e.name)));
}
