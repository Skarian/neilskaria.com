import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';import {launch} from './cdp.mjs';
const root=process.cwd(),out=path.resolve('.agents/artifacts/perf/gpu-boot-atlas-prototype-20261012'),stage=out+'/source-stage';
const config=out+'/filter-grad-probe-extended-vite.config.ts';fs.writeFileSync(config,`import {mergeConfig} from 'vite';import config from './source-stage/vite.config.ts';export default mergeConfig(config,{server:{fs:{allow:${JSON.stringify([stage,root+'/node_modules'])}}}});`);
const server=spawn(process.execPath,[root+'/node_modules/vite/bin/vite.js','dev','--config',config,'--host','127.0.0.1','--port','4299','--strictPort'],{cwd:stage,windowsHide:true,stdio:'pipe'});let log='';for(const st of [server.stdout,server.stderr])st.on('data',d=>{log+=d;fs.writeFileSync(out+'/filter-grad-probe-extended-server.log',log);});
const checks=[];const check=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});if(!pass)throw Error(name+' '+JSON.stringify(detail));};
try{
for(let i=0;i<150&&!log.includes('Local:');i++)await new Promise(r=>setTimeout(r,200));if(!log.includes('Local:'))throw Error(log);
for(const mode of ['gpu-atlas']){
 const b=await launch({url:'http://127.0.0.1:4299/lab/boot'+(mode==='default'?'':'?bootCanvas='+mode),profile:'phone',dir:out+'/profiles/extended-'+mode});
 try{
 await b.go();check(mode+' START',await b.waitFor('document.querySelector("[data-start]")&&!document.querySelector("[data-start]").disabled',60000));await b.sleep(1500);
 const click=async expr=>{const p=await b.ev(`(()=>{const n=${expr};const r=n.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);await b.click(p.x,p.y);};
 await click('document.querySelector("[data-start]")');check(mode+' boot mode',await b.waitFor('__boot.mode==="booting"',4000));
 if(mode!=='default'){await b.ev(`__boot.scene.traverse(o=>{const t=o.material?.uniforms?.atlas?.value;if(t){o.material.fragmentShader=o.material.fragmentShader.replace('vec2 uv=(q-rects[i].xy)/rects[i].zw;','vec2 uv=(q-rects[i].xy)/rects[i].zw;vec2 atlasUv=regions[i].xy+uv*regions[i].zw;vec2 dx=dFdx(atlasUv),dy=dFdy(atlasUv);').replace('texture2D(atlas,regions[i].xy+uv*regions[i].zw).a','textureGrad(atlas,atlasUv,dx,dy).a');o.material.needsUpdate=true;t.generateMipmaps=true;t.minFilter=__boot.THREE.LinearMipmapLinearFilter;t.needsUpdate=true;}});void 0`);
 for(const t of [0,.7,1.9,2.78,3.95]){
 await b.ev(`__boot.timeline.pause().seek(${2.8+t+.000001},false);void 0`);await b.sleep(160);
 const boot=await b.ev('__boot.s.boot');check(mode+' fixed boot time '+t,Math.abs(boot-t)<.00001,boot);await b.shot(out+'/filter-grad-probe-3d-'+mode+'-'+String(t).replace('.','_')+'.png');
 }
 }
 await click('document.querySelector("[data-skip]")');check(mode+' trusted skip',await b.waitFor('__boot.mode==="site"&&!document.documentElement.dataset.intro',4000));
 let d=await b.ev('__firstbootDiagnostic.snapshot()');check(mode+' skipped full completion false',!d.completion.first&&d.unobserved[0].markers.includes('boot-animation-complete'),d.completion);
 await click('[...document.querySelectorAll("button")].find(n=>n.textContent.includes("BACK TO THE ROOM"))');check(mode+' returning',await b.waitFor('__boot.mode==="returning"',4000));await b.sleep(300);await b.shot(out+'/filter-grad-probe-3d-'+mode+'-solid-return.png');
 await click('document.querySelector("[data-skip]")');check(mode+' return interrupted by skip',await b.waitFor('__boot.mode==="site"',4000));
 await click('[...document.querySelectorAll("button")].find(n=>n.textContent.includes("BACK TO THE ROOM"))');check(mode+' full return after interruption',await b.waitFor('__boot.mode==="room"&&document.querySelector("[data-start]")',10000));await b.sleep(1200);
 const power=await b.ev(`(()=>{let v;__boot.scene.traverse(o=>{if(o.material?.uniforms?.atlas)v=o.material.uniforms.powered.value;else if(o.name==='Screen')v=o.material.map===null;});return v;})()`);
 if(mode==='gpu-atlas')check(mode+' powered off',power===0,power);
 await b.shot(out+'/filter-grad-probe-3d-'+mode+'-powered-off.png');
 await click('document.querySelector("[data-start]")');check(mode+' START after skip',await b.waitFor('__boot.mode==="booting"',4000));await b.sleep(450);
 await b.ev(`window.disposal={material:0,texture:0,geometry:0};__boot.scene.traverse(o=>{if(o.material?.uniforms?.atlas){o.material.addEventListener('dispose',()=>disposal.material++);o.material.uniforms.atlas.value.addEventListener('dispose',()=>disposal.texture++);o.geometry.addEventListener('dispose',()=>disposal.geometry++);}});const a=document.createElement('a');a.href='/';a.id='fixture-unmount';a.textContent='fixture unmount';Object.assign(a.style,{position:'fixed',top:'50px',left:'0',zIndex:2147483647,background:'white',padding:'12px'});document.body.append(a);`);
 await click('document.querySelector("#fixture-unmount")');check(mode+' SPA unmount during boot',await b.waitFor('location.pathname==="/"&&!document.querySelector(".room-layer")',6000));await b.sleep(600);
 d=await b.ev('__firstbootDiagnostic.snapshot()');const disposal=await b.ev('disposal');
 if(mode==='gpu-atlas'){check(mode+' GPU resources disposed',disposal.material>=1&&disposal.texture>=1&&disposal.geometry>=1,disposal);check(mode+' bitmap disposal recorded',d.events.some(e=>e.kind==='atlas-disposed'));}
 check(mode+' no script errors',b.errors.length===0,b.errors);
 fs.writeFileSync(out+'/filter-grad-probe-extended-'+mode+'.json',JSON.stringify({checks:checks.filter(c=>c.name.startsWith(mode)),disposal,diagnostic:d,errors:b.errors},null,2));
 }finally{b.close();}
}
fs.writeFileSync(out+'/filter-grad-probe-extended-validation.json',JSON.stringify({checks},null,2));console.log(JSON.stringify({checks:checks.length,passed:true}));
}catch(e){fs.writeFileSync(out+'/filter-grad-probe-extended-failure-'+Date.now()+'.json',JSON.stringify({error:String(e),checks},null,2));throw e;}finally{server.kill();}

