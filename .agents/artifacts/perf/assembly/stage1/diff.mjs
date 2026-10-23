import {launch} from './cdp.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import sharp from 'file:///C:/projects/neilskaria.com/node_modules/sharp/dist/index.mjs';
const root='C:/projects/neilskaria.com-landing',out='C:/projects/neilskaria.com/.agents/artifacts/perf/assembly/stage1';
const files=['src/lib/boot/engine.ts','src/lib/boot/BootIntro.svelte','src/routes/lab/boot/+page.svelte'];
const saved=Object.fromEntries(files.map(f=>[f,readFileSync(root+'/'+f,'utf8')]));
const rows=[];
async function shot(profile,variant,label){
 const b=await launch({url:'http://localhost:5190/lab/boot'+(variant?'?'+variant:''),profile,dir:process.env.TEMP+'/impl/landing/diff-'+profile+'-'+label,storage:{'boot-muted':'1'}});
 try{
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`let seed=11;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};const NativeDate=Date;window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[1791672000000]))}static now(){return 1791672000000}};`});
  b.on(async m=>{
   if(m.method!=='Fetch.requestPaused')return;
   const id=m.params.requestId;
   if(m.params.responseStatusCode){
    const r=await b.send('Fetch.getResponseBody',{requestId:id});
    let src=r.result.base64Encoded?Buffer.from(r.result.body,'base64').toString():r.result.body;
    const i=src.indexOf('__boot:');
    if(i<0)throw Error('No hook');
    const tail=src.indexOf('} });',i);
    src=src.slice(0,tail)+', renderer, render '+src.slice(tail);
    await b.send('Fetch.fulfillRequest',{requestId:id,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/javascript'}],body:Buffer.from(src).toString('base64')});
   }else await b.send('Fetch.continueRequest',{requestId:id});
  });
  await b.send('Fetch.enable',{patterns:[{urlPattern:'*/src/lib/boot/engine.ts*',requestStage:'Response'}]});
  await b.go();
  if(!await b.waitFor('window.__boot?.mode==="room"',45000))throw Error('Not ready '+b.errors);
  await b.sleep(2200);
  await b.ev(`window.__boot.renderer.setAnimationLoop(null);window.__boot.landing?.finish();const st=document.createElement('style');st.textContent='*,*::before,*::after{animation:none!important;transition:none!important}';st.textContent+='.glass::after{transform:none!important}';document.head.append(st);window.__boot.render(1000000);`);
  await b.sleep(100);
  const snap=await b.send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width:b.P.w,height:b.P.h,scale:1/b.P.dpr}});writeFileSync(out+'/'+profile+'-'+label+'-fixed.png',Buffer.from(snap.result.data,'base64'));
  const transforms=await b.ev(`(()=>{const {scene,THREE}=__boot;const sp=scene.getObjectByName('SP');const cube=scene.getObjectByName('Rubiks');return {sp:{position:sp.position.toArray(),rotation:sp.rotation.toArray(),size:new THREE.Box3().setFromObject(sp).getSize(new THREE.Vector3()).toArray()}}})()`);
  console.log(profile,label,JSON.stringify({errors:b.errors,transforms}));
  return {errors:b.errors,transforms};
 }finally{b.close()}
}
try{
 for(const f of files)writeFileSync(root+'/'+f,execFileSync('git',['show','5a9cf09:'+f],{cwd:root}));
 await new Promise(r=>setTimeout(r,2500));
 for(const p of ['desktop','phone'])await shot(p,'','baseline');
}finally{for(const f of files)writeFileSync(root+'/'+f,saved[f])}
await new Promise(r=>setTimeout(r,2500));
for(const p of ['desktop','phone'])for(const v of ['','land','land=2']){
 const label=v?v.replace('=','-'):'default';const info=await shot(p,v,label);
 const a=await sharp(out+'/'+p+'-baseline-fixed.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const b=await sharp(out+'/'+p+'-'+label+'-fixed.png').ensureAlpha().raw().toBuffer();
 let pixels=0,sum=0,max=0;const buf=Buffer.alloc(a.data.length);
 for(let i=0;i<a.data.length;i+=4){let changed=false;for(let c=0;c<3;c++){const d=Math.abs(a.data[i+c]-b[i+c]);sum+=d;max=Math.max(max,d);buf[i+c]=d;changed||=d>0}buf[i+3]=255;if(changed)pixels++}
 await sharp(buf,{raw:a.info}).png().toFile(out+'/'+p+'-'+label+'-diff.png');
 const row={profile:p,variant:v||'default',width:a.info.width,height:a.info.height,changedPixels:pixels,totalPixels:a.info.width*a.info.height,maxChannelDifference:max,meanChannelDifference:sum/(a.info.width*a.info.height*3),...info};rows.push(row);console.log(JSON.stringify(row));
}
writeFileSync(out+'/settled-diff.json',JSON.stringify(rows,null,2));process.exit(0);





