# Narrow native-counter audit and corrected background fixture

GPT-6.1 Sol, medium. Read applicable root AGENTS.md, models.md, web-perf skill, and the complete independent review. No children, new timed app session, trace recapture, build, typecheck, package install, source edit, release, or coordination mutation.

The recorded renderer-main contrast survives the requested conservative accounting sensitivities. Counter semantics remain unresolved: these are not certified physical CPU bounds. Keep both CPU4 strict audits false. This evidence removes neither startup uncertainty nor device/reliability objections; it supports submitting the unchanged clean experimental preview to independent review, not production approval.

## Raw task reconstruction

All eight totals reproduce prior analysis exactly (lower, upper and wall deltas zero). Native identities retain zero-based traceEvents index, full event fields, pid/tid, ts/dur/tts/tdur in microseconds, page times and boundary intersections. Page time = ts/1000 - analysis.clock.offset. Every endpoint remains 3150ms apart. Per-run JSON includes original clock residuals. O4 identity is derived from its metadata.

|Run|pid/tid|offset ms|max residual ms|
|---|---|---|---|
|o1|1428/24824|1756916904.884|0.068|
|a1|14360/4740|1756991382.152|0.121|
|a4|22464/3912|1757087045.413|0.101|
|o4|33560/27680|1758330706.9240003|0.088|

|Run/boot|tasks|missing tdur/tts|tdur>dur count / total excess / max ms|recorded range ms|fallback range ms|wall service ms|
|---|---:|---:|---|---|---|---:|
|o1/1|1177|52|2 / 1.804 / 1.803|433.177�436.620|426.398�434.816|449.638|
|o1/2|1175|51|2 / 0.008 / 0.007|410.312�412.710|410.261�412.702|428.004|
|a1/1|1177|72|1 / 1.498 / 1.498|256.160�257.767|252.920�256.269|267.176|
|a1/2|1172|62|1 / 1.472 / 1.472|248.905�250.241|246.075�248.769|259.536|
|a4/1|1187|90|5 / 0.012 / 0.003|331.230�339.578|331.184�339.566|1356.000|
|a4/2|1180|54|5 / 0.015 / 0.005|336.412�344.602|336.361�344.587|1359.898|
|o4/1|1097|9|6 / 0.022 / 0.005|670.650�687.798|670.562�687.776|2668.664|
|o4/2|1077|16|1 / 0.005 / 0.005|568.580�583.491|568.567�583.486|2287.729|

No duplicates, nesting, overlapping task wall spans, negative counters, missing RunTask wall durations, or backwards finite adjacent thread-counter endpoints were found in the eight windows. Missing wall duration count is also zero across each entire renderer RunTask inventory. Missing tdur and tts coincide. Adjacency JSON retains both native wall endpoints and thread endpoints, including unavailable counters. No nested child durations or samples contribute to task CPU. Task-wall sums are service occupancy, not CPU consumption.

The highlighted O1 task index177841 is ts1756923508394/dur4958/tts1261982/tdur6761. Its child ProxyMain::BeginMainFrame index177842 is dur4936/tdur6741. Between WidgetBase::WillBeginMainFrame at6603.526ms (tts1261995) and ScheduleStyleRecalculation at6603.567ms (tts1263902), recorded thread time advances1907us across41us wall. This locates an inconsistency, not its cause. The task thread endpoint1268743 precedes next RunTask tts1268747, with7us wall adjacency gap. No enclosing complete renderer span beyond RunTask was found in the requested context. Full raw children and available flow/frame context are in o1-native.json. Do not sum overlapping children as an explanation or guess clock/scheduler/driver cause.

Fallback: every impossible or missing task counter contributes zero lower and whole overlapping wall upper; all other fully contained finite counters retain recorded tdur. Clipped tasks retain zero lower/overlap upper. This explicitly bounds affected tasks under the simple wall invariant, but does not certify unaffected counters or the aggregate as physical CPU truth. Entire anomalous-task exclusion separately removes all impossible/missing-counter tasks, including their wall contribution; application work is removed too. No values are silently clamped.

## Contrast sensitivities

