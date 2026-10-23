import {launch} from './cdp.mjs';
import {writeFileSync,mkdirSync} from 'node:fs';import {gzipSync} from 'node:zlib';
const dir='.agents/artifacts/perf/boot-interactions-20261011';
const configs=process.argv.includes('--smoke')?[{profile:'desktop',rate:1,dpr:1,rep:0}]:['desktop','phone'].flatMap(profile=>[1,4].flatMap(rate=>[1,2].map(rep=>({profile,rate,dpr:profile==='phone'?2.625:1,rep}))));
if(process.argv.includes('--lowdpr'))configs.splice(0,configs.length,...[1,2].map(rep=>({profile:'phone',rate:4,dpr:1,rep})));
if(process.argv.includes('--diagnostic'))configs.splice(0,configs.length,...[1,2].map(rep=>({profile:'desktop',rate:4,dpr:1,rep,diagnostic:true})));
if(process.argv.includes('--bootfirst'))configs.splice(0,configs.length,...[1,2].map(rep=>({profile:'phone',rate:rep===1?1:4,dpr:2.625,rep,bootfirst:true})));
if(process.argv.includes('--control'))configs.splice(0,configs.length,{profile:'phone',rate:4,dpr:2.625,rep:2,control:true});
if(process.argv.includes('--rapid'))configs.splice(0,configs.length,{profile:'desktop',rate:4,dpr:1,rep:1,rapid:true});
for(const c of configs){
 const name=`${c.profile}-${c.rate}x-dpr${c.dpr}-${c.rep}${c.diagnostic?'-diagnostic':''}${c.bootfirst?'-bootfirst':''}${c.control?'-control':''}${c.rapid?'-rapid':''}`;console.log('START',name);
 const b=await launch({url:'http://localhost:4291/lab/boot',profile:c.profile,dir:process.env.TEMP+'/boot-interactions-20261011/'+name});
 try{
 await b.send('Emulation.setDeviceMetricsOverride',{width:b.P.w,height:b.P.h,deviceScaleFactor:c.dpr,mobile:b.P.mobile});
 await b.send('Emulation.setCPUThrottlingRate',{rate:c.rate});await b.send('Network.enable');
 if(c.diagnostic)await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__gl=[];for(const name of ['createProgram','linkProgram','getProgramParameter','getShaderParameter','getUniformLocation','getActiveUniform','texSubImage2D','bufferData']){const p=WebGL2RenderingContext.prototype,original=p[name];p[name]=function(...a){const t=performance.now();const v=original.apply(this,a);const d=performance.now()-t;if(d>.2||name==='linkProgram')__gl.push({name,t,d});return v}}`});
 const network=[];b.on(m=>{if(m.method==='Network.requestWillBeSent')network.push({url:m.params.request.url,t:m.params.timestamp,type:m.params.type});if(m.method==='Network.loadingFailed')network.push({failed:m.params.errorText,id:m.params.requestId,t:m.params.timestamp});});
 await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__obs={raf:[],long:[],events:[],panels:[]};new PerformanceObserver(l=>__obs.long.push(...l.getEntries().map(e=>({t:e.startTime,d:e.duration})))).observe({type:'longtask',buffered:true});for(const type of ['pointerdown','pointerup','click'])document.addEventListener(type,e=>__obs.events.push({type,t:performance.now(),stamp:e.timeStamp,target:e.target.tagName,x:e.clientX,y:e.clientY}),true);function sample(t){__obs.raf.push(t);const p=window.__skipPanelSamples?null:document.querySelector('.panel');if(p){const s=getComputedStyle(p);__obs.panels.push({t:performance.now(),label:p.getAttribute('aria-label'),opacity:+s.opacity,transform:s.transform,status:p.querySelector('[data-status]')?.dataset.status});}requestAnimationFrame(sample)}requestAnimationFrame(sample);`});
 await b.go();if(!await b.waitFor('window.__probe && document.querySelector("[data-start]")',60000)){await b.shot(dir+'/'+name+'-failed.png');console.log(await b.ev('document.body.innerText'),b.errors);throw Error('room not ready');}
 if(c.control)await b.ev(`window.__skipPanelSamples=true`);
 const environment=await b.ev(`(()=>{const gl=__probe.renderer.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');return {ua:navigator.userAgent,renderer:e&&gl.getParameter(e.UNMASKED_RENDERER_WEBGL),vendor:e&&gl.getParameter(e.UNMASKED_VENDOR_WEBGL),canvas:[gl.drawingBufferWidth,gl.drawingBufferHeight],timer:!!gl.getExtension('EXT_disjoint_timer_query_webgl2'),state:__probe.state()}})()`);
 await b.sleep(c.rep===1?0:2500);
 const trace=[];let traceDone;const done=new Promise(r=>traceDone=r);const tracing=c.rep===1&&c.rate===4;
 if(tracing){b.on(m=>{if(m.method==='Tracing.dataCollected')trace.push(...m.params.value);if(m.method==='Tracing.tracingComplete')traceDone();});await b.send('Tracing.start',{categories:'devtools.timeline,v8,blink.user_timing,gpu',transferMode:'ReportEvents'});}
 const actions=[];
 if(c.diagnostic){await b.send('Profiler.enable');await b.send('Profiler.setSamplingInterval',{interval:1000});await b.send('Profiler.start');}
 async function action(label,fn,ms){const t=await b.ev('performance.now()');await b.ev(`performance.mark(${JSON.stringify(label)})`);await fn();await b.sleep(ms);actions.push({label,t,end:await b.ev('performance.now()'),state:await b.ev('__probe.state()')});}
 async function domClick(selector){const p=await b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await click(p);}
 async function click(p){if(c.profile==='phone'){await b.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y}]});await b.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else await b.click(p.x,p.y);}
 async function objectClick(thing){const p=await b.ev(`(()=>{const {pickers,camera,THREE}=__probe;const o=pickers.find(o=>o.userData.thing===${JSON.stringify(thing)});const box=new THREE.Box3().setFromObject(o);const p=box.getCenter(new THREE.Vector3()).project(camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2}})()`);await click(p);}
 const first=c.rep===1?'clock':'lantern';const second=first==='clock'?'lantern':'clock';
 if(c.bootfirst){await action('START-cold',()=>domClick('[data-start]'),8500);await action('return-cold',async()=>{const p=await b.ev(`(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent.includes('BACK TO THE ROOM'));const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await click(p)},4000);}
 for(const thing of c.bootfirst?[]:c.rapid?[first,first,first,first]:[first,second,first,second]){await action(`${thing}-${actions.filter(a=>a.label.startsWith(thing+'-')).length+1}`,()=>objectClick(thing),thing==='clock'?3500:1600);await action('back-'+thing,()=>domClick('.panel .back'),c.rapid?100:1500);}
 if(c.rapid)await b.sleep(1500);
 if(!c.bootfirst){await action('START',()=>domClick('[data-start]'),8500);
 await action('return',async()=>{const p=await b.ev(`(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent.includes('BACK TO THE ROOM'));if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);if(p)await click(p);else await b.ev('__probe.returnToRoom()');},4000);}
 if(tracing){await b.send('Tracing.end');await done;writeFileSync(dir+'/'+name+'-trace.json.gz',gzipSync(JSON.stringify({traceEvents:trace})));}
 if(c.diagnostic){const p=await b.send('Profiler.stop');writeFileSync(dir+'/'+name+'.cpuprofile',JSON.stringify(p.result.profile));}
 const data=await b.ev('({profile:__profile,observer:__obs,gl:window.__gl})');writeFileSync(dir+'/'+name+'.json',JSON.stringify({config:c,environment,actions,network,errors:b.errors,...data}));console.log('DONE',name,environment.renderer,actions.map(a=>[a.label,a.state.focused,a.state.mode]));
 if(c.rep===0)await b.shot(dir+'/smoke.png');
 }catch(e){console.error(name,e);writeFileSync(dir+'/'+name+'-error.txt',String(e));}finally{b.close();}
}
process.exit(0);
