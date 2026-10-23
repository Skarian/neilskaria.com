import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
export const repo='C:/projects/neilskaria.com-roomday',root=process.env.TEMP+'/impl/roomday',art='C:/projects/neilskaria.com/.agents/artifacts/perf/roomday';
export function command(cmd,args){const r=spawnSync(cmd,args,{cwd:repo,encoding:'utf8',windowsHide:true});if(r.status!==0)throw Error(r.stdout+'\n'+r.stderr);return r.stdout;}
const mode=process.argv[2];
if(mode==='setup'){
 fs.writeFileSync(root+'/engine.original',fs.readFileSync(repo+'/src/lib/boot/engine.ts'));
 fs.writeFileSync(root+'/vite.original',fs.readFileSync(repo+'/vite.config.ts'));
 const v=fs.readFileSync(root+'/vite.original','utf8').replace('export default defineConfig({',"export default defineConfig({\n cacheDir: '.vite-roomday',");fs.writeFileSync(repo+'/vite.config.ts',v);
 for(const f of ['cdp.mjs','lh.mjs','phone.mjs']){let s=fs.readFileSync(process.env.TEMP+'/impl/tbt2/'+f,'utf8').replaceAll('/impl/tbt2','/impl/roomday').replaceAll('localhost:4280','localhost:4290');fs.writeFileSync(root+'/'+f,s);}
}
if(mode==='build'){
 const label=process.argv[3];let s=fs.readFileSync(root+'/engine.original','utf8').replaceAll('\r\n','\n');
 if(label==='diagFlush')s=s.replace('renderer.initTexture(group.base);','renderer.initTexture(group.base); renderer.getContext().flush();').replace('renderer.initTexture(group.lamp);','renderer.initTexture(group.lamp); renderer.getContext().flush();');
 if(label.startsWith('diag')){
 const order=label==='diagOrder'?"Object.entries(lighting).sort(([a], [b]) => Number(b === 'room') - Number(a === 'room'))":"Object.entries(lighting)";
 s=s.replace('for (const group of Object.values(lighting)) {',`for (const [groupName, group] of ${order}) {`);
 for(const [slot,kind] of [['base','day'],['lamp','lamp']])s=s.replace(`renderer.initTexture(group.${slot});`,`window.__activeTexture = groupName + ':${kind}'; window.__textureSettings ??= []; window.__textureSettings.push({label:window.__activeTexture,width:group.${slot}.image.width,height:group.${slot}.image.height,format:group.${slot}.format,type:group.${slot}.type,colorSpace:group.${slot}.colorSpace,mipmaps:group.${slot}.generateMipmaps,min:group.${slot}.minFilter,mag:group.${slot}.magFilter}); const upload${slot} = performance.now(); renderer.initTexture(group.${slot}); window.__uploads ??= []; window.__uploads.push({label:window.__activeTexture,at:upload${slot},ms:performance.now()-upload${slot}}); performance.mark('upload:' + window.__activeTexture,{startTime:upload${slot}}); window.__activeTexture = null;`);
 }
 if(label.startsWith('visual')){
 s=s.replace('const t = time / 1000;', 'const t = 3;');const a=s.indexOf('\tconst moteCount'),b=s.indexOf('\tconst moteGeometry',a);s=s.slice(0,a)+s.slice(a,b).replaceAll('Math.random()','window.__dustRandom()')+s.slice(b);
 s=s.replace('if (import.meta.env.DEV)\n\t\t\tObject.assign(window,','if (true)\n\t\t\tObject.assign(window,');
 s=s.replace('\tsetMode(mode);\n\temitCube();\n\treturn {','window.__room={renderer,scene,camera,lighting,lantern,pickers,state:()=>({mode,focused}),focus};\n\tsetMode(mode);\n\temitCube();\n\treturn window.__room.controller = {');
 }
 fs.writeFileSync(repo+'/src/lib/boot/engine.ts',s);
 try {const r=spawnSync(process.execPath,[repo+'/node_modules/vite/bin/vite.js','build'],{cwd:repo,encoding:'utf8',windowsHide:true}); const out=r.stdout+'\n'+r.stderr; fs.writeFileSync(root+'/build-'+label+'.log',out); if(r.status!==0 && !(out.includes('EPERM: operation not permitted, symlink') && fs.existsSync(repo+'/.svelte-kit/output/client/_app/version.json') && fs.existsSync(repo+'/.svelte-kit/output/server/index.js')))throw Error(out);fs.cpSync(repo+'/.svelte-kit/output',root+'/'+label+'-output',{recursive:true});console.log('BUILT',label);}finally{fs.copyFileSync(root+'/engine.original',repo+'/src/lib/boot/engine.ts');}
}



