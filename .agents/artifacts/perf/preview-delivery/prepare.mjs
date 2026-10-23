import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const out=path.resolve('.agents/artifacts/perf/preview-delivery'), revision='d82230acab7f4e2be780afd0847330a6926573d1';
if(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()!==revision)throw Error('Revision changed');
const evidence='.agents/artifacts/perf/lean-stutter-fix';
let report=fs.readFileSync(evidence+'/report.mjs','utf8');
report=report.replace("const root='lean-stutter-work.tmp';execFileSync(process.execPath,['lean-stutter-analyze.tmp.mjs']);", 'const root='+JSON.stringify(evidence)+';');
await import('data:text/javascript;base64,'+Buffer.from(report).toString('base64'));
if(!fs.statSync(evidence+'/README.md').size)throw Error('Missing README');
const stage=path.join(out,'source-stage');
if(fs.existsSync(stage))throw Error('Stage already exists');
fs.mkdirSync(stage);
const allow=['src/','public/','scripts/','package.json','package-lock.json','vite.config.ts','vercel.json','tsconfig.json','.node-version','.npmrc'];
const entries=execFileSync('git',['ls-tree','-r',revision],{encoding:'utf8'}).trim().split('\n').map(line=>{const [meta,p]=line.split('\t');return{mode:meta.split(' ')[0],path:p};}).filter(e=>allow.some(a=>a.endsWith('/')?e.path.startsWith(a):e.path===a));
const hash=b=>createHash('sha256').update(b).digest('hex'),manifest=[];
for(const e of entries){
 if(!['100644','100755'].includes(e.mode))throw Error('Link/nonregular file '+e.path);
 const dest=path.resolve(stage,e.path);if(!dest.startsWith(stage+path.sep))throw Error('Escaping stage');
 const committed=execFileSync('git',['show',revision+':'+e.path],{maxBuffer:50*1024*1024}),source=fs.readFileSync(e.path);
 if(hash(source)!==hash(committed))throw Error('Source differs '+e.path);
 if(e.path==='.npmrc'&&committed.toString().trim()!=='engine-strict=true')throw Error('Unexpected npmrc');
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,committed);
 manifest.push({path:e.path,bytes:committed.length,sourceSha256:hash(source),stagedSha256:hash(fs.readFileSync(dest)),gitMode:e.mode});
}
fs.writeFileSync(out+'/manifest.json',JSON.stringify({revision,stage,allow,files:manifest},null,2));
console.log(JSON.stringify({revision,files:manifest.length,bytes:manifest.reduce((s,e)=>s+e.bytes,0),readmeExists:fs.existsSync(evidence+'/README.md')}));
