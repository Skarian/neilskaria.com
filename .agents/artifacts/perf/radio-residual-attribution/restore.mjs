import fs from 'node:fs';import{createHash}from 'node:crypto';
const root='radio-residual-work.tmp';
const files=['src/lib/boot/engine.ts','src/lib/boot/BootIntro.svelte','src/lib/radio/player.svelte.ts','src/lib/radio/radio.ts'];
const result=files.map((path,i)=>{const original=fs.readFileSync(`${root}/source-${i}.bin`);fs.writeFileSync(path,original);const restored=fs.readFileSync(path);if(!restored.equals(original))throw Error('restoration mismatch '+path);return{path,bytes:restored.length,sha256:createHash('sha256').update(restored).digest('hex'),byteIdentical:true};});
fs.writeFileSync(`${root}/restoration.json`,JSON.stringify({restoredAt:new Date().toISOString(),files:result},null,2));
console.log(result);
