import fs from 'node:fs';import{execFileSync}from 'node:child_process';
execFileSync(process.execPath,['radio-residual-work.tmp/interaction-attribution/prepare-panel.mjs']);
for(const p of ['src/lib/boot/engine.ts','src/lib/boot/BootIntro.svelte','src/lib/radio/radio.ts']){
 let s=fs.readFileSync(p,'utf8');
 s=s.replaceAll("attribution.variant==='F'","attribution.variant.includes('F')");
 s=s.replaceAll("attribution.variant !== 'O'","!attribution.variant.includes('O')");
 s=s.replaceAll("a?.variant==='P'","a?.variant.includes('P')");
 s=s.replaceAll(".__attrib?.variant==='N'",".__attrib?.variant.includes('N')");
 fs.writeFileSync(p,s);
}

let p='src/lib/boot/engine.ts',s=fs.readFileSync(p,'utf8');
s=s.replace("cached:!!cached,freeAbove,freeLeft", "cached:!!cached,freeAbove,freeLeft,eye:result.eye.toArray(),target:result.target.toArray()");
s=s.replace("diagnostic.pollTimers=pollTimers;", "attribution.cacheViews=(entries:any[])=>{for(const e of entries)attribution.viewCache.set(JSON.stringify([e.thing,e.freeAbove,e.freeLeft]),{eye:new THREE.Vector3(...e.eye),target:new THREE.Vector3(...e.target)});};\n diagnostic.pollTimers=pollTimers;");
fs.writeFileSync(p,s);
