import fs from 'node:fs';import {gunzipSync} from 'node:zlib';import {out} from './setup.mjs';
const e=JSON.parse(gunzipSync(fs.readFileSync(out+'/runs/p1-before/open-first/trace.json.gz'))).traceEvents;
console.log(JSON.stringify(e.filter(x=>x.name==='FunctionCall').slice(0,12),null,2));
