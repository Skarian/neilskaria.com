import fs from 'node:fs';import{launch}from './lean-stutter-work.tmp/cdp.mjs';
const root='lean-stutter-work.tmp';
for(const rate of[1,4]){
 const b=await launch({url:'http://localhost:4292/lab/boot',dir:`${root}/profiles/behavior-${rate}x`});
 const checks=[],actions=[];
 const check=(name,pass,data)=>{checks.push({name,pass:!!pass,data});if(!pass)throw Error(name+' '+JSON.stringify(data));};
 try{
  await b.send('Emulation.setCPUThrottlingRate',{rate});
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:"window.__obs={events:[],long:[],audio:[]};document.addEventListener('click',e=>__obs.events.push({t:performance.now(),target:e.target.tagName}),true);new PerformanceObserver(l=>__obs.long.push(...l.getEntries().map(e=>({t:e.startTime,d:e.duration})))).observe({type:'longtask',buffered:true});const Native=window.AudioContext;const Wrapper=function(options){const ctx=new Native(options);__obs.audio.push({kind:'create',t:performance.now(),gesture:navigator.userActivation.isActive,state:ctx.state});return ctx};Object.setPrototypeOf(Wrapper,Native);Wrapper.prototype=Native.prototype;window.AudioContext=Wrapper;const resume=Native.prototype.resume;Native.prototype.resume=function(){__obs.audio.push({kind:'resume',t:performance.now(),gesture:navigator.userActivation.isActive});return resume.call(this)};"});
  await b.go();check('room ready',await b.waitFor('window.__lean?.ready && document.querySelector("[data-start]")',60000));await b.sleep(1500);
  const hidden=await b.ev("[...document.querySelectorAll('.panel')].map(p=>({label:p.getAttribute('aria-label'),inert:p.inert,hidden:p.getAttribute('aria-hidden'),visibility:getComputedStyle(p).visibility,nodes:p.querySelectorAll('*').length,controls:p.querySelectorAll('button,input').length,animations:p.getAnimations({subtree:true}).map(a=>a.animationName)}))");
  check('inactive panels hidden and inert',hidden.length===2&&hidden.every(p=>p.inert&&p.hidden==='true'&&p.visibility==='hidden'),hidden);
  check('inactive child animations reset',hidden.every(p=>!p.animations.length),hidden);
  const focus=await b.ev("(()=>{const old=document.activeElement;const a=[...document.querySelectorAll('.panel button,.panel input')].map(n=>{n.focus();return document.activeElement===n});old?.focus();return a})()");check('inactive controls cannot focus',focus.every(v=>!v),focus);
  const ax=await b.send('Accessibility.getFullAXTree');const axNames=ax.result.nodes.filter(n=>!n.ignored).map(n=>n.name?.value||'');check('inactive panel names absent from accessibility',!axNames.includes('Pick a light')&&!axNames.includes('Clock radio'),axNames.filter(n=>/Lantern|light|radio|Stations/.test(n)));
  const before=await b.ev('({storage:{...localStorage},iframes:document.querySelectorAll("iframe").length,audio:__obs.audio})');check('preparation does not start a stream or save radio settings',before.iframes===0&&!before.storage.radio,before);
  async function select(thing,label,wait=1300){const p=await b.ev(`__lean.project(${JSON.stringify(thing)})`),start=await b.ev('performance.now()');await b.click(p.x,p.y);await b.sleep(wait);const state=await b.ev('__lean.state()');check(label+' reaches '+thing,state.focused===thing,state);actions.push({thing,label,start,end:await b.ev('performance.now()')});}
  async function back(wait=1400){const p=await b.ev("(()=>{const r=document.querySelector('.panel:not([inert]) .back').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");await b.click(p.x,p.y);await b.sleep(wait);}
  for(const thing of['lantern','clock']){await select(thing,'first');const aria=await b.ev("(()=>{const p=document.querySelector('.panel:not([inert])');return{label:p.getAttribute('aria-label'),hidden:p.getAttribute('aria-hidden'),selected:p.querySelectorAll('[aria-checked=true]').length}})()");check(thing+' selected panel accessible',aria.hidden==='false',aria);if(thing==='clock'){const v=await b.ev('(()=>{const n=document.querySelector(".panel:not([inert]) [aria-label=Volume]");n.focus();return Number(n.value)})()');await b.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await b.send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await b.sleep(100);const after=await b.ev('Number(document.querySelector(".panel:not([inert]) [aria-label=Volume]").value)');check('selected range responds to keyboard',after>v,{before:v,after});}await back();}
  const audio=await b.ev('__obs.audio');check('radio uses an active gesture',audio.some(a=>a.kind==='create'&&a.gesture)&&audio.some(a=>a.kind==='resume'&&a.gesture),audio);
  for(let i=0;i<8;i++){
   const thing=i%2?'clock':'lantern';await select(thing,'rapid-forward-'+i,650);await back(80);await select(thing,'rapid-reselect-'+i,450);
   const a=actions.at(-1);const values=await b.ev(`__lean.frames.filter(f=>f.focused===${JSON.stringify(thing)}&&f.t>=${a.start}&&f.t<=${a.end}).map(f=>f.blend)`);const falling=values.slice(1).filter((v,k)=>v<values[k]-1e-6).length;check('rapid reselection '+i+' blend does not retreat',falling===0,{falling,values});await back();
  }
  for(const thing of['cube','bonsai']){
   await select(thing,thing+' geometry');
   for(const [width,height]of[[412,915],[915,412],[1280,800]]){
    const count=await b.ev('__lean.ops.filter(o=>o.kind==="fit").length');await b.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await b.sleep(650);
    const data=await b.ev('({fit:__lean.fit(),count:__lean.ops.filter(o=>o.kind==="fit").length})');check(thing+' refits '+width+'x'+height,data.count>count&&data.fit.eye.every(Number.isFinite)&&data.fit.target.every(Number.isFinite),data);
   }await back();
  }
  await select('lantern','persistence');const p=await b.ev("(()=>{const r=document.querySelector('.panel:not([inert]) [aria-label=Candle]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");await b.click(p.x,p.y);await b.sleep(100);
  const saved=await b.ev('JSON.parse(localStorage.lantern)');check('selected lantern setting persists',saved.color==='#ff9d4a',saved);await back();
  const startPoint=await b.ev("(()=>{const r=document.querySelector('[data-start]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");await b.click(startPoint.x,startPoint.y);check('boot completes',await b.waitFor('__lean.state().mode==="site"',12000));
  const returnStart=await b.ev('performance.now()');const rp=await b.ev("(()=>{const n=[...document.querySelectorAll('button')].find(n=>n.textContent.includes('BACK TO THE ROOM'));const r=n.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");await b.click(rp.x,rp.y);check('boot-return completes',await b.waitFor('__lean.state().mode==="room"',7000));const returnEnd=await b.ev('performance.now()');
  const initial=await b.ev('({frames:__lean.frames,ops:__lean.ops,ready:__lean.ready,observer:__obs,panels:window.__panelPerf})');
  await b.go();check('reload ready',await b.waitFor('window.__lean?.ready && document.querySelector("[data-start]")',60000));await b.sleep(1500);await select('lantern','restored persistence');const selected=await b.ev('document.querySelector(".panel:not([inert]) [aria-label=Candle]").getAttribute("aria-checked")');check('saved lantern selection restored',selected==='true',selected);
  const final=await b.ev('({frames:__lean.frames,ops:__lean.ops,ready:__lean.ready,observer:__obs,panels:window.__panelPerf})');
  if(b.errors.length)throw Error(b.errors[0]);fs.writeFileSync(`${root}/behavior-${rate}x.json`,JSON.stringify({rate,checks,actions,returnStart,returnEnd,hidden,before,audio,initial,reload:final}));console.log('PASS',rate+'x',checks.length);
 }catch(e){fs.writeFileSync(`${root}/behavior-${rate}x-failed.json`,JSON.stringify({checks,actions,error:String(e),runtime:b.errors}));throw e;}finally{b.close();}
}
