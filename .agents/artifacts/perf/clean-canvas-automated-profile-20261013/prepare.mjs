import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
export const root=process.cwd(),out=path.resolve('.agents/artifacts/perf/clean-canvas-automated-profile-20261013');
export const hash=b=>createHash('sha256').update(b).digest('hex');
export const git=(...args)=>execFileSync('git',['--no-optional-locks',...args],{maxBuffer:80e6,windowsHide:true});
export const write=(n,v)=>fs.writeFileSync(out+'/'+n,JSON.stringify(v,null,2));
export function state(){return {head:git('rev-parse','HEAD').toString().trim(),index:hash(fs.readFileSync('.git/index')),proposal:git('rev-parse','perf/lean-canvas-hint-review').toString().trim(),tracked:git('ls-files','-z').toString().split('\0').filter(Boolean).map(p=>({path:p,hash:fs.existsSync(p)?hash(fs.readFileSync(p)):null}))};}
if(process.argv[2]==='prepare'){
write('state-before.json',state());
const allow=JSON.parse(fs.readFileSync('.agents/artifacts/perf/lean-canvas-hint-preview-20261013/source-manifest.json')).files.map(f=>f.path);
for(const [name,commit] of [['original','a796e9aea60def6e0849cb75a151fd6570942339'],['hint','bcc409e43708ee7b543b53ca8f3700a8ef82ff14']]){
const tree=new Set(git('ls-tree','-r','--name-only',commit).toString().trim().split('\n'));const files=allow.filter(p=>tree.has(p));if(files.length!==91)throw Error('file count '+files.length);
const stage=out+'/'+name+'/source';if(fs.existsSync(stage))throw Error('stage exists');const manifest=[];
for(const p of files){const b=git('show',commit+':'+p),dest=stage+'/'+p;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,b);manifest.push({path:p,blob:git('rev-parse',commit+':'+p).toString().trim(),sha256:hash(b),bytes:b.length});}
write(name+'/manifest.json',{commit,files:manifest});
const config=fs.readFileSync(stage+'/vite.config.ts','utf8').replace("import adapter from '@sveltejs/adapter-vercel';","const adapter = () => ({name:'local-profile-noop',adapt:async()=>{}});");
fs.writeFileSync(out+'/'+name+'/harness.config.ts',config);
}
const diff=git('diff','a796e9a','bcc409e','--','src/lib/boot/engine.ts').toString();fs.writeFileSync(out+'/exact-option.diff',diff);
if(git('diff','--name-only','a796e9a','bcc409e').toString().trim()!=='src/lib/boot/engine.ts'||!diff.includes('willReadFrequently: true'))throw Error('diff');
console.log('91 exact source files per variant; one option diff');
}
