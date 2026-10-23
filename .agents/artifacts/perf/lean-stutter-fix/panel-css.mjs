import fs from 'node:fs';
const root='lean-stutter-work.tmp',p=root+'/panel-candidate-Intro.bin';let s=fs.readFileSync(p,'utf8');
s=s.replace('bind:this={lanternPanel}', 'bind:this={lanternPanel} data-panel-hidden');
s=s.replace('bind:this={radioPanel}', 'bind:this={radioPanel} data-panel-hidden');
fs.writeFileSync(p,s);
