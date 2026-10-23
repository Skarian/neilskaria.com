import fs from 'node:fs';import path from 'node:path';import sharp from 'sharp';
const out=path.resolve('.agents/artifacts/perf/gpu-boot-atlas-prototype-20261012');
const result=[];
for(const t of [0,.35,.7,1.1,1.5,1.9,2.4,2.78,3.5]){
 const row={t};for(const mode of ['canvas','gpu']){const b=await sharp(out+'/fidelity/light-'+String(t).replace('.','_')+'-'+mode+'.png').ensureAlpha().raw().toBuffer();row[mode]={};for(const [part,y0,y1] of [['word',0,400],['domain',400,640]]){let n=0,xs=0,ys=0,minX=960,minY=640,maxX=-1,maxY=-1;for(let y=y0;y<y1;y++)for(let x=0;x<960;x++){const p=(y*960+x)*4;if(Math.max(Math.abs(b[p]-248),Math.abs(b[p+1]-250),Math.abs(b[p+2]-248))>32){n++;xs+=x;ys+=y;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}row[mode][part]={pixels:n,bounds:n?[minX,minY,maxX,maxY]:null,centroid:n?[xs/n,ys/n]:null};}}
 result.push(row);
}
fs.writeFileSync(out+'/fidelity/layout-analysis.json',JSON.stringify({description:'Colour-distance threshold 32 from paper. Word/domain bands separate settled artwork. Flying glyphs can cross bands. Bounds and centroids are screening data, not font identity proof.',result},null,2));console.log(JSON.stringify(result.filter(e=>[.35,1.9,2.78].includes(e.t))));
