import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const out=path.resolve('.agents/artifacts/perf/canvas-context-control-20261012'),stage=path.resolve(out,'source-stage');
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const name of ['.svelte-kit','node_modules']){const target=path.resolve(stage,name);if(!target.startsWith(stage+path.sep))throw Error('Path escape');if(fs.existsSync(target)){if(fs.lstatSync(target).isSymbolicLink())throw Error('Unexpected link');if(name==='node_modules'&&fs.readdirSync(target).some(n=>!['$app','.vite','.vite-temp'].includes(n)))throw Error('Unexpected dependencies');fs.rmSync(target,{recursive:true});}}
const original=JSON.parse(fs.readFileSync(out+'/original-manifest.json'));
const allowed=[...original.files.map(e=>e.path),'src/lib/boot/context-control.ts'].sort();
const actual=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isSymbolicLink())throw Error('Link '+f);if(e.isDirectory())walk(f);else if(e.isFile())actual.push(path.relative(stage,f).replaceAll('\\','/'));else throw Error('Nonregular');}}walk(stage);
if(JSON.stringify(allowed)!==JSON.stringify(actual.sort()))throw Error('Unexpected stage files '+JSON.stringify(actual.filter(p=>!allowed.includes(p))));
const changed=['src/lib/boot/engine.ts','src/lib/boot/diagnostic.ts','src/lib/boot/context-control.ts'];
const files=allowed.map(p=>{const b=fs.readFileSync(stage+'/'+p),old=original.files.find(e=>e.path===p),sha256=hash(b);if(old&&!changed.includes(p)&&old.sha256!==sha256)throw Error('Unexpected change '+p);return {path:p,bytes:b.length,sha256,originalDeployedSha256:old?.sha256,contextControlChange:changed.includes(p)};});
fs.writeFileSync(out+'/source-manifest.json',JSON.stringify({reference:original.reference,cameraFix:'042dc805',rejectedCandidate:'d82230a',target:'preview',project:'portfolio',projectId:'QmTWQ3SUZhG8FUnLimk8779iei8nabQuJet46c36dPowRw',scope:'neil-skarias-projects',stage,uploadMethod:'Exact isolated source-only stage. Hosted Linux source build. No prebuilt upload.',files,filesTotal:files.length,bytesTotal:files.reduce((a,e)=>a+e.bytes,0),excluded:original.excluded},null,2));
console.log(JSON.stringify({exactAllowlist:true,files:files.length,changedFiles:changed}));
