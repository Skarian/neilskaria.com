import fs from 'node:fs';import{launch}from './lean-stutter-work.tmp/cdp.mjs';
const root='lean-stutter-work.tmp',variant=process.argv[2];fs.mkdirSync(root+'/panel-appearance',{recursive:true});
const b=await launch({url:'http://localhost:4292/lab/boot',dir:root+'/profiles/panel-visual-'+variant});
const result=[];
try{
 await b.go();if(!await b.waitFor('window.__lean?.ready && document.querySelector("[data-start]")',60000))throw Error('not ready');await b.sleep(1500);
 for(const thing of['lantern','clock']){
  const p=await b.ev(`__lean.project(${JSON.stringify(thing)})`);await b.click(p.x,p.y);
  await b.sleep(400);
  const animation=await b.ev("(()=>{const p=document.querySelector('.panel:not([inert])');const a=p.getAnimations();for(const v of a)v.pause();return a.map(v=>({timing:v.effect.getTiming(),currentTime:v.currentTime,frames:v.effect.getKeyframes()}))})()");
  await b.shot(`${root}/panel-appearance/${thing}-${variant}-entry.png`);
  await b.ev("document.querySelector('.panel:not([inert])').getAnimations().forEach(a=>a.finish())");await b.sleep(1100);
  const rect=await b.ev("(()=>{const p=document.querySelector('.panel:not([inert])');const r=p.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})()");
  await b.shot(`${root}/panel-appearance/${thing}-${variant}-steady.png`,rect);
  const children=await b.ev("[...document.querySelector('.panel:not([inert])').getAnimations({subtree:true})].map(a=>({name:a.animationName,timing:a.effect.getTiming(),currentTime:a.currentTime}))");
  const back=await b.ev("(()=>{const r=document.querySelector('.panel:not([inert]) .back').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");await b.click(back.x,back.y);await b.sleep(100);
  const exit=await b.ev("[...document.querySelectorAll('.panel')].filter(p=>getComputedStyle(p).visibility==='visible').flatMap(p=>p.getAnimations().map(a=>({timing:a.effect.getTiming(),currentTime:a.currentTime,frames:a.effect.getKeyframes()})))");
  await b.shot(`${root}/panel-appearance/${thing}-${variant}-exit.png`);await b.sleep(1600);
  result.push({thing,rect,animation,children,exit});
 }
 if(b.errors.length)throw Error(b.errors[0]);fs.writeFileSync(`${root}/panel-appearance/${variant}.json`,JSON.stringify(result,null,2));
}finally{b.close();}
