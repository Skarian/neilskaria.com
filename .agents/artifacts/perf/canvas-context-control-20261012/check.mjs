import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=process.cwd(),out=path.resolve('.agents/artifacts/perf/canvas-context-control-20261012'),stage=out+'/source-stage',prior=path.resolve('.agents/artifacts/perf/affected-browser-firstboot/source-stage');
const files=['src/lib/boot/engine.ts','src/lib/boot/diagnostic.ts','src/lib/boot/context-control.ts'];
const commands=[['format',[root+'/node_modules/prettier/bin/prettier.cjs','--write',...files]],['format-check',[root+'/node_modules/prettier/bin/prettier.cjs','--check',...files]],['sync',[root+'/node_modules/@sveltejs/kit/svelte-kit.js','sync']],['types',[root+'/node_modules/svelte-check/bin/svelte-check','--tsconfig','./tsconfig.json']]];
for(const [name,args] of commands){try{const log=execFileSync(process.execPath,args,{cwd:stage,encoding:'utf8',stdio:'pipe'});fs.writeFileSync(out+'/'+name+'.log',log);console.log(log);}catch(e){fs.writeFileSync(out+'/'+name+'.log',(e.stdout||'')+(e.stderr||''));throw e;}}
let diff='';for(const p of files){try{diff+=execFileSync('git',['--no-optional-locks','diff','--no-index','--',fs.existsSync(prior+'/'+p)?prior+'/'+p:'NUL',stage+'/'+p],{encoding:'utf8'});}catch(e){if(e.status!==1)throw e;diff+=e.stdout;}}
fs.writeFileSync(out+'/context-control.diff',diff);
fs.copyFileSync(stage+'/src/lib/boot/diagnostic.ts',out+'/diagnostic-source.ts');
console.log('Retained minimal diff.');
