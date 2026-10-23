import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {out,write} from './prepare.mjs';
import {launch} from './cdp.mjs';
const root=process.cwd(),work=out+'/check-work',port=4297,url='http://127.0.0.1:'+port+'/lab/boot',checks=[],cleanup=[],samples=[];
const check=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});if(!pass)throw Error(name+' '+JSON.stringify(detail))};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,[root+'/node_modules/vite/bin/vite.js','preview','--config',out+'/local-build.config.ts','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:work,windowsHide:true,stdio:'pipe'});
let log='';for(const stream of [server.stdout,server.stderr])stream.on('data',d=>{log+=d;fs.writeFileSync(out+'/local-server.log',log)});
try{
 for(let i=0;i<100&&!log.includes('Local:');i++)await sleep(200);
 check('server ready',log.includes('Local:'),log);
 for(const [name,query,expected] of [['explicit-default','?bootCanvas=default','default'],['candidate-default','','will-read-frequently'],['explicit-hint','?bootCanvas=will-read-frequently','will-read-frequently']]){
  const b=await launch({url:url+query,profile:'phone',dir:out+'/profiles/'+name});
  const network=[],failed=[];
  try{
   await b.send('Network.enable');await b.send('Network.setCacheDisabled',{cacheDisabled:true});await b.send('Network.setBypassServiceWorker',{bypass:true});
   b.on(m=>{if(m.method==='Network.responseReceived')network.push({url:m.params.response.url,status:m.params.response.status,fromDiskCache:m.params.response.fromDiskCache,fromServiceWorker:m.params.response.fromServiceWorker});if(m.method==='Network.loadingFailed')failed.push(m.params)});
   await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('boot-seen','1'); sessionStorage.setItem('room-place','room'); window.__contextCalls=[]; const original=HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext=function(...args){const result=original.apply(this,args); if(args[0]==='2d'&&this.width===960&&this.height===640)window.__contextCalls.push({argumentsLength:args.length,options:args[1]??null,width:this.width,height:this.height,attributes:result?.getContextAttributes?.()}); return result;};`});
   await b.go();
   check(name+' START ready',await b.waitFor('document.querySelector("[data-start]") && !document.querySelector("[data-start]").disabled',60000),b.errors);
   await b.sleep(300);
   const data=await b.ev('__firstbootDiagnostic.snapshot()'),calls=await b.ev('__contextCalls');write(name+'-sample.json',data);
   const storage=await b.ev('({local:{...localStorage},session:{...sessionStorage}})');
   const modeEvents=data.events.filter(e=>e.kind==='mode');
   check(name+' initial room',modeEvents.length===1&&modeEvents[0].from==='loading'&&modeEvents[0].to==='room',modeEvents);
   check(name+' no boots',data.counts.runs===0);
   check(name+' sourceId',data.sourceId==='lean-canvas-hint-candidate-20261013');
   check(name+' mode',data.experiment.mode===expected,data.experiment);
   check(name+' actual context call',calls.length===1&&calls[0].argumentsLength===(expected==='default'?1:2)&&(expected==='default'?calls[0].options===null:calls[0].options.willReadFrequently===true),calls);
   check(name+' actual context attrs',calls[0].attributes.willReadFrequently===(expected!=='default'),calls);
   check(name+' recorded attrs',data.experiment.contextAttributesStatus==='supported'&&data.experiment.contextAttributes.willReadFrequently===(expected!=='default'));
   check(name+' options omission',data.experiment.requestedContextOptionsOmitted===(expected==='default'));
   check(name+' mode and source label',await b.ev(`document.querySelector('#firstboot-diagnostic summary').textContent.includes('${expected}')&&document.querySelector('#firstboot-diagnostic summary').textContent.includes('lean-canvas-hint-candidate-20261013')`));
   check(name+' no atlas resources',network.every(n=>!/atlas|gpu-text/i.test(n.url)),network.filter(n=>/atlas|gpu-text/i.test(n.url)));
   check(name+' expected local model fallback',network.filter(n=>n.status>=400).every(n=>n.status===404&&/bedroom\.[\w-]+\.glb\.br$/.test(n.url))&&network.some(n=>n.status===200&&/bedroom\.[\w-]+\.glb$/.test(n.url))&&failed.length===0,{bad:network.filter(n=>n.status>=400),failed});
   check(name+' no errors',b.errors.length===0&&data.errors.length===0,{browser:b.errors,diagnostic:data.errors});
   check(name+' matched room storage',storage.local['boot-seen']==='1'&&storage.session['room-place']==='room',storage);
   check(name+' browser cache unused',network.every(n=>!n.fromDiskCache&&!n.fromServiceWorker));
   const time=kind=>data.events.find(e=>e.kind===kind)?.t;
   const startup={createToRoomReadyMs:time('room-ready')-time('create-room'),fontsReadyToRoomReadyMs:time('room-ready')-time('fonts-ready'),roomReadyToStartDomMs:time('START-DOM')-time('room-ready'),createToStartEntryCompleteMs:time('START-css-animation-complete')?time('START-css-animation-complete')-time('create-room'):null};
   samples.push({name,mode:expected,startup,storage,contextCalls:calls});write(name+'-sample.json',data);write(name+'-validation.json',{checks:checks.filter(c=>c.name.startsWith(name)),network,failed,storage,calls,startup});
   await b.shot(out+'/'+name+'-room.png');
  }finally{cleanup.push(await b.close())}
 }
 const b=await launch({url:url+'?bootCanvas=gpu-text',profile:'phone',dir:out+'/profiles/unsupported-atlas'});
 try{await b.go();check('atlas mode rejected',await b.waitFor(`document.body.innerText.includes('Unsupported bootCanvas mode: gpu-text') || false`,5000)||b.errors.some(e=>e.includes('Unsupported bootCanvas mode: gpu-text')),b.errors);write('unsupported-mode.json',{errors:b.errors});}finally{cleanup.push(await b.close())}
 write('startup-smoke.json',{checks,samples,scope:'One startup per supported URL. No boots or performance matrix. Fresh profiles, identical room storage, disabled browser cache and bypassed service workers. Order as listed. OS/font/driver caches remain shared. Local headless phone emulation is not affected-device acceptance.'});console.log(JSON.stringify({checks:checks.length,passed:checks.every(c=>c.pass),samples}));
}catch(e){write('startup-smoke-failed-'+Date.now()+'.json',{error:String(e),checks,samples});throw e}finally{const ended=new Promise(r=>server.once('exit',r));server.kill();await Promise.race([ended,sleep(5000)]);cleanup.push({serverPid:server.pid,exitCode:server.exitCode,signalCode:server.signalCode});write('cleanup.json',{processes:cleanup});write('cleanup-'+Date.now()+'.json',{processes:cleanup})}
