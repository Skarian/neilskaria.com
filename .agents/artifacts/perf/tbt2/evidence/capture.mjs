import fs from 'node:fs';
import {launch} from '../cdp-chrome.mjs';
const [name='base',kind='phone']=process.argv.slice(2),root=process.env.TEMP+'/impl/tbt2',out=root+'/'+name+'-'+kind;fs.mkdirSync(out,{recursive:true});
const b=await launch({url:'http://localhost:4280/lab/boot',profile:'phone',dir:out});const trace=[];let done;
const timer=setTimeout(()=>{b.close();process.exit(2)},150000);
try {
b.on(m=>{if(m.method==='Tracing.dataCollected')trace.push(...m.params.value);if(m.method==='Tracing.tracingComplete')done?.()});
await b.send('Network.enable');await b.send('Network.setCacheDisabled',{cacheDisabled:true});await b.send('Storage.clearDataForOrigin',{origin:'http://localhost:4280',storageTypes:'all'});
if(kind==='phone'){await b.send('Emulation.setCPUThrottlingRate',{rate:4});await b.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750})}
await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__tasks=[];new PerformanceObserver(l=>{for(const e of l.getEntries())__tasks.push({at:e.startTime,ms:e.duration})}).observe({type:'longtask',buffered:true});function ready(){if(document.querySelector('[data-start]')){performance.mark('room-ready');return}requestAnimationFrame(ready)}requestAnimationFrame(ready)`});
await b.send('Page.addScriptToEvaluateOnNewDocument',{source:fs.readFileSync(root+'/native.js','utf8')});
await b.send('Tracing.start',{transferMode:'ReportEvents',traceConfig:{includedCategories:['devtools.timeline','disabled-by-default-devtools.timeline','v8.execute','blink.user_timing','loading','toplevel','disabled-by-default-v8.cpu_profiler','disabled-by-default-v8.cpu_profiler.hires']}});
await b.send('Profiler.enable');await b.send('Profiler.setSamplingInterval',{interval:100});await b.send('Debugger.enable');await b.send('Debugger.setAsyncCallStackDepth',{maxDepth:32});await b.send('Profiler.start');await b.go();
if(!await b.waitFor(`!!document.querySelector('[data-start]')`))throw Error('room did not render '+JSON.stringify(b.errors));
const result=await b.ev(`({ready:performance.getEntriesByName('room-ready')[0]?.startTime??performance.now(),paints:performance.getEntriesByType('paint').map(x=>x.toJSON()),tasks:__tasks,native:window.__native,parallelShader:!!document.querySelector('canvas').getContext('webgl2').getExtension('KHR_parallel_shader_compile'),start:!!document.querySelector('[data-start]')})`);
await b.shot(out+'/ready.png');await b.sleep(200);const cpu=(await b.send('Profiler.stop')).result.profile;const completed=new Promise(r=>done=r);await b.send('Tracing.end');await completed;
fs.writeFileSync(out+'/trace.json',JSON.stringify({traceEvents:trace}));fs.writeFileSync(out+'/cpu.cpuprofile',JSON.stringify(cpu));fs.writeFileSync(out+'/result.json',JSON.stringify({...result,errors:b.errors},null,2));console.log(name,kind,JSON.stringify({ready:result.ready,tasks:result.tasks,native:result.native?.filter(x=>x.ms>20).map(({name,at,ms,width,height})=>({name,at,ms,width,height}))}),b.errors);
}finally{b.close();clearTimeout(timer)}
