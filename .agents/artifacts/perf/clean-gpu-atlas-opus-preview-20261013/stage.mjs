// Fresh exact upload stage from the accepted source. Usage: node stage.mjs prepare|verify <manifest-out.json>
import fs from 'node:fs';import path from 'node:path';import {out,input,manifest,hash,write,verifyStage,tree} from './common.mjs';
const stage=out+'/upload-stage';
if(process.argv[2]==='prepare'){
 if(fs.existsSync(stage))throw Error('fresh stage required');
 for(const f of manifest.files){if(f.path.includes('..')||path.isAbsolute(f.path))throw Error('unsafe path');const b=fs.readFileSync(input+'/source/'+f.path);if(b.length!==f.bytes||hash(b)!==f.sha256)throw Error('input mismatch '+f.path);const p=stage+'/'+f.path;fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b,{flag:'wx'});}
}
const v=verifyStage(stage);const all=tree(stage);
const forbidden=all.filter(r=>/(^|\/)(\.agents|\.git|\.vercel|node_modules|\.svelte-kit|build|profile)(\/|$)|\.(log|mjs\.map)$|session\.json|auth/i.test(r.path.split('upload-stage/')[1]));
write(process.argv[3],{...v,forbiddenPaths:forbidden,rows:manifest.files.map(f=>({path:f.path,bytes:f.bytes,sha256:f.sha256}))});
console.log(JSON.stringify({...v,forbidden:forbidden.length}));if(forbidden.length)process.exitCode=1;
