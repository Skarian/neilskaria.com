import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const out=path.resolve('.agents/artifacts/perf/gpu-boot-atlas-preview-20261012'),base='https://portfolio-2sjb3u0sj-neil-skarias-projects.vercel.app',hash=b=>createHash('sha256').update(b).digest('hex'),log=fs.readFileSync(out+'/deploy.log','utf8'),manifest=JSON.parse(fs.readFileSync(out+'/source-manifest.json'));
const checks=[],check=(name,pass,detail)=>{checks.push({name,pass,detail});if(!pass)throw Error(name);};
check('hosted exact source file count',log.includes('Downloading 96 deployment files'));
check('hosted Linux source build',log.includes('Running build in Washington')&&log.includes('Using @sveltejs/adapter-vercel')&&log.includes('Build Completed in /vercel/output'));
const model=log.match(/precompress: (bedroom\.[\w-]+\.glb) (\d+) -> (\d+) bytes/);check('precompression build log',!!model,model?.slice(1));
for(const route of ['/', '/lab/boot','/lab/boot?bootCanvas=will-read-frequently','/lab/boot?bootCanvas=gpu-atlas','/boot-atlas.png','/_app/immutable/assets/'+model[1]+'.br']){
 const r=await fetch(base+route),b=Buffer.from(await r.arrayBuffer()),headers=Object.fromEntries(r.headers);
 check(route+' 200',r.status===200,{status:r.status,headers,decodedBytes:b.length,sha256:hash(b)});
 if(route==='/boot-atlas.png'){fs.writeFileSync(out+'/hosted-boot-atlas.png',b);check('PNG exact reviewed bytes',b.length===37034&&hash(b)==='e7eb731d0e0ddeaa44e3d5cf0c700e05211bd2a595a908c3eade1c36b2fafc6e');}
 if(route.endsWith('.br')){const original=fs.readFileSync(out+'/source-stage/src/lib/boot/assets/bedroom.glb');check('brotli routing and exact decoded model',headers['content-encoding']==='br'&&headers['content-type'].includes('model/gltf-binary')&&hash(b)===hash(original));}
}
fs.writeFileSync(out+'/hosted-packaging.json',JSON.stringify({checks,passed:true},null,2));console.log('Hosted packaging passed');
