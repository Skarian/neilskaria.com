import fs from 'node:fs';import {out,write,tree,hash} from './setup.mjs';
const runs=['p1-before','p1-control','p2-control','p2-before'].map(n=>JSON.parse(fs.readFileSync(out+'/runs/'+n+'/result.json')));
const ports=[];for(const port of [4389,9923]){let reachable=false;try{await fetch('http://127.0.0.1:'+port,{signal:AbortSignal.timeout(1000)});reachable=true}catch{}ports.push({port,reachable});}
write('cleanup-verification.json',{ownedPids:runs.map(r=>({name:r.name,browser:r.cleanup,server:r.serverCleanup})),ports,allOwnedBrowserExitZero:runs.every(r=>r.cleanup?.exitCode===0&&!r.cleanup?.forced),allOwnedServerTerminated:runs.every(r=>r.serverCleanup?.signal==='SIGTERM'),noOwnedListener:ports.every(p=>!p.reachable)});
write('artifact-manifest.json',tree(out).filter(f=>!f.path.includes('/profile/')&&!f.path.endsWith('/trace.json')&&f.path!=='artifact-manifest.json'));
console.log('Cleanup and artifact hashes saved');
