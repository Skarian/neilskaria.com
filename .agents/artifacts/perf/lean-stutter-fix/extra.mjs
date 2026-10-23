import fs from 'node:fs';import{launch}from './lean-stutter-work.tmp/cdp.mjs';
const root='lean-stutter-work.tmp';const results=[];
for(const kind of['reduced','fallback','background-return']){
 const b=await launch({url:'http://localhost:4292/lab/boot'+(kind==='fallback'?'?late-panels':''),dir:root+'/profiles/'+kind,storage:kind==='background-return'?{'boot-seen':'1'}:null});
 try{
  if(kind==='reduced')await b.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await b.go();
  if(kind==='reduced'){
   if(!await b.waitFor('document.querySelector("#boot-page")',10000))throw Error('page missing');await b.sleep(2000);
   const state=await b.ev("({intro:document.documentElement.dataset.intro,panels:document.querySelectorAll('.panel').length,ready:!!window.__lean?.ready})");if(state.intro||state.panels||state.ready)throw Error('reduced motion '+JSON.stringify(state));results.push({kind,pass:true,state});
  }else{
   if(!await b.waitFor('window.__lean?.ready',60000))throw Error('room not ready');await b.sleep(1500);
   if(kind==='background-return'){
    const before=await b.ev('({state:__lean.state(),panels:window.__panelPerf,rects:[...document.querySelectorAll(".panel")].map(p=>({width:p.getBoundingClientRect().width,height:p.getBoundingClientRect().height}))})');
    const p=await b.ev("(()=>{const n=[...document.querySelectorAll('button')].find(n=>n.textContent.includes('BACK TO THE ROOM'));const r=n.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");const start=await b.ev('performance.now()');await b.click(p.x,p.y);if(!await b.waitFor('__lean.state().mode==="room"',7000))throw Error('background return failed');
    const data=await b.ev(`({frames:__lean.frames.filter(f=>f.t>=${start}),state:__lean.state()})`);results.push({kind,pass:true,before,start,...data});
   }else{
    const count=await b.ev('document.querySelectorAll(".panel").length');if(count)throw Error('fallback already prepared');
   }
   for(const thing of['lantern','clock']){
    const p=await b.ev(`__lean.project(${JSON.stringify(thing)})`);await b.click(p.x,p.y);await b.sleep(1300);const state=await b.ev('__lean.state()');if(state.focused!==thing)throw Error('fallback '+thing);
    const visibility=await b.ev("(()=>{const p=document.querySelector('.panel:not([inert])');return{label:p.getAttribute('aria-label'),visible:getComputedStyle(p).visibility,hidden:p.getAttribute('aria-hidden')}})()");
    results.push({kind,thing,pass:visibility.visible==='visible'&&visibility.hidden==='false',state,visibility});
    const back=await b.ev("(()=>{const r=document.querySelector('.panel:not([inert]) .back').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");await b.click(back.x,back.y);await b.sleep(1600);
   }
   await b.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});const p=await b.ev('__lean.project("lantern")');await b.click(p.x,p.y);await b.sleep(900);
   const animations=await b.ev("document.querySelector('.panel:not([inert])').getAnimations({subtree:true}).filter(a=>a.animationName).map(a=>a.animationName)");if(animations.length)throw Error('reduced child animations');results.push({kind,check:'reduced child entries',pass:true,animations});
  }
  if(b.errors.length)throw Error(b.errors[0]);
 }finally{b.close();}
}
fs.writeFileSync(root+'/extra-checks.json',JSON.stringify(results,null,2));console.log('PASS',results.map(r=>({kind:r.kind,thing:r.thing,check:r.check,pass:r.pass})));
