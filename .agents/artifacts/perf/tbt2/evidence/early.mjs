import {launch} from './cdp.mjs';import {writeFileSync} from 'node:fs';
const out=process.env.TEMP+'/impl/tbt2';
const results=[];
for(const kind of ['tap','escape','tap-repeat']){
const b=await launch({url:'http://localhost:4280/lab/boot',profile:'phone',dir:process.env.TEMP+'/impl/tbt2/early-profile-'+kind});
try{
 await b.send('Network.enable');await b.send('Network.setCacheDisabled',{cacheDisabled:true});
 await b.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:94000});
 await b.send('Emulation.setCPUThrottlingRate',{rate:4});
 // Hold only external scripts until input, to isolate the server-rendered escape path.
 await b.send('Fetch.enable',{patterns:[{resourceType:'Script',requestStage:'Request'}]});
 await b.send('Runtime.addBinding',{name:'readyToTap'});
 let resolveReady;const ready=new Promise(r=>resolveReady=r);
 b.on(m=>{if(m.method==='Runtime.bindingCalled'&&m.params.name==='readyToTap')resolveReady(JSON.parse(m.params.payload));});
 await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`let dustSeed=11;window.__dustRandom=()=>{dustSeed=(Math.imul(dustSeed,1664525)+1013904223)>>>0;return dustSeed/4294967296};window.__test={hydrated:false,flashes:[]};document.addEventListener('boot-hydrated',()=>__test.hydrated=true);new MutationObserver(()=>{if(!__test.input)return;if(document.documentElement.dataset.intro)__test.flashes.push(performance.now());else if(__test.hideMs===undefined){__test.hideMs=performance.now()-__test.input;__test.hiddenAfterHandler=getComputedStyle(document.querySelector('.room-layer')).display==='none'}}).observe(document,{subtree:true,childList:true,attributes:true});function measure(e){if(__test.input)return;if((e.type==='keydown'&&e.key!=='Escape')||(e.type!=='keydown'&&!e.target.closest('[data-skip]')))return;__test.input=performance.now();__test.beforeHydration=!__test.hydrated;requestAnimationFrame(()=>{__test.frameMs=performance.now()-__test.input;__test.hiddenAtFrame=getComputedStyle(document.querySelector('.room-layer')).display==='none';__test.headingAtFrame=!!document.querySelector('h1')})}window.addEventListener('pointerdown',measure,true);window.addEventListener('click',measure,true);window.addEventListener('keydown',measure,true);function painted(){const e=document.querySelector('[data-skip]');if(e&&getComputedStyle(e).borderRadius==='999px'&&getComputedStyle(document.querySelector('.room-layer')).position==='fixed'){__test.styled=performance.now();setTimeout(()=>{const r=e.getBoundingClientRect();readyToTap(JSON.stringify({at:performance.now(),x:r.x+r.width/2,y:r.y+r.height/2,hydrated:__test.hydrated}))},100)}else requestAnimationFrame(painted)}requestAnimationFrame(painted);`});
 await b.go();const at=await Promise.race([ready,b.sleep(15000).then(()=>{throw Error('No usable SSR SKIP '+b.errors.join(';'))})]);console.log('ready',kind,at);
 if(kind==='escape'){await b.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await b.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27})}
 else{await b.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:at.x,y:at.y}]});await b.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
 if(!await b.waitFor('__test.hiddenAtFrame',10000))throw Error('Not hidden '+JSON.stringify(await b.ev('__test')));
 await b.shot(out+'/early-'+kind+'.png');await b.send('Fetch.disable');
 const back=await b.waitFor(`[...document.querySelectorAll('button')].some(e=>e.textContent.includes('BACK TO THE ROOM'))`,60000);
 const data=await b.ev(`({...__test,seen:localStorage.getItem('boot-seen'),place:sessionStorage.getItem('room-place'),intro:document.documentElement.dataset.intro??null})`);
 await b.ev(`[...document.querySelectorAll('button')].find(e=>e.textContent.includes('BACK TO THE ROOM'))?.click()`);
 const returned=await b.waitFor(`document.querySelector('[data-start]')&&document.documentElement.dataset.intro==='play'`,15000);
 const row={kind,ready:at,...data,back,returned,errors:b.errors};results.push(row);console.log(JSON.stringify(row));
}finally{b.close()}
}
writeFileSync(out+'/early-skip.json',JSON.stringify(results,null,2));process.exit(0);



