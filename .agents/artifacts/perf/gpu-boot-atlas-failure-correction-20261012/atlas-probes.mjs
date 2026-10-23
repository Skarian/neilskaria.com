import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
const req=createRequire(path.resolve('package.json')),ts=req('typescript'),THREE=req('three');
const out=path.resolve('.agents/artifacts/perf/gpu-boot-atlas-failure-correction-20261012'),stage=path.resolve('.agents/artifacts/perf/gpu-boot-atlas-prototype-20261012/source-stage');
const source=fs.readFileSync(stage+'/src/lib/boot/boot-atlas.ts','utf8'),metrics=JSON.parse(fs.readFileSync(stage+'/src/lib/boot/boot-atlas-metrics.json'));
const js=ts.transpileModule(source.replace(/^import .*;\r?\n/gm,'').replace('export function','function'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const unhandled=[];process.on('unhandledRejection',e=>unhandled.push(String(e)));const results=[];const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function run(name,fetcher,decoder,disposeEarly=false){
 const marks=[],requests=[],stats={assignments:0,updates:0,textureDisposals:0,materialDisposals:0,closed:0};
 class Texture extends THREE.Texture {set image(v){stats.assignments++;super.image=v;}get image(){return super.image;}set needsUpdate(v){if(v)stats.updates++;super.needsUpdate=v;}dispose(){stats.textureDisposals++;super.dispose();}}
 class Material extends THREE.ShaderMaterial {dispose(){stats.materialDisposals++;super.dispose();}}
 const diag={mark:(kind,detail)=>marks.push({kind,detail}),textureRequest:k=>requests.push(k)};
 const bitmap={close(){stats.closed++;}};
 const factory=new Function('THREE','metrics','diag','fetch','createImageBitmap','AbortController',js+'\nreturn createBootAtlas;');
 const atlas=factory({...THREE,Texture,ShaderMaterial:Material},metrics,diag,fetcher,()=>decoder(bitmap),AbortController)('#fafafa');
 // Deliberately attach the consumer later, as engine initialization does.
 if(disposeEarly){await sleep(5);atlas.dispose();atlas.dispose();}
 await sleep(40);let rejection;try{await atlas.ready;}catch(e){rejection=String(e);}
 if(!disposeEarly){atlas.dispose();atlas.dispose();}
 const pass=!!rejection&&!marks.some(m=>m.kind==='atlas-ready')&&stats.assignments===0&&stats.updates===0&&requests.length===0&&stats.textureDisposals===1&&stats.materialDisposals===1&&(!disposeEarly||stats.closed===1)&&unhandled.length===0;
 results.push({name,pass,rejection,stats,marks});if(!pass)throw Error(JSON.stringify(results.at(-1)));
}
const ok=()=>Promise.resolve({ok:true,blob:()=>Promise.resolve(new Blob(['x']))});
await run('immediate HTTP 404',()=>Promise.resolve({ok:false,status:404}),()=>Promise.reject(Error('unused')));
await run('rejected fetch',()=>Promise.reject(Error('network rejection')),()=>Promise.reject(Error('unused')));
await run('corrupt bytes decode rejection',ok,()=>Promise.reject(Error('corrupt image')));
await run('dispose during delayed decode',ok,async b=>{await sleep(25);return b;},true);
fs.writeFileSync(out+'/atlas-probes.json',JSON.stringify({scope:'Exact staged atlas code transpiled with real Three math and monitored resource subclasses. Fetch/decode are mocks. This does not prove room cleanup.',sourceSha256:createHash('sha256').update(source).digest('hex'),unhandled,results},null,2));console.log(JSON.stringify({tests:results.length,pass:results.every(r=>r.pass),unhandled}));
