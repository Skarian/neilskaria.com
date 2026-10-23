import fs from 'node:fs';
const dir='radio-residual-work.tmp/boot-text-diagnosis';
const path='src/lib/boot/engine.ts';
const original=fs.readFileSync(path,'utf8');fs.writeFileSync(dir+'/engine-original.txt',original);
let s=original;
function replace(from,to){if(!s.includes(from))throw Error('Missing hook: '+from);s=s.replace(from,to);}
replace('\tconst screenFade = { value: 0 };', `\tconst screenFade = { value: 0 };
 const diagnosticVariant = new URLSearchParams(location.search).get('text-control') || 'A';
 let diagnosticInitialDraw = false;
 let diagnosticInitialUpload = false;
 const diagnostic: any = { variant: diagnosticVariant, frames: [], current: null };
 (window as any).__diag = diagnostic;
 const originalMeasureText = screenCtx.measureText.bind(screenCtx);
 screenCtx.measureText = (text: string) => {
   const start = performance.now();
   const result = originalMeasureText(text);
   if (diagnostic.current) {
     diagnostic.current.measureMs += performance.now() - start;
     diagnostic.current.measureCalls++;
   }
   return result;
 };
 const diagnosticGL: any = renderer.getContext();
 for (const name of ['texImage2D', 'texSubImage2D']) {
   const originalUpload = diagnosticGL[name].bind(diagnosticGL);
   diagnosticGL[name] = (...args: any[]) => {
     const start = performance.now();
     const result = originalUpload(...args);
     if (diagnostic.current) {
       const screen = args.includes(screenCanvas);
       diagnostic.current.uploads.push({name,screen,ms:performance.now()-start});
     }
     return result;
   };
 }`);
replace('\t\tlastRendered = time;', `\t\tlastRendered = time;
 const diagnosticFrame: any = {t:performance.now(),raf:time,mode,boot:s.boot,dive:s.dive,drawMs:0,drawCalls:0,measureMs:0,measureCalls:0,uploads:[],submissionMs:0};
 diagnostic.current = diagnosticFrame;
 diagnostic.frames.push(diagnosticFrame);`);
replace("} else drawBootScreen(screenCtx, s.boot, background);", `} else {
 const drawStart = performance.now();
 if (diagnosticVariant !== 'B' || !diagnosticInitialDraw) {
   drawBootScreen(screenCtx, s.boot, background);
   diagnosticFrame.drawCalls++;
   diagnosticInitialDraw = true;
 }
 diagnosticFrame.drawMs = performance.now() - drawStart;
 }`);
replace('\t\t\tscreenTexture.needsUpdate = true;', `\t\t\tif (diagnosticVariant !== 'C' || !diagnosticInitialUpload) {
 screenTexture.needsUpdate = true;
 diagnosticInitialUpload = true;
 }`);
replace('\t\trubiks.sync();\n\t\trenderer.render(scene, camera);', '\t\trubiks.sync();\n\t\tconst diagnosticSubmissionStart = performance.now();\n\t\trenderer.render(scene, camera);');
replace('\n\t}\n\n\tfunction resize() {', `
 diagnosticFrame.submissionMs = performance.now() - diagnosticSubmissionStart;
 diagnosticFrame.totalMs = performance.now() - diagnosticFrame.t;
 diagnosticFrame.camera = camera.position.toArray();
 diagnostic.current = null;
\t}\n\n\tfunction resize() {`);
fs.writeFileSync(path,s);
