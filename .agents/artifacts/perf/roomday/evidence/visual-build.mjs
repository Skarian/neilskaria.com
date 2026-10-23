import fs from'node:fs';import {root,repo}from'./setup.mjs';import{spawnSync}from'node:child_process';
if(process.argv[2]==='prepare')for(const label of ['A','B','C']){fs.copyFileSync(root+'/variants/'+label+'/room-day.webp',repo+'/src/lib/boot/assets/room-day.webp');const r=spawnSync(process.execPath,[root+'/setup.mjs','build','visual'+label],{cwd:repo,encoding:'utf8',windowsHide:true});console.log(r.stdout);if(r.status)throw Error(r.stderr);}fs.copyFileSync(root+'/variants/C/room-day.webp',repo+'/src/lib/boot/assets/room-day.webp');

