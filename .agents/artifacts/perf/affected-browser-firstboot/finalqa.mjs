import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),out=path.resolve('.agents/artifacts/perf/affected-browser-firstboot'),stage=out+'/source-stage';
const inspect=fs.readFileSync(out+'/inspect.log','utf8');if(!inspect.includes('status\t● Ready')||!inspect.includes('target\tpreview'))throw Error('Not READY preview');
const deployment=JSON.parse(fs.readFileSync(out+'/deployment-dispatch.json'));deployment.status='READY';deployment.reference='a796e9aea60def6e0849cb75a151fd6570942339';deployment.id=inspect.match(/dpl_[A-Za-z0-9]+/)[0];
const build=fs.readFileSync(out+'/deploy.log','utf8');if(!build.includes('✔ done')||!build.includes('precompress:')||!build.includes('Build Completed in /vercel/output'))throw Error('Packaging incomplete');
fs.writeFileSync(out+'/deployment.json',JSON.stringify(deployment,null,2));
const http=[];for(const route of ['/lab/boot','/api/stations']){const r=await fetch(deployment.url+route),text=await r.text();if(r.status!==200)throw Error(route+' HTTP '+r.status);http.push({route,status:r.status,title:text.match(/<title>(.*?)<\/title>/)?.[1],...(route.includes('stations')?{stations:JSON.parse(text)}:{})});}fs.writeFileSync(out+'/http.json',JSON.stringify(http,null,2));
for(const [name,args]of [['final-sync',[root+'/node_modules/@sveltejs/kit/svelte-kit.js','sync']],['final-types',[root+'/node_modules/svelte-check/bin/svelte-check','--tsconfig','./tsconfig.json']],['final-format',[root+'/node_modules/prettier/bin/prettier.cjs','--check','--plugin',root+'/node_modules/prettier-plugin-svelte/plugin.js','src/lib/boot/engine.ts','src/lib/boot/boot-screen.ts','src/lib/boot/BootIntro.svelte','src/lib/boot/diagnostic.ts']]]){
 try{const log=execFileSync(process.execPath,args,{cwd:stage,encoding:'utf8',stdio:'pipe'});fs.writeFileSync(out+'/'+name+'.log',log);console.log(log);}catch(e){fs.writeFileSync(out+'/'+name+'.log',(e.stdout||'')+(e.stderr||''));throw e;}
}
const schemaPath=out+'/capture.schema.json',schema=JSON.parse(fs.readFileSync(schemaPath));
schema.properties.capturedAt={type:'string'};schema.required.push('capturedAt','deviceName','cameraFix');schema.properties.cameraFix={const:'042dc805'};
schema.properties.longtasks.items={type:'object',required:['t','duration'],properties:{t:{type:'number'},duration:{type:'number'}}};
schema.properties.errors.items={type:'object',required:['t','message'],properties:{t:{type:'number'},message:{type:'string',maxLength:400}}};
schema.properties.unobserved.items={type:'object',required:['run','markers'],properties:{run:{type:'integer'},markers:{type:'array',items:{type:'string'}}}};
schema.properties.metadata.properties={browser:{type:'string'},viewport:{type:'object',required:['width','height','dpr'],properties:{width:{type:'number'},height:{type:'number'},dpr:{type:'number'}}},fonts:{type:'object'},renderer:{type:'object'}};
schema.properties.supported.properties=Object.fromEntries(['longtask','fonts','resourceTiming'].map(k=>[k,{type:'boolean'}]));
schema.properties.counts.properties=Object.fromEntries(['runs','events','frames','longtasks','errors'].map(k=>[k,{type:'integer'}]));
schema.properties.resources.items={type:'object',required:['path','startTime','duration','transferSize','encodedBodySize','initiatorType'],properties:{path:{type:'string'},startTime:{type:'number'},duration:{type:'number'},transferSize:{type:'number'},encodedBodySize:{type:'number'},initiatorType:{type:'string'}}};
fs.writeFileSync(schemaPath,JSON.stringify(schema,null,2));
let diff='';for(const f of ['engine.ts','boot-screen.ts','BootIntro.svelte']){try{diff+=execFileSync('git',['diff','--no-index',out+'/original-reference/src/lib/boot/'+f,stage+'/src/lib/boot/'+f],{encoding:'utf8'});}catch(e){if(e.status!==1)throw e;diff+=e.stdout;}}fs.writeFileSync(out+'/diagnostic-source.diff',diff);

console.log(JSON.stringify({deployment,http: http.map(r=>({route:r.route,status:r.status}))}));
