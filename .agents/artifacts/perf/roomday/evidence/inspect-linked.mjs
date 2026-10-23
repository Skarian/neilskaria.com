import fs from'node:fs';import{root}from'./setup.mjs';
const sheet=JSON.parse(fs.readFileSync(root+'/linked-runs.json'));console.log(sheet.map(r=>({label:r.label,device:r.device,run:r.run,upload:r.uploads.find(x=>x.label==='room-day'),largest:r.cpuTasks[0]})));
