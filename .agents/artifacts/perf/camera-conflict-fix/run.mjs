import { launch } from './cdp.mjs';
import { writeFileSync } from 'node:fs';
const dir = '.agents/artifacts/perf/camera-conflict-fix';
for (const rate of [1, 4]) {
  const b = await launch({ url: 'http://localhost:4292/lab/boot', dir: dir + '/temporary-profiles/' + rate });
  const actions = [];
  try {
    await b.send('Emulation.setCPUThrottlingRate', { rate });
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: "window.__events=[];document.addEventListener('click',e=>__events.push({t:performance.now(),x:e.clientX,y:e.clientY,target:e.target.tagName}),true);" });
    await b.go();
    if (!await b.waitFor('window.__probe && document.querySelector("[data-start]")', 60000)) throw Error('room not ready');
    await b.sleep(2500);
    const environment = await b.ev("(()=>{const gl=__probe.renderer.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');return {ua:navigator.userAgent,renderer:e&&gl.getParameter(e.UNMASKED_RENDERER_WEBGL),vendor:e&&gl.getParameter(e.UNMASKED_VENDOR_WEBGL),canvas:[gl.drawingBufferWidth,gl.drawingBufferHeight],viewport:[innerWidth,innerHeight],dpr:devicePixelRatio}})()");
    async function action(label, fn, delay) {
      const before = await b.ev('({t:performance.now(),...__probe.state()})');
      await fn();
      const after = await b.ev('({t:performance.now(),...__probe.state()})');
      await b.sleep(delay);
      actions.push({ label, before, after, end: await b.ev('({t:performance.now(),...__probe.state(),panel:document.querySelector(".panel")?.getAttribute("aria-label")})') });
    }
    async function objectClick(thing) {
      const p = await b.ev('(()=>{const {pickers,camera,THREE}=__probe;const o=pickers.find(o=>o.userData.thing==='+JSON.stringify(thing)+');const p=new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()).project(camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2}})()');
      await b.click(p.x,p.y);
    }
    async function back() {
      const p = await b.ev("(()=>{const r=document.querySelector('.panel .back').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
      await b.click(p.x,p.y);
    }
    for (const thing of ['clock','lantern']) {
      await action(thing+'-normal-focus',()=>objectClick(thing),1600);
      await b.shot(dir+'/'+rate+'x-'+thing+'-focused.png');
      await action(thing+'-normal-back',back,1400);
      for (let rep=1;rep<=2;rep++) {
        await action(thing+'-rapid-'+rep+'-focus',()=>objectClick(thing),1400);
        await action(thing+'-rapid-'+rep+'-back',back,100);
        await action(thing+'-rapid-'+rep+'-reselect',()=>objectClick(thing),1400);
        await action(thing+'-rapid-'+rep+'-cleanup',back,1400);
      }
      await action(thing+'-early-focus',()=>objectClick(thing),550);
      await action(thing+'-early-back',back,1400);
    }
    writeFileSync(dir+'/'+rate+'x.json',JSON.stringify({rate,environment,actions,errors:b.errors,...await b.ev('({profile:__profile,events:__events})')}));
    console.log('DONE',rate,environment,actions.map(a=>[a.label,a.end.focused,a.end.blend]));
  } finally { b.close(); }
}
