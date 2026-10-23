import fs from 'node:fs';import {execFileSync} from 'node:child_process';const repo='C:/projects/neilskaria.com-tbt2';for(const f of ['engine.ts','baked-material.ts'])fs.writeFileSync(repo+'/src/lib/boot/'+f,execFileSync('git',['show','c9be94d:src/lib/boot/'+f],{cwd:repo}));const p=repo+'/src/lib/boot/baked-material.ts';let s=fs.readFileSync(p,'utf8').replace('texture.image = await createImageBitmap','const bitmap = await createImageBitmap');s=s.replace('\ttexture.needsUpdate = true;',`\tconst picture = new OffscreenCanvas(bitmap.width, bitmap.height);
\tpicture.getContext('2d')!.drawImage(bitmap, 0, 0);
\ttexture.image = picture.transferToImageBitmap();
\tbitmap.close();
\ttexture.needsUpdate = true;`);fs.writeFileSync(p,s);