Reduction ranges are descriptive endpoint arithmetic, not confidence intervals. Lower endpoint =1-atlasUpper/originalLower; upper endpoint =1-atlasLower/originalUpper.

|Pair/boot|recorded reduction %|fallback reduction %|whole anomalous tasks excluded %|marker/outlier tasks excluded %|original observer wall ms|recorded margin after full observer subtraction ms|fallback margin after subtraction ms|
|---|---|---|---|---|---:|---:|---:|
|o1/a1 1|40.494�41.331|39.899�41.833|40.344�41.144|40.827�41.017|8.142|167.268|161.987|
|o1/a1 2|39.012�39.690|39.363�40.375|39.726�40.350|39.305�39.460|6.660|153.411|154.832|
|o4/a4 1|49.366�51.842|49.361�51.847|49.394�51.841|50.604�50.826|44.369|286.703|286.627|
|o4/a4 2|39.393�42.345|39.394�42.353|39.420�42.349|40.650�40.836|34.865|189.113|189.115|

Observer sensitivity subtracts the FULL original recorded observer wall budget from original lower, leaving atlas upper unchanged. Combined fallback+observer sensitivity uses fallback ranges and the same full wall subtraction. It does not estimate indirect instrumentation or tracing costs. Full JSON reports the corresponding reductions separately for first/replay.

Whole-task exclusions here keep original starts AND ends fixed. Earlier textExcludingBoundary advanced start beyond the marker task/frame while retaining end; it shortened unequal windows. Both methods are labeled and the old start is retained. Symmetric marker/outlier IDs and individual/combined totals are in every window. Missing-duration and impossible-task exclusions use the same rules for both variants.

## Outliers, cadence and phases

All six A4 and three O4 >=1ms recurring observer callback records, enclosing tasks, frames and presentation endpoints match S/sensitivity.json (including null presentation predecessors). A4 text callback7374.232ms is1.011ms wall/.233ms recorded CPU inside task7373.584�7388.805ms (15.221ms wall/3.802ms counter). O4 text callback7562.563ms is1.666ms wall/.446ms CPU inside19.509ms wall/4.874ms counter. Each virtual presentation interval is16.666ms. A4 context7350�7410 includes adjacent app callbacks, task/children, flows and frame/presentation records; O4 has equivalent local context. No missed interval is attributed to those callbacks; no harmlessness or physical display claim follows.

cadence-check.json independently derives raw rAF and virtual-presentation gaps from retained timestamps without deletion or joining neighbors. O4 rAF first/replay means18.540/18.762ms,17 gaps>=25ms each,2/4>=42ms. A4 means16.665/16.666ms,zero such gaps. Raw cadence remains unchanged by task exclusions.

Observer whole-event wall budgets by phase (overlapping phase events counted whole; overlapping full windows are not additive):

|Run|startup|prefix first/replay|text first/replay|fade/handoff first/replay|return|startup max callback|
|---|---:|---|---|---|---:|---:|
|o1|5.691|11.885/7.544|8.142/6.660|2.637/2.253|10.946|0.664|
|a1|5.871|12.646/7.501|8.305/6.701|2.859/2.049|10.617|0.649|
|a4|54.841|44.018/33.563|36.095/31.908|11.583/10.924|39.690|22.734|
|o4|26.467|53.362/41.628|44.369/34.865|14.396/10.322|51.933|4.474|

Each phase JSON includes observed CPU counters, clipped/whole wall budgets, maximum observer event, IDs, and task totals. In the CPU4 recorded aggregate each atlas phase lower/upper lies below original, including startup, both prefixes, both fade/handoffs and return. CPU1 phase task aggregates also favor atlas; replay-prefix separation is small relative to recorded observer budgets, so no broad phase improvement claim. Text-only observer compliance must not be applied globally: A4 startup includes7.859 and22.734ms rAF events and54.841ms total observer wall; prefix has1.422/1.599ms rAF callbacks. O4 prefix maximum2.231ms is a FunctionCall of another observer type, distinct from the recurring RAF/Mutation gate inventory.

