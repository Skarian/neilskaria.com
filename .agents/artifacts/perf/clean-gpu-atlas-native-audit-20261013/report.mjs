import fs from 'node:fs';import {out} from './prepare.mjs';const read=p=>JSON.parse(fs.readFileSync(p)),s=read(out+'/summary.json'),f=x=>Number.isFinite(x)?x.toFixed(3):'missing';
let text=`# Narrow native-counter audit and corrected background fixture

GPT-6.1 Sol, medium. Read applicable root AGENTS.md, models.md, web-perf skill, and the complete independent review. No children, new timed app session, trace recapture, build, typecheck, package install, source edit, release, or coordination mutation.

The recorded renderer-main contrast survives the requested conservative accounting sensitivities. Counter semantics remain unresolved: these are not certified physical CPU bounds. Keep both CPU4 strict audits false. This evidence removes neither startup uncertainty nor device/reliability objections; it supports submitting the unchanged clean experimental preview to independent review, not production approval.

## Raw task reconstruction

All eight totals reproduce prior analysis exactly (lower, upper and wall deltas zero). Native identities retain zero-based traceEvents index, full event fields, pid/tid, ts/dur/tts/tdur in microseconds, page times and boundary intersections. Page time = ts/1000 - analysis.clock.offset. Every endpoint remains 3150ms apart. Per-run JSON includes original clock residuals. O4 identity is derived from its metadata.

|Run|pid/tid|offset ms|max residual ms|
|---|---|---|---|
`;
for(const [n,r]of Object.entries(s.runs))text+=`|${n}|${r.clock.pid}/${r.clock.tid}|${r.clock.offset}|${f(r.clock.maxResidual)}|\n`;
text+=`\n|Run/boot|tasks|missing tdur/tts|tdur>dur count / total excess / max ms|recorded range ms|fallback range ms|wall service ms|\n|---|---:|---:|---|---|---|---:|\n`;
for(const [n,r]of Object.entries(s.runs))for(const w of r.windows)text+=`|${n}/${w.run}|${w.counts.tasks}|${w.counts.missingTdur.length}|${w.counts.excessN} / ${f(w.counts.excessTotalMs)} / ${f(w.counts.maxExcessMs)}|${f(w.included.lower)}–${f(w.included.upper)}|${f(w.fallback.lower)}–${f(w.fallback.upper)}|${f(w.included.wall)}|\n`;
text+=`\nNo duplicates, nesting, overlapping task wall spans, negative counters, missing RunTask wall durations, or backwards finite adjacent thread-counter endpoints were found in the eight windows. Missing wall duration count is also zero across each entire renderer RunTask inventory. Missing tdur and tts coincide. Adjacency JSON retains both native wall endpoints and thread endpoints, including unavailable counters. No nested child durations or samples contribute to task CPU. Task-wall sums are service occupancy, not CPU consumption.

The highlighted O1 task index177841 is ts1756923508394/dur4958/tts1261982/tdur6761. Its child ProxyMain::BeginMainFrame index177842 is dur4936/tdur6741. Between WidgetBase::WillBeginMainFrame at6603.526ms (tts1261995) and ScheduleStyleRecalculation at6603.567ms (tts1263902), recorded thread time advances1907us across41us wall. This locates an inconsistency, not its cause. The task thread endpoint1268743 precedes next RunTask tts1268747, with7us wall adjacency gap. No enclosing complete renderer span beyond RunTask was found in the requested context. Full raw children and available flow/frame context are in o1-native.json. Do not sum overlapping children as an explanation or guess clock/scheduler/driver cause.

Fallback: every impossible or missing task counter contributes zero lower and whole overlapping wall upper; all other fully contained finite counters retain recorded tdur. Clipped tasks retain zero lower/overlap upper. This explicitly bounds affected tasks under the simple wall invariant, but does not certify unaffected counters or the aggregate as physical CPU truth. Entire anomalous-task exclusion separately removes all impossible/missing-counter tasks, including their wall contribution; application work is removed too. No values are silently clamped.

## Contrast sensitivities

Reduction ranges are descriptive endpoint arithmetic, not confidence intervals. Lower endpoint =1-atlasUpper/originalLower; upper endpoint =1-atlasLower/originalUpper.

|Pair/boot|recorded reduction %|fallback reduction %|whole anomalous tasks excluded %|marker/outlier tasks excluded %|original observer wall ms|recorded margin after full observer subtraction ms|fallback margin after subtraction ms|
|---|---|---|---|---|---:|---:|---:|
`;
const range=x=>`${f(x.min)}–${f(x.max)}`;for(const p of s.pairs)for(const w of p.windows)text+=`|${p.original}/${p.atlas} ${w.run}|${range(w.recorded)}|${range(w.fallback)}|${range(w.excludingAnomalous)}|${range(w.excludingMarkerAndOutliers)}|${f(w.observerBudgetOriginal)}|${f(w.observerSensitivity.margin)}|${f(w.fallbackAndObserverSensitivity.margin)}|\n`;
text+=`\nObserver sensitivity subtracts the FULL original recorded observer wall budget from original lower, leaving atlas upper unchanged. Combined fallback+observer sensitivity uses fallback ranges and the same full wall subtraction. It does not estimate indirect instrumentation or tracing costs. Full JSON reports the corresponding reductions separately for first/replay.

Whole-task exclusions here keep original starts AND ends fixed. Earlier textExcludingBoundary advanced start beyond the marker task/frame while retaining end; it shortened unequal windows. Both methods are labeled and the old start is retained. Symmetric marker/outlier IDs and individual/combined totals are in every window. Missing-duration and impossible-task exclusions use the same rules for both variants.

## Outliers, cadence and phases

All six A4 and three O4 >=1ms recurring observer callback records, enclosing tasks, frames and presentation endpoints match S/sensitivity.json (including null presentation predecessors). A4 text callback7374.232ms is1.011ms wall/.233ms recorded CPU inside task7373.584–7388.805ms (15.221ms wall/3.802ms counter). O4 text callback7562.563ms is1.666ms wall/.446ms CPU inside19.509ms wall/4.874ms counter. Each virtual presentation interval is16.666ms. A4 context7350–7410 includes adjacent app callbacks, task/children, flows and frame/presentation records; O4 has equivalent local context. No missed interval is attributed to those callbacks; no harmlessness or physical display claim follows.

cadence-check.json independently derives raw rAF and virtual-presentation gaps from retained timestamps without deletion or joining neighbors. O4 rAF first/replay means18.540/18.762ms,17 gaps>=25ms each,2/4>=42ms. A4 means16.665/16.666ms,zero such gaps. Raw cadence remains unchanged by task exclusions.

Observer whole-event wall budgets by phase (overlapping phase events counted whole; overlapping full windows are not additive):

|Run|startup|prefix first/replay|text first/replay|fade/handoff first/replay|return|startup max callback|
|---|---:|---|---|---|---:|---:|
`;
for(const [n,r]of Object.entries(s.runs)){const get=k=>r.phases.find(x=>x.phase===k);text+=`|${n}|${f(get('startup').observerWholeWall)}|${f(get('prefix1').observerWholeWall)}/${f(get('prefix2').observerWholeWall)}|${f(get('text1').observerWholeWall)}/${f(get('text2').observerWholeWall)}|${f(get('fadeAndHandoff1').observerWholeWall)}/${f(get('fadeAndHandoff2').observerWholeWall)}|${f(get('return').observerWholeWall)}|${f(get('startup').observerMaxWall)}|\n`;}
text+=`\nEach phase JSON includes observed CPU counters, clipped/whole wall budgets, maximum observer event, IDs, and task totals. In the CPU4 recorded aggregate each atlas phase lower/upper lies below original, including startup, both prefixes, both fade/handoffs and return. CPU1 phase task aggregates also favor atlas; replay-prefix separation is small relative to recorded observer budgets, so no broad phase improvement claim. Text-only observer compliance must not be applied globally: A4 startup includes7.859 and22.734ms rAF events and54.841ms total observer wall; prefix has1.422/1.599ms rAF callbacks. O4 prefix maximum2.231ms is a FunctionCall of another observer type, distinct from the recurring RAF/Mutation gate inventory.

No material aggregate recorded CPU regression emerges from this narrow extraction. Startup latency and longest-task risk remain unresolved: CPU1 atlas longest startup task149.176ms versus142.840ms original, and a single ordered cold pair does not establish neutrality. CPU4 is warm-profile, separated20.7minutes and not counterbalanced; cache/host/driver causes are unknown. Per-phase counters outside text have not received a new complete anomaly invariant certification. They must retain the same recorded-accounting qualification.

## Background correction: two untimed screen states only

Accepted source hashes and full fixture parameters are in fixture-parameters.json and fidelity/results.json. The owned copy changes endColor input from#f8faf8 to#f6f1e7, selects only fade t3.7 and solid-return t4/fade.7, and writes owned outputs/profile. Bounds diagnostic reference RGB was updated for the changed input; this affects only reported thresholded bounds. Modules, dimensions960x640, filters, mipmaps, orthographic projection, UVs and rendering inputs otherwise match the prior fixture. No corrected-off repeat, app run, trace, GL query, or runtime revision.

|State|mean abs RGB /255|max channel delta|changed pixels|pixels delta>32|edge mean max delta|threshold bounds O/A|
|---|---:|---:|---:|---:|---:|---|
`;
for(const r of read(out+'/fidelity/results.json').results)text+=`|${r.name}|${f(r.meanAbsRgb)}|${r.maxChannelDelta}|${r.changedPixels}|${r.pixelsOver32}|${f(r.edgeMeanMaxDelta)}|${JSON.stringify(r.bounds.original)} / ${JSON.stringify(r.bounds.atlas)}|\n`;
text+=`\nFade has corresponding glyph placement/bounds, with visibly softer/different atlas edge coverage in the enlarged N/E crop. This is not visual identity. Solid-return has no edge or geometry difference, but a uniform one-channel-level discrepancy across all614400 pixels; prior zero-difference result at the wrong background cannot be reused. No visible missing glyph, seam or large new clipped region is evident in these two fixtures. They are screen fixtures, not full-scene camera/material equivalence. Original/atlas/x4-diff comparison PNGs and enlarged edge PNGs are in fidelity/.

Nominal like-for-like texture+mip chains: atlas10.67MiB vs original3.125MiB (~3.41x). Atlas retained bitmap adds8MiB; original canvas/backing/copies are unknown. No measured total-memory ratio or physical GPU claim.

## Reproduction, protection and exceptions

From repository root use the absolute Node24.21.0 executable C:/Users/Neil Skaria/AppData/Local/node24/node-v24.21.0-win-x64/node.exe. Offline audit: run audit.mjs, then finalize.mjs. This loads one trace at a time, does not inventory profiles, and writes only this directory. finalize.mjs normalizes null predecessor comparisons in the correspondence check; initial arithmetic treated missing predecessor as NaN, yielding two false comparison flags only. No trace or capture changed. edges.mjs processes existing two-state PNGs. fidelity.mjs is the reproducible two-state harness; it was run exactly once here. Do not run it again as part of this task.

identity-before/after and verification.json confirm tracked main/source, index, HEAD, branch, refs, dependency destinations and shared metadata unchanged. prior-files-before/after confirms earlier P/S evidence unchanged (profile trees deliberately not inventoried or accessed). Accepted91/94 source hashes are exact. built-output-verification.json revalidates all231 outputs against prior accepted pre-capture hashes; no builds ran. Its before basis is the prior inventory, not an invented audit-time snapshot. Own fixture browser pid32120 exited0, forced=false, and server closed. No other PIDs were stopped.

T3 preview_status and preview_open both explicitly returned no host; owned-CDP fallback was authorized. Initial directory creation failed sandbox access; narrow auto-review approved owned artifact creation and subsequent writes/execution. No refusal or bypass. No prior source/evidence writes. Workarounds and diagnostic corrections are disclosed here.

Supported phrasing: “In these ordered pairs, atlas has substantially lower recorded renderer-main task CPU; the contrast survives zero-to-wall fallback for anomalous/missing task counters and full original observer wall subtraction. Physical CPU counter semantics, startup neutrality, full-scene visual identity, physical presentation, total memory and general reliability remain unproven. Both CPU4 observer audits remain failed.” Root and next independent reviewer can assess the unchanged clean experimental preview using this evidence; this report does not deploy or approve a reliable fix.
`;
fs.writeFileSync(out+'/README.md',text);console.log('README written');
