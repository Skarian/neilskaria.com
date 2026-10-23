import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
export const root='C:/projects/neilskaria.com';
export const out=root+'/.agents/artifacts/perf/clean-gpu-atlas-opus-preview-20261013';
export const input=root+'/.agents/artifacts/perf/clean-gpu-atlas-source-20261013';
export const built=root+'/.agents/artifacts/perf/clean-gpu-atlas-validation-profile-20261013/atlas/source';
export const delivery=root+'/.agents/artifacts/perf/clean-gpu-atlas-validation-profile-20261013/atlas/delivery';
export const r2=root+'/.agents/artifacts/perf/clean-gpu-atlas-preview-preparation-20261013-r2';
export const hash=b=>createHash('sha256').update(b).digest('hex');
export const write=(p,v)=>{fs.mkdirSync(path.dirname(path.join(out,p)),{recursive:true});fs.writeFileSync(path.join(out,p),JSON.stringify(v,null,2)+'\n');};
export const manifest=JSON.parse(fs.readFileSync(input+'/source-manifest.json'));
const git=(...a)=>execFileSync('git',['--no-optional-locks',...a],{cwd:root,windowsHide:true,maxBuffer:20e6}).toString();
export function tree(dir,skip=()=>false){if(!fs.existsSync(dir))return [];return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>{const p=path.join(dir,d.name);if(skip(p,d))return [];return d.isDirectory()?tree(p,skip):d.isFile()?[{path:path.relative(root,p).replaceAll('\\','/'),sha256:hash(fs.readFileSync(p))}]:[{path:p,link:true}];}).sort((a,b)=>a.path.localeCompare(b.path));}
const digestOf=rows=>hash(JSON.stringify(rows));
// Bounded protected identity. Refs: only HEAD, branch, redesign and main; no full ref dump.
export function identity(){
 const tracked=git('ls-files','-z').split('\0').filter(Boolean).map(p=>({path:p,sha256:fs.existsSync(root+'/'+p)?hash(fs.readFileSync(root+'/'+p)):null}));
 const r={head:git('rev-parse','HEAD').trim(),branch:git('symbolic-ref','HEAD').trim(),refs:git('rev-parse','refs/heads/redesign','refs/heads/main').trim().split('\n'),index:hash(fs.readFileSync(root+'/.git/index')),
  trackedCount:tracked.length,trackedDigest:digestOf(tracked),acceptedManifest:hash(fs.readFileSync(input+'/source-manifest.json')),
  acceptedSourceDigest:digestOf(tree(input+'/source')),acceptedBuildDigest:digestOf(tree(built+'/.svelte-kit/output')),acceptedPublicDigest:digestOf(tree(built+'/public')),deliveryDigest:digestOf(tree(delivery)),
  r2SharedMetadataDigest:digestOf(tree(r2,(p,d)=>d.isDirectory()&&d.name==='profile')),
  policies:['AGENTS.md','.agents/models.md','.agents/orchestrator.md'].map(p=>({path:p,sha256:hash(fs.readFileSync(root+'/'+p))})),researchDigest:digestOf(tree(root+'/.agents/research'))};
 return r;
}
export function verifyStage(stage){
 const rows=manifest.files.map(f=>{const b=fs.readFileSync(stage+'/'+f.path);if(b.length!==f.bytes||hash(b)!==f.sha256)throw Error('stage mismatch '+f.path);return {path:f.path,bytes:b.length,sha256:hash(b)};});
 const all=tree(stage);const extra=all.map(r=>path.relative(path.relative(root,stage),r.path).replaceAll('\\','/')).filter(p=>!manifest.files.some(f=>f.path===p));
 if(all.length!==94||extra.length)throw Error('unexpected stage paths '+JSON.stringify(extra));
 const digest=hash(rows.map(f=>f.path+'\0'+f.sha256+'\n').join(''));if(digest!==manifest.stageDigest)throw Error('digest mismatch');
 return {files:rows.length,bytes:rows.reduce((n,f)=>n+f.bytes,0),digest,exact:true,extra};
}
if(process.argv[2]==='identity'){write(process.argv[3],identity());console.log('identity written',process.argv[3]);}
if(process.argv[2]==='compare'){const a=fs.readFileSync(out+'/'+process.argv[3],'utf8'),b=fs.readFileSync(out+'/'+process.argv[4],'utf8');const same=a===b;write(process.argv[5],{before:process.argv[3],after:process.argv[4],identical:same});console.log('identical',same);if(!same)process.exitCode=1;}
