import fs from 'node:fs';import sharp from 'sharp';
const root='lean-stutter-work.tmp/appearance',times=[.5,1.1,1.3,1.6,2.4,2.78,3.5];
for(const kind of ['direct','room']){
 const width=kind==='direct'?480:206,height=kind==='direct'?320:458;
 const layers=[];
 for(const[i,t]of times.entries())for(const[j,v]of ['baseline','candidate'].entries()){
  const input=await sharp(`${root}/${kind}-${t}-${v}.png`).resize(width,height).png().toBuffer();layers.push({input,left:j*width,top:i*height});
 }
 await sharp({create:{width:width*2,height:height*7,channels:4,background:'#fff'}}).composite(layers).png().toFile(`${root}/${kind}-contact.png`);
}
