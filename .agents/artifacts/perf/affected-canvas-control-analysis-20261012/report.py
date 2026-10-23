"""Generate review artifacts from summary.json. Standard library only."""
import json
from pathlib import Path
R=Path(__file__).resolve().parent
s=json.loads((R/'summary.json').read_text())
P=['camera-before-power','activation','arrival','drop','colour-glint','fade']
def g(c,r,p,m): return (s[c]['boots'][r]['phases'][p] if p in P else s[c]['boots'][r][p])[m]
def n(x):return f'{x:.2f}'
def tables(c,m):
    out=['| Phase/window | n F/R | Mean F/R | p50 F/R | p95 F/R | Max F/R | >=42 count (%) F/R | >50 count (%) F/R |',
         '|---|---:|---:|---:|---:|---:|---:|---:|']
    for p in P+['text','poweredReturn']:
        a,b=[g(c,r,p,m) for r in ['1','2']]
        pair=lambda k:f'{n(a[k])}/{n(b[k])}'
        count=lambda k,rate:f'{a[k]} ({100*a[rate]:.1f})/{b[k]} ({100*b[rate]:.1f})'
        out.append(f'| {p} | {a["n"]}/{b["n"]} | {pair("mean")} | {pair("p50")} | {pair("p95")} | {pair("max")} | {count("ge42","ge42Rate")} | {count("gt50","gt50Rate")} |')
    return '\n'.join(out)
cost=['| Capture/run | Metric before text gap | n | Mean | p50 | p95 | Max |','|---|---|---:|---:|---:|---:|---:|']
for c in ['control','oldDefault']:
    for r in ['1','2']:
        for m in ['previousPaintMs','previousSubmitMs','previousTotalMs']:
            a=g(c,r,'text',m)
            cost.append(f'| {c}/{r} | {m} | {a["n"]} | {n(a["mean"])} | {n(a["p50"])} | {n(a["p95"])} | {n(a["max"])} |')
startup=['| Marker/interval | Old default | Control | Control minus old |','|---|---:|---:|---:|']
for k in ['diagnostic-initialized','create-room','screen-texture-created','model-parsed','assets-prepared','fonts-ready','room-ready','START-DOM','START-animation-complete']:
    a=s['oldDefault']['startup']['markersMs'][k]; b=s['control']['startup']['markersMs'][k]
    startup.append(f'| {k}, from navigation | {n(a)} | {n(b)} | {n(b-a)} |')
for a,b in [('create-room','screen-texture-created'),('screen-texture-created','model-parsed'),('model-parsed','assets-prepared'),('assets-prepared','compile-wait-start'),('compile-wait-start','compile-wait-end'),('font-wait-start','fonts-ready'),('fonts-ready','room-ready'),('START-DOM','START-animation-complete'),('create-room','room-ready'),('diagnostic-initialized','room-ready')]:
    def v(c):return s[c]['startup']['markersMs'][b]-s[c]['startup']['markersMs'][a]
    startup.append(f'| {a} to {b} | {n(v("oldDefault"))} | {n(v("control"))} | {n(v("control")-v("oldDefault"))} |')
first=['| Capture/run | First callback paint/submit/total | First powered paint/submit/total | Gesture to boot mode |','|---|---:|---:|---:|']
for c in ['oldDefault','control']:
    for r in ['1','2']:
        b=s[c]['boots'][r]; v=lambda f:'/'.join(n(f[k]) for k in ['paintMs','submitMs','totalMs'])
        first.append(f'| {c}/{r} | {v(b["firstCallback"])} | {v(b["firstPoweredCallback"])} | {n(s[c]["startup"]["gesture"][int(r)-1]["gestureToModeMs"])} |')
