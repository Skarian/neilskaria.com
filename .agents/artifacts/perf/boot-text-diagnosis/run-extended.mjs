import {launch} from './cdp.mjs';
import {writeFileSync} from 'node:fs';
const dir='.agents/artifacts/perf/boot-text-diagnosis';
for(const [rate,variant,rep,light] of process.argv[2].split(',').map(x=>{const [rate,v,r,l]=x.split(':');return [+rate,v,+r,l==='light']})){
 const name='extended-'+rate+'x-'+variant+rep+(light?'-light':'');
 const b=await launch({url:'http://localhost:4292/lab/boot?text-control='+variant+(variant==='light'||light?'&light=1':''),profile:'phone',dir:dir+'/temporary-profiles/'+name});
 try{
  await b.send('Emulation.setCPUThrottlingRate',{rate});
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:"window.__obs={events:[],long:[]};document.addEventListener('click',e=>__obs.events.push({t:performance.now(),x:e.clientX,y:e.clientY,target:e.target.tagName}),true);new PerformanceObserver(l=>__obs.long.push(...l.getEntries().map(e=>({t:e.startTime,d:e.duration})))).observe({type:'longtask',buffered:true});"});
  await b.go();
  if(!await b.waitFor('window.__diag && document.querySelector("[data-start]")',60000))throw Error('room not ready');
  if(light||variant==='light')await b.ev("(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('EXT_disjoint_timer_query_webgl2'),native=gl.getParameter.bind(gl);if(e)gl.getParameter=p=>p===e.GPU_DISJOINT_EXT?false:native(p);for(const name of ['texImage2D','texSubImage2D']){const original=gl[name].bind(gl);gl[name]=(...args)=>{const source=args.at(-1);if(source instanceof HTMLCanvasElement&&source.width===960&&source.height===640&&__diag.current)__diag.current.bootUploadCalls=(__diag.current.bootUploadCalls||0)+1;return original(...args)}}})()");
  if(variant==='E')await b.ev("(()=>{const native=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(...args){const f=window.__diag?.current;if(this.canvas.width===960&&this.canvas.height===640&&f?.mode==='booting'&&f.boot>=.35&&f.boot<=3.5){f.suppressedTextCalls=(f.suppressedTextCalls||0)+1;return;}return native.apply(this,args)};})()");
  await b.sleep(2500);
  if(b.errors.length)throw Error("Instrumentation failed before START: "+b.errors[0]);
  const environment=await b.ev("(()=>{const c=document.querySelector('canvas'),gl=c.getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {ua:navigator.userAgent,renderer:e&&gl.getParameter(e.UNMASKED_RENDERER_WEBGL),vendor:e&&gl.getParameter(e.UNMASKED_VENDOR_WEBGL),timeOrigin:performance.timeOrigin,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,canvas:[gl.drawingBufferWidth,gl.drawingBufferHeight]}})()");
  const p=await b.ev("(()=>{const r=document.querySelector('[data-start]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
  const start=await b.ev('performance.now()');
  await b.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});
  await b.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await b.sleep(8500);
  const data=await b.ev('({variant:__diag.variant,gpu:__diag.gpu,frames:__diag.frames,observer:__obs,panels:document.querySelectorAll(".panel").length})');
  if(b.errors.length)throw Error('Invalid capture: '+b.errors[0]);
  writeFileSync(dir+'/'+name+'.json',JSON.stringify({variant,rep,rate,light,start,environment,errors:b.errors,...data}));
  console.log('DONE',name,environment,data.frames.filter(f=>f.boot>=.35&&f.boot<=3.5).length,b.errors);
 }finally{b.close();}
}
