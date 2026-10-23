import fs from'node:fs';const root=process.env.TEMP+'/impl/tbt2',p=root+'/phone.mjs';let s=fs.readFileSync(p,'utf8');s=s.replace("if (m.method === 'Runtime.exceptionThrown')", "if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error'&&/WebGL|packed_depth|THREE/.test(m.params.args.map(a=>a.value??a.description).join(' ')))events.push('GL ERROR '+m.params.args.map(a=>a.value??a.description).join(' '));\n\tif (m.method === 'Runtime.exceptionThrown')");s=s.replace("window.__diagLCP=[];", "function ready(){if(document.querySelector('[data-start]')){performance.mark('room-ready');return}requestAnimationFrame(ready)}requestAnimationFrame(ready);window.__diagLCP=[];");s=s.replace("const running={};",`if(!marks.roomInteractive||events.length)throw Error('invalid room '+JSON.stringify({marks,events}));
const roomReady=await ev("performance.getEntriesByName('room-ready')[0]?.startTime");
const rendered=await ev("({start:!!document.querySelector('[data-start]'),canvas:!!document.querySelector('canvas')})");
const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(outDir+'/ready-'+tag+'.png',Buffer.from(shot.result.data,'base64'));
const running={};`);s=s.replace('const result = { tag, marks,','const result = { tag, marks, roomReady, rendered,');fs.writeFileSync(p,s);
const run=root+'/run.mjs';s=fs.readFileSync(run,'utf8');s+=`
if(process.argv[2]==='final'){
for(let run=1;run<=4;run++)for(const device of(run<=2?['mobile','desktop']:['mobile']))for(const label of(run%2?['base','candidate']:['candidate','base']))await withServer(label,async()=>{console.log('AUDIT',label,device,run);await child('lh.mjs',[label,device,String(run)])});
for(let run=1;run<=3;run++)for(const label of(run%2?['base','candidate']:['candidate','base']))await withServer(label,async()=>{console.log('READY',label,run);await child('phone.mjs',['http://localhost:4280/lab/boot',root+'/'+label+'/phone','phone',String(run)])});
}
`;fs.writeFileSync(run,s);
