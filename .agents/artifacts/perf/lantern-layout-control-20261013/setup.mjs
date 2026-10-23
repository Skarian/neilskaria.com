import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const out=path.resolve('.agents/artifacts/perf/lantern-layout-control-20261013');
export const prior=path.resolve('.agents/artifacts/perf/clean-canvas-stress-trace-repair-20261013');
export const hash=b=>createHash('sha256').update(b).digest('hex');
export const git=(...a)=>execFileSync('git',['--no-optional-locks',...a],{windowsHide:true,maxBuffer:100e6});
export const write=(p,v)=>{fs.mkdirSync(path.dirname(out+'/'+p),{recursive:true});fs.writeFileSync(out+'/'+p,JSON.stringify(v,null,2))};
export function tree(dir){const a=[];function walk(d){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);if(f.isDirectory())walk(p);else if(f.isFile())a.push({path:path.relative(dir,p).replaceAll('\\','/'),sha256:hash(fs.readFileSync(p))});}}walk(dir);return a.sort((a,b)=>a.path.localeCompare(b.path));}
export function state(){return {head:git('rev-parse','HEAD').toString().trim(),main:git('rev-parse','main').toString().trim(),baseline:git('rev-parse','a796e9a').toString().trim(),before:git('rev-parse','bcc409e').toString().trim(),proposal:git('rev-parse','perf/lean-canvas-hint-review').toString().trim(),index:hash(fs.readFileSync('.git/index')),tracked:git('ls-files','-z').toString().split('\0').filter(Boolean).map(p=>({p,hash:fs.existsSync(p)?hash(fs.readFileSync(p)):null})),previousStages:[prior,path.resolve('.agents/artifacts/perf/clean-canvas-automated-profile-20261013'),path.resolve('.agents/artifacts/perf/radio-program-mapping-20261013')].map(p=>({p,files:tree(p)}))};}
if(process.argv[2]==='prepare'){
write('state-before.json',state());
const m=JSON.parse(fs.readFileSync(prior+'/hint/manifest.json'));if(m.files.length!==91||m.commit!=='bcc409e43708ee7b543b53ca8f3700a8ef82ff14')throw Error('baseline');
for(const v of ['before','control']){for(const f of m.files){const b=fs.readFileSync(prior+'/hint/source/'+f.path);if(hash(b)!==f.sha256||!b.equals(git('show',m.commit+':'+f.path)))throw Error('identity '+f.path);const p=out+'/'+v+'/source/'+f.path;fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);}write(v+'/manifest.json',m);}
fs.cpSync(prior+'/hint/source/.svelte-kit/output',out+'/before/source/.svelte-kit/output',{recursive:true});write('before/build-copy-manifest.json',tree(out+'/before/source/.svelte-kit/output'));
const p='src/lib/boot/BootIntro.svelte',b=fs.readFileSync(out+'/before/source/'+p,'utf8'),needle='\t\t\treport();\n\t\t\tobserver = new ResizeObserver(report);';if(b.split(needle).length!==2)throw Error('call count');const c=b.replace(needle,'\t\t\tobserver = new ResizeObserver(report);');fs.writeFileSync(out+'/control/source/'+p,c);
fs.writeFileSync(out+'/source.patch','--- a/'+p+'\n+++ b/'+p+'\n@@ -102,7 +102,6 @@\n \t\tvoid tick().then(() => {\n \t\t\tconst panel = layer?.querySelector<HTMLElement>(\'.panel\');\n \t\t\tif (!panel) return;\n-\t\t\treport();\n \t\t\tobserver = new ResizeObserver(report);\n \t\t\tobserver.observe(panel);\n \t\t});\n');
write('source-proof.json',{commit:m.commit,count:91,changed:[{path:p,before:hash(b),control:hash(c),removed:'report();'}],before:tree(out+'/before/source').filter(f=>!f.path.startsWith('.svelte-kit/')),control:tree(out+'/control/source')});
fs.writeFileSync(out+'/control/harness.config.ts',fs.readFileSync(out+'/control/source/vite.config.ts','utf8').replace("import adapter from '@sveltejs/adapter-vercel';","const adapter = () => ({name:'local-profile-noop',adapt:async()=>{}});"));
fs.copyFileSync(prior+'/cdp.mjs',out+'/cdp.mjs');fs.writeFileSync(out+'/server.mjs',fs.readFileSync(prior+'/server.mjs','utf8').replace("from './prepare.mjs'","from './setup.mjs'"));
console.log('Prepared exact 91-file stages and single-call removal');
}
if(process.argv[2]==='verify'){const unchanged=JSON.stringify(state())===JSON.stringify(JSON.parse(fs.readFileSync(out+'/state-before.json')));write('verification.json',{mainTrackedIndexHEADRefsAndPreviousStagesUnchanged:unchanged});if(!unchanged)throw Error('state changed');console.log('State unchanged');}
