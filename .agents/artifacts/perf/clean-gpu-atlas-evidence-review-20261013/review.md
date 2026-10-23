**Provisional decision: the CPU1 pair supports a substantial reduction in recorded renderer-main task CPU. Keep the A4 audit failure.** I found no concrete visual blocker in the supplied fixtures. A clean experimental preview can advance only after the O4 comparison and bounded checks below. O4 was not reviewed here. This decision does not approve production, startup neutrality, or general reliability.

I used GPT-6 Astra with extra-high reasoning. I read AGENTS.md, .agents/models.md, the STE100 skill, and the complete [prior source review](../clean-gpu-atlas-source-review-20261013/review.md). That review approves source integration, not performance. I inspected scripts, small derived records, source excerpts, and ten fidelity images. I did not run browsers, builds, tests, project scripts, Git commands, or children. I did not load or process large traces. This review.md is my only artifact.

The evidence root below is [P](../clean-gpu-atlas-startup-state-profile-20261013/README.md). Data references use paths relative to P. I independently calculated differences from comparison.json and compared its windows with each analysis.json. I also recalculated sparse rAF gaps from result.json. This checks derivation and internal agreement. It does not independently reconstruct native task totals from raw traces.

**1. CPU1 result: supported, with a CPU-counter qualification.**

The following intervals reproduce the stored arithmetic. They are accounting ranges from the current analyzer, not confidence intervals.

- First text: O1 433.177–436.620 ms versus A1 256.160–257.767 ms. The endpoint reduction is 40.494–41.331%, or 175.410–180.460 ms.
- Replay text: O1 410.312–412.710 ms versus A1 248.905–250.241 ms. The endpoint reduction is 39.012–39.690%, or 160.071–163.805 ms.
- After whole marker-task exclusion, first-text reduction is 40.827–41.017%. Replay reduction is 39.305–39.460%.

References: [comparison.json](../clean-gpu-atlas-startup-state-profile-20261013/comparison.json), runs.{o1,a1}.text[0,1].{text,textExcludingBoundary}. The corresponding analysis.json fields match. The formula is 1 − Aupper/Olower through 1 − Alower/Oupper. “About 39–41% lower recorded renderer-main task CPU in this CPU1 pair” is supported. “39–41% faster,” “GPU cost fell 40%,” and “stutters resolved” are not supported.

[analyze.mjs](../clean-gpu-atlas-startup-state-profile-20261013/analyze.mjs), lines 5–10 and 15, uses one clock offset anchored to START-1. It checks residuals across recorded marks. Maximum residuals are 0.068 ms for O1 and 0.121 ms for A1. Each semantic marker has one containing native FireAnimationFrame. All four markers remain inside their selected callback under the corresponding maximum observed residual. The narrowest margin is O1 replay: 0.120 ms versus 0.068 ms residual. These residuals are observed checks, not a guarantee for every timestamp.

The 3150 ms windows start at those native callback starts:

- O1 first: 5704.082–8854.082 ms. A1 first: 5690.692–8840.692 ms.
- O1 replay: 17470.380–20620.380 ms. A1 replay: 17506.482–20656.482 ms.

Uniform submission and completed Canvas2D N-paint are semantic markers. Neither proves the first physical display of a glyph. The fixed windows also exclude earlier domain-text work. That work remains in prefix and full-activation records. They are not measurements of the entire boot animation.

The analyzer sums only renderer-main RunTask tdur for fully contained tasks. It assigns zero lower contribution and overlapping wall time as upper contribution for missing or clipped task durations. It does not sum nested FunctionCall durations or statistical samples as CPU. Text windows contain 52/51 missing-duration tasks in O1 and 72/62 in A1. Their uncertainty remains in the reported accounting ranges.

**New unresolved finding: one retained task violates the simple CPU-versus-wall invariant.** O1 analysis.json, text[0].text.largestTasks[3], records start 6603.510 ms, wall 4.958 ms, and threadCpu 6.761 ms. The 1.803 ms excess needs a native counter check. analyze.mjs:9 accepts finite tdur without checking this invariant. audit.mjs does not check task nesting or CPU-counter consistency.

