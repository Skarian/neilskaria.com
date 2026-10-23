import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import {launch} from '../lean-stutter-fix/cdp.mjs';
const out=path.resolve('.agents/artifacts/perf/preview-delivery');
const base='https://portfolio-k0w0vbifj-neil-skarias-projects.vercel.app';
const deployment={id:'dpl_7QwaEX49La39Gts67jG3KF5SY8UP',url:base,revision:'d82230acab7f4e2be780afd0847330a6926573d1',target:'preview',status:'READY'};
fs.writeFileSync(out+'/deployment.json',JSON.stringify(deployment,null,2));
const http=[];
for(const p of ['/lab/boot','/api/stations']){const r=await fetch(base+p);const body=await r.text();http.push({path:p,status:r.status,title:body.match(/<title>(.*?)<\/title>/)?.[1],...(p.includes('stations')?{body:JSON.parse(body)}:{})});}
fs.writeFileSync(out+'/http.json',JSON.stringify(http,null,2));console.log(JSON.stringify(http));
const b=await launch({url:base+'/lab/boot',dir:out+'/smoke-profile'});
const responses=[],failures=[],checks=[];
b.on(m=>{if(m.method==='Network.responseReceived') responses.push({url:m.params.response.url,status:m.params.response.status,mime:m.params.response.mimeType});if(m.method==='Network.loadingFailed')failures.push(m.params);});
await b.send('Network.enable');await b.go();
await b.waitFor('document.querySelector("[data-start]") && !document.querySelector("[data-start]").disabled',60000);await b.sleep(2000);
async function state(name){await b.shot(out+'/'+name+'.png');console.log(JSON.stringify({shot:name,text:await b.ev('document.body.innerText'),panels:await b.ev("[...document.querySelectorAll('.panel')].map(p=>({label:p.getAttribute('aria-label'),inert:p.inert,hidden:p.getAttribute('aria-hidden')}))")}));}
await state('desktop-room');
const rl=readline.createInterface({input:process.stdin,output:process.stdout,terminal:false});
try{for await(const line of rl){const a=JSON.parse(line);if(a.action==='close')break;if(a.action==='click'){await b.click(a.x,a.y);await b.sleep(a.wait??1400);}if(a.action==='selector'){const p=await b.ev(`(()=>{const n=document.querySelector(${JSON.stringify(a.selector)});if(!n)throw Error('missing selector');const r=n.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await b.click(p.x,p.y);await b.sleep(a.wait??1400);}if(a.action==='mobile'){await b.send('Emulation.setDeviceMetricsOverride',{width:412,height:915,deviceScaleFactor:2,mobile:true});await b.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});await b.sleep(1600);}if(a.action==='check'){checks.push({name:a.name,pass:!!(await b.ev(a.expression))});}if(a.action==='state')await state(a.name);if(a.action==='code'){const scripts=responses.filter(r=>r.url.startsWith(base)&&r.mime.includes('javascript'));const code=[];for(const r of scripts){const text=await(await fetch(r.url)).text();code.push({url:r.url,bytes:text.length,drawImage:text.includes('drawImage'),scratch:text.includes('scratch'),glyphs:text.includes('glyphs'),debugHook:/__lean|__panelPerf|__boot|__camera/.test(text)});}fs.writeFileSync(out+'/emitted-code.json',JSON.stringify(code,null,2));console.log(JSON.stringify(code));}console.log('DONE',a.action);}}
finally{fs.writeFileSync(out+'/smoke.json',JSON.stringify({deployment,environment:{browser:await b.send('Browser.getVersion'),desktop:{width:1280,height:800},mobile:{width:412,height:915,dpr:2}},checks,errors:b.errors,responses,failures},null,2));b.close();rl.close();}
