import fs from 'node:fs';import{launch}from './lean-stutter-work.tmp/cdp.mjs';
const root='lean-stutter-work.tmp';
for(const item of process.argv[2].split(',')){
 const [rateText,variant,rep]=item.split(':');const rate=+rateText;const name=`glyph-${rate}x-${variant}-${rep}`;
 if(fs.existsSync(`${root}/${name}.json`))throw Error('exists '+name);
 const b=await launch({url:`http://localhost:4292/lab/boot?lean=${variant}`,profile:'phone',dir:root+'/profiles/'+name});
 try{
  await b.send('Emulation.setCPUThrottlingRate',{rate});
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:"window.__obs={long:[],events:[]};document.addEventListener('click',e=>__obs.events.push({t:performance.now(),target:e.target.tagName}),true);new PerformanceObserver(l=>__obs.long.push(...l.getEntries().map(e=>({t:e.startTime,d:e.duration})))).observe({type:'longtask',buffered:true});"});
  await b.go();if(!await b.waitFor('window.__lean?.ready && document.querySelector("[data-start]")',60000))throw Error('not ready');
  await b.sleep(2500);
  const env=await b.ev("(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {ua:navigator.userAgent,renderer:gl.getParameter(e.UNMASKED_RENDERER_WEBGL),viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,buffer:[gl.drawingBufferWidth,gl.drawingBufferHeight]}})()");
  const p=await b.ev("(()=>{const r=document.querySelector('[data-start]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");
  await b.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await b.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await b.sleep(8500);
  const data=await b.ev('({preparation:__lean.preparation,ready:__lean.ready,frames:__lean.frames,observer:__obs,state:__lean.state()})');
  if(b.errors.length)throw Error(b.errors[0]);
  fs.writeFileSync(`${root}/${name}.json`,JSON.stringify({name,variant,rate,env,...data}));
  const f=data.frames.filter(f=>f.mode==='booting'&&f.boot>=.35&&f.boot<=3.5);const gaps=f.map(f=>{const i=data.frames.indexOf(f);return f.t-data.frames[i-1].t;}).sort((a,b)=>a-b);
  console.log(name,{p95:gaps[Math.ceil(gaps.length*.95)-1],max:gaps.at(-1),frames:f.length,preparation:data.preparation,ready:data.ready});
 }finally{b.close();}
}