This prevents approval of the intervals as strict bounds on physical CPU consumption. It does not establish that the substantial aggregate contrast is false. Removing this entire known task from O1's recorded lower total still leaves 168.649 ms against A1's upper total. Other tasks are absent from the five-largest-task summary, so this is a sensitivity example, not a complete correction. Summed task wall time also falls 40.580% first and 39.361% replay. Wall time corroborates lower measured service burden but is not interchangeable with CPU.

Whole marker-task exclusion is implemented correctly for the stated sensitivity check. analyze.mjs:15 advances the window start beyond the containing RunTask and callback, while retaining the original end. It removes application work too. The remaining windows are therefore slightly shorter and unequal, not clean replacements for matched 3150 ms windows. Removed overlaps are O1 2.327/1.571 ms and A1 1.445/1.204 ms. The much larger reduction survives this exclusion.

Recurring observer records within the text windows total O1 8.142/6.660 ms wall and A1 8.305/6.701 ms wall. Their native CPU totals are 7.496/5.968 and 7.759/6.152 ms. Even removing all recorded observer wall time from O1 alone leaves 167.268/153.411 ms against A1's upper totals. This conservative arithmetic does not bound indirect scheduler or tracing effects.

Marker provenance is adequate in the small evidence. [hook.js](../clean-gpu-atlas-startup-state-profile-20261013/hook.js):9–20 records actual startup scalar writes and invalidates that seed after BACK. Replay requires fresh returning=0 and powered=1 writes. The module defaults, scalar caching, and engine control flow agree with this approach. I checked the four source hashes in startup-source-correspondence.json. I also checked both fidelity module hashes and the shared hook hash, 9b6d1d7ec5862986948d84d4b29811e5ae1584fb5cf15bc0a46c1522f6efdd55.

Use startup-source-correspondence.json and current run records for marker approval. The observed block in marker-source-correspondence.json describes an earlier failed first marker with returning=null. It must not enter the current comparison.

Sparse rAF cadence is comparable: each CPU1 text window has 188 gaps, about 16.666 ms mean, and no gap at least 25 ms. Native app callback aggregates contain multiple loops. Their approximately 8.33 ms means are not screen cadence. Virtual presentation shows three/one O1 gaps near 33.332 ms and none in A1. Those few headless intervals do not establish physical FPS or reliable stutter improvement.

**2. A4: preserve the strict failure, but do not discard every measurement.**

[audit.mjs](../clean-gpu-atlas-startup-state-profile-20261013/audit.mjs):6–7 requires every recurring observer bucket within both text windows to remain below 1 ms. A4 fails that requirement. Its other recorded checks pass. Keep audit.pass=false and checks.observerBound=false. Any subsequent CPU4 comparison is explicitly flagged and uses a separate sensitivity analysis.

The failing externalTimingRAF starts at 7374.232 ms. Its native wall duration is 1.011 ms and native thread CPU is 0.233 ms. The 0.778 ms difference does not identify its cause. Throttling, scheduling, blocking, and counter behavior can contribute. Do not attribute the difference to the GPU or harmless scheduling without evidence.

The excess is 0.011 ms, or 1.1% of the limit. The whole callback is 6.066% of one nominal 16.666 ms frame and 0.03210% of the 3150 ms window. The excess alone is 0.0660% of a frame and 0.000349% of the window. These fractions explain scale. They do not excuse the failure or prove no frame impact. A small event can cross a presentation deadline.

Native durations retain microsecond numerical units. Their displayed precision does not prove microsecond measurement accuracy. The 0.101 ms page/native clock residual does not erase this breach: a constant offset cancels in a native event duration. Page timer quantization is not a reason to round 1.011 down to a pass.

The callback lies inside A4's largest first-text RunTask: 7373.584–7388.805 ms, wall 15.221 ms, thread CPU 3.802 ms. These records permit whole-event sensitivity bounds without estimating observer-only cost. Retain the raw result. Bound the entire callback, then the entire containing task, including application work. The containing task consumes most of one frame budget, so inspect adjacent cadence before making a stutter claim.

