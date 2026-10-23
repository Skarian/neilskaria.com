import fs from 'node:fs';
import {out} from './prepare.mjs';
for(const file of ['cleanup.json','local-server.log'])fs.copyFileSync(out+'/'+file,out+'/initial-smoke-'+file);
let s=fs.readFileSync(out+'/smoke.mjs','utf8');
s=s.replace('await b.sleep(300);',`check(name+' START entry observed',await b.waitFor("__firstbootDiagnostic.snapshot().events.some(e=>e.kind==='START-css-animation-complete')",4000));`);
s=s.replace("check(name+' successful assets',network.every(n=>n.status<400)&&failed.length===0,{bad:network.filter(n=>n.status>=400),failed});",`check(name+' expected local model fallback',network.filter(n=>n.status>=400).every(n=>n.status===404&&/bedroom\\.[\\w-]+\\.glb\\.br$/.test(n.url))&&network.some(n=>n.status===200&&/bedroom\\.[\\w-]+\\.glb$/.test(n.url))&&failed.length===0,{bad:network.filter(n=>n.status>=400),failed});`);
s=s.replace("write('cleanup.json',{processes:cleanup})","write('cleanup.json',{processes:cleanup});write('cleanup-'+Date.now()+'.json',{processes:cleanup})");
s=s.replace('const data=await b.ev(\'__firstbootDiagnostic.snapshot()\'),calls=await b.ev(\'__contextCalls\');',"const data=await b.ev('__firstbootDiagnostic.snapshot()'),calls=await b.ev('__contextCalls');write(name+'-sample.json',data);");
fs.writeFileSync(out+'/smoke.mjs',s);
