"""Generate the concise evidence report from analyzed records. No application changes."""
import json,hashlib,html
from pathlib import Path
R=Path(__file__).resolve().parent
s=json.loads((R/'summary.json').read_text());d=json.loads((R/'capture.json').read_text());B=s['boots'];P=list(B['1']['phases'])
def g(r,p,m='gapMs'):return B[str(r)]['phases'][p][m]
def n(x):return f'{x:.2f}'
def table(metric):
 lines=['| Phase | First n / replay n | First p50 / p95 / max | Replay p50 / p95 / max | First counts >25 / >34 / >50 | Replay counts >25 / >34 / >50 |','|---|---:|---:|---:|---:|---:|']
 for p in P+['return']:
  a=g(1,p,metric) if p!='return' else s['returns']['1'][metric];b=g(2,p,metric) if p!='return' else s['returns']['2'][metric]
  vals=lambda z:' / '.join(n(z[k]) for k in ['p50','p95','max'])
  counts=lambda z:' / '.join(str(z[k]) for k in ['above25','above34','above50'])
  lines.append(f'| {p} | {a["n"]} / {b["n"]} | {vals(a)} | {vals(b)} | {counts(a)} | {counts(b)} |')
 return '\n'.join(lines)
# Check semantic conditions that the permissive saved schema does not require.
expected=['domain-painted','screen-texture-upload-submitted','boot-animation-complete']+['glyph-painted-'+str(i) for i in range(11) if i!=4]
checks={}
for r in [1,2]:
 checks[f'run{r}RequiredMarkers']=all(any(e['run']==r and e['kind']==k for e in d['events']) for k in expected)
 checks[f'run{r}BootFromRoom']=sum(e['run']==r and e['kind']=='mode' and e.get('from')=='room' and e.get('to')=='booting' for e in d['events'])==1
 checks[f'run{r}ReturnComplete']=any(e['run']==r and e['kind']=='return-animation-complete' for e in d['events'])
