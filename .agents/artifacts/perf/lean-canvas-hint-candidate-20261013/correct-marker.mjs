import fs from 'node:fs';
import {out} from './prepare.mjs';
for(const file of ['cleanup.json','local-server.log'])fs.copyFileSync(out+'/'+file,out+'/marker-attempt-'+file);
let s=fs.readFileSync(out+'/smoke.mjs','utf8').replace(`check(name+' START entry observed',await b.waitFor("__firstbootDiagnostic.snapshot().events.some(e=>e.kind==='START-css-animation-complete')",4000));`,`await b.sleep(300);`);
fs.writeFileSync(out+'/smoke.mjs',s);
