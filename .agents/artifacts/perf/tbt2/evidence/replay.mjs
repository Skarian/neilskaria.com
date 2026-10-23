import fs from'node:fs';import{pathToFileURL}from'node:url';
const core='C:/Users/Neil Skaria/AppData/Roaming/npm-cache/_npx/0f94ee7615faf582/node_modules/lighthouse/core';
const load=r=>import(pathToFileURL(core+'/'+r).href);
const{MainThreadTasks}=await load('computed/main-thread-tasks.js');const{NetworkRecords}=await load('computed/network-records.js');const{getAttributableURLForTask,getJavaScriptURLs}=await load('lib/tracehouse/task-summary.js');const{getComputationDataParamsFromDevtoolsLog}=await load('computed/metrics/lantern-metric.js');const{LanternLargestContentfulPaint}=await load('computed/metrics/lantern-largest-contentful-paint.js');
function dirs(root){return fs.readdirSync(root,{withFileTypes:true}).flatMap(x=>x.isDirectory()?(x.name.endsWith('-assets')?[root+'/'+x.name]:(!x.name.includes('profile')?dirs(root+'/'+x.name):[])):[]);}
const root=process.env.TEMP+'/impl/diag';
for(const d of(process.argv[2]?[process.argv[2]]:dirs(root))){
 if(fs.existsSync(d+'/diagnostic.json'))continue;
 if(!fs.existsSync(d+'/trace.json'))continue;
 const a=JSON.parse(fs.readFileSync(d+'/artifacts.json'));const trace=JSON.parse(fs.readFileSync(d+'/trace.json')),devtoolsLog=JSON.parse(fs.readFileSync(d+'/devtoolslog.json'));const settings=a.settings,context={settings,computedCache:new Map()};
 const tasks=await MainThreadTasks.request(trace,context),records=await NetworkRecords.request(devtoolsLog,context),jsUrls=getJavaScriptURLs(records);
 const data={settings,trace,devtoolsLog,URL:a.URL,SourceMaps:a.SourceMaps,HostDPR:a.HostDPR,gatherContext:a.GatherContext};
 const p=await getComputationDataParamsFromDevtoolsLog(data,context);const lcp=await LanternLargestContentfulPaint.request(data,context);
 const full=p.simulator.simulate(p.graph,{label:'long-tasks-diagnostic'});
 const nodeMap=new Map([...full.nodeTimings.entries()].filter(([n])=>n.type==='cpu').map(([n,t])=>[n.event,t]));
 const observed=tasks.filter(t=>!t.parent&&!t.unbounded&&t.duration>10).map(t=>({start:t.startTime,duration:t.duration,url:getAttributableURLForTask(t,jsUrls),sim:nodeMap.get(t.event),children:t.children.filter(x=>x.duration>2).map(x=>({name:x.event.name,duration:x.duration,urls:x.attributableURLs}))}));
 function endpoint(estimate){return [...estimate.nodeTimings].sort((a,b)=>b[1].endTime-a[1].endTime).slice(0,8).map(([n,t])=>({type:n.type,url:n.request?.url,observedStart:n.startTime,observedEnd:n.endTime,event:n.event?.name,events:n.childEvents?.map(e=>({name:e.name,url:e.args?.data?.url})),sim:t,dependencies:n.getDependencies().map(x=>({id:x.id,type:x.type,url:x.request?.url}))}));}
 function requests(g){const out=[];g.traverse(n=>{if(n.type==='network')out.push({url:n.request.url,priority:n.request.priority,start:n.startTime,end:n.endTime})});return out;}
 const out={observedLCP:p.processedNavigation.timings.largestContentfulPaint,simulatedLCP:lcp.timing,optimistic:lcp.optimisticEstimate.timeInMs,pessimistic:lcp.pessimisticEstimate.timeInMs,optimisticEndpoints:endpoint(lcp.optimisticEstimate),pessimisticEndpoints:endpoint(lcp.pessimisticEstimate),optimisticRequests:requests(lcp.optimisticGraph),pessimisticRequests:requests(lcp.pessimisticGraph),tasks:observed};
 fs.writeFileSync(d+'/diagnostic.json',JSON.stringify(out,null,2));console.log(d.split('/').slice(-2).join('/'),out.simulatedLCP,out.optimistic,out.pessimistic,observed.length);
}
