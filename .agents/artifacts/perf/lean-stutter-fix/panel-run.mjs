import fs from 'node:fs';import{launch}from './lean-stutter-work.tmp/cdp.mjs';
const root='lean-stutter-work.tmp';
for(const item of process.argv[2].split(',')){
 const [rateText,thing,variant,rep]=item.split(':');const rate=+rateText,name=`panel-${rate}x-${thing}-${variant}-${rep}`;
 if(fs.existsSync(`${root}/${name}.json`))throw Error('exists '+name);
 const b=await launch({url:'http://localhost:4292/lab/boot',dir:root+'/profiles/'+name});
 try{
  await b.send('Emulation.setCPUThrottlingRate',{rate});
  await b.send('Network.enable');const network=[];b.on(m=>{if(m.method==='Network.requestWillBeSent')network.push({type:m.params.type,url:m.params.request.url,t:m.params.timestamp});});
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:"window.__obs={long:[],events:[],writes:[]};for(const type of ['click','pointerdown'])document.addEventListener(type,e=>__obs.events.push({type,t:performance.now(),target:e.target.tagName}),true);new PerformanceObserver(l=>__obs.long.push(...l.getEntries().map(e=>({t:e.startTime,d:e.duration})))).observe({type:'longtask',buffered:true});const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){__obs.writes.push({t:performance.now(),k,v});return set.call(this,k,v)};"});
  await b.go();if(!await b.waitFor('window.__lean?.ready && document.querySelector("[data-start]")',60000))throw Error('not ready '+b.errors.join(' '));
  await b.sleep(2500);
  const environment=await b.ev("(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {ua:navigator.userAgent,renderer:gl.getParameter(e.UNMASKED_RENDERER_WEBGL),viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,buffer:[gl.drawingBufferWidth,gl.drawingBufferHeight]}})()");
  const prepared=await b.ev("({panels:[...document.querySelectorAll('.panel')].map(p=>({label:p.getAttribute('aria-label'),hidden:p.getAttribute('aria-hidden'),inert:p.inert,visibility:getComputedStyle(p).visibility,controls:p.querySelectorAll('button,input').length})),preparation:window.__panelPerf||[],storage:{...localStorage},audioContext:document.querySelectorAll('iframe').length})");
  const actions=[];
  async function select(label){const p=await b.ev(`__lean.project(${JSON.stringify(thing)})`),start=await b.ev('performance.now()');await b.click(p.x,p.y);await b.sleep(1300);actions.push({label,start,end:await b.ev('performance.now()'),state:await b.ev('__lean.state()')});}
  await select('first');
  const p=await b.ev("(()=>{const r=document.querySelector('.panel:not([inert]) .back').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");await b.click(p.x,p.y);await b.sleep(1500);await select('repeat');
  const data=await b.ev('({ready:__lean.ready,frames:__lean.frames,ops:__lean.ops,observer:__obs,state:__lean.state()})');
  if(b.errors.length)throw Error(b.errors[0]);if(actions.some(a=>a.state.focused!==thing))throw Error('selection failed');
  fs.writeFileSync(`${root}/${name}.json`,JSON.stringify({name,rate,thing,variant,environment,prepared,actions,network,...data}));
  const results=actions.map(a=>{const click=data.observer.events.find(e=>e.type==='click'&&e.target==='CANVAS'&&e.t>=a.start).t;const fslice=data.frames.filter(f=>f.t>=click&&f.t<click+1300);const gaps=fslice.map(f=>f.t-data.frames[data.frames.indexOf(f)-1].t).sort((a,b)=>a-b);return{label:a.label,max:gaps.at(-1),p95:gaps[Math.ceil(gaps.length*.95)-1],camera:fslice.find(f=>f.blend>0)?.t-click,fitCount:data.ops.filter(o=>o.kind==='fit'&&o.t>=click&&o.t<click+1300).length};});
  console.log(name,{ready:data.ready,prepared:prepared.preparation,results});
 }finally{b.close();}
}
