import fs from'node:fs';import{root}from'./setup.mjs';
const v=JSON.parse(fs.readFileSync(root+'/A/lh-mobile-1-assets/artifacts.json'));console.log(Object.keys(v));console.log(v.Screenshot&&Object.keys(v.Screenshot));