No material aggregate recorded CPU regression emerges from this narrow extraction. Startup latency and longest-task risk remain unresolved: CPU1 atlas longest startup task149.176ms versus142.840ms original, and a single ordered cold pair does not establish neutrality. CPU4 is warm-profile, separated20.7minutes and not counterbalanced; cache/host/driver causes are unknown. Per-phase counters outside text have not received a new complete anomaly invariant certification. They must retain the same recorded-accounting qualification.

## Background correction: two untimed screen states only

Accepted source hashes and full fixture parameters are in fixture-parameters.json and fidelity/results.json. The owned copy changes endColor input from#f8faf8 to#f6f1e7, selects only fade t3.7 and solid-return t4/fade.7, and writes owned outputs/profile. Bounds diagnostic reference RGB was updated for the changed input; this affects only reported thresholded bounds. Modules, dimensions960x640, filters, mipmaps, orthographic projection, UVs and rendering inputs otherwise match the prior fixture. No corrected-off repeat, app run, trace, GL query, or runtime revision.

|State|mean abs RGB /255|max channel delta|changed pixels|pixels delta>32|edge mean max delta|threshold bounds O/A|
|---|---:|---:|---:|---:|---:|---|
|fade|0.295|139|58395|2678|15.472|[66,196,902,493] / [66,196,902,493]|
|solid-return|0.333|1|614400|0|0.000|[0,0,959,639] / [0,0,959,639]|

Fade has corresponding glyph placement/bounds, with visibly softer/different atlas edge coverage in the enlarged N/E crop. This is not visual identity. Solid-return has no edge or geometry difference, but a uniform one-channel-level discrepancy across all614400 pixels; prior zero-difference result at the wrong background cannot be reused. No visible missing glyph, seam or large new clipped region is evident in these two fixtures. They are screen fixtures, not full-scene camera/material equivalence. Original/atlas/x4-diff comparison PNGs and enlarged edge PNGs are in fidelity/.

Nominal like-for-like texture+mip chains: atlas10.67MiB vs original3.125MiB (~3.41x). Atlas retained bitmap adds8MiB; original canvas/backing/copies are unknown. No measured total-memory ratio or physical GPU claim.

## Reproduction, protection and exceptions

From repository root use the absolute Node24.21.0 executable C:/Users/Neil Skaria/AppData/Local/node24/node-v24.21.0-win-x64/node.exe. Offline audit: run audit.mjs, then finalize.mjs. This loads one trace at a time, does not inventory profiles, and writes only this directory. finalize.mjs normalizes null predecessor comparisons in the correspondence check; initial arithmetic treated missing predecessor as NaN, yielding two false comparison flags only. No trace or capture changed. edges.mjs processes existing two-state PNGs. fidelity.mjs is the reproducible two-state harness; it was run exactly once here. Do not run it again as part of this task.

identity-before/after and verification.json confirm tracked main/source, index, HEAD, branch, refs, dependency destinations and shared metadata unchanged. prior-files-before/after confirms earlier P/S evidence unchanged (profile trees deliberately not inventoried or accessed). Accepted91/94 source hashes are exact. built-output-verification.json revalidates all231 outputs against prior accepted pre-capture hashes; no builds ran. Its before basis is the prior inventory, not an invented audit-time snapshot. Own fixture browser pid32120 exited0, forced=false, and server closed. No other PIDs were stopped.

T3 preview_status and preview_open both explicitly returned no host; owned-CDP fallback was authorized. Initial directory creation failed sandbox access; narrow auto-review approved owned artifact creation and subsequent writes/execution. No refusal or bypass. No prior source/evidence writes. Workarounds and diagnostic corrections are disclosed here.

Supported phrasing: �In these ordered pairs, atlas has substantially lower recorded renderer-main task CPU; the contrast survives zero-to-wall fallback for anomalous/missing task counters and full original observer wall subtraction. Physical CPU counter semantics, startup neutrality, full-scene visual identity, physical presentation, total memory and general reliability remain unproven. Both CPU4 observer audits remain failed.� Root and next independent reviewer can assess the unchanged clean experimental preview using this evidence; this report does not deploy or approve a reliable fix.
