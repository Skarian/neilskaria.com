import {launch} from './cdp.mjs';import{writeFileSync}from'node:fs';
const out=process.env.TEMP+'/impl/stage4';const rows=[];
for(const kind of ['loading-skip','ready-skip','start-mid-landing','reduced-loading','reduced-first-visit']){
 const b=await launch({url:'http://localhost:4250/lab/boot?land=2',profile:'phone',dir:process.env.TEMP+'/impl/stage4/landing/actions-'+kind,storage:{'boot-muted':'1'}});
 try{
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__action={hydrated:false};document.addEventListener('boot-hydrated',()=>__action.hydrated=true);`});
  if(kind==='loading-skip'||kind==='reduced-loading')await b.send('Fetch.enable',{patterns:[{urlPattern:'*'+process.env.STAGE3_ENGINE,requestStage:'Request'}]});
  if(kind==='reduced-first-visit')await b.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  if(kind==='start-mid-landing')await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`new MutationObserver(()=>{const e=document.querySelector('[data-start]');if(e&&!__action.scheduled){__action.scheduled=true;setTimeout(()=>{const sp=__boot.scene.getObjectByName('SP');__action.before={active:__boot.landing?.active,y:sp.position.y,mode:__boot.mode};e.click();__action.after={active:__boot.landing?.active,y:sp.position.y,mode:__boot.mode};requestAnimationFrame(()=>__action.frame={active:__boot.landing?.active,y:sp.position.y,mode:__boot.mode})},80)}}).observe(document,{subtree:true,childList:true});`});
  await b.go();
  if(kind==='loading-skip'){
   if(!await b.waitFor('__action.hydrated',30000))throw Error('No hydration');
   await b.ev(`document.querySelector('[data-skip]').click()`);
   const hidden=await b.ev(`document.documentElement.dataset.intro===undefined`);
   await b.send('Fetch.disable');
   const prepared=await b.waitFor('__boot?.mode==="site"',45000);
   await b.ev(`[...document.querySelectorAll('button')].find(e=>e.textContent.includes('BACK TO THE ROOM'))?.click()`);
   const returned=await b.waitFor('__boot?.mode==="room" && !!document.querySelector("[data-start]")',15000);
   rows.push({kind,hidden,prepared,returned,errors:b.errors});
  }else if(kind==='ready-skip'){
   if(!await b.waitFor('__boot?.mode==="room"',45000))throw Error('No room');
   await b.sleep(1000);
   await b.send('Input.dispatchKeyEvent',{type:'keyDown',key:'m',code:'KeyM',windowsVirtualKeyCode:77});
   await b.send('Input.dispatchKeyEvent',{type:'keyUp',key:'m',code:'KeyM',windowsVirtualKeyCode:77});
   const sound=await b.ev(`document.querySelector('[aria-label="Sound"]').getAttribute('aria-checked')==='true'`);
   await b.ev(`document.querySelector('[data-skip]').click()`);
   const skipped=await b.ev(`__boot.mode==='site'&&document.documentElement.dataset.intro===undefined&&!__boot.landing?.active`);
   await b.ev(`[...document.querySelectorAll('button')].find(e=>e.textContent.includes('BACK TO THE ROOM'))?.click()`);
   const returned=await b.waitFor('__boot?.mode==="room"',15000);
   await b.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
   await b.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
   const escaped=await b.ev(`__boot.mode==='site'&&document.documentElement.dataset.intro===undefined`);
   rows.push({kind,sound,skipped,returned,escaped,errors:b.errors});
  }else if(kind==='start-mid-landing'){
   if(!await b.waitFor('__action.frame',45000))throw Error('No START');
   const booted=await b.waitFor('__boot.mode==="site"',15000);
   rows.push({kind,...await b.ev('__action'),booted,errors:b.errors});
  }else if(kind==='reduced-loading'){
   await b.waitFor('__action.hydrated',30000);
   await b.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
   await b.send('Fetch.disable');
   if(!await b.waitFor('__boot?.mode==="room"',45000))throw Error('No room');
   rows.push({kind,...await b.ev(`({landing:__boot.landing,y:__boot.scene.getObjectByName('SP').position.y,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches})`),errors:b.errors});
  }else{
   await b.waitFor('__action.hydrated',30000);await b.sleep(1500);
   rows.push({kind,...await b.ev(`({page:document.documentElement.dataset.intro===undefined,loaded:!!window.__boot,layer:getComputedStyle(document.querySelector('.room-layer')).display})`),errors:b.errors});
  }
  console.log(JSON.stringify(rows.at(-1)));
 }finally{b.close()}
}
writeFileSync(out+'/actions.json',JSON.stringify(rows,null,2));process.exit(0);
