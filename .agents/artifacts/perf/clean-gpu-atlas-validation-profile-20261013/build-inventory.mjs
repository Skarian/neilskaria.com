import fs from 'node:fs';import {out,write,hash,verify} from './prepare.mjs';import {brotliCompressSync,brotliDecompressSync,constants,gzipSync} from 'node:zlib';
fs.copyFileSync('.agents/artifacts/perf/clean-canvas-stress-trace-repair-20261013/cdp.mjs',out+'/cdp.mjs');
let c=fs.readFileSync(out+'/cdp.mjs','utf8').replace("export async function launch(dir,phase='measured')","export async function launch(dir,phase='measured',profileDir=dir+'/profile')").replace("'--user-data-dir='+dir+'/profile'","'--user-data-dir='+profileDir");fs.writeFileSync(out+'/cdp.mjs',c);
const rows=[];
for(const v of ['original','atlas']){
 const base=out+'/'+v+'/source/.svelte-kit/output/client';
 function walk(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+f.name;if(f.isDirectory())walk(p);else{const b=fs.readFileSync(p);rows.push({variant:v,path:p.slice(base.length+1),bytes:b.length,gzipBytes:gzipSync(b).length,sha256:hash(b)});if(f.name.endsWith('.js')&&/__firstbootDiagnostic|bootCanvas|context-control|diag\.mark/.test(b.toString()))throw Error('diagnostic runtime '+p);}}}walk(base);
 const file=fs.readdirSync(base+'/_app/immutable/assets').find(n=>/^bedroom\.[\w-]+\.glb$/.test(n));const raw=fs.readFileSync(base+'/_app/immutable/assets/'+file),br=brotliCompressSync(raw,{params:{[constants.BROTLI_PARAM_QUALITY]:11,[constants.BROTLI_PARAM_SIZE_HINT]:raw.length}});
 fs.mkdirSync(out+'/'+v+'/delivery');fs.writeFileSync(out+'/'+v+'/delivery/'+file+'.br',br);if(hash(brotliDecompressSync(br))!==hash(raw))throw Error('br mismatch');rows.push({variant:v,path:file+'.br',encodedBytes:br.length,decodedBytes:raw.length,encodedHash:hash(br),decodedHash:hash(raw)});
}
write('build-inventory.json',rows);console.log({inventory:rows.length,checks:verify()});
