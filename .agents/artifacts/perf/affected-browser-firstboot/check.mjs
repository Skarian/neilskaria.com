import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=process.cwd(), out=path.resolve('.agents/artifacts/perf/affected-browser-firstboot'), stage=out+'/source-stage';
const diag=stage+'/src/lib/boot/diagnostic.ts';
let s=fs.readFileSync(diag,'utf8');
s=s.replace("const mark = (kind:string, extra:Record<string,unknown> = {}) => push(events,{kind,t:performance.now(),run,...extra},1000,'events');", "const mark = (kind:string, extra:Record<string,unknown> = {}) => { if(kind==='screen-material-power' && extra.on===true && currentMode==='booting') activation=true; push(events,{kind,t:performance.now(),run,...extra},1000,'events'); };");
s=s.replace("if(events.at(-1)?.kind==='screen-material-power')activation=true; ", '');
s=s.replace("boot<0?'camera-before-power':boot<.35?'activation'", "!activation?'camera-before-power':boot<.35?'activation'");
s=s.replace("#firstboot-diagnostic[data-moving]{display:none}", "#firstboot-diagnostic[data-moving],#firstboot-diagnostic[data-focused]{display:none}");
s=s.replace('return {mark,once,snapshot,download,', 'return {mark,once,snapshot,download, focus(value:boolean) {panel?.toggleAttribute("data-focused",value);},');
fs.writeFileSync(diag,s);
const intro=stage+'/src/lib/boot/BootIntro.svelte';
s=fs.readFileSync(intro,'utf8').replace('onFocus: (thing) => {','onFocus: (thing) => {\n diag?.focus(thing !== null);');fs.writeFileSync(intro,s);
const files=['engine.ts','boot-screen.ts','BootIntro.svelte','diagnostic.ts'].map(p=>'src/lib/boot/'+p);
for(const [name,args] of [['format',[root+'/node_modules/prettier/bin/prettier.cjs','--write','--plugin',root+'/node_modules/prettier-plugin-svelte/plugin.js',...files]],['check',[root+'/node_modules/@sveltejs/kit/svelte-kit.js','sync']],['types',[root+'/node_modules/svelte-check/bin/svelte-check','--tsconfig','./tsconfig.json']]]) {
 try{const log=execFileSync(process.execPath,args,{cwd:stage,encoding:'utf8',stdio:'pipe'});fs.writeFileSync(out+'/'+name+'.log',log);console.log(log);}catch(e){fs.writeFileSync(out+'/'+name+'.log',(e.stdout||'')+(e.stderr||''));throw e;}
}
fs.copyFileSync(diag,out+'/diagnostic-source.ts');
