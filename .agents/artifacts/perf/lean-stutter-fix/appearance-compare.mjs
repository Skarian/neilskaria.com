import fs from 'node:fs';import sharp from 'sharp';
const root='lean-stutter-work.tmp/panel-appearance',out=[];
for(const thing of['lantern','clock']){
 const a=await sharp(`${root}/${thing}-baseline-steady.png`).raw().ensureAlpha().toBuffer({resolveWithObject:true});const b=await sharp(`${root}/${thing}-candidate-steady.png`).raw().ensureAlpha().toBuffer({resolveWithObject:true});
 const sameSize=a.info.width===b.info.width&&a.info.height===b.info.height;let error=0,changed=0,max=0;
 if(sameSize)for(let i=0;i<a.data.length;i+=4){let d=0;for(let k=0;k<3;k++)d=Math.max(d,Math.abs(a.data[i+k]-b.data[i+k]));error+=d;if(d>16)changed++;max=Math.max(max,d);}
 const old=JSON.parse(fs.readFileSync(`${root}/baseline.json`)).find(r=>r.thing===thing),next=JSON.parse(fs.readFileSync(`${root}/candidate.json`)).find(r=>r.thing===thing);
 const frames=a=>a.animation.flatMap(v=>v.frames.map(f=>({offset:f.computedOffset,opacity:f.opacity,transform:f.transform})));
 out.push({thing,sameSize,baseline:[a.info.width,a.info.height],candidate:[b.info.width,b.info.height],meanMaxChannelError:sameSize?error/(a.data.length/4):null,over16Pixels:sameSize?changed:null,max:sameSize?max:null,entryKeyframesEqual:JSON.stringify(frames(old))===JSON.stringify(frames(next)),baselineTiming:old.animation.map(a=>a.timing),candidateTiming:next.animation.map(a=>a.timing),baselineExit:old.exit.map(a=>a.timing),candidateExit:next.exit.map(a=>a.timing)});
}
fs.writeFileSync(root+'/comparison.json',JSON.stringify(out,null,2));console.log(out);