readme='''# Affected Canvas2D control analysis

The control records near-16.7 ms text cadence on first boot and replay. The older default records 35–39 ms mean text gaps.
The user reports “Clearly smoother”. This visual report agrees with the measured direction but remains separate evidence.
This is one positive cross-session comparison. It does not establish reliability or a CPU/GPU backing.

No application source, build, Git, or deployment changed. Main HEAD d82230a remains rejected.
This worker owns only this new artifact directory. Root will publish the HTML after review.

## Validation and source alignment

The exact 403871-byte attachment copy is capture.json. SHA256:
9dcea10df91c2e53cad44b0723be40a2e7a9bcd7d20bbc666a6236b8d336e9d1.
The original attachment and prior artifacts remain intact.
The old default hash is 5282fb0224e1e3dbf13fafc0bd386c053e3f2c25fa1e4bb4e22dd43dac81b179.

The full supplied control schema and original schema pass. Frame/event timing and source-phase checks pass.
Both captures have complete first boots, full replays, and two complete returns. All expected markers appear exactly once per run.
The control has 1246 frames, 71 events, four long tasks, zero errors, and 37 resource entries.
Counts record drops, not array lengths. All drop counts are zero. All arrays remain below recorder bounds.
Two trusted STARTs and two trusted BACKs pass. Visibility remains visible with no recorded visibility changes.
Fonts report loaded. Reduced motion is false. Both files report identical browser, fonts, viewport, and renderer metadata.

All 93 control source-manifest hashes pass. Reference is a796e9a plus approved camera042dc805.
The retained diff changes only engine.ts, diagnostic.ts, and the new context-control.ts.
The runtime control changes the actual 960x640 boot-screen context options to willReadFrequently:true.
Default omits the options argument. Scratch contexts, drawing, camera, uploads, font declarations, and source phases remain unchanged.
Rejected caches and panel preparation are absent. Existing assets-prepared is normal room startup.

Control options and reported context attributes both contain willReadFrequently:true. Attribute status is supported.
The screen-texture-created context label still says “default Canvas2D”. That legacy label is stale in the control.
Use experiment plus contextAttributes to identify this mode. These records do not prove native backing or presentation.
The extra context-created marker follows the once-only attribute read. Its native creation/read cost has no separate timer.

Reported device: Chrome154, Adreno740/ANGLE GLES3.2, viewport411x784, DPR2.625, drawing buffer822x1568.
The WebGL buffer reflects the source DPR cap of 2. The boot Canvas2D texture remains 960x640.
Reduced Android10 UA does not establish actual OS/model. Resolved glyph fonts and physical refresh rate remain unmeasured.
The recorder has no dedicated context-loss listener. No error or context event does not certify native context continuity.

## Cadence

Values use milliseconds. F/R means first boot/full replay in the same session. Returns never count as replay.
Engine gaps measure callback starts. rAF intervals use recorded render timestamps, not displayed frames.
Incoming intervals belong to the current recorded source phase. Their predecessors remain across phase boundaries.
Each mode's first callback has no predecessor interval. Cost distributions can therefore have one extra sample.
Quantiles interpolate at (n-1)*p. Thresholds >=42 and >50 are descriptive.
Text window: booting with 0.35 <= boot < 3.5, identical in both files.

Control engine gaps:

'''+tables('control','gapMs')+'''

Control rAF intervals:

'''+tables('control','rafDeltaMs')+'''

Older default engine gaps, cross-session context:

'''+tables('oldDefault','gapMs')+'''

Older default rAF intervals, cross-session context:

'''+tables('oldDefault','rafDeltaMs')+'''

Control text means differ by -0.00061 ms between first and replay. Both rAF p95 values are 16.8 ms.
Engine p95 is 18.97/17.00 ms. Engine maxima are 20.20/17.50 ms.
There are no >=42 or >50 intervals in either clock during text or powered returns.
Old text engine >=42 rates are 39.0%/14.4%. Old engine >50 rates are 19.5%/6.7%.
Old text rAF p95 remains 50.1/50.1 ms. The captured improvement covers replay as well as first boot.
Colour/glint median rAF changes from old 49.8/33.4 to control 16.7/16.7 ms.

Powered solid-fill return means change from old 28.45/28.31 to control 16.65/16.62 ms.
This contrast extends beyond glyph drawing. It narrows attention to shared canvas/texture/render interaction.
Scene, camera, browser scheduling, and compositor behavior remain possible contributors.
Return paintMs is zero because its timer excludes solid fills. TotalMs includes those calls.
Control powered-return total mean/p95/max is 7.21/9.80/11.10 and 8.03/10.80/11.90 ms.
Old powered-return total mean is 2.42/2.53 ms. Faster cadence occurs with longer measured callbacks.

## Measured callback costs and worst alignment

The following costs belong to the callback immediately before each incoming text gap.

'''+ '\n'.join(cost)+'''

Current text total mean also increases: old 4.35/4.39 to control 8.94/8.95 ms.
Current text submission p95 increases: old 5.20/5.42 to control 10.67/9.82 ms.
Paint p95 decreases: old 1.30/0.80 to control 0.80/0.60 ms.
The improvement is not a reduction in all synchronous work. Timing distribution and unmeasured work can change.
Total contains paint, submit, recorder, and other callback work. Do not add nested durations.

Negative result: first control still has one 118.90 ms engine gap, with a 116.70 ms rAF interval.
It occurs at index420, boot=4, t11406.10, in the final camera tail.
Predecessor419 starts11287.20 and has paint/submit/total0.30/4.70/5.30 ms.
The unmeasured remainder is113.60 ms. The current callback costs5.10 ms after the incoming gap.
No recorded event or long task overlaps that gap. It is not explained by text-phase timing.
Replay worst is37.60/33.40 ms at index1042, boot=4, after a5.30 ms callback. Remainder32.30 ms.
The first control maximum exceeds old first54.40 ms. Do not describe the entire boot as stall-free.

Split the source fade label: active fade at3.5<=boot<4 has control p95/max18.41/18.80 and17.11/17.20 ms.
The118.90 ms event belongs to the boot=4 camera tail. All control gaps>=42 are this single event.
Old first worst54.40 ms follows5.70 ms measured work. Old replay worst65.20 ms follows2.40 ms.
Unmeasured remainder includes other application work, browser work, and waiting. It is not proven idle time.
No long task overlaps any recorded boot or return in either capture.

All domain, upload, and ten glyph markers align inside measured callbacks.
Control first powered domain/upload callback costs14.10 ms and its next incoming gap is16.50 ms.
Replay powered callback costs11.50 ms. No immediate activation stall appears.
Glyph markers follow direct fillText submission. Upload markers indicate submission, not GPU completion.
Upload marking is once per run. Replay marking does not establish new texture allocation.
The recorder starts after render's cadence guard. Source treats booting/returning as busy, so the room idle guard does not throttle these windows.
Work before frameStart, other callbacks, deferred native work, GPU execution, and display presentation remain outside totalMs.

## Startup is not yet cleared

All startup timestamps use performance.timeOrigin. These are observed cross-session differences, not causal effect estimates.

'''+ '\n'.join(startup)+'''

Navigation responseEnd is old911.80/control547.10 ms. DOMContentLoaded is1106.50/783.40 ms.
Load is1327.20/1193.80 ms. Earlier document delivery can mask later local work.
START entry completion is old3706.50/control3648.20 ms,58.30 ms earlier.
Yet responseEnd-to-entry grows2794.70 to3101.10 ms,306.40 ms longer.
Diagnostic-init-to-room grows1457.50 to1695.70 ms,238.20 ms longer.
Create-room-to-room grows1128.20 to1304.30 ms,176.10 ms longer.
Create-room-to-texture grows55.50 to122.20 ms. This interval includes WebGL setup and context creation.
It does not isolate the willReadFrequently call or the attribute read.

Old pre-model task: t1528.50,86 ms.
Control pre-model tasks: t1288.10,150 ms, and t1440.30,50 ms.
The150 ms task begins before create-room and ends before the context-created marker.
The50 ms task overlaps context/texture creation. Neither task has function or native attribution.
Old later tasks: t2403.90,53 ms, and t2626.60,57 ms.
Control later tasks: t2297.40,59 ms, and t2502.20,95 ms.
All occur before START DOM and first gesture. Total observed task duration is old196/control354 ms.
These task totals are separate from elapsed segments. Do not add task time to overlapping startup durations.
The95 ms task overlaps fonts-ready-to-room work. The source performs room warm draws in this interval.
Compile-wait is0.50 ms in both captures. Font-wait is old2.00/control5.10 ms.
Neither measured wait accounts for the larger startup segments.
START DOM to entry completion differs by only4.90 ms,1015.40 to1020.30 ms.
No START-css-animation-complete marker exists in either file. START-animation-complete is the available application entry marker.

'''+ '\n'.join(first)+'''

The first pre-power callback's paint cost is control4.60 ms versus old1.70 ms.
The control's first powered total14.10 ms exceeds old5.10 ms.
Neither creates a measured immediate long interval. These costs remain separate from pre-START startup.

## Network/cache limits

Both files report35 positive-transfer resources and approximately2.052 MB transfer.
Model transfer is966068 bytes in both. Duration is old258.90/control247.50 ms.
Inter font transfer is48556 bytes in both. Duration is old57.20/control135.30 ms.
No zero-transfer entry has a positive encoded body. Zero/zero feedback entries do not establish a cache hit.
The data lacks response headers, delivery type, worker attribution, and complete cache information.
Browser, font, OS, shader, and driver cache state remain unknown. Resource paths omit queries.
All valid resource completions precede first START. No recorded resource starts during boots or returns.

Both captures contain an impossible negative worker-resource duration.
Old bonsai worker duration is-32.10 ms. Control is-56.30 ms.
Preserve the raw records. Exclude these values from elapsed resource calculations.
The anomaly affects resource chronology, not validated frame intervals. Its origin remains unknown.
The available recorder snapshot is not a native trace and can omit resource entries.

## Supported conclusion and ONE next step

Supported: this control session removes the older text cadence penalty in recorded first and replay windows.
Powered return improves too. The user's visual report supports the same direction.
The repeated16.7 ms rAF intervals describe render callbacks, not guaranteed physical display presentation.

Narrowed hypothesis: boot Canvas2D-to-texture interaction contributes to the cadence problem.
Text-specific cache preparation is less compelling because solid-fill return improves as well.
The longer submission callbacks are consistent with work redistribution but do not prove that mechanism.
The isolated camera-tail event and larger startup task budget remain unresolved negative results.
No exclusive raster, GPU, compositor, scheduler, or CPU backing cause is established. Native trace is required for that attribution.

Confounds: different deployment/time, caches, order, thermal state, and the extra once-only context-attribute read/marker.
The old file predates this control preview. No new default capture exists.
One comparison does not establish reliability. There is no accepted implementation change.

ONE smallest next step: run one same-preview counterbalanced capture experiment on the affected device.
Collect default/control, then control/default, using fresh pages at similar device temperature.
Each page must retain first boot, powered return, full replay, startup markers, and the visual report.
Use the existing preview and recorder. Add no source change, cache, warm draw, or Windows matrix.
Assess text cadence, boot=4 outliers, callback cost, and startup segments together.
This experiment tests repeatability and possible startup cost without claiming native attribution.

## Reproduce and handoff

Run python analyze.py, then python report.py, from this directory or use their full paths.
Both use only the Python standard library. Writes remain beside the scripts.
summary.json retains all phase/window distributions, threshold rates, predecessor alignment, startup segments, resources, and source hashes.
comparison.html is self-contained. preview-verification.json retains width checks. Inspected screenshots remain in the thread tool results.
Root should inspect and publish the HTML. This worker did not publish it.
'''
# Keep full old distributions in summary.json and remove repeated tables from the brief.
a=readme.index('Older default engine gaps, cross-session context:')
b=readme.index('Control text means differ',a)
readme=readme[:a]+'Full older-default engine/rAF phase distributions remain in summary.json.\n\n'+readme[b:]

