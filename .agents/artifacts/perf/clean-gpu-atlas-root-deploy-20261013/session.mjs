// One owned headless Chrome, one continuous CDP page connection, full untimed functional flow, Browser.close.
// Usage: node session.mjs <kind desktop|phone> <baseUrl> <evidence subdir> <cdp port>
import fs from 'node:fs';import {spawn,execFileSync} from 'node:child_process';import {out,write,hash} from './common.mjs';
import {connect,sleep} from '../clean-gpu-atlas-validation-profile-20261013/cdp.mjs';
const [kind,base,sub,portArg]=process.argv.slice(2);const port=Number(portArg);
const dir=out+'/'+sub,profile=dir+'/profile',size=kind==='desktop'?{width:1280,height:800}:{width:390,height:844};
const coords=kind==='desktop'?{lantern:[840,230],radio:[470,414]}:{lantern:[255,300],radio:[135,415]};
if(fs.existsSync(dir))throw Error('fresh evidence dir required '+dir);fs.mkdirSync(dir,{recursive:true});
try{await fetch('http://127.0.0.1:'+port+'/json/version');throw Error('port occupied')}catch(e){if(String(e).includes('occupied'))throw e}
const args=['--headless=new','--enable-automation','--use-angle=vulkan','--enable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port='+port,'--user-data-dir='+profile,'about:blank'];
const child=spawn('C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',args,{windowsHide:true});let chromeLog='';child.stderr.on('data',d=>chromeLog+=d);
const journal=[],checks=[],events={exceptions:[],consoleErrors:[],failures:[],responses:[]};const result={kind,base,size,pid:child.pid,args,checks};
const log=(step,data={})=>{const r={step,at:new Date().toISOString(),...data};checks.push(r);console.log(JSON.stringify(r).slice(0,400));};
let page,browser;
try{
 let ver,targets;for(let i=0;i<100;i++){try{ver=await(await fetch('http://127.0.0.1:'+port+'/json/version')).json();targets=await(await fetch('http://127.0.0.1:'+port+'/json')).json();if(targets.some(t=>t.type==='page'))break}catch{}await sleep(200)}
 result.browserVersion=ver?.Browser;browser=await connect(ver.webSocketDebuggerUrl,journal,'browser');page=await connect(targets.find(t=>t.type==='page').webSocketDebuggerUrl,journal,kind);
 const origin=new URL(base).origin;
 page.on(m=>{const p=m.params;if(m.method==='Runtime.exceptionThrown')events.exceptions.push(p.exceptionDetails);
  if(m.method==='Runtime.consoleAPICalled'&&p.type==='error')events.consoleErrors.push(p.args.map(a=>a.value??a.description).join(' '));
  if(m.method==='Network.loadingFailed')events.failures.push({id:p.requestId,error:p.errorText,canceled:p.canceled,blocked:p.blockedReason});
  if(m.method==='Network.responseReceived')events.responses.push({id:p.requestId,url:p.response.url,status:p.response.status,encoding:Object.entries(p.response.headers).find(([k])=>k.toLowerCase()==='content-encoding')?.[1]??null,type:p.type});
  if(m.method==='Network.requestWillBeSent')events.responses.push({id:p.requestId,request:p.request.url});});
 await page.send('Page.enable');await page.send('Runtime.enable');await page.send('Network.enable');
 await page.send('Emulation.setDeviceMetricsOverride',{...size,deviceScaleFactor:1,mobile:false});
 await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const ids=new WeakMap();let next=1,seq=0;const id=e=>{if(!e)return null;if(!ids.has(e))ids.set(e,next++);return ids.get(e)};
  const s=window.__functionalSmoke={intro:[],clicks:[],errors:[],rejections:[],id,seq:()=>seq};
  document.addEventListener('introend',e=>{const t=e.target;s.intro.push({seq:++seq,el:id(t),tag:t.tagName,label:t.getAttribute('aria-label'),start:t.hasAttribute('data-start'),connected:t.isConnected,t:performance.now()})},true);
  document.addEventListener('click',e=>{const b=e.target.closest('button,a')||e.target;s.clicks.push({seq:++seq,trusted:e.isTrusted,el:id(b),tag:b.tagName,start:b.hasAttribute?.('data-start')||false,text:(b.textContent||'').trim().slice(0,80),t:performance.now()})},true);
  window.addEventListener('error',e=>s.errors.push(String(e.error||e.message)));window.addEventListener('unhandledrejection',e=>s.rejections.push(String(e.reason)));})();`});
 const ev=async expression=>{const r=await page.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=async(expression,ms=60000)=>{for(let end=Date.now()+ms;Date.now()<end;){const v=await ev(expression);if(v)return v;await sleep(100)}throw Error('wait timeout '+expression)};
 const png=async name=>{const r=await page.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const b=Buffer.from(r.data,'base64');fs.writeFileSync(dir+'/'+name+'.png',b);const shot={name:name+'.png',width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:hash(b)};(result.screenshots??=[]).push(shot);
  if(shot.width!==size.width||shot.height!==size.height)throw Error('viewport mismatch '+JSON.stringify(shot));fs.writeFileSync(dir+'/'+name+'-text.txt',await ev('document.body.innerText'));return shot;};
 const click=async(x,y)=>{for(const type of ['mouseMoved','mousePressed','mouseReleased'])await page.send('Input.dispatchMouseEvent',{type,x,y,button:type==='mouseMoved'?'none':'left',clickCount:type==='mouseMoved'?0:1});};
 const center=sel=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,id:__functionalSmoke.id(e),text:e.textContent.trim().slice(0,80),inViewport:r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth}})()`);
 const seqNow=()=>ev('__functionalSmoke.seq()');
 const lastClick=()=>ev('__functionalSmoke.clicks.at(-1)');
 // Current START button and ITS OWN introend recorded after `after`.
 const startReady=after=>wait(`(()=>{const b=document.querySelector('[data-start]');if(!b||sessionStorage.getItem('room-place')!=='room')return null;const id=__functionalSmoke.id(b);const rec=__functionalSmoke.intro.find(e=>e.start&&e.el===id&&e.seq>${after});return rec?{startId:id,introend:rec}:null})()`);
 const siteReady=()=>wait(`!document.documentElement.dataset.intro&&sessionStorage.getItem('room-place')==='page'&&!!document.querySelector('#boot-page')&&!document.querySelector('[data-start]')`).then(()=>ev('document.fonts.ready.then(()=>document.fonts.status)'));
 const panelReady=(label,after)=>wait(`(()=>{const a=document.querySelector('aside[aria-label=${JSON.stringify(label)}]');if(!a)return null;const id=__functionalSmoke.id(a);const rec=__functionalSmoke.intro.find(e=>e.el===id&&e.seq>${after});return rec?{panelId:id,introend:rec}:null})()`);
 const clickStart=async expectId=>{const c=await center('[data-start]');if(c.id!==expectId)throw Error('START identity changed before click');const s0=await seqNow();await click(c.x,c.y);const k=await wait(`__functionalSmoke.clicks.find(c=>c.seq>${s0})`);if(!k.trusted||k.el!==expectId||!k.start)throw Error('START click not trusted/on settled START '+JSON.stringify(k));return k;};
 const startIds=[];

 await page.send('Page.navigate',{url:base.replace(/\/$/,'')+'/lab/boot'});
 let ready=await startReady(0);startIds.push(ready.startId);await png('room');log('room-initial',ready);
 let k=await clickStart(ready.startId);log('start-click',{click:k});
 log('site',{fonts:await siteReady(),shot:await png('site')});
 const back=await center('#boot-page footer > button');if(!back||!/BACK TO THE ROOM/i.test(back.text))throw Error('BACK target wrong '+JSON.stringify(back));
 if(!back.inViewport){await ev(`document.querySelector('#boot-page footer > button').scrollIntoView({block:'center'})`);}
 const b2=await center('#boot-page footer > button');let s=await seqNow();await click(b2.x,b2.y);k=await lastClick();if(!k||k.seq<=s||!k.trusted||k.el!==b2.id)throw Error('BACK click not trusted on target '+JSON.stringify(k));
 ready=await startReady(k.seq);if(startIds.includes(ready.startId))throw Error('reused START');startIds.push(ready.startId);log('returned-room',{back:b2,click:k,...ready,shot:await png('returned-room')});
 // Coordinates are used only after a correct-viewport screenshot (returned-room above).
 s=await seqNow();await click(...coords.lantern);let p=await panelReady('Lantern',s);log('lantern-open',{at:coords.lantern,...p,shot:await png('lantern')});
 let c=await center('aside[aria-label="Lantern"] button.back');s=await seqNow();await click(c.x,c.y);k=await lastClick();if(!k.trusted||k.el!==c.id)throw Error('lantern BACK click '+JSON.stringify(k));
 await wait(`!document.querySelector('aside[aria-label="Lantern"]')`);ready=await startReady(k.seq);if(startIds.includes(ready.startId))throw Error('reused START');startIds.push(ready.startId);log('lantern-close',{click:k,...ready,shot:await png('lantern-closed-room')});
 s=await seqNow();await click(...coords.radio);p=await panelReady('Clock radio',s);
 const status=await wait(`(()=>{const v=document.querySelector('.station')?.dataset.status;return ['playing','blocked','offair','static'].includes(v)?v:null})()`,30000);
 const radioText=await ev(`document.querySelector('aside[aria-label="Clock radio"]').innerText`);
 log('radio-open',{at:coords.radio,...p,status,onAir:/ON AIR/.test(radioText),shot:await png('radio')});
 // BEFORE close: actual introend identities and sequence so far.
 const beforeClose={seq:await seqNow(),introends:await ev('__functionalSmoke.intro'),startIdsSoFar:[...startIds],startPresent:await ev(`!!document.querySelector('[data-start]')`)};log('radio-before-close',beforeClose);
 c=await center('aside[aria-label="Clock radio"] button.back');await click(c.x,c.y);k=await lastClick();if(!k.trusted||k.el!==c.id||k.seq<=beforeClose.seq)throw Error('radio BACK click '+JSON.stringify(k));
 await wait(`!document.querySelector('aside[aria-label="Clock radio"]')`);ready=await startReady(k.seq);
 const fresh=!startIds.includes(ready.startId)&&ready.introend.seq>k.seq&&!beforeClose.introends.some(e=>e.el===ready.startId);if(!fresh)throw Error('final START not fresh '+JSON.stringify(ready));startIds.push(ready.startId);
 log('radio-close',{closeClick:k,currentStart:ready,currentStartOwnIntroendAfterClose:fresh,shot:await png('final-room')});
 k=await clickStart(ready.startId);log('replay-start-click',{click:k,introendSeqBeforeClick:ready.introend.seq,ordered:ready.introend.seq<k.seq});
 log('replay-site',{fonts:await siteReady(),shot:await png('replay-site')});

 // Audit: diagnostics, bundles, model, PNG, failures.
 const audit=await ev(`(async()=>{const names=performance.getEntriesByType('resource').map(r=>r.name);const bundles=[],pngs=[];let model=null;
  for(const u of names.filter(u=>u.startsWith(location.origin))){if(/\\.js(\\?|$)/.test(u)){const t=await(await fetch(u)).text();bundles.push({url:u,bytes:t.length,forbidden:(t.match(/manualJSON|__external|atlasExperimental|atlas-experimental|diagnostic-recorder|downloadTrace|__functionalSmoke|renderSelector|showSaveFilePicker/g)||[])})}
   if(/\\.png(\\?|$)/.test(u)){const r=await fetch(u);const b=await r.arrayBuffer();pngs.push({url:u,status:r.status,bytes:b.byteLength,sha256:[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('')})}
   if(u.endsWith('.glb.br')){const r=await fetch(u);const b=await r.arrayBuffer();model={url:u,status:r.status,encoding:r.headers.get('content-encoding'),decodedBytes:b.byteLength,decodedSha256:[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('')}}}
  return{smoke:{intro:__functionalSmoke.intro,clicks:__functionalSmoke.clicks,errors:__functionalSmoke.errors,rejections:__functionalSmoke.rejections},
   globals:Object.keys(window).filter(k=>/atlas|diagnostic|recorder|manualJSON|picker|selector/i.test(k)&&!(typeof window[k]==='function'&&/\\{\\s*\\[native code\\]\\s*\\}$/.test(Function.prototype.toString.call(window[k])))),
   nativeBrowserGlobalsExcluded:Object.keys(window).filter(k=>/picker/i.test(k)&&typeof window[k]==='function'&&/\\[native code\\]/.test(Function.prototype.toString.call(window[k]))),resources:names,bundles,pngs,model,
   rawGlbRequested:names.some(u=>/\\.glb(\\?|$)/.test(u)),queryMode:location.search,
   diagnosticControls:[...document.querySelectorAll('input,select,button,a')].filter(e=>/manualJSON|diagnostic|record trace|download|atlas.experimental|atlas mode|renderer/i.test(e.outerHTML)).map(e=>e.outerHTML.slice(0,200))}})()`);
 const byId=new Map();for(const r of events.responses){byId.set(r.id,{...byId.get(r.id),...r});}
 const net=[...byId.values()];
 audit.modelNetwork=net.filter(r=>r.url?.endsWith('.glb.br'));
 audit.localHttpFailures=net.filter(r=>r.url?.startsWith(origin)&&r.status>=400).concat(events.failures.map(f=>({...f,url:byId.get(f.id)?.request})).filter(f=>f.url?.startsWith(origin)));
 audit.externalFailures=events.failures.map(f=>({...f,url:byId.get(f.id)?.request})).filter(f=>!f.url?.startsWith(origin));
 audit.externalHttpErrors=net.filter(r=>r.url&&!r.url.startsWith(origin)&&r.status>=400);
 audit.cdpExceptions=events.exceptions;audit.consoleErrors=events.consoleErrors;
 audit.forbiddenBundleHits=audit.bundles.filter(b=>b.forbidden.length);
 write(sub+'/audit.json',audit);
 result.summary={startIds,trustedClicks:audit.smoke.clicks.every(c=>c.trusted),clicks:audit.smoke.clicks.length,errors:audit.smoke.errors.length,rejections:audit.smoke.rejections.length,cdpExceptions:events.exceptions.length,
  localHttpFailures:audit.localHttpFailures.length,model:audit.model,modelNetwork:audit.modelNetwork,rawGlbRequested:audit.rawGlbRequested,atlasPngMatch:audit.pngs.some(p=>p.sha256==='e7eb731d0e0ddeaa44e3d5cf0c700e05211bd2a595a908c3eade1c36b2fafc6e'&&p.bytes===37034),
  pngs:audit.pngs,globals:audit.globals,diagnosticControls:audit.diagnosticControls,forbiddenBundleHits:audit.forbiddenBundleHits.length,externalFailures:audit.externalFailures.length,externalHttpErrors:audit.externalHttpErrors.length};
 result.pass=result.summary.trustedClicks&&!result.summary.errors&&!result.summary.rejections&&!result.summary.cdpExceptions&&!result.summary.localHttpFailures&&result.summary.model?.status===200&&result.summary.model?.decodedSha256==='4d83841d3b7892e9d4cdb0a2d47b574ccd30b58f52207575a6d91401a4861bf4'&&audit.modelNetwork.every(r=>!r.status||(r.status===200&&r.encoding==='br'))&&!result.summary.rawGlbRequested&&result.summary.atlasPngMatch&&!result.summary.globals.length&&!result.summary.diagnosticControls.length&&!result.summary.forbiddenBundleHits;
 log('audit',{pass:result.pass,summary:result.summary});
}catch(e){result.pass=false;result.fault=String(e.stack||e);console.error('FAULT',result.fault);try{await page?.send('Page.captureScreenshot',{format:'png'}).then(r=>fs.writeFileSync(dir+'/fault.png',Buffer.from(r.data,'base64')))}catch{}}
finally{
 let closeError=null;try{await browser?.send('Browser.close')}catch(e){closeError=String(e)}page?.close();browser?.close();
 for(let i=0;i<50&&child.exitCode===null&&child.signalCode===null;i++)await sleep(100);
 let forced=null;if(child.exitCode===null&&child.signalCode===null){
  const cmd=execFileSync('powershell.exe',['-NoProfile','-Command',`(Get-CimInstance Win32_Process -Filter "ProcessId=${child.pid}").CommandLine`]).toString();
  forced={pid:child.pid,commandLine:cmd.trim(),ownsProfile:cmd.includes(profile)};if(forced.ownsProfile){child.kill();await sleep(500);}}
 result.cleanup={closeError,exitCode:child.exitCode,signal:child.signalCode,forced};
 fs.writeFileSync(dir+'/chrome-stderr.log',chromeLog);fs.writeFileSync(dir+'/cdp-commands.json',JSON.stringify(journal,null,1));write(sub+'/result.json',result);console.log('DONE pass='+result.pass,JSON.stringify(result.cleanup));
}
