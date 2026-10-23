import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const root=process.cwd(),out=path.resolve('.agents/artifacts/perf/clean-gpu-atlas-corrected-profile-20261013');
export const hash=b=>createHash('sha256').update(b).digest('hex');
export const write=(p,v)=>fs.writeFileSync(path.join(out,p),JSON.stringify(v,null,2));
const git=(...args)=>execFileSync('git',['--no-optional-locks',...args],{windowsHide:true,maxBuffer:20e6}).toString().trim();
const inputs={atlas:'.agents/artifacts/perf/clean-gpu-atlas-source-20261013',original:'.agents/artifacts/perf/clean-canvas-automated-profile-20261013/original'};
export function manifest(v){return JSON.parse(fs.readFileSync(inputs[v]+(v==='atlas'?'/source-manifest.json':'/manifest.json')))}
function tree(dir){let rows=[];if(!fs.existsSync(dir))return rows;for(const d of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,d.name);if(d.isDirectory())rows.push(...tree(p));else if(d.isFile())rows.push({path:path.relative(root,p).replaceAll('\\','/'),hash:hash(fs.readFileSync(p))});else rows.push({path:p,link:fs.readlinkSync(p)});}return rows;}
export function state(){return {head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),refs:git('show-ref'),index:hash(fs.readFileSync('.git/index')),tracked:git('ls-files','-z').split('\0').filter(Boolean).map(p=>({path:p,hash:fs.existsSync(p)?hash(fs.readFileSync(p)):null})),protectedSources:Object.entries(inputs).map(([v,p])=>({variant:v,manifestHash:hash(fs.readFileSync(p+(v==='atlas'?'/source-manifest.json':'/manifest.json'))),files:manifest(v).files.map(f=>({path:f.path,hash:hash(fs.readFileSync(p+'/source/'+f.path))}))})),sharedMetadata:['$app','.cache','.vite','.vite-temp'].flatMap(p=>tree('node_modules/'+p)),dependencyDestinations:fs.readdirSync('node_modules',{withFileTypes:true}).filter(d=>!d.name.startsWith('.')&&d.name!=='$app').flatMap(d=>d.name.startsWith('@')?fs.readdirSync('node_modules/'+d.name).map(n=>d.name+'/'+n):[d.name]).map(p=>({path:p,real:fs.realpathSync('node_modules/'+p),packageHash:fs.existsSync('node_modules/'+p+'/package.json')?hash(fs.readFileSync('node_modules/'+p+'/package.json')):null}))};}
export function verify(){let checks=[];for(const v of Object.keys(inputs)){const m=manifest(v);for(const f of m.files){const b=fs.readFileSync(root+'/.agents/artifacts/perf/clean-gpu-atlas-validation-profile-20261013/'+v+'/source/'+f.path);if(hash(b)!==f.sha256)throw Error('source mismatch '+v+'/'+f.path);}checks.push({variant:v,files:m.files.length,allHashesExact:true});}const after=state();write('identity-after.json',after);const before=JSON.parse(fs.readFileSync(out+'/identity-before.json'));const same=JSON.stringify(before)===JSON.stringify(after);write('verification.json',{checks,protectedStateAndSharedMetadataUnchanged:same});if(!same)throw Error('protected state changed');return checks;}

export const prior=root+'/.agents/artifacts/perf/clean-gpu-atlas-validation-profile-20261013';
if(process.argv[2]==='snapshot'){if(fs.existsSync(out+'/identity-before.json'))throw Error('snapshot already exists; retain evidence');write('identity-before.json',state());console.log(verify());}
if(process.argv[2]==='verify')console.log(verify());
