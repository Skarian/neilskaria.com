import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const out=path.resolve('.agents/artifacts/perf/clean-canvas-hint-preview-20261013');
const vc=path.join(process.env.APPDATA,'npm/node_modules/vercel/dist/vc.js');
const operation=process.argv[2]||'deploy',target=process.argv[3];
const args=operation==='deploy'?['deploy','--project','QmTWQ3SUZhG8FUnLimk8779iei8nabQuJet46c36dPowRw','--scope','neil-skarias-projects','--target','preview','--yes','--logs']:['inspect',target,'--scope','neil-skarias-projects'];
if(operation==='deploy'&&fs.existsSync(out+'/deployment-dispatch.json'))throw Error('Existing dispatch. Inspect it before retrying.');
const child=spawn(process.execPath,[vc,...args],{cwd:out+'/source-stage',stdio:'pipe',windowsHide:true});
let log='';const onData=d=>{log+=d.toString();fs.writeFileSync(out+'/'+operation+'.log',log);if(operation==='deploy'){const urls=[...log.matchAll(/https:\/\/(portfolio-[a-z0-9]+-neil-skarias-projects\.vercel\.app)/g)].map(m=>m[0]);const id=log.match(/\bdpl_[A-Za-z0-9]+/);if(urls.length)fs.writeFileSync(out+'/deployment-dispatch.json',JSON.stringify({url:urls[0],id:id?.[0],target:'preview',project:'portfolio',scope:'neil-skarias-projects',dispatchedAt:new Date().toISOString()},null,2));}};
child.stdout.on('data',onData);child.stderr.on('data',onData);
const code=await new Promise(r=>child.on('close',r));console.log(log.slice(-9000));process.exitCode=code;

