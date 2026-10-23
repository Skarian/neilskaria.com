import fs from 'node:fs';import {spawn} from 'node:child_process';import {out,hash} from './setup.mjs';import {launch,sleep,beginTrace} from './cdp.mjs';
const name=process.argv[2];if(!['mouse','touch'].includes(name))throw Error('session');const dir=out+'/runs/'+name;if(fs.existsSync(dir))throw Error('already exists');fs.mkdirSync(dir,{recursive:true});
let b,trace,server;const data={name,valid:false,node:process.version,cpuRate:1,network:{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1},actions:[],traces:[]},network=[];let log='';
try{
server=spawn(process.execPath,[out+'/server.mjs','hint'],{windowsHide:true});data.serverPid=server.pid;server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);for(let i=0;i<100&&!log.includes('READY');i++)await sleep(100);if(!log.includes('READY'))throw Error(log);
b=await launch(dir);data.pid=b.pid;data.version=b.version;data.args=b.args;data.system=await b.browser.send('SystemInfo.getInfo');data.commandLine=await b.browser.send('Browser.getBrowserCommandLine');b.page.on(m=>{if(m.method.startsWith('Network.'))network.push(m)});
await b.page.send('Page.addScriptToEvaluateOnNewDocument',{source:fs.readFileSync(out+'/base-hook.js','utf8')+'\n'+fs.readFileSync(out+'/gl-hook.js','utf8')});
await b.page.send('Emulation.setCPUThrottlingRate',{rate:1});await b.page.send('Network.emulateNetworkConditions',data.network);await b.page.send('Network.setCacheDisabled',{cacheDisabled:false});if(name==='touch')await b.page.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
async function startTrace(label){let p=dir+'/'+label;fs.mkdirSync(p);trace=await beginTrace(b,p)}
async function endTrace(label){data.traces.push({label,...await trace.end()});trace=null}
async function point(expr){return b.ev("(()=>{let e="+expr+";if(!e)throw Error('missing');let r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()")}
async function input(p,label){await b.ev("__glMap.label="+JSON.stringify(label));data.actions.push({label,...p});if(name==='touch'){await b.page.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,radiusX:1,radiusY:1,force:1,id:1}]});await b.page.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}else await b.click(p.x,p.y)}
async function clickExpr(expr,label){await input(await point(expr),label)}
await startTrace('startup');await b.page.send('Page.navigate',{url:'http://127.0.0.1:4389/lab/boot'});await b.wait('!!document.querySelector("[data-start]")');await sleep(1100);
data.environment=await b.ev("({ua:navigator.userAgent,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,origin:performance.timeOrigin,visible:!document.hidden,storage:{bootSeen:localStorage.getItem('boot-seen'),roomPlace:sessionStorage.getItem('room-place')}})");
for(let run=1;run<=2;run++){await clickExpr("document.querySelector('[data-start]')",'START-'+run);await b.wait("__external.phases.some(p=>p.name==='external-site'&&p.run==="+run+")",30000);await sleep(400);await clickExpr("[...document.querySelectorAll('button')].find(e=>e.textContent.includes('BACK TO THE ROOM'))",'BACK-'+run);await b.wait('!!document.querySelector("[data-start]")');await sleep(1100)}
await endTrace('startup');
for(const [label,p] of [['lantern',{x:870,y:220}],['radio',{x:475,y:430}]]){
await startTrace(label);await b.ev("__glMap.active=true;__glMap.label="+JSON.stringify(label));await sleep(300);await input(p,label);await b.wait('!!document.querySelector(".panel")',8000);await sleep(2100);
data[label+'State']=await b.ev("({panel:document.querySelector('.panel')?.outerHTML,animations:document.getAnimations().map(a=>({state:a.playState,time:a.currentTime})),intro:document.documentElement.dataset.intro})");
if(label==='lantern'){await clickExpr("document.querySelector('[aria-label=\"Candle\"]')",'Candle');await sleep(600)}
await clickExpr("document.querySelector('.panel .back')",'close-'+label);await b.wait('!!document.querySelector("[data-start]")');await sleep(1400);await endTrace(label);await b.ev('__glMap.active=false');
}
data.observer=await b.ev('__external');data.gl=await b.ev('__glMap');data.resources=await b.ev('performance.getEntriesByType("resource").map(r=>r.toJSON())');data.navigation=await b.ev('performance.getEntriesByType("navigation").map(r=>r.toJSON())');data.errors=b.errors;data.valid=!b.errors.length;
}catch(e){data.failure=String(e.stack||e);console.error(data.failure);if(trace)try{data.failedTrace=await trace.end()}catch(e){data.traceFailure=String(e)}}
finally{data.networkEvents=network;if(b)data.cleanup=await b.close();if(server){server.kill();for(let i=0;i<30&&server.exitCode===null&&server.signalCode===null;i++)await sleep(100);data.serverCleanup={pid:server.pid,exit:server.exitCode,signal:server.signalCode}}fs.writeFileSync(dir+'/server.log',log);fs.writeFileSync(dir+'/result.json',JSON.stringify(data));console.log(name,'valid',data.valid)}
