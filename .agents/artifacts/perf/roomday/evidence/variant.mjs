import fs from 'node:fs';import{createHash}from'node:crypto';import{command,repo,root}from'./setup.mjs';
const file=repo+'/assets/3d/pack.mjs',asset=repo+'/src/lib/boot/assets/room-day.webp';
const mode=process.argv[2],size={A:null,B:768,C:512}[mode];if(!['A','B','C'].includes(mode))throw Error('bad variant');
let s=fs.readFileSync(file,'utf8').replace(/'room-day': \{[^}]+\}/,`'room-day': { ${size?'size: '+size+', ':''}quality: 95 }`);fs.writeFileSync(file,s);
if(mode!=='A'){
 console.log(command(process.execPath,['assets/3d/pack.mjs']));
 const changed=command('git',['diff','--name-only']).trim().split('\n').filter(Boolean);const allowed=['assets/3d/pack.mjs','src/lib/boot/assets/room-day.webp','vite.config.ts'];if(changed.some(p=>!allowed.includes(p)))throw Error('unexpected packed changes: '+changed.join(','));
 command('git',['add','assets/3d/pack.mjs','src/lib/boot/assets/room-day.webp']);const subject=`Pack the room daylight map at ${size} pixels`;command('git',['commit','-m',subject,'-m','Co-Authored-By: GPT-6.1 Sol <noreply@openai.com>']);
 const files=command('git',['show','--format=','--name-only','HEAD']).trim().split('\n');if(files.length!==2||files.some(p=>!allowed.slice(0,2).includes(p)))throw Error('wrong commit files');
}
fs.mkdirSync(root+'/variants/'+mode,{recursive:true});fs.copyFileSync(asset,root+'/variants/'+mode+'/room-day.webp');fs.writeFileSync(root+'/variants/'+mode+'/meta.json',JSON.stringify({variant:mode,size:size??1024,commit:command('git',['rev-parse','HEAD']).trim(),bytes:fs.statSync(asset).size,sha256:createHash('sha256').update(fs.readFileSync(asset)).digest('hex')},null,2));console.log(mode,fs.statSync(asset).size);
