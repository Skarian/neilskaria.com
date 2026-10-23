import {launch} from './cdp.mjs';
import {writeFileSync} from 'node:fs';
const dir='.agents/artifacts/perf/boot-text-diagnosis';
for(const [variant,rep] of [['A',1],['B',1],['C',1],['C',2],['B',2],['A',2]]){
 const name=variant+rep;
 const b=await launch({url:'http://localhost:4292/lab/boot?text-control='+variant,profile:'phone',dir:dir+'/temporary-profiles/'+name});
 try{
  await b.send('Emulation.setCPUThrottlingRate',{rate:4});
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:"window.__obs={events:[],long:[]};document.addEventListener('click',e=>__obs.events.push({t:performance.now(),x:e.clientX,y:e.clientY,target:e.target.tagName}),true);new PerformanceObserver(l=>__obs.long.push(...l.getEntries().map(e=>({t:e.startTime,d:e.duration})))).observe({type:'longtask',buffered:true});"});
  await b.go();
  if(!await b.waitFor('window.__diag && document.querySelector("[data-start]")',60000))throw Error('room not ready');
  await b.sleep(2500);
  if(b.errors.length)throw Error("Instrumentation failed before START: "+b.errors[0]);
  const environment=await b.ev("(()=>{const c=document.querySelector('canvas'),gl=c.getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {ua:navigator.userAgent,renderer:e&&gl.getParameter(e.UNMASKED_RENDERER_WEBGL),vendor:e&&gl.getParameter(e.UNMASKED_VENDOR_WEBGL),viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,canvas:[gl.drawingBufferWidth,gl.drawingBufferHeight]}})()");
  const p=await b.ev("(()=>{const r=document.querySelector('[data-start]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
  const start=await b.ev('performance.now()');
  await b.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});
  await b.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await b.sleep(8500);
  const data=await b.ev('({variant:__diag.variant,frames:__diag.frames,observer:__obs,panels:document.querySelectorAll(".panel").length})');
  if(b.errors.length)throw Error('Invalid capture: '+b.errors[0]);
  writeFileSync(dir+'/'+name+'.json',JSON.stringify({variant,rep,rate:4,start,environment,errors:b.errors,...data}));
  console.log('DONE',name,environment,data.frames.filter(f=>f.boot>=.35&&f.boot<=3.5).length,b.errors);
 }finally{b.close();}
}
