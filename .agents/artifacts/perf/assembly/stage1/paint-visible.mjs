import{launch}from'./cdp.mjs';import sharp from'file:///C:/projects/neilskaria.com/node_modules/sharp/dist/index.mjs';import{writeFileSync}from'node:fs';
const out='C:/projects/neilskaria.com/.agents/artifacts/perf/assembly/stage1';const rows=[];
for(const profile of ['desktop','phone','desktop','phone','desktop','phone']){
 const b=await launch({url:'http://localhost:4220/lab/boot',profile,dir:process.env.TEMP+'/impl/landing/paint-'+profile});const frames=[];let readyResolve;const visibleSSR=new Promise(r=>readyResolve=r);let checking=false;
 try{
 await b.send('Network.enable');await b.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:94000});await b.send('Emulation.setCPUThrottlingRate',{rate:4});
 await b.send('Fetch.enable',{patterns:[{resourceType:'Script',requestStage:'Request'}]});
 b.on(async m=>{if(m.method==='Page.screencastFrame'){frames.push({data:m.params.data,time:m.params.metadata.timestamp});void b.send('Page.screencastFrameAck',{sessionId:m.params.sessionId});if(!checking){checking=true;try{const im=sharp(Buffer.from(m.params.data,'base64'));const meta=await im.metadata();const dark=await im.clone().extract({left:Math.round(meta.width*.5),top:Math.round(meta.height*.7),width:8,height:8}).stats();const light=await im.clone().extract({left:meta.width-100,top:20,width:60,height:25}).stats();if(dark.channels[0].mean<60&&light.channels[0].max>220)readyResolve(m.params.metadata.timestamp)}finally{checking=false}}}});
 await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__paint={navEpoch:performance.timeOrigin/1000};for(const type of ['pointerdown','click'])window.addEventListener(type,e=>{if(!__paint.input&&e.target.closest('[data-skip]')){__paint.input=(performance.timeOrigin+performance.now())/1000;__paint.type=e.type;requestAnimationFrame(()=>__paint.frame=(performance.timeOrigin+performance.now())/1000)}},true);`});
 await b.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:b.P.w,maxHeight:b.P.h,everyNthFrame:1});
 await b.go();if(!await b.waitFor(`getComputedStyle(document.querySelector('[data-skip]')).borderRadius==='999px'`,15000))throw Error('No styled SKIP');
 const firstSSR=await Promise.race([visibleSSR,b.sleep(15000).then(()=>{throw Error('No painted SSR loading frame')})]);await b.sleep(100);
 const r=await b.ev(`(()=>{const r=document.querySelector('[data-skip]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 if(profile==='desktop')await b.click(r.x,r.y);else{await b.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x,y:r.y}]});await b.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
 await b.sleep(1400);await b.send('Page.stopScreencast');
 const mark=await b.ev('__paint');let after=0,first=null;
 for(const f of frames){if(f.time<mark.input)continue;after++;const image=sharp(Buffer.from(f.data,'base64'));const meta=await image.metadata();const stats=await image.extract({left:Math.round(meta.width*.48),top:Math.round(meta.height*.7),width:8,height:8}).stats();const mean=stats.channels.slice(0,3).reduce((n,c)=>n+c.mean,0)/3;if(mean>150){first={time:f.time,mean};writeFileSync(out+'/early-'+profile+'-first-page.jpg',Buffer.from(f.data,'base64'));break}}
 const row={profile,firstSSR,tapAfterSSRMs:(mark.input-firstSSR)*1000,...mark,nextRafMs:(mark.frame-mark.input)*1000,firstPaintedPageMs:first?(first.time-mark.input)*1000:null,framesUntilPage:after,first,errors:b.errors};rows.push(row);console.log(JSON.stringify(row));
 }finally{b.close()}
}
writeFileSync(out+'/early-paint-visible-ssr.json',JSON.stringify(rows,null,2));process.exit(0);


