import fs from 'node:fs';const root=process.env.TEMP+'/impl/tbt2/base-output/client/_app/immutable/chunks';for(const f of fs.readdirSync(root).filter(x=>x.endsWith('.js'))){const s=fs.readFileSync(root+'/'+f,'utf8'),i=s.indexOf('3161137230694297');if(i>=0)console.log(f,s.slice(Math.max(0,i-100),i+400))}

