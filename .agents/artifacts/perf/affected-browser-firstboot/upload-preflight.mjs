import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const out=path.resolve('.agents/artifacts/perf/affected-browser-firstboot'),stage=path.resolve(out,'source-stage');
if(!fs.readFileSync(out+'/inspect.log','utf8').includes('status\t● Error'))throw Error('Failed dispatch not confirmed ERROR');
for(const f of ['deployment-dispatch.json','deploy.log','inspect.log','source-manifest.json'])fs.copyFileSync(out+'/'+f,out+'/failed-first-'+f);
for(const name of ['.svelte-kit','node_modules']){
 const target=path.resolve(stage,name);if(!target.startsWith(stage+path.sep))throw Error('Path escape');
 if(fs.existsSync(target)){if(fs.lstatSync(target).isSymbolicLink())throw Error('Unexpected linked output');if(name==='node_modules'&&fs.readdirSync(target).some(n=>!['$app','.vite','.vite-temp'].includes(n)))throw Error('Unexpected dependencies');fs.rmSync(target,{recursive:true});}
}
const ignore=path.resolve(stage,'.vercelignore');if(!ignore.startsWith(stage+path.sep))throw Error('Path escape');fs.unlinkSync(ignore);
const expected=JSON.parse(fs.readFileSync(out+'/source-manifest.json')).files.filter(e=>e.path!=='.vercelignore');
const actual=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isSymbolicLink())throw Error('Link in stage');if(e.isDirectory())walk(file);else if(e.isFile())actual.push(path.relative(stage,file).replaceAll('\\','/'));else throw Error('Nonregular file');}}walk(stage);
if(JSON.stringify(actual.sort())!==JSON.stringify(expected.map(e=>e.path).sort()))throw Error('Stage not exactly allowlisted');
for(const e of expected){const b=fs.readFileSync(path.join(stage,e.path));if(createHash('sha256').update(b).digest('hex')!==e.sha256)throw Error('Hash changed '+e.path);}
const prior=JSON.parse(fs.readFileSync(out+'/source-manifest.json'));prior.files=expected;prior.filesTotal=expected.length;prior.bytesTotal=expected.reduce((a,b)=>a+b.bytes,0);prior.uploadMethod='Exact isolated source-only stage. No ignore negation rules or generated files.';
fs.writeFileSync(out+'/source-manifest.json',JSON.stringify(prior,null,2));
fs.writeFileSync(out+'/deployment-failed.json',JSON.stringify({id:'dpl_DAT5i8fcUtiqDH6dv61tiBP7yJUj',url:'https://portfolio-3a6ahv5z7-neil-skarias-projects.vercel.app',status:'ERROR',reason:'Incorrect ignore negations omitted source directories'},null,2));
fs.unlinkSync(out+'/deployment-dispatch.json');console.log(JSON.stringify({files:expected.length,bytes:prior.bytesTotal,exactStageVerified:true}));
