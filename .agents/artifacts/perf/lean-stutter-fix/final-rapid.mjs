import fs from 'node:fs';import{launch}from './lean-stutter-work.tmp/cdp.mjs';
const root='lean-stutter-work.tmp',results=[];
for(const rate of[1,4]){
 const b=await launch({url:'http://localhost:4292/lab/boot',dir:root+'/profiles/final-rapid-'+rate});
 try{
  await b.send('Emulation.setCPUThrottlingRate',{rate});await b.go();if(!await b.waitFor('window.__lean?.ready',60000))throw Error('not ready');await b.sleep(1500);
  for(let i=0;i<8;i++){
   const thing=i%2?'clock':'lantern',p=await b.ev(`__lean.project(${JSON.stringify(thing)})`);await b.click(p.x,p.y);await b.sleep(650);
   const back=await b.ev("(()=>{const r=document.querySelector('.panel:not([inert]) .back').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");await b.click(back.x,back.y);
   const exit=await b.ev("[...document.querySelectorAll('.panel')].filter(p=>getComputedStyle(p).visibility==='visible').flatMap(p=>p.getAnimations().map(a=>a.effect.getTiming())).filter(t=>t.duration===220)");if(!exit.length)throw Error('exit duration not 220');
   await b.sleep(70);const point=await b.ev(`__lean.project(${JSON.stringify(thing)})`),start=await b.ev('performance.now()');await b.click(point.x,point.y);
   const entry=await b.ev("document.querySelector('.panel:not([inert])').getAnimations().map(a=>a.effect.getTiming())");if(!entry.some(t=>t.duration===520&&t.delay===350))throw Error('entry timing not preserved');
   const childTimes=await b.ev("document.querySelector('.panel:not([inert])').getAnimations({subtree:true}).filter(a=>a instanceof CSSAnimation&&a.animationName.includes('gem-in')).map(a=>a.currentTime)");if(!childTimes.length||childTimes.some(t=>t>150))throw Error('child entry did not restart '+childTimes);
   await b.sleep(500);const values=await b.ev(`__lean.frames.filter(f=>f.focused===${JSON.stringify(thing)}&&f.t>=${start}).map(f=>f.blend)`);const falling=values.slice(1).filter((v,k)=>v<values[k]-1e-6).length;if(falling)throw Error('camera retreats');
   results.push({rate,i,thing,entry,exit,childTimes,falling});
   const q=await b.ev("(()=>{const r=document.querySelector('.panel:not([inert]) .back').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");await b.click(q.x,q.y);await b.sleep(1400);
  }
  if(b.errors.length)throw Error(b.errors[0]);
 }finally{b.close();}
}
fs.writeFileSync(root+'/final-rapid.json',JSON.stringify(results,null,2));console.log('PASS',results.length,'fixed-duration rapid reselections');
