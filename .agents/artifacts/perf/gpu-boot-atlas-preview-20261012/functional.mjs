import fs from 'node:fs';import path from 'node:path';import {launch} from './cdp.mjs';
const out=path.resolve('.agents/artifacts/perf/gpu-boot-atlas-preview-20261012'),base=process.argv[2],results=[];
for(const mode of ['default','will-read-frequently','gpu-atlas']){
 const b=await launch({url:base+(mode==='default'?'':'?bootCanvas='+mode),profile:'phone',dir:out+'/profiles/functional-'+mode});
 try{await b.go();if(!await b.waitFor('document.querySelector("[data-start]") && !document.querySelector("[data-start]").disabled',60000))throw Error('START unavailable '+mode);
 await b.sleep(1800);await b.shot(out+'/functional-'+mode+'-room.png');
 const p=await b.ev('(()=>{const r=document.querySelector("[data-start]").getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()');await b.click(p.x,p.y);
 await b.sleep(6800);await b.shot(out+'/functional-'+mode+'-screen.png');
 if(!await b.waitFor('!document.documentElement.dataset.intro && document.body.innerText.includes("BACK TO THE ROOM")',16000))throw Error('Site unavailable '+mode);
 await b.shot(out+'/functional-'+mode+'-site.png');
 const d=await b.ev('__firstbootDiagnostic.snapshot()');if(d.experiment.mode!==mode||d.experiment.sourceId!=='canvas-control-93+gpu-atlas-failure-correction-20261012'||b.errors.length||d.errors.length)throw Error('Runtime '+mode);
 results.push({mode,sourceId:d.experiment.sourceId,firstBoot:d.completion.firstBoot,errors:b.errors,screenShotsExcludedFromTiming:true});
 }finally{b.close();}}
fs.writeFileSync(out+'/functional-screening.json',JSON.stringify({results,physicalAndroid:false},null,2));console.log(JSON.stringify(results));
