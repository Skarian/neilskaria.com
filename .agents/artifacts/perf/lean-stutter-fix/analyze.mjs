import fs from 'node:fs';
const root='lean-stutter-work.tmp';const result=[];
const stat=a=>{a=[...a].sort((x,y)=>x-y);return{median:a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2,min:a[0],max:a.at(-1),values:a};};
for(const name of fs.readdirSync(root).filter(n=>/^(glyph|panel)-.*\.json$/.test(n))){
 const r=JSON.parse(fs.readFileSync(root+'/'+name));
 if(name.startsWith('glyph')){
  const frames=r.frames.filter(f=>f.mode==='booting'&&f.boot>=.35&&f.boot<=3.5);const gaps=frames.map(f=>f.t-r.frames[r.frames.indexOf(f)-1].t);
  const rep=+name.split('-').at(-1).replace('.json','');
  const revision=(r.rate===4&&rep>=(r.variant==='baseline'?6:4))||(r.rate===1&&r.variant==='candidate'&&rep===2)?'final-padding':r.rate===4&&rep<(r.variant==='baseline'?3:2)?'initial':'pre-padding';
  result.push({name,kind:'glyph',variant:r.variant,rate:r.rate,revision,ready:r.ready,preparation:r.preparation,loadingLongMax:Math.max(0,...r.observer.long.filter(o=>o.t<r.ready).map(o=>o.d)),p95:[...gaps].sort((a,b)=>a-b)[Math.ceil(gaps.length*.95)-1],max:Math.max(...gaps),over34:gaps.filter(n=>n>34).length,frames:frames.length});
 }else{
  const loading=r.observer.long.filter(o=>o.t<r.ready);
  const actions=r.actions.map(a=>{const click=r.observer.events.find(e=>e.type==='click'&&e.target==='CANVAS'&&e.t>=a.start).t;const frames=r.frames.filter(f=>f.t>=click&&f.t<click+1300),gaps=frames.map(f=>({t:f.t-click,gap:f.t-r.frames[r.frames.indexOf(f)-1].t,total:f.total}));const sorted=gaps.map(g=>g.gap).sort((a,b)=>a-b);const ops=r.ops.filter(o=>o.t>=click&&o.t<click+1300);return{label:a.label,click,lead:click-a.start,p95:sorted[Math.ceil(sorted.length*.95)-1],max:sorted.at(-1),over34:sorted.filter(n=>n>34).length,cameraDelay:frames.find(f=>f.blend>0)?.t-click,fitCount:ops.filter(o=>o.kind==='fit').length,fitWall:ops.filter(o=>o.kind==='fit').reduce((n,o)=>n+o.ms,0),boundsWall:ops.filter(o=>o.kind==='bounds').reduce((n,o)=>n+o.ms,0),gaps:gaps.sort((a,b)=>b.gap-a.gap).slice(0,5)};});
  const rep=+name.split('-').at(-1).replace('.json','');
  result.push({name,kind:'panel',revision:rep>=(r.variant==='baseline'?6:4)?'final':'prototype',variant:r.variant,rate:r.rate,thing:r.thing,ready:r.ready,prepared:r.prepared,loadingLongMax:Math.max(0,...loading.map(o=>o.d)),loadingLong:loading,actions});
 }
}
const comparisons=[];
function compare(group,field,get){const a=group.filter(r=>r.variant==='baseline').map(get),b=group.filter(r=>r.variant==='candidate').map(get);if(!a.length||!b.length)return;const av=stat(a),bv=stat(b);comparisons.push({field,baseline:av,control:bv,absolute:bv.median-av.median,percent:av.median?(bv.median-av.median)/av.median*100:null});}
for(const rate of[1,4]){
 const g=result.filter(r=>r.kind==='glyph'&&r.rate===rate&&(rate===4?r.revision==='final-padding':r.name===(r.variant==='baseline'?'glyph-1x-baseline-3.json':'glyph-1x-candidate-2.json')));for(const f of['p95','max','ready','loadingLongMax'])compare(g,`glyph ${rate}x ${f}`,r=>r[f]);
 for(const thing of['lantern','clock']){
  const p=result.filter(r=>r.kind==='panel'&&r.revision==='final'&&r.rate===rate&&r.thing===thing);for(const f of['ready','loadingLongMax'])compare(p,`panel ${rate}x ${thing} ${f}`,r=>r[f]);
  for(const selection of['first','repeat'])for(const f of['p95','max','over34','cameraDelay','fitCount','fitWall','boundsWall'])compare(p,`panel ${rate}x ${thing} ${selection} ${f}`,r=>r.actions.find(a=>a.label===selection)[f]);
 }
}
fs.writeFileSync(root+'/shipping-summary.json',JSON.stringify(result,null,2));fs.writeFileSync(root+'/shipping-comparisons.json',JSON.stringify(comparisons,null,2));
for(const c of comparisons)console.log(c.field,`${c.baseline.median.toFixed(1)} -> ${c.control.median.toFixed(1)}`,`${c.absolute.toFixed(1)} (${c.percent?.toFixed(1)}%)`, 'ranges',c.baseline.min.toFixed(1),c.baseline.max.toFixed(1),c.control.min.toFixed(1),c.control.max.toFixed(1));
