import fs from 'node:fs';import{spawn,execFileSync}from 'node:child_process';
const root='lean-stutter-work.tmp';
const timing=process.argv[2]==='timing';
const final=process.argv[2]==='final';
const rounds=final?[['baseline',6],['candidate',4],['baseline',7]]:timing?[['baseline',4],['candidate',3],['baseline',5]]:[['baseline',1],['candidate',1],['baseline',2],['candidate',2],['baseline',3]];
for(const [variant,rep]of rounds){
 execFileSync(process.execPath,['lean-stutter-panel-stage.tmp.mjs',variant],{stdio:'inherit'});
 try{const log=execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build'],{encoding:'utf8',stdio:'pipe'});fs.writeFileSync(`${root}/panel-${variant}-${rep}-build.log`,log);}catch(e){const log=(e.stdout||'')+(e.stderr||'');fs.writeFileSync(`${root}/panel-${variant}-${rep}-build.log`,log);if(!log.includes("symlink '..\\![-]\\catchall.func'"))throw e;}
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4292','--strictPort'],{stdio:'pipe'});let output='';server.stdout.on('data',d=>output+=d);server.stderr.on('data',d=>output+=d);
 try{
  for(let i=0;i<40&&!output.includes('Local:');i++)await new Promise(r=>setTimeout(r,200));if(!output.includes('Local:'))throw Error('server '+output);
  let configs=timing?`4:clock:${variant}:${rep}`:`4:lantern:${variant}:${rep},4:clock:${variant}:${rep}`;
  if(timing&&variant==='candidate')configs+=`,4:lantern:${variant}:${rep}`;
  if(final||rep===1||(variant==='baseline'&&rep===2))configs+=`,1:lantern:${variant}:${rep},1:clock:${variant}:${rep}`;
  execFileSync(process.execPath,['lean-stutter-panel-run.tmp.mjs',configs],{stdio:'inherit'});
 }finally{server.kill();fs.writeFileSync(`${root}/panel-${variant}-${rep}-server.log`,output);}
}
