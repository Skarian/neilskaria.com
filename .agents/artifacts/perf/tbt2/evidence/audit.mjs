import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const root=process.env.TEMP+'/impl/diag';
const lh='C:/Users/Neil Skaria/AppData/Roaming/npm-cache/_npx/0f94ee7615faf582/node_modules/lighthouse/cli/index.js';
const browser='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';
const urls={ocio:'https://portfolio-ocio8fvn3-neil-skarias-projects.vercel.app/lab/boot',skip:'https://portfolio-btpbv3isb-neil-skarias-projects.vercel.app/lab/boot',current:'https://portfolio-g7mvf3h5t-neil-skarias-projects.vercel.app/lab/boot',base:'http://localhost:4260/lab/boot',stage4:'http://localhost:4261/lab/boot',proto:'http://localhost:4262/lab/boot'};
const modes={default:'--headless=new',gpu:'--headless=new --use-angle=d3d11 --enable-gpu',headed:'--use-angle=d3d11 --enable-gpu --window-position=-32000,-32000',warp:'--headless=new --use-angle=warp --enable-gpu',swift:'--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader',warpheaded:'--use-angle=warp --enable-gpu --window-position=-32000,-32000'};
modes.vulkan='--headless=new --use-angle=vulkan --enable-gpu';
modes.vulkanheaded='--use-angle=vulkan --enable-gpu --window-position=-32000,-32000';
export function summarize(lhr){
 const ids=['first-contentful-paint','largest-contentful-paint','total-blocking-time','speed-index','cumulative-layout-shift'];
 const weights=[10,25,30,10,25];
 const metrics=Object.fromEntries(ids.map((id,i)=>[id,{value:lhr.audits[id].numericValue,score:lhr.audits[id].score,pointsLost:weights[i]*(1-lhr.audits[id].score)}]));
 return {score:lhr.categories.performance.score*100,metrics,benchmark:lhr.environment.benchmarkIndex,ua:lhr.environment.hostUserAgent,observed:lhr.audits.metrics.details.items[0],lcp:lhr.audits['lcp-breakdown-insight']?.details,element:lhr.audits['largest-contentful-paint-element']?.details,longTasks:lhr.audits['long-tasks']?.details,warnings:lhr.runWarnings,errors:Object.entries(lhr.audits).filter(([k,v])=>v.errorMessage).map(([k,v])=>[k,v.errorMessage])};
}
export function audit(label,device,run,mode='gpu',url=urls[label],extra=[]){
 const dir=path.join(root,label);fs.mkdirSync(dir,{recursive:true});
 const file=path.join(dir,`lh-${device}-${run}-${mode}.json`);
 const args=[lh,url,'--only-categories=performance','--output=json',`--output-path=${file}`,'--quiet','--save-assets',`-GA=${file}-assets`,`--chrome-flags=${modes[mode]}`,...(device==='desktop'?['--preset=desktop']:[]),...extra];
 const start=Date.now();
 const r=spawnSync(process.execPath,args,{env:{...process.env,CHROME_PATH:browser},encoding:'utf8',timeout:240000,windowsHide:true});
 fs.writeFileSync(file+'.log',r.stdout+'\n'+r.stderr);
 if(r.status!==0)throw new Error(`audit failed ${file}: ${r.stderr}`);
 const lhr=JSON.parse(fs.readFileSync(file));const s=summarize(lhr);
 fs.writeFileSync(file+'.summary.json',JSON.stringify(s,null,2));
 console.log(JSON.stringify({label,device,run,mode,seconds:(Date.now()-start)/1000,score:s.score,metrics:s.metrics,benchmark:s.benchmark,warnings:s.warnings}));
 return s;
}
if(process.argv[2]==='calibrate')for(const mode of ['default','gpu','headed'])for(const device of ['mobile','desktop'])audit('ocio',device,'cal',mode);
if(process.argv[2]==='validcal')for(const mode of ['warp','swift','warpheaded'])for(const device of ['mobile','desktop'])audit('ocio',device,'cal',mode);
if(process.argv[2]==='hwcal')for(const mode of ['vulkan','vulkanheaded'])for(const device of ['mobile','desktop'])audit('ocio',device,'cal',mode);
if(process.argv[2]==='remote')for(let run=1;run<=3;run++)for(const device of ['mobile','desktop'])for(const label of (run%2?['ocio','skip','current']:['current','skip','ocio']))audit(label,device,run,process.argv[3]??'gpu');
if(process.argv[2]==='local')for(let run=1;run<=4;run++)for(const device of (run<=2?['mobile','desktop']:['mobile']))for(const label of(run%2?['base','stage4','proto']:['proto','stage4','base']))audit(label,device,run,process.argv[3]??'gpu');
