import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out=path.resolve('.agents/artifacts/perf/gpu-boot-atlas-prototype-20261012');
const base=path.resolve('.agents/artifacts/perf/canvas-context-control-20261012');
const stage=out+'/source-stage';
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(fs.readFileSync(base+'/source-manifest.json'));
if(manifest.files.length!==93 || fs.existsSync(stage))throw Error('Expected untouched new stage and 93 baseline files');
const verified=manifest.files.map(e=>{const b=fs.readFileSync(base+'/source-stage/'+e.path);if(hash(b)!==e.sha256)throw Error('Hash mismatch '+e.path);return{path:e.path,sha256:e.sha256,bytes:b.length};});
fs.writeFileSync(out+'/base-verification.json',JSON.stringify({baseline:base,verified},null,2));
fs.writeFileSync(out+'/source-state-before.json',JSON.stringify({head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),tracked:execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean).map(p=>({path:p,sha256:hash(fs.readFileSync(p))}))},null,2));
for(const e of verified){const dest=stage+'/'+e.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(base+'/source-stage/'+e.path,dest);}
fs.copyFileSync(base+'/capture.schema.json',out+'/capture.schema.json');
fs.copyFileSync(path.resolve('.agents/artifacts/perf/first-boot-replay-20261012/cdp.mjs'),out+'/cdp.mjs');
console.log('Verified and copied 93 files.');
