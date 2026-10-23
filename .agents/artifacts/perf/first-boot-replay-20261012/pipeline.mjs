import fs from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
const dir='.agents/artifacts/perf/first-boot-replay-20261012';
const requested=process.argv[2]||'orientation';
const rounds=requested==='orientation'?[['original','orientation-1x',1]]:requested==='pairs'?[['original','pair1-original',4],['candidate','pair1-candidate',4],['candidate','pair2-candidate',4],['original','pair2-original',4],['original','pair3-original',4],['candidate','pair3-candidate',4]]:requested==='control'?[['original','control-baseline',4,'','none'],['original','control-texture-init',4,'','texture-init'],['original','control-restoration',4,'','none']]:[['original','original-targeted',4,'trace']];
let staged='';
for(const [variant,name,rate,trace,control] of rounds){
 if(staged!==variant+':'+control){
  execFileSync(process.execPath,['first-boot-stage.tmp.mjs',variant,control||''],{stdio:'inherit'});
  try{fs.writeFileSync(dir+'/'+name+'-build.log',execFileSync(process.execPath,['../node_modules/vite/bin/vite.js','build'],{cwd:'first-boot-owned.tmp',encoding:'utf8',stdio:'pipe'}));}
  catch(e){const log=(e.stdout||'')+(e.stderr||'');fs.writeFileSync(dir+'/'+name+'-build.log',log);if(!log.includes('EPERM')||!log.includes('catchall.func'))throw e;}
  staged=variant+':'+control;
 }
 const server=spawn(process.execPath,['../node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4293','--strictPort'],{cwd:'first-boot-owned.tmp',stdio:'pipe',windowsHide:true});
 let output='';server.stdout.on('data',d=>output+=d);server.stderr.on('data',d=>output+=d);
 try{
  for(let i=0;i<80&&!output.includes('Local:');i++)await new Promise(r=>setTimeout(r,200));
  if(!output.includes('Local:'))throw Error(output);
  execFileSync(process.execPath,['first-boot-run.tmp.mjs',name,String(rate),trace||''],{stdio:'inherit'});
 }finally{server.kill();fs.writeFileSync(dir+'/'+name+'-server.log',output);}
}
