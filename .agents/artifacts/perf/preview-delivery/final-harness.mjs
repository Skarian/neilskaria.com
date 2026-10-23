import fs from 'node:fs';import path from 'node:path';import{launch}from '../lean-stutter-fix/cdp.mjs';
const out=path.resolve('.agents/artifacts/perf/preview-delivery'),url='https://portfolio-k0w0vbifj-neil-skarias-projects.vercel.app/lab/boot';
const b=await launch({url,dir:out+'/final-profile'}),checks=[];
const check=(name,pass)=>{checks.push({name,pass:!!pass});};
try{
 await b.go();check('room ready',await b.waitFor('document.querySelector("[data-start]") && !document.querySelector("[data-start]").disabled',60000));await b.sleep(1500);
 check('no diagnostic browser globals',await b.ev('["__lean","__panelPerf","__boot","__camera"].every(k=>!(k in window))'));
 const p=await b.ev('(()=>{const r=document.querySelector("[data-start]").getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()');await b.click(p.x,p.y);
 await b.sleep(3300);await b.shot(out+'/desktop-boot-glyph-1.png');await b.sleep(800);await b.shot(out+'/desktop-boot-glyph-2.png');await b.sleep(800);await b.shot(out+'/desktop-boot-glyph-3.png');
 check('boot completes',await b.waitFor('!document.documentElement.dataset.intro && document.body.innerText.includes("BACK TO THE ROOM")',12000));
 const r=await b.ev('(()=>{const n=[...document.querySelectorAll("button")].find(n=>n.textContent.includes("BACK TO THE ROOM"));const r=n.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()');await b.click(r.x,r.y);
 check('return to room after transition',await b.waitFor('document.querySelector("[data-start]") && !document.querySelector("[data-start]").disabled',12000));await b.sleep(2500);await b.shot(out+'/desktop-return-room.png');
 check('return inactive panels',await b.ev('[...document.querySelectorAll(".panel")].every(p=>p.inert)'));
 console.log(JSON.stringify({checks,errors:b.errors}));fs.writeFileSync(out+'/final-smoke.json',JSON.stringify({checks,errors:b.errors},null,2));
}finally{b.close();}
