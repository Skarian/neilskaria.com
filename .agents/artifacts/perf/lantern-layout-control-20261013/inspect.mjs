import fs from 'node:fs';import {gunzipSync} from 'node:zlib';import {out} from './setup.mjs';
for(const r of JSON.parse(fs.readFileSync(out+'/measurements.json')))for(const a of r.actions)console.log(r.name,a.label,JSON.stringify({layout:a.full.layout,worst:a.full.worstTask,cpu:a.full.threadCpuLower,raf:a.full.raf.max,present:a.full.headlessPresentation.max,measurementN:a.full.measurements.length,measures:a.full.measurements.map(m=>({t:m.t,d:m.end-m.t,stack:m.stack}))}));
const e=JSON.parse(gunzipSync(fs.readFileSync(out+'/runs/p1-before/open-first/trace.json.gz'))).traceEvents;
for(const n of ['RequestAnimationFrame','FireAnimationFrame','AnimationFrame::Presentation','Layout','UpdateLayoutTree'])console.log(n,JSON.stringify(e.filter(x=>x.name===n).slice(0,3),null,2));
