import fs from 'node:fs';import{execFileSync}from 'node:child_process';
const root='radio-residual-work.tmp';fs.mkdirSync(root,{recursive:true});
for(const folder of ['boot-text-diagnosis','interaction-attribution']){
 fs.mkdirSync(`${root}/${folder}`,{recursive:true});
 for(const name of fs.readdirSync(`.agents/artifacts/perf/${folder}`).filter(n=>n.endsWith('.mjs'))){
  let s=fs.readFileSync(`.agents/artifacts/perf/${folder}/${name}`,'utf8').replaceAll('.agents/artifacts/perf',root);
  fs.writeFileSync(`${root}/${folder}/${name}`,s);
 }
}
const files=['src/lib/boot/engine.ts','src/lib/boot/BootIntro.svelte','src/lib/radio/player.svelte.ts','src/lib/radio/radio.ts'];
for(const [i,p]of files.entries())fs.copyFileSync(p,`${root}/source-${i}.bin`);
execFileSync(process.execPath,[`${root}/interaction-attribution/prepare-combined.mjs`]);
const p=files[0];let s=fs.readFileSync(p,'utf8');
s=s.replace('if(!timerExtension)return;','if(diagnosticLight||!timerExtension)return;');
fs.writeFileSync(p,s);
let run=fs.readFileSync(`${root}/interaction-attribution/run-combined.mjs`,'utf8');
run=run.replace("const candidates=fs.readdirSync(dir)","const refDir='.agents/artifacts/perf/interaction-attribution';const candidates=fs.readdirSync(refDir)");
run=run.replaceAll("fs.statSync(dir+'/'+b)","fs.statSync(refDir+'/'+b)").replaceAll("fs.statSync(dir+'/'+a)","fs.statSync(refDir+'/'+a)");
run=run.replace("const r=JSON.parse(fs.readFileSync(dir+'/'+reference));","reference='clock-4x-PF-8.json';const r=JSON.parse(fs.readFileSync(refDir+'/'+reference));");
const lightStart=run.indexOf("  if(c.light||c.variant==='light')await b.ev(");
const lightEnd=run.indexOf('  await b.sleep(2500)',lightStart);
run=run.slice(0,lightStart)+run.slice(lightEnd);
run=run.replace("c.variant==='light'||c.light", "true");
run=run.replace("categories:'devtools.timeline,v8,blink.user_timing,gpu'", "categories:'toplevel,devtools.timeline,v8,blink.user_timing,gpu,media,disabled-by-default-devtools.timeline,disabled-by-default-v8.cpu_profiler'");
run=run.replace("network.push({type:m.params.type,url:m.params.request.url,t:m.params.timestamp})", "network.push({type:m.params.type,url:m.params.request.url,t:m.params.timestamp,wall:m.params.wallTime})");
fs.writeFileSync(`${root}/interaction-attribution/run-combined.mjs`,run);
console.log('Prepared saved reduced controls. Light mode has no GL wrappers or GPU polling.');