checks['twoTrustedStarts']=len([e for e in d['events'] if e['kind']=='START-gesture' and e.get('trusted')])==2
checks['twoTrustedBacks']=len([e for e in d['events'] if e['kind']=='BACK-gesture' and e.get('trusted')])==2
checks['noPreparationCandidateMarkers']=not any('prepared' in e['kind'] and e['kind']!='assets-prepared' for e in d['events'])
checks['allBootValuesInRange']=all(0<=f['boot']<=4 for f in d['frames'])
checks['withinArrayBounds']=all(len(d[k])<=v for k,v in dict(frames=3000,events=1000,longtasks=500,errors=100,resources=200).items())
s['validation']['semanticChecks']=checks
s['subwindows']={str(r):{name:{m:__import__('analyze').stats([f[m] for f in __import__('analyze').F if f['run']==r and f['mode']=='booting' and pred(f)]) for m in ['gapMs','rafDeltaMs','paintMs','submitMs','totalMs']} for name,pred in [('fadeBeforeBoot4',lambda f:3.5<=f['boot']<4),('cameraTailAtBoot4',lambda f:f['boot']>=4)]} for r in [1,2]}
s['conclusion']={'capturesCleanFirstOnlyContrast':False,'capturesPartialFirstPenalty':True,'location':'Colour/glint median cadence, drop tail, and fade. Replay still has frequent 33-50 ms text intervals.','supported':'Post-power render-callback cadence loss exists in both boots. Measured app callbacks and captured longtasks do not account for large gaps.','unknown':'Deferred raster, native texture work, GPU queue pressure, compositor and scheduler attribution. Display presentation remains unmeasured.','confidence':'High for recorded case measurements. Low for cause and generalization. One pair gives no reliability estimate.','nextControl':'Change only the boot screen Canvas2D context creation to getContext(2d, {willReadFrequently:true}) in a future isolated diagnostic. Preserve drawing, resolution, uploads, animation and audio. Measure startup and both full boots. No control executed here.'}
s['independentReview']={'reviewer':'Astra (user-supplied independent review)','agreement':'All phase means, >=42 counts, domain/upload callback alignment, predecessor bounds and powered-return means agree after rounding.','unresolvedDisagreements':[],'controlChoice':'Canvas2D context hint only. Mapped blank warm draw deferred because no immediate first-activation stall is measured and it adds startup work.'}
s['firstMinusReplayAggregate']={window:{metric:{key:round(B['1'][window][metric][key]-B['2'][window][metric][key],6) for key in ['mean','p50','p95','max','above25','above34','above50','atLeast42']} for metric in B['1'][window]} for window in ['all','text']}
s['provenance']={'reference':d['reference'],'cameraFix':d['cameraFix'],'schemaSha256':hashlib.sha256((R.parent/'affected-browser-firstboot/capture.schema.json').read_bytes()).hexdigest(),'sourceSha256':hashlib.sha256((R.parent/'affected-browser-firstboot/diagnostic-source.ts').read_bytes()).hexdigest(),'diffSha256':hashlib.sha256((R.parent/'affected-browser-firstboot/diagnostic-source.diff').read_bytes()).hexdigest()}
(R/'summary.json').write_text(json.dumps(s,indent=2)+'\n')
# Separate the tail to prevent the source phase label from implying active text fade throughout.
tail='\n'.join(f'- Run {r}: fade before boot 4 gap p95 {n(s["subwindows"][str(r)]["fadeBeforeBoot4"]["gapMs"]["p95"])} ms. Camera tail at boot 4 gap p95 {n(s["subwindows"][str(r)]["cameraTailAtBoot4"]["gapMs"]["p95"])} ms.' for r in [1,2])
readme=f'''# Affected-browser capture analysis

This file represents a later first-boot cadence penalty. It does not show an immediate first-activation stall.
Recorded replay callbacks still contain many 33-50 ms intervals. The full first-stutters/replay-smooth display contrast remains unmeasured.
Astra's independent calculations agree after rounding. No statistical disagreement remains.
No application source, build, Git state, or deployment changed. Candidate d82230a remains rejected.

## Validation

The supplied attachment remains intact. `capture.json` is its exact {s['attachmentBytes']}-byte copy.
Original path: `C:/Users/Neil Skaria/.t3/userdata/attachments/fab6e615-3ee1-4b06-99e4-bbf3bda6d6af-d37dd528-0728-4c65-bf05-09d6e29f0f59-json.json`.
Supplied name: `first-boot-diagnostic-2026-10-12T12-37-09-586Z.json`.
SHA256: `{s['attachmentSha256']}`.

Schema 1 passes every saved schema rule. Timing and semantic checks pass.
There are 919 frames, 70 events, 3 startup long tasks, 0 errors, and 38 resources. Arrays stay below their bounds.
`counts` contains dropped counts, not array lengths. All dropped counts are zero. All required markers are present.
Two trusted STARTs produce two complete boots. Two trusted BACKs produce two complete returns.
Compare run 1 booting with run 2 booting. Returns never count as replay. All phases have samples.

The browser reports Android Chrome154, Adreno740/ANGLE GLES3.2, viewport411x784/DPR2.625, and buffer822x1568.
This is affected-browser data. Reduced Android10 UA does not identify actual OS/model.
Visibility is visible, with no visibility-change event. There are no error records.
There is no dedicated context-loss listener, so absent context events do not certify native context continuity.
Fonts are loaded and reduced motion is false. Resolved fonts and refresh rate remain unmeasured.
Reference a796e9a includes approved camera042dc805. The prepared-glyph/panel candidate is absent.

## Paired cadence

Values are milliseconds. Quantiles interpolate at `(n-1)*p`. Counts use strict descriptive thresholds, not universal display standards.
Gaps measure engine callback starts. rAF deltas use recorded renderer callbacks, not all browser callbacks or displayed frames.
Incoming gaps retain predecessors across phase boundaries. The first callback in each mode has no measured predecessor gap.

Engine gaps:

{table('gapMs')}

rAF timestamp deltas:

{table('rafDeltaMs')}

Incoming engine means first/replay: camera16.66/16.68, activation20.88/28.31, arrival32.08/34.05,
drop40.43/34.90, colour-glint41.86/35.60, fade38.56/26.34.
Counts at least42ms: drop8/2, colour-glint20/7, fade10/2. Activation is slower on replay.
Colour/glint median rAF is49.8/33.4ms. Its partial first penalty is clear in this case.
Text-only engine p95 is52.19/51.055ms, delta+1.135ms. Text rAF p95 is50.1/50.1ms.
Text gaps above25ms are76/82 and86/90. Replay remains slow in the recorded callbacks.

The source fade phase includes the final camera transition at boot=4.
{tail}

While powered, solid-fill returns have mean engine gaps28.4525/28.3051ms and p9538.78/39.64ms.
Selection uses returning frames before power(false). These returns contain no boot text.
Return paintMs is zero because the timer excludes the solid-fill branch. Those calls remain inside totalMs.
Shared canvas/texture/render work warrants investigation. Scene, camera, compositor, and scheduling remain confounds.

## Stage alignment

First/replay text paint p95/max:1.30/1.90 and0.80/1.10ms.
Submission p95/max:5.195/6.10 and5.42/6.30ms. Total callback p95/max:6.89/7.50 and6.755/7.60ms.
No measured paint, submit, or total callback exceeds25ms.
All boot gaps at least42ms follow measured callbacks at most7.50ms first and6.30ms replay.
Total contains paint and submission. Long tasks can contain callback work. Do not add these nested durations.

- First worst: index220, drop, boot1.515, t9454.600, rAF9442.300. Engine/rAF gap54.400/50.000ms.
- Predecessor219: boot1.482, t9400.200, rAF9392.300, paint/submit/total0.500/4.700/5.700ms. Unmeasured remainder48.700ms.
- Current callback220 takes6.900ms after the gap. It cannot directly explain its incoming gap.
- First colour/glint worst:235, boot2.144, t10084.000. Gap53.900/50.000ms follows predecessor t10030.100, total4.300ms. Remainder49.600ms.
- Replay text worst:693, boot2.486, t24717.700. Gap52.500/50.100ms follows predecessor t24665.200, total3.800ms. Remainder48.700ms.
- Replay global worst:748, boot4 camera tail, t26515.600. Gap65.200/66.700ms follows predecessor t26450.400, total2.400ms. Remainder62.800ms.

No captured event or long task intervenes in these worst gaps. Global maxima alone hide the phase-specific first penalty.
All three long tasks occur before START. None overlaps a boot or return.
Unmeasured remainder includes other app work, browser work, and waiting. It is not proven idle time.

First domain/upload callback starts7908.300ms at boot.003. It takes5.100ms and precedes gap17.200ms.
Replay callback starts22207.300ms at boot.011. It takes3.600ms and precedes gap16.600ms.
Power markers occur7893.600/22193.600ms. No immediate first-domain/upload stall appears.
All ten glyph positions record first paint during arrival. Large gaps persist after all glyph markers.
Paint markers follow fillText calls and do not establish raster readiness. Upload markers do not measure native GPU completion.
The upload marker is once per run, so the replay marker does not indicate new texture allocation.
Source power(true) changes the material map and flags an update. Its native cost remains unknown.

Startup: fonts-ready2495.900, room-ready2689.100, START DOM2691.100, START entry complete3706.500ms.
START gestures4926.700/19221.900 precede boot modes5091.700/19383.300 by165.000/161.400ms.
Pre-power camera spans2801.900/2810.300ms. Full boots7331.200/7304.300ms, delta26.900ms.

## Conclusion and ONE next control

Supported: later partial first penalty and shared post-power cadence loss. Measured render work and recorded long tasks do not account for large gaps.
Unknown: deferred raster/flush, native texture work, GPU queues/execution, compositor, scheduling, and presentation.
Short callbacks do not prove a GPU/driver cause. Windows raster findings remain context, not attribution for this case.
One ordered pair has uncontrolled caches, overhead, and thermal state. Confidence is high for case metrics and low for causal/general reliability.

Next control: change only boot-screen context creation from default Canvas2D to `willReadFrequently:true` in a future isolated diagnostic.
Preserve direct drawing, pixels, resolution, uploads, phase timing, camera, and gesture audio. Add no caches, preparation waits, or panels.
Prediction: post-power rAF intervals decrease at identical source phases if canvas-path interaction contributes.
Unchanged or worse cadence rejects that prediction. The setting guarantees neither CPU backing nor improvement.
A response can separate canvas-path interaction from unchanged font measurement/JS, but cannot identify an exclusive native cause.
Measure navigation-to-room-ready, START DOM/entry completion, startup tasks, and first callback cost in the comparison.
Reject appearance/cadence regression or reproducible startup delay. The hint can move cost into startup. One positive pair does not establish reliability.

A mapped-screen blank warm draw could test mapped-material first use, then restore the unpowered screen before START.
Defer it here: no immediate first-activation stall appears, the penalty occurs later, and the warm draw adds pre-START work.
A moved delay is not an accepted improvement. No control was executed in this task.

Native attribution needs this JSON plus a synchronized affected-browser trace of the same sequence.
Required tracks: other main tasks, Canvas2D raster/flush, native texture work, GPU queue/execution, compositor scheduling, and frame presentation.
A synchronized screen recording can show visual contrast but cannot isolate GPU execution. Missing native tracks remain an explicit limit.
The device model is not required. No further Windows matrix or local application capture is justified.

## Evidence and reproduction

`summary.json` retains all phase/work quantiles, counts, means, deltas, exact markers, and glyph/domain event alignments.
`worst-frame-neighborhoods.json` retains every gap above25ms on either clock, predecessors, nearby events, and overlapping long tasks.
Run `python analyze.py`, then `python report.py`. Both scripts use the standard library and write only beside themselves.
The report generator imports the analyzer and recomputes metrics. Source/schema hashes remain in summaryJSON.
`comparison.html` is self-contained. T3 HTML previews pass at728/360px without console messages. Root will inspect and publish.
No dependencies, upload, telemetry, paid service, source change, or deployment occurred.
'''
(R/'README.md').write_text(readme,encoding='utf-8')
rows=''.join(f'<tr><td>{html.escape(p)}</td><td>{n(g(1,p)["p95"])}</td><td>{n(g(2,p)["p95"])}</td><td>{n(g(1,p)["p95"]-g(2,p)["p95"])}</td><td>{g(1,p)["above50"]} / {g(2,p)["above50"]}</td></tr>' for p in P)
# Inline SVG: text-window cadence, aligned by exact source boot state.
svg=[]
for r,c in [(1,'#db7241'),(2,'#3f91c5')]:
 fs=[f for f in __import__('analyze').F if f['run']==r and f['mode']=='booting' and .35<=f['boot']<3.5]
 pts=' '.join(f'{50+(f["boot"]-.35)/3.15*610:.2f},{165-f["rafDeltaMs"]/70*145:.2f}' for f in fs)
 svg.append(f'<polyline fill="none" stroke="{c}" stroke-width="1.5" opacity=".8" points="{pts}"/>')
