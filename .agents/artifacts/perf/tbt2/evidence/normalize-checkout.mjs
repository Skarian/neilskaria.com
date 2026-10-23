import fs from'node:fs';const p='C:/projects/neilskaria.com-tbt2/src/lib/boot/engine.ts',s=fs.readFileSync(p,'utf8');fs.writeFileSync(p,s.replaceAll('\r\n','\n'));
