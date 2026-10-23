import fs from 'node:fs';import ts from 'typescript';import{launch}from './lean-stutter-work.tmp/cdp.mjs';
const root='lean-stutter-work.tmp';fs.mkdirSync(root+'/appearance',{recursive:true});
const baseline=ts.transpileModule(fs.readFileSync(root+'/baseline-boot-screen.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const rawCandidate=fs.readFileSync('src/lib/boot/boot-screen.ts','utf8').replace('\t\tdraw:', 'surfaces:[...glyphs.values(),line].map(g=>g.image).concat(scratchCanvas), layout:{size,slots,advances:[...glyphs].map(([letter,g])=>({letter,width:g.width}))},\n\t\tdraw:');
const candidate=ts.transpileModule(rawCandidate,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const b=await launch({url:'about:blank',profile:'phone',dir:root+'/profiles/glyph-direct-visual'});
try{
 const result=await b.ev(`(async()=>{
 const load=async code=>{const u=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));const m=await import(u);URL.revokeObjectURL(u);return m};
 const a=await load(${JSON.stringify(baseline)}),b=await load(${JSON.stringify(candidate)});await document.fonts.ready;
 const ca=document.createElement('canvas'),cb=document.createElement('canvas');ca.width=cb.width=960;ca.height=cb.height=640;
 const x=ca.getContext('2d'),y=cb.getContext('2d'),start=performance.now(),p=await b.prepareBootScreen(y,()=>Promise.resolve()),prep=performance.now()-start;
 const frames=[];
 for(const t of [.5,1.1,1.3,1.6,2.4,2.78,3.5]){
  a.drawBootScreen(x,t,'#0b0a0e');p.draw(t,'#0b0a0e');
  const aa=x.getImageData(0,0,960,640).data,bb=y.getImageData(0,0,960,640).data;
  const diff=document.createElement('canvas');diff.width=960;diff.height=640;const dc=diff.getContext('2d'),dd=dc.createImageData(960,640);
  let ink=0,changed=0,error=0,max=0,large=0;
  for(let i=0;i<aa.length;i+=4){let d=0;for(let k=0;k<3;k++)d=Math.max(d,Math.abs(aa[i+k]-bb[i+k]));
   if(aa[i]!==248||aa[i+1]!==250||aa[i+2]!==248||bb[i]!==248||bb[i+1]!==250||bb[i+2]!==248){ink++;error+=d;}
   if(d)changed++;if(d>16)large++;max=Math.max(max,d);dd.data[i]=d*4;dd.data[i+2]=d*4;dd.data[i+3]=255;
  }dc.putImageData(dd,0,0);
  frames.push({t,ink,changed,large,max,meanInkError:error/ink,baseline:ca.toDataURL(),candidate:cb.toDataURL(),diff:diff.toDataURL()});
 }
 const surfaces=p.surfaces.map(c=>{const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let borderInk=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if((x===0||y===0||x===c.width-1||y===c.height-1)&&data[(y*c.width+x)*4+3])borderInk++;return{width:c.width,height:c.height,bytes:c.width*c.height*4,borderInk}});
 p.dispose();return {prep,bytes:surfaces.reduce((n,s)=>n+s.bytes,0),surfaces,layout:p.layout,disposed:p.surfaces.every(s=>s.width===0&&s.height===0),fontStatus:document.fonts.status,fonts:['Arial Black','Arial Rounded MT Bold','Helvetica Neue'].map(f=>({font:f,available:document.fonts.check('16px "'+f+'"')})),frames};})()`);
 for(const f of result.frames)for(const variant of ['baseline','candidate','diff']){fs.writeFileSync(`${root}/appearance/direct-${f.t}-${variant}.png`,Buffer.from(f[variant].split(',')[1],'base64'));delete f[variant];}
 fs.writeFileSync(root+'/appearance/direct-comparison.json',JSON.stringify(result,null,2));console.log(result);
 for(const variant of ['baseline','candidate']){
  await b.go(`http://localhost:4292/lab/boot?lean=${variant}`);if(!await b.waitFor('window.__lean?.ready && document.querySelector("[data-start]")',60000))throw Error('not ready');
  const p=await b.ev("(()=>{const r=document.querySelector('[data-start]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");await b.click(p.x,p.y);if(!await b.waitFor('__lean.state().mode==="booting"',3000))throw Error('boot did not start');
  for(const t of [.5,1.1,1.3,1.6,2.4,2.78,3.5]){await b.ev(`__lean.snapshot(${t})`);await b.sleep(50);await b.shot(`${root}/appearance/room-${t}-${variant}.png`);}
 }
 if(b.errors.length)throw Error(b.errors[0]);
}finally{b.close();}
