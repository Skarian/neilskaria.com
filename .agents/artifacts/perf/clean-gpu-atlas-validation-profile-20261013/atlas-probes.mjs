import fs from 'node:fs';import {createRequire} from 'node:module';import {out,hash,write} from './prepare.mjs';
const req=createRequire(process.cwd()+'/package.json'),ts=req('typescript'),THREE=req('three');
const source=fs.readFileSync(out+'/atlas/source/src/lib/boot/boot-atlas.ts','utf8'),metrics=JSON.parse(fs.readFileSync(out+'/atlas/source/src/lib/boot/boot-atlas-metrics.json'));
const js=ts.transpileModule(source.replace(/^import .*;\r?\n/gm,'').replace('export function','function'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const unhandled=[];process.on('unhandledRejection',e=>unhandled.push(String(e)));const results=[],sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function run(name,fetcher,decoder,early=false,success=false){
 const s={assignments:0,updates:0,textureDisposals:0,materialDisposals:0,closed:0,aborted:false};
 class Texture extends THREE.Texture{set image(v){s.assignments++;super.image=v;}get image(){return super.image;}set needsUpdate(v){if(v)s.updates++;super.needsUpdate=v;}dispose(){s.textureDisposals++;super.dispose();}}
 class Material extends THREE.ShaderMaterial{dispose(){s.materialDisposals++;super.dispose();}}
 const bitmap={close(){s.closed++;}},factory=new Function('THREE','metrics','fetch','createImageBitmap','AbortController',js+'\nreturn createBootAtlas;');
 const atlas=factory({...THREE,Texture,ShaderMaterial:Material},metrics,(url,options)=>{options.signal.addEventListener('abort',()=>s.aborted=true);return fetcher();},()=>decoder(bitmap),AbortController)('#fafafa');
 if(early){await sleep(5);atlas.dispose();atlas.dispose();}
 await sleep(40);let rejection;try{await atlas.ready;}catch(e){rejection=String(e);}
 const beforeDispose={...s};const retained=success&&atlas.texture.image===bitmap&&s.closed===0;
 atlas.dispose();atlas.dispose();await sleep(5);
 const assertions={noUnhandled:unhandled.length===0,readyOutcome:success?!rejection:!!rejection,oneTextureDispose:s.textureDisposals===1,oneMaterialDispose:s.materialDisposals===1,abort:s.aborted,assignment:success?s.assignments===1:s.assignments===0,update:success?s.updates===1:s.updates===0,closed:s.closed===(early||success?1:0),retainedUntilDispose:!success||retained};
 const r={name,pass:Object.values(assertions).every(Boolean),rejection,beforeDispose,afterDispose:s,assertions};results.push(r);write('atlas-probes.json',{scope:'Exact module transpiled; real Three resource subclasses, mocked fetch/ImageBitmap. Does not prove engine cleanup.',sourceSha256:hash(source),unhandled,results});if(!r.pass)throw Error(JSON.stringify(r));
}
const ok=()=>Promise.resolve({ok:true,blob:()=>Promise.resolve(new Blob(['x']))});
await run('immediate HTTP 404 delayed consumer',()=>Promise.resolve({ok:false,status:404}),()=>Promise.reject(Error('unused')));
await run('immediate network rejection delayed consumer',()=>Promise.reject(Error('network rejection')),()=>Promise.reject(Error('unused')));
await run('immediate decode rejection delayed consumer',ok,()=>Promise.reject(Error('corrupt image')));
await run('dispose pending decode abort late bitmap close',ok,async b=>{await sleep(25);return b;},true);
await run('success bitmap retained until idempotent dispose',ok,async b=>b,false,true);
console.log(JSON.stringify({tests:results.length,pass:true,unhandled}));
