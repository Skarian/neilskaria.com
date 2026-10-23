import fs from 'node:fs';import {spawn} from 'node:child_process';import {repo,root} from './setup.mjs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export async function withServer(label,fn){const target=repo+'/.svelte-kit/output';if(target!=='C:/projects/neilskaria.com-roomday/.svelte-kit/output')throw Error('wrong path');fs.rmSync(target,{recursive:true,force:true});fs.cpSync(root+'/'+label+'-output',target,{recursive:true});const fd=fs.openSync(root+'/server-'+label+'.log','a');const p=spawn(process.execPath,[repo+'/node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4290','--strictPort'],{cwd:repo,stdio:['ignore',fd,fd],windowsHide:true});let exited=false;p.once('exit',()=>exited=true);try{let ready=false;for(let i=0;i<100&&!exited;i++){try{if((await fetch('http://localhost:4290/lab/boot')).ok){ready=true;break}}catch{}await sleep(200)}if(!ready)throw Error('server did not start');await fn();}finally{if(!exited){p.kill();await new Promise(r=>p.once('exit',r));}fs.closeSync(fd);}}
export async function child(file,args=[]){const p=spawn(process.execPath,[root+'/'+file,...args],{cwd:repo,stdio:'inherit',windowsHide:true});const code=await new Promise(r=>p.once('exit',r));if(code)throw Error('child '+file+' failed: '+code);}
if(process.argv[2]==='diagnose')for(let round=1;round<=3;round++)for(const label of(round%2?['diagA','diagOrder']:['diagOrder','diagA']))await withServer(label,()=>child('diagnose.mjs',[label,String(round)]));
if(process.argv[2]==='measure'){
for(let round=1;round<=4;round++)for(const device of(round<=2?['mobile','desktop']:['mobile']))for(const label of(round%2?['A','B','C']:['C','B','A']))await withServer(label,()=>child('lh.mjs',[label,device,String(round)]));
for(let round=1;round<=3;round++)for(const label of(round%2?['A','B','C']:['C','B','A']))await withServer(label,()=>child('phone.mjs',['http://localhost:4290/lab/boot',root+'/'+label+'/phone','phone',String(round)]));
}
if(process.argv[2]==='visual')for(const label of ['A','B','C'])await withServer('visual'+label,()=>child('visual.mjs',[label]));
if(process.argv[2]==='flush')for(let round=1;round<=3;round++)for(const label of(round%2?['diagA','diagFlush']:['diagFlush','diagA']))await withServer(label,()=>child('diagnose.mjs',[label,'flush'+round]));
if(process.argv[2]==='repeat')await withServer('visualA',()=>child('visual.mjs',['Arepeat']));
