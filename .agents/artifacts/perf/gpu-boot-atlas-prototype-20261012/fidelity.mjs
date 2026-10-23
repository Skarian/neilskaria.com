import fs from 'node:fs';import path from 'node:path';import sharp from 'sharp';import {spawn} from 'node:child_process';import {launch} from './cdp.mjs';
const root=process.cwd(),out=path.resolve('.agents/artifacts/perf/gpu-boot-atlas-prototype-20261012'),stage=out+'/source-stage';
fs.mkdirSync(out+'/fidelity',{recursive:true});
const config=out+'/fidelity-vite.config.ts';fs.writeFileSync(config,`import {mergeConfig} from 'vite';import config from './source-stage/vite.config.ts';export default mergeConfig(config,{server:{fs:{allow:${JSON.stringify([stage,root+'/node_modules'])}}}});`);
const server=spawn(process.execPath,[root+'/node_modules/vite/bin/vite.js','dev','--config',config,'--host','127.0.0.1','--port','4298','--strictPort'],{cwd:stage,windowsHide:true,stdio:'pipe'});
let log='';for(const stream of [server.stdout,server.stderr])stream.on('data',d=>{log+=d;fs.writeFileSync(out+'/fidelity-server.log',log);});
let b;
try{
 for(let i=0;i<150&&!log.includes('Local:');i++)await new Promise(r=>setTimeout(r,200));if(!log.includes('Local:'))throw Error(log);
 b=await launch({url:'http://127.0.0.1:4298/?diagnostic=off',dir:out+'/profiles/fidelity'});await b.go();
 await b.ev(`document.documentElement.innerHTML='<head></head><body></body>'`);
 // This isolated harness deliberately reads rendered pixels. The lightweight recorder never does.
 await b.ev(`(async()=>{const THREE=await import('/node_modules/.vite/deps/three.js');const {createBootAtlas}=await import('/src/lib/boot/boot-atlas.ts');const {drawBootScreen}=await import('/src/lib/boot/boot-screen.ts');const renderer=new THREE.WebGLRenderer({antialias:false});renderer.setSize(960,640);renderer.setPixelRatio(1);const scene=new THREE.Scene();const camera=new THREE.OrthographicCamera(-1,1,1,-1,0.1,10);camera.position.z=1;const geometry=new THREE.PlaneGeometry(2,2);const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,1-uv.getY(i));const mesh=new THREE.Mesh(geometry);scene.add(mesh);const reference=document.createElement('canvas');reference.width=960;reference.height=640;const ctx=reference.getContext('2d',{willReadFrequently:true});window.fixture={THREE,createBootAtlas,drawBootScreen,renderer,scene,camera,geometry,mesh,reference,ctx};})()`);
 const results=[];const times=[0,.35,.7,1.1,1.5,1.9,2.4,2.78,3.5,3.7,3.95];
 for(const [variant,endColor] of [['light','#f8faf8'],['dark','#171923'],['colour','#bf6527']]){
 await b.ev(`(async()=>{const f=fixture;f.gpu=f.createBootAtlas(${JSON.stringify(endColor)});await f.gpu.ready;f.gpu.power(true);f.mesh.material=f.gpu.material;})()`);
 for(const t of times){
 const data=await b.ev(`(()=>{const f=fixture;f.drawBootScreen(f.ctx,${t},${JSON.stringify(endColor)});f.gpu.prepare(${t},false,0);f.renderer.render(f.scene,f.camera);return{canvas:f.reference.toDataURL('image/png').split(',')[1],gpu:f.renderer.domElement.toDataURL('image/png').split(',')[1]};})()`);
 const name=variant+'-'+String(t).replace('.','_');const a=Buffer.from(data.canvas,'base64'),g=Buffer.from(data.gpu,'base64');fs.writeFileSync(out+'/fidelity/'+name+'-canvas.png',a);fs.writeFileSync(out+'/fidelity/'+name+'-gpu.png',g);
 const ar=await sharp(a).ensureAlpha().raw().toBuffer(),gr=await sharp(g).ensureAlpha().raw().toBuffer();let sum=0,max=0,changed=0,over32=0;const diff=Buffer.alloc(ar.length);let edgeSum=0,edgeCount=0;
 for(let i=0;i<ar.length;i+=4){let delta=0;for(let c=0;c<3;c++){const d=Math.abs(ar[i+c]-gr[i+c]);sum+=d;max=Math.max(max,d);delta=Math.max(delta,d);diff[i+c]=Math.min(255,d*4);}diff[i+3]=255;if(delta>0)changed++;if(delta>32)over32++;const isEdge=t<3.5 && (ar[i]!==248||ar[i+1]!==250||ar[i+2]!==248);if(isEdge){edgeSum+=delta;edgeCount++;}}
 await sharp(diff,{raw:{width:960,height:640,channels:4}}).png().toFile(out+'/fidelity/'+name+'-diff-x4.png');results.push({variant,endColor,t,meanAbsRgb:sum/(960*640*3),maxChannelDelta:max,changedPixels:changed,pixelsOver32:over32,foregroundMeanMaxDelta:edgeCount?edgeSum/edgeCount:0});
 }
 // Solid return and power-off must match sRGB Canvas composition, including intermediate fade.
 for(const fade of [0,.25,.7,1]){
 const data=await b.ev(`(()=>{const f=fixture;f.ctx.fillStyle=${JSON.stringify(endColor)};f.ctx.fillRect(0,0,960,640);f.ctx.fillStyle='rgba(0,0,0,${fade})';f.ctx.fillRect(0,0,960,640);f.gpu.prepare(4,true,${fade});f.renderer.render(f.scene,f.camera);return{canvas:f.reference.toDataURL().split(',')[1],gpu:f.renderer.domElement.toDataURL().split(',')[1]};})()`);
 const a=await sharp(Buffer.from(data.canvas,'base64')).raw().toBuffer(),g=await sharp(Buffer.from(data.gpu,'base64')).raw().toBuffer();results.push({variant,returnFade:fade,canvasCentre:[...a.subarray((320*960+480)*4,(320*960+480)*4+4)],gpuCentre:[...g.subarray((320*960+480)*4,(320*960+480)*4+4)]});
 }
 const off=await b.ev(`(()=>{const f=fixture;f.gpu.power(false);f.renderer.render(f.scene,f.camera);return f.renderer.domElement.toDataURL().split(',')[1];})()`);fs.writeFileSync(out+'/fidelity/'+variant+'-off.png',Buffer.from(off,'base64'));
 await b.ev('fixture.gpu.dispose()');
 }
 fs.writeFileSync(out+'/fidelity/results.json',JSON.stringify({description:'Fixed source-time screen comparison. Canvas uses same installed Windows fonts. GPU uses one offline atlas. Diffs are RGB output pixels, x4 visual amplification. No pass threshold is invented.',results,errors:b.errors},null,2));
 await b.ev('fixture.geometry.dispose();fixture.renderer.dispose();fixture.renderer.forceContextLoss()');console.log(JSON.stringify({comparisons:results.length,errors:b.errors}));
}finally{b?.close();server.kill();}

