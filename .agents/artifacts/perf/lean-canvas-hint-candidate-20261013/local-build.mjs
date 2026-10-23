import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {out,stage,write} from './prepare.mjs';
const root=process.cwd(),work=out+'/check-work';
const config=fs.readFileSync(stage+'/vite.config.ts','utf8').replace('adapter: adapter(),',"adapter: { name: 'local-check-only', adapt: async () => {} },");
fs.writeFileSync(out+'/local-build.config.ts',config);
const run=(name,args)=>{try{const log=execFileSync(process.execPath,args,{cwd:work,encoding:'utf8',windowsHide:true,maxBuffer:20*1024*1024});fs.writeFileSync(out+'/'+name+'.log',log);console.log(name+' PASS')}catch(e){fs.writeFileSync(out+'/'+name+'-failed.log',(e.stdout||'')+(e.stderr||''));throw e}};
run('local-client-ssr-build',[root+'/node_modules/vite/bin/vite.js','build','--config',out+'/local-build.config.ts']);
write('check-result.json',{format:true,types:true,fullVercelBuild:false,fullBuildFailure:'Windows EPERM on adapter symlink. Client and SSR compilation completed before packaging failure.',localClientSsrBuild:true,localBuildHarness:'Same configuration with a no-op adapter in separate local-build.config.ts. Deployment packaging is not verified.',sourceFiles:93,dependencies:'Existing root node_modules. No install or package changes.'});
let cdp=fs.readFileSync('.agents/artifacts/perf/first-boot-replay-20261012/cdp.mjs','utf8').replace("'about:blank']);","'about:blank'], {windowsHide:true});").replace('P, send, ev, sleep, errors, on:', 'pid: edge.pid, P, send, ev, sleep, errors, on:');
cdp=cdp.replace('close() { try { ws.close(); } catch {} edge.kill(); }',`async close() { const ended=new Promise(r=>edge.once('exit',r)); try { await send('Browser.close'); } catch {} try { ws.close(); } catch {} if(edge.exitCode===null)edge.kill(); await Promise.race([ended,sleep(5000)]); return {pid:edge.pid,exitCode:edge.exitCode,signalCode:edge.signalCode}; }`);fs.writeFileSync(out+'/cdp.mjs',cdp);
// Preview must use the same local-only configuration as this build.
const smoke=fs.readFileSync(out+'/smoke.mjs','utf8').replace("'preview','--host'","'preview','--config',out+'/local-build.config.ts','--host'");fs.writeFileSync(out+'/smoke.mjs',smoke);
