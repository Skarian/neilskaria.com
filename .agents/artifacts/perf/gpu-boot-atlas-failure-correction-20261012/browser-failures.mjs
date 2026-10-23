import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';import {launch} from './cdp.mjs';
const root=process.cwd(),out=path.resolve('.agents/artifacts/perf/gpu-boot-atlas-failure-correction-20261012'),stage=path.resolve('.agents/artifacts/perf/gpu-boot-atlas-prototype-20261012/source-stage');
const config=out+'/failure-vite.config.ts';fs.writeFileSync(config,`import {mergeConfig} from 'vite';import config from '../gpu-boot-atlas-prototype-20261012/source-stage/vite.config.ts';export default mergeConfig(config,{server:{fs:{allow:${JSON.stringify([stage,root+'/node_modules'])}}}});`);
const server=spawn(process.execPath,[root+'/node_modules/vite/bin/vite.js','dev','--config',config,'--host','127.0.0.1','--port','4301','--strictPort'],{cwd:stage,windowsHide:true,stdio:'pipe'});let log='';for(const stream of [server.stdout,server.stderr])stream.on('data',d=>{log+=d;fs.writeFileSync(out+'/failure-server.log',log);});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),results=[];
try{
for(let i=0;i<150&&!log.includes('Local:');i++)await sleep(200);if(!log.includes('Local:'))throw Error(log);
const transformed=await (await fetch('http://127.0.0.1:4301/src/lib/boot/engine.ts')).text();const moduleUrl=transformed.match(/import \* as THREE from "([^"]+)"/)[1];
for(const mode of ['404','network','corrupt']){
 const b=await launch({url:'http://127.0.0.1:4301/lab/boot?bootCanvas=gpu-atlas',profile:'phone',dir:out+'/failure-profiles/'+mode});
 try{
 const injection=`(()=>{
 const p=window.__failureProbe={unhandled:[],consoleErrors:[],dispose:{},gl:{},contexts:[],bitmaps:[],atlasRequests:0,workers:0};
 addEventListener('unhandledrejection',e=>p.unhandled.push(String(e.reason)));
 const ce=console.error;console.error=(...args)=>{p.consoleErrors.push(args.map(String).join(' '));ce(...args);};
 const audio=window.AudioContext;window.AudioContext=class extends audio {constructor(...args){super(...args);p.contexts.push(this);}};
 const worker=window.Worker;window.Worker=class extends worker {terminate(){p.workers++;return super.terminate();}};
 for(const name of ['createBuffer','createTexture','createProgram','deleteTexture','deleteBuffer','deleteProgram','deleteFramebuffer']){const fn=WebGL2RenderingContext.prototype[name];WebGL2RenderingContext.prototype[name]=function(...args){p.gl[name]=(p.gl[name]||0)+1;return fn.apply(this,args);};}
 const ext=WebGL2RenderingContext.prototype.getExtension;WebGL2RenderingContext.prototype.getExtension=function(name){const x=ext.call(this,name);if(name==='WEBGL_lose_context'&&x&&!x.__wrapped){x.__wrapped=true;const lose=x.loseContext.bind(x);x.loseContext=()=>{p.gl.contextLoss=(p.gl.contextLoss||0)+1;lose();setTimeout(()=>p.gl.isContextLost=this.isContextLost(),100);};}return x;};
 const decode=window.createImageBitmap;window.createImageBitmap=async(...args)=>{const bm=await decode(...args);const record={closed:false};p.bitmaps.push(record);const close=bm.close.bind(bm);bm.close=()=>{record.closed=true;close();};return bm;};
 const fetcher=window.fetch;window.fetch=async(...args)=>{
 if(String(args[0])==='/boot-atlas.png'){
 p.atlasRequests++;
 const THREE=await import(${JSON.stringify(moduleUrl)});
 for(const name of ['Texture','Material','BufferGeometry','WebGLRenderTarget']){const fn=THREE[name].prototype.dispose;THREE[name].prototype.dispose=function(...args){p.dispose[name]=(p.dispose[name]||0)+1;return fn.apply(this,args);};}
 if(${JSON.stringify(mode)}==='404')return new Response('',{status:404});
 if(${JSON.stringify(mode)}==='network')throw Error('Injected atlas fetch rejection');
 return new Response('invalid png bytes',{status:200});
 }
 return fetcher(...args);
 };
})();`;
 await b.send('Page.addScriptToEvaluateOnNewDocument',{source:injection});await b.go();
 if(!await b.waitFor('window.__firstbootDiagnostic?.snapshot().events.some(e=>e.kind==="room-initialization-disposed")',60000))throw Error('Cleanup marker missing '+mode+' '+JSON.stringify(b.errors));
 await b.sleep(300);
 const data=await b.ev(`(()=>{const d=__firstbootDiagnostic.snapshot(),p=__failureProbe;return {probe:{...p,contexts:p.contexts.map(c=>c.state)},data:d,intro:document.documentElement.dataset.intro??null,startEnabled:!!document.querySelector('[data-start]:not(:disabled)'),trailCanvases:document.querySelectorAll('canvas').length};})()`);
 const {probe:p,data:d}=data;
 const assertions={noUnhandled:p.unhandled.length===0,normalIntroError:p.consoleErrors.length===1&&p.consoleErrors[0].includes('The room failed to load'),failedReadiness:d.events.some(e=>e.kind==='atlas-readiness-failed'),cleanup:d.events.some(e=>e.kind==='room-initialization-failed')&&d.events.some(e=>e.kind==='room-initialization-disposed'),noFakeReady:!d.events.some(e=>['atlas-ready','assets-prepared','room-ready'].includes(e.kind)),noCompletion:Object.values(d.completion).every(v=>!v),noAtlasRequestUpload:d.experiment.textureCounts.atlas.requests===0&&d.experiment.textureCounts.atlas.submissions===0,oneFetch:p.atlasRequests===1,resourcesDisposed:p.dispose.Texture>0&&p.dispose.Material>0&&p.dispose.BufferGeometry>0&&p.dispose.WebGLRenderTarget>0,rendererDisposed:p.gl.deleteTexture>0&&p.gl.deleteProgram>0&&p.gl.contextLoss===1&&p.gl.isContextLost===true,audioClosed:p.contexts.length===1&&p.contexts.every(s=>s==='closed'),bitmapsClosed:p.bitmaps.length>0&&p.bitmaps.every(r=>r.closed),workerTerminated:p.workers>0,introHidden:data.intro===null,startUnavailable:!data.startEnabled,trailRemoved:data.trailCanvases===1};
 const result={mode,moduleUrl,assertions,pass:Object.values(assertions).every(Boolean),browserErrors:b.errors,...data};results.push(result);fs.writeFileSync(out+'/browser-failure-'+mode+'.json',JSON.stringify(result,null,2));if(!result.pass)throw Error('Failure assertions '+JSON.stringify(assertions));
 }finally{b.close();}
}
fs.writeFileSync(out+'/browser-failures.json',JSON.stringify({scope:'Real staged createRoom through BootIntro. Only atlas fetch response/rejection is injected. Prototype and WebGL observers measure disposal calls, not allocator reclamation.',results:results.map(r=>({mode:r.mode,pass:r.pass,assertions:r.assertions}))},null,2));console.log(JSON.stringify({tests:results.length,pass:results.every(r=>r.pass)}));
}catch(e){fs.writeFileSync(out+'/browser-failed-'+Date.now()+'.json',JSON.stringify({error:String(e),results},null,2));throw e;}finally{server.kill();}
