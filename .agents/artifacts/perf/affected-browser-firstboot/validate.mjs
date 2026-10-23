import fs from 'node:fs';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {launch} from '../first-boot-replay-20261012/cdp.mjs';
const root=process.cwd(),out=path.resolve('.agents/artifacts/perf/affected-browser-firstboot');
const hosted=process.argv[2];
const baselineOnly=hosted==='baseline';
const checks=[];
const check=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});if(!pass)throw Error(name+' '+JSON.stringify(detail));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function session(name,profile,url,diagnostic=true){
  const b=await launch({url,profile,dir:out+'/profiles/'+name});const network=[],networkFailures=[],downloads=[],downloadProgress=[],metrics=[];
 try{
  await b.send('Network.enable');await b.send('Performance.enable');
  b.on(m=>{if(m.method==='Network.responseReceived')network.push({url:m.params.response.url,status:m.params.response.status});if(m.method==='Network.loadingFailed')networkFailures.push(m.params);if(m.method==='Browser.downloadWillBegin')downloads.push(m.params);if(m.method==='Browser.downloadProgress')downloadProgress.push(m.params);});
  const downloadDir=path.resolve('affected-firstboot-downloads.tmp',name);
  fs.mkdirSync(downloadDir,{recursive:true});
  await b.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloadDir,eventsEnabled:true});
  await b.go();
  check(name+' START available',await b.waitFor('document.querySelector("[data-start]") && !document.querySelector("[data-start]").disabled',60000),b.errors);
  await b.sleep(1800);
  if(diagnostic)check(name+' initial guide',await b.ev('document.querySelector("#firstboot-diagnostic").open'));
  async function click(expr){const p=await b.ev(`(()=>{const n=${expr};if(!n)throw Error('Missing target');const r=n.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===n}})()`);check(name+' target not intercepted',p.hit);await b.click(p.x,p.y);}
  await b.shot(out+'/'+name+'-room.png');
  const before=await b.send('Performance.getMetrics');
  for(let run=1;run<=2;run++){
   await click('document.querySelector("[data-start]")');
   if(diagnostic){check(name+' boot mode '+run,await b.waitFor(`__firstbootDiagnostic.snapshot().events.some(e=>e.kind==='mode'&&e.to==='booting'&&e.run===${run})`,4000));check(name+' guide hidden',await b.ev('getComputedStyle(document.querySelector("#firstboot-diagnostic")).display==="none"'));}
   await b.sleep(3400);await b.shot(out+'/'+name+'-boot-'+run+'.png');
   check(name+' site '+run,await b.waitFor('!document.documentElement.dataset.intro && document.body.innerText.includes("BACK TO THE ROOM")',16000));
   if(run===1){await b.sleep(500);await click('[...document.querySelectorAll("button")].find(n=>n.textContent.includes("BACK TO THE ROOM"))');check(name+' full return',await b.waitFor('document.querySelector("[data-start]") && !document.querySelector("[data-start]").disabled',12000));await b.sleep(1600);}
  }
  const after=await b.send('Performance.getMetrics');
  const metric=m=>Object.fromEntries(m.result.metrics.map(e=>[e.name,e.value]));
  const a=metric(after),p=metric(before);metrics.push({taskDurationSeconds:a.TaskDuration-p.TaskDuration,scriptDurationSeconds:a.ScriptDuration-p.ScriptDuration,layoutDurationSeconds:a.LayoutDuration-p.LayoutDuration,sequenceSeconds:a.Timestamp-p.Timestamp});
  if(diagnostic){
   const data=await b.ev('__firstbootDiagnostic.snapshot()');
   fs.writeFileSync(out+'/'+name+'-sample.json',JSON.stringify(data,null,2));
   check(name+' complete first/return/replay',Object.values(data.completion).every(Boolean),data.completion);
   check(name+' both run IDs',data.counts.runs===2);
   check(name+' all per-run markers',data.unobserved.every(e=>e.markers.length===0),data.unobserved);
   for(const run of [1,2])for(const phase of ['camera-before-power','activation','arrival','drop','colour-glint','fade'])check(name+' phase '+run+' '+phase,data.frames.some(f=>f.run===run&&f.phase===phase));
   check(name+' return window',data.frames.some(f=>f.mode==='returning'&&f.phase==='return'));
   check(name+' trusted original gestures',data.events.filter(e=>['START-gesture','BACK-gesture'].includes(e.kind)).length===3&&data.events.filter(e=>['START-gesture','BACK-gesture'].includes(e.kind)).every(e=>e.trusted));
   check(name+' bounded no dropped data',Object.entries(data.counts).filter(([k])=>k!=='runs').every(([,v])=>v===0));
   check(name+' no page errors',data.errors.length===0,data.errors);
   // The guide collapses before the first boot. Use its real summary to expose the download button.
   const summary=await b.ev('(()=>{const r=document.querySelector("#firstboot-diagnostic summary").getBoundingClientRect();return{x:r.x+10,y:r.y+r.height/2}})()');
   if(!await b.ev('document.querySelector("#firstboot-diagnostic").open'))await b.click(summary.x,summary.y);
   await click('document.querySelector("#diagnostic-download")');
   for(let i=0;i<100&&!downloadProgress.some(p=>p.state==='completed'||p.state==='canceled');i++)await b.sleep(200);
   check(name+' download event',downloads.length===1,downloads);
   check(name+' download completes',downloadProgress.some(p=>p.state==='completed'),downloadProgress);
   const dir=downloadDir,files=fs.readdirSync(dir).filter(p=>p===downloads[0]?.suggestedFilename);
   check(name+' filename',files.length===1&&/^first-boot-diagnostic-.*\.json$/.test(files[0]),files);
   const downloaded=JSON.parse(fs.readFileSync(dir+'/'+files[0],'utf8'));
   fs.mkdirSync(out+'/downloads/'+name,{recursive:true});fs.copyFileSync(dir+'/'+files[0],out+'/downloads/'+name+'/'+files[0]);
   check(name+' downloaded schema',downloaded.schemaVersion===1&&downloaded.sessionId===data.sessionId&&downloaded.completion.replay);
   await b.shot(out+'/'+name+'-download.png');
   if(!hosted){
    await click('[...document.querySelectorAll("button")].find(n=>n.textContent.includes("BACK TO THE ROOM"))');
    check(name+' controls return',await b.waitFor('document.querySelector("[data-start]")',12000));await b.sleep(1800);
    for(const [thing,pattern] of [['lantern','^(Kumiko|LanternPaper)'],['clock','^Clock']]){
     const point=await b.ev(`(()=>{const {scene,camera,THREE}=__boot;const box=new THREE.Box3();scene.traverse(o=>{if(o.isMesh&&new RegExp(${JSON.stringify(pattern)}).test(o.name))box.union(new THREE.Box3().setFromObject(o));});const p=box.getCenter(new THREE.Vector3()).project(camera);return{x:(p.x+1)/2*innerWidth,y:(1-p.y)/2*innerHeight};})()`);
     await b.click(point.x,point.y);check(name+' '+thing+' panel active',await b.waitFor('[...document.querySelectorAll(".panel")].some(p=>!p.inert)',6000));
     check(name+' guide hides for panel',await b.ev('getComputedStyle(document.querySelector("#firstboot-diagnostic")).display==="none"'));await b.sleep(1700);await b.shot(out+'/'+name+'-'+thing+'.png');
     await click('[...document.querySelectorAll(".panel:not([inert]) button")].find(n=>n.textContent.trim().toUpperCase().endsWith("BACK"))');await b.sleep(1700);
     check(name+' '+thing+' panel closes',await b.ev('[...document.querySelectorAll(".panel")].every(p=>p.inert)'));
    }
   }
  }
  check(name+' browser errors',b.errors.length===0,b.errors);
  const failures=network.filter(n=>n.status>=400);check(name+' asset responses',failures.every(n=>(!hosted||baselineOnly)&&n.url.endsWith('.glb.br')&&n.status===404),failures);
  check(name+' no network failures',networkFailures.length===0,networkFailures);
  fs.writeFileSync(out+'/'+name+'-validation.json',JSON.stringify({checks:checks.filter(c=>c.name.startsWith(name)),errors:b.errors,network,networkFailures,downloads,downloadProgress,metrics},null,2));
 }finally{b.close();}
}
let server;
try{
 if(!hosted||baselineOnly){
  const stage=baselineOnly?out+'/original-reference':out+'/source-stage';
  if(baselineOnly){const manifest=JSON.parse(fs.readFileSync(out+'/reference-manifest.json'));for(const e of manifest.files){const dest=stage+'/'+e.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,execFileSync('git',['show',manifest.revision+':'+e.path],{maxBuffer:50*1024*1024}));}}
  const config=out+'/'+(baselineOnly?'baseline':'local')+'-vite.config.ts';
  fs.writeFileSync(config,`import {mergeConfig} from 'vite';\nimport config from './${baselineOnly?'original-reference':'source-stage'}/vite.config';\nexport default mergeConfig(config,{server:{fs:{allow:${JSON.stringify([stage,root+'/node_modules'])}}}});\n`);
  server=spawn(process.execPath,[root+'/node_modules/vite/bin/vite.js','dev','--config',config,'--host','127.0.0.1','--port','4294','--strictPort'],{cwd:stage,windowsHide:true,stdio:'pipe'});
  let log='';server.stdout.on('data',d=>{log+=d;fs.writeFileSync(out+'/local-server.log',log);});server.stderr.on('data',d=>{log+=d;fs.writeFileSync(out+'/local-server.log',log);});
  for(let i=0;i<150&&!log.includes('Local:');i++)await sleep(200);if(!log.includes('Local:'))throw Error(log);
 }
 const url=hosted&&!baselineOnly?hosted:'http://127.0.0.1:4294/lab/boot';
 if(baselineOnly)await session('original-desktop','desktop',url,false);
 else {await session(hosted?'hosted-desktop':'local-desktop','desktop',url);await session(hosted?'hosted-phone':'local-phone','phone',url);}
 
 fs.writeFileSync(out+'/'+(hosted?'hosted':'local')+'-validation.json',JSON.stringify({checks},null,2));console.log(JSON.stringify({count:checks.length,passed:checks.every(c=>c.pass)}));
}catch(e){fs.writeFileSync(out+'/'+(hosted?'hosted':'local')+'-failed-validation-'+Date.now()+'.json',JSON.stringify({error:String(e),checks},null,2));throw e;}finally{server?.kill();}
