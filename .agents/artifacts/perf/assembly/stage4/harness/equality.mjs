import { createRequire } from 'node:module';
import fs from 'node:fs';import { createHash } from 'node:crypto';import { brotliCompressSync,constants } from 'node:zlib';
const require=createRequire('C:/projects/neilskaria.com-stage4/package.json');
const {NodeIO}=require('@gltf-transform/core'),{ALL_EXTENSIONS}=require('@gltf-transform/extensions'),draco=require('draco3dgltf');
const dir=process.env.TEMP+'/impl/stage4',base='C:/projects/neilskaria.com-stage4/src/lib/boot/assets/';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco.createDecoderModule()});
const hash=a=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
function material(m){return {name:m.getName(),extras:m.getExtras(),base:m.getBaseColorFactor(),emissive:m.getEmissiveFactor(),roughness:m.getRoughnessFactor(),metalness:m.getMetallicFactor(),alpha:m.getAlphaMode(),cutoff:m.getAlphaCutoff(),double:m.getDoubleSided(),textures:['BaseColor','Emissive','Normal','Occlusion','MetallicRoughness'].map(k=>{const t=m['get'+k+'Texture']();return t?{image:hash(t.getImage()),mime:t.getMimeType(),info:m['get'+k+'TextureInfo']().getTexCoord()}:null})}}
function node(n){return {name:n.getName(),parent:n.getParentNode()?.getName()??'Scene',world:n.getWorldMatrix(),children:n.listChildren().map(c=>c.getName()),extras:n.getExtras(),mesh:n.getMesh()?.listPrimitives().map(p=>({mode:p.getMode(),indices:p.getIndices()?hash(p.getIndices().getArray()):null,attributes:Object.fromEntries(p.listSemantics().map(k=>{const a=p.getAttribute(k);return[k,{hash:hash(a.getArray()),type:a.getType(),normalized:a.getNormalized()}]})),material:material(p.getMaterial())}))}}
const a=await io.read(dir+'/baseline.glb'),parts=await Promise.all(['shell','sp','cube','clock','bonsai'].map(g=>io.read(base+'room-'+g+'.glb')));
const before=a.getRoot().listNodes().map(node).sort((a,b)=>a.name.localeCompare(b.name));
const after=parts.flatMap(p=>p.getRoot().listNodes().map(node)).sort((a,b)=>a.name.localeCompare(b.name));
const failures=[];if(before.length!==after.length)failures.push('node count');for(let i=0;i<before.length;i++)if(JSON.stringify(before[i])!==JSON.stringify(after[i]))failures.push(before[i].name);
const textures=parts.flatMap(p=>p.getRoot().listTextures().map(t=>hash(t.getImage())));
const sizes=['baseline',...['shell','sp','cube','clock','bonsai']].map(g=>{const b=fs.readFileSync(g==='baseline'?dir+'/baseline.glb':base+'room-'+g+'.glb');return{group:g,raw:b.length,brotli:brotliCompressSync(b,{params:{[constants.BROTLI_PARAM_QUALITY]:11,[constants.BROTLI_PARAM_SIZE_HINT]:b.length}}).length}});
const out={nodes:before.length,failures,textureCount:textures.length,uniqueTextures:new Set(textures).size,sizes};fs.writeFileSync(dir+'/equality.json',JSON.stringify(out,null,2));fs.writeFileSync(dir+'/nodes-before.json',JSON.stringify(before));fs.writeFileSync(dir+'/nodes-after.json',JSON.stringify(after));console.log(JSON.stringify(out,null,2));
