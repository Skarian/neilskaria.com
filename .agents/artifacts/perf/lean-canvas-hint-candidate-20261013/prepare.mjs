import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
export const out=path.resolve('.agents/artifacts/perf/lean-canvas-hint-candidate-20261013'), stage=out+'/source-stage', parent=path.resolve('.agents/artifacts/perf/canvas-context-control-20261012');
export const hash=b=>createHash('sha256').update(b).digest('hex');
export const git=(...args)=>execFileSync('git',['--no-optional-locks',...args],{maxBuffer:60*1024*1024});
export const state=()=>({head:git('rev-parse','HEAD').toString().trim(),branch:git('branch','--show-current').toString().trim(),status:git('status','--porcelain').toString(),tracked:git('ls-files','-z').toString().split('\0').filter(Boolean).map(p=>({path:p,sha256:fs.existsSync(p)?hash(fs.readFileSync(p)):null}))});
export const list=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{if(e.isSymbolicLink())throw Error('Symlink '+e.name);return e.isDirectory()?list(dir+'/'+e.name).map(p=>e.name+'/'+p):[e.name]}).sort();
export const write=(name,data)=>fs.writeFileSync(out+'/'+name,JSON.stringify(data,null,2)+'\n');
if(process.argv[1]===path.resolve(out+'/prepare.mjs')){
 if(fs.existsSync(stage))throw Error('Stage already exists');
 write('source-state-before.json',state());
 const manifest=JSON.parse(fs.readFileSync(parent+'/source-manifest.json')),allow=JSON.parse(fs.readFileSync('.agents/artifacts/perf/affected-browser-firstboot/reference-manifest.json'));
 if(manifest.reference!=='a796e9aea60def6e0849cb75a151fd6570942339'||manifest.files.length!==93)throw Error('Wrong parent manifest');
 if(JSON.stringify(list(parent+'/source-stage'))!==JSON.stringify(manifest.files.map(e=>e.path).sort()))throw Error('Parent file set mismatch');
 for(const e of manifest.files){if(!allow.allow.some(p=>p.endsWith('/')?e.path.startsWith(p):e.path===p)||/atlas/i.test(e.path)||e.path.includes('..'))throw Error('Disallowed '+e.path);if(hash(fs.readFileSync(parent+'/source-stage/'+e.path))!==e.sha256)throw Error('Parent hash mismatch '+e.path)}
 for(const e of allow.files)if(hash(git('show',allow.revision+':'+e.path))!==e.referenceSha256)throw Error('Reference mismatch '+e.path);
 write('parent-verification.json',{reference:manifest.reference,cameraFix:'042dc805',manifestSha256:hash(fs.readFileSync(parent+'/source-manifest.json')),exactFiles:93,allParentHashesPass:true,committedReferenceHashesPass:true,files:manifest.files});
 for(const e of manifest.files){const dest=stage+'/'+e.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(parent+'/source-stage/'+e.path,dest)}
 fs.writeFileSync(stage+'/src/lib/boot/context-control.ts',`// This query selects only the actual boot-screen Canvas2D context.\nconst requestedMode = typeof window !== 'undefined' ? new URLSearchParams(location.search).get('bootCanvas') : null;\nif (requestedMode !== null && requestedMode !== 'default' && requestedMode !== 'will-read-frequently') {\n throw new Error('Unsupported bootCanvas mode: ' + requestedMode + '. Use default or will-read-frequently.');\n}\nexport const bootCanvasMode = requestedMode === 'default' ? 'default' : 'will-read-frequently';\nexport const bootCanvasOptions = bootCanvasMode === 'will-read-frequently' ? { willReadFrequently: true } : undefined;\n`);
 const file=stage+'/src/lib/boot/diagnostic.ts';let s=fs.readFileSync(file,'utf8');if(s.includes('sourceId:'))throw Error('Unexpected sourceId');
 s=s.replace("schemaRevision: 'canvas-context-control-1',","schemaRevision: 'lean-canvas-hint-candidate-1',\n\t\t\tsourceId: 'lean-canvas-hint-candidate-20261013',");
 s=s.replace("bootCanvasMode +\n\t\t\t'</summary>","bootCanvasMode +\n\t\t\t' | lean-canvas-hint-candidate-20261013</summary>");fs.writeFileSync(file,s);
 const baseline=git('show',manifest.reference+':src/lib/boot/engine.ts').toString(),from="const screenCtx = screenCanvas.getContext('2d')!;";if(baseline.split(from).length!==2)throw Error('Nonunique context');
 fs.writeFileSync(out+'/baseline-engine.ts',baseline);fs.writeFileSync(out+'/proposed-engine.ts',baseline.replace(from,"const screenCtx = screenCanvas.getContext('2d', { willReadFrequently: true })!;"));
 let diff;try{diff=git('diff','--no-index','--',out+'/baseline-engine.ts',out+'/proposed-engine.ts').toString()}catch(e){if(e.status!==1)throw e;diff=e.stdout.toString()}
 diff=diff.replace(/^diff --git .*$/m,'diff --git a/src/lib/boot/engine.ts b/src/lib/boot/engine.ts').replace(/^--- .*$/m,'--- a/src/lib/boot/engine.ts').replace(/^\+\+\+ .*$/m,'+++ b/src/lib/boot/engine.ts');fs.writeFileSync(out+'/production-eligible-proposal.patch',diff);
 const schema=JSON.parse(fs.readFileSync(parent+'/capture.schema.json'));schema.title='Lean canvas hint candidate diagnostic';schema.properties.schemaRevision.const='lean-canvas-hint-candidate-1';schema.required.push('sourceId');schema.properties.sourceId={const:'lean-canvas-hint-candidate-20261013'};write('capture.schema.json',schema);
 console.log('Parent and committed reference verified. Exactly 93 files copied.');
}