“Only one” applies to the text windows. A4 observerNativeRecords also contains startup rAF events of 7.859 and 22.734 ms. Prefix events reach 1.422 and 1.599 ms. The audit gate does not test those phases. Startup observer FunctionCall wall totals 54.841 ms, with 11.886 ms recorded thread CPU. Do not transfer the text-only overhead claim to startup or the full activation.

Thus, the 0.011 ms breach alone does not make every A4 field scientifically unusable. It prevents an unqualified pass under the original protocol. A flagged paired comparison can support a preview decision if conservative bounds preserve the decision. That analysis must precede the decision and remain separate from the failed gate.

**3. Minimum requirements for the O4 decision.**

The authorized fourth capture can complete the planned comparison. No broad matrix, runtime change, or automatic replacement capture is required.

1. Check exact original source/build identity, the same hook, actual CPU4 throttle success, and the warmed O1 disk profile. Check fresh renderer, matching flags, viewport, delivery, and trace categories. Preserve actual cache results and run order.
2. Require valid clocks, trusted START after real introend, complete START/site/BACK/replay flow, verified markers, restoration, and complete trace EOF without loss. Distinguish result.valid from audit.pass. Preserve every observer failure and excluded run.
3. Compare first text and replay separately at identical semantic boundaries and fixed lengths. Retain prefix, startup, fade/handoff, return, and full activation. Do not treat replay or individual frames as independent session replicates.
4. Show raw CPU accounting ranges and whole marker-task exclusion. Resolve or conservatively bound the CPU-counter anomaly described above. For recurring observer sensitivity, subtract the full original observer wall budget from O4's lower total and leave A4's upper total intact. A positive margin supports a CPU benefit that survives this bound on recorded observer events. It does not remove indirect observer effects.
5. Show the whole A4 outlier callback and containing-task sensitivity. Apply equivalent rules to O4 outliers. Retain raw cadence, adjacent gaps, and any removed spans. Do not create smooth cadence by deleting a slow interval and joining its neighbors.
6. Compare startup and every interaction phase with phase-specific observer bounds. A material adverse change that exceeds those bounds remains an objection, even if text CPU improves. Ambiguous results require an inconclusive decision, not an invented threshold or another matrix.

O4 need not make A4 retrospectively pass. A separately labeled, bounded result may justify the clean experimental preview. CPU4 startup is a warm-profile comparison. It cannot establish cold-start neutrality. O1/A1 cold order and A4/O4 warm order are not counterbalanced. CPU level, cache history, session order, OS activity, and driver caches remain confounded. One pair cannot establish population reliability.

**4. Fidelity: disclosed rasterization difference, no observed fixture blocker.**

I inspected arrival, overlap, settled, glint, fade, corrected off, and solid-return comparison images. I also inspected arrival-clip.png, settled-edge.png, and glint-domain.png. [fidelity.mjs](../clean-gpu-atlas-startup-state-profile-20261013/fidelity.mjs):8–12 defines original/atlas/x4-difference order. edge-detail.mjs defines the enlarged crops.

The flying letters clip at corresponding outer edges. Letter order and overlap remain corresponding. I saw no missing glyph, new seam, or additional large clipped region. The domain glint remains in the corresponding location. Enlarged edges show visibly different coverage and softness, particularly on the N/E boundaries. This is a real appearance difference.

Settled thresholded bounds differ by one pixel: O [62,193,903,493], A [62,192,902,493]. Active-state maximum channel differences are 183–250. Whole-image means of 0.231–0.476/255 dilute edge differences over large flat regions. They cannot establish visual identity. Fade has maximum difference 139 and mean 0.276/255. Corrected off and solid-return records have zero changed pixels, consistent with the inspected images.

The first off reference used black and is excluded. Only fidelity-off-correction/results.json supports exact off agreement. The failed first contact-sheet attempt is also excluded.

The fixture uses 960×640 orthographic output and fixed source times. It compares direct Canvas2D output with atlas WebGL output. It does not reproduce both materials on the app's moving screen. It also supplies #f8faf8 as endColor, whereas the accepted source review identifies the actual caller's #f6f1e7. Fade similarity and exact solid-return agreement therefore apply only to the tested fixture parameters. Full-scene filtering, motion, camera, and all actual-background behavior remain untested.

