import {launch} from './cdp.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const out='C:/projects/neilskaria.com/.agents/artifacts/perf/assembly/stage1';
const notes=[];
for(const profile of ['desktop','phone'])for(const variant of ['land','land=2']){
 const name=profile+'-'+variant.replace('=','-');
 const dir=process.env.TEMP+'/impl/landing/'+name;
 mkdirSync(dir,{recursive:true});
 const b=await launch({url:'http://localhost:4220/lab/boot?'+variant,profile,dir,storage:{'boot-muted':'1'}});
 const frames=[];let reveal=null;
 try{
  await b.send('Runtime.addBinding',{name:'roomShown'});
  b.on(m=>{
   if(m.method==='Runtime.bindingCalled'&&m.params.name==='roomShown')reveal=JSON.parse(m.params.payload);
   if(m.method==='Page.screencastFrame'){
    frames.push({data:m.params.data,time:m.params.metadata.timestamp});
    void b.send('Page.screencastFrameAck',{sessionId:m.params.sessionId});
   }
  });
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`new MutationObserver(()=>{const c=document.querySelector('.room-layer canvas.live');if(c&&document.querySelector('[data-start]')&&!window.__recorded){window.__recorded=true;roomShown(JSON.stringify({time:(performance.timeOrigin+performance.now())/1000,navMs:performance.now(),width:innerWidth,height:innerHeight}))}}).observe(document,{subtree:true,attributes:true,childList:true});`});
  await b.send('Page.startScreencast',{format:'jpeg',quality:95,maxWidth:b.P.w,maxHeight:b.P.h,everyNthFrame:1});
  await b.go();
  if(!await b.waitFor('window.__recorded',45000))throw Error('No room '+b.errors.join(';'));
  await b.sleep(2600);
  await b.send('Page.stopScreencast');
  await b.shot(out+'/'+name+'-settled.png');
  const take=frames.filter(f=>f.time>=reveal.time-.15&&f.time<=reveal.time+2.3);
  const lines=[];
  take.forEach((f,i)=>{
   const file=dir+'/frame-'+String(i).padStart(4,'0')+'.jpg';
   writeFileSync(file,Buffer.from(f.data,'base64'));
   lines.push("file '"+file.split('/').at(-1)+"'","duration "+Math.max(.001,(take[i+1]?.time??f.time+.1)-f.time));
  });
  lines.push("file '"+'frame-'+String(take.length-1).padStart(4,'0')+".jpg'");
  writeFileSync(dir+'/frames.txt',lines.join('\n'));
  const f=spawnSync('C:/Program Files/ImageMagick-7.1.0-Q16-HDRI/ffmpeg.exe',['-y','-f','concat','-safe','0','-i',dir+'/frames.txt','-vf','pad=ceil(iw/2)*2:ceil(ih/2)*2','-r','60','-c:v','libx264','-crf','18','-pix_fmt','yuv420p',out+'/'+name+'.mp4'],{encoding:'utf8'});
  if(f.status!==0)throw Error(f.stderr);
  const row={profile,variant,reveal,frames:take.length,first:take[0]?.time-reveal.time,last:take.at(-1)?.time-reveal.time,errors:b.errors};notes.push(row);console.log(JSON.stringify(row));
 } finally{b.close()}
}
writeFileSync(out+'/recordings.json',JSON.stringify(notes,null,2));process.exit(0);



