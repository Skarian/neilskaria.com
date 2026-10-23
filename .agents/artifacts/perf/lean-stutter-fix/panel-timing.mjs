import fs from 'node:fs';
const root='lean-stutter-work.tmp',p=root+'/panel-candidate-Intro.bin';let s=fs.readFileSync(p,'utf8');fs.copyFileSync(p,root+'/panel-candidate-initial-Intro.bin');
s=s.replace(' void preparePanels();\n','');
if(!s.includes('engine = await createRoom({'))throw Error('createRoom marker');
s=s.replace('engine = await createRoom({','const loading = createRoom({');
if(!s.includes('\t\tengine.setLantern(lanternColor, lanternLevel);'))throw Error('loaded marker');
s=s.replace('\t\tengine.setLantern(lanternColor, lanternLevel);',' void preparePanels();\n engine = await loading;\n\t\tengine.setLantern(lanternColor, lanternLevel);');
fs.writeFileSync(p,s);
