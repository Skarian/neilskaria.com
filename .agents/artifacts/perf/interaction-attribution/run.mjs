import {launch} from './cdp.mjs';
import fs from 'node:fs';
const dir='.agents/artifacts/perf/interaction-attribution';
const configs=process.argv[2].split(',').map(x=>{const [thing,rate,variant,rep]=x.split(':');return {thing,rate:+rate,variant,rep:+rep};});
for(const c of configs){
 const name=[c.thing,c.rate+'x',c.variant,c.rep].join('-');
 if(fs.existsSync(dir+'/'+name+'.json'))throw Error('capture already exists '+name);
 const b=await launch({url:'http://localhost:4292/lab/boot?interaction-control='+c.variant+(c.variant==='light'?'&light=1':''),dir:dir+'/temporary-profiles/'+name});
 try{
  await b.send('Emulation.setCPUThrottlingRate',{rate:c.rate});
  await b.send('Network.enable');const network=[];
  b.on(m=>{if(m.method==='Network.requestWillBeSent')network.push({type:m.params.type,url:m.params.request.url,t:m.params.timestamp});});
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:"window.__obs={events:[],long:[]};for(const type of ['pointermove','pointerdown','click'])document.addEventListener(type,e=>__obs.events.push({type,t:performance.now(),x:e.clientX,y:e.clientY,target:e.target.tagName}),true);new PerformanceObserver(l=>__obs.long.push(...l.getEntries().map(e=>({t:e.startTime,d:e.duration})))).observe({type:'longtask',buffered:true});"});
  await b.go();
  if(!await b.waitFor('window.__attrib?.ready && document.querySelector("[data-start]")',60000))throw Error('room not ready');
  let reference=null;
  if(c.variant!=='A'){
   const candidates=fs.readdirSync(dir).filter(n=>n.startsWith(c.thing+'-'+c.rate+'x-A-')&&n.endsWith('.json')).sort((a,b)=>fs.statSync(dir+'/'+b).mtimeMs-fs.statSync(dir+'/'+a).mtimeMs);
   reference=candidates[0];if(!reference)throw Error('no matched baseline');
   const r=JSON.parse(fs.readFileSync(dir+'/'+reference));
   const bound=r.ops.find(o=>o.kind==='bounds'&&o.thing===c.thing)?.rect;
   const fractions=r.ops.filter(o=>o.kind==='fit'&&o.thing===c.thing).map(o=>[o.freeAbove,o.freeLeft]);
   await b.ev('__attrib.bounds['+JSON.stringify(c.thing)+']='+JSON.stringify(bound));
   if(c.variant==='P')await b.ev('__attrib.replay={['+JSON.stringify(c.thing)+']:'+JSON.stringify(r.ops.filter(o=>o.kind==='setFree'&&o.t>=r.actions[0].start&&o.t<r.actions[0].start+1300).map(o=>({side:o.side,fraction:o.fraction})))+'}');
   if(c.variant==='F')await b.ev('__attrib.prewarmViews('+JSON.stringify(c.thing)+','+JSON.stringify(fractions)+')');
   if(c.variant==='N')await b.ev("(()=>{const start=performance.now();window.__noiseData={};for(const rate of [44100,48000]){const a=new Float32Array(rate*2);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;__noiseData[rate]=a;}__attrib.ops.push({kind:'prewarmNoise',t:start,ms:performance.now()-start});})()");
  }
  await b.sleep(2500);if(b.errors.length)throw Error(b.errors[0]);
  const environment=await b.ev("(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {ua:navigator.userAgent,renderer:gl.getParameter(e.UNMASKED_RENDERER_WEBGL),viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,canvas:[gl.drawingBufferWidth,gl.drawingBufferHeight],timer:__diag.gpu.supported}})()");
  const actions=[];
  async function select(label){
   const p=await b.ev('__attrib.project('+JSON.stringify(c.thing)+')');
   const start=await b.ev('performance.now()');await b.click(p.x,p.y);await b.sleep(1300);
   actions.push({label,start,end:await b.ev('performance.now()'),state:await b.ev('__attrib.state()')});
  }
  await select('first');
  if(c.variant==='P')await b.waitFor('document.querySelector(".panel .back")',3000);
  const p=await b.ev("(()=>{const r=document.querySelector('.panel .back').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
  await b.click(p.x,p.y);await b.sleep(1500);
  await select('repeat');
  const data=await b.ev('({gpu:__diag.gpu,frames:__attrib.frames,ops:__attrib.ops,observer:__obs,state:__attrib.state()})');
  if(b.errors.length)throw Error(b.errors[0]);if(actions.some(a=>a.state.focused!==c.thing))throw Error('selection failed');
  fs.writeFileSync(dir+'/'+name+'.json',JSON.stringify({config:c,reference,environment,actions,network,errors:b.errors,...data}));
  console.log('DONE',name,environment);
 }finally{b.close();}
}