I found no concrete visual reason to block an experimental preview on these images. Disclose the antialiasing change and limited fixture scope. The user's report of consistent atlas text supports that limited decision. It does not convert fixture similarity into full-scene identity.

**5. Removed work, remaining risk, and the lean next decision.**

Source inspection supports removal of repeated boot Canvas2D painting, font measurement, glyph rasterization requests, and boot-texture update requests. Original engine.ts:1373–1374 calls drawBootScreen and sets needsUpdate each active frame. Original boot-screen.ts:48–95 measures and paints glyphs. Atlas engine.ts:1407–1411 prepares uniforms before rendering. Atlas boot-atlas.ts:90–103 assigns one initial texture update.

The previously accepted exact-source preflight establishes one initial upload with mipmap generation and no recurring boot uploads. I did not recollect or independently reconstruct that evidence. The current comparison supports lower recorded renderer-main work. It does not allocate the saving exclusively among JavaScript, canvas rasterization, upload submission, synchronization, driver work, or GPU execution.

Native link/query/wait service durations overlap. They must not be added as independent causes or GPU execution time. Both CPU1 startups contain 20 DoLinkProgram spans. That count does not explain the longest startup tasks. Actual GPU time, bandwidth, VRAM allocation, and reclamation remain unmeasured.

Cold navigation-to-real-introend is O1 2287.8 ms versus A1 2257.6 ms. The 30.2 ms difference does not establish startup neutrality or an improvement. Atlas's longest startup task is 149.176 ms versus original 142.840 ms. This pair does not reproduce the earlier confounded +585/+735 ms warning, but it cannot dismiss startup risk across devices.

The supplied nominal totals are 18.67 MiB for atlas and 3.125 MiB for original, but their component scopes differ. Atlas metrics specify 2048×1024. RGBA storage is 8 MiB for the retained bitmap plus about 10.67 MiB for texture and mipmaps. The original 960×640 texture with mipmaps is about 3.125 MiB, before canvas backing and other copies. Comparable nominal texture chains therefore increase about 3.41 times. Do not describe the mixed totals as a measured 5.97-times total-memory increase. Actual VRAM, backing allocation, shared storage, and reclamation remain unknown. Shader sampling and the required atlas load can shift work to startup or the GPU.

**Lean next decision:** retain the accepted runtime bytes. Evaluate the one authorized O4 counterpart with the preserved A4 flag and bounded checks. If the comparison remains favorable and no phase shows an unexplained material regression, advance only the clean experimental preview. If those conditions fail, report the specific unresolved comparison. Do not approve production or general reliability. Safari, missed clicks, and unrelated interactions remain deferred.

**Minimal native audit after the capture lane is released.**

No raw trace access occurred during this review. The following extraction is sufficient for the new CPU-counter objection and the A4 outlier. No recapture is requested.

- O1 pid 1428/tid 24824: retain RunTask, its parent context, ts/dur/tts/tdur, and child timing records for 6603.410–6608.568 page ms. This covers the 4.958 ms task with 6.761 ms thread CPU.
- For the four CPU1 text intervals listed above, extract only renderer-main RunTask ts/dur/tts/tdur and boundary intersections. Check duplicates, nesting, overlap, nonnegative values, and every tdur greater than dur. Report counts and aggregate excess, plus conservative sensitivity. Use A1 pid 14360/tid 4740.
- A4 pid 22464/tid 3912: retain the 7373.584–7388.805 ms task and its observer callback. Include the preceding and following application callbacks and virtual-presentation records, restricted initially to 7350–7410 page ms.
- For CPU4, use the same compact task-invariant check on the existing A4 and completed O4 text windows. A4 windows are 7323.730–10473.730 and 19173.412–22323.412 page ms. Derive O4 boundaries from its accepted marker records.
- Reconstruct native timestamps with each analysis.json clock.offset. Preserve the native event identities and phase-specific clock residuals. If available events cannot resolve a discrepancy, retain that uncertainty instead of assigning a cause.