page='''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font:14px/1.5 system-ui;color:var(--foreground,#202630);background:var(--background,#fff)}h2{font-size:20px;margin:0 0 8px}p{margin:10px 0}small{color:var(--muted-foreground,#59616b)}.legend{display:flex;gap:24px}.first{color:#db7241}.replay{color:#3f91c5}svg{width:100%;height:205px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{text-align:right;border-bottom:1px solid var(--border,#dce0e5);padding:5px}th:first-child,td:first-child{text-align:left}.box{padding:10px 0;border-top:1px solid var(--border,#dce0e5)}@media(max-width:430px){table{font-size:10px}th,td{padding:3px}h2{font-size:18px}}</style></head><body><h2>Partial first penalty. Replay also has long intervals.</h2><p>One affected-browser pair. Recorded callbacks do not establish the reported first-stutters/replay-smooth display contrast.</p><div class="legend"><b class="first">First boot</b><b class="replay">Full replay</b></div><svg viewBox="0 0 700 205" role="img" aria-label="Recorded rAF deltas aligned by source boot time">'''
for y,label in [(165,'0'),(130.5,'16.7'),(95.8,'33.4'),(61.4,'50')]:page+=f'<line x1="50" y1="{y}" x2="660" y2="{y}" stroke="#aaa" opacity=".25"/><text x="5" y="{y}" fill="currentColor" font-size="11">{label}</text>'
page+=''.join(svg)+'<text x="50" y="193" fill="currentColor" font-size="11">boot 0.35 · arrival</text><text x="200" y="193" fill="currentColor" font-size="11">1.1 · drop</text><text x="350" y="193" fill="currentColor" font-size="11">1.9 · colour/glint</text><text x="590" y="193" fill="currentColor" font-size="11">3.5 s</text></svg><small>rAF intervals in ms. Renderer callback samples only. No display-present measurement.</small><table><thead><tr><th>Source phase</th><th>First p95</th><th>Replay p95</th><th>Difference</th><th>&gt;50 counts F/R</th></tr></thead><tbody>'+rows+'</tbody></table><small>Table: engine-start gaps, ms. Strict descriptive thresholds. Returns are excluded.</small><div class="box"><b>Largest partial contrast: colour/glint</b><p>Median rAF interval: 49.8 → 33.4 ms. Text p95: 50.1 → 50.1 ms. Replay still contains frequent long intervals.</p></div><div class="box"><b>The gap is mostly outside measured render work</b><p>First worst gap: 54.4 ms at boot 1.515. Preceding callback: 5.7 ms. Unmeasured remainder: 48.7 ms. No overlapping captured long task.</p><p>Later phase means confirm a partial first penalty. Slow powered solid-fill returns implicate shared rendering work, without proving a GPU cause.</p><p>Replay maximum is larger: 65.2 ms during the final camera tail. No first-only native cause is established.</p></div><div class="box"><b>One next control</b><p>Test only the boot canvas context hint <code>willReadFrequently:true</code>. Preserve drawing and timing. Compare the same phases and measure startup cost. No control or source change occurred here.</p></div><small>Chrome 154 · Adreno 740 / ANGLE GLES 3.2 · 411×784 · one pair. Native raster, GPU, compositor, and scheduling remain unresolved.</small></body></html>'
(R/'comparison.html').write_text(page.encode('ascii','xmlcharrefreplace').decode('ascii'),encoding='utf-8')
print('Semantic checks:',checks)
print('Subwindows:',json.dumps(s['subwindows']))
print('Reports saved')



