import fs from 'node:fs';import path from 'node:path';import sharp from 'sharp';
const out=path.resolve('.agents/artifacts/perf/gpu-boot-atlas-prototype-20261012');
const c=JSON.parse(fs.readFileSync(out+'/local-comparison.json')),f=JSON.parse(fs.readFileSync(out+'/fidelity/results.json'));
const g=c.modes['gpu-atlas'],base=c.modes['will-read-frequently'];const ev=k=>g.startupEvents[k];
const atlas=JSON.parse(fs.readFileSync(out+'/source-stage/src/lib/boot/boot-atlas-metrics.json'));let mipBytes=0;for(let w=atlas.width,h=atlas.height;;w=Math.max(1,w/2|0),h=Math.max(1,h/2|0)){mipBytes+=w*h*4;if(w===1&&h===1)break;}
const off=[];for(const variant of ['light','dark','colour']){const r=await sharp(out+'/fidelity/'+variant+'-off.png').ensureAlpha().raw().toBuffer();const pixel=[...r.subarray(0,4)];off.push({variant,pixel,uniform:!r.some((v,i)=>v!==pixel[i%4])});}
const frows=f.results.filter(r=>r.t!==undefined),textrows=frows.filter(r=>r.t>=.35&&r.t<=3.5);
const returnDelta=Math.max(...f.results.filter(r=>r.returnFade!==undefined).flatMap(r=>r.canvasCentre.map((v,i)=>Math.abs(v-r.gpuCentre[i]))));
const worst=mode=>{const fs=c.modes[mode];return Math.max(...Object.values(fs.phases).flatMap(r=>Object.values(r).map(p=>p.gapMs.max??0)));};
const evidence={sourceId:g.experiment.sourceId,asset:g.experiment.atlas,assetBytes:fs.statSync(out+'/source-stage/public/boot-atlas.png').size,mipRgba8Bytes:mipBytes,baseRgba8Bytes:atlas.width*atlas.height*4,estimatedBitmapPlusMipBytes:mipBytes+atlas.width*atlas.height*4,atlasTimingsMs:{fetch:ev('atlas-fetch-end')-ev('atlas-fetch-start'),decode:ev('atlas-decode-end')-ev('atlas-decode-start'),fetchToReady:ev('atlas-ready')-ev('atlas-fetch-start'),uploadRequest:ev('atlas-upload-requested'),uploadSubmission:ev('atlas-upload-submitted')},maxCallbackGapsMs:{control:worst('will-read-frequently'),gpu:worst('gpu-atlas')},fidelity:{comparisons:f.results.length,maxMeanAbsRgb:Math.max(...frows.map(r=>r.meanAbsRgb)),maxChannelDelta:Math.max(...frows.map(r=>r.maxChannelDelta)),maxPixelsOver32:Math.max(...frows.map(r=>r.pixelsOver32)),maxForegroundMeanMaxDelta:Math.max(...textrows.map(r=>r.foregroundMeanMaxDelta)),maxSolidReturnChannelDelta:returnDelta,powerOff:off}};
fs.writeFileSync(out+'/evidence-summary.json',JSON.stringify(evidence,null,2));
const num=v=>Number(v).toFixed(2);
const text=`# Direct GPU boot atlas prototype

Status: Implementation complete for root review. No deployment occurred. This is not an accepted fix.
Main HEAD d82230a remains rejected. The main source, HEAD, and branch remain unchanged.

## Concrete candidate

source-stage copies the deployed canvas-context-control stage after all 93 manifest hashes pass.
The final allowlist contains 96 files. Three existing files change and three files are added.
gpu-atlas.diff contains the complete delta. source-manifest.json identifies each eventual upload file and hash.
The reference remains a796e9a with approved camera 042dc805. Rejected caches and panel preparation are absent.

Use /lab/boot?bootCanvas=gpu-atlas for the candidate.
Use /lab/boot?bootCanvas=will-read-frequently for the primary reference.
Default /lab/boot retains the original context options without an options argument.

One ShaderMaterial replaces the original screen material in GPU mode. It uses the original geometry and UV orientation.
The physical screen mesh clips enlarged letters naturally. No glyph geometry or extra screen draw is added.
The fragment shader samples one offline atlas and composites domain, glint, letters, and final fade in the original order.
Composition occurs in sRGB. The shader converts the result to linear before the renderer's normal output conversion.
Power-off uses the original screen colour. Returns fade the runtime background towards black without canvas painting.
Existing GSAP time, layout arithmetic, easing, phase boundaries, cameras, sound, skip, and replay remain.

CPU arithmetic still computes ten transforms, ten colours, alpha, glint, and fade.
Font measurement, fillText, boot canvas allocation, and recurring boot CanvasTexture requests disappear in GPU mode.
Other room canvases, panels, outlines, radio, renderer resolution, and the existing startup warm draws remain.
The atlas promise joins the existing asset readiness boundary. No delayed startup wait or extra warm draw is added.
The first static upload generates ordinary GPU mipmaps. No runtime font rasterization, glyph generation, or atlas packing occurs.
Explicit gradients precede fragment clipping, so mip selection remains defined at rectangle edges.

## Asset and provenance

The single PNG is ${evidence.assetBytes} bytes, SHA256 ${atlas.assetSha256}.
Its dimensions are 2048x1024. Base RGBA8 storage is 8 MiB. The full mip chain estimate is ${mipBytes} bytes, about 10.67 MiB.
A retained decoded bitmap plus this chain nominally totals about 18.67 MiB. These estimates exclude copies and driver overhead.
The original 960x640 RGBA8 texture is 2.344 MiB, about 3.125 MiB with mipmaps. The atlas uses more resident texture storage.
Compressed PNG bytes do not measure GPU allocation. No allocator or native transfer measurement was collected.

Generate-atlas.mjs uses installed Node24, sharp, and task-owned headless Chrome. It adds no dependency.
Eight unique letter masks use 4x authoring resolution. The static domain uses its exact authored pixel position at 1x.
Metrics retain the original fitted sizes, advances, slots, bounds, and atlas regions.
font-provenance.json retains platform-span font reports, declarations, browser version, and installed font-file hashes.
Matching Windows spans report Arial Black for both declarations. Canvas identity is inferred from matching declarations.
Android fallback fonts can differ. This candidate does not claim identical target typography.

## Checks and fidelity limits

Final formatting passes. Svelte-check reports zero errors and zero warnings.
109 normal flow checks pass for GPU and canvas control. Both retain trusted START, site, BACK, room, and full replay.
43 extended checks pass across GPU, canvas control, and default. They cover skip, interrupted return, power-off, and SPA disposal during boot.
Added texture, bitmap, and material resources are disposed. Existing geometry disposal remains intact.
Four final sample/download files pass the revised schema. They remain structurally compatible with the original schema.
GPU analysis must branch on mode and schemaRevision. Original canvas marker interpretation does not apply to GPU captures.

fidelity/results.json retains ${f.results.length} isolated comparisons and zero browser errors.
The required times are 0, .35, .7, 1.1, 1.5, 1.9, 2.4, 2.78, 3.5, and 3.95.
An additional 3.7 sample checks intermediate fade. Each uses light, dark, and coloured end values.
The remaining comparisons check four solid-return fade values for each end colour.
3d-* screenshots retain actual screen orientation, flying-letter clipping, settled type, domain glint, return, and power-off.
Their boot times come from the original paused GSAP timeline. These manipulated-time screenshots are excluded from performance analysis.
Room motes and other independent clocks differ across screenshots. Use isolated screen pixels for quantitative comparisons.

The final images are not pixel-identical. Maximum whole-screen mean absolute RGB difference is ${num(evidence.fidelity.maxMeanAbsRgb)} out of 255.
Maximum channel difference is ${evidence.fidelity.maxChannelDelta}. Up to ${evidence.fidelity.maxPixelsOver32} pixels differ by more than 32 in a channel.
Foreground edge differences are retained. The maximum foreground mean of per-pixel maximum channel differences is ${num(evidence.fidelity.maxForegroundMeanMaxDelta)}.
At boot 1.9, the thresholded word bounds differ by one bottom pixel. Domain bounds match.
Coverage and centroids still differ. layout-analysis.json retains the exact values.
Solid-return centre channels differ by at most ${returnDelta}. All power-off images are uniform [29,32,29,255].
Root must review edge weight, filtering, and target font fidelity. These differences are not an accepted exception or a universal fidelity gate.

## Diagnostic semantics and local screening

schemaVersion remains 1. schemaRevision is gpu-boot-atlas-1. The source identifier is ${g.experiment.sourceId}.
The experiment records mode, asset hash, filtering, context status, source requests, and texture onUpdate submissions.
Startup events retain atlas fetch, decode, readiness, and upload request/submission times.
GPU mode creates no boot Canvas2D context. Its status is not-created, and paintMs remains zero.
gpuPrepareMs measures CPU uniform preparation. submitMs still measures whole-scene renderer submission.
GPU glyph/domain markers follow screen.onAfterRender for the atlas material. They record renderer draw submission only.
Canvas glyph-painted/domain-painted markers remain direct Canvas2D submissions. GPU mode never fabricates these markers.
Atlas upload is required once per session. Glyph/domain submissions are required per full boot.
Completion records timeline completion. sessionUnobserved and unobserved disclose absent required observations.
Skipped boots correctly lack full completion. Returns retain their original completion marker and a separate GPU solid-return submission.

The final GPU capture records one atlas request and one onUpdate submission. Canvas source requests and submissions stay zero.
The control records ${base.experiment.textureCounts.canvas.requests} requests and ${base.experiment.textureCounts.canvas.submissions} submissions.
These are application requests and renderer upload submissions. They do not establish native transfer bytes, GPU completion, or display presentation.
Counters are fixed scalar records. Original bounded arrays, clocks, labels, download names, and first-two-run windows remain.
Data stays local until user download. There is no automatic diagnostic upload.

One final ordered Windows RX590 / headless Chrome ANGLE Vulkan pair screens startup, first boot, return, and full replay.
No screenshot or pixel readback occurs during this timing pair. No CPU throttling or physical Android testing occurred.
Arrival gaps average ${num(base.phases[1].arrival.gapMs.mean)} ms for control and ${num(g.phases[1].arrival.gapMs.mean)} ms for GPU on first boot.
Replay arrival gaps average ${num(base.phases[2].arrival.gapMs.mean)} ms and ${num(g.phases[2].arrival.gapMs.mean)} ms respectively.
First arrival submission means are ${num(base.phases[1].arrival.submitMs.mean)} ms and ${num(g.phases[1].arrival.submitMs.mean)} ms respectively.
The final maximum incoming callback gaps are ${num(worst('will-read-frequently'))} ms and ${num(worst('gpu-atlas'))} ms across recorded windows.
Room-create-to-ready examples are ${num(base.roomCreateToReadyMs)} ms and ${num(g.roomCreateToReadyMs)} ms. Order and caches confound this comparison.
Atlas fetch-to-ready is ${num(evidence.atlasTimingsMs.fetchToReady)} ms, including ${num(evidence.atlasTimingsMs.decode)} ms decode.
local-comparison.json retains every phase distribution, callback cost, recorder cost, startup long task, and first callback.
The timer resolution can quantize tiny costs to zero. Total instrumentation overhead is not calibrated independently.
GPU marker checks occur within submitMs. Canvas marker checks occur within paintMs. Existing gesture and DOM observers also consume time.
Shader-specific compile and first-use GPU duration remain unmeasured. This driver reports no KHR_parallel_shader_compile support.
Existing compile/warm boundaries and atlas onUpdate chronology remain visible. They do not isolate shader compilation or mip generation cost.

Earlier PNG captures produced about 0.8-second gaps in both modes. screenshot-contaminated-final-source retains that excluded pair.
One concurrent Vite fidelity server regenerated SvelteKit files and invalidated a replay. The failed validation remains.
A CDP expression attempted to serialize a GSAP timeline and hung. Task-owned processes were stopped. The corrected expression returns void.
Linear-only filtering showed jagged 3D edges. Naive mip filtering showed rectangle seams. Both isolated negative probes remain.
The final candidate uses explicit gradients with mip filtering. The normal pair was repeated after that concrete source change.

These local results do not establish a reliable fix or an exact native cause.
No claim resolves the affected capture's camera-tail gap or possible startup penalty. Source rAF physical presentation remains unmeasured.
Literature thresholds remain provisional. No physical-device acceptance gate was applied.

## Handoff and reproduction

Root must review gpu-atlas.diff, fidelity/results.json, layout-analysis.json, and 3d-* images before any preview deployment.
source-manifest.json is the upload allowlist. Upload only source-stage after verifying those exact 96 hashes.
Exclude artifacts, research, profiles, diagnostic downloads, authoring assets, secrets, dependencies, and generated build output.
No deployment script or dispatch was created. Hosted Linux source building belongs to a separate authorized task.
The known Windows Vercel adapter symlink EPERM issue was not pursued. This round did not attempt packaging or deployment.

Use installed Node24 at C:/Users/Neil Skaria/AppData/Local/node24/node-v24.21.0-win-x64/node.exe.
Run check.mjs, validate.mjs, extended.mjs, and fidelity.mjs sequentially from the repository root.
Then run analyze.mjs, analyze-fidelity.mjs, and python verify-json.py.
Run finalize.mjs last, after browsers and servers stop. It removes only generated caches inside this task-owned stage.
Do not run prepare.mjs over the retained stage. It deliberately refuses that action.
Regenerating the asset requires renewed hashes and validation if the installed browser or fonts change.

final-verification.json confirms main source, HEAD, branch, and all 93 prior stage hashes.
cleanup.json records task-owned process and port checks at handoff.
`;
fs.writeFileSync(out+'/implementation-notes.md',text);console.log(JSON.stringify(evidence));