# Correct recorded next-gap value from retained alignment rather than prose assumptions.
align=next(x for x in s['control']['markerAlignment'] if x['event']['run']==1 and x['event']['kind']=='domain-painted')
readme=readme.replace('its next incoming gap is16.50 ms','its next incoming gap is'+n(align['followingCallback']['gapMs'])+' ms')
(R/'README.md').write_text(readme,encoding='utf-8')
# Compact chart and table: four series of mean engine gaps.
labels=[('camera-before-power','Camera'),('activation','Activation'),('arrival','Arrival'),('drop','Drop'),('colour-glint','Colour/glint'),('fade','Fade + tail')]
series=[('oldDefault','1','Old first','#8a8d98'),('oldDefault','2','Old replay','#b9bcc5'),('control','1','Control first','#219ca3'),('control','2','Control replay','#65c6a5')]
svg=['<div class="chart" role="img" aria-label="Mean engine gaps by source phase">']
for p,label in labels:
    bars=''.join(f'<span style="width:{g(c,r,p,"gapMs")["mean"]/60*100:.2f}%;background:{color}" title="{title}: {g(c,r,p,"gapMs")["mean"]:.2f} ms"></span>' for c,r,title,color in series)
    svg.append(f'<div class="chartrow"><label>{label}</label><div class="bars">{bars}</div></div>')
