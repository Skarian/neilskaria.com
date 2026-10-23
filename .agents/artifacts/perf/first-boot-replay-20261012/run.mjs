import fs from 'node:fs';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {launch} from './first-boot-owned.tmp/cdp.mjs';
const dir=path.resolve('.agents/artifacts/perf/first-boot-replay-20261012');
const [name,rateText,traceFlag]=process.argv.slice(2),rate=+rateText,tracing=traceFlag==='trace';
const b=await launch({url:'http://127.0.0.1:4293/lab/boot',profile:'phone',dir:path.resolve('first-boot-owned.tmp/profiles/'+name)});
try{
 await b.send('Emulation.setCPUThrottlingRate',{rate});
 await b.send('Network.enable');await b.send('Network.setCacheDisabled',{cacheDisabled:true});
 const network=[];
 b.on(m=>{if(m.method==='Network.responseReceived')network.push({type:m.params.type,t:m.params.timestamp,url:m.params.response.url,status:m.params.response.status,cache:m.params.response.fromDiskCache});});
 await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__obs={events:[],long:[],firstText:null,usable:null};
 document.addEventListener('click',e=>__obs.events.push({t:performance.now(),text:e.target.textContent?.trim().slice(0,80),tag:e.target.tagName,trusted:e.isTrusted,active:navigator.userActivation.isActive}),true);
 new PerformanceObserver(l=>__obs.long.push(...l.getEntries().map(e=>({t:e.startTime,d:e.duration})))).observe({type:'longtask',buffered:true});
 const text=CanvasRenderingContext2D.prototype.fillText;
 CanvasRenderingContext2D.prototype.fillText=function(...args){if(!__obs.firstText&&this.canvas.width===960&&this.canvas.height===640){__obs.firstText={t:performance.now(),font:this.font,text:args[0],status:document.fonts.status};CanvasRenderingContext2D.prototype.fillText=text;}return text.apply(this,args)};
 new MutationObserver(()=>{if(!__obs.usable&&document.querySelector('[data-start]'))__obs.usable=performance.now()}).observe(document,{childList:true,subtree:true});`});
 await b.go();
 if(!await b.waitFor('window.__first?.ready && document.querySelector("[data-start]")',60000))throw Error('not ready '+b.errors.join(' '));
 const environment=await b.ev("(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {ua:navigator.userAgent,renderer:e&&gl.getParameter(e.UNMASKED_RENDERER_WEBGL),vendor:e&&gl.getParameter(e.UNMASKED_VENDOR_WEBGL),viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,buffer:[gl.drawingBufferWidth,gl.drawingBufferHeight],origin:performance.timeOrigin,fonts:[...document.fonts].map(f=>({family:f.family,status:f.status}))}})()");
 await b.sleep(2500);
 const traces=[];let finishTrace;const done=new Promise(r=>finishTrace=r);
 if(tracing){
  await b.ev(`(()=>{__obs.textFirst=[];const seen=new Set();const native=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(...args){const key=__first.run+':'+this.font+':'+args[0];if(this.canvas.width===960&&this.canvas.height===640&&!seen.has(key)){seen.add(key);__obs.textFirst.push({t:performance.now(),run:__first.run,font:this.font,text:args[0],boot:__first.state().boot});}return native.apply(this,args)}})()`);
  await b.ev(`(()=>{const gl=document.querySelector('canvas').getContext('webgl2');__obs.graphics=[];for(const name of ['linkProgram','useProgram','getProgramParameter','getProgramInfoLog','getShaderParameter','getShaderInfoLog','texImage2D','texSubImage2D']){const native=gl[name].bind(gl);gl[name]=(...args)=>{const t=performance.now();const result=native(...args);const d=performance.now()-t;if(name==='linkProgram'||name==='useProgram'||d>1)__obs.graphics.push({name,t,d,run:__first.run,boot:__first.state().boot});return result;}}})()`);
  b.on(m=>{if(m.method==='Tracing.dataCollected')traces.push(...m.params.value);if(m.method==='Tracing.tracingComplete')finishTrace();});
  await b.send('Tracing.start',{categories:'devtools.timeline,blink.user_timing,gpu,blink.graphics,skia,cc',transferMode:'ReportEvents'});
  await b.ev("__obs.traceEnabled=true;performance.mark('capture-sync');__obs.traceSync=performance.now()");
 }
 async function click(selector){
  const p=await b.ev(`(()=>{const el=${selector};if(!el)throw Error('Missing click target');el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,text:el.textContent.trim()}})()`);
  await b.click(p.x,p.y);return p;
 }
 const actions=[];
 for(let run=1;run<=2;run++){
  actions.push({kind:'START',run,t:await b.ev('performance.now()'),target:await click("document.querySelector('[data-start]')")});
  if(!await b.waitFor(`__first.state().mode==='site' && __first.run===${run}`,15000))throw Error('site failed');
  actions.push({kind:'site',run,t:await b.ev('performance.now()')});
  if(run===1){
   await b.sleep(600);
   actions.push({kind:'BACK',run,t:await b.ev('performance.now()'),target:await click("[...document.querySelectorAll('button')].find(e=>e.textContent.includes('BACK TO THE ROOM'))")});
   if(!await b.waitFor("__first.state().mode==='room' && document.querySelector('[data-start]')",10000))throw Error('return failed');
   actions.push({kind:'room-restored',run,t:await b.ev('performance.now()')});
   await b.sleep(2500);
  }
 }
 if(tracing){await b.send('Tracing.end');await done;fs.writeFileSync(path.join(dir,name+'-trace.json.gz'),gzipSync(JSON.stringify({traceEvents:traces})));}
 const data=await b.ev('({revision:__first.revision,ready:__first.ready,ops:__first.ops,frames:__first.frames,observer:__obs,panels:window.__panelFirst||[],navigation:performance.getEntriesByType("navigation").map(n=>n.toJSON()),resources:performance.getEntriesByType("resource").map(r=>r.toJSON())})');
 fs.writeFileSync(path.join(dir,name+'.json'),JSON.stringify({name,rate,tracing,environment,actions,network,errors:b.errors,...data}));
 if(b.errors.length)throw Error(b.errors[0]);
 const results=[1,2].map(run=>{const frames=data.frames.filter(f=>f.run===run&&f.mode==='booting'&&f.boot>=.35&&f.boot<=3.5);const gaps=frames.map(f=>f.t-data.frames[data.frames.indexOf(f)-1].t).sort((a,b)=>a-b);return{run,n:frames.length,p95:gaps[Math.ceil(gaps.length*.95)-1],max:gaps.at(-1)}});
 console.log(name,JSON.stringify({ready:data.ready,results,actions:actions.map(a=>({kind:a.kind,run:a.run,t:a.t})),errors:b.errors}));
}finally{b.close();}
