import fs from 'node:fs';import {spawnSync} from 'node:child_process';import {out,verify} from './prepare.mjs';
const [variant,mode]=process.argv.slice(2),stage=out+'/'+variant+'/source';
if(!['atlas','original'].includes(variant)||!['sync','types','build'].includes(mode))throw Error('scope');
const bins={sync:stage+'/node_modules/@sveltejs/kit/svelte-kit.js',types:stage+'/node_modules/svelte-check/bin/svelte-check',build:stage+'/node_modules/vite/bin/vite.js'};
const args={sync:['sync','--config','build.config.ts'],types:['--tsconfig','./tsconfig.json'],build:['build','--config','build.config.ts','--configLoader','native']}[mode];
const result=spawnSync(process.execPath,[bins[mode],...args],{cwd:stage,encoding:'utf8',timeout:180000,maxBuffer:12e6,windowsHide:true,env:{...process.env,NO_COLOR:'1'}});
fs.writeFileSync(out+'/'+variant+'-'+mode+'.log',JSON.stringify({command:[process.execPath,bins[mode],...args],cwd:stage,status:result.status,error:result.error?.message})+'\n'+result.stdout+result.stderr);
console.log(JSON.stringify({variant,mode,status:result.status,error:result.error?.message,output:result.stdout+result.stderr}));verify();process.exitCode=result.status??1;