svg.append('<div class="chartaxis"><label></label><div><span>0</span><span>20</span><span>40</span><span>60 ms</span></div></div></div>')
rows=''
for c,r,title,color in series:
    a=g(c,r,'text','gapMs');b=g(c,r,'text','rafDeltaMs')
    rows+=f'<tr><td>{title}</td><td>{a["n"]}</td><td>{a["mean"]:.1f}</td><td>{b["p95"]:.1f}</td><td>{a["ge42"]} ({100*a["ge42Rate"]:.0f}%)</td></tr>'
page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{box-sizing:border-box}body{margin:0;background:var(--background,#fafafa);color:var(--foreground,#20242a);font:13px/1.35 var(--font-sans,system-ui)}
p{margin:5px 0 9px}h2{font-size:17px;margin:0 0 5px}small{font-size:11px;color:var(--muted-foreground,#626873)}
.legend{display:flex;gap:10px;flex-wrap:wrap;font-size:11px;margin:6px 0}.legend i{display:inline-block;width:9px;height:9px;margin-right:3px}
table{border-collapse:collapse;width:100%;font-size:12px;font-variant-numeric:tabular-nums}th,td{text-align:right;padding:5px 3px;border-bottom:1px solid var(--border,#ddd)}th:first-child,td:first-child{text-align:left}th{font-size:11px}
.chart{height:155px}.chartrow{display:flex;height:22px;align-items:center}.chartrow label,.chartaxis label{width:80px;flex-shrink:0;font-size:11px}.bars{flex:1;background:linear-gradient(90deg,transparent 32.9%,var(--border,#ddd) 33%,transparent 33.2%,transparent 66.3%,var(--border,#ddd) 66.6%,transparent 66.9%)}.bars span{display:block;height:4px;margin:1px 0}.chartaxis{display:flex}.chartaxis div{flex:1;display:flex;justify-content:space-between;font-size:10px}.note{padding-top:8px;margin-top:8px;border-top:1px solid var(--border,#ddd)}b{font-weight:650}code{font-size:12px}
@media(max-width:400px){body{font-size:12px}h2{font-size:16px}.legend{gap:7px}.note{padding-top:4px;margin-top:4px}.chart{height:145px}p{margin:4px 0 6px}th,td{padding-top:4px;padding-bottom:4px}th,td{padding:5px 2px}}
</style></head><body><h2>Text cadence improves. Reliability remains open.</h2><p>User report: <b>“Clearly smoother.”</b> Measured callbacks support the direction. Display presentation remains unmeasured.</p><small>Mean engine gap by identical source phase · lower is better</small><div class="legend">'''
page+=''.join(f'<span><i style="background:{color}"></i>{title}</span>' for c,r,title,color in series)
page+='</div>'+''.join(svg)+'''<table><thead><tr><th>Text window</th><th>n</th><th>Gap mean</th><th>rAF p95</th><th>Gap ≥42</th></tr></thead><tbody>'''+rows+'''</tbody></table>
<small>ms · boot 0.35–3.5 · old default is a different session/deployment</small>
<div class="note"><b>Costs and negative results</b><p>Control submission p95 rises to 10.7/9.8 ms from 5.2/5.4. First camera tail still has a 118.9 ms gap after a 5.3 ms callback.</p><p>START entry completes 58 ms earlier, but pre-START long tasks rise from 196 to 354 ms. Earlier network delivery masks longer local segments.</p></div>
<div class="note"><b>One next step</b><p>Same-preview default/control, then reverse order. Capture startup and full first/return/replay at similar temperature.</p></div>
<small>One comparison · caches/order/temperature unknown · backing unproved · native trace needed for attribution</small>
<script>console.log(JSON.stringify({width:innerWidth,height:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth>innerWidth,externalAssets:document.querySelectorAll('[src],[href]').length}));</script></body></html>'''
(R/'comparison.html').write_text(page,encoding='utf-8')
print('README and compact comparison.html written.')

