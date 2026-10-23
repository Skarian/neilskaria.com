// Recompute the local desktop gate from stored evidence. Corrects one helper fault: the global-name filter matched
// Chrome's native File System Access functions (show*Picker). The stored result.json keeps pass=false unchanged.
import fs from 'node:fs';import {out,write} from './common.mjs';
const r=JSON.parse(fs.readFileSync(out+'/local-desktop/result.json')),a=JSON.parse(fs.readFileSync(out+'/local-desktop/audit.json'));
const step=n=>r.checks.find(c=>c.step===n);const native=['showDirectoryPicker','showOpenFilePicker','showSaveFilePicker'];
const close=step('radio-close'),replay=step('replay-start-click'),before=step('radio-before-close');
const g={
 flowComplete:['room-initial','start-click','site','returned-room','lantern-open','lantern-close','radio-open','radio-before-close','radio-close','replay-start-click','replay-site'].every(step),
 viewport1280x800:r.screenshots.every(s=>s.width===1280&&s.height===800),
 backTarget:step('returned-room').back.text,
 radioStatus:step('radio-open').status,radioOnAir:step('radio-open').onAir,
 finalStart:{elementId:close.currentStart.startId,introendSeq:close.currentStart.introend.seq,radioCloseClickSeq:close.closeClick.seq,replayClickSeq:replay.click.seq,replayClickElementId:replay.click.el,
  absentFromBeforeCloseIntroends:!before.introends.some(e=>e.el===close.currentStart.startId),notEarlierStart:!before.startIdsSoFar.includes(close.currentStart.startId)},
 trustedClicks:a.smoke.clicks.every(c=>c.trusted),errors:a.smoke.errors.length,rejections:a.smoke.rejections.length,cdpExceptions:a.cdpExceptions.length,localHttpFailures:a.localHttpFailures.length,
 model:a.model,modelNetwork:a.modelNetwork.map(m=>({status:m.status,encoding:m.encoding})),rawGlbRequested:a.rawGlbRequested,atlasPng:a.pngs,
 appGlobals:a.globals.filter(k=>!native.includes(k)),nativeBrowserGlobalsIgnored:a.globals.filter(k=>native.includes(k)),diagnosticControls:a.diagnosticControls,forbiddenBundleHits:a.forbiddenBundleHits,queryMode:a.queryMode,
 cleanup:r.cleanup};
const f=g.finalStart;
g.finalStartOwnIntroendBeforeReplay=f.radioCloseClickSeq<f.introendSeq&&f.introendSeq<f.replayClickSeq&&f.replayClickElementId===f.elementId&&f.absentFromBeforeCloseIntroends&&f.notEarlierStart;
g.pass=g.flowComplete&&g.viewport1280x800&&/BACK TO THE ROOM/.test(g.backTarget)&&g.finalStartOwnIntroendBeforeReplay&&g.trustedClicks&&!g.errors&&!g.rejections&&!g.cdpExceptions&&!g.localHttpFailures&&
 g.model.status===200&&g.model.encoding==='br'&&g.model.decodedSha256==='4d83841d3b7892e9d4cdb0a2d47b574ccd30b58f52207575a6d91401a4861bf4'&&g.modelNetwork.every(m=>m.status===200&&m.encoding==='br')&&!g.rawGlbRequested&&
 g.atlasPng.some(p=>p.bytes===37034&&p.sha256==='e7eb731d0e0ddeaa44e3d5cf0c700e05211bd2a595a908c3eade1c36b2fafc6e')&&!g.appGlobals.length&&!g.diagnosticControls.length&&!g.forbiddenBundleHits.length&&!g.queryMode&&g.cleanup.exitCode===0&&!g.cleanup.forced;
g.helperFault='session result.json pass=false came only from the helper global filter matching native show*Picker browser functions. Corrected in session.mjs for later runs; no app change.';
write('localgate-result.json',g);console.log(JSON.stringify({pass:g.pass,finalStart:g.finalStart,own:g.finalStartOwnIntroendBeforeReplay}));
