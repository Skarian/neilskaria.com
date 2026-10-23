import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
export const out=path.resolve('.agents/artifacts/perf/clean-gpu-atlas-preview-preparation-20261013');
export const input=path.resolve('.agents/artifacts/perf/clean-gpu-atlas-source-20261013');
export const built=path.resolve('.agents/artifacts/perf/clean-gpu-atlas-validation-profile-20261013/atlas/source');
export const hash=b=>createHash('sha256').update(b).digest('hex');
export const write=(p,v)=>fs.writeFileSync(path.join(out,p),JSON.stringify(v,null,2)+'\n');
export const manifest=JSON.parse(fs.readFileSync(input+'/source-manifest.json'));
const git=(...args)=>execFileSync('git',['--no-optional-locks',...args],{windowsHide:true,maxBuffer:20e6}).toString();
function tree(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>{const p=path.join(dir,d.name);return d.isDirectory()?tree(p):d.isFile()?[{path:path.relative(process.cwd(),p).replaceAll('\\','/'),sha256:hash(fs.readFileSync(p))}]:[{path:p,link:fs.readlinkSync(p)}];}).sort((a,b)=>a.path.localeCompare(b.path));}
export function identity(){return {head:git('rev-parse','HEAD').trim(),branch:git('branch','--show-current').trim(),refs:git('show-ref'),index:hash(fs.readFileSync('.git/index')),tracked:git('ls-files','-z').split('\0').filter(Boolean).map(p=>({path:p,sha256:fs.existsSync(p)?hash(fs.readFileSync(p)):null})),acceptedManifest:hash(fs.readFileSync(input+'/source-manifest.json')),acceptedSource:tree(input+'/source'),acceptedBuild:tree(built+'/.svelte-kit/output'),acceptedPublic:tree(built+'/public'),delivery:tree(path.dirname(built)+'/delivery'),policies:tree('.agents/research').concat(['AGENTS.md','.agents/models.md','.agents/orchestrator.md'].map(p=>({path:p,sha256:hash(fs.readFileSync(p))}))),priorIdentity:hash(fs.readFileSync(path.dirname(path.dirname(built))+'/identity-after.json'))};}
export function verifyStage(){const rows=manifest.files.map(f=>{const b=fs.readFileSync(out+'/upload-stage/'+f.path);if(b.length!==f.bytes||hash(b)!==f.sha256)throw Error('stage mismatch '+f.path);return {path:f.path,bytes:b.length,sha256:hash(b)};});if(tree(out+'/upload-stage').length!==94)throw Error('unexpected stage paths');const digest=hash(rows.map(f=>f.path+'\0'+f.sha256+'\n').join(''));if(digest!==manifest.stageDigest)throw Error('digest mismatch');return {files:rows.length,bytes:rows.reduce((n,f)=>n+f.bytes,0),digest,exact:true};}
if(process.argv[2]==='prepare'){
 if(fs.existsSync(out+'/upload-stage'))throw Error('fresh stage required');
 write('identity-before.json',identity());
 for(const f of manifest.files){if(f.path.includes('..')||path.isAbsolute(f.path))throw Error('unsafe path');const b=fs.readFileSync(input+'/source/'+f.path);if(b.length!==f.bytes||hash(b)!==f.sha256)throw Error('input mismatch');const p=out+'/upload-stage/'+f.path;fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b,{flag:'wx'});}
 fs.copyFileSync(input+'/source-manifest.json',out+'/upload-manifest.json');write('stage-before-smoke.json',verifyStage());console.log(verifyStage());
}
if(process.argv[2]==='verify'){const after=identity(),before=JSON.parse(fs.readFileSync(out+'/identity-before.json'));write('identity-after.json',after);const same=JSON.stringify(before)===JSON.stringify(after);write('verification.json',{stage:verifyStage(),boundedProtectedIdentityUnchanged:same,scope:'Tracked checkout bytes, HEAD, branch, refs, index, exact accepted source/manifest/build/public/delivery, research and policies, prior validation identity file. No account/profile reads.'});if(!same)throw Error('protected identity changed');console.log('VERIFIED');}

