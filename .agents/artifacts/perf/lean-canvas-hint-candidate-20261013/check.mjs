import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {out,stage,parent,hash,list,write} from './prepare.mjs';
const root=process.cwd(),files=['src/lib/boot/context-control.ts','src/lib/boot/diagnostic.ts'];
const run=(name,args,cwd=stage)=>{try{const log=execFileSync(process.execPath,args,{cwd,encoding:'utf8',stdio:'pipe',windowsHide:true,maxBuffer:20*1024*1024});fs.writeFileSync(out+'/'+name+'.log',log);console.log(name+' PASS')}catch(e){fs.writeFileSync(out+'/'+name+'-failed.log',(e.stdout||'')+(e.stderr||''));throw e}};
run('format',[root+'/node_modules/prettier/bin/prettier.cjs','--write',...files]);
run('format-check',[root+'/node_modules/prettier/bin/prettier.cjs','--check',...files]);
const manifest=JSON.parse(fs.readFileSync(parent+'/source-manifest.json'));
write('file-hashes.json',manifest.files.map(e=>({path:e.path,beforeSha256:e.sha256,afterSha256:hash(fs.readFileSync(stage+'/'+e.path)),changed:e.sha256!==hash(fs.readFileSync(stage+'/'+e.path))})));
write('source-manifest.json',{reference:manifest.reference,cameraFix:'042dc805',sourceId:'lean-canvas-hint-candidate-20261013',target:'review-only-no-deployment',files:list(stage).map(p=>({path:p,bytes:fs.statSync(stage+'/'+p).size,sha256:hash(fs.readFileSync(stage+'/'+p))}))});
let diff='';for(const p of files){try{diff+=execFileSync('git',['--no-optional-locks','diff','--no-index','--',parent+'/source-stage/'+p,stage+'/'+p],{encoding:'utf8'})}catch(e){if(e.status!==1)throw e;diff+=e.stdout}}
fs.writeFileSync(out+'/diagnostic-preview.diff',diff);
const work=out+'/check-work';if(fs.existsSync(work))throw Error('Check workspace exists');
for(const p of list(stage)){fs.mkdirSync(path.dirname(work+'/'+p),{recursive:true});fs.copyFileSync(stage+'/'+p,work+'/'+p)}
run('sync',[root+'/node_modules/@sveltejs/kit/svelte-kit.js','sync'],work);
run('types',[root+'/node_modules/svelte-check/bin/svelte-check','--tsconfig','./tsconfig.json'],work);
run('build',[root+'/node_modules/vite/bin/vite.js','build'],work);
run('precompress',[work+'/scripts/precompress.mjs'],work);
write('check-result.json',{format:true,types:true,build:true,precompress:true,sourceFileCount:list(stage).length,buildWorkspace:work,dependencies:'Existing root node_modules. No install or package change.'});
let cdp=fs.readFileSync('.agents/artifacts/perf/first-boot-replay-20261012/cdp.mjs','utf8');
cdp=cdp.replace("'about:blank']);","'about:blank'], {windowsHide:true});");
cdp=cdp.replace('P, send, ev, sleep, errors, on:', 'pid: edge.pid, P, send, ev, sleep, errors, on:');
cdp=cdp.replace('close() { try { ws.close(); } catch {} edge.kill(); }',`async close() { const ended=new Promise(r=>edge.once('exit',r)); try { await send('Browser.close'); } catch {} try { ws.close(); } catch {} if(edge.exitCode===null)edge.kill(); await Promise.race([ended,sleep(5000)]); return {pid:edge.pid,exitCode:edge.exitCode,signalCode:edge.signalCode}; }`);
fs.writeFileSync(out+'/cdp.mjs',cdp);
