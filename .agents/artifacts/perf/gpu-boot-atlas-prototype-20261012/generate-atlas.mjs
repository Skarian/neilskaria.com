import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {launch} from './cdp.mjs';
const out=path.resolve('.agents/artifacts/perf/gpu-boot-atlas-prototype-20261012'),stage=out+'/source-stage';
const b=await launch({url:'about:blank',dir:out+'/profiles/generator'});
try{
 const result=await b.ev(`(()=>{const c=document.createElement('canvas');c.width=4096;c.height=2048;const x=c.getContext('2d');x.textBaseline='middle';const wordFont=s=>'italic 900 '+s+'px "Arial Black", "Helvetica Neue", Arial, sans-serif';const lineFont=s=>'900 '+s+'px "Arial Rounded MT Bold", "Helvetica Neue", Arial, sans-serif';let size=160;x.font=wordFont(size);size*=Math.min(1,844.8/x.measureText('NEIL SKARIA').width);x.font=wordFont(size);const total=x.measureText('NEIL SKARIA').width;let pos=-total/2;const slots=[...'NEIL SKARIA'].map(ch=>{const w=x.measureText(ch).width;const v=pos+w/2;pos+=w;return v;});let lineSize=70.4;x.font=lineFont(lineSize);lineSize*=Math.min(1,576/x.measureText('neilskaria.com').width);x.font=lineFont(lineSize);const lineWidth=x.measureText('neilskaria.com').width;const masks=[...new Set([...'NEILSKARIA']), 'neilskaria.com'].map(ch=>{const domain=ch.length>1,scale=domain?1:4;font=domain?lineFont(lineSize):wordFont(size);x.resetTransform();x.clearRect(0,0,c.width,c.height);const originX=domain?(960-lineWidth)/2:1024,originY=domain?473.6:1024;x.translate(originX,originY);x.scale(scale,scale);x.font=font;x.textBaseline='middle';x.fillStyle='#fff';const width=x.measureText(ch).width;x.fillText(ch,0,0);return{ch,scale,width,font,originX,originY,png:c.toDataURL('image/png').split(',')[1]};});document.body.innerHTML='<span id="word">NEIL SKARIA</span><span id="domain">neilskaria.com</span>';document.querySelector('#word').style.font=wordFont(size);document.querySelector('#domain').style.font=lineFont(lineSize);return {size,total,slots,lineSize,lineWidth,masks,userAgent:navigator.userAgent};})()`.replace('font=domain?','const font=domain?'));
 await b.send('DOM.enable');await b.send('CSS.enable');
 const doc=await b.send('DOM.getDocument');const fonts={};
 for(const id of ['word','domain']){const n=await b.send('DOM.querySelector',{nodeId:doc.result.root.nodeId,selector:'#'+id});fonts[id]=(await b.send('CSS.getPlatformFontsForNode',{nodeId:n.result.nodeId})).result;}
 const tiles=[];let x=8,y=8,row=0;const width=2048;
 for(const m of result.masks){const raw=Buffer.from(m.png,'base64');const trimmed=await sharp(raw).trim({threshold:0}).png().toBuffer({resolveWithObject:true});const info=trimmed.info;if(x+info.width+8>width){x=8;y+=row+16;row=0;}tiles.push({input:trimmed.data,left:x,top:y});m.region=[x,y,info.width,info.height];m.bounds=[(-info.trimOffsetLeft-m.originX)/m.scale-(m.ch.length>1?0:m.width/2),(-info.trimOffsetTop-m.originY)/m.scale,info.width/m.scale,info.height/m.scale];delete m.png;x+=info.width+16;row=Math.max(row,info.height);}
 const height=2**Math.ceil(Math.log2(y+row+8));const asset=await sharp({create:{width,height,channels:4,background:{r:255,g:255,b:255,alpha:0}}}).composite(tiles).png({compressionLevel:9}).toBuffer();
 fs.writeFileSync(stage+'/public/boot-atlas.png',asset);
 const hash=createHash('sha256').update(asset).digest('hex');
 const metrics={width,height,assetSha256:hash,...result};
 fs.writeFileSync(stage+'/src/lib/boot/boot-atlas-metrics.json',JSON.stringify(metrics,null,2));
 const fontFiles=['C:/Windows/Fonts/ariblk.ttf','C:/Windows/Fonts/ARLRDBD.TTF'].filter(p=>fs.existsSync(p)).map(p=>({path:p,sha256:createHash('sha256').update(fs.readFileSync(p)).digest('hex')}));
 fs.writeFileSync(out+'/font-provenance.json',JSON.stringify({generator:'Installed Windows Chrome Canvas2D, offline only',fonts,fontFiles,metrics,assetBytes:asset.length,rgba8Bytes:width*height*4,limitations:'Platform font report covers DOM spans with matching font declarations. Android fallback can differ. Canvas font identity inferred from matching declarations and fixed Windows environment.'},null,2));
 console.log(JSON.stringify({width,height,bytes:asset.length,hash,fonts}));
}finally{b.close();}